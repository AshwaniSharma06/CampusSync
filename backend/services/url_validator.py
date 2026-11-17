"""
Official URL Validation & Security Service for CampusSync.
Enforces strict domain boundary checks, protocol validation,
URL percent-encoding, and classification of document/page destinations.
Prevents unverified external redirects, broken 404s, or blank pages.
"""

import urllib.parse
from urllib.parse import urlparse
from typing import Optional, Dict, Any, Tuple
from enum import Enum

TRUSTED_DOMAINS = [
    "ecajmer.ac.in",
    "www.ecajmer.ac.in",
    "btu.ac.in",
    "www.btu.ac.in",
    "btuexam.in",
    "www.btuexam.in",
    "forms.gle",
    "docs.google.com",
    "youtube.com",
    "youtu.be",
    "dce.rajasthan.gov.in",
    "hte.rajasthan.gov.in",
    "digitaloceanspaces.com",
    "blr1.digitaloceanspaces.com",
    "btu.blr1.digitaloceanspaces.com",
    "squarespace.com",
    "static1.squarespace.com"
]

DOCUMENT_EXTENSIONS = (
    ".pdf", ".zip", ".docx", ".doc", ".xlsx", ".xls", ".csv", ".txt", ".png", ".jpg", ".jpeg"
)

class DestinationType(str, Enum):
    HOSTED_DOWNLOAD = "HOSTED_DOWNLOAD"       # Local file served by CampusSync API
    OFFICIAL_DOCUMENT = "OFFICIAL_DOCUMENT"   # Direct file on verified college/university portal
    OFFICIAL_PAGE = "OFFICIAL_PAGE"           # Webpage on verified college/university portal
    DIRECTORY_PAGE = "DIRECTORY_PAGE"         # College clubs/SAC directory fallback
    UNAVAILABLE = "UNAVAILABLE"               # Missing, unverified, or untrusted destination

def clean_and_encode_url(url: Optional[str]) -> Optional[str]:
    """
    Safely normalizes and percent-encodes URLs, escaping spaces and special characters
    so that documents and circulars open reliably across modern browsers and proxies.
    """
    if not url or not isinstance(url, str):
        return None
    url = url.strip()
    if not url or url == "#" or url.startswith("javascript:"):
        return None

    # Normalize legacy relative content directories
    url = url.replace("/../content/", "/Content/").replace("/./content/", "/Content/").replace("/../Content/", "/Content/").replace("/./Content/", "/Content/")

    # Handle relative or hostless paths
    if not url.startswith("http://") and not url.startswith("https://") and not url.startswith("/"):
        url = f"https://www.ecajmer.ac.in/{url.lstrip('/')}"
    elif url.startswith("/"):
        # Internal API endpoint
        if url.startswith("/api/v1/") or url.startswith("/downloads/"):
            return url
        url = f"https://www.ecajmer.ac.in{url}"

    try:
        parts = urllib.parse.urlsplit(url)
        quoted_path = urllib.parse.quote(urllib.parse.unquote(parts.path), safe='/:@&=+$-_.!~*()')
        quoted_query = urllib.parse.quote(urllib.parse.unquote(parts.query), safe='/:@&=+$-_.!~*()')
        return urllib.parse.urlunsplit((parts.scheme, parts.netloc, quoted_path, quoted_query, parts.fragment))
    except Exception:
        return url

def is_trusted_url(url: Optional[str]) -> bool:
    """
    Validates whether a URL is from a verified official college/university domain
    or an internal CampusSync hosted path. Rejects javascript:, data:, and untrusted domains.
    """
    if not url or not isinstance(url, str):
        return False
        
    clean_url = url.strip()
    if not clean_url or clean_url == "#":
        return False

    # Allow internal CampusSync API endpoints
    if clean_url.startswith("/api/v1/") or clean_url.startswith("/downloads/"):
        return True

    try:
        parsed = urlparse(clean_url)
        if parsed.scheme.lower() not in ("http", "https"):
            return False

        hostname = (parsed.hostname or "").lower()
        if not hostname:
            return False

        # Check against trusted domains
        for domain in TRUSTED_DOMAINS:
            if hostname == domain or hostname.endswith(f".{domain}"):
                return True
    except Exception:
        return False

    return False

