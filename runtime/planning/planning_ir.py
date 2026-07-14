"""
Planning Intermediate Representation (IR).

Platform-independent, capability-agnostic planning output.
Similar to LLVM IR but for missions.

Planning IR is consumed by Mission Compiler to produce Execution Graph.

NOTE: PlanningIR is the CURRENT canonical representation for the runtime.
The architecture/canonical_ir.py defines a future CanonicalIR (CIR) that is not yet implemented.
For now, PlanningIR serves as the single source of truth for planning output.
This avoids the ambiguity of having multiple IR representations.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Set
from datetime import datetime, timezone
from enum import Enum


class SafetyClassification(Enum):
    """Safety classification for missions."""
    SAFE = "safe"
    RISKY = "risky"
    DANGEROUS = "dangerous"
    CRITICAL = "critical"


class Determinism(Enum):
    """Determinism level for operations."""
    DETERMINISTIC = "deterministic"
    PROBABILISTIC = "probabilistic"
    NON_DETERMINISTIC = "non_deterministic"


@dataclass
class CapabilityRequest:
    """A capability request from planning."""
    capability_name: str
    resource_path: Optional[str]
    operation: str  # read, write, execute, etc.
    scope: str  # minimal, specific, broad
    justification: str
    estimated_duration_seconds: int
    risk_level: str  # low, medium, high


@dataclass
class Dependency:
    """A dependency between planning elements."""
    dependency_id: str
    dependency_type: str  # data, temporal, capability
    required: bool
    alternative_ids: List[str] = field(default_factory=list)


@dataclass
class Risk:
    """A risk identified during planning."""
    risk_id: str
    risk_type: str  # data_loss, security, performance, correctness
    probability: str  # low, medium, high
    impact: str  # low, medium, high, critical
    mitigation: str
    acceptance_criteria: str


@dataclass
class EvidenceRequirement:
    """Evidence required for verification."""
    evidence_type: str  # artifact, log, metric, state
    source: str
    verification_method: str
    success_criteria: str


@dataclass
class FailureMode:
    """A potential failure mode."""
    failure_type: str
    detection_method: str
    recovery_strategy: str
    rollback_plan: str
    manual_intervention_required: bool


@dataclass
class Subgoal:
    """A subgoal in the planning hierarchy."""
    subgoal_id: str
    description: str
    parent_goal_id: Optional[str]
    preconditions: List[str]
    success_criteria: List[str]
    estimated_cost_tokens: int
    estimated_time_seconds: int
    confidence: float  # 0.0 to 1.0


@dataclass
class PlanningIR:
    """
    Planning Intermediate Representation.
    
    Platform-independent output from General Planning Skill.
    Consumed by Mission Compiler to produce Execution Graph.
    """
    
    # Metadata
    ir_id: str
    ir_version: str
    created_at: str
    planner_id: str
    
    # Intent & Objective
    intent: str
    objective: str
    objective_version: int
    
    # Planning structure
    subgoals: List[Subgoal]
    dependencies: List[Dependency]
    
    # Capability requirements
    capability_requests: List[CapabilityRequest]
    
    # Risk assessment
    risks: List[Risk]
    safety_classification: SafetyClassification
    
    # Verification
    evidence_requirements: List[EvidenceRequirement]
    verification_steps: List[str]
    
    # Failure handling
    failure_modes: List[FailureMode]
    recovery_plan: str
    rollback_available: bool
    
    # Execution constraints
    constraints: Dict[str, Any]
    priority: int
    estimated_total_tokens: int
    estimated_total_time_seconds: int
    
    # Expected artifacts
    expected_artifacts: List[str]
    
    # Governance
    human_approval_required: bool
    oracle_review_required: bool
    compliance_requirements: List[str]
    
    # Determinism
    determinism: Determinism
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert IR to dictionary for serialization."""
        return {
            "ir_id": self.ir_id,
            "ir_version": self.ir_version,
            "created_at": self.created_at,
            "planner_id": self.planner_id,
            "intent": self.intent,
            "objective": self.objective,
            "objective_version": self.objective_version,
            "subgoals": [
                {
                    "subgoal_id": sg.subgoal_id,
                    "description": sg.description,
                    "parent_goal_id": sg.parent_goal_id,
                    "preconditions": sg.preconditions,
                    "success_criteria": sg.success_criteria,
                    "estimated_cost_tokens": sg.estimated_cost_tokens,
                    "estimated_time_seconds": sg.estimated_time_seconds,
                    "confidence": sg.confidence
                }
                for sg in self.subgoals
            ],
            "dependencies": [
                {
                    "dependency_id": d.dependency_id,
                    "dependency_type": d.dependency_type,
                    "required": d.required,
                    "alternative_ids": d.alternative_ids
                }
                for d in self.dependencies
            ],
            "capability_requests": [
                {
                    "capability_name": cr.capability_name,
                    "resource_path": cr.resource_path,
                    "operation": cr.operation,
                    "scope": cr.scope,
                    "justification": cr.justification,
                    "estimated_duration_seconds": cr.estimated_duration_seconds,
                    "risk_level": cr.risk_level
                }
                for cr in self.capability_requests
            ],
            "risks": [
                {
                    "risk_id": r.risk_id,
                    "risk_type": r.risk_type,
                    "probability": r.probability,
                    "impact": r.impact,
                    "mitigation": r.mitigation,
                    "acceptance_criteria": r.acceptance_criteria
                }
                for r in self.risks
            ],
            "safety_classification": self.safety_classification.value,
            "evidence_requirements": [
                {
                    "evidence_type": er.evidence_type,
                    "source": er.source,
                    "verification_method": er.verification_method,
                    "success_criteria": er.success_criteria
                }
                for er in self.evidence_requirements
            ],
            "verification_steps": self.verification_steps,
            "failure_modes": [
                {
                    "failure_type": fm.failure_type,
                    "detection_method": fm.detection_method,
                    "recovery_strategy": fm.recovery_strategy,
                    "rollback_plan": fm.rollback_plan,
                    "manual_intervention_required": fm.manual_intervention_required
                }
                for fm in self.failure_modes
            ],
            "recovery_plan": self.recovery_plan,
            "rollback_available": self.rollback_available,
            "constraints": self.constraints,
            "priority": self.priority,
            "estimated_total_tokens": self.estimated_total_tokens,
            "estimated_total_time_seconds": self.estimated_total_time_seconds,
            "expected_artifacts": self.expected_artifacts,
            "human_approval_required": self.human_approval_required,
            "oracle_review_required": self.oracle_review_required,
            "compliance_requirements": self.compliance_requirements,
            "determinism": self.determinism.value
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PlanningIR':
        """Create IR from dictionary."""
        return cls(
            ir_id=data["ir_id"],
            ir_version=data["ir_version"],
            created_at=data["created_at"],
            planner_id=data["planner_id"],
            intent=data["intent"],
            objective=data["objective"],
            objective_version=data["objective_version"],
            subgoals=[
                Subgoal(
                    subgoal_id=sg["subgoal_id"],
                    description=sg["description"],
                    parent_goal_id=sg.get("parent_goal_id"),
                    preconditions=sg["preconditions"],
                    success_criteria=sg["success_criteria"],
                    estimated_cost_tokens=sg["estimated_cost_tokens"],
                    estimated_time_seconds=sg["estimated_time_seconds"],
                    confidence=sg["confidence"]
                )
                for sg in data["subgoals"]
            ],
            dependencies=[
                Dependency(
                    dependency_id=d["dependency_id"],
                    dependency_type=d["dependency_type"],
                    required=d["required"],
                    alternative_ids=d.get("alternative_ids", [])
                )
                for d in data["dependencies"]
            ],
            capability_requests=[
                CapabilityRequest(
                    capability_name=cr["capability_name"],
                    resource_path=cr.get("resource_path"),
                    operation=cr["operation"],
                    scope=cr["scope"],
                    justification=cr["justification"],
                    estimated_duration_seconds=cr["estimated_duration_seconds"],
                    risk_level=cr["risk_level"]
                )
                for cr in data["capability_requests"]
            ],
            risks=[
                Risk(
                    risk_id=r["risk_id"],
                    risk_type=r["risk_type"],
                    probability=r["probability"],
                    impact=r["impact"],
                    mitigation=r["mitigation"],
                    acceptance_criteria=r["acceptance_criteria"]
                )
                for r in data["risks"]
            ],
            safety_classification=SafetyClassification(data["safety_classification"]),
            evidence_requirements=[
                EvidenceRequirement(
                    evidence_type=er["evidence_type"],
                    source=er["source"],
                    verification_method=er["verification_method"],
                    success_criteria=er["success_criteria"]
                )
                for er in data["evidence_requirements"]
            ],
            verification_steps=data["verification_steps"],
            failure_modes=[
                FailureMode(
                    failure_type=fm["failure_type"],
                    detection_method=fm["detection_method"],
                    recovery_strategy=fm["recovery_strategy"],
                    rollback_plan=fm["rollback_plan"],
                    manual_intervention_required=fm["manual_intervention_required"]
                )
                for fm in data["failure_modes"]
            ],
            recovery_plan=data["recovery_plan"],
            rollback_available=data["rollback_available"],
            constraints=data["constraints"],
            priority=data["priority"],
            estimated_total_tokens=data["estimated_total_tokens"],
            estimated_total_time_seconds=data["estimated_total_time_seconds"],
            expected_artifacts=data["expected_artifacts"],
            human_approval_required=data["human_approval_required"],
            oracle_review_required=data["oracle_review_required"],
            compliance_requirements=data["compliance_requirements"],
            determinism=Determinism(data["determinism"])
        )


class PlanningIRBuilder:
    """
    Builder for Planning IR.
    
    Provides fluent interface for constructing IR.
    """
    
    def __init__(self):
        self._ir_id = None
        self._ir_version = "1.0"
        self._planner_id = "general_planner"
        self._intent = ""
        self._objective = ""
        self._objective_version = 1
        self._subgoals: List[Subgoal] = []
        self._dependencies: List[Dependency] = []
        self._capability_requests: List[CapabilityRequest] = []
        self._risks: List[Risk] = []
        self._safety_classification = SafetyClassification.SAFE
        self._evidence_requirements: List[EvidenceRequirement] = []
        self._verification_steps: List[str] = []
        self._failure_modes: List[FailureMode] = []
        self._recovery_plan = ""
        self._rollback_available = False
        self._constraints: Dict[str, Any] = {}
        self._priority = 0
        self._estimated_total_tokens = 0
        self._estimated_total_time_seconds = 0
        self._expected_artifacts: List[str] = []
        self._human_approval_required = False
        self._oracle_review_required = False
        self._compliance_requirements: List[str] = []
        self._determinism = Determinism.DETERMINISTIC
    
    def with_id(self, ir_id: str) -> 'PlanningIRBuilder':
        """Set IR ID."""
        self._ir_id = ir_id
        return self
    
    def with_intent(self, intent: str) -> 'PlanningIRBuilder':
        """Set intent."""
        self._intent = intent
        return self
    
    def with_objective(self, objective: str, version: int = 1) -> 'PlanningIRBuilder':
        """Set objective."""
        self._objective = objective
        self._objective_version = version
        return self
    
    def with_subgoal(
        self,
        subgoal_id: str,
        description: str,
        parent_goal_id: Optional[str] = None,
        preconditions: Optional[List[str]] = None,
        success_criteria: Optional[List[str]] = None,
        estimated_cost_tokens: int = 0,
        estimated_time_seconds: int = 0,
        confidence: float = 1.0
    ) -> 'PlanningIRBuilder':
        """Add subgoal."""
        self._subgoals.append(Subgoal(
            subgoal_id=subgoal_id,
            description=description,
            parent_goal_id=parent_goal_id,
            preconditions=preconditions or [],
            success_criteria=success_criteria or [],
            estimated_cost_tokens=estimated_cost_tokens,
            estimated_time_seconds=estimated_time_seconds,
            confidence=confidence
        ))
        return self
    
    def with_capability(
        self,
        capability_name: str,
        resource_path: Optional[str],
        operation: str,
        scope: str = "minimal",
        justification: str = "",
        estimated_duration_seconds: int = 60,
        risk_level: str = "low"
    ) -> 'PlanningIRBuilder':
        """Add capability request."""
        self._capability_requests.append(CapabilityRequest(
            capability_name=capability_name,
            resource_path=resource_path,
            operation=operation,
            scope=scope,
            justification=justification,
            estimated_duration_seconds=estimated_duration_seconds,
            risk_level=risk_level
        ))
        return self
    
    def with_risk(
        self,
        risk_id: str,
        risk_type: str,
        probability: str,
        impact: str,
        mitigation: str,
        acceptance_criteria: str
    ) -> 'PlanningIRBuilder':
        """Add risk."""
        self._risks.append(Risk(
            risk_id=risk_id,
            risk_type=risk_type,
            probability=probability,
            impact=impact,
            mitigation=mitigation,
            acceptance_criteria=acceptance_criteria
        ))
        return self
    
    def with_safety_classification(self, classification: SafetyClassification) -> 'PlanningIRBuilder':
        """Set safety classification."""
        self._safety_classification = classification
        return self
    
    def with_rollback(self, available: bool, recovery_plan: str = "") -> 'PlanningIRBuilder':
        """Set rollback availability."""
        self._rollback_available = available
        self._recovery_plan = recovery_plan
        return self
    
    def with_estimates(self, tokens: int, time_seconds: int) -> 'PlanningIRBuilder':
        """Set cost estimates."""
        self._estimated_total_tokens = tokens
        self._estimated_total_time_seconds = time_seconds
        return self
    
    def with_human_approval(self, required: bool) -> 'PlanningIRBuilder':
        """Set human approval requirement."""
        self._human_approval_required = required
        return self
    
    def with_oracle_review(self, required: bool) -> 'PlanningIRBuilder':
        """Set Oracle review requirement."""
        self._oracle_review_required = required
        return self
    
    def with_determinism(self, determinism: Determinism) -> 'PlanningIRBuilder':
        """Set determinism level."""
        self._determinism = determinism
        return self
    
    def build(self) -> PlanningIR:
        """Build the Planning IR."""
        import uuid
        
        if not self._ir_id:
            self._ir_id = str(uuid.uuid4())
        
        return PlanningIR(
            ir_id=self._ir_id,
            ir_version=self._ir_version,
            created_at=datetime.now(timezone.utc).isoformat(),
            planner_id=self._planner_id,
            intent=self._intent,
            objective=self._objective,
            objective_version=self._objective_version,
            subgoals=self._subgoals,
            dependencies=self._dependencies,
            capability_requests=self._capability_requests,
            risks=self._risks,
            safety_classification=self._safety_classification,
            evidence_requirements=self._evidence_requirements,
            verification_steps=self._verification_steps,
            failure_modes=self._failure_modes,
            recovery_plan=self._recovery_plan,
            rollback_available=self._rollback_available,
            constraints=self._constraints,
            priority=self._priority,
            estimated_total_tokens=self._estimated_total_tokens,
            estimated_total_time_seconds=self._estimated_total_time_seconds,
            expected_artifacts=self._expected_artifacts,
            human_approval_required=self._human_approval_required,
            oracle_review_required=self._oracle_review_required,
            compliance_requirements=self._compliance_requirements,
            determinism=self._determinism
        )
