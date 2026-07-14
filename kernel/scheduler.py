from datetime import datetime, timedelta
from typing import Any, Callable, Awaitable, Optional
from enum import Enum
import asyncio


class JobStatus(Enum):
    """Job status enumeration"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"
    DEAD_LETTER = "dead_letter"


class JobPriority(Enum):
    """Job priority enumeration"""
    LOW = 1
    NORMAL = 2
    HIGH = 3
    CRITICAL = 4


class Job:
    """
    Represents a scheduled job.
    
    Jobs can be one-time or recurring, with various scheduling options.
    """
    
    def __init__(
        self,
        job_id: str,
        task: Callable[[], Awaitable[Any]],
        priority: JobPriority = JobPriority.NORMAL,
        scheduled_at: Optional[datetime] = None,
        dependencies: Optional[list[str]] = None,
        max_retries: int = 3,
        retry_delay: timedelta = timedelta(seconds=5),
        cron_expression: Optional[str] = None,
        recurring: bool = False,
    ):
        self.job_id = job_id
        self.task = task
        self.priority = priority
        self.scheduled_at = scheduled_at or datetime.utcnow()
        self.dependencies = dependencies or []
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.cron_expression = cron_expression
        self.recurring = recurring
        
        self.status = JobStatus.PENDING
        self.retry_count = 0
        self.created_at = datetime.utcnow()
        self.started_at: Optional[datetime] = None
        self.completed_at: Optional[datetime] = None
        self.error: Optional[str] = None
        self.result: Optional[Any] = None


class Scheduler:
    """
    Constitutional scheduler abstraction.
    
    Manages job scheduling, execution, retry logic, and dead letter handling.
    Supports multiple backends (Dramatiq, Temporal, etc.).
    """
    
    def __init__(self, mission_queue=None):
        self._jobs: dict[str, Job] = {}
        self._job_queue: list[Job] = []
        self._dead_letter_queue: list[Job] = []
        self._running = False
        self._worker_task: Optional[asyncio.Task] = None
        self._mission_queue = mission_queue  # Optional mission queue for wiring
    
    async def start(self) -> None:
        """Start the scheduler worker"""
        if self._running:
            return
        
        self._running = True
        # Sort queue deterministically on startup
        self._job_queue.sort(
            key=lambda j: (j.priority.value, j.scheduled_at),
            reverse=True,
        )
        self._worker_task = asyncio.create_task(self._worker_loop())
    
    async def stop(self) -> None:
        """Stop the scheduler worker"""
        self._running = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
    
    async def _worker_loop(self) -> None:
        """Main worker loop that processes jobs"""
        while self._running:
            await self._process_due_jobs()
            await self._check_dependencies()
            await self._process_retries()
            await asyncio.sleep(1)  # Check every second
    
    async def _process_due_jobs(self) -> None:
        """Process jobs that are due for execution"""
        now = datetime.utcnow()
        
        # Sort queue by priority and scheduled time
        self._job_queue.sort(
            key=lambda j: (j.priority.value, j.scheduled_at),
            reverse=True,
        )
        
        # Process due jobs
        for job in self._job_queue[:]:
            if job.scheduled_at <= now and job.status == JobStatus.PENDING:
                # Check dependencies
                if await self._dependencies_satisfied(job):
                    await self._execute_job(job)
    
    async def _check_dependencies(self) -> None:
        """Check if job dependencies are satisfied"""
        for job in self._job_queue:
            if job.status == JobStatus.PENDING and job.dependencies:
                if await self._dependencies_satisfied(job):
                    # Dependencies satisfied, job can run
                    pass
    
    async def _dependencies_satisfied(self, job: Job) -> bool:
        """Check if a job's dependencies are satisfied"""
        for dep_id in job.dependencies:
            dep_job = self._jobs.get(dep_id)
            if not dep_job or dep_job.status != JobStatus.COMPLETED:
                return False
        return True
    
    async def _process_retries(self) -> None:
        """Process jobs that need to be retried"""
        now = datetime.utcnow()
        
        for job in self._dead_letter_queue[:]:
            if (
                job.status == JobStatus.RETRYING
                and job.scheduled_at <= now
                and job.retry_count < job.max_retries
            ):
                # Move back to job queue for retry
                self._dead_letter_queue.remove(job)
                self._job_queue.append(job)
    
    async def _execute_job(self, job: Job) -> None:
        """Execute a job"""
        job.status = JobStatus.RUNNING
        job.started_at = datetime.utcnow()
        
        try:
            # Execute the task
            result = await job.task()
            
            # Mark as completed
            job.status = JobStatus.COMPLETED
            job.completed_at = datetime.utcnow()
            job.result = result
            
            # Remove from queue
            if job in self._job_queue:
                self._job_queue.remove(job)
            
            # If recurring, schedule next run
            if job.recurring:
                await self._schedule_next_run(job)
            
        except Exception as e:
            # Handle failure
            job.error = str(e)
            job.retry_count += 1
            
            if job.retry_count < job.max_retries:
                # Schedule retry
                job.status = JobStatus.RETRYING
                job.scheduled_at = datetime.utcnow() + job.retry_delay
                self._dead_letter_queue.append(job)
                if job in self._job_queue:
                    self._job_queue.remove(job)
            else:
                # Move to dead letter
                job.status = JobStatus.DEAD_LETTER
                self._dead_letter_queue.append(job)
                if job in self._job_queue:
                    self._job_queue.remove(job)
    
    async def _schedule_next_run(self, job: Job) -> None:
        """Schedule the next run of a recurring job"""
        if job.cron_expression:
            # Parse cron expression and schedule next run
            # For now, just add 1 hour
            job.scheduled_at = datetime.utcnow() + timedelta(hours=1)
        else:
            # Default to 1 hour
            job.scheduled_at = datetime.utcnow() + timedelta(hours=1)
        
        job.status = JobStatus.PENDING
        job.retry_count = 0
        job.error = None
        job.result = None
        job.started_at = None
        job.completed_at = None
        
        self._job_queue.append(job)
    
    def schedule_job(self, job: Job) -> None:
        """Schedule a job for execution"""
        self._jobs[job.job_id] = job
        self._job_queue.append(job)
    
    async def enqueue(self, mission_id: str, task: Callable[[], Awaitable[Any]], priority: JobPriority = JobPriority.NORMAL) -> str:
        """
        Enqueue a mission as a job.
        
        This wires the Scheduler to the mission queue system.
        
        Args:
            mission_id: Mission identifier
            task: Async task to execute
            priority: Job priority
        
        Returns:
            Job ID
        """
        job = Job(
            job_id=mission_id,  # Use mission_id as job_id for simplicity
            task=task,
            priority=priority,
            scheduled_at=datetime.utcnow()
        )
        self.schedule_job(job)
        return job.job_id
    
    def cancel_job(self, job_id: str) -> bool:
        """
        Cancel a job.
        
        Returns True if job was cancelled, False if not found.
        """
        job = self._jobs.get(job_id)
        if not job:
            return False
        
        job.status = JobStatus.CANCELLED
        
        # Remove from queue
        if job in self._job_queue:
            self._job_queue.remove(job)
        if job in self._dead_letter_queue:
            self._dead_letter_queue.remove(job)
        
        return True
    
    def get_job_status(self, job_id: str) -> Optional[JobStatus]:
        """Get the status of a job"""
        job = self._jobs.get(job_id)
        return job.status if job else None
    
    def get_dead_letter_queue(self) -> list[Job]:
        """Get all jobs in the dead letter queue"""
        return self._dead_letter_queue.copy()
    
    def retry_dead_letter_job(self, job_id: str) -> bool:
        """
        Retry a job from the dead letter queue.
        
        Returns True if job was moved back to queue, False if not found.
        """
        for job in self._dead_letter_queue[:]:
            if job.job_id == job_id:
                job.status = JobStatus.RETRYING
                job.retry_count = 0
                job.scheduled_at = datetime.utcnow()
                self._dead_letter_queue.remove(job)
                self._job_queue.append(job)
                return True
        return False
    
    def get_queue_depth(self) -> int:
        """Get the current depth of the job queue"""
        return len(self._job_queue)
    
    def get_active_jobs(self) -> list[Job]:
        """Get all currently running jobs"""
        return [j for j in self._jobs.values() if j.status == JobStatus.RUNNING]


