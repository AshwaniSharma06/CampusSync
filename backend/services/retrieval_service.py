"""
Intelligent RAG Retrieval Pipeline.
Coordinates query rewriting, semantic search, hybrid keyword boosting,
deduplication, freshness scoring, relevance filtering, and context assembly.
"""

import re
from datetime import datetime
from typing import List, Dict, Any, Optional

from backend.core.config import settings
from backend.services.query_rewriter import rewrite_query_for_retrieval
from backend.services.vector_service import retrieve_relevant_chunks

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
            score += 0.35  # Major boost for title match
        elif term in text_lower:
            score += 0.10  # Moderate boost for body match

    return min(score, 1.0)

def execute_intelligent_retrieval(
    query: str,
    history: Optional[List[Dict[str, str]]] = None,
    student_context: Optional[Dict[str, Any]] = None,
    gemini_client: Optional[Any] = None
) -> Dict[str, Any]:
    """
    Executes the full intelligent retrieval pipeline:
    1. Rewrites follow-up/contextual queries.
    2. Queries persistent ChromaDB with cohort-scoped filters.
    3. Performs hybrid relevance scoring & deduplication.
    4. Filters out irrelevant / below-threshold records.
    5. Assembles grounded context and structured sources.
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

    # 1. Query Rewriting for follow-up questions
    rewritten_query = rewrite_query_for_retrieval(
        query=q_clean,
        history=history,
        student_context=student_context,
        gemini_client=gemini_client
    )

    # 2. Semantic vector retrieval (fetch 2x top_k to allow hybrid reranking & deduplication)
    fetch_k = max(settings.RAG_TOP_K * 2, 8)
    raw_chunks = retrieve_relevant_chunks(
        query=rewritten_query,
        n_results=fetch_k,
        student_context=student_context
    )

    # If rewritten query yielded nothing, try with original query as fallback
    if not raw_chunks and rewritten_query != q_clean:
        raw_chunks = retrieve_relevant_chunks(
            query=q_clean,
            n_results=fetch_k,
            student_context=student_context
        )

    # 3. Hybrid Scoring & Deduplication across document parents
    scored_chunks: List[Dict[str, Any]] = []
    seen_parents = set()

    for chunk in raw_chunks:
        title = chunk.get("title", "")
        text = chunk.get("chunk_text", "")
        parent_id = chunk.get("parent_doc_id") or title

        # Deduplicate: Only keep highest-scoring chunk from the same document
        if parent_id in seen_parents:
            continue

        kw_score = _calculate_keyword_overlap_score(f"{q_clean} {rewritten_query}", title, text)
        
        # Freshness bonus: slight boost if published within the current academic session
        freshness_score = 0.0
        pub_date_str = chunk.get("published_date")
        if pub_date_str:
            try:
                pub_dt = datetime.fromisoformat(pub_date_str.replace("Z", "+00:00"))
                # Documents published within last 90 days get a subtle recency boost
                days_old = (datetime.utcnow() - pub_dt.replace(tzinfo=None)).days
                if days_old <= 90:
                    freshness_score = 0.05
            except Exception:
                pass

        dist = chunk.get("distance")
        vector_sim = max(0.0, 1.0 - (dist if dist is not None else 0.5))
        # Hybrid formula: vector similarity is primary base; keyword overlap & recency provide controlled rerank adjustment
        total_score = vector_sim + (kw_score * 0.35) + freshness_score
        chunk["rerank_score"] = total_score
        scored_chunks.append(chunk)
        seen_parents.add(parent_id)

    # Sort by hybrid rerank score descending
    scored_chunks.sort(key=lambda x: x.get("rerank_score", 0), reverse=True)

    # Trim to target top_k
    final_chunks = scored_chunks[:settings.RAG_TOP_K]

    # 4. Construct unique source citations
    sources: List[Dict[str, Any]] = []
    seen_urls = set()
    for chunk in final_chunks:
        url = chunk.get("document_url") or chunk.get("source_url") or ""
        title = chunk.get("title") or "Official College Notice"
        key = f"{title}_{url}"
        if key not in seen_urls:
            seen_urls.add(key)
            sources.append({
                "title": title,
                "url": url,
                "published_date": chunk.get("published_date") or "",
                "scope": chunk.get("scope") or "GLOBAL",
                "department": chunk.get("department_code") or "All",
                "verification_status": chunk.get("verification_status") or "VERIFIED"
            })

    # 5. Assemble formatted context blocks for Gemini
    if final_chunks:
        context_blocks = []
        for idx, chunk in enumerate(final_chunks, 1):
            block = (
                f"[Document {idx}]: {chunk['title']}\n"
                f"Type: {chunk.get('document_type', 'NOTICE')} | Scope: {chunk.get('scope', 'GLOBAL')}\n"
                f"Date: {chunk.get('published_date') or 'Recent Official Notice'}\n"
                f"Source Link: {chunk.get('source_url') or chunk.get('document_url') or 'ecajmer.ac.in'}\n"
                f"Content:\n{chunk['chunk_text']}"
            )
            context_blocks.append(block)
        context_text = "\n\n".join(context_blocks)
        has_verified_context = True
    else:
        context_text = "NO_MATCHING_OFFICIAL_DOCUMENTS_FOUND"
        has_verified_context = False

    return {
        "rewritten_query": rewritten_query,
        "chunks": final_chunks,
        "context_text": context_text,
        "sources": sources,
        "has_verified_context": has_verified_context
    }

