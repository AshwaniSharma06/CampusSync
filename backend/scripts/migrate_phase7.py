"""
Safe Non-Destructive Migration Script for Phase 7 (Chat Sessions & Messages).
Preserves all user accounts, academic documents, notices, and existing database tables.
Adds required columns:
- chat_sessions: updated_at, is_active
- chat_messages: sources, rewritten_query
"""

import sys
import os
import shutil
from datetime import datetime
from sqlalchemy import text, inspect

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, BASE_DIR)

from backend.db.session import engine

def migrate():
    print("==================================================================")
    print("CAMPUSSYNC MIGRATION: PHASE 7 CHAT SESSIONS & MESSAGES PERSISTENCE")
    print("==================================================================")

    # 1. Backup campussync.db
    db_file = os.path.join(BASE_DIR, "campussync.db")
    if os.path.exists(db_file):
        backup_dir = os.path.join(BASE_DIR, "backups")
        os.makedirs(backup_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = os.path.join(backup_dir, f"campussync_backup_phase7_{timestamp}.db")
        shutil.copy2(db_file, backup_file)
        print(f"[BACKUP] Created safe database snapshot at: {backup_file}")

    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    with engine.begin() as conn:
        # Check chat_sessions
        if "chat_sessions" in existing_tables:
            session_cols = [c["name"] for c in inspector.get_columns("chat_sessions")]
            if "updated_at" not in session_cols:
                conn.execute(text("ALTER TABLE chat_sessions ADD COLUMN updated_at DATETIME;"))
                print("  [MIGRATE] Added 'updated_at' to chat_sessions.")
            if "is_active" not in session_cols:
                conn.execute(text("ALTER TABLE chat_sessions ADD COLUMN is_active BOOLEAN DEFAULT 1;"))
                print("  [MIGRATE] Added 'is_active' to chat_sessions.")

        # Check chat_messages
        if "chat_messages" in existing_tables:
            msg_cols = [c["name"] for c in inspector.get_columns("chat_messages")]
            if "sources" not in msg_cols:
                conn.execute(text("ALTER TABLE chat_messages ADD COLUMN sources TEXT;"))
                print("  [MIGRATE] Added 'sources' to chat_messages.")
            if "rewritten_query" not in msg_cols:
                conn.execute(text("ALTER TABLE chat_messages ADD COLUMN rewritten_query VARCHAR(500);"))
                print("  [MIGRATE] Added 'rewritten_query' to chat_messages.")

    print("\n[SUCCESS] Phase 7 database migration completed successfully.")

if __name__ == "__main__":
    migrate()
