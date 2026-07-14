"""
High-Level Compiler Stages.

Exposes high-level compiler stages instead of dozens of implementation details.

Compiler stages:
Frontend → IR Normalization → Optimization → Scheduling → Security → Evidence → Backend

Internally, the Optimization Pipeline may still execute many passes.
The public API exposes compiler stages rather than implementation details.
Treat passes exactly like LLVM.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid

from runtime.planning.planning_ir import PlanningIR
from architecture.canonical_ir import CanonicalIR
from architecture.ir_lowering import IRLoweringPass, CIRValidator
from runtime.planning.optimization_passes import PassPipeline, PassOutput, PassResult


class CompilerStage(Enum):
    """High-level compiler stages."""
    FRONTEND = "frontend"
    IR_NORMALIZATION = "ir_normalization"
    OPTIMIZATION = "optimization"
    SCHEDULING = "scheduling"
    SECURITY = "security"
    EVIDENCE = "evidence"
    BACKEND = "backend"


@dataclass
class StageResult:
    """Result of a compiler stage."""
    stage: CompilerStage
    stage_name: str
    success: bool
    duration_seconds: float
    errors: List[str]
    warnings: List[str]
    metadata: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "stage": self.stage.value,
            "stage_name": self.stage_name,
            "success": self.success,
            "duration_seconds": self.duration_seconds,
            "errors": self.errors,
            "warnings": self.warnings,
            "metadata": self.metadata
        }


@dataclass
class CompilationResult:
    """Result of full compilation pipeline."""
    success: bool
    stages: List[StageResult]
    total_duration_seconds: float
    errors: List[str]
    warnings: List[str]
    output_ir: Optional[CanonicalIR]
    metadata: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "success": self.success,
            "stages": [stage.to_dict() for stage in self.stages],
            "total_duration_seconds": self.total_duration_seconds,
            "errors": self.errors,
            "warnings": self.warnings,
            "output_ir_id": self.output_ir.cir_id if self.output_ir else None,
            "metadata": self.metadata
        }


class CompilerStage:
    """
    Base class for compiler stages.
    
    Each stage represents a high-level phase in the compilation pipeline.
    """
    
    def __init__(self, stage: CompilerStage, stage_name: str):
        self.stage = stage
        self.stage_name = stage_name
    
    def execute(self, input_ir: Any, context: Dict[str, Any]) -> tuple[StageResult, Any]:
        """
        Execute the compiler stage.
        
        Args:
            input_ir: Input IR (PlanningIR, CanonicalIR, etc.)
            context: Compilation context
        
        Returns:
            (stage_result, output_ir)
        """
        start_time = datetime.now(timezone.utc)
        
        # Execute stage logic
        success, errors, warnings, output_ir = self._execute_stage(input_ir, context)
        
        duration = (datetime.now(timezone.utc) - start_time).total_seconds()
        
        result = StageResult(
            stage=self.stage,
            stage_name=self.stage_name,
            success=success,
            duration_seconds=duration,
            errors=errors,
            warnings=warnings,
            metadata={}
        )
        
        return result, output_ir
    
    def _execute_stage(self, input_ir: Any, context: Dict[str, Any]) -> tuple[bool, List[str], List[str], Any]:
        """Execute the actual stage logic. Override in subclasses."""
        return True, [], [], input_ir


class FrontendStage(CompilerStage):
    """
    Frontend stage - Parses and validates input.
    
    Accepts PlanningIR and validates it for compilation.
    """
    
    def __init__(self):
        super().__init__(CompilerStage.FRONTEND, "Frontend")
    
    def _execute_stage(self, input_ir: Any, context: Dict[str, Any]) -> tuple[bool, List[str], List[str], Any]:
        errors = []
        warnings = []
        
        if not isinstance(input_ir, PlanningIR):
            errors.append("Frontend expects PlanningIR as input")
            return False, errors, warnings, input_ir
        
        # Validate PlanningIR
        if not input_ir.intent:
            errors.append("PlanningIR missing intent")
        
        if not input_ir.objective:
            errors.append("PlanningIR missing objective")
        
        if not input_ir.subgoals:
            warnings.append("PlanningIR has no subgoals")
        
        return len(errors) == 0, errors, warnings, input_ir


class IRNormalizationStage(CompilerStage):
    """
    IR Normalization stage - Normalizes PlanningIR to canonical form.
    
    Ensures PlanningIR is in a consistent, normalized state before lowering.
    """
    
    def __init__(self):
        super().__init__(CompilerStage.IR_NORMALIZATION, "IR Normalization")
    
    def _execute_stage(self, input_ir: Any, context: Dict[str, Any]) -> tuple[bool, List[str], List[str], Any]:
        errors = []
        warnings = []
        
        if not isinstance(input_ir, PlanningIR):
            errors.append("IR Normalization expects PlanningIR as input")
            return False, errors, warnings, input_ir
        
        # Normalize subgoals
        for subgoal in input_ir.subgoals:
            if not subgoal.subgoal_id:
                subgoal.subgoal_id = str(uuid.uuid4())
                warnings.append(f"Generated subgoal_id for subgoal")
        
        # Normalize capability requests
        for cap in input_ir.capability_requests:
            if not cap.capability_name:
                errors.append(f"Capability request missing capability_name")
        
        return len(errors) == 0, errors, warnings, input_ir


class OptimizationStage(CompilerStage):
    """
    Optimization stage - Runs optimization passes on CIR.
    
    Internally executes multiple optimization passes.
    Exposes a single high-level stage.
    """
    
    def __init__(self, pass_pipeline: PassPipeline):
        super().__init__(CompilerStage.OPTIMIZATION, "Optimization")
        self.pass_pipeline = pass_pipeline
    
    def _execute_stage(self, input_ir: Any, context: Dict[str, Any]) -> tuple[bool, List[str], List[str], Any]:
        errors = []
        warnings = []
        
        if not isinstance(input_ir, CanonicalIR):
            errors.append("Optimization expects CanonicalIR as input")
            return False, errors, warnings, input_ir
        
        # Run optimization pipeline
        pass_results, optimized_ir = self.pass_pipeline.run_pipeline(input_ir, None)
        
        # Collect errors and warnings from passes
        for result in pass_results:
            errors.extend(result.errors)
            warnings.extend(result.warnings)
        
        # Check for critical errors
        if any(result.result == PassResult.ERROR for result in pass_results):
            return False, errors, warnings, input_ir
        
        return True, errors, warnings, optimized_ir


class SchedulingStage(CompilerStage):
    """
    Scheduling stage - Determines execution order and scheduling.
    
    Analyzes CIR and produces scheduling information.
    """
    
    def __init__(self):
        super().__init__(CompilerStage.SCHEDULING, "Scheduling")
    
    def _execute_stage(self, input_ir: Any, context: Dict[str, Any]) -> tuple[bool, List[str], List[str], Any]:
        errors = []
        warnings = []
        
        if not isinstance(input_ir, CanonicalIR):
            errors.append("Scheduling expects CanonicalIR as input")
            return False, errors, warnings, input_ir
        
        # Analyze dependencies and produce scheduling order
        entry_nodes = input_ir.get_entry_nodes()
        if not entry_nodes:
            warnings.append("CIR has no entry nodes")
        
        exit_nodes = input_ir.get_exit_nodes()
        if not exit_nodes:
            warnings.append("CIR has no exit nodes")
        
        # Add scheduling metadata to CIR
        input_ir.metadata["scheduling"] = {
            "entry_nodes": [node.node_id for node in entry_nodes],
            "exit_nodes": [node.node_id for node in exit_nodes],
            "total_nodes": len(input_ir.nodes),
            "scheduled_at": datetime.now(timezone.utc).isoformat()
        }
        
        return True, errors, warnings, input_ir


class SecurityStage(CompilerStage):
    """
    Security stage - Validates security constraints and capabilities.
    
    Ensures CIR complies with security requirements.
    """
    
    def __init__(self):
        super().__init__(CompilerStage.SECURITY, "Security")
    
    def _execute_stage(self, input_ir: Any, context: Dict[str, Any]) -> tuple[bool, List[str], List[str], Any]:
        errors = []
        warnings = []
        
        if not isinstance(input_ir, CanonicalIR):
            errors.append("Security expects CanonicalIR as input")
            return False, errors, warnings, input_ir
        
        # Check capability requirements
        for node in input_ir.nodes:
            for cap_req in node.capability_requirements:
                if not cap_req.capability_path:
                    errors.append(f"Node {node.node_id} has capability requirement without path")
        
        # Check constraints
        for constraint in input_ir.constraints:
            if constraint.severity == "error":
                warnings.append(f"Security constraint: {constraint.expression}")
        
        return True, errors, warnings, input_ir


class EvidenceStage(CompilerStage):
    """
    Evidence stage - Generates evidence collection plan.
    
    Determines what evidence needs to be collected for verification.
    """
    
    def __init__(self):
        super().__init__(CompilerStage.EVIDENCE, "Evidence")
    
    def _execute_stage(self, input_ir: Any, context: Dict[str, Any]) -> tuple[bool, List[str], List[str], Any]:
        errors = []
        warnings = []
        
        if not isinstance(input_ir, CanonicalIR):
            errors.append("Evidence expects CanonicalIR as input")
            return False, errors, warnings, input_ir
        
        # Generate evidence requirements for effect nodes
        effect_nodes = input_ir.get_effect_nodes()
        
        for node in effect_nodes:
            if not any(
                const.constraint_type == "evidence" 
                for const in input_ir.constraints 
                if node.node_id in const.applies_to
            ):
                warnings.append(f"Effect node {node.node_id} may require evidence collection")
        
        # Add evidence metadata to CIR
        input_ir.metadata["evidence"] = {
            "effect_nodes_count": len(effect_nodes),
            "evidence_required": True,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        
        return True, errors, warnings, input_ir


class BackendStage(CompilerStage):
    """
    Backend stage - Finalizes CIR for execution.
    
    Produces the final executable representation.
    """
    
    def __init__(self):
        super().__init__(CompilerStage.BACKEND, "Backend")
    
    def _execute_stage(self, input_ir: Any, context: Dict[str, Any]) -> tuple[bool, List[str], List[str], Any]:
        errors = []
        warnings = []
        
        if not isinstance(input_ir, CanonicalIR):
            errors.append("Backend expects CanonicalIR as input")
            return False, errors, warnings, input_ir
        
        # Final validation
        if not input_ir.nodes:
            errors.append("CIR has no nodes")
        
        # Add final metadata
        input_ir.metadata["backend"] = {
            "finalized": True,
            "finalized_at": datetime.now(timezone.utc).isoformat(),
            "ready_for_execution": True
        }
        
        return len(errors) == 0, errors, warnings, input_ir


class ConstitutionalCompiler:
    """
    High-level Constitutional Compiler.
    
    Exposes compiler stages rather than implementation details.
    Pipeline: Frontend → IR Normalization → Optimization → Scheduling → Security → Evidence → Backend
    """
    
    def __init__(self, pass_pipeline: PassPipeline):
        self.pass_pipeline = pass_pipeline
        self._stages: List[CompilerStage] = []
        self._initialize_stages()
    
    def _initialize_stages(self) -> None:
        """Initialize compiler stages."""
        self._stages = [
            FrontendStage(),
            IRNormalizationStage(),
            OptimizationStage(self.pass_pipeline),
            SchedulingStage(),
            SecurityStage(),
            EvidenceStage(),
            BackendStage()
        ]
    
    def add_stage(self, stage: CompilerStage, position: Optional[int] = None) -> None:
        """Add a custom stage to the pipeline."""
        if position is None:
            self._stages.append(stage)
        else:
            self._stages.insert(position, stage)
    
    def remove_stage(self, stage: CompilerStage) -> None:
        """Remove a stage from the pipeline."""
        if stage in self._stages:
            self._stages.remove(stage)
    
    def compile(self, planning_ir: PlanningIR, context: Optional[Dict[str, Any]] = None) -> CompilationResult:
        """
        Compile PlanningIR through the full compiler pipeline.
        
        Args:
            planning_ir: Planning Intermediate Representation
            context: Compilation context
        
        Returns:
            Compilation result
        """
        context = context or {}
        stages_results = []
        total_errors = []
        total_warnings = []
        
        start_time = datetime.now(timezone.utc)
        
        # Frontend: Validate PlanningIR
        frontend_stage = self._stages[0]
        stage_result, current_ir = frontend_stage.execute(planning_ir, context)
        stages_results.append(stage_result)
        total_errors.extend(stage_result.errors)
        total_warnings.extend(stage_result.warnings)
        
        if not stage_result.success:
            return CompilationResult(
                success=False,
                stages=stages_results,
                total_duration_seconds=(datetime.now(timezone.utc) - start_time).total_seconds(),
                errors=total_errors,
                warnings=total_warnings,
                output_ir=None,
                metadata={"failed_at": "frontend"}
            )
        
        # IR Normalization: Normalize PlanningIR
        normalization_stage = self._stages[1]
        stage_result, current_ir = normalization_stage.execute(current_ir, context)
        stages_results.append(stage_result)
        total_errors.extend(stage_result.errors)
        total_warnings.extend(stage_result.warnings)
        
        if not stage_result.success:
            return CompilationResult(
                success=False,
                stages=stages_results,
                total_duration_seconds=(datetime.now(timezone.utc) - start_time).total_seconds(),
                errors=total_errors,
                warnings=total_warnings,
                output_ir=None,
                metadata={"failed_at": "ir_normalization"}
            )
        
        # Lower to CIR
        ir_lowering = IRLoweringPass()
        cir = ir_lowering.lower(current_ir)
        
        # Validate CIR
        cir_validator = CIRValidator()
        is_valid, cir_errors, cir_warnings = cir_validator.validate(cir)
        total_errors.extend(cir_errors)
        total_warnings.extend(cir_warnings)
        
        if not is_valid:
            return CompilationResult(
                success=False,
                stages=stages_results,
                total_duration_seconds=(datetime.now(timezone.utc) - start_time).total_seconds(),
                errors=total_errors,
                warnings=total_warnings,
                output_ir=None,
                metadata={"failed_at": "cir_validation"}
            )
        
        # Run remaining stages on CIR
        for stage in self._stages[2:]:  # Skip Frontend and IR Normalization
            stage_result, cir = stage.execute(cir, context)
            stages_results.append(stage_result)
            total_errors.extend(stage_result.errors)
            total_warnings.extend(stage_result.warnings)
            
            if not stage_result.success:
                return CompilationResult(
                    success=False,
                    stages=stages_results,
                    total_duration_seconds=(datetime.now(timezone.utc) - start_time).total_seconds(),
                    errors=total_errors,
                    warnings=total_warnings,
                    output_ir=None,
                    metadata={"failed_at": stage.stage.value}
                )
        
        total_duration = (datetime.now(timezone.utc) - start_time).total_seconds()
        
        return CompilationResult(
            success=True,
            stages=stages_results,
            total_duration_seconds=total_duration,
            errors=total_errors,
            warnings=total_warnings,
            output_ir=cir,
            metadata={
                "stages_executed": len(stages_results),
                "cir_version": cir.cir_version.value
            }
        )
    
    def get_stages(self) -> List[CompilerStage]:
        """Get all compiler stages."""
        return self._stages.copy()
    
    def get_stage(self, stage: CompilerStage) -> Optional[CompilerStage]:
        """Get a specific stage."""
        for s in self._stages:
            if s.stage == stage:
                return s
        return None
