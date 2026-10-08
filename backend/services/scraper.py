import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from datetime import datetime

from backend.models.academic import Notice, NoticeType

# Mock source URLs for demonstration purposes
SOURCES = [
    "https://example.com/btu-notices",
    "https://example.com/eca-announcements"
]

def scrape_btu_notices(db: Session):
    """
    Scrapes official BTU/college pages for notices.
    This is a demonstration script simulating scraping with BeautifulSoup.
    """
    scraped_count = 0
    
    # In a real scenario, we would iterate over SOURCES and parse actual HTML.
    # Here, we mock the scraped data array that would come from BeautifulSoup.
    mock_scraped_data = [
        {
            "title": "Semester 7 Practical Examination Dates",
            "content": "The practical examinations for Semester 7 will commence from next Monday.",
            "source_url": "https://example.com/btu-notices/practical-exams-sem7",
            "notice_type": NoticeType.official,
            "published_date": datetime.utcnow()
        },
        {
            "title": "Hackathon Registrations Open",
            "content": "Register your team for the upcoming college hackathon.",
            "source_url": "https://example.com/eca-announcements/hackathon-2026",
            "notice_type": NoticeType.events,
            "published_date": datetime.utcnow()
        },
        {
            "title": "Department Faculty Meeting Minutes",
            "content": "Summary of the latest faculty meeting regarding the curriculum.",
            "source_url": "https://example.com/eca-announcements/faculty-meeting",
            "notice_type": NoticeType.department,
            "published_date": datetime.utcnow()
        }
    ]
    
    for item in mock_scraped_data:
        # Check for duplicates based on source_url
        existing_notice = db.query(Notice).filter(Notice.source_url == item["source_url"]).first()
        
        if not existing_notice:
            # If not duplicate, add to db
            new_notice = Notice(
                title=item["title"],
                content=item["content"],
                source_url=item["source_url"],
                notice_type=item["notice_type"],
                published_date=item["published_date"]
            )
            db.add(new_notice)
            scraped_count += 1
            
    if scraped_count > 0:
        db.commit()
        
    return scraped_count
