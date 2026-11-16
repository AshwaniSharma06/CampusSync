import sqlite3, json, re

with open('eca_latest_circulars.json', 'r', encoding='utf-8') as f:
    latest = json.load(f)

def norm(t):
    return re.sub(r'[^a-zA-Z0-9]', '', (t or '').lower())

title_to_pdf = {norm(i.get('title')): i for i in latest}

conn = sqlite3.connect('campussync.db')
c = conn.cursor()
c.execute("""
    SELECT id, title, official_page_url, source_url 
    FROM notices 
    WHERE is_active = 1 AND id > 12 AND (document_url IS NULL OR document_url = '')
""")
rows = c.fetchall()

print(f"Total active notices without direct document_url: {len(rows)}")
can_fill = []
cannot_fill = []
for nid, title, off_url, src_url in rows:
    ntitle = norm(title)
    if ntitle in title_to_pdf:
        can_fill.append((nid, title, title_to_pdf[ntitle]))
    else:
        cannot_fill.append((nid, title))

print(f"Can fill from ECA API: {len(can_fill)}")
for nid, t, itm in can_fill:
    print(f"  Fill ID {nid}: {t} -> {itm.get('content')}")

print(f"Without ECA API match (historical announcements/videos): {len(cannot_fill)}")
for nid, t in cannot_fill[:10]:
    print(f"  ID {nid}: {t}")

conn.close()

