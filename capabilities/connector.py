"""
ConnectorCapability - Contract for external system connectors.

This capability defines the contract for connector operations.
Implementations (Rust, Python, etc.) must satisfy this contract.

The constitutional kernel uses this interface without knowing
the implementation details.

Phase 4: Uniform acquire() contract - all capabilities return Evidence IR.
Refinement 11: Canonical Request IR - immutable request models.
"""

from typing import Optional, Dict, Any, List
from abc import ABC, abstractmethod
from constitution.models.evidence import Evidence, EvidenceProvenance, ConnectorEvidence
from constitution.models.request import ConnectorRequest


class ConnectorCapability(ABC):
    """
    Capability contract for external system connectors.
    
    Implementations must provide:
    - Deterministic behavior for constitutional operations
    - Canonical serialization for connector data
    - Idempotent operations where required
    - Error handling that preserves constitutional integrity
    - All operations return Evidence IR
    """
    
    @abstractmethod
    async def acquire(self, request: ConnectorRequest, build_witness_hash: str) -> ConnectorEvidence:
        """
        Acquire connector evidence.
        
        Request is a canonical, immutable, hashable ConnectorRequest.
        
        Constitutional requirements:
        - Returns ConnectorEvidence with full provenance
        - Deterministic for same request_hash
        - Includes acquisition witness
        - Includes capability witness
        - References build_witness_hash
        """
        pass
    
    # Convenience methods (deprecated - use acquire() directly)
    @abstractmethod
    async def connect(self, connector_type: str, config: Dict[str, Any], build_witness_hash: str) -> ConnectorEvidence:
        """
        Establish connection to external system as Evidence.
        
        Constitutional requirements:
        - Returns ConnectorEvidence with connection handle
        - Deterministic for same config
        """
        pass
    
    @abstractmethod
    async def disconnect(self, connection_handle: str, build_witness_hash: str) -> ConnectorEvidence:
        """
        Close connection to external system as Evidence.
        
        Constitutional requirements:
        - Returns ConnectorEvidence
        - Idempotent
        """
        pass
    
    @abstractmethod
    async def execute_query(self, connection_handle: str, query: str, params: Optional[Dict[str, Any]], build_witness_hash: str) -> ConnectorEvidence:
        """
        Execute query on external system as Evidence.
        
        Constitutional requirements:
        - Returns ConnectorEvidence with results in metadata
        - Deterministic for same query and params
        - Canonical sorted results
        """
        pass
    
    @abstractmethod
    async def get_schema(self, connection_handle: str, build_witness_hash: str) -> ConnectorEvidence:
        """
        Get schema information from external system as Evidence.
        
        Constitutional requirements:
        - Returns ConnectorEvidence with schema in metadata
        - Deterministic for same connection
        """
        pass
    
    @abstractmethod
    async def sync_data(self, connection_handle: str, source_config: Dict[str, Any], build_witness_hash: str) -> ConnectorEvidence:
        """
        Sync data from external system as Evidence.
        
        Constitutional requirements:
        - Returns ConnectorEvidence with sync ID in metadata
        - Deterministic sync behavior
        """
        pass
