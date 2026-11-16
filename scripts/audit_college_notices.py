import sqlite3
import json
import urllib.request
import urllib.error
import re
from collections import defaultdict

def audit():
    conn = sqlite3.connect('campussync.db')
    c = conn.cursor()
    c.execute("""
        SELECT id, title, published_date, notice_type, scope, department_code, target_semester, 
               download_url, document_url, official_page_url, source_url, verification_status, is_active
        FROM notices
        ORDER BY published_date DESC, id DESC
    """)
    rows = c.fetchall()
    print(f"Total rows in DB: {len(rows)}")

    stats = defaultdict(int)
    for r in rows:
        scope = r[4]
        v_status = r[11]
        active = r[12]
        stats[(scope, v_status, active)] += 1

    for k, v in sorted(stats.items()):
        print(f"Scope: {k[0]}, Status: {k[1]}, Active: {k[2]} -> {v} notices")

if __name__ == '__main__':
    audit()