class SchedulerBackend:
    """
    Abstract base class for scheduler backends.
    
    Different backends (Dramatiq, Temporal, etc.) can implement this interface.
    """
    
    async def schedule(self, job: Job) -> str:
        """Schedule a job"""
        raise NotImplementedError
    
    async def cancel(self, job_id: str) -> bool:
        """Cancel a job"""
        raise NotImplementedError
    
    async def get_status(self, job_id: str) -> JobStatus:
        """Get job status"""
        raise NotImplementedError


class DramatiqBackend(SchedulerBackend):
    """
    Dramatiq backend for the scheduler.
    
    Implements the SchedulerBackend interface using Dramatiq.
    """
    
    def __init__(self):
        # TODO: Initialize Dramatiq
        pass
    
    async def schedule(self, job: Job) -> str:
        """Schedule a job using Dramatiq"""
        # TODO: Implement Dramatiq scheduling
        return job.job_id
    
    async def cancel(self, job_id: str) -> bool:
        """Cancel a job using Dramatiq"""
        # TODO: Implement Dramatiq cancellation
        return True
    
    async def get_status(self, job_id: str) -> JobStatus:
        """Get job status from Dramatiq"""
        # TODO: Implement Dramatiq status check
        return JobStatus.PENDING


class TemporalBackend(SchedulerBackend):
    """
    Temporal backend for the scheduler.
    
    Implements the SchedulerBackend interface using Temporal.
    """
    
    def __init__(self):
        # TODO: Initialize Temporal
        pass
    
    async def schedule(self, job: Job) -> str:
        """Schedule a job using Temporal"""
        # TODO: Implement Temporal scheduling
        return job.job_id
    
    async def cancel(self, job_id: str) -> bool:
        """Cancel a job using Temporal"""
        # TODO: Implement Temporal cancellation
        return True
    
    async def get_status(self, job_id: str) -> JobStatus:
        """Get job status from Temporal"""
        # TODO: Implement Temporal status check
        return JobStatus.PENDING
