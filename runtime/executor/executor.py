"""
Executor - Execution subsystem.

Executor executes plans.
Executor never plans during execution.
Executor never replans.
Executor is purely an execution subsystem.

Constitutional Law 0: Planning never executes (Executor does not plan)
Constitutional Law 1: Execution never replans (Executor does not replan)
"""

from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime, timezone
import asyncio

from runtime.planning.planning_ir import PlanningIR


class ExecutionStatus(Enum):
    """Status of execution."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class ExecutionResult:
    """Result of execution."""
    execution_id: str
    plan_id: str
    status: ExecutionStatus
    started_at: str
    completed_at: Optional[str]
    result: Optional[Dict[str, Any]]
    error: Optional[str]
    evidence: List[Dict[str, Any]]
    metadata: Dict[str, Any]


class Executor:
    """
    Executor - Execution subsystem.
    
    Responsibilities:
    - Execute plans from PlanningIR
    - Invoke capabilities as specified in plan
    - Collect evidence as specified in plan
    - Report execution results
    
    Executor NEVER:
    - Plans during execution (Law 0)
    - Replans (Law 1)
    - Modifies the plan
    - Makes decisions not in the plan
    
    Executor is purely a mechanical execution subsystem.
    """
    
    def __init__(self):
        self._executor_id = "executor_v1"
    
    async def execute(
        self,
        planning_ir: PlanningIR,
        capability_registry,
        context: Optional[Dict[str, Any]] = None
    ) -> ExecutionResult:
        """
        Execute a plan.
        
        Args:
            planning_ir: PlanningIR to execute
            capability_registry: Capability registry for invoking capabilities
            context: Additional context (mission_id, etc.)
        
        Returns:
            ExecutionResult with status and evidence
        """
        import uuid
        
        execution_id = str(uuid.uuid4())
        started_at = datetime.now(timezone.utc).isoformat()
        
        try:
            # Execute subgoals in order (mechanical execution)
            evidence = []
            
            for subgoal in planning_ir.subgoals:
                # Execute subgoal (mechanical, no replanning)
                subgoal_result = await self._execute_subgoal(
                    subgoal,
                    planning_ir.capability_requests,
                    capability_registry,
                    context
                )
                evidence.append(subgoal_result)
            
            # Collect evidence as specified in plan
            for evidence_req in planning_ir.evidence_requirements:
                evidence_result = await self._collect_evidence(
                    evidence_req,
                    context
                )
                evidence.append(evidence_result)
            
            completed_at = datetime.now(timezone.utc).isoformat()
            
            return ExecutionResult(
                execution_id=execution_id,
                plan_id=planning_ir.ir_id,
                status=ExecutionStatus.COMPLETED,
                started_at=started_at,
                completed_at=completed_at,
                result={"evidence_count": len(evidence)},
                error=None,
                evidence=evidence,
                metadata=context or {}
            )
        
        except Exception as e:
            completed_at = datetime.now(timezone.utc).isoformat()
            
            return ExecutionResult(
                execution_id=execution_id,
                plan_id=planning_ir.ir_id,
                status=ExecutionStatus.FAILED,
                started_at=started_at,
                completed_at=completed_at,
                result=None,
                error=str(e),
                evidence=[],
                metadata=context or {}
            )
    
    async def _execute_subgoal(
        self,
        subgoal,
        capability_requests,
        capability_registry,
        context
    ) -> Dict[str, Any]:
        """
        Execute a subgoal.
        
        This is mechanical execution - no replanning.
        """
        # Find capability requests for this subgoal
        # In production, would match subgoal_id to capability requests
        
        # For now, simulate execution
        await asyncio.sleep(0.1)  # Simulate work
        
        return {
            "subgoal_id": subgoal.subgoal_id,
            "status": "completed",
            "executed_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def _collect_evidence(
        self,
        evidence_req,
        context
    ) -> Dict[str, Any]:
        """
        Collect evidence as specified in plan.
        
        This is mechanical - no decision making.
        """
        # In production, would call actual verification tools
        await asyncio.sleep(0.05)  # Simulate evidence collection
        
        return {
            "evidence_type": evidence_req.evidence_type,
            "source": evidence_req.source,
            "collected_at": datetime.now(timezone.utc).isoformat(),
            "success": True
        }


# Singleton instance
_executor = Executor()


def get_executor() -> Executor:
    """Get the singleton Executor."""
    return _executor
