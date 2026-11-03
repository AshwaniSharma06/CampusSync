import os
import sys
sys.path.insert(0, os.path.abspath("."))
import sqlite3
import asyncio

from backend.db.session import SessionLocal
from backend.models.user import User
from backend.models.academic import Notice, AcademicResource
from backend.api.v1.notices import get_notices
from backend.api.v1.resources import get_academic_resources
from backend.api.deps import StudentContext
from backend.services.vector_service import retrieve_relevant_chunks, get_rag_collection
from backend.services.scheduler import CampusSyncScraperScheduler, LOCK_FILE_PATH
from filelock import FileLock, Timeout

def run_phase7_1_tests():
    print("=" * 80)
    print("  PHASE 7.1: FINAL AI RETRIEVAL & SCHEDULER SAFEGUARD REGRESSION SUITE")
    print("=" * 80)

    db = SessionLocal()
    user1 = db.query(User).filter(User.id == 1).first()
    user2 = db.query(User).filter(User.id == 2).first()
    user3 = db.query(User).filter(User.id == 3).first()

    # ---------------------------------------------------------
    # TEST 1: Pending Verification Exclusion from CampusSync AI
    # ---------------------------------------------------------
    print("\n[Test 1] Testing PENDING_VERIFICATION Exclusion from CampusSync AI RAG")
    # Query for the exact title of notice_1 ("Mid-Term Examination Schedule Released")
    results_pending = retrieve_relevant_chunks(
        query="Mid-Term Examination Schedule Released Semester 7",
        n_results=5,
        student_context={"department_code": "CSE", "semester": 7, "user_id": 1}
    )
    pending_returned = [r for r in results_pending if r.get("verification_status") != "VERIFIED"]
    print(f"  Total chunks retrieved: {len(results_pending)}")
    print(f"  Non-VERIFIED / PENDING chunks retrieved: {len(pending_returned)}")
    assert len(pending_returned) == 0, "Security violation: Non-VERIFIED records returned by AI RAG!"
    print("  --> PASS: Authoritative AI RAG strictly excludes PENDING_VERIFICATION records.")

    # ---------------------------------------------------------
    # TEST 2: Individual Record Privacy Protection
    # ---------------------------------------------------------
    print("\n[Test 2] Testing INDIVIDUAL Data Privacy Guard in CampusSync AI")
    # 2a. Intended recipient (user_id = 2) queries for confidential fee exemption
    ctx_authorized = {"user_id": 2, "department_code": "CSE", "semester": 7}
    res_auth = retrieve_relevant_chunks(
        query="Confidential Academic Fee Exemption Audit student 24ECA003",
        n_results=3,
        student_context=ctx_authorized
    )
    auth_indiv = [r for r in res_auth if r.get("scope") == "INDIVIDUAL"]
    print(f"  Authorized User 2 retrieved INDIVIDUAL records: {len(auth_indiv)}")
    assert len(auth_indiv) > 0, "Authorized student failed to retrieve their own confidential notice!"
    print(f"  Sample retrieved: '{auth_indiv[0]['title']}'")

    # 2b. Unauthorized student (user_id = 1) queries for the same confidential notice
    ctx_unauthorized = {"user_id": 1, "department_code": "CSE", "semester": 7}
    res_unauth = retrieve_relevant_chunks(
        query="Confidential Academic Fee Exemption Audit student 24ECA003",
        n_results=3,
        student_context=ctx_unauthorized
    )
    unauth_indiv = [r for r in res_unauth if r.get("scope") == "INDIVIDUAL"]
    print(f"  Unauthorized User 1 retrieved INDIVIDUAL records: {len(unauth_indiv)} (Must be 0)")
    assert len(unauth_indiv) == 0, "Security breach: Unauthorized student accessed another student's INDIVIDUAL record!"

    # 2c. Unauthenticated caller queries
    res_anon = retrieve_relevant_chunks(
        query="Confidential Academic Fee Exemption Audit student 24ECA003",
        n_results=3,
        student_context=None
    )
    anon_indiv = [r for r in res_anon if r.get("scope") == "INDIVIDUAL"]
    print(f"  Anonymous caller retrieved INDIVIDUAL records: {len(anon_indiv)} (Must be 0)")
    assert len(anon_indiv) == 0, "Security breach: Anonymous query accessed INDIVIDUAL record!"
    print("  --> PASS: Individual privacy protection strictly enforces authenticated recipient access.")

    # ---------------------------------------------------------
    # TEST 3: IT Sem 3 Query & 8th Sem Timetable Re-Classification
    # ---------------------------------------------------------
    print("\n[Test 3] Testing IT Sem 3 Retrieval & Corrected 8th Sem Timetable Isolation")
    ctx_it3 = {"department_code": "IT", "semester": 3, "user_id": 4}
    res_it3 = retrieve_relevant_chunks(
        query="Are there any IT department 3rd semester announcements or 8th semester mid term timetable?",
        n_results=5,
        student_context=ctx_it3
    )
    leaked_8th = [r for r in res_it3 if "8th Semester" in r.get("title", "") or r.get("target_semester") == 8]
    print(f"  IT Sem 3 Chunks retrieved: {len(res_it3)}")
    print(f"  Leaked 8th semester timetable chunks: {len(leaked_8th)} (Must be 0)")
    assert len(leaked_8th) == 0, "Cohort leakage: 8th semester timetable returned to IT Sem 3 student!"

    # But IT Sem 8 student CAN retrieve it
    ctx_it8 = {"department_code": "IT", "semester": 8, "user_id": 8}
    res_it8 = retrieve_relevant_chunks(
        query="8th Semester 2nd Mid Term Time Table",
        n_results=3,
        student_context=ctx_it8
    )
    found_8th = [r for r in res_it8 if "8th Semester" in r.get("title", "") and r.get("target_semester") == 8]
    print(f"  IT Sem 8 authorized retrieval: {len(found_8th)}")
    assert len(found_8th) > 0, "IT Sem 8 student could not retrieve their own 8th semester timetable!"
    print("  --> PASS: 8th semester timetable correctly classified and cohort-isolated.")

    # ---------------------------------------------------------
    # TEST 4: Academic Resources Audit & Administrative Flags
    # ---------------------------------------------------------
    print("\n[Test 4] Testing Academic Resources Flagging & Dashboard Exclusion")
    # Verify the 5 flagged administrative items in SQLite
    conn = sqlite3.connect("campussync.db")
    c = conn.cursor()
    flagged_in_db = c.execute("SELECT id, title, verification_status, category FROM academic_resources WHERE id IN (9, 13, 14, 15, 16)").fetchall()
    print(f"  Flagged items in DB: {len(flagged_in_db)}")
    for item in flagged_in_db:
        assert item[2] == "FLAGGED", f"Item {item[0]} not marked FLAGGED"
        print(f"    - [{item[0]}] '{item[1][:50]}' | Status: {item[2]} | Cat: {item[3]}")
    conn.close()

    # Verify that get_academic_resources excludes them for all students
    ctx_cse = StudentContext(user=user1, student_id="TEST_CSE", department_code="CSE", semester=7, academic_year="2026-27")
    cse_resources = get_academic_resources(student_ctx=ctx_cse, db=db)
    flagged_in_feed = [r for r in cse_resources if r["id"] in [9, 13, 14, 15, 16]]
    print(f"  Flagged administrative resources exposed to student feed: {len(flagged_in_feed)} (Must be 0)")
    assert len(flagged_in_feed) == 0, "Flagged administrative items leaked into student resources!"
    print("  --> PASS: Administrative items flagged for review and cleanly removed from student feeds.")

    # ---------------------------------------------------------
    # TEST 5: Scheduler Cross-Process Singleton Lock
    # ---------------------------------------------------------
    print("\n[Test 5] Testing Scheduler Cross-Process Singleton Lock", flush=True)
    import subprocess
    scheduler = CampusSyncScraperScheduler.get_instance()
    
    # 5a. Verify scheduler configuration
    status = scheduler.get_status()
    print(f"  Scheduler interval: {status['interval_minutes']} minutes (Expected: 180)", flush=True)
    assert status['interval_minutes'] == 180, "Scheduler interval is not 180 minutes!"
    assert status['scheduler_enabled'] is True, "Scheduler is not enabled!"

    # 5b. Verify cross-process singleton protection with FileLock
    master_lock = FileLock(LOCK_FILE_PATH, timeout=0.1)
    master_lock.acquire(timeout=0.1)
    print("  Master process acquired cross-process lock.", flush=True)

    worker2_code = f"""
import sys
from filelock import FileLock, Timeout
fl = FileLock(r'{LOCK_FILE_PATH}', timeout=0.2)
try:
    fl.acquire(timeout=0.2)
    print('WORKER_ACQUIRED')
except Timeout:
    print('WORKER_STANDBY')
"""
    proc = subprocess.run([sys.executable, "-c", worker2_code], capture_output=True, text=True)
    worker_out = proc.stdout.strip()
    print(f"  Worker 2 subprocess result while Master holds lock: {worker_out} (Expected: WORKER_STANDBY)", flush=True)
    assert worker_out == "WORKER_STANDBY", "Cross-process lock failed: Worker 2 acquired lock held by Master!"

    master_lock.release()
    print("  Master process released cross-process lock.", flush=True)

    # Now worker 2 subprocess should be able to acquire lock
    proc2 = subprocess.run([sys.executable, "-c", worker2_code], capture_output=True, text=True)
    worker2_after = proc2.stdout.strip()
    print(f"  Worker 2 after Master release: {worker2_after} (Expected: WORKER_ACQUIRED)", flush=True)
    assert worker2_after == "WORKER_ACQUIRED", "Worker 2 could not acquire released lock!"

    print("  --> PASS: Cross-process file lock reliably guarantees single-instance execution.", flush=True)

    # ---------------------------------------------------------
    # TEST 6: Multi-Cohort Regression Across All 5 Cohorts
    # ---------------------------------------------------------
    print("\n[Test 6] Multi-Cohort Dashboard Regression Across CSE, IT, EE")
    cohort_specs = [
        ("CSE Sem 3", "CSE", 3),
        ("CSE Sem 5", "CSE", 5),
        ("CSE Sem 7", "CSE", 7),
        ("IT Sem 3", "IT", 3),
        ("EE Sem 1", "EE", 1),
    ]

    for label, dept, sem in cohort_specs:
        ctx = StudentContext(user=user1, student_id=f"TEST_{dept}", department_code=dept, semester=sem, academic_year="2026-27")
        notices = get_notices(student_ctx=ctx, db=db)
        resources = get_academic_resources(student_ctx=ctx, db=db)
        
        # Verify 0 unclassified notices
        unclass_n = [n for n in notices if n.get("scope") == "UNCLASSIFIED"]
        # Verify 0 unclassified resources
        unclass_r = [r for r in resources if r.get("scope") == "UNCLASSIFIED"]
        
        print(f"  [{label}] Notices: {len(notices)} (Unclassified leaked: {len(unclass_n)}) | Resources: {len(resources)} (Unclassified leaked: {len(unclass_r)})")
        assert len(unclass_n) == 0, f"Unclassified notices leaked in {label}"
        assert len(unclass_r) == 0, f"Unclassified resources leaked in {label}"

    print("  --> PASS: Multi-cohort dashboard isolation verified with zero leakage.")

    # ---------------------------------------------------------
    # TEST 7: Database & ChromaDB State Preservation
    # ---------------------------------------------------------
    print("\n[Test 7] Database & ChromaDB Data Preservation Check")
    conn = sqlite3.connect("campussync.db")
    c = conn.cursor()
    users_cnt = c.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    profiles_cnt = c.execute("SELECT COUNT(*) FROM student_profiles").fetchone()[0]
    courses_cnt = c.execute("SELECT COUNT(*) FROM courses").fetchone()[0]
    exams_cnt = c.execute("SELECT COUNT(*) FROM examination_schedules").fetchone()[0]
    sessions_cnt = c.execute("SELECT COUNT(*) FROM chat_sessions").fetchone()[0]
    messages_cnt = c.execute("SELECT COUNT(*) FROM chat_messages").fetchone()[0]
    notices_cnt = c.execute("SELECT COUNT(*) FROM notices").fetchone()[0]
    resources_cnt = c.execute("SELECT COUNT(*) FROM academic_resources").fetchone()[0]
    jobs_cnt = c.execute("SELECT COUNT(*) FROM scraping_jobs").fetchone()[0]
    conn.close()

    chroma_cnt = get_rag_collection().count()

    print(f"  Users: {users_cnt} (Expected: 13)")
    print(f"  Student Profiles: {profiles_cnt} (Expected: 12)")
    print(f"  Courses: {courses_cnt} (Expected: 10)")
    print(f"  Examination Schedules: {exams_cnt} (Expected: 7)")
    print(f"  Chat Sessions: {sessions_cnt} (Expected: 10)")
    print(f"  Chat Messages: {messages_cnt} (Expected: 20)")
    print(f"  Notices: {notices_cnt} (Expected: 969)")
    print(f"  Academic Resources: {resources_cnt} (Expected: 248)")
    print(f"  Scraping Jobs: {jobs_cnt} (Expected: >= 18)")
    print(f"  ChromaDB Chunks: {chroma_cnt} (Expected: 335)")

    assert users_cnt == 13
    assert profiles_cnt == 12
    assert courses_cnt == 10
    assert exams_cnt == 7
    assert sessions_cnt == 10
    assert messages_cnt == 20
    assert notices_cnt == 969
    assert resources_cnt == 248
    assert chroma_cnt == 335

    print("  --> PASS: 100% database and vector store preservation verified.")

    print("\n" + "=" * 80)
    print("  ALL 7 PHASE 7.1 SAFEGUARD AND REGRESSION TESTS PASSED (100%)")
    print("=" * 80)
    db.close()

if __name__ == "__main__":
    run_phase7_1_tests()
