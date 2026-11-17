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
    published_date: Optional[str] = None,
    target_user_id: Optional[int] = None,
    page_number: Optional[int] = None
) -> int:
    """
    Chunks and indexes a document with comprehensive metadata into persistent ChromaDB.
    Removes previous chunks for the same doc_id before re-indexing to prevent duplicates.
    Preserves page_number metadata for source attribution.
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
    page_int = int(page_number) if page_number is not None else 1

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
            "target_user_id": int(target_user_id) if target_user_id is not None else 0,
            "academic_year": academic_year or "2026-27",
            "document_type": document_type,
            "verification_status": verification_status,
            "data_origin": data_origin,
            "published_date": published_date or "",
            "page_number": page_int
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
    canonical_dept = "ALL"
    sem_val = 0
    user_id_val = 0

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
        user_id = student_context.get("user_id")
        user_id_val = int(user_id) if user_id is not None else 0

        # Detect if query explicitly asks for a particular semester
        explicit_sem_match = re.search(r'\b(?:sem|semester)\s*([1-8])\b|\b([1-8])(?:st|nd|rd|th)\s*(?:sem|semester)\b', q_clean, re.I)
        allowed_semesters = [0]
        if sem_val > 0:
            allowed_semesters.append(sem_val)
        if explicit_sem_match:
            queried_sem = int(explicit_sem_match.group(1) or explicit_sem_match.group(2))
            if queried_sem not in allowed_semesters:
                allowed_semesters.append(queried_sem)

        allowed_scopes = ["GLOBAL"]
        if canonical_dept:
            allowed_scopes.append("DEPARTMENT_SPECIFIC")
        if canonical_dept and len(allowed_semesters) > 1:
            allowed_scopes.append("SEMESTER_SPECIFIC")
        if user_id_val > 0:
            allowed_scopes.append("INDIVIDUAL")

        where_filter = {
            "$and": [
                {"verification_status": "VERIFIED"},
                {"scope": {"$in": allowed_scopes}}
            ]
        }
    else:
        # Detect explicit semester in anonymous query
        explicit_sem_match = re.search(r'\b(?:sem|semester)\s*([1-8])\b|\b([1-8])(?:st|nd|rd|th)\s*(?:sem|semester)\b', q_clean, re.I)
        allowed_semesters = [0]
        if explicit_sem_match:
            allowed_semesters.append(int(explicit_sem_match.group(1) or explicit_sem_match.group(2)))

    # Query an adequately sized candidate pool so cohort filtering yields top relevant chunks
    candidate_limit = min(max(n_results * 8, 30), total_docs)
    try:
        results = collection.query(
            query_texts=[q_clean],
            n_results=candidate_limit,
            where=where_filter
        )
    except Exception as e:
        print(f"[VectorService] Scoped query failed: {e}. Falling back to verified base filter.")
        try:
            results = collection.query(
                query_texts=[q_clean],
                n_results=candidate_limit,
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

            # Student cohort & privacy verification guard
            if student_context:
                target_dept = meta.get("department_code")
                target_sem = meta.get("target_semester")
                scope = meta.get("scope")
                target_uid = meta.get("target_user_id", 0)

                # Strict individual privacy protection
                if scope == "INDIVIDUAL":
                    if user_id_val <= 0 or target_uid != user_id_val:
                        continue

                if scope == "DEPARTMENT_SPECIFIC" and target_dept not in ["ALL", "", canonical_dept]:
                    continue
                if scope == "SEMESTER_SPECIFIC":
                    if target_dept not in ["ALL", "", canonical_dept] or (target_sem != 0 and target_sem not in allowed_semesters):
                        continue
            else:
                # Unauthenticated or context-free requests
                scope = meta.get("scope")
                target_sem = meta.get("target_semester")
                if scope == "INDIVIDUAL":
                    continue
                if scope == "SEMESTER_SPECIFIC" and target_sem not in allowed_semesters:
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
                "page_number": meta.get("page_number", 1),
                "distance": dist
            })
            if len(output_chunks) >= n_results:
                break

    return output_chunks

def sync_hosted_documents_to_chroma() -> int:
    """
    Extracts text page-by-page from hosted official PDF documents and indexes into ChromaDB with exact page references.
    """
    from backend.services.document_extractor import DocumentExtractor
    import pypdf
    import io

    hosted_dir = os.path.join("backend", "data", "hosted_documents")
    if not os.path.exists(hosted_dir):
        hosted_dir = "data/hosted_documents"
    if not os.path.exists(hosted_dir):
        return 0

    indexed_count = 0
    hosted_specs = [
        {
            "filename": "BTU_CSE_Sem3_to_8_Syllabus.pdf",
            "title": "BTU B.Tech CSE (3rd to 8th Sem) Scheme & Syllabus",
            "document_type": "SYLLABUS",
            "scope": "DEPARTMENT_SPECIFIC",
            "department_code": "CSE",
            "target_semester": 0,
            "document_url": "https://blr1.digitaloceanspaces.com/btu/btu/documents/1788498815350793100_15102025022312-media.pdf",
            "data_origin": "VERIFIED_OFFICIAL"
        },
        {
            "filename": "Resource_1_BTU_CSE_Sem7_Syllabus.pdf",
            "title": "BTU B.Tech CSE 7th Sem Complete Scheme & Syllabus",
            "document_type": "SYLLABUS",
            "scope": "SEMESTER_SPECIFIC",
            "department_code": "CSE",
            "target_semester": 7,
            "document_url": "https://blr1.digitaloceanspaces.com/btu/btu/documents/1788498815350793100_15102025022312-media.pdf",
            "data_origin": "VERIFIED_OFFICIAL"
        },
        {
            "filename": "Resource_2_BTU_Academic_Calendar_2026-27.pdf",
            "title": "BTU Annual Academic Calendar (Session 2026-27)",
            "document_type": "CALENDAR",
            "scope": "GLOBAL",
            "department_code": "ALL",
            "target_semester": 0,
            "document_url": "https://www.ecajmer.ac.in/uploads/resources/Resource_2_BTU_Academic_Calendar_2026-27.pdf",
            "data_origin": "VERIFIED_OFFICIAL"
        },
        {
            "filename": "Resource_3_ECA_Barliya_Campus_Map.pdf",
            "title": "ECA Barliya Campus Layout & Facility Guide",
            "document_type": "CAMPUS_GUIDE",
            "scope": "GLOBAL",
            "department_code": "ALL",
            "target_semester": 0,
            "document_url": "https://www.ecajmer.ac.in/uploads/resources/Resource_3_ECA_Barliya_Campus_Map.pdf",
            "data_origin": "VERIFIED_OFFICIAL"
        },
        {
            "filename": "Notice_1_MidTerm_Schedule_CSE_Sem7.pdf",
            "title": "Mid-Term I Examination Schedule (B.Tech VII Sem CSE)",
            "document_type": "TIMETABLE",
            "scope": "SEMESTER_SPECIFIC",
            "department_code": "CSE",
            "target_semester": 7,
            "document_url": "https://www.ecajmer.ac.in/uploads/circulars/Notice_1_MidTerm_Schedule_CSE_Sem7.pdf",
            "data_origin": "DEMO_SEED"
        }
    ]

    for spec in hosted_specs:
        file_path = os.path.join(hosted_dir, spec["filename"])
        if not os.path.exists(file_path):
            continue
        try:
            with open(file_path, "rb") as f:
                pdf_bytes = f.read()
            p_reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            for p_idx, page in enumerate(p_reader.pages, 1):
                p_text = DocumentExtractor.clean_academic_text(page.extract_text() or "")
                if p_text:
                    index_document(
                        doc_id=f"hosted_{spec['filename'].replace('.pdf', '')}_p{p_idx}",
                        title=f"{spec['title']} (Page {p_idx})",
                        text=p_text,
                        source_url="https://www.ecajmer.ac.in",
                        document_url=spec["document_url"],
                        scope=spec["scope"],
                        department_code=spec["department_code"],
                        target_semester=spec["target_semester"],
                        document_type=spec["document_type"],
                        verification_status="VERIFIED",
                        data_origin=spec["data_origin"],
                        published_date="2026-11-01",
                        page_number=p_idx
                    )
                    indexed_count += 1
        except Exception as e:
            print(f"[VectorService] Error indexing hosted PDF {spec['filename']}: {e}")

    return indexed_count

def sync_courses_and_exams_to_chroma(db: Session) -> int:
    """Indexes courses (with syllabus summaries) and examination schedules into ChromaDB."""
    from backend.models.academic import Course, ExaminationSchedule
    count = 0
    courses = db.query(Course).all()
    for c in courses:
        text = f"Course Code: {c.code}. Title: {c.title}. Department: {c.department}. Semester: {c.semester}. Credits: {c.credits}. Syllabus Details: {c.syllabus_summary or 'Standard BTU Curriculum'}."
        doc_url = "https://blr1.digitaloceanspaces.com/btu/btu/documents/1788498815350793100_15102025022312-media.pdf" if c.department == "CSE" else "https://btu.ac.in/home/Syllabus-Scheme"
        index_document(
            doc_id=f"course_{c.id}_{c.code}",
            title=f"Course Syllabus: {c.code} - {c.title}",
            text=text,
            source_url="https://btu.ac.in/home/Syllabus-Scheme",
            document_url=doc_url,
            scope="SEMESTER_SPECIFIC",
            department_code=c.department,
            target_semester=c.semester,
            document_type="SYLLABUS",
            verification_status="VERIFIED",
            data_origin="VERIFIED_OFFICIAL",
            page_number=1
        )
        count += 1

    exams = db.query(ExaminationSchedule).all()
    for ex in exams:
        text = f"Official Examination Schedule: {ex.subject_name} ({ex.course_code}). Exam Type: {ex.exam_type}. Date: {ex.exam_date}. Time: {ex.start_time} to {ex.end_time}. Venue: {ex.exam_hall or 'Examination Hall'}. Department: {ex.department_code}. Semester: {ex.semester}. Session: {ex.academic_session}."
        index_document(
            doc_id=f"exam_{ex.id}_{ex.course_code}",
            title=f"Exam Schedule: {ex.course_code} - {ex.subject_name} ({ex.exam_type})",
            text=text,
            source_url="https://www.ecajmer.ac.in/academics/examinations",
            document_url="https://www.ecajmer.ac.in/uploads/circulars/Notice_1_MidTerm_Schedule_CSE_Sem7.pdf",
            scope="SEMESTER_SPECIFIC",
            department_code=ex.department_code,
            target_semester=ex.semester,
            document_type="EXAMINATION_SCHEDULE",
            verification_status="VERIFIED",
            data_origin=ex.data_origin or "VERIFIED_OFFICIAL",
            page_number=1
        )
        count += 1

    return count

def sync_database_to_chroma(db: Session, max_items: Optional[int] = None) -> Dict[str, int]:
    """
    Synchronizes all VERIFIED notices, hosted academic documents, and course syllabi into persistent ChromaDB.
    Strictly skips UNVERIFIED or FLAGGED documents.
    """
    from backend.models.academic import Notice, AcademicDocument, VerificationStatus

    notices_indexed = 0
    docs_indexed = 0
    total_chunks = 0

    # 1. Sync hosted PDFs (Syllabus, Academic Calendar, Campus Map, Midterm Schedule)
    hosted_chunks = sync_hosted_documents_to_chroma()
    total_chunks += hosted_chunks

    # 2. Sync Course Syllabi and Examination Schedules
    course_exam_chunks = sync_courses_and_exams_to_chroma(db)
    total_chunks += course_exam_chunks

    # 3. Sync verified Notices
    notice_query = db.query(Notice).filter(
        Notice.verification_status == VerificationStatus.VERIFIED.value,
        Notice.is_active == True
    )
    if max_items:
        notice_query = notice_query.limit(max_items)
    verified_notices = notice_query.all()

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
            target_user_id=getattr(notice, "target_user_id", None),
            academic_year=notice.academic_year or "2026-27",
            document_type="NOTICE",
            verification_status="VERIFIED",
            data_origin=notice.data_origin or "VERIFIED_OFFICIAL",
            published_date=notice.published_date.isoformat() if notice.published_date else None,
            page_number=1
        )
        notices_indexed += 1
        total_chunks += chunks

    return {
        "hosted_chunks_indexed": hosted_chunks,
        "courses_exams_indexed": course_exam_chunks,
        "verified_notices_indexed": notices_indexed,
        "total_chunks_stored": total_chunks
    }

def ensure_chroma_initialized(db: Session, max_sync: Optional[int] = None) -> Dict[str, Any]:
    """
    Safe startup check:
    Inspects whether persistent ChromaDB contains critical academic syllabus and calendar documents.
    If missing or empty, synchronizes hosted documents, course syllabi, and notices.
    """
    try:
        collection = get_rag_collection()
        count = collection.count()

        # Check if hosted syllabus is already indexed
        test_check = collection.get(ids=["hosted_Resource_1_BTU_CSE_Sem7_Syllabus_p1_chk_0"])
        has_syllabus = bool(test_check and test_check.get("ids"))

        if count >= 300 and has_syllabus:
            print(f"[ChromaDB Startup] Collection '{settings.CHROMA_COLLECTION_NAME}' active with {count} chunks (syllabus & calendar verified). Skipping full re-initialization.")
            return {"status": "ALREADY_POPULATED", "chunks_count": count}

        print(f"[ChromaDB Startup] Initializing/updating ChromaDB with hosted documents and academic syllabus...")
        sync_stats = sync_database_to_chroma(db, max_items=max_sync)
        new_count = collection.count()
        print(f"[ChromaDB Startup] Synchronization complete: {new_count} chunks indexed.")
        return {"status": "INITIALIZED", "chunks_count": new_count, "stats": sync_stats}
    except Exception as e:
        print(f"[ChromaDB Startup] Error during ChromaDB initialization check: {e}")
        return {"status": "ERROR", "error": str(e)}


