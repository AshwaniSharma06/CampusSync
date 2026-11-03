import sqlite3
import os, sys
sys.path.insert(0, os.path.abspath("."))
from backend.services.vector_service import get_rag_collection

conn = sqlite3.connect("campussync.db")
c = conn.cursor()

query = "SELECT id, title, scope, department_code, target_semester, data_origin, verification_status, source_url, document_url, raw_content FROM notices WHERE title LIKE '%8th Semester%' AND title LIKE '%Mid Term%'"
rows = c.execute(query).fetchall()

print("--- SQLITE NOTICES MATCHING 8th Semester Mid Term ---")
for r in rows:
    print("ID:", r[0])
    print("Title:", r[1])
    print("Scope:", r[2])
    print("Dept:", r[3])
    print("Sem:", r[4])
    print("Origin:", r[5])
    print("Verif:", r[6])
    print("Source URL:", r[7])
    print("Doc URL:", r[8])
    print("Content:", str(r[9])[:200])
    print("-" * 50)

# Check ChromaDB
collection = get_rag_collection()
res = collection.get(where={"parent_doc_id": f"notice_{rows[0][0]}" if rows else "none"}, include=["metadatas", "documents"])
print("\n--- CHROMADB METADATA ---")
print("IDs:", res["ids"])
print("Metas:", res["metadatas"])

