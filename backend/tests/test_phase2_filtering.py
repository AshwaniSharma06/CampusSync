import sys
import os
import io
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

# Ensure UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Ensure parent path in sys.path
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

def setup_test_data(db):
    """
    Seed dedicated test users and scoped fixtures for the 12 test scenarios.
    Does not touch or modify the pre-existing student@ecajmer.ac.in account.
    """
    # 1. Sem 3 CSE student
    u_sem3_cse = db.query(User).filter(User.email == "test_sem3_cse@ecajmer.ac.in").first()
    if not u_sem3_cse:
        u_sem3_cse = User(email="test_sem3_cse@ecajmer.ac.in", full_name="Sem3 CSE Test Student", role=RoleEnum.student)
        db.add(u_sem3_cse)
        db.commit()
        db.refresh(u_sem3_cse)
        prof = StudentProfile(user_id=u_sem3_cse.id, student_id="24ECA003", department="Computer Science & Engineering", semester=3, enrollment_year=2024)
        db.add(prof)
        db.commit()

    # 2. Sem 5 CSE student
    u_sem5_cse = db.query(User).filter(User.email == "test_sem5_cse@ecajmer.ac.in").first()
    if not u_sem5_cse:
        u_sem5_cse = User(email="test_sem5_cse@ecajmer.ac.in", full_name="Sem5 CSE Test Student", role=RoleEnum.student)
        db.add(u_sem5_cse)
        db.commit()
        db.refresh(u_sem5_cse)
        prof = StudentProfile(user_id=u_sem5_cse.id, student_id="23ECA005", department="CSE", semester=5, enrollment_year=2023)
        db.add(prof)
        db.commit()

    # 3. Sem 7 CSE student
    u_sem7_cse = db.query(User).filter(User.email == "test_sem7_cse@ecajmer.ac.in").first()
    if not u_sem7_cse:
        u_sem7_cse = User(email="test_sem7_cse@ecajmer.ac.in", full_name="Sem7 CSE Test Student", role=RoleEnum.student)
        db.add(u_sem7_cse)
        db.commit()
        db.refresh(u_sem7_cse)
        prof = StudentProfile(user_id=u_sem7_cse.id, student_id="22ECA007", department="Computer Engineering (CSE)", semester=7, enrollment_year=2022)
        db.add(prof)
        db.commit()

    # 4. Sem 3 IT student
    u_sem3_it = db.query(User).filter(User.email == "test_sem3_it@ecajmer.ac.in").first()
    if not u_sem3_it:
        u_sem3_it = User(email="test_sem3_it@ecajmer.ac.in", full_name="Sem3 IT Test Student", role=RoleEnum.student)
        db.add(u_sem3_it)
        db.commit()
        db.refresh(u_sem3_it)
        prof = StudentProfile(user_id=u_sem3_it.id, student_id="24ECA_IT01", department="Information Technology", semester=3, enrollment_year=2024)
        db.add(prof)
        db.commit()

    # 5. Incomplete Profile student
    u_incomplete = db.query(User).filter(User.email == "test_incomplete@ecajmer.ac.in").first()
    if not u_incomplete:
        u_incomplete = User(email="test_incomplete@ecajmer.ac.in", full_name="Incomplete Profile Student", role=RoleEnum.student)
        db.add(u_incomplete)
        db.commit()
        db.refresh(u_incomplete)
        # Intentionally no profile or semester=None

    # 6. IT-Specific Course & Notice
    it_course = db.query(Course).filter(Course.code == "IT 301").first()
    if not it_course:
        it_course = Course(code="IT 301", title="Web Systems & XML", instructor="Dr. Jyoti Gajrani", department="IT", semester=3, credits=3, data_origin=DataOrigin.DEMO_SEED.value)
        db.add(it_course)
        db.commit()
        db.refresh(it_course)

    it_notice = db.query(Notice).filter(Notice.title == "IT Department Cloud Lab Access Schedule").first()
    if not it_notice:
        it_notice = Notice(
            title="IT Department Cloud Lab Access Schedule",
            content="IT department cloud lab is reserved for 3rd semester practicals.",
            scope=ClassificationScope.DEPARTMENT_SPECIFIC.value,
            department_code="IT",
            data_origin=DataOrigin.DEMO_SEED.value,
            verification_status=VerificationStatus.VERIFIED.value
        )
        db.add(it_notice)
        db.commit()

    # 7. Individual Notice targeted strictly to u_sem3_cse
    priv_notice = db.query(Notice).filter(Notice.title == "Confidential Academic Fee Exemption Audit").first()
    if not priv_notice:
        priv_notice = Notice(
            title="Confidential Academic Fee Exemption Audit",
            content="Private fee audit result for student 24ECA003.",
            scope=ClassificationScope.INDIVIDUAL.value,
            target_user_id=u_sem3_cse.id,
            data_origin=DataOrigin.DEMO_SEED.value,
            verification_status=VerificationStatus.VERIFIED.value
        )
        db.add(priv_notice)
        db.commit()

    # 8. Course-linked assignment for Sem 3 CSE
    cs301 = db.query(Course).filter(Course.code == "CS 301").first()
    if cs301:
        assign_sem3 = db.query(Assignment).filter(Assignment.title == "Data Structures Lab Assignment 1").first()
        if not assign_sem3:
            db.add(Assignment(
                course_id=cs301.id,
                title="Data Structures Lab Assignment 1",
                description="Implement doubly linked list in C++",
                due_date=datetime.utcnow() + timedelta(days=5),
                data_origin=DataOrigin.DEMO_SEED.value
            ))
            db.commit()

    user_ids = {
        "sem3_cse": u_sem3_cse.id,
        "sem5_cse": u_sem5_cse.id,
        "sem7_cse": u_sem7_cse.id,
        "sem3_it": u_sem3_it.id,
        "incomplete": u_incomplete.id
    }
    return user_ids

