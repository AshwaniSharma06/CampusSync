import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.services.vector_service import get_rag_collection

col = get_rag_collection()
print("Total chunks in ChromaDB:", col.count())
sample = col.get(limit=10)
for m in sample["metadatas"]:
    title = (m.get("title") or "")[:45]
    print(f"Type: {m.get('document_type')} | Dept: {m.get('department_code')} | Sem: {m.get('target_semester')} | Title: {title}")
