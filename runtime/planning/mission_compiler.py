"""
Mission Compiler - Planning IR to Execution Graph.

Similar to LLVM:
Human Goal → Planning IR → Optimization → Capability Binding → Execution Graph → Runtime

This prevents every planner from reinventing execution.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Set
from datetime import datetime, timezone
from enum import Enum
import json
import uuid

from runtime.planning.planning_ir import PlanningIR, CapabilityRequest, Risk, Subgoal


class ExecutionNodeType(Enum):
    """Types of execution nodes."""
    TASK = "task"
    GATE = "gate"  # AND/OR gate for branching
    PARALLEL = "parallel"
    SEQUENCE = "sequence"
    CONDITIONAL = "conditional"
    RETRY = "retry"
    TIMEOUT = "timeout"


@dataclass
class ExecutionNode:
    """A node in the execution graph."""
    node_id: str
    node_type: ExecutionNodeType
    skill_id: str
    inputs: Dict[str, Any]
    outputs: Dict[str, Any]
    capabilities_required: List[str]
    dependencies: List[str]  # IDs of nodes this depends on
    timeout_seconds: int
    retry_policy: Dict[str, Any]
    rollback_node_id: Optional[str]
    metadata: Dict[str, Any]


@dataclass
class ExecutionGraph:
    """
    Execution Graph compiled from Planning IR.
    
    DAG of execution nodes with dependencies.
    Consumed by Workflow Compiler for actual execution.
    """
    
    graph_id: str
    graph_version: str
    compiled_at: str
    source_ir_id: str
    
    # Graph structure
    nodes: List[ExecutionNode]
    entry_node_id: str
    exit_node_ids: List[str]
    
    # Capability bindings
    capability_bindings: Dict[str, str]  # capability_name → lease_id
    
    # Execution constraints
    max_parallel_tasks: int
    total_timeout_seconds: int
    
    # Rollback
    rollback_graph_id: Optional[str]
    
    # Metadata
    metadata: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert graph to dictionary."""
        return {
            "graph_id": self.graph_id,
            "graph_version": self.graph_version,
            "compiled_at": self.compiled_at,
            "source_ir_id": self.source_ir_id,
            "nodes": [
                {
                    "node_id": n.node_id,
                    "node_type": n.node_type.value,
                    "skill_id": n.skill_id,
                    "inputs": n.inputs,
                    "outputs": n.outputs,
                    "capabilities_required": n.capabilities_required,
                    "dependencies": n.dependencies,
                    "timeout_seconds": n.timeout_seconds,
                    "retry_policy": n.retry_policy,
                    "rollback_node_id": n.rollback_node_id,
                    "metadata": n.metadata
                }
                for n in self.nodes
            ],
            "entry_node_id": self.entry_node_id,
            "exit_node_ids": self.exit_node_ids,
            "capability_bindings": self.capability_bindings,
            "max_parallel_tasks": self.max_parallel_tasks,
            "total_timeout_seconds": self.total_timeout_seconds,
            "rollback_graph_id": self.rollback_graph_id,
            "metadata": self.metadata
        }


