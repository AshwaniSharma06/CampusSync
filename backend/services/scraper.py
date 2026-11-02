"""
Official Scraper Service for CampusSync.
Coordinates automated ingestion runs across verified college and university sources.
Enforces deduplication, evidence-based classification, and UNVERIFIED status.
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session

from backend.services.source_registry import get_all_active_sources
from backend.services.ingestion_service import IngestionPipeline

def scrape_btu_notices(db: Session, max_items_per_source: int = 15) -> Dict[str, Any]:
    """
    Executes a structured ingestion run across all registered official college sources.
    Each source is executed independently; a failure in one does not halt the others.
    """
    active_sources = get_all_active_sources()
    total_found = 0
    total_extracted = 0
    total_unclassified = 0
    jobs_summary = []

    for source in active_sources:
        job = IngestionPipeline.run_ingestion_for_source(
            source=source,
            db=db,
            max_items=max_items_per_source
        )
        total_found += job.items_found
        total_extracted += job.items_classified + job.items_unclassified
        total_unclassified += job.items_unclassified

        jobs_summary.append({
            "source_id": source.source_id,
            "source_name": source.name,
            "status": job.status,
            "items_found": job.items_found,
            "items_classified": job.items_classified,
            "items_unclassified": job.items_unclassified,
            "error": job.error_message
        })

    return {
        "status": "COMPLETED",
        "sources_scraped": len(active_sources),
        "total_documents_found": total_found,
        "total_documents_extracted": total_extracted,
        "total_unclassified": total_unclassified,
        "jobs": jobs_summary
    }
