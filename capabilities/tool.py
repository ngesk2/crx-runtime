"""
ToolCapability - Contract for tool operations.

This capability defines the contract for tool operations.
Implementations (Rust, Python, etc.) must satisfy this contract.

The constitutional kernel uses this interface without knowing
the implementation details.

Phase 4: Uniform acquire() contract - all capabilities return Evidence IR.
Refinement 11: Canonical Request IR - immutable request models.
"""

from typing import Optional, Dict, Any, List
from abc import ABC, abstractmethod
from constitution.models.evidence import Evidence, EvidenceProvenance
from constitution.models.request import ToolRequest


class ToolCapability(ABC):
    """
    Capability contract for tool operations.
    
    Implementations must provide:
    - Deterministic behavior for constitutional operations
    - Canonical serialization for tool data
    - Idempotent operations where required
    - Error handling that preserves constitutional integrity
    - All operations return Evidence IR
    """
    
    @abstractmethod
    async def acquire(self, request: ToolRequest, build_witness_hash: str) -> Evidence:
        """
        Acquire tool evidence.
        
        Request is a canonical, immutable, hashable ToolRequest.
        
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
    async def execute_tool(self, tool_id: str, parameters: Dict[str, Any], build_witness_hash: str) -> Evidence:
        """
        Execute tool with parameters as Evidence.
        
        Constitutional requirements:
        - Returns Evidence with result in metadata
        - Deterministic output for same parameters
        """
        pass
    
    @abstractmethod
    async def get_tool_definition(self, tool_id: str, build_witness_hash: str) -> Evidence:
        """
        Get tool definition as Evidence.
        
        Constitutional requirements:
        - Returns Evidence with definition in metadata
        - Deterministic for same tool_id
        """
        pass
    
    @abstractmethod
    async def list_tools(self, tool_type: Optional[str], build_witness_hash: str) -> Evidence:
        """
        List available tools as Evidence.
        
        Constitutional requirements:
        - Returns Evidence with list in metadata
        - Canonical sorted list
        - Deterministic for same filter
        """
        pass
    
    @abstractmethod
    async def validate_tool_parameters(self, tool_id: str, parameters: Dict[str, Any], build_witness_hash: str) -> Evidence:
        """
        Validate tool parameters as Evidence.
        
        Constitutional requirements:
        - Returns Evidence with validation result in metadata
        - Deterministic validation
        """
        pass
    
    @abstractmethod
    async def get_tool_schema(self, tool_id: str, build_witness_hash: str) -> Evidence:
        """
        Get tool parameter schema as Evidence.
        
        Constitutional requirements:
        - Returns Evidence with schema in metadata
        - Deterministic for same tool_id
        """
        pass