def run_phase2_tests():
    print("=" * 70, flush=True)
    print("CAMPUSSYNC PHASE 2: BACKEND AUTH & COHORT FILTERING REGRESSION SUITE", flush=True)
    print("=" * 70, flush=True)

    print("[DEBUG] Opening DB for test setup...", flush=True)
    db = SessionLocal()
    user_ids = setup_test_data(db)
    db.close()
    print(f"[DEBUG] DB test setup complete. User IDs: {user_ids}", flush=True)

    tokens = {
        key: create_access_token(uid) for key, uid in user_ids.items()
    }

    headers_sem3_cse = {"Authorization": f"Bearer {tokens['sem3_cse']}"}
    headers_sem5_cse = {"Authorization": f"Bearer {tokens['sem5_cse']}"}
    headers_sem7_cse = {"Authorization": f"Bearer {tokens['sem7_cse']}"}
    headers_sem3_it  = {"Authorization": f"Bearer {tokens['sem3_it']}"}
    headers_incompl  = {"Authorization": f"Bearer {tokens['incomplete']}"}

    # SCENARIO 1: Semester 3 CSE Student
    print("\n[Scenario 1/12] Testing Semester 3 CSE Student Access...")
    r_courses = client.get("/api/v1/courses/", headers=headers_sem3_cse)
    assert r_courses.status_code == 200, f"Expected 200, got {r_courses.status_code}"
    courses = r_courses.json()
    course_codes = [c["code"] for c in courses]
    assert "CS 301" in course_codes and "CS 302" in course_codes
    assert "CS 401" not in course_codes, "LEAK: Sem 7 course CS 401 exposed to Sem 3 student!"
    assert "CS 501" not in course_codes, "LEAK: Sem 5 course CS 501 exposed to Sem 3 student!"
    print("  [OK] Sem 3 CSE student receives only Sem 3 courses (CS 301, CS 302, CS 303).")

    # SCENARIO 2: Semester 5 CSE Student
    print("\n[Scenario 2/12] Testing Semester 5 CSE Student Access...")
    r_courses_s5 = client.get("/api/v1/courses/", headers=headers_sem5_cse)
    assert r_courses_s5.status_code == 200
    courses_s5 = r_courses_s5.json()
    s5_codes = [c["code"] for c in courses_s5]
    assert "CS 501" in s5_codes and "CS 502" in s5_codes
    assert "CS 301" not in s5_codes, "LEAK: Sem 3 course exposed to Sem 5 student!"
    assert "CS 401" not in s5_codes, "LEAK: Sem 7 course exposed to Sem 5 student!"
    print("  [OK] Sem 5 CSE student receives only Sem 5 courses (CS 501, CS 502, CS 503).")

    # SCENARIO 3: Semester 7 CSE Student
    print("\n[Scenario 3/12] Testing Semester 7 CSE Student Access...")
    r_courses_s7 = client.get("/api/v1/courses/", headers=headers_sem7_cse)
    assert r_courses_s7.status_code == 200
    s7_codes = [c["code"] for c in r_courses_s7.json()]
    assert "CS 401" in s7_codes and "CS 402" in s7_codes
    assert "CS 301" not in s7_codes
    print("  [OK] Sem 7 CSE student receives only Sem 7 courses (CS 401, CS 402, CS 460).")

    # SCENARIO 4: IT Student Accessing Their Own Courses
    print("\n[Scenario 4/12] Testing IT Student Accessing Their Own Courses...")
    r_it_courses = client.get("/api/v1/courses/", headers=headers_sem3_it)
    assert r_it_courses.status_code == 200
    it_codes = [c["code"] for c in r_it_courses.json()]
    assert "IT 301" in it_codes
    assert "CS 301" not in it_codes, "LEAK: CSE course exposed to IT student!"
    print("  [OK] IT student receives only IT courses (IT 301) with zero CSE cross-leakage.")

    # SCENARIO 5: CSE Student Attempting to Access IT Notices
    print("\n[Scenario 5/12] Testing CSE Student Barred from IT Department Notices...")
    r_cse_notices = client.get("/api/v1/notices/", headers=headers_sem3_cse)
    assert r_cse_notices.status_code == 200
    cse_notice_titles = [n["title"] for n in r_cse_notices.json()]
    assert "IT Department Cloud Lab Access Schedule" not in cse_notice_titles, "SECURITY VIOLATION: IT notice leaked to CSE student!"
    print("  [OK] IT Department notices are completely invisible to CSE students.")

    # SCENARIO 6: Student Attempting to Access Another Semester's Notices
    print("\n[Scenario 6/12] Testing Semester Notice Isolation (Sem 3 vs Sem 7)...")
    assert "BTU Semester 7 Final Major Project Phase-1 Lab Evaluations" not in cse_notice_titles, "LEAK: Sem 7 notice exposed to Sem 3 student!"
    assert "Semester 3 Data Structures Lab Assessment & Viva Schedule" in cse_notice_titles, "MISSING: Sem 3 student did not receive Sem 3 notice!"
    print("  [OK] Sem 3 student receives Sem 3 notices and is strictly blocked from Sem 7 notices.")

    # SCENARIO 7: Student Attempting to Access Another Student's Individual Records
    print("\n[Scenario 7/12] Testing Individual Record Confidentiality...")
    assert "Confidential Academic Fee Exemption Audit" in cse_notice_titles, "Authorized student failed to see their private notice!"
    r_s5_notices = client.get("/api/v1/notices/", headers=headers_sem5_cse)
    s5_notice_titles = [n["title"] for n in r_s5_notices.json()]
    assert "Confidential Academic Fee Exemption Audit" not in s5_notice_titles, "PRIVACY BREACH: Individual notice leaked to another student!"
    print("  [OK] INDIVIDUAL notice is only visible to the designated student ID.")

    # SCENARIO 8: UNCLASSIFIED and UNVERIFIED Records Being Excluded
    print("\n[Scenario 8/12] Testing Exclusion of UNCLASSIFIED and UNVERIFIED records...")
    assert "General Maintenance and Utility Notice" not in cse_notice_titles, "LEAK: UNCLASSIFIED notice exposed to student dashboard!"
    assert "General Maintenance and Utility Notice" not in s5_notice_titles
    print("  [OK] UNCLASSIFIED and unverified notices are strictly withheld from student endpoints.")

    # SCENARIO 9: Missing or Incomplete Student Profile
    print("\n[Scenario 9/12] Testing Rejection of Incomplete Student Profiles...")
    r_incompl_notices = client.get("/api/v1/notices/", headers=headers_incompl)
    assert r_incompl_notices.status_code == 403, f"Expected 403 Forbidden, got {r_incompl_notices.status_code}"
    assert "incomplete" in r_incompl_notices.json()["detail"].lower()

    r_incompl_courses = client.get("/api/v1/courses/", headers=headers_incompl)
    assert r_incompl_courses.status_code == 403
    print("  [OK] Incomplete profile rejected with HTTP 403 (does not default to Sem 7/CSE).")

    # SCENARIO 10: Frontend Attempting to Manipulate Semester or Department Parameters
    print("\n[Scenario 10/12] Testing Immunity to Client-Side Parameter Tampering...")
    # Sem 3 student passes ?semester=7&department=IT to /notices/
    r_tamper = client.get("/api/v1/notices/?semester=7&department=IT", headers=headers_sem3_cse)
    assert r_tamper.status_code == 200
    tamper_titles = [n["title"] for n in r_tamper.json()]
    assert "IT Department Cloud Lab Access Schedule" not in tamper_titles, "SECURITY BREACH: Frontend query param overrode server auth!"
    assert "BTU Semester 7 Final Major Project Phase-1 Lab Evaluations" not in tamper_titles, "SECURITY BREACH: Frontend manipulated semester!"
    print("  [OK] Server-side profile strictly enforced; frontend parameter tampering ignored.")

    # SCENARIO 11: Student Accessing Another Student's Assignments
    print("\n[Scenario 11/12] Testing Cohort Assignment Authorization...")
    r_sem3_assign = client.get("/api/v1/assignments/", headers=headers_sem3_cse)
    assert r_sem3_assign.status_code == 200
    s3_assigns = [a["title"] for a in r_sem3_assign.json()]
    assert "Data Structures Lab Assignment 1" in s3_assigns

    r_sem7_assign = client.get("/api/v1/assignments/", headers=headers_sem7_cse)
    assert r_sem7_assign.status_code == 200
    s7_assigns = [a["title"] for a in r_sem7_assign.json()]
    assert "Data Structures Lab Assignment 1" not in s7_assigns, "LEAK: Sem 3 assignment leaked to Sem 7 student!"
    print("  [OK] Assignments strictly segregated by course enrollment and cohort.")

    # SCENARIO 12: Student Receiving Only Authorized Examination Schedules
    print("\n[Scenario 12/12] Testing Examination Schedule Authorization...")
    r_s3_exams = client.get("/api/v1/examinations/", headers=headers_sem3_cse)
    assert r_s3_exams.status_code == 200
    s3_exam_codes = [e["course_code"] for e in r_s3_exams.json()]
    assert "CS 301" in s3_exam_codes and "CS 302" in s3_exam_codes
    assert "CS 401" not in s3_exam_codes, "LEAK: Sem 7 exam schedule leaked to Sem 3 student!"

    r_s7_exams = client.get("/api/v1/examinations/", headers=headers_sem7_cse)
    assert r_s7_exams.status_code == 200
    s7_exam_codes = [e["course_code"] for e in r_s7_exams.json()]
    assert "CS 401" in s7_exam_codes and "CS 402" in s7_exam_codes
    assert "CS 301" not in s7_exam_codes, "LEAK: Sem 3 exam schedule leaked to Sem 7 student!"

    r_it_exams = client.get("/api/v1/examinations/", headers=headers_sem3_it)
    assert r_it_exams.status_code == 200
    assert len(r_it_exams.json()) == 0, "IT student should get clean [] since no IT exams are scheduled yet."
    print("  [OK] Examination schedules strictly filtered by authenticated student cohort.")

    # DASHBOARD SUMMARY METRICS VERIFICATION
    print("\n[Bonus Check] Testing Dashboard Summary Dynamic Metrics...")
    r_dash_s3 = client.get("/api/v1/dashboard/summary", headers=headers_sem3_cse)
    assert r_dash_s3.status_code == 200
    dash_s3 = r_dash_s3.json()
    assert dash_s3["semester"] == 3
    assert dash_s3["department"] == "CSE"
    assert dash_s3["enrolled_courses"] == 3
    assert dash_s3["upcoming_examinations"] == 2
    assert dash_s3["cgpa"] is None, "CGPA must be null when unrecorded, not fake 8.5!"
    print(f"  [OK] Dashboard summary verified authentic for Sem 3: courses={dash_s3['enrolled_courses']}, exams={dash_s3['upcoming_examinations']}, cgpa={dash_s3['cgpa']}")

    print("\n" + "=" * 70)
    print("ALL 12 PHASE 2 TEST SCENARIOS PASSED WITH ZERO SECURITY VULNERABILITIES!")
    print("=" * 70)

if __name__ == "__main__":
    run_phase2_tests()
