"""
Migration: Academic Document Authenticity Safeguard.
Updates data_origin and verification_status across database and ChromaDB vector store
so unverified or locally-generated demo documents are never misrepresented as official.
"""
import os
import sys
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.db.session import SessionLocal
from backend.models.academic import Notice, AcademicResource
from backend.services.vector_service import get_rag_collection

def apply_safeguards():
    print("=" * 70)
    print("  APPLYING ACADEMIC DOCUMENT AUTHENTICITY SAFEGUARDS")
    print("=" * 70)

    conn = sqlite3.connect(str(BASE_DIR / "campussync.db"))
    cur = conn.cursor()

    # 1. Add data_origin to academic_resources if not present
    cur.execute("PRAGMA table_info(academic_resources)")
    cols = [r[1] for r in cur.fetchall()]
    if "data_origin" not in cols:
        cur.execute("ALTER TABLE academic_resources ADD COLUMN data_origin VARCHAR(30) DEFAULT 'DEMO_SEED'")
        print("  [Schema] Added data_origin column to academic_resources.")
    else:
        print("  [Schema] data_origin already present in academic_resources.")

    # 2. Update Notice 1 to PENDING_VERIFICATION (DEMO_SEED)
    cur.execute("""
        UPDATE notices 
        SET data_origin = 'DEMO_SEED', verification_status = 'PENDING_VERIFICATION' 
        WHERE id = 1
    """)
    print("  [Notices] Notice 1 classified as DEMO_SEED / PENDING_VERIFICATION.")

    # 3. Update Academic Resources
    # Resource 1, 2, 3: Generated hosted PDFs without verified official scans -> DEMO_SEED / PENDING_VERIFICATION
    cur.execute("""
        UPDATE academic_resources 
        SET data_origin = 'DEMO_SEED', verification_status = 'PENDING_VERIFICATION' 
        WHERE id IN (1, 2, 3)
    """)
    print("  [Resources] Resources 1, 2, 3 classified as DEMO_SEED / PENDING_VERIFICATION.")

    # Resource 4: Verified live BTU circular on ecajmer.ac.in -> VERIFIED_OFFICIAL / VERIFIED
    cur.execute("""
        UPDATE academic_resources 
        SET data_origin = 'VERIFIED_OFFICIAL', verification_status = 'VERIFIED' 
        WHERE id = 4
    """)
    print("  [Resources] Resource 4 confirmed as VERIFIED_OFFICIAL / VERIFIED.")

    # Resource 5: Archive without verified destination -> UNVERIFIED / UNVERIFIED
    cur.execute("""
        UPDATE academic_resources 
        SET data_origin = 'UNVERIFIED', verification_status = 'UNVERIFIED' 
        WHERE id = 5
    """)
    print("  [Resources] Resource 5 classified as UNVERIFIED.")

    conn.commit()
    conn.close()

    # 4. Synchronize ChromaDB metadata for notice_1_chk_0
    try:
        col = get_rag_collection()
        doc = col.get(ids=["notice_1_chk_0"])
        if doc and doc["ids"]:
            meta = doc["metadatas"][0]
            meta["data_origin"] = "DEMO_SEED"
            meta["verification_status"] = "PENDING_VERIFICATION"
            col.update(ids=["notice_1_chk_0"], metadatas=[meta])
            print("  [ChromaDB] Updated notice_1_chk_0 metadata to DEMO_SEED / PENDING_VERIFICATION.")
    except Exception as e:
        print(f"  [ChromaDB] Note updating vector metadata: {e}")

    print("\nSafeguards successfully applied to SQLite and ChromaDB.")

if __name__ == "__main__":
    apply_safeguards()

