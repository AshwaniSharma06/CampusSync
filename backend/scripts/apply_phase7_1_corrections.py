import sqlite3
import os, sys
sys.path.insert(0, os.path.abspath("."))
from backend.services.vector_service import get_rag_collection

conn = sqlite3.connect("campussync.db")
c = conn.cursor()

print("=== APPLYING PHASE 7.1 SAFEGUARD CORRECTIONS ===")

# 1. Correct Notice 160 (8th Semester 2nd Mid Term Time Table)
c.execute("""
    UPDATE notices 
    SET scope = 'SEMESTER_SPECIFIC', target_semester = 8, department_code = 'IT'
    WHERE id = 160
""")
print(f"Updated Notice 160 in SQLite: rows affected = {c.rowcount}")

# 2. Flag 5 Administrative / Attendance records in AcademicResource
admin_ids = [9, 13, 14, 15, 16]
c.execute("""
    UPDATE academic_resources 
    SET verification_status = 'FLAGGED', category = 'Administrative / Review Required'
    WHERE id IN (9, 13, 14, 15, 16)
""")
print(f"Flagged {c.rowcount} administrative items in academic_resources as FLAGGED for admin review")

conn.commit()

# 3. Synchronize ChromaDB metadata
collection = get_rag_collection()

# Update Notice 160 chunk in ChromaDB
res_160 = collection.get(where={"parent_doc_id": "notice_160"}, include=["metadatas", "documents"])
if res_160 and res_160.get("ids"):
    doc_id = res_160["ids"][0]
    meta = res_160["metadatas"][0]
    meta["scope"] = "SEMESTER_SPECIFIC"
    meta["target_semester"] = 8
    meta["department_code"] = "IT"
    collection.update(ids=[doc_id], metadatas=[meta])
    print(f"Updated ChromaDB chunk {doc_id} with scope=SEMESTER_SPECIFIC, sem=8, dept=IT")

# Update Notice 10 chunk in ChromaDB with target_user_id = 2
res_10 = collection.get(where={"parent_doc_id": "notice_10"}, include=["metadatas", "documents"])
if res_10 and res_10.get("ids"):
    doc_id = res_10["ids"][0]
    meta = res_10["metadatas"][0]
    meta["target_user_id"] = 2
    meta["scope"] = "INDIVIDUAL"
    collection.update(ids=[doc_id], metadatas=[meta])
    print(f"Updated ChromaDB chunk {doc_id} with target_user_id=2, scope=INDIVIDUAL")

print("=== SAFEGUARD CORRECTIONS APPLIED SUCCESSFULLY ===")
conn.close()
