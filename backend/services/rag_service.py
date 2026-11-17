"""
CampusSync AI RAG Service - Intelligent Agent Architecture.
Coordinates intent classification, sub-5ms response caching, scoped retrieval,
smart single-source attribution, and dynamic Gemini conversational generation.
"""

import re
from typing import Optional, List, Dict, Any
from google import genai
from google.genai import types, errors

from backend.core.config import settings
from backend.services.query_intent import classify_query_intent, QueryIntent
from backend.services.retrieval_service import execute_intelligent_retrieval
from backend.services.rag_cache import rag_cache

def _get_gemini_client() -> Optional[genai.Client]:
    """Instantiates Google GenAI Client with configured API key."""
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
        try:
            return genai.Client(api_key=settings.GEMINI_API_KEY.strip())
        except Exception as e:
            print(f"[Gemini Client Initialization Error]: {e}")
    return None

def _generate_general_knowledge_response(
    client: genai.Client,
    question: str
) -> str:
    """
    Answers general computer science, algorithms, and technical concepts using Gemini
    with a lightweight, fast prompt (< 100 tokens overhead). ZERO college documents attached.
    """
    system_instruction = (
        "You are CampusSync AI, an academic assistant for engineering students. "
        "Explain the requested computer science, programming, or engineering concept clearly, "
        "conversationally, and accurately. Use simple explanations, intuitive analogies, and concise "
        "code examples if helpful. Do not reference or invent college administrative circulars."
    )
    model_name = settings.GEMINI_MODEL or "gemini-flash-lite-latest"
    try:
        response = client.models.generate_content(
            model=model_name,
            contents=question,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.4,
                max_output_tokens=600,
            ),
        )
        if response and response.text:
            return response.text.strip()
    except Exception as e:
        print(f"[General Knowledge Gemini Error]: {e}")

    return (
        f"Here is a technical overview regarding **{question}**:\n\n"
        "This is a fundamental computer science concept. For in-depth study, refer to standard textbooks "
        "(such as Cormen et al. for algorithms or Silberschatz for operating systems)."
    )

