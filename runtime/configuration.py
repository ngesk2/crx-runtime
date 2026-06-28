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


def get_configuration() -> ConfigurationAuthority:
    global _config
    if _config is None:
        _config = ConfigurationAuthority.get_instance()
    return _config


def get_postgres_config() -> Dict[str, Any]:
    return get_configuration().get_postgres_config()

get_qdrant_config = lambda: get_configuration().get_qdrant_config()
get_ollama_config = lambda: get_configuration().get_ollama_config()
