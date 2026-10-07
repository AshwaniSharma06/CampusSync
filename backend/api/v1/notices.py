from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Any

from backend.api.deps import get_db, get_current_user
from backend.models.user import User
from backend.models.academic import Notice

router = APIRouter()

@router.get("/")
def get_notices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get all notices sorted by published date.
    """
    notices = db.query(Notice).order_by(Notice.published_date.desc()).all()
    return notices
