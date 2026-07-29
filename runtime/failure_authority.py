"""Failure Authority

Deterministic failure authority with typed failure codes for constitutional consistency.
"""

from enum import Enum
from dataclasses import dataclass


class FailureCode(Enum):
    """Typed failure codes for deterministic error handling
    
    Replaces generic ValueError with constitutional failure types.
    """
    
    # Provider failures
    PROVIDER_UNAVAILABLE = "provider_unavailable"
    PROVIDER_RATE_LIMITED = "provider_rate_limited"
    PROVIDER_AUTHENTICATION_FAILED = "provider_authentication_failed"
    PROVIDER_TIMEOUT = "provider_timeout"
    
    # Schema failures
    SCHEMA_VIOLATION = "schema_violation"
    SCHEMA_VERSION_MISMATCH = "schema_version_mismatch"
    SCHEMA_NOT_FOUND = "schema_not_found"
    
    # Constitutional failures
    REPLAY_VIOLATION = "replay_violation"
    BUILD_WITNESS_MISMATCH = "build_witness_mismatch"
    AUTHORITY_VERSION_MISMATCH = "authority_version_mismatch"
    
    # Ingress failures
    INGRESS_VALIDATION_FAILED = "ingress_validation_failed"
    INGRESS_CANONICALIZATION_FAILED = "ingress_canonicalization_failed"
    WEBHOOK_SIGNATURE_INVALID = "webhook_signature_invalid"
    
    # Notification failures
    NOTIFICATION_SEND_FAILED = "notification_send_failed"
    NOTIFICATION_DELIVERY_FAILED = "notification_delivery_failed"
    NOTIFICATION_IDEMPOTENCY_CONFLICT = "notification_idempotency_conflict"
    
    # System failures
    SYSTEM_OVERLOAD = "system_overload"
    SYSTEM_SHUTDOWN = "system_shutdown"
    SYSTEM_MAINTENANCE = "system_maintenance"


@dataclass(frozen=True)
class ConstitutionalFailure:
    """Constitutional failure with typed code and deterministic metadata
    
    Replaces generic exceptions with structured failure information.
    """
    
    code: FailureCode
    message: str
    provider: str | None = None
    capability: str | None = None
    correlation_id: str | None = None
    causality_id: str | None = None
    retryable: bool = False
    retry_after_seconds: int | None = None
    metadata: dict | None = None
    
    def to_dict(self) -> dict:
        """Convert to dictionary for serialization"""
        return {
            "code": self.code.value,
            "message": self.message,
            "provider": self.provider,
            "capability": self.capability,
            "correlation_id": self.correlation_id,
            "causality_id": self.causality_id,
            "retryable": self.retryable,
            "retry_after_seconds": self.retry_after_seconds,
            "metadata": self.metadata,
        }


class FailureAuthority:
    """Authority for creating and managing constitutional failures
    
    Centralizes failure creation for consistency and determinism.
    """
    
    @staticmethod
    def provider_unavailable(
        provider: str,
        message: str | None = None,
        correlation_id: str | None = None,
    ) -> ConstitutionalFailure:
        """Create provider unavailable failure"""
        return ConstitutionalFailure(
            code=FailureCode.PROVIDER_UNAVAILABLE,
            message=message or f"Provider {provider} is unavailable",
            provider=provider,
            correlation_id=correlation_id,
            retryable=True,
            retry_after_seconds=30,
        )
    
    @staticmethod
    def provider_rate_limited(
        provider: str,
        retry_after_seconds: int,
        correlation_id: str | None = None,
    ) -> ConstitutionalFailure:
        """Create provider rate limited failure"""
        return ConstitutionalFailure(
            code=FailureCode.PROVIDER_RATE_LIMITED,
            message=f"Provider {provider} is rate limited",
            provider=provider,
            correlation_id=correlation_id,
            retryable=True,
            retry_after_seconds=retry_after_seconds,
        )
    
    @staticmethod
    def schema_violation(
        message: str,
        correlation_id: str | None = None,
        metadata: dict | None = None,
    ) -> ConstitutionalFailure:
        """Create schema violation failure"""
        return ConstitutionalFailure(
            code=FailureCode.SCHEMA_VIOLATION,
            message=message,
            correlation_id=correlation_id,
            retryable=False,
            metadata=metadata,
        )
    
    @staticmethod
    def replay_violation(
        message: str,
        causality_id: str | None = None,
        metadata: dict | None = None,
    ) -> ConstitutionalFailure:
        """Create replay violation failure"""
        return ConstitutionalFailure(
            code=FailureCode.REPLAY_VIOLATION,
            message=message,
            causality_id=causality_id,
            retryable=False,
            metadata=metadata,
        )
    
    @staticmethod
    def webhook_signature_invalid(
        provider: str,
        correlation_id: str | None = None,
    ) -> ConstitutionalFailure:
        """Create webhook signature invalid failure"""
        return ConstitutionalFailure(
            code=FailureCode.WEBHOOK_SIGNATURE_INVALID,
            message=f"Invalid webhook signature from provider {provider}",
            provider=provider,
            correlation_id=correlation_id,
            retryable=False,
        )
    
    @staticmethod
    def notification_send_failed(
        provider: str,
        capability: str,
        message: str,
        correlation_id: str | None = None,
        retryable: bool = True,
    ) -> ConstitutionalFailure:
        """Create notification send failed failure"""
        return ConstitutionalFailure(
            code=FailureCode.NOTIFICATION_SEND_FAILED,
            message=message,
            provider=provider,
            capability=capability,
            correlation_id=correlation_id,
            retryable=retryable,
            retry_after_seconds=60 if retryable else None,
        )


class ConstitutionalException(Exception):
    """Constitutional exception with structured failure information"""
    
    def __init__(self, failure: ConstitutionalFailure):
        self.failure = failure
        super().__init__(failure.message)
