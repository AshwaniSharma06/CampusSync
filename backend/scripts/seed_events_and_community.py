"""
Seed events and community posts in campussync.db to support full dashboard integration.
"""
import sqlite3
from datetime import datetime
from pathlib import Path

DB_PATH = Path("campussync.db")

def seed_data():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    print("Checking and seeding events and community posts...")

    # Events table
    cur.execute("SELECT COUNT(*) FROM events")
    event_count = cur.fetchone()[0]
    if event_count <= 1:
        events = [
            (2, "Technotsav 2026 - Annual Technical Festival", "State-level coding, robotics, and innovation fest at ECA.", "Technical", "2026-11-15 09:00:00", "ECA Central Labs & Academic Blocks", None, datetime.utcnow().isoformat()),
            (3, "Tarangini 2026 - Annual Cultural Fest", "Music, dance, fine arts, and literary competitions.", "Cultural", "2026-11-22 17:00:00", "ECA Open Air Theatre (OAT)", None, datetime.utcnow().isoformat()),
            (4, "Smart India Hackathon (SIH 2026) College Screening", "Institutional preliminary screening for nationwide hackathon.", "Hackathon", "2026-11-08 10:00:00", "ECA Innovation Center", None, datetime.utcnow().isoformat()),
        ]
        for ev in events:
            cur.execute("""
                INSERT OR IGNORE INTO events (id, title, description, category, event_date, location, image_url, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, ev)
        print("  [Events] Seeded official campus events in database.")

    # Community posts table
    cur.execute("SELECT COUNT(*) FROM community_posts")
    post_count = cur.fetchone()[0]
    if post_count == 0:
        posts = [
            (1, 1, "Upcoming React & Machine Learning Hands-on Workshop this Saturday in Barliya Block Lab 204. Full-stack development with certificates.", "AI,Workshop,CSE", 14, datetime.utcnow().isoformat()),
            (2, 2, "Study group for BTU Data Structures and Algorithms midterms meeting in Central Library Pod B this Friday. All 3rd semester students welcome!", "StudyGroup,Sem3,DSA", 8, datetime.utcnow().isoformat()),
            (3, 4, "Dell 65W USB-C charger found near CSE Block Room 402 yesterday afternoon. Deposited safely at the Student Activity Center (SAC) helpdesk.", "Campus,LostAndFound", 19, datetime.utcnow().isoformat()),
        ]
        for p in posts:
            cur.execute("""
                INSERT OR IGNORE INTO community_posts (id, author_id, content, tags, likes, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, p)
        print("  [Community] Seeded verified student community discussions in database.")

    conn.commit()
    conn.close()
    print("Database seeding completed.")

if __name__ == "__main__":
    seed_data()