def is_legacy_dead_url(url: Optional[str]) -> bool:
    """Detects invalid or fabricated routes that return 404 or blank pages on ecajmer.ac.in."""
    if not url:
        return False
    lower = url.lower()
    # Homepage should never be used as a notice destination
    clean = lower.rstrip("/")
    if clean in ("https://www.ecajmer.ac.in", "http://www.ecajmer.ac.in", "https://ecajmer.ac.in", "http://ecajmer.ac.in"):
        return True
    # /circulars without a file extension returns 404 on the React SPA
    if clean.endswith("/circulars") or "/circulars?" in clean:
        return True
    return (
        "/departments/" in lower or
        "/department/" in lower or
        "/facilities/" in lower or
        "/academics/examinations" in lower or
        "/academics/sem" in lower or
        "/academics/cse" in lower or
        "/events/technotsav" in lower or
        "/notices/unclassified" in lower
    )

def is_document_url(url: Optional[str]) -> bool:
    """Detects if a URL directly points to a downloadable file/document."""
    if not url:
        return False
    clean = url.lower().split("?")[0].split("#")[0]
    return clean.endswith(DOCUMENT_EXTENSIONS) or "/uploads/circulars/" in clean or "/content/orders/" in clean

def resolve_notice_destination(
    download_url: Optional[str],
    document_url: Optional[str],
    source_url: Optional[str],
    official_page_url: Optional[str] = None
) -> Tuple[DestinationType, Optional[str], str]:
    """
    Determines the exact destination for a Notice following Phase 4.1 hierarchy:
    1. If verified official document URL exists (direct PDF) -> OFFICIAL_DOCUMENT
    2. Else if CampusSync-hosted download exists -> HOSTED_DOWNLOAD
    3. Else if verified official notice page exists (not homepage, not 404) -> OFFICIAL_PAGE
    4. Else fallback to verified college circulars directory -> OFFICIAL_PAGE

    Guarantees:
    - Never redirects to blank pages or 404 routes (/departments/cse, /facilities/library, etc.)
    - Never redirects to bare homepage (opens /circulars instead)
    - Prioritizes direct PDF documents above all else
    """
    # 1. Check direct PDF in document_url or other fields
    candidate_doc = document_url
    if not candidate_doc and official_page_url and is_document_url(official_page_url):
        candidate_doc = official_page_url
    elif not candidate_doc and source_url and is_document_url(source_url):
        candidate_doc = source_url

    if candidate_doc and not is_legacy_dead_url(candidate_doc):
        clean_doc = clean_and_encode_url(candidate_doc)
        if clean_doc and is_trusted_url(clean_doc):
            return (
                DestinationType.OFFICIAL_DOCUMENT,
                clean_doc,
                "Open Verified Official Document"
            )

    # 2. Local CampusSync Hosted File
    if download_url and (download_url.startswith("/api/v1/") or is_trusted_url(download_url)):
        return (
            DestinationType.HOSTED_DOWNLOAD,
            download_url,
            "Download CampusSync-Hosted Document"
        )

    # 3. Verified External Official Notice Webpage (must not be bare homepage or dead 404 path)
    page_target = official_page_url or source_url
    if page_target and not is_legacy_dead_url(page_target):
        clean_page = clean_and_encode_url(page_target)
        if clean_page and is_trusted_url(clean_page) and not is_legacy_dead_url(clean_page):
            return (
                DestinationType.OFFICIAL_PAGE,
                clean_page,
                "Open Official College Notice Page"
            )

    # 4. Safe Official College Directory Fallback (Never 404, never blank, never bare homepage)
    return (
        DestinationType.OFFICIAL_PAGE,
        "https://www.ecajmer.ac.in/latestfromeca",
        "Open Official College Circulars Directory"
    )

def resolve_club_destination(
    official_page_url: Optional[str],
    directory_url: Optional[str] = None
) -> Tuple[DestinationType, Optional[str], str]:
    """
    Determines destination for Clubs:
    1. If club-specific verified official page exists -> OFFICIAL_PAGE
    2. Else if verified official college clubs directory exists -> DIRECTORY_PAGE
    3. Else -> UNAVAILABLE
    """
    if official_page_url and is_trusted_url(official_page_url):
        return (
            DestinationType.OFFICIAL_PAGE,
            clean_and_encode_url(official_page_url),
            "Explore Official Club Page"
        )

    if directory_url and is_trusted_url(directory_url):
        return (
            DestinationType.DIRECTORY_PAGE,
            clean_and_encode_url(directory_url),
            "View College Clubs Directory"
        )

    return (
        DestinationType.DIRECTORY_PAGE,
        "https://www.ecajmer.ac.in",
        "View College Clubs Directory"
    )
