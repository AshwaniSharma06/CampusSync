from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Any

from backend.api.deps import get_current_user
from backend.models.user import User
from backend.services.rag_service import query_rag

router = APIRouter()

class ChatRequest(BaseModel):
    query: str
    history: list[dict[str, str]] = []

@router.post("/chat")
def chat_with_ai(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Send a question to the CampusSync AI Assistant and get a RAG-backed answer.
    """
    response = query_rag(request.query, request.history)
    
    return {
        "answer": response["answer"],
        "sources": response["sources"]
    }
