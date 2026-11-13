import re
import html
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, field_validator

def sanitize_text(text: str) -> str:
    """Strip dangerous tags and unescape/escape safely to prevent XSS"""
    if not text:
        return ""
    # Remove HTML tags
    cleaned = re.sub(r'<[^>]+>', '', text)
    # Escape special characters
    return html.escape(cleaned).strip()

class AttachmentResponse(BaseModel):
    id: int
    file_type: str # 'image' | 'document'
    file_name: str
    file_url: str
    file_size: int
    mime_type: str

    class Config:
        from_attributes = True

class PollOptionCreate(BaseModel):
    option_text: str = Field(..., min_length=1, max_length=200)

    @field_validator("option_text")
    @classmethod
    def sanitize_opt(cls, v: str) -> str:
        s = sanitize_text(v)
        if not s:
            raise ValueError("Poll option cannot be empty.")
        return s

class PollOptionResponse(BaseModel):
    id: int
    option_text: str
    votes_count: int = 0
    percentage: float = 0.0

    class Config:
        from_attributes = True

class PollCreate(BaseModel):
    question: str = Field(..., min_length=3, max_length=300)
    options: List[str] = Field(..., min_length=2, max_length=6)
    is_multiple_choice: bool = False
    duration_days: Optional[int] = Field(default=7, ge=1, le=30)

    @field_validator("question")
    @classmethod
    def sanitize_q(cls, v: str) -> str:
        s = sanitize_text(v)
        if len(s) < 3:
            raise ValueError("Poll question must be at least 3 characters.")
        return s

class PollResponse(BaseModel):
    id: int
    question: str
    is_multiple_choice: bool = False
    options: List[PollOptionResponse] = []
    total_votes: int = 0
    expires_at: Optional[datetime] = None
    is_expired: bool = False
    user_voted_option_ids: List[int] = []

    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)
    parent_id: Optional[int] = None

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        s = sanitize_text(v)
        if not s:
            raise ValueError("Comment cannot be empty.")
        return s

class CommentResponse(BaseModel):
    id: int
    post_id: int
    author_id: int
    author_name: str
    author_initials: str
    author_department: Optional[str] = None
    author_semester: Optional[int] = None
    content: str
    parent_id: Optional[int] = None
    created_at: datetime
    can_delete: bool = False

    class Config:
        from_attributes = True

class CommunityPostCreate(BaseModel):
    content: str = Field(..., min_length=3, max_length=3000, description="Post text content")
    tags: Optional[List[str]] = Field(default=[], description="List of topics or department tags")
    attachment_ids: Optional[List[int]] = Field(default=[], description="Pre-uploaded attachment IDs")
    poll: Optional[PollCreate] = None

    @field_validator("content")
    @classmethod
    def validate_and_sanitize_content(cls, v: str) -> str:
        sanitized = sanitize_text(v)
        if len(sanitized) < 3:
            raise ValueError("Post content must contain at least 3 printable characters.")
        return sanitized

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, tags: Optional[List[str]]) -> List[str]:
        if not tags:
            return []
        cleaned = []
        for tag in tags[:6]: # Max 6 tags
            sanitized_tag = sanitize_text(tag)
            if sanitized_tag:
                cleaned.append(sanitized_tag)
        return cleaned

class CommunityPostResponse(BaseModel):
    id: int
    author_id: int
    author_name: str
    author_initials: str = "EC"
    author_department: Optional[str] = None
    author_semester: Optional[int] = None
    author_role: Optional[str] = "Student"
    content: str
    tags: List[str] = []
    likes: int = 0
    is_liked: bool = False
    comments_count: int = 0
    attachments: List[AttachmentResponse] = []
    poll: Optional[PollResponse] = None
    created_at: datetime
    can_delete: bool = False

    class Config:
        from_attributes = True
