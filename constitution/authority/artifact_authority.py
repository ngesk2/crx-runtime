"""Artifact Authority

Constitutional artifact authority using ArtifactEnvelope + factories.

Architecture:
ArtifactAuthority
  ↓
  ArtifactEnvelope (immutable envelope)
  ↓
  ArtifactType + ArtifactPayload + ArtifactMetadata
  ↓
  CanonicalBytes + CanonicalHash

Replaces inheritance with envelope pattern:
- No NotificationArtifact, ReplayArtifact, etc. subclasses
- Single ArtifactEnvelope with type field
- Factories create specific artifact payloads
- Adapters interpret type-specific semantics
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Callable
from enum import Enum

from constitution.authority.canonical_serializer import CanonicalSerializer, CanonicalBytes
from constitution.authority.hash_authority import HashAuthority, CanonicalHash


class ArtifactType(Enum):
    """Types of constitutional artifacts"""
    NOTIFICATION = "notification"
    REPLAY = "replay"
    BUILD = "build"
    WEBHOOK = "webhook"
    FAILURE = "failure"
    EVENT = "event"
    COMMAND = "command"
    CONFIGURATION = "configuration"
    PROJECTION = "projection"
    SNAPSHOT = "snapshot"


@dataclass(frozen=True)
class ArtifactId:
    """Immutable artifact identifier"""
    value: str
    
    def __str__(self) -> str:
        return self.value


@dataclass(frozen=True)
class ArtifactMetadata:
    """
    Immutable artifact metadata.
    
    Non-constitutional metadata for interpretation by adapters.
    """
    provider: str | None = None
    capability: str | None = None
    failure_code: str | None = None
    replay_id: str | None = None
    git_commit: str | None = None
    webhook_type: str | None = None
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary"""
        return {
            "provider": self.provider,
            "capability": self.capability,
            "failure_code": self.failure_code,
            "replay_id": self.replay_id,
            "git_commit": self.git_commit,
            "webhook_type": self.webhook_type,
        }


@dataclass(frozen=True)
class ArtifactEnvelope:
    """
    Immutable artifact envelope.
    
    Single constitutional artifact type with:
    - artifact_id (unique identifier)
    - artifact_type (type classification)
    - payload (type-specific data)
    - metadata (non-constitutional interpretation hints)
    - canonical_bytes (immutable bytes representation)
    - canonical_hash (SHA256 hash of canonical bytes)
    - created_at (creation timestamp)
    - authority_version (constitutional authority version)
    
    Replaces inheritance with envelope pattern.
    """
    artifact_id: ArtifactId
    artifact_type: ArtifactType
    payload: dict[str, Any]
    metadata: ArtifactMetadata
    canonical_bytes: CanonicalBytes
    canonical_hash: CanonicalHash
    created_at: datetime
    authority_version: str
    
    def to_dict(self) -> dict[str, Any]:
        """Convert envelope to dictionary for serialization"""
        return {
            "artifact_id": self.artifact_id.value,
            "artifact_type": self.artifact_type.value,
            "payload": self.payload,
            "metadata": self.metadata.to_dict(),
            "canonical_bytes": self.canonical_bytes.hex(),
            "canonical_hash": self.canonical_hash.value,
            "created_at": self.created_at.isoformat(),
            "authority_version": self.authority_version,
        }


class ArtifactFactory:
    """
    Factory for creating specific artifact payloads.
    
    Replaces subclass-specific create methods with factory methods.
    """
    
    @staticmethod
    def create_notification_payload(
        provider: str,
        provider_request_id: str,
        provider_response: dict[str, Any],
        build_witness_root_hash: str,
    ) -> dict[str, Any]:
        """Create notification artifact payload"""
        return {
            "provider": provider,
            "provider_request_id": provider_request_id,
            "provider_response": provider_response,
            "build_witness_root_hash": build_witness_root_hash,
        }
    
    @staticmethod
    def create_replay_payload(
        replay_id: str,
        state_hash: str,
        transcript_hash: str,
        event_count: int,
    ) -> dict[str, Any]:
        """Create replay artifact payload"""
        return {
            "replay_id": replay_id,
            "state_hash": state_hash,
            "transcript_hash": transcript_hash,
            "event_count": event_count,
        }
    
    @staticmethod
    def create_build_payload(
        git_commit: str,
        tool_registry_hash: str,
        workflow_registry_hash: str,
        prompt_registry_hash: str,
        agent_registry_hash: str,
        type_registry_hash: str,
        capability_registry_hash: str,
        kernel_constitution_hash: str,
    ) -> dict[str, Any]:
        """Create build artifact payload"""
        return {
            "git_commit": git_commit,
            "tool_registry_hash": tool_registry_hash,
            "workflow_registry_hash": workflow_registry_hash,
            "prompt_registry_hash": prompt_registry_hash,
            "agent_registry_hash": agent_registry_hash,
            "type_registry_hash": type_registry_hash,
            "capability_registry_hash": capability_registry_hash,
            "kernel_constitution_hash": kernel_constitution_hash,
        }
    
    @staticmethod
    def create_webhook_payload(
        provider: str,
        webhook_type: str,
        webhook_payload: dict[str, Any],
    ) -> dict[str, Any]:
        """Create webhook artifact payload"""
        return {
            "provider": provider,
            "webhook_type": webhook_type,
            "webhook_payload": webhook_payload,
        }
    
    @staticmethod
    def create_failure_payload(
        failure_code: str,
        failure_message: str,
        provider: str | None = None,
        capability: str | None = None,
    ) -> dict[str, Any]:
        """Create failure artifact payload"""
        return {
            "failure_code": failure_code,
            "failure_message": failure_message,
            "provider": provider,
            "capability": capability,
        }


