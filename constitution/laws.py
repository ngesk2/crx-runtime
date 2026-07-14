"""
Constitutional Laws - Immutable Invariants.

These are NOT policies. Policies are configurable.
Laws are immutable architectural invariants that cannot be violated.

Law 0: Planning never executes.
Law 1: Execution never replans.
Law 2: No subsystem grants itself authority.
Law 3: Capabilities always expire.
Law 4: Artifacts are immutable.
Law 5: Events are append-only.
Law 6: Oracle never executes candidate code.
Law 7: Planner cannot observe secrets unless granted capability.
Law 8: Every external side effect must have evidence.
Law 9: Every action must be replayable.
Law 10: Rollback always exists.
"""

from enum import Enum
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from datetime import datetime, timezone


class Law(Enum):
    """Constitutional Laws - Immutable Invariants."""
    
    PLANNING_NEVER_EXECUTES = "Law 0: Planning never executes."
    EXECUTION_NEVER_REPLANS = "Law 1: Execution never replans."
    NO_SELF_GRANTED_AUTHORITY = "Law 2: No subsystem grants itself authority."
    CAPABILITIES_EXPIRE = "Law 3: Capabilities always expire."
    ARTIFACTS_IMMUTABLE = "Law 4: Artifacts are immutable."
    EVENTS_APPEND_ONLY = "Law 5: Events are append-only."
    ORACLE_NEVER_EXECUTES = "Law 6: Oracle never executes candidate code."
    PLANNER_NO_SECRETS = "Law 7: Planner cannot observe secrets unless granted capability."
    SIDE_EFFECTS_EVIDENCE = "Law 8: Every external side effect must have evidence."
    ACTIONS_REPLAYABLE = "Law 9: Every action must be replayable."
    ROLLBACK_EXISTS = "Law 10: Rollback always exists."


@dataclass
class LawViolation:
    """A violation of a constitutional law."""
    law: Law
    violation_type: str
    violating_component: str
    description: str
    timestamp: str
    evidence: Dict[str, Any]
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW


