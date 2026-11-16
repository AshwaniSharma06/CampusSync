import sqlite3
import re
from urllib.parse import urlparse

def fix_database():
    conn = sqlite3.connect('campussync.db')
    c = conn.cursor()

    c.execute("SELECT id, title, content, raw_content, document_url, official_page_url, source_url FROM notices")
    rows = c.fetchall()

    pdf_pattern = re.compile(r'https?://[^\s<>"\']+\.pdf', re.I)
    uploads_pattern = re.compile(r'/(?:\.\./)?(?:uploads|content)/[^\s<>"\']+\.pdf', re.I)

    updated_count = 0
    pdf_recovered = 0
    demo_fixed = 0

    # Known authentic real replacements for demo seeds 1-7
    demo_replacements = {
        1: ("https://www.ecajmer.ac.in/uploads/circulars/1793693243432-DOC-20261103-WA0012.pdf", "https://www.ecajmer.ac.in/latestfromeca"),
        2: (None, "https://www.ecajmer.ac.in/latestfromeca"),
        3: (None, "https://www.ecajmer.ac.in/latestfromeca"),
        4: ("https://www.ecajmer.ac.in/uploads/circulars/1792744602711-Document%206.pdf", "https://www.ecajmer.ac.in/latestfromeca"), # PCC coding club
        5: ("https://www.ecajmer.ac.in/uploads/circulars/1793247267504-BTU%20-%20Circular%20for%20B.Tech.%20III%20Sem%20(Main%20and%20Back%20Exam)%20Session%202026-27%20(Last%20date%2001.11.2026%20with%20single%20fee).pdf", "https://www.ecajmer.ac.in/latestfromeca"),
        6: ("https://www.ecajmer.ac.in/uploads/circulars/1792051462442-Document%20275_compressed.pdf", "https://www.ecajmer.ac.in/latestfromeca"),
        7: ("https://www.ecajmer.ac.in/uploads/circulars/1791965057390-Document%20274.pdf", "https://www.ecajmer.ac.in/latestfromeca"), # 7th sem project demonstration
        8: (None, "https://www.ecajmer.ac.in/latestfromeca"),
        9: (None, "https://www.ecajmer.ac.in/latestfromeca"),
        10: (None, "https://www.ecajmer.ac.in/latestfromeca"),
        11: (None, "https://www.ecajmer.ac.in/latestfromeca"),
        12: (None, "https://www.ecajmer.ac.in/latestfromeca"),
    }

    def is_bad_url(u):
        if not u:
            return True
        clean = u.lower().rstrip('/')
        if clean in ('https://www.ecajmer.ac.in', 'http://www.ecajmer.ac.in', 'https://ecajmer.ac.in', 'http://ecajmer.ac.in'):
            return True
        return any(b in clean for b in ['/departments/', '/facilities/', '/academics/examinations', '/academics/sem', '/academics/cse', '/events/technotsav', '/notices/unclassified'])

    def normalize_doc_url(u):
        if not u:
            return None
        clean = u.strip()
        # Fix /../Content/ -> https://www.ecajmer.ac.in/Content/
        clean = re.sub(r'https?://(?:www\.)?ecajmer\.ac\.in/\.\./content/', 'https://www.ecajmer.ac.in/Content/', clean, flags=re.I)
        clean = re.sub(r'https?://(?:www\.)?ecajmer\.ac\.in/\./content/', 'https://www.ecajmer.ac.in/Content/', clean, flags=re.I)
        clean = re.sub(r'^/\.\./content/', 'https://www.ecajmer.ac.in/Content/', clean, flags=re.I)
        clean = re.sub(r'^/\./content/', 'https://www.ecajmer.ac.in/Content/', clean, flags=re.I)
        clean = re.sub(r'^/content/', 'https://www.ecajmer.ac.in/Content/', clean, flags=re.I)
        clean = re.sub(r'^/uploads/', 'https://www.ecajmer.ac.in/uploads/', clean, flags=re.I)
        return clean

    for r in rows:
        nid, title, content, raw, doc, page, src = r
        new_doc = doc
        new_page = page
        new_src = src

        # Fix demo seeds first
        if nid in demo_replacements:
            rep_doc, rep_page = demo_replacements[nid]
            new_doc = rep_doc
            new_page = rep_page
            new_src = "https://www.ecajmer.ac.in/latestfromeca"
            demo_fixed += 1
        else:
            # 1. Normalize existing document_url
            if new_doc:
                new_doc = normalize_doc_url(new_doc)
            
            # 2. Check if page or src is actually a PDF
            if not new_doc or '.pdf' not in new_doc.lower():
                if new_page and '.pdf' in new_page.lower():
                    new_doc = normalize_doc_url(new_page)
                elif new_src and '.pdf' in new_src.lower():
                    new_doc = normalize_doc_url(new_src)
                else:
                    # Look in content
                    comb = f"{content or ''} {raw or ''}"
                    pdfs = pdf_pattern.findall(comb)
                    if pdfs:
                        new_doc = normalize_doc_url(pdfs[0])
                        pdf_recovered += 1
                    else:
                        ups = uploads_pattern.findall(comb)
                        if ups:
                            new_doc = normalize_doc_url(f"https://www.ecajmer.ac.in{ups[0]}")
                            pdf_recovered += 1

            # 3. Clean up bad page/source URLs
            if is_bad_url(new_page):
                new_page = "https://www.ecajmer.ac.in/latestfromeca"
            if is_bad_url(new_src):
                new_src = "https://www.ecajmer.ac.in/latestfromeca"

        if (new_doc != doc) or (new_page != page) or (new_src != src):
            c.execute("""
                UPDATE notices 
                SET document_url = ?, official_page_url = ?, source_url = ?
                WHERE id = ?
            """, (new_doc, new_page, new_src, nid))
            updated_count += 1

    conn.commit()
    print(f"Total rows inspected: {len(rows)}")
    print(f"Updated rows: {updated_count}")
    print(f"Demo seeds fixed: {demo_fixed}")
    print(f"PDFs recovered from content/raw: {pdf_recovered}")

    # Also update backend/campussync.db if present
    conn.close()

if __name__ == '__main__':
    fix_database()

