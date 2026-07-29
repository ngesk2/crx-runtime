"""HTTP Ingress Adapter

Adapter for HTTP REST API requests using RouteAuthority.
"""

from typing import Any

from constitution.authority.canonical_authority import CanonicalAuthority
from ingress.adapters.base import CanonicalCommand, IngressAdapter
from ingress.route_authority import RouteAuthority
from runtime.execution_context import ExecutionContext


class HTTPAdapter(IngressAdapter):
    """HTTP ingress adapter for REST API requests
    
    Now uses RouteAuthority for routing instead of business logic in adapter.
    HTTP adapter becomes: Request → RouteAuthority.resolve() → descriptor → command → kernel
    Zero interpretation. Only translation.
    """
    
    def __init__(
        self,
        canonical_authority: CanonicalAuthority,
        route_authority: RouteAuthority,
    ):
        self.canonical_authority = canonical_authority
        self.route_authority = route_authority
    
    @property
    def source(self) -> str:
        return "http"
    
    async def canonicalize(
        self,
        raw_data: dict[str, Any],
        metadata: dict[str, Any] | None = None,
        execution_context: ExecutionContext | None = None,
    ) -> CanonicalCommand:
        """
        Canonicalize HTTP request into CanonicalCommand using RouteAuthority.
        
        HTTP adapter becomes: Request → RouteAuthority.resolve() → descriptor → command → kernel
        Zero interpretation. Only translation.
        
        Args:
            raw_data: HTTP request data (method, path, headers, body)
            metadata: Additional metadata
            execution_context: Constitutional execution context
        
        Returns:
            CanonicalCommand ready for CommandBus
        """
        # Use execution context or create default
        ctx = execution_context or ExecutionContext()
        
        # Extract HTTP method and path
        method = raw_data.get("method", "GET")
        path = raw_data.get("path", "/")
        
        # Extract payload from body
        payload = raw_data.get("body", {})
        
        # Use RouteAuthority to resolve command (no business logic in adapter)
        command_data = self.route_authority.resolve_command(path, method, payload)
        
        # Generate canonical data
        canonical_data = {
            "command_type": command_data.get("command_type"),
            "ingress_source": "http",
            "ingress_timestamp": ctx.get_timestamp(),
            "payload": command_data.get("payload", payload),
            "metadata": metadata or {},
            "correlation_id": raw_data.get("headers", {}).get("X-Correlation-ID"),
            "schema_version": ctx.schema_version,
        }
        
        # Compute command_id using CanonicalAuthority (single source of truth)
        command_id = self.canonical_authority.hash_dict(canonical_data)
        
        return CanonicalCommand(
            command_id=command_id,
            **canonical_data,
        )

