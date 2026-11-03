"""
CampusSync AI: RAG Chat & Persistent Conversation Sessions API.
Supports multi-turn persistent conversation sessions, session restoration,
renaming, deletion, and cohort-scoped dynamic AI generation.
"""

import json
from datetime import datetime
from typing import Any, Optional, List, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.api.deps import get_db, get_current_user, get_optional_current_user
from backend.models.user import User
from backend.models.system import ChatSession, ChatMessage
from backend.services.rag_service import query_rag

router = APIRouter()

# -------------------------------------------------------------------------
# Request / Response Models
# -------------------------------------------------------------------------

class ChatRequest(BaseModel):
    query: str
    session_id: Optional[int] = None
    history: List[Dict[str, str]] = []
    student_profile: Optional[Dict[str, Any]] = None

class SessionCreateRequest(BaseModel):
    title: Optional[str] = "New Conversation"

class SessionUpdateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)

class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    sources: List[Dict[str, Any]] = []
    rewritten_query: Optional[str] = None
    created_at: str

class SessionSummaryResponse(BaseModel):
    id: int
    title: str
    created_at: str
    updated_at: str
    message_count: int

class SessionDetailResponse(BaseModel):
    id: int
    title: str
    created_at: str
    updated_at: str
    messages: List[MessageResponse]

# -------------------------------------------------------------------------
# Session Management Endpoints
# -------------------------------------------------------------------------

@router.get("/sessions", response_model=List[SessionSummaryResponse])
def list_student_chat_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[SessionSummaryResponse]:
    """
    Returns all active persistent conversation sessions owned by the authenticated student.
    Strictly isolated: students can never view another student's sessions.
    """
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id,
        ChatSession.is_active == True
    ).order_by(ChatSession.updated_at.desc(), ChatSession.created_at.desc()).all()

    results = []
    for s in sessions:
        msg_count = db.query(ChatMessage).filter(ChatMessage.session_id == s.id).count()
        results.append(SessionSummaryResponse(
            id=s.id,
            title=s.title or "New Conversation",
            created_at=s.created_at.isoformat() if s.created_at else datetime.utcnow().isoformat(),
            updated_at=s.updated_at.isoformat() if s.updated_at else (s.created_at.isoformat() if s.created_at else datetime.utcnow().isoformat()),
            message_count=msg_count
        ))
    return results

@router.post("/sessions", response_model=SessionSummaryResponse, status_code=status.HTTP_201_CREATED)
def create_chat_session(
    req: SessionCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> SessionSummaryResponse:
    """
    Creates a new independent conversation session for the authenticated student.
    """
    now = datetime.utcnow()
    new_session = ChatSession(
        user_id=current_user.id,
        title=(req.title or "New Conversation").strip(),
        created_at=now,
        updated_at=now,
        is_active=True
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return SessionSummaryResponse(
        id=new_session.id,
        title=new_session.title,
        created_at=new_session.created_at.isoformat(),
        updated_at=new_session.updated_at.isoformat(),
        message_count=0
    )

@router.get("/sessions/{session_id}", response_model=SessionDetailResponse)
def get_chat_session_details(
    session_id: int,
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> SessionDetailResponse:
    """
    Retrieves a specific conversation session and its stored messages.
    Enforces student ownership validation: returns 404 if not found or owned by another user.
    """
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
        ChatSession.is_active == True
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation session not found"
        )

    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id
    ).order_by(ChatMessage.created_at.asc()).offset(skip).limit(limit).all()

    formatted_messages = []
    for m in messages:
        sources_list = []
        if m.sources:
            try:
                sources_list = json.loads(m.sources)
            except Exception:
                sources_list = []

        formatted_messages.append(MessageResponse(
            id=m.id,
            role=m.role,
            content=m.content,
            sources=sources_list,
            rewritten_query=m.rewritten_query,
            created_at=m.created_at.isoformat() if m.created_at else datetime.utcnow().isoformat()
        ))

    return SessionDetailResponse(
        id=session.id,
        title=session.title,
        created_at=session.created_at.isoformat() if session.created_at else datetime.utcnow().isoformat(),
        updated_at=session.updated_at.isoformat() if session.updated_at else datetime.utcnow().isoformat(),
        messages=formatted_messages
    )

@router.patch("/sessions/{session_id}", response_model=SessionSummaryResponse)
def rename_chat_session(
    session_id: int,
    req: SessionUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> SessionSummaryResponse:
    """
    Renames a student's conversation session.
    """
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
        ChatSession.is_active == True
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation session not found"
        )

    session.title = req.title.strip()
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)

    msg_count = db.query(ChatMessage).filter(ChatMessage.session_id == session.id).count()

    return SessionSummaryResponse(
        id=session.id,
        title=session.title,
        created_at=session.created_at.isoformat() if session.created_at else datetime.utcnow().isoformat(),
        updated_at=session.updated_at.isoformat() if session.updated_at else datetime.utcnow().isoformat(),
        message_count=msg_count
    )

