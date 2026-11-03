"""
Persistent Vector Database Service for CampusSync AI.
Manages ChromaDB persistence, document chunking, metadata indexing,
document lifecycle synchronization, and scoped cohort retrieval.
"""

import os
import re
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from sqlalchemy.orm import Session

from backend.core.config import settings

# Global client cache
_persistent_client: Optional[chromadb.PersistentClient] = None

def get_chroma_client() -> chromadb.PersistentClient:
    """Returns singleton persistent ChromaDB client pointing to configured storage path."""
    global _persistent_client
    if _persistent_client is None:
        os.makedirs(settings.CHROMA_PERSIST_DIRECTORY, exist_ok=True)
        _persistent_client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIRECTORY,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
    return _persistent_client

def get_rag_collection():
    """Returns or creates the official CampusSync persistent ChromaDB collection."""
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=settings.CHROMA_COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}
    )

def chunk_text(text: str, chunk_size: int = 350, overlap: int = 40) -> List[str]:
    """
    Splits text into overlapping word chunks preserving sentence flow.
    """
    clean = re.sub(r'\s+', ' ', text).strip()
    words = clean.split()
    if not words:
        return []
    
    if len(words) <= chunk_size:
        return [" ".join(words)]
        
    chunks = []
    step = max(chunk_size - overlap, 50)
    for i in range(0, len(words), step):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
        if i + chunk_size >= len(words):
            break
    return chunks

def index_document(
    doc_id: str,
    title: str,
    text: str,
    source_url: str = "",
    document_url: str = "",
    scope: str = "GLOBAL",
    department_code: Optional[str] = None,
    target_semester: Optional[int] = None,
    academic_year: str = "2026-27",
    document_type: str = "NOTICE",
    verification_status: str = "VERIFIED",
    data_origin: str = "VERIFIED_OFFICIAL",
    published_date: Optional[str] = None
) -> int:
    """
    Chunks and indexes a document with comprehensive metadata into persistent ChromaDB.
    Removes previous chunks for the same doc_id before re-indexing to prevent duplicates.
    """
    if not text or not text.strip():
        return 0

    collection = get_rag_collection()
    
    # 1. Purge old chunks for this document id
    delete_document_chunks(doc_id)

    # 2. Chunk text
    chunks = chunk_text(text)
    if not chunks:
        return 0

    documents = []
    metadatas = []
    ids = []

    # Format department & semester metadata consistently for ChromaDB string/int matching
    dept_str = (department_code or "ALL").upper()
    sem_int = int(target_semester) if target_semester is not None else 0

    for idx, chunk in enumerate(chunks):
        chunk_id = f"{doc_id}_chk_{idx}"
        meta = {
            "parent_doc_id": str(doc_id),
            "chunk_index": idx,
            "title": title[:200],
            "source_url": source_url or "",
            "document_url": document_url or "",
            "scope": scope,
            "department_code": dept_str,
            "target_semester": sem_int,
            "academic_year": academic_year or "2026-27",
            "document_type": document_type,
            "verification_status": verification_status,
            "data_origin": data_origin,
            "published_date": published_date or ""
        }
        documents.append(chunk)
        metadatas.append(meta)
        ids.append(chunk_id)

    collection.upsert(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )
    return len(documents)

def delete_document_chunks(doc_id: str) -> int:
    """Removes all chunks associated with a specific document ID from ChromaDB."""
    collection = get_rag_collection()
    try:
        existing = collection.get(where={"parent_doc_id": str(doc_id)})
        if existing and existing.get("ids"):
            collection.delete(ids=existing["ids"])
            return len(existing["ids"])
    except Exception as e:
        print(f"[VectorService] Delete warning for doc {doc_id}: {e}")
    return 0

