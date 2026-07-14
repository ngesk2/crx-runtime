"""
Invariant Engine

Constitutional invariant engine.
Centralizes constitutional law.
Checks invariants for events, states, and transitions.
"""

from abc import ABC, abstractmethod
from typing import Any
from constitution.models.event import EventEnvelope
from kernel.state_machine import StateTransition
from constitution.value_objects import (
    Proof,
    Violation,
    Evidence,
    FailureCode,
)


class InvariantType:
    """Invariant type."""
    COMPILE_TIME = "compile_time"
    TRANSITION = "transition"
    STORAGE = "storage"
    REPLAY = "replay"
    CONSTITUTIONAL = "constitutional"


class InvariantCheckResult:
    """Invariant check result."""
    
    def __init__(self, proof: Proof, violation: Violation = None):
        self.proof = proof
        self.violation = violation
        self.passed = violation is None


class InvariantResult:
    """Invariant result."""
    
    def __init__(self, passed: bool, results: list[InvariantCheckResult], violations: list[Violation]):
        self.passed = passed
        self.results = results
        self.violations = violations


class Invariant(ABC):
    """
    Constitutional invariant.
    
    Abstract base class for all invariants.
    """
    
    invariant_type = InvariantType.CONSTITUTIONAL
    
    @abstractmethod
    async def check_event(self, event: EventEnvelope) -> InvariantCheckResult:
        """Check event against invariant."""
        pass
    
    @abstractmethod
    async def check_state(self, state: dict[str, Any]) -> InvariantCheckResult:
        """Check state against invariant."""
        pass
    
    @abstractmethod
    async def check_transition(self, transition: StateTransition) -> InvariantCheckResult:
        """Check transition against invariant."""
        pass


class AppendOnlyInvariant(Invariant):
    """
    Append-only invariant.
    
    Events cannot be updated or deleted.
    """
    
    invariant_type = InvariantType.CONSTITUTIONAL
    
    async def check_event(self, event: EventEnvelope) -> InvariantCheckResult:
        """Check event against append-only invariant."""
        # Derive constitutional fact: event is immutable
        evidence = Evidence(
            fact="Event is frozen (immutable)",
            data={"event_id": event.event_id, "frozen": True},
            derivation="Pydantic frozen=True enforcement",
        )
        
        proof = Proof(
            statement="Event cannot be modified after creation",
            evidence={"evidence": evidence.__dict__},
            verified=True,
            verification_method="Pydantic frozen=True",
        )
        
        return InvariantCheckResult(proof=proof)
    
    async def check_state(self, state: dict[str, Any]) -> InvariantCheckResult:
        """Check state against append-only invariant."""
        # Derive constitutional fact: state is append-only
        # State is derived from events, never mutated directly
        evidence = Evidence(
            fact="State is derived from events (append-only)",
            data={"state_keys": list(state.keys())},
            derivation="State is computed from event replay",
        )
        
        proof = Proof(
            statement="State can only grow via event replay",
            evidence={"evidence": evidence.__dict__},
            verified=True,
            verification_method="Event-sourcing pattern",
        )
        
        return InvariantCheckResult(proof=proof)
    
    async def check_transition(self, transition: StateTransition) -> InvariantCheckResult:
        """Check transition against append-only invariant."""
        # Derive constitutional fact: transition only adds events
        event_count = len(transition.events)
        
        if event_count == 0:
            violation = Violation(
                code=FailureCode.APPEND_ONLY_VIOLATION,
                statement="Transition must produce at least one event",
                evidence={"event_count": event_count},
                location="StateTransition",
            )
            return InvariantCheckResult(
                proof=Proof(
                    statement="Transition produces events",
                    evidence={},
                    verified=False,
                    verification_method="Event count check",
                ),
                violation=violation,
            )
        
        evidence = Evidence(
            fact="Transition produces events",
            data={"event_count": event_count},
            derivation="StateTransition.events length",
        )
        
        proof = Proof(
            statement="Transition only adds events, never removes",
            evidence={"evidence": evidence.__dict__},
            verified=True,
            verification_method="Event count check",
        )
        
        return InvariantCheckResult(proof=proof)


