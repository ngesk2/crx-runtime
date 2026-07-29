"""
Qdrant Capability - Vector database operations through Capability Registry.

This capability provides canonical vector database operations through the registry.
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
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct


@dataclass
class QdrantCapabilityMetadata(CapabilityMetadata):
    """Qdrant capability metadata."""
    name: str = "qdrant"
    version: str = "1.0.0"
    category: CapabilityCategory = CapabilityCategory.MONITOR
    description: str = "Qdrant vector database operations"
    author: str = "constitutional-runtime"
    dependencies: list = field(default_factory=lambda: [])
    tags: list = field(default_factory=lambda: ["vector", "database", "search"])
    requires_secrets: list = field(default_factory=lambda: ["QDRANT_API_KEY"])
    resource_requirements: dict = field(default_factory=dict)
    state: CapabilityState = CapabilityState.REGISTERED
    registered_at: datetime = field(default_factory=datetime.utcnow)
    last_health_check: datetime = None


class QdrantCapability:
    """
    Qdrant capability for vector database operations.
    
    Provides canonical vector database interface through the capability registry.
    """

    def __init__(self, url: str = "http://localhost:6333", api_key: str = None):
        self._url = url
        self._api_key = api_key
        self._client = None
        self._metadata = QdrantCapabilityMetadata()

    @property
    def metadata(self) -> CapabilityMetadata:
        """Return capability metadata."""
        return self._metadata

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a Qdrant operation.
        
        Context should contain:
        - operation: "upsert", "search", "delete", "create_collection"
        - collection_name: Name of the collection
        - points: Points to upsert (for upsert operation)
        - query_vector: Query vector (for search operation)
        - limit: Number of results (for search operation)
        """
        if self._client is None:
            return {
                "success": False,
                "error": "Qdrant client not initialized",
            }

        operation = context.get("operation")
        collection_name = context.get("collection_name")

        if operation == "upsert":
            points = context.get("points", [])
            self._client.upsert(
                collection_name=collection_name,
                points=points,
            )
            return {"success": True, "upserted": len(points)}

        elif operation == "search":
            query_vector = context.get("query_vector")
            limit = context.get("limit", 10)
            results = self._client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                limit=limit,
            )
            return {
                "success": True,
                "results": [{"id": r.id, "score": r.score} for r in results],
            }

        elif operation == "create_collection":
            vector_size = context.get("vector_size", 768)
            self._client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
            )
            return {"success": True}

        else:
            return {
                "success": False,
                "error": f"Operation {operation} not implemented yet",
            }

    async def health_check(self) -> bool:
        """Check if Qdrant is healthy."""
        try:
            if self._client is None:
                return False
            collections = self._client.get_collections()
            return collections is not None
        except Exception:
            return False

    async def initialize(self) -> None:
        """Initialize Qdrant capability."""
        try:
            self._client = QdrantClient(url=self._url, api_key=self._api_key)
            healthy = await self.health_check()
            if healthy:
                self._metadata.state = CapabilityState.ACTIVE
                self._metadata.last_health_check = datetime.utcnow()
            else:
                self._metadata.state = CapabilityState.DEGRADED
        except Exception as e:
            self._metadata.state = CapabilityState.DEGRADED

    async def shutdown(self) -> None:
        """Shutdown Qdrant capability."""
        if self._client:
            self._client.close()
            self._client = None
        self._metadata.state = CapabilityState.DISABLED
