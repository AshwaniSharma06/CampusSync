import sqlite3
import json
import re
from collections import defaultdict
from urllib.parse import unquote

with open('eca_latest_circulars.json', 'r', encoding='utf-8') as f:
    latest = json.load(f)

def norm(t):
    return re.sub(r'[^a-zA-Z0-9]', '', (t or '').lower())

# Build mapping of official circulars
official_by_title = {}
official_by_file = {}
for item in latest:
    t = item.get('title', '')
    content = item.get('content', '')
    if t and content:
        fname = content.replace('../', '').replace('./', '').split('/')[-1]
        official_by_title[norm(t)] = item
        official_by_file[norm(fname)] = item

conn = sqlite3.connect('campussync.db')
c = conn.cursor()
c.execute("""
    SELECT id, title, document_url, official_page_url, source_url 
    FROM notices 
    WHERE is_active = 1 AND id > 12
    ORDER BY id ASC
""")
rows = c.fetchall()

print(f"Total active notices to audit: {len(rows)}")

# 1. Check for duplicate document_urls pointing to different titles
url_to_notices = defaultdict(list)
for nid, title, doc_url, page_url, src_url in rows:
    if doc_url:
        url_to_notices[doc_url].append((nid, title))

suspicious_duplicates = []
for url, notices in url_to_notices.items():
    if len(notices) > 1:
        # Check if titles are different
        unique_titles = {norm(t) for _, t in notices}
        if len(unique_titles) > 1:
            suspicious_duplicates.append((url, notices))

print(f"\n--- 1. DUPLICATE PDF ATTACHMENTS ACROSS DIFFERENT TITLES ({len(suspicious_duplicates)}) ---")
for url, notices in suspicious_duplicates[:15]:
    fname = unquote(url.split('/')[-1])
    print(f"\nURL: .../{fname[:60]}")
    for nid, t in notices:
        print(f"   ID {nid:3d}: {t[:65]}")

# 2. Check for title-to-filename mismatches
mismatches = []
for nid, title, doc_url, page_url, src_url in rows:
    if not doc_url:
        continue
    fname = unquote(doc_url.split('/')[-1])
    norm_fn = norm(fname)

    # If the file belongs to an official circular in latest
    if norm_fn in official_by_file:
        official_item = official_by_file[norm_fn]
        off_title = official_item.get('title', '')
        t1 = norm(title)
        t2 = norm(off_title)
        if t1[:20] != t2[:20] and t1 not in t2 and t2 not in t1:
            mismatches.append((nid, title, off_title, fname))

print(f"\n--- 2. TITLE TO OFFICIAL PDF MISMATCHES ({len(mismatches)}) ---")
for nid, t, off_t, fn in mismatches[:15]:
    print(f"\nID {nid:3d}:")
    print(f"   Notice Title:   {t}")
    print(f"   Official Title: {off_t}")
    print(f"   File Attached:  {fn[:50]}")

conn.close()

