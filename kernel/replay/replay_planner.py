"""
Replay Planner

Replay execution planner.
Plans how to execute replay (from zero, from snapshot, distributed).
"""

from dataclasses import dataclass
from typing import Any
from kernel.replay.event_stream import EventStream
from runtime.context import RuntimeContext
from constitution.value_objects import ConstitutionalFailure, FailureCode


@dataclass(frozen=True)
class ReplayPlan:
    """Replay execution plan."""
    projection_name: str
    strategy: str
    from_sequence: int
    snapshot: Any = None
    authority_version: str = "1.0.0"
    checkpoint: dict[str, Any] = None


class ReplayPlanner:
    """
    Replay execution planner.
    
    Plans how to execute replay (from zero, from snapshot, distributed).
    """
    
    def __init__(self, ctx: RuntimeContext, event_stream: EventStream):
        self.ctx = ctx
        self.event_stream = event_stream
    
    async def plan(self, projection_name: str, mode: str) -> ReplayPlan:
        """Plan replay execution."""
        if mode == "from_zero":
            return await self._plan_from_zero(projection_name)
        elif mode == "from_snapshot":
            return await self._plan_from_snapshot(projection_name)
        else:
            return await self._plan_from_zero(projection_name)
    
    async def _plan_from_zero(self, projection_name: str) -> ReplayPlan:
        """Plan replay from zero."""
        last_sequence = await self.event_stream.get_last_global_sequence()
        
        return ReplayPlan(
            projection_name=projection_name,
            strategy="from_zero",
            from_sequence=0,
            authority_version="1.0.0",
            checkpoint={"last_global_sequence": last_sequence},
        )
    
    async def _plan_from_snapshot(self, projection_name: str) -> ReplayPlan:
        """Plan replay from snapshot."""
        raise ConstitutionalFailure(
            code=FailureCode.STORAGE_VIOLATION,
            message="Snapshot replay not yet implemented",
            violations=[],
            evidence=[],
            location="ReplayPlanner._plan_from_snapshot",
        )
