import sqlite3
import re
from collections import Counter

conn = sqlite3.connect('campussync.db')
c = conn.cursor()

c.execute("""
    SELECT id, title, document_url, official_page_url, source_url, download_url 
    FROM notices 
    WHERE is_active = 1
""")
rows = c.fetchall()

print(f"Total active notices: {len(rows)}")

pdf_count = 0
non_pdf_doc = 0
no_doc = 0

invalid_urls = []
for r in rows:
    nid, title, doc, page, src, dl = r
    # Check if has real PDF
    has_pdf = False
    if doc and '.pdf' in doc.lower():
        has_pdf = True
        pdf_count += 1
    elif doc:
        non_pdf_doc += 1
    else:
        no_doc += 1

    # Check for problematic URLs
    urls_to_check = [u for u in [doc, page, src, dl] if u]
    for u in urls_to_check:
        if any(bad in u.lower() for bad in ['/departments/', '/facilities/', '/events/technotsav', '/academics/sem', '/unclassified-']):
            invalid_urls.append((nid, title, u))

print(f"Notices with PDF document_url: {pdf_count}")
print(f"Notices with non-pdf document_url: {non_pdf_doc}")
print(f"Notices with NO document_url: {no_doc}")
print(f"Notices with known 404 fake page URLs: {len(invalid_urls)}")

for inv in invalid_urls[:20]:
    print(f"Notice #{inv[0]}: {inv[1]} -> URL: {inv[2]}")
