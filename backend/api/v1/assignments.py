from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Any, List, Dict

from backend.api.deps import get_db, get_current_student_context, StudentContext
from backend.models.academic import Assignment, Course

router = APIRouter()

@router.get("/")
def get_assignments(
    student_ctx: StudentContext = Depends(get_current_student_context),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get assignments exclusively for courses in the authenticated student's
    department and semester.
    
    Prevents unauthorized access across semester and department boundaries.
    """
    assignments = (
        db.query(Assignment)
        .join(Course, Assignment.course_id == Course.id)
        .filter(
            Course.department == student_ctx.department_code,
            Course.semester == student_ctx.semester
        )
        .order_by(Assignment.due_date.asc())
        .all()
    )
    
    return [
        {
            "id": a.id,
            "course_id": a.course_id,
            "title": a.title,
            "description": a.description,
            "due_date": a.due_date.isoformat() if a.due_date else None,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "data_origin": a.data_origin
        }
        for a in assignments
    ]
