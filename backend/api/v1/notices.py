from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, false
from typing import Any, Optional, List, Dict
from pathlib import Path
import os
import glob

from backend.api.deps import get_db, get_current_student_context, StudentContext
from backend.models.academic import Notice, Course, ClassificationScope, VerificationStatus
from backend.services.url_validator import resolve_notice_destination, is_trusted_url, DestinationType

router = APIRouter()

HOSTED_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "hosted_documents"

@router.get("/")
def get_notices(
    q: Optional[str] = Query(None, description="Search query for notice title or content"),
    category: Optional[str] = Query(None, description="Filter by notice category"),
    student_ctx: StudentContext = Depends(get_current_student_context),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get notices strictly filtered for the authenticated student's cohort:
    1. GLOBAL notices (active & verified).
    2. DEPARTMENT_SPECIFIC notices for student's department.
    3. SEMESTER_SPECIFIC notices matching both department and semester.
    4. SUBJECT_SPECIFIC notices for courses the student is enrolled in.
    5. INDIVIDUAL notices assigned directly to this student ID.
    
    Excludes UNCLASSIFIED, FLAGGED, unverified, and inactive notices.
    Never trusts client-supplied semester or department query parameters.
    """
    # 1. Base security filter: Active and Verified only
    base_filter = and_(
        Notice.is_active == True,
        Notice.verification_status == VerificationStatus.VERIFIED.value,
        Notice.scope != ClassificationScope.UNCLASSIFIED.value
    )
    
    # 2. Retrieve student's authorized course IDs for SUBJECT_SPECIFIC access
    student_course_ids = [
        c.id for c in db.query(Course.id).filter(
            Course.department == student_ctx.department_code,
            Course.semester == student_ctx.semester
        ).all()
    ]
    
    subject_condition = Notice.course_id.in_(student_course_ids) if student_course_ids else false()
    
    # 3. Construct scope authorization rules
    scope_filter = or_(
        # GLOBAL notices
        Notice.scope == ClassificationScope.GLOBAL.value,
        
        # DEPARTMENT_SPECIFIC notices (e.g. CSE departmental announcements)
        and_(
            Notice.scope == ClassificationScope.DEPARTMENT_SPECIFIC.value,
            Notice.department_code == student_ctx.department_code
        ),
        
        # SEMESTER_SPECIFIC notices (must match BOTH department and current semester)
        and_(
            Notice.scope == ClassificationScope.SEMESTER_SPECIFIC.value,
            Notice.department_code == student_ctx.department_code,
            Notice.target_semester == student_ctx.semester
        ),
        
        # SUBJECT_SPECIFIC notices (must belong to authorized enrolled courses)
        and_(
            Notice.scope == ClassificationScope.SUBJECT_SPECIFIC.value,
            subject_condition
        ),
        
        # INDIVIDUAL notices (private to this student's user ID)
        and_(
            Notice.scope == ClassificationScope.INDIVIDUAL.value,
            Notice.target_user_id == student_ctx.user_id
        )
    )
    
    query = db.query(Notice).filter(base_filter, scope_filter)
    
    # Optional search by keyword
    if q and isinstance(q, str) and q.strip():
        search_term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Notice.title.ilike(search_term),
                Notice.content.ilike(search_term)
            )
        )
        
    # Optional category filter
    if category and isinstance(category, str) and category.lower() != "all":
        query = query.filter(Notice.notice_type.ilike(category.strip()))
        
    notices = query.order_by(Notice.published_date.desc()).all()
    
    results = []
    for n in notices:
        dest_type, dest_url, dest_label = resolve_notice_destination(
            download_url=getattr(n, "download_url", None),
            document_url=getattr(n, "document_url", None),
            source_url=getattr(n, "source_url", None),
            official_page_url=getattr(n, "official_page_url", None)
        )
        results.append({
            "id": n.id,
            "title": n.title,
            "content": n.content,
            "notice_type": n.notice_type,
            "source_url": n.source_url if is_trusted_url(n.source_url) else None,
            "document_url": n.document_url if is_trusted_url(n.document_url) else None,
            "download_url": getattr(n, "download_url", None) if is_trusted_url(getattr(n, "download_url", None)) else None,
            "official_page_url": getattr(n, "official_page_url", None) if is_trusted_url(getattr(n, "official_page_url", None)) else None,
            "published_date": n.published_date.isoformat() if n.published_date else None,
            "scope": n.scope,
            "target_semester": n.target_semester,
            "department_code": n.department_code,
            "academic_year": n.academic_year,
            "data_origin": n.data_origin,
            "verification_status": n.verification_status,
            "destination_type": dest_type.value,
            "action_url": dest_url,
            "action_label": dest_label,
            "is_actionable": dest_type != DestinationType.UNAVAILABLE
        })

    return results

@router.get("/{notice_id}/download")
def download_notice_document(
    notice_id: int,
    student_ctx: StudentContext = Depends(get_current_student_context),
    db: Session = Depends(get_db)
) -> Any:
    """
    Downloads the official notice document hosted directly by CampusSync,
    or safely redirects to the verified external document portal.
    """
    notice = db.query(Notice).filter(Notice.id == notice_id, Notice.is_active == True).first()
    if not notice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notice #{notice_id} not found or inactive"
        )

    # 1. Check for locally hosted file
    matching_files = list(HOSTED_DIR.glob(f"Notice_{notice_id}_*.pdf"))
    if matching_files and matching_files[0].exists():
        file_path = matching_files[0]
        filename = f"Notice_{notice_id}_{notice.title[:30].replace(' ', '_')}.pdf"
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )

    # 2. If external document URL is verified, redirect
    if notice.document_url and is_trusted_url(notice.document_url):
        return RedirectResponse(url=notice.document_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

    # 3. If only webpage exists, redirect to webpage
    target_page = getattr(notice, "official_page_url", None) or notice.source_url
    if target_page and is_trusted_url(target_page):
        return RedirectResponse(url=target_page, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Official notice link is currently unavailable."
    )
