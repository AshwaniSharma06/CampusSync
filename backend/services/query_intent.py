"""
CampusSync AI - Query Intent Classification Engine.
Fast, deterministic multi-tiered intent recognition with zero network overhead.
Routes queries to avoid unnecessary ChromaDB retrieval or excessive Gemini calls.
"""

import re
from enum import Enum
from typing import Dict, Any, List, Optional

class QueryIntent(str, Enum):
    GREETING = "GREETING"
    GENERAL_CONVERSATION = "GENERAL_CONVERSATION"
    GENERAL_KNOWLEDGE = "GENERAL_KNOWLEDGE"
    EXAMINATION_QUERY = "EXAMINATION_QUERY"
    SYLLABUS_QUERY = "SYLLABUS_QUERY"
    ACADEMIC_CALENDAR_QUERY = "ACADEMIC_CALENDAR_QUERY"
    NOTICE_QUERY = "NOTICE_QUERY"
    DEPARTMENT_QUERY = "DEPARTMENT_QUERY"
    DOCUMENT_SUMMARY = "DOCUMENT_SUMMARY"
    FOLLOW_UP_QUERY = "FOLLOW_UP_QUERY"
    ACADEMIC_QUERY = "ACADEMIC_QUERY"
    OUT_OF_SCOPE_QUERY = "OUT_OF_SCOPE_QUERY"

# Fast Regex Patterns for Zero-Latency Classification
GREETING_PATTERN = re.compile(
    r"^(hi|hello|hey|heyy|heya|howdy|greetings|namaste|good\s+(morning|afternoon|evening|day)|yo|hlo|hii+)\b[!?. ]*$",
    re.IGNORECASE
)

CONVERSATION_PATTERN = re.compile(
    r"^(how\s+are\s+you|who\s+are\s+you|what\s+is\s+your\s+name|what\s+can\s+you\s+do|tell\s+me\s+about\s+yourself|"
    r"thank\s*you|thanks|thx|bye|goodbye|see\s+ya|nice\s+to\s+meet\s+you|who\s+made\s+you|are\s+you\s+ai|are\s+you\s+human)[!?. ]*$",
    re.IGNORECASE
)

OUT_OF_SCOPE_PATTERN = re.compile(
    r"\b(recipe|cook|cooking|pizza|burger|pasta|movie|bollywood|hollywood|actor|actress|cricket|ipl|football|fifa|"
    r"world\s*cup|politics|election|prime\s*minister|president|bitcoin|stock\s*market|crypto|horoscope|astrology)\b",
    re.IGNORECASE
)

# General CS & Engineering technical questions that do not belong to ECA circulars
GENERAL_KNOWLEDGE_PATTERN = re.compile(
    r"\b(binary\s+search\s+tree|bst|linked\s+list|stack|queue|quicksort|merge\s*sort|dijkstra|time\s+complexity|o\(n\)|"
    r"what\s+is\s+a\s+(class|object|pointer|thread|process|deadlock|semaphore|mutex)|"
    r"difference\s+between\s+(tcp|udp|process|thread|bfs|dfs|sql|nosql)|"
    r"explain\s+(quicksort|dynamic\s+programming|recursion|inheritance|polymorphism|rest\s+api|graphql|docker|kubernetes)|"
    r"how\s+does\s+(backpropagation|neural\s+network|gradient\s+descent|hashmap|garbage\s+collection)\s+work|"
    r"write\s+(a\s+python|a\s+c\+\+|a\s+java|code|a\s+function|a\s+program)\s+for)\b",
    re.IGNORECASE
)

EXAM_PATTERN = re.compile(
    r"\b(practical\s+(exam|examination|viva|timetable|schedule)|mid-?term(\s+(exam|test|schedule|timetable))?|"
    r"when\s+is\s+my\s+(practical|mid-?term|exam)|exam(ination)?\s+(notice|date|schedule|routine|timetable|form|fee)|"
    r"examination(\s+notices?)?|exams?(\s+notices?)?|back\s+paper|main\s+exam|admit\s+card|center|seating\s+plan)\b",
    re.IGNORECASE
)

SYLLABUS_PATTERN = re.compile(
    r"\b(syllabus|course\s+structure|curriculum|teaching\s+scheme|course\s+code|units?\s+[1-5]|"
    r"how\s+many\s+credits|subjects?\s+in\s+.*sem(ester)?|explain\s+.*syllabus)\b",
    re.IGNORECASE
)

CALENDAR_PATTERN = re.compile(
    r"\b(academic\s+calendar|commencement\s+of\s+classes|working\s+days|winter\s+vacation|summer\s+break|"
    r"when\s+(do|does|will)\s+(classes|the\s+semester)\s+(start|commence|end)|holidays?\s+list)\b",
    re.IGNORECASE
)

