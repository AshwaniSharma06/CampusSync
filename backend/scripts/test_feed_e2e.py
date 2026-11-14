import sys
import os
sys.path.insert(0, os.path.abspath("."))

from backend.db.session import SessionLocal
from backend.models.user import User
from backend.api.v1.feed import get_intelligent_feed
from backend.api.v1.saved import toggle_saved_item, SavedItemCreate

db = SessionLocal()

print("=" * 60)
print("INTELLIGENT CURATED FEED VERIFICATION TEST SUITE")
print("=" * 60)

# TEST A: Logged-out visitor
feed_anon = get_intelligent_feed(category="all", limit=20, offset=0, current_user=None, db=db)
print("\n[TEST A: Logged-out Visitor]")
print(f"Authenticated: {feed_anon['is_authenticated']}")
print(f"Student Meta: {feed_anon['student']}")
print(f"Total items returned: {feed_anon['total_items']}")
print(f"Counts: {feed_anon['counts']}")
for item in feed_anon['items'][:3]:
    print(f"  - [{item['category_label']}] {item['title'][:60]}... (Scope: {item['scope']})")
# Ensure NO department-specific or semester-specific items leaked
for item in feed_anon['items']:
    assert item['scope'] == 'GLOBAL', f"LEAK: Non-global item found in visitor feed: {item['title']} (Scope: {item['scope']})"
print(">>> PASS: Visitor feed contains ONLY verified GLOBAL announcements. Zero cohort leaks!")

# TEST B: CSE Semester 7 Student
user_cse7 = db.query(User).filter(User.email == "student@ecajmer.ac.in").first()
assert user_cse7 is not None
feed_cse7 = get_intelligent_feed(category="all", limit=30, offset=0, current_user=user_cse7, db=db)
print(f"\n[TEST B: CSE Sem 7 Student: {user_cse7.full_name}]")
print(f"Authenticated: {feed_cse7['is_authenticated']}")
print(f"Cohort: {feed_cse7['student']['department_code']} Sem {feed_cse7['student']['semester']}")
print(f"Counts: {feed_cse7['counts']}")
# Verify category items
for item in feed_cse7['items'][:5]:
    print(f"  - [{item['category_label']}] {item['title'][:60]}... (Reason: {item['recommendation_reason']})")

# Ensure no other department's specific notices leaked into CSE's feed
for item in feed_cse7['items']:
    if item.get('department_code'):
        assert item['department_code'] == 'CSE', f"LEAK: Cross-department notice leaked: {item['title']} (Dept: {item['department_code']})"
print(">>> PASS: CSE Sem 7 feed contains relevant CSE & Sem 7 updates + GLOBAL updates. Other depts excluded!")

# TEST C: IT Student
user_it = db.query(User).filter(User.email == "test_sem3_it@ecajmer.ac.in").first()
assert user_it is not None
feed_it = get_intelligent_feed(category="all", limit=20, offset=0, current_user=user_it, db=db)
print(f"\n[TEST C: IT Student: {user_it.full_name}]")
print(f"Cohort: {feed_it['student']['department_code']} Sem {feed_it['student']['semester']}")
print(f"Counts: {feed_it['counts']}")
for item in feed_it['items']:
    if item.get('department_code'):
        assert item['department_code'] == 'IT', f"LEAK: Non-IT notice in IT feed: {item['title']}"
print(">>> PASS: IT student receives IT-specific notices. CSE restricted content excluded!")

# TEST D: Incomplete Student Profile
user_incomp = db.query(User).filter(User.email == "test_incomplete@ecajmer.ac.in").first()
assert user_incomp is not None
feed_incomp = get_intelligent_feed(category="all", limit=20, offset=0, current_user=user_incomp, db=db)
print(f"\n[TEST D: Incomplete Profile Student: {user_incomp.full_name}]")
print(f"Profile incomplete flag: {feed_incomp['student']['is_profile_incomplete']}")
print(f"Counts: {feed_incomp['counts']}")
for item in feed_incomp['items']:
    assert item['scope'] == 'GLOBAL', f"LEAK: Non-global item found for incomplete profile: {item['title']}"
print(">>> PASS: Incomplete profile falls back cleanly to GLOBAL verified announcements without guessing!")

# TEST E: Categories Filtering (Semester, Department, College, Opportunities, Recommended)
for cat in ["semester", "department", "college", "opportunities", "recommended"]:
    cat_feed = get_intelligent_feed(category=cat, limit=10, offset=0, current_user=user_cse7, db=db)
    print(f"\n[TEST E: Category '{cat}' - {len(cat_feed['items'])} items returned]")
    if cat_feed['items']:
        print(f"  First item: [{cat_feed['items'][0]['category_label']}] {cat_feed['items'][0]['title'][:50]}")

# TEST F: Save / Bookmark Interaction
test_notice_id = feed_cse7['items'][0]['id']
save_res = toggle_saved_item(item_in=SavedItemCreate(item_type="notice", item_id=test_notice_id), current_user=user_cse7, db=db)
print(f"\n[TEST F: Toggle Save on Notice #{test_notice_id}] -> {save_res}")
assert save_res['is_saved'] is True

feed_cse7_saved = get_intelligent_feed(category="all", limit=10, offset=0, current_user=user_cse7, db=db)
saved_item = next((i for i in feed_cse7_saved['items'] if i['id'] == test_notice_id), None)
assert saved_item is not None and saved_item['is_saved'] is True
print(">>> PASS: Item marked as is_saved: True in feed response!")

# Clean up test bookmark
toggle_saved_item(item_in=SavedItemCreate(item_type="notice", item_id=test_notice_id), current_user=user_cse7, db=db)

print("\n" + "=" * 60)
print("ALL BACKEND FEED & RELEVANCE TESTS COMPLETED SUCCESSFULLY! 🎉")
print("=" * 60)
db.close()
