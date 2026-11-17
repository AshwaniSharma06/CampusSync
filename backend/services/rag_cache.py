"""
In-Memory Fast Response Cache for CampusSync AI.
Provides sub-5ms latency for repeated and common academic queries with TTL invalidation.
"""

import time
import hashlib
from typing import Dict, Any, Optional

class RAGResponseCache:
    def __init__(self, ttl_seconds: int = 1800, max_entries: int = 256):
        self.ttl_seconds = ttl_seconds
        self.max_entries = max_entries
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _generate_key(
        self,
        query: str,
        student_context: Optional[Dict[str, Any]] = None,
        history_tail: Optional[str] = None
    ) -> str:
        q_norm = " ".join((query or "").strip().lower().split())
        dept = (student_context.get("department_code") or student_context.get("department") or "") if student_context else ""
        sem = str(student_context.get("semester") or "") if student_context else ""
        tail = history_tail or ""
        raw = f"{q_norm}::{dept}::{sem}::{tail}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def get(
        self,
        query: str,
        student_context: Optional[Dict[str, Any]] = None,
        history_tail: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        key = self._generate_key(query, student_context, history_tail)
        entry = self._cache.get(key)
        if not entry:
            return None

        # Check TTL
        if time.time() - entry["timestamp"] > self.ttl_seconds:
            del self._cache[key]
            return None

        return entry["data"]

    def set(
        self,
        query: str,
        data: Dict[str, Any],
        student_context: Optional[Dict[str, Any]] = None,
        history_tail: Optional[str] = None
    ) -> None:
        if len(self._cache) >= self.max_entries:
            # Purge oldest 25% of entries
            sorted_keys = sorted(self._cache.keys(), key=lambda k: self._cache[k]["timestamp"])
            for k in sorted_keys[: len(sorted_keys) // 4]:
                self._cache.pop(k, None)

        key = self._generate_key(query, student_context, history_tail)
        self._cache[key] = {
            "timestamp": time.time(),
            "data": data
        }

    def clear(self) -> None:
        self._cache.clear()

# Global Singleton Cache
rag_cache = RAGResponseCache()
