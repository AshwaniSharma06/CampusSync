import sqlite3
import re

conn = sqlite3.connect("campussync.db")
c = conn.cursor()

rows = c.execute("SELECT id, title, category, scope, department_code, target_semester, verification_status FROM academic_resources").fetchall()

admin_keywords = [
    r"\border\b", r"\border\s+of\b", r"\bfaculties\b", r"\bfaculty\b", 
    r"\blist\s+of\s+students\b", r"\battended\b", r"\battendance\b", 
    r"\bnotice\s+for\s+expert\b", r"\bmeeting\b", r"\bcommittee\b",
    r"\btender\b", r"\bduty\b", r"\bproctorial\b"
]

flagged_items = []
valid_academic = []

for r in rows:
    res_id, title, cat, sc, dept, sem, verif = r
    title_lower = title.lower()
    
    is_admin = False
    for pat in admin_keywords:
        if re.search(pat, title_lower):
            is_admin = True
            break
            
    if is_admin:
        flagged_items.append((res_id, title, cat, sc, dept, sem))
    else:
        valid_academic.append((res_id, title, cat, sc, dept, sem))

print(f"Total Resources: {len(rows)}")
print(f"Genuine Academic Study Materials / Syllabi / Notes: {len(valid_academic)}")
print(f"Administrative / Attendance / Notice Attachments Flagged: {len(flagged_items)}")

print("\n--- SAMPLE FLAGGED ITEMS (Administrative / Attendance) ---")
for f in flagged_items[:15]:
    print(f"[{f[0]}] {f[1][:80]}")

print("\n--- SAMPLE VALID ACADEMIC ITEMS (Study Material / Lecture Notes) ---")
for v in valid_academic[:15]:
    print(f"[{v[0]}] {v[1][:80]}")

