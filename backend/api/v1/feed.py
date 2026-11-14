from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, case
from typing import Any, Optional, List, Dict, Set
from datetime import datetime

from backend.api.deps import get_db, get_optional_current_user, normalize_department_code
from backend.models.user import User
from backend.models.academic import (
    Notice,
    AcademicResource,
    ExaminationSchedule,
    Course,
    ClassificationScope,
    VerificationStatus
)
from backend.models.social import SavedItem
from backend.services.url_validator import resolve_notice_destination, DestinationType

router = APIRouter()

OPPORTUNITY_KEYWORDS = [
    "workshop", "hackathon", "competition", "internship", "fellowship",
    "bootcamp", "training", "scholarship", "smart india hackathon", "sih",
    "seminar", "webinar", "coding", "placement drive"
]

EXAM_KEYWORDS = [
    "exam", "examination", "mid-term", "midterm", "end-term", "practical",
    "viva", "time table", "schedule", "admit card", "back exam"
]


def format_notice_item(
    notice: Notice,
    category_key: str,
    category_label: str,
    reason: Optional[str] = None,
    saved_set: Optional[Set[int]] = None
) -> Dict[str, Any]:
    dest_type, dest_url, dest_label = resolve_notice_destination(
        download_url=getattr(notice, "download_url", None),
        document_url=getattr(notice, "document_url", None),
        source_url=getattr(notice, "source_url", None),
        official_page_url=getattr(notice, "official_page_url", None)
    )

    t_lower = (notice.title or "").lower()
    is_important = any(
        w in t_lower
        for w in ["urgent", "exam", "schedule", "registration", "deadline", "admit card", "mandatory", "important"]
    )

    content_clean = (notice.content or "").strip()
    summary = content_clean[:180] + ("..." if len(content_clean) > 180 else "") if content_clean else notice.title

    has_pdf = False
    doc_url = getattr(notice, "document_url", "") or ""
    dl_url = getattr(notice, "download_url", "") or ""
    if ".pdf" in doc_url.lower() or ".pdf" in dl_url.lower():
        has_pdf = True

    source_name = "Govt. Engineering College Ajmer"
    if notice.department_code:
        source_name = f"{notice.department_code} Department • ECA"
    elif "btu" in t_lower or "bikaner" in t_lower:
        source_name = "Bikaner Technical University (BTU)"

    return {
        "id": notice.id,
        "item_type": "notice",
        "title": notice.title,
        "summary": summary,
        "category_key": category_key,
        "category_label": category_label,
        "source": source_name,
        "published_date": notice.published_date.isoformat() if notice.published_date else None,
        "formatted_date": notice.published_date.strftime("%d %b %Y") if notice.published_date else "Recent",
        "department_code": notice.department_code,
        "target_semester": notice.target_semester,
        "scope": notice.scope,
        "is_important": is_important,
        "has_pdf": has_pdf,
        "destination_type": dest_type.value,
        "action_url": dest_url,
        "action_label": dest_label,
        "is_actionable": dest_type != DestinationType.UNAVAILABLE,
        "recommendation_reason": reason,
        "is_saved": notice.id in (saved_set or set())
    }


def format_exam_item(
    exam: ExaminationSchedule,
    saved_set: Optional[Set[int]] = None
) -> Dict[str, Any]:
    return {
        "id": f"exam-{exam.id}",
        "item_type": "examination",
        "title": f"{exam.subject_name} ({exam.course_code}) – {exam.exam_type}",
        "summary": f"Scheduled for {exam.exam_date} {f'at {exam.start_time}' if exam.start_time else ''}. Venue: {exam.exam_hall or 'Academic Block'}.",
        "category_key": "semester",
        "category_label": "For Your Semester",
        "source": f"BTU Examination Cell • {exam.department_code}",
        "published_date": exam.created_at.isoformat() if exam.created_at else None,
        "formatted_date": exam.exam_date or "Scheduled",
        "department_code": exam.department_code,
        "target_semester": exam.semester,
        "scope": "SEMESTER_SPECIFIC",
        "is_important": True,
        "has_pdf": False,
        "destination_type": DestinationType.OFFICIAL_PAGE.value,
        "action_url": "https://www.ecajmer.ac.in/academics/examinations",
        "action_label": "View Examination Schedule",
        "is_actionable": True,
        "recommendation_reason": f"Official {exam.exam_type} for your {exam.department_code} Semester {exam.semester} cohort",
        "is_saved": False
    }


