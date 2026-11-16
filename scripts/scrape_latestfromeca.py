import urllib.request
import re
import json

def find_endpoints():
    req = urllib.request.Request(
        'https://www.ecajmer.ac.in/assets/index-B9fG-erQ.js',
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    data = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
    
    # Search for latestfromeca
    for m in re.finditer(r'latestfromeca', data, re.I):
        idx = m.start()
        print("Match at", idx)
        print(data[max(0, idx-300):min(len(data), idx+500)])
        print("="*60)

    # Search for api base url
    apis = set(re.findall(r'https?://[a-zA-Z0-9_.-]+(?::\d+)?(?:/api/[a-zA-Z0-9_/.-]+)?', data))
    print("Found APIs/URLs in bundle:")
    for a in apis:
        if 'ecajmer' in a or 'api' in a:
            print(" -", a)

if __name__ == '__main__':
    find_endpoints()

