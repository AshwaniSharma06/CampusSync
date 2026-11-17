"""
Index Official BTU Computer Science (CSE) 3rd to 8th Semester Scheme & Syllabus.
Source PDF: https://blr1.digitaloceanspaces.com/btu/btu/documents/1788498815350793100_15102025022312-media.pdf
"""

import os
import sys
import re
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

import pypdf
from datetime import datetime

from backend.db.session import SessionLocal
from backend.models.academic import AcademicResource, Notice, ClassificationScope, VerificationStatus
from backend.services.vector_service import index_document, get_rag_collection
from backend.services.document_extractor import DocumentExtractor
from backend.services.url_validator import clean_and_encode_url

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PDF_PATH = BASE_DIR / "backend" / "data" / "hosted_documents" / "BTU_CSE_Sem3_to_8_Syllabus.pdf"
SYLLABUS_URL = "https://blr1.digitaloceanspaces.com/btu/btu/documents/1788498815350793100_15102025022312-media.pdf"
PORTAL_URL = "https://btu.ac.in/home/Syllabus-Scheme"

def get_page_semester(page_idx: int) -> int:
    """Returns the target semester for a 0-indexed page in the 83-page syllabus."""
    if page_idx == 0:
        return 0  # Title / Global
    elif page_idx == 1:
        return 3  # 3rd Sem Scheme
    elif page_idx == 2:
        return 4  # 4th Sem Scheme
    elif 3 <= page_idx <= 16:
        return 3  # 3rd Sem Syllabi
    elif 17 <= page_idx <= 28:
        return 4  # 4th Sem Syllabi
    elif page_idx == 29:
        return 5  # 5th Sem Scheme
    elif page_idx == 30:
        return 6  # 6th Sem Scheme
    elif 31 <= page_idx <= 52:
        return 5  # 5th Sem Syllabi
    elif 53 <= page_idx <= 68:
        return 6  # 6th Sem Syllabi
    elif page_idx == 69:
        return 7  # 7th Sem Scheme
    elif page_idx == 70:
        return 8  # 8th Sem Scheme
    elif 71 <= page_idx <= 80:
        return 7  # 7th Sem Syllabi
    elif 81 <= page_idx <= 82:
        return 8  # 8th Sem Syllabi
    return 0

