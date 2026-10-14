from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from backend.api.deps import get_db, get_current_user
from backend.models.user import User, StudentProfile
from backend.schemas.profile import StudentProfileUpdate, StudentProfileResponse

router = APIRouter()

@router.get("/", response_model=StudentProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get current student's profile.
    """
    profile = current_user.student_profile
    if not profile:
        return StudentProfileResponse(
            email=current_user.email,
            full_name=current_user.full_name,
            profile_complete=False
        )
        
    interests_list = [i.strip() for i in profile.interests.split(',') if i.strip()] if profile.interests else []

    return StudentProfileResponse(
        email=current_user.email,
        full_name=current_user.full_name,
        student_id=profile.student_id,
        department=profile.department,
        semester=profile.semester,
        enrollment_year=profile.enrollment_year,
        interests=interests_list,
        profile_complete=bool(profile.department and profile.semester)
    )

@router.put("/", response_model=StudentProfileResponse)
def update_profile(
    profile_in: StudentProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Create or update current student's profile information.
    """
    if profile_in.full_name:
        current_user.full_name = profile_in.full_name.strip()
        db.add(current_user)

    profile = current_user.student_profile
    if not profile:
        profile = StudentProfile(user_id=current_user.id)
        db.add(profile)

    if profile_in.student_id is not None:
        profile.student_id = profile_in.student_id.strip() if profile_in.student_id else None
    if profile_in.department is not None:
        profile.department = profile_in.department.strip() if profile_in.department else None
    if profile_in.semester is not None:
        profile.semester = profile_in.semester
    if profile_in.enrollment_year is not None:
        profile.enrollment_year = profile_in.enrollment_year
    if profile_in.interests is not None:
        profile.interests = ",".join([item.strip() for item in profile_in.interests if item.strip()])

    try:
        db.commit()
        db.refresh(profile)
        db.refresh(current_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not update student profile: {str(e)}"
        )

    interests_list = [i.strip() for i in profile.interests.split(',') if i.strip()] if profile.interests else []

    return StudentProfileResponse(
        email=current_user.email,
        full_name=current_user.full_name,
        student_id=profile.student_id,
        department=profile.department,
        semester=profile.semester,
        enrollment_year=profile.enrollment_year,
        interests=interests_list,
        profile_complete=bool(profile.department and profile.semester)
    )
