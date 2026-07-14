"""
Objective to Mission IR Compiler.

Compiles transient objectives into Mission IR.

Objectives are planning constructs that compile into Mission IR.
This compiler handles the transformation from objective to executable mission representation.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid

from runtime.planning.transient_objectives import TransientObjective
from runtime.planning.planning_ir import PlanningIR, Subgoal, CapabilityRequest, EvidenceRequirement, Risk, FailureMode


@dataclass
class MissionIR:
    """
    Mission Intermediate Representation.
    
    Compiled from objectives, this is the executable representation of a mission.
    """
    mission_id: str
    objective_id: str
    strategy_id: Optional[str]
    mission_name: str
    description: str
    
    # Planning components
    subgoals: List[Subgoal]
    capability_requests: List[CapabilityRequest]
    evidence_requirements: List[EvidenceRequirement]
    risks: List[Risk]
    failure_modes: List[FailureMode]
    
    # Constraints
    constraints: Dict[str, Any]
    
    # Metadata
    compiled_at: str
    compiled_by: str
    compiler_version: str
    metadata: Dict[str, Any]
    
    def to_planning_ir(self) -> PlanningIR:
        """
        Convert Mission IR to Planning IR.
        
        This allows Mission IR to be processed by the existing Planning IR pipeline.
        """
        return PlanningIR(
            ir_id=str(uuid.uuid4()),
            intent=self.strategy_id or "unknown",
            objective=self.objective_id,
            description=self.description,
            subgoals=self.subgoals,
            capability_requests=self.capability_requests,
            evidence_requirements=self.evidence_requirements,
            risks=self.risks,
            failure_modes=self.failure_modes,
            rollback_available=True,
            recovery_plan="Default recovery plan",
            safety_classification=None,
            metadata=self.metadata
        )


class ObjectiveToMissionCompiler:
    """
    Compiles transient objectives into Mission IR.
    
    This is the primary compiler for transforming planning objectives into executable missions.
    """
    
    def __init__(self, compiler_version: str = "v1"):
        self.compiler_version = compiler_version
    
    def compile(
        self,
        objective: TransientObjective,
        mission_name: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> MissionIR:
        """
        Compile a transient objective into Mission IR.
        
        Args:
            objective: Transient objective to compile
            mission_name: Optional mission name (defaults to objective description)
            context: Additional compilation context
        
        Returns:
            Mission IR
        """
        # Generate subgoals from success criteria
        subgoals = self._generate_subgoals(objective, context or {})
        
        # Generate capability requests from constraints
        capability_requests = self._generate_capability_requests(objective, context or {})
        
        # Generate evidence requirements
        evidence_requirements = self._generate_evidence_requirements(objective, context or {})
        
        # Generate risks
        risks = self._generate_risks(objective, context or {})
        
        # Generate failure modes
        failure_modes = self._generate_failure_modes(objective, context or {})
        
        return MissionIR(
            mission_id=str(uuid.uuid4()),
            objective_id=objective.objective_id,
            strategy_id=objective.strategy_id,
            mission_name=mission_name or objective.description,
            description=objective.description,
            subgoals=subgoals,
            capability_requests=capability_requests,
            evidence_requirements=evidence_requirements,
            risks=risks,
            failure_modes=failure_modes,
            constraints=objective.constraints,
            compiled_at=datetime.now(timezone.utc).isoformat(),
            compiled_by="objective_compiler",
            compiler_version=self.compiler_version,
            metadata={
                **objective.metadata,
                "objective_lifecycle": objective.lifecycle.value,
                "compilation_context": context or {}
            }
        )
    
    def compile_batch(
        self,
        objectives: List[TransientObjective],
        context: Optional[Dict[str, Any]] = None
    ) -> List[MissionIR]:
        """
        Compile multiple objectives into Mission IR.
        
        Args:
            objectives: List of transient objectives
            context: Additional compilation context
        
        Returns:
            List of Mission IR
        """
        return [self.compile(obj, context=context) for obj in objectives]
    
    def _generate_subgoals(
        self,
        objective: TransientObjective,
        context: Dict[str, Any]
    ) -> List[Subgoal]:
        """Generate subgoals from objective success criteria."""
        subgoals = []
        
        for i, criterion in enumerate(objective.success_criteria):
            subgoal = Subgoal(
                subgoal_id=str(uuid.uuid4()),
                description=f"Subgoal for criterion: {criterion}",
                success_criteria=[criterion],
                required_capabilities=context.get("required_capabilities", []),
                estimated_time_seconds=objective.estimated_duration_seconds // len(objective.success_criteria) if objective.success_criteria else 0,
                estimated_cost_tokens=objective.estimated_cost_tokens // len(objective.success_criteria) if objective.success_criteria else 0,
                confidence=0.8,
                dependencies=[],
                metadata={"criterion_index": i}
            )
            subgoals.append(subgoal)
        
        return subgoals
    
    def _generate_capability_requests(
        self,
        objective: TransientObjective,
        context: Dict[str, Any]
    ) -> List[CapabilityRequest]:
        """Generate capability requests from objective constraints."""
        capability_requests = []
        
        # Extract capabilities from constraints
        capabilities = objective.constraints.get("capabilities", [])
        
        for cap in capabilities:
            request = CapabilityRequest(
                capability_name=cap.get("name", "unknown"),
                operation=cap.get("operation", "use"),
                resource_path=cap.get("resource_path"),
                scope=cap.get("scope", "minimal"),
                justification=cap.get("justification", f"Required for objective {objective.objective_id}"),
                estimated_duration_seconds=cap.get("estimated_duration_seconds", 0),
                risk_level=cap.get("risk_level", "medium")
            )
            capability_requests.append(request)
        
        return capability_requests
    
    def _generate_evidence_requirements(
        self,
        objective: TransientObjective,
        context: Dict[str, Any]
    ) -> List[EvidenceRequirement]:
        """Generate evidence requirements for the objective."""
        evidence_requirements = []
        
        # Default evidence requirements
        evidence_types = ["unit_test", "integration_test", "verification"]
        
        for evidence_type in evidence_types:
            requirement = EvidenceRequirement(
                requirement_id=str(uuid.uuid4()),
                evidence_type=evidence_type,
                description=f"{evidence_type} evidence for objective",
                verification_method="automated",
                success_criteria="all_checks_pass",
                priority="high",
                estimated_duration_seconds=60,
                dependencies=[],
                metadata={"evidence_type": evidence_type}
            )
            evidence_requirements.append(requirement)
        
        return evidence_requirements
    
    def _generate_risks(
        self,
        objective: TransientObjective,
        context: Dict[str, Any]
    ) -> List[Risk]:
        """Generate risks for the objective."""
        risks = []
        
        # Default risks based on objective characteristics
        if objective.estimated_cost_tokens > 10000:
            risk = Risk(
                risk_id=str(uuid.uuid4()),
                risk_type="cost",
                description="High token cost may exceed budget",
                probability=0.3,
                impact="medium",
                mitigation="Monitor token usage and implement cost limits"
            )
            risks.append(risk)
        
        if objective.estimated_duration_seconds > 3600:
            risk = Risk(
                risk_id=str(uuid.uuid4()),
                risk_type="time",
                description="Long execution time may delay other missions",
                probability=0.4,
                impact="medium",
                mitigation="Implement time limits and preemption"
            )
            risks.append(risk)
        
        return risks
    
    def _generate_failure_modes(
        self,
        objective: TransientObjective,
        context: Dict[str, Any]
    ) -> List[FailureMode]:
        """Generate failure modes for the objective."""
        failure_modes = []
        
        # Default failure modes
        failure_modes.append(FailureMode(
            failure_mode_id=str(uuid.uuid4()),
            description="Capability request denied",
            probability=0.1,
            recovery_strategy="Request alternative capability or modify objective",
            severity="high"
        ))
        
        failure_modes.append(FailureMode(
            failure_mode_id=str(uuid.uuid4()),
            description="Subgoal execution timeout",
            probability=0.2,
            recovery_strategy="Retry with extended timeout or break down subgoal",
            severity="medium"
        ))
        
        failure_modes.append(FailureMode(
            failure_mode_id=str(uuid.uuid4()),
            description="Evidence collection failure",
            probability=0.15,
            recovery_strategy="Retry evidence collection or proceed with partial evidence",
            severity="medium"
        ))
        
        return failure_modes


class MissionIRValidator:
    """
    Validates Mission IR before further processing.
    
    Ensures compiled Mission IR is well-formed and ready for downstream processing.
    """
    
    def validate(self, mission_ir: MissionIR) -> tuple[bool, List[str], List[str]]:
        """
        Validate Mission IR.
        
        Args:
            mission_ir: Mission IR to validate
        
        Returns:
            (is_valid, errors, warnings)
        """
        errors = []
        warnings = []
        
        # Check required fields
        if not mission_ir.mission_id:
            errors.append("Mission IR missing mission_id")
        
        if not mission_ir.objective_id:
            errors.append("Mission IR missing objective_id")
        
        if not mission_ir.subgoals:
            warnings.append("Mission IR has no subgoals")
        
        # Validate subgoals
        for subgoal in mission_ir.subgoals:
            if not subgoal.success_criteria:
                warnings.append(f"Subgoal {subgoal.subgoal_id} has no success criteria")
            
            if subgoal.confidence < 0.0 or subgoal.confidence > 1.0:
                errors.append(f"Subgoal {subgoal.subgoal_id} has invalid confidence")
        
        # Validate capability requests
        for cap in mission_ir.capability_requests:
            if not cap.operation:
                errors.append(f"Capability request {cap.capability_name} has no operation")
        
        # Check cost estimates
        total_cost = sum(sg.estimated_cost_tokens for sg in mission_ir.subgoals)
        if total_cost > 100000:
            warnings.append(f"High total cost estimate: {total_cost} tokens")
        
        total_time = sum(sg.estimated_time_seconds for sg in mission_ir.subgoals)
        if total_time > 7200:
            warnings.append(f"High total time estimate: {total_time} seconds")
        
        return len(errors) == 0, errors, warnings


# Singleton instances
_objective_to_mission_compiler = ObjectiveToMissionCompiler()
_mission_ir_validator = MissionIRValidator()


def get_objective_to_mission_compiler() -> ObjectiveToMissionCompiler:
    """Get the singleton objective to mission compiler."""
    return _objective_to_mission_compiler


def get_mission_ir_validator() -> MissionIRValidator:
    """Get the singleton Mission IR validator."""
    return _mission_ir_validator
