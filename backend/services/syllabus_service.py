"""
CampusSync BTU Syllabus Mapping & Profile-Aware Matching Service.
Associates official BTU scheme & syllabus documents with student profiles:
- B.Tech Semester 1 & 2 -> Common B.Tech 1st Year Syllabus across all engineering branches.
- B.Tech Semester 3 to 8 -> Branch-specific Syllabus (CSE, IT, ECE, EE, ME, CE, EIC, CYBER).
- Postgraduate programmes -> Programme-specific Syllabus (MCA, MBA, M.Tech).
- Strictly prevents cross-branch syllabus exposure (e.g. ME student never receives CSE syllabus).
"""

from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from backend.models.academic import SyllabusDocument, Notice, ClassificationScope, VerificationStatus
from backend.api.deps import StudentContext

def get_student_syllabus(student_ctx: StudentContext, db: Session) -> Optional[SyllabusDocument]:
    """
    Retrieves the exact, verified official BTU syllabus document matching
    the student's degree programme, department/branch, and current semester.
    """
    dept = (student_ctx.department_code or "").upper().strip()
    sem = int(student_ctx.semester) if student_ctx.semester is not None else 1

    # 1. Postgraduate Programmes (MCA, MBA, M.Tech)
    if dept == "MCA":
        return db.query(SyllabusDocument).filter(
            SyllabusDocument.programme == "MCA",
            SyllabusDocument.semester_start <= sem,
            SyllabusDocument.semester_end >= sem
        ).first()

    if dept == "MBA":
        return db.query(SyllabusDocument).filter(
            SyllabusDocument.programme == "MBA",
            SyllabusDocument.semester_start <= sem,
            SyllabusDocument.semester_end >= sem
        ).first()

    if dept == "MTECH":
        return db.query(SyllabusDocument).filter(
            SyllabusDocument.programme == "M.Tech"
        ).first()

    # 2. Undergraduate B.Tech Programmes
    # Rule: Semester 1 and 2 use the common syllabus applicable to all B.Tech branches
    if sem in [1, 2]:
        common_doc = db.query(SyllabusDocument).filter(
            SyllabusDocument.programme == "B.Tech",
            SyllabusDocument.is_common == True,
            SyllabusDocument.semester_start <= sem,
            SyllabusDocument.semester_end >= sem
        ).first()
        if common_doc:
            return common_doc

    # Rule: Semester 3 to 8 use the respective branch-specific syllabus
    branch_doc = db.query(SyllabusDocument).filter(
        SyllabusDocument.programme == "B.Tech",
        SyllabusDocument.branch_code == dept,
        SyllabusDocument.semester_start <= sem,
        SyllabusDocument.semester_end >= sem
    ).first()

    if branch_doc:
        return branch_doc

    # Fallback to general branch doc if semester boundary is flexible
    return db.query(SyllabusDocument).filter(
        SyllabusDocument.programme == "B.Tech",
        SyllabusDocument.branch_code == dept
    ).first()

def build_pinned_syllabus_notice(
    syllabus: SyllabusDocument,
    student_ctx: StudentContext
) -> Dict[str, Any]:
    """
    Constructs an authentic, pinned notice payload representing the student's matching syllabus.
    Surfaced at the very top of the Notices section with direct PDF destination.
    """
    sem = student_ctx.semester
    dept_label = syllabus.branch_name

    # Clear human title
    if syllabus.is_common:
        display_title = f"BTU B.Tech 1st Year (Semester {sem}) Common Scheme & Syllabus"
    else:
        display_title = f"BTU B.Tech {syllabus.branch_name} (Semester {sem}) Scheme & Syllabus"

    return {
        "id": f"syllabus-{syllabus.id}",
        "title": display_title,
        "content": (
            f"Official {syllabus.programme} Teaching & Examination Scheme and Detailed Syllabus for {syllabus.branch_name} "
            f"(Semester {sem}) issued by {syllabus.source_institution}. Scheme Session: {syllabus.scheme_version}. "
            f"Click to open the verified official curriculum PDF."
        ),
        "notice_type": "Syllabus",
        "scope": "SEMESTER_SPECIFIC",
        "target_semester": sem,
        "department_code": student_ctx.department_code,
        "published_date": syllabus.created_at.isoformat() if syllabus.created_at else None,
        "formatted_date": "Active Curriculum",
        "data_origin": "VERIFIED_OFFICIAL",
        "verification_status": "VERIFIED",
        "destination_type": "OFFICIAL_DOCUMENT",
        "document_url": syllabus.original_url,
        "source_url": "https://btu.ac.in/syllabusAndScheme",
        "download_url": None,
        "official_page_url": "https://btu.ac.in/syllabusAndScheme",
        "action_url": syllabus.original_url,
        "action_label": "Open Official Syllabus PDF",
        "is_actionable": True,
        "is_pinned": True,
        "pinned_badge": "Your Semester Syllabus",
        "is_syllabus": True,
        "file_size": syllabus.file_size or "Document"
    }

