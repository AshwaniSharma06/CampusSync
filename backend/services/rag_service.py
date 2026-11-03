"""
CampusSync AI RAG Service.
Coordinates semantic retrieval from persistent ChromaDB and dynamic generation
via Google Gemini (google-genai SDK).
All responses are dynamically generated. Zero hardcoded question-answer fallbacks.
"""

from typing import Optional, List, Dict, Any
from google import genai
from google.genai import types, errors

from backend.core.config import settings
from backend.services.vector_service import retrieve_relevant_chunks

def _get_gemini_client() -> Optional[genai.Client]:
    """Instantiates Google GenAI Client with configured API key."""
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
        try:
            return genai.Client(api_key=settings.GEMINI_API_KEY.strip())
        except Exception as e:
            print(f"[Gemini Client Initialization Error]: {e}")
    return None

def query_rag(
    question: str,
    history: Optional[List[Dict[str, str]]] = None,
    student_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Main entry point for CampusSync AI:
    1. Validates input query.
    2. Performs semantic retrieval from persistent ChromaDB with student cohort scoping.
    3. Builds a grounded prompt with retrieved verified context.
    4. Calls Google Gemini dynamically.
    5. Returns dynamic answer and grounded source references.
    """
    q_clean = (question or "").strip()
    if not q_clean:
        return {
            "answer": "Please enter a question or topic so CampusSync AI can help you!",
            "sources": []
        }

    if history is None:
        history = []

    # 1. Retrieve verified documents from persistent ChromaDB
    retrieved_records = retrieve_relevant_chunks(
        query=q_clean,
        n_results=5,
        student_context=student_context
    )

    # Build unique source citations
    sources: List[Dict[str, Any]] = []
    seen_urls = set()
    for rec in retrieved_records:
        url = rec.get("document_url") or rec.get("source_url") or ""
        title = rec.get("title") or "Official College Notice"
        key = f"{title}_{url}"
        if key not in seen_urls:
            seen_urls.add(key)
            sources.append({
                "title": title,
                "url": url,
                "published_date": rec.get("published_date") or "",
                "scope": rec.get("scope") or "GLOBAL",
                "verification_status": rec.get("verification_status") or "VERIFIED"
            })

    # Assemble verified document context
    context_blocks = []
    for rec in retrieved_records:
        block = (
            f"--- Document: {rec['title']} ---\n"
            f"Type: {rec['document_type']} | Scope: {rec['scope']} | Date: {rec['published_date'] or 'Recent'}\n"
            f"Source URL: {rec['source_url'] or rec['document_url'] or 'Official ECA Circular'}\n"
            f"Content:\n{rec['chunk_text']}"
        )
        context_blocks.append(block)

    context_text = "\n\n".join(context_blocks) if context_blocks else "NO_MATCHING_OFFICIAL_DOCUMENTS_FOUND"

    # Assemble student profile context
    student_details = ""
    if student_context:
        student_details = (
            f"Authenticated Student Profile:\n"
            f"- Name: {student_context.get('name', 'Student')}\n"
            f"- Department: {student_context.get('department', 'Engineering')}\n"
            f"- Semester: {student_context.get('semester', 'Current')}\n"
            f"- Session: {student_context.get('session', 'Academic Year')}\n\n"
        )

    # 2. Check for Gemini client
    client = _get_gemini_client()
    if not client:
        return {
            "answer": (
                "⚠️ **CampusSync AI Configuration Notice**: `GEMINI_API_KEY` is not configured or could not be loaded. "
                "Please configure a valid Gemini API key in `backend/.env` to enable intelligent conversational responses."
            ),
            "sources": sources
        }

    # 3. Dynamic System Prompt
    system_instruction = f"""You are CampusSync AI, the intelligent, conversational academic assistant for students at Engineering College Ajmer (ECA), affiliated with Bikaner Technical University (BTU).

PRIMARY PURPOSE:
Help students understand academic subjects, official university notices, examination schedules, timetables, syllabus requirements, and campus information.

POLICIES:
1. Always identify yourself as CampusSync AI.
2. Ground all college-specific facts (dates, venues, circulars, fees, schedules) in the Verified College Context provided below.
3. If college-specific information is NOT found in the verified documents:
   - Honestly state: "I couldn't find verified official records regarding this in the currently collected college and university documents. Please check the official college website (ecajmer.ac.in) or contact the academic administration."
   - NEVER fabricate exam dates, fees, circular numbers, or deadlines.
4. For general academic and technical questions (e.g., DBMS normalization, Operating Systems, Java, Data Structures, Machine Learning):
   - Provide comprehensive, clear, high-quality educational explanations with code examples, analogies, or practice questions as requested.
   - Clearly distinguish general educational guidance from official college administrative notices.
5. For personal attendance records:
   - State that official biometric attendance records are maintained by course instructors and the Chief Proctor Office (Administrative Block Room 104). Never invent personal attendance percentages.
6. Support natural, friendly multi-turn conversation and context-aware follow-ups.

{student_details}Verified College Context:
{context_text}"""

    # 4. Construct multi-turn contents for Gemini
    contents: List[types.Content] = []
    if history:
        for msg in history[-8:]:
            role = "user" if msg.get("role") in ["user", "student"] else "model"
            text = (msg.get("content") or msg.get("text") or "").strip()
            if text:
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=text)]))

    # Add current question
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=q_clean)]))

    # 5. Call Gemini API
    model_name = settings.GEMINI_MODEL or "gemini-flash-lite-latest"
    try:
        response = client.models.generate_content(
            model=model_name,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
            ),
        )

        if response and response.text:
            return {
                "answer": response.text.strip(),
                "sources": sources
            }
        else:
            return {
                "answer": "⚠️ **CampusSync AI Notice**: Gemini returned an empty response. Please try rephrasing your question.",
                "sources": sources
            }

    except errors.APIError as api_err:
        code = getattr(api_err, "code", getattr(api_err, "status_code", None))
        msg = str(api_err)
        print(f"[Gemini APIError] Code {code}: {msg}")

        if code == 429 or "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower():
            return {
                "answer": "⚠️ **CampusSync AI Notice**: Gemini API quota limit reached. Please wait a moment before sending another message.",
                "sources": sources
            }
        elif code in [400, 401, 403] or "API_KEY_INVALID" in msg or "PERMISSION_DENIED" in msg:
            return {
                "answer": "⚠️ **CampusSync AI Notice**: The configured `GEMINI_API_KEY` is invalid or unauthorized. Please verify your Gemini API key in `backend/.env`.",
                "sources": sources
            }
        elif code == 503 or "UNAVAILABLE" in msg:
            return {
                "answer": "⚠️ **CampusSync AI Notice**: Google Gemini service is temporarily overloaded (503). Please retry shortly.",
                "sources": sources
            }
        elif code == 404:
            return {
                "answer": f"⚠️ **CampusSync AI Notice**: Configured Gemini model `{model_name}` was not found.",
                "sources": sources
            }
        else:
            return {
                "answer": f"⚠️ **CampusSync AI Notice**: Gemini API error ({code or 'API'}): {msg}",
                "sources": sources
            }

    except Exception as e:
        err_msg = str(e)
        print(f"[Gemini Exception]: {err_msg}")
        if "timeout" in err_msg.lower() or "timed out" in err_msg.lower():
            return {
                "answer": f"⚠️ **CampusSync AI Notice**: Request to Gemini timed out after {settings.GEMINI_TIMEOUT_SECONDS}s. Please check your network connection.",
                "sources": sources
            }
        return {
            "answer": f"⚠️ **CampusSync AI Notice**: Network or server error communicating with Gemini ({err_msg}).",
            "sources": sources
        }