def retrieve_relevant_chunks(
    query: str,
    n_results: int = 5,
    student_context: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Performs vector similarity search against persistent ChromaDB.
    Enforces that:
    1. Only VERIFIED records are ever returned to student requests.
    2. Department & semester scopes are strictly respected.
    """
    q_clean = (query or "").strip()
    if not q_clean:
        return []

    collection = get_rag_collection()
    total_docs = collection.count()
    if total_docs == 0:
        return []

    # Base filter: Only VERIFIED documents
    where_filter: Dict[str, Any] = {
        "verification_status": "VERIFIED"
    }

    # If student context is present, filter for cohort eligibility
    if student_context:
        student_dept = (student_context.get("department_code") or student_context.get("department") or "").upper()
        # Normalize department to short code
        if "COMPUTER" in student_dept or "CSE" in student_dept:
            canonical_dept = "CSE"
        elif "INFO" in student_dept or "IT" in student_dept:
            canonical_dept = "IT"
        elif "ELECT" in student_dept or "EE" in student_dept:
            canonical_dept = "EE"
        elif "MECH" in student_dept or "ME" in student_dept:
            canonical_dept = "ME"
        elif "CIVIL" in student_dept or "CE" in student_dept:
            canonical_dept = "CE"
        elif "ELECTRONIC" in student_dept or "ECE" in student_dept:
            canonical_dept = "ECE"
        else:
            canonical_dept = student_dept

        student_sem = student_context.get("semester")
        sem_val = int(student_sem) if student_sem is not None else 0

        # Student is authorized for:
        # - GLOBAL notices
        # - DEPARTMENT_SPECIFIC notices for their department (or ALL)
        # - SEMESTER_SPECIFIC notices for their department AND semester
        allowed_scopes = ["GLOBAL"]
        if canonical_dept:
            allowed_scopes.append("DEPARTMENT_SPECIFIC")
        if canonical_dept and sem_val > 0:
            allowed_scopes.append("SEMESTER_SPECIFIC")

        where_filter = {
            "$and": [
                {"verification_status": "VERIFIED"},
                {"scope": {"$in": allowed_scopes}}
            ]
        }

    limit = min(n_results, total_docs)
    try:
        results = collection.query(
            query_texts=[q_clean],
            n_results=limit,
            where=where_filter
        )
    except Exception as e:
        print(f"[VectorService] Scoped query failed: {e}. Falling back to verified base filter.")
        try:
            results = collection.query(
                query_texts=[q_clean],
                n_results=limit,
                where={"verification_status": "VERIFIED"}
            )
        except Exception as e2:
            print(f"[VectorService] Fallback query failed: {e2}")
            return []

    output_chunks = []
    if results and results.get("documents") and results["documents"][0]:
        docs = results["documents"][0]
        metas = results["metadatas"][0] if results.get("metadatas") else []
        distances = results.get("distances", [[]])[0] if results.get("distances") else []

        for idx, (doc, meta) in enumerate(zip(docs, metas)):
            # If distance is provided and exceeds relevance threshold, exclude as noise
            dist = None
            if distances and idx < len(distances):
                dist = distances[idx]
                if dist is not None and dist > settings.RAG_RELEVANCE_THRESHOLD:
                    continue

            # Student cohort verification guard
            if student_context:
                target_dept = meta.get("department_code")
                target_sem = meta.get("target_semester")
                scope = meta.get("scope")

                if scope == "DEPARTMENT_SPECIFIC" and target_dept not in ["ALL", canonical_dept]:
                    continue
                if scope == "SEMESTER_SPECIFIC":
                    if target_dept not in ["ALL", canonical_dept] or (target_sem != 0 and target_sem != sem_val):
                        continue

            output_chunks.append({
                "chunk_text": doc,
                "title": meta.get("title", "Official College Record"),
                "source_url": meta.get("source_url", ""),
                "document_url": meta.get("document_url", ""),
                "published_date": meta.get("published_date", ""),
                "document_type": meta.get("document_type", "NOTICE"),
                "verification_status": meta.get("verification_status", "VERIFIED"),
                "data_origin": meta.get("data_origin", "VERIFIED_OFFICIAL"),
                "scope": meta.get("scope", "GLOBAL"),
                "department_code": meta.get("department_code", ""),
                "target_semester": meta.get("target_semester"),
                "distance": dist
            })

    return output_chunks

def sync_database_to_chroma(db: Session) -> Dict[str, int]:
    """
    Synchronizes all VERIFIED notices and verified academic documents from SQLite into persistent ChromaDB.
    Strictly skips UNVERIFIED or FLAGGED documents.
    """
    from backend.models.academic import Notice, AcademicDocument, VerificationStatus

    notices_indexed = 0
    docs_indexed = 0
    total_chunks = 0

    # 1. Sync verified Notices
    verified_notices = db.query(Notice).filter(
        Notice.verification_status == VerificationStatus.VERIFIED.value,
        Notice.is_active == True
    ).all()

    for notice in verified_notices:
        body = f"{notice.title}. {notice.content}"
        chunks = index_document(
            doc_id=f"notice_{notice.id}",
            title=notice.title,
            text=body,
            source_url=notice.source_url or "",
            document_url=notice.document_url or "",
            scope=notice.scope or "GLOBAL",
            department_code=notice.department_code,
            target_semester=notice.target_semester,
            academic_year=notice.academic_year or "2026-27",
            document_type="NOTICE",
            verification_status="VERIFIED",
            data_origin=notice.data_origin or "VERIFIED_OFFICIAL",
            published_date=notice.published_date.isoformat() if notice.published_date else None
        )
        notices_indexed += 1
        total_chunks += chunks

    # 2. Sync verified AcademicDocuments
    verified_docs = db.query(AcademicDocument).filter(
        AcademicDocument.verification_status == VerificationStatus.VERIFIED.value
    ).all()

    for doc in verified_docs:
        body = doc.cleaned_text or doc.raw_text or doc.title
        chunks = index_document(
            doc_id=f"doc_{doc.id}",
            title=doc.title,
            text=body,
            source_url=doc.source_url or "",
            document_url=doc.file_url or "",
            scope=doc.scope or "GLOBAL",
            department_code=doc.department_code,
            target_semester=doc.target_semester,
            academic_year=doc.academic_year or "2026-27",
            document_type=doc.document_type or "DOCUMENT",
            verification_status="VERIFIED",
            data_origin=doc.data_origin or "SCRAPED",
            published_date=doc.created_at.isoformat() if doc.created_at else None
        )
        docs_indexed += 1
        total_chunks += chunks

    return {
        "verified_notices_indexed": notices_indexed,
        "verified_documents_indexed": docs_indexed,
        "total_chunks_stored": total_chunks
    }

