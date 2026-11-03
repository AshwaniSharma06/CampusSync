"""
Executes Initial Full Historical Data Ingestion for CampusSync.
Crawls all accessible circulars, announcements, and notices from ecajmer.ac.in.
"""

import os
import sys
import json
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.db.session import SessionLocal
from backend.models.academic import Notice, AcademicDocument, AcademicResource
from backend.services.historical_ingestion_service import HistoricalIngestionEngine
from backend.services.vector_service import get_rag_collection

def run_historical_ingestion():
    print("=" * 80)
    print("  CAMPUSSYNC: INITIAL FULL HISTORICAL DATA INGESTION")
    print("  Source: Government Engineering College Ajmer (https://www.ecajmer.ac.in)")
    print("=" * 80)

    db = SessionLocal()
    try:
        initial_notices = db.query(Notice).count()
        initial_resources = db.query(AcademicResource).count()
        initial_docs = db.query(AcademicDocument).count()
        col = get_rag_collection()
        initial_chunks = col.count()

        print(f"\n[Baseline State]")
        print(f"  Existing Notices: {initial_notices}")
        print(f"  Existing Resources: {initial_resources}")
        print(f"  Existing Academic Documents: {initial_docs}")
        print(f"  ChromaDB Chunks: {initial_chunks}")

        print("\n[Starting Full Archive Crawl]")
        # Crawl up to 20 pages of circulars (approx 200-400 circulars) and 20 pages of announcements
        # to ensure deep historical ingestion without overwhelming the college server
        stats = HistoricalIngestionEngine.run_ingestion(
            db=db,
            full_historical=True,
            max_pages=20,
            index_to_ai=True
        )

        final_notices = db.query(Notice).count()
        final_resources = db.query(AcademicResource).count()
        final_docs = db.query(AcademicDocument).count()
        final_chunks = col.count()

        print("\n" + "=" * 80)
        print("  INGESTION SUMMARY RESULTS")
        print("=" * 80)
        print(f"  Pages Inspected: {stats['pages_inspected']}")
        print(f"  Total Items Found: {stats['total_found']}")
        print(f"  New Notices Inserted: {stats['new_notices_inserted']}")
        print(f"  New Academic Resources Inserted: {stats['new_resources_inserted']}")
        print(f"  Duplicates Skipped: {stats['duplicates_skipped']}")
        print(f"  Updated Records: {stats['updated_records']}")
        print(f"  Unclassified Scope Count: {stats['unclassified_count']}")
        print(f"  New AI Vector Chunks Indexed: {stats['ai_indexed_count']}")
        print(f"\n[Post-Ingestion Database State]")
        print(f"  Total Notices in Database: {final_notices} (+{final_notices - initial_notices})")
        print(f"  Total Academic Resources in Database: {final_resources} (+{final_resources - initial_resources})")
        print(f"  Total Academic Documents in Database: {final_docs} (+{final_docs - initial_docs})")
        print(f"  Total ChromaDB Chunks: {final_chunks} (+{final_chunks - initial_chunks})")

        if stats['errors']:
            print(f"\n[Errors Encountered]: {stats['errors']}")

    finally:
        db.close()

if __name__ == "__main__":
    run_historical_ingestion()

