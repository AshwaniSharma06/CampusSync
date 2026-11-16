import sqlite3
from urllib.parse import urlparse
from collections import Counter

conn = sqlite3.connect('campussync.db')
c = conn.cursor()

c.execute("SELECT id, title, document_url, official_page_url, source_url, download_url FROM notices WHERE is_active = 1")
rows = c.fetchall()

domains = Counter()
paths = []

for r in rows:
    nid, title, doc, page, src, dl = r
    for u in [doc, page, src, dl]:
        if u:
            try:
                p = urlparse(u)
                domains[p.netloc] += 1
                if p.netloc == 'www.ecajmer.ac.in' or p.netloc == 'ecajmer.ac.in':
                    path_prefix = '/' + p.path.strip('/').split('/')[0] if p.path.strip('/') else '/'
                    paths.append(path_prefix)
            except:
                pass

print("Domains found:", domains.most_common(10))
print("ECA path prefixes:", Counter(paths).most_common(20))

