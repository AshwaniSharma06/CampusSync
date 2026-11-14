"""
CampusSync Intelligent Academic Date Normalizer.
Extracts, validates, and standardizes publication dates for circulars, notices, and academic orders.
Distinguishes publication dates from event dates, deadlines, and upload timestamps.
Handles Indian (DD-MM-YYYY / DD/MM/YYYY), ISO, and textual date representations used across ECA, BTU, and DCE.
"""

import re
from datetime import datetime
from typing import Optional, Tuple

MONTH_MAP = {
    'jan': 1, 'january': 1,
    'feb': 2, 'february': 2,
    'mar': 3, 'march': 3,
    'apr': 4, 'april': 4,
    'may': 5,
    'jun': 6, 'june': 6,
    'jul': 7, 'july': 7,
    'aug': 8, 'august': 8,
    'sep': 9, 'september': 9,
    'oct': 10, 'october': 10,
    'nov': 11, 'november': 11,
    'dec': 12, 'december': 12
}

class DateNormalizer:
    """
    Normalizes multi-format date strings and extracts publication dates from content.
    """

    @classmethod
    def parse_publication_date(
        cls,
        raw_date_str: Optional[str] = None,
        title: Optional[str] = None,
        doc_url: Optional[str] = None,
        content: Optional[str] = None
    ) -> Tuple[datetime, str]:
        """
        Parses and returns (normalized_datetime, confidence_source).
        Confidence source can be: 'EXPLICIT_SOURCE_DATE', 'EXTRACTED_FROM_TEXT', 'FILENAME_METADATA', or 'INGESTION_TIMESTAMP'.
        """
        # 1. Try parsing explicit raw_date_str if provided from structured API/metadata
        if raw_date_str and isinstance(raw_date_str, str):
            clean_str = raw_date_str.strip()
            # ISO: 2026-11-03 or 2026-11-03T10:00:00.000000
            iso_match = re.match(r'^(\d{4})-(\d{1,2})-(\d{1,2})', clean_str)
            if iso_match:
                try:
                    y, m, d = int(iso_match.group(1)), int(iso_match.group(2)), int(iso_match.group(3))
                    if 2015 <= y <= 2035 and 1 <= m <= 12 and 1 <= d <= 31:
                        return datetime(y, m, d), "EXPLICIT_SOURCE_DATE"
                except ValueError:
                    pass

            # Indian format: DD/MM/YYYY or DD-MM-YYYY
            indian_match = re.match(r'^(\d{1,2})[/-](\d{1,2})[/-](\d{4})', clean_str)
            if indian_match:
                try:
                    d, m, y = int(indian_match.group(1)), int(indian_match.group(2)), int(indian_match.group(3))
                    if 2015 <= y <= 2035 and 1 <= m <= 12 and 1 <= d <= 31:
                        return datetime(y, m, d), "EXPLICIT_SOURCE_DATE"
                except ValueError:
                    pass

        # 2. Extract explicit publication date embedded in title or filename
        combined_text = f"{title or ''} {doc_url or ''} {content or ''[:300]}"
        extracted = cls._extract_date_from_text(combined_text)
        if extracted:
            return extracted, "EXTRACTED_FROM_TEXT"

        # 3. Fallback to current time without microsecond clutter
        now = datetime.utcnow()
        return datetime(now.year, now.month, now.day, now.hour, now.minute, now.second), "INGESTION_TIMESTAMP"

    @classmethod
    def _extract_date_from_text(cls, text: str) -> Optional[datetime]:
        """Looks for explicit dated references within circular headers or filenames."""
        if not text:
            return None

        # Pattern: "Oct 14, 2026", "October 22, 2026"
        m1 = re.search(
            r'\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(\d{4})\b',
            text,
            re.IGNORECASE
        )
        if m1:
            month = MONTH_MAP[m1.group(1).lower()]
            day = int(m1.group(2))
            year = int(m1.group(3))
            if 2015 <= year <= 2035 and 1 <= day <= 31:
                try:
                    return datetime(year, month, day)
                except ValueError:
                    pass

        # Pattern: "16 Oct 26" or "16 Oct 2026"
        m2 = re.search(
            r'\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{2,4})\b',
            text,
            re.IGNORECASE
        )
        if m2:
            day = int(m2.group(1))
            month = MONTH_MAP[m2.group(2).lower()]
            year = int(m2.group(3))
            if year < 100:
                year += 2000
            if 2015 <= year <= 2035 and 1 <= day <= 31:
                try:
                    return datetime(year, month, day)
                except ValueError:
                    pass

        # WhatsApp document export pattern: DOC-20261103-WA0012
        m3 = re.search(r'DOC-(\d{4})(\d{2})(\d{2})-', text, re.IGNORECASE)
        if m3:
            y, m, d = int(m3.group(1)), int(m3.group(2)), int(m3.group(3))
            if 2015 <= y <= 2035 and 1 <= m <= 12 and 1 <= d <= 31:
                try:
                    return datetime(y, m, d)
                except ValueError:
                    pass

        # Indian pattern in text: e.g. "dated 15/10/2026" or "dt. 15-10-2026"
        m4 = re.search(r'(?:dated|dt\.?)\s*[:\-]?\s*(\d{1,2})[/-](\d{1,2})[/-](\d{4})', text, re.IGNORECASE)
        if m4:
            d, m, y = int(m4.group(1)), int(m4.group(2)), int(m4.group(3))
            if 2015 <= y <= 2035 and 1 <= m <= 12 and 1 <= d <= 31:
                try:
                    return datetime(y, m, d)
                except ValueError:
                    pass

        return None

