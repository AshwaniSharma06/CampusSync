import sqlite3
import json
import re

with open('eca_latest_circulars.json', 'r', encoding='utf-8') as f:
    latest = json.load(f)

def norm(t):
    return re.sub(r'[^a-zA-Z0-9]', '', (t or '').lower())

# Build title -> PDF mapping from authentic ECA data
title_to_pdf = {}
for item in latest:
    t = item.get('title', '')
    content = item.get('content', '')
    ct = item.get('contentType', '')
    if t and content:
        if ct == 'pdf' or content.lower().endswith('.pdf'):
            clean_path = content.replace('../', '').replace('./', '').lstrip('/')
            clean_path = re.sub(r'^[Cc]ontent/', 'Content/', clean_path)
            title_to_pdf[norm(t)] = f"https://www.ecajmer.ac.in/{clean_path}"
        elif ct == 'link' or content.startswith('http'):
            title_to_pdf[norm(t)] = content

print(f"Loaded {len(title_to_pdf)} authentic title-to-PDF mappings from official ECA data.")

for db_path in ['campussync.db', 'backend/campussync.db']:
    print(f"\nProcessing database: {db_path}...")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # 1. Deactivate demo seed notices (IDs 1-12 and any DEMO_SEED)
    c.execute("""
        UPDATE notices 
        SET is_active = 0 
        WHERE id <= 12 OR data_origin = 'DEMO_SEED'
    """)
    print("Deactivated demo seed notices (IDs 1-12).")

    # 2. Fix mismatched notices where document_url belonged to another notice
    mismatched_ids = [649, 722, 837, 846, 849, 852, 883, 902, 904, 905, 951, 956, 965]
    for mid in mismatched_ids:
        c.execute("UPDATE notices SET document_url = NULL WHERE id = ?", (mid,))
    print(f"Cleared mismatched document_urls for {len(mismatched_ids)} legacy entries.")

    # 3. For all active authentic notices, match strictly by title
    c.execute("SELECT id, title, document_url FROM notices WHERE is_active = 1")
    rows = c.fetchall()
    
    updated_count = 0
    for nid, title, current_doc in rows:
        ntitle = norm(title)
        if ntitle in title_to_pdf:
            real_doc = title_to_pdf[ntitle]
            if current_doc != real_doc:
                c.execute("UPDATE notices SET document_url = ? WHERE id = ?", (real_doc, nid))
                updated_count += 1

    print(f"Updated {updated_count} notices to their exact, official PDF from ECA.")
    conn.commit()

    # Verify counts
    c.execute("SELECT COUNT(*) FROM notices WHERE is_active = 1")
    active_count = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM notices WHERE is_active = 1 AND document_url LIKE '%.pdf%'")
    pdf_count = c.fetchone()[0]
    print(f"Active authentic notices in {db_path}: {active_count}")
    print(f"Notices with direct authentic PDFs: {pdf_count}")
    conn.close()

# 4. Regenerate noticePdfMap.json with ONLY authentic active notices
conn = sqlite3.connect('campussync.db')
c = conn.cursor()
c.execute("SELECT id, title, document_url FROM notices WHERE is_active = 1 AND document_url IS NOT NULL AND document_url != ''")
rows = c.fetchall()
conn.close()

pdf_map = {}
for nid, title, doc_url in rows:
    pdf_map[str(nid)] = doc_url
    norm_t = norm(title)
    if norm_t:
        pdf_map[norm_t] = doc_url

with open('src/services/noticePdfMap.json', 'w', encoding='utf-8') as f:
    json.dump(pdf_map, f, indent=2)

print(f"\nRegenerated src/services/noticePdfMap.json with {len(pdf_map)} authentic mappings (0 demo seeds).")