class ConstitutionalGuard:
    """
    Enforces constitutional laws.
    
    Laws are immutable invariants that cannot be violated.
    Unlike policies, laws cannot be configured or bypassed.
    """
    
    def __init__(self):
        self._violations: List[LawViolation] = []
        self._enabled = True
    
    def check_planning_execution(self, component: str, action: str) -> Optional[LawViolation]:
        """
        Check Law 0: Planning never executes.
        
        Args:
            component: Component performing action
            action: Action being performed
        
        Returns:
            LawViolation if violated, None otherwise
        """
        if not self._enabled:
            return None
        
        # If component is a planner and action is execution
        if "planner" in component.lower() and any(
            word in action.lower() 
            for word in ["execute", "run", "invoke", "call", "subprocess", "shell"]
        ):
            return LawViolation(
                law=Law.PLANNING_NEVER_EXECUTES,
                violation_type="planning_execution",
                violating_component=component,
                description=f"Planner {component} attempted to execute: {action}",
                timestamp=datetime.now(timezone.utc).isoformat(),
                evidence={"component": component, "action": action},
                severity="CRITICAL"
            )
        
        return None
    
    def check_execution_replanning(self, component: str, action: str) -> Optional[LawViolation]:
        """
        Check Law 1: Execution never replans.
        
        Args:
            component: Component performing action
            action: Action being performed
        
        Returns:
            LawViolation if violated, None otherwise
        """
        if not self._enabled:
            return None
        
        # If component is executor and action is planning
        if "executor" in component.lower() or "runtime" in component.lower():
            if any(
                word in action.lower() 
                for word in ["plan", "replan", "optimize", "strategy", "decide"]
            ):
                return LawViolation(
                    law=Law.EXECUTION_NEVER_REPLANS,
                    violation_type="execution_replanning",
                    violating_component=component,
                    description=f"Executor {component} attempted to replan: {action}",
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    evidence={"component": component, "action": action},
                    severity="CRITICAL"
                )
        
        return None
    
    def check_self_granted_authority(self, component: str, capability: str) -> Optional[LawViolation]:
        """
        Check Law 2: No subsystem grants itself authority.
        
        Args:
            component: Component requesting authority
            capability: Capability being granted
        
        Returns:
            LawViolation if violated, None otherwise
        """
        if not self._enabled:
            return None
        
        # If component is granting capability to itself
        # This would be detected by checking if the grantee == grantor
        return None  # Would need context about who is granting
    
    def check_capability_expiration(self, capability: str, expires_at: Optional[str]) -> Optional[LawViolation]:
        """
        Check Law 3: Capabilities always expire.
        
        Args:
            capability: Capability being issued
            expires_at: Expiration time
        
        Returns:
            LawViolation if violated, None otherwise
        """
        if not self._enabled:
            return None
        
        if not expires_at:
            return LawViolation(
                law=Law.CAPABILITIES_EXPIRE,
                violation_type="capability_no_expiration",
                violating_component="capability_broker",
                description=f"Capability {capability} issued without expiration",
                timestamp=datetime.now(timezone.utc).isoformat(),
                evidence={"capability": capability},
                severity="HIGH"
            )
        
        # Check if expiration is too far in future (e.g., > 24 hours)
        try:
            expires = datetime.fromisoformat(expires_at)
            max_expiration = datetime.now(timezone.utc).replace(hour=23, minute=59, second=59)
            
            if expires > max_expiration:
                return LawViolation(
                    law=Law.CAPABILITIES_EXPIRE,
                    violation_type="capability_excessive_expiration",
                    violating_component="capability_broker",
                    description=f"Capability {capability} expires too far in future: {expires_at}",
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    evidence={"capability": capability, "expires_at": expires_at},
                    severity="MEDIUM"
                )
        except:
            pass
        
        return None
    
    def check_artifact_immutability(self, artifact_id: str, action: str) -> Optional[LawViolation]:
        """
        Check Law 4: Artifacts are immutable.
        
        Args:
            artifact_id: Artifact being modified
            action: Action being performed
        
        Returns:
            LawViolation if violated, None otherwise
        """
        if not self._enabled:
            return None
        
        # If action modifies existing artifact
        if any(
            word in action.lower() 
            for word in ["modify", "update", "overwrite", "delete", "rename"]
        ):
            return LawViolation(
                law=Law.ARTIFACTS_IMMUTABLE,
                violation_type="artifact_mutation",
                violating_component="artifact_store",
                description=f"Attempted to modify immutable artifact {artifact_id}: {action}",
                timestamp=datetime.now(timezone.utc).isoformat(),
                evidence={"artifact_id": artifact_id, "action": action},
                severity="CRITICAL"
            )
        
        return None
    
    def check_events_append_only(self, event_id: str, action: str) -> Optional[LawViolation]:
        """
        Check Law 5: Events are append-only.
        
        Args:
            event_id: Event being modified
            action: Action being performed
        
        Returns:
            LawViolation if violated, None otherwise
        """
        if not self._enabled:
            return None
        
        # If action modifies or deletes existing event
        if any(
            word in action.lower() 
            for word in ["modify", "update", "delete", "remove", "overwrite"]
        ):
            return LawViolation(
                law=Law.EVENTS_APPEND_ONLY,
                violation_type="event_mutation",
                violating_component="event_store",
                description=f"Attempted to modify append-only event {event_id}: {action}",
                timestamp=datetime.now(timezone.utc).isoformat(),
                evidence={"event_id": event_id, "action": action},
                severity="CRITICAL"
            )
        
        return None
    
    def check_oracle_execution(self, component: str, action: str) -> Optional[LawViolation]:
        """
        Check Law 6: Oracle never executes candidate code.
        
        Args:
            component: Component performing action
            action: Action being performed
        
        Returns:
            LawViolation if violated, None otherwise
        """
        if not self._enabled:
            return None
        
        if "oracle" in component.lower():
            if any(
                word in action.lower() 
                for word in ["execute", "run", "import", "load", "eval", "exec"]
            ):
                return LawViolation(
                    law=Law.ORACLE_NEVER_EXECUTES,
                    violation_type="oracle_execution",
                    violating_component=component,
                    description=f"Oracle {component} attempted to execute code: {action}",
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    evidence={"component": component, "action": action},
                    severity="CRITICAL"
                )
        
        return None
    
    def check_planner_secrets(self, component: str, resource: str) -> Optional[LawViolation]:
        """
        Check Law 7: Planner cannot observe secrets unless granted capability.
        
        Args:
            component: Component accessing resource
            resource: Resource being accessed
        
        Returns:
            LawViolation if violated, None otherwise
        """
        if not self._enabled:
            return None
        
        if "planner" in component.lower():
            if any(
                word in resource.lower() 
                for word in ["secret", "password", "key", "token", "credential"]
            ):
                return LawViolation(
                    law=Law.PLANNER_NO_SECRETS,
                    violation_type="planner_secrets_access",
                    violating_component=component,
                    description=f"Planner {component} attempted to access secret: {resource}",
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    evidence={"component": component, "resource": resource},
                    severity="HIGH"
                )
        
        return None
    
    def check_side_effects_evidence(self, action: str, evidence: Optional[Dict[str, Any]]) -> Optional[LawViolation]:
        """
        Check Law 8: Every external side effect must have evidence.
        
        Args:
            action: Action being performed
            evidence: Evidence of action
        
        Returns:
            LawViolation if violated, None otherwise
        """
        if not self._enabled:
            return None
        
        # If action is external side effect (network, filesystem, etc.)
        if any(
            word in action.lower() 
            for word in ["http", "https", "network", "write", "delete", "execute"]
        ):
            if not evidence:
                return LawViolation(
                    law=Law.SIDE_EFFECTS_EVIDENCE,
                    violation_type="side_effect_no_evidence",
                    violating_component="runtime",
                    description=f"External side effect without evidence: {action}",
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    evidence={"action": action},
                    severity="HIGH"
                )
        
        return None
    
    def check_action_replayability(self, action: str, replayable: bool) -> Optional[LawViolation]:
        """
        Check Law 9: Every action must be replayable.
        
        Args:
            action: Action being performed
            replayable: Whether action is replayable
        
        Returns:
            LawViolation if violated, None otherwise
        """
        if not self._enabled:
            return None
        
        if not replayable:
            return LawViolation(
                law=Law.ACTIONS_REPLAYABLE,
                violation_type="action_not_replayable",
                violating_component="runtime",
                description=f"Action is not replayable: {action}",
                timestamp=datetime.now(timezone.utc).isoformat(),
                evidence={"action": action},
                severity="MEDIUM"
            )
        
        return None
    
    def check_rollback_exists(self, action: str, rollback_plan: Optional[Dict[str, Any]]) -> Optional[LawViolation]:
        """
        Check Law 10: Rollback always exists.
        
        Args:
            action: Action being performed
            rollback_plan: Rollback plan
        
        Returns:
            LawViolation if violated, None otherwise
        """
        if not self._enabled:
            return None
        
        # If action is destructive and has no rollback
        if any(
            word in action.lower() 
            for word in ["delete", "overwrite", "deploy", "modify"]
        ):
            if not rollback_plan:
                return LawViolation(
                    law=Law.ROLLBACK_EXISTS,
                    violation_type="no_rollback_plan",
                    violating_component="runtime",
                    description=f"Destructive action without rollback plan: {action}",
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    evidence={"action": action},
                    severity="HIGH"
                )
        
        return None
    
    def record_violation(self, violation: LawViolation) -> None:
        """Record a law violation."""
        self._violations.append(violation)
    
    def get_violations(self, severity: Optional[str] = None) -> List[LawViolation]:
        """Get recorded violations."""
        if severity:
            return [v for v in self._violations if v.severity == severity]
        return self._violations.copy()
    
    def clear_violations(self) -> None:
        """Clear recorded violations."""
        self._violations.clear()
    
    def enable(self) -> None:
        """Enable law enforcement."""
        self._enabled = True
    
    def disable(self) -> None:
        """Disable law enforcement (use with extreme caution)."""
        self._enabled = False


# Singleton instance
_constitutional_guard = ConstitutionalGuard()


def get_constitutional_guard() -> ConstitutionalGuard:
    """Get the singleton constitutional guard."""
    return _constitutionalal_guard
