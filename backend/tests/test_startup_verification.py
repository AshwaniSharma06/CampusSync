"""
CampusSync Fast Startup & Backend Integrity Verification
Tests all backend modules, databases, ChromaDB, and RAG logic directly
without using Starlette TestClient (avoids Windows sandbox socketpair deadlocks).
"""

import os
import sys
from pathlib import Path

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Ensure project root in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

def run_checks():
    print("=" * 70)
    print("  CAMPUSSYNC BACKEND INTEGRITY & STARTUP VERIFICATION")
    print("=" * 70)

    # 1. Config & Paths
    print("\n[Check 1] Verifying backend.core.config...")
    from backend.core.config import settings, DEFAULT_DB_FILE, ROOT_DIR
    print(f"  --> Root dir: {ROOT_DIR}")
    print(f"  --> Canonical DB File: {DEFAULT_DB_FILE} (Exists: {DEFAULT_DB_FILE.exists()})")
    print(f"  --> Resolved DATABASE_URL: {settings.DATABASE_URL}")
    print(f"  --> Chroma persist dir: {settings.CHROMA_PERSIST_DIRECTORY}")
    assert DEFAULT_DB_FILE.exists(), "campussync.db must exist at project root!"
    print("  --> PASS: Configuration paths verified.")

    # 2. Database Session & Models
    print("\n[Check 2] Verifying database connection & tables...")
    from backend.db.session import SessionLocal, engine
    from backend.models.user import User, StudentProfile
    from backend.models.system import ChatSession, ChatMessage
    from backend.models.academic import AcademicDocument, Notice

    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        session_count = db.query(ChatSession).count()
        doc_count = db.query(AcademicDocument).count()
        notice_count = db.query(Notice).count()
        print(f"  --> Users in DB: {user_count}")
        print(f"  --> Chat Sessions in DB: {session_count}")
        print(f"  --> Academic Documents: {doc_count}")
        print(f"  --> Notices in DB: {notice_count}")
        assert user_count > 0, "Users table must not be empty"
        print("  --> PASS: SQLite database is accessible with all tables intact.")
    finally:
        db.close()

    # 3. ChromaDB Vector Store
    print("\n[Check 3] Verifying ChromaDB collection...")
    from backend.services.vector_service import get_rag_collection
    collection = get_rag_collection()
    chunk_count = collection.count()
    print(f"  --> ChromaDB collection '{collection.name}' indexed chunks: {chunk_count}")
    assert chunk_count > 0, "ChromaDB should contain indexed documents"
    print("  --> PASS: ChromaDB persistent vector collection is operational.")

    # 4. RAG Engine Query Logic
    print("\n[Check 4] Verifying query_rag execution...")
    from backend.services.rag_service import query_rag
    res = query_rag(
        question="What is the schedule for mid-term exams?",
        history=[],
        student_context={"department": "Computer Engineering (CSE)", "semester": 7}
    )
    print(f"  --> Response keys: {list(res.keys())}")
    print(f"  --> Sources retrieved: {len(res.get('sources', []))}")
    print(f"  --> Answer preview: {res.get('answer', '')[:80]}...")
    assert "answer" in res and len(res["answer"]) > 0
    assert "sources" in res
    assert "rewritten_query" in res
    print("  --> PASS: query_rag executes successfully without unhandled exceptions.")

    # 5. Direct Router chat_with_ai Execution
    print("\n[Check 5] Verifying API router chat_with_ai endpoint...")
    from backend.api.v1.rag import ChatRequest, chat_with_ai
    db = SessionLocal()
    try:
        req = ChatRequest(
            query="When are the BTU 7th semester practical exams?",
            history=[],
            student_profile={"department": "Computer Engineering (CSE)", "semester": 7}
        )
        api_res = chat_with_ai(request=req, db=db, current_user=None)
        print(f"  --> Router response keys: {list(api_res.keys())}")
        print(f"  --> Answer preview: {api_res.get('answer', '')[:80]}...")
        assert "answer" in api_res
        assert "sources" in api_res
        assert "session_id" in api_res
        print("  --> PASS: chat_with_ai router function works perfectly.")
    finally:
        db.close()

    # 6. CORS & Main App Imports
    print("\n[Check 6] Verifying FastAPI app and CORS setup...")
    from backend.main import app
    print(f"  --> FastAPI app title: '{app.title}' (version {app.version})")
    assert app.title == "CampusSync API"
    openapi_spec = app.openapi()
    api_paths = list(openapi_spec.get("paths", {}).keys())
    print(f"  --> Registered OpenAPI endpoints count: {len(api_paths)}")
    assert "/health" in api_paths or any("health" in p for p in api_paths), "Endpoint /health must be registered"
    assert "/api/v1/rag/chat" in api_paths, "Endpoint /api/v1/rag/chat must be registered"
    assert "/api/v1/rag/sessions" in api_paths, "Endpoint /api/v1/rag/sessions must be registered"
    print("  --> PASS: All core routes (/health, /docs, /api/v1/rag/chat, /api/v1/rag/sessions) registered.")

    print("\n" + "=" * 70)
    print("  ALL 6 BACKEND INTEGRITY CHECKS PASSED SUCCESSFULLY (0 ERRORS)")
    print("=" * 70)

if __name__ == "__main__":
    run_checks()
