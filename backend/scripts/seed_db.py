import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.db.session import SessionLocal, engine, Base
from backend.models.user import User, StudentProfile, RoleEnum
from backend.models.academic import Course, Notice, NoticeType
from backend.models.social import Event, Club
from datetime import datetime, timedelta

def seed_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Check if we already seeded
    if db.query(User).first():
        print("Database already seeded!")
        return

    print("Seeding Users...")
    student = User(
        email="student@ecajmer.ac.in",
        full_name="ECA Student",
        role=RoleEnum.student
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    profile = StudentProfile(
        user_id=student.id,
        student_id="ECA2026-8941",
        department="Computer Science",
        semester=7,
        enrollment_year=2022,
        interests="AI, Machine Learning, Web Development"
    )
    db.add(profile)
    
    print("Seeding Courses...")
    course1 = Course(code="CS 401", title="Database Management Systems", instructor="Dr. Robert Vance", department="CSE", semester=7)
    course2 = Course(code="CS 402", title="Machine Learning", instructor="Prof. Elena Rostova", department="CSE", semester=7)
    db.add_all([course1, course2])

    print("Seeding Notices...")
    notice = Notice(
        title="Mid-Term Examination Schedule Released",
        content="The schedule for Semester 7 mid-term examinations has been released on the portal.",
        notice_type=NoticeType.official
    )
    db.add(notice)
    
    print("Seeding Clubs and Events...")
    club = Club(name="Technotsav & PCC Club", description="Premier coding club of ECA.", location="CS Lab")
    db.add(club)
    
    event = Event(
        title="Hackathon 2026",
        description="Annual 24-hour coding challenge.",
        category="Technical",
        event_date=datetime.utcnow() + timedelta(days=14),
        location="ECA Open Air Theatre"
    )
    db.add(event)
    
    db.commit()
    print("Database seeded successfully!")

if __name__ == "__main__":
    seed_db()
