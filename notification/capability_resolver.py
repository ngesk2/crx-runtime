"""Capability Resolver

Resolves capabilities to provider runtimes without NotificationAuthority knowing providers.

Architecture:
NotificationAuthority → CapabilityResolver → CapabilityId → ProviderId → ProviderRuntime

This lets you add Email, SMS, Slack, Discord, PagerDuty, Teams, WebPush, Signal, Matrix, CarrierPigeon9000
without touching NotificationAuthority.
"""

from dataclasses import dataclass
from typing import Any

from notification.provider_id import ProviderId


@dataclass(frozen=True)
class CapabilityId:
    """
    Constitutional capability identifier.
    
    Replaces string-based capability IDs with constitutional objects.
    
    Eventually this will become:
    CapabilityHash → CapabilityDescriptor
    
    For now, a frozen value object to replace string capabilities.
    """
    value: str
    
    def __str__(self) -> str:
        return self.value


class CapabilityResolver:
    """
    Resolves capabilities to provider runtimes.
    
    NotificationAuthority should only know capabilities.
    Provider knowledge is encapsulated here.
    
    Now uses ProviderId instead of provider strings.
    """
    
    def __init__(self):
        self._capability_to_provider: dict[CapabilityId, ProviderId] = {}
        self._provider_capabilities: dict[ProviderId, list[CapabilityId]] = {}
    
    def register_capability(
        self,
        capability_id: CapabilityId,
        provider_id: ProviderId,
    ) -> None:
        """Register a capability for a provider"""
        self._capability_to_provider[capability_id] = provider_id
        
        if provider_id not in self._provider_capabilities:
            self._provider_capabilities[provider_id] = []
        self._provider_capabilities[provider_id].append(capability_id)
    
    def resolve_provider(self, capability_id: CapabilityId) -> ProviderId:
        """Resolve capability to provider ID"""
        provider_id = self._capability_to_provider.get(capability_id)
        if not provider_id:
            raise ValueError(f"No provider registered for capability: {capability_id}")
        return provider_id
    
    def get_provider_capabilities(self, provider_id: ProviderId) -> list[CapabilityId]:
        """Get all capabilities for a provider"""
        return self._provider_capabilities.get(provider_id, [])
    
    def list_capabilities(self) -> list[CapabilityId]:
        """List all registered capabilities"""
        return list(self._capability_to_provider.keys())
    
    def list_providers(self) -> list[ProviderId]:
        """List all registered providers"""
        return list(self._provider_capabilities.keys())
