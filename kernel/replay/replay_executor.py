"""
Replay Executor

Replay executor.
Executes replay according to plan.
"""

from typing import Any, Callable
from kernel.replay.event_stream import EventStream
from kernel.replay.replay_planner import ReplayPlan
from constitution.models.event import EventEnvelope
from constitution.transcript import ReplayTranscript
from runtime.context import RuntimeContext


class ReplayExecutor:
    """
    Replay executor.
    
    Executes replay according to plan.
    """
    
    def __init__(self, ctx: RuntimeContext, event_stream: EventStream):
        self.ctx = ctx
        self.event_stream = event_stream
    
    async def execute(
        self,
        plan: ReplayPlan,
        projection_handler: Callable[[dict[str, Any], EventEnvelope], dict[str, Any]],
    ) -> ReplayTranscript:
        """Execute replay according to plan."""
        if plan.strategy == "from_zero":
            return await self._execute_from_zero(plan, projection_handler)
        else:
            return await self._execute_from_zero(plan, projection_handler)
    
    async def _execute_from_zero(
        self,
        plan: ReplayPlan,
        projection_handler: Callable[[dict[str, Any], EventEnvelope], dict[str, Any]],
    ) -> ReplayTranscript:
        """Execute replay from zero."""
        # Load events
        events = []
        async for event in self.event_stream.read(from_sequence=plan.from_sequence):
            events.append(event)
        
        # Replay events
        state = {}
        for event in events:
            state = await projection_handler(state, event)
        
        # Create transcript (events encoded as source of truth)
        transcript = ReplayTranscript.create(
            events=events,
            authority_version=plan.authority_version,
            from_sequence=plan.from_sequence,
            metadata={"final_state": state},
        )
        
        return transcript
