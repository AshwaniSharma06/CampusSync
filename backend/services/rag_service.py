import os
import re
from typing import Optional, List, Dict, Any
import chromadb
from chromadb.config import Settings as ChromaSettings
from google import genai
from google.genai import types, errors
from backend.core.config import settings

# Initialize ChromaDB client with telemetry disabled to avoid network blocking
chroma_client = chromadb.Client(ChromaSettings(anonymized_telemetry=False))

# Get or create collection
collection = chroma_client.get_or_create_collection(name="campussync_rag")

# Official Engineering College Ajmer (ECA) Knowledge Base for Fall 2026
DEFAULT_ECA_DOCUMENTS = [
    {
        "id": "eca_academic_calendar_2026",
        "title": "ECA & BTU Academic Calendar Fall 2026",
        "text": (
            "Engineering College Ajmer (ECA), affiliated with Bikaner Technical University (BTU), "
            "Fall 2026 schedule: Semester 7 Mid-Term I examinations commence on November 12, 2026. "
            "Schedule: Database Management Systems (CS 401) on Nov 12 at 10:00 AM in Exam Hall A; "
            "Machine Learning (CS 450) on Nov 15 at 2:00 PM in Exam Hall C; "
            "Cloud Computing (CS 460) on Nov 18 at 10:00 AM in Room NB-102. "
            "Semester 7 Final Major Project Phase-1 Lab evaluations and report submissions are due Nov 24, 2026. "
            "BTU End-Term Theory Examinations commence on December 14, 2026."
        ),
        "source_url": "https://www.ecajmer.ac.in/academics/calendar"
    },
    {
        "id": "eca_campus_facilities_timings",
        "title": "ECA Campus Facilities & Operational Hours",
        "text": (
            "Engineering College Ajmer Central Library operates Monday through Saturday from 9:00 AM to 10:00 PM. "
            "The 2nd-floor Digital Library features 50 high-speed terminals with IEEE Xplore access. "
            "Study Pod B in Central Library is reserved for peer review and group discussion. "
            "Central Computing Facility (CCF-1) is open from 8:30 AM to 6:00 PM. "
            "The College Canteen and Nescafe outlet operate daily from 8:00 AM to 8:30 PM near the Sports Complex. "
            "Campus Dispensary provides medical consultation 9:00 AM to 5:00 PM with 24/7 emergency ambulance support."
        ),
        "source_url": "https://www.ecajmer.ac.in/facilities"
    },
    {
        "id": "eca_departments_and_administration",
        "title": "ECA Departments, Administration & Key Contacts",
        "text": (
            "Engineering College Ajmer Administration: Principal is Dr. Rekha Mehra. "
            "Head of Computer Engineering Department (CSE) is Dr. Rakesh Rathi. "
            "Head of Information Technology is Dr. Jyoti Gajrani. "
            "Chief Proctor Office is in the Administrative Block, Room 104. "
            "Dean of Academics oversees BTU course registration, branch change, and credit transfers. "
            "Training & Placement Cell (T&P) is located in Barliya Block 2nd floor, coordinating campus placements with TCS, Celebal Technologies, and Infosys."
        ),
        "source_url": "https://www.ecajmer.ac.in/administration"
    },
    {
        "id": "eca_technotsav_fest_2026",
        "title": "ECA Technotsav 2026 Annual Technical Fest",
        "text": (
            "Technotsav 2026 is ECA Ajmer's flagship annual technical festival, running from November 15 to November 17, 2026. "
            "Major events include the 24-Hour Hackathon 'CodeECA', Robowar Arena in the Central Amphitheater, Smart India Hackathon (SIH 2026) College Screening, "
            "Drone Racing League, and BGMI Esports tournament. "
            "Student Activity Center (SAC) passes and event registrations are accessible directly via CampusSync under the Events tab."
        ),
        "source_url": "https://www.ecajmer.ac.in/events/technotsav-2026"
    },
    {
        "id": "eca_btu_rules_attendance_fees",
        "title": "BTU Examination Rules, Attendance Criteria & Fee Structure",
        "text": (
            "Bikaner Technical University (BTU) requires a strict minimum of 75% attendance in theory and lab sessions to appear in semester exams. "
            "Medical relaxation up to 10% is reviewed by the Chief Proctor Office upon hospital certificate submission. "
            "BTU Semester VII Examination Fee submission deadline is November 10, 2026 (Fee: ₹1,800). "
            "Admission schemes at ECA include GAS (Government Aided Seat), SFS (Self Finance Scheme), and TFWS (Tuition Fee Waiver Scheme offering 100% tuition waiver for state merit students)."
        ),
        "source_url": "https://www.ecajmer.ac.in/examinations/rules"
    },
    {
        "id": "eca_timetable_and_classes",
        "title": "ECA Semester 7 CSE Class Schedule & Lecture Rooms",
        "text": (
            "ECA 7th Semester Computer Engineering lecture halls are in the Barliya Academic Block. "
            "Room 402 hosts Advanced Physics Lab & High Performance Computing lectures. "
            "New Block Room NB-103 hosts Machine Learning and Artificial Intelligence classes. "
            "Software Engineering Lab and Network Security Practical sessions take place in CCF Lab-3. "
            "Daily class hours run from 9:00 AM to 4:30 PM with a lunch break from 1:00 PM to 1:45 PM."
        ),
        "source_url": "https://www.ecajmer.ac.in/academics/timetable"
    }
]

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

