from fastapi import APIRouter
from backend.api.v1.auth import router as auth_router
from backend.api.v1.profile import router as profile_router
from backend.api.v1.dashboard import router as dashboard_router
from backend.api.v1.notices import router as notices_router

from backend.api.v1.courses import router as courses_router
from backend.api.v1.events import router as events_router
from backend.api.v1.assignments import router as assignments_router
from backend.api.v1.saved import router as saved_router
from backend.api.v1.community import router as community_router
from backend.api.v1.notifications import router as notifications_router
from backend.api.v1.scraper import router as scraper_router
from backend.api.v1.rag import router as rag_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(profile_router, prefix="/profile", tags=["profile"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(notices_router, prefix="/notices", tags=["notices"])
api_router.include_router(courses_router, prefix="/courses", tags=["courses"])
api_router.include_router(events_router, prefix="/events", tags=["events"])
api_router.include_router(assignments_router, prefix="/assignments", tags=["assignments"])
api_router.include_router(saved_router, prefix="/saved", tags=["saved"])
api_router.include_router(community_router, prefix="/community", tags=["community"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["notifications"])
api_router.include_router(scraper_router, prefix="/scraper", tags=["scraper"])
api_router.include_router(rag_router, prefix="/rag", tags=["rag"])
