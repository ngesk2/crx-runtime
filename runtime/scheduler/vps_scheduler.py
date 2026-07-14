"""
VPS Scheduler - Tier 1 always-on infrastructure.

This runs on VPS and:
- Polls APIs
- Normalizes data
- Queues work
- Sends webhooks to wake laptop

The laptop (Tier 2) then:
- Wakes up
- Processes queue
- Syncs results back

This separates lightweight scheduling from heavy inference.
"""

import asyncio
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict
import sqlite3
import aiohttp


@dataclass
class ScheduledJob:
    """A scheduled job."""
    job_id: str
    job_type: str  # API_POLL, RSS_INGEST, GIT_PULL, QUEUE_MANAGEMENT
    schedule: str  # Cron expression or interval
    enabled: bool
    config: Dict[str, Any]
    last_run: Optional[str]
    next_run: str
    status: str  # PENDING, RUNNING, COMPLETED, FAILED


@dataclass
class QueuedWork:
    """Work item queued for laptop processing."""
    work_id: str
    work_type: str
    payload: Dict[str, Any]
    priority: int
    queued_at: str
    status: str  # QUEUED, PROCESSING, COMPLETED, FAILED
    result: Optional[Dict[str, Any]]
    error: Optional[str]
    idempotency_key: Optional[str]
    dedupe_hash: str


