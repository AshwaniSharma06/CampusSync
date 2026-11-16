"""
Reconcile Cohort Tagging & Multi-Cohort Notice Accessibility
Ensures authentic ECA notices for multi-department computing branches (CSE, IT, Cyber)
and multi-semester examinations/practicals are accurately categorized and accessible
to students based on their profile.
"""
import sqlite3
import re
import os

DB_PATHS = ['campussync.db', 'backend/campussync.db', '/data/campussync.db']

def extract_semesters(title):
    t = title.lower()
    sems = set()
    if re.search(r'3rd\s*,\s*5th\s*(?:and|&)\s*7th', t) or re.search(r'3rd\s*,\s*5th\s*&\s*7th', t):
        return {3, 5, 7}
    if re.search(r'3rd\s*(?:and|&)\s*5th', t):
        return {3, 5}
    if re.search(r'v\s*(?:and|&)\s*vii', t):
        return {5, 7}
    if re.search(r'iiird\s*,\s*vth\s*,\s*viith', t) or re.search(r'iii\s*,\s*v\s*(?:and|&)\s*vii', t):
        return {3, 5, 7}
    if re.search(r'ii\s*,\s*iv\s*(?:and|&)\s*vi', t):
        return {2, 4, 6}
    
    sem_patterns = [
        (1, r'\b(1st|ist|first)\s*(?:sem|semester)\b'),
        (2, r'\b(2nd|iind|second)\s*(?:sem|semester)\b'),
        (3, r'\b(3rd|iiird|third)\s*(?:sem|semester)\b'),
        (4, r'\b(4th|ivth|fourth)\s*(?:sem|semester)\b'),
        (5, r'\b(5th|vth|fifth)\s*(?:sem|semester)\b'),
        (6, r'\b(6th|vith|sixth)\s*(?:sem|semester)\b'),
        (7, r'\b(7th|viith|seventh)\s*(?:sem|semester)\b'),
        (8, r'\b(8th|viiith|eighth)\s*(?:sem|semester)\b'),
        (1, r'\bsem(?:ester)?\s*(?:1|i)\b'),
        (2, r'\bsem(?:ester)?\s*(?:2|ii)\b'),
        (3, r'\bsem(?:ester)?\s*(?:3|iii)\b'),
        (4, r'\bsem(?:ester)?\s*(?:4|iv)\b'),
        (5, r'\bsem(?:ester)?\s*(?:5|v)\b'),
        (6, r'\bsem(?:ester)?\s*(?:6|vi)\b'),
        (7, r'\bsem(?:ester)?\s*(?:7|vii)\b'),
        (8, r'\bsem(?:ester)?\s*(?:8|viii)\b'),
    ]
    for s_num, pat in sem_patterns:
        if re.search(pat, t):
            sems.add(s_num)
    return sems

def is_exam_notice(title):
    t = title.lower()
    return any(k in t for k in [
        'mid term', 'midterm', 'practical', 'time table', 'timetable', 
        'exam', 'viva', 'duty chart', 'seating arrangement', 'back exam', 
        'exam form', 'admit card', 'project-1', 'project-2', 'project 1', 'project 2'
    ])

def reconcile_database(db_path):
    if not os.path.exists(db_path):
        print(f"Skipping {db_path} (does not exist)")
        return
    print(f"\n--- Reconciling notices in {db_path} ---")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute("""
        SELECT id, title, scope, department_code, target_semester, notice_type 
        FROM notices 
        WHERE id > 12 AND is_active = 1
    """)
    rows = c.fetchall()

    updated = 0
    for nid, title, scope, dept, sem, ntype in rows:
        sems = extract_semesters(title)
        new_scope = scope
        new_dept = dept
        new_sem = sem
        new_type = ntype

        # 1. Update Notice Type for examinations, midterms, timetables
        if is_exam_notice(title):
            new_type = 'Examination'

        # 2. Check joint computing notices
        is_joint_computing = bool(re.search(
            r'\b(CE,?\s*IT|CS,?\s*IT|CSE,?\s*IT|CS-A|CS-B|Cyber|Computer Engineering|CSE|Information Technology)\b', 
            title, 
            re.IGNORECASE
        ))

        # 3. BTU institution-wide exam notices
        is_btu_general = bool(re.search(r'\b(BTU|B\.Tech|Registration Schedule All Student)\b', title, re.IGNORECASE))

        # 4. Determine Semester & Scope
        if sems:
            new_scope = 'SEMESTER_SPECIFIC'
            # If 7 is in the set, prioritize 7 (or max semester) so Sem 7 students match directly
            if 7 in sems:
                new_sem = 7
            elif sem in sems:
                new_sem = sem
            else:
                new_sem = sorted(list(sems))[-1]

            if is_btu_general and not is_joint_computing:
                new_dept = None  # Applies to all departments of that semester
            elif is_joint_computing and dept not in ['CSE', 'IT']:
                new_dept = 'CSE'
        else:
            if is_joint_computing:
                new_scope = 'DEPARTMENT_SPECIFIC'
                if dept not in ['CSE', 'IT']:
                    new_dept = 'CSE'
            elif scope == 'UNCLASSIFIED' or scope is None or scope == 'DEPARTMENT':
                new_scope = 'GLOBAL'
                new_type = new_type or 'Official'

        # Specific user-reported notice rules:
        # Notice 23: Practical Time Table for B.Tech 3rd, 5th and 7th Sem CS, IT & Cyber
        if nid == 23:
            new_scope = 'SEMESTER_SPECIFIC'
            new_sem = 7
            new_dept = 'CSE'
            new_type = 'Examination'
        # Notice 27: 7th Semester CE, IT and Cyber 2nd Mid Term 2026-27
        elif nid == 27:
            new_scope = 'SEMESTER_SPECIFIC'
            new_sem = 7
            new_dept = 'CSE'
            new_type = 'Examination'
        # Notice 24: B.Tech 3rd and 5th Sem (CS-A & CS-B), IT and Cyber 2nd Mid-Term Exam 2026 MAIN
        elif nid == 24:
            new_scope = 'SEMESTER_SPECIFIC'
            new_sem = 5
            new_dept = 'CSE'
            new_type = 'Examination'
        # Notice 76: 1st Mid Term Time Table (2026-27) of 7th Semester CE, IT and Cyber
        elif nid == 76:
            new_scope = 'SEMESTER_SPECIFIC'
            new_sem = 7
            new_dept = 'CSE'
            new_type = 'Examination'
        # Notice 67: BTU Exam Form V and VII
        elif nid == 67:
            new_scope = 'SEMESTER_SPECIFIC'
            new_sem = 7
            new_dept = None
            new_type = 'Examination'

        if (new_scope != scope or new_dept != dept or new_sem != sem or new_type != ntype):
            c.execute("""
                UPDATE notices 
                SET scope = ?, department_code = ?, target_semester = ?, notice_type = ? 
                WHERE id = ?
            """, (new_scope, new_dept, new_sem, new_type, nid))
            updated += 1

    conn.commit()
    print(f"Updated {updated} notices in {db_path}")

    # Verify Notice 23 and 27
    c.execute("SELECT id, title, scope, department_code, target_semester, notice_type FROM notices WHERE id IN (23, 27)")
    for r in c.fetchall():
        print("  Verified Notice:", r)

    conn.close()

if __name__ == '__main__':
    for p in DB_PATHS:
        reconcile_database(p)