NOTICE_PATTERN = re.compile(
    r"\b((latest|recent|all|new|verified|official)?\s*(notices?|circulars?|announcements?)|"
    r"library\s+(hours|timings|extended)|hackathon|technotsav|club\s+induction|fee\s+(notice|submission))\b",
    re.IGNORECASE
)

DEPARTMENT_PATTERN = re.compile(
    r"\b(head\s+of\s+department|hod|faculty\s+advisor|lab\s+assistant|where\s+is\s+.*(lab|block|room)|"
    r"sac\s+building|proctor\s+office|dispensary|canteen|admin\s+block)\b",
    re.IGNORECASE
)

SUMMARY_PATTERN = re.compile(
    r"\b(summarize|give\s+a\s+summary|brief\s+me\s+about|key\s+points\s+of)\b",
    re.IGNORECASE
)

FOLLOW_UP_PATTERN = re.compile(
    r"\b(explain\s+.*in\s+more\s+detail|in\s+more\s+detail|tell\s+me\s+more|what\s+about\s+(it|that|this)|"
    r"can\s+you\s+elaborate|why\s+so|and\s+for\s+the\s+other|what\s+did\s+you\s+mean|previous\s+(answer|response|detail))\b",
    re.IGNORECASE
)

def classify_query_intent(query: str, history: Optional[List[Dict[str, str]]] = None) -> QueryIntent:
    """
    Classifies a user query into a targeted QueryIntent.
    Operates in < 0.2ms using compiled regular expressions.
    """
    q = (query or "").strip()
    if not q:
        return QueryIntent.GENERAL_CONVERSATION

    q_lower = q.lower()

    # 1. Greetings (Exact matches like 'Hi', 'Hello')
    if GREETING_PATTERN.match(q):
        return QueryIntent.GREETING

    # 2. Casual General Conversation ('How are you?', 'Who are you?')
    if CONVERSATION_PATTERN.match(q):
        return QueryIntent.GENERAL_CONVERSATION

    # 3. Follow-up query detection (only if prior history exists)
    if history and len(history) > 0:
        if FOLLOW_UP_PATTERN.search(q_lower):
            return QueryIntent.FOLLOW_UP_QUERY
        # Very short queries with pronouns in a multi-turn conversation
        words = q_lower.split()
        if len(words) <= 4 and any(w in words for w in ["it", "that", "this", "more", "detail", "units", "why"]):
            return QueryIntent.FOLLOW_UP_QUERY

    # 4. Out of scope queries (cooking, entertainment, politics)
    if OUT_OF_SCOPE_PATTERN.search(q_lower):
        return QueryIntent.OUT_OF_SCOPE_QUERY

    # 5. Circulars, College Announcements & Facilities (Library, Fest, Hackathons)
    if NOTICE_PATTERN.search(q_lower) or any(w in q_lower for w in ["library", "technotsav", "hackathon", "fest"]):
        return QueryIntent.NOTICE_QUERY

    # 6. Examination Queries (practical exams, mid-term, timetables)
    if EXAM_PATTERN.search(q_lower):
        return QueryIntent.EXAMINATION_QUERY

    # 7. Syllabus & Curriculum Queries
    if SYLLABUS_PATTERN.search(q_lower):
        return QueryIntent.SYLLABUS_QUERY

    # 8. Academic Calendar Queries
    if CALENDAR_PATTERN.search(q_lower):
        return QueryIntent.ACADEMIC_CALENDAR_QUERY

    # 9. Department & Campus navigation
    if DEPARTMENT_PATTERN.search(q_lower):
        return QueryIntent.DEPARTMENT_QUERY

    # 10. Document Summarization
    if SUMMARY_PATTERN.search(q_lower):
        return QueryIntent.DOCUMENT_SUMMARY

    # 11. General Computer Science & Engineering knowledge
    if GENERAL_KNOWLEDGE_PATTERN.search(q_lower):
        return QueryIntent.GENERAL_KNOWLEDGE

    # 12. College-specific general academic check
    if any(w in q_lower for w in ["btu", "eca", "credits", "cgpa", "sgpa", "degree", "marks", "passing", "attendance", "rules"]):
        return QueryIntent.ACADEMIC_QUERY

    # Default to general academic query if college related, otherwise general knowledge
    if any(w in q_lower for w in ["college", "university", "faculty", "student", "campus", "hostel", "semester", "exam"]):
        return QueryIntent.ACADEMIC_QUERY

    return QueryIntent.GENERAL_KNOWLEDGE
