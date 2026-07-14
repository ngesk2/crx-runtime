"""
AgentCapability - Contract for agent operations.

This capability defines the contract for agent operations.
Implementations (Rust, Python, etc.) must satisfy this contract.

The constitutional kernel uses this interface without knowing
the implementation details.

Phase 4: Uniform acquire() contract - all capabilities return Evidence IR.
Refinement 11: Canonical Request IR - immutable request models.
"""

from typing import Optional, Dict, Any, List
from abc import ABC, abstractmethod
from constitution.models.evidence import Evidence, EvidenceProvenance
from constitution.models.request import AgentRequest


class AgentCapability(ABC):
    """
    Capability contract for agent operations.
    
    Implementations must provide:
    - Deterministic behavior for constitutional operations
    - Canonical serialization for agent data
    - Idempotent operations where required
    - Error handling that preserves constitutional integrity
    - All operations return Evidence IR
    """
    
    @abstractmethod
    async def acquire(self, request: AgentRequest, build_witness_hash: str) -> Evidence:
        """
        Acquire agent evidence.
        
        Request is a canonical, immutable, hashable AgentRequest.
        
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
    async def execute_agent(self, agent_id: str, input_data: Dict[str, Any], build_witness_hash: str) -> Evidence:
        """
        Execute agent with input data as Evidence.
        
        Constitutional requirements:
        - Returns Evidence with result in metadata
        - Deterministic output for same input
        """
        pass
    
    @abstractmethod
    async def get_agent_definition(self, agent_id: str, build_witness_hash: str) -> Evidence:
        """
        Get agent definition as Evidence.
        
        Constitutional requirements:
        - Returns Evidence with definition in metadata
        - Deterministic for same agent_id
        """
        pass
    
    @abstractmethod
    async def list_agents(self, agent_type: Optional[str], build_witness_hash: str) -> Evidence:
        """
        List available agents as Evidence.
        
        Constitutional requirements:
        - Returns Evidence with list in metadata
        - Canonical sorted list
        - Deterministic for same filter
        """
        pass
    
    @abstractmethod
    async def validate_agent_config(self, agent_config: Dict[str, Any], build_witness_hash: str) -> Evidence:
        """
        Validate agent configuration as Evidence.
        
        Constitutional requirements:
        - Returns Evidence with validation result in metadata
        - Deterministic validation
        """
        pass
