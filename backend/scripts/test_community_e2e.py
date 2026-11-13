import sys
import os
import io
sys.path.insert(0, os.path.abspath("."))

from backend.db.session import SessionLocal
from backend.models.user import User
from backend.models.social import CommunityPost, PostAttachment, PostComment, Poll, PollOption, PollVote, PostLike
from backend.schemas.community import CommunityPostCreate, PollCreate, CommentCreate
from backend.api.v1.community import (
    create_community_post,
    get_community_posts,
    toggle_like_post,
    vote_poll,
    PollVoteRequest,
    create_post_comment,
    delete_post_comment,
    get_post_comments
)

db = SessionLocal()

# 1. Get an existing student user
user = db.query(User).filter(User.email == "student@ecajmer.ac.in").first()
assert user is not None, "Test student user not found"
print(f"[TEST 1] Loaded user: {user.full_name} ({user.email})")

# 2. Create a test discussion post with a live poll
poll_data = PollCreate(
    question="Which programming language are you using for DSA this semester?",
    options=["C++ (STL)", "Java (Collections)", "Python", "Rust"],
    is_multiple_choice=False,
    duration_days=7
)
post_payload = CommunityPostCreate(
    content="Hello fellow ECA engineers! Testing our community platform with an interactive poll on DSA languages.",
    tags=["DSA", "BTUExams", "TechStack"],
    poll=poll_data
)
created_post = create_community_post(post_in=post_payload, current_user=user, db=db)
print(f"[TEST 2] Created post ID #{created_post.id} with poll: '{created_post.poll.question}'")
assert created_post.poll is not None
assert len(created_post.poll.options) == 4

# 3. Vote in the poll
first_opt_id = created_post.poll.options[0].id
voted_poll = vote_poll(
    poll_id=created_post.poll.id,
    vote_in=PollVoteRequest(option_ids=[first_opt_id]),
    current_user=user,
    db=db
)
print(f"[TEST 3] Voted for option {first_opt_id}. Total votes now: {voted_poll.total_votes}")
assert voted_poll.total_votes == 1
assert voted_poll.options[0].votes_count == 1
assert first_opt_id in voted_poll.user_voted_option_ids

# 4. Toggle Like on the post
like_res1 = toggle_like_post(post_id=created_post.id, current_user=user, db=db)
print(f"[TEST 4a] Toggled like: {like_res1}")
assert like_res1["is_liked"] is True
assert like_res1["likes"] == 1

like_res2 = toggle_like_post(post_id=created_post.id, current_user=user, db=db)
print(f"[TEST 4b] Toggled like again (unlike): {like_res2}")
assert like_res2["is_liked"] is False
assert like_res2["likes"] == 0

# 5. Add a comment
comment_in = CommentCreate(content="C++ with STL is definitely the gold standard for placements!")
new_comment = create_post_comment(post_id=created_post.id, comment_in=comment_in, current_user=user, db=db)
print(f"[TEST 5] Added comment ID #{new_comment.id}: '{new_comment.content}'")
assert new_comment.author_name == user.full_name

# 6. Add a reply to the comment
reply_in = CommentCreate(content="Agreed! Especially for time-constrained competitive coding.", parent_id=new_comment.id)
reply_comment = create_post_comment(post_id=created_post.id, comment_in=reply_in, current_user=user, db=db)
print(f"[TEST 6] Added reply ID #{reply_comment.id} under parent #{reply_comment.parent_id}")

# 7. List comments
comments = get_post_comments(post_id=created_post.id, current_user=user, db=db)
print(f"[TEST 7] Fetched {len(comments)} comments for post #{created_post.id}")
assert len(comments) == 2

# 8. Query feed
feed = get_community_posts(limit=10, offset=0, current_user=user, db=db)
print(f"[TEST 8] Successfully queried feed ({len(feed)} posts). Top post ID #{feed[0].id}")
assert feed[0].id == created_post.id
assert feed[0].comments_count == 2
assert feed[0].poll is not None

print("\nALL END-TO-END COMMUNITY VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉")
db.close()
