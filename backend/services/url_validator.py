"""
Official URL Validation & Security Service for CampusSync.
Enforces strict domain boundary checks, protocol validation,
and classification of document/page destinations.
Prevents unverified external redirects or malicious URL injection.
"""

from urllib.parse import urlparse
from typing import Optional, Dict, Any, Tuple
from enum import Enum

TRUSTED_DOMAINS = [
    "ecajmer.ac.in",
    "www.ecajmer.ac.in",
    "btu.ac.in",
    "www.btu.ac.in",
    "btuexam.in",
    "www.btuexam.in"
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

    return False

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
    4. Else -> UNAVAILABLE

    Returns (destination_type, final_url, label_or_reason)
    """
    # 1. Local CampusSync Hosted File
    if download_url and (download_url.startswith("/api/v1/") or is_trusted_url(download_url)):
        return (
            DestinationType.HOSTED_DOWNLOAD,
            download_url,
            "Download CampusSync-Hosted Document"
        )

    # 2. Verified External Official Document
    if document_url and is_trusted_url(document_url):
        return (
            DestinationType.OFFICIAL_DOCUMENT,
            document_url,
            "Open Verified Official Document"
        )

    # 3. Verified External Official Notice Webpage
    page_target = official_page_url or source_url
    if page_target and is_trusted_url(page_target):
        return (
            DestinationType.OFFICIAL_PAGE,
            page_target,
            "Open Official College Notice Page"
        )

    # 4. Unavailable
    return (
        DestinationType.UNAVAILABLE,
        None,
        "Official notice link is currently unavailable."
    )

def resolve_club_destination(
    official_page_url: Optional[str],
    directory_url: Optional[str] = None
) -> Tuple[DestinationType, Optional[str], str]:
    """
    Determines destination for Clubs following Phase 4.1 hierarchy:
    1. If club-specific verified official page exists -> OFFICIAL_PAGE
    2. Else if verified official college clubs directory exists -> DIRECTORY_PAGE
    3. Else -> UNAVAILABLE
    """
    if official_page_url and is_trusted_url(official_page_url):
        return (
            DestinationType.OFFICIAL_PAGE,
            official_page_url,
            "Explore Official Club Page"
        )

    if directory_url and is_trusted_url(directory_url):
        return (
            DestinationType.DIRECTORY_PAGE,
            directory_url,
            "View College Clubs Directory"
        )

    return (
        DestinationType.UNAVAILABLE,
        None,
        "Official club link is currently unavailable."
    )

