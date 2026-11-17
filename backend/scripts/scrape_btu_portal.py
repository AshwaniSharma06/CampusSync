import urllib.request
import json

req = urllib.request.Request('https://api.btu.ac.in/v1/document/getDocuments', headers={'User-Agent': 'Mozilla/5.0'})
docs = json.loads(urllib.request.urlopen(req).read()).get('RESPONSE', [])
mtech = [d for d in docs if (d.get('category', {}) or {}).get('name') == 'M.Tech']

for d in mtech:
    p = d.get("docPath")
    u = f"https://blr1.digitaloceanspaces.com/btu/{p}"
    r = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(r, timeout=5) as resp:
            print("✓ 200 OK:", d.get("title"))
    except Exception as e:
        print("✗ Inaccessible:", d.get("title"), "->", e)
