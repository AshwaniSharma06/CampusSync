from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Any, List, Dict

from backend.api.deps import get_db, get_current_student_context, StudentContext
from backend.models.academic import ExaminationSchedule

router = APIRouter()

@router.get("/")
def get_examination_schedules(
    student_ctx: StudentContext = Depends(get_current_student_context),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Retrieve official examination schedules exclusively for the authenticated
    student's department and semester.
    
    Excludes examination schedules belonging to any other semester or department cohort.
    Returns [] when no schedule has been published for this semester.
    """
    schedules = db.query(ExaminationSchedule).filter(
        ExaminationSchedule.department_code == student_ctx.department_code,
        ExaminationSchedule.semester == student_ctx.semester,
        ExaminationSchedule.is_active == True
    ).order_by(ExaminationSchedule.exam_date.asc()).all()
    
    return [
        {
            "id": e.id,
            "course_id": e.course_id,
            "course_code": e.course_code,
            "subject_name": e.subject_name,
            "department_code": e.department_code,
            "semester": e.semester,
            "exam_type": e.exam_type,
            "exam_date": e.exam_date,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "exam_hall": e.exam_hall,
            "academic_session": e.academic_session,
            "data_origin": e.data_origin
        }
        for e in schedules
    ]
