"""
Inspect field structure of circulars and announcements.
"""
import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json"
}

def get_json(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8", errors="ignore"))

circ = get_json("https://www.ecajmer.ac.in/api/circulars/public/all?page=1&limit=2")
print("=== CIRCULAR ITEM SAMPLE ===")
print(json.dumps(circ["data"][0], indent=2))

ann = get_json("https://www.ecajmer.ac.in/api/announcements/public/all/?page=1&limit=2")
print("\n=== ANNOUNCEMENT ITEM SAMPLE ===")
print(json.dumps(ann["data"][0], indent=2))

