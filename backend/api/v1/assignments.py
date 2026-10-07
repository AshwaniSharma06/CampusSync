from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Any

from backend.api.deps import get_db, get_current_user
from backend.models.user import User
from backend.models.academic import Assignment

router = APIRouter()

@router.get("/")
def get_assignments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    return db.query(Assignment).all()
