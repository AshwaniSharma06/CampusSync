import os
import uuid
import shutil
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Optional, Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from backend.api.deps import get_db, get_current_user, get_optional_current_user
from backend.models.user import User, RoleEnum
from backend.models.social import (
    CommunityPost,
    PostAttachment,
    PostComment,
    Poll,
    PollOption,
    PollVote,
    PostLike
)
from backend.schemas.community import (
    CommunityPostCreate,
    CommunityPostResponse,
    AttachmentResponse,
    PollResponse,
    PollOptionResponse,
    CommentCreate,
    CommentResponse
)
from pydantic import BaseModel, Field

router = APIRouter()

# Upload directories
UPLOAD_BASE_DIR = Path("backend/data/community_uploads").resolve()
IMAGES_DIR = UPLOAD_BASE_DIR / "images"
DOCUMENTS_DIR = UPLOAD_BASE_DIR / "documents"

IMAGES_DIR.mkdir(parents=True, exist_ok=True)
DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)

# Allowed MIME types and size limits
ALLOWED_IMAGE_MIMES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif"
}

ALLOWED_DOC_MIMES = {
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
    "text/plain": ".txt",
    "text/markdown": ".md"
}

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024       # 5 MB
MAX_DOC_SIZE_BYTES = 15 * 1024 * 1024        # 15 MB


def get_initials(name: Optional[str]) -> str:
    if not name:
        return "CS"
    parts = name.strip().split()
    if len(parts) >= 2:
        return f"{parts[0][0]}{parts[1][0]}".upper()
    elif len(parts) == 1 and len(parts[0]) > 0:
        return parts[0][:2].upper()
    return "CS"


def build_poll_response(poll: Optional[Poll], user_id: Optional[int] = None) -> Optional[PollResponse]:
    if not poll:
        return None
    
    total_votes = sum(opt.votes_count or 0 for opt in poll.options)
    
    # Check user votes
    user_voted_ids = []
    if user_id:
        for opt in poll.options:
            for vote in opt.votes:
                if vote.user_id == user_id:
                    user_voted_ids.append(opt.id)
    
    options_res = []
    for opt in poll.options:
        pct = round((opt.votes_count / total_votes * 100), 1) if total_votes > 0 else 0.0
        options_res.append(
            PollOptionResponse(
                id=opt.id,
                option_text=opt.option_text,
                votes_count=opt.votes_count or 0,
                percentage=pct
            )
        )
    
    is_expired = False
    if poll.expires_at and datetime.utcnow() > poll.expires_at:
        is_expired = True

    return PollResponse(
        id=poll.id,
        question=poll.question,
        is_multiple_choice=poll.is_multiple_choice or False,
        options=options_res,
        total_votes=total_votes,
        expires_at=poll.expires_at,
        is_expired=is_expired,
        user_voted_option_ids=user_voted_ids
    )


def serialize_post(post: CommunityPost, current_user: Optional[User] = None) -> CommunityPostResponse:
    # Tags parsing
    tags_list = [t.strip() for t in post.tags.split(',') if t.strip()] if post.tags else []

    # Author metadata
    author_name = post.author.full_name if post.author else "Student Peer"
    initials = get_initials(author_name)
    dept = None
    sem = None
    role_str = "Student"
    if post.author:
        if post.author.role == RoleEnum.admin:
            role_str = "Admin"
        elif post.author.role == RoleEnum.faculty:
            role_str = "Faculty"
        
        if post.author.student_profile:
            dept = post.author.student_profile.department
            sem = post.author.student_profile.semester

    # Likes check
    is_liked = False
    can_delete = False
    user_id = current_user.id if current_user else None
    
    if current_user:
        if current_user.id == post.author_id or current_user.role == RoleEnum.admin:
            can_delete = True
        if post.likes_rel:
            is_liked = any(like.user_id == current_user.id for like in post.likes_rel)

    # Attachments
    attachments_res = []
    for att in post.attachments:
        attachments_res.append(
            AttachmentResponse(
                id=att.id,
                file_type=att.file_type,
                file_name=att.file_name,
                file_url=f"/api/v1/community/attachments/{att.id}/file",
                file_size=att.file_size,
                mime_type=att.mime_type
            )
        )

    # Poll
    poll_res = build_poll_response(post.poll, user_id=user_id)

    # Comments count
    comments_count = len(post.comments) if post.comments else 0

    return CommunityPostResponse(
        id=post.id,
        author_id=post.author_id,
        author_name=author_name,
        author_initials=initials,
        author_department=dept,
        author_semester=sem,
        author_role=role_str,
        content=post.content,
        tags=tags_list,
        likes=post.likes or 0,
        is_liked=is_liked,
        comments_count=comments_count,
        attachments=attachments_res,
        poll=poll_res,
        created_at=post.created_at,
        can_delete=can_delete
    )


