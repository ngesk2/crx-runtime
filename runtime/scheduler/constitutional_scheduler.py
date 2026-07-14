"""
Constitutional Scheduler - Separate from executor.

Planner creates graph.
Scheduler decides execution.

Massive separation.

Scheduler handles:
- Priority
- Deadlines
- Preemption
- Backpressure
- Fairness
- Cancellation
- Capability Availability
- Human Availability
- Resource Limits
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Set
from datetime import datetime, timezone, timedelta
from enum import Enum
import heapq
import uuid
from pathlib import Path
import asyncio


class SchedulingPriority(Enum):
    """Priority levels for scheduling."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class SchedulingStatus(Enum):
    """Status of scheduled work."""
    PENDING = "pending"
    SCHEDULED = "scheduled"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PREEMPTED = "preempted"
    BLOCKED = "blocked"


@dataclass
class ResourceRequirement:
    """Resource requirement for a task."""
    resource_type: str
    amount: float
    unit: str


@dataclass
class SchedulingConstraints:
    """Constraints for scheduling."""
    deadline: Optional[datetime]
    max_duration_seconds: Optional[int]
    requires_human: bool
    required_capabilities: List[str]
    resource_requirements: List[ResourceRequirement]
    dependencies: List[str]  # Other task IDs this depends on


@dataclass
class ScheduledTask:
    """A task scheduled by the constitutional scheduler."""
    task_id: str
    mission_id: str
    workflow_id: str
    task_name: str
    priority: SchedulingPriority
    status: SchedulingStatus
    constraints: SchedulingConstraints
    scheduled_at: Optional[str]
    started_at: Optional[str]
    completed_at: Optional[str]
    preempted_at: Optional[str]
    preempted_by: Optional[str]
    execution_node_id: Optional[str]
    metadata: Dict[str, Any]
    
    def is_ready(self) -> bool:
        """Check if task is ready to execute."""
        if self.status != SchedulingStatus.PENDING:
            return False
        
        # Check if dependencies are complete
        if self.constraints.dependencies:
            return False
        
        # Check if human is available if required
        if self.constraints.requires_human:
            return False
        
        return True
    
    def is_overdue(self) -> bool:
        """Check if task is overdue."""
        if not self.constraints.deadline:
            return False
        return datetime.now(timezone.utc) > self.constraints.deadline
    
    def get_priority_value(self) -> int:
        """Get numeric priority value for comparison."""
        priority_map = {
            SchedulingPriority.CRITICAL: 4,
            SchedulingPriority.HIGH: 3,
            SchedulingPriority.MEDIUM: 2,
            SchedulingPriority.LOW: 1
        }
        return priority_map.get(self.priority, 0)