def format_resource_item(
    res: AcademicResource,
    category_key: str,
    category_label: str,
    reason: Optional[str] = None,
    saved_set: Optional[Set[int]] = None
) -> Dict[str, Any]:
    dest_type, dest_url, dest_label = resolve_notice_destination(
        download_url=getattr(res, "download_url", None),
        document_url=getattr(res, "document_url", None),
        source_url=getattr(res, "source_url", None)
    )

    return {
        "id": f"res-{res.id}",
        "item_type": "resource",
        "title": res.title,
        "summary": f"Verified academic curriculum resource for {res.department_code or 'All Departments'}. File size: {res.file_size or 'Verified PDF'}.",
        "category_key": category_key,
        "category_label": category_label,
        "source": f"{res.department_code or 'Academic'} Resource Cell",
        "published_date": res.uploaded_at.isoformat() if res.uploaded_at else None,
        "formatted_date": res.uploaded_at.strftime("%d %b %Y") if res.uploaded_at else "Verified",
        "department_code": res.department_code,
        "target_semester": res.target_semester,
        "scope": res.scope or "GLOBAL",
        "is_important": False,
        "has_pdf": True,
        "destination_type": dest_type.value,
        "action_url": dest_url,
        "action_label": dest_label or "Open Resource Document",
        "is_actionable": True,
        "recommendation_reason": reason,
        "is_saved": res.id in (saved_set or set())
    }


