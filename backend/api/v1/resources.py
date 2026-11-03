"""
CampusSync Academic Documents & Study Resources API.
Provides verified syllabus matrices, academic calendars, curriculum templates,
and exam guidelines with authentic download and redirection paths.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Any, List, Dict, Optional
from pathlib import Path
import os
import glob

from backend.api.deps import get_db, get_current_student_context, StudentContext
from backend.models.academic import AcademicResource, ClassificationScope, VerificationStatus
from backend.services.url_validator import is_trusted_url, is_document_url, DestinationType

router = APIRouter()

HOSTED_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "hosted_documents"

@router.get("/")
def get_academic_resources(
    student_ctx: StudentContext = Depends(get_current_student_context),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Returns authentic academic documents and study materials strictly filtered
    for the authenticated student's cohort (department & semester) and global materials.
    """
    scope_filter = or_(
        AcademicResource.scope == ClassificationScope.GLOBAL.value,
        AcademicResource.scope == "GLOBAL",
        and_(
            AcademicResource.scope == ClassificationScope.DEPARTMENT_SPECIFIC.value,
            AcademicResource.department_code == student_ctx.department_code
        ),
        and_(
            AcademicResource.scope == ClassificationScope.SEMESTER_SPECIFIC.value,
            AcademicResource.department_code == student_ctx.department_code,
            AcademicResource.target_semester == student_ctx.semester
        )
    )

    resources = db.query(AcademicResource).filter(
        AcademicResource.verification_status != VerificationStatus.FLAGGED.value,
        AcademicResource.verification_status != "FLAGGED",
        scope_filter
    ).order_by(AcademicResource.id.asc()).all()

    results = []
    for r in resources:
        # Determine destination type & target
        dest_type = DestinationType.UNAVAILABLE
        action_url = None
        action_label = "Official resource link is currently unavailable."

        matching_files = list(HOSTED_DIR.glob(f"Resource_{r.id}_*.pdf"))
        has_local_file = bool(matching_files and matching_files[0].exists())

        if r.is_hosted and (has_local_file or r.download_url):
            dest_type = DestinationType.HOSTED_DOWNLOAD
            action_url = f"/api/v1/resources/{r.id}/download"
            action_label = "Download CampusSync-Hosted Document"
        elif r.document_url and is_trusted_url(r.document_url):
            dest_type = DestinationType.OFFICIAL_DOCUMENT
            action_url = r.document_url
            action_label = "Open Verified Official Document"
        elif r.source_url and is_trusted_url(r.source_url):
            dest_type = DestinationType.OFFICIAL_PAGE
            action_url = r.source_url
            action_label = "Open Official University Page"

        results.append({
            "id": r.id,
            "title": r.title,
            "category": r.category or "Academic Resource",
            "file_size": r.file_size or "Document",
            "is_hosted": r.is_hosted and has_local_file,
            "data_origin": getattr(r, "data_origin", "DEMO_SEED"),
            "verification_status": getattr(r, "verification_status", "PENDING_VERIFICATION"),
            "download_url": action_url if dest_type == DestinationType.HOSTED_DOWNLOAD else None,
            "document_url": r.document_url if is_trusted_url(r.document_url) else None,
            "source_url": r.source_url if is_trusted_url(r.source_url) else None,
            "destination_type": dest_type.value,
            "action_url": action_url,
            "action_label": action_label,
            "is_actionable": dest_type != DestinationType.UNAVAILABLE
        })

    return results

@router.get("/{resource_id}/download")
def download_academic_resource(
    resource_id: int,
    student_ctx: StudentContext = Depends(get_current_student_context),
    db: Session = Depends(get_db)
) -> Any:
    """
    Downloads a hosted academic document or redirects safely to its verified official portal.
    """
    res = db.query(AcademicResource).filter(AcademicResource.id == resource_id).first()
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Academic resource #{resource_id} not found"
        )

    # 1. Local CampusSync Hosted File
    matching_files = list(HOSTED_DIR.glob(f"Resource_{resource_id}_*.pdf"))
    if matching_files and matching_files[0].exists():
        file_path = matching_files[0]
        safe_filename = f"{res.title[:35].replace(' ', '_')}.pdf"
        return FileResponse(
            path=file_path,
            filename=safe_filename,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{safe_filename}"'}
        )

    # 2. Verified External Official Document
    if res.document_url and is_trusted_url(res.document_url):
        return RedirectResponse(url=res.document_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

    # 3. Verified External Official Page
    if res.source_url and is_trusted_url(res.source_url):
        return RedirectResponse(url=res.source_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Official study material link is currently unavailable."
    )