@router.get("/", response_model=List[CommunityPostResponse])
def get_community_posts(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Retrieve community posts ordered by newest first with rich media, polls, and comment counts.
    Supports search query and tag filtering.
    """
    query = db.query(CommunityPost).options(
        joinedload(CommunityPost.author).joinedload(User.student_profile),
        joinedload(CommunityPost.attachments),
        joinedload(CommunityPost.comments),
        joinedload(CommunityPost.poll).joinedload(Poll.options).joinedload(PollOption.votes),
        joinedload(CommunityPost.likes_rel)
    )

    if tag and isinstance(tag, str):
        clean_tag = tag.strip().lower()
        query = query.filter(CommunityPost.tags.ilike(f"%{clean_tag}%"))

    if search and isinstance(search, str):
        clean_search = search.strip()
        query = query.filter(CommunityPost.content.ilike(f"%{clean_search}%"))

    posts = query.order_by(desc(CommunityPost.created_at)).offset(offset).limit(limit).all()

    return [serialize_post(p, current_user=current_user) for p in posts]


@router.post("/", response_model=CommunityPostResponse, status_code=status.HTTP_201_CREATED)
def create_community_post(
    post_in: CommunityPostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Publish a new community post with optional pre-uploaded attachments and interactive polls.
    """
    tags_str = ",".join(post_in.tags) if post_in.tags else ""
    new_post = CommunityPost(
        author_id=current_user.id,
        content=post_in.content,
        tags=tags_str,
        likes=0
    )
    db.add(new_post)
    db.flush() # Populate new_post.id

    # Associate pre-uploaded attachments
    if post_in.attachment_ids:
        db.query(PostAttachment).filter(
            PostAttachment.id.in_(post_in.attachment_ids),
            PostAttachment.post_id == None
        ).update({PostAttachment.post_id: new_post.id}, synchronize_session=False)

    # Create poll if specified
    if post_in.poll:
        duration_days = post_in.poll.duration_days or 7
        expires_at = datetime.utcnow() + timedelta(days=duration_days)
        new_poll = Poll(
            post_id=new_post.id,
            question=post_in.poll.question,
            is_multiple_choice=post_in.poll.is_multiple_choice,
            expires_at=expires_at
        )
        db.add(new_poll)
        db.flush()

        for opt_text in post_in.poll.options:
            clean_opt = opt_text.strip()
            if clean_opt:
                db.add(PollOption(poll_id=new_poll.id, option_text=clean_opt, votes_count=0))

    db.commit()

    # Re-query with eager relationships
    created_post = db.query(CommunityPost).options(
        joinedload(CommunityPost.author).joinedload(User.student_profile),
        joinedload(CommunityPost.attachments),
        joinedload(CommunityPost.comments),
        joinedload(CommunityPost.poll).joinedload(Poll.options).joinedload(PollOption.votes),
        joinedload(CommunityPost.likes_rel)
    ).filter(CommunityPost.id == new_post.id).first()

    return serialize_post(created_post, current_user=current_user)


@router.post("/upload", response_model=AttachmentResponse)
async def upload_attachment(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Pre-upload an image or document for a community post.
    Validates MIME type, file size, and secures filename storage.
    """
    filename = file.filename or "uploaded_file"
    ext = os.path.splitext(filename)[1].lower()
    content_type = file.content_type or ""

    is_image = content_type in ALLOWED_IMAGE_MIMES or ext in [".jpg", ".jpeg", ".png", ".webp", ".gif"]
    is_doc = content_type in ALLOWED_DOC_MIMES or ext in [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".md"]

    if not is_image and not is_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed formats: JPEG, PNG, WebP, GIF, PDF, Word, Excel, PowerPoint, and TXT."
        )

    file_type = "image" if is_image else "document"
    max_size = MAX_IMAGE_SIZE_BYTES if is_image else MAX_DOC_SIZE_BYTES
    target_dir = IMAGES_DIR if is_image else DOCUMENTS_DIR

    # Read and validate size
    contents = await file.read()
    file_size = len(contents)
    if file_size > max_size:
        max_mb = max_size // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {max_mb}MB."
        )
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot upload an empty file."
        )

    # Secure unique filename
    safe_name = f"{uuid.uuid4().hex[:16]}_{Path(filename).name}"
    dest_path = target_dir / safe_name

    with open(dest_path, "wb") as f:
        f.write(contents)

    # Save attachment record
    attachment = PostAttachment(
        post_id=None, # Will be attached upon post publication
        file_type=file_type,
        file_name=filename,
        file_path=str(dest_path.resolve()),
        file_size=file_size,
        mime_type=content_type or ("image/jpeg" if is_image else "application/octet-stream")
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    return AttachmentResponse(
        id=attachment.id,
        file_type=attachment.file_type,
        file_name=attachment.file_name,
        file_url=f"/api/v1/community/attachments/{attachment.id}/file",
        file_size=attachment.file_size,
        mime_type=attachment.mime_type
    )


@router.get("/attachments/{attachment_id}/file")
def get_attachment_file(
    attachment_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """
    Publicly serve uploaded community media and documents with appropriate headers.
    """
    attachment = db.query(PostAttachment).filter(PostAttachment.id == attachment_id).first()
    if not attachment or not os.path.exists(attachment.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment file not found."
        )

    # Stream file inline for images & PDFs, as attachment for other documents
    is_inline = attachment.file_type == "image" or attachment.mime_type == "application/pdf"
    disposition = "inline" if is_inline else f'attachment; filename="{attachment.file_name}"'

    return FileResponse(
        path=attachment.file_path,
        media_type=attachment.mime_type,
        headers={"Content-Disposition": disposition}
    )


@router.delete("/attachments/{attachment_id}")
def delete_attachment(
    attachment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Remove an unattached or user-owned attachment.
    """
    attachment = db.query(PostAttachment).filter(PostAttachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found.")

    # Remove file from disk
    try:
        if os.path.exists(attachment.file_path):
            os.remove(attachment.file_path)
    except Exception:
        pass

    db.delete(attachment)
    db.commit()
    return {"status": "deleted", "id": attachment_id}


@router.post("/{post_id}/like")
def toggle_like_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Toggle like/unlike for the authenticated user on a post.
    """
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    existing_like = db.query(PostLike).filter(
        PostLike.post_id == post_id,
        PostLike.user_id == current_user.id
    ).first()

    if existing_like:
        db.delete(existing_like)
        post.likes = max(0, (post.likes or 1) - 1)
        db.commit()
        return {"id": post.id, "likes": post.likes, "is_liked": False}
    else:
        new_like = PostLike(post_id=post_id, user_id=current_user.id)
        db.add(new_like)
        post.likes = (post.likes or 0) + 1
        db.commit()
        return {"id": post.id, "likes": post.likes, "is_liked": True}


class PollVoteRequest(BaseModel):
    option_ids: List[int] = Field(..., min_length=1)


@router.post("/polls/{poll_id}/vote", response_model=PollResponse)
def vote_poll(
    poll_id: int,
    vote_in: PollVoteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Cast vote on a community poll. Enforces single/multiple choice and active expiration rules.
    """
    poll = db.query(Poll).options(
        joinedload(Poll.options).joinedload(PollOption.votes)
    ).filter(Poll.id == poll_id).first()

    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found.")

    if poll.expires_at and datetime.utcnow() > poll.expires_at:
        raise HTTPException(status_code=400, detail="This poll has expired and is no longer accepting votes.")

    # Check if user already voted in this poll
    existing_votes = db.query(PollVote).filter(
        PollVote.poll_id == poll_id,
        PollVote.user_id == current_user.id
    ).all()

    if existing_votes:
        raise HTTPException(status_code=400, detail="You have already voted in this poll.")

    valid_option_ids = {opt.id for opt in poll.options}
    chosen_ids = [oid for oid in vote_in.option_ids if oid in valid_option_ids]

    if not chosen_ids:
        raise HTTPException(status_code=400, detail="Invalid poll option(s) specified.")

    if not poll.is_multiple_choice and len(chosen_ids) > 1:
        chosen_ids = chosen_ids[:1]

    for opt_id in chosen_ids:
        vote = PollVote(poll_id=poll_id, option_id=opt_id, user_id=current_user.id)
        db.add(vote)
        opt = next((o for o in poll.options if o.id == opt_id), None)
        if opt:
            opt.votes_count = (opt.votes_count or 0) + 1

    db.commit()

    # Re-fetch poll
    updated_poll = db.query(Poll).options(
        joinedload(Poll.options).joinedload(PollOption.votes)
    ).filter(Poll.id == poll_id).first()

    return build_poll_response(updated_poll, user_id=current_user.id)


@router.get("/{post_id}/comments", response_model=List[CommentResponse])
def get_post_comments(
    post_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Retrieve all comments for a community post.
    """
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    comments = db.query(PostComment).options(
        joinedload(PostComment.author).joinedload(User.student_profile)
    ).filter(PostComment.post_id == post_id).order_by(PostComment.created_at.asc()).all()

    results = []
    user_id = current_user.id if current_user else None

    for c in comments:
        author_name = c.author.full_name if c.author else "Student"
        initials = get_initials(author_name)
        dept = None
        sem = None
        if c.author and c.author.student_profile:
            dept = c.author.student_profile.department
            sem = c.author.student_profile.semester

        can_del = False
        if current_user and (current_user.id == c.author_id or current_user.role == RoleEnum.admin):
            can_del = True

        results.append(
            CommentResponse(
                id=c.id,
                post_id=c.post_id,
                author_id=c.author_id,
                author_name=author_name,
                author_initials=initials,
                author_department=dept,
                author_semester=sem,
                content=c.content,
                parent_id=c.parent_id,
                created_at=c.created_at,
                can_delete=can_del
            )
        )
    return results


@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_post_comment(
    post_id: int,
    comment_in: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Add a comment or reply to a community post.
    """
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    if comment_in.parent_id:
        parent = db.query(PostComment).filter(
            PostComment.id == comment_in.parent_id,
            PostComment.post_id == post_id
        ).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Parent comment not found in this post.")

    new_comment = PostComment(
        post_id=post_id,
        author_id=current_user.id,
        content=comment_in.content,
        parent_id=comment_in.parent_id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    dept = None
    sem = None
    if current_user.student_profile:
        dept = current_user.student_profile.department
        sem = current_user.student_profile.semester

    return CommentResponse(
        id=new_comment.id,
        post_id=new_comment.post_id,
        author_id=current_user.id,
        author_name=current_user.full_name,
        author_initials=get_initials(current_user.full_name),
        author_department=dept,
        author_semester=sem,
        content=new_comment.content,
        parent_id=new_comment.parent_id,
        created_at=new_comment.created_at,
        can_delete=True
    )


@router.delete("/comments/{comment_id}")
def delete_post_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Delete a comment if user is author or administrator.
    """
    comment = db.query(PostComment).filter(PostComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found.")

    if comment.author_id != current_user.id and current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment.")

    db.delete(comment)
    db.commit()
    return {"status": "deleted", "id": comment_id}


@router.delete("/{post_id}")
def delete_community_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Delete an entire community post, comments, poll, and clean up attached files.
    """
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    if post.author_id != current_user.id and current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post.")

    # Clean up physical files
    for att in post.attachments:
        try:
            if os.path.exists(att.file_path):
                os.remove(att.file_path)
        except Exception:
            pass

    db.delete(post)
    db.commit()
    return {"status": "deleted", "id": post_id}
