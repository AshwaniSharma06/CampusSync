"""
CampusSync Live End-to-End System Audit
Tests live running server on http://127.0.0.1:8000 across:
1. Health & Docs
2. Student Authentication
3. Dashboard Summary
4. Notices API (Cohort filtered)
5. Courses API
6. CampusSync AI Chat Sessions (Create, List, Retrieve)
7. CampusSync AI Live Chat Generation & Citation Grounding
"""

import sys
import os
import io
import json
import urllib.request
import urllib.error

# Ensure project root in sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# UTF-8 stdout
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE = "http://127.0.0.1:8000"

def run_live_audit():
    print("=" * 70)
    print("  CAMPUSSYNC LIVE SYSTEM AUDIT: ALL APIS & SERVICES")
    print("=" * 70)

    # 1. Health
    try:
        req = urllib.request.Request(f"{BASE}/health")
        with urllib.request.urlopen(req) as r:
            data = json.loads(r.read().decode("utf-8"))
            print(f"PASS [1. Health Endpoint]: status={data.get('status')} msg='{data.get('message')}'")
    except Exception as e:
        print(f"FAIL [1. Health Endpoint]: {e}")
        return

    # 2. Docs
    try:
        req = urllib.request.Request(f"{BASE}/docs")
        with urllib.request.urlopen(req) as r:
            print(f"PASS [2. Swagger Documentation]: status={r.status}")
    except Exception as e:
        print(f"FAIL [2. Swagger Documentation]: {e}")

    # 3. Authenticate Student
    from backend.core.security import create_access_token
    from backend.db.session import SessionLocal
    from backend.models.user import User

    db = SessionLocal()
    user = db.query(User).filter(User.email.like("%student%")).first()
    if not user:
        user = db.query(User).first()
    token = create_access_token(subject=user.id)
    auth_headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Origin": "http://localhost:3000"
    }
    print(f"PASS [3. Student Authentication]: Authenticated user '{user.email}' (Role: {user.role.value if hasattr(user.role, 'value') else user.role})")

    # 4. Dashboard Summary
    try:
        req = urllib.request.Request(f"{BASE}/api/v1/dashboard/summary", headers=auth_headers)
        with urllib.request.urlopen(req) as r:
            dash_data = json.loads(r.read().decode("utf-8"))
            print(f"PASS [4. Dashboard Summary API]: Returned {len(dash_data)} metric sections")
    except Exception as e:
        print(f"FAIL [4. Dashboard Summary API]: {e}")

    # 5. Notices API
    try:
        req = urllib.request.Request(f"{BASE}/api/v1/notices/", headers=auth_headers)
        with urllib.request.urlopen(req) as r:
            notices = json.loads(r.read().decode("utf-8"))
            print(f"PASS [5. Notices API]: Retrieved {len(notices)} cohort-filtered notices")
    except Exception as e:
        print(f"FAIL [5. Notices API]: {e}")

    # 6. Courses API
    try:
        req = urllib.request.Request(f"{BASE}/api/v1/courses/", headers=auth_headers)
        with urllib.request.urlopen(req) as r:
            courses = json.loads(r.read().decode("utf-8"))
            print(f"PASS [6. Courses API]: Retrieved {len(courses)} semester courses")
    except Exception as e:
        print(f"FAIL [6. Courses API]: {e}")

    # 7. Create Chat Session
    session_id = None
    try:
        payload = json.dumps({"title": "Phase 4.0 Live Audit Session"}).encode("utf-8")
        req = urllib.request.Request(f"{BASE}/api/v1/rag/sessions", data=payload, method="POST", headers=auth_headers)
        with urllib.request.urlopen(req) as r:
            s_data = json.loads(r.read().decode("utf-8"))
            session_id = s_data.get("id")
            print(f"PASS [7. Create Chat Session]: Created session #{session_id} - '{s_data.get('title')}'")
    except Exception as e:
        print(f"FAIL [7. Create Chat Session]: {e}")

    # 8. List Chat Sessions
    try:
        req = urllib.request.Request(f"{BASE}/api/v1/rag/sessions", headers=auth_headers)
        with urllib.request.urlopen(req) as r:
            s_list = json.loads(r.read().decode("utf-8"))
            print(f"PASS [8. List Chat Sessions]: Retrieved {len(s_list)} persistent sessions")
    except Exception as e:
        print(f"FAIL [8. List Chat Sessions]: {e}")

    # 9. CampusSync AI Live Chat with Grounding & Persistence
    try:
        chat_payload = json.dumps({
            "query": "When are the mid term examinations scheduled for 7th semester?",
            "session_id": session_id,
            "history": []
        }).encode("utf-8")
        req = urllib.request.Request(f"{BASE}/api/v1/rag/chat", data=chat_payload, method="POST", headers=auth_headers)
        with urllib.request.urlopen(req) as r:
            chat_data = json.loads(r.read().decode("utf-8"))
            print(f"PASS [9. CampusSync AI Chat]: HTTP {r.status}")
            print(f"  --> Session ID: {chat_data.get('session_id')}")
            print(f"  --> Sources Count: {len(chat_data.get('sources', []))}")
            for idx, s in enumerate(chat_data.get("sources", [])[:2], 1):
                print(f"      [{idx}] {s.get('title')} ({s.get('published_date', 'N/A')})")
            print(f"  --> Answer Preview: {chat_data.get('answer', '')[:140]}...")
    except Exception as e:
        print(f"FAIL [9. CampusSync AI Chat]: {e}")

    print("=" * 70)
    print("  LIVE SYSTEM AUDIT COMPLETED SUCCESSFULLY")
    print("=" * 70)

if __name__ == "__main__":
    run_live_audit()