class VPSScheduler:
    """
    VPS-based scheduler for lightweight operations.
    
    Runs cron jobs that enqueue work rather than performing heavy operations.
    """
    
    def __init__(self, db_path: str = "runtime/scheduler/scheduler.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._conn = None
        self._initialize_db()
    
    def _initialize_db(self) -> None:
        """Initialize database schema."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        # Scheduled jobs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scheduled_jobs (
                job_id TEXT PRIMARY KEY,
                job_type TEXT NOT NULL,
                schedule TEXT NOT NULL,
                enabled BOOLEAN DEFAULT TRUE,
                config TEXT,
                last_run TEXT,
                next_run TEXT,
                status TEXT DEFAULT 'PENDING',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Queued work table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS queued_work (
                work_id TEXT PRIMARY KEY,
                work_type TEXT NOT NULL,
                payload TEXT,
                priority INTEGER DEFAULT 0,
                queued_at TEXT DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'QUEUED',
                result TEXT,
                error TEXT,
                idempotency_key TEXT UNIQUE,
                dedupe_hash TEXT,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Dead letter queue table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS dead_letter_queue (
                work_id TEXT PRIMARY KEY,
                work_type TEXT NOT NULL,
                payload TEXT,
                priority INTEGER DEFAULT 0,
                queued_at TEXT DEFAULT CURRENT_TIMESTAMP,
                failed_at TEXT DEFAULT CURRENT_TIMESTAMP,
                error TEXT NOT NULL,
                retry_count INTEGER DEFAULT 0,
                original_work_id TEXT,
                status TEXT DEFAULT 'DEAD'
            )
        """)
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_next_run ON scheduled_jobs(next_run)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_queued_work_status ON queued_work(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_queued_work_priority ON queued_work(priority, queued_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_queued_work_idempotency ON queued_work(idempotency_key)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_queued_work_dedupe ON queued_work(dedupe_hash)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_dead_letter_failed_at ON dead_letter_queue(failed_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_dead_letter_status ON dead_letter_queue(status)")
        
        conn.commit()
        conn.close()
    
    def add_scheduled_job(
        self,
        job_id: str,
        job_type: str,
        schedule: str,
        config: Dict[str, Any],
        enabled: bool = True
    ) -> None:
        """Add a scheduled job."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO scheduled_jobs
            (job_id, job_type, schedule, enabled, config, next_run, status)
            VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
        """, (
            job_id,
            job_type,
            schedule,
            enabled,
            json.dumps(config),
            datetime.now(timezone.utc).isoformat()
        ))
        
        conn.commit()
        conn.close()
    
    def get_due_jobs(self) -> List[ScheduledJob]:
        """Get jobs that are due to run."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT job_id, job_type, schedule, enabled, config, last_run, next_run, status
            FROM scheduled_jobs
            WHERE enabled = TRUE
            AND next_run <= ?
            AND status = 'PENDING'
            ORDER BY next_run
        """, (datetime.now(timezone.utc).isoformat(),))
        
        jobs = []
        for row in cursor.fetchall():
            jobs.append(ScheduledJob(
                job_id=row[0],
                job_type=row[1],
                schedule=row[2],
                enabled=bool(row[3]),
                config=json.loads(row[4]),
                last_run=row[5],
                next_run=row[6],
                status=row[7]
            ))
        
        conn.close()
        return jobs
    
    def mark_job_running(self, job_id: str) -> None:
        """Mark job as running."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE scheduled_jobs
            SET status = 'RUNNING'
            WHERE job_id = ?
        """, (job_id,))
        
        conn.commit()
        conn.close()
    
    def mark_job_completed(self, job_id: str, next_run: Optional[str] = None) -> None:
        """Mark job as completed."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        now = datetime.now(timezone.utc).isoformat()
        
        cursor.execute("""
            UPDATE scheduled_jobs
            SET status = 'PENDING',
                last_run = ?,
                next_run = COALESCE(?, next_run)
            WHERE job_id = ?
        """, (now, next_run, job_id))
        
        conn.commit()
        conn.close()
    
    def mark_job_failed(self, job_id: str, error: str) -> None:
        """Mark job as failed."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE scheduled_jobs
            SET status = 'FAILED',
                last_run = ?
            WHERE job_id = ?
        """, (datetime.now(timezone.utc).isoformat(), job_id))
        
        conn.commit()
        conn.close()
    
    def enqueue_work(
        self,
        work_type: str,
        payload: Dict[str, Any],
        priority: int = 0,
        idempotency_key: Optional[str] = None
    ) -> str:
        """Enqueue work for laptop processing with idempotency."""
        import uuid
        
        work_id = str(uuid.uuid4())
        
        # Generate dedupe hash from payload
        payload_str = json.dumps(payload, sort_keys=True)
        dedupe_hash = hashlib.sha256(payload_str.encode()).hexdigest()
        
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO queued_work
                (work_id, work_type, payload, priority, status, idempotency_key, dedupe_hash)
                VALUES (?, ?, ?, ?, 'QUEUED', ?, ?)
            """, (work_id, work_type, json.dumps(payload), priority, idempotency_key, dedupe_hash))
            
            conn.commit()
            conn.close()
            return work_id
        except sqlite3.IntegrityError as e:
            # Idempotency key conflict, return existing work_id
            if "idempotency_key" in str(e):
                cursor.execute(
                    "SELECT work_id FROM queued_work WHERE idempotency_key = ?",
                    (idempotency_key,)
                )
                row = cursor.fetchone()
                conn.close()
                return row[0] if row else work_id
            # Dedupe hash conflict, return existing work_id
            elif "dedupe_hash" in str(e):
                cursor.execute(
                    "SELECT work_id FROM queued_work WHERE dedupe_hash = ?",
                    (dedupe_hash,)
                )
                row = cursor.fetchone()
                conn.close()
                return row[0] if row else work_id
            else:
                conn.close()
                raise
    
    def get_queued_work(self, limit: int = 10) -> List[QueuedWork]:
        """Get queued work items."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT work_id, work_type, payload, priority, queued_at, status, result, error, idempotency_key, dedupe_hash
            FROM queued_work
            WHERE status = 'QUEUED'
            ORDER BY priority DESC, queued_at ASC
            LIMIT ?
        """, (limit,))
        
        work_items = []
        for row in cursor.fetchall():
            work_items.append(QueuedWork(
                work_id=row[0],
                work_type=row[1],
                payload=json.loads(row[2]),
                priority=row[3],
                queued_at=row[4],
                status=row[5],
                result=json.loads(row[6]) if row[6] else None,
                error=row[7],
                idempotency_key=row[8],
                dedupe_hash=row[9]
            ))
        
        conn.close()
        return work_items
    
    def mark_work_processing(self, work_id: str) -> None:
        """Mark work as processing."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE queued_work
            SET status = 'PROCESSING',
                updated_at = ?
            WHERE work_id = ?
        """, (datetime.now(timezone.utc).isoformat(), work_id))
        
        conn.commit()
        conn.close()
    
    def mark_work_completed(self, work_id: str, result: Dict[str, Any]) -> None:
        """Mark work as completed."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE queued_work
            SET status = 'COMPLETED',
                result = ?,
                updated_at = ?
            WHERE work_id = ?
        """, (json.dumps(result), datetime.now(timezone.utc).isoformat(), work_id))
        
        conn.commit()
        conn.close()
    
    def mark_work_failed(self, work_id: str, error: str, retry_count: int = 0) -> None:
        """Mark work as failed, move to dead letter if max retries exceeded."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        # Check retry count
        if retry_count >= 5:
            # Move to dead letter queue
            cursor.execute("""
                SELECT work_id, work_type, payload, priority, queued_at
                FROM queued_work
                WHERE work_id = ?
            """, (work_id,))
            
            row = cursor.fetchone()
            if row:
                import uuid
                dead_letter_id = str(uuid.uuid4())
                
                cursor.execute("""
                    INSERT INTO dead_letter_queue
                    (work_id, work_type, payload, priority, queued_at, failed_at, error, retry_count, original_work_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    dead_letter_id,
                    row[1],
                    row[2],
                    row[3],
                    row[4],
                    datetime.now(timezone.utc).isoformat(),
                    error,
                    retry_count,
                    work_id
                ))
                
                # Remove from queued work
                cursor.execute("DELETE FROM queued_work WHERE work_id = ?", (work_id,))
        else:
            # Just mark as failed for retry
            cursor.execute("""
                UPDATE queued_work
                SET status = 'FAILED',
                    error = ?,
                    updated_at = ?
                WHERE work_id = ?
            """, (error, datetime.now(timezone.utc).isoformat(), work_id))
        
        conn.commit()
        conn.close()
    
    def get_dead_letter_items(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get dead letter queue items."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT work_id, work_type, payload, priority, queued_at, failed_at, error, retry_count, original_work_id
            FROM dead_letter_queue
            WHERE status = 'DEAD'
            ORDER BY failed_at DESC
            LIMIT ?
        """, (limit,))
        
        items = []
        for row in cursor.fetchall():
            items.append({
                "work_id": row[0],
                "work_type": row[1],
                "payload": json.loads(row[2]),
                "priority": row[3],
                "queued_at": row[4],
                "failed_at": row[5],
                "error": row[6],
                "retry_count": row[7],
                "original_work_id": row[8]
            })
        
        conn.close()
        return items
    
    def retry_dead_letter_item(self, work_id: str) -> bool:
        """Retry a dead letter queue item."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        # Get dead letter item
        cursor.execute("""
            SELECT work_type, payload, priority, queued_at, original_work_id
            FROM dead_letter_queue
            WHERE work_id = ?
        """, (work_id,))
        
        row = cursor.fetchone()
        if not row:
            conn.close()
            return False
        
        # Re-enqueue with new work_id
        import uuid
        new_work_id = str(uuid.uuid4())
        
        payload_str = json.dumps(row[2])
        dedupe_hash = hashlib.sha256(payload_str.encode()).hexdigest()
        
        cursor.execute("""
            INSERT INTO queued_work
            (work_id, work_type, payload, priority, status, dedupe_hash)
            VALUES (?, ?, ?, ?, 'QUEUED', ?)
        """, (new_work_id, row[1], row[2], row[3], dedupe_hash))
        
        # Remove from dead letter queue
        cursor.execute("DELETE FROM dead_letter_queue WHERE work_id = ?", (work_id,))
        
        conn.commit()
        conn.close()
        return True
    
    def purge_dead_letter_items(self, older_than_days: int = 30) -> int:
        """Purge dead letter items older than specified days."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cutoff_date = (datetime.now(timezone.utc) - timedelta(days=older_than_days)).isoformat()
        
        cursor.execute("""
            DELETE FROM dead_letter_queue
            WHERE failed_at < ?
        """, (cutoff_date,))
        
        count = cursor.rowcount
        conn.commit()
        conn.close()
        return count


class APIPoller:
    """Polls APIs and enqueues work."""
    
    def __init__(self, scheduler: VPSScheduler):
        self.scheduler = scheduler
    
    async def poll_api(self, job_id: str, config: Dict[str, Any]) -> None:
        """Poll API and enqueue results."""
        url = config.get("url")
        headers = config.get("headers", {})
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                data = await response.json()
        
        # Enqueue for processing
        self.scheduler.enqueue_work(
            work_type="API_DATA",
            payload={
                "source": config.get("source"),
                "data": data
            },
            priority=config.get("priority", 0)
        )


class RSSIngestor:
    """Ingests RSS feeds and enqueues work."""
    
    def __init__(self, scheduler: VPSScheduler):
        self.scheduler = scheduler
    
    async def ingest_rss(self, job_id: str, config: Dict[str, Any]) -> None:
        """Ingest RSS feed and enqueue items."""
        import feedparser
        
        url = config.get("url")
        feed = feedparser.parse(url)
        
        for entry in feed.entries:
            self.scheduler.enqueue_work(
                work_type="RSS_ITEM",
                payload={
                    "source": url,
                    "title": entry.get("title"),
                    "link": entry.get("link"),
                    "published": entry.get("published"),
                    "content": entry.get("content")
                },
                priority=config.get("priority", 0)
            )


class GitPuller:
    """Pulls git repositories and enqueues changes."""
    
    def __init__(self, scheduler: VPSScheduler):
        self.scheduler = scheduler
    
    async def pull_git(self, job_id: str, config: Dict[str, Any]) -> None:
        """Pull git repository and enqueue changes."""
        import subprocess
        
        repo_path = config.get("repo_path")
        
        # Pull changes
        result = subprocess.run(
            ["git", "-C", repo_path, "pull"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            # Check for changes
            log_result = subprocess.run(
                ["git", "-C", repo_path, "log", "--oneline", "-10"],
                capture_output=True,
                text=True
            )
            
            self.scheduler.enqueue_work(
                work_type="GIT_CHANGES",
                payload={
                    "repo": repo_path,
                    "changes": log_result.stdout
                },
                priority=config.get("priority", 0)
            )


class WebhookNotifier:
    """Sends webhooks to wake laptop."""
    
    def __init__(self, webhook_url: Optional[str] = None):
        self.webhook_url = webhook_url
    
    async def notify_laptop(self, work_count: int) -> bool:
        """Send webhook to wake laptop."""
        if not self.webhook_url:
            return False
        
        async with aiohttp.ClientSession() as session:
            try:
                await session.post(
                    self.webhook_url,
                    json={"work_count": work_count}
                )
                return True
            except Exception:
                return False


class SchedulerRunner:
    """Runs the scheduler loop."""
    
    def __init__(self, scheduler: VPSScheduler, webhook_url: Optional[str] = None):
        self.scheduler = scheduler
        self.api_poller = APIPoller(scheduler)
        self.rss_ingestor = RSSIngestor(scheduler)
        self.git_puller = GitPuller(scheduler)
        self.webhook_notifier = WebhookNotifier(webhook_url)
        self._running = False
    
    async def run_job(self, job: ScheduledJob) -> None:
        """Run a scheduled job."""
        self.scheduler.mark_job_running(job.job_id)
        
        try:
            if job.job_type == "API_POLL":
                await self.api_poller.poll_api(job.job_id, job.config)
            elif job.job_type == "RSS_INGEST":
                await self.rss_ingestor.ingest_rss(job.job_id, job.config)
            elif job.job_type == "GIT_PULL":
                await self.git_puller.pull_git(job.job_id, job.config)
            
            # Calculate next run (simplified - would use cron parser)
            next_run = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
            self.scheduler.mark_job_completed(job.job_id, next_run)
        except Exception as e:
            self.scheduler.mark_job_failed(job.job_id, str(e))
    
    async def run_loop(self, interval_seconds: int = 60) -> None:
        """Run scheduler loop."""
        self._running = True
        
        while self._running:
            # Get due jobs
            jobs = self.scheduler.get_due_jobs()
            
            # Run jobs
            for job in jobs:
                await self.run_job(job)
            
            # Check for queued work
            queued_work = self.scheduler.get_queued_work()
            
            # Notify laptop if work available
            if queued_work:
                await self.webhook_notifier.notify_laptop(len(queued_work))
            
            # Wait for next iteration
            await asyncio.sleep(interval_seconds)
    
    def stop(self) -> None:
        """Stop scheduler loop."""
        self._running = False
