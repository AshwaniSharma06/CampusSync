import os, sys
sys.path.insert(0, os.path.abspath("."))
import sqlite3
from backend.db.session import SessionLocal
from backend.models.academic import Notice, AcademicResource, Course, VerificationStatus, ClassificationScope
from backend.api.v1.notices import get_notices
from backend.api.v1.resources import get_academic_resources
from backend.api.deps import StudentContext

db = SessionLocal()

cohorts = [
    {"user_id": 1, "dept": "CSE", "sem": 3, "label": "CSE Sem 3"},
    {"user_id": 2, "dept": "CSE", "sem": 5, "label": "CSE Sem 5"},
    {"user_id": 3, "dept": "CSE", "sem": 7, "label": "CSE Sem 7"},
    {"user_id": 4, "dept": "IT", "sem": 3, "label": "IT Sem 3"},
    {"user_id": 5, "dept": "EE", "sem": 1, "label": "EE Sem 1"},
]

from backend.models.user import User

user = db.query(User).first()

print("=== MULTI-COHORT DASHBOARD VALIDATION ===")
for c in cohorts:
    ctx = StudentContext(
        user=user,
        student_id=f"TEST_{c['dept']}_{c['sem']}",
        department_code=c["dept"],
        semester=c["sem"],
        academic_year="2026-27"
    )
    
    notices_resp = get_notices(q=None, category=None, student_ctx=ctx, db=db)
    resources_resp = get_academic_resources(student_ctx=ctx, db=db)
    
    # Check for leakage
    unclassified_notices = [n for n in notices_resp if n.get("scope") == "UNCLASSIFIED"]
    other_dept_notices = [n for n in notices_resp if n.get("scope") == "DEPARTMENT_SPECIFIC" and n.get("department_code") != c["dept"]]
    other_sem_notices = [n for n in notices_resp if n.get("scope") == "SEMESTER_SPECIFIC" and (n.get("department_code") != c["dept"] or n.get("target_semester") != c["sem"])]
    unverified_notices = [n for n in notices_resp if n.get("verification_status") != "VERIFIED"]
    
    unclassified_resources = [r for r in resources_resp if r.get("scope") == "UNCLASSIFIED"]
    other_dept_resources = [r for r in resources_resp if r.get("scope") == "DEPARTMENT_SPECIFIC" and r.get("department_code") != c["dept"]]
    other_sem_resources = [r for r in resources_resp if r.get("scope") == "SEMESTER_SPECIFIC" and (r.get("department_code") != c["dept"] or r.get("target_semester") != c["sem"])]

    print(f"\nCohort: {c['label']}")
    print(f"  Authorized Notices Returned: {len(notices_resp)}")
    print(f"  Authorized Resources Returned: {len(resources_resp)}")
    print(f"  Unclassified Notices Leaked: {len(unclassified_notices)} (Must be 0)")
    print(f"  Other Dept Notices Leaked: {len(other_dept_notices)} (Must be 0)")
    print(f"  Other Sem Notices Leaked: {len(other_sem_notices)} (Must be 0)")
    print(f"  Unverified Notices Exposed: {len(unverified_notices)} (Must be 0)")
    print(f"  Unclassified Resources Leaked: {len(unclassified_resources)} (Must be 0)")
    print(f"  Other Dept Resources Leaked: {len(other_dept_resources)} (Must be 0)")
    print(f"  Other Sem Resources Leaked: {len(other_sem_resources)} (Must be 0)")
    
    assert len(unclassified_notices) == 0, f"Leakage of unclassified notices in {c['label']}"
    assert len(other_dept_notices) == 0, f"Cross-department notice leakage in {c['label']}"
    assert len(other_sem_notices) == 0, f"Cross-semester notice leakage in {c['label']}"
    assert len(unclassified_resources) == 0, f"Leakage of unclassified resources in {c['label']}"
    assert len(other_dept_resources) == 0, f"Cross-department resource leakage in {c['label']}"
    assert len(other_sem_resources) == 0, f"Cross-semester resource leakage in {c['label']}"

print("\nALL COHORT ISOLATION AND SAFETY ASSERTIONS PASSED (100%)")
db.close()
