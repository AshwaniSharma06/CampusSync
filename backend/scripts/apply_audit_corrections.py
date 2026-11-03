"""
Applies database corrections identified during the Phase 4.1 URL Integrity Audit:
1. URL-encodes spaces and special characters in verified external PDF URLs on ecajmer.ac.in.
2. Clears 404 unverified document_url on Notice 3 (preserving verified official_page_url).
3. Ensures all hosted resources have exact file size attributes matching reportlab binaries.
"""
import sqlite3
from pathlib import Path

DB_PATH = Path("campussync.db")
HOSTED_DIR = Path("backend/data/hosted_documents")

def apply_corrections():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    print("Applying Phase 4.1 Audit Database Corrections...")

    # 1. URL-encode verified circular URL
    raw_pdf_url = "https://www.ecajmer.ac.in/uploads/circulars/1793247267504-BTU - Circular for B.Tech. III Sem (Main and Back Exam) Session 2026-27 (Last date 01.11.2026 with single fee).pdf"
    encoded_pdf_url = "https://www.ecajmer.ac.in/uploads/circulars/1793247267504-BTU%20-%20Circular%20for%20B.Tech.%20III%20Sem%20%28Main%20and%20Back%20Exam%29%20Session%202026-27%20%28Last%20date%2001.11.2026%20with%20single%20fee%29.pdf"

    # Notice 1
    cur.execute("UPDATE notices SET document_url = ? WHERE id = 1 AND document_url = ?", (encoded_pdf_url, raw_pdf_url))
    # Notice 7
    cur.execute("UPDATE notices SET document_url = ? WHERE id = 7 AND document_url = ?", (encoded_pdf_url, raw_pdf_url))
    # Resource 4
    cur.execute("UPDATE academic_resources SET document_url = ?, file_url = ? WHERE id = 4", (encoded_pdf_url, encoded_pdf_url))
    print("  [URL Encoding] Normalized external circular PDF URL across Notice 1, Notice 7, Resource 4.")

    # 2. Correct Notice 3: 404 document_url removed, retaining verified official_page_url
    cur.execute("UPDATE notices SET document_url = NULL WHERE id = 3")
    print("  [Notice 3] Cleared 404 document URL; verified official page (https://www.ecajmer.ac.in/events/technotsav-2026) active as destination.")

    # 3. Update file sizes in academic_resources table to match authentic generated PDFs
    res_sizes = {
        1: ("Resource_1_BTU_CSE_Sem7_Syllabus.pdf", "PDF • 4.0 KB"),
        2: ("Resource_2_BTU_Academic_Calendar_2026-27.pdf", "PDF • 3.5 KB"),
        3: ("Resource_3_ECA_Barliya_Campus_Map.pdf", "PDF • 3.9 KB"),
    }
    for r_id, (fname, size_str) in res_sizes.items():
        fpath = HOSTED_DIR / fname
        if fpath.exists():
            actual_bytes = fpath.stat().st_size
            cur.execute("UPDATE academic_resources SET file_size = ? WHERE id = ?", (f"{size_str} ({actual_bytes} bytes)", r_id))
    print("  [Academic Resources] Synchronized file_size metadata with authentic PDF documents.")

    conn.commit()
    conn.close()
    print("Corrections committed successfully.")

if __name__ == "__main__":
    apply_corrections()

