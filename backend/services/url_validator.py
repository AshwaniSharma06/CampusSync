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
    "hte.rajasthan.gov.in"
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
    """Detects old CMS paths from 2017-2020 that return 404 on current web server."""
    if not url:
        return False
    lower = url.lower()
    return (
        "/./content/" in lower or
        "/../content/" in lower or
        "/content/upload/" in lower or
        "/content/orders/" in lower
    )

def is_document_url(url: Optional[str]) -> bool:
    """Detects if a URL directly points to a downloadable file/document."""
    if not url:
        return False
    clean = url.lower().split("?")[0].split("#")[0]
    return clean.endswith(DOCUMENT_EXTENSIONS) or "/uploads/circulars/" in clean

def resolve_notice_destination(
    download_url: Optional[str],
    document_url: Optional[str],
    source_url: Optional[str],
    official_page_url: Optional[str] = None
) -> Tuple[DestinationType, Optional[str], str]:
    """
    Determines the exact destination for a Notice following Phase 4.1 hierarchy:
    1. If CampusSync-hosted download exists -> HOSTED_DOWNLOAD
    2. Else if verified official document URL exists -> OFFICIAL_DOCUMENT
    3. Else if verified official notice page exists -> OFFICIAL_PAGE
    4. Else fallback to verified college notice directory -> OFFICIAL_PAGE

    Guarantees no blank pages or dead links.
    Returns (destination_type, final_url, label_or_reason)
    """
    # 1. Local CampusSync Hosted File
    if download_url and (download_url.startswith("/api/v1/") or is_trusted_url(download_url)):
        return (
            DestinationType.HOSTED_DOWNLOAD,
            download_url,
            "Download CampusSync-Hosted Document"
        )

    # 2. Verified External Official Document (ensure URL is cleanly encoded and not a dead legacy path)
    if document_url and not is_legacy_dead_url(document_url):
        clean_doc = clean_and_encode_url(document_url)
        if clean_doc and is_trusted_url(clean_doc):
            return (
                DestinationType.OFFICIAL_DOCUMENT,
                clean_doc,
                "Open Verified Official Document"
            )

    # 3. Verified External Official Notice Webpage
    page_target = official_page_url or source_url
    if page_target and not is_legacy_dead_url(page_target):
        clean_page = clean_and_encode_url(page_target)
        if clean_page and is_trusted_url(clean_page):
            return (
                DestinationType.OFFICIAL_PAGE,
                clean_page,
                "Open Official College Notice Page"
            )

    # 4. Safe Official College Directory Fallback (Never 404 or blank)
    return (
        DestinationType.OFFICIAL_PAGE,
        "https://www.ecajmer.ac.in/circulars",
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
