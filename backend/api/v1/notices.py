from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, false
from typing import Any, Optional, List, Dict

from backend.api.deps import get_db, get_current_student_context, StudentContext
from backend.models.academic import Notice, Course, ClassificationScope, VerificationStatus

router = APIRouter()

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
    if q and q.strip():
        search_term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Notice.title.ilike(search_term),
                Notice.content.ilike(search_term)
            )
        )
        
    # Optional category filter
    if category and category.lower() != "all":
        query = query.filter(Notice.notice_type.ilike(category.strip()))
        
    notices = query.order_by(Notice.published_date.desc()).all()
    
    return [
        {
            "id": n.id,
            "title": n.title,
            "content": n.content,
            "notice_type": n.notice_type,
            "source_url": n.source_url,
            "document_url": n.document_url,
            "published_date": n.published_date.isoformat() if n.published_date else None,
            "scope": n.scope,
            "target_semester": n.target_semester,
            "department_code": n.department_code,
            "academic_year": n.academic_year,
            "data_origin": n.data_origin,
            "verification_status": n.verification_status
        }
        for n in notices
    ]
