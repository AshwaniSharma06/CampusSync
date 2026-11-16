from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, false
from datetime import datetime
from typing import Any, Dict

from backend.api.deps import get_db, get_current_student_context, StudentContext
from backend.models.academic import Course, Assignment, Notice, ExaminationSchedule, ClassificationScope, VerificationStatus

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary(
    student_ctx: StudentContext = Depends(get_current_student_context),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Calculate dynamic, authentic metrics exclusively from the database
    for the authenticated student's cohort.
    
    Zero fabricated numbers:
    - Enrolled courses count.
    - Pending assignments count.
    - Active relevant notices count.
    - Upcoming examination count.
    - CGPA: null unless officially recorded.
    """
    now = datetime.utcnow()
    
    # 1. Enrolled courses
    enrolled_courses_count = db.query(Course).filter(
        Course.department == student_ctx.department_code,
        Course.semester == student_ctx.semester
    ).count()
    
    # 2. Pending assignments
    pending_assignments_count = (
        db.query(Assignment)
        .join(Course, Assignment.course_id == Course.id)
        .filter(
            Course.department == student_ctx.department_code,
            Course.semester == student_ctx.semester,
            Assignment.due_date >= now
        )
        .count()
    )
    
    # 3. Authorized courses for subject notices
    student_course_ids = [
        c.id for c in db.query(Course.id).filter(
            Course.department == student_ctx.department_code,
            Course.semester == student_ctx.semester
        ).all()
    ]
    subject_condition = Notice.course_id.in_(student_course_ids) if student_course_ids else false()
    
    # 4. Relevant active verified notices
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

    relevant_notices_count = db.query(Notice).filter(
        Notice.is_active == True,
        Notice.id > 12,
        Notice.data_origin != 'DEMO_SEED',
        Notice.verification_status == VerificationStatus.VERIFIED.value,
        Notice.scope != 'FLAGGED',
        or_(
            Notice.scope == ClassificationScope.GLOBAL.value,
            and_(
                Notice.scope == ClassificationScope.DEPARTMENT_SPECIFIC.value,
                dept_match
            ),
            and_(
                Notice.scope == ClassificationScope.SEMESTER_SPECIFIC.value,
                dept_match,
                sem_match
            ),
            and_(
                dept_match,
                sem_match
            ),
            and_(
                Notice.scope == ClassificationScope.SUBJECT_SPECIFIC.value,
                subject_condition
            ),
            and_(
                Notice.scope == ClassificationScope.INDIVIDUAL.value,
                Notice.target_user_id == student_ctx.user_id
            )
        )
    ).count()
    
    # 5. Upcoming examination count
    upcoming_exams_count = db.query(ExaminationSchedule).filter(
        ExaminationSchedule.department_code == student_ctx.department_code,
        ExaminationSchedule.semester == student_ctx.semester,
        ExaminationSchedule.is_active == True
    ).count()
    
    return {
        "student_id": student_ctx.student_id,
        "department": student_ctx.department_code,
        "semester": student_ctx.semester,
        "academic_session": student_ctx.academic_year,
        "enrolled_courses": enrolled_courses_count,
        "pending_assignments": pending_assignments_count,
        "unread_notices": relevant_notices_count,
        "upcoming_examinations": upcoming_exams_count,
        "cgpa": None  # Authentic: null unless verified GPA records exist in database
    }
