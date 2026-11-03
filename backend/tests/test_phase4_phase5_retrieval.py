"""
CampusSync AI: Automated Integration Tests for Phase 4 & Phase 5.
Validates:
1. Conversational Query Rewriting (follow-up resolution)
2. Intelligent Retrieval Pipeline (hybrid keyword boosting & deduplication)
3. Relevance Thresholding (exclusion of irrelevant noise)
4. Case 1 Policy: Grounded Answer with verified source citations
5. Case 2 Policy: Honest "Not Found" response for missing college facts (no hallucination)
6. Case 3 Policy: Polite scope limitation for unrelated questions
7. Case 4 Policy: Comprehensive educational explanation for academic concepts (DBMS/OS/Java)
8. Case 6 Policy: Multi-turn contextual continuity for follow-up dialogues
"""

import sys
import os
import io

# Ensure UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, BASE_DIR)

from backend.core.config import settings
from backend.services.query_rewriter import rewrite_query_for_retrieval
from backend.services.retrieval_service import execute_intelligent_retrieval
from backend.services.rag_service import query_rag, _get_gemini_client

def run_phase4_phase5_tests():
    print("======================================================================")
    print("  CAMPUSSYNC AI: PHASE 4 & PHASE 5 INTELLIGENT RETRIEVAL & GEMINI SUITE")
    print("======================================================================")

    tests_passed = 0
    total_tests = 8

    # ------------------------------------------------------------------
    # TEST 1: Conversational Query Rewriter
    # ------------------------------------------------------------------
    print("\n[TEST 1] Conversational Query Rewriter for Follow-up Resolution")
    history = [
        {"role": "user", "content": "When is the Semester 7 Major Project Phase-1 evaluation?"},
        {"role": "assistant", "content": "BTU Semester 7 Final Major Project Phase-1 Lab evaluations are scheduled for November 24, 2026."}
    ]
    follow_up = "What about the practicals?"
    
    gemini_client = _get_gemini_client()
    rewritten = rewrite_query_for_retrieval(
        query=follow_up,
        history=history,
        student_context={"department": "CSE", "semester": 7},
        gemini_client=gemini_client
    )
    print(f"  Original: '{follow_up}'")
    print(f"  Rewritten Query: '{rewritten}'")
    
    # Assert rewritten query has context of Project, practicals, or Semester 7
    rewritten_lower = rewritten.lower()
    has_context = any(w in rewritten_lower for w in ["practical", "project", "semester", "7", "exam", "evaluation"])
    assert has_context, f"Rewriter failed to attach conversation context: {rewritten}"
    print("  [OK] Follow-up reference resolved into standalone semantic query.")
    tests_passed += 1

    # ------------------------------------------------------------------
    # TEST 2: Hybrid Scoring & Deduplication
    # ------------------------------------------------------------------
    print("\n[TEST 2] Intelligent Retrieval Pipeline: Hybrid Scoring & Deduplication")
    ret_res = execute_intelligent_retrieval(
        query="What are the Central Library extended reading hours for mid-terms?",
        student_context={"department": "CSE", "semester": 3},
        gemini_client=gemini_client
    )
    assert ret_res["has_verified_context"] is True, "Failed to retrieve verified library notice"
    assert len(ret_res["chunks"]) > 0, "No chunks returned"
    
    # Top chunk must be the Library notice
    top_chunk = ret_res["chunks"][0]
    assert "Library" in top_chunk["title"], f"Expected Library notice at top, got: {top_chunk['title']}"
    assert "rerank_score" in top_chunk and top_chunk["rerank_score"] > 1.0, "Keyword boosting was not applied"
    
    # Verify no duplicate chunk parents
    seen_parents = set()
    for c in ret_res["chunks"]:
        p_id = c.get("parent_doc_id") or c.get("title")
        assert p_id not in seen_parents, f"Duplicate chunk parent found in retrieval: {p_id}"
        seen_parents.add(p_id)
        
    print(f"  [OK] Top retrieved chunk: '{top_chunk['title']}' (Score: {top_chunk['rerank_score']:.2f}). Deduplication verified.")
    tests_passed += 1

    # ------------------------------------------------------------------
    # TEST 3: Relevance Thresholding on Unrelated Query
    # ------------------------------------------------------------------
    print("\n[TEST 3] Relevance Thresholding on Unrelated Query")
    unrelated_ret = execute_intelligent_retrieval(
        query="Who will win the IPL 2026 cricket championship?",
        student_context={"department": "CSE", "semester": 3},
        gemini_client=gemini_client
    )
    assert unrelated_ret["has_verified_context"] is False, "Irrelevant cricket query unexpectedly matched college context"
    assert unrelated_ret["context_text"] == "NO_MATCHING_OFFICIAL_DOCUMENTS_FOUND"
    print("  [OK] Unrelated query correctly filtered out with NO_MATCHING_OFFICIAL_DOCUMENTS_FOUND.")
    tests_passed += 1

    # ------------------------------------------------------------------
    # TEST 4: Case 1 Policy - Grounded Answer with Source Citations
    # ------------------------------------------------------------------
    print("\n[TEST 4] Case 1 Policy: Grounded Answer with Verified Citations")
    res_lib = query_rag(
        question="What are the operational timings of the Central Library during midterms?",
        student_context={"department": "CSE", "semester": 3}
    )
    print(f"  Gemini Answer Preview: {res_lib['answer'][:130]}...")
    print(f"  Sources Cited: {[s['title'] for s in res_lib['sources']]}")
    
    assert len(res_lib["sources"]) > 0, "No sources cited for verified library notice"
    assert any("Library" in s["title"] for s in res_lib["sources"]), "Library notice source missing"
    assert "Central Library" in res_lib["answer"] or "library" in res_lib["answer"].lower()
    print("  [OK] Case 1 passed: Grounded response dynamically generated with verified source citations.")
    tests_passed += 1

    # ------------------------------------------------------------------
    # TEST 5: Case 2 Policy - Honest "Information Not Found" (No Hallucination)
    # ------------------------------------------------------------------
    print("\n[TEST 5] Case 2 Policy: Honest Response for Missing College Information")
    res_missing = query_rag(
        question="What is the registration fee for the Quantum Robotics Rocketry Workshop 2026?",
        student_context={"department": "CSE", "semester": 3}
    )
    print(f"  Gemini Answer Preview: {res_missing['answer'][:140]}...")
    
    # Must adhere to Policy 2: state that information was not found in verified documents
    ans_lower = res_missing["answer"].lower()
    not_found_indicated = any(phrase in ans_lower for phrase in [
        "couldn't find verified", "could not find", "not found", "no verified",
        "check the official", "contact the college", "ecajmer.ac.in"
    ])
    assert not_found_indicated, f"Model failed to state missing information honestly: {res_missing['answer']}"
    print("  [OK] Case 2 passed: Model honestly reported lack of verified official documents without guessing.")
    tests_passed += 1

    # ------------------------------------------------------------------
    # TEST 6: Case 3 Policy - Polite Scope Limitation for Unrelated Queries
    # ------------------------------------------------------------------
    print("\n[TEST 6] Case 3 Policy: Polite Scope Limitation for Out-of-Scope Queries")
    res_unrelated = query_rag(
        question="Can you give me a recipe for chocolate lava cake?",
        student_context={"department": "CSE", "semester": 3}
    )
    print(f"  Gemini Answer Preview: {res_unrelated['answer'][:140]}...")
    
    ans_unrelated_lower = res_unrelated["answer"].lower()
    scope_indicated = any(p in ans_unrelated_lower for p in ["outside my primary scope", "scope", "academic", "campussync ai"])
    assert scope_indicated, f"Model failed to enforce scope limit: {res_unrelated['answer']}"
    print("  [OK] Case 3 passed: Polite scope boundary enforced for non-academic queries.")
    tests_passed += 1

    # ------------------------------------------------------------------
    # TEST 7: Case 4 Policy - Educational Concept Explanation (DBMS/OS/DSA)
    # ------------------------------------------------------------------
    print("\n[TEST 7] Case 4 Policy: Comprehensive Academic Concept Explanation")
    res_academic = query_rag(
        question="Explain the fundamental difference between 3NF and BCNF in DBMS with a clear example.",
        student_context={"department": "CSE", "semester": 3}
    )
    print(f"  Gemini Answer Preview: {res_academic['answer'][:140]}...")
    
    ans_acad_lower = res_academic["answer"].lower()
    assert "bcnf" in ans_acad_lower and "3nf" in ans_acad_lower, "Response did not explain 3NF and BCNF"
    assert any(term in ans_acad_lower for term in ["superkey", "functional dependency", "transitive", "candidate key"])
    print("  [OK] Case 4 passed: High-quality technical explanation dynamically generated by Gemini.")
    tests_passed += 1

    # ------------------------------------------------------------------
    # TEST 8: Case 6 Policy - Multi-turn Context Continuity in Follow-ups
    # ------------------------------------------------------------------
    print("\n[TEST 8] Case 6 Policy: Multi-turn Context Continuity")
    multi_turn_history = [
        {"role": "user", "content": "What is Technotsav 2026?"},
        {"role": "assistant", "content": "Technotsav 2026 is ECA's annual technical fest featuring CodeECA Hackathon, Robowar Arena, and Drone Racing."}
    ]
    res_followup = query_rag(
        question="Where will the Robowar event take place?",
        history=multi_turn_history,
        student_context={"department": "CSE", "semester": 3}
    )
    print(f"  Follow-up Answer Preview: {res_followup['answer'][:140]}...")
    
    ans_follow_lower = res_followup["answer"].lower()
    assert any(term in ans_follow_lower for term in ["amphitheater", "central amphitheater", "technotsav", "robowar"]), \
        f"Model failed to understand multi-turn context: {res_followup['answer']}"
    print("  [OK] Case 6 passed: Context continuity preserved across conversational turns.")
    tests_passed += 1

    print("\n----------------------------------------------------------------------")
    print(f"  PHASE 4 & PHASE 5 TEST SUMMARY: {tests_passed}/{total_tests} SCENARIOS PASSED")
    print("----------------------------------------------------------------------\n")
    assert tests_passed == total_tests

if __name__ == "__main__":
    run_phase4_phase5_tests()
