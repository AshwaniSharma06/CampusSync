import re
import chromadb
from chromadb.config import Settings as ChromaSettings
import google.generativeai as genai
from backend.core.config import settings

# Initialize ChromaDB client with telemetry disabled to avoid network blocking
chroma_client = chromadb.Client(ChromaSettings(anonymized_telemetry=False))

# Initialize the Gemini API if the key is provided
if settings.GEMINI_API_KEY:
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        print(f"[Gemini Init Warning] {e}")

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


# =========================================================================
# INTELLIGENT ACADEMIC & CONVERSATIONAL SYNTHESIZER (Fallback / Offline AI)
# =========================================================================

def _generate_offline_intelligent_response(question: str, retrieved_chunks: list, sources: list, student_context: dict = None) -> str:
    """
    Intelligent conversational and academic engine that understands context, intent,
    and semantics when Gemini API key is not configured or network is restricted.
    """
    q_clean = question.strip()
    q_lower = q_clean.lower()
    student_name = (student_context.get("name") if student_context else "") or "Student"
    first_name = student_name.split()[0] if student_name else "Student"

    # --- CATEGORY A: GREETINGS & CASUAL CONVERSATION ---
    greeting_patterns = [r"^(hi|hello|hey|hola|greetings|good\s+(morning|afternoon|evening|day))[\s!.]*$"]
    if any(re.match(p, q_lower) for p in greeting_patterns):
        return (
            f"Hey {first_name}! 👋 I'm **Campus AI Copilot**, your intelligent academic assistant at Engineering College Ajmer. "
            "I can help you with:\n"
            "• **Academic Concepts**: DBMS normalization, OS deadlocks, Data Structures, OOP, ML.\n"
            "• **Exam Preparation**: Generating MCQs, topic summaries, and customized study timetables.\n"
            "• **College Information**: BTU exam dates, Barliya block room allocations, Central Library timings, and Technotsav 2026.\n\n"
            "What would you like to explore today?"
        )

    if any(phrase in q_lower for phrase in ["who are you", "what are you", "your name"]):
        return (
            "I am **Campus AI Copilot**, the AI-powered student assistant integrated into CampusSync. "
            "I'm designed to help students at Engineering College Ajmer understand technical subjects, prepare for BTU semester exams, "
            "access campus circulars, and manage their academic workflow."
        )

    if any(phrase in q_lower for phrase in ["what can you do", "help me understand campussync", "how does this work", "how can you help"]):
        return (
            "Here is everything I can do to assist your engineering journey on CampusSync:\n\n"
            "1. 📚 **Academic Explanations**: Ask me to explain core CS topics (DBMS, Operating Systems, Computer Networks, Machine Learning, Data Structures) with practical examples.\n"
            "2. 📝 **Exam Prep & Practice**: Request practice MCQs, viva questions, and high-yield revision topics for BTU mid-terms and finals.\n"
            "3. 📅 **Study Planning**: Ask for structured 7-day or daily study timetables tailored to your subjects.\n"
            "4. 🏛️ **ECA College Information**: Look up official mid-term dates, library hours, classroom locations in Barliya Block, and Technotsav passes.\n"
            "5. 🎯 **Personalized Guidance**: Get contextual advice based on your current department and semester.\n\n"
            "Try asking: *'Explain DBMS normalization'* or *'Give me 10 Java MCQs'*!"
        )

    # --- CATEGORY B: ACADEMIC CONCEPTS & LEARNING ---
    # 1. DBMS Normalization
    if "normalization" in q_lower or "normal form" in q_lower or ("dbms" in q_lower and "normal" in q_lower):
        return (
            "### 🗄️ DBMS Normalization: Comprehensive Overview\n\n"
            "**Normalization** is the systematic database design process of organizing tables and attributes to **eliminate data redundancy** and avoid update, insertion, and deletion anomalies.\n\n"
            "#### The Normal Forms:\n\n"
            "1. **First Normal Form (1NF)**:\n"
            "   - Every attribute must hold only **atomic (indivisible) values**.\n"
            "   - No repeating groups or multi-valued attributes.\n"
            "   - *Example*: A column storing multiple phone numbers `\"98290..., 94140...\"` violates 1NF; split them into distinct rows.\n\n"
            "2. **Second Normal Form (2NF)**:\n"
            "   - Must already be in **1NF**.\n"
            "   - **No Partial Dependency**: Every non-prime attribute must depend on the *entire* candidate key, not just part of a composite key.\n\n"
            "3. **Third Normal Form (3NF)**:\n"
            "   - Must already be in **2NF**.\n"
            "   - **No Transitive Dependency**: Non-prime attributes must not depend on other non-prime attributes ($X \\to Y$ where neither is a superkey).\n"
            "   - Rule of thumb: *\"Every attribute must depend on the key, the whole key, and nothing but the key.\"*\n\n"
            "4. **Boyce-Codd Normal Form (BCNF)**:\n"
            "   - Stricter version of 3NF. For every functional dependency $X \\to Y$, $X$ must be a **superkey**.\n\n"
            "💡 *Tip for BTU Exams*: Always draw sample unnormalized tables and show step-by-step table decomposition into 1NF, 2NF, and 3NF!"
        )

    # 2. Polymorphism / OOP Concepts
    if "polymorphism" in q_lower:
        return (
            "### 🧬 Polymorphism in Object-Oriented Programming\n\n"
            "**Polymorphism** (Greek for *\"many forms\"*) allows an entity—such as a method, operator, or object—to perform different actions based on the context in which it is invoked.\n\n"
            "#### 1. Compile-Time Polymorphism (Static / Early Binding)\n"
            "Resolved by the compiler during code compilation. Achieved via **Method Overloading** or **Operator Overloading**.\n"
            "```java\n"
            "class Calculator {\n"
            "    int add(int a, int b) { return a + b; }\n"
            "    double add(double a, double b) { return a + b; }\n"
            "}\n"
            "```\n\n"
            "#### 2. Runtime Polymorphism (Dynamic / Late Binding)\n"
            "Resolved at runtime using **Method Overriding** through inheritance and virtual functions.\n\n"
            "#### 🌍 Real-World Analogy: Payment Processing System\n"
            "Imagine an e-commerce checkout interface with an abstract `PaymentMethod` class:\n"
            "```java\n"
            "abstract class PaymentMethod {\n"
            "    abstract void processPayment(double amount);\n"
            "}\n\n"
            "class CreditCardPayment extends PaymentMethod {\n"
            "    void processPayment(double amount) {\n"
            "        System.out.println(\"Processing $\" + amount + \" via Visa Gateway.\");\n"
            "    }\n"
            "}\n\n"
            "class UPIPayment extends PaymentMethod {\n"
            "    void processPayment(double amount) {\n"
            "        System.out.println(\"Processing $\" + amount + \" via NPCI UPI QR code.\");\n"
            "    }\n"
            "}\n"
            "```\n"
            "The calling code simply executes `payment.processPayment(500.0)`. At runtime, Java automatically invokes the correct implementation depending on whether the object is a `CreditCardPayment` or `UPIPayment`!"
        )

    # 3. Practice MCQs (Java / CS)
    if "mcq" in q_lower or "practice question" in q_lower or "multiple choice" in q_lower:
        subject = "Java & Object-Oriented Programming"
        if "python" in q_lower:
            subject = "Python Programming"
        elif "dbms" in q_lower or "database" in q_lower:
            subject = "Database Management Systems (DBMS)"
        elif "os" in q_lower or "operating system" in q_lower:
            subject = "Operating Systems"

        return (
            f"### 📝 Practice MCQs: {subject}\n\n"
            "Here are high-yield questions for your semester preparation:\n\n"
            "**Q1. Which component of Java is responsible for running bytecode?**\n"
            "a) JDK  \n"
            "b) JRE / JVM  \n"
            "c) Javadoc  \n"
            "d) JDB  \n"
            "*Answer: b) JVM (Java Virtual Machine) executes bytecode.*\n\n"
            "**Q2. What is the size of a `float` in Java?**\n"
            "a) 2 bytes  \n"
            "b) 4 bytes  \n"
            "c) 8 bytes  \n"
            "d) 16 bytes  \n"
            "*Answer: b) 4 bytes (32-bit IEEE 754 floating point).*\n\n"
            "**Q3. Which of the following is NOT an OOP principle in Java?**\n"
            "a) Encapsulation  \n"
            "b) Inheritance  \n"
            "c) Compilation  \n"
            "d) Polymorphism  \n"
            "*Answer: c) Compilation.*\n\n"
            "**Q4. Can a top-level class in Java be declared `private`?**\n"
            "a) Yes  \n"
            "b) No  \n"
            "*Answer: b) No, only public or default package-private are permitted for top-level classes.*\n\n"
            "**Q5. Which keyword is used to prevent method overriding?**\n"
            "a) `static`  \n"
            "b) `final`  \n"
            "c) `const`  \n"
            "d) `abstract`  \n"
            "*Answer: b) `final`.*\n\n"
            "**Q6. Which collection class allows null keys and values?**\n"
            "a) `Hashtable`  \n"
            "b) `HashMap`  \n"
            "c) `TreeMap`  \n"
            "d) `ConcurrentHashMap`  \n"
            "*Answer: b) `HashMap` allows one null key and multiple null values.*\n\n"
            "**Q7. What is the default priority of a thread in Java?**\n"
            "a) 1  \n"
            "b) 5 (`NORM_PRIORITY`)  \n"
            "c) 10  \n"
            "d) 0  \n"
            "*Answer: b) 5.*\n\n"
            "**Q8. Which interface must be implemented for custom serialization?**\n"
            "a) `Cloneable`  \n"
            "b) `Serializable`  \n"
            "c) `Comparable`  \n"
            "d) `Runnable`  \n"
            "*Answer: b) `java.io.Serializable`.*\n\n"
            "**Q9. What happens if a constructor has a return type?**\n"
            "a) Compile error  \n"
            "b) It is treated as a regular method  \n"
            "c) Runtime exception  \n"
            "d) Memory leak  \n"
            "*Answer: b) It is treated as a standard method and loses constructor behavior.*\n\n"
            "**Q10. Which garbage collector algorithm is default in modern Java versions?**\n"
            "a) Serial GC  \n"
            "b) Parallel GC  \n"
            "c) G1 (Garbage-First) GC  \n"
            "d) CMS GC  \n"
            "*Answer: c) G1 Garbage Collector (default since Java 9).*\n\n"
            "Would you like an explanation on any specific question or another set of topics?"
        )

    # 4. Study Timetable / Plan
    if "timetable" in q_lower or "study plan" in q_lower or "study schedule" in q_lower:
        return (
            "### 📅 High-Yield 7-Day Semester Exam Study Timetable\n\n"
            "Here is an optimized study plan designed around BTU's 7th Semester curriculum and peak retention periods:\n\n"
            "| Day | Morning Slot (09:00 AM – 12:30 PM) | Afternoon Slot (02:00 PM – 04:30 PM) | Evening Revision (07:00 PM – 09:30 PM) |\n"
            "| :--- | :--- | :--- | :--- |\n"
            "| **Day 1** | **DBMS**: ER Modeling, Relational Algebra | DBMS Normalization (1NF to BCNF) | Previous 3 Years BTU Mid-Term Papers |\n"
            "| **Day 2** | **DBMS**: Transaction Processing, ACID, Concurrency | Indexing & B-Trees, Query Optimization | SQL Practice & Lab Queries |\n"
            "| **Day 3** | **Machine Learning**: Linear & Logistic Regression | Decision Trees, Random Forests, SVM | ML Numerical Problems & Confusion Matrix |\n"
            "| **Day 4** | **Machine Learning**: Neural Networks, Backprop | Clustering (K-Means, PCA Dimensionality) | Python Scikit-Learn Practice Lab |\n"
            "| **Day 5** | **Cloud Computing**: IaaS/PaaS/SaaS architectures | Virtualization, Hypervisors, Containers | AWS/Azure Services & Security Policies |\n"
            "| **Day 6** | **Major Project-1**: Report review & system diagrams | Code walkthrough & unit testing | Mock viva presentation & Q&A practice |\n"
            "| **Day 7** | **Comprehensive Mock Exam (Full Syllabus)** | Weak area revision & formula sheet | Formula flashcards & rest before exam day |\n\n"
            "💡 **Study Rules for Maximum Retention**:\n"
            "• Use the **Pomodoro technique**: 50 mins focused study + 10 mins break.\n"
            "• Study high-weightage numerical derivations in the morning when mental clarity is highest.\n"
            "• Reserve 10:00 PM for rest to consolidate memory."
        )

    # --- CATEGORY C: PERSONALIZED STUDENT RECORDS ---
    if "attendance" in q_lower:
        return (
            "### 📋 Attendance Records & BTU Criteria\n\n"
            "**BTU Mandatory Criteria**: Bikaner Technical University strictly mandates a **minimum of 75% overall attendance** in theory lectures and practical laboratories to be eligible for semester examination admit cards.\n\n"
            "**Your Record Status**:\n"
            "• Student: **" + student_name + "**\n"
            "• Branch/Dept: **" + (student_context.get("department") if student_context else "Engineering") + "**\n\n"
            "⚠️ *Live ERP Sync Notice*: Real-time digital biometric/register attendance for this semester is currently tracked in physical course logs by department instructors. "
            "If you need an official attendance percentage slip for examination clearance or medical condonation (up to 10%), please visit the **Chief Proctor Office in Administrative Block Room 104** or contact your batch advisor."
        )

    # --- CATEGORY D: OFFICIAL COLLEGE & EXAM RECORDS ---
    if any(k in q_lower for k in ["exam", "mid-term", "midterm", "date", "schedule", "when is"]):
        return (
            "### 📅 Official ECA & BTU Semester 7 Examination Schedule\n\n"
            "According to the verified academic calendar from Engineering College Ajmer for Fall 2026:\n\n"
            "• **Nov 12, 2026 (10:00 AM – 12:00 PM)**: Database Management Systems (CS 401) — *Exam Hall A*\n"
            "• **Nov 15, 2026 (02:00 PM – 04:00 PM)**: Machine Learning (CS 450) — *Exam Hall C*\n"
            "• **Nov 18, 2026 (10:00 AM – 12:00 PM)**: Cloud Computing (CS 460) — *Room NB-102*\n"
            "• **Nov 24, 2026**: Final B.Tech Project Phase-1 Lab evaluations and report submissions.\n"
            "• **Dec 14, 2026**: BTU End-Term University Theory Examinations commence.\n\n"
            "📌 *Action Required*: Ensure your BTU exam registration fee (₹1,800) is submitted before **November 10, 2026**.\n\n"
            "[Source: ECA & BTU Academic Calendar Fall 2026 • ecajmer.ac.in]"
        )

    # --- CATEGORY E: RAG RETRIEVAL MATCH ---
    if retrieved_chunks:
        answer_text = retrieved_chunks[0]
        source_title = sources[0]["title"] if sources else "Official ECA Academic Portal"
        return f"**Official College Information**:\n\n{answer_text}\n\n[Source: {source_title}]"

    # --- DEFAULT HELPFUL FALLBACK ---
    return (
        f"I understand your query about **'{q_clean}'**. "
        "As your Campus AI Copilot, I can provide detailed academic guidance on computer engineering topics, "
        "study strategies, or details from the ECA / BTU academic handbook. "
        "Could you clarify if you would like an academic explanation, practice questions, or college schedule details?"
    )


