import sys
import os

# Configure UTF-8 for Windows PowerShell output
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Ensure backend can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.services.rag_service import query_rag

TEST_QUERIES = [
    "Hi",
    "What can you do?",
    "Explain DBMS normalization.",
    "Give me 10 Java MCQs.",
    "Create a 7-day study timetable.",
    "What is my attendance?",
    "Tell me the next examination date.",
    "Explain polymorphism with a real-world example."
]

def run_tests():
    student_ctx = {
        "name": "Ravi Sharma",
        "department": "Computer Engineering (CSE)",
        "semester": 7,
        "session": "2022 – 2026"
    }

    print("=" * 60)
    print("RUNNING CAMPUSSYNC AI AGENT TEST SUITE")
    print("=" * 60)

    for i, q in enumerate(TEST_QUERIES, 1):
        print(f"\n--- [Test {i}] User Query: '{q}' ---")
        res = query_rag(q, history=[], student_context=student_ctx)
        ans = res.get("answer", "")
        print(f"Assistant Response Preview:\n{ans[:280]}...")
        assert "Verified against BTU syllabus and ECA academic schedule for" not in ans, "Failed: Still returned old fixed verification string!"
        assert len(ans) > 30, "Failed: Response too short!"
        print(f"Status: PASS ✓")

    print("\n" + "=" * 60)
    print("ALL 8 INTENT TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
