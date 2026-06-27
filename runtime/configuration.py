"""
Shared Configuration Module

Constitutional: Single source of truth for all runtime configuration.
All configuration flows through this module.
"""

import os
from typing import Dict, Any
from runtime.constitutional.secret_adapter import get_secret_adapter


class Configuration:
    """Constitutional configuration class."""
    
    def __init__(self):
        self.secret_adapter = get_secret_adapter()
    
    def get_postgres_config(self) -> Dict[str, Any]:
        """Get PostgreSQL configuration."""
        return {
            "host": os.getenv("POSTGRES_HOST", "localhost"),
            "port": int(os.getenv("POSTGRES_PORT", "5432")),
            "database": os.getenv("POSTGRES_DB", "crx_runtime"),
            "user": os.getenv("POSTGRES_USER", "postgres"),
            "password": self.secret_adapter.get_postgres_password() or os.getenv("POSTGRES_PASSWORD", "postgres")
        }
    
    def get_qdrant_config(self) -> Dict[str, Any]:
        """Get Qdrant configuration."""
        return {
            "url": os.getenv("QDRANT_URL", "http://localhost:6333"),
            "api_key": self.secret_adapter.get_qdrant_key() or os.getenv("QDRANT_API_KEY"),
            "collection": os.getenv("QDRANT_COLLECTION", "constitutional_memory")
        }
    
    def get_ollama_config(self) -> Dict[str, Any]:
        """Get Ollama configuration."""
        return {
            "base_url": os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            "chat_model": os.getenv("OLLAMA_CHAT_MODEL", "qwen3:latest"),
            "embed_model": os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
        }


# Global configuration instance
_configuration: Configuration = None


def get_configuration() -> Configuration:
    """Get global configuration instance."""
    global _configuration
    if _configuration is None:
        _configuration = Configuration()
    return _configuration


# Convenience functions for backward compatibility
def get_postgres_config() -> Dict[str, Any]:
    """Get PostgreSQL configuration (convenience function)."""
    return get_configuration().get_postgres_config()
