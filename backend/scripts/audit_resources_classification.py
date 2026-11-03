import sqlite3

conn = sqlite3.connect("campussync.db")
c = conn.cursor()

print("--- ACADEMIC RESOURCES BREAKDOWN BY CATEGORY ---")
for r in c.execute("SELECT category, scope, verification_status, COUNT(*) FROM academic_resources GROUP BY category, scope, verification_status").fetchall():
    print(r)

print("\n--- SAMPLE TITLES IN ACADEMIC RESOURCES ---")
rows = c.execute("SELECT id, title, category, scope, department_code, target_semester, verification_status, download_url, document_url FROM academic_resources ORDER BY id LIMIT 30").fetchall()
for r in rows:
    print(f"[{r[0]}] {r[1][:60]}... | Cat: {r[2]} | Scope: {r[3]} | Dept: {r[4]} | Sem: {r[5]} | Verif: {r[6]}")

