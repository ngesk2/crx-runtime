"""
Shared Configuration Module

Constitutional: Single source of truth for all runtime configuration.
All configuration flows through this module.

THIS FILE IS A LEGACY WRAPPER AROUND ConfigurationAuthority.
All new code should import directly from runtime.config.configuration_authority.
"""

from typing import Dict, Any
from runtime.config.configuration_authority import ConfigurationAuthority


# Convenience wrapper for backward compatibility
_config: ConfigurationAuthority = None


class Configuration:
    """Compatibility wrapper that preserves the older Configuration API."""

    def __init__(self, secret_adapter=None):
        self._secret_adapter = secret_adapter
        self._authority = ConfigurationAuthority.get_instance()

    def get_postgres_config(self) -> Dict[str, Any]:
        cfg = self._authority.get_postgres_config()
        if self._secret_adapter is not None:
            password = self._secret_adapter.get_postgres_password()
            if password:
                cfg["password"] = password
        return cfg

    def get_qdrant_config(self) -> Dict[str, Any]:
        cfg = self._authority.get_qdrant_config()
        if self._secret_adapter is not None:
            api_key = self._secret_adapter.get_qdrant_key()
            if api_key:
                cfg["api_key"] = api_key
        return cfg

    def get_ollama_config(self) -> Dict[str, Any]:
        return self._authority.get_ollama_config()

    def get_inference_config(self) -> Dict[str, Any]:
        return self._authority.get_inference_config()


def get_configuration() -> ConfigurationAuthority:
    global _config
    if _config is None:
        _config = ConfigurationAuthority.get_instance()
    return _config


def get_postgres_config() -> Dict[str, Any]:
    return get_configuration().get_postgres_config()

get_qdrant_config = lambda: get_configuration().get_qdrant_config()
get_ollama_config = lambda: get_configuration().get_ollama_config()
