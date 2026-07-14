"""
Constitutional Execution Pipeline

Each stage is:
- Deterministic
- Independently testable
- Independently replayable
- Independently verifiable

Pipeline stages:
Command
↓
Validation
↓
Authorization
↓
Transition
↓
Invariant
↓
Canonical Authority
↓
Intent Emission
↓
Result
"""

from dataclasses import dataclass
from typing import Any, Callable
from constitution.models.event import EventEnvelope
from kernel.state_machine import StateMachine, StateTransition
from kernel.invariant_engine import InvariantEngine
from constitution.authority import CanonicalAuthority
from constitution.intents import PersistenceIntent, PublicationIntent
from constitution.authority.canonical_authority import ReplayWitness as ConstitutionalReplayWitness
from constitution.value_objects import ConstitutionalFailure, FailureCode


@dataclass(frozen=True)
class PipelineResult:
    """Pipeline execution result."""
    transition: StateTransition
    events: list[EventEnvelope]
    witness: ConstitutionalReplayWitness
    persistence_intent: PersistenceIntent
    publication_intent: PublicationIntent
    error: str = None


class CommandValidator:
    """Command validator."""
    
    def __init__(self, ctx: Any):
        self.ctx = ctx
    
    async def validate(self, command: dict[str, Any]) -> dict[str, Any]:
        """Validate command schema."""
        if not command:
            raise ConstitutionalFailure(
                code=FailureCode.TRANSITION_VIOLATION,
                message="Command cannot be empty",
                violations=[],
                evidence=[],
                location="CommandValidator.validate",
            )
        
        if "command_type" not in command:
            raise ConstitutionalFailure(
                code=FailureCode.TRANSITION_VIOLATION,
                message="Command must have command_type",
                violations=[],
                evidence=[{"command": command}],
                location="CommandValidator.validate",
            )
        
        return {"valid": True, "command": command}


class CommandAuthorizer:
    """Command authorizer."""
    
    def __init__(self, ctx: Any):
        self.ctx = ctx
    
    async def authorize(self, command: dict[str, Any]) -> dict[str, Any]:
        """Check permissions."""
        # Authorization is constitutional (must happen), but access control logic is infrastructure
        # For now, authorize all commands (infrastructure TBD)
        return {"authorized": True, "command": command}


class ConstitutionalExecutionPipeline:
    """
    Constitutional execution pipeline.
    
    Each stage is deterministic, independently testable, independently replayable, independently verifiable.
    Emits intents for infrastructure adapters to execute.
    """
    
    def __init__(
        self,
        ctx: Any,
        validator: CommandValidator,
        authorizer: CommandAuthorizer,
        state_machine: StateMachine,
        invariant_engine: InvariantEngine,
        constitutional_authority: CanonicalAuthority,
    ):
        self.ctx = ctx
        self.validator = validator
        self.authorizer = authorizer
        self.state_machine = state_machine
        self.invariant_engine = invariant_engine
        self.constitutional_authority = constitutional_authority
    
    async def execute(self, command: dict[str, Any]) -> PipelineResult:
        """Execute command through pipeline."""
        
        # Stage 1: Validation
        validated = await self.validator.validate(command)
        if not validated["valid"]:
            return PipelineResult(
                transition=None,
                events=[],
                witness=None,
                persistence_intent=None,
                publication_intent=None,
                error=validated.get("error", "Validation failed"),
            )
        
        # Stage 2: Authorization
        authorized = await self.authorizer.authorize(validated["command"])
        if not authorized["authorized"]:
            return PipelineResult(
                transition=None,
                events=[],
                witness=None,
                persistence_intent=None,
                publication_intent=None,
                error=authorized.get("error", "Authorization failed"),
            )
        
        # Stage 3: State Transition
        transition = self.state_machine.transition(
            self.state_machine.initial_state,
            authorized["command"],
        )
        
        # Stage 4: Invariant Engine
        invariant_result = await self.invariant_engine.check_transition(transition)
        if not invariant_result.passed:
            return PipelineResult(
                transition=transition,
                events=[],
                witness=None,
                persistence_intent=None,
                publication_intent=None,
                error="Invariant violation",
            )
        
        # Stage 5: Canonical Authority
        canonical_events = []
        for event in transition.events:
            # Re-hash event through canonical authority
            event_id = self.constitutional_authority.hash_event(event)
            canonical_events.append(event)
        
        # Stage 6: Intent Emission
        persistence_intent = PersistenceIntent(
            events=canonical_events,
            metadata={"source": "execution_pipeline"},
        )
        
        publication_intent = PublicationIntent(
            events=canonical_events,
            topics=[f"constitutional.events.{event.event_type}" for event in canonical_events],
            metadata={"source": "execution_pipeline"},
        )
        
        # Stage 7: Witness Computation
        witness = self.constitutional_authority.compute_witness(
            transition.state,
            canonical_events,
        )
        
        return PipelineResult(
            transition=transition,
            events=canonical_events,
            witness=witness,
            persistence_intent=persistence_intent,
            publication_intent=publication_intent,
        )