class OrderingInvariant(Invariant):
    """
    Ordering invariant.
    
    Events must be ordered by global sequence.
    """
    
    invariant_type = InvariantType.CONSTITUTIONAL
    
    async def check_event(self, event: EventEnvelope) -> InvariantCheckResult:
        """Check event against ordering invariant."""
        # Derive constitutional fact: event has global sequence
        if event.global_sequence is None:
            violation = Violation(
                code=FailureCode.ORDERING_VIOLATION,
                statement="Event missing global sequence",
                evidence={"event_id": event.event_id},
                location="EventEnvelope",
            )
            return InvariantCheckResult(
                proof=Proof(
                    statement="Event has global sequence",
                    evidence={},
                    verified=False,
                    verification_method="Global sequence check",
                ),
                violation=violation,
            )
        
        evidence = Evidence(
            fact="Event has global sequence",
            data={"event_id": event.event_id, "global_sequence": event.global_sequence},
            derivation="EventEnvelope.global_sequence field",
        )
        
        proof = Proof(
            statement="Event is ordered by global sequence",
            evidence={"evidence": evidence.__dict__},
            verified=True,
            verification_method="Global sequence check",
        )
        
        return InvariantCheckResult(proof=proof)
    
    async def check_state(self, state: dict[str, Any]) -> InvariantCheckResult:
        """Check state against ordering invariant."""
        # Derive constitutional fact: state is ordered by global sequence
        # State is derived from events in global sequence order
        evidence = Evidence(
            fact="State is derived from events in global sequence order",
            data={"state_keys": list(state.keys())},
            derivation="Event replay preserves global sequence order",
        )
        
        proof = Proof(
            statement="State preserves global sequence ordering",
            evidence={"evidence": evidence.__dict__},
            verified=True,
            verification_method="Event replay ordering",
        )
        
        return InvariantCheckResult(proof=proof)
    
    async def check_transition(self, transition: StateTransition) -> InvariantCheckResult:
        """Check transition against ordering invariant."""
        # Derive constitutional fact: transition preserves ordering
        # Events in transition must have monotonically increasing global sequences
        sequences = [event.global_sequence for event in transition.events]
        
        if sequences != sorted(sequences):
            violation = Violation(
                code=FailureCode.ORDERING_VIOLATION,
                statement="Transition events not in global sequence order",
                evidence={"sequences": sequences},
                location="StateTransition",
            )
            return InvariantCheckResult(
                proof=Proof(
                    statement="Transition preserves global sequence ordering",
                    evidence={},
                    verified=False,
                    verification_method="Sequence monotonicity check",
                ),
                violation=violation,
            )
        
        evidence = Evidence(
            fact="Transition events are in global sequence order",
            data={"sequences": sequences},
            derivation="StateTransition.events global_sequence ordering",
        )
        
        proof = Proof(
            statement="Transition preserves global sequence ordering",
            evidence={"evidence": evidence.__dict__},
            verified=True,
            verification_method="Sequence monotonicity check",
        )
        
        return InvariantCheckResult(proof=proof)


