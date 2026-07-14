"""
Canonical Intermediate Representation (CIR) - v1

The Canonical IR is the single source of truth for all downstream systems.

Target pipeline:
Intent → Planning IR → Canonical IR → Optimization → Execution Graph → Runtime

All downstream systems (Verifier, Scheduler, Evidence, Rollback, Security, Artifacts, State Machine)
consume the same Canonical IR.

CIR is versioned. Never mutate in-place. Introduce migrations.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone
from enum import Enum
import json
import uuid
from pathlib import Path


class CIRVersion(Enum):
    """CIR schema versions."""
    V1 = "v1"
    # Future versions: V2, V3, etc.


class NodeType(Enum):
    """Types of nodes in CIR."""
    TRANSFORM = "transform"  # Pure transformation
    EFFECT = "effect"  # Side effect
    VALIDATION = "validation"  # Validation check
    AGGREGATION = "aggregation"  # Data aggregation
    BRANCH = "branch"  # Conditional branching
    MERGE = "merge"  # Merge parallel paths


class EffectType(Enum):
    """Types of effect nodes."""
    FILESYSTEM_READ = "filesystem_read"
    FILESYSTEM_WRITE = "filesystem_write"
    NETWORK_REQUEST = "network_request"
    TERMINAL_EXECUTE = "terminal_execute"
    LLM_INFERENCE = "llm_inference"
    ARTIFACT_CREATE = "artifact_create"
    ARTIFACT_READ = "artifact_read"
    HUMAN_APPROVAL = "human_approval"
    COMPILATION = "compilation"
    EXECUTION = "execution"


class TransformType(Enum):
    """Types of transform nodes."""
    NORMALIZATION = "normalization"
    PLANNING_TRANSFORM = "planning_transform"
    SCHEMA_TRANSFORM = "schema_transform"
    IR_TRANSFORM = "ir_transform"
    GRAPH_TRANSFORM = "graph_transform"
    VALIDATION_TRANSFORM = "validation_transform"


@dataclass
class CapabilityRequirement:
    """Capability requirement in CIR."""
    capability_path: str  # Semantic capability path
    operation: str  # read, write, execute, etc.
    scope: str  # minimal, required, optional
    justification: str
    estimated_duration_seconds: int


@dataclass
class ResourceRequirement:
    """Resource requirement in CIR."""
    resource_type: str
    amount: float
    unit: str
    constraints: Dict[str, Any]


@dataclass
class CIRNode:
    """
    A node in the Canonical IR.
    
    Can be a pure transform or an effect node.
    """
    node_id: str
    node_type: NodeType
    transform_type: Optional[TransformType]
    effect_type: Optional[EffectType]
    name: str
    description: str
    
    # Inputs and outputs
    inputs: List[str]  # Input artifact IDs or node IDs
    outputs: List[str]  # Output artifact IDs
    input_schema: Optional[Dict[str, Any]]
    output_schema: Optional[Dict[str, Any]]
    
    # Requirements
    capability_requirements: List[CapabilityRequirement]
    resource_requirements: List[ResourceRequirement]
    
    # Execution constraints
    deterministic: bool
    estimated_duration_seconds: int
    estimated_cost_tokens: int
    
    # Dependencies
    dependencies: List[str]  # Node IDs this depends on
    
    # Metadata
    metadata: Dict[str, Any]
    
    def is_pure_transform(self) -> bool:
        """Check if node is a pure transform."""
        return self.node_type == NodeType.TRANSFORM
    
    def is_effect_node(self) -> bool:
        """Check if node is an effect node."""
        return self.node_type == NodeType.EFFECT
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "node_id": self.node_id,
            "node_type": self.node_type.value,
            "transform_type": self.transform_type.value if self.transform_type else None,
            "effect_type": self.effect_type.value if self.effect_type else None,
            "name": self.name,
            "description": self.description,
            "inputs": self.inputs,
            "outputs": self.outputs,
            "input_schema": self.input_schema,
            "output_schema": self.output_schema,
            "capability_requirements": [
                {
                    "capability_path": cr.capability_path,
                    "operation": cr.operation,
                    "scope": cr.scope,
                    "justification": cr.justification,
                    "estimated_duration_seconds": cr.estimated_duration_seconds
                }
                for cr in self.capability_requirements
            ],
            "resource_requirements": [
                {
                    "resource_type": rr.resource_type,
                    "amount": rr.amount,
                    "unit": rr.unit,
                    "constraints": rr.constraints
                }
                for rr in self.resource_requirements
            ],
            "deterministic": self.deterministic,
            "estimated_duration_seconds": self.estimated_duration_seconds,
            "estimated_cost_tokens": self.estimated_cost_tokens,
            "dependencies": self.dependencies,
            "metadata": self.metadata
        }


@dataclass
class CIREdge:
    """An edge in the CIR graph."""
    edge_id: str
    source_node_id: str
    target_node_id: str
    edge_type: str  # data_flow, control_flow, dependency
    condition: Optional[str]  # Conditional expression
    metadata: Dict[str, Any]


@dataclass
class CIRArtifact:
    """An artifact in the CIR."""
    artifact_id: str
    artifact_type: str
    artifact_name: str
    schema_version: str
    schema: Dict[str, Any]
    produced_by_node: str
    consumed_by_nodes: List[str]
    immutable: bool
    metadata: Dict[str, Any]


@dataclass
class CIRConstraint:
    """A constraint in the CIR."""
    constraint_id: str
    constraint_type: str  # temporal, resource, capability, safety
    expression: str
    applies_to: List[str]  # Node IDs this applies to
    severity: str  # error, warning, info
    metadata: Dict[str, Any]


@dataclass
class CanonicalIR:
    """
    Canonical Intermediate Representation v1.
    
    This is the single source of truth for all downstream systems.
    """
    cir_version: CIRVersion
    cir_id: str
    created_at: str
    created_by: str
    
    # Source information
    source_intent_id: Optional[str]
    source_strategy_id: Optional[str]
    source_planning_ir_id: Optional[str]
    
    # Graph structure
    nodes: List[CIRNode]
    edges: List[CIREdge]
    
    # Artifacts
    artifacts: List[CIRArtifact]
    
    # Constraints
    constraints: List[CIRConstraint]
    
    # Metadata
    metadata: Dict[str, Any]
    
    def get_node(self, node_id: str) -> Optional[CIRNode]:
        """Get node by ID."""
        for node in self.nodes:
            if node.node_id == node_id:
                return node
        return None
    
    def get_pure_transforms(self) -> List[CIRNode]:
        """Get all pure transform nodes."""
        return [node for node in self.nodes if node.is_pure_transform()]
    
    def get_effect_nodes(self) -> List[CIRNode]:
        """Get all effect nodes."""
        return [node for node in self.nodes if node.is_effect_node()]
    
    def get_entry_nodes(self) -> List[CIRNode]:
        """Get entry nodes (no dependencies)."""
        return [node for node in self.nodes if not node.dependencies]
    
    def get_exit_nodes(self) -> List[CIRNode]:
        """Get exit nodes (no dependents)."""
        node_ids = {node.node_id for node in self.nodes}
        dependent_ids = set()
        for node in self.nodes:
            dependent_ids.update(node.dependencies)
        return [node for node in self.nodes if node.node_id not in dependent_ids]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "cir_version": self.cir_version.value,
            "cir_id": self.cir_id,
            "created_at": self.created_at,
            "created_by": self.created_by,
            "source_intent_id": self.source_intent_id,
            "source_strategy_id": self.source_strategy_id,
            "source_planning_ir_id": self.source_planning_ir_id,
            "nodes": [node.to_dict() for node in self.nodes],
            "edges": [
                {
                    "edge_id": edge.edge_id,
                    "source_node_id": edge.source_node_id,
                    "target_node_id": edge.target_node_id,
                    "edge_type": edge.edge_type,
                    "condition": edge.condition,
                    "metadata": edge.metadata
                }
                for edge in self.edges
            ],
            "artifacts": [
                {
                    "artifact_id": art.artifact_id,
                    "artifact_type": art.artifact_type,
                    "artifact_name": art.artifact_name,
                    "schema_version": art.schema_version,
                    "schema": art.schema,
                    "produced_by_node": art.produced_by_node,
                    "consumed_by_nodes": art.consumed_by_nodes,
                    "immutable": art.immutable,
                    "metadata": art.metadata
                }
                for art in self.artifacts
            ],
            "constraints": [
                {
                    "constraint_id": const.constraint_id,
                    "constraint_type": const.constraint_type,
                    "expression": const.expression,
                    "applies_to": const.applies_to,
                    "severity": const.severity,
                    "metadata": const.metadata
                }
                for const in self.constraints
            ],
            "metadata": self.metadata
        }
    
    def to_json(self) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict(), indent=2)


class CIRBuilder:
    """
    Builder for creating Canonical IR.
    """
    
    def __init__(self):
        self._cir_version = CIRVersion.V1
        self._cir_id = str(uuid.uuid4())
        self._created_at = datetime.now(timezone.utc).isoformat()
        self._created_by = "cir_builder"
        self._source_intent_id = None
        self._source_strategy_id = None
        self._source_planning_ir_id = None
        self._nodes: List[CIRNode] = []
        self._edges: List[CIREdge] = []
        self._artifacts: List[CIRArtifact] = []
        self._constraints: List[CIRConstraint] = []
        self._metadata: Dict[str, Any] = {}
    
    def with_source(self, intent_id: Optional[str], strategy_id: Optional[str], planning_ir_id: Optional[str]) -> 'CIRBuilder':
        """Set source information."""
        self._source_intent_id = intent_id
        self._source_strategy_id = strategy_id
        self._source_planning_ir_id = planning_ir_id
        return self
    
    def add_node(self, node: CIRNode) -> 'CIRBuilder':
        """Add a node."""
        self._nodes.append(node)
        return self
    
    def add_edge(self, edge: CIREdge) -> 'CIRBuilder':
        """Add an edge."""
        self._edges.append(edge)
        return self
    
    def add_artifact(self, artifact: CIRArtifact) -> 'CIRBuilder':
        """Add an artifact."""
        self._artifacts.append(artifact)
        return self
    
    def add_constraint(self, constraint: CIRConstraint) -> 'CIRBuilder':
        """Add a constraint."""
        self._constraints.append(constraint)
        return self
    
    def with_metadata(self, key: str, value: Any) -> 'CIRBuilder':
        """Add metadata."""
        self._metadata[key] = value
        return self
    
    def build(self) -> CanonicalIR:
        """Build the Canonical IR."""
        return CanonicalIR(
            cir_version=self._cir_version,
            cir_id=self._cir_id,
            created_at=self._created_at,
            created_by=self._created_by,
            source_intent_id=self._source_intent_id,
            source_strategy_id=self._source_strategy_id,
            source_planning_ir_id=self._source_planning_ir_id,
            nodes=self._nodes,
            edges=self._edges,
            artifacts=self._artifacts,
            constraints=self._constraints,
            metadata=self._metadata
        )


class CIRNodeBuilder:
    """
    Builder for creating CIR nodes.
    """
    
    def __init__(self):
        self._node_id = str(uuid.uuid4())
        self._node_type = NodeType.TRANSFORM
        self._transform_type = None
        self._effect_type = None
        self._name = ""
        self._description = ""
        self._inputs: List[str] = []
        self._outputs: List[str] = []
        self._input_schema = None
        self._output_schema = None
        self._capability_requirements: List[CapabilityRequirement] = []
        self._resource_requirements: List[ResourceRequirement] = []
        self._deterministic = True
        self._estimated_duration_seconds = 0
        self._estimated_cost_tokens = 0
        self._dependencies: List[str] = []
        self._metadata: Dict[str, Any] = {}
    
    def as_transform(self, transform_type: TransformType) -> 'CIRNodeBuilder':
        """Set as pure transform."""
        self._node_type = NodeType.TRANSFORM
        self._transform_type = transform_type
        self._effect_type = None
        return self
    
    def as_effect(self, effect_type: EffectType) -> 'CIRNodeBuilder':
        """Set as effect node."""
        self._node_type = NodeType.EFFECT
        self._effect_type = effect_type
        self._transform_type = None
        return self
    
    def with_name(self, name: str) -> 'CIRNodeBuilder':
        """Set node name."""
        self._name = name
        return self
    
    def with_description(self, description: str) -> 'CIRNodeBuilder':
        """Set description."""
        self._description = description
        return self
    
    def with_input(self, input_id: str) -> 'CIRNodeBuilder':
        """Add input."""
        self._inputs.append(input_id)
        return self
    
    def with_output(self, output_id: str) -> 'CIRNodeBuilder':
        """Add output."""
        self._outputs.append(output_id)
        return self
    
    def with_capability_requirement(
        self,
        capability_path: str,
        operation: str,
        scope: str = "minimal",
        justification: str = "",
        estimated_duration_seconds: int = 0
    ) -> 'CIRNodeBuilder':
        """Add capability requirement."""
        self._capability_requirements.append(CapabilityRequirement(
            capability_path=capability_path,
            operation=operation,
            scope=scope,
            justification=justification,
            estimated_duration_seconds=estimated_duration_seconds
        ))
        return self
    
    def with_dependency(self, node_id: str) -> 'CIRNodeBuilder':
        """Add dependency."""
        self._dependencies.append(node_id)
        return self
    
    def with_estimated_cost(self, duration_seconds: int, cost_tokens: int) -> 'CIRNodeBuilder':
        """Set estimated cost."""
        self._estimated_duration_seconds = duration_seconds
        self._estimated_cost_tokens = cost_tokens
        return self
    
    def with_metadata(self, key: str, value: Any) -> 'CIRNodeBuilder':
        """Add metadata."""
        self._metadata[key] = value
        return self
    
    def build(self) -> CIRNode:
        """Build the CIR node."""
        return CIRNode(
            node_id=self._node_id,
            node_type=self._node_type,
            transform_type=self._transform_type,
            effect_type=self._effect_type,
            name=self._name,
            description=self._description,
            inputs=self._inputs,
            outputs=self._outputs,
            input_schema=self._input_schema,
            output_schema=self._output_schema,
            capability_requirements=self._capability_requirements,
            resource_requirements=self._resource_requirements,
            deterministic=self._deterministic,
            estimated_duration_seconds=self._estimated_duration_seconds,
            estimated_cost_tokens=self._estimated_cost_tokens,
            dependencies=self._dependencies,
            metadata=self._metadata
        )
