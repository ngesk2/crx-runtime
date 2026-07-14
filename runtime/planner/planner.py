"""
Planner - Planning subsystem.

Planner generates plans from objectives.
Planner never executes plans.
Planner never replans during execution.
Planner is purely a planning subsystem.

Constitutional Law 0: Planning never executes
Constitutional Law 1: Execution never replans (Planner does not execute)
"""

from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime, timezone
import uuid

from runtime.planning.planning_ir import PlanningIR, PlanningIRBuilder


class PlanningStatus(Enum):
    """Status of planning."""
    PLANNING = "planning"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class PlanningResult:
    """Result of planning."""
    plan_id: str
    objective_id: str
    planning_ir: PlanningIR
    status: PlanningStatus
    planned_at: str
    planned_by: str
    metadata: Dict[str, Any]


class Planner:
    """
    Planner - Planning subsystem.
    
    Responsibilities:
    - Generate plans from objectives
    - Decompose goals into subgoals
    - Estimate capabilities required
    - Identify risks
    - Generate evidence requirements
    
    Planner NEVER:
    - Executes plans (Law 0)
    - Invokes capabilities (Law 0)
    - Modifies runtime state (Law 0)
    - Replans during execution (Law 1)
    
    Planner is purely a planning subsystem.
    """
    
    def __init__(self):
        self._planner_id = "planner_v1"
    
    def plan(
        self,
        objective: str,
        context: Optional[Dict[str, Any]] = None
    ) -> PlanningResult:
        """
        Generate a plan from an objective.
        
        Args:
            objective: High-level objective
            context: Additional context (constraints, capabilities, etc.)
        
        Returns:
            PlanningResult with PlanningIR
        """
        # Use GeneralPlanner to generate PlanningIR
        from runtime.planning.general_planner import get_general_planner
        
        general_planner = get_general_planner()
        
        # Generate PlanningIR (pure planning, no execution)
        planning_ir = general_planner.plan(
            goal=objective,
            constraints=context.get("constraints", []) if context else [],
            context=context or {},
            available_capabilities=context.get("available_capabilities", set()) if context else set()
        )
        
        return PlanningResult(
            plan_id=planning_ir.ir_id,
            objective_id=str(uuid.uuid4()),  # Would be hash of objective in production
            planning_ir=planning_ir,
            status=PlanningStatus.COMPLETED,
            planned_at=datetime.now(timezone.utc).isoformat(),
            planned_by=self._planner_id,
            metadata=context or {}
        )
    
    def validate_plan(self, planning_ir: PlanningIR) -> List[str]:
        """
        Validate a plan.
        
        This is pure validation - no execution.
        
        Args:
            planning_ir: PlanningIR to validate
        
        Returns:
            List of validation errors (empty if valid)
        """
        errors = []
        
        # Validate that plan has subgoals
        if not planning_ir.subgoals:
            errors.append("Plan has no subgoals")
        
        # Validate that plan has capability requests
        if not planning_ir.capability_requests:
            errors.append("Plan has no capability requests")
        
        # Validate that plan has evidence requirements
        if not planning_ir.evidence_requirements:
            errors.append("Plan has no evidence requirements")
        
        return errors


# Singleton instance
_planner = Planner()


def get_planner() -> Planner:
    """Get the singleton Planner."""
    return _planner
