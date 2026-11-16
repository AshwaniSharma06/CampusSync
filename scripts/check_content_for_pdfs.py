import sqlite3
import re

conn = sqlite3.connect('campussync.db')
c = conn.cursor()

c.execute("""
    SELECT id, title, content, raw_content, document_url, official_page_url, source_url 
    FROM notices 
    WHERE is_active = 1
""")
rows = c.fetchall()

pdf_pattern = re.compile(r'https?://[^\s<>"\']+\.pdf', re.I)
uploads_pattern = re.compile(r'/uploads/[^\s<>"\']+', re.I)

recovered_pdfs = []
no_pdf_rows = []

for r in rows:
    nid, title, content, raw, doc, page, src = r
    if doc and '.pdf' in doc.lower():
        continue # Already has a direct PDF
    
    # Search in content and raw_content
    combined_text = f"{content or ''} {raw or ''} {page or ''} {src or ''}"
    pdfs = pdf_pattern.findall(combined_text)
    uploads = uploads_pattern.findall(combined_text)
    
    all_found = pdfs + [f"https://www.ecajmer.ac.in{u}" if u.startswith('/') else u for u in uploads]
    all_found = [u for u in all_found if '.pdf' in u.lower()]
    
    if all_found:
        recovered_pdfs.append((nid, title, all_found[0]))
    else:
        no_pdf_rows.append((nid, title, page, src))

print(f"Total active notices: {len(rows)}")
print(f"Notices already with PDF: {len(rows) - len(recovered_pdfs) - len(no_pdf_rows)}")
print(f"Notices where PDF was found inside content/raw: {len(recovered_pdfs)}")
print(f"Notices with NO PDF at all: {len(no_pdf_rows)}")

print("\n--- Samples of recovered PDFs from content ---")
for rec in recovered_pdfs[:10]:
    print(f"Notice #{rec[0]}: {rec[1]} -> Found PDF: {rec[2]}")

print("\n--- Samples of notices with NO PDF ---")
for np in no_pdf_rows[:15]:
    print(f"Notice #{np[0]}: {np[1]} | Page: {np[2]} | Src: {np[3]}")

