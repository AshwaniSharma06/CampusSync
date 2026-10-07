from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from firebase_admin import auth as firebase_auth
from pydantic import BaseModel

from backend.api.deps import get_db
from backend.core.security import create_access_token
from backend.models.user import User

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    firebase_token: str

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Verify Firebase token and issue a JWT for our API session.
    """
    try:
        # Verify the firebase token
        decoded_token = firebase_auth.verify_id_token(request.firebase_token)
        uid = decoded_token.get('uid')
        email = decoded_token.get('email')
        
        if not uid or not email:
            raise HTTPException(status_code=400, detail="Invalid Firebase Token payload")
            
        # Find user or create if they don't exist yet
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Create user dynamically on first login
            user = User(
                email=email,
                firebase_uid=uid,
                full_name=decoded_token.get('name', 'CampusSync User')
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        elif not user.firebase_uid:
            # Link firebase uid to existing user seeded in db
            user.firebase_uid = uid
            db.commit()

        # Generate our JWT
        access_token = create_access_token(subject=user.id)
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
