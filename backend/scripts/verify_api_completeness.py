import urllib.request, json, ssl, sqlite3

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

conn = sqlite3.connect("campussync.db")
c = conn.cursor()

# Get all titles and content hashes from database
db_hashes = set(r[0] for r in c.execute("SELECT content_hash FROM notices WHERE content_hash IS NOT NULL").fetchall())
db_titles = set(r[0].strip().lower() for r in c.execute("SELECT title FROM notices").fetchall())

print(f"Total notices in DB: {len(db_titles)}")
print(f"Total content hashes in DB: {len(db_hashes)}")

# 1. Inspect Circulars pages
total_circ_items = 0
circ_pages_inspected = 0
circ_in_db = 0
for p in range(1, 15):
    url = f"https://www.ecajmer.ac.in/api/circulars/public/all?page={p}&limit=50"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            data = json.loads(resp.read())
            items = data.get("data", [])
            if not items:
                print(f"Circulars page {p} returned 0 items. Stopping.")
                break
            circ_pages_inspected += 1
            total_circ_items += len(items)
            for it in items:
                t = (it.get("title") or "").strip().lower()
                if t in db_titles:
                    circ_in_db += 1
            pagination = data.get("pagination", {})
            if p >= pagination.get("totalPages", 1):
                print(f"Reached circulars totalPages={pagination.get('totalPages')}. Total items fetched: {total_circ_items}")
                break
    except Exception as e:
        print(f"Error on circulars page {p}: {e}")
        break

print(f"Circulars: {circ_pages_inspected} pages, {total_circ_items} items fetched from API. Matched in DB: {circ_in_db}/{total_circ_items}")

# 2. Inspect Announcements pages
total_ann_items = 0
ann_pages_inspected = 0
ann_in_db = 0
for p in range(1, 15):
    url = f"https://www.ecajmer.ac.in/api/announcements/public/all/?page={p}&limit=50"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            data = json.loads(resp.read())
            items = data.get("data", [])
            if not items:
                print(f"Announcements page {p} returned 0 items. Stopping.")
                break
            ann_pages_inspected += 1
            total_ann_items += len(items)
            for it in items:
                t = (it.get("announcement") or it.get("additionalDetail") or "").strip().lower()
                if t in db_titles:
                    ann_in_db += 1
            pagination = data.get("pagination", {})
            if p >= pagination.get("totalPages", 1):
                print(f"Reached announcements totalPages={pagination.get('totalPages')}. Total items fetched: {total_ann_items}")
                break
    except Exception as e:
        print(f"Error on announcements page {p}: {e}")
        break

print(f"Announcements: {ann_pages_inspected} pages, {total_ann_items} items fetched from API. Matched in DB: {ann_in_db}/{total_ann_items}")

