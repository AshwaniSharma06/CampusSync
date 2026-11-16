from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List, Optional
from pydantic import BaseModel

from backend.api.deps import get_db, get_current_user
from backend.models.user import User
from backend.models.social import SavedItem

router = APIRouter()

class SavedItemCreate(BaseModel):
    item_type: str = "notice"
    item_id: int

@router.get("", include_in_schema=False)
@router.get("/")
def get_saved_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Retrieve all saved/bookmarked notices, documents, and resources for the authenticated student.
    """
    items = db.query(SavedItem).filter(SavedItem.user_id == current_user.id).all()
    return [
        {
            "id": s.id,
            "item_type": s.item_type,
            "item_id": s.item_id,
            "saved_at": s.saved_at.isoformat() if s.saved_at else None
        }
        for s in items
    ]

@router.post("", include_in_schema=False)
@router.post("/")
def toggle_saved_item(
    item_in: SavedItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Toggle saving/bookmarking an item for later review.
    """
    existing = db.query(SavedItem).filter(
        SavedItem.user_id == current_user.id,
        SavedItem.item_type == item_in.item_type,
        SavedItem.item_id == item_in.item_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {
            "status": "removed",
            "is_saved": False,
            "item_type": item_in.item_type,
            "item_id": item_in.item_id
        }
    else:
        new_item = SavedItem(
            user_id=current_user.id,
            item_type=item_in.item_type,
            item_id=item_in.item_id
        )
        db.add(new_item)
        db.commit()
        return {
            "status": "saved",
            "is_saved": True,
            "item_type": item_in.item_type,
            "item_id": item_in.item_id
        }
