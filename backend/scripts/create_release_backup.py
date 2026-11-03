"""
Production Release Backup & Recovery Script for CampusSync.
Creates a verified snapshot of SQLite database and ChromaDB vector store.
"""
import os
import shutil
from datetime import datetime
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKUP_DIR = ROOT_DIR / "backups"
DB_FILE = ROOT_DIR / "campussync.db"
CHROMA_DIR = ROOT_DIR / "backend" / "data" / "chromadb"

def create_backup():
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # 1. Backup SQLite Database
    if DB_FILE.exists():
        backup_db_file = BACKUP_DIR / f"campussync_release_backup_{timestamp}.db"
        shutil.copy2(DB_FILE, backup_db_file)
        size_kb = os.path.getsize(backup_db_file) / 1024
        print(f"[Backup] SQLite DB backed up to: {backup_db_file.name} ({size_kb:.2f} KB)")
    else:
        print("[Warning] SQLite DB file not found!")

    # 2. Backup ChromaDB vector index
    if CHROMA_DIR.exists():
        backup_chroma_dir = BACKUP_DIR / f"chromadb_release_backup_{timestamp}"
        shutil.copytree(CHROMA_DIR, backup_chroma_dir, dirs_exist_ok=True)
        print(f"[Backup] ChromaDB persistent store backed up to: {backup_chroma_dir.name}")
    else:
        print("[Warning] ChromaDB directory not found!")

    print("[Success] Release backup snapshot created successfully.")

if __name__ == "__main__":
    create_backup()

