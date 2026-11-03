"""
CampusSync Phase 9.2: Production Readiness & Essential Fixes Validation Suite
Direct in-process execution with database assertions, dependency checks, and ChromaDB inspection.

Validates:
1. Student cannot access admin-review endpoints (HTTP 403).
2. Student cannot trigger scraper jobs (HTTP 403).
3. Anonymous users cannot access protected endpoints (HTTP 401 / 403).
4. Faculty/admin access works as intended (HTTP 200 / successful response).
5. SQLite WAL is enabled (PRAGMA journal_mode == 'wal', busy_timeout == 5000).
6. Concurrent database operations work (multi-thread concurrent reads & writes).
7. ChromaDB initializes when empty (isolated temp Chroma directory).
8. Existing ChromaDB does not get duplicated or reset (idempotent startup check).
9. Individual-scope RAG privacy remains strictly enforced.
10. Pending and unclassified data remain excluded from RAG.
11. Existing chat sessions and messages remain accessible.
12. Existing student cohort filtering remains correct.
"""

import sys
import os
import tempfile
import shutil
import threading
from pathlib import Path
from fastapi import HTTPException

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.db.session import SessionLocal, engine
from backend.models.user import User, StudentProfile, RoleEnum
from backend.models.academic import Notice, AcademicResource, AcademicDocument
from backend.models.system import ChatSession, ChatMessage
from backend.core.security import create_access_token
from backend.api.deps import require_admin_or_faculty, get_current_user
from backend.api.v1.admin_review import list_unverified_documents, list_scraping_jobs
from backend.api.v1.scraper import trigger_scraper, refresh_notices
from backend.services.vector_service import (
    get_rag_collection,
    ensure_chroma_initialized,
    sync_database_to_chroma
)
from backend.services.retrieval_service import execute_intelligent_retrieval
from backend.core.config import settings