class ArtifactAuthority:
    """
    Authority for creating constitutional artifacts using envelope pattern.
    
    Replaces inheritance with ArtifactEnvelope + factories.
    
    Architecture:
    ArtifactAuthority
      ↓
      ArtifactFactory (creates payloads)
      ↓
      ArtifactEnvelope (immutable envelope)
      ↓
      CanonicalBytes + CanonicalHash
    """
    
    def __init__(
        self,
        authority_version: str = "1.0.0",
        serializer: CanonicalSerializer | None = None,
        hash_authority: HashAuthority | None = None,
    ):
        self.authority_version = authority_version
        self.serializer = serializer or CanonicalSerializer()
        self.hash_authority = hash_authority or HashAuthority()
        self.factory = ArtifactFactory()
    
    def create_envelope(
        self,
        artifact_type: ArtifactType,
        payload: dict[str, Any],
        metadata: ArtifactMetadata,
    ) -> ArtifactEnvelope:
        """
        Create artifact envelope from payload and metadata.
        
        Payload + Metadata → CanonicalSerializer → CanonicalBytes → Hash → ArtifactEnvelope
        """
        # Serialize payload to canonical bytes
        canonical_bytes = self.serializer.serialize(payload)
        
        # Hash canonical bytes
        canonical_hash = self.hash_authority.hash_bytes(canonical_bytes.value)
        
        # Generate artifact ID from hash
        artifact_id = ArtifactId(value=canonical_hash.value)
        
        return ArtifactEnvelope(
            artifact_id=artifact_id,
            artifact_type=artifact_type,
            payload=payload,
            metadata=metadata,
            canonical_bytes=canonical_bytes,
            canonical_hash=canonical_hash,
            created_at=datetime.utcnow(),
            authority_version=self.authority_version,
        )
    
    def create_notification_artifact(
        self,
        provider: str,
        provider_request_id: str,
        provider_response: dict[str, Any],
        build_witness_root_hash: str,
    ) -> ArtifactEnvelope:
        """Create notification artifact envelope"""
        payload = self.factory.create_notification_payload(
            provider=provider,
            provider_request_id=provider_request_id,
            provider_response=provider_response,
            build_witness_root_hash=build_witness_root_hash,
        )
        metadata = ArtifactMetadata(provider=provider)
        
        return self.create_envelope(
            artifact_type=ArtifactType.NOTIFICATION,
            payload=payload,
            metadata=metadata,
        )
    
    def create_replay_artifact(
        self,
        replay_id: str,
        state_hash: str,
        transcript_hash: str,
        event_count: int,
    ) -> ArtifactEnvelope:
        """Create replay artifact envelope"""
        payload = self.factory.create_replay_payload(
            replay_id=replay_id,
            state_hash=state_hash,
            transcript_hash=transcript_hash,
            event_count=event_count,
        )
        metadata = ArtifactMetadata(replay_id=replay_id)
        
        return self.create_envelope(
            artifact_type=ArtifactType.REPLAY,
            payload=payload,
            metadata=metadata,
        )
    
    def create_build_artifact(
        self,
        git_commit: str,
        tool_registry_hash: str,
        workflow_registry_hash: str,
        prompt_registry_hash: str,
        agent_registry_hash: str,
        type_registry_hash: str,
        capability_registry_hash: str,
        kernel_constitution_hash: str,
    ) -> ArtifactEnvelope:
        """Create build artifact envelope"""
        payload = self.factory.create_build_payload(
            git_commit=git_commit,
            tool_registry_hash=tool_registry_hash,
            workflow_registry_hash=workflow_registry_hash,
            prompt_registry_hash=prompt_registry_hash,
            agent_registry_hash=agent_registry_hash,
            type_registry_hash=type_registry_hash,
            capability_registry_hash=capability_registry_hash,
            kernel_constitution_hash=kernel_constitution_hash,
        )
        metadata = ArtifactMetadata(git_commit=git_commit)
        
        return self.create_envelope(
            artifact_type=ArtifactType.BUILD,
            payload=payload,
            metadata=metadata,
        )
    
    def create_webhook_artifact(
        self,
        provider: str,
        webhook_type: str,
        webhook_payload: dict[str, Any],
    ) -> ArtifactEnvelope:
        """Create webhook artifact envelope"""
        payload = self.factory.create_webhook_payload(
            provider=provider,
            webhook_type=webhook_type,
            webhook_payload=webhook_payload,
        )
        metadata = ArtifactMetadata(provider=provider, webhook_type=webhook_type)
        
        return self.create_envelope(
            artifact_type=ArtifactType.WEBHOOK,
            payload=payload,
            metadata=metadata,
        )
    
    def create_failure_artifact(
        self,
        failure_code: str,
        failure_message: str,
        provider: str | None = None,
        capability: str | None = None,
    ) -> ArtifactEnvelope:
        """Create failure artifact envelope"""
        payload = self.factory.create_failure_payload(
            failure_code=failure_code,
            failure_message=failure_message,
            provider=provider,
            capability=capability,
        )
        metadata = ArtifactMetadata(
            failure_code=failure_code,
            provider=provider,
            capability=capability,
        )
        
        return self.create_envelope(
            artifact_type=ArtifactType.FAILURE,
            payload=payload,
            metadata=metadata,
        )
