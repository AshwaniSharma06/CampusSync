from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Any, Optional

from backend.api.deps import get_db, get_current_user
from backend.models.user import User
from backend.models.academic import Notice

router = APIRouter()

@router.get("/")
def get_notices(
    q: Optional[str] = Query(None, description="Search query for notice title or content"),
    category: Optional[str] = Query(None, description="Filter by notice category"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get all notices sorted by published date, with optional search and filtering.
    """
    query = db.query(Notice)
    
    if q:
        query = query.filter(
            Notice.title.ilike(f"%{q}%") | Notice.content.ilike(f"%{q}%")
        )
    
    if category and category.lower() != "all":
        query = query.filter(Notice.notice_type == category)
        
    notices = query.order_by(Notice.published_date.desc()).all()
    return notices
