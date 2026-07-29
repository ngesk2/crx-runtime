"""Ingress Registry

Registry for ingress adapters with source-based routing.
"""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ingress.adapters.base import IngressAdapter


class IngressRegistry:
    """Registry for ingress adapters with source-based routing
    
    Each ingress source becomes an IngressAdapter.
    This keeps ingress extensible forever.
    """
    
    def __init__(self):
        self._adapters: dict[str, "IngressAdapter"] = {}
    
    def register_adapter(
        self,
        adapter: "IngressAdapter",
    ) -> None:
        """Register an ingress adapter"""
        self._adapters[adapter.source] = adapter
    
    def get_adapter(self, source: str) -> "IngressAdapter":
        """Get adapter for ingress source"""
        adapter = self._adapters.get(source)
        if not adapter:
            raise ValueError(f"No adapter registered for source: {source}")
        return adapter
    
    def list_sources(self) -> list[str]:
        """List all registered ingress sources"""
        return list(self._adapters.keys())
