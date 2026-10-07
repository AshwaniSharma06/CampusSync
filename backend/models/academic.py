from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from backend.db.session import Base

class NoticeType(str, enum.Enum):
    official = "Official"
    department = "Department"
    events = "Events"

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    instructor = Column(String)
    department = Column(String)
    semester = Column(Integer)
    
    assignments = relationship("Assignment", back_populates="course")

class Assignment(Base):
    __tablename__ = "assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    title = Column(String, nullable=False)
    description = Column(Text)
    due_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    course = relationship("Course", back_populates="assignments")

class Notice(Base):
    __tablename__ = "notices"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    notice_type = Column(Enum(NoticeType), default=NoticeType.official)
    source_url = Column(String, nullable=True)
    document_url = Column(String, nullable=True)
    published_date = Column(DateTime, default=datetime.utcnow)
    
class AcademicResource(Base):
    __tablename__ = "academic_resources"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String)
    file_url = Column(String, nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
