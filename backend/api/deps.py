from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlalchemy.orm import Session, joinedload
import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials

from backend.db.session import SessionLocal
from backend.core.config import settings
from backend.models.user import User, StudentProfile

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = {"sub": str(payload.get("sub"))}
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    user = db.query(User).options(joinedload(User.student_profile)).filter(User.id == int(token_data["sub"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def get_optional_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False))
) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub = payload.get("sub")
        if not sub:
            return None
        return db.query(User).filter(User.id == int(sub)).first()
    except Exception:
        return None

def normalize_department_code(dept: Optional[str]) -> Optional[str]:
    """
    Normalizes varied department names to canonical college codes:
    e.g. 'Computer Science & Engineering', 'Computer Science', 'CSE' -> 'CSE'
    """
    if not dept:
        return None
    d = dept.strip().upper()
    if any(k in d for k in ["CSE", "COMPUTER"]):
        return "CSE"
    if any(k in d for k in ["IT", "INFORMATION"]):
        return "IT"
    if any(k in d for k in ["ECE", "ELECTRONIC"]):
        return "ECE"
    if any(k in d for k in ["EE", "ELECTRICAL"]):
        return "EE"
    if any(k in d for k in ["ME", "MECHANICAL"]):
        return "ME"
    if any(k in d for k in ["CE", "CIVIL"]):
        return "CE"
    if "MCA" in d:
        return "MCA"
    if "MBA" in d:
        return "MBA"
    return d

class StudentContext:
    """
    Authoritative, server-side verified student identity.
    Constructed exclusively from database state - never trusts frontend parameters.
    """
    def __init__(self, user: User, student_id: str, department_code: str, semester: int, academic_year: Optional[str]):
        self.user = user
        self.user_id = user.id
        self.student_id = student_id
        self.department_code = department_code
        self.semester = semester
        self.academic_year = academic_year

def get_current_student_context(
    current_user: User = Depends(get_current_user)
) -> StudentContext:
    """
    Enforces server-side authentication and verifies that the student
    has a complete and valid academic profile. Rejects incomplete profiles
    with HTTP 403 rather than defaulting to Semester 7 or CSE.
    """
    profile = current_user.student_profile
    if not profile or not profile.department or profile.semester is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student academic profile is incomplete. Department and semester are required to access cohort records."
        )
    
    dept_code = normalize_department_code(profile.department)
    if not dept_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unrecognized department specified in student academic profile."
        )

    # Derive academic year only from verified enrollment year; do not guess
    academic_year = None
    if profile.enrollment_year:
        academic_year = f"{profile.enrollment_year} – {profile.enrollment_year + 4}"
        
    return StudentContext(
        user=current_user,
        student_id=profile.student_id or f"ECA-{current_user.id}",
        department_code=dept_code,
        semester=int(profile.semester),
        academic_year=academic_year
    )

def require_admin_or_faculty(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Restricts access strictly to verified faculty and administrator accounts.
    Rejects student or unprivileged accounts with HTTP 403 Forbidden.
    """
    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if user_role not in ["admin", "faculty"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative or faculty privileges required. Access denied."
        )
    return current_user

