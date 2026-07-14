"""
Execution Pipeline Stages - Configurable, independently testable stages.

This module defines execution pipeline stages as objects:
- AcquireLeaseStage
- LoadMissionStage
- ResolveCapabilityStage
- ExecuteCapabilityStage
- PersistArtifactStage
- EmitEventsStage
- ReleaseLeaseStage

Each stage is independently testable and configurable.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from datetime import datetime
import asyncio

from hermes.runtime.execution_context import ExecutionContext


class PipelineStage(ABC):
    """Abstract base class for pipeline stages."""
    
    @abstractmethod
    async def execute(self, context: ExecutionContext) -> ExecutionContext:
        """
        Execute the stage.
        
        Args:
            context: Execution context
        
        Returns:
            Updated context
        """
        pass


class AcquireLeaseStage(PipelineStage):
    """Stage 1: Acquire lease for mission execution."""
    
    def __init__(self, lease_manager, state_store, event_bus):
        self.lease_manager = lease_manager
        self.state_store = state_store
        self.event_bus = event_bus
    
    async def execute(self, context: ExecutionContext) -> ExecutionContext:
        """Acquire lease for mission execution."""
        mission_id = context.mission_id
        
        lease = await self.lease_manager.acquire(mission_id, ttl=300)
        
        if not lease:
            raise RuntimeError(f"Failed to acquire lease for mission {mission_id}")
        
        # Update state to running
        from hermes.execution.state_store import MissionLifecycleState
        await self.state_store.update_lifecycle(
            mission_id,
            MissionLifecycleState.RUNNING,
            lease_id=lease.lease_id
        )
        
        # Emit event
        await self.event_bus.emit("MissionStarted", {"mission_id": mission_id})
        
        return context.with_lease(lease)


class LoadMissionStage(PipelineStage):
    """Stage 2: Load mission state."""
    
    def __init__(self, state_store):
        self.state_store = state_store
    
    async def execute(self, context: ExecutionContext) -> ExecutionContext:
        """Load mission state."""
        mission_id = context.mission_id
        
        state = await self.state_store.load(mission_id)
        
        if not state:
            raise RuntimeError(f"Mission {mission_id} not found")
        
        return context.with_mission_state(state)


class ResolveCapabilityStage(PipelineStage):
    """Stage 3: Resolve capability from mission."""
    
    def __init__(self, capability_resolver, event_bus):
        self.capability_resolver = capability_resolver
        self.event_bus = event_bus
    
    async def execute(self, context: ExecutionContext) -> ExecutionContext:
        """Resolve capability from mission."""
        mission = context.mission
        
        capability = self.capability_resolver.resolve_from_mission(mission)
        
        # Emit event
        await self.event_bus.emit("CapabilityStarted", {
            "mission_id": mission.mission_id,
            "capability": mission.capability
        })
        
        return context.with_capability(capability)


class ExecuteCapabilityStage(PipelineStage):
    """Stage 4: Execute capability."""
    
    async def execute(self, context: ExecutionContext) -> ExecutionContext:
        """Execute capability."""
        capability = context.capability
        mission = context.mission
        
        inputs = mission.inputs
        result = await capability.execute(inputs)
        
        return context.with_result(result)


class PersistArtifactStage(PipelineStage):
    """Stage 5: Persist artifact to repository."""
    
    def __init__(self, artifact_repository, event_bus):
        self.artifact_repository = artifact_repository
        self.event_bus = event_bus
    
    async def execute(self, context: ExecutionContext) -> ExecutionContext:
        """Persist artifact to repository."""
        result = context.result
        mission_id = context.mission_id
        
        artifact = await self.artifact_repository.store(result, mission_id)
        
        # Emit event
        await self.event_bus.emit("ArtifactCreated", {
            "mission_id": mission_id,
            "artifact_id": artifact.artifact_id
        })
        
        return context.with_artifact(artifact)


class EmitEventsStage(PipelineStage):
    """Stage 6: Emit completion events."""
    
    def __init__(self, event_bus):
        self.event_bus = event_bus
    
    async def execute(self, context: ExecutionContext) -> ExecutionContext:
        """Emit completion events."""
        mission_id = context.mission_id
        artifact = context.artifact
        
        await self.event_bus.emit("MissionCompleted", {
            "mission_id": mission_id,
            "artifact_id": artifact.artifact_id if artifact else None
        })
        
        return context.mark_completed()


class ReleaseLeaseStage(PipelineStage):
    """Stage 7: Release lease."""
    
    def __init__(self, lease_manager):
        self.lease_manager = lease_manager
    
    async def execute(self, context: ExecutionContext) -> ExecutionContext:
        """Release lease."""
        lease = context.lease
        
        await self.lease_manager.release(lease.lease_id)
        
        return context


class FailureHandlerStage(PipelineStage):
    """Stage: Handle execution failure."""
    
    def __init__(self, state_store, event_bus):
        self.state_store = state_store
        self.event_bus = event_bus
    
    async def execute(self, context: ExecutionContext) -> ExecutionContext:
        """Handle execution failure."""
        mission_id = context.mission_id
        error = context.error or "Unknown error"
        
        from hermes.execution.state_store import MissionLifecycleState
        await self.state_store.update_lifecycle(
            mission_id,
            MissionLifecycleState.FAILED,
            error=error
        )
        
        await self.event_bus.emit("MissionFailed", {
            "mission_id": mission_id,
            "error": error
        })
        
        return context
