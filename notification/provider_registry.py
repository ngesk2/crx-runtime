"""Provider Registry

Data-driven provider registry using ProviderRuntime (single source of truth).
"""

from typing import Any

from notification.capability_resolver import CapabilityId
from notification.provider_runtime import ProviderRuntime


class ProviderRegistry:
    """Registry for notification providers using ProviderRuntime
    
    Now uses ProviderRuntime as single source of truth, consolidating:
    - ProviderDescriptor (metadata, capabilities, priority, availability)
    - Provider adapter (actual implementation)
    - Metrics (performance tracking)
    - Availability status
    
    Replaces the three separate structures (_providers, _descriptors, _capabilities)
    with a single constitutional authority.
    """
    
    def __init__(self):
        self._runtimes: dict[str, ProviderRuntime] = {}  # provider_name -> ProviderRuntime
    
    def register_runtime(self, runtime: ProviderRuntime) -> None:
        """Register a provider runtime (single source of truth)"""
        self._runtimes[runtime.name] = runtime
    
    def get_provider_for_capability(self, capability_id: CapabilityId) -> "NotificationProvider":
        """Get provider for a specific capability (data-driven routing with priority)"""
        # Find all runtimes that support this capability
        available_runtimes = [
            runtime for runtime in self._runtimes.values()
            if runtime.supports_capability(capability_id)
        ]
        
        if not available_runtimes:
            raise ValueError(f"No provider registered for capability: {capability_id}")
        
        # Select best provider based on priority and availability
        best_runtime = self._select_best_runtime(available_runtimes)
        
        return best_runtime.adapter
    
    def _select_best_runtime(self, runtimes: list[ProviderRuntime]) -> ProviderRuntime:
        """Select best runtime based on priority and availability"""
        available_runtimes = [
            runtime for runtime in runtimes
            if runtime.is_available()
        ]
        
        if not available_runtimes:
            # No available providers, return first one (will fail with error)
            return runtimes[0]
        
        # Sort by priority (primary > secondary > tertiary)
        available_runtimes.sort(key=lambda r: r.priority.value)
        return available_runtimes[0]
    
    def get_provider(self, name: str) -> "NotificationProvider":
        """Get provider adapter by name"""
        runtime = self._runtimes.get(name)
        if not runtime:
            raise ValueError(f"Provider runtime not found: {name}")
        return runtime.adapter
    
    def get_runtime(self, name: str) -> ProviderRuntime:
        """Get provider runtime by name"""
        runtime = self._runtimes.get(name)
        if not runtime:
            raise ValueError(f"Provider runtime not found: {name}")
        return runtime
    
    def list_capabilities(self) -> list[str]:
        """List all registered capabilities"""
        capabilities = set()
        for runtime in self._runtimes.values():
            capabilities.update(runtime.descriptor.capabilities)
        return list(capabilities)
    
    def list_providers(self) -> list[str]:
        """List all registered provider names"""
        return list(self._runtimes.keys())
    
    def get_providers_for_capability(self, capability_id: CapabilityId) -> list[str]:
        """Get all provider names that support a specific capability"""
        return [
            runtime.name for runtime in self._runtimes.values()
            if runtime.supports_capability(capability_id)
        ]
