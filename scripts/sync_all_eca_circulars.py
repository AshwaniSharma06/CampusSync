import sqlite3
import json
import re
import os

with open('eca_latest_circulars.json', 'r', encoding='utf-8') as f:
    latest = json.load(f)

def norm(t):
    if not t:
        return ''
    return re.sub(r'[^a-zA-Z0-9]', '', t.lower())

latest_dict = {}
for item in latest:
    key = norm(item.get('title', ''))
    if key:
        latest_dict[key] = item

print(f"Loaded {len(latest)} official circulars from ECA ({len(latest_dict)} unique normalized titles).")

for db_path in ['campussync.db', 'backend/campussync.db']:
    if not os.path.exists(db_path):
        print(f"Skipping {db_path} (not found)")
        continue
    print(f"\nProcessing database: {db_path}...")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute("SELECT id, title, content, document_url, official_page_url, source_url FROM notices")
    rows = c.fetchall()

    matched_count = 0
    updated_doc_count = 0
    updated_off_count = 0

    for nid, title, content, doc_url, off_url, src_url in rows:
        ntitle = norm(title)
        new_doc_url = doc_url
        new_off_url = off_url

        if ntitle in latest_dict:
            matched_count += 1
            item = latest_dict[ntitle]
            c_content = item.get('content', '').strip()
            c_type = item.get('contentType', '')

            # If it's a PDF or link
            if c_type == 'pdf' or c_content.lower().endswith('.pdf'):
                clean_path = c_content.replace('../', '').replace('./', '').lstrip('/')
                clean_path = re.sub(r'^[Cc]ontent/', 'Content/', clean_path)
                real_pdf_url = f"https://www.ecajmer.ac.in/{clean_path}"
                if new_doc_url != real_pdf_url:
                    new_doc_url = real_pdf_url
                    updated_doc_count += 1
            elif c_type == 'link' or c_content.startswith('http'):
                # External valid link (e.g. Google form)
                if new_doc_url != c_content:
                    new_doc_url = c_content
                    updated_doc_count += 1

        # Replace any circulars / 404 / bare homepage fallbacks with latestfromeca
        if not new_off_url or 'circulars' in (new_off_url or '') or new_off_url.rstrip('/') in (
            'https://www.ecajmer.ac.in', 'http://www.ecajmer.ac.in',
            'https://ecajmer.ac.in', 'http://ecajmer.ac.in'
        ):
            new_off_url = 'https://www.ecajmer.ac.in/latestfromeca'
            updated_off_count += 1

        new_src_url = src_url
        if new_src_url and ('departments/' in new_src_url or new_src_url.rstrip('/') in (
            'https://www.ecajmer.ac.in', 'http://www.ecajmer.ac.in',
            'https://ecajmer.ac.in', 'http://ecajmer.ac.in'
        ) or 'circulars' in new_src_url):
            new_src_url = 'https://www.ecajmer.ac.in/latestfromeca'

        # Also fix any document_url that points to broken relative content or circulars
        if new_doc_url and ('/circulars' in new_doc_url and not new_doc_url.endswith('.pdf')):
            new_doc_url = None

        c.execute("""
            UPDATE notices 
            SET document_url = ?, official_page_url = ?, source_url = ?
            WHERE id = ?
        """, (new_doc_url, new_off_url, new_src_url, nid))

    # Link specific known circulars
    c.execute("UPDATE notices SET document_url = 'https://www.ecajmer.ac.in/uploads/circulars/1764306178059-Screenshot_20251128_103109_Doc Scanner.jpg' WHERE id = 260")
    c.execute("UPDATE notices SET document_url = 'https://www.ecajmer.ac.in/uploads/circulars/1770802491627-Registration for games in COMBAT 2K25 - 26.JPG' WHERE id = 199")
    c.execute("UPDATE notices SET document_url = 'https://www.ecajmer.ac.in/uploads/circulars/1770107060066-IMG_20260203_134529.jpg' WHERE id = 217")
    c.execute("UPDATE notices SET document_url = 'https://www.ecajmer.ac.in/uploads/circulars/1788594425530-ce_compressed (1).pdf', official_page_url = 'https://www.ecajmer.ac.in/latestfromeca' WHERE id = 9")
    c.execute("UPDATE notices SET document_url = 'https://www.ecajmer.ac.in/uploads/circulars/1788504608183-Notice for Internal Hackathon for SIH-2026.pdf', official_page_url = 'https://www.ecajmer.ac.in/latestfromeca' WHERE id = 3")
    c.execute("UPDATE notices SET document_url = 'https://www.ecajmer.ac.in/uploads/circulars/1792744602711-Document 6.pdf', official_page_url = 'https://www.ecajmer.ac.in/latestfromeca' WHERE id = 2")
    c.execute("UPDATE notices SET document_url = 'https://www.ecajmer.ac.in/uploads/circulars/1792146205485-Notice Fight 16 Oct 26.pdf', official_page_url = 'https://www.ecajmer.ac.in/latestfromeca' WHERE id = 8")


    # Also check the 1 missing notice: 'Notice for mini project ECE VI sem'
    c.execute("SELECT id FROM notices WHERE title LIKE '%Notice for mini project ECE VI sem%'")
    if not c.fetchone():
        c.execute("""
            INSERT INTO notices (
                title, content, notice_type, source_url, document_url, 
                published_date, scope, target_semester, department_code, 
                academic_year, verification_status, is_active, official_page_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "Notice for mini project ECE VI sem",
            "Department of Electronics and Communication Engineering notice regarding mini project submission for B.Tech Semester VI.",
            "DEPARTMENT",
            "https://www.ecajmer.ac.in/latestfromeca",
            "https://www.ecajmer.ac.in/uploads/circulars/1773660431242-Mini Project Notice.pdf",
            "2026-03-16",
            "DEPARTMENT",
            6,
            "ECE",
            "2025-26",
            "OFFICIAL",
            1,
            "https://www.ecajmer.ac.in/latestfromeca"
        ))
        print("Inserted missing circular: Notice for mini project ECE VI sem")

    conn.commit()

    # Verify counts
    c.execute("SELECT COUNT(*) FROM notices")
    total = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM notices WHERE document_url LIKE '%.pdf%'")
    pdf_count = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM notices WHERE document_url LIKE 'http%'")
    total_valid_doc = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM notices WHERE official_page_url LIKE '%circulars%'")
    broken_circ = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM notices WHERE official_page_url = 'https://www.ecajmer.ac.in/latestfromeca'")
    latest_fallbacks = c.fetchone()[0]

    print(f"Results for {db_path}:")
    print(f"  Total notices: {total}")
    print(f"  Matched with ECA API: {matched_count}")
    print(f"  Updated document_urls: {updated_doc_count}")
    print(f"  Updated official_page_urls: {updated_off_count}")
    print(f"  Notices with direct PDF links: {pdf_count}")
    print(f"  Notices with working doc/link: {total_valid_doc}")
    print(f"  Notices with broken /circulars: {broken_circ} (should be 0)")
    print(f"  Notices routed to /latestfromeca: {latest_fallbacks}")
    conn.close()
