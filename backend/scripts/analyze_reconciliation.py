import sqlite3

conn = sqlite3.connect("campussync.db")
c = conn.cursor()

print("--- Data Origin breakdown in notices ---")
for r in c.execute("SELECT data_origin, COUNT(*) FROM notices GROUP BY data_origin").fetchall():
    print(r)

print("\n--- Source URLs breakdown in notices ---")
for r in c.execute("SELECT CASE WHEN source_url LIKE '%circulars%' THEN 'circulars' WHEN source_url LIKE '%announcements%' THEN 'announcements' WHEN source_url LIKE '%hero%' THEN 'hero' ELSE 'other' END, COUNT(*) FROM notices GROUP BY 1").fetchall():
    print(r)

print("\n--- Notice Type breakdown ---")
for r in c.execute("SELECT notice_type, COUNT(*) FROM notices GROUP BY notice_type").fetchall():
    print(r)

print("\n--- Overlap Analysis between Circulars and Announcements ---")
# Check if any titles from circulars match titles from announcements
circ_titles = set(r[0].strip().lower() for r in c.execute("SELECT title FROM notices WHERE source_url LIKE '%circulars%'").fetchall())
ann_titles = set(r[0].strip().lower() for r in c.execute("SELECT title FROM notices WHERE source_url LIKE '%announcements%'").fetchall())
overlap = circ_titles.intersection(ann_titles)
print(f"Circulars unique titles: {len(circ_titles)}")
print(f"Announcements unique titles: {len(ann_titles)}")
print(f"Exact title overlaps between circulars and announcements: {len(overlap)}")
if overlap:
    print("Sample overlaps:", list(overlap)[:5])

