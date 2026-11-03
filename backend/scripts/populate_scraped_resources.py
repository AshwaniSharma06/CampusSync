"""
Extracts genuine academic resources (syllabus, lab manuals, lecture notes, academic calendars)
from the ingested notices into the academic_resources table.
"""
import sys
from pathlib import Path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.db.session import SessionLocal
from backend.models.academic import Notice, AcademicResource

def populate_resources():
    db = SessionLocal()
    try:
        print("Extracting Academic Resources from ingested official notices...")
        study_keywords = ["syllabus", "assignment", "lab", "notes", "lecture", "study material", "calendar", "curriculum", "manual", "experiments"]
        
        notices = db.query(Notice).all()
        added = 0
        for n in notices:
            title_lower = n.title.lower()
            if any(k in title_lower for k in study_keywords):
                existing = db.query(AcademicResource).filter(AcademicResource.title == n.title).first()
                if not existing:
                    cat = "Curriculum" if "syllabus" in title_lower or "curriculum" in title_lower else ("Calendar" if "calendar" in title_lower else "Study Material")
                    res = AcademicResource(
                        title=n.title,
                        category=cat,
                        file_url=n.document_url or "",
                        download_url=n.document_url or "",
                        document_url=n.document_url or "",
                        source_url=n.source_url or "https://www.ecajmer.ac.in",
                        file_size="PDF / Online" if n.document_url else "Official Circular",
                        scope=n.scope or "GLOBAL",
                        department_code=n.department_code,
                        target_semester=n.target_semester,
                        is_hosted=False,
                        data_origin="VERIFIED_OFFICIAL",
                        verification_status="VERIFIED"
                    )
                    db.add(res)
                    added += 1

        db.commit()
        total_res = db.query(AcademicResource).count()
        print(f"[Done] Added {added} new official academic resources. Total resources now: {total_res}")
    finally:
        db.close()

if __name__ == "__main__":
    populate_resources()

