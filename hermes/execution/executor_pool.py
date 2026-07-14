"""
Executor Pool - Multi-worker mission execution.

This module provides a pool of workers for concurrent mission execution.
Replaces single executor loop with N workers sharing a queue.
"""

from typing import Any, Dict, Optional, List
import asyncio
from datetime import datetime

from hermes.execution.queue import MissionQueue
from hermes.execution.lease import LeaseManager
from hermes.runtime.router import RuntimeRouter
from hermes.runtime.mission_store import MissionStore


class ExecutorPool:
    """
    Pool of workers for concurrent mission execution.
    
    Manages N workers that share a single mission queue.
    Each worker independently dequeues and executes missions.
    """
    
    def __init__(
        self,
        num_workers: int = 4,
        mission_queue: Optional[MissionQueue] = None,
        lease_manager: Optional[LeaseManager] = None,
        runtime_router: Optional[RuntimeRouter] = None,
        mission_store: Optional[MissionStore] = None
    ):
        self.num_workers = num_workers
        self.mission_queue = mission_queue or MissionQueue()
        self.lease_manager = lease_manager or LeaseManager()
        self.runtime_router = runtime_router
        self.mission_store = mission_store or MissionStore()
        
        self._workers: List[asyncio.Task] = []
        self._running = False
        self._shutdown_event = asyncio.Event()
    
    async def start(self) -> None:
        """Start the executor pool."""
        if self._running:
            return
        
        self._running = True
        self._shutdown_event.clear()
        
        # Start workers
        for i in range(self.num_workers):
            worker_task = asyncio.create_task(self._worker_loop(i))
            self._workers.append(worker_task)
        
        print(f"ExecutorPool started with {self.num_workers} workers")
    
    async def stop(self) -> None:
        """Stop the executor pool."""
        if not self._running:
            return
        
        self._running = False
        self._shutdown_event.set()
        
        # Cancel all workers
        for worker_task in self._workers:
            worker_task.cancel()
        
        # Wait for workers to finish
        await asyncio.gather(*self._workers, return_exceptions=True)
        
        self._workers.clear()
        print("ExecutorPool stopped")
    
    async def _worker_loop(self, worker_id: int) -> None:
        """Worker loop for a single worker."""
        print(f"Worker {worker_id} started")
        
        while self._running and not self._shutdown_event.is_set():
            try:
                # Dequeue next mission (blocking)
                queued_mission = await self.mission_queue.dequeue()
                
                if queued_mission:
                    print(f"Worker {worker_id} executing mission: {queued_mission.mission_id}")
                    
                    # Load mission from MissionStore
                    mission = await self.mission_store.load(queued_mission.mission_id)
                    
                    if not mission:
                        print(f"Worker {worker_id} mission not found: {queued_mission.mission_id}")
                        await self.mission_queue.fail(queued_mission.mission_id)
                        continue
                    
                    # Execute mission through runtime router
                    if self.runtime_router:
                        result = await self.runtime_router.route(mission)
                        print(f"Worker {worker_id} mission result: {result}")
                    
                    # Mark mission as completed
                    await self.mission_queue.complete(queued_mission.mission_id)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Worker {worker_id} error: {e}")
                # Mark mission as failed if we have one
                # This would need to be tracked per worker
        
        print(f"Worker {worker_id} stopped")
    
    async def submit_mission(self, mission: Any) -> str:
        """
        Submit a mission to the queue.
        
        Args:
            mission: Mission object
        
        Returns:
            Mission ID
        """
        # Save mission to MissionStore
        await self.mission_store.save(mission)
        
        # Enqueue only mission_id
        await self.mission_queue.enqueue(
            mission.mission_id,
            priority=getattr(mission, 'priority', 0)
        )
        
        return mission.mission_id
    
    async def get_queue_size(self) -> int:
        """Get current queue size."""
        return await self.mission_queue.size()
    
    async def get_worker_count(self) -> int:
        """Get number of active workers."""
        return len([w for w in self._workers if not w.done()])
    
    @property
    def is_running(self) -> bool:
        """Check if executor pool is running."""
        return self._running