class MissionCompiler:
    """
    Compiles Planning IR into Execution Graph.
    
    Responsibilities:
    - Convert subgoals to execution nodes
    - Bind capabilities to leases
    - Optimize execution order
    - Generate rollback graph
    - Validate graph structure
    """
    
    def __init__(self, capability_broker):
        self.capability_broker = capability_broker
        self._skill_registry = {}  # skill_id → skill definition
    
    def register_skill(self, skill_id: str, skill_definition: Dict[str, Any]) -> None:
        """Register a skill for compilation."""
        self._skill_registry[skill_id] = skill_definition
    
    def compile(self, ir: PlanningIR) -> ExecutionGraph:
        """
        Compile Planning IR into Execution Graph.
        
        Args:
            ir: Planning Intermediate Representation
        
        Returns:
            ExecutionGraph
        """
        # Create execution nodes from subgoals
        nodes = self._create_nodes_from_subgoals(ir)
        
        # Create dependency graph
        self._create_dependencies(nodes, ir.dependencies)
        
        # Bind capabilities
        capability_bindings = self._bind_capabilities(ir.capability_requests)
        
        # Optimize graph
        self._optimize_graph(nodes)
        
        # Create rollback graph
        rollback_graph_id = self._create_rollback_graph(nodes)
        
        # Determine entry and exit nodes
        entry_node_id = self._find_entry_node(nodes)
        exit_node_ids = self._find_exit_nodes(nodes)
        
        return ExecutionGraph(
            graph_id=str(uuid.uuid4()),
            graph_version="1.0",
            compiled_at=datetime.now(timezone.utc).isoformat(),
            source_ir_id=ir.ir_id,
            nodes=nodes,
            entry_node_id=entry_node_id,
            exit_node_ids=exit_node_ids,
            capability_bindings=capability_bindings,
            max_parallel_tasks=self._calculate_max_parallelism(nodes),
            total_timeout_seconds=ir.estimated_total_time_seconds * 2,
            rollback_graph_id=rollback_graph_id,
            metadata={
                "objective": ir.objective,
                "safety_classification": ir.safety_classification.value,
                "determinism": ir.determinism.value
            }
        )
    
    def _create_nodes_from_subgoals(self, ir: PlanningIR) -> List[ExecutionNode]:
        """Create execution nodes from subgoals."""
        nodes = []
        
        for subgoal in ir.subgoals:
            # Map subgoal to skill
            skill_id = self._map_subgoal_to_skill(subgoal)
            
            # Create node
            node = ExecutionNode(
                node_id=subgoal.subgoal_id,
                node_type=ExecutionNodeType.TASK,
                skill_id=skill_id,
                inputs={"subgoal": subgoal.description},
                outputs={"result": None},
                capabilities_required=self._extract_capabilities(subgoal),
                dependencies=[],
                timeout_seconds=subgoal.estimated_time_seconds,
                retry_policy={"max_retries": 3, "backoff": "exponential"},
                rollback_node_id=None,
                metadata={
                    "subgoal_id": subgoal.subgoal_id,
                    "confidence": subgoal.confidence,
                    "estimated_tokens": subgoal.estimated_cost_tokens
                }
            )
            
            nodes.append(node)
        
        return nodes
    
    def _map_subgoal_to_skill(self, subgoal: Subgoal) -> str:
        """Map subgoal to skill ID."""
        # Simple mapping based on subgoal description
        # In production, this would use semantic matching
        description = subgoal.description.lower()
        
        if "read" in description or "load" in description:
            return "filesystem.read"
        elif "write" in description or "save" in description:
            return "filesystem.write"
        elif "http" in description or "fetch" in description or "download" in description:
            return "http.get"
        elif "git" in description or "clone" in description:
            return "git.read"
        elif "analyze" in description or "process" in description:
            return "analysis.process"
        elif "test" in description or "verify" in description:
            return "testing.run"
        else:
            return "generic.task"
    
    def _extract_capabilities(self, subgoal: Subgoal) -> List[str]:
        """Extract capabilities required by subgoal."""
        # In production, this would be derived from skill definition
        description = subgoal.description.lower()
        
        capabilities = []
        if "read" in description or "load" in description:
            capabilities.append("filesystem.read")
        if "write" in description or "save" in description:
            capabilities.append("filesystem.write")
        if "http" in description or "fetch" in description:
            capabilities.append("http.get")
        if "git" in description:
            capabilities.append("git.read")
        
        return capabilities
    
    def _create_dependencies(
        self,
        nodes: List[ExecutionNode],
        ir_dependencies: List
    ) -> None:
        """Create dependency graph."""
        # Map subgoal IDs to node IDs
        node_map = {node.node_id: node for node in nodes}
        
        for dep in ir_dependencies:
            # Find nodes that depend on this
            for node in nodes:
                if node.node_id == dep.dependency_id:
                    # Add dependencies
                    node.dependencies = dep.alternative_ids or []
    
    def _bind_capabilities(
        self,
        capability_requests: List[CapabilityRequest]
    ) -> Dict[str, str]:
        """Bind capabilities to leases."""
        bindings = {}
        
        for request in capability_requests:
            # Request capability from broker
            # In production, this would be async
            # For now, create placeholder binding
            bindings[request.capability_name] = f"lease_{request.capability_name}"
        
        return bindings
    
    def _optimize_graph(self, nodes: List[ExecutionNode]) -> None:
        """Optimize execution graph."""
        # Identify parallelizable nodes
        # Identify critical path
        # Merge sequential operations
        # This is a placeholder for optimization logic
        pass
    
    def _create_rollback_graph(self, nodes: List[ExecutionNode]) -> str:
        """Create rollback graph ID."""
        # In production, this would create inverse graph
        # For now, return placeholder
        return f"rollback_{uuid.uuid4()}"
    
    def _find_entry_node(self, nodes: List[ExecutionNode]) -> str:
        """Find entry node (no dependencies)."""
        for node in nodes:
            if not node.dependencies:
                return node.node_id
        return nodes[0].node_id if nodes else ""
    
    def _find_exit_nodes(self, nodes: List[ExecutionNode]) -> List[str]:
        """Find exit nodes (nothing depends on them)."""
        all_deps = set()
        for node in nodes:
            all_deps.update(node.dependencies)
        
        exit_nodes = []
        for node in nodes:
            if node.node_id not in all_deps:
                exit_nodes.append(node.node_id)
        
        return exit_nodes if exit_nodes else [nodes[-1].node_id] if nodes else []
    
    def _calculate_max_parallelism(self, nodes: List[ExecutionNode]) -> int:
        """Calculate maximum parallelism."""
        # Simple heuristic: count of independent nodes
        # In production, this would analyze the DAG
        return min(len(nodes), 4)  # Cap at 4 for safety


