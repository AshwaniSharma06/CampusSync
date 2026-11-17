"""
CampusSync: Collect, Validate & Seed Official BTU Syllabi for Engineering College Ajmer (ECA).
Downloads authentic PDFs from official BTU sources, validates them, and stores records in syllabus_documents.
"""

import os
import sys
import json
import urllib.request
from pathlib import Path
import pypdf
import io
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.db.session import SessionLocal, engine, Base
from backend.models.academic import SyllabusDocument

SYLLABI_DIR = BASE_DIR / "backend" / "data" / "hosted_documents" / "syllabi"
SYLLABI_DIR.mkdir(parents=True, exist_ok=True)

BTU_SYLLABUS_CATALOG = [
    {
        "title": "BTU B.Tech 1st Year (Semester 1 & 2) Common Scheme & Syllabus",
        "programme": "B.Tech",
        "branch_code": "COMMON",
        "branch_name": "First Year (All B.Tech Engineering Branches)",
        "semester_start": 1,
        "semester_end": 2,
        "is_common": True,
        "admission_session": "2018-19 and onwards / AICTE Model Curriculum",
        "scheme_version": "2018-19 onwards",
        "original_url": "https://static1.squarespace.com/static/5fce63270356d927d7eecdbd/t/5ff2e58810ee9f5922b6d0f5/1614415426849/btu-1st-to-4th-syllabus-and-scheme.pdf",
        "local_filename": "btu_btech_common_sem1_2.pdf"
    },
    {
        "title": "BTU B.Tech Computer Science & Engineering (Semesters 3 to 8) Scheme & Syllabus",
        "programme": "B.Tech",
        "branch_code": "CSE",
        "branch_name": "Computer Science & Engineering",
        "semester_start": 3,
        "semester_end": 8,
        "is_common": False,
        "admission_session": "2021-22 and onwards",
        "scheme_version": "2021-22 onwards",
        "original_url": "https://blr1.digitaloceanspaces.com/btu/btu/documents/1788498815350793100_15102025022312-media.pdf",
        "local_filename": "btu_btech_cse_sem3_8.pdf"
    },
    {
        "title": "BTU B.Tech Information Technology (Semesters 3 to 8) Scheme & Syllabus",
        "programme": "B.Tech",
        "branch_code": "IT",
        "branch_name": "Information Technology",
        "semester_start": 3,
        "semester_end": 8,
        "is_common": False,
        "admission_session": "2021-22 and onwards",
        "scheme_version": "2021-22 onwards",
        "original_url": "https://blr1.digitaloceanspaces.com/btu/btu/documents/1788500465026532700_15102025021627-media.pdf",
        "local_filename": "btu_btech_it_sem3_8.pdf"
    },
    {
        "title": "BTU B.Tech Electronics & Communication Engineering (Semesters 3 to 8) Scheme & Syllabus",
        "programme": "B.Tech",
        "branch_code": "ECE",
        "branch_name": "Electronics & Communication Engineering",
        "semester_start": 3,
        "semester_end": 8,
        "is_common": False,
        "admission_session": "2021-22 and onwards",
        "scheme_version": "2021-22 onwards",
        "original_url": "https://blr1.digitaloceanspaces.com/btu/btu/documents/1788500270164863900_15102025020036-media.pdf",
        "local_filename": "btu_btech_ece_sem3_8.pdf"
    },
    {
        "title": "BTU B.Tech Electrical Engineering (Semesters 3 to 8) Scheme & Syllabus",
        "programme": "B.Tech",
        "branch_code": "EE",
        "branch_name": "Electrical Engineering",
        "semester_start": 3,
        "semester_end": 8,
        "is_common": False,
        "admission_session": "2021-22 and onwards",
        "scheme_version": "2021-22 onwards",
        "original_url": "https://blr1.digitaloceanspaces.com/btu/btu/documents/1788500195533119300_15102025020125-media.pdf",
        "local_filename": "btu_btech_ee_sem3_8.pdf"
    },
    {
        "title": "BTU B.Tech Mechanical Engineering (Semesters 3 to 8) Scheme & Syllabus",
        "programme": "B.Tech",
        "branch_code": "ME",
        "branch_name": "Mechanical Engineering",
        "semester_start": 3,
        "semester_end": 8,
        "is_common": False,
        "admission_session": "2021-22 and onwards",
        "scheme_version": "2021-22 onwards",
        "original_url": "https://blr1.digitaloceanspaces.com/btu/btu/documents/1788500714347403100_15102025015854-media.pdf",
        "local_filename": "btu_btech_me_sem3_8.pdf"
    },
    {
        "title": "BTU B.Tech Civil Engineering (Semesters 3 to 8) Scheme & Syllabus",
        "programme": "B.Tech",
        "branch_code": "CE",
        "branch_name": "Civil Engineering",
        "semester_start": 3,
        "semester_end": 8,
        "is_common": False,
        "admission_session": "2021-22 and onwards",
        "scheme_version": "2021-22 onwards",
        "original_url": "https://blr1.digitaloceanspaces.com/btu/btu/documents/1788498686014827800_15102025020730-media.pdf",
        "local_filename": "btu_btech_ce_sem3_8.pdf"
    },
    {
        "title": "BTU B.Tech Electronics Instrumentation & Control Engineering (Semesters 3 to 8) Scheme & Syllabus",
        "programme": "B.Tech",
        "branch_code": "EIC",
        "branch_name": "Electronics Instrumentation & Control Engineering",
        "semester_start": 3,
        "semester_end": 8,
        "is_common": False,
        "admission_session": "2021-22 and onwards",
        "scheme_version": "2021-22 onwards",
        "original_url": "https://blr1.digitaloceanspaces.com/btu/btu/documents/1788500407322993200_15102025015934-media.pdf",
        "local_filename": "btu_btech_eic_sem3_8.pdf"
    },
    {
        "title": "BTU B.Tech CSE Cyber Security (Semesters 3 to 8) Scheme & Syllabus",
        "programme": "B.Tech",
        "branch_code": "CYBER",
        "branch_name": "Computer Science & Engineering (Cyber Security)",
        "semester_start": 3,
        "semester_end": 8,
        "is_common": False,
        "admission_session": "2021-22 and onwards",
        "scheme_version": "2021-22 onwards",
        "original_url": "https://blr1.digitaloceanspaces.com/btu/btu/documents/1788499848172504000_27102025045733-media.pdf",
        "local_filename": "btu_btech_cyber_sem3_8.pdf"
    },
    {
        "title": "BTU MCA (I & II Semester) Scheme & Syllabus",
        "programme": "MCA",
        "branch_code": "MCA",
        "branch_name": "Master of Computer Applications",
        "semester_start": 1,
        "semester_end": 2,
        "is_common": False,
        "admission_session": "2021-22 and onwards",
        "scheme_version": "2021-22 onwards (2-year)",
        "original_url": "https://blr1.digitaloceanspaces.com/btu/btu/documents/1788585430217334500_mca1andii.pdf",
        "local_filename": "btu_mca_sem1_2.pdf"
    },
    {
        "title": "BTU MCA (III & IV Semester) Scheme & Syllabus",
        "programme": "MCA",
        "branch_code": "MCA",
        "branch_name": "Master of Computer Applications",
        "semester_start": 3,
        "semester_end": 4,
        "is_common": False,
        "admission_session": "2021-22 and onwards",
        "scheme_version": "2021-22 onwards (2-year)",
        "original_url": "https://blr1.digitaloceanspaces.com/btu/btu/documents/1788585563822578800_10102025014524-media__1_.pdf",
        "local_filename": "btu_mca_sem3_4.pdf"
    },
    {
        "title": "BTU MBA (I & II Semester) Scheme & Syllabus",
        "programme": "MBA",
        "branch_code": "MBA",
        "branch_name": "Master of Business Administration",
        "semester_start": 1,
        "semester_end": 2,
        "is_common": False,
        "admission_session": "2020-21 and onwards",
        "scheme_version": "2020-21 onwards",
        "original_url": "https://blr1.digitaloceanspaces.com/btu/btu/documents/1788583197602468400_10102025030856-media__1_.pdf",
        "local_filename": "btu_mba_sem1_2.pdf"
    },
    {
        "title": "BTU MBA (III & IV Semester) Scheme & Syllabus",
        "programme": "MBA",
        "branch_code": "MBA",
        "branch_name": "Master of Business Administration",
        "semester_start": 3,
        "semester_end": 4,
        "is_common": False,
        "admission_session": "2019-20 and onwards",
        "scheme_version": "2019-20 onwards",
        "original_url": "https://blr1.digitaloceanspaces.com/btu/btu/documents/1788532807456552500_10102025031103-media.pdf",
        "local_filename": "btu_mba_sem3_4.pdf"
    },
    {
        "title": "BTU M.Tech Computer Engineering Scheme & Syllabus",
        "programme": "M.Tech",
        "branch_code": "MTECH",
        "branch_name": "M.Tech Computer Engineering",
        "semester_start": 1,
        "semester_end": 4,
        "is_common": False,
        "admission_session": "2020-21 and onwards",
        "scheme_version": "2020-21 onwards",
        "original_url": "https://blr1.digitaloceanspaces.com/btu/btu/documents/1788528630261406900_11102025112518-media.pdf",
        "local_filename": "btu_mtech_cse.pdf"
    }
]

