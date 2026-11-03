"""
HTML and PDF Extraction Engine for College Notices & Examination Circulars.
Handles structured text sanitization, table preservation, multi-page PDFs,
and scanned document detection (NEEDS_OCR).
"""

import io
import re
from typing import Dict, Any, List, Optional
from bs4 import BeautifulSoup
import pypdf

class DocumentExtractor:
    """
    Extracts text and metadata from raw HTML pages and PDF documents.
    """

    @staticmethod
    def extract_from_html(html_content: str, base_url: str = "") -> Dict[str, Any]:
        """
        Parses HTML notice tables and announcements into structured text.
        Preserves tabular alignment, links, and dates.
        """
        if not html_content or not html_content.strip():
            return {
                "raw_text": "",
                "cleaned_text": "",
                "links": [],
                "tables": [],
                "is_scanned": False,
                "status": "EMPTY"
            }

        soup = BeautifulSoup(html_content, "html.parser")

        # Remove non-content elements
        for element in soup(["script", "style", "noscript", "svg", "header", "footer"]):
            element.extract()

        links = []
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            text = a.get_text(strip=True)
            if href and not href.startswith("javascript:"):
                # Normalize relative links if base_url is provided
                full_href = href if href.startswith("http") else f"{base_url.rstrip('/')}/{href.lstrip('/')}"
                links.append({"text": text, "url": full_href})

        # Extract table data
        tables = []
        for table in soup.find_all("table"):
            rows = []
            for tr in table.find_all("tr"):
                cells = [td.get_text(strip=True) for td in tr.find_all(["td", "th"])]
                if cells:
                    rows.append(" | ".join(cells))
            if rows:
                tables.append("\n".join(rows))

        raw_text = soup.get_text(separator="\n")
        cleaned_text = DocumentExtractor.clean_academic_text(raw_text)

        return {
            "raw_text": raw_text.strip(),
            "cleaned_text": cleaned_text,
            "links": links,
            "tables": tables,
            "is_scanned": False,
            "status": "SUCCESS" if cleaned_text else "EMPTY"
        }

    @staticmethod
    def extract_from_pdf_bytes(pdf_bytes: bytes) -> Dict[str, Any]:
        """
        Extracts multi-page text from binary PDF data.
        Detects scanned or image-only PDFs that yield no selectable text.
        """
        if not pdf_bytes or len(pdf_bytes) == 0:
            return {
                "raw_text": "",
                "cleaned_text": "",
                "page_count": 0,
                "is_scanned": False,
                "status": "EMPTY"
            }

        try:
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            page_count = len(reader.pages)
            extracted_pages: List[str] = []

            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                extracted_pages.append(page_text.strip())

            raw_text = "\n\n--- Page Break ---\n\n".join(extracted_pages).strip()
            cleaned_text = DocumentExtractor.clean_academic_text(raw_text)

            # Scanned / Image-Only PDF Detection
            # If a document has pages but yields virtually no text, flag for OCR
            total_chars = len(cleaned_text.replace("--- Page Break ---", "").strip())
            is_scanned = (page_count > 0 and total_chars < 30)

            status = "NEEDS_OCR" if is_scanned else ("SUCCESS" if total_chars >= 30 else "EMPTY")

            return {
                "raw_text": raw_text,
                "cleaned_text": cleaned_text,
                "page_count": page_count,
                "is_scanned": is_scanned,
                "status": status
            }

        except Exception as e:
            return {
                "raw_text": "",
                "cleaned_text": "",
                "page_count": 0,
                "is_scanned": False,
                "status": "FAILED",
                "error": str(e)
            }

    @staticmethod
    def clean_academic_text(text: str) -> str:
        """
        Sanitizes extracted academic text while strictly preserving:
        - Course codes (e.g. CS 301, CS 402)
        - Examination dates (e.g. 2026-11-12, 12 Nov 2026)
        - Time intervals (e.g. 10:00 AM - 12:00 PM)
        - Tables and line structures
        """
        if not text:
            return ""

        # Normalize carriage returns and non-breaking spaces
        t = text.replace("\r\n", "\n").replace("\r", "\n").replace("\xa0", " ")

        # Compress excessive blank lines (more than 2 consecutive newlines)
        t = re.sub(r"\n{3,}", "\n\n", t)

        # Compress horizontal whitespace within lines while preserving newlines
        lines = []
        for line in t.split("\n"):
            clean_line = re.sub(r"[ \t]+", " ", line).strip()
            lines.append(clean_line)

        return "\n".join(lines).strip()

