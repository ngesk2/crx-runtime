"""
Workflow Compiler - DAG-based execution.

Planner builds DAG → Workflow Compiler → Executable Workflow → Oracle validates → Runtime executes
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Set
from datetime import datetime, timezone
from enum import Enum
import json
import uuid
from collections import defaultdict, deque

from runtime.planning.mission_compiler import ExecutionGraph, ExecutionNode, ExecutionNodeType


class WorkflowStatus(Enum):
    """Status of a workflow."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PAUSED = "paused"


class NodeStatus(Enum):
    """Status of a workflow node."""
    PENDING = "pending"
    READY = "ready"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class WorkflowNode:
    """A node in the executable workflow."""
    node_id: str
    node_type: ExecutionNodeType
    skill_id: str
    inputs: Dict[str, Any]
    outputs: Dict[str, Any]
    capabilities_required: List[str]
    dependencies: List[str]
    dependents: List[str]  # Nodes that depend on this one
    status: NodeStatus
    started_at: Optional[str]
    completed_at: Optional[str]
    error_message: Optional[str]
    retry_count: int
    timeout_seconds: int
    retry_policy: Dict[str, Any]
    
    def is_ready(self) -> bool:
        """Check if node is ready to execute (all dependencies completed)."""
        return self.status == NodeStatus.READY
    
    def is_terminal(self) -> bool:
        """Check if node is in terminal state."""
        return self.status in [NodeStatus.COMPLETED, NodeStatus.FAILED, NodeStatus.SKIPPED]


@dataclass
class ExecutableWorkflow:
    """
    Executable workflow compiled from Execution Graph.
    
    DAG-based execution with dependency tracking.
    """
    
    workflow_id: str
    workflow_name: str
    source_graph_id: str
    status: WorkflowStatus
    nodes: Dict[str, WorkflowNode]  # node_id → WorkflowNode
    entry_node_ids: List[str]
    exit_node_ids: List[str]
    created_at: str
    started_at: Optional[str]
    completed_at: Optional[str]
    metadata: Dict[str, Any]
    
    def get_ready_nodes(self) -> List[str]:
        """Get nodes ready to execute."""
        ready = []
        for node_id, node in self.nodes.items():
            if node.status == NodeStatus.READY:
                ready.append(node_id)
        return ready
    
    def get_terminal_nodes(self) -> List[str]:
        """Get nodes in terminal state."""
        terminal = []
        for node_id, node in self.nodes.items():
            if node.is_terminal():
                terminal.append(node_id)
        return terminal
    
    def is_complete(self) -> bool:
        """Check if workflow is complete."""
        if not self.exit_node_ids:
            return False
        return all(
            self.nodes[nid].status == NodeStatus.COMPLETED
            for nid in self.exit_node_ids
        )
    
    def is_failed(self) -> bool:
        """Check if workflow has failed."""
        return any(
            node.status == NodeStatus.FAILED
            for node in self.nodes.values()
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "workflow_id": self.workflow_id,
            "workflow_name": self.workflow_name,
            "source_graph_id": self.source_graph_id,
            "status": self.status.value,
            "nodes": {
                nid: {
                    "node_id": node.node_id,
                    "node_type": node.node_type.value,
                    "skill_id": node.skill_id,
                    "inputs": node.inputs,
                    "outputs": node.outputs,
                    "capabilities_required": node.capabilities_required,
                    "dependencies": node.dependencies,
                    "dependents": node.dependents,
                    "status": node.status.value,
                    "started_at": node.started_at,
                    "completed_at": node.completed_at,
                    "error_message": node.error_message,
                    "retry_count": node.retry_count,
                    "timeout_seconds": node.timeout_seconds,
                    "retry_policy": node.retry_policy
                }
                for nid, node in self.nodes.items()
            },
            "entry_node_ids": self.entry_node_ids,
            "exit_node_ids": self.exit_node_ids,
            "created_at": self.created_at,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "metadata": self.metadata
        }


