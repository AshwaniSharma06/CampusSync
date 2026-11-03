"""
ECA Website & BTU Official Source Discovery Script.
Inspects https://www.ecajmer.ac.in and discovers available API endpoints, HTML sections, and notices.
"""

import urllib.request
import urllib.error
import json
import re
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/html, application/xhtml+xml, */*"
}

def probe_url(url):
    print(f"\n[Probing] {url}")
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            content_type = resp.headers.get("Content-Type", "")
            raw = resp.read()
            print(f"  --> Status: {resp.status} | Content-Type: {content_type} | Length: {len(raw)} bytes")
            if "application/json" in content_type:
                try:
                    data = json.loads(raw.decode("utf-8", errors="ignore"))
                    if isinstance(data, dict):
                        print(f"  --> JSON Keys: {list(data.keys())}")
                        if "data" in data and isinstance(data["data"], list):
                            print(f"  --> Items in 'data': {len(data['data'])}")
                            if data["data"]:
                                print(f"  --> Sample item keys: {list(data['data'][0].keys())}")
                                print(f"  --> Sample title: {data['data'][0].get('title') or data['data'][0].get('announcement')}")
                    elif isinstance(data, list):
                        print(f"  --> JSON List length: {len(data)}")
                except Exception as e:
                    print(f"  --> JSON parse error: {e}")
            elif "text/html" in content_type:
                text = raw.decode("utf-8", errors="ignore")
                title_match = re.search(r'<title>(.*?)</title>', text, re.IGNORECASE)
                if title_match:
                    print(f"  --> Page Title: {title_match.group(1).strip()}")
                # Find all links matching circulars, notices, departments, downloads
                links = set(re.findall(r'href=[\'"]([^\'"#\s>]+)[\'"]', text))
                interesting = [l for l in links if any(k in l.lower() for k in ['notice', 'circular', 'order', 'academic', 'exam', 'department', 'download', 'syllabus', 'time-table', 'event', 'club', 'faculty'])]
                print(f"  --> Found {len(links)} total links, {len(interesting)} interesting links")
                for l in list(interesting)[:15]:
                    print(f"      * {l}")
            return True, len(raw)
    except urllib.error.HTTPError as e:
        print(f"  --> HTTP Error: {e.code} ({e.reason})")
        return False, e.code
    except Exception as e:
        print(f"  --> Network/Connection Error: {e}")
        return False, str(e)

if __name__ == "__main__":
    targets = [
        "https://www.ecajmer.ac.in",
        "https://www.ecajmer.ac.in/api/circulars/public/notice-bar/hero",
        "https://www.ecajmer.ac.in/api/announcements/public/all/",
        "https://www.ecajmer.ac.in/api/circulars/public/all",
        "https://www.ecajmer.ac.in/api/circulars",
        "https://www.ecajmer.ac.in/circulars",
        "https://www.ecajmer.ac.in/notices",
        "https://www.ecajmer.ac.in/departments",
        "https://www.ecajmer.ac.in/academics/academic-calendar",
        "https://www.ecajmer.ac.in/examination",
        "https://www.ecajmer.ac.in/facilities/sac",
        "https://www.ecajmer.ac.in/events",
        "https://btu.ac.in/home/Examination-Notification",
    ]
    for t in targets:
        probe_url(t)

