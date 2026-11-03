"""
CampusSync AI RAG Service.
Integrates Intelligent Retrieval (query rewriting, hybrid keyword scoring, deduplication)
with Dynamic Generation via Google Gemini (official google-genai SDK).
Follows strict Grounding & Scope Policies. Zero hardcoded canned fallbacks.
"""

from typing import Optional, List, Dict, Any
from google import genai
from google.genai import types, errors

from backend.core.config import settings
from backend.services.retrieval_service import execute_intelligent_retrieval

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
    2. Performs conversational query rewriting for follow-ups.
    3. Retrieves grounded context from persistent ChromaDB with cohort filtering.
    4. Applies hybrid scoring, deduplication, and relevance thresholding.
    5. Calls Google Gemini dynamically with structured 6-case Answer Policies.
    6. Returns fresh answer, rewritten query, and source citations.
    """
    q_clean = (question or "").strip()
    if not q_clean:
        return {
            "answer": "Please enter a question or topic so CampusSync AI can help you!",
            "sources": [],
            "rewritten_query": ""
        }

    if history is None:
        history = []

    client = _get_gemini_client()

    # 1. Execute Intelligent Retrieval Pipeline (Rewriting + Hybrid Search + Deduplication)
    retrieval_result = execute_intelligent_retrieval(
        query=q_clean,
        history=history,
        student_context=student_context,
        gemini_client=client
    )

    rewritten_query = retrieval_result["rewritten_query"]
    context_text = retrieval_result["context_text"]
    sources = retrieval_result["sources"]
    has_verified_context = retrieval_result["has_verified_context"]

    # Assemble student profile context for personalization
    student_details = ""
    if student_context:
        student_details = (
            f"Active Student Profile:\n"
            f"- Name: {student_context.get('name', 'Student')}\n"
            f"- Department: {student_context.get('department', 'Engineering')}\n"
            f"- Semester: {student_context.get('semester', 'Current')}\n"
            f"- Session: {student_context.get('session', 'Academic Year')}\n\n"
        )

    # 2. Check for Gemini client
    if not client:
        return {
            "answer": (
                "⚠️ **CampusSync AI Configuration Notice**: `GEMINI_API_KEY` is not configured in `backend/.env`. "
                "Please provide a valid Gemini API key to enable intelligent conversational responses."
            ),
            "sources": sources,
            "rewritten_query": rewritten_query
        }

    # 3. Dynamic System Prompt adhering strictly to the 6 Answer Policies
    system_instruction = f"""ROLE:
You are CampusSync AI, an intelligent, conversational academic assistant for students at Engineering College Ajmer (ECA), affiliated with Bikaner Technical University (BTU).

PRIMARY PURPOSE:
Help students understand information collected from their official college and university circulars, academic calendars, examination schedules, timetables, and engineering subjects.

ANSWER POLICIES (STRICTLY ENFORCE):

CASE 1: RELEVANT QUESTION WITH SUFFICIENT EVIDENCE
- Generate a complete, natural-language answer based strictly on the retrieved information below.
- Always cite the document title, publication date, and source link when available.

CASE 2: RELEVANT QUESTION BUT INFORMATION NOT FOUND
- If the question asks about official college dates, notices, exam routines, results, or rules, but the Verified College Context has NO_MATCHING_OFFICIAL_DOCUMENTS_FOUND:
  Respond honestly:
  "I couldn't find verified information about this in the currently collected college and university documents. Please check the official website (ecajmer.ac.in) or contact the college administration."
- NEVER fabricate, invent, or guess examination dates, fees, circular numbers, or deadlines.

CASE 3: UNRELATED QUESTION (e.g. sports, movies, politics, recipes)
- Politely explain your scope:
  "I'm CampusSync AI, an academic and college information assistant for Engineering College Ajmer. I can help with university notices, examinations, academic information, placements, and college announcements. This question is outside my primary scope."

CASE 4: GENERAL ACADEMIC QUESTION (e.g., DBMS, Operating Systems, Java, Machine Learning, Data Structures)
- Provide comprehensive, clear, high-quality educational explanations, code examples, or practice MCQs.
- Clearly distinguish general educational guidance from official college administrative notices.

CASE 5: CONFLICTING DOCUMENTS
- If two retrieved documents contain conflicting dates or details:
  Explain the conflict clearly, cite both source documents, note their respective publication/revision dates, and do not silently pick an unsupported answer.

CASE 6: FOLLOW-UP QUESTION
- Seamlessly use previous conversation messages to understand references and generate a contextual response. Do not force the student to repeat context already provided.

PERSONAL STUDENT RECORDS:
- Biometric attendance and grade cards are maintained by course instructors and the Chief Proctor Office (Administrative Block Room 104). Never fabricate attendance percentages.

TONE:
Friendly, intelligent, professional, student-friendly, concise, and natural.

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
                "sources": sources,
                "rewritten_query": rewritten_query
            }
        else:
            return {
                "answer": "⚠️ **CampusSync AI Notice**: Gemini returned an empty response. Please try rephrasing your question.",
                "sources": sources,
                "rewritten_query": rewritten_query
            }

    except errors.APIError as api_err:
        code = getattr(api_err, "code", getattr(api_err, "status_code", None))
        msg = str(api_err)
        print(f"[Gemini APIError] Code {code}: {msg}")

        if code == 429 or "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower():
            return {
                "answer": "⚠️ **CampusSync AI Notice**: Gemini API quota limit reached. Please wait a moment before sending another message.",
                "sources": sources,
                "rewritten_query": rewritten_query
            }
        elif code in [400, 401, 403] or "API_KEY_INVALID" in msg or "PERMISSION_DENIED" in msg:
            return {
                "answer": "⚠️ **CampusSync AI Notice**: The configured `GEMINI_API_KEY` is invalid or unauthorized. Please verify your Gemini API key in `backend/.env`.",
                "sources": sources,
                "rewritten_query": rewritten_query
            }
        elif code == 503 or "UNAVAILABLE" in msg:
            return {
                "answer": "⚠️ **CampusSync AI Notice**: Google Gemini service is temporarily overloaded (503). Please retry shortly.",
                "sources": sources,
                "rewritten_query": rewritten_query
            }
        elif code == 404:
            return {
                "answer": f"⚠️ **CampusSync AI Notice**: Configured Gemini model `{model_name}` was not found.",
                "sources": sources,
                "rewritten_query": rewritten_query
            }
        else:
            return {
                "answer": f"⚠️ **CampusSync AI Notice**: Gemini API error ({code or 'API'}): {msg}",
                "sources": sources,
                "rewritten_query": rewritten_query
            }

    except Exception as e:
        err_msg = str(e)
        print(f"[Gemini Exception]: {err_msg}")
        if "timeout" in err_msg.lower() or "timed out" in err_msg.lower():
            return {
                "answer": f"⚠️ **CampusSync AI Notice**: Request to Gemini timed out after {settings.GEMINI_TIMEOUT_SECONDS}s. Please check your network connection.",
                "sources": sources,
                "rewritten_query": rewritten_query
            }
        return {
            "answer": f"⚠️ **CampusSync AI Notice**: Network or server error communicating with Gemini ({err_msg}).",
            "sources": sources,
            "rewritten_query": rewritten_query
        }
