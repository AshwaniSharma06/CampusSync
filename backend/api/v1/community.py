from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any

from backend.api.deps import get_db, get_current_user
from backend.models.user import User
from backend.models.social import CommunityPost
from backend.schemas.community import CommunityPostCreate, CommunityPostResponse

router = APIRouter()

@router.get("/", response_model=List[CommunityPostResponse])
def get_community_posts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Retrieve all community posts ordered by newest first.
    """
    posts = db.query(CommunityPost).order_by(CommunityPost.created_at.desc()).all()
    results = []
    for post in posts:
        tags_list = [t.strip() for t in post.tags.split(',') if t.strip()] if post.tags else []
        results.append(
            CommunityPostResponse(
                id=post.id,
                author_id=post.author_id,
                author_name=post.author.full_name if post.author else "Student Peer",
                content=post.content,
                tags=tags_list,
                likes=post.likes or 0,
                created_at=post.created_at
            )
        )
    return results

@router.post("/", response_model=CommunityPostResponse, status_code=status.HTTP_201_CREATED)
def create_community_post(
    post_in: CommunityPostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Publish a new sanitized community feed discussion post.
    """
    tags_str = ",".join(post_in.tags) if post_in.tags else ""
    new_post = CommunityPost(
        author_id=current_user.id,
        content=post_in.content,
        tags=tags_str,
        likes=0
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return CommunityPostResponse(
        id=new_post.id,
        author_id=current_user.id,
        author_name=current_user.full_name,
        content=new_post.content,
        tags=post_in.tags or [],
        likes=0,
        created_at=new_post.created_at
    )

@router.post("/{post_id}/like")
def like_community_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Increment like counter on an active campus community post.
    """
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community post not found"
        )
    post.likes = (post.likes or 0) + 1
    db.commit()
    db.refresh(post)
    return {"id": post.id, "likes": post.likes, "status": "liked"}
