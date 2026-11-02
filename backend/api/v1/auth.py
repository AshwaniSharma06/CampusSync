from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from firebase_admin import auth as firebase_auth

from backend.api.deps import get_db, get_current_user
from backend.core.security import create_access_token, verify_password, get_password_hash
from backend.models.user import User, StudentProfile, RoleEnum

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[dict[str, Any]] = None

class LoginRequest(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    firebase_token: Optional[str] = None

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    student_id: Optional[str] = None
    department: Optional[str] = "Computer Engineering (CSE)"
    semester: Optional[int] = 7
    session: Optional[str] = "2022 – 2026 (Final Year Batch)"
    program: Optional[str] = "B.Tech (Regular 4-Year)"
    admission_category: Optional[str] = "GAS (Government Aided Seat)"

def format_user_profile(user: User) -> dict[str, Any]:
    prof = user.student_profile
    return {
        "id": user.id,
        "name": user.full_name,
        "email": user.email,
        "studentId": prof.student_id if prof and prof.student_id else "22ECA8941",
        "department": prof.department if prof and prof.department else "Computer Engineering (CSE)",
        "semester": prof.semester if prof and prof.semester else 7,
        "session": "2022 – 2026",
        "enrollment_year": prof.enrollment_year if prof and prof.enrollment_year else 2022,
        "role": user.role.value if hasattr(user.role, "value") else str(user.role)
    }

@router.post("/register", response_model=Token)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new student account with email, password, and ECA academic details.
    """
    email_clean = request.email.strip().lower()
    
    # Check if user already exists
    existing = db.query(User).filter(User.email.ilike(email_clean)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in instead."
        )

    # Hash password
    hashed = get_password_hash(request.password)

    # Create User
    new_user = User(
        email=email_clean,
        hashed_password=hashed,
        full_name=request.full_name.strip(),
        role=RoleEnum.student
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create associated StudentProfile
    enrollment_year = 2022
    if request.session:
        try:
            enrollment_year = int(request.session[:4])
        except Exception:
            enrollment_year = 2022

    profile = StudentProfile(
        user_id=new_user.id,
        student_id=request.student_id.strip() if request.student_id else f"22ECA{new_user.id:03d}",
        department=request.department or "Computer Engineering (CSE)",
        semester=request.semester or 7,
        enrollment_year=enrollment_year,
        interests=f"Program: {request.program or 'B.Tech'}; Category: {request.admission_category or 'GAS'}"
    )
    db.add(profile)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(subject=new_user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": format_user_profile(new_user)
    }

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate a student: supports standard Email/Password credentials as well as Firebase Token.
    """
    # 1. Email + Password direct authentication
    if request.email and request.password:
        email_clean = request.email.strip().lower()
        user = db.query(User).filter(User.email.ilike(email_clean)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No registered account found with this email. Please sign up first."
            )

        # Validate password if hashed_password exists
        if user.hashed_password:
            if not verify_password(request.password, user.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect password. Please verify your credentials and try again."
                )

        access_token = create_access_token(subject=user.id)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": format_user_profile(user)
        }

    # 2. Firebase token authentication
    if request.firebase_token:
        try:
            decoded_token = firebase_auth.verify_id_token(request.firebase_token)
            uid = decoded_token.get('uid')
            email = decoded_token.get('email')
            
            if not uid or not email:
                raise HTTPException(status_code=400, detail="Invalid Firebase Token payload")
                
            user = db.query(User).filter(User.email.ilike(email.lower())).first()
            if not user:
                user = User(
                    email=email.lower(),
                    firebase_uid=uid,
                    full_name=decoded_token.get('name', 'CampusSync User')
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            elif not user.firebase_uid:
                user.firebase_uid = uid
                db.commit()

            access_token = create_access_token(subject=user.id)
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": format_user_profile(user)
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Firebase authentication error: {str(e)}"
            )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Please provide email & password or valid authentication token."
    )

@router.get("/me")
def get_current_authenticated_user(current_user: User = Depends(get_current_user)):
    """
    Get current logged in user details and profile.
    """
    return format_user_profile(current_user)
