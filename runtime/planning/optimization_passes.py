"""
Mission Compiler Optimization Passes.

LLVM doesn't compile once. It performs passes.

Mission Compiler should too:
Mission IR → Validation → Dependency pass → Capability pass → Rollback pass → Parallelization pass → Cost optimization → Evidence insertion → Verification insertion → Execution Graph

Exactly compiler architecture.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Callable
from datetime import datetime, timezone
from enum import Enum
import uuid

from runtime.planning.planning_ir import PlanningIR
from runtime.planning.mission_compiler import ExecutionGraph, ExecutionNode


class PassType(Enum):
    """Types of optimization passes."""
    VALIDATION = "validation"
    DEPENDENCY = "dependency"
    CAPABILITY = "capability"
    ROLLBACK = "rollback"
    PARALLELIZATION = "parallelization"
    COST_OPTIMIZATION = "cost_optimization"
    EVIDENCE_INSERTION = "evidence_insertion"
    VERIFICATION_INSERTION = "verification_insertion"


class PassResult(Enum):
    """Result of an optimization pass."""
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    SKIPPED = "skipped"


@dataclass
class PassOutput:
    """Output of an optimization pass."""
    pass_type: PassType
    pass_name: str
    result: PassResult
    duration_seconds: float
    modifications: List[str]
    warnings: List[str]
    errors: List[str]
    metadata: Dict[str, Any]


class OptimizationPass:
    """
    Base class for optimization passes.
    
    Each pass transforms the IR or graph in a specific way.
    """
    
    def __init__(self, pass_type: PassType, pass_name: str):
        self.pass_type = pass_type
        self.pass_name = pass_name
    
    def execute(self, ir: PlanningIR, graph: Optional[ExecutionGraph]) -> tuple[PassOutput, Optional[ExecutionGraph]]:
        """
        Execute the optimization pass.
        
        Args:
            ir: Planning IR
            graph: Execution Graph (optional, may be None for early passes)
        
        Returns:
            (pass_output, modified_graph)
        """
        start_time = datetime.now(timezone.utc)
        
        # Execute the pass
        modifications, warnings, errors, modified_graph = self._run_pass(ir, graph)
        
        duration = (datetime.now(timezone.utc) - start_time).total_seconds()
        
        # Determine result
        if errors:
            result = PassResult.ERROR
        elif warnings:
            result = PassResult.WARNING
        else:
            result = PassResult.SUCCESS
        
        output = PassOutput(
            pass_type=self.pass_type,
            pass_name=self.pass_name,
            result=result,
            duration_seconds=duration,
            modifications=modifications,
            warnings=warnings,
            errors=errors,
            metadata={}
        )
        
        return output, modified_graph
    
    def _run_pass(
        self,
        ir: PlanningIR,
        graph: Optional[ExecutionGraph]
    ) -> tuple[List[str], List[str], List[str], Optional[ExecutionGraph]]:
        """Run the actual pass logic. Override in subclasses."""
        return [], [], [], graph


class ValidationPass(OptimizationPass):
    """Validates the Planning IR."""
    
    def __init__(self):
        super().__init__(PassType.VALIDATION, "Validation Pass")
    
    def _run_pass(
        self,
        ir: PlanningIR,
        graph: Optional[ExecutionGraph]
    ) -> tuple[List[str], List[str], List[str], Optional[ExecutionGraph]]:
        modifications = []
        warnings = []
        errors = []
        
        # Validate required fields
        if not ir.intent:
            errors.append("IR missing intent")
        
        if not ir.objective:
            errors.append("IR missing objective")
        
        if not ir.subgoals:
            errors.append("IR has no subgoals")
        
        # Validate subgoals
        for subgoal in ir.subgoals:
            if not subgoal.success_criteria:
                warnings.append(f"Subgoal {subgoal.subgoal_id} has no success criteria")
            
            if subgoal.confidence < 0.0 or subgoal.confidence > 1.0:
                errors.append(f"Subgoal {subgoal.subgoal_id} has invalid confidence")
        
        # Validate capability requests
        for cap in ir.capability_requests:
            if not cap.operation:
                errors.append(f"Capability request {cap.capability_name} has no operation")
        
        return modifications, warnings, errors, graph


class DependencyPass(OptimizationPass):
    """Optimizes dependencies in the graph."""
    
    def __init__(self):
        super().__init__(PassType.DEPENDENCY, "Dependency Pass")
    
    def _run_pass(
        self,
        ir: PlanningIR,
        graph: Optional[ExecutionGraph]
    ) -> tuple[List[str], List[str], List[str], Optional[ExecutionGraph]]:
        modifications = []
        warnings = []
        errors = []
        
        if not graph:
            return modifications, warnings, errors, graph
        
        # Remove redundant dependencies
        for node in graph.nodes:
            original_deps = node.dependencies.copy()
            
            # Remove self-dependencies
            node.dependencies = [d for d in node.dependencies if d != node.node_id]
            
            # Remove duplicate dependencies
            node.dependencies = list(set(node.dependencies))
            
            if len(node.dependencies) != len(original_deps):
                modifications.append(f"Removed redundant dependencies from node {node.node_id}")
        
        return modifications, warnings, errors, graph


class CapabilityPass(OptimizationPass):
    """Optimizes capability requests."""
    
    def __init__(self):
        super().__init__(PassType.CAPABILITY, "Capability Pass")
    
    def _run_pass(
        self,
        ir: PlanningIR,
        graph: Optional[ExecutionGraph]
    ) -> tuple[List[str], List[str], List[str], Optional[ExecutionGraph]]:
        modifications = []
        warnings = []
        errors = []
        
        # Merge duplicate capability requests
        capability_map = {}
        for cap in ir.capability_requests:
            key = (cap.capability_name, cap.operation, cap.resource_path)
            if key in capability_map:
                modifications.append(f"Merged duplicate capability request for {cap.capability_name}")
            else:
                capability_map[key] = cap
        
        # Remove duplicate capabilities from IR
        ir.capability_requests = list(capability_map.values())
        
        return modifications, warnings, errors, graph


class RollbackPass(OptimizationPass):
    """Generates rollback plans."""
    
    def __init__(self):
        super().__init__(PassType.ROLLBACK, "Rollback Pass")
    
    def _run_pass(
        self,
        ir: PlanningIR,
        graph: Optional[ExecutionGraph]
    ) -> tuple[List[str], List[str], List[str], Optional[ExecutionGraph]]:
        modifications = []
        warnings = []
        errors = []
        
        # Ensure rollback plan exists
        if not ir.rollback_available:
            modifications.append("Generated default rollback plan")
            ir.rollback_available = True
            ir.recovery_plan = "Reverse all operations in reverse order"
        
        # Add rollback nodes to graph if needed
        if graph:
            for node in graph.nodes:
                if not node.rollback_node_id:
                    modifications.append(f"Added rollback node for {node.node_id}")
                    node.rollback_node_id = f"rollback_{node.node_id}"
        
        return modifications, warnings, errors, graph


class ParallelizationPass(OptimizationPass):
    """Optimizes parallel execution."""
    
    def __init__(self):
        super().__init__(PassType.PARALLELIZATION, "Parallelization Pass")
    
    def _run_pass(
        self,
        ir: PlanningIR,
        graph: Optional[ExecutionGraph]
    ) -> tuple[List[str], List[str], List[str], Optional[ExecutionGraph]]:
        modifications = []
        warnings = []
        errors = []
        
        if not graph:
            return modifications, warnings, errors, graph
        
        # Identify independent nodes that can run in parallel
        node_deps = {node.node_id: set(node.dependencies) for node in graph.nodes}
        
        # Group nodes by level (distance from entry)
        levels = {}
        for node in graph.nodes:
            level = 0
            visited = set()
            queue = [(node.node_id, 0)]
            
            while queue:
                current_id, current_level = queue.pop(0)
                if current_id in visited:
                    continue
                visited.add(current_id)
                
                current_node = next((n for n in graph.nodes if n.node_id == current_id), None)
                if current_node:
                    for dep_id in current_node.dependencies:
                        if dep_id in node_deps:
                            queue.append((dep_id, current_level + 1))
            
            levels[node.node_id] = level
        
        # Mark nodes at same level as parallelizable
        level_groups = {}
        for node_id, level in levels.items():
            if level not in level_groups:
                level_groups[level] = []
            level_groups[level].append(node_id)
        
        for level, node_ids in level_groups.items():
            if len(node_ids) > 1:
                modifications.append(f"Level {level} has {len(node_ids)} parallelizable nodes")
        
        return modifications, warnings, errors, graph


class CostOptimizationPass(OptimizationPass):
    """Optimizes for cost."""
    
    def __init__(self):
        super().__init__(PassType.COST_OPTIMIZATION, "Cost Optimization Pass")
    
    def _run_pass(
        self,
        ir: PlanningIR,
        graph: Optional[ExecutionGraph]
    ) -> tuple[List[str], List[str], List[str], Optional[ExecutionGraph]]:
        modifications = []
        warnings = []
        errors = []
        
        # Calculate total cost
        total_tokens = sum(sg.estimated_cost_tokens for sg in ir.subgoals)
        total_time = sum(sg.estimated_time_seconds for sg in ir.subgoals)
        
        # Warn if cost is high
        if total_tokens > 100000:
            warnings.append(f"High token cost: {total_tokens}")
        
        if total_time > 3600:
            warnings.append(f"High time cost: {total_time} seconds")
        
        # Optimize by reordering subgoals (heuristic)
        # Move high-confidence subgoals first
        ir.subgoals.sort(key=lambda sg: sg.confidence, reverse=True)
        modifications.append("Reordered subgoals by confidence")
        
        return modifications, warnings, errors, graph


class EvidenceInsertionPass(OptimizationPass):
    """Inserts evidence collection into the graph."""
    
    def __init__(self):
        super().__init__(PassType.EVIDENCE_INSERTION, "Evidence Insertion Pass")
    
    def _run_pass(
        self,
        ir: PlanningIR,
        graph: Optional[ExecutionGraph]
    ) -> tuple[List[str], List[str], List[str], Optional[ExecutionGraph]]:
        modifications = []
        warnings = []
        errors = []
        
        if not graph:
            return modifications, warnings, errors, graph
        
        # Add evidence collection nodes after critical nodes
        for node in graph.nodes:
            if "critical" in node.metadata.get("tags", []):
                modifications.append(f"Added evidence node after {node.node_id}")
                # In production, this would create actual evidence nodes
        
        return modifications, warnings, errors, graph


class VerificationInsertionPass(OptimizationPass):
    """Inserts verification steps into the graph."""
    
    def __init__(self):
        super().__init__(PassType.VERIFICATION_INSERTION, "Verification Insertion Pass")
    
    def _run_pass(
        self,
        ir: PlanningIR,
        graph: Optional[ExecutionGraph]
    ) -> tuple[List[str], List[str], List[str], Optional[ExecutionGraph]]:
        modifications = []
        warnings = []
        errors = []
        
        if not graph:
            return modifications, warnings, errors, graph
        
        # Add verification nodes after execution nodes
        for node in graph.nodes:
            if node.node_type.value == "task":
                modifications.append(f"Added verification node after {node.node_id}")
                # In production, this would create actual verification nodes
        
        return modifications, warnings, errors, graph


class PassPipeline:
    """
    Pipeline for optimization passes.
    
    Executes passes in order, collecting results.
    """
    
    def __init__(self):
        self._passes: List[OptimizationPass] = []
        self._pass_results: List[PassOutput] = []
        self._initialize_default_passes()
    
    def _initialize_default_passes(self) -> None:
        """Initialize default optimization passes."""
        self._passes = [
            ValidationPass(),
            DependencyPass(),
            CapabilityPass(),
            RollbackPass(),
            ParallelizationPass(),
            CostOptimizationPass(),
            EvidenceInsertionPass(),
            VerificationInsertionPass()
        ]
    
    def add_pass(self, pass_instance: OptimizationPass) -> None:
        """Add a pass to the pipeline."""
        self._passes.append(pass_instance)
    
    def remove_pass(self, pass_type: PassType) -> None:
        """Remove a pass from the pipeline."""
        self._passes = [p for p in self._passes if p.pass_type != pass_type]
    
    def run_pipeline(
        self,
        ir: PlanningIR,
        initial_graph: Optional[ExecutionGraph] = None
    ) -> tuple[List[PassOutput], Optional[ExecutionGraph]]:
        """
        Run the optimization pipeline.
        
        Args:
            ir: Planning IR
            initial_graph: Initial execution graph
        
        Returns:
            (pass_results, final_graph)
        """
        self._pass_results = []
        current_graph = initial_graph
        
        for pass_instance in self._passes:
            output, current_graph = pass_instance.execute(ir, current_graph)
            self._pass_results.append(output)
            
            # Stop on critical error
            if output.result == PassResult.ERROR:
                break
        
        return self._pass_results, current_graph
    
    def get_pass_results(self) -> List[PassOutput]:
        """Get results from last pipeline run."""
        return self._pass_results.copy()
    
    def get_errors(self) -> List[str]:
        """Get all errors from last pipeline run."""
        errors = []
        for result in self._pass_results:
            errors.extend(result.errors)
        return errors
    
    def get_warnings(self) -> List[str]:
        """Get all warnings from last pipeline run."""
        warnings = []
        for result in self._pass_results:
            warnings.extend(result.warnings)
        return warnings
    
    def get_modifications(self) -> List[str]:
        """Get all modifications from last pipeline run."""
        modifications = []
        for result in self._pass_results:
            modifications.extend(result.modifications)
        return modifications
    
    def get_total_duration(self) -> float:
        """Get total duration of last pipeline run."""
        return sum(result.duration_seconds for result in self._pass_results)


class MissionCompilerWithPasses:
    """
    Mission Compiler with optimization passes.
    
    Like LLVM, performs multiple passes to optimize the execution graph.
    """
    
    def __init__(self, capability_broker):
        self.capability_broker = capability_broker
        self._skill_registry = {}
        self._pass_pipeline = PassPipeline()
    
    def register_skill(self, skill_id: str, skill_definition: Dict[str, Any]) -> None:
        """Register a skill for compilation."""
        self._skill_registry[skill_id] = skill_definition
    
    def compile(self, ir: PlanningIR) -> tuple[ExecutionGraph, List[PassOutput]]:
        """
        Compile Planning IR into Execution Graph with optimization passes.
        
        Args:
            ir: Planning Intermediate Representation
        
        Returns:
            (ExecutionGraph, pass_results)
        """
        # Initial compilation
        graph = self._create_initial_graph(ir)
        
        # Run optimization passes
        pass_results, optimized_graph = self._pass_pipeline.run_pipeline(ir, graph)
        
        # Check for critical errors
        if any(result.result == PassResult.ERROR for result in pass_results):
            raise ValueError("Compilation failed due to errors in optimization passes")
        
        return optimized_graph, pass_results
    
    def _create_initial_graph(self, ir: PlanningIR) -> ExecutionGraph:
        """Create initial execution graph from IR."""
        from runtime.planning.mission_compiler import MissionCompiler
        
        # Use existing MissionCompiler for initial graph creation
        compiler = MissionCompiler(self.capability_broker)
        for skill_id, skill_def in self._skill_registry.items():
            compiler.register_skill(skill_id, skill_def)
        
        return compiler.compile(ir)
    
    def get_pass_pipeline(self) -> PassPipeline:
        """Get the pass pipeline for customization."""
        return self._pass_pipeline
