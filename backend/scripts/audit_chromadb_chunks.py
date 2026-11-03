import os
import sys
sys.path.insert(0, os.path.abspath("."))
from backend.services.vector_service import get_rag_collection, retrieve_relevant_chunks

collection = get_rag_collection()

count = collection.count()
print(f"Total chunks in 'campussync_rag': {count}")

# Inspect first 20 and sample across the collection
res = collection.get(limit=count, include=["metadatas", "documents"])
metadatas = res["metadatas"]
docs = res["documents"]
ids = res["ids"]

scopes = {}
origins = {}
verif_statuses = {}
missing_provenance = []
missing_verification = []
missing_scope = []

for idx, (doc_id, meta, doc) in enumerate(zip(ids, metadatas, docs)):
    meta = meta or {}
    sc = meta.get("scope", "MISSING")
    scopes[sc] = scopes.get(sc, 0) + 1
    
    orig = meta.get("data_origin", meta.get("source_provenance", "MISSING"))
    origins[orig] = origins.get(orig, 0) + 1
    
    vs = meta.get("verification_status", "MISSING")
    verif_statuses[vs] = verif_statuses.get(vs, 0) + 1

    if "source_provenance" not in meta and "data_origin" not in meta:
        missing_provenance.append(doc_id)
    if "verification_status" not in meta:
        missing_verification.append(doc_id)
    if "scope" not in meta:
        missing_scope.append(doc_id)

print("\n--- SCOPES SUMMARY IN CHROMADB ---")
for k, v in scopes.items():
    print(f"  {k}: {v}")

print("\n--- ORIGINS / PROVENANCE SUMMARY IN CHROMADB ---")
for k, v in origins.items():
    print(f"  {k}: {v}")

print("\n--- VERIFICATION STATUS SUMMARY IN CHROMADB ---")
for k, v in verif_statuses.items():
    print(f"  {k}: {v}")

print(f"\nMissing provenance count: {len(missing_provenance)}")
print(f"Missing verification count: {len(missing_verification)}")
print(f"Missing scope count: {len(missing_scope)}")

# Test RAG retrieval logic
from backend.services.vector_service import retrieve_relevant_chunks

test_queries = [
    ("What are the 7th semester practical exam dates?", "CSE", 7),
    ("What are the 3rd semester CSE course notices?", "CSE", 3),
    ("Are there any IT department 3rd semester announcements?", "IT", 3),
]

print("\n--- TESTING COHORT-ISOLATED RETRIEVAL ---")
for q, dept, sem in test_queries:
    ctx = {"department_code": dept, "semester": sem}
    results = retrieve_relevant_chunks(query=q, n_results=3, student_context=ctx)
    print(f"\n[Query: '{q}' | Dept: {dept} | Sem: {sem}]")
    print(f"  Retrieved count: {len(results)}")
    for r in results:
        title = r.get("title", "Unknown")
        sc = r.get("scope")
        d = r.get("department_code")
        s = r.get("target_semester")
        doc_url = r.get("document_url")
        print(f"  - Title: '{title[:50]}...' | Scope: {sc} | Dept: {d} | Sem: {s} | URL: {doc_url}")