def run():
    print("=" * 70)
    print("  INDEXING BTU CSE 3RD TO 8TH SEMESTER SCHEME & SYLLABUS")
    print("=" * 70)

    if not PDF_PATH.exists():
        raise FileNotFoundError(f"PDF not found at {PDF_PATH}")

    # 1. Update Database AcademicResource (ID: 1)
    db = SessionLocal()
    try:
        res1 = db.query(AcademicResource).filter(AcademicResource.id == 1).first()
        if res1:
            res1.title = "BTU B.Tech CSE (3rd to 8th Sem) Complete Scheme & Syllabus"
            res1.category = "Curriculum"
            res1.document_url = SYLLABUS_URL
            res1.source_url = PORTAL_URL
            res1.file_size = "PDF • 1.4 MB"
            res1.scope = "DEPARTMENT_SPECIFIC"
            res1.department_code = "CSE"
            res1.target_semester = None
            res1.is_hosted = False
            res1.verification_status = "VERIFIED"
            res1.data_origin = "VERIFIED_OFFICIAL"
            db.commit()
            print("[Database] Updated AcademicResource #1 to official BTU Syllabus URL.")

        # 2. Add or Update Notice in notices table
        existing_notice = db.query(Notice).filter(
            Notice.title == "BTU Scheme & Syllabus for B.Tech Computer Science & Engineering (Semesters 3 to 8)"
        ).first()

        if not existing_notice:
            new_notice = Notice(
                title="BTU Scheme & Syllabus for B.Tech Computer Science & Engineering (Semesters 3 to 8)",
                content="Official Teaching and Examination Scheme and Detailed Syllabus for B.Tech Computer Science & Engineering (CSE) from 3rd Semester to 8th Semester issued by Bikaner Technical University (BTU). Effective for students admitted in session 2021-22 and onwards. Contains full course structures, credit distributions, unit topics, and lab schemes.",
                notice_type="Official",
                source_url=PORTAL_URL,
                document_url=SYLLABUS_URL,
                official_page_url=PORTAL_URL,
                published_date=datetime(2025, 10, 15),
                scope="DEPARTMENT_SPECIFIC",
                department_code="CSE",
                target_semester=None,
                academic_year="2026-27",
                data_origin="VERIFIED_OFFICIAL",
                verification_status="VERIFIED",
                is_active=True
            )
            db.add(new_notice)
            db.commit()
            db.refresh(new_notice)
            notice_id = new_notice.id
            print(f"[Database] Created new official Notice #{notice_id} for BTU Syllabus.")
        else:
            existing_notice.document_url = SYLLABUS_URL
            existing_notice.source_url = PORTAL_URL
            existing_notice.scope = "DEPARTMENT_SPECIFIC"
            existing_notice.department_code = "CSE"
            db.commit()
            notice_id = existing_notice.id
            print(f"[Database] Updated existing Notice #{notice_id}.")

    finally:
        db.close()

    # 3. Update noticePdfMap.json
    pdf_map_path = BASE_DIR / "src" / "services" / "noticePdfMap.json"
    if pdf_map_path.exists():
        with open(pdf_map_path, "r", encoding="utf-8") as f:
            pdf_map = json.load(f)
        
        pdf_map[str(notice_id)] = SYLLABUS_URL
        norm_key = re.sub(r'[^a-z0-9]', '', "BTU Scheme & Syllabus for B.Tech Computer Science & Engineering (Semesters 3 to 8)".lower())
        pdf_map[norm_key] = SYLLABUS_URL
        pdf_map["btucsesyllabussem3to8"] = SYLLABUS_URL
        pdf_map["btubtechcsesyllabus"] = SYLLABUS_URL

        with open(pdf_map_path, "w", encoding="utf-8") as f:
            json.dump(pdf_map, f, indent=2)
        print(f"[NoticeMap] Updated noticePdfMap.json with key '{notice_id}' and alias.")

    # 4. Index all 83 pages into ChromaDB
    print("\n[ChromaDB] Reading and chunking 83 pages from PDF...")
    reader = pypdf.PdfReader(str(PDF_PATH))
    total_pages = len(reader.pages)
    indexed_chunks = 0

    for idx in range(total_pages):
        page_num = idx + 1
        page = reader.pages[idx]
        raw_text = page.extract_text() or ""
        clean_text = DocumentExtractor.clean_academic_text(raw_text)
        if not clean_text or len(clean_text) < 30:
            continue

        sem = get_page_semester(idx)
        sem_label = f"Semester {sem}" if sem > 0 else "All Semesters (3-8)"

        # Extract course codes on this page to enrich title
        codes = re.findall(r'\b([3-8]CS[1-8]-[0-9]{2})\b', raw_text)
        codes_str = f" [{', '.join(sorted(set(codes)))}]" if codes else ""

        doc_title = f"BTU B.Tech CSE Scheme & Syllabus ({sem_label}){codes_str} (Page {page_num})"

        doc_id = f"btu_cse_syl_p{page_num}"
        count = index_document(
            doc_id=doc_id,
            title=doc_title,
            text=clean_text,
            source_url=PORTAL_URL,
            document_url=SYLLABUS_URL,
            scope="DEPARTMENT_SPECIFIC",
            department_code="CSE",
            target_semester=sem,
            document_type="SYLLABUS",
            verification_status="VERIFIED",
            data_origin="VERIFIED_OFFICIAL",
            published_date="2025-10-15",
            page_number=page_num
        )
        indexed_chunks += count

    print(f"\n[ChromaDB] Successfully indexed {indexed_chunks} chunks across {total_pages} pages into ChromaDB!")

if __name__ == "__main__":
    run()
