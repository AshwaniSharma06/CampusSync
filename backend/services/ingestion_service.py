"""
Data Ingestion & Verification Pipeline.
Handles document extraction, SHA-256 deduplication, classification,
and ScrapingJob audit logging.

Security Invariant:
Newly scraped documents are ALWAYS assigned verification_status = UNVERIFIED.
They are never published directly to student-facing endpoints without review.
"""

import hashlib
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
import requests
from sqlalchemy.orm import Session

from backend.models.academic import (
    AcademicDocument,
    Notice,
    ScrapingJob,
    ClassificationScope,
    DataOrigin,
    VerificationStatus
)
from backend.services.source_registry import OfficialSource, get_all_active_sources
from backend.services.document_extractor import DocumentExtractor
from backend.services.classifier import DocumentClassifier

class IngestionPipeline:
    """
    Coordinates crawling, extraction, classification, deduplication, and job tracking.
    """

    @classmethod
    def run_ingestion_for_source(
        cls,
        source: OfficialSource,
        db: Session,
        max_items: int = 20
    ) -> ScrapingJob:
        """
        Executes a rate-limited ingestion job for a specific official source.
        Records audit trail in ScrapingJob table.
        """
        job = ScrapingJob(
            source_name=source.name,
            source_url=source.full_url,
            started_at=datetime.utcnow(),
            status="RUNNING",
            items_found=0,
            items_classified=0,
            items_unclassified=0
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        items_extracted = 0
        duplicates_count = 0
        errors: List[str] = []

        try:
            # 1. Fetch raw data from official endpoint with reasonable timeout & retry
            response = cls._fetch_with_retry(
                url=source.full_url,
                headers=source.headers,
                timeout=source.timeout_seconds,
                retries=2
            )

            if not response or response.status_code != 200:
                job.status = "FAILED"
                job.error_message = f"HTTP {response.status_code if response else 'Timeout'}"
                job.completed_at = datetime.utcnow()
                db.commit()
                return job

            raw_payload = response.json()
            raw_items = []

            # Handle ECA public API format (e.g. {'data': [...]})
            if isinstance(raw_payload, dict):
                raw_items = raw_payload.get("data", [])
            elif isinstance(raw_payload, list):
                raw_items = raw_payload

            job.items_found = len(raw_items)

            # 2. Process each item (up to max_items to prevent aggressive crawling)
            for item in raw_items[:max_items]:
                # Respect rate limits between items
                time.sleep(source.rate_limit_delay_seconds)

                title = item.get("title") or item.get("announcement") or "Untitled Notice"
                content_field = item.get("content") or item.get("description") or ""
                doc_path = item.get("linkToPdf") or item.get("content") if item.get("contentType") == "pdf" else None
                pub_date = item.get("date")

                # If there's an attachment link, construct full URL
                doc_url = None
                if doc_path:
                    if doc_path.startswith("http"):
                        doc_url = doc_path
                    else:
                        doc_url = f"{source.base_url}/{doc_path.lstrip('/')}"

                # Extract content
                cleaned_text = content_field
                raw_text = content_field
                is_scanned = False

                # If document is a PDF attachment, download and parse
                if doc_url and doc_url.lower().endswith(".pdf"):
                    pdf_result = cls._fetch_and_extract_pdf(doc_url, source.headers)
                    if pdf_result:
                        raw_text = pdf_result["raw_text"]
                        cleaned_text = pdf_result["cleaned_text"]
                        is_scanned = pdf_result["is_scanned"]

                # 3. Compute SHA-256 content hash for deduplication
                hash_input = f"{title.strip()}|{cleaned_text.strip()}"
                content_hash = hashlib.sha256(hash_input.encode("utf-8")).hexdigest()

                # Check for existing document by hash or URL
                existing_doc = db.query(AcademicDocument).filter(
                    AcademicDocument.content_hash == content_hash
                ).first()

                if existing_doc:
                    duplicates_count += 1
                    continue

                # 4. Classify document based on evidence
                classification = DocumentClassifier.classify_document(
                    title=title,
                    content=cleaned_text
                )

                scope = classification["scope"]
                if is_scanned:
                    # Scanned docs without OCR cannot be verified or safely classified
                    scope = ClassificationScope.UNCLASSIFIED.value

                if scope == ClassificationScope.UNCLASSIFIED.value:
                    job.items_unclassified += 1
                else:
                    job.items_classified += 1

                # 5. Save to AcademicDocument table with strict UNVERIFIED status
                # Invariant: A successful scrape NEVER automatically makes a document VERIFIED
                new_doc = AcademicDocument(
                    title=title.strip(),
                    document_type=classification["document_type"],
                    file_url=doc_url,
                    source_url=source.full_url,
                    scope=scope,
                    department_code=classification["department_code"],
                    target_semester=classification["target_semester"],
                    academic_year=classification["academic_year"],
                    raw_text=raw_text,
                    cleaned_text=cleaned_text,
                    content_hash=content_hash,
                    data_origin=DataOrigin.SCRAPED.value,
                    verification_status=VerificationStatus.UNVERIFIED.value,
                    created_at=datetime.utcnow()
                )
                db.add(new_doc)
                items_extracted += 1

            db.commit()
            job.status = "SUCCESS"
            job.completed_at = datetime.utcnow()
            db.commit()

        except Exception as e:
            db.rollback()
            job.status = "FAILED"
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            db.commit()

        return job

    @classmethod
    def _fetch_with_retry(
        cls,
        url: str,
        headers: Dict[str, str],
        timeout: int,
        retries: int = 2
    ) -> Optional[requests.Response]:
        """Fetches HTTP response with exponential backoff on transient errors."""
        for attempt in range(retries + 1):
            try:
                resp = requests.get(url, headers=headers, timeout=timeout)
                return resp
            except Exception:
                if attempt == retries:
                    return None
                time.sleep(1.0 * (attempt + 1))
        return None

    @classmethod
    def _fetch_and_extract_pdf(cls, pdf_url: str, headers: Dict[str, str]) -> Optional[Dict[str, Any]]:
        """Downloads PDF bytes and invokes DocumentExtractor."""
        try:
            r = requests.get(pdf_url, headers=headers, timeout=12)
            if r.status_code == 200:
                return DocumentExtractor.extract_from_pdf_bytes(r.content)
        except Exception:
            pass
        return None
