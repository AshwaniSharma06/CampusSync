from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any

from backend.api.deps import get_db, get_current_user
from backend.models.user import User, StudentProfile

router = APIRouter()

@router.get("/")
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get current student's profile.
    """
    profile = current_user.student_profile
    if not profile:
        # Return base user data if profile is not fully created yet
        return {
            "email": current_user.email,
            "full_name": current_user.full_name,
            "profile_complete": False
        }
        
    return {
        "email": current_user.email,
        "full_name": current_user.full_name,
        "student_id": profile.student_id,
        "department": profile.department,
        "semester": profile.semester,
        "enrollment_year": profile.enrollment_year,
        "interests": profile.interests.split(',') if profile.interests else [],
        "profile_complete": True
    }
