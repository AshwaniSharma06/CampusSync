"""
CampusSync Scraper Management & Monitoring API.
Provides admin endpoints to inspect scraping status, next scheduled run,
audit history, and trigger manual ingestion or historical backfill.
"""

from fastapi import APIRouter, Depends, Query, BackgroundTasks, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from backend.api.deps import get_db, get_current_user, require_admin_or_faculty
from backend.models.user import User, RoleEnum
from backend.models.academic import Notice, ScrapingJob, AcademicDocument
from backend.services.scheduler import CampusSyncScraperScheduler

router = APIRouter()

@router.get("/status")
def get_scraper_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Returns automated scraper status, interval, next run, and database statistics.
    """
    scheduler = CampusSyncScraperScheduler.get_instance()
    scheduler_status = scheduler.get_status()

    # Query latest ScrapingJob audit rows
    recent_jobs = db.query(ScrapingJob).order_by(ScrapingJob.started_at.desc()).limit(10).all()
    jobs_summary = [
        {
            "id": j.id,
            "source_name": j.source_name,
            "status": j.status,
            "started_at": j.started_at.isoformat() if j.started_at else None,
            "completed_at": j.completed_at.isoformat() if j.completed_at else None,
            "items_found": j.items_found,
            "items_classified": j.items_classified,
            "items_unclassified": j.items_unclassified,
            "error_message": j.error_message
        }
        for j in recent_jobs
    ]

    total_notices = db.query(Notice).count()
    verified_notices = db.query(Notice).filter(Notice.verification_status == "VERIFIED").count()
    unclassified_notices = db.query(Notice).filter(Notice.scope == "UNCLASSIFIED").count()
    total_docs = db.query(AcademicDocument).count()

    return {
        "status": "success",
        "scheduler": scheduler_status,
        "database_metrics": {
            "total_notices": total_notices,
            "verified_notices": verified_notices,
            "unclassified_notices": unclassified_notices,
            "total_academic_documents": total_docs
        },
        "recent_jobs": jobs_summary
    }

@router.post("/trigger")
async def trigger_scraper(
    full_historical: bool = Query(False, description="Whether to crawl full historical archive or periodic delta"),
    max_pages: Optional[int] = Query(None, description="Maximum pages to scrape"),
    current_user: User = Depends(require_admin_or_faculty)
) -> Dict[str, Any]:
    """
    Manually triggers an immediate scraping run or full historical backfill.
    Restricted strictly to administrators and faculty members.
    Guarded against overlapping runs.
    """
    scheduler = CampusSyncScraperScheduler.get_instance()
    if scheduler.is_scraping:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A scraping job is already actively executing. Please wait for it to complete."
        )

    # Execute scrape
    result = await scheduler.execute_scrape_job(full_historical=full_historical, max_pages=max_pages)
    return {
        "status": "completed",
        "trigger_mode": "FULL_HISTORICAL" if full_historical else "PERIODIC_DELTA",
        "result": result
    }

@router.post("/refresh")
async def refresh_notices(
    current_user: User = Depends(require_admin_or_faculty)
) -> Dict[str, Any]:
    """
    Backward-compatible refresh endpoint. Triggers a delta scrape check.
    Restricted strictly to administrators and faculty members.
    """
    scheduler = CampusSyncScraperScheduler.get_instance()
    result = await scheduler.execute_scrape_job(full_historical=False, max_pages=3)
    return {
        "status": "success",
        "result": result
    }
