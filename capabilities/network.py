"""
NetworkCapability - Contract for network operations.

This capability defines the contract for network operations.
Implementations (Rust, Python, etc.) must satisfy this contract.

The constitutional kernel uses this interface without knowing
the implementation details.

Phase 4: Uniform acquire() contract - all capabilities return Evidence IR.
Refinement 11: Canonical Request IR - immutable request models.
"""

from typing import Optional, Dict, Any
from abc import ABC, abstractmethod
from constitution.models.evidence import Evidence, EvidenceProvenance, NetworkEvidence
from constitution.models.request import NetworkRequest


class NetworkCapability(ABC):
    """
    Capability contract for network operations.
    
    Implementations must provide:
    - Deterministic behavior for constitutional operations
    - Canonical serialization for network data
    - Idempotent operations where required
    - Error handling that preserves constitutional integrity
    - All operations return Evidence IR
    """
    
    @abstractmethod
    async def acquire(self, request: NetworkRequest, build_witness_hash: str) -> NetworkEvidence:
        """
        Acquire network evidence.
        
        Request is a canonical, immutable, hashable NetworkRequest.
        
        Constitutional requirements:
        - Returns NetworkEvidence with full provenance
        - Deterministic for same request_hash
        - Includes acquisition witness
        - Includes capability witness
        - References build_witness_hash
        """
        pass
    
    # Convenience methods (deprecated - use acquire() directly)
    @abstractmethod
    async def http_get(self, url: str, headers: Optional[Dict[str, str]], build_witness_hash: str) -> NetworkEvidence:
        """
        Perform HTTP GET request as Evidence.
        
        Constitutional requirements:
        - Returns NetworkEvidence with response bytes
        - Deterministic for same URL and headers
        """
        pass
    
    @abstractmethod
    async def http_post(self, url: str, data: bytes, headers: Optional[Dict[str, str]], build_witness_hash: str) -> NetworkEvidence:
        """
        Perform HTTP POST request as Evidence.
        
        Constitutional requirements:
        - Returns NetworkEvidence with response bytes
        - Deterministic for same URL, data, headers
        """
        pass
    
    @abstractmethod
    async def websocket_connect(self, url: str, build_witness_hash: str) -> NetworkEvidence:
        """
        Connect to WebSocket as Evidence.
        
        Constitutional requirements:
        - Returns NetworkEvidence with connection handle
        - Deterministic connection establishment
        """
        pass
    
    @abstractmethod
    async def websocket_send(self, connection: Any, data: bytes, build_witness_hash: str) -> NetworkEvidence:
        """
        Send data over WebSocket as Evidence.
        
        Constitutional requirements:
        - Returns NetworkEvidence
        - Sends exact bytes
        """
        pass
    
    @abstractmethod
    async def websocket_receive(self, connection: Any, build_witness_hash: str) -> NetworkEvidence:
        """
        Receive data from WebSocket as Evidence.
        
        Constitutional requirements:
        - Returns NetworkEvidence with received bytes
        - Blocks until data available
        """
        pass