@router.delete("/sessions/{session_id}")
def delete_chat_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Deletes/deactivates a student's conversation session.
    Enforces student ownership validation.
    """
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
        ChatSession.is_active == True
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation session not found"
        )

    session.is_active = False
    session.updated_at = datetime.utcnow()
    db.commit()

    return {
        "status": "success",
        "message": f"Conversation #{session_id} successfully deleted"
    }

# -------------------------------------------------------------------------
# Main Chat Endpoint
# -------------------------------------------------------------------------

@router.post("/chat")
def chat_with_ai(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> Any:
    """
    Send a question to the CampusSync AI Assistant and get an intelligent, context-aware answer.
    If authenticated, automatically links to or creates a persistent ChatSession and stores messages.
    """
    student_context = {}
    active_session: Optional[ChatSession] = None

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

        # 1. Resolve or create persistent ChatSession
        if request.session_id:
            active_session = db.query(ChatSession).filter(
                ChatSession.id == request.session_id,
                ChatSession.user_id == current_user.id,
                ChatSession.is_active == True
            ).first()
            if not active_session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Conversation session #{request.session_id} not found or unauthorized"
                )
        else:
            now = datetime.utcnow()
            active_session = ChatSession(
                user_id=current_user.id,
                title="New Conversation",
                created_at=now,
                updated_at=now,
                is_active=True
            )
            db.add(active_session)
            db.commit()
            db.refresh(active_session)

        # 2. Reconstruct history from database if not supplied or partial
        effective_history = request.history
        if not effective_history and active_session:
            stored_msgs = db.query(ChatMessage).filter(
                ChatMessage.session_id == active_session.id
            ).order_by(ChatMessage.created_at.asc()).limit(12).all()
            effective_history = [
                {"role": m.role, "content": m.content}
                for m in stored_msgs
            ]

    elif request.student_profile:
        student_context = request.student_profile
        effective_history = request.history
    else:
        effective_history = request.history

    # 3. Call Intelligent RAG Engine
    response = query_rag(
        question=request.query,
        history=effective_history,
        student_context=student_context
    )

    # 4. If session is active, persist User message and Assistant response
    if current_user and active_session:
        now = datetime.utcnow()

        # Update title from first query if still "New Conversation"
        if active_session.title in ["New Conversation", "New Chat"]:
            words = request.query.strip().split()
            title_candidate = " ".join(words[:6])
            if len(words) > 6:
                title_candidate += "..."
            active_session.title = title_candidate[:150]

        # Record User Message
        user_msg = ChatMessage(
            session_id=active_session.id,
            role="user",
            content=request.query.strip(),
            created_at=now
        )
        db.add(user_msg)

        # Record Assistant Message
        sources_json = json.dumps(response.get("sources", []))
        assistant_msg = ChatMessage(
            session_id=active_session.id,
            role="assistant",
            content=response.get("answer", ""),
            sources=sources_json,
            rewritten_query=response.get("rewritten_query", ""),
            created_at=datetime.utcnow()
        )
        db.add(assistant_msg)

        active_session.updated_at = datetime.utcnow()
        db.commit()

    return {
        "session_id": active_session.id if active_session else None,
        "answer": response["answer"],
        "sources": response["sources"],
        "rewritten_query": response.get("rewritten_query", "")
    }
