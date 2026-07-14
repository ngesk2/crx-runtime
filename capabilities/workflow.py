"""
WorkflowCapability - Contract for workflow operations.

This capability defines the contract for workflow operations.
Implementations (Rust, Python, etc.) must satisfy this contract.

The constitutional kernel uses this interface without knowing
the implementation details.

Phase 4: Uniform acquire() contract - all capabilities return Evidence IR.
Refinement 11: Canonical Request IR - immutable request models.
"""

from typing import Optional, Dict, Any, List
from abc import ABC, abstractmethod
from constitution.models.evidence import Evidence, EvidenceProvenance
from constitution.models.request import WorkflowRequest


class WorkflowCapability(ABC):
    """
    Capability contract for workflow operations.
    
    Implementations must provide:
    - Deterministic behavior for constitutional operations
    - Canonical serialization for workflow data
    - Idempotent operations where required
    - Error handling that preserves constitutional integrity
    - All operations return Evidence IR
    """
    
    @abstractmethod
    async def acquire(self, request: WorkflowRequest, build_witness_hash: str) -> Evidence:
        """
        Acquire workflow evidence.
        
        Request is a canonical, immutable, hashable WorkflowRequest.
        
        Constitutional requirements:
        - Returns Evidence with full provenance
        - Deterministic for same request_hash
        - Includes acquisition witness
        - Includes capability witness
        - References build_witness_hash
        """
        pass
    
    # Convenience methods (deprecated - use acquire() directly)
    @abstractmethod
    async def execute_workflow(self, workflow_id: str, input_data: Dict[str, Any], build_witness_hash: str) -> Evidence:
        """
        Execute workflow with input data as Evidence.
        
        Constitutional requirements:
        - Returns Evidence with result in metadata
        - Deterministic output for same input
        """
        pass
    
    @abstractmethod
    async def get_workflow_definition(self, workflow_id: str, build_witness_hash: str) -> Evidence:
        """
        Get workflow definition as Evidence.
        
        Constitutional requirements:
        - Returns Evidence with definition in metadata
        - Deterministic for same workflow_id
        """
        pass
    
    @abstractmethod
    async def list_workflows(self, workflow_type: Optional[str], build_witness_hash: str) -> Evidence:
        """
        List available workflows as Evidence.
        
        Constitutional requirements:
        - Returns Evidence with list in metadata
        - Canonical sorted list
        - Deterministic for same filter
        """
        pass
    
    @abstractmethod
    async def validate_workflow_config(self, workflow_config: Dict[str, Any], build_witness_hash: str) -> Evidence:
        """
        Validate workflow configuration as Evidence.
        
        Constitutional requirements:
        - Returns Evidence with validation result in metadata
        - Deterministic validation
        """
        pass
    
    @abstractmethod
    async def get_workflow_execution_state(self, execution_id: str, build_witness_hash: str) -> Evidence:
        """
        Get workflow execution state as Evidence.
        
        Constitutional requirements:
        - Returns Evidence with state in metadata
        - Deterministic for same execution_id
        """
        pass
