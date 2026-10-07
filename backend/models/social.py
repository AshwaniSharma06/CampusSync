from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.db.session import Base

class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String) # Technical, Cultural
    event_date = Column(DateTime, nullable=False)
    location = Column(String)
    image_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Club(Base):
    __tablename__ = "clubs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text)
    focus_areas = Column(String) # JSON or comma separated
    location = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class CommunityPost(Base):
    __tablename__ = "community_posts"
    
    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    tags = Column(String) # Comma separated
    likes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    author = relationship("User", back_populates="community_posts")

class SavedItem(Base):
    """Generic bookmarks for students (Notices, Events, etc)"""
    __tablename__ = "saved_items"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    item_type = Column(String) # 'notice', 'event', 'post'
    item_id = Column(Integer)
    saved_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="saved_items")
