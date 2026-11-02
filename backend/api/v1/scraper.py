from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from backend.api.deps import get_db, get_current_user
from backend.models.user import User
from backend.services.scraper import scrape_btu_notices

router = APIRouter()

@router.post("/refresh")
def refresh_notices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Manually trigger structured ingestion from verified official college portals.
    All newly scraped records are stored as UNVERIFIED.
    """
    result = scrape_btu_notices(db)
    return {
        "status": "success",
        "result": result
    }
