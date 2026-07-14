"""
State Machine

State machine with pure transitions.
Formally verifiable execution.
"""

from dataclasses import dataclass
from typing import Any, Callable
from constitution.models.event import EventEnvelope
from constitution.value_objects import ConstitutionalFailure, FailureCode


@dataclass(frozen=True)
class StateTransition:
    """
    Pure state transition.
    
    No mutation. No side effects. Only pure transitions.
    """
    state: dict[str, Any]
    events: list[EventEnvelope]


class StateMachine:
    """
    State machine with pure transitions.
    
    Formally verifiable execution.
    """
    
    def __init__(self, initial_state: dict[str, Any], reducer: Callable[[dict[str, Any], dict[str, Any]], tuple[dict[str, Any], list[EventEnvelope]]]):
        self.initial_state = initial_state
        self.reducer = reducer
    
    def transition(self, state: dict[str, Any], command: dict[str, Any]) -> StateTransition:
        """
        Execute pure state transition.
        
        Returns (State', Events).
        """
        # Validate command
        self._validate_command(state, command)
        
        # Execute business logic through reducer
        new_state, events = self.reducer(state, command)
        
        # Validate invariants
        self._validate_invariants(new_state)
        
        # Validate transition produces events
        if not events:
            raise ConstitutionalFailure(
                code=FailureCode.TRANSITION_VIOLATION,
                message="Transition must produce at least one event",
                violations=[],
                evidence=[],
                location="StateMachine.transition",
            )
        
        return StateTransition(state=new_state, events=events)
    
    def _validate_command(self, state: dict[str, Any], command: dict[str, Any]):
        """Validate command against current state."""
        if not command:
            raise ConstitutionalFailure(
                code=FailureCode.TRANSITION_VIOLATION,
                message="Command cannot be empty",
                violations=[],
                evidence=[],
                location="StateMachine._validate_command",
            )
    
    def _validate_invariants(self, state: dict[str, Any]):
        """Validate constitutional invariants."""
        if state is None:
            raise ConstitutionalFailure(
                code=FailureCode.TRANSITION_VIOLATION,
                message="State cannot be None",
                violations=[],
                evidence=[],
                location="StateMachine._validate_invariants",
            )
