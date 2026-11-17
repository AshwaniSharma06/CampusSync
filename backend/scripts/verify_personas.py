from backend.db.session import SessionLocal
from backend.api.deps import StudentContext
from backend.api.v1.notices import get_notices
from types import SimpleNamespace

db = SessionLocal()

personas = [
    ('Ashwani', 'CSE', 7, '23EEACS15'),
    ('Rohan', 'ME', 5, '23EEAME42'),
    ('Priya', 'CE', 3, '23EEACE11'),
    ('Amit', 'EE', 1, '23EEAEE05'),
    ('Neha', 'MCA', 2, '23EEAMCA09'),
    ('Vikram', 'MBA', 3, '23EEAMBA14'),
]

print("=" * 80)
print("CAMPUSSYNC OFFICIAL BTU SYLLABUS ISOLATION & MAPPING AUDIT")
print("=" * 80)

for name, dept, sem, roll in personas:
    user = SimpleNamespace(id=99, email=f"{name.lower()}@ecajmer.ac.in", department=dept, semester=sem, full_name=name, role="student")
    ctx = StudentContext(user=user, student_id=roll, department_code=dept, semester=sem, academic_year="2026-27")
    res = get_notices(q=None, category=None, student_ctx=ctx, db=db)
    top = res[0]
    print(f"Student: {name:7} | Dept: {dept:4} | Sem: {sem} | Roll: {roll}")
    print(f"  -> Top Pinned Notice: {top['title']}")
    print(f"  -> Pinned Badge     : {top.get('pinned_badge')}")
    print(f"  -> Official BTU PDF : {top.get('action_url')}")
    print("-" * 80)

db.close()
