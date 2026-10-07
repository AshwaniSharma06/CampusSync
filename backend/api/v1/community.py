from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Any

from backend.api.deps import get_db, get_current_user
from backend.models.user import User
from backend.models.social import CommunityPost

router = APIRouter()

@router.get("/")
def get_community_posts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    return db.query(CommunityPost).order_by(CommunityPost.created_at.desc()).all()
