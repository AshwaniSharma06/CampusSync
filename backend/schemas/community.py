import re
import html
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, field_validator

def sanitize_text(text: str) -> str:
    """Strip dangerous tags and unescape/escape safely to prevent XSS"""
    # Remove HTML tags
    cleaned = re.sub(r'<[^>]+>', '', text)
    # Escape special characters
    return html.escape(cleaned).strip()

class CommunityPostCreate(BaseModel):
    content: str = Field(..., min_length=5, max_length=1500, description="Post text content")
    tags: Optional[List[str]] = Field(default=[], description="List of topics or department tags")

    @field_validator("content")
    @classmethod
    def validate_and_sanitize_content(cls, v: str) -> str:
        sanitized = sanitize_text(v)
        if len(sanitized) < 5:
            raise ValueError("Post content must contain at least 5 printable non-HTML characters.")
        return sanitized

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, tags: Optional[List[str]]) -> List[str]:
        if not tags:
            return []
        cleaned = []
        for tag in tags[:5]: # Max 5 tags
            sanitized_tag = sanitize_text(tag)
            if sanitized_tag:
                cleaned.append(sanitized_tag)
        return cleaned

class CommunityPostResponse(BaseModel):
    id: int
    author_id: int
    author_name: str
    content: str
    tags: List[str] = []
    likes: int = 0
    created_at: datetime

    class Config:
        from_attributes = True