class ConstitutionalScheduler:
    """
    Constitutional Scheduler - Separate from executor.
    
    Planner creates graph.
    Scheduler decides execution.
    
    Handles:
    - Priority
    - Deadlines
    - Preemption
    - Backpressure
    - Fairness
    - Cancellation
    - Capability Availability
    - Human Availability
    - Resource Limits
    """
    
    def __init__(self):
        self._tasks: Dict[str, ScheduledTask] = {}
        self._task_queue: List[tuple[int, str]] = []  # (priority, task_id) for heap
        self._running_tasks: Set[str] = set()
        self._completed_tasks: Set[str] = set()
        self._blocked_tasks: Set[str] = set()
        self._capability_availability: Dict[str, bool] = {}
        self._human_availability: bool = True
        self._resource_limits: Dict[str, float] = {}
        self._resource_usage: Dict[str, float] = {}
        # NOTE: All state is in-memory for now. For production, this should be
        # persisted to database to eliminate hidden mutable state and enable replay.
    
    def schedule_task(
        self,
        mission_id: str,
        workflow_id: str,
        task_name: str,
        priority: SchedulingPriority,
        constraints: SchedulingConstraints,
        metadata: Optional[Dict[str, Any]] = None
    ) -> ScheduledTask:
        """
        Schedule a task for execution.
        
        Args:
            mission_id: Mission ID
            workflow_id: Workflow ID
            task_name: Task name
            priority: Task priority
            constraints: Scheduling constraints
            metadata: Additional metadata
        
        Returns:
            Scheduled task
        """
        task = ScheduledTask(
            task_id=str(uuid.uuid4()),
            mission_id=mission_id,
            workflow_id=workflow_id,
            task_name=task_name,
            priority=priority,
            status=SchedulingStatus.PENDING,
            constraints=constraints,
            scheduled_at=None,
            started_at=None,
            completed_at=None,
            preempted_at=None,
            preempted_by=None,
            execution_node_id=None,
            metadata=metadata or {}
        )
        
        self._tasks[task.task_id] = task
        
        # Add to priority queue
        priority_value = task.get_priority_value()
        heapq.heappush(self._task_queue, (-priority_value, task.task_id))
        
        return task
    
    def get_next_task(self) -> Optional[ScheduledTask]:
        """
        Get the next task to execute.
        
        Returns:
            Next task or None if no tasks available
        """
        while self._task_queue:
            priority_value, task_id = heapq.heappop(self._task_queue)
            
            task = self._tasks.get(task_id)
            if not task:
                continue
            
            if task.status != SchedulingStatus.PENDING:
                continue
            
            if not task.is_ready():
                self._blocked_tasks.add(task_id)
                continue
            
            # Check resource availability
            if not self._check_resource_availability(task):
                self._blocked_tasks.add(task_id)
                continue
            
            # Check capability availability
            if not self._check_capability_availability(task):
                self._blocked_tasks.add(task_id)
                continue
            
            # Check human availability if required
            if task.constraints.requires_human and not self._human_availability:
                self._blocked_tasks.add(task_id)
                continue
            
            return task
        
        return None
    
    def mark_task_started(self, task_id: str, execution_node_id: str) -> None:
        """Mark a task as started."""
        task = self._tasks.get(task_id)
        if task:
            task.status = SchedulingStatus.RUNNING
            task.started_at = datetime.now(timezone.utc).isoformat()
            task.execution_node_id = execution_node_id
            self._running_tasks.add(task_id)
    
    def mark_task_completed(self, task_id: str) -> None:
        """Mark a task as completed."""
        task = self._tasks.get(task_id)
        if task:
            task.status = SchedulingStatus.COMPLETED
            task.completed_at = datetime.now(timezone.utc).isoformat()
            self._running_tasks.discard(task_id)
            self._completed_tasks.add(task_id)
            
            # Release resources
            self._release_task_resources(task)
            
            # Unblock dependent tasks
            self._unblock_dependents(task_id)
    
    def mark_task_failed(self, task_id: str, error: str) -> None:
        """Mark a task as failed."""
        task = self._tasks.get(task_id)
        if task:
            task.status = SchedulingStatus.FAILED
            task.completed_at = datetime.now(timezone.utc).isoformat()
            task.metadata["error"] = error
            self._running_tasks.discard(task_id)
            self._release_task_resources(task)
    
    def preempt_task(self, task_id: str, preempting_task_id: str) -> bool:
        """
        Preempt a task for a higher priority task.
        
        Args:
            task_id: Task to preempt
            preempting_task_id: Task that is preempting
        
        Returns:
            True if preemption successful
        """
        task = self._tasks.get(task_id)
        preempting_task = self._tasks.get(preempting_task_id)
        
        if not task or not preempting_task:
            return False
        
        if task.status != SchedulingStatus.RUNNING:
            return False
        
        if preempting_task.get_priority_value() <= task.get_priority_value():
            return False
        
        # Preempt the task
        task.status = SchedulingStatus.PREEMPTED
        task.preempted_at = datetime.now(timezone.utc).isoformat()
        task.preempted_by = preempting_task_id
        self._running_tasks.discard(task_id)
        self._release_task_resources(task)
        
        return True
    
    def cancel_task(self, task_id: str) -> bool:
        """
        Cancel a task.
        
        Args:
            task_id: Task to cancel
        
        Returns:
            True if cancellation successful
        """
        task = self._tasks.get(task_id)
        if not task:
            return False
        
        if task.status in [SchedulingStatus.COMPLETED, SchedulingStatus.FAILED, SchedulingStatus.CANCELLED]:
            return False
        
        task.status = SchedulingStatus.CANCELLED
        task.completed_at = datetime.now(timezone.utc).isoformat()
        
        if task_id in self._running_tasks:
            self._running_tasks.discard(task_id)
            self._release_task_resources(task)
        
        return True
    
    def _check_resource_availability(self, task: ScheduledTask) -> bool:
        """Check if required resources are available."""
        for req in task.constraints.resource_requirements:
            available = self._resource_limits.get(req.resource_type, 0)
            used = self._resource_usage.get(req.resource_type, 0)
            if used + req.amount > available:
                return False
        return True
    
    def _check_capability_availability(self, task: ScheduledTask) -> bool:
        """Check if required capabilities are available."""
        for cap in task.constraints.required_capabilities:
            if not self._capability_availability.get(cap, True):
                return False
        return True
    
    def _release_task_resources(self, task: ScheduledTask) -> None:
        """Release resources used by a task."""
        for req in task.constraints.resource_requirements:
            current = self._resource_usage.get(req.resource_type, 0)
            self._resource_usage[req.resource_type] = max(0, current - req.amount)
    
    def _unblock_dependents(self, task_id: str) -> None:
        """Unblock tasks that depend on this task."""
        for task in self._tasks.values():
            if task_id in task.constraints.dependencies:
                if task.status == SchedulingStatus.BLOCKED:
                    task.status = SchedulingStatus.PENDING
                    self._blocked_tasks.discard(task.task_id)
                    
                    # Re-add to queue
                    priority_value = task.get_priority_value()
                    heapq.heappush(self._task_queue, (-priority_value, task.task_id))
    
    def set_capability_availability(self, capability: str, available: bool) -> None:
        """Set capability availability."""
        self._capability_availability[capability] = available
    
    def set_human_availability(self, available: bool) -> None:
        """Set human availability."""
        self._human_availability = available
    
    def set_resource_limit(self, resource_type: str, limit: float) -> None:
        """Set resource limit."""
        self._resource_limits[resource_type] = limit
    
    def get_overdue_tasks(self) -> List[ScheduledTask]:
        """Get all overdue tasks."""
        return [task for task in self._tasks.values() if task.is_overdue()]
    
    def get_tasks_by_status(self, status: SchedulingStatus) -> List[ScheduledTask]:
        """Get all tasks with a specific status."""
        return [task for task in self._tasks.values() if task.status == status]
    
    def get_tasks_by_priority(self, priority: SchedulingPriority) -> List[ScheduledTask]:
        """Get all tasks with a specific priority."""
        return [task for task in self._tasks.values() if task.priority == priority]
    
    def get_backpressure(self) -> Dict[str, int]:
        """Get current backpressure metrics."""
        return {
            "pending_tasks": len(self._task_queue),
            "running_tasks": len(self._running_tasks),
            "blocked_tasks": len(self._blocked_tasks),
            "completed_tasks": len(self._completed_tasks)
        }
    
    def apply_fairness_policy(self) -> None:
        """
        Apply fairness policy to prevent starvation.
        
        Boost priority of long-pending tasks.
        """
        for task in self._tasks.values():
            if task.status == SchedulingStatus.PENDING:
                if task.scheduled_at:
                    scheduled = datetime.fromisoformat(task.scheduled_at)
                    age = (datetime.now(timezone.utc) - scheduled).total_seconds()
                    
                    # Boost priority if task has been pending too long
                    if age > 3600:  # 1 hour
                        if task.priority == SchedulingPriority.LOW:
                            task.priority = SchedulingPriority.MEDIUM
                        elif task.priority == SchedulingPriority.MEDIUM:
                            task.priority = SchedulingPriority.HIGH


