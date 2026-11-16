from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, false, case
from typing import Any, Optional, List, Dict
from pathlib import Path
import os
import glob

from backend.api.deps import get_db, get_current_student_context, StudentContext
from backend.models.academic import Notice, Course, ClassificationScope, VerificationStatus
from backend.services.url_validator import resolve_notice_destination, is_trusted_url, DestinationType

router = APIRouter()

HOSTED_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "hosted_documents"

@router.get("/public")
def get_public_notices(
    limit: int = Query(6, ge=1, le=20, description="Maximum number of notices to return"),
    exclude_ids: Optional[str] = Query(None, description="Comma-separated notice IDs to exclude for rotation/variety"),
    category: Optional[str] = Query(None, description="Optional category filter"),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Publicly accessible endpoint for verified, scraped college announcements and notices.
    Used for homepage showcase, floating notice cards, and unauthenticated visitors.
    
    Guarantees:
    - Only active, verified, non-individual notices (GLOBAL, DEPARTMENT_SPECIFIC, SEMESTER_SPECIFIC).
    - Intelligent prioritization: Exam announcements, Academic updates, Official circulars, Events.
    - Variety across visits: supports exclude_ids to prevent showing duplicate cards.
    - Verified direct URLs (PDFs and official college pages).
    """
    excluded_set = set()
    if exclude_ids and isinstance(exclude_ids, str):
        for part in exclude_ids.split(","):
            part_str = part.strip()
            if part_str.isdigit():
                excluded_set.add(int(part_str))

    base_filter = and_(
        Notice.is_active == True,
        Notice.id > 12,
        Notice.data_origin != 'DEMO_SEED',
        Notice.verification_status == VerificationStatus.VERIFIED.value,
        Notice.scope.in_([
            ClassificationScope.GLOBAL.value,
            ClassificationScope.DEPARTMENT_SPECIFIC.value,
            ClassificationScope.SEMESTER_SPECIFIC.value
        ]),
        Notice.scope != ClassificationScope.UNCLASSIFIED.value,
        Notice.scope != ClassificationScope.INDIVIDUAL.value
    )

    if category and isinstance(category, str) and category.lower() != "all":
        base_filter = and_(base_filter, Notice.notice_type.ilike(f"%{category.strip()}%"))

    priority_expr = case(
        (Notice.notice_type.ilike("%exam%"), 1),
        (Notice.title.ilike("%exam%"), 1),
        (Notice.title.ilike("%schedule%"), 1),
        (Notice.title.ilike("%registration%"), 1),
        (Notice.notice_type.ilike("%academic%"), 2),
        (Notice.notice_type.ilike("%official%"), 3),
        (Notice.notice_type.ilike("%event%"), 4),
        (Notice.title.ilike("%event%"), 4),
        else_=5
    )

    candidates = (
        db.query(Notice)
        .filter(base_filter)
        .order_by(priority_expr.asc(), Notice.published_date.desc(), Notice.id.desc())
        .limit(60)
        .all()
    )

    selected = []
    seen_signatures = set()

    # Pass 1: Select notices not in excluded_set
    for n in candidates:
        if n.id in excluded_set:
            continue
        title_sig = "".join(filter(str.isalnum, (n.title or "").lower()))[:30]
        if title_sig in seen_signatures:
            continue
        seen_signatures.add(title_sig)
        selected.append(n)
        if len(selected) >= limit:
            break

    # Pass 2: If we couldn't fulfill limit, fill from remaining candidates
    if len(selected) < limit:
        for n in candidates:
            if n.id in {s.id for s in selected}:
                continue
            title_sig = "".join(filter(str.isalnum, (n.title or "").lower()))[:30]
            if title_sig in seen_signatures:
                continue
            seen_signatures.add(title_sig)
            selected.append(n)
            if len(selected) >= limit:
                break

    results = []
    for n in selected:
        dest_type, dest_url, dest_label = resolve_notice_destination(
            download_url=getattr(n, "download_url", None),
            document_url=getattr(n, "document_url", None),
            source_url=getattr(n, "source_url", None),
            official_page_url=getattr(n, "official_page_url", None)
        )

        t_lower = (n.title or "").lower()
        type_lower = (n.notice_type or "").lower()
        is_important = any(
            w in t_lower or w in type_lower
            for w in ["exam", "schedule", "urgent", "registration", "deadline", "admit card", "reschedule", "viva", "evaluat", "tender"]
        )

        content_clean = (n.content or "").strip()
        summary = content_clean[:140] + ("..." if len(content_clean) > 140 else "") if content_clean else n.title

        has_pdf = False
        doc_url = getattr(n, "document_url", "") or ""
        dl_url = getattr(n, "download_url", "") or ""
        if ".pdf" in doc_url.lower() or ".pdf" in dl_url.lower():
            has_pdf = True

        results.append({
            "id": n.id,
            "title": n.title,
            "summary": summary,
            "content": n.content,
            "notice_type": n.notice_type or "Official",
            "scope": n.scope,
            "published_date": n.published_date.isoformat() if n.published_date else None,
            "formatted_date": n.published_date.strftime("%d %b %Y") if n.published_date else None,
            "department_code": n.department_code,
            "is_important": is_important,
            "has_pdf": has_pdf,
            "destination_type": dest_type.value,
            "action_url": dest_url,
            "action_label": dest_label,
            "is_actionable": dest_type != DestinationType.UNAVAILABLE
        })

    return results

@router.get("", include_in_schema=False)
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
    # 1. Base security filter: Active, Authentic, and Verified only (excludes demo seeds)
    base_filter = and_(
        Notice.is_active == True,
        Notice.id > 12,
        Notice.data_origin != 'DEMO_SEED',
        Notice.verification_status == VerificationStatus.VERIFIED.value,
        Notice.scope != 'FLAGGED'
    )
    
    # 2. Retrieve student's authorized course IDs for SUBJECT_SPECIFIC access
    student_course_ids = [
        c.id for c in db.query(Course.id).filter(
            Course.department == student_ctx.department_code,
            Course.semester == student_ctx.semester
        ).all()
    ]
    
    subject_condition = Notice.course_id.in_(student_course_ids) if student_course_ids else false()

    # 3. Dynamic cohort matching for computing sister departments & semester indicators
    dept_code = student_ctx.department_code
    semester = student_ctx.semester
    COMPUTING_DEPTS = ["CSE", "IT", "CYBER", "CE"]
    is_computing = dept_code in COMPUTING_DEPTS

    dept_conditions = [
        Notice.department_code == dept_code,
        Notice.department_code == None
    ]
    if is_computing:
        dept_conditions.extend([
            Notice.department_code.in_(COMPUTING_DEPTS),
            Notice.title.ilike("%CS%"),
            Notice.title.ilike("%Computer%"),
            Notice.title.ilike("%Cyber%"),
            Notice.title.ilike("%CE, IT%"),
            Notice.title.ilike("%CS, IT%"),
            Notice.title.ilike("%Information Technology%")
        ])
    dept_match = or_(*dept_conditions)

    ROMAN_MAP = {
        1: ["1st", "I Sem", "Sem I", "First Sem"],
        2: ["2nd", "II Sem", "Sem II", "Second Sem"],
        3: ["3rd", "III Sem", "Sem III", "Third Sem"],
        4: ["4th", "IV Sem", "Sem IV", "Fourth Sem"],
        5: ["5th", "V Sem", "Sem V", "Fifth Sem"],
        6: ["6th", "VI Sem", "Sem VI", "Sixth Sem"],
        7: ["7th", "VII Sem", "Sem VII", "Seventh Sem", "VIIth Sem"],
        8: ["8th", "VIII Sem", "Sem VIII", "Eighth Sem", "VIIIth Sem"]
    }
    sem_tokens = ROMAN_MAP.get(semester, [f"{semester}th"])
    sem_title_conditions = [Notice.title.ilike(f"%{tok}%") for tok in sem_tokens]
    sem_match = or_(
        Notice.target_semester == semester,
        *sem_title_conditions
    )
    
    # 4. Construct comprehensive scope authorization rules
    scope_filter = or_(
        # GLOBAL notices (institution-wide, BTU, registrar, etc.)
        Notice.scope == ClassificationScope.GLOBAL.value,
        
        # DEPARTMENT_SPECIFIC notices (e.g. CSE departmental announcements)
        and_(
            Notice.scope == ClassificationScope.DEPARTMENT_SPECIFIC.value,
            dept_match
        ),
        
        # SEMESTER_SPECIFIC notices (matching department and student's semester or semester title)
        and_(
            Notice.scope == ClassificationScope.SEMESTER_SPECIFIC.value,
            dept_match,
            sem_match
        ),
        
        # Notices whose title specifically matches the student's semester and department
        and_(
            dept_match,
            sem_match
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
