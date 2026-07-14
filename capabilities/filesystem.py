"""
FilesystemCapability - Contract for filesystem operations.

This capability defines the contract for filesystem operations.
Implementations (Rust, Python, etc.) must satisfy this contract.

The constitutional kernel uses this interface without knowing
the implementation details.

Phase 4: Uniform acquire() contract - all capabilities return Evidence IR.
Refinement 11: Canonical Request IR - immutable request models.
"""

from typing import Optional, Dict, Any
from pathlib import Path
from abc import ABC, abstractmethod
from constitution.models.evidence import Evidence, EvidenceProvenance, FilesystemEvidence
from constitution.models.request import FilesystemRequest


class FilesystemCapability(ABC):
    """
    Capability contract for filesystem operations.
    
    Implementations must provide:
    - Deterministic behavior for constitutional operations
    - Canonical serialization for file metadata
    - Atomic operations where required
    - Error handling that preserves constitutional integrity
    - All operations return Evidence IR
    """
    
    @abstractmethod
    async def acquire(self, request: FilesystemRequest, build_witness_hash: str) -> FilesystemEvidence:
        """
        Acquire filesystem evidence.
        
        Request is a canonical, immutable, hashable FilesystemRequest.
        
        Constitutional requirements:
        - Returns FilesystemEvidence with full provenance
        - Deterministic for same request_hash
        - Includes acquisition witness
        - Includes capability witness
        - References build_witness_hash
        """
        pass
    
    # Convenience methods (deprecated - use acquire() directly)
    @abstractmethod
    async def read_file(self, path: Path, build_witness_hash: str) -> FilesystemEvidence:
        """
        Read file contents as Evidence.
        
        Constitutional requirements:
        - Returns FilesystemEvidence
        - Deterministic for same path
        """
        pass
    
    @abstractmethod
    async def write_file(self, path: Path, content: bytes, build_witness_hash: str) -> FilesystemEvidence:
        """
        Write file contents as Evidence.
        
        Constitutional requirements:
        - Returns FilesystemEvidence
        - Atomic write (either complete or fail)
        """
        pass
    
    @abstractmethod
    async def file_exists(self, path: Path, build_witness_hash: str) -> FilesystemEvidence:
        """
        Check if file exists as Evidence.
        
        Constitutional requirements:
        - Returns FilesystemEvidence with boolean result in metadata
        - Deterministic result
        """
        pass
    
    @abstractmethod
    async def delete_file(self, path: Path, build_witness_hash: str) -> FilesystemEvidence:
        """
        Delete file as Evidence.
        
        Constitutional requirements:
        - Returns FilesystemEvidence
        - Atomic operation
        - Idempotent
        """
        pass
    
    @abstractmethod
    async def list_directory(self, path: Path, build_witness_hash: str) -> FilesystemEvidence:
        """
        List directory contents as Evidence.
        
        Constitutional requirements:
        - Returns FilesystemEvidence with list in metadata
        - Deterministic ordering (canonical sort)
        """
        pass
    
    @abstractmethod
    async def create_directory(self, path: Path, build_witness_hash: str) -> FilesystemEvidence:
        """
        Create directory as Evidence.
        
        Constitutional requirements:
        - Returns FilesystemEvidence
        - Idempotent
        """
        pass
    
    @abstractmethod
    async def get_file_hash(self, path: Path, build_witness_hash: str) -> FilesystemEvidence:
        """
        Get canonical hash of file contents as Evidence.
        
        Constitutional requirements:
        - Returns FilesystemEvidence with hash in metadata
        - Deterministic for same contents
        """
        pass
    
    @abstractmethod
    async def get_file_metadata(self, path: Path, build_witness_hash: str) -> FilesystemEvidence:
        """
        Get file metadata as Evidence.
        
        Constitutional requirements:
        - Returns FilesystemEvidence with metadata in metadata
        - Deterministic for same file
        """
        pass
