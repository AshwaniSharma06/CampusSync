from backend.db.session import SessionLocal
from backend.models.social import CommunityPost, PostAttachment, PostComment

db = SessionLocal()
posts = db.query(CommunityPost).order_by(CommunityPost.id.desc()).all()
print(f"Total posts in DB: {len(posts)}")
for p in posts[:10]:
    att = db.query(PostAttachment).filter(PostAttachment.post_id == p.id).all()
    com = db.query(PostComment).filter(PostComment.post_id == p.id).all()
    print(f"Post #{p.id} by User {p.author_id}: '{p.content}' | Attachments: {len(att)} | Comments: {len(com)}")
    for a in att:
        print(f"   Att #{a.id}: {a.file_name} ({a.file_type}) -> {a.file_path}")
db.close()
