"""
IR Lowering - Planning IR to Canonical IR.

This module lowers Planning IR into Canonical IR.

Pipeline:
Intent → Planning IR → Canonical IR → Optimization → Execution Graph → Runtime

Planning IR is platform-independent and capability-agnostic.
Canonical IR is the single source of truth for all downstream systems.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid

from runtime.planning.planning_ir import PlanningIR, Subgoal, CapabilityRequest
from architecture.canonical_ir import (
    CanonicalIR, CIRNode, CIREdge, CIRArtifact, CIRConstraint,
    CIRBuilder, CIRNodeBuilder, NodeType, TransformType, EffectType,
    CapabilityRequirement, ResourceRequirement, CIRVersion
)


class IRLoweringPass:
    """
    Lowers Planning IR to Canonical IR.
    
    Planning IR is platform-independent and capability-agnostic.
    Canonical IR is the single source of truth for all downstream systems.
    """
    
    def __init__(self):
        self._node_id_map: Dict[str, str] = {}  # Maps Planning IR subgoal IDs to CIR node IDs
    
    def lower(self, planning_ir: PlanningIR) -> CanonicalIR:
        """
        Lower Planning IR to Canonical IR.
        
        Args:
            planning_ir: Planning Intermediate Representation
        
        Returns:
            Canonical IR
        """
        builder = CIRBuilder()
        
        # Set source information
        builder.with_source(
            intent_id=planning_ir.intent,
            strategy_id=None,
            planning_ir_id=planning_ir.ir_id
        )
        
        # Lower subgoals to CIR nodes
        for subgoal in planning_ir.subgoals:
            node = self._lower_subgoal(subgoal, planning_ir)
            builder.add_node(node)
            self._node_id_map[subgoal.subgoal_id] = node.node_id
        
        # Lower capability requests
        for cap_request in planning_ir.capability_requests:
            self._lower_capability_request(cap_request, builder)
        
        # Lower evidence requirements
        for evidence_req in planning_ir.evidence_requirements:
            self._lower_evidence_requirement(evidence_req, builder)
        
        # Create edges based on dependencies
        self._create_edges(planning_ir, builder)
        
        # Create artifacts
        self._create_artifacts(planning_ir, builder)
        
        # Create constraints
        self._create_constraints(planning_ir, builder)
        
        # Build CIR
        cir = builder.build()
        
        return cir
    
    def _lower_subgoal(self, subgoal: Subgoal, planning_ir: PlanningIR) -> CIRNode:
        """Lower a subgoal to a CIR node."""
        node_builder = CIRNodeBuilder()
        
        # Determine node type based on subgoal characteristics
        if subgoal.determinism.value == "deterministic":
            node_builder.as_transform(TransformType.PLANNING_TRANSFORM)
        else:
            node_builder.as_effect(EffectType.LLM_INFERENCE)
        
        node_builder.with_name(subgoal.subgoal_id)
        node_builder.with_description(subgoal.description)
        
        # Add capability requirements
        for cap_name in subgoal.required_capabilities:
            node_builder.with_capability_requirement(
                capability_path=cap_name,
                operation="use",
                scope="minimal",
                justification=f"Required for subgoal {subgoal.subgoal_id}",
                estimated_duration_seconds=subgoal.estimated_time_seconds
            )
        
        # Set estimated costs
        node_builder.with_estimated_cost(
            duration_seconds=subgoal.estimated_time_seconds,
            cost_tokens=subgoal.estimated_cost_tokens
        )
        
        # Add metadata
        node_builder.with_metadata("confidence", subgoal.confidence)
        node_builder.with_metadata("success_criteria", subgoal.success_criteria)
        node_builder.with_metadata("failure_modes", [fm.description for fm in subgoal.failure_modes])
        
        return node_builder.build()
    
    def _lower_capability_request(self, cap_request: CapabilityRequest, builder: CIRBuilder) -> None:
        """Lower a capability request to CIR."""
        # Create a capability requirement node
        node_builder = CIRNodeBuilder()
        node_builder.as_effect(EffectType.ARTIFACT_READ)
        node_builder.with_name(f"capability_request_{cap_request.capability_name}")
        node_builder.with_description(f"Request capability: {cap_request.capability_name}")
        node_builder.with_capability_requirement(
            capability_path=cap_request.capability_name,
            operation=cap_request.operation,
            scope=cap_request.scope,
            justification=cap_request.justification,
            estimated_duration_seconds=0
        )
        
        node = node_builder.build()
        builder.add_node(node)
    
    def _lower_evidence_requirement(self, evidence_req: Any, builder: CIRBuilder) -> None:
        """Lower an evidence requirement to CIR."""
        # Create an evidence collection node
        node_builder = CIRNodeBuilder()
        node_builder.as_effect(EffectType.VALIDATION)
        node_builder.with_name(f"evidence_{evidence_req.evidence_type.value if hasattr(evidence_req, 'evidence_type') else 'generic'}")
        node_builder.with_description("Collect evidence for verification")
        node_builder.with_capability_requirement(
            capability_path="evidence.collection",
            operation="execute",
            scope="required",
            justification="Evidence required for constitutional verification",
            estimated_duration_seconds=evidence_req.estimated_duration_seconds if hasattr(evidence_req, 'estimated_duration_seconds') else 60
        )
        
        node = node_builder.build()
        builder.add_node(node)
    
    def _create_edges(self, planning_ir: PlanningIR, builder: CIRBuilder) -> None:
        """Create edges based on subgoal dependencies."""
        for subgoal in planning_ir.subgoals:
            if subgoal.dependencies:
                for dep_id in subgoal.dependencies:
                    source_id = self._node_id_map.get(dep_id)
                    target_id = self._node_id_map.get(subgoal.subgoal_id)
                    
                    if source_id and target_id:
                        edge = CIREdge(
                            edge_id=str(uuid.uuid4()),
                            source_node_id=source_id,
                            target_node_id=target_id,
                            edge_type="dependency",
                            condition=None,
                            metadata={}
                        )
                        builder.add_edge(edge)
    
    def _create_artifacts(self, planning_ir: PlanningIR, builder: CIRBuilder) -> None:
        """Create artifacts for the CIR."""
        # Create input artifacts
        for i, subgoal in enumerate(planning_ir.subgoals):
            artifact = CIRArtifact(
                artifact_id=f"input_artifact_{i}",
                artifact_type="input",
                artifact_name=f"Input for {subgoal.subgoal_id}",
                schema_version="v1",
                schema={},
                produced_by_node="",
                consumed_by_nodes=[self._node_id_map.get(subgoal.subgoal_id, "")],
                immutable=True,
                metadata={}
            )
            builder.add_artifact(artifact)
        
        # Create output artifacts
        for i, subgoal in enumerate(planning_ir.subgoals):
            artifact = CIRArtifact(
                artifact_id=f"output_artifact_{i}",
                artifact_type="output",
                artifact_name=f"Output from {subgoal.subgoal_id}",
                schema_version="v1",
                schema={},
                produced_by_node=self._node_id_map.get(subgoal.subgoal_id, ""),
                consumed_by_nodes=[],
                immutable=True,
                metadata={}
            )
            builder.add_artifact(artifact)
    
    def _create_constraints(self, planning_ir: PlanningIR, builder: CIRBuilder) -> None:
        """Create constraints for the CIR."""
        # Create safety constraints based on safety classification
        if planning_ir.safety_classification:
            constraint = CIRConstraint(
                constraint_id=str(uuid.uuid4()),
                constraint_type="safety",
                expression=f"safety_level >= {planning_ir.safety_classification.value}",
                applies_to=[node.node_id for node in builder._nodes],
                severity="error",
                metadata={"classification": planning_ir.safety_classification.value}
            )
            builder.add_constraint(constraint)
        
        # Create rollback constraint if rollback is available
        if planning_ir.rollback_available:
            constraint = CIRConstraint(
                constraint_id=str(uuid.uuid4()),
                constraint_type="rollback",
                expression="rollback_plan_exists",
                applies_to=[node.node_id for node in builder._nodes],
                severity="warning",
                metadata={"recovery_plan": planning_ir.recovery_plan}
            )
            builder.add_constraint(constraint)


class CIRValidator:
    """
    Validates Canonical IR.
    
    Ensures CIR is well-formed and ready for optimization.
    """
    
    def validate(self, cir: CanonicalIR) -> tuple[bool, List[str], List[str]]:
        """
        Validate Canonical IR.
        
        Args:
            cir: Canonical IR
        
        Returns:
            (is_valid, errors, warnings)
        """
        errors = []
        warnings = []
        
        # Check that CIR has nodes
        if not cir.nodes:
            errors.append("CIR has no nodes")
        
        # Check that all node IDs are unique
        node_ids = [node.node_id for node in cir.nodes]
        if len(node_ids) != len(set(node_ids)):
            errors.append("CIR has duplicate node IDs")
        
        # Check that all edge source and target IDs exist
        node_id_set = set(node_ids)
        for edge in cir.edges:
            if edge.source_node_id not in node_id_set:
                errors.append(f"Edge {edge.edge_id} references non-existent source node {edge.source_node_id}")
            if edge.target_node_id not in node_id_set:
                errors.append(f"Edge {edge.edge_id} references non-existent target node {edge.target_node_id}")
        
        # Check that all dependencies exist
        for node in cir.nodes:
            for dep_id in node.dependencies:
                if dep_id not in node_id_set:
                    errors.append(f"Node {node.node_id} depends on non-existent node {dep_id}")
        
        # Check for cycles (simplified)
        if self._has_cycles(cir):
            warnings.append("CIR may contain cycles")
        
        # Check that entry nodes exist
        entry_nodes = cir.get_entry_nodes()
        if not entry_nodes:
            warnings.append("CIR has no entry nodes (all nodes have dependencies)")
        
        # Check that exit nodes exist
        exit_nodes = cir.get_exit_nodes()
        if not exit_nodes:
            warnings.append("CIR has no exit nodes (all nodes have dependents)")
        
        return len(errors) == 0, errors, warnings
    
    def _has_cycles(self, cir: CanonicalIR) -> bool:
        """Check if CIR has cycles (simplified DFS)."""
        visited = set()
        recursion_stack = set()
        
        def visit(node_id: str) -> bool:
            visited.add(node_id)
            recursion_stack.add(node_id)
            
            node = cir.get_node(node_id)
            if node:
                for dep_id in node.dependencies:
                    if dep_id not in visited:
                        if visit(dep_id):
                            return True
                    elif dep_id in recursion_stack:
                        return True
            
            recursion_stack.remove(node_id)
            return False
        
        for node in cir.nodes:
            if node.node_id not in visited:
                if visit(node.node_id):
                    return True
        
        return False


# Singleton instance
_ir_lowering_pass = IRLoweringPass()
_cir_validator = CIRValidator()


def get_ir_lowering_pass() -> IRLoweringPass:
    """Get the singleton IR lowering pass."""
    return _ir_lowering_pass


def get_cir_validator() -> CIRValidator:
    """Get the singleton CIR validator."""
    return _cir_validator
