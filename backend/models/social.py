from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship, backref
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
    """ECA Clubs - Preserved for Semester 8 (Project Phase 2)"""
    __tablename__ = "clubs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text)
    focus_areas = Column(String) # JSON or comma separated
    location = Column(String)
    category = Column(String(100), nullable=True)
    lead = Column(String(150), nullable=True)
    members_count = Column(String(100), nullable=True)
    official_page_url = Column(String(500), nullable=True)
    directory_url = Column(String(500), nullable=True)
    verification_status = Column(String(30), default="VERIFIED")
    created_at = Column(DateTime, default=datetime.utcnow)

class CommunityPost(Base):
    __tablename__ = "community_posts"
    
    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(String, nullable=True) # Comma separated e.g. "DSA, Placements, CSE"
    likes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    author = relationship("User", back_populates="community_posts")
    attachments = relationship("PostAttachment", cascade="all, delete-orphan", back_populates="post", order_by="PostAttachment.id")
    comments = relationship("PostComment", cascade="all, delete-orphan", back_populates="post", order_by="PostComment.created_at")
    poll = relationship("Poll", uselist=False, cascade="all, delete-orphan", back_populates="post")
    likes_rel = relationship("PostLike", cascade="all, delete-orphan", back_populates="post")

class PostAttachment(Base):
    __tablename__ = "post_attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=True)
    file_type = Column(String(30), nullable=False) # 'image' | 'document'
    file_name = Column(String(255), nullable=False) # Original display filename
    file_path = Column(String(500), nullable=False) # Disk path or relative serving URL
    file_size = Column(Integer, default=0)          # Bytes
    mime_type = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    post = relationship("CommunityPost", back_populates="attachments")

class PostComment(Base):
    __tablename__ = "post_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    parent_id = Column(Integer, ForeignKey("post_comments.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    post = relationship("CommunityPost", back_populates="comments")
    author = relationship("User")

class Poll(Base):
    __tablename__ = "polls"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), unique=True, nullable=False)
    question = Column(String(300), nullable=False)
    is_multiple_choice = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    post = relationship("CommunityPost", back_populates="poll")
    options = relationship("PollOption", cascade="all, delete-orphan", back_populates="poll", order_by="PollOption.id")

class PollOption(Base):
    __tablename__ = "poll_options"
    
    id = Column(Integer, primary_key=True, index=True)
    poll_id = Column(Integer, ForeignKey("polls.id", ondelete="CASCADE"), nullable=False)
    option_text = Column(String(255), nullable=False)
    votes_count = Column(Integer, default=0)
    
    poll = relationship("Poll", back_populates="options")
    votes = relationship("PollVote", cascade="all, delete-orphan", back_populates="option")

class PollVote(Base):
    __tablename__ = "poll_votes"
    
    id = Column(Integer, primary_key=True, index=True)
    poll_id = Column(Integer, ForeignKey("polls.id", ondelete="CASCADE"), nullable=False)
    option_id = Column(Integer, ForeignKey("poll_options.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    option = relationship("PollOption", back_populates="votes")
    user = relationship("User")

class PostLike(Base):
    __tablename__ = "post_likes"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    post = relationship("CommunityPost", back_populates="likes_rel")
    user = relationship("User")

class SavedItem(Base):
    """Generic bookmarks for students (Notices, Events, etc)"""
    __tablename__ = "saved_items"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    item_type = Column(String) # 'notice', 'event', 'post'
    item_id = Column(Integer)
    saved_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="saved_items")
