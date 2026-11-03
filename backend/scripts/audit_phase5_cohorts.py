"""
Phase 5 Student Cohort Audit Script
"""
import sys
import os
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, os.path.abspath("."))

from backend.db.session import SessionLocal
from backend.models.academic import Course, Assignment, ExaminationSchedule, Notice, AcademicResource
from backend.models.user import User, StudentProfile

db = SessionLocal()
print("=== STUDENT PROFILES IN DB ===")
for sp in db.query(StudentProfile).all():
    u = db.query(User).filter(User.id == sp.user_id).first()
    email = u.email if u else "no_email"
    name = u.full_name if u else "no_name"
    print(f"User #{sp.user_id} ({email}): {name} | Dept: {sp.department} | Sem: {sp.semester} | StudentID: {sp.student_id}")

print("\n=== COURSES BY DEPT & SEMESTER ===")
for c in db.query(Course).all():
    print(f"Course #{c.id}: {c.code} - {c.title} | Dept: {c.department} | Sem: {c.semester}")

print("\n=== ASSIGNMENTS BY COURSE ===")
for a in db.query(Assignment).all():
    c = db.query(Course).filter(Course.id == a.course_id).first()
    c_info = f"{c.code} (Sem {c.semester} {c.department})" if c else "N/A"
    print(f"Assignment #{a.id}: {a.title} | Course: {c_info} | Due: {a.due_date}")

print("\n=== EXAMINATIONS BY DEPT & SEMESTER ===")
for e in db.query(ExaminationSchedule).all():
    print(f"Exam #{e.id}: {e.course_code} - {e.subject_name} | Dept: {e.department_code} | Sem: {e.semester} | Date: {e.exam_date}")

print("\n=== NOTICES BY SCOPE, DEPT & SEMESTER ===")
for n in db.query(Notice).all():
    print(f"Notice #{n.id}: {n.title[:30]} | Scope: {n.scope} | Dept: {n.department_code} | Sem: {n.target_semester} | Origin: {n.data_origin} | Status: {n.verification_status}")

print("\n=== ACADEMIC RESOURCES BY DEPT & SEMESTER ===")
for r in db.query(AcademicResource).all():
    print(f"Resource #{r.id}: {r.title[:30]} | Scope: {r.scope} | Dept: {r.department_code} | Sem: {r.target_semester} | Origin: {getattr(r, 'data_origin', None)} | Status: {r.verification_status}")

db.close()
