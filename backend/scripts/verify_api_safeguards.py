"""
Verifies live API responses for Notice and Resource authenticity fields.
"""
import urllib.request
import json
import sys
import io
import os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, os.path.abspath("."))

from backend.core.security import create_access_token

token = create_access_token(subject=1)
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

print('1. Testing GET /api/v1/resources/')
req = urllib.request.Request('http://127.0.0.1:8000/api/v1/resources/', headers=headers)
with urllib.request.urlopen(req) as r:
    items = json.loads(r.read().decode())
    for item in items:
        r_id = item['id']
        title = item['title'][:38]
        origin = item.get('data_origin')
        status = item.get('verification_status')
        dest = item.get('destination_type')
        print(f"   Resource #{r_id}: {title} | origin={origin} | status={status} | dest={dest}")

print('\n2. Testing GET /api/v1/notices/')
req2 = urllib.request.Request('http://127.0.0.1:8000/api/v1/notices/', headers=headers)
with urllib.request.urlopen(req2) as r2:
    notices = json.loads(r2.read().decode())
    for n in notices:
        n_id = n['id']
        title = n['title'][:38]
        origin = n.get('data_origin')
        status = n.get('verification_status')
        dest = n.get('destination_type')
        print(f"   Notice #{n_id}: {title} | origin={origin} | status={status} | dest={dest}")
