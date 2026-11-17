"""
Intelligent RAG Retrieval Pipeline for CampusSync AI.
Coordinates query intent routing, semantic vector search, hybrid scoring,
deduplication, relevance filtering, and smart single-source attribution.
"""

import re
from datetime import datetime
from typing import List, Dict, Any, Optional

from backend.core.config import settings
from backend.services.query_intent import QueryIntent
from backend.services.query_rewriter import rewrite_query_for_retrieval
from backend.services.vector_service import retrieve_relevant_chunks, get_rag_collection

def _calculate_keyword_overlap_score(query: str, title: str, text: str) -> float:
    """
    Computes keyword matching score between query terms and document content.
    Boosts exact title matches significantly.
    """
    stop_words = {
        "what", "when", "where", "which", "who", "whom", "this", "that", "these", "those",
        "have", "from", "with", "about", "could", "would", "should", "your", "please",
        "the", "and", "for", "are", "tell", "give", "show", "how", "can", "will"
    }
    terms = [w.lower() for w in re.findall(r'\b[A-Za-z0-9\-]{3,}\b', query) if w.lower() not in stop_words]
    if not terms:
        return 0.0

    title_lower = title.lower()
    text_lower = text.lower()

    score = 0.0
    for term in terms:
        if term in title_lower:
            score += 0.40  # Significant boost for title match
        elif term in text_lower:
            score += 0.12  # Moderate boost for body match

    return min(score, 1.0)

