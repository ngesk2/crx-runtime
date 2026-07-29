"""
PostgreSQL Capability - Database operations through Capability Registry.

This capability provides canonical database operations through the registry.
"""

from typing import Dict, Any
from dataclasses import dataclass, field
from datetime import datetime
from constitution.registry.capability_registry import (
    Capability,
    CapabilityCategory,
    CapabilityMetadata,
    CapabilityState,
)
from storage.postgres.database import engine, get_session


@dataclass
class PostgresCapabilityMetadata(CapabilityMetadata):
    """PostgreSQL capability metadata."""
    name: str = "postgres"
    version: str = "1.0.0"
    category: CapabilityCategory = CapabilityCategory.MONITOR
    description: str = "PostgreSQL database operations"
    author: str = "constitutional-runtime"
    dependencies: list = field(default_factory=lambda: [])
    tags: list = field(default_factory=lambda: ["database", "storage"])
    requires_secrets: list = field(default_factory=lambda: ["POSTGRES_PASSWORD"])
    resource_requirements: dict = field(default_factory=dict)
    state: CapabilityState = CapabilityState.REGISTERED
    registered_at: datetime = field(default_factory=datetime.utcnow)
    last_health_check: datetime = None


class PostgresCapability:
    """
    PostgreSQL capability for database operations.
    
    Provides canonical database interface through the capability registry.
    """

    def __init__(self):
        self._metadata = PostgresCapabilityMetadata()

    @property
    def metadata(self) -> CapabilityMetadata:
        """Return capability metadata."""
        return self._metadata

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a database operation.
        
        Context should contain:
        - operation: "query", "insert", "update", "delete"
        - query: SQL query (for query operation)
        - params: Query parameters
        """
        operation = context.get("operation", "query")
        
        if operation == "query":
            async with get_session() as session:
                from sqlalchemy import text
                result = await session.execute(text(context["query"]), context.get("params", {}))
                rows = result.fetchall()
                columns = result.keys()
                return {
                    "success": True,
                    "rows": [dict(zip(columns, row)) for row in rows],
                    "count": len(rows),
                }
        else:
            return {
                "success": False,
                "error": f"Operation {operation} not implemented yet",
            }

    async def health_check(self) -> bool:
        """Check if PostgreSQL is healthy."""
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            return True
        except Exception:
            return False

    async def initialize(self) -> None:
        """Initialize PostgreSQL capability."""
        # Test connection
        healthy = await self.health_check()
        if healthy:
            self._metadata.state = CapabilityState.ACTIVE
            self._metadata.last_health_check = datetime.utcnow()
        else:
            self._metadata.state = CapabilityState.DEGRADED

    async def shutdown(self) -> None:
        """Shutdown PostgreSQL capability."""
        await engine.dispose()
        self._metadata.state = CapabilityState.DISABLED
