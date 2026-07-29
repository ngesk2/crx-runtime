"""Base Ingress Adapter

Abstract interface for ingress adapters.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass(frozen=True)
class CanonicalCommand:
    """Canonical command for all ingress"""
    
    command_id: str  # SHA256 hash of canonical data
    command_type: str  # e.g., "notification.requested", "sms.requested"
    ingress_source: str  # e.g., "http", "webhook.kit", "webhook.twilio"
    ingress_timestamp: datetime  # When the ingress was received
    payload: dict[str, Any]  # Canonical payload
    metadata: dict[str, Any]  # Ingress-specific metadata
    
    # Constitutional metadata
    correlation_id: str | None = None
    causality_id: str | None = None
    schema_version: str = "1.0.0"


class IngressAdapter(ABC):
    """Abstract interface for ingress adapters
    
    Each adapter owns:
    - Source validation
    - Canonicalization logic
    - Schema validation
    - Provider DTO conversion
    
    Nothing else.
    """
    
    @property
    @abstractmethod
    def source(self) -> str:
        """Ingress source name (http, webhook.kit, webhook.twilio, etc.)"""
        pass
    
    @abstractmethod
    async def canonicalize(
        self,
        raw_data: dict[str, Any],
        metadata: dict[str, Any] | None = None,
        execution_context: "ExecutionContext" | None = None,
    ) -> CanonicalCommand:
        """
        Canonicalize raw ingress data into CanonicalCommand.
        
        Args:
            raw_data: Raw ingress data
            metadata: Additional metadata
            execution_context: Constitutional execution context
        
        Returns:
            CanonicalCommand ready for CommandBus
        """
        pass