@router.get("")
@router.get("/")
def get_intelligent_feed(
    category: Optional[str] = Query(None, description="Category filter: all, semester, department, college, opportunities, recommended"),
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Intelligent Personalized Curated Feed Endpoint.
    
    Provides two strict experiences:
    1. Authenticated Student: Tailored feed divided into:
       - For Your Semester
       - Your Department
       - College Updates
       - Learning & Opportunities
       - Recommended For You
       Strictly enforces department & semester scopes; never leaks other department notices.
       
    2. Non-authenticated Visitor: Public feed only containing verified GLOBAL notices.
       Never exposes department-restricted or semester-restricted records.
    """
    # 1. Determine student identity and authorization parameters
    is_authenticated = current_user is not None
    student_meta = None
    saved_notice_ids: Set[int] = set()

    dept_code: Optional[str] = None
    semester: Optional[int] = None
    interests: List[str] = []
    academic_year: Optional[str] = None
    is_profile_incomplete = False

    if is_authenticated and current_user:
        profile = current_user.student_profile
        if profile and profile.department and profile.semester is not None:
            dept_code = normalize_department_code(profile.department)
            semester = int(profile.semester)
            if profile.enrollment_year:
                academic_year = f"{profile.enrollment_year} – {profile.enrollment_year + 4}"
            else:
                academic_year = "2026-27"
            if profile.interests:
                interests = [i.strip() for i in profile.interests.split(",") if i.strip()]
        else:
            is_profile_incomplete = True

        student_meta = {
            "full_name": current_user.full_name,
            "first_name": current_user.full_name.split()[0] if current_user.full_name else "Student",
            "email": current_user.email,
            "department": profile.department if profile else None,
            "department_code": dept_code,
            "semester": semester,
            "academic_year": academic_year,
            "interests": interests,
            "is_profile_incomplete": is_profile_incomplete
        }

        # Retrieve student's saved notice IDs
        saved_items = db.query(SavedItem.item_id).filter(
            SavedItem.user_id == current_user.id,
            SavedItem.item_type == "notice"
        ).all()
        saved_notice_ids = {s[0] for s in saved_items}

    # 2. Base Security Filter: Always active and verified, never unclassified or individual
    base_notice_filter = and_(
        Notice.is_active == True,
        Notice.verification_status == VerificationStatus.VERIFIED.value,
        Notice.scope != ClassificationScope.UNCLASSIFIED.value,
        Notice.scope != ClassificationScope.INDIVIDUAL.value
    )

    # Buckets
    semester_items: List[Dict[str, Any]] = []
    dept_items: List[Dict[str, Any]] = []
    college_items: List[Dict[str, Any]] = []
    opportunity_items: List[Dict[str, Any]] = []
    recommended_items: List[Dict[str, Any]] = []

    seen_notice_ids: Set[int] = set()

    # -------------------------------------------------------------
    # CASE A: LOGGED-IN STUDENT WITH COMPLETE PROFILE
    # -------------------------------------------------------------
    if is_authenticated and dept_code and semester:
        # Category 1: For Your Semester
        # Notices targeting this exact semester + department OR semester-specific with exam keyword
        sem_notices = db.query(Notice).filter(
            base_notice_filter,
            or_(
                and_(
                    Notice.scope == ClassificationScope.SEMESTER_SPECIFIC.value,
                    Notice.department_code == dept_code,
                    Notice.target_semester == semester
                ),
                and_(
                    Notice.target_semester == semester,
                    or_(
                        Notice.department_code == dept_code,
                        Notice.department_code == None
                    )
                )
            )
        ).order_by(Notice.published_date.desc()).limit(15).all()

        for n in sem_notices:
            if n.id not in seen_notice_ids:
                seen_notice_ids.add(n.id)
                semester_items.append(
                    format_notice_item(
                        n,
                        category_key="semester",
                        category_label="For Your Semester",
                        reason=f"Semester {semester} academic schedule & official update",
                        saved_set=saved_notice_ids
                    )
                )

        # Also include official Examination Schedules matching cohort
        cohort_exams = db.query(ExaminationSchedule).filter(
            ExaminationSchedule.is_active == True,
            ExaminationSchedule.department_code == dept_code,
            ExaminationSchedule.semester == semester
        ).order_by(ExaminationSchedule.exam_date.asc()).limit(5).all()

        for ex in cohort_exams:
            semester_items.append(format_exam_item(ex, saved_set=saved_notice_ids))

        # Category 2: Your Department
        # Notices targeting the department (excluding those already in semester)
        dept_notices = db.query(Notice).filter(
            base_notice_filter,
            Notice.scope == ClassificationScope.DEPARTMENT_SPECIFIC.value,
            Notice.department_code == dept_code
        ).order_by(Notice.published_date.desc()).limit(20).all()

        for n in dept_notices:
            if n.id not in seen_notice_ids:
                seen_notice_ids.add(n.id)
                dept_items.append(
                    format_notice_item(
                        n,
                        category_key="department",
                        category_label="Your Department",
                        reason=f"Official {dept_code} departmental circular",
                        saved_set=saved_notice_ids
                    )
                )

        # Include department academic resources
        dept_resources = db.query(AcademicResource).filter(
            AcademicResource.department_code == dept_code
        ).order_by(AcademicResource.uploaded_at.desc()).limit(5).all()

        for r in dept_resources:
            dept_items.append(
                format_resource_item(
                    r,
                    category_key="department",
                    category_label="Your Department",
                    reason=f"{dept_code} curriculum & syllabus document"
                )
            )

        # Category 3: College Updates (GLOBAL notices)
        global_notices = db.query(Notice).filter(
            base_notice_filter,
            Notice.scope == ClassificationScope.GLOBAL.value
        ).order_by(Notice.published_date.desc()).limit(25).all()

        for n in global_notices:
            if n.id not in seen_notice_ids:
                seen_notice_ids.add(n.id)
                college_items.append(
                    format_notice_item(
                        n,
                        category_key="college",
                        category_label="College Updates",
                        reason="College-wide institutional announcement",
                        saved_set=saved_notice_ids
                    )
                )

        # Category 4: Learning & Opportunities
        # Filter for actual technical opportunities (hackathons, workshops, training)
        opp_conditions = [Notice.title.ilike(f"%{kw}%") for kw in OPPORTUNITY_KEYWORDS] + \
                         [Notice.content.ilike(f"%{kw}%") for kw in OPPORTUNITY_KEYWORDS]
        opp_notices = db.query(Notice).filter(
            base_notice_filter,
            or_(*opp_conditions),
            or_(
                Notice.scope == ClassificationScope.GLOBAL.value,
                Notice.department_code == dept_code
            )
        ).order_by(Notice.published_date.desc()).limit(15).all()

        for n in opp_notices:
            opportunity_items.append(
                format_notice_item(
                    n,
                    category_key="opportunities",
                    category_label="Learning & Opportunities",
                    reason="Technical event, workshop, or skill opportunity",
                    saved_set=saved_notice_ids
                )
            )

        # Category 5: Recommended For You
        # Scoring based on cohort match, importance, and student's personal interests
        candidate_notices = db.query(Notice).filter(
            base_notice_filter,
            or_(
                Notice.scope == ClassificationScope.GLOBAL.value,
                Notice.department_code == dept_code,
                Notice.target_semester == semester
            )
        ).order_by(Notice.published_date.desc()).limit(40).all()

        scored_candidates = []
        for n in candidate_notices:
            score = 0
            reason_parts = []
            t_lower = (n.title or "").lower()
            c_lower = (n.content or "").lower()

            if n.target_semester == semester and n.department_code == dept_code:
                score += 50
                reason_parts.append(f"you are a {dept_code} Semester {semester} student")
            elif n.department_code == dept_code:
                score += 35
                reason_parts.append(f"it pertains to the {dept_code} Department")
            elif any(k in t_lower for k in EXAM_KEYWORDS):
                score += 30
                reason_parts.append("it contains critical examination schedules")

            for interest in interests:
                if interest.lower() in t_lower or interest.lower() in c_lower:
                    score += 40
                    reason_parts.append(f"you are interested in {interest}")

            if score > 0:
                reason_str = f"Recommended because {', and '.join(reason_parts)}."
                scored_candidates.append((score, n, reason_str))

        scored_candidates.sort(key=lambda x: x[0], reverse=True)
        for _, n, r_str in scored_candidates[:10]:
            recommended_items.append(
                format_notice_item(
                    n,
                    category_key="recommended",
                    category_label="Recommended For You",
                    reason=r_str,
                    saved_set=saved_notice_ids
                )
            )

    # -------------------------------------------------------------
    # CASE B: VISITOR / LOGGED-OUT OR INCOMPLETE PROFILE
    # -------------------------------------------------------------
    else:
        # STRICT PUBLIC VISITOR FEED: ONLY GLOBAL verified notices
        public_notices = db.query(Notice).filter(
            base_notice_filter,
            Notice.scope == ClassificationScope.GLOBAL.value
        ).order_by(Notice.published_date.desc()).limit(40).all()

        for n in public_notices:
            item = format_notice_item(
                n,
                category_key="college",
                category_label="College Updates",
                reason="Public college announcement available to all visitors",
                saved_set=set()
            )
            college_items.append(item)

        # Filter public opportunities if any exist under GLOBAL
        opp_conditions = [Notice.title.ilike(f"%{kw}%") for kw in OPPORTUNITY_KEYWORDS]
        public_opps = db.query(Notice).filter(
            base_notice_filter,
            Notice.scope == ClassificationScope.GLOBAL.value,
            or_(*opp_conditions)
        ).order_by(Notice.published_date.desc()).limit(8).all()

        for n in public_opps:
            opportunity_items.append(
                format_notice_item(
                    n,
                    category_key="opportunities",
                    category_label="Learning & Opportunities",
                    reason="Public technical workshop / institutional challenge",
                    saved_set=set()
                )
            )

    # -------------------------------------------------------------
    # AGGREGATION & CATEGORY SELECTION
    # -------------------------------------------------------------
    # Construct master "All" feed deduplicated in priority order
    all_combined: List[Dict[str, Any]] = []
    seen_all_signatures: Set[str] = set()

    for item in semester_items + dept_items + recommended_items + opportunity_items + college_items:
        sig = str(item.get("id"))
        if sig not in seen_all_signatures:
            seen_all_signatures.add(sig)
            all_combined.append(item)

    # Counts dictionary
    counts = {
        "all": len(all_combined),
        "semester": len(semester_items),
        "department": len(dept_items),
        "college": len(college_items),
        "opportunities": len(opportunity_items),
        "recommended": len(recommended_items)
    }

    # Select target category
    clean_cat = (category or "all").lower().strip()
    if clean_cat == "semester":
        items_pool = semester_items
    elif clean_cat == "department":
        items_pool = dept_items
    elif clean_cat == "college":
        items_pool = college_items
    elif clean_cat in ["opportunities", "learning"]:
        items_pool = opportunity_items
    elif clean_cat == "recommended":
        items_pool = recommended_items
    else:
        clean_cat = "all"
        items_pool = all_combined

    # Apply pagination
    paginated_items = items_pool[offset : offset + limit]

    return {
        "is_authenticated": is_authenticated,
        "student": student_meta,
        "active_category": clean_cat,
        "counts": counts,
        "total_items": len(items_pool),
        "has_more": (offset + limit) < len(items_pool),
        "items": paginated_items
    }

