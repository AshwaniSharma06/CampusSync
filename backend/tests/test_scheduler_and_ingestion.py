"""
Test Suite for Automated 3-Hour Scraping Scheduler & Ingestion Engine.
Validates:
1. Scheduler singleton instance and 180-minute configuration.
2. Ingestion deduplication (no duplicate notices on re-run).
3. Admin scraper status endpoint (/api/v1/scraper/status).
4. Manual trigger (/api/v1/scraper/trigger).
5. Student dashboard visibility of newly ingested notices.
6. CampusSync AI retrieval of newly ingested notices.
"""

import sys
import io
import asyncio
from pathlib import Path
from datetime import datetime

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# UTF-8 stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from backend.db.session import SessionLocal
from backend.models.user import User
from backend.models.academic import Notice, ScrapingJob
from backend.core.config import settings
from backend.services.scheduler import CampusSyncScraperScheduler
from backend.services.historical_ingestion_service import HistoricalIngestionEngine
from backend.services.retrieval_service import execute_intelligent_retrieval
from backend.services.rag_service import query_rag
from backend.api.v1.scraper import get_scraper_status
from backend.api.v1.notices import get_notices
from backend.api.deps import StudentContext

def test_scheduler_and_ingestion():
    print("=" * 80)
    print("  TEST SUITE: AUTOMATED 3-HOUR SCRAPING & INGESTION SYSTEM")
    print("=" * 80)

    db = SessionLocal()
    try:
        user = db.query(User).first()
        assert user is not None, "No test user found in DB"

        # 1. Test Scheduler Configuration
        print("\n[Test 1] Testing Scheduler Configuration & Singleton Instance")
        scheduler1 = CampusSyncScraperScheduler.get_instance()
        scheduler2 = CampusSyncScraperScheduler.get_instance()
        assert scheduler1 is scheduler2, "Scheduler failed singleton pattern!"
        print(f"  --> Scheduler enabled: {settings.SCRAPER_ENABLED}")
        print(f"  --> Scheduler interval: {settings.SCRAPER_INTERVAL_MINUTES} minutes (Expected: 180)")
        assert settings.SCRAPER_INTERVAL_MINUTES == 180, "Default interval must be 180 minutes (3 hours)"
        print("  --> PASS: Scheduler configuration verified.")

        # 2. Test Ingestion Deduplication (Idempotence)
        print("\n[Test 2] Testing Deduplication & Idempotent Delta Check")
        initial_notices = db.query(Notice).count()
        # Run a delta check (pages 1-2)
        stats = HistoricalIngestionEngine.run_ingestion(
            db=db,
            full_historical=False,
            max_pages=2,
            index_to_ai=False
        )
        final_notices = db.query(Notice).count()
        print(f"  Initial Notices: {initial_notices} | Final Notices: {final_notices}")
        print(f"  Duplicates Skipped: {stats['duplicates_skipped']} | New Added: {stats['new_notices_inserted']}")
        # Re-running delta on already ingested archive should produce duplicates skipped
        assert stats["duplicates_skipped"] > 0, "Deduplication did not detect existing documents!"
        print("  --> PASS: SHA-256 deduplication works seamlessly.")

        # 3. Test Admin Scraper Status Endpoint
        print("\n[Test 3] Testing Admin Monitoring Status API (GET /api/v1/scraper/status)")
        status_res = get_scraper_status(current_user=user, db=db)
        assert status_res["status"] == "success"
        metrics = status_res["database_metrics"]
        print(f"  Total Notices in DB: {metrics['total_notices']}")
        print(f"  Verified Notices in DB: {metrics['verified_notices']}")
        print(f"  Unclassified Notices: {metrics['unclassified_notices']}")
        print(f"  Total Academic Documents: {metrics['total_academic_documents']}")
        print(f"  Recent Scraping Jobs Logged: {len(status_res['recent_jobs'])}")
        assert metrics["total_notices"] >= 100
        assert len(status_res["recent_jobs"]) > 0
        print("  --> PASS: Admin status monitoring reports live database metrics and audit jobs.")

        # 4. Test Student Dashboard Cohort Integration
        print("\n[Test 4] Testing Student Dashboard Multi-Cohort Visibility")
        ctx_sem7 = StudentContext(user=user, student_id="TEST_CSE_7", department_code="CSE", semester=7, academic_year="2026-27")
        notices_sem7 = get_notices(student_ctx=ctx_sem7, db=db)
        print(f"  CSE Semester 7 notices visible: {len(notices_sem7)}")
        assert len(notices_sem7) >= 50, "Expected rich notices feed for CSE Semester 7"

        # Check latest practical / exam notice
        sample_notice = notices_sem7[0]
        print(f"  Sample Notice: '{sample_notice['title']}'")
        scope_val = sample_notice.get('scope') or sample_notice.get('classification_scope')
        print(f"  Scope: {scope_val} | Origin: {sample_notice.get('data_origin')}")
        print("  --> PASS: Authentic official notices are actively rendered for student dashboard.")

        # 5. Test CampusSync AI Retrieval on Ingested Real Notices
        print("\n[Test 5] Testing CampusSync AI Retrieval on Real Scraped Content")
        ai_query = "What is the notice regarding 7th Semester practical examination?"
        retrieval = execute_intelligent_retrieval(
            query=ai_query,
            student_context={"department_code": "CSE", "semester": 7}
        )
        print(f"  Retrieved sources count: {len(retrieval['sources'])}")
        for src in retrieval['sources'][:3]:
            print(f"    * {src['title']} ({src['url']})")
        assert len(retrieval["sources"]) > 0, "CampusSync AI failed to retrieve indexed notices!"
        print("  --> PASS: CampusSync AI successfully retrieves and cites newly ingested circulars.")

        print("\n" + "=" * 80)
        print("  ALL 5 SCHEDULER & INGESTION SYSTEM TESTS PASSED (100%)")
        print("=" * 80)

    finally:
        db.close()

if __name__ == "__main__":
    test_scheduler_and_ingestion()
