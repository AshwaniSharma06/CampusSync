import sqlite3

def run_audit():
    conn = sqlite3.connect("campussync.db")
    c = conn.cursor()

    print("=== NOTICES BREAKDOWN ===")
    rows = c.execute("SELECT data_origin, verification_status, scope, COUNT(*) FROM notices GROUP BY data_origin, verification_status, scope").fetchall()
    for r in rows:
        print(r)

    print("\n=== TOTAL NOTICES ===")
    print("Total:", c.execute("SELECT COUNT(*) FROM notices").fetchone()[0])

    print("\n=== ACADEMIC RESOURCES BREAKDOWN ===")
    rows = c.execute("SELECT data_origin, verification_status, scope, COUNT(*) FROM academic_resources GROUP BY data_origin, verification_status, scope").fetchall()
    for r in rows:
        print(r)

    print("\n=== TOTAL RESOURCES ===")
    print("Total:", c.execute("SELECT COUNT(*) FROM academic_resources").fetchone()[0])

    print("\n=== ACADEMIC DOCUMENTS BREAKDOWN ===")
    rows = c.execute("SELECT data_origin, verification_status, scope, COUNT(*) FROM academic_documents GROUP BY data_origin, verification_status, scope").fetchall()
    for r in rows:
        print(r)

    print("\n=== SNO / TITLE PREFIXES OR SOURCES IN NOTICES ===")
    hero = c.execute("SELECT COUNT(*) FROM notices WHERE title LIKE '%hero%' OR content LIKE '%hero%' OR source_url LIKE '%hero%'").fetchone()[0]
    print("Notices with 'hero' in title/content/source_url:", hero)

    scraped = c.execute("SELECT COUNT(*) FROM notices WHERE data_origin = 'SCRAPED'").fetchone()[0]
    print("Notices with data_origin='SCRAPED':", scraped)

    demo = c.execute("SELECT COUNT(*) FROM notices WHERE data_origin != 'SCRAPED'").fetchone()[0]
    print("Notices with data_origin!='SCRAPED':", demo)

    print("\n=== SCRAPING JOBS HISTORY ===")
    jobs = c.execute("SELECT id, source_name, started_at, completed_at, status, items_found, items_classified, items_unclassified, error_message FROM scraping_jobs ORDER BY id").fetchall()
    for j in jobs:
        print(j)

if __name__ == "__main__":
    run_audit()
