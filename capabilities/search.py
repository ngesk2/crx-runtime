"""
SearchCapability - Contract for search operations.

This capability defines the contract for search operations.
Implementations (Rust, Python, etc.) must satisfy this contract.

The constitutional kernel uses this interface without knowing
the implementation details.

Phase 4: Uniform acquire() contract - all capabilities return Evidence IR.
Refinement 11: Canonical Request IR - immutable request models.
"""

from typing import Optional, Dict, Any, List
from abc import ABC, abstractmethod
from constitution.models.evidence import Evidence, EvidenceProvenance, SearchEvidence
from constitution.models.request import SearchRequest


class SearchCapability(ABC):
    """
    Capability contract for search operations.
    
    Implementations must provide:
    - Deterministic behavior for constitutional operations
    - Canonical serialization for search results
    - Consistent ranking for same queries
    - Error handling that preserves constitutional integrity
    - All operations return Evidence IR
    """
    
    @abstractmethod
    async def acquire(self, request: SearchRequest, build_witness_hash: str) -> SearchEvidence:
        """
        Acquire search evidence.
        
        Request is a canonical, immutable, hashable SearchRequest.
        
        Constitutional requirements:
        - Returns SearchEvidence with full provenance
        - Deterministic for same request_hash
        - Includes acquisition witness
        - Includes capability witness
        - References build_witness_hash
        """
        pass
    
    # Convenience methods (deprecated - use acquire() directly)
    @abstractmethod
    async def index_document(self, document_id: str, content: str, metadata: Optional[Dict[str, Any]], build_witness_hash: str) -> SearchEvidence:
        """
        Index a document for search as Evidence.
        
        Constitutional requirements:
        - Returns SearchEvidence
        - Atomic operation
        - Deterministic indexing
        """
        pass
    
    @abstractmethod
    async def search(self, query: str, limit: int, build_witness_hash: str) -> SearchEvidence:
        """
        Search for documents matching query as Evidence.
        
        Constitutional requirements:
        - Returns SearchEvidence with results in metadata
        - Deterministic ranking for same query
        - Canonical sorted results
        """
        pass
    
    @abstractmethod
    async def delete_document(self, document_id: str, build_witness_hash: str) -> SearchEvidence:
        """
        Delete document from index as Evidence.
        
        Constitutional requirements:
        - Returns SearchEvidence
        - Atomic operation
        - Idempotent
        """
        pass
    
    @abstractmethod
    async def get_document(self, document_id: str, build_witness_hash: str) -> SearchEvidence:
        """
        Get document by ID as Evidence.
        
        Constitutional requirements:
        - Returns SearchEvidence with document in metadata
        - Deterministic for same document_id
        """
        pass
    
    @abstractmethod
    async def vector_search(self, vector: List[float], limit: int, build_witness_hash: str) -> SearchEvidence:
        """
        Search by vector similarity as Evidence.
        
        Constitutional requirements:
        - Returns SearchEvidence with results in metadata
        - Deterministic ranking for same vector
        - Canonical sorted results
        """
        pass
