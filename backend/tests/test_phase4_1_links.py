"""
Phase 4.1 Automated Verification Test Suite.
Validates all 12 scenarios specified in the Phase 4.1 requirements:
1. CampusSync-hosted notice download
2. Official external notice document
3. Official notice webpage redirect
4. Missing or invalid notice URL
5. CampusSync-hosted academic document
6. External academic document
7. Club-specific official page
8. Club directory fallback
9. Club with no verified destination
10. Unverified and untrusted URL rejection
11. Existing authentication and semester/department filtering
12. Existing CampusSync AI and chat functionality remain unaffected
"""

import sys
import os
import io
import json
import urllib.request
import urllib.error

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.services.url_validator import is_trusted_url, resolve_notice_destination, resolve_club_destination, DestinationType
from backend.core.security import create_access_token
from backend.db.session import SessionLocal
from backend.models.user import User

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=" * 70)
    print("  CAMPUSSYNC: PHASE 4.1 VERIFICATION TEST SUITE (12 SCENARIOS)")
    print("=" * 70)

    db = SessionLocal()
    tests_passed = 0
    total_tests = 12

    try:
        # Fixture Setup: Authenticated Student (Semester 7 CSE)
        student_user = db.query(User).filter(User.email == "student@ecajmer.ac.in").first()
        assert student_user, "Student user student@ecajmer.ac.in must exist"
        token = create_access_token(subject=student_user.id)
        auth_headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000"
        }

        # Scenario 1: CampusSync-hosted notice download
        print("\n[Scenario 1] Testing CampusSync-Hosted Notice Download (GET /api/v1/notices/1/download)")
        req1 = urllib.request.Request(f"{BASE_URL}/api/v1/notices/1/download", headers=auth_headers)
        with urllib.request.urlopen(req1) as r1:
            assert r1.status == 200, f"Expected 200, got {r1.status}"
            content_type = r1.headers.get("content-type", "")
            content_disp = r1.headers.get("content-disposition", "")
            data = r1.read()
            assert "application/pdf" in content_type, f"Expected application/pdf, got {content_type}"
            assert "attachment" in content_disp, f"Expected attachment disposition, got {content_disp}"
            assert data.startswith(b"%PDF"), "Expected valid PDF stream"
            print(f"  --> PASS: Received {len(data)} bytes valid PDF stream with attachment header.")
            tests_passed += 1

        # Scenario 2: Official external notice document
        print("\n[Scenario 2] Testing Official External Notice Document (Notice #7)")
        req2 = urllib.request.Request(f"{BASE_URL}/api/v1/notices/", headers=auth_headers)
        with urllib.request.urlopen(req2) as r2:
            notices = json.loads(r2.read().decode("utf-8"))
            n7 = next((n for n in notices if n["id"] == 7), None)
            assert n7, "Notice #7 must be present"
            assert n7["destination_type"] == "OFFICIAL_DOCUMENT"
            assert "ecajmer.ac.in" in n7["action_url"]
            assert n7["action_url"].endswith(".pdf")
            print(f"  --> PASS: Notice #7 destination is verified OFFICIAL_DOCUMENT ({n7['action_url'][:60]}...)")
            tests_passed += 1

        # Scenario 3: Official notice webpage redirect
        print("\n[Scenario 3] Testing Official Notice Webpage Redirect (Notice #2)")
        n2 = next((n for n in notices if n["id"] == 2), None)
        assert n2, "Notice #2 must be present"
        assert n2["destination_type"] == "OFFICIAL_PAGE"
        assert "facilities/library" in n2["action_url"]
        print(f"  --> PASS: Notice #2 destination is OFFICIAL_PAGE ({n2['action_url']})")
        tests_passed += 1

        # Scenario 4: Missing or invalid notice URL
        print("\n[Scenario 4] Testing Notice with Missing or Unavailable Destination (Notice #9)")
        # Notice 9 is IT Department (filtered out for CSE student). Let's test the download endpoint directly
        try:
            req4 = urllib.request.Request(f"{BASE_URL}/api/v1/notices/9/download", headers=auth_headers)
            with urllib.request.urlopen(req4) as r4:
                assert False, "Should have returned 404 for notice with missing URL"
        except urllib.error.HTTPError as e4:
            assert e4.code == 404, f"Expected 404, got {e4.code}"
            err_data = json.loads(e4.read().decode("utf-8"))
            print(f"  --> PASS: Correctly returned 404 with detail: '{err_data.get('detail')}'")
            tests_passed += 1

        # Scenario 5: CampusSync-hosted academic document
        print("\n[Scenario 5] Testing CampusSync-Hosted Academic Document (GET /api/v1/resources/1/download)")
        req5 = urllib.request.Request(f"{BASE_URL}/api/v1/resources/1/download", headers=auth_headers)
        with urllib.request.urlopen(req5) as r5:
            assert r5.status == 200, f"Expected 200, got {r5.status}"
            assert "application/pdf" in r5.headers.get("content-type", "")
            r5_data = r5.read()
            assert r5_data.startswith(b"%PDF"), "Must be valid PDF"
            print(f"  --> PASS: Resource #1 downloaded successfully ({len(r5_data)} bytes).")
            tests_passed += 1

        # Scenario 6: External academic document
        print("\n[Scenario 6] Testing External Academic Document (Resource #4)")
        req6 = urllib.request.Request(f"{BASE_URL}/api/v1/resources/", headers=auth_headers)
        with urllib.request.urlopen(req6) as r6:
            resources = json.loads(r6.read().decode("utf-8"))
            res4 = next((r for r in resources if r["id"] == 4), None)
            assert res4, "Resource #4 must exist"
            assert res4["destination_type"] == "OFFICIAL_DOCUMENT"
            assert is_trusted_url(res4["action_url"])
            print(f"  --> PASS: Resource #4 destination is verified OFFICIAL_DOCUMENT ({res4['action_url'][:55]}...)")
            tests_passed += 1

        # Scenario 7: Club-specific official page
        print("\n[Scenario 7] Testing Club-Specific Official Page (Club #1 Technotsav / Club #3 AI Society)")
        req7 = urllib.request.Request(f"{BASE_URL}/api/v1/events/clubs", headers=auth_headers)
        with urllib.request.urlopen(req7) as r7:
            clubs = json.loads(r7.read().decode("utf-8"))
            c1 = next((c for c in clubs if c["id"] == 1), None)
            assert c1, "Club #1 must exist"
            assert c1["destination_type"] == "OFFICIAL_PAGE"
            assert "events/technotsav-2026" in c1["action_url"]
            print(f"  --> PASS: Club #1 links directly to dedicated official page: {c1['action_url']}")
            tests_passed += 1

        # Scenario 8: Club directory fallback
        print("\n[Scenario 8] Testing Club Directory Fallback (Club #2 Creative Art Society)")
        c2 = next((c for c in clubs if c["id"] == 2), None)
        assert c2, "Club #2 must exist"
        assert c2["destination_type"] == "DIRECTORY_PAGE"
        assert c2["official_page_url"] is None
        assert "facilities/sac" in c2["action_url"]
        print(f"  --> PASS: Club #2 safely falls back to official SAC directory: {c2['action_url']}")
        tests_passed += 1

        # Scenario 9: Club with no verified destination
        print("\n[Scenario 9] Testing Club with No Verified Destination (Club #4)")
        c4 = next((c for c in clubs if c["id"] == 4), None)
        assert c4, "Club #4 must exist"
        assert c4["destination_type"] == "UNAVAILABLE"
        assert c4["action_url"] is None
        assert c4["action_label"] == "Official club link is currently unavailable."
        print(f"  --> PASS: Club #4 accurately classified as UNAVAILABLE with useful message.")
        tests_passed += 1

        # Scenario 10: Unverified and untrusted URL rejection
        print("\n[Scenario 10] Testing Unverified and Untrusted URL Rejection")
        untrusted_urls = [
            "https://phishing-site.com/fake-circular.pdf",
            "javascript:alert('xss')",
            "http://malicious-server.org/download",
            "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
            None,
            ""
        ]
        for bad_url in untrusted_urls:
            assert not is_trusted_url(bad_url), f"Untrusted URL '{bad_url}' was improperly accepted!"
        # Test that resolve_notice_destination rejects untrusted URL
        d_type, d_url, d_label = resolve_notice_destination(
            download_url=None,
            document_url="https://evil-site.com/leak.pdf",
            source_url="http://untrusted-blog.com"
        )
        assert d_type == DestinationType.UNAVAILABLE
        assert d_url is None
        print("  --> PASS: Strict domain whitelist rejected all untrusted URLs & protocol exploits.")
        tests_passed += 1

        # Scenario 11: Existing authentication and semester/department filtering
        print("\n[Scenario 11] Testing Cohort Authorization & Semester Filtering")
        req11 = urllib.request.Request(f"{BASE_URL}/api/v1/notices/", headers=auth_headers)
        with urllib.request.urlopen(req11) as r11:
            n_list = json.loads(r11.read().decode("utf-8"))
            # Verified student is CSE Sem 7: must not receive IT Department notices
            for n in n_list:
                if n["scope"] == "DEPARTMENT_SPECIFIC":
                    assert n["department_code"] == "CSE", f"CSE student received {n['department_code']} notice"
                if n["scope"] == "SEMESTER_SPECIFIC":
                    assert n["target_semester"] in [None, 7], f"Sem 7 student received Sem {n['target_semester']}"
            print(f"  --> PASS: All {len(n_list)} notices strictly adhere to student's CSE Sem 7 cohort.")
            tests_passed += 1

        # Scenario 12: Existing CampusSync AI and chat functionality remain unaffected
        print("\n[Scenario 12] Testing CampusSync AI Chat & Grounded Persistence Unaffected")
        chat_payload = json.dumps({
            "query": "When are the mid term examinations scheduled for 7th semester?",
            "history": []
        }).encode("utf-8")
        req12 = urllib.request.Request(f"{BASE_URL}/api/v1/rag/chat", data=chat_payload, method="POST", headers=auth_headers)
        with urllib.request.urlopen(req12) as r12:
            assert r12.status == 200, f"Expected 200, got {r12.status}"
            chat_data = json.loads(r12.read().decode("utf-8"))
            assert "answer" in chat_data and len(chat_data["answer"].strip()) > 0
            assert "session_id" in chat_data and chat_data["session_id"] is not None
            assert "sources" in chat_data and isinstance(chat_data["sources"], list)
            print(f"  --> PASS: CampusSync AI responded with HTTP 200, Session #{chat_data['session_id']}, {len(chat_data['sources'])} sources.")
            tests_passed += 1

        print("\n" + "=" * 70)
        print(f"  PHASE 4.1 TEST SUITE PASSED: {tests_passed}/{total_tests} SCENARIOS VERIFIED")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()

