from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from backend.db.session import Base

class NoticeType(str, enum.Enum):
    official = "Official"
    department = "Department"
    events = "Events"
    academic = "Academic"
    examination = "Examination"

class ClassificationScope(str, enum.Enum):
    GLOBAL = "GLOBAL"                        # Relevant to all students (e.g. library, sports, general holidays)
    DEPARTMENT_SPECIFIC = "DEPARTMENT_SPECIFIC"# Relevant to an entire department (e.g. CSE faculty notice)
    SEMESTER_SPECIFIC = "SEMESTER_SPECIFIC"  # Relevant to a specific semester in a department
    SUBJECT_SPECIFIC = "SUBJECT_SPECIFIC"    # Relevant to a specific course/subject
    INDIVIDUAL = "INDIVIDUAL"                # Private student-specific (requires authorized student ID)
    UNCLASSIFIED = "UNCLASSIFIED"            # Ambiguous/pending review - hidden from student dashboards

class DataOrigin(str, enum.Enum):
    SCRAPED = "SCRAPED"                      # Collected from college portal scraper
    VERIFIED_OFFICIAL = "VERIFIED_OFFICIAL"  # Official ECA / BTU verified data
    DEMO_SEED = "DEMO_SEED"                  # Synthetic test data for validation

class VerificationStatus(str, enum.Enum):
    VERIFIED = "VERIFIED"
    UNVERIFIED = "UNVERIFIED"
    FLAGGED = "FLAGGED"

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False) # e.g. CSE, IT, ECE, EE, ME, CE, MCA, MBA
    name = Column(String(100), nullable=False)                         # e.g. Computer Science & Engineering
    hod_name = Column(String(100), nullable=True)                      # e.g. Dr. Rakesh Rathi
    building_block = Column(String(100), nullable=True)                # e.g. Barliya Academic Block
    created_at = Column(DateTime, default=datetime.utcnow)

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)
    title = Column(String(150), nullable=False)
    instructor = Column(String(100))
    department = Column(String(50))   # e.g. "CSE"
    semester = Column(Integer)        # e.g. 1 to 8
    credits = Column(Integer, default=3)
    syllabus_summary = Column(Text, nullable=True)
    data_origin = Column(String(30), default="VERIFIED_OFFICIAL")
    
    assignments = relationship("Assignment", back_populates="course")
    exam_schedules = relationship("ExaminationSchedule", back_populates="course")

class Assignment(Base):
    __tablename__ = "assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text)
    due_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    data_origin = Column(String(30), default="VERIFIED_OFFICIAL")
    
    course = relationship("Course", back_populates="assignments")

class Notice(Base):
    __tablename__ = "notices"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(250), nullable=False)
    content = Column(Text, nullable=False)
    notice_type = Column(String(50), default="Official")
    source_url = Column(String(500), nullable=True)
    document_url = Column(String(500), nullable=True)
    published_date = Column(DateTime, default=datetime.utcnow)
    
    # Classification & Filtering Attributes (Phase 1)
    scope = Column(String(50), default="GLOBAL")                   # GLOBAL, DEPARTMENT_SPECIFIC, SEMESTER_SPECIFIC, etc.
    target_semester = Column(Integer, nullable=True)               # e.g. 3, 5, 7
    department_code = Column(String(20), nullable=True)            # e.g. CSE, IT
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # For INDIVIDUAL notices
    academic_year = Column(String(20), default="2026-27")
    raw_content = Column(Text, nullable=True)                      # Preserves unparsed original raw text
    content_hash = Column(String(64), nullable=True, index=True)   # SHA-256 for deduplication
    data_origin = Column(String(30), default="VERIFIED_OFFICIAL")  # SCRAPED, VERIFIED_OFFICIAL, DEMO_SEED
    verification_status = Column(String(30), default="VERIFIED")   # VERIFIED, UNVERIFIED, FLAGGED
    is_active = Column(Boolean, default=True)

class ExaminationSchedule(Base):
    __tablename__ = "examination_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    course_code = Column(String(20), nullable=False)
    subject_name = Column(String(150), nullable=False)
    department_code = Column(String(20), nullable=False)           # e.g. "CSE"
    semester = Column(Integer, nullable=False)                     # 1 to 8
    exam_type = Column(String(50), default="Mid-Term I")           # Mid-Term I, Mid-Term II, End-Term, Practical
    exam_date = Column(String(30), nullable=False)                 # e.g. "2026-11-12"
    start_time = Column(String(20), nullable=True)                 # e.g. "10:00 AM"
    end_time = Column(String(20), nullable=True)                   # e.g. "12:00 PM"
    exam_hall = Column(String(100), nullable=True)                 # e.g. "Exam Hall A"
    academic_session = Column(String(50), default="Fall 2026")
    data_origin = Column(String(30), default="VERIFIED_OFFICIAL")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    course = relationship("Course", back_populates="exam_schedules")

class ScrapingJob(Base):
    __tablename__ = "scraping_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String(100), nullable=False)              # e.g. "ECA Official Notices Portal"
    source_url = Column(String(500), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(30), default="PENDING")                 # PENDING, RUNNING, SUCCESS, FAILED
    items_found = Column(Integer, default=0)
    items_classified = Column(Integer, default=0)
    items_unclassified = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)

class AcademicDocument(Base):
    __tablename__ = "academic_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(250), nullable=False)
    document_type = Column(String(50), default="NOTICE")           # NOTICE, SYLLABUS, TIMETABLE, CIRCULAR
    file_url = Column(String(500), nullable=True)
    source_url = Column(String(500), nullable=True)
    scope = Column(String(50), default="UNCLASSIFIED")             # GLOBAL, DEPARTMENT_SPECIFIC, etc.
    department_code = Column(String(20), nullable=True)
    target_semester = Column(Integer, nullable=True)
    academic_year = Column(String(20), default="2026-27")
    raw_text = Column(Text, nullable=True)
    cleaned_text = Column(Text, nullable=True)
    content_hash = Column(String(64), nullable=True, index=True)
    is_vectorized = Column(Boolean, default=False)
    data_origin = Column(String(30), default="SCRAPED")
    verification_status = Column(String(30), default="UNVERIFIED")
    created_at = Column(DateTime, default=datetime.utcnow)

class AcademicResource(Base):
    __tablename__ = "academic_resources"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String)
    file_url = Column(String, nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
