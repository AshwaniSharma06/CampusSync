import sqlite3
import json
import re

with open('eca_latest_circulars.json', 'r', encoding='utf-8') as f:
    latest = json.load(f)

def norm(t):
    return re.sub(r'[^a-zA-Z0-9]', '', (t or '').lower())

pdf_to_official_title = {}
for item in latest:
    content = item.get('content', '')
    if content:
        fname = content.replace('../', '').replace('./', '').split('/')[-1]
        pdf_to_official_title[norm(fname)] = (item.get('title'), content)

conn = sqlite3.connect('campussync.db')
c = conn.cursor()
c.execute('SELECT id, title, document_url, data_origin, is_active FROM notices WHERE is_active = 1')
rows = c.fetchall()

mismatches = []
demo_seeds = []
matches = 0

for nid, title, doc_url, origin, is_active in rows:
    if nid <= 12 or origin == 'DEMO_SEED':
        demo_seeds.append((nid, title, doc_url))
        continue

    if not doc_url:
        continue

    fname = doc_url.split('/')[-1]
    norm_fn = norm(fname)

    if norm_fn in pdf_to_official_title:
        real_title, real_content = pdf_to_official_title[norm_fn]
        t1 = norm(title)
        t2 = norm(real_title)
        if t1[:20] != t2[:20] and t1 not in t2 and t2 not in t1:
            mismatches.append((nid, title, real_title, fname))
        else:
            matches += 1

print(f"Total active notices: {len(rows)}")
print(f"Demo seed notices (IDs <= 12): {len(demo_seeds)}")
print(f"Exact/Close matches with ECA official title: {matches}")
print(f"Mismatches found in scraped data: {len(mismatches)}")

if demo_seeds:
    print("\n--- DEMO SEED NOTICES (THE CULPRITS IN USER SCREENSHOT!) ---")
    for nid, t, u in demo_seeds:
        print(f"ID {nid:2d}: '{t}'")
        print(f"       Doc: {u}")

if mismatches:
    print("\n--- SAMPLE MISMATCHES IN SCRAPED DATA ---")
    for nid, t, rt, fn in mismatches[:10]:
        print(f"ID {nid}:")
        print(f"   DB Title:       {t}")
        print(f"   Official Title: {rt}")
        print(f"   File:           {fn}")

conn.close()
