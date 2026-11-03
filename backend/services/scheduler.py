"""
CampusSync Automated 3-Hour Website Scraping Scheduler.
Features:
- Single active instance guard to prevent concurrent/overlapping worker runs
- Configurable interval via SCRAPER_INTERVAL_MINUTES (default: 180 min / 3 hours)
- Graceful startup and shutdown lifecycle management inside FastAPI
- Live job status and audit metrics tracking (last_run, next_run, status, error log)
- Safe manual trigger support without corrupting active jobs
"""

import asyncio
import os
import tempfile
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from filelock import FileLock, Timeout

from backend.core.config import settings
from backend.db.session import SessionLocal
from backend.services.historical_ingestion_service import HistoricalIngestionEngine

LOCK_FILE_PATH = os.path.join(tempfile.gettempdir(), "campussync_scraper.lock")

class CampusSyncScraperScheduler:
    """
    Singleton scheduler running in the background of FastAPI.
    Visits official college endpoints every 3 hours (180 minutes).
    Protected by cross-process file lock for multi-worker deployments.
    """

    _instance: Optional['CampusSyncScraperScheduler'] = None
    _lock = asyncio.Lock()

    def __init__(self):
        self.is_running: bool = False
        self.is_standby: bool = False
        self.is_scraping: bool = False
        self.last_run_at: Optional[datetime] = None
        self.next_run_at: Optional[datetime] = None
        self.total_runs: int = 0
        self.last_run_stats: Dict[str, Any] = {}
        self.last_error: Optional[str] = None
        self._task: Optional[asyncio.Task] = None
        self._file_lock: Optional[FileLock] = None

    @classmethod
    def get_instance(cls) -> 'CampusSyncScraperScheduler':
        if cls._instance is None:
            cls._instance = CampusSyncScraperScheduler()
        return cls._instance

    async def start(self):
        """Starts the scheduler background loop if enabled."""
        if not settings.SCRAPER_ENABLED:
            print("[Scheduler] Automated scraping is disabled via SCRAPER_ENABLED=false.")
            return

        if self.is_running:
            print("[Scheduler] Scheduler is already active in this process.")
            return

        # Cross-process singleton guard (for multi-worker Uvicorn/Gunicorn deployments)
        self._file_lock = FileLock(LOCK_FILE_PATH, timeout=0.1)
        try:
            self._file_lock.acquire(timeout=0.1)
        except Timeout:
            print("[Scheduler] Another worker process holds the scheduler lock. Running in standby mode (follower worker).")
            self.is_standby = True
            return

        self.is_running = True
        self.is_standby = False
        interval_min = settings.SCRAPER_INTERVAL_MINUTES
        self.next_run_at = datetime.utcnow() + timedelta(seconds=10) # Initial run after 10s warmup
        print(f"[Scheduler] Automated 3-Hour Scraper started (Interval: {interval_min} minutes) with master process lock.")
        self._task = asyncio.create_task(self._scheduler_loop())

    async def shutdown(self):
        """Cancels background scraping task on application shutdown."""
        self.is_running = False
        if self._task and not self._task.done():
            self._task.cancel()
        if self._file_lock and self._file_lock.is_locked:
            try:
                self._file_lock.release()
            except Exception:
                pass
        print("[Scheduler] Automated Scraper shutdown cleanly.")

    async def _scheduler_loop(self):
        """Main execution loop that triggers every SCRAPER_INTERVAL_MINUTES."""
        # Initial warmup delay so backend finishes booting
        try:
            await asyncio.sleep(10)
        except asyncio.CancelledError:
            return

        while self.is_running:
            try:
                await self.execute_scrape_job(full_historical=False)
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.last_error = str(e)
                print(f"[Scheduler] Unexpected error during scheduled job: {e}")

            interval_seconds = settings.SCRAPER_INTERVAL_MINUTES * 60
            self.next_run_at = datetime.utcnow() + timedelta(seconds=interval_seconds)
            print(f"[Scheduler] Sleeping for {settings.SCRAPER_INTERVAL_MINUTES} minutes. Next run: {self.next_run_at.isoformat()} UTC")
            
            # Non-blocking sleep with cancellation handling
            try:
                await asyncio.sleep(interval_seconds)
            except asyncio.CancelledError:
                break

    async def execute_scrape_job(self, full_historical: bool = False, max_pages: Optional[int] = None) -> Dict[str, Any]:
        """
        Executes a scrape job in a worker thread to prevent blocking FastAPI's event loop.
        Guarded against overlapping runs.
        """
        if self.is_scraping:
            print("[Scheduler] Job already in progress. Skipping overlapping trigger.")
            return {"status": "SKIPPED", "reason": "Another scraping job is currently running."}

        self.is_scraping = True
        self.last_run_at = datetime.utcnow()
        self.last_error = None
        print(f"[Scheduler] Starting {'FULL HISTORICAL' if full_historical else 'PERIODIC 3-HOUR'} scrape job...")

        def _run_sync():
            db = SessionLocal()
            try:
                return HistoricalIngestionEngine.run_ingestion(
                    db=db,
                    full_historical=full_historical,
                    max_pages=max_pages,
                    index_to_ai=True
                )
            finally:
                db.close()

        try:
            loop = asyncio.get_event_loop()
            stats = await loop.run_in_executor(None, _run_sync)
            self.last_run_stats = stats
            self.total_runs += 1
            print(f"[Scheduler] Scrape completed: {stats.get('new_notices_inserted')} new notices, {stats.get('duplicates_skipped')} duplicates skipped.")
            return {"status": "SUCCESS", "stats": stats}
        except Exception as e:
            self.last_error = str(e)
            print(f"[Scheduler] Job failed with error: {e}")
            return {"status": "FAILED", "error": str(e)}
        finally:
            self.is_scraping = False

    def get_status(self) -> Dict[str, Any]:
        """Returns comprehensive monitoring statistics for Admin dashboard."""
        return {
            "scheduler_enabled": settings.SCRAPER_ENABLED,
            "interval_minutes": settings.SCRAPER_INTERVAL_MINUTES,
            "is_running": self.is_running,
            "is_master": self.is_running and not self.is_standby,
            "is_standby": self.is_standby,
            "is_scraping": self.is_scraping,
            "total_runs": self.total_runs,
            "last_run_at": self.last_run_at.isoformat() if self.last_run_at else None,
            "next_run_at": self.next_run_at.isoformat() if self.next_run_at else None,
            "last_run_stats": self.last_run_stats,
            "last_error": self.last_error
        }