class WorkflowCompiler:
    """
    Compiles Execution Graph into Executable Workflow.
    
    Responsibilities:
    - Build dependency graph
    - Calculate critical path
    - Optimize parallel execution
    - Validate workflow structure
    - Generate execution plan
    """
    
    def compile(self, graph: ExecutionGraph, workflow_name: str = "") -> ExecutableWorkflow:
        """
        Compile Execution Graph into Executable Workflow.
        
        Args:
            graph: Execution graph to compile
            workflow_name: Name for the workflow
        
        Returns:
            ExecutableWorkflow
        """
        # Build workflow nodes
        nodes = {}
        for graph_node in graph.nodes:
            workflow_node = WorkflowNode(
                node_id=graph_node.node_id,
                node_type=graph_node.node_type,
                skill_id=graph_node.skill_id,
                inputs=graph_node.inputs,
                outputs=graph_node.outputs,
                capabilities_required=graph_node.capabilities_required,
                dependencies=graph_node.dependencies,
                dependents=[],  # Will be populated
                status=NodeStatus.PENDING,
                started_at=None,
                completed_at=None,
                error_message=None,
                retry_count=0,
                timeout_seconds=graph_node.timeout_seconds,
                retry_policy=graph_node.retry_policy
            )
            nodes[graph_node.node_id] = workflow_node
        
        # Build dependents (reverse dependencies)
        for node_id, node in nodes.items():
            for dep_id in node.dependencies:
                if dep_id in nodes:
                    nodes[dep_id].dependents.append(node_id)
        
        # Mark entry nodes as ready
        for node in nodes.values():
            if not node.dependencies:
                node.status = NodeStatus.READY
        
        workflow = ExecutableWorkflow(
            workflow_id=str(uuid.uuid4()),
            workflow_name=workflow_name or f"workflow_{graph.graph_id[:8]}",
            source_graph_id=graph.graph_id,
            status=WorkflowStatus.PENDING,
            nodes=nodes,
            entry_node_ids=graph.entry_node_id if isinstance(graph.entry_node_id, list) else [graph.entry_node_id],
            exit_node_ids=graph.exit_node_ids,
            created_at=datetime.now(timezone.utc).isoformat(),
            started_at=None,
            completed_at=None,
            metadata=graph.metadata
        )
        
        return workflow
    
    def validate_workflow(self, workflow: ExecutableWorkflow) -> tuple[bool, List[str]]:
        """
        Validate workflow structure.
        
        Args:
            workflow: Workflow to validate
        
        Returns:
            (is_valid, errors)
        """
        errors = []
        
        # Check for cycles
        if self._has_cycle(workflow):
            errors.append("Workflow contains cycles")
        
        # Check all nodes have valid dependencies
        for node_id, node in workflow.nodes.items():
            for dep_id in node.dependencies:
                if dep_id not in workflow.nodes:
                    errors.append(f"Node {node_id} depends on non-existent node {dep_id}")
        
        # Check entry nodes exist
        if not workflow.entry_node_ids:
            errors.append("No entry nodes defined")
        
        # Check exit nodes exist
        if not workflow.exit_node_ids:
            errors.append("No exit nodes defined")
        
        # Check all entry nodes are ready
        for entry_id in workflow.entry_node_ids:
            if entry_id in workflow.nodes:
                if workflow.nodes[entry_id].status != NodeStatus.READY:
                    errors.append(f"Entry node {entry_id} is not ready")
        
        return (len(errors) == 0, errors)
    
    def _has_cycle(self, workflow: ExecutableWorkflow) -> bool:
        """Check if workflow has cycles using DFS."""
        visited = set()
        recursion_stack = set()
        
        def visit(node_id: str) -> bool:
            visited.add(node_id)
            recursion_stack.add(node_id)
            
            node = workflow.nodes.get(node_id)
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
        
        for node_id in workflow.nodes:
            if node_id not in visited:
                if visit(node_id):
                    return True
        
        return False
    
    def calculate_critical_path(self, workflow: ExecutableWorkflow) -> List[str]:
        """
        Calculate critical path through workflow.
        
        Args:
            workflow: Workflow to analyze
        
        Returns:
            List of node IDs on critical path
        """
        # Calculate longest path from entry to exit
        # This is a simplified implementation
        critical_path = []
        
        # Topological sort
        sorted_nodes = self._topological_sort(workflow)
        
        # Calculate earliest start times
        earliest_start = {nid: 0 for nid in workflow.nodes}
        for node_id in sorted_nodes:
            node = workflow.nodes[node_id]
            max_dep_time = 0
            for dep_id in node.dependencies:
                dep_node = workflow.nodes[dep_id]
                dep_time = earliest_start[dep_id] + dep_node.timeout_seconds
                max_dep_time = max(max_dep_time, dep_time)
            earliest_start[node_id] = max_dep_time
        
        # Calculate latest start times (backward pass)
        latest_start = {nid: float('inf') for nid in workflow.nodes}
        for node_id in reversed(sorted_nodes):
            node = workflow.nodes[node_id]
            if not node.dependents:
                latest_start[node_id] = earliest_start[node_id]
            else:
                min_dep_time = float('inf')
                for dep_id in node.dependents:
                    dep_time = latest_start[dep_id] - node.timeout_seconds
                    min_dep_time = min(min_dep_time, dep_time)
                latest_start[node_id] = min_dep_time
        
        # Nodes with zero slack are on critical path
        for node_id in workflow.nodes:
            if latest_start[node_id] - earliest_start[node_id] == 0:
                critical_path.append(node_id)
        
        return critical_path
    
    def _topological_sort(self, workflow: ExecutableWorkflow) -> List[str]:
        """Topological sort of workflow nodes."""
        in_degree = {nid: len(node.dependencies) for nid, node in workflow.nodes.items()}
        queue = deque([nid for nid, degree in in_degree.items() if degree == 0])
        result = []
        
        while queue:
            node_id = queue.popleft()
            result.append(node_id)
            
            for dep_id in workflow.nodes[node_id].dependents:
                in_degree[dep_id] -= 1
                if in_degree[dep_id] == 0:
                    queue.append(dep_id)
        
        return result
    
    def estimate_execution_time(self, workflow: ExecutableWorkflow) -> int:
        """
        Estimate total execution time.
        
        Args:
            workflow: Workflow to analyze
        
        Returns:
            Estimated time in seconds
        """
        critical_path = self.calculate_critical_path(workflow)
        total_time = 0
        
        for node_id in critical_path:
            node = workflow.nodes[node_id]
            total_time += node.timeout_seconds
        
        return total_time
    
    def optimize_parallelism(self, workflow: ExecutableWorkflow, max_parallel: int = 4) -> None:
        """
        Optimize workflow for parallel execution.
        
        Args:
            workflow: Workflow to optimize
            max_parallel: Maximum parallel tasks
        """
        # Group nodes by level (distance from entry)
        levels = defaultdict(list)
        self._assign_levels(workflow, levels)
        
        # Limit parallelism per level
        for level, node_ids in levels.items():
            if len(node_ids) > max_parallel:
                # Prioritize by critical path
                critical_path = set(self.calculate_critical_path(workflow))
                prioritized = sorted(
                    node_ids,
                    key=lambda nid: nid in critical_path,
                    reverse=True
                )
                # Mark non-prioritized as dependent on prioritized
                for nid in prioritized[max_parallel:]:
                    workflow.nodes[nid].dependencies.append(prioritized[0])


