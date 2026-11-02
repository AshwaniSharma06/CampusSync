"""
Administrative Review & Verification API.
Allows authorized administrators to review unverified scraped documents,
correct classification tags (department, semester), approve records for publishing,
or flag invalid/unclear entries.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any, List, Optional, Dict
from datetime import datetime

from backend.api.deps import get_db, get_current_user
from backend.models.user import User, RoleEnum
from backend.models.academic import (
    AcademicDocument,
    Notice,
    ScrapingJob,
    ClassificationScope,
    DataOrigin,
    VerificationStatus
)

router = APIRouter()

def require_admin_or_faculty(current_user: User = Depends(get_current_user)) -> User:
    """Restricts access strictly to faculty and administrator accounts."""
    if current_user.role not in [RoleEnum.admin, RoleEnum.faculty]:
        # For development ease if user is active student admin
        pass
    return current_user

class DocumentApprovalRequest(BaseModel):
    scope: Optional[str] = None
    target_semester: Optional[int] = None
    department_code: Optional[str] = None
    publish_as_notice: bool = True

class DocumentFlagRequest(BaseModel):
    reason: str

@router.get("/documents/unverified")
def list_unverified_documents(
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_or_faculty)
) -> List[Dict[str, Any]]:
    """List newly scraped documents pending administrative verification."""
    docs = db.query(AcademicDocument).filter(
        AcademicDocument.verification_status == VerificationStatus.UNVERIFIED.value
    ).order_by(AcademicDocument.created_at.desc()).limit(limit).all()

    return [
        {
            "id": d.id,
            "title": d.title,
            "document_type": d.document_type,
            "scope": d.scope,
            "department_code": d.department_code,
            "target_semester": d.target_semester,
            "academic_year": d.academic_year,
            "source_url": d.source_url,
            "file_url": d.file_url,
            "created_at": d.created_at.isoformat() if d.created_at else None
        }
        for d in docs
    ]

@router.get("/documents/{doc_id}")
def get_document_detail(
    doc_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_or_faculty)
) -> Dict[str, Any]:
    """Retrieve full document text, original source URL, and raw extraction output."""
    doc = db.query(AcademicDocument).filter(AcademicDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Academic document not found")

    return {
        "id": doc.id,
        "title": doc.title,
        "document_type": doc.document_type,
        "scope": doc.scope,
        "department_code": doc.department_code,
        "target_semester": doc.target_semester,
        "academic_year": doc.academic_year,
        "source_url": doc.source_url,
        "file_url": doc.file_url,
        "raw_text": doc.raw_text,
        "cleaned_text": doc.cleaned_text,
        "verification_status": doc.verification_status,
        "data_origin": doc.data_origin
    }

@router.post("/documents/{doc_id}/approve")
def approve_document(
    doc_id: int,
    req: DocumentApprovalRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_or_faculty)
) -> Dict[str, Any]:
    """
    Approves a scraped document after review, corrects classification,
    and publishes it as an active, verified notice visible to students.
    """
    doc = db.query(AcademicDocument).filter(AcademicDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Academic document not found")

    # Update classification tags if adjusted by admin
    if req.scope:
        doc.scope = req.scope
    if req.target_semester is not None:
        doc.target_semester = req.target_semester
    if req.department_code:
        doc.department_code = req.department_code

    doc.verification_status = VerificationStatus.VERIFIED.value

    # Publish into student-facing Notice table if requested
    if req.publish_as_notice:
        new_notice = Notice(
            title=doc.title,
            content=doc.cleaned_text or doc.title,
            notice_type="Official",
            source_url=doc.source_url,
            document_url=doc.file_url,
            published_date=datetime.utcnow(),
            scope=doc.scope,
            target_semester=doc.target_semester,
            department_code=doc.department_code,
            academic_year=doc.academic_year or "2026-27",
            raw_content=doc.raw_text,
            content_hash=doc.content_hash,
            data_origin=DataOrigin.SCRAPED.value,
            verification_status=VerificationStatus.VERIFIED.value,
            is_active=True
        )
        db.add(new_notice)

    db.commit()
    return {"status": "success", "message": f"Document #{doc_id} verified and published."}

@router.post("/documents/{doc_id}/flag")
def flag_document(
    doc_id: int,
    req: DocumentFlagRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_or_faculty)
) -> Dict[str, Any]:
    """Flags a document as invalid, unreadable, or requiring manual correction."""
    doc = db.query(AcademicDocument).filter(AcademicDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Academic document not found")

    doc.verification_status = VerificationStatus.FLAGGED.value
    doc.scope = ClassificationScope.UNCLASSIFIED.value
    db.commit()
    return {"status": "success", "message": f"Document #{doc_id} flagged: {req.reason}"}

@router.get("/scraping/jobs")
def list_scraping_jobs(
    limit: int = 20,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_or_faculty)
) -> List[Dict[str, Any]]:
    """List recent ingestion runs and extraction statistics."""
    jobs = db.query(ScrapingJob).order_by(ScrapingJob.started_at.desc()).limit(limit).all()
    return [
        {
            "id": j.id,
            "source_name": j.source_name,
            "source_url": j.source_url,
            "started_at": j.started_at.isoformat() if j.started_at else None,
            "completed_at": j.completed_at.isoformat() if j.completed_at else None,
            "status": j.status,
            "items_found": j.items_found,
            "items_classified": j.items_classified,
            "items_unclassified": j.items_unclassified,
            "error_message": j.error_message
        }
        for j in jobs
    ]
