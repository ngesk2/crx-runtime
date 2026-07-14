"""
StorageCapability - Contract for storage operations.

This capability defines the contract for storage operations.
Implementations (Rust, Python, etc.) must satisfy this contract.

The constitutional kernel uses this interface without knowing
the implementation details.

Phase 4: Uniform acquire() contract - all capabilities return Evidence IR.
Refinement 11: Canonical Request IR - immutable request models.
"""

from typing import Optional, Any, Dict, List
from abc import ABC, abstractmethod
from constitution.models.evidence import Evidence, EvidenceProvenance, StorageEvidence
from constitution.models.request import StorageRequest


class StorageCapability(ABC):
    """
    Capability contract for storage operations.
    
    Implementations must provide:
    - Deterministic behavior for constitutional operations
    - Canonical serialization for stored data
    - Atomic transactions where required
    - Error handling that preserves constitutional integrity
    - All operations return Evidence IR
    """
    
    @abstractmethod
    async def acquire(self, request: StorageRequest, build_witness_hash: str) -> StorageEvidence:
        """
        Acquire storage evidence.
        
        Request is a canonical, immutable, hashable StorageRequest.
        
        Constitutional requirements:
        - Returns StorageEvidence with full provenance
        - Deterministic for same request_hash
        - Includes acquisition witness
        - Includes capability witness
        - References build_witness_hash
        """
        pass
    
    # Convenience methods (deprecated - use acquire() directly)
    @abstractmethod
    async def get(self, key: str, build_witness_hash: str) -> StorageEvidence:
        """
        Get value by key as Evidence.
        
        Constitutional requirements:
        - Returns StorageEvidence with bytes in metadata
        - Deterministic for same key
        """
        pass
    
    @abstractmethod
    async def set(self, key: str, value: bytes, build_witness_hash: str) -> StorageEvidence:
        """
        Set value by key as Evidence.
        
        Constitutional requirements:
        - Returns StorageEvidence
        - Atomic operation
        """
        pass
    
    @abstractmethod
    async def delete(self, key: str, build_witness_hash: str) -> StorageEvidence:
        """
        Delete value by key as Evidence.
        
        Constitutional requirements:
        - Returns StorageEvidence
        - Atomic operation
        - Idempotent
        """
        pass
    
    @abstractmethod
    async def exists(self, key: str, build_witness_hash: str) -> StorageEvidence:
        """
        Check if key exists as Evidence.
        
        Constitutional requirements:
        - Returns StorageEvidence with boolean in metadata
        - Deterministic result
        """
        pass
    
    @abstractmethod
    async def get_many(self, keys: List[str], build_witness_hash: str) -> StorageEvidence:
        """
        Get multiple values by keys as Evidence.
        
        Constitutional requirements:
        - Returns StorageEvidence with dict in metadata
        - Deterministic for same keys
        """
        pass
    
    @abstractmethod
    async def set_many(self, items: Dict[str, bytes], build_witness_hash: str) -> StorageEvidence:
        """
        Set multiple key-value pairs as Evidence.
        
        Constitutional requirements:
        - Returns StorageEvidence
        - Atomic operation
        """
        pass
    
    @abstractmethod
    async def get_prefix(self, prefix: str, build_witness_hash: str) -> StorageEvidence:
        """
        Get all keys with given prefix as Evidence.
        
        Constitutional requirements:
        - Returns StorageEvidence with dict in metadata
        - Canonical sorted keys
        """
        pass
    
    @abstractmethod
    async def transaction(self, operations: List[Dict[str, Any]], build_witness_hash: str) -> StorageEvidence:
        """
        Execute multiple operations in a transaction as Evidence.
        
        Constitutional requirements:
        - Returns StorageEvidence
        - Atomic operation
        """
        pass
