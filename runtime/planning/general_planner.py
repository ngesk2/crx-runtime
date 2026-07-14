"""
General Planning Skill - Platform-independent, capability-agnostic.

This is the most important skill in the runtime.

Planning only understands:
- Goal
- Constraint
- Risk
- Dependency
- Capability
- Artifact
- Evidence
- Verification
- Rollback

NOT implementation-specific:
- Python
- Docker
- Git
- SQLite
- LLMs
- Network
- Filesystem

Planning survives for decades because it's implementation-agnostic.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Set
from datetime import datetime, timezone
from enum import Enum
import uuid

from runtime.planning.planning_ir import (
    PlanningIR,
    PlanningIRBuilder,
    Subgoal,
    CapabilityRequest,
    Risk,
    SafetyClassification,
    Determinism
)


class ConstraintType(Enum):
    """Types of constraints."""
    TEMPORAL = "temporal"  # Time constraints
    RESOURCE = "resource"  # Resource constraints
    CAPABILITY = "capability"  # Capability constraints
    SAFETY = "safety"  # Safety constraints
    COMPLIANCE = "compliance"  # Compliance constraints
    DETERMINISM = "determinism"  # Determinism constraints


class DependencyType(Enum):
    """Types of dependencies."""
    DATA = "data"  # Data dependency
    TEMPORAL = "temporal"  # Temporal dependency
    CAPABILITY = "capability"  # Capability dependency
    LOGICAL = "logical"  # Logical dependency


@dataclass
class Constraint:
    """A constraint on planning."""
    constraint_id: str
    constraint_type: ConstraintType
    description: str
    parameters: Dict[str, Any]
    is_hard: bool  # Hard constraints cannot be violated


@dataclass
class Dependency:
    """A dependency between planning elements."""
    dependency_id: str
    dependency_type: DependencyType
    source: str
    target: str
    description: str
    optional: bool


@dataclass
class Artifact:
    """An artifact produced or consumed."""
    artifact_id: str
    artifact_type: str
    description: str
    produced_by: Optional[str]
    consumed_by: List[str]
    immutable: bool


@dataclass
class Evidence:
    """Evidence required for verification."""
    evidence_id: str
    evidence_type: str
    source: str
    verification_method: str
    success_criteria: str


@dataclass
class Verification:
    """Verification step."""
    verification_id: str
    description: str
    method: str
    evidence_required: List[str]
    success_criteria: str


@dataclass
class Rollback:
    """Rollback plan."""
    rollback_id: str
    description: str
    steps: List[str]
    automatic: bool
    requires_human: bool


class GeneralPlanner:
    """
    General Planning Skill - Platform-independent, capability-agnostic.
    
    Planning never executes. Planning produces plans.
    Execution belongs elsewhere.
    
    This separation is enormous.
    """
    
    def __init__(self):
        self._planner_id = "general_planner_v1"
        self._ir_version = "1.0"
    
    def plan(
        self,
        goal: str,
        constraints: List[Constraint],
        context: Dict[str, Any],
        available_capabilities: Set[str]
    ) -> PlanningIR:
        """
        Generate a plan from a goal.
        
        Args:
            goal: High-level goal
            constraints: List of constraints
            context: Context information
            available_capabilities: Available capabilities
        
        Returns:
            Planning IR
        """
        # Decompose goal into subgoals
        subgoals = self._decompose_goal(goal, context)
        
        # Identify dependencies
        dependencies = self._identify_dependencies(subgoals)
        
        # Estimate required capabilities
        capability_requests = self._estimate_capabilities(subgoals, available_capabilities)
        
        # Identify risks
        risks = self._identify_risks(subgoals, capability_requests)
        
        # Determine safety classification
        safety = self._classify_safety(risks, capability_requests)
        
        # Generate evidence requirements
        evidence = self._generate_evidence(subgoals)
        
        # Generate verification steps
        verification = self._generate_verification(subgoals, evidence)
        
        # Generate failure modes
        failure_modes = self._generate_failure_modes(subgoals, risks)
        
        # Generate rollback plan
        rollback = self._generate_rollback(subgoals)
        
        # Estimate costs
        total_tokens, total_time = self._estimate_costs(subgoals)
        
        # Determine determinism
        determinism = self._determine_determinism(subgoals, constraints)
        
        # Build Planning IR
        builder = PlanningIRBuilder()
        builder.with_intent(goal)
        builder.with_objective(goal, version=1)
        
        for subgoal in subgoals:
            builder.with_subgoal(
                subgoal_id=subgoal.subgoal_id,
                description=subgoal.description,
                parent_goal_id=subgoal.parent_goal_id,
                preconditions=subgoal.preconditions,
                success_criteria=subgoal.success_criteria,
                estimated_cost_tokens=subgoal.estimated_cost_tokens,
                estimated_time_seconds=subgoal.estimated_time_seconds,
                confidence=subgoal.confidence
            )
        
        for cap_request in capability_requests:
            builder.with_capability(
                capability_name=cap_request.capability_name,
                resource_path=cap_request.resource_path,
                operation=cap_request.operation,
                scope=cap_request.scope,
                justification=cap_request.justification,
                estimated_duration_seconds=cap_request.estimated_duration_seconds,
                risk_level=cap_request.risk_level
            )
        
        for risk in risks:
            builder.with_risk(
                risk_id=risk.risk_id,
                risk_type=risk.risk_type,
                probability=risk.probability,
                impact=risk.impact,
                mitigation=risk.mitigation,
                acceptance_criteria=risk.acceptance_criteria
            )
        
        builder.with_safety_classification(safety)
        builder.with_rollback(rollback.available, rollback.description)
        builder.with_estimates(total_tokens, total_time)
        builder.with_determinism(determinism)
        
        # Require human approval for high-risk operations
        if safety in [SafetyClassification.DANGEROUS, SafetyClassification.CRITICAL]:
            builder.with_human_approval(True)
            builder.with_oracle_review(True)
        
        return builder.build()
    
    def _decompose_goal(self, goal: str, context: Dict[str, Any]) -> List[Subgoal]:
        """Decompose goal into subgoals."""
        # This is a simplified decomposition
        # In production, this would use AI/LLM for intelligent decomposition
        
        subgoals = []
        
        # Analyze goal to determine type
        goal_lower = goal.lower()
        
        if "analyze" in goal_lower or "summarize" in goal_lower:
            # Analysis goal
            subgoals.append(Subgoal(
                subgoal_id=f"subgoal_{uuid.uuid4()}",
                description="Read input data",
                parent_goal_id=None,
                preconditions=["input_available"],
                success_criteria=["data_read_successfully"],
                estimated_cost_tokens=100,
                estimated_time_seconds=10,
                confidence=0.95
            ))
            subgoals.append(Subgoal(
                subgoal_id=f"subgoal_{uuid.uuid4()}",
                description="Process and analyze data",
                parent_goal_id=None,
                preconditions=["data_read_successfully"],
                success_criteria=["analysis_complete"],
                estimated_cost_tokens=500,
                estimated_time_seconds=30,
                confidence=0.85
            ))
            subgoals.append(Subgoal(
                subgoal_id=f"subgoal_{uuid.uuid4()}",
                description="Generate output",
                parent_goal_id=None,
                preconditions=["analysis_complete"],
                success_criteria=["output_generated"],
                estimated_cost_tokens=200,
                estimated_time_seconds=15,
                confidence=0.90
            ))
        
        elif "deploy" in goal_lower or "publish" in goal_lower:
            # Deployment goal
            subgoals.append(Subgoal(
                subgoal_id=f"subgoal_{uuid.uuid4()}",
                description="Verify deployment readiness",
                parent_goal_id=None,
                preconditions=["code_available"],
                success_criteria=["verification_passed"],
                estimated_cost_tokens=300,
                estimated_time_seconds=60,
                confidence=0.90
            ))
            subgoals.append(Subgoal(
                subgoal_id=f"subgoal_{uuid.uuid4()}",
                description="Execute deployment",
                parent_goal_id=None,
                preconditions=["verification_passed"],
                success_criteria=["deployment_complete"],
                estimated_cost_tokens=200,
                estimated_time_seconds=120,
                confidence=0.75
            ))
            subgoals.append(Subgoal(
                subgoal_id=f"subgoal_{uuid.uuid4()}",
                description="Verify deployment success",
                parent_goal_id=None,
                preconditions=["deployment_complete"],
                success_criteria=["post_deployment_checks_passed"],
                estimated_cost_tokens=150,
                estimated_time_seconds=30,
                confidence=0.85
            ))
        
        else:
            # Generic goal
            subgoals.append(Subgoal(
                subgoal_id=f"subgoal_{uuid.uuid4()}",
                description="Understand requirements",
                parent_goal_id=None,
                preconditions=[],
                success_criteria=["requirements_understood"],
                estimated_cost_tokens=100,
                estimated_time_seconds=10,
                confidence=0.95
            ))
            subgoals.append(Subgoal(
                subgoal_id=f"subgoal_{uuid.uuid4()}",
                description="Execute primary task",
                parent_goal_id=None,
                preconditions=["requirements_understood"],
                success_criteria=["task_complete"],
                estimated_cost_tokens=500,
                estimated_time_seconds=60,
                confidence=0.80
            ))
            subgoals.append(Subgoal(
                subgoal_id=f"subgoal_{uuid.uuid4()}",
                description="Verify results",
                parent_goal_id=None,
                preconditions=["task_complete"],
                success_criteria=["verification_passed"],
                estimated_cost_tokens=200,
                estimated_time_seconds=20,
                confidence=0.90
            ))
        
        return subgoals
    
    def _identify_dependencies(self, subgoals: List[Subgoal]) -> List:
        """Identify dependencies between subgoals."""
        dependencies = []
        
        # Create temporal dependencies based on preconditions
        for i, subgoal in enumerate(subgoals):
            for precondition in subgoal.preconditions:
                # Find subgoal that produces this precondition
                for j, other_subgoal in enumerate(subgoals):
                    if j < i and precondition in other_subgoal.success_criteria:
                        dependencies.append({
                            "dependency_id": f"dep_{uuid.uuid4()}",
                            "dependency_type": "temporal",
                            "source": other_subgoal.subgoal_id,
                            "target": subgoal.subgoal_id,
                            "required": True
                        })
        
        return dependencies
    
    def _estimate_capabilities(
        self,
        subgoals: List[Subgoal],
        available_capabilities: Set[str]
    ) -> List[CapabilityRequest]:
        """Estimate required capabilities."""
        capability_requests = []
        
        for subgoal in subgoals:
            description = subgoal.description.lower()
            
            # Estimate capabilities based on subgoal description
            if "read" in description:
                cap = CapabilityRequest(
                    capability_name="filesystem.read",
                    resource_path=None,
                    operation="read",
                    scope="minimal",
                    justification=f"Required for subgoal: {subgoal.description}",
                    estimated_duration_seconds=subgoal.estimated_time_seconds,
                    risk_level="low"
                )
                if cap.capability_name in available_capabilities:
                    capability_requests.append(cap)
            
            if "write" in description or "generate" in description or "deploy" in description:
                cap = CapabilityRequest(
                    capability_name="filesystem.write",
                    resource_path=None,
                    operation="write",
                    scope="minimal",
                    justification=f"Required for subgoal: {subgoal.description}",
                    estimated_duration_seconds=subgoal.estimated_time_seconds,
                    risk_level="medium"
                )
                if cap.capability_name in available_capabilities:
                    capability_requests.append(cap)
            
            if "deploy" in description or "publish" in description:
                cap = CapabilityRequest(
                    capability_name="network.http",
                    resource_path=None,
                    operation="connect",
                    scope="minimal",
                    justification=f"Required for subgoal: {subgoal.description}",
                    estimated_duration_seconds=subgoal.estimated_time_seconds,
                    risk_level="high"
                )
                if cap.capability_name in available_capabilities:
                    capability_requests.append(cap)
        
        return capability_requests
    
    def _identify_risks(
        self,
        subgoals: List[Subgoal],
        capability_requests: List[CapabilityRequest]
    ) -> List[Risk]:
        """Identify risks."""
        risks = []
        
        # Identify risks from capability requests
        for cap in capability_requests:
            if cap.risk_level == "high":
                risks.append(Risk(
                    risk_id=f"risk_{uuid.uuid4()}",
                    risk_type="security",
                    probability="medium",
                    impact="high",
                    mitigation="Use capability broker for approval",
                    acceptance_criteria="Oracle approval required"
                ))
        
        # Identify risks from subgoals
        for subgoal in subgoals:
            if subgoal.confidence < 0.8:
                risks.append(Risk(
                    risk_id=f"risk_{uuid.uuid4()}",
                    risk_type="correctness",
                    probability="medium",
                    impact="medium",
                    mitigation="Add verification steps",
                    acceptance_criteria="Human review if confidence < 0.7"
                ))
        
        return risks
    
    def _classify_safety(
        self,
        risks: List[Risk],
        capability_requests: List[CapabilityRequest]
    ) -> SafetyClassification:
        """Classify safety level."""
        high_risk_caps = [c for c in capability_requests if c.risk_level == "high"]
        high_impact_risks = [r for r in risks if r.impact == "high"]
        
        if high_risk_caps or high_impact_risks:
            if any(r.probability == "high" for r in high_impact_risks):
                return SafetyClassification.CRITICAL
            return SafetyClassification.DANGEROUS
        
        if risks:
            return SafetyClassification.RISKY
        
        return SafetyClassification.SAFE
    
    def _generate_evidence(self, subgoals: List[Subgoal]) -> List:
        """Generate evidence requirements."""
        evidence = []
        
        for subgoal in subgoals:
            evidence.append({
                "evidence_id": f"evidence_{uuid.uuid4()}",
                "evidence_type": "log",
                "source": subgoal.subgoal_id,
                "verification_method": "log_analysis",
                "success_criteria": "no_errors_in_log"
            })
        
        return evidence
    
    def _generate_verification(self, subgoals: List[Subgoal], evidence: List) -> List[str]:
        """Generate verification steps."""
        verification = []
        
        for subgoal in subgoals:
            verification.append(f"Verify {subgoal.description}")
        
        return verification
    
    def _generate_failure_modes(self, subgoals: List[Subgoal], risks: List[Risk]) -> List:
        """Generate failure modes."""
        failure_modes = []
        
        for subgoal in subgoals:
            failure_modes.append({
                "failure_type": "timeout",
                "detection_method": "timeout_monitor",
                "recovery_strategy": "retry_with_backoff",
                "rollback_plan": "return_to_previous_state",
                "manual_intervention_required": False
            })
        
        return failure_modes
    
    def _generate_rollback(self, subgoals: List[Subgoal]) -> Rollback:
        """Generate rollback plan."""
        return Rollback(
            rollback_id=f"rollback_{uuid.uuid4()}",
            description="Reverse all changes in reverse order",
            steps=[f"Reverse {sg.description}" for sg in reversed(subgoals)],
            automatic=True,
            requires_human=False
        )
    
    def _estimate_costs(self, subgoals: List[Subgoal]) -> tuple[int, int]:
        """Estimate total costs."""
        total_tokens = sum(sg.estimated_cost_tokens for sg in subgoals)
        total_time = sum(sg.estimated_time_seconds for sg in subgoals)
        return total_tokens, total_time
    
    def _determine_determinism(
        self,
        subgoals: List[Subgoal],
        constraints: List[Constraint]
    ) -> Determinism:
        """Determine determinism level."""
        # Check for determinism constraints
        for constraint in constraints:
            if constraint.constraint_type == ConstraintType.DETERMINISM:
                if constraint.parameters.get("required") == True:
                    return Determinism.DETERMINISTIC
        
        # Check subgoal confidence
        avg_confidence = sum(sg.confidence for sg in subgoals) / len(subgoals) if subgoals else 0.5
        
        if avg_confidence > 0.95:
            return Determinism.DETERMINISTIC
        elif avg_confidence > 0.7:
            return Determinism.PROBABILISTIC
        else:
            return Determinism.NON_DETERMINISTIC


# NOTE: Singleton pattern removed for determinism and testability.
# Use dependency injection instead.
# _general_planner = GeneralPlanner()


def create_general_planner() -> GeneralPlanner:
    """Create a new general planner instance."""
    return GeneralPlanner()
