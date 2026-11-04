from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Any, Optional, List, Dict

from backend.api.deps import get_db, get_optional_current_user
from backend.models.user import User
from backend.models.social import Event, Club
from backend.services.url_validator import resolve_club_destination, is_trusted_url, DestinationType

router = APIRouter()

@router.get("/")
def get_events(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
) -> Any:
    events = db.query(Event).all()
    return [
        {
            "id": e.id,
            "title": e.title,
            "description": e.description,
            "category": e.category,
            "event_date": e.event_date.isoformat() if e.event_date else None,
            "location": e.location,
            "image_url": e.image_url,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in events
    ]

@router.get("/clubs")
def get_clubs(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Returns official student organizations and technical societies
    with verified official destination URLs and Student Activity Center (SAC) directory fallbacks.
    """
    clubs = db.query(Club).all()
    results = []
    for c in clubs:
        page_url = getattr(c, "official_page_url", None)
        dir_url = getattr(c, "directory_url", None)
        dest_type, dest_url, dest_label = resolve_club_destination(
            official_page_url=page_url,
            directory_url=dir_url
        )
        results.append({
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "focus_areas": [f.strip() for f in c.focus_areas.split(",")] if c.focus_areas else [],
            "location": c.location,
            "category": getattr(c, "category", None) or "Technical Chapter",
            "lead": getattr(c, "lead", None) or "Faculty Convener",
            "members_count": getattr(c, "members_count", None) or "200+ Members",
            "official_page_url": page_url if is_trusted_url(page_url) else None,
            "directory_url": dir_url if is_trusted_url(dir_url) else None,
            "verification_status": getattr(c, "verification_status", "VERIFIED"),
            "destination_type": dest_type.value,
            "action_url": dest_url,
            "action_label": dest_label,
            "is_actionable": dest_type != DestinationType.UNAVAILABLE
        })
    return results
