from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Any, List, Dict

from backend.api.deps import get_db, get_current_student_context, StudentContext
from backend.models.academic import Course

router = APIRouter()

@router.get("/")
def get_courses(
    student_ctx: StudentContext = Depends(get_current_student_context),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get enrolled curriculum courses strictly for the authenticated student's
    department and semester.
    
    Prevents students from accessing courses belonging to other semesters or departments.
    Returns an empty list [] if no courses are scheduled.
    """
    courses = db.query(Course).filter(
        Course.department == student_ctx.department_code,
        Course.semester == student_ctx.semester
    ).order_by(Course.code.asc()).all()
    
    return [
        {
            "id": c.id,
            "code": c.code,
            "title": c.title,
            "instructor": c.instructor,
            "department": c.department,
            "semester": c.semester,
            "credits": c.credits,
            "syllabus_summary": c.syllabus_summary,
            "data_origin": c.data_origin
        }
        for c in courses
    ]
