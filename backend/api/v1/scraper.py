from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.api.deps import get_db, get_current_user
from backend.models.user import User
from backend.services.scraper import scrape_btu_notices

router = APIRouter()

@router.post("/refresh")
def refresh_notices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Manually trigger the scraper to fetch new notices.
    """
    new_notices_count = scrape_btu_notices(db)
    
    return {
        "status": "success",
        "message": f"Scraping completed. {new_notices_count} new notices added."
    }
