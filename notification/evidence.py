"""Notification Evidence

Constitutional evidence object - provider-agnostic.

Architecture:
ArtifactEnvelope (constitutional)
  ↓
NotificationEvidence (constitutional envelope)
  ↓
ProviderAdapter (interprets provider-specific fields)

Evidence should expose:
Artifact ↓ Constitutional Evidence ↓ Adapters interpret provider-specific fields

Otherwise NotificationEvidence still "knows" Kit/Twilio vocabulary.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any

from constitution.authority.artifact_authority import ArtifactEnvelope, ArtifactAuthority


@dataclass(frozen=True)
class NotificationEvidence:
    """
    Constitutional evidence object - provider-agnostic.
    
    Contains only constitutional information:
    - artifact (constitutional envelope)
    - correlation_id (causal tracking)
    - causality_id (causal tracking)
    - timestamp (when evidence was created)
    
    Provider-specific interpretation is handled by adapters, not by evidence.
    """
    
    artifact: ArtifactEnvelope
    correlation_id: str | None = None
    causality_id: str | None = None
    timestamp: datetime | None = None
    
    @property
    def artifact_id(self) -> str:
        """Get artifact ID"""
        return self.artifact.artifact_id.value
    
    @property
    def artifact_type(self) -> str:
        """Get artifact type"""
        return self.artifact.artifact_type.value
    
    @property
    def canonical_hash(self) -> str:
        """Get canonical hash from artifact"""
        return self.artifact.canonical_hash.value
    
    @property
    def canonical_bytes(self) -> bytes:
        """Get canonical bytes from artifact"""
        return self.artifact.canonical_bytes.value
    
    @property
    def payload(self) -> dict[str, Any]:
        """Get artifact payload (raw constitutional data)"""
        return self.artifact.payload
    
    @property
    def metadata(self) -> dict[str, Any]:
        """Get artifact metadata (non-constitutional interpretation hints)"""
        return self.artifact.metadata.to_dict()
    
    @property
    def authority_version(self) -> str:
        """Get authority version from artifact"""
        return self.artifact.authority_version
    
    @classmethod
    def create(
        cls,
        artifact: ArtifactEnvelope,
        correlation_id: str | None = None,
        causality_id: str | None = None,
        timestamp: datetime | None = None,
    ) -> "NotificationEvidence":
        """
        Factory method to create NotificationEvidence from artifact.
        
        Evidence is provider-agnostic - adapters interpret provider-specific fields.
        """
        return cls(
            artifact=artifact,
            correlation_id=correlation_id,
            causality_id=causality_id,
            timestamp=timestamp or datetime.utcnow(),
        )


class ProviderAdapter:
    """
    Adapter for interpreting provider-specific evidence.
    
    Evidence is constitutional and provider-agnostic.
    Adapters interpret provider-specific fields from the artifact payload.
    """
    
    @staticmethod
    def get_provider_name(evidence: NotificationEvidence) -> str:
        """Get provider name from evidence metadata"""
        return evidence.metadata.get("provider", "")
    
    @staticmethod
    def get_provider_request_id(evidence: NotificationEvidence) -> str:
        """Get provider request ID from evidence payload"""
        return evidence.payload.get("provider_request_id", "")
    
    @staticmethod
    def get_provider_response(evidence: NotificationEvidence) -> dict[str, Any]:
        """Get provider response from evidence payload"""
        return evidence.payload.get("provider_response", {})
    
    @staticmethod
    def get_build_witness_root_hash(evidence: NotificationEvidence) -> str:
        """Get build witness root hash from evidence payload"""
        return evidence.payload.get("build_witness_root_hash", "")
    
    @staticmethod
    def is_kit_provider(evidence: NotificationEvidence) -> bool:
        """Check if evidence is from Kit provider"""
        return ProviderAdapter.get_provider_name(evidence) == "kit"
    
    @staticmethod
    def is_twilio_provider(evidence: NotificationEvidence) -> bool:
        """Check if evidence is from Twilio provider"""
        return ProviderAdapter.get_provider_name(evidence) == "twilio"
