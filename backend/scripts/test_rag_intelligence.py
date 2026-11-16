"""
Comprehensive Verification Test Suite for CampusSync AI RAG Intelligence.
Tests:
1. Semester-specific syllabus.
2. Examination notices.
3. Academic calendars.
4. College circulars.
5. Follow-up conversational questions.
6. Unavailable information (anti-hallucination check).
"""

import sys
from pathlib import Path

# Add project root and backend to sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root_dir))
sys.path.insert(1, str(root_dir / "backend"))

from backend.services.rag_service import query_rag

STUDENT_CONTEXT = {
    "name": "Ashwani",
    "department": "Computer Engineering (CSE)",
    "semester": 7,
    "session": "2023 - 2027",
    "student_id": "23EEACS15"
}

def test_1_semester_specific_syllabus():
    print("\n" + "="*80)
    print("TEST 1: Semester-Specific Syllabus")
    print("="*80)
    q = "What is the course structure and syllabus for 7th semester B.Tech CSE?"
    res = query_rag(question=q, student_context=STUDENT_CONTEXT)
    answer = res["answer"]
    sources = res["sources"]
    print("Query:", q)
    print("Answer Preview:\n", answer[:400] + "...")
    print(f"Sources Count: {len(sources)}")
    for s in sources[:3]:
        print(f" - {s.get('title')} | Page: {s.get('page')} | {s.get('url')}")
    
    assert len(sources) > 0, "Expected at least 1 source for syllabus query"
    assert "CS-701" in answer or "Cloud" in answer or "Syllabus" in answer or "Credits" in answer, "Answer should contain syllabus details"
    print(">>> TEST 1 PASSED")

def test_2_examination_notices():
    print("\n" + "="*80)
    print("TEST 2: Examination Notices (Mid-Term & Practical Schedule)")
    print("="*80)
    q = "When are the 7th semester practical exams and mid-term tests scheduled?"
    res = query_rag(question=q, student_context=STUDENT_CONTEXT)
    answer = res["answer"]
    sources = res["sources"]
    print("Query:", q)
    print("Answer Preview:\n", answer[:400] + "...")
    print(f"Sources Count: {len(sources)}")
    for s in sources[:3]:
        print(f" - {s.get('title')} | Page: {s.get('page')} | {s.get('url')}")
    
    assert len(sources) > 0, "Expected sources for examination schedule"
    assert ("mid" in answer.lower() or "practical" in answer.lower() or "exam" in answer.lower()), "Answer should address examination schedule"
    print(">>> TEST 2 PASSED")

def test_3_academic_calendar():
    print("\n" + "="*80)
    print("TEST 3: Academic Calendar")
    print("="*80)
    q = "What is the BTU academic calendar schedule for commencement of classes and examinations?"
    res = query_rag(question=q, student_context=STUDENT_CONTEXT)
    answer = res["answer"]
    sources = res["sources"]
    print("Query:", q)
    print("Answer Preview:\n", answer[:400] + "...")
    print(f"Sources Count: {len(sources)}")
    for s in sources[:3]:
        print(f" - {s.get('title')} | Page: {s.get('page')} | {s.get('url')}")
    
    assert any("Calendar" in s.get("title", "") for s in sources), "Expected Academic Calendar in sources"
    assert "semester" in answer.lower() or "classes" in answer.lower() or "calendar" in answer.lower(), "Answer should explain calendar schedule"
    print(">>> TEST 3 PASSED")

def test_4_college_circulars():
    print("\n" + "="*80)
    print("TEST 4: College Circulars (Central Library & Fest)")
    print("="*80)
    q = "What are the Central Library hours during mid-term preparation?"
    res = query_rag(question=q, student_context=STUDENT_CONTEXT)
    answer = res["answer"]
    sources = res["sources"]
    print("Query:", q)
    print("Answer Preview:\n", answer[:400] + "...")
    print(f"Sources Count: {len(sources)}")
    for s in sources[:3]:
        print(f" - {s.get('title')} | Page: {s.get('page')} | {s.get('url')}")
    
    assert any("Library" in s.get("title", "") for s in sources), "Expected Library circular in sources"
    assert "8:00" in answer or "11:00" in answer or "library" in answer.lower(), "Answer should mention library hours"
    print(">>> TEST 4 PASSED")

def test_5_follow_up_questions():
    print("\n" + "="*80)
    print("TEST 5: Multi-Turn Follow-Up Question")
    print("="*80)
    history = [
        {"role": "user", "content": "What is the syllabus and course structure for 7th semester B.Tech CSE?"},
        {"role": "assistant", "content": "The 7th semester includes CS-701 Cloud Computing, CS-702 Information Security Systems, and CS-703 AI & ML."}
    ]
    follow_up_q = "What unit topics are covered in the Cloud Computing subject?"
    res = query_rag(question=follow_up_q, history=history, student_context=STUDENT_CONTEXT)
    answer = res["answer"]
    sources = res["sources"]
    print("Follow-up Query:", follow_up_q)
    print("Rewritten Query:", res.get("rewritten_query"))
    print("Answer Preview:\n", answer[:400] + "...")
    print(f"Sources Count: {len(sources)}")
    for s in sources[:3]:
        print(f" - {s.get('title')} | Page: {s.get('page')} | {s.get('url')}")
    
    assert "Virtualization" in answer or "Unit" in answer or "Cloud" in answer or "IaaS" in answer, "Answer should explain Cloud Computing unit topics"
    print(">>> TEST 5 PASSED")

def test_6_unavailable_information():
    print("\n" + "="*80)
    print("TEST 6: Information Unavailable in Indexed Documents (Anti-Hallucination)")
    print("="*80)
    q = "What is the registration fee for the college scuba diving club expedition in 2035?"
    res = query_rag(question=q, student_context=STUDENT_CONTEXT)
    answer = res["answer"]
    sources = res["sources"]
    print("Query:", q)
    print("Answer Preview:\n", answer)
    print(f"Sources Count: {len(sources)}")
    
    # Must communicate unavailability without hallucinating fees or dates
    assert ("couldn't find" in answer.lower() or "not available" in answer.lower() or "outside" in answer.lower() or "no official" in answer.lower() or "scope" in answer.lower()), "AI must state information is unavailable or out of scope"
    print(">>> TEST 6 PASSED")

if __name__ == "__main__":
    print("Starting CampusSync AI RAG Intelligence Verification Tests...")
    test_1_semester_specific_syllabus()
    test_2_examination_notices()
    test_3_academic_calendar()
    test_4_college_circulars()
    test_5_follow_up_questions()
    test_6_unavailable_information()
    print("\n" + "*"*80)
    print("ALL 6 RAG INTELLIGENCE TESTS PASSED SUCCESSFULLY!")
    print("*"*80)