class SchedulerMetrics:
    """Metrics for the constitutional scheduler."""
    
    def __init__(self, scheduler: ConstitutionalScheduler):
        self.scheduler = scheduler
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get scheduler metrics."""
        return {
            "total_tasks": len(self.scheduler._tasks),
            "pending_tasks": len(self.scheduler._task_queue),
            "running_tasks": len(self.scheduler._running_tasks),
            "blocked_tasks": len(self.scheduler._blocked_tasks),
            "completed_tasks": len(self.scheduler._completed_tasks),
            "overdue_tasks": len(self.scheduler.get_overdue_tasks()),
            "backpressure": self.scheduler.get_backpressure(),
            "resource_usage": self.scheduler._resource_usage.copy(),
            "resource_limits": self.scheduler._resource_limits.copy()
        }
    
    def get_task_metrics(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get metrics for a specific task."""
        task = self.scheduler._tasks.get(task_id)
        if not task:
            return None
        
        duration = None
        if task.started_at and task.completed_at:
            started = datetime.fromisoformat(task.started_at)
            completed = datetime.fromisoformat(task.completed_at)
            duration = (completed - started).total_seconds()
        
        return {
            "task_id": task.task_id,
            "status": task.status.value,
            "priority": task.priority.value,
            "duration_seconds": duration,
            "is_overdue": task.is_overdue(),
            "scheduled_at": task.scheduled_at,
            "started_at": task.started_at,
            "completed_at": task.completed_at
        }


# NOTE: Singleton pattern removed for determinism and testability.
# Use dependency injection instead.
# _constitutional_scheduler = ConstitutionalScheduler()
# _scheduler_metrics = SchedulerMetrics(_constitutional_scheduler)


def create_constitutional_scheduler() -> ConstitutionalScheduler:
    """Create a new constitutional scheduler instance."""
    scheduler = ConstitutionalScheduler()
    return scheduler


def create_scheduler_metrics(scheduler: ConstitutionalScheduler) -> SchedulerMetrics:
    """Create scheduler metrics for a given scheduler."""
    return SchedulerMetrics(scheduler)
