"""
Canonical Artifact IR - Universal data contract for constitutional runtime.

Every capability must return CanonicalArtifact IR.
Nothing enters the kernel except CanonicalArtifact.

CanonicalArtifact structure:
- artifactId: Unique identifier
- artifactType: Type of artifact (filesystem, network, storage, etc.)
- canonicalBytes: Canonical serialization of artifact data
- metadata: Artifact metadata
- provenance: Acquisition provenance (capability, implementation, host, timestamp, etc.)
- acquisitionWitness: Hash of acquisition operation
- capabilityWitness: Hash of capability state during acquisition
- buildWitness: Hash of BuildWitness used during acquisition
- constitutionalHash: Constitutional hash of entire CanonicalArtifact object

Evidence is a specialization of CanonicalArtifact.
"""

from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from constitution.hashing import CanonicalHasher


class AcquisitionProvenance(BaseModel):
    """Acquisition-level provenance"""
    
    operation: str = Field(..., description="Operation performed (read, write, query, etc.)")
    acquired_at: datetime = Field(..., description="When artifact was acquired")
    acquisition_hash: str = Field(..., description="Hash of acquisition operation")
    
    class Config:
        frozen = True


class PlatformProvenance(BaseModel):
    """Platform-level provenance"""
    
    platform: str = Field(..., description="Platform (Windows NTFS, Linux ext4, etc.)")
    host: Optional[str] = Field(None, description="Host where acquisition occurred")
    device: Optional[str] = Field(None, description="Device identifier")
    
    class Config:
        frozen = True


class ImplementationProvenance(BaseModel):
    """Implementation-level provenance"""
    
    implementation: str = Field(..., description="Implementation (rust, python, etc.)")
    version: Optional[str] = Field(None, description="Implementation version")
    platform: PlatformProvenance = Field(..., description="Platform details")
    
    class Config:
        frozen = True


class CapabilityProvenance(BaseModel):
    """Capability-level provenance (hierarchical: Capability → Implementation → Acquisition → Platform)"""
    
    capability: str = Field(..., description="Capability type (filesystem, network, storage, etc.)")
    implementation: ImplementationProvenance = Field(..., description="Implementation details")
    acquisition: AcquisitionProvenance = Field(..., description="Acquisition details")
    
    # Capability-specific provenance fields
    path: Optional[str] = Field(None, description="Filesystem path")
    endpoint: Optional[str] = Field(None, description="Network endpoint")
    object_id: Optional[str] = Field(None, description="Storage object ID")
    query: Optional[str] = Field(None, description="Search query or connector query")
    status: Optional[int] = Field(None, description="HTTP status code")
    headers_hash: Optional[str] = Field(None, description="Hash of HTTP headers")
    tls_fingerprint: Optional[str] = Field(None, description="TLS fingerprint")
    version: Optional[str] = Field(None, description="Storage version")
    storage_witness: Optional[str] = Field(None, description="Storage witness hash")
    
    class Config:
        frozen = True


class CanonicalArtifact(BaseModel):
    """
    Canonical Artifact IR - universal data contract.
    
    Every capability must return CanonicalArtifact.
    Nothing enters the kernel except CanonicalArtifact.
    
    Filesystem bytes, HTTP responses, connector payloads, search results,
    and database rows are all artifacts. Evidence is a specialization.
    """
    
    artifact_id: str = Field(..., description="Unique artifact identifier")
    artifact_type: str = Field(..., description="Type of artifact (filesystem, network, storage, etc.)")
    
    canonical_bytes: str = Field(..., description="Canonical serialization of artifact data")
    
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Artifact metadata")
    provenance: CapabilityProvenance = Field(..., description="Acquisition provenance")
    
    acquisition_witness: str = Field(..., description="Hash of acquisition operation")
    capability_witness: str = Field(..., description="Hash of capability state during acquisition")
    build_witness: str = Field(..., description="Hash of BuildWitness used during acquisition")
    constitutional_hash: str = Field(..., description="Constitutional hash of entire CanonicalArtifact object")
    
    class Config:
        frozen = True
    
    @classmethod
    def create(
        cls,
        artifact_type: str,
        canonical_bytes: str,
        provenance: CapabilityProvenance,
        acquisition_witness: str,
        capability_witness: str,
        build_witness: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> "CanonicalArtifact":
        """Factory method to create CanonicalArtifact with computed hashes"""
        # Compute constitutional hash
        artifact_input = {
            "artifact_type": artifact_type,
            "canonical_bytes": canonical_bytes,
            "provenance": provenance.dict(),
            "acquisition_witness": acquisition_witness,
            "capability_witness": capability_witness,
            "build_witness": build_witness,
        }
        constitutional_hash = CanonicalHasher.hash_dict(artifact_input)
        
        # Compute artifact ID
        artifact_id_input = {
            "artifact_type": artifact_type,
            "constitutional_hash": constitutional_hash,
            "acquired_at": provenance.acquisition.acquired_at.isoformat(),
        }
        artifact_id = CanonicalHasher.hash_dict(artifact_id_input)
        
        return cls(
            artifact_id=artifact_id,
            artifact_type=artifact_type,
            canonical_bytes=canonical_bytes,
            metadata=metadata or {},
            provenance=provenance,
            acquisition_witness=acquisition_witness,
            capability_witness=capability_witness,
            build_witness=build_witness,
            constitutional_hash=constitutional_hash,
        )
    
    def verify_constitutional_hash(self) -> bool:
        """Verify that constitutional_hash matches current state"""
        artifact_input = {
            "artifact_type": self.artifact_type,
            "canonical_bytes": self.canonical_bytes,
            "provenance": self.provenance.dict(),
            "acquisition_witness": self.acquisition_witness,
            "capability_witness": self.capability_witness,
            "build_witness": self.build_witness,
        }
        computed_hash = CanonicalHasher.hash_dict(artifact_input)
        return computed_hash == self.constitutional_hash
    
    def verify_build_witness(self, current_build_witness_hash: str) -> bool:
        """Verify that artifact was acquired with current BuildWitness"""
        return self.build_witness == current_build_witness_hash


# Evidence is a specialization of CanonicalArtifact for IO operations
class Evidence(CanonicalArtifact):
    """Evidence from IO operations (specialization of CanonicalArtifact)"""
    
    artifact_type: str = Field(default="evidence", description="Evidence artifact")


class FilesystemEvidence(Evidence):
    """Evidence from filesystem capability"""
    
    artifact_type: str = Field(default="filesystem", description="Filesystem evidence")


class NetworkEvidence(Evidence):
    """Evidence from network capability"""
    
    artifact_type: str = Field(default="network", description="Network evidence")


class StorageEvidence(Evidence):
    """Evidence from storage capability"""
    
    artifact_type: str = Field(default="storage", description="Storage evidence")


class SearchEvidence(Evidence):
    """Evidence from search capability"""
    
    artifact_type: str = Field(default="search", description="Search evidence")


class ConnectorEvidence(Evidence):
    """Evidence from connector capability"""
    
    artifact_type: str = Field(default="connector", description="Connector evidence")
