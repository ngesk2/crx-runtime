"""
Canonical Artifact Repository - Centralized artifact storage.

This service handles all artifact operations:
- hash
- deduplicate
- persist
- emit event

Nothing writes artifacts directly.
"""

from typing import Any, Dict, Optional
from datetime import datetime, timedelta
from collections import OrderedDict
import hashlib
import time

from constitution.models.evidence import CanonicalArtifact
from hermes.runtime.event_bus import EventBus
from hermes.runtime.artifact_backend import ArtifactBackend, SQLiteArtifactBackend


class CanonicalArtifactRepository:
    """
    Centralized artifact repository.
    
    All artifact operations go through this service.
    Handles hashing, deduplication, persistence, and event emission.
    """
    
    def __init__(
        self,
        event_bus: Optional[EventBus] = None,
        backend: Optional[ArtifactBackend] = None,
        cache_size: int = 1000,
        cache_ttl: int = 3600
    ):
        self.event_bus = event_bus or EventBus()
        self.backend = backend or SQLiteArtifactBackend()
        self._cache_size = cache_size
        self._cache_ttl = cache_ttl  # TTL in seconds
        self._cache: OrderedDict[str, tuple[CanonicalArtifact, float]] = OrderedDict()  # artifact_id -> (artifact, timestamp)
    
    async def store(self, data: Any, mission_id: str) -> CanonicalArtifact:
        """
        Store artifact with hashing and deduplication.
        
        Args:
            data: Artifact data
            mission_id: Associated mission ID
        
        Returns:
            CanonicalArtifact
        """
        # Hash the data
        artifact_hash = self._hash_data(data)
        
        # Check cache for deduplication
        cached = self._get_from_cache(artifact_hash)
        if cached:
            return cached
        
        # Create canonical artifact
        artifact = self._create_artifact(data, artifact_hash, mission_id)
        
        # Serialize data for backend storage
        content = self._serialize_data(data)
        
        # Persist to backend
        await self.backend.store_blob(
            artifact_id=artifact.artifact_id,
            content=content
        )
        
        # Emit event
        await self.event_bus.emit("ArtifactStored", {
            "artifact_id": artifact.artifact_id,
            "mission_id": mission_id
        })
        
        # Cache the artifact
        self._add_to_cache(artifact)
        
        return artifact
    
    def _hash_data(self, data: Any) -> str:
        """Hash artifact data."""
        if isinstance(data, str):
            return hashlib.sha256(data.encode('utf-8')).hexdigest()
        elif isinstance(data, bytes):
            return hashlib.sha256(data).hexdigest()
        elif isinstance(data, dict):
            import json
            canonical = json.dumps(data, sort_keys=True, separators=(',', ':'))
            return hashlib.sha256(canonical.encode('utf-8')).hexdigest()
        else:
            return hashlib.sha256(str(data).encode('utf-8')).hexdigest()
    
    def _serialize_data(self, data: Any) -> bytes:
        """Serialize data for backend storage."""
        if isinstance(data, bytes):
            return data
        elif isinstance(data, str):
            return data.encode('utf-8')
        elif isinstance(data, dict):
            import json
            return json.dumps(data, sort_keys=True, separators=(',', ':')).encode('utf-8')
        else:
            return str(data).encode('utf-8')
    
    def _create_artifact(self, data: Any, artifact_hash: str, mission_id: str) -> CanonicalArtifact:
        """Create canonical artifact from data."""
        from constitution.models.evidence import (
            CapabilityProvenance, ImplementationProvenance,
            PlatformProvenance, AcquisitionProvenance
        )
        
        # Create provenance
        platform_provenance = PlatformProvenance(
            platform="Python",
            host=None,
            device=None
        )
        
        implementation_provenance = ImplementationProvenance(
            implementation="python",
            version="1.0.0",
            platform=platform_provenance
        )
        
        acquisition_provenance = AcquisitionProvenance(
            operation="store",
            acquired_at=datetime.utcnow(),
            acquisition_hash=artifact_hash
        )
        
        capability_provenance = CapabilityProvenance(
            capability="artifact_repository",
            implementation=implementation_provenance,
            acquisition=acquisition_provenance,
        )
        
        # Create artifact
        artifact_id = artifact_hash
        
        artifact = CanonicalArtifact(
            artifact_id=artifact_id,
            artifact_type="canonical",
            canonical_bytes=artifact_hash,
            metadata={
                "mission_id": mission_id,
                "stored_at": datetime.utcnow().isoformat()
            },
            provenance=capability_provenance,
            acquisition_witness=artifact_hash,
            capability_witness=artifact_hash,
            build_witness="",
            constitutional_hash=artifact_id,
        )
        
        return artifact
    
    async def retrieve(self, artifact_id: str) -> Optional[CanonicalArtifact]:
        """Retrieve artifact by ID."""
        # Check cache first
        cached = self._get_from_cache(artifact_id)
        if cached:
            return cached
        
        # Check backend
        content = await self.backend.load_blob(artifact_id)
        if content is None:
            return None
        
        # Reconstruct artifact from content
        # This is simplified - full reconstruction would need more data
        artifact = CanonicalArtifact(
            artifact_id=artifact_id,
            artifact_type="canonical",
            canonical_bytes=content.decode('utf-8') if isinstance(content, bytes) else str(content),
            metadata={},
            provenance=None,  # Would need to be stored/reconstructed
            acquisition_witness="",
            capability_witness="",
            build_witness="",
            constitutional_hash=artifact_id,
        )
        
        # Cache the artifact
        self._add_to_cache(artifact)
        
        return artifact
    
    async def list_by_mission(self, mission_id: str) -> list[CanonicalArtifact]:
        """List all artifacts for a mission."""
        artifact_ids = await self.backend.list_by_mission(mission_id)
        
        artifacts = []
        for artifact_id in artifact_ids:
            artifact = await self.retrieve(artifact_id)
            if artifact:
                artifacts.append(artifact)
        
        return artifacts
    
    def _get_from_cache(self, key: str) -> Optional[CanonicalArtifact]:
        """Get artifact from cache with TTL check."""
        if key not in self._cache:
            return None
        
        artifact, timestamp = self._cache[key]
        
        # Check TTL
        if time.time() - timestamp > self._cache_ttl:
            del self._cache[key]
            return None
        
        # Move to end for LRU (most recently used)
        self._cache.move_to_end(key)
        
        return artifact
    
    def _add_to_cache(self, artifact: CanonicalArtifact) -> None:
        """Add artifact to cache with LRU eviction."""
        key = artifact.artifact_id
        
        # Remove if exists to update position
        if key in self._cache:
            del self._cache[key]
        
        # Add to end (most recently used)
        self._cache[key] = (artifact, time.time())
        
        # Evict oldest if over size limit
        while len(self._cache) > self._cache_size:
            self._cache.popitem(last=False)
    
    def clear_cache(self) -> None:
        """Clear the artifact cache."""
        self._cache.clear()
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            "size": len(self._cache),
            "max_size": self._cache_size,
            "ttl": self._cache_ttl,
            "hit_rate": 0.0  # Would need to track hits/misses
        }