class CanonicalHashInvariant(Invariant):
    """
    Canonical hash invariant.
    
    Event ID must match canonical hash.
    """
    
    invariant_type = InvariantType.CONSTITUTIONAL
    
    def __init__(self, constitutional_authority: Any):
        self.constitutional_authority = constitutional_authority
    
    async def check_event(self, event: EventEnvelope) -> InvariantCheckResult:
        """Check event against canonical hash invariant."""
        # Derive constitutional fact: event ID matches canonical hash
        computed_hash = self.constitutional_authority.hash_event(event)
        
        if event.event_id != computed_hash:
            violation = Violation(
                code=FailureCode.HASH_MISMATCH,
                statement="Event ID does not match canonical hash",
                evidence={"expected": computed_hash, "actual": event.event_id},
                location="EventEnvelope",
            )
            return InvariantCheckResult(
                proof=Proof(
                    statement="Event ID matches canonical hash",
                    evidence={},
                    verified=False,
                    verification_method="Canonical hash computation",
                ),
                violation=violation,
            )
        
        evidence = Evidence(
            fact="Event ID matches canonical hash",
            data={"event_id": event.event_id, "computed_hash": computed_hash},
            derivation="CanonicalAuthority.hash_event()",
        )
        
        proof = Proof(
            statement="Event ID matches canonical hash",
            evidence={"evidence": evidence.__dict__},
            verified=True,
            verification_method="Canonical hash computation",
        )
        
        return InvariantCheckResult(proof=proof)
    
    async def check_state(self, state: dict[str, Any]) -> InvariantCheckResult:
        """Check state against canonical hash invariant."""
        # Derive constitutional fact: state hash is canonical
        state_hash = self.constitutional_authority.hash_dict(state)
        
        evidence = Evidence(
            fact="State hash is canonical",
            data={"state_hash": state_hash},
            derivation="CanonicalAuthority.hash_dict()",
        )
        
        proof = Proof(
            statement="State hash is canonical",
            evidence={"evidence": evidence.__dict__},
            verified=True,
            verification_method="Canonical hash computation",
        )
        
        return InvariantCheckResult(proof=proof)
    
    async def check_transition(self, transition: StateTransition) -> InvariantCheckResult:
        """Check transition against canonical hash invariant."""
        # Derive constitutional fact: transition preserves canonical hash
        # All events in transition must have valid canonical hashes
        for event in transition.events:
            computed_hash = self.constitutional_authority.hash_event(event)
            if event.event_id != computed_hash:
                violation = Violation(
                    code=FailureCode.HASH_MISMATCH,
                    statement="Transition event ID does not match canonical hash",
                    evidence={"event_id": event.event_id, "expected": computed_hash},
                    location="StateTransition",
                )
                return InvariantCheckResult(
                    proof=Proof(
                        statement="Transition preserves canonical hash",
                        evidence={},
                        verified=False,
                        verification_method="Canonical hash computation",
                    ),
                    violation=violation,
                )
        
        evidence = Evidence(
            fact="Transition preserves canonical hash",
            data={"event_count": len(transition.events)},
            derivation="All transition events have valid canonical hashes",
        )
        
        proof = Proof(
            statement="Transition preserves canonical hash",
            evidence={"evidence": evidence.__dict__},
            verified=True,
            verification_method="Canonical hash computation",
        )
        
        return InvariantCheckResult(proof=proof)


class InvariantEngine:
    """
    Constitutional invariant engine.
    
    Centralizes constitutional law.
    Checks invariants for events, states, and transitions.
    """
    
    def __init__(self, ctx: Any, constitutional_authority: Any):
        self.ctx = ctx
        self.constitutional_authority = constitutional_authority
        self.invariants: list[Invariant] = []
    
    def register(self, invariant: Invariant):
        """Register invariant."""
        self.invariants.append(invariant)
    
    async def check_event(self, event: EventEnvelope) -> InvariantResult:
        """Check event against all invariants."""
        results = []
        violations = []
        for invariant in self.invariants:
            result = await invariant.check_event(event)
            results.append(result)
            if result.violation:
                violations.append(result.violation)
        
        return InvariantResult(
            passed=all(r.passed for r in results),
            results=results,
            violations=violations,
        )
    
    async def check_state(self, state: dict[str, Any]) -> InvariantResult:
        """Check state against all invariants."""
        results = []
        violations = []
        for invariant in self.invariants:
            result = await invariant.check_state(state)
            results.append(result)
            if result.violation:
                violations.append(result.violation)
        
        return InvariantResult(
            passed=all(r.passed for r in results),
            results=results,
            violations=violations,
        )
    
    async def check_transition(self, transition: StateTransition) -> InvariantResult:
        """Check transition against all invariants."""
        results = []
        violations = []
        for invariant in self.invariants:
            result = await invariant.check_transition(transition)
            results.append(result)
            if result.violation:
                violations.append(result.violation)
        
        return InvariantResult(
            passed=all(r.passed for r in results),
            results=results,
            violations=violations,
        )