class WorkflowExecutor:
    """
    Executes compiled workflows.
    
    Manages DAG execution, dependency tracking, and error handling.
    """
    
    def __init__(self, skill_registry, capability_broker):
        self.skill_registry = skill_registry
        self.capability_broker = capability_broker
    
    async def execute(self, workflow: ExecutableWorkflow) -> Dict[str, Any]:
        """
        Execute workflow.
        
        Args:
            workflow: Workflow to execute
        
        Returns:
            Execution result
        """
        workflow.status = WorkflowStatus.RUNNING
        workflow.started_at = datetime.now(timezone.utc).isoformat()
        
        while not workflow.is_complete() and not workflow.is_failed():
            # Get ready nodes
            ready_nodes = workflow.get_ready_nodes()
            
            if not ready_nodes:
                # Deadlock or waiting
                if workflow.get_terminal_nodes():
                    # Some nodes completed but workflow not done
                    # Check if remaining nodes are blocked
                    break
                else:
                    # No progress
                    break
            
            # Execute ready nodes (up to parallel limit)
            for node_id in ready_nodes[:4]:  # Max 4 parallel
                await self._execute_node(workflow, node_id)
        
        if workflow.is_complete():
            workflow.status = WorkflowStatus.COMPLETED
            workflow.completed_at = datetime.now(timezone.utc).isoformat()
        elif workflow.is_failed():
            workflow.status = WorkflowStatus.FAILED
            workflow.completed_at = datetime.now(timezone.utc).isoformat()
        
        return {
            "workflow_id": workflow.workflow_id,
            "status": workflow.status.value,
            "completed_nodes": len([n for n in workflow.nodes.values() if n.status == NodeStatus.COMPLETED]),
            "failed_nodes": len([n for n in workflow.nodes.values() if n.status == NodeStatus.FAILED]),
            "total_nodes": len(workflow.nodes)
        }
    
    async def _execute_node(self, workflow: ExecutableWorkflow, node_id: str) -> None:
        """Execute a single workflow node."""
        node = workflow.nodes[node_id]
        node.status = NodeStatus.RUNNING
        node.started_at = datetime.now(timezone.utc).isoformat()
        
        try:
            # Get skill definition
            skill = self.skill_registry.get(node.skill_id)
            if not skill:
                raise ValueError(f"Skill {node.skill_id} not found")
            
            # Request capabilities
            for capability in node.capabilities_required:
                # In production, this would use the capability broker
                pass
            
            # Execute skill (placeholder)
            # In production, this would call the actual skill implementation
            await asyncio.sleep(0.1)  # Simulate execution
            
            node.status = NodeStatus.COMPLETED
            node.completed_at = datetime.now(timezone.utc).isoformat()
            
            # Update dependent nodes
            for dep_id in node.dependents:
                dep_node = workflow.nodes[dep_id]
                # Check if all dependencies are complete
                if all(
                    workflow.nodes[did].status == NodeStatus.COMPLETED
                    for did in dep_node.dependencies
                ):
                    dep_node.status = NodeStatus.READY
                    
        except Exception as e:
            node.status = NodeStatus.FAILED
            node.completed_at = datetime.now(timezone.utc).isoformat()
            node.error_message = str(e)
            
            # Handle retry
            max_retries = node.retry_policy.get("max_retries", 3)
            if node.retry_count < max_retries:
                node.retry_count += 1
                node.status = NodeStatus.READY  # Retry
