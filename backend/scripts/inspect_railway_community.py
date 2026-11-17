import urllib.request
import json

login_data = json.dumps({'email': 'student@ecajmer.ac.in', 'password': 'password123'}).encode()
req = urllib.request.Request(
    'https://campussync-production-4593.up.railway.app/api/v1/auth/login',
    data=login_data,
    headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'}
)
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        token = json.loads(resp.read().decode())['access_token']
        print('Got token from Railway')
        
        req2 = urllib.request.Request(
            'https://campussync-production-4593.up.railway.app/api/v1/community/',
            headers={'Authorization': f'Bearer {token}', 'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req2, timeout=10) as resp2:
            posts = json.loads(resp2.read().decode())
            print(f'Railway returned {len(posts)} posts')
            for p in posts:
                print(f"Post #{p.get('id')} by {p.get('author_name')}: {p.get('content')} | Attachments: {len(p.get('attachments', []))} | Comments: {p.get('comments_count')}")
                for a in p.get('attachments', []):
                    print(f"   Attachment: {a}")
except Exception as e:
    print('Error:', e)