def execute_intelligent_retrieval(
    query: str,
    history: Optional[List[Dict[str, str]]] = None,
    student_context: Optional[Dict[str, Any]] = None,
    gemini_client: Optional[Any] = None,
    intent: Optional[QueryIntent] = None
) -> Dict[str, Any]:
    """
    Executes the intelligent retrieval pipeline:
    1. Bypasses retrieval for greetings, casual conversation, out-of-scope, and general knowledge.
    2. Rewrites follow-up queries using conversation context.
    3. Executes targeted ChromaDB retrieval matching the query intent and student cohort.
    4. Trims retrieved chunks to the top 2-3 most relevant passages.
    5. Enforces Smart PDF Reference Handling: provides only the single primary authoritative source.
    """
    q_clean = (query or "").strip()
    if not q_clean:
        return {
            "rewritten_query": "",
            "chunks": [],
            "context_text": "NO_MATCHING_OFFICIAL_DOCUMENTS_FOUND",
            "sources": [],
            "has_verified_context": False
        }

    # 1. Zero-Retrieval Bypass for Greetings, Conversation, and General CS Knowledge
    if intent in [
        QueryIntent.GREETING,
        QueryIntent.GENERAL_CONVERSATION,
        QueryIntent.OUT_OF_SCOPE_QUERY,
        QueryIntent.GENERAL_KNOWLEDGE
    ]:
        return {
            "rewritten_query": q_clean,
            "chunks": [],
            "context_text": "NO_MATCHING_OFFICIAL_DOCUMENTS_FOUND",
            "sources": [],
            "has_verified_context": False
        }

    # 2. Query Rewriting (only for follow-up turns)
    if intent == QueryIntent.FOLLOW_UP_QUERY:
        rewritten_query = rewrite_query_for_retrieval(
            query=q_clean,
            history=history,
            student_context=student_context,
            gemini_client=gemini_client
        )
    else:
        rewritten_query = q_clean

    # Determine student cohort details
    dept_hint = ""
    sem_hint = 0
    if student_context:
        raw_dept = student_context.get("department_code") or student_context.get("department") or ""
        if "CS" in raw_dept.upper():
            dept_hint = "CSE"
        elif "IT" in raw_dept.upper():
            dept_hint = "IT"
        elif "EC" in raw_dept.upper():
            dept_hint = "ECE"
        elif "EE" in raw_dept.upper():
            dept_hint = "EE"
        elif "ME" in raw_dept.upper():
            dept_hint = "ME"
        elif "CE" in raw_dept.upper():
            dept_hint = "CE"
        sem_hint = int(student_context.get("semester") or 0)

    # 3. Intent-Scoped ChromaDB Search Query Formulation
    search_query = rewritten_query
    q_lower = rewritten_query.lower()

    if intent == QueryIntent.EXAMINATION_QUERY:
        if "practical" in q_lower or "viva" in q_lower:
            search_query = f"practical examination timetable schedule {dept_hint} sem {sem_hint}".strip()
        elif "mid" in q_lower:
            search_query = f"mid term examination schedule {dept_hint} sem {sem_hint}".strip()
        else:
            search_query = f"examination schedule timetable {dept_hint} sem {sem_hint} {rewritten_query}".strip()
    elif intent == QueryIntent.SYLLABUS_QUERY:
        search_query = f"syllabus course structure {dept_hint} semester {sem_hint} {rewritten_query}".strip()
    elif intent == QueryIntent.ACADEMIC_CALENDAR_QUERY:
        search_query = "BTU academic calendar commencement of classes working days"

    # Fetch candidate pool (max 8)
    raw_chunks = retrieve_relevant_chunks(
        query=search_query,
        n_results=8,
        student_context=student_context
    )

    # Fallback to literal query if intent-crafted query returned nothing
    if not raw_chunks and search_query != q_clean:
        raw_chunks = retrieve_relevant_chunks(
            query=q_clean,
            n_results=8,
            student_context=student_context
        )

    # 4. Hybrid Scoring & Parent Document Deduplication
    scored_chunks: List[Dict[str, Any]] = []
    seen_parents = set()

    for chunk in raw_chunks:
        title = chunk.get("title", "")
        text = chunk.get("chunk_text", "")
        parent_id = chunk.get("parent_doc_id") or title

        if parent_id in seen_parents:
            continue

        title_lower = title.lower()
        text_lower = text.lower()

        # Strict Relevance Guard: If user explicitly asked for specific domain terms (e.g. 'scuba', 'aerospace', 'mechatronics')
        # that are completely absent from this document, do NOT treat this document as a valid match.
        generic_words = {
            "what", "when", "where", "which", "exam", "examination", "date", "dates",
            "schedule", "about", "tell", "show", "please", "there", "exist", "exists",
            "info", "information", "detail", "details", "semester", "session", "course",
            "college", "university", "student", "registration", "notice", "circular",
            "circulars", "notices", "form", "fees", "paper", "test", "tests", "latest",
            "recent", "upcoming", "current", "next", "available", "first", "second",
            "third", "final", "last", "give", "find", "check", "official", "related",
            "relevant", "needed", "need", "have", "want", "some", "time", "table",
            "timetable", "share", "send", "view", "open", "read", "copy", "main", "back",
            "engineering", "engineer", "engineers", "btech", "batch", "branch", "subject",
            "academic", "academics", "class", "classes", "section", "sections", "degree"
        }
        specific_terms = [
            w.lower() for w in re.findall(r'\b[A-Za-z]{4,}\b', q_clean)
            if w.lower() not in generic_words
        ]
        if specific_terms and not any(term in title_lower or term in text_lower for term in specific_terms):
            continue

        kw_score = _calculate_keyword_overlap_score(f"{q_clean} {search_query}", title, text)
        
        # Intent & Subject relevance alignment bonus / penalty
        intent_bonus = 0.0
        doc_type = chunk.get("document_type", "")
        title_lower = title.lower()
        text_lower = text.lower()

        if intent == QueryIntent.EXAMINATION_QUERY:
            if doc_type in ["TIMETABLE", "EXAMINATION_SCHEDULE", "NOTICE"]:
                intent_bonus += 0.15

            if "practical" in q_lower:
                if "practical" in title_lower or "viva" in title_lower or "lab" in title_lower:
                    intent_bonus += 0.70  # Massive boost for practical notices
                elif "practical" not in text_lower:
                    intent_bonus -= 0.40  # Penalize non-practical exam notices when practical requested
            elif "mid" in q_lower:
                if "mid" in title_lower or "mid-term" in title_lower:
                    intent_bonus += 0.60
                elif "practical" in title_lower:
                    intent_bonus -= 0.40
        elif intent == QueryIntent.SYLLABUS_QUERY:
            if doc_type == "SYLLABUS" or "syllabus" in title_lower:
                intent_bonus += 0.75
            else:
                intent_bonus -= 0.30
        elif intent == QueryIntent.ACADEMIC_CALENDAR_QUERY:
            if doc_type == "CALENDAR" or "calendar" in title_lower:
                intent_bonus += 0.75
        elif intent == QueryIntent.NOTICE_QUERY:
            if "library" in q_lower and "library" in title_lower:
                intent_bonus += 0.80
            elif "fest" in q_lower or "technotsav" in q_lower:
                if "technotsav" in title_lower or "fest" in title_lower:
                    intent_bonus += 0.80

        dist = chunk.get("distance")
        vector_sim = max(0.0, 1.0 - (dist if dist is not None else 0.5))
        total_score = vector_sim + (kw_score * 0.40) + intent_bonus
        chunk["rerank_score"] = total_score
        scored_chunks.append(chunk)
        seen_parents.add(parent_id)

    # Sort descending by hybrid relevance score
    scored_chunks.sort(key=lambda x: x.get("rerank_score", 0), reverse=True)

    # Trim to top 2-3 most relevant chunks to optimize prompt size & Gemini latency
    max_chunks = 2 if intent in [QueryIntent.EXAMINATION_QUERY, QueryIntent.ACADEMIC_CALENDAR_QUERY] else 3
    final_chunks = scored_chunks[:max_chunks]

    # 5. Smart PDF Reference Handling: Single Primary Authoritative Source
    # "PDFs should support answers, not replace them. Include only the most relevant source document."
    sources: List[Dict[str, Any]] = []
    if final_chunks:
        top_chunk = final_chunks[0]
        # Only attach source if it meets relevance threshold
        if top_chunk.get("rerank_score", 0) >= 0.45:
            url = top_chunk.get("document_url") or top_chunk.get("source_url") or ""
            title = top_chunk.get("title") or "Official College Notice"
            page_num = top_chunk.get("page_number", 1)
            sources.append({
                "title": title,
                "url": url,
                "page": page_num,
                "published_date": top_chunk.get("published_date") or "",
                "scope": top_chunk.get("scope") or "GLOBAL",
                "department": top_chunk.get("department_code") or "All",
                "data_origin": top_chunk.get("data_origin") or "VERIFIED_OFFICIAL",
                "verification_status": top_chunk.get("verification_status") or "VERIFIED"
            })

            # If there's a strong second distinct document with high score, allow at most 2
            if len(final_chunks) > 1 and final_chunks[1].get("rerank_score", 0) >= 0.85:
                second = final_chunks[1]
                s_url = second.get("document_url") or second.get("source_url") or ""
                s_title = second.get("title") or "Official College Notice"
                if s_title != title and s_url != url:
                    sources.append({
                        "title": s_title,
                        "url": s_url,
                        "page": second.get("page_number", 1),
                        "published_date": second.get("published_date") or "",
                        "scope": second.get("scope") or "GLOBAL",
                        "department": second.get("department_code") or "All",
                        "data_origin": second.get("data_origin") or "VERIFIED_OFFICIAL",
                        "verification_status": second.get("verification_status") or "VERIFIED"
                    })

    # 6. Format Verified Context for Gemini Generation
    if final_chunks and any(c.get("rerank_score", 0) >= 0.40 for c in final_chunks):
        context_blocks = []
        for idx, chunk in enumerate(final_chunks, 1):
            page_info = f" | Page: {chunk.get('page_number', 1)}" if chunk.get('page_number') else ""
            block = (
                f"[Document {idx}]: {chunk['title']}\n"
                f"Type: {chunk.get('document_type', 'NOTICE')}{page_info} | Date: {chunk.get('published_date') or 'Official Notice'}\n"
                f"Source Link: {chunk.get('document_url') or chunk.get('source_url') or 'https://www.ecajmer.ac.in'}\n"
                f"Content:\n{chunk['chunk_text']}"
            )
            context_blocks.append(block)
        context_text = "\n\n".join(context_blocks)
        has_verified_context = True
    else:
        context_text = "NO_MATCHING_OFFICIAL_DOCUMENTS_FOUND"
        has_verified_context = False
        sources = []  # No verified sources when no verified document matched

    return {
        "rewritten_query": rewritten_query,
        "chunks": final_chunks if has_verified_context else [],
        "context_text": context_text,
        "sources": sources,
        "has_verified_context": has_verified_context
    }
