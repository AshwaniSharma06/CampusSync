"""
Phase 5 Comprehensive Student Dashboard Validation & Multi-Cohort Integration Test
Uses live HTTP requests against http://127.0.0.1:8000 (avoiding TestClient socket deadlocks on Windows).
"""

import sys
import io
import json
import urllib.request
import urllib.error

# Ensure UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

def get_token(username, password="password123"):
    data = json.dumps({"email": username, "password": password}).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}/api/v1/auth/login",
        data=data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        res_data = json.loads(resp.read().decode("utf-8"))
        return res_data["access_token"]

def api_get(endpoint, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE_URL}{endpoint}", headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def api_post(endpoint, payload, token):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=data,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def test_phase5_cohorts():
    print("=" * 80)
    print("  CAMPUSSYNC PHASE 5: COMPREHENSIVE STUDENT DASHBOARD VALIDATION")
    print("=" * 80)

    # 1. Health check
    health = api_get("/health")
    assert health["status"] == "ok", "Health endpoint check failed"
    print("\n[+] Backend health check: OK")

    # 2. Test User #2 (CSE Sem 3)
    print("\n[Test 1] Testing User #2: CSE Semester 3 (test_sem3_cse@ecajmer.ac.in)")
    token_sem3 = get_token("test_sem3_cse@ecajmer.ac.in")
    profile_sem3 = api_get("/api/v1/profile/me", token_sem3)
    print(f"  Profile: {profile_sem3.get('full_name')} | Dept: {profile_sem3.get('department')} | Sem: {profile_sem3.get('semester')}")
    assert profile_sem3["semester"] == 3 and profile_sem3["department"] == "Computer Science and Engineering"

    summary_sem3 = api_get("/api/v1/dashboard/summary", token_sem3)
    print(f"  Summary Metrics -> Courses: {summary_sem3['enrolled_courses']}, Exams: {summary_sem3['upcoming_examinations']}, Tasks: {summary_sem3['pending_assignments']}, CGPA: {summary_sem3.get('cgpa')}")
    assert summary_sem3["cgpa"] is None, "CGPA must not be fabricated"
    assert summary_sem3["enrolled_courses"] == 3
    assert summary_sem3["pending_assignments"] == 1
    assert summary_sem3["upcoming_examinations"] == 2

    courses_sem3 = api_get("/api/v1/courses", token_sem3)
    course_codes_sem3 = [c["code"] for c in courses_sem3]
    print(f"  Enrolled Courses: {course_codes_sem3}")
    assert "CS 301" in course_codes_sem3 and "CS 302" in course_codes_sem3 and "CS 303" in course_codes_sem3
    assert "CS 501" not in course_codes_sem3 and "CS 401" not in course_codes_sem3, "Cross-semester course leakage detected!"

    exams_sem3 = api_get("/api/v1/examinations", token_sem3)
    print(f"  Exams: {[e['course_name'] for e in exams_sem3]}")
    assert len(exams_sem3) == 2

    assigns_sem3 = api_get("/api/v1/assignments", token_sem3)
    print(f"  Assignments: {[a['title'] for a in assigns_sem3]}")
    assert len(assigns_sem3) == 1
    assert "Data Structures" in assigns_sem3[0]["title"]

    notices_sem3 = api_get("/api/v1/notices", token_sem3)
    print(f"  Notices count: {len(notices_sem3)}")
    notice_titles_sem3 = [n["title"] for n in notices_sem3]
    assert any("Semester 3" in t or "Sem 3" in t or "CSE" in t for t in notice_titles_sem3)
    # Ensure no Sem 5 or Sem 7 exclusive notices
    assert not any("Semester 5" in t or "Sem 5" in t for t in notice_titles_sem3), "Sem 5 notice leaked into Sem 3 dashboard!"
    print("  --> PASS: User #2 (CSE Sem 3) strictly isolated with genuine DB records.")

    # 3. Test User #3 (CSE Sem 5)
    print("\n[Test 2] Testing User #3: CSE Semester 5 (test_sem5_cse@ecajmer.ac.in)")
    token_sem5 = get_token("test_sem5_cse@ecajmer.ac.in")
    summary_sem5 = api_get("/api/v1/dashboard/summary", token_sem5)
    courses_sem5 = api_get("/api/v1/courses", token_sem5)
    course_codes_sem5 = [c["code"] for c in courses_sem5]
    print(f"  Enrolled Courses: {course_codes_sem5}")
    assert "CS 501" in course_codes_sem5 and "CS 502" in course_codes_sem5
    assert "CS 301" not in course_codes_sem5 and "CS 401" not in course_codes_sem5
    assigns_sem5 = api_get("/api/v1/assignments", token_sem5)
    print(f"  Assignments count: {len(assigns_sem5)} (Expected 0 for Sem 5)")
    assert len(assigns_sem5) == 0
    print("  --> PASS: User #3 (CSE Sem 5) verified.")

    # 4. Test User #1 / User #4 (CSE Sem 7)
    print("\n[Test 3] Testing User #1: CSE Semester 7 (student@ecajmer.ac.in)")
    token_sem7 = get_token("student@ecajmer.ac.in")
    courses_sem7 = api_get("/api/v1/courses", token_sem7)
    course_codes_sem7 = [c["code"] for c in courses_sem7]
    print(f"  Enrolled Courses: {course_codes_sem7}")
    assert "CS 401" in course_codes_sem7 or "CS 460" in course_codes_sem7
    resources_sem7 = api_get("/api/v1/resources", token_sem7)
    print(f"  Resources count: {len(resources_sem7)}")
    res_titles_sem7 = [r["title"] for r in resources_sem7]
    assert any("7th Sem" in t for t in res_titles_sem7), "Sem 7 syllabus resource not found"
    print("  --> PASS: User #1 (CSE Sem 7) verified.")

    # 5. Test User #5 (IT Sem 3) - Department Isolation
    print("\n[Test 4] Testing User #5: IT Semester 3 (test_sem3_it@ecajmer.ac.in)")
    token_it = get_token("test_sem3_it@ecajmer.ac.in")
    courses_it = api_get("/api/v1/courses", token_it)
    course_codes_it = [c["code"] for c in courses_it]
    print(f"  Enrolled Courses: {course_codes_it}")
    assert "IT 301" in course_codes_it
    assert not any("CS " in c for c in course_codes_it), "CSE course leaked into IT dashboard!"
    notices_it = api_get("/api/v1/notices", token_it)
    notice_titles_it = [n["title"] for n in notices_it]
    assert any("Information Technology" in t or "IT" in t for t in notice_titles_it)
    print("  --> PASS: User #5 (IT Dept) strictly department-isolated.")

    # 6. Test User #7 (EE Sem 1) - Empty State Verification
    print("\n[Test 5] Testing User #7: EE Semester 1 (test_sem1_ee_empty@ecajmer.ac.in)")
    token_ee = get_token("test_sem1_ee_empty@ecajmer.ac.in")
    courses_ee = api_get("/api/v1/courses", token_ee)
    exams_ee = api_get("/api/v1/examinations", token_ee)
    assigns_ee = api_get("/api/v1/assignments", token_ee)
    print(f"  Courses: {len(courses_ee)} | Exams: {len(exams_ee)} | Assignments: {len(assigns_ee)}")
    assert len(courses_ee) == 0, "Expected empty courses for EE Sem 1"
    assert len(exams_ee) == 0, "Expected empty exams for EE Sem 1"
    assert len(assigns_ee) == 0, "Expected empty assignments for EE Sem 1"
    print("  --> PASS: User #7 (Empty cohort) handles empty states cleanly.")

    # 7. Test Events and Community Integration
    print("\n[Test 6] Testing Campus Events & Community Threads Integration")
    events = api_get("/api/v1/events", token_sem7)
    print(f"  Campus Events count: {len(events)}")
    assert len(events) >= 3, "Expected at least 3 campus events"
    print(f"  Sample event: {events[0]['title']} ({events[0]['event_type']})")

    community = api_get("/api/v1/community/posts", token_sem7)
    print(f"  Community posts count: {len(community)}")
    assert len(community) >= 3, "Expected at least 3 community discussions"

    # Test creating a new post
    new_post = api_post(
        "/api/v1/community/posts",
        {"content": "Phase 5 dashboard validation automated thread verification.", "tags": ["AutomatedTest", "Phase5"]},
        token_sem7
    )
    print(f"  Successfully posted new thread: ID {new_post.get('id')} | Content: {new_post.get('content')}")
    assert new_post.get("id") is not None
    print("  --> PASS: Events and Community APIs validated successfully.")

    # 8. Unauthenticated Access Protection Check
    print("\n[Test 7] Verifying Security: Unauthenticated Access Rejection")
    try:
        api_get("/api/v1/courses")
        assert False, "Unauthenticated request should have failed with 401"
    except urllib.error.HTTPError as e:
        print(f"  Unauthenticated GET /api/v1/courses rejected with HTTP {e.code} (Expected 401)")
        assert e.code == 401
    print("  --> PASS: Unauthenticated access blocked.")

    print("\n" + "=" * 80)
    print("  ALL PHASE 5 STUDENT DASHBOARD INTEGRATION TESTS PASSED (7/7)")
    print("=" * 80)

if __name__ == "__main__":
    test_phase5_cohorts()
