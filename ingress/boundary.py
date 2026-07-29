"""Runtime Input Boundary

Single entry point for all ingress into the constitutional runtime.
"""

from typing import Any

from constitution.authority.canonical_authority import CanonicalAuthority
from ingress.adapters.base import CanonicalCommand
from ingress.registry import IngressRegistry
from runtime.execution_context import ExecutionContext


class RuntimeInputBoundary:
    """Single entry point for all ingress into the constitutional runtime
    
    Uses IngressRegistry for extensible ingress handling.
    """
    
    def __init__(
        self,
        ingress_registry: IngressRegistry,
        constitutional_authority: CanonicalAuthority,
        execution_context: ExecutionContext,
    ):
        self.ingress_registry = ingress_registry
        self.authority = constitutional_authority
        self.execution_context = execution_context
    
    async def process_ingress(
        self,
        source: str,
        raw_data: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ) -> CanonicalCommand:
        """
        Process any ingress through the boundary.
        
        Args:
            source: Source of ingress (http, webhook.kit, webhook.twilio, etc.)
            raw_data: Raw ingress data
            metadata: Additional metadata
        
        Returns:
            CanonicalCommand ready for CommandBus
        """
        # Step 1: Get adapter for source
        adapter = self.ingress_registry.get_adapter(source)
        
        # Step 2: Canonicalize via adapter with execution context
        command = await adapter.canonicalize(raw_data, metadata, self.execution_context)
        
        # Step 3: Validate constitutional constraints
        self._validate_constitutional(command)
        
        return command
    
    def _validate_constitutional(self, command: CanonicalCommand) -> None:
        """Validate constitutional constraints"""
        # Check schema version compatibility
        if command.schema_version != self.execution_context.schema_version:
            raise ValueError(f"Schema version mismatch: {command.schema_version}")
