"""
Phase 4.1 Live External URL Verification Script
Tests reachability, status code, redirects, content-type, and relevance for all URLs in notices, academic_resources, clubs.
"""
import os
import sys
import io
import urllib.request
import urllib.error
import ssl
from urllib.parse import urlparse
import sqlite3

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DB_PATH = "campussync.db"

# List of headers to look like a standard browser request
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8"
}

def test_url(url, timeout=10):
    if not url or url.startswith("/api/v1/"):
        return {"status": "LOCAL_OR_EMPTY", "code": None, "final_url": url, "error": None}
    
    ctx = ssl.create_default_context()
    # If college site has SSL cert issues (common with Indian gov colleges), we inspect that
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as response:
            final_url = response.geturl()
            status_code = response.getcode()
            content_type = response.headers.get("Content-Type", "")
            content_length = response.headers.get("Content-Length", None)
            # Read first 1024 bytes to check content
            sample_data = response.read(1024)
            return {
                "status": "SUCCESS" if status_code == 200 else f"HTTP_{status_code}",
                "code": status_code,
                "final_url": final_url,
                "content_type": content_type,
                "content_length": content_length,
                "sample_preview": sample_data[:200],
                "error": None
            }
    except urllib.error.HTTPError as e:
        return {
            "status": f"HTTP_ERROR_{e.code}",
            "code": e.code,
            "final_url": getattr(e, 'url', url),
            "content_type": e.headers.get("Content-Type", "") if hasattr(e, 'headers') else None,
            "error": str(e)
        }
    except urllib.error.URLError as e:
        return {
            "status": "URL_ERROR",
            "code": None,
            "final_url": url,
            "error": str(e.reason)
        }
    except Exception as e:
        return {
            "status": "EXCEPTION",
            "code": None,
            "final_url": url,
            "error": str(e)
        }

def run_url_audit():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    print("=" * 80)
    print("PHASE 4.1 AUDIT: LIVE EXTERNAL URL VERIFICATION")
    print("=" * 80)

    url_entries = []

    # 1. Notices
    cur.execute("SELECT id, title, download_url, document_url, source_url, official_page_url FROM notices")
    for row in cur.fetchall():
        n_id, title, dl_url, doc_url, src_url, off_url = row
        for field, u in [("document_url", doc_url), ("source_url", src_url), ("official_page_url", off_url)]:
            if u and not u.startswith("/api/v1/"):
                url_entries.append(("Notice", n_id, title, field, u))

    # 2. Academic Resources
    cur.execute("SELECT id, title, download_url, document_url, source_url, file_url FROM academic_resources")
    for row in cur.fetchall():
        r_id, title, dl_url, doc_url, src_url, file_url = row
        for field, u in [("document_url", doc_url), ("source_url", src_url), ("file_url", file_url)]:
            if u and not u.startswith("/api/v1/"):
                url_entries.append(("Resource", r_id, title, field, u))

    # 3. Clubs
    cur.execute("SELECT id, name, official_page_url, directory_url FROM clubs")
    for row in cur.fetchall():
        c_id, name, off_url, dir_url = row
        for field, u in [("official_page_url", off_url), ("directory_url", dir_url)]:
            if u and not u.startswith("/api/v1/"):
                url_entries.append(("Club", c_id, name, field, u))

    # Unique URLs
    unique_urls = {}
    for entry in url_entries:
        u = entry[4]
        if u not in unique_urls:
            unique_urls[u] = []
        unique_urls[u].append(entry)

    print(f"Total URL references in DB: {len(url_entries)}")
    print(f"Total Unique URLs to probe: {len(unique_urls)}")
    print("-" * 80)

    results = {}
    for u in unique_urls:
        print(f"\nProbing: {u}")
        res = test_url(u)
        results[u] = res
        print(f"  --> Status: {res['status']} | Code: {res['code']}")
        if res.get('final_url') != u:
            print(f"  --> Redirected To: {res['final_url']}")
        if res.get('content_type'):
            print(f"  --> Content-Type: {res['content_type']}")
        if res.get('error'):
            print(f"  --> Error: {res['error']}")

    print("\n" + "=" * 80)
    print("DETAILED RESULTS BY ENTITY:")
    print("=" * 80)
    for entity_type, e_id, name, field, u in url_entries:
        res = results[u]
        status = res['status']
        print(f"[{entity_type} {e_id}] {name[:35]} | {field}:")
        print(f"   URL: {u}")
        print(f"   Result: {status} (Code {res.get('code')}) | Final: {res.get('final_url')}")

if __name__ == "__main__":
    run_url_audit()

