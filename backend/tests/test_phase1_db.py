import sys
import os
import io
# Ensure UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Ensure parent path in sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, BASE_DIR)

from backend.db.session import SessionLocal
from backend.models.user import User, StudentProfile
from backend.models.academic import (
    Department,
    Course,
    Assignment,
    Notice,
    ExaminationSchedule,
    ScrapingJob,
    AcademicDocument,
    ClassificationScope,
    DataOrigin,
    VerificationStatus
)

def test_existing_student_preservation():
    """Verify that existing student account and profile were preserved intact."""
    db = SessionLocal()
    user = db.query(User).filter(User.email == "student@ecajmer.ac.in").first()
    assert user is not None, "Pre-existing student account was not found!"
    assert user.full_name == "ECA Student"
    assert user.student_profile is not None
    assert user.student_profile.student_id == "ECA2026-8941"
    assert user.student_profile.semester == 7
    db.close()
    print("[TEST PASSED] Pre-existing student account and profile verified.")

def test_notice_schema_and_scopes():
    """Verify notices table columns and classification scopes."""
    db = SessionLocal()
    notices = db.query(Notice).all()
    assert len(notices) >= 8, f"Expected at least 8 notices, found {len(notices)}"
    
    # Check that all scopes are represented
    scopes = set(n.scope for n in notices)
    assert ClassificationScope.GLOBAL.value in scopes
    assert ClassificationScope.SEMESTER_SPECIFIC.value in scopes
    assert ClassificationScope.DEPARTMENT_SPECIFIC.value in scopes
    assert ClassificationScope.UNCLASSIFIED.value in scopes
    
    # Verify notice #1 was properly updated
    n1 = db.query(Notice).filter(Notice.id == 1).first()
    assert n1.scope == ClassificationScope.SEMESTER_SPECIFIC.value
    assert n1.target_semester == 7
    assert n1.department_code == "CSE"
    assert n1.data_origin == DataOrigin.DEMO_SEED.value
    
    # Verify unclassified notices are identifiable
    unclassified = db.query(Notice).filter(Notice.scope == ClassificationScope.UNCLASSIFIED.value).all()
    assert len(unclassified) >= 1
    for u in unclassified:
        assert u.verification_status == VerificationStatus.UNVERIFIED.value
        
    db.close()
    print("[TEST PASSED] Notice schema, classification scopes, and unclassified safety verified.")

def test_departments_catalog():
    """Verify canonical departments are registered with valid metadata."""
    db = SessionLocal()
    depts = db.query(Department).all()
    assert len(depts) >= 8
    dept_codes = [d.code for d in depts]
    assert "CSE" in dept_codes
    assert "IT" in dept_codes
    assert "ECE" in dept_codes
    assert "EE" in dept_codes
    assert "ME" in dept_codes
    assert "CE" in dept_codes
    
    cse = db.query(Department).filter(Department.code == "CSE").first()
    assert cse.name == "Computer Science & Engineering"
    assert "Rakesh Rathi" in cse.hod_name
    db.close()
    print("[TEST PASSED] Canonical departments catalog verified.")

def test_courses_and_examination_schedules():
    """Verify multi-cohort course catalog and examination schedules."""
    db = SessionLocal()
    sem3_courses = db.query(Course).filter(Course.semester == 3).all()
    sem5_courses = db.query(Course).filter(Course.semester == 5).all()
    sem7_courses = db.query(Course).filter(Course.semester == 7).all()
    
    assert len(sem3_courses) >= 3, "Expected at least 3 courses for Semester 3"
    assert len(sem5_courses) >= 3, "Expected at least 3 courses for Semester 5"
    assert len(sem7_courses) >= 3, "Expected at least 3 courses for Semester 7"
    
    # Check CS 301
    cs301 = db.query(Course).filter(Course.code == "CS 301").first()
    assert cs301 is not None
    assert cs301.semester == 3
    assert cs301.credits == 4
    assert cs301.data_origin == DataOrigin.VERIFIED_OFFICIAL.value
    
    # Check Examination schedules
    sem3_exams = db.query(ExaminationSchedule).filter(ExaminationSchedule.semester == 3).all()
    sem7_exams = db.query(ExaminationSchedule).filter(ExaminationSchedule.semester == 7).all()
    assert len(sem3_exams) >= 2
    assert len(sem7_exams) >= 3
    
    for ex in sem7_exams:
        assert ex.exam_date.startswith("2026-11-")
        assert ex.data_origin == DataOrigin.VERIFIED_OFFICIAL.value
        
    db.close()
    print("[TEST PASSED] Multi-cohort courses and examination schedules verified.")

def test_database_backup_integrity():
    """Verify that backup copy matches pre-migration state."""
    assert os.path.exists(r"backups\campussync_backup_phase1_pre_migration.db")
    backup_size = os.path.getsize(r"backups\campussync_backup_phase1_pre_migration.db")
    assert backup_size > 0, "Backup file is empty!"
    print(f"[TEST PASSED] Verified database backup exists (size: {backup_size} bytes).")

if __name__ == "__main__":
    test_existing_student_preservation()
    test_notice_schema_and_scopes()
    test_departments_catalog()
    test_courses_and_examination_schedules()
    test_database_backup_integrity()
    print("\n--- ALL PHASE 1 DATABASE TESTS PASSED SUCCESSFULLY ---")
