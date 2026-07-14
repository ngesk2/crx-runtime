"""
MediaCapability - Contract for media operations.

This capability defines the contract for media operations.
Implementations (Rust, Python, etc.) must satisfy this contract.

The constitutional kernel uses this interface without knowing
the implementation details.

Phase 4: Uniform acquire() contract - all capabilities return Evidence IR.
Refinement 11: Canonical Request IR - immutable request models.
"""

from typing import Optional, Dict, Any
from abc import ABC, abstractmethod
from constitution.models.evidence import Evidence, EvidenceProvenance
from constitution.models.request import MediaRequest


class MediaCapability(ABC):
    """
    Capability contract for media operations.
    
    Implementations must provide:
    - Deterministic behavior for constitutional operations
    - Canonical serialization for media data
    - Consistent processing for same inputs
    - Error handling that preserves constitutional integrity
    - All operations return Evidence IR
    """
    
    @abstractmethod
    async def acquire(self, request: MediaRequest, build_witness_hash: str) -> Evidence:
        """
        Acquire media evidence.
        
        Request is a canonical, immutable, hashable MediaRequest.
        
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
    async def resize_image(self, image_data: bytes, width: int, height: int, build_witness_hash: str) -> Evidence:
        """
        Resize image to specified dimensions as Evidence.
        
        Constitutional requirements:
        - Returns Evidence with resized bytes
        - Deterministic output for same input
        """
        pass
    
    @abstractmethod
    async def compress_image(self, image_data: bytes, quality: int, build_witness_hash: str) -> Evidence:
        """
        Compress image with specified quality as Evidence.
        
        Constitutional requirements:
        - Returns Evidence with compressed bytes
        - Deterministic output for same input
        """
        pass
    
    @abstractmethod
    async def extract_audio(self, video_data: bytes, build_witness_hash: str) -> Evidence:
        """
        Extract audio track from video as Evidence.
        
        Constitutional requirements:
        - Returns Evidence with audio bytes
        - Deterministic output for same input
        """
        pass
    
    @abstractmethod
    async def transcode_video(self, video_data: bytes, format: str, build_witness_hash: str) -> Evidence:
        """
        Transcode video to specified format as Evidence.
        
        Constitutional requirements:
        - Returns Evidence with transcoded bytes
        - Deterministic output for same input
        """
        pass
    
    @abstractmethod
    async def get_media_metadata(self, media_data: bytes, build_witness_hash: str) -> Evidence:
        """
        Get media metadata as Evidence.
        
        Constitutional requirements:
        - Returns Evidence with metadata in metadata field
        - Deterministic for same media
        """
        pass
    
    @abstractmethod
    async def generate_thumbnail(self, media_data: bytes, timestamp: Optional[float], build_witness_hash: str) -> Evidence:
        """
        Generate thumbnail from media as Evidence.
        
        Constitutional requirements:
        - Returns Evidence with thumbnail bytes
        - Deterministic output for same input
        """
        pass
