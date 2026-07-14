"""
Mission Executor - Execute single capability for a mission.

Responsibilities:
- load Mission
- acquire lease
- create execution context
- invoke capability
- persist result
- release lease

No scheduling.
No retries.
No DAG logic.
"""

from typing import Optional, Dict, Any
from datetime import datetime
import asyncio

from constitution.registry import CapabilityRegistry
from hermes.mission_execution_context import MissionExecutionContext
from hermes.mission_state_store import MissionStateStore, MissionLifecycleState
from hermes.lease_manager import LeaseManager


class MissionExecutor:
    """
    Mission executor for single capability execution.
    
    Executes one capability per mission. No DAG logic, no retries.
    """
    
    def __init__(
        self,
        capability_registry: CapabilityRegistry,
        state_store: MissionStateStore,
        lease_manager: LeaseManager
    ):
        self.capability_registry = capability_registry
        self.state_store = state_store
        self.lease_manager = lease_manager
    
    async def execute(self, mission: Any, capability_name: str) -> Dict[str, Any]:
        """
        Execute a mission with a single capability.
        
        Flow:
        1. Load mission state
        2. Acquire lease
        3. Create execution context
        4. Invoke capability
        5. Collect evidence (MANDATORY - cannot be skipped)
        6. Persist result with evidence
        7. Release lease
        
        NOTE: Evidence collection is mandatory. Mission execution cannot complete
        without evidence. This ensures Law 8 (Every external side effect must have evidence).
        """
        # Extract mission_id
        mission_id = getattr(mission, 'mission_id', mission.get('mission_id') if isinstance(mission, dict) else None)
        
        # Load or create mission state
        state = await self.state_store.load(mission_id)
        if not state:
            state = await self._create_initial_state(mission_id)
        
        # Check if mission already completed
        if state.lifecycle in [MissionLifecycleState.COMPLETED, MissionLifecycleState.CANCELLED]:
            return {
                "mission_id": mission_id,
                "status": state.lifecycle.value,
                "result": state.result,
                "evidence": state.evidence if hasattr(state, 'evidence') else [],
                "message": "Mission already completed or cancelled"
            }
        
        # Acquire lease
        lease = await self.lease_manager.acquire(mission_id, ttl=300)
        if not lease:
            return {
                "mission_id": mission_id,
                "status": "failed",
                "error": "Failed to acquire lease",
                "evidence": []
            }
        
        try:
            # Update state to running
            await self.state_store.update_lifecycle(
                mission_id,
                MissionLifecycleState.RUNNING,
                lease_id=lease.lease_id
            )
            
            # Create execution context
            context = self._create_execution_context(mission, lease)
            
            # Invoke capability
            result = await self._invoke_capability(context, capability_name)
            
            # Collect evidence (MANDATORY)
            evidence = await self._collect_evidence(mission_id, capability_name, result)
            
            # Persist result with evidence
            await self.state_store.update_lifecycle(
                mission_id,
                MissionLifecycleState.COMPLETED,
                result=result,
                evidence=evidence,
                lease_id=lease.lease_id
            )
            
            return {
                "mission_id": mission_id,
                "status": "completed",
                "result": result,
                "evidence": evidence
            }
        
        except Exception as e:
            # Handle failure - still collect evidence
            evidence = await self._collect_evidence(mission_id, capability_name, None, error=str(e))
            
            await self.state_store.update_lifecycle(
                mission_id,
                MissionLifecycleState.FAILED,
                error=str(e),
                evidence=evidence,
                lease_id=lease.lease_id
            )
            
            return {
                "mission_id": mission_id,
                "status": "failed",
                "error": str(e),
                "evidence": evidence
            }
        
        finally:
            # Release lease
            await self.lease_manager.release(lease.lease_id)
    
    async def _create_initial_state(self, mission_id: str):
        """Create initial mission state."""
        from hermes.mission_state_store import MissionState
        
        state = MissionState(
            mission_id=mission_id,
            lifecycle=MissionLifecycleState.CREATED,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        await self.state_store.save(state)
        return state
    
    def _create_execution_context(
        self,
        mission: Any,
        lease
    ) -> MissionExecutionContext:
        """Create mission execution context."""
        mission_id = getattr(mission, 'mission_id', mission.get('mission_id') if isinstance(mission, dict) else None)
        return MissionExecutionContext(
            mission=mission,
            capability_registry=self.capability_registry,
            execution_id=f"exec_{mission_id}_{datetime.utcnow().timestamp()}",
            configuration={"lease_id": lease.lease_id}
        )
    
    async def _invoke_capability(
        self,
        context: MissionExecutionContext,
        capability_name: str
    ) -> Dict[str, Any]:
        """Invoke a capability with the execution context."""
        capability = self.capability_registry.get(capability_name)
        if not capability:
            raise ValueError(f"Capability {capability_name} not found")
        
        # Execute capability with mission context
        result = await capability.execute({
            "mission_id": context.mission.mission_id,
            "execution_id": context.execution_id,
            "configuration": context.configuration
        })
        
        return result
    
    async def _collect_evidence(
        self,
        mission_id: str,
        capability_name: str,
        result: Optional[Dict[str, Any]],
        error: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Collect evidence for mission execution.
        
        This is MANDATORY - cannot be skipped.
        Evidence includes:
        - Execution timestamp
        - Capability used
        - Success/failure status
        - Result or error
        - Execution context
        
        Args:
            mission_id: Mission identifier
            capability_name: Capability that was executed
            result: Execution result (if successful)
            error: Error message (if failed)
        
        Returns:
            List of evidence items
        """
        from datetime import datetime
        
        evidence = [
            {
                "evidence_type": "execution",
                "mission_id": mission_id,
                "capability_name": capability_name,
                "timestamp": datetime.utcnow().isoformat(),
                "success": error is None,
                "result": result,
                "error": error
            },
            {
                "evidence_type": "capability_invocation",
                "capability_name": capability_name,
                "timestamp": datetime.utcnow().isoformat(),
                "invoked": True
            }
        ]
        
        return evidence
