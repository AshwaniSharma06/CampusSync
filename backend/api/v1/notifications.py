from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Any

from backend.api.deps import get_db, get_current_user
from backend.models.user import User
from backend.models.system import Notification

router = APIRouter()

@router.get("/")
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()
