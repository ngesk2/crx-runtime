"""
Artifact Ontology - First-class constitutional citizens.

Artifacts shouldn't just be files. They should become first-class constitutional citizens.

Artifact Types:
- Document
- Evidence
- Source
- Plan
- Mission
- Binary
- Config
- Snapshot
- Transcript
- Memory
- Policy
- Law

Each has:
- ownership
- immutability
- lineage
- signature
- schema
- verification

Then replay becomes much easier.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import json
import uuid
import hashlib
from pathlib import Path


class ArtifactType(Enum):
    """Types of artifacts."""
    DOCUMENT = "document"
    EVIDENCE = "evidence"
    SOURCE = "source"
    PLAN = "plan"
    MISSION = "mission"
    BINARY = "binary"
    CONFIG = "config"
    SNAPSHOT = "snapshot"
    TRANSCRIPT = "transcript"
    MEMORY = "memory"
    POLICY = "policy"
    LAW = "law"


class ArtifactState(Enum):
    """States of an artifact."""
    CREATED = "created"
    VERIFIED = "verified"
    SIGNED = "signed"
    ARCHIVED = "archived"
    INVALID = "invalid"


@dataclass
class ArtifactLineage:
    """Lineage information for an artifact."""
    parent_artifact_ids: List[str]
    derivation_type: str  # created_from, transformed_from, derived_from
    transformation_description: str
    provenance: Dict[str, Any]


@dataclass
class ArtifactSignature:
    """Signature information for an artifact."""
    signature_algorithm: str  # SHA256, Ed25519, etc.
    signature_value: str
    signed_by: str
    signed_at: str
    public_key: Optional[str]


@dataclass
class ArtifactSchema:
    """Schema information for an artifact."""
    schema_id: str
    schema_version: str
    schema_definition: Dict[str, Any]
    validation_rules: List[str]


@dataclass
class ArtifactVerification:
    """Verification information for an artifact."""
    verification_id: str
    verification_method: str
    verified_at: str
    verified_by: str
    verification_result: bool
    verification_details: Dict[str, Any]


@dataclass
class ConstitutionalArtifact:
    """
    A constitutional artifact - first-class citizen.
    
    Artifacts have:
    - ownership
    - immutability
    - lineage
    - signature
    - schema
    - verification
    """
    artifact_id: str
    artifact_type: ArtifactType
    artifact_name: str
    description: str
    
    # Content
    content_hash: str
    content_uri: str  # Where the actual content is stored
    content_size_bytes: int
    content_mime_type: str
    
    # Ownership
    owner_id: str
    owner_type: str  # mission, agent, system
    created_by: str
    created_at: str
    
    # Immutability
    immutable: bool
    immutable_since: Optional[str]
    
    # Lineage
    lineage: ArtifactLineage
    
    # Signature
    signature: Optional[ArtifactSignature]
    
    # Schema
    schema: Optional[ArtifactSchema]
    
    # Verification
    verifications: List[ArtifactVerification]
    current_state: ArtifactState
    
    # Metadata
    metadata: Dict[str, Any]
    
    def is_immutable(self) -> bool:
        """Check if artifact is immutable."""
        return self.immutable
    
    def is_verified(self) -> bool:
        """Check if artifact has been verified."""
        return any(v.verification_result for v in self.verifications)
    
    def get_latest_verification(self) -> Optional[ArtifactVerification]:
        """Get the latest verification."""
        if not self.verifications:
            return None
        return max(self.verifications, key=lambda v: v.verified_at)
    
    def verify_content(self, content: bytes) -> bool:
        """Verify content against hash."""
        content_hash = hashlib.sha256(content).hexdigest()
        return content_hash == self.content_hash
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "artifact_id": self.artifact_id,
            "artifact_type": self.artifact_type.value,
            "artifact_name": self.artifact_name,
            "description": self.description,
            "content_hash": self.content_hash,
            "content_uri": self.content_uri,
            "content_size_bytes": self.content_size_bytes,
            "content_mime_type": self.content_mime_type,
            "owner_id": self.owner_id,
            "owner_type": self.owner_type,
            "created_by": self.created_by,
            "created_at": self.created_at,
            "immutable": self.immutable,
            "immutable_since": self.immutable_since,
            "lineage": {
                "parent_artifact_ids": self.lineage.parent_artifact_ids,
                "derivation_type": self.lineage.derivation_type,
                "transformation_description": self.lineage.transformation_description,
                "provenance": self.lineage.provenance
            },
            "signature": {
                "signature_algorithm": self.signature.signature_algorithm,
                "signature_value": self.signature.signature_value,
                "signed_by": self.signature.signed_by,
                "signed_at": self.signature.signed_at,
                "public_key": self.signature.public_key
            } if self.signature else None,
            "schema": {
                "schema_id": self.schema.schema_id,
                "schema_version": self.schema.schema_version,
                "schema_definition": self.schema.schema_definition,
                "validation_rules": self.schema.validation_rules
            } if self.schema else None,
            "verifications": [
                {
                    "verification_id": v.verification_id,
                    "verification_method": v.verification_method,
                    "verified_at": v.verified_at,
                    "verified_by": v.verified_by,
                    "verification_result": v.verification_result,
                    "verification_details": v.verification_details
                }
                for v in self.verifications
            ],
            "current_state": self.current_state.value,
            "metadata": self.metadata
        }


class ArtifactRegistry:
    """
    Registry for constitutional artifacts.
    
    Manages artifact lifecycle, verification, and lineage tracking.
    """
    
    def __init__(self, storage_path: str = "runtime/artifacts/registry.json"):
        self.storage_path = Path(storage_path)
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        self._artifacts: Dict[str, ConstitutionalArtifact] = {}
        self._load()
    
    def _load(self) -> None:
        """Load artifacts from storage."""
        if not self.storage_path.exists():
            return
        
        with open(self.storage_path, 'r') as f:
            data = json.load(f)
            
            for artifact_data in data.get("artifacts", []):
                lineage = ArtifactLineage(
                    parent_artifact_ids=artifact_data["lineage"]["parent_artifact_ids"],
                    derivation_type=artifact_data["lineage"]["derivation_type"],
                    transformation_description=artifact_data["lineage"]["transformation_description"],
                    provenance=artifact_data["lineage"]["provenance"]
                )
                
                signature = None
                if artifact_data.get("signature"):
                    signature = ArtifactSignature(
                        signature_algorithm=artifact_data["signature"]["signature_algorithm"],
                        signature_value=artifact_data["signature"]["signature_value"],
                        signed_by=artifact_data["signature"]["signed_by"],
                        signed_at=artifact_data["signature"]["signed_at"],
                        public_key=artifact_data["signature"].get("public_key")
                    )
                
                schema = None
                if artifact_data.get("schema"):
                    schema = ArtifactSchema(
                        schema_id=artifact_data["schema"]["schema_id"],
                        schema_version=artifact_data["schema"]["schema_version"],
                        schema_definition=artifact_data["schema"]["schema_definition"],
                        validation_rules=artifact_data["schema"]["validation_rules"]
                    )
                
                verifications = [
                    ArtifactVerification(
                        verification_id=v["verification_id"],
                        verification_method=v["verification_method"],
                        verified_at=v["verified_at"],
                        verified_by=v["verified_by"],
                        verification_result=v["verification_result"],
                        verification_details=v["verification_details"]
                    )
                    for v in artifact_data["verifications"]
                ]
                
                artifact = ConstitutionalArtifact(
                    artifact_id=artifact_data["artifact_id"],
                    artifact_type=ArtifactType(artifact_data["artifact_type"]),
                    artifact_name=artifact_data["artifact_name"],
                    description=artifact_data["description"],
                    content_hash=artifact_data["content_hash"],
                    content_uri=artifact_data["content_uri"],
                    content_size_bytes=artifact_data["content_size_bytes"],
                    content_mime_type=artifact_data["content_mime_type"],
                    owner_id=artifact_data["owner_id"],
                    owner_type=artifact_data["owner_type"],
                    created_by=artifact_data["created_by"],
                    created_at=artifact_data["created_at"],
                    immutable=artifact_data["immutable"],
                    immutable_since=artifact_data.get("immutable_since"),
                    lineage=lineage,
                    signature=signature,
                    schema=schema,
                    verifications=verifications,
                    current_state=ArtifactState(artifact_data["current_state"]),
                    metadata=artifact_data.get("metadata", {})
                )
                
                self._artifacts[artifact.artifact_id] = artifact
    
    def _save(self) -> None:
        """Save artifacts to storage."""
        data = {
            "artifacts": [artifact.to_dict() for artifact in self._artifacts.values()],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        with open(self.storage_path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def register_artifact(
        self,
        artifact_type: ArtifactType,
        artifact_name: str,
        description: str,
        content: bytes,
        content_uri: str,
        owner_id: str,
        owner_type: str = "mission",
        created_by: str = "system",
        parent_artifact_ids: Optional[List[str]] = None,
        immutable: bool = True,
        schema: Optional[ArtifactSchema] = None
    ) -> ConstitutionalArtifact:
        """
        Register a new artifact.
        
        Args:
            artifact_type: Type of artifact
            artifact_name: Name of artifact
            description: Description
            content: Content bytes
            content_uri: URI where content is stored
            owner_id: Owner ID
            owner_type: Type of owner
            created_by: Creator
            parent_artifact_ids: Parent artifact IDs for lineage
            immutable: Whether artifact is immutable
            schema: Schema for validation
        
        Returns:
            Registered artifact
        """
        artifact_id = str(uuid.uuid4())
        content_hash = hashlib.sha256(content).hexdigest()
        
        lineage = ArtifactLineage(
            parent_artifact_ids=parent_artifact_ids or [],
            derivation_type="created",
            transformation_description="Initial creation",
            provenance={"created_by": created_by}
        )
        
        artifact = ConstitutionalArtifact(
            artifact_id=artifact_id,
            artifact_type=artifact_type,
            artifact_name=artifact_name,
            description=description,
            content_hash=content_hash,
            content_uri=content_uri,
            content_size_bytes=len(content),
            content_mime_type="application/octet-stream",
            owner_id=owner_id,
            owner_type=owner_type,
            created_by=created_by,
            created_at=datetime.now(timezone.utc).isoformat(),
            immutable=immutable,
            immutable_since=datetime.now(timezone.utc).isoformat() if immutable else None,
            lineage=lineage,
            signature=None,
            schema=schema,
            verifications=[],
            current_state=ArtifactState.CREATED,
            metadata={}
        )
        
        self._artifacts[artifact_id] = artifact
        self._save()
        
        return artifact
    
    def add_verification(
        self,
        artifact_id: str,
        verification_method: str,
        verified_by: str,
        verification_result: bool,
        verification_details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Add verification to an artifact."""
        artifact = self._artifacts.get(artifact_id)
        if not artifact:
            raise ValueError(f"Artifact {artifact_id} not found")
        
        verification = ArtifactVerification(
            verification_id=str(uuid.uuid4()),
            verification_method=verification_method,
            verified_at=datetime.now(timezone.utc).isoformat(),
            verified_by=verified_by,
            verification_result=verification_result,
            verification_details=verification_details or {}
        )
        
        artifact.verifications.append(verification)
        
        if verification_result:
            artifact.current_state = ArtifactState.VERIFIED
        
        self._save()
    
    def sign_artifact(
        self,
        artifact_id: str,
        signature_algorithm: str,
        signature_value: str,
        signed_by: str,
        public_key: Optional[str] = None
    ) -> None:
        """Sign an artifact."""
        artifact = self._artifacts.get(artifact_id)
        if not artifact:
            raise ValueError(f"Artifact {artifact_id} not found")
        
        if artifact.immutable:
            raise ValueError(f"Cannot sign immutable artifact {artifact_id}")
        
        artifact.signature = ArtifactSignature(
            signature_algorithm=signature_algorithm,
            signature_value=signature_value,
            signed_by=signed_by,
            signed_at=datetime.now(timezone.utc).isoformat(),
            public_key=public_key
        )
        
        artifact.current_state = ArtifactState.SIGNED
        self._save()
    
    def get_artifact(self, artifact_id: str) -> Optional[ConstitutionalArtifact]:
        """Get artifact by ID."""
        return self._artifacts.get(artifact_id)
    
    def get_artifacts_by_type(self, artifact_type: ArtifactType) -> List[ConstitutionalArtifact]:
        """Get all artifacts of a specific type."""
        return [
            artifact for artifact in self._artifacts.values()
            if artifact.artifact_type == artifact_type
        ]
    
    def get_artifacts_by_owner(self, owner_id: str) -> List[ConstitutionalArtifact]:
        """Get all artifacts owned by a specific owner."""
        return [
            artifact for artifact in self._artifacts.values()
            if artifact.owner_id == owner_id
        ]
    
    def get_lineage(self, artifact_id: str) -> List[ConstitutionalArtifact]:
        """Get the full lineage of an artifact."""
        lineage = []
        current = self._artifacts.get(artifact_id)
        
        while current:
            lineage.append(current)
            
            # Get parents
            for parent_id in current.lineage.parent_artifact_ids:
                parent = self._artifacts.get(parent_id)
                if parent and parent not in lineage:
                    current = parent
                    break
            else:
                break
        
        return list(reversed(lineage))
    
    def verify_lineage_integrity(self, artifact_id: str) -> bool:
        """Verify that the lineage chain is intact."""
        lineage = self.get_lineage(artifact_id)
        
        for i in range(len(lineage) - 1):
            child = lineage[i + 1]
            parent = lineage[i]
            
            # Verify parent is in child's lineage
            if parent.artifact_id not in child.lineage.parent_artifact_ids:
                return False
        
        return True


