from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlalchemy.orm import Session
import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials

from backend.db.session import SessionLocal
from backend.core.config import settings
from backend.models.user import User

# Initialize Firebase (Requires FIREBASE_CREDENTIALS path in env or initialized default)
# if not firebase_admin._apps:
#     cred = credentials.Certificate("firebase_credentials.json")
#     firebase_admin.initialize_app(cred)

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
    
    user = db.query(User).filter(User.id == int(token_data["sub"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
