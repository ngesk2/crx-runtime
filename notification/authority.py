"""Notification Authority

Central authority for routing notifications to external providers.

Evolved architecture:
NotificationAuthority → CapabilityResolver → CapabilityId → ProviderRuntime

NotificationAuthority no longer knows providers directly.
It only knows capabilities.
"""

from typing import Any

from notification.capability_resolver import CapabilityResolver, CapabilityId
from notification.provider_id import ProviderId
from notification.evidence import NotificationEvidence
from notification.provider_registry import ProviderRegistry
from runtime.execution_context import ExecutionEnvelope


class NotificationAuthority:
    """Central authority for routing notifications to external providers
    
    Evolved architecture:
    NotificationAuthority → CapabilityResolver → CapabilityId → ProviderRuntime
    
    NotificationAuthority no longer knows providers directly.
    It only knows capabilities.
    
    This lets you add Email, SMS, Slack, Discord, PagerDuty, Teams, WebPush, Signal, Matrix, CarrierPigeon9000
    without touching NotificationAuthority.
    """
    
    def __init__(
        self,
        capability_resolver: CapabilityResolver,
        provider_registry: ProviderRegistry,
        execution_context: ExecutionEnvelope,
    ):
        self.capability_resolver = capability_resolver
        self.provider_registry = provider_registry
        self.execution_context = execution_context
    
    async def route_notification(
        self,
        capability_id: CapabilityId,
        payload: dict[str, Any],
    ) -> NotificationEvidence:
        """
        Route notification to appropriate provider via capability resolution.
        
        Args:
            capability_id: Capability required (CapabilityId object, not string)
            payload: Notification payload
        
        Returns:
            NotificationEvidence with provider response
        """
        # Resolve capability to provider ID via CapabilityResolver
        provider_id = self.capability_resolver.resolve_provider(capability_id)
        
        # Get provider from registry (using ProviderId)
        provider = self.provider_registry.get_provider(provider_id.value)
        
        # Route to provider with execution context
        evidence = await provider.send_notification(payload, self.execution_context)
        
        return evidence
    
    async def handle_webhook(
        self,
        provider_id: ProviderId,
        webhook_data: dict[str, Any],
    ) -> NotificationEvidence:
        """
        Handle webhook from provider.
        
        Args:
            provider_id: Provider ID (ProviderId object, not string)
            webhook_data: Webhook payload
        
        Returns:
            NotificationEvidence with webhook data
        """
        # Get provider by ID
        provider = self.provider_registry.get_provider(provider_id.value)
        
        # Handle webhook with execution context
        evidence = await provider.handle_webhook(webhook_data, self.execution_context)
        
        return evidence