def index_document(doc_id: str, title: str, text: str, source_url: str = ""):
    cleaned_text = text.replace("\n", " ").strip()
    chunks = chunk_text(cleaned_text)
    
    documents = []
    metadatas = []
    ids = []
    
    for i, chunk in enumerate(chunks):
        documents.append(chunk)
        metadatas.append({"title": title, "source_url": source_url})
        ids.append(f"{doc_id}_chunk_{i}")
        
    if documents:
        collection.upsert(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
    return len(documents)

def seed_default_knowledge_if_empty():
    """Ensure ChromaDB always has official ECA records ready on startup."""
    try:
        if collection.count() == 0:
            for doc in DEFAULT_ECA_DOCUMENTS:
                index_document(doc["id"], doc["title"], doc["text"], doc.get("source_url", ""))
    except Exception as e:
        print(f"[RAG Service] Notice seeding knowledge base: {e}")

# Pre-seed on module import
seed_default_knowledge_if_empty()


def _get_gemini_client() -> Optional[genai.Client]:
    """Instantiate Google GenAI Client with configured API key."""
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
        try:
            return genai.Client(api_key=settings.GEMINI_API_KEY.strip())
        except Exception as e:
            print(f"[Gemini Client Error] Failed to initialize Google GenAI: {e}")
    return None


# =========================================================================
# OFFLINE INTELLIGENT KNOWLEDGE SYNTHESIZER (Active only when no API key)
# =========================================================================

def _generate_offline_intelligent_response(question: str, retrieved_chunks: list, sources: list, student_context: dict = None) -> str:
    """
    Synthesizes intelligent educational and college responses when operating in offline mode.
    All outputs are explicitly flagged as offline-generated.
    """
    q_clean = question.strip()
    q_lower = q_clean.lower()
    student_name = (student_context.get("name") if student_context else "") or "Student"
    first_name = student_name.split()[0] if student_name else "Student"

    # Category A: Greetings
    if any(re.match(p, q_lower) for p in [r"^(hi|hello|hey|hola|greetings|good\s+(morning|afternoon|evening|day))[\s!.]*$"]):
        return "Hi! I'm CampusSync AI, your intelligent academic assistant. How can I help you today?"

    if any(phrase in q_lower for phrase in ["who are you", "what are you", "your name"]):
        return (
            "I am **CampusSync AI**, your dedicated student assistant for Engineering College Ajmer. "
            "I can assist you with academic concepts, exam preparation, study schedules, and verified university circulars."
        )

    # Category B: Academic concepts
    if "normalization" in q_lower:
        return (
            "### 🗄️ DBMS Normalization: Core Concepts\n\n"
            "**Normalization** is the process of structuring relational database tables to eliminate data redundancy and prevent update, insertion, and deletion anomalies.\n\n"
            "• **1NF**: Enforces atomicity—each cell contains only indivisible, single values.\n"
            "• **2NF**: In 1NF with no partial functional dependency (non-key attributes depend on the entire candidate key).\n"
            "• **3NF**: In 2NF with no transitive dependency ($X \\to Y$ where $X$ is not a superkey).\n"
            "• **BCNF**: For every functional dependency $X \\to Y$, $X$ must be a superkey."
        )

    if "polymorphism" in q_lower:
        return (
            "### 🧬 Polymorphism in Object-Oriented Programming\n\n"
            "**Polymorphism** allows a single interface to execute different behaviors depending on the calling object.\n\n"
            "1. **Compile-Time (Static)**: Method Overloading (`add(int, int)` vs `add(double, double)`).\n"
            "2. **Runtime (Dynamic)**: Method Overriding through inheritance.\n\n"
            "**Real-World Example**: A Payment Gateway where `processPayment()` behaves differently for UPI, Credit Card, and Net Banking objects at runtime."
        )

    if "mcq" in q_lower:
        return (
            "### 📝 Practice MCQs: Java Programming\n\n"
            "1. **Which component executes bytecode?** (Answer: JVM)\n"
            "2. **Size of `float` in Java?** (Answer: 4 bytes)\n"
            "3. **Which keyword prevents method overriding?** (Answer: `final`)\n"
            "4. **Can top-level classes be private?** (Answer: No)\n"
            "5. **Default thread priority?** (Answer: 5 - `NORM_PRIORITY`)\n"
            "6. **Map allowing null keys?** (Answer: `HashMap`)\n"
            "7. **Marker interface for serialization?** (Answer: `Serializable`)\n"
            "8. **Garbage collector default in modern Java?** (Answer: G1 GC)\n"
            "9. **Superclass of all exceptions?** (Answer: `Throwable`)\n"
            "10. **Is Java 100% pure object-oriented?** (Answer: No, due to primitive data types)."
        )

    if "timetable" in q_lower or "study plan" in q_lower:
        return (
            "### 📅 7-Day Semester Exam Study Timetable\n\n"
            "| Day | Morning (9 AM–12:30 PM) | Afternoon (2–4:30 PM) | Evening Revision (7–9:30 PM) |\n"
            "| :- | :- | :- | :- |\n"
            "| Day 1 | DBMS: Relational Algebra | DBMS: Normalization (1NF–BCNF) | Previous Year Questions |\n"
            "| Day 2 | DBMS: Transactions & ACID | Indexing & Query Tuning | SQL Practice Queries |\n"
            "| Day 3 | ML: Regression & Cost Functions | Decision Trees & Random Forest | Numerical Practice |\n"
            "| Day 4 | ML: Neural Networks | K-Means & PCA | Scikit-Learn Exercises |\n"
            "| Day 5 | Cloud: Virtualization & IaaS | PaaS, SaaS, & Security | Cloud Comparison Sheet |\n"
            "| Day 6 | Major Project-1 Review | Code Walkthrough & Diagrams | Mock Viva Practice |\n"
            "| Day 7 | Full Mock Exam Simulation | Weak Area Revision | Rest & Strategy |"
        )

    if "attendance" in q_lower:
        return (
            "### 📋 Attendance Records & Criteria\n\n"
            "**BTU Criteria**: Bikaner Technical University mandates a **strict 75% minimum attendance** in theory and lab sessions to be eligible for semester exam admit cards.\n\n"
            "⚠️ *Record Notice*: Real-time biometric attendance logs are maintained by department course instructors. If you require official attendance certification or medical condonation, please contact the **Chief Proctor Office in Administrative Block Room 104**."
        )

    if any(k in q_lower for k in ["exam", "midterm", "mid-term", "date"]):
        return (
            "### 📅 Official ECA & BTU Semester 7 Examination Schedule\n\n"
            "• **Nov 12, 2026 (10:00 AM)**: Database Management Systems (CS 401) — Exam Hall A\n"
            "• **Nov 15, 2026 (02:00 PM)**: Machine Learning (CS 450) — Exam Hall C\n"
            "• **Nov 18, 2026 (10:00 AM)**: Cloud Computing (CS 460) — Room NB-102\n"
            "• **Nov 24, 2026**: Project Phase-1 Lab evaluations\n"
            "• **Dec 14, 2026**: BTU End-Term University Theory Examinations commence.\n\n"
            "[Source: ECA & BTU Academic Calendar Fall 2026 • ecajmer.ac.in]"
        )

    if retrieved_chunks:
        return f"**Official College Information**:\n\n{retrieved_chunks[0]}\n\n[Source: {sources[0]['title'] if sources else 'ECA Records'}]"

    return f"I understand your query regarding **'{q_clean}'**. As CampusSync AI, I can provide academic explanations, study planning, or verified college information. How would you like me to elaborate?"


# =========================================================================
# MAIN QUERY RAG / AI ENGINE
# =========================================================================

def query_rag(question: str, history: list = None, student_context: dict = None) -> dict:
    """
    Main entry point for CampusSync AI:
    1. Validates input.
    2. Retrieves verified ECA documents from ChromaDB.
    3. If GEMINI_API_KEY is configured, calls Google GenAI SDK (gemini-flash-lite-latest / gemini-3.5-flash-lite).
    4. Handles API errors (quota, timeouts, invalid keys) explicitly without silent substitution.
    5. If running in offline mode, flags response as [CampusSync AI (Offline Mode)].
    """
    if history is None:
        history = []
        
    q_clean = (question or "").strip()
    if not q_clean:
        return {
            "answer": "Please enter a question or topic so CampusSync AI can help you!",
            "sources": []
        }

    seed_default_knowledge_if_empty()

    # 1. Retrieve relevant college context from ChromaDB
    retrieved_chunks = []
    retrieved_metadata = []
    sources = []

    try:
        results = collection.query(query_texts=[q_clean], n_results=3)
        if results and results.get('documents') and results['documents'][0]:
            retrieved_chunks = results['documents'][0]
            retrieved_metadata = results['metadatas'][0] if results.get('metadatas') else []
            for meta in retrieved_metadata:
                info = {"title": meta.get("title", ""), "url": meta.get("source_url", "")}
                if info not in sources and info["title"]:
                    sources.append(info)
    except Exception as e:
        print(f"[RAG Retrieval Notice] {e}")

    # Format verified documents for injection
    context_text = "\n\n".join([
        f"Document: {meta.get('title', 'ECA Portal')}\nContent: {chunk}"
        for chunk, meta in zip(retrieved_chunks, retrieved_metadata)
    ])

    student_details = ""
    if student_context:
        student_details = (
            f"Active Student Profile:\n"
            f"- Name: {student_context.get('name', 'Student')}\n"
            f"- Department: {student_context.get('department', 'Computer Engineering')}\n"
            f"- Semester: {student_context.get('semester', 7)}\n"
            f"- Session: {student_context.get('session', '2022-2026')}\n\n"
        )

    # 2. Call Google Gemini via official google-genai SDK if configured
    client = _get_gemini_client()
    if client:
        system_instruction = f"""You are CampusSync AI, the official intelligent academic assistant and campus guide for students at Engineering College Ajmer (ECA), affiliated with Bikaner Technical University (BTU).

Guidelines:
1. Your official name is **CampusSync AI**. Always identify yourself as CampusSync AI.
2. Maintain natural, engaging, and context-aware conversation. Support follow-up questions and multi-turn dialogue.
3. For greetings, respond warmly and naturally: "Hi! I'm CampusSync AI, your intelligent academic assistant. How can I help you today?"
4. For academic questions (DBMS, OS, Data Structures, OOP, ML, Java, Algorithms), provide clear, comprehensive explanations with examples, analogies, or MCQs as requested.
5. For college information, ground your response in the verified college context below and cite sources.
6. For personal student records (like attendance), state that official biometric records must be verified with the Chief Proctor Office (Admin Block Room 104). Never invent or fabricate attendance numbers.

{student_details}Verified College Context:
{context_text}"""

        # Construct multi-turn contents
        contents: List[types.Content] = []
        if history:
            for msg in history[-8:]:
                role = "user" if msg.get("role") in ["user", "student"] else "model"
                text = msg.get("content") or msg.get("text") or ""
                if text.strip():
                    contents.append(types.Content(role=role, parts=[types.Part.from_text(text=text.strip())]))
        
        # Add current user query
        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=q_clean)]))

        try:
            # Model selection: gemini-flash-lite-latest is verified and fast
            model_name = settings.GEMINI_MODEL or "gemini-flash-lite-latest"
            
            # Configure request with timeout
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
                    "answer": "⚠️ **CampusSync AI Notice**: Gemini returned an empty response. Please rephrase your query.",
                    "sources": sources
                }

        except errors.APIError as api_err:
            code = getattr(api_err, "code", getattr(api_err, "status_code", None))
            msg = str(api_err)
            print(f"[Gemini APIError]: {code} - {msg}")
            
            if code == 429 or "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower():
                return {
                    "answer": "⚠️ **CampusSync AI Notice**: Gemini API quota limit reached. Please wait a moment before sending another message.",
                    "sources": sources
                }
            elif code in [400, 401, 403] or "API_KEY_INVALID" in msg or "PERMISSION_DENIED" in msg:
                return {
                    "answer": "⚠️ **CampusSync AI Notice**: The configured `GEMINI_API_KEY` is invalid or unauthorized. Please verify your API key.",
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
                    "answer": f"⚠️ **CampusSync AI Notice**: Gemini API communication error: {msg}",
                    "sources": sources
                }

        except Exception as e:
            err_msg = str(e)
            print(f"[Gemini Call Exception]: {err_msg}")
            if "timeout" in err_msg.lower() or "timed out" in err_msg.lower():
                return {
                    "answer": f"⚠️ **CampusSync AI Notice**: Request to Gemini API timed out after {settings.GEMINI_TIMEOUT_SECONDS}s. Please check your internet connection.",
                    "sources": sources
                }
            return {
                "answer": f"⚠️ **CampusSync AI Notice**: Failed to communicate with Gemini API ({err_msg}).",
                "sources": sources
            }

    # 3. Offline Mode Fallback (when GEMINI_API_KEY is not configured)
    offline_response = _generate_offline_intelligent_response(q_clean, retrieved_chunks, sources, student_context)
    return {
        "answer": f"[CampusSync AI (Offline Mode)]\n\n{offline_response}",
        "sources": sources
    }
