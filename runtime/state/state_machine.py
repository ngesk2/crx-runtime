"""
State Machines - Constitutional transitions.

Mission state machine:
Draft → Compiled → Capability Negotiation → Approved → Executing → Verifying → Complete → Archived

Transitions become constitutional.
Impossible transitions rejected.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Set, Callable
from datetime import datetime, timezone
from enum import Enum
import json
import uuid
from pathlib import Path


class MissionState(Enum):
    """States in the mission lifecycle."""
    DRAFT = "draft"
    COMPILED = "compiled"
    CAPABILITY_NEGOTIATION = "capability_negotiation"
    APPROVED = "approved"
    EXECUTING = "executing"
    VERIFYING = "verifying"
    COMPLETE = "complete"
    FAILED = "failed"
    CANCELLED = "cancelled"
    ARCHIVED = "archived"


class TransitionType(Enum):
    """Types of state transitions."""
    AUTOMATIC = "automatic"
    MANUAL = "manual"
    CONDITIONAL = "conditional"
    ERROR = "error"
    TIMEOUT = "timeout"


@dataclass
class StateTransition:
    """A state transition."""
    transition_id: str
    from_state: MissionState
    to_state: MissionState
    transition_type: TransitionType
    triggered_by: str
    triggered_at: str
    conditions: Dict[str, Any]
    metadata: Dict[str, Any]
    
    def is_valid(self) -> bool:
        """Check if transition is valid."""
        return True  # Would check conditions in production


@dataclass
class TransitionRule:
    """A rule governing state transitions."""
    rule_id: str
    from_state: MissionState
    to_state: MissionState
    allowed: bool
    conditions: List[str]
    transition_type: TransitionType
    requires_approval: bool
    auto_transition: bool


class ConstitutionalStateMachine:
    """
    Constitutional State Machine for mission lifecycle.
    
    Transitions are constitutional - impossible transitions are rejected.
    """
    
    def __init__(self):
        self._current_state: MissionState = MissionState.DRAFT
        self._transition_history: List[StateTransition] = []
        self._transition_rules: Dict[str, TransitionRule] = {}
        self._initialize_rules()
    
    def _initialize_rules(self) -> None:
        """Initialize constitutional transition rules."""
        
        # Valid transitions
        valid_transitions = [
            (MissionState.DRAFT, MissionState.COMPILED, TransitionType.AUTOMATIC),
            (MissionState.COMPILED, MissionState.CAPABILITY_NEGOTIATION, TransitionType.AUTOMATIC),
            (MissionState.CAPABILITY_NEGOTIATION, MissionState.APPROVED, TransitionType.CONDITIONAL),
            (MissionState.CAPABILITY_NEGOTIATION, MissionState.DRAFT, TransitionType.CONDITIONAL),
            (MissionState.APPROVED, MissionState.EXECUTING, TransitionType.AUTOMATIC),
            (MissionState.EXECUTING, MissionState.VERIFYING, TransitionType.AUTOMATIC),
            (MissionState.EXECUTING, MissionState.FAILED, TransitionType.ERROR),
            (MissionState.VERIFYING, MissionState.COMPLETE, TransitionType.CONDITIONAL),
            (MissionState.VERIFYING, MissionState.FAILED, TransitionType.CONDITIONAL),
            (MissionState.COMPLETE, MissionState.ARCHIVED, TransitionType.AUTOMATIC),
            (MissionState.FAILED, MissionState.ARCHIVED, TransitionType.AUTOMATIC),
            (MissionState.CANCELLED, MissionState.ARCHIVED, TransitionType.AUTOMATIC),
            # Cancellation from various states
            (MissionState.DRAFT, MissionState.CANCELLED, TransitionType.MANUAL),
            (MissionState.COMPILED, MissionState.CANCELLED, TransitionType.MANUAL),
            (MissionState.CAPABILITY_NEGOTIATION, MissionState.CANCELLED, TransitionType.MANUAL),
            (MissionState.APPROVED, MissionState.CANCELLED, TransitionType.MANUAL),
        ]
        
        for from_state, to_state, trans_type in valid_transitions:
            rule_id = f"rule_{from_state.value}_to_{to_state.value}"
            self._transition_rules[rule_id] = TransitionRule(
                rule_id=rule_id,
                from_state=from_state,
                to_state=to_state,
                allowed=True,
                conditions=[],
                transition_type=trans_type,
                requires_approval=trans_type == TransitionType.MANUAL,
                auto_transition=trans_type in [TransitionType.AUTOMATIC, TransitionType.ERROR]
            )
    
    def get_current_state(self) -> MissionState:
        """Get current state."""
        return self._current_state
    
    def can_transition(self, to_state: MissionState) -> tuple[bool, Optional[str]]:
        """
        Check if transition is allowed.
        
        Args:
            to_state: Target state
        
        Returns:
            (allowed, reason)
        """
        rule_id = f"rule_{self._current_state.value}_to_{to_state.value}"
        rule = self._transition_rules.get(rule_id)
        
        if not rule:
            return False, f"No transition rule defined for {self._current_state.value} → {to_state.value}"
        
        if not rule.allowed:
            return False, f"Transition {self._current_state.value} → {to_state.value} is not allowed"
        
        return True, None
    
    def transition(
        self,
        to_state: MissionState,
        triggered_by: str,
        conditions: Optional[Dict[str, Any]] = None
    ) -> tuple[bool, Optional[StateTransition]]:
        """
        Execute state transition.
        
        Args:
            to_state: Target state
            triggered_by: Who triggered the transition
            conditions: Conditions for the transition
        
        Returns:
            (success, transition)
        """
        # Check if transition is allowed
        allowed, reason = self.can_transition(to_state)
        if not allowed:
            return False, None
        
        # Check if approval is required
        rule_id = f"rule_{self._current_state.value}_to_{to_state.value}"
        rule = self._transition_rules.get(rule_id)
        if rule and rule.requires_approval:
            # In production, this would check for approval
            pass
        
        # Execute transition
        transition = StateTransition(
            transition_id=str(uuid.uuid4()),
            from_state=self._current_state,
            to_state=to_state,
            transition_type=rule.transition_type if rule else TransitionType.MANUAL,
            triggered_by=triggered_by,
            triggered_at=datetime.now(timezone.utc).isoformat(),
            conditions=conditions or {},
            metadata={}
        )
        
        self._transition_history.append(transition)
        self._current_state = to_state
        
        return True, transition
    
    def get_transition_history(self) -> List[StateTransition]:
        """Get transition history."""
        return self._transition_history.copy()
    
    def get_allowed_transitions(self) -> List[MissionState]:
        """Get list of allowed transitions from current state."""
        allowed = []
        
        for rule in self._transition_rules.values():
            if rule.from_state == self._current_state and rule.allowed:
                allowed.append(rule.to_state)
        
        return allowed
    
    def reset(self) -> None:
        """Reset state machine to initial state."""
        self._current_state = MissionState.DRAFT
        self._transition_history = []


class MissionStateMachine(ConstitutionalStateMachine):
    """
    State machine specifically for missions.
    
    Includes mission-specific transition logic.
    """
    
    def __init__(self, mission_id: str):
        super().__init__()
        self.mission_id = mission_id
        self._state_metadata: Dict[MissionState, Dict[str, Any]] = {}
    
    def transition_to_compiled(self, compiled_by: str) -> tuple[bool, Optional[StateTransition]]:
        """Transition to compiled state."""
        return self.transition(
            MissionState.COMPILED,
            triggered_by=compiled_by,
            conditions={"compilation_successful": True}
        )
    
    def transition_to_capability_negotiation(self, negotiator: str) -> tuple[bool, Optional[StateTransition]]:
        """Transition to capability negotiation state."""
        return self.transition(
            MissionState.CAPABILITY_NEGOTIATION,
            triggered_by=negotiator,
            conditions={"capabilities_required": True}
        )
    
    def transition_to_approved(self, approver: str, capabilities_granted: List[str]) -> tuple[bool, Optional[StateTransition]]:
        """Transition to approved state."""
        return self.transition(
            MissionState.APPROVED,
            triggered_by=approver,
            conditions={
                "capabilities_granted": capabilities_granted,
                "approval_granted": True
            }
        )
    
    def transition_to_executing(self, executor: str) -> tuple[bool, Optional[StateTransition]]:
        """Transition to executing state."""
        return self.transition(
            MissionState.EXECUTING,
            triggered_by=executor,
            conditions={"execution_started": True}
        )
    
    def transition_to_verifying(self, verifier: str) -> tuple[bool, Optional[StateTransition]]:
        """Transition to verifying state."""
        return self.transition(
            MissionState.VERIFYING,
            triggered_by=verifier,
            conditions={"execution_complete": True}
        )
    
    def transition_to_complete(self, completer: str, artifacts: List[str]) -> tuple[bool, Optional[StateTransition]]:
        """Transition to complete state."""
        return self.transition(
            MissionState.COMPLETE,
            triggered_by=completer,
            conditions={
                "verification_passed": True,
                "artifacts_produced": artifacts
            }
        )
    
    def transition_to_failed(self, failure_reason: str) -> tuple[bool, Optional[StateTransition]]:
        """Transition to failed state."""
        return self.transition(
            MissionState.FAILED,
            triggered_by="system",
            conditions={"failure_reason": failure_reason}
        )
    
    def transition_to_cancelled(self, cancelled_by: str, reason: str) -> tuple[bool, Optional[StateTransition]]:
        """Transition to cancelled state."""
        return self.transition(
            MissionState.CANCELLED,
            triggered_by=cancelled_by,
            conditions={"cancellation_reason": reason}
        )
    
    def transition_to_archived(self, archived_by: str) -> tuple[bool, Optional[StateTransition]]:
        """Transition to archived state."""
        return self.transition(
            MissionState.ARCHIVED,
            triggered_by=archived_by,
            conditions={"archive_complete": True}
        )
    
    def set_state_metadata(self, state: MissionState, metadata: Dict[str, Any]) -> None:
        """Set metadata for a state."""
        self._state_metadata[state] = metadata
    
    def get_state_metadata(self, state: MissionState) -> Dict[str, Any]:
        """Get metadata for a state."""
        return self._state_metadata.get(state, {})


class StateMachineRegistry:
    """
    Registry for mission state machines.
    
    Tracks all mission state machines.
    """
    
    def __init__(self):
        self._machines: Dict[str, MissionStateMachine] = {}
    
    def create_machine(self, mission_id: str) -> MissionStateMachine:
        """Create a new state machine for a mission."""
        machine = MissionStateMachine(mission_id)
        self._machines[mission_id] = machine
        return machine
    
    def get_machine(self, mission_id: str) -> Optional[MissionStateMachine]:
        """Get state machine for a mission."""
        return self._machines.get(mission_id)
    
    def remove_machine(self, mission_id: str) -> None:
        """Remove state machine for a mission."""
        if mission_id in self._machines:
            del self._machines[mission_id]
    
    def get_all_machines_in_state(self, state: MissionState) -> List[str]:
        """Get all mission IDs in a specific state."""
        return [
            mission_id
            for mission_id, machine in self._machines.items()
            if machine.get_current_state() == state
        ]
    
    def get_state_statistics(self) -> Dict[str, int]:
        """Get statistics of missions by state."""
        stats = {}
        
        for state in MissionState:
            stats[state.value] = len(self.get_all_machines_in_state(state))
        
        return stats


# Singleton instance
_state_machine_registry = StateMachineRegistry()


def get_state_machine_registry() -> StateMachineRegistry:
    """Get the singleton state machine registry."""
    return _state_machine_registry
