import sys
import os
import io
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

# Ensure UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, BASE_DIR)

from backend.main import app
from backend.db.session import SessionLocal
from backend.core.security import create_access_token
from backend.models.user import User, StudentProfile, RoleEnum
from backend.models.academic import (
    Course,
    Assignment,
    Notice,
    ExaminationSchedule,
    ClassificationScope,
    DataOrigin,
    VerificationStatus
)

client = TestClient(app)

def run_phase4_tests():
    print("======================================================================")
    print("  CAMPUSSYNC PHASE 4 INTEGRATION TESTS: STUDENT DASHBOARD & APIS")
    print("======================================================================")
    
    db = SessionLocal()
    tests_passed = 0
    total_tests = 8

    try:
        # Fixture Setup: Ensure test accounts for Sem 3 CSE, Sem 7 CSE, and empty Sem 1 EE
        u_sem3 = db.query(User).filter(User.email == "test_sem3_cse@ecajmer.ac.in").first()
        if not u_sem3:
            u_sem3 = User(email="test_sem3_cse@ecajmer.ac.in", full_name="Sem3 CSE Test", role=RoleEnum.student)
            db.add(u_sem3)
            db.commit()
            db.refresh(u_sem3)
            prof = StudentProfile(user_id=u_sem3.id, student_id="24ECA003", department="CSE", semester=3, enrollment_year=2024)
            db.add(prof)
            db.commit()

        u_sem7 = db.query(User).filter(User.email == "test_sem7_cse@ecajmer.ac.in").first()
        if not u_sem7:
            u_sem7 = User(email="test_sem7_cse@ecajmer.ac.in", full_name="Sem7 CSE Test", role=RoleEnum.student)
            db.add(u_sem7)
            db.commit()
            db.refresh(u_sem7)
            prof = StudentProfile(user_id=u_sem7.id, student_id="21ECA007", department="CSE", semester=7, enrollment_year=2021)
            db.add(prof)
            db.commit()

        u_empty_ee = db.query(User).filter(User.email == "test_sem1_ee_empty@ecajmer.ac.in").first()
        if not u_empty_ee:
            u_empty_ee = User(email="test_sem1_ee_empty@ecajmer.ac.in", full_name="Sem1 EE Empty", role=RoleEnum.student)
            db.add(u_empty_ee)
            db.commit()
            db.refresh(u_empty_ee)
            prof = StudentProfile(user_id=u_empty_ee.id, student_id="26ECA999", department="Electrical Engineering", semester=1, enrollment_year=2026)
            db.add(prof)
            db.commit()

        token_sem3 = create_access_token(subject=u_sem3.email)
        headers_sem3 = {"Authorization": f"Bearer {token_sem3}"}

        token_sem7 = create_access_token(subject=u_sem7.email)
        headers_sem7 = {"Authorization": f"Bearer {token_sem7}"}

        token_empty_ee = create_access_token(subject=u_empty_ee.email)
        headers_empty_ee = {"Authorization": f"Bearer {token_empty_ee}"}

        # ------------------------------------------------------------------
        # TEST 1: GET /api/v1/dashboard/summary Schema Contract
        # ------------------------------------------------------------------
        print("\n[TEST 1] GET /api/v1/dashboard/summary Response Schema Contract")
        res1 = client.get("/api/v1/dashboard/summary", headers=headers_sem3)
        assert res1.status_code == 200, f"Expected 200, got {res1.status_code}: {res1.text}"
        data1 = res1.json()
        assert "student" in data1, "Missing 'student' key in summary"
        assert "summary" in data1, "Missing 'summary' key in summary"
        assert "courses_summary" in data1, "Missing 'courses_summary' key in summary"
        assert "notices_summary" in data1, "Missing 'notices_summary' key in summary"
        assert "upcoming_milestones" in data1, "Missing 'upcoming_milestones' key in summary"
        assert data1["student"]["semester"] == 3
        assert data1["student"]["department"] == "CSE"
        print(f"  [OK] Summary schema contains all required sections for Semester 3 student.")
        tests_passed += 1

        # ------------------------------------------------------------------
        # TEST 2: Cohort Isolation in Dashboard Summary for Sem 3 vs Sem 7
        # ------------------------------------------------------------------
        print("\n[TEST 2] Dashboard Summary Cohort Isolation (Sem 3 vs Sem 7)")
        res2_sem3 = client.get("/api/v1/dashboard/summary", headers=headers_sem3).json()
        res2_sem7 = client.get("/api/v1/dashboard/summary", headers=headers_sem7).json()
        
        # Verify Sem 3 student does not see Sem 7 milestones
        sem3_exams = res2_sem3["upcoming_milestones"]["examinations"]
        for ex in sem3_exams:
            assert "7CS" not in ex["course_code"], f"Leakage: Sem 3 student received Sem 7 exam: {ex}"
        
        # Verify Sem 7 student does not see Sem 3 milestones
        sem7_exams = res2_sem7["upcoming_milestones"]["examinations"]
        for ex in sem7_exams:
            assert "3CS" not in ex["course_code"], f"Leakage: Sem 7 student received Sem 3 exam: {ex}"
        
        print(f"  [OK] Sem 3 summary exams: {len(sem3_exams)}, Sem 7 summary exams: {len(sem7_exams)} - completely isolated.")
        tests_passed += 1

        # ------------------------------------------------------------------
        # TEST 3: GET /api/v1/courses/ Schema & Strict Semester Filtering
        # ------------------------------------------------------------------
        print("\n[TEST 3] GET /api/v1/courses/ Schema & Cohort Isolation")
        res3 = client.get("/api/v1/courses/", headers=headers_sem3)
        assert res3.status_code == 200, f"Expected 200, got {res3.status_code}"
        courses3 = res3.json()
        assert isinstance(courses3, list), "Expected list of courses"
        assert len(courses3) > 0, "Expected at least 1 course for Sem 3 CSE"
        for c in courses3:
            assert "id" in c and "code" in c and "title" in c
            assert "department" in c and "semester" in c and "credits" in c
            assert "data_origin" in c
            assert c["semester"] == 3, f"Course {c['code']} semester {c['semester']} does not match student sem 3"
        print(f"  [OK] Sem 3 student received {len(courses3)} courses, all strictly semester 3.")
        tests_passed += 1

        # ------------------------------------------------------------------
        # TEST 4: GET /api/v1/notices/ Excludes Other Semesters & Unverified
        # ------------------------------------------------------------------
        print("\n[TEST 4] GET /api/v1/notices/ Scope Filtering & Provenance Verification")
        res4 = client.get("/api/v1/notices/", headers=headers_sem3)
        assert res4.status_code == 200, f"Expected 200, got {res4.status_code}"
        notices3 = res4.json()
        assert isinstance(notices3, list), "Expected list of notices"
        for n in notices3:
            assert "id" in n and "title" in n and "classification_scope" in n
            assert "verification_status" in n and "data_origin" in n
            # Verification check: only VERIFIED notices should be present
            assert n["verification_status"] == "VERIFIED", f"Notice {n['id']} is not VERIFIED: {n['verification_status']}"
            # Semester check: no Sem 7 specific notices
            if n["classification_scope"] == "SEMESTER_SPECIFIC":
                assert n["semester"] == 3, f"Notice {n['id']} has semester {n['semester']}, expected 3"
        print(f"  [OK] Sem 3 student received {len(notices3)} verified notices. Unverified/Sem 7 excluded.")
        tests_passed += 1

        # ------------------------------------------------------------------
        # TEST 5: GET /api/v1/examinations/ Cohort Isolation & Schema
        # ------------------------------------------------------------------
        print("\n[TEST 5] GET /api/v1/examinations/ Schema & Cohort Isolation")
        res5 = client.get("/api/v1/examinations/", headers=headers_sem3)
        assert res5.status_code == 200, f"Expected 200, got {res5.status_code}"
        exams3 = res5.json()
        assert isinstance(exams3, list), "Expected list of examinations"
        for ex in exams3:
            assert "id" in ex and "course_name" in ex and "exam_date" in ex
            assert "verification_status" in ex and "data_origin" in ex
            assert ex["verification_status"] == "VERIFIED"
            assert ex["semester"] == 3, f"Exam {ex['course_code']} has semester {ex['semester']}, expected 3"
        print(f"  [OK] Sem 3 student received {len(exams3)} exams, all verified and semester 3.")
        tests_passed += 1

        # ------------------------------------------------------------------
        # TEST 6: Empty State Handling for EE Sem 1 Student
        # ------------------------------------------------------------------
        print("\n[TEST 6] Empty State Handling (Sem 1 EE Student with No Scheduled Courses/Exams)")
        # Courses should return [] with 200
        res6_courses = client.get("/api/v1/courses/", headers=headers_empty_ee)
        assert res6_courses.status_code == 200
        assert res6_courses.json() == [], f"Expected empty courses list, got {res6_courses.json()}"
        
        # Examinations should return [] with 200
        res6_exams = client.get("/api/v1/examinations/", headers=headers_empty_ee)
        assert res6_exams.status_code == 200
        assert res6_exams.json() == [], f"Expected empty exams list, got {res6_exams.json()}"

        # Dashboard summary should have 0 counts, not crash or inject demo courses
        res6_summary = client.get("/api/v1/dashboard/summary", headers=headers_empty_ee)
        assert res6_summary.status_code == 200
        summary_ee = res6_summary.json()
        assert summary_ee["summary"]["total_courses"] == 0
        assert summary_ee["summary"]["total_credits"] == 0
        assert summary_ee["summary"]["upcoming_exams"] == 0
        print(f"  [OK] Empty state returned clean HTTP 200 with zero items. No fallback demo injection.")
        tests_passed += 1

        # ------------------------------------------------------------------
        # TEST 7: Frontend Dist Build Verification (Zero Default Mock Constants)
        # ------------------------------------------------------------------
        print("\n[TEST 7] Frontend Build Output Verification")
        dist_index = os.path.join(BASE_DIR, "dist", "index.html")
        assert os.path.exists(dist_index), "dist/index.html does not exist! Run npm run build."
        
        # Check source file StudentDashboard.jsx for mock constants
        src_dashboard = os.path.join(BASE_DIR, "src", "components", "portal", "StudentDashboard.jsx")
        with open(src_dashboard, "r", encoding="utf-8") as f:
            src_content = f.read()
        assert "DEFAULT_COURSES" not in src_content, "DEFAULT_COURSES still found in StudentDashboard.jsx"
        assert "DEFAULT_NOTICES" not in src_content, "DEFAULT_NOTICES still found in StudentDashboard.jsx"
        assert "DEFAULT_NOTIFICATIONS" not in src_content, "DEFAULT_NOTIFICATIONS still found in StudentDashboard.jsx"
        assert "CGPA: 8.65" not in src_content, "Hardcoded fake CGPA still found in StudentDashboard.jsx"
        print(f"  [OK] StudentDashboard.jsx verified: zero mock constants and zero hardcoded CGPA.")
        tests_passed += 1

        # ------------------------------------------------------------------
        # TEST 8: Data Origin & Official Document Links Provenance
        # ------------------------------------------------------------------
        print("\n[TEST 8] Data Origin and Document URLs Provenance")
        # Sem 7 CSE student
        res8_notices = client.get("/api/v1/notices/", headers=headers_sem7).json()
        official_count = 0
        for n in res8_notices:
            if n.get("data_origin") == "VERIFIED_OFFICIAL":
                official_count += 1
                assert n.get("document_url") or n.get("source_url"), f"Official notice {n['id']} lacks URL link"
        print(f"  [OK] Found {official_count} official verified notices with valid document/source links.")
        tests_passed += 1

    finally:
        db.close()

    print("\n----------------------------------------------------------------------")
    print(f"  PHASE 4 TEST SUMMARY: {tests_passed}/{total_tests} SCENARIOS PASSED")
    print("----------------------------------------------------------------------\n")
    assert tests_passed == total_tests

if __name__ == "__main__":
    run_phase4_tests()
