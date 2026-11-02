from typing import Any, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from backend.api.deps import get_optional_current_user
from backend.models.user import User
from backend.services.rag_service import query_rag

router = APIRouter()

class ChatRequest(BaseModel):
    query: str
    history: list[dict[str, str]] = []
    student_profile: Optional[dict[str, Any]] = None

@router.post("/chat")
def chat_with_ai(
    request: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> Any:
    """
    Send a question to the CampusSync AI Assistant and get an intelligent, context-aware answer.
    """
    student_context = {}
    if current_user:
        prof = current_user.student_profile
        student_context = {
            "name": current_user.full_name,
            "email": current_user.email,
            "department": prof.department if prof else "Computer Engineering (CSE)",
            "semester": prof.semester if prof else 7,
            "session": f"{prof.enrollment_year} - {prof.enrollment_year + 4}" if prof and prof.enrollment_year else "2022 - 2026",
            "student_id": prof.student_id if prof else "22ECA8941"
        }
    elif request.student_profile:
        student_context = request.student_profile

    response = query_rag(request.query, request.history, student_context=student_context)
    
    return {
        "answer": response["answer"],
        "sources": response["sources"]
    }
