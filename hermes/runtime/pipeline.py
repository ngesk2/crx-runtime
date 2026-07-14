"""
Execution Pipeline - Configurable execution stages.

This service provides a pipeline of execution stages:
- AcquireLease
- LoadMission
- ResolveCapability
- Execute
- PersistArtifact
- EmitEvents
- ReleaseLease

Each stage is independently testable and configurable.
Supports hooks for before_execute, after_execute, and middleware.
"""

from typing import Any, Dict, Optional, Callable, List
from datetime import datetime
import asyncio

from hermes.execution import MissionStateStore, MissionLifecycleState, LeaseManager
from hermes.runtime.resolver import CapabilityResolver
from hermes.runtime.artifact_repository import CanonicalArtifactRepository
from hermes.runtime.event_bus import EventBus
from hermes.runtime.pipeline_stages import (
    AcquireLeaseStage, LoadMissionStage, ResolveCapabilityStage,
    ExecuteCapabilityStage, PersistArtifactStage, EmitEventsStage,
    ReleaseLeaseStage, FailureHandlerStage
)
from hermes.runtime.execution_context import ExecutionContext


class ExecutionPipeline:
    """
    Execution pipeline with configurable stages.
    
    Each stage is a separate object that can be tested independently.
    Pipeline orchestrates the flow from mission to completion.
    """
    
    def __init__(
        self,
        state_store: MissionStateStore,
        lease_manager: LeaseManager,
        capability_resolver: CapabilityResolver,
        artifact_repository: CanonicalArtifactRepository,
        event_bus: EventBus
    ):
        self.state_store = state_store
        self.lease_manager = lease_manager
        self.capability_resolver = capability_resolver
        self.artifact_repository = artifact_repository
        self.event_bus = event_bus
        
        # Configure pipeline stages
        self.stages = [
            AcquireLeaseStage(lease_manager, state_store, event_bus),
            LoadMissionStage(state_store),
            ResolveCapabilityStage(capability_resolver, event_bus),
            ExecuteCapabilityStage(),
            PersistArtifactStage(artifact_repository, event_bus),
            EmitEventsStage(event_bus),
            ReleaseLeaseStage(lease_manager),
        ]
        
        # Failure handler
        self.failure_handler = FailureHandlerStage(state_store, event_bus)
        
        # Hooks
        self._before_execute_hooks: List[Callable] = []
        self._after_execute_hooks: List[Callable] = []
        self._middleware: List[Callable] = []
    
    async def execute(self, mission: Any) -> Dict[str, Any]:
        """
        Execute mission through pipeline.
        
        Args:
            mission: Mission object
        
        Returns:
            Execution result
        """
        mission_id = getattr(mission, 'mission_id', mission.get('mission_id') if isinstance(mission, dict) else None)
        
        context = ExecutionContext(
            mission_id=mission_id,
            mission=mission
        )
        
        try:
            # Execute before_execute hooks
            for hook in self._before_execute_hooks:
                context = await self._execute_hook(hook, context)
            
            # Execute middleware
            for middleware in self._middleware:
                context = await self._execute_hook(middleware, context)
            
            # Execute each stage
            for stage in self.stages:
                context = await stage.execute(context)
            
            # Execute after_execute hooks
            for hook in self._after_execute_hooks:
                context = await self._execute_hook(hook, context)
            
            return {
                "mission_id": mission_id,
                "status": "completed",
                "artifact_id": context.artifact.artifact_id if context.artifact else None,
                "result": context.result
            }
        
        except Exception as e:
            # Handle failure
            context = context.with_error(str(e))
            await self.failure_handler.execute(context.to_dict())
            raise
    
    async def _execute_hook(self, hook: Callable, context: ExecutionContext) -> ExecutionContext:
        """Execute a hook with error handling."""
        try:
            if asyncio.iscoroutinefunction(hook):
                result = await hook(context)
            else:
                result = hook(context)
            
            # If hook returns an ExecutionContext, use it
            if isinstance(result, ExecutionContext):
                return result
            
            # If hook returns a dict, convert to ExecutionContext
            if isinstance(result, dict):
                return ExecutionContext.from_dict(result)
            
            return context
        except Exception as e:
            # Log error but don't stop pipeline
            print(f"Hook execution error: {e}")
            return context
    
    def add_before_execute_hook(self, hook: Callable) -> None:
        """Add a hook to execute before pipeline starts."""
        self._before_execute_hooks.append(hook)
    
    def add_after_execute_hook(self, hook: Callable) -> None:
        """Add a hook to execute after pipeline completes."""
        self._after_execute_hooks.append(hook)
    
    def add_middleware(self, middleware: Callable) -> None:
        """Add middleware to execute before stages."""
        self._middleware.append(middleware)
    
    def remove_before_execute_hook(self, hook: Callable) -> None:
        """Remove a before_execute hook."""
        if hook in self._before_execute_hooks:
            self._before_execute_hooks.remove(hook)
    
    def remove_after_execute_hook(self, hook: Callable) -> None:
        """Remove an after_execute hook."""
        if hook in self._after_execute_hooks:
            self._after_execute_hooks.remove(hook)
    
    def remove_middleware(self, middleware: Callable) -> None:
        """Remove middleware."""
        if middleware in self._middleware:
            self._middleware.remove(middleware)
    
    def add_stage(self, stage, position: Optional[int] = None):
        """
        Add a stage to the pipeline.
        
        Args:
            stage: Pipeline stage instance
            position: Optional position to insert (default: append)
        """
        if position is None:
            self.stages.append(stage)
        else:
            self.stages.insert(position, stage)
    
    def remove_stage(self, stage_name: str):
        """
        Remove a stage from the pipeline by name.
        
        Args:
            stage_name: Name of stage class to remove
        """
        self.stages = [s for s in self.stages if s.__class__.__name__ != stage_name]
