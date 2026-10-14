from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Any, Optional

from backend.api.deps import get_db, get_optional_current_user
from backend.models.user import User
from backend.services.recommendation_service import RecommendationEngine

router = APIRouter()

@router.get("/")
def get_recommendations(
    department: Optional[str] = Query(None, description="Student branch/department"),
    semester: Optional[int] = Query(None, description="Student semester"),
    interests: Optional[str] = Query(None, description="Comma-separated student interests"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get personalized recommendations and alerts tailored to student's profile.
    Supports authenticated user context or custom query parameters.
    """
    parsed_interests = [i.strip() for i in interests.split(",")] if interests else None
    return RecommendationEngine.get_student_recommendations(
        db=db,
        current_user=current_user,
        department=department,
        semester=semester,
        interests=parsed_interests
    )