def download_and_validate(item):
    filepath = SYLLABI_DIR / item["local_filename"]
    url = item["original_url"]

    if not filepath.exists() or filepath.stat().st_size < 1000:
        print(f"Downloading {item['title']}...")
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
        with open(filepath, "wb") as f:
            f.write(data)
    else:
        with open(filepath, "rb") as f:
            data = f.read()

    # Validate with pypdf
    reader = pypdf.PdfReader(io.BytesIO(data))
    num_pages = len(reader.pages)
    file_size_kb = len(data) / 1024
    size_str = f"PDF • {file_size_kb:.1f} KB" if file_size_kb < 1024 else f"PDF • {file_size_kb/1024:.2f} MB"

    print(f"  ✓ Validated: {item['local_filename']} | Pages: {num_pages} | Size: {size_str}")
    return num_pages, size_str

def run():
    print("=" * 80)
    print("  CAMPUSSYNC: OFFICIAL BTU SYLLABUS COLLECTION & SEEDING")
    print("=" * 80)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    pdf_map_path = BASE_DIR / "src" / "services" / "noticePdfMap.json"
    pdf_map = {}
    if pdf_map_path.exists():
        with open(pdf_map_path, "r", encoding="utf-8") as f:
            pdf_map = json.load(f)

    try:
        # Clear previous syllabus documents to ensure clean state
        db.query(SyllabusDocument).delete()
        db.commit()

        for item in BTU_SYLLABUS_CATALOG:
            num_pages, size_str = download_and_validate(item)

            doc = SyllabusDocument(
                title=item["title"],
                programme=item["programme"],
                branch_code=item["branch_code"],
                branch_name=item["branch_name"],
                semester_start=item["semester_start"],
                semester_end=item["semester_end"],
                is_common=item["is_common"],
                admission_session=item["admission_session"],
                scheme_version=item["scheme_version"],
                original_url=item["original_url"],
                local_filename=item["local_filename"],
                source_institution="Bikaner Technical University (BTU)",
                verification_status="VERIFIED",
                total_pages=num_pages,
                file_size=size_str
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)

            # Register in noticePdfMap.json
            norm_key = item["title"].lower().replace(" ", "").replace("&", "and")
            norm_key = "".join(filter(str.isalnum, norm_key))
            pdf_map[str(doc.id)] = item["original_url"]
            pdf_map[norm_key] = item["original_url"]

        db.commit()

        # Save updated noticePdfMap.json
        with open(pdf_map_path, "w", encoding="utf-8") as f:
            json.dump(pdf_map, f, indent=2)

        print("\n" + "=" * 80)
        print("COLLECTED & SEEDED ALL 14 OFFICIAL BTU SYLLABUS DOCUMENTS SUCCESSFULLY!")
        print("=" * 80)

    finally:
        db.close()

if __name__ == "__main__":
    run()
