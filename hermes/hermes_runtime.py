"""
Hermes Runtime - Single entry point for mission execution.

Responsibilities:
- initialize registries
- initialize capabilities
- initialize authorities
- initialize event store
- initialize scheduler
- initialize mission queue

Single entry point.
"""

import asyncio
import signal
import sys
from typing import Optional, Dict, Any
from datetime import datetime

from constitution.registry import CapabilityRegistry, get_registry
from hermes.execution import MissionQueue, RuntimeState, RuntimeLifecycle, LeaseManager, MissionStateStore
from hermes.runtime import (
    RuntimeRouter, CapabilityResolver, ExecutionPipeline,
    CanonicalArtifactRepository, EventBus, MissionFactory,
    MissionSerializer, BootstrapLoader
)


class HermesRuntime:
    """
    Hermes Runtime - Single entry point for mission execution.
    
    Persistent long-running process that survives requests and owns:
    - Mission execution
    - Scheduling
    - Retries
    - State management
    """
    
    def __init__(self, db_path: str = "hermes_missions.db"):
        self.db_path = db_path
        self.runtime_state = RuntimeState()
        
        # Core components
        self.capability_registry = get_registry()
        self.mission_queue = MissionQueue()
        self.lease_manager = LeaseManager()
        self.state_store = MissionStateStore(db_path)
        
        # Runtime services
        self.event_bus = EventBus()
        self.artifact_repository = CanonicalArtifactRepository(self.event_bus)
        self.capability_resolver = CapabilityResolver(self.capability_registry)
        self.execution_pipeline = ExecutionPipeline(
            state_store=self.state_store,
            lease_manager=self.lease_manager,
            capability_resolver=self.capability_resolver,
            artifact_repository=self.artifact_repository,
            event_bus=self.event_bus
        )
        self.runtime_router = RuntimeRouter(
            capability_resolver=self.capability_resolver,
            execution_pipeline=self.execution_pipeline
        )
        self.mission_factory = MissionFactory()
        self.mission_serializer = MissionSerializer()
        self.bootstrap_loader = BootstrapLoader()
        
        # Event store (will be initialized)
        self.event_store = None
        
        # Scheduler (will use existing kernel.scheduler.Scheduler)
        self.scheduler = None
        
        # Control
        self._running = False
        self._shutdown_event = asyncio.Event()
        self._executor_task: Optional[asyncio.Task] = None
    
    async def start(self) -> None:
        """Start the Hermes Runtime."""
        print("Starting Hermes Runtime...")
        
        # Update runtime state
        self.runtime_state.start()
        
        # Initialize state store
        await self.state_store.initialize()
        
        # Bootstrap registration using YAML manifest
        await self.bootstrap_loader.register_all()
        
        # Initialize scheduler (use existing kernel.scheduler.Scheduler)
        from kernel.scheduler import Scheduler
        self.scheduler = Scheduler()
        await self.scheduler.start()
        
        # Update runtime state to running
        self.runtime_state.running()
        
        # Start mission executor loop
        self._executor_task = asyncio.create_task(self._executor_loop())
        
        # Setup signal handlers
        self._setup_signal_handlers()
        
        print("Hermes Runtime started")
    
    async def stop(self) -> None:
        """Stop the Hermes Runtime gracefully."""
        print("Stopping Hermes Runtime...")
        
        # Update runtime state
        self.runtime_state.stopping()
        
        # Signal shutdown
        self._shutdown_event.set()
        
        # Stop executor loop
        if self._executor_task:
            self._executor_task.cancel()
            try:
                await self._executor_task
            except asyncio.CancelledError:
                pass
        
        # Stop scheduler
        if self.scheduler:
            await self.scheduler.stop()
        
        # Shutdown capabilities
        await self.capability_registry.shutdown_all()
        
        # Update runtime state
        self.runtime_state.stop()
        
        print("Hermes Runtime stopped")
    
    async def submit_mission(
        self,
        capability: str,
        inputs: Dict[str, Any],
        goal_id: Optional[str] = None,
        description: Optional[str] = None,
        priority: int = 0,
        constraints: Optional[list[str]] = None,
        created_by: Optional[str] = None
    ) -> str:
        """
        Submit a mission for execution.
        
        Args:
            capability: Capability identifier (e.g., "github.acquire_repository")
            inputs: Capability inputs
            goal_id: Optional goal ID
            description: Optional description
            priority: Mission priority
            constraints: Optional constraint IDs
            created_by: Optional creator identity
        
        Returns:
            Mission ID
        """
        # Create mission using factory
        mission = self.mission_factory.create(
            capability=capability,
            inputs=inputs,
            goal_id=goal_id,
            description=description,
            priority=priority,
            constraints=constraints,
            created_by=created_by
        )
        
        print(f"Submitting mission: {mission.mission_id}")
        
        # Serialize mission for queue
        mission_data = self.mission_serializer.serialize(mission)
        
        # Enqueue mission
        await self.mission_queue.enqueue(
            mission_id=mission.mission_id,
            mission_data=mission_data,
            priority=mission.priority
        )
        
        # Create initial state
        from hermes.execution.state_store import MissionState, MissionLifecycleState
        state = MissionState(
            mission_id=mission.mission_id,
            lifecycle=MissionLifecycleState.QUEUED,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        await self.state_store.save(state)
        
        # Emit event
        await self.event_bus.emit("MissionQueued", {"mission_id": mission.mission_id})
        
        # Increment mission count
        self.runtime_state.increment_mission_count()
        
        return mission.mission_id
    
    async def cancel_mission(self, mission_id: str) -> bool:
        """Cancel a mission."""
        # Cancel in queue
        cancelled = await self.mission_queue.cancel(mission_id)
        
        if cancelled:
            # Update state
            from hermes.execution.state_store import MissionLifecycleState
            await self.state_store.update_lifecycle(
                mission_id,
                MissionLifecycleState.CANCELLED
            )
            print(f"Cancelled mission: {mission_id}")
            return True
        
        return False
    
    async def get_mission_status(self, mission_id: str) -> Optional[Dict[str, Any]]:
        """Get the status of a mission."""
        state = await self.state_store.load(mission_id)
        if not state:
            return None
        
        return {
            "mission_id": state.mission_id,
            "lifecycle": state.lifecycle.value,
            "created_at": state.created_at.isoformat(),
            "updated_at": state.updated_at.isoformat(),
            "result": state.result,
            "error": state.error,
            "lease_id": state.lease_id
        }
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get runtime statistics."""
        queue_size = await self.mission_queue.size()
        
        return {
            "runtime_state": self.runtime_state.to_dict(),
            "queue_size": queue_size,
            "scheduler_queue_depth": self.scheduler.get_queue_depth() if self.scheduler else 0,
            "active_jobs": len(self.scheduler.get_active_jobs()) if self.scheduler else 0,
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for the runtime."""
        return {
            "healthy": self.runtime_state.healthy,
            "lifecycle": self.runtime_state.lifecycle.value,
            "uptime_seconds": self.runtime_state.uptime_seconds,
            "mission_count": self.runtime_state.mission_count,
            "active_lease": self.runtime_state.active_lease,
        }
    
    def _setup_signal_handlers(self) -> None:
        """Setup signal handlers for graceful shutdown."""
        if sys.platform != "win32":
            for sig in (signal.SIGTERM, signal.SIGINT):
                signal.signal(sig, self._signal_handler)
    
    def _signal_handler(self, signum, frame) -> None:
        """Handle shutdown signals."""
        print(f"Received signal {signum}, initiating shutdown...")
        self._shutdown_event.set()
    
    async def _executor_loop(self) -> None:
        """Main mission executor loop."""
        while self._running and not self._shutdown_event.is_set():
            try:
                # Dequeue next mission (blocking)
                queued_mission = await self.mission_queue.dequeue()
                
                if queued_mission:
                    print(f"Executing mission: {queued_mission.mission_id}")
                    
                    # Reconstruct mission using factory
                    mission = self.mission_factory.reconstruct(queued_mission.mission_data)
                    
                    # Execute mission through runtime router
                    result = await self.runtime_router.route(mission)
                    print(f"Mission result: {result}")
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Executor loop error: {e}")
    
    @property
    def _running(self) -> bool:
        """Check if runtime is running."""
        return self.runtime_state.lifecycle in [
            RuntimeLifecycle.STARTING,
            RuntimeLifecycle.RUNNING
        ]


async def main():
    """Main entry point for Hermes Runtime."""
    runtime = HermesRuntime()
    
    try:
        await runtime.start()
        
        # Keep running until shutdown
        await runtime._shutdown_event.wait()
        
    finally:
        await runtime.stop()


if __name__ == "__main__":
    asyncio.run(main())