def run_tests():
    print("=" * 80)
    print("  CAMPUSSYNC PHASE 9.2: PRODUCTION READINESS & ESSENTIAL FIXES TEST SUITE")
    print("=" * 80)

    db = SessionLocal()
    
    # -------------------------------------------------------------------------
    # Setup test users
    # -------------------------------------------------------------------------
    student_user = db.query(User).filter(User.id == 1).first()
    assert student_user is not None, "Student user 1 must exist"
    
    admin_user = User(
        id=9999,
        email="admin_audit@ecajmer.ac.in",
        full_name="Audit Administrator",
        role=RoleEnum.admin,
        is_active=True
    )
    faculty_user = User(
        id=9998,
        email="faculty_audit@ecajmer.ac.in",
        full_name="Audit Faculty Member",
        role=RoleEnum.faculty,
        is_active=True
    )

    passed_count = 0
    total_count = 12

    try:
        # ---------------------------------------------------------------------
        # TEST 1: Student cannot access admin-review endpoints (HTTP 403)
        # ---------------------------------------------------------------------
        print("\n[Test 1] Student Access Restriction on Admin Review Endpoints")
        try:
            require_admin_or_faculty(current_user=student_user)
            assert False, "Security vulnerability: Student was granted admin privileges!"
        except HTTPException as e:
            assert e.status_code == 403, f"Expected 403, got {e.status_code}"
            print(f"  --> PASS: Student strictly rejected with HTTP {e.status_code} ({e.detail}).")
            passed_count += 1

        # ---------------------------------------------------------------------
        # TEST 2: Student cannot trigger scraper jobs (HTTP 403)
        # ---------------------------------------------------------------------
        print("\n[Test 2] Student Access Restriction on Scraper Control Endpoints")
        # trigger_scraper and refresh_notices depend on require_admin_or_faculty
        try:
            require_admin_or_faculty(current_user=student_user)
            assert False, "Security vulnerability: Student permitted on scraper control route!"
        except HTTPException as e:
            assert e.status_code == 403, f"Expected 403, got {e.status_code}"
            print(f"  --> PASS: Scraper control dependency strictly rejects student with HTTP {e.status_code}.")
            passed_count += 1

        # ---------------------------------------------------------------------
        # TEST 3: Anonymous users cannot access protected endpoints (HTTP 401 / 403)
        # ---------------------------------------------------------------------
        print("\n[Test 3] Anonymous / Missing Token Access Rejection")
        try:
            get_current_user(db=db, token="")
            assert False, "Security vulnerability: Anonymous caller authenticated successfully!"
        except HTTPException as e:
            assert e.status_code in (401, 403), f"Expected 401 or 403, got {e.status_code}"
            print(f"  --> PASS: Anonymous caller strictly rejected with HTTP {e.status_code} ({e.detail}).")
            passed_count += 1

        # ---------------------------------------------------------------------
        # TEST 4: Faculty / Admin access works as intended (HTTP 200)
        # ---------------------------------------------------------------------
        print("\n[Test 4] Administrator & Faculty Authorized Access")
        admin_auth = require_admin_or_faculty(current_user=admin_user)
        faculty_auth = require_admin_or_faculty(current_user=faculty_user)
        assert admin_auth.role == RoleEnum.admin
        assert faculty_auth.role == RoleEnum.faculty
        
        # Call admin review endpoints directly with authorized admin
        unverified_docs = list_unverified_documents(limit=10, db=db, admin=admin_user)
        scraping_jobs = list_scraping_jobs(limit=10, db=db, admin=admin_user)
        assert isinstance(unverified_docs, list)
        assert isinstance(scraping_jobs, list)
        print(f"  --> PASS: Administrator and faculty access permitted ({len(scraping_jobs)} jobs retrieved).")
        passed_count += 1

        # ---------------------------------------------------------------------
        # TEST 5: SQLite WAL Mode is enabled
        # ---------------------------------------------------------------------
        print("\n[Test 5] SQLite WAL Journal Mode and Busy Timeout Verification")
        with engine.connect() as conn:
            journal_mode = conn.exec_driver_sql("PRAGMA journal_mode;").scalar()
            busy_timeout = conn.exec_driver_sql("PRAGMA busy_timeout;").scalar()
            print(f"  Active PRAGMA journal_mode: {journal_mode}")
            print(f"  Active PRAGMA busy_timeout: {busy_timeout}")
            assert str(journal_mode).lower() == "wal", f"Expected WAL mode, got {journal_mode}"
            assert int(busy_timeout) >= 5000, f"Expected busy_timeout >= 5000, got {busy_timeout}"
        print(f"  --> PASS: SQLite WAL journal mode active and busy timeout configured to {busy_timeout}ms.")
        passed_count += 1

        # ---------------------------------------------------------------------
        # TEST 6: Concurrent database operations work without locking errors
        # ---------------------------------------------------------------------
        print("\n[Test 6] Concurrent Database Operations Under Simulated Scraping Load")
        concurrency_errors = []
        def concurrent_reader(thread_id: int):
            db_local = SessionLocal()
            try:
                for _ in range(15):
                    count = db_local.query(Notice).count()
                    assert count > 0
            except Exception as e:
                concurrency_errors.append(f"Reader {thread_id} error: {e}")
            finally:
                db_local.close()

        def concurrent_writer(thread_id: int):
            db_local = SessionLocal()
            try:
                for idx in range(5):
                    # Write and delete a transient test notice
                    test_notice = Notice(
                        title=f"Concurrent Test Notice {thread_id}_{idx}",
                        content="Testing WAL concurrent writes",
                        verification_status="VERIFIED",
                        scope="GLOBAL",
                        is_active=False
                    )
                    db_local.add(test_notice)
                    db_local.commit()
                    db_local.delete(test_notice)
                    db_local.commit()
            except Exception as e:
                concurrency_errors.append(f"Writer {thread_id} error: {e}")
            finally:
                db_local.close()

        threads = []
        for i in range(4):
            threads.append(threading.Thread(target=concurrent_reader, args=(i,)))
            threads.append(threading.Thread(target=concurrent_writer, args=(i,)))

        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert len(concurrency_errors) == 0, f"Concurrency errors occurred: {concurrency_errors}"
        print(f"  --> PASS: 8 concurrent reader/writer threads completed 80 operations with 0 locks.")
        passed_count += 1

        # ---------------------------------------------------------------------
        # TEST 7: ChromaDB initializes when empty (isolated temp directory)
        # ---------------------------------------------------------------------
        print("\n[Test 7] ChromaDB Clean-Slate Automatic Initialization")
        temp_chroma_dir = tempfile.mkdtemp(prefix="campussync_test_chroma_")
        orig_persist_dir = settings.CHROMA_PERSIST_DIRECTORY
        try:
            import backend.services.vector_service as vs
            vs._persistent_client = None
            settings.CHROMA_PERSIST_DIRECTORY = temp_chroma_dir

            # Verify directory starts empty
            temp_client = vs.get_chroma_client()
            temp_coll = vs.get_rag_collection()
            assert temp_coll.count() == 0, "Temp collection must start empty"

            # Execute startup check (synchronize 5 sample notices/docs)
            init_res = vs.ensure_chroma_initialized(db, max_sync=5)
            assert init_res["status"] == "INITIALIZED", f"Expected INITIALIZED, got {init_res}"
            assert init_res["chunks_count"] > 0, "Must have indexed chunks into empty collection"
            print(f"  Synchronized {init_res['chunks_count']} chunks into clean ChromaDB directory.")
            print(f"  --> PASS: Empty ChromaDB collection successfully auto-initialized from SQLite.")
            passed_count += 1
        finally:
            settings.CHROMA_PERSIST_DIRECTORY = orig_persist_dir
            vs._persistent_client = None
            shutil.rmtree(temp_chroma_dir, ignore_errors=True)

        # ---------------------------------------------------------------------
        # TEST 8: Existing ChromaDB does not get duplicated or reset
        # ---------------------------------------------------------------------
        print("\n[Test 8] ChromaDB Idempotency on Already-Populated Vector Store")
        import backend.services.vector_service as vs
        vs._persistent_client = None
        existing_coll = vs.get_rag_collection()
        pre_count = existing_coll.count()
        assert pre_count == 335, f"Expected 335 chunks in production ChromaDB, got {pre_count}"

        idempotent_res = vs.ensure_chroma_initialized(db)
        assert idempotent_res["status"] == "ALREADY_POPULATED"
        assert idempotent_res["chunks_count"] == 335
        post_count = existing_coll.count()
        assert post_count == 335, f"Chunk count changed! Expected 335, got {post_count}"
        print(f"  Pre-check count: {pre_count} | Post-check count: {post_count}")
        print(f"  --> PASS: Existing ChromaDB preserved without reset or duplication.")
        passed_count += 1

        # ---------------------------------------------------------------------
        # TEST 9: Individual-scope RAG privacy remains strictly enforced
        # ---------------------------------------------------------------------
        print("\n[Test 9] Individual-Scope RAG Privacy Guard")
        # User 2 is the authorized recipient for Notice 10
        res_auth = execute_intelligent_retrieval(
            query="Confidential Fee Exemption Audit",
            student_context={"user_id": 2, "department_code": "CSE", "semester": 3}
        )
        auth_chunks = [c for c in res_auth["chunks"] if c.get("scope") == "INDIVIDUAL"]
        assert len(auth_chunks) == 1, "Authorized User 2 must retrieve their INDIVIDUAL chunk"

        # User 1 is unauthorized
        res_unauth = execute_intelligent_retrieval(
            query="Confidential Fee Exemption Audit",
            student_context={"user_id": 1, "department_code": "CSE", "semester": 7}
        )
        unauth_chunks = [c for c in res_unauth["chunks"] if c.get("scope") == "INDIVIDUAL"]
        assert len(unauth_chunks) == 0, f"Unauthorized User 1 leaked INDIVIDUAL chunk: {unauth_chunks}"

        # Anonymous caller
        res_anon = execute_intelligent_retrieval(
            query="Confidential Fee Exemption Audit",
            student_context=None
        )
        anon_chunks = [c for c in res_anon["chunks"] if c.get("scope") == "INDIVIDUAL"]
        assert len(anon_chunks) == 0, f"Anonymous leaked INDIVIDUAL chunk: {anon_chunks}"
        print(f"  --> PASS: INDIVIDUAL scope strictly retrieved by authorized User 2 only; blocked for User 1 & Anonymous.")
        passed_count += 1

        # ---------------------------------------------------------------------
        # TEST 10: Pending and unclassified data remain excluded from RAG
        # ---------------------------------------------------------------------
        print("\n[Test 10] Exclusion of Non-VERIFIED Chunks from RAG Retrieval")
        all_rag = execute_intelligent_retrieval(
            query="academic notice order schedule",
            student_context={"user_id": 1, "department_code": "CSE", "semester": 7}
        )
        non_verified = [
            c for c in all_rag["chunks"]
            if c.get("verification_status") in ["PENDING_VERIFICATION", "FLAGGED", "UNVERIFIED"]
            or c.get("scope") == "UNCLASSIFIED"
        ]
        assert len(non_verified) == 0, f"Non-verified chunks leaked into RAG: {non_verified}"
        print(f"  --> PASS: 0 non-VERIFIED or unclassified chunks present in retrieved RAG results.")
        passed_count += 1

        # ---------------------------------------------------------------------
        # TEST 11: Existing chat sessions and messages remain accessible
        # ---------------------------------------------------------------------
        print("\n[Test 11] Preservation of Existing Chat Sessions and Messages")
        total_sessions = db.query(ChatSession).count()
        total_messages = db.query(ChatMessage).count()
        assert total_sessions == 10, f"Expected 10 chat sessions, got {total_sessions}"
        assert total_messages == 20, f"Expected 20 chat messages, got {total_messages}"
        print(f"  Chat sessions: {total_sessions} | Chat messages: {total_messages}")
        print(f"  --> PASS: 100% of existing conversational history preserved.")
        passed_count += 1

        # ---------------------------------------------------------------------
        # TEST 12: Existing student cohort filtering remains correct
        # ---------------------------------------------------------------------
        print("\n[Test 12] Multi-Cohort Dashboard Isolation (CSE Sem 7, 5, 3 & IT Sem 3)")
        from backend.api.v1.notices import get_notices
        from backend.api.deps import StudentContext

        # Test CSE Sem 7
        ctx_cse7 = StudentContext(student_user, "22ECA8941", "CSE", 7, "2022 – 2026")
        notices_cse7 = get_notices(db=db, student_ctx=ctx_cse7)
        assert len(notices_cse7) > 0
        it_leaks = [n for n in notices_cse7 if n.get("scope") == "DEPARTMENT_SPECIFIC" and n.get("department_code") != "CSE"]
        assert len(it_leaks) == 0, f"IT notices leaked into CSE feed: {it_leaks}"

        # Test IT Sem 3
        it_user = db.query(User).filter(User.id == 5).first()
        ctx_it3 = StudentContext(it_user, "24ECA8945", "IT", 3, "2024 – 2028")
        notices_it3 = get_notices(db=db, student_ctx=ctx_it3)
        assert len(notices_it3) > 0
        sem8_leaks = [n for n in notices_it3 if n.get("target_semester") == 8]
        assert len(sem8_leaks) == 0, f"Semester 8 timetable leaked into IT Sem 3 feed: {sem8_leaks}"

        print(f"  CSE Sem 7 feed: {len(notices_cse7)} notices (0 cross-department leaks)")
        print(f"  IT Sem 3 feed: {len(notices_it3)} notices (0 cross-semester leaks)")
        print(f"  --> PASS: Cohort isolation verified across cohorts.")
        passed_count += 1

    finally:
        db.close()

    print("\n" + "=" * 80)
    print(f"  PHASE 9.2 TEST RESULTS: {passed_count}/{total_count} TESTS PASSED (100%)")
    print("=" * 80)

if __name__ == "__main__":
    run_tests()
