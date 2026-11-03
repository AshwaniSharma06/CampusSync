"""
Query Understanding & Conversational Query Rewriting Service.
Transforms ambiguous or context-dependent follow-up questions
into standalone semantic retrieval queries.
"""

import re
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types

from backend.core.config import settings

# Common deictic markers and follow-up indicators
FOLLOW_UP_INDICATORS = [
    r"\b(it|that|this|these|those|them)\b",
    r"\b(what about|how about|and for|tell me more|why so)\b",
    r"\b(the practicals?|the deadline|the fees?|the date|the venue|the room)\b",
    r"\b(when is (it|that)|where is (it|that)|who is (it|that))\b",
    r"\b(syllabus|eligibility|rules|timing|schedule)\b"
]

def _is_follow_up_query(query: str, history: List[Dict[str, str]]) -> bool:
    """Detects whether a student query depends on previous conversation turns."""
    if not history:
        return False

    q_lower = query.lower().strip()
    words = q_lower.split()

    # Very short queries in a conversation are almost always follow-ups
    if len(words) <= 5:
        return True

    for pattern in FOLLOW_UP_INDICATORS:
        if re.search(pattern, q_lower):
            return True

    return False

def _heuristic_rewrite(query: str, history: List[Dict[str, str]], student_context: Optional[Dict[str, Any]] = None) -> str:
    """
    Fallback deterministic query synthesis when LLM rewriter is offline or slow.
    Combines context keywords with the follow-up query.
    """
    recent_context = []
    # Collect key nouns from the last 2 messages
    for msg in history[-2:]:
        text = msg.get("content") or msg.get("text") or ""
        # Remove common conversational greetings
        clean = re.sub(r'^(hi|hello|hey|good morning|thanks|thank you)\b', '', text, flags=re.I)
        # Extract prominent keywords/noun phrases (3+ char words)
        words = [w for w in re.findall(r'\b[A-Za-z0-9\-]{3,}\b', clean) if w.lower() not in {
            "what", "when", "where", "which", "who", "whom", "this", "that", "these", "those",
            "have", "from", "with", "about", "could", "would", "should", "your", "please"
        }]
        if words:
            recent_context.extend(words[:5])

    # Add student cohort context if not already mentioned
    cohort_hints = []
    if student_context:
        dept = student_context.get("department_code") or student_context.get("department")
        sem = student_context.get("semester")
        if dept and dept.lower() not in query.lower():
            cohort_hints.append(str(dept))
        if sem and f"sem" not in query.lower():
            cohort_hints.append(f"Semester {sem}")

    context_str = " ".join(dict.fromkeys(recent_context[:6]))
    hints_str = " ".join(cohort_hints)

    rewritten = f"{context_str} {hints_str} {query}".strip()
    return re.sub(r'\s+', ' ', rewritten)

def rewrite_query_for_retrieval(
    query: str,
    history: Optional[List[Dict[str, str]]] = None,
    student_context: Optional[Dict[str, Any]] = None,
    gemini_client: Optional[genai.Client] = None
) -> str:
    """
    Rewrites a student's conversational query into a standalone retrieval query.
    - If first turn: returns normalized query.
    - If follow-up: resolves references using conversation history.
    """
    q_clean = (query or "").strip()
    if not q_clean or not history:
        return q_clean

    if not _is_follow_up_query(q_clean, history):
        return q_clean

    # If Gemini client is provided and configured, use fast LLM rewriting
    if gemini_client:
        try:
            history_summary = []
            for msg in history[-4:]:
                role = "Student" if msg.get("role") in ["user", "student"] else "Assistant"
                text = (msg.get("content") or msg.get("text") or "").strip()
                if text:
                    history_summary.append(f"{role}: {text[:150]}")

            conv_text = "\n".join(history_summary)
            prompt = (
                "You are an academic query normalizer for a college document search system. "
                "Given the conversation history and a follow-up question, rewrite the follow-up "
                "question into a single, standalone search query that includes all implied subject, "
                "exam, semester, and college topic details. Output ONLY the rewritten query, nothing else.\n\n"
                f"Conversation:\n{conv_text}\n"
                f"Follow-up: {q_clean}\n\n"
                "Standalone Search Query:"
            )

            model_name = settings.GEMINI_MODEL or "gemini-flash-lite-latest"
            resp = gemini_client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    max_output_tokens=60,
                )
            )

            if resp and resp.text:
                rewritten = resp.text.strip().strip('"').strip("'")
                if len(rewritten) > 3 and not rewritten.lower().startswith("error"):
                    return rewritten
        except Exception as e:
            # Fall back to heuristic rewrite if Gemini times out or fails
            pass

    return _heuristic_rewrite(q_clean, history, student_context)