class ArtifactBuilder:
    """
    Builder for creating artifacts.
    """
    
    def __init__(self):
        self._artifact_type = None
        self._artifact_name = ""
        self._description = ""
        self._content = b""
        self._content_uri = ""
        self._owner_id = ""
        self._owner_type = "mission"
        self._created_by = "system"
        self._parent_artifact_ids: List[str] = []
        self._immutable = True
        self._schema = None
    
    def with_type(self, artifact_type: ArtifactType) -> 'ArtifactBuilder':
        """Set artifact type."""
        self._artifact_type = artifact_type
        return self
    
    def with_name(self, name: str) -> 'ArtifactBuilder':
        """Set artifact name."""
        self._artifact_name = name
        return self
    
    def with_description(self, description: str) -> 'ArtifactBuilder':
        """Set description."""
        self._description = description
        return self
    
    def with_content(self, content: bytes, uri: str) -> 'ArtifactBuilder':
        """Set content."""
        self._content = content
        self._content_uri = uri
        return self
    
    def with_owner(self, owner_id: str, owner_type: str = "mission") -> 'ArtifactBuilder':
        """Set owner."""
        self._owner_id = owner_id
        self._owner_type = owner_type
        return self
    
    def with_parent(self, parent_id: str) -> 'ArtifactBuilder':
        """Add parent artifact."""
        self._parent_artifact_ids.append(parent_id)
        return self
    
    def with_immutability(self, immutable: bool) -> 'ArtifactBuilder':
        """Set immutability."""
        self._immutable = immutable
        return self
    
    def with_schema(self, schema: ArtifactSchema) -> 'ArtifactBuilder':
        """Set schema."""
        self._schema = schema
        return self
    
    def build(self, registry: ArtifactRegistry) -> ConstitutionalArtifact:
        """Build and register the artifact."""
        return registry.register_artifact(
            artifact_type=self._artifact_type,
            artifact_name=self._artifact_name,
            description=self._description,
            content=self._content,
            content_uri=self._content_uri,
            owner_id=self._owner_id,
            owner_type=self._owner_type,
            created_by=self._created_by,
            parent_artifact_ids=self._parent_artifact_ids,
            immutable=self._immutable,
            schema=self._schema
        )


# Singleton instance
_artifact_registry = ArtifactRegistry()


def get_artifact_registry() -> ArtifactRegistry:
    """Get the singleton artifact registry."""
    return _artifact_registry
