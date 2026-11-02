"""
Official Source Registry for Engineering College Ajmer (ECA) & University Portals.
Defines verified endpoints, allowed domains, crawling policies, and rate limits.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime

class OfficialSource:
    def __init__(
        self,
        source_id: str,
        name: str,
        base_url: str,
        endpoint: str,
        allowed_domains: List[str],
        category: str,
        enabled: bool = True,
        rate_limit_delay_seconds: float = 1.0,
        timeout_seconds: int = 15,
        headers: Optional[Dict[str, str]] = None
    ):
        self.source_id = source_id
        self.name = name
        self.base_url = base_url.rstrip("/")
        self.endpoint = endpoint
        self.allowed_domains = allowed_domains
        self.category = category
        self.enabled = enabled
        self.rate_limit_delay_seconds = rate_limit_delay_seconds
        self.timeout_seconds = timeout_seconds
        self.headers = headers or {
            "User-Agent": "CampusSync-DataBot/1.0 (+https://campussync.ecajmer.ac.in/bot)"
        }
        self.last_scraped_at: Optional[datetime] = None

    @property
    def full_url(self) -> str:
        return f"{self.base_url}{self.endpoint}"

    def is_url_allowed(self, target_url: str) -> bool:
        """Enforces domain boundary checks to prevent crawling unverified external sites."""
        target_lower = target_url.lower()
        return any(domain.lower() in target_lower for domain in self.allowed_domains)

# Configurable registry of official college and university portals
OFFICIAL_SOURCES: Dict[str, OfficialSource] = {
    "eca_hero_circulars": OfficialSource(
        source_id="eca_hero_circulars",
        name="ECA Official Circulars & Urgent Examination Notices",
        base_url="https://www.ecajmer.ac.in",
        endpoint="/api/circulars/public/notice-bar/hero",
        allowed_domains=["ecajmer.ac.in", "www.ecajmer.ac.in"],
        category="EXAMINATION_AND_CIRCULARS",
        enabled=True,
        rate_limit_delay_seconds=1.5,
        timeout_seconds=15
    ),
    "eca_public_announcements": OfficialSource(
        source_id="eca_public_announcements",
        name="ECA Department Announcements & Notices",
        base_url="https://www.ecajmer.ac.in",
        endpoint="/api/announcements/public/all/",
        allowed_domains=["ecajmer.ac.in", "www.ecajmer.ac.in"],
        category="DEPARTMENT_ANNOUNCEMENTS",
        enabled=True,
        rate_limit_delay_seconds=1.5,
        timeout_seconds=15
    )
}

def get_source(source_id: str) -> Optional[OfficialSource]:
    return OFFICIAL_SOURCES.get(source_id)

def get_all_active_sources() -> List[OfficialSource]:
    return [s for s in OFFICIAL_SOURCES.values() if s.enabled]
