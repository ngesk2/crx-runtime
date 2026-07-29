"""Base Provider Interface

Abstract interface for notification providers.
"""

from abc import ABC, abstractmethod
from typing import Any

from notification.evidence import NotificationEvidence
from runtime.execution_context import ExecutionContext


class NotificationProvider(ABC):
    """Abstract interface for notification providers
    
    Each adapter owns:
    - SDK
    - Retries
    - Authentication
    - Webhook verification
    - Provider DTO conversion
    
    Nothing else.
    """
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name"""
        pass
    
    @property
    @abstractmethod
    def capabilities(self) -> list[str]:
        """Provider capabilities (for data-driven routing)"""
        pass
    
    @abstractmethod
    async def send_notification(
        self,
        payload: dict[str, Any],
        execution_context: ExecutionContext,
    ) -> NotificationEvidence:
        """
        Send notification via provider.
        
        Args:
            payload: Notification payload
            execution_context: Constitutional execution context
        
        Returns:
            NotificationEvidence with provider response
        """
        pass
    
    @abstractmethod
    async def handle_webhook(
        self,
        webhook_data: dict[str, Any],
        execution_context: ExecutionContext,
    ) -> NotificationEvidence:
        """
        Handle webhook from provider.
        
        Args:
            webhook_data: Webhook payload
            execution_context: Constitutional execution context
        
        Returns:
            NotificationEvidence with webhook data
        """
        pass