def query_rag(
    question: str,
    history: Optional[List[Dict[str, str]]] = None,
    student_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Main entry point for CampusSync AI:
    1. Validates query.
    2. Checks in-memory response cache for sub-5ms repeated response.
    3. Identifies query intent (GREETING, CONVERSATION, ACADEMIC, EXAM, SYLLABUS, KNOWLEDGE).
    4. Bypasses document retrieval for greetings, casual chat, and general CS concepts.
    5. Executes targeted, cohort-filtered retrieval for college and academic questions.
    6. Calls Gemini with minimal prompt size for rapid, natural conversational answers.
    7. Returns clean answer, smart single-source citation, and rewritten query.
    """
    q_clean = (question or "").strip()
    if not q_clean:
        return {
            "answer": "Please enter an academic question or topic so CampusSync AI can help you!",
            "sources": [],
            "rewritten_query": ""
        }

    if history is None:
        history = []

    history_tail = history[-1].get("content") or history[-1].get("text") if history else None

    # 1. High-Performance Cache Lookup (< 2ms)
    cached = rag_cache.get(q_clean, student_context, history_tail)
    if cached:
        return cached

    # 2. Ultra-Fast Intent Recognition (< 0.2ms)
    intent = classify_query_intent(q_clean, history)

    # 3. Intent Handling: GREETING (Instant Response, Zero ChromaDB, Zero Gemini API Call)
    if intent == QueryIntent.GREETING:
        student_name = student_context.get("name") if student_context else None
        name_str = f", {student_name.split()[0]}" if student_name else ""
        resp = {
            "answer": f"Hi{name_str}! How can I help you today? Feel free to ask about your BTU syllabus, examination timetables, practical schedules, or college circulars.",
            "sources": [],
            "rewritten_query": ""
        }
        rag_cache.set(q_clean, resp, student_context, history_tail)
        return resp

    # 4. Intent Handling: GENERAL_CONVERSATION
    if intent == QueryIntent.GENERAL_CONVERSATION:
        q_lower = q_clean.lower()
        if re.search(r"\b(how\s+are\s+you)\b", q_lower):
            answer = "I'm doing well! Ready to help you with your academic questions, examination schedules, or coursework. What would you like to explore today?"
        elif re.search(r"\b(who\s+are\s+you|what\s+is\s+your\s+name|what\s+can\s+you\s+do)\b", q_lower):
            answer = "I'm CampusSync AI, your academic assistant for Engineering College Ajmer (ECA) and Bikaner Technical University (BTU). I can help you with examination schedules, subject syllabus, official notices, academic calendars, and general engineering concepts."
        elif re.search(r"\b(thank\s*you|thanks|thx)\b", q_lower):
            answer = "You're very welcome! Let me know if you need any more details on your syllabus or circulars."
        elif re.search(r"\b(bye|goodbye|see\s+ya)\b", q_lower):
            answer = "Goodbye! Best of luck with your studies. Feel free to come back whenever you have questions."
        else:
            answer = "I'm here and ready to help! What academic topic or college announcement can I assist you with?"

        resp = {"answer": answer, "sources": [], "rewritten_query": ""}
        rag_cache.set(q_clean, resp, student_context, history_tail)
        return resp

    # 5. Intent Handling: OUT_OF_SCOPE_QUERY
    if intent == QueryIntent.OUT_OF_SCOPE_QUERY:
        resp = {
            "answer": (
                "I'm CampusSync AI, an academic and college information assistant for Engineering College Ajmer (ECA) "
                "affiliated with BTU. I can help with university notices, examinations, syllabus, academic calendars, "
                "and engineering coursework. This question is outside my academic scope."
            ),
            "sources": [],
            "rewritten_query": ""
        }
        rag_cache.set(q_clean, resp, student_context, history_tail)
        return resp

    # 6. Check for Gemini client
    client = _get_gemini_client()
    if not client:
        return {
            "answer": (
                "⚠️ **CampusSync AI Configuration Notice**: `GEMINI_API_KEY` is not configured in `backend/.env`. "
                "Please provide a valid Gemini API key to enable intelligent conversational responses."
            ),
            "sources": [],
            "rewritten_query": ""
        }

    # 7. Intent Handling: GENERAL_KNOWLEDGE (Programming, Data Structures, Algorithms)
    if intent == QueryIntent.GENERAL_KNOWLEDGE:
        answer = _generate_general_knowledge_response(client, q_clean)
        resp = {
            "answer": answer,
            "sources": [],  # Strictly zero college PDFs attached for general CS questions
            "rewritten_query": ""
        }
        rag_cache.set(q_clean, resp, student_context, history_tail)
        return resp

    # 8. College & Academic Queries: Execute Focused Retrieval
    retrieval_result = execute_intelligent_retrieval(
        query=q_clean,
        history=history,
        student_context=student_context,
        gemini_client=client,
        intent=intent
    )

    rewritten_query = retrieval_result["rewritten_query"]
    context_text = retrieval_result["context_text"]
    sources = retrieval_result["sources"]
    has_verified_context = retrieval_result["has_verified_context"]

    # 9. Anti-Hallucination Safe Fallback
    # If no verified document was found for an official college question, state it honestly
    if not has_verified_context or context_text == "NO_MATCHING_OFFICIAL_DOCUMENTS_FOUND":
        fallback_resp = {
            "answer": (
                "I couldn't find verified information about this in the available ECA/BTU documents. "
                "Please verify with the college administration or check the official portal at [ecajmer.ac.in](https://www.ecajmer.ac.in)."
            ),
            "sources": [],
            "rewritten_query": rewritten_query
        }
        rag_cache.set(q_clean, fallback_resp, student_context, history_tail)
        return fallback_resp

    # 10. Assemble Student Context & Concise System Instruction
    student_details = ""
    if student_context:
        student_details = (
            f"Student: {student_context.get('name', 'Student')} | "
            f"Dept: {student_context.get('department', 'Engineering')} | "
            f"Sem: {student_context.get('semester', 'Current')}\n"
        )

    system_instruction = f"""ROLE:
You are CampusSync AI, an intelligent, natural conversational academic assistant for Engineering College Ajmer (ECA) affiliated with Bikaner Technical University (BTU).

OBJECTIVES:
- Directly answer the student's question in a clear, friendly, and natural conversational manner.
- Ground your answer in the Verified College Context provided below.
- Explain the key details (dates, venues, subjects, credit structure, unit topics) clearly rather than just telling the student to look at the document.
- Never invent examination dates, timetables, or administrative rules. If a specific detail is not in the context, explicitly state that it is not yet announced.
- Keep the response direct, helpful, and concise.

{student_details}Verified College Context:
{context_text}"""

    # 11. Multi-turn conversation contents (send last 4 turns for context)
    contents: List[types.Content] = []
    if history:
        for msg in history[-4:]:
            role = "user" if msg.get("role") in ["user", "student"] else "model"
            text = (msg.get("content") or msg.get("text") or "").strip()
            if text:
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=text)]))

    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=q_clean)]))

    # 12. Call Gemini API with Optimized Tokens
    model_name = settings.GEMINI_MODEL or "gemini-flash-lite-latest"
    try:
        response = client.models.generate_content(
            model=model_name,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.3,
                max_output_tokens=700,
            ),
        )

        answer_text = response.text.strip() if response and response.text else (
            "I couldn't find verified information about this in the available ECA/BTU documents. "
            "Please check the official college portal at [ecajmer.ac.in](https://www.ecajmer.ac.in)."
        )

        final_resp = {
            "answer": answer_text,
            "sources": sources,
            "rewritten_query": rewritten_query
        }
        rag_cache.set(q_clean, final_resp, student_context, history_tail)
        return final_resp

    except errors.APIError as api_err:
        code = getattr(api_err, "code", getattr(api_err, "status_code", None))
        msg = str(api_err)
        print(f"[Gemini APIError] Code {code}: {msg}")

        # If Gemini is temporarily unavailable (503/429/timeout), gracefully synthesize from verified chunks
        if retrieved_chunks:
            top_c = retrieved_chunks[0]
            doc_title = top_c.get("title", "Official Notice")
            body_snippet = top_c.get("text", "").strip()
            # Clean up snippet
            lines = [l.strip() for l in body_snippet.splitlines() if l.strip()]
            preview = "\n\n".join(lines[:6])
            fallback_text = (
                f"Based on the official BTU/ECA documentation (**{doc_title}**):\n\n"
                f"{preview}\n\n"
                f"*(For complete details, please refer to the attached official source document).* "
            )
            return {
                "answer": fallback_text,
                "sources": sources,
                "rewritten_query": rewritten_query
            }

        if code == 429 or "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower():
            return {
                "answer": "⚠️ **CampusSync AI Notice**: Gemini API quota limit reached. Please wait a moment before sending another message.",
                "sources": sources,
                "rewritten_query": rewritten_query
            }
        return {
            "answer": f"⚠️ **CampusSync AI Notice**: Gemini service temporarily experiencing high traffic ({code or '503'}). Please retry shortly.",
            "sources": sources,
            "rewritten_query": rewritten_query
        }

    except Exception as e:
        err_msg = str(e)
        print(f"[Gemini Exception]: {err_msg}")
        return {
            "answer": f"⚠️ **CampusSync AI Notice**: Network or server error communicating with Gemini ({err_msg}).",
            "sources": sources,
            "rewritten_query": rewritten_query
        }
