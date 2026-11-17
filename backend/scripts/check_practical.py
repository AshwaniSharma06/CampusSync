import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.services.vector_service import get_rag_collection
col = get_rag_collection()
res = col.get()
print("Total records:", len(res["documents"]))
found = []
for m, d in zip(res["metadatas"], res["documents"]):
    t = m.get("title") or ""
    if "practical" in t.lower() or "mid term" in t.lower() or "mid-term" in t.lower():
        found.append((m, d))

print("Matching records:", len(found))
for m, d in found:
    print(f"Title: {m.get('title')} | Dept: {m.get('department_code')} | Sem: {m.get('target_semester')} | URL: {m.get('document_url')}")

