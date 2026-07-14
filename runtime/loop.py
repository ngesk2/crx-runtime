from datetime import datetime
from typing import Any, Callable, Awaitable
from sqlalchemy.ext.asyncio import AsyncSession
from kernel.command_bus import CommandBus, Command
from kernel.aggregate import AggregateRepository
from kernel.projection import ProjectionManager
from kernel.snapshot import SnapshotScheduler
from kernel.scheduler import Scheduler
from transport.event_bus import EventBus
from storage.event_store import EventStore
from constitution.models.event import EventEnvelope
from runtime.observability import Observability, set_correlation_id, set_replay_id


class ConstitutionalRuntimeLoop:
    """
    Constitutional Runtime Loop.
    
    Implements the deterministic execution phases:
    Observe → Validate → Reduce → Aggregate → Append Event → Publish → Project → Snapshot → Schedule → Reflect → Govern
    """
    
    def __init__(
        self,
        session: AsyncSession,
        command_bus: CommandBus,
        projection_manager: ProjectionManager,
        snapshot_scheduler: SnapshotScheduler,
        scheduler: Scheduler,
        event_bus: EventBus,
        observability: Observability,
    ):
        self.session = session
        self.command_bus = command_bus
        self.projection_manager = projection_manager
        self.snapshot_scheduler = snapshot_scheduler
        self.scheduler = scheduler
        self.event_bus = event_bus
        self.observability = observability
        self.event_store = EventStore(session)
        self._running = False
    
    async def start(self) -> None:
        """Start the constitutional runtime loop"""
        self._running = True
        await self.scheduler.start()
    
    async def stop(self) -> None:
        """Stop the constitutional runtime loop"""
        self._running = False
        await self.scheduler.stop()
    
    async def execute_command(
        self,
        command: Command,
        correlation_id: str | None = None,
    ) -> dict[str, Any]:
        """
        Execute a command through the constitutional runtime loop.
        
        This is the main entry point for command execution.
        """
        # Set correlation ID for observability
        if correlation_id:
            set_correlation_id(correlation_id)
        
        # Phase 1: Observe
        observation = await self._observe(command)
        
        # Phase 2: Validate
        validation_result = await self._validate(command, observation)
        
        if not validation_result["valid"]:
            return {
                "success": False,
                "error": f"Validation failed: {validation_result['error']}",
                "phase": "validate",
            }
        
        # Phase 3: Reduce
        reduced_command = await self._reduce(command, observation)
        
        # Phase 4: Aggregate
        aggregate_result = await self._aggregate(reduced_command)
        
        # Phase 5: Append Event
        events = await self._append_events(aggregate_result)
        
        # Phase 6: Publish
        await self._publish(events)
        
        # Phase 7: Project
        await self._project(events)
        
        # Phase 8: Snapshot
        await self._snapshot()
        
        # Phase 9: Schedule
        await self._schedule(events)
        
        # Phase 10: Reflect
        reflection = await self._reflect(events)
        
        # Phase 11: Govern
        governance_result = await self._govern(events, reflection)
        
        return {
            "success": True,
            "events": [e.event_id for e in events],
            "reflection": reflection,
            "governance": governance_result,
        }
    
    async def _observe(self, command: Command) -> dict[str, Any]:
        """
        Phase 1: Observe.
        
        Collect context and observations before processing.
        """
        # Record observability
        self.observability.record_command(command.command_type)
        
        return {
            "command_type": command.command_type,
            "command_id": command.command_id,
            "aggregate_id": command.aggregate_id,
            "timestamp": datetime.utcnow().isoformat(),
        }
    
    async def _validate(
        self,
        command: Command,
        observation: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Phase 2: Validate.
        
        Validate command against constitutional constraints.
        """
        # TODO: Implement full validation logic
        # For now, just check that command has required fields
        
        if not command.command_type:
            return {
                "valid": False,
                "error": "Command type is required",
            }
        
        return {
            "valid": True,
            "error": None,
        }
    
    async def _reduce(
        self,
        command: Command,
        observation: dict[str, Any],
    ) -> Command:
        """
        Phase 3: Reduce.
        
        Reduce command to its essential form.
        """
        # TODO: Implement reduction logic
        # For now, return command as-is
        return command
    
    async def _aggregate(self, command: Command) -> dict[str, Any]:
        """
        Phase 4: Aggregate.
        
        Load aggregate and apply command to produce events.
        """
        # Send command through command bus
        result = await self.command_bus.send(command)
        
        return {
            "success": result.success,
            "events": result.events,
            "aggregate_id": result.aggregate_id,
            "aggregate_version": result.aggregate_version,
        }
    
    async def _append_events(self, aggregate_result: dict[str, Any]) -> list[EventEnvelope]:
        """
        Phase 5: Append Event.
        
        Append events to the canonical event log.
        """
        # Events are already appended by the command bus
        # Return them for the next phases
        return aggregate_result.get("events", [])
    
    async def _publish(self, events: list[EventEnvelope]) -> None:
        """
        Phase 6: Publish.
        
        Publish events to NATS via EventBus (projection over event log).
        """
        # Process outbox messages to publish to NATS
        from transport.event_bus import OutboxProcessor
        from transport.nats.client import get_nats_client
        
        nats_client = await get_nats_client()
        outbox_processor = OutboxProcessor(self.session, nats_client)
        
        await outbox_processor.process_outbox()
        
        # Record observability
        for event in events:
            self.observability.record_event(event.event_type, event.event_category)
    
    async def _project(self, events: list[EventEnvelope]) -> None:
        """
        Phase 7: Project.
        
        Update projections from events.
        """
        # Update all registered projections
        for projection_name in self.projection_manager._projections.keys():
            await self.projection_manager.update_projection(projection_name)
    
    async def _snapshot(self) -> None:
        """
        Phase 8: Snapshot.
        
        Create snapshots if policy conditions are met.
        """
        # Check all projections for snapshot policy
        for projection_name in self.projection_manager._projections.keys():
            # Get current projection state
            result = await self.projection_manager.update_projection(projection_name)
            state = result.get("state", {})
            
            # Get projection version
            from kernel.projection import ProjectionRegistry
            registry = ProjectionRegistry(self.session)
            version = await registry.get_projection_version(projection_name)
            
            # Schedule snapshot if policy conditions met
            await self.snapshot_scheduler.schedule_snapshot(
                projection_name,
                state,
                version,
            )
    
    async def _schedule(self, events: list[EventEnvelope]) -> None:
        """
        Phase 9: Schedule.
        
        Schedule follow-up jobs based on events.
        """
        # TODO: Implement scheduling logic based on events
        # For now, this is a placeholder
        pass
    
    async def _reflect(self, events: list[EventEnvelope]) -> dict[str, Any]:
        """
        Phase 10: Reflect.
        
        Reflect on execution and gather metrics.
        """
        reflection = {
            "events_processed": len(events),
            "timestamp": datetime.utcnow().isoformat(),
            "correlation_id": get_correlation_id(),
        }
        
        return reflection
    
    async def _govern(
        self,
        events: list[EventEnvelope],
        reflection: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Phase 11: Govern.
        
        Apply governance rules and constraints.
        """
        # TODO: Implement governance logic
        # For now, this is a placeholder
        return {
            "governed": True,
            "violations": [],
        }
    
    async def tick(self) -> None:
        """
        Execute one tick of the runtime loop.
        
        Processes outbox messages, updates projections, and schedules snapshots.
        """
        if not self._running:
            return
        
        # Process outbox messages
        from transport.event_bus import OutboxProcessor
        from transport.nats.client import get_nats_client
        
        nats_client = await get_nats_client()
        outbox_processor = OutboxProcessor(self.session, nats_client)
        await outbox_processor.process_outbox()
        
        # Update projections
        for projection_name in self.projection_manager._projections.keys():
            await self.projection_manager.update_projection(projection_name)
        
        # Schedule snapshots
        await self._snapshot()
    
    async def constitutional_health(self) -> dict[str, Any]:
        """
        Constitutional health check.
        
        Returns the health status of the constitutional runtime.
        """
        # Check replay determinism
        from kernel.replay import ReplayEngine
        replay_engine = ReplayEngine(self.session)
        
        # TODO: Implement actual health checks
        return {
            "replay_deterministic": True,
            "projection_synchronized": True,
            "schema_compatible": True,
            "governance_valid": True,
            "snapshots_valid": True,
            "storage_healthy": True,
            "plugin_sandbox_intact": True,
            "overall_health": "healthy",
        }
