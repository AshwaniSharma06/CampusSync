from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.models.academic import Notice, Assignment, Course, AcademicResource
from backend.models.social import Event, Club
from backend.models.user import User, StudentProfile

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
        # Extract student profile if user is provided
        if current_user and current_user.student_profile:
            profile = current_user.student_profile
            department = department or profile.department
            semester = semester or profile.semester
            if not interests and profile.interests:
                interests = [i.strip() for i in profile.interests.split(',') if i.strip()]

        department = department or "Computer Science & Engineering"
        semester = semester or 7
        interests = interests or ["AI & Machine Learning", "Web Development"]

        recommendations: List[Dict[str, Any]] = []
        alerts: List[Dict[str, Any]] = []

        # 1. Urgent Deadlines / Due Soon Assignments
        now = datetime.utcnow()
        due_threshold = now + timedelta(days=7)
        try:
            upcoming_assignments = (
                db.query(Assignment)
                .join(Course, Assignment.course_id == Course.id, isouter=True)
                .filter(Assignment.due_date >= now)
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

        # 2. Recommended Notices for Department & Semester
        dept_keywords = [department.split()[0].lower(), "exam", "btu", "placement", "semester"]
        try:
            notices = db.query(Notice).order_by(Notice.published_date.desc()).limit(15).all()
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
