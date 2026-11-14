import os
import sys
import sqlite3
from datetime import datetime, timedelta

DB_PATH = os.path.abspath('campussync.db')
print(f"Applying Community Platform schema migrations to: {DB_PATH}")

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# 1. Create post_attachments table
c.execute("""
CREATE TABLE IF NOT EXISTS post_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    file_type VARCHAR(30) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER DEFAULT 0,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
)
""")
c.execute("CREATE INDEX IF NOT EXISTS ix_post_attachments_post_id ON post_attachments(post_id)")

# 2. Create post_comments table
c.execute("""
CREATE TABLE IF NOT EXISTS post_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    parent_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES post_comments(id) ON DELETE CASCADE
)
""")
c.execute("CREATE INDEX IF NOT EXISTS ix_post_comments_post_id ON post_comments(post_id)")
c.execute("CREATE INDEX IF NOT EXISTS ix_post_comments_author_id ON post_comments(author_id)")

# 3. Create polls table
c.execute("""
CREATE TABLE IF NOT EXISTS polls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER UNIQUE NOT NULL,
    question VARCHAR(300) NOT NULL,
    is_multiple_choice BOOLEAN DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
)
""")
c.execute("CREATE INDEX IF NOT EXISTS ix_polls_post_id ON polls(post_id)")

# 4. Create poll_options table
c.execute("""
CREATE TABLE IF NOT EXISTS poll_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poll_id INTEGER NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    votes_count INTEGER DEFAULT 0,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
)
""")
c.execute("CREATE INDEX IF NOT EXISTS ix_poll_options_poll_id ON poll_options(poll_id)")

# 5. Create poll_votes table
c.execute("""
CREATE TABLE IF NOT EXISTS poll_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poll_id INTEGER NOT NULL,
    option_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(poll_id, user_id, option_id)
)
""")
c.execute("CREATE INDEX IF NOT EXISTS ix_poll_votes_poll_user ON poll_votes(poll_id, user_id)")

# 6. Create post_likes table
c.execute("""
CREATE TABLE IF NOT EXISTS post_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(post_id, user_id)
)
""")
c.execute("CREATE INDEX IF NOT EXISTS ix_post_likes_post_user ON post_likes(post_id, user_id)")

conn.commit()
print("All 6 Community Platform tables successfully created!")

# 7. Seed sample discussions, comments, and poll if none exist
c.execute("SELECT COUNT(*) FROM polls")
poll_count = c.fetchone()[0]

if poll_count == 0:
    print("Seeding sample interactive poll and discussions...")
    # Insert a post with an interactive poll matching user requirements
    c.execute("""
        INSERT INTO community_posts (author_id, content, tags, likes, created_at)
        VALUES (
            1,
            'Which technology workshop would you like the CSE & IT departments to organize for the upcoming tech semester? Please vote below to help us finalize speaker invitations and laboratory booking!',
            'Workshops,Academics,CSE,StudentVoice',
            24,
            datetime('now', '-2 hours')
        )
    """)
    poll_post_id = c.lastrowid

    expires_at = (datetime.utcnow() + timedelta(days=5)).strftime('%Y-%m-%d %H:%M:%S')
    c.execute("""
        INSERT INTO polls (post_id, question, is_multiple_choice, expires_at)
        VALUES (?, 'Which technology workshop would you like to attend?', 0, ?)
    """, (poll_post_id, expires_at))
    poll_id = c.lastrowid

    options = [
        ('Artificial Intelligence & Machine Learning', 48),
        ('Full Stack Development (React & Node/FastAPI)', 35),
        ('Cybersecurity & Ethical Hacking', 22),
        ('Cloud Computing & DevOps (Docker/AWS)', 17)
    ]
    for opt_text, v_count in options:
        c.execute("""
            INSERT INTO poll_options (poll_id, option_text, votes_count)
            VALUES (?, ?, ?)
        """, (poll_id, opt_text, v_count))

    # Add comments to Post 1 (workshop post)
    c.execute("""
        INSERT INTO post_comments (post_id, author_id, content, created_at)
        VALUES 
        (1, 2, 'Will this cover PyTorch or TensorFlow? Also will participation certificates be provided for the BTU portfolio?', datetime('now', '-90 minutes')),
        (1, 1, 'Yes! We will build a complete PyTorch model deployed via FastAPI, and verified ECA certificates will be awarded to all participants.', datetime('now', '-45 minutes'))
    """)

    # Seed placement discussion matching the user's explicit example in Section 6!
    c.execute("""
        INSERT INTO community_posts (author_id, content, tags, likes, created_at)
        VALUES (
            2,
            'Has anyone started preparing for the upcoming campus placement season? Looking to connect with peers for technical interview prep.',
            'Placements,Interviews,DSA,Careers',
            31,
            datetime('now', '-5 hours')
        )
    """)
    placement_post_id = c.lastrowid

    c.execute("""
        INSERT INTO post_comments (post_id, author_id, content, created_at)
        VALUES 
        (?, 3, 'Yes, I am currently focusing on DSA and backend system design using Striver SDE sheet.', datetime('now', '-4 hours')),
        (?, 4, 'I am also preparing. We should definitely create a study group in the Central Library after classes.', datetime('now', '-3 hours')),
        (?, 1, 'Great idea! Central Library Pod B is open till 11 PM during exam season. Let us start this Thursday.', datetime('now', '-2 hours'))
    """, (placement_post_id, placement_post_id, placement_post_id))

    # Seed some initial likes
    c.execute("INSERT OR IGNORE INTO post_likes (post_id, user_id) VALUES (1, 1), (1, 2), (?, 1), (?, 2), (?, 3)", 
              (placement_post_id, placement_post_id, placement_post_id))

    conn.commit()
    print("Sample interactive community posts, comments, and poll seeded successfully!")

conn.close()
print("Database migration complete.")

