"""
Replay Kernel

Replay kernel coordinator.
Coordinates replay planning, execution, verification, and witness computation.
Projection is merely one replay consumer.
"""

from dataclasses import dataclass
from typing import Any, Callable
from kernel.replay.event_stream import EventStream
from kernel.replay.replay_planner import ReplayPlanner
from kernel.replay.replay_executor import ReplayExecutor
from kernel.replay.replay_verifier import ReplayVerifier
from constitution.models.event import EventEnvelope
from constitution.transcript import ReplayTranscript
from constitution.authority.canonical_authority import ReplayWitness
from constitution.authority import CanonicalAuthority
from constitution.value_objects import ReplayId
from runtime.context import RuntimeContext


@dataclass(frozen=True)
class ReplayResult:
    """
    Replay result value object.
    """
    replay_id: ReplayId
    transcript: ReplayTranscript
    witness: ReplayWitness
    verified: bool


class ReplayKernel:
    """
    Replay kernel coordinator.
    
    Coordinates replay planning, execution, verification, and witness computation.
    Projection is merely one replay consumer.
    """
    
    def __init__(
        self,
        ctx: RuntimeContext,
        planner: ReplayPlanner,
        executor: ReplayExecutor,
        verifier: ReplayVerifier,
    ):
        self.ctx = ctx
        self.planner = planner
        self.executor = executor
        self.verifier = verifier
        self.authority = CanonicalAuthority()
    
    async def replay(
        self,
        projection_name: str,
        projection_handler: Callable[[dict[str, Any], EventEnvelope], dict[str, Any]],
        mode: str = "from_zero",
    ) -> ReplayResult:
        """
        Replay projection.
        
        Mirrors FoundationDB separation of storage from simulation.
        """
        # Plan replay
        plan = await self.planner.plan(projection_name, mode)
        
        # Execute replay
        transcript = await self.executor.execute(plan, projection_handler)
        
        # Verify replay
        verified = await self.verifier.verify(transcript)
        
        # Compute witness using CanonicalAuthority (single source of truth)
        final_state = transcript.metadata.get("final_state", {})
        events = list(transcript.decode())  # Decode events from transcript
        witness = self.authority.compute_witness(final_state, events)
        
        # Generate replay ID
        replay_id = ReplayId(value=self.authority.hash_dict({
            'transcript_hash': transcript.transcript_hash.value,
            'witness_hash': witness.verification_stamp,
        }))
        
        return ReplayResult(
            replay_id=replay_id,
            transcript=transcript,
            witness=witness,
            verified=verified,
        )
