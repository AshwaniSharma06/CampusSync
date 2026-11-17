import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.services.query_intent import classify_query_intent, QueryIntent

test_cases = [
    ("Hi", None, QueryIntent.GREETING),
    ("How are you?", None, QueryIntent.GENERAL_CONVERSATION),
    ("When is my practical examination?", None, QueryIntent.EXAMINATION_QUERY),
    ("Explain my CSE Semester 7 DBMS syllabus.", None, QueryIntent.SYLLABUS_QUERY),
    ("Show me the latest examination notice.", None, QueryIntent.EXAMINATION_QUERY),
    ("Explain the previous answer in more detail.", [{"role": "user", "content": "prev"}], QueryIntent.FOLLOW_UP_QUERY),
    ("What is a binary search tree?", None, QueryIntent.GENERAL_KNOWLEDGE),
    ("What is my examination date if no verified information exists?", None, QueryIntent.EXAMINATION_QUERY),
    ("How to cook a pizza?", None, QueryIntent.OUT_OF_SCOPE_QUERY)
]

for q, hist, expected in test_cases:
    res = classify_query_intent(q, hist)
    assert res == expected, f'Query "{q}" got {res}, expected {expected}'
    print(f'OK: "{q}" -> {res.value}')

print("\nALL INTENT TESTS PASSED!")
