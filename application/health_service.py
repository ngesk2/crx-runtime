"""
Health Application Service

Handles health and readiness checks for all system dependencies.
Provides consistent dependency status across the application.
"""

import httpx
import os
from typing import Dict
from storage.postgres.database import get_session
from sqlalchemy import text
from runtime.di_container import RuntimeContainer


class HealthApplicationService:
    """Application service for health operations."""
    
    def __init__(self, container: RuntimeContainer):
        self.container = container
        self.qdrant_url = os.getenv("QDRANT_URL", "http://qdrant:6333")
        self.ollama_url = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
    
    async def check_postgres(self) -> bool:
        """Check PostgreSQL connectivity."""
        try:
            async with get_session() as session:
                await session.execute(text("SELECT 1"))
            return True
        except Exception:
            return False
    
    async def check_qdrant(self) -> bool:
        """Check Qdrant connectivity."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.qdrant_url}/health", timeout=5.0)
                return response.status_code == 200
        except Exception:
            return False
    
    async def check_ollama(self) -> bool:
        """Check Ollama connectivity."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.ollama_url}/api/tags", timeout=5.0)
                return response.status_code == 200
        except Exception:
            return False
    
    async def check_all_dependencies(self) -> Dict[str, bool]:
        """Check all system dependencies."""
        return {
            "postgres": await self.check_postgres(),
            "qdrant": await self.check_qdrant(),
            "ollama": await self.check_ollama(),
            "nats": None,  # Disabled for MVP
        }