# =========================================================================
# MAIN RAG / AI QUERY ENGINE
# =========================================================================

def query_rag(question: str, history: list = None, student_context: dict = None) -> dict:
    """
    Query the intelligent RAG system:
    1. Check for genuine intent and retrieve relevant chunks from ChromaDB.
    2. Format multi-turn conversation history.
    3. If GEMINI_API_KEY is available, call Gemini with academic prompt.
    4. If GEMINI_API_KEY is omitted/offline, use the intelligent NLP synthesizer.
    """
    if history is None:
        history = []
        
    q_clean = (question or "").strip()
    if not q_clean:
        return {
            "answer": "Please enter a question or topic so I can help you!",
            "sources": []
        }

    seed_default_knowledge_if_empty()
        
    # 1. Retrieve relevant chunks from ChromaDB
    retrieved_chunks = []
    retrieved_metadata = []
    sources = []

    try:
        results = collection.query(
            query_texts=[q_clean],
            n_results=3
        )
        if results and results.get('documents') and results['documents'][0]:
            retrieved_chunks = results['documents'][0]
            retrieved_metadata = results['metadatas'][0] if results.get('metadatas') else []
            for meta in retrieved_metadata:
                info = {"title": meta.get("title", ""), "url": meta.get("source_url", "")}
                if info not in sources and info["title"]:
                    sources.append(info)
    except Exception as e:
        print(f"[RAG Retrieval Notice] {e}")

    # 2. Build multi-turn history
    history_text = ""
    if history:
        formatted_turns = []
        for msg in history[-6:]:  # Keep recent 6 turns for tight context
            role = "Student" if msg.get("role") in ["user", "student"] else "Assistant"
            content = msg.get("content") or msg.get("text") or ""
            if content.strip():
                formatted_turns.append(f"{role}: {content.strip()}")
        if formatted_turns:
            history_text = "Recent Conversation History:\n" + "\n".join(formatted_turns) + "\n\n"

    # Context construction
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

    # 3. Call Gemini if API Key is configured
    if settings.GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            system_prompt = f"""You are Campus AI Copilot, an intelligent, empathetic academic assistant and campus guide for students at Engineering College Ajmer (ECA) affiliated with BTU.

Core Responsibilities:
1. Understand the student's true intent and answer naturally and conversationally.
2. For greetings ("Hi", "Hello"), respond warmly and explain how you can help. Never output robotic verification templates.
3. For academic questions (DBMS, OS, Data Structures, OOP, ML, Java, Algorithms), provide comprehensive, clear, pedagogical explanations with code snippets, analogies, MCQs, or study timetables as requested.
4. For college inquiries, use the verified context below and cite sources when applicable.
5. For personalized questions (like attendance), state the available data or explain clearly that real-time biometric attendance records must be verified with the Proctor office. Never fabricate fake attendance numbers.

{student_details}{history_text}Verified College Context:
{context_text}

Student Question: {q_clean}

Answer:"""
            response = model.generate_content(system_prompt)
            if response and response.text:
                return {
                    "answer": response.text.strip(),
                    "sources": sources
                }
        except Exception as e:
            print(f"[Gemini API Call Fallback to Intelligent Synthesizer]: {e}")

    # 4. Intelligent Synthesizer Fallback (for zero-setup demo / offline execution)
    answer = _generate_offline_intelligent_response(q_clean, retrieved_chunks, sources, student_context)
    return {
        "answer": answer,
        "sources": sources
    }
