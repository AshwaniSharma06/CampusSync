"""
Phase 4.1 URL and Document Integrity Audit Script
"""
import os
import sys
import io
import urllib.request
import urllib.error
import ssl

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.db.session import SessionLocal
from backend.models.academic import Notice, AcademicResource
from backend.models.social import Club

def inspect_records():
    db = SessionLocal()
    print("=" * 80)
    print("ALL NOTICES:")
    print("=" * 80)
    notices = db.query(Notice).all()
    for n in notices:
        print(f"Notice [{n.id}]: {n.title}")
        print(f"  dest_type: {getattr(n, 'destination_type', None)}")
        print(f"  file_path: {getattr(n, 'file_path', None)}")
        print(f"  doc_url:   {getattr(n, 'document_url', None)}")
        print(f"  src_url:   {getattr(n, 'source_url', None)}")

    print("\n" + "=" * 80)
    print("ALL ACADEMIC RESOURCES:")
    print("=" * 80)
    resources = db.query(AcademicResource).all()
    for r in resources:
        print(f"Resource [{r.id}]: {r.title}")
        print(f"  dest_type: {getattr(r, 'destination_type', None)}")
        print(f"  file_path: {getattr(r, 'file_path', None)}")
        print(f"  doc_url:   {getattr(r, 'document_url', None)}")
        print(f"  src_url:   {getattr(r, 'source_url', None)}")
        print(f"  file_url:  {getattr(r, 'file_url', None)}")

    print("\n" + "=" * 80)
    print("ALL CLUBS:")
    print("=" * 80)
    clubs = db.query(Club).all()
    for c in clubs:
        print(f"Club [{c.id}]: {c.name}")
        print(f"  dest_type:    {getattr(c, 'destination_type', None)}")
        print(f"  official_url: {getattr(c, 'official_url', None)}")
        print(f"  fallback_url: {getattr(c, 'fallback_url', None)}")

if __name__ == "__main__":
    inspect_records()
