"""
Ollama Capability - LLM inference operations through Capability Registry.

This capability provides canonical LLM inference operations through the registry.
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


@dataclass
class OllamaCapabilityMetadata(CapabilityMetadata):
    """Ollama capability metadata."""
    name: str = "ollama"
    version: str = "1.0.0"
    category: CapabilityCategory = CapabilityCategory.EXECUTE
    description: str = "Ollama LLM inference operations"
    author: str = "constitutional-runtime"
    dependencies: list = field(default_factory=lambda: [])
    tags: list = field(default_factory=lambda: ["inference", "llm", "ai"])
    requires_secrets: list = field(default_factory=lambda: [])
    resource_requirements: dict = field(default_factory=dict)
    state: CapabilityState = CapabilityState.REGISTERED
    registered_at: datetime = field(default_factory=datetime.utcnow)
    last_health_check: datetime = None


class OllamaCapability:
    """
    Ollama capability for LLM inference operations.
    
    Provides canonical LLM inference interface through the capability registry.
    """

    def __init__(self, url: str = "http://localhost:11434"):
        self._url = url
        self._metadata = OllamaCapabilityMetadata()

    @property
    def metadata(self) -> CapabilityMetadata:
        """Return capability metadata."""
        return self._metadata

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute an Ollama operation.
        
        Context should contain:
        - operation: "chat", "embeddings", "list_models"
        - model: Model name (for chat/embeddings)
        - prompt: Prompt text (for chat)
        - text: Text to embed (for embeddings)
        """
        operation = context.get("operation", "chat")

        if operation == "chat":
            # MVP: Placeholder for actual Ollama chat
            return {
                "success": False,
                "error": "Ollama chat not implemented yet - Ollama not running",
            }

        elif operation == "embeddings":
            # MVP: Placeholder for actual Ollama embeddings
            return {
                "success": False,
                "error": "Ollama embeddings not implemented yet - Ollama not running",
            }

        elif operation == "list_models":
            # MVP: Placeholder for actual Ollama model listing
            return {
                "success": False,
                "error": "Ollama model listing not implemented yet - Ollama not running",
            }

        else:
            return {
                "success": False,
                "error": f"Operation {operation} not implemented yet",
            }

    async def health_check(self) -> bool:
        """Check if Ollama is healthy."""
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self._url}/api/tags", timeout=5.0)
                return response.status_code == 200
        except Exception:
            return False

    async def initialize(self) -> None:
        """Initialize Ollama capability."""
        healthy = await self.health_check()
        if healthy:
            self._metadata.state = CapabilityState.ACTIVE
            self._metadata.last_health_check = datetime.utcnow()
        else:
            self._metadata.state = CapabilityState.DEGRADED

    async def shutdown(self) -> None:
        """Shutdown Ollama capability."""
        self._metadata.state = CapabilityState.DISABLED
