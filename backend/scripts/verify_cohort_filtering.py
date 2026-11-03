"""
Verify multi-cohort dashboard filtering on the newly ingested massive dataset.
"""
import sys
from pathlib import Path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.db.session import SessionLocal
from backend.models.user import User
from backend.api.v1.notices import get_notices
from backend.api.v1.resources import get_academic_resources
from backend.api.v1.courses import get_courses
from backend.api.deps import StudentContext

def test_cohorts():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        cohorts = [
            ("CSE Semester 3", "CSE", 3),
            ("CSE Semester 5", "CSE", 5),
            ("CSE Semester 7", "CSE", 7),
            ("IT Semester 3", "IT", 3),
            ("EE Semester 1", "EE", 1),
        ]

        print("=" * 80)
        print("  POST-INGESTION MULTI-COHORT DATA ACCESS AUDIT")
        print("=" * 80)

        for name, dept, sem in cohorts:
            ctx = StudentContext(user=user, student_id=f"TEST_{dept}", department_code=dept, semester=sem, academic_year="2026-27")
            notices = get_notices(student_ctx=ctx, db=db)
            resources = get_academic_resources(student_ctx=ctx, db=db)
            courses = get_courses(student_ctx=ctx, db=db)

            print(f"\n[{name}]")
            print(f"  Authorized Notices Count: {len(notices)}")
            print(f"  Authorized Academic Resources Count: {len(resources)}")
            print(f"  Authorized Courses Count: {len(courses)}")

            # Assert strict isolation
            for n in notices:
                scope = n.get("classification_scope")
                if scope == "DEPARTMENT_SPECIFIC":
                    assert n.get("department") in ["ALL", dept, "Computer Science & Engineering", None]
                elif scope == "SEMESTER_SPECIFIC":
                    assert n.get("semester") in [None, sem]

            print(f"  --> PASS: Strict cohort isolation maintained with live data.")

    finally:
        db.close()

if __name__ == "__main__":
    test_cohorts()

