from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, false

from backend.models.academic import Notice, Assignment, Course, AcademicResource, ClassificationScope, VerificationStatus
from backend.models.social import Event, Club
from backend.models.user import User, StudentProfile
from backend.api.deps import normalize_department_code

class RecommendationEngine:
    """
    Rule-based recommendation and smart alert engine for CampusSync.
    Tailors academic resources, events, notices, and deadlines to a student's
    specific department, semester, and personal interests.
    """

    @staticmethod
    def get_student_recommendations(
        db: Session,
        current_user: Optional[User] = None,
        department: Optional[str] = None,
        semester: Optional[int] = None,
        interests: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        # Enforce server-side student profile when authenticated
        if current_user and current_user.student_profile:
            profile = current_user.student_profile
            department = normalize_department_code(profile.department)
            semester = profile.semester
            if not interests and profile.interests:
                interests = [i.strip() for i in profile.interests.split(',') if i.strip()]
        else:
            department = normalize_department_code(department) if department else None

        recommendations: List[Dict[str, Any]] = []
        alerts: List[Dict[str, Any]] = []

        # If student profile is incomplete and no cohort is specified, return empty recommendations
        if not department or not semester:
            return {"recommendations": [], "alerts": []}

        interests = interests or []

        # 1. Urgent Deadlines / Due Soon Assignments for student's specific cohort
        now = datetime.utcnow()
        due_threshold = now + timedelta(days=7)
        try:
            upcoming_assignments = (
                db.query(Assignment)
                .join(Course, Assignment.course_id == Course.id)
                .filter(
                    Course.department == department,
                    Course.semester == semester,
                    Assignment.due_date >= now
                )
                .order_by(Assignment.due_date.asc())
                .limit(5)
                .all()
            )
            for a in upcoming_assignments:
                days_left = (a.due_date - now).days
                severity = "high" if days_left <= 2 else "medium"
                alerts.append({
                    "id": f"assign-{a.id}",
                    "title": f"Assignment Due: {a.title}",
                    "course": a.course.title if a.course else "Core Subject",
                    "due_date": a.due_date.isoformat(),
                    "days_left": max(0, days_left),
                    "severity": severity,
                    "type": "deadline"
                })
        except Exception:
            pass

        # 2. Recommended Notices for Department & Semester (Strictly Active & Verified)
        dept_keywords = [department.lower(), "exam", "btu", "placement", "semester"]
        try:
            notices = db.query(Notice).filter(
                Notice.is_active == True,
                Notice.verification_status == VerificationStatus.VERIFIED.value,
                Notice.scope != ClassificationScope.UNCLASSIFIED.value,
                or_(
                    Notice.scope == ClassificationScope.GLOBAL.value,
                    and_(
                        Notice.department_code == department,
                        or_(
                            Notice.target_semester == None,
                            Notice.target_semester == semester
                        )
                    )
                )
            ).order_by(Notice.published_date.desc()).limit(15).all()
            for notice in notices:
                score = 0
                title_lower = notice.title.lower()
                content_lower = notice.content.lower()

                # Rule: Department relevance
                if any(k in title_lower or k in content_lower for k in dept_keywords):
                    score += 40

                # Rule: Interest matching
                for interest in interests:
                    if interest.lower() in title_lower or interest.lower() in content_lower:
                        score += 50

                if score > 0 or len(recommendations) < 2:
                    recommendations.append({
                        "id": f"notice-{notice.id}",
                        "title": notice.title,
                        "category": notice.notice_type.value if hasattr(notice.notice_type, 'value') else "Notice",
                        "reason": f"Matches your {department.split()[0]} focus & semester curriculum",
                        "type": "notice",
                        "score": score + 20,
                        "date": notice.published_date.strftime("%b %d, %Y") if notice.published_date else "Recently",
                        "source_url": notice.source_url or notice.document_url or "#"
                    })
        except Exception:
            pass

        # 3. Recommended Clubs & Upcoming Events matching interests
        try:
            events = db.query(Event).order_by(Event.event_date.asc()).limit(10).all()
            for ev in events:
                score = 10
                ev_text = f"{ev.title} {ev.description or ''} {ev.category or ''}".lower()
                for interest in interests:
                    if any(w in ev_text for w in interest.lower().split()):
                        score += 35
                
                recommendations.append({
                    "id": f"event-{ev.id}",
                    "title": ev.title,
                    "category": ev.category or "Campus Event",
                    "reason": f"Recommended based on your interest in {interests[0] if interests else 'campus tech'}",
                    "type": "event",
                    "score": score,
                    "date": ev.event_date.strftime("%b %d, %Y") if ev.event_date else "Upcoming",
                    "location": ev.location or "Campus Auditorium",
                    "image_url": ev.image_url
                })
        except Exception:
            pass

        # Sort recommendations by score descending
        recommendations.sort(key=lambda x: x.get("score", 0), reverse=True)

        return {
            "department": department,
            "semester": semester,
            "interests": interests,
            "total_recommendations": len(recommendations),
            "recommendations": recommendations[:6],
            "alerts": alerts
        }
