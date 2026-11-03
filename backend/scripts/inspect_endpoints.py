"""
Inspect ECA pagination, query parameters, available years, departments, and categories.
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

# 1. Test pagination on /api/circulars/public/all
data_p1 = get_json("https://www.ecajmer.ac.in/api/circulars/public/all")
print("=== /api/circulars/public/all ===")
print("Available Years:", data_p1.get("availableYears"))
print("Pagination info:", data_p1.get("pagination"))
print("Items count on page 1:", len(data_p1.get("data", [])))

# Test page 2
data_p2 = get_json("https://www.ecajmer.ac.in/api/circulars/public/all?page=2")
print("Items count on page 2:", len(data_p2.get("data", [])))
print("Page 2 sample title:", data_p2.get("data", [{}])[0].get("title"))

# Test limit parameter
data_lim = get_json("https://www.ecajmer.ac.in/api/circulars/public/all?page=1&limit=50")
print("Items count with limit=50:", len(data_lim.get("data", [])))

# 2. Test /api/announcements/public/all/
data_ann = get_json("https://www.ecajmer.ac.in/api/announcements/public/all/")
print("\n=== /api/announcements/public/all/ ===")
print("Pagination info:", data_ann.get("pagination"))
print("Items count on page 1:", len(data_ann.get("data", [])))
data_ann_p2 = get_json("https://www.ecajmer.ac.in/api/announcements/public/all/?page=2")
print("Items count on page 2:", len(data_ann_p2.get("data", [])))
print("Page 2 sample title:", data_ann_p2.get("data", [{}])[0].get("announcement"))

# 3. Discover additional API endpoints (departments, faculty, courses, events, etc.)
additional_endpoints = [
    "/api/departments",
    "/api/departments/public",
    "/api/department/public/all",
    "/api/faculty/public/all",
    "/api/events/public/all",
    "/api/categories/public/all",
    "/api/cells/public/all",
    "/api/downloads/public/all",
    "/api/courses/public/all",
    "/api/circulars/categories",
]

print("\n=== Probing Additional API Endpoints ===")
for ep in additional_endpoints:
    url = f"https://www.ecajmer.ac.in{ep}"
    try:
        res = get_json(url)
        print(f"[FOUND] {ep} -> Type: {type(res).__name__} | Keys: {list(res.keys()) if isinstance(res, dict) else len(res)}")
        if isinstance(res, dict) and "data" in res:
            print(f"        Items in data: {len(res['data'])}")
    except Exception as e:
        print(f"[404/ERR] {ep}: {e}")

