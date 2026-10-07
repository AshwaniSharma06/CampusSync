from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Any

from backend.api.deps import get_db, get_current_user
from backend.models.user import User

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get metrics for the student dashboard.
    """
    # Using mock metrics logic right now
    return {
        "pending_assignments": 2,
        "unread_notices": 3,
        "upcoming_classes": 4,
        "cgpa": 8.5
    }
