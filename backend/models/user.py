from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from backend.db.session import Base

class RoleEnum(str, enum.Enum):
    student = "student"
    faculty = "faculty"
    admin = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True) # Nullable if using Firebase exclusively
    firebase_uid = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.student)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False)
    saved_items = relationship("SavedItem", back_populates="user")
    community_posts = relationship("CommunityPost", back_populates="author")
    notifications = relationship("Notification", back_populates="user")
    chat_sessions = relationship("ChatSession", back_populates="user")

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    student_id = Column(String, unique=True, index=True) # e.g. ECA2026-8941
    department = Column(String)
    semester = Column(Integer)
    enrollment_year = Column(Integer)
    interests = Column(String) # Comma separated or JSON
    
    user = relationship("User", back_populates="student_profile")