class GraphValidator:
    """
    Validates execution graphs.
    
    Ensures graphs are well-formed and executable.
    """
    
    def validate(self, graph: ExecutionGraph) -> tuple[bool, List[str]]:
        """
        Validate execution graph.
        
        Args:
            graph: Execution graph to validate
        
        Returns:
            (is_valid, errors)
        """
        errors = []
        
        # Check entry node exists
        if not graph.entry_node_id:
            errors.append("No entry node defined")
        
        # Check exit nodes exist
        if not graph.exit_node_ids:
            errors.append("No exit nodes defined")
        
        # Check all nodes have valid IDs
        node_ids = {node.node_id for node in graph.nodes}
        for node in graph.nodes:
            for dep_id in node.dependencies:
                if dep_id not in node_ids:
                    errors.append(f"Node {node.node_id} depends on non-existent node {dep_id}")
        
        # Check for cycles
        if self._has_cycle(graph):
            errors.append("Graph contains cycles")
        
        # Check capability bindings
        for node in graph.nodes:
            for cap in node.capabilities_required:
                if cap not in graph.capability_bindings:
                    errors.append(f"Node {node.node_id} requires unbound capability {cap}")
        
        return (len(errors) == 0, errors)
    
    def _has_cycle(self, graph: ExecutionGraph) -> bool:
        """Check if graph has cycles using DFS."""
        visited = set()
        recursion_stack = set()
        
        def visit(node_id: str) -> bool:
            visited.add(node_id)
            recursion_stack.add(node_id)
            
            # Find node
            node = next((n for n in graph.nodes if n.node_id == node_id), None)
            if not node:
                return False
            
            for dep_id in node.dependencies:
                if dep_id not in visited:
                    if visit(dep_id):
                        return True
                elif dep_id in recursion_stack:
                    return True
            
            recursion_stack.remove(node_id)
            return False
        
        for node in graph.nodes:
            if node.node_id not in visited:
                if visit(node.node_id):
                    return True
        
        return False
