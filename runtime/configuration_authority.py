"""Configuration Authority

Constitutional configuration authority (focused on configuration certification).

Architecture:
ConfigSources
  ↓
ConfigLoader
  ↓
ConfigurationNormalizer
  ↓
ConfigurationAuthority
  ↓
ConfigurationSnapshot

ConfigurationAuthority should not know how YAML is parsed.
It should only certify a normalized constitutional configuration.

Split into:
- ConfigurationAuthority (configuration certification)
- ImplementationAuthority (implementation hashing)
- WitnessAuthority (witness generation)
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any
from enum import Enum

from constitution.authority.canonical_serializer import CanonicalSerializer
from constitution.authority.hash_authority import HashAuthority, HashAlgorithm
from runtime.implementation_authority import ImplementationAuthority
from runtime.witness_authority import WitnessAuthority


class ConfigurationSource(Enum):
    """Sources of configuration"""
    ENV = "env"
    DOCKER_COMPOSE = "docker_compose"
    YAML = "yaml"
    CONSTANTS = "constants"
    PROVIDER_CONFIG = "provider_config"
    DATABASE = "database"


@dataclass(frozen=True)
class ConfigurationSourceIdentity:
    """
    Constitutional identity for a configuration source.
    
    Contains:
    - source_type (type of source: YAML, ENV, etc.)
    - source_identity_hash (hash of source identity, e.g., file path, environment name)
    
    Different sources of the same type (config.yml vs config.production.yml) must have
    different constitutional identities.
    """
    source_type: ConfigurationSource
    source_identity_hash: str


@dataclass(frozen=True)
class ConfigurationWitness:
    """
    Constitutional witness for configuration.
    
    Contains:
    - configuration_hash (hash of configuration data)
    - loader_implementation_hash (hash of loader implementation, not version string)
    - normalizer_implementation_hash (hash of normalizer implementation, not version string)
    - authority_version (authority version)
    
    Two different loaders could produce identical dictionaries while having
    different constitutional semantics. The witness captures this.
    
    Implementation hashes are used instead of version strings because
    version strings lie. Hashes don't.
    """
    configuration_hash: str
    loader_implementation_hash: str
    normalizer_implementation_hash: str
    authority_version: str = "1.0.0"
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary"""
        return {
            "configuration_hash": self.configuration_hash,
            "loader_implementation_hash": self.loader_implementation_hash,
            "normalizer_implementation_hash": self.normalizer_implementation_hash,
            "authority_version": self.authority_version,
        }


@dataclass(frozen=True)
class ConfigurationSnapshot:
    """
    Immutable configuration snapshot.
    
    Contains:
    - configuration_id (canonical identifier)
    - witness (constitutional witness)
    - configuration_data (all configuration merged)
    - source_identities (list of source identities with hashes)
    - version (configuration version)
    - created_at (snapshot creation time)
    """
    configuration_id: str
    witness: ConfigurationWitness
    configuration_data: dict[str, Any]
    source_identities: list[ConfigurationSourceIdentity]
    version: str = "1.0.0"
    created_at: datetime | None = None
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value by key (dot notation supported)"""
        keys = key.split(".")
        value = self.configuration_data
        
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        
        return value


class ConfigLoader:
    """
    Loads configuration from various sources.
    
    ConfigurationAuthority should not know how YAML is parsed.
    """
    
    def load_env(self) -> dict[str, Any]:
        """Load environment variables"""
        import os
        return dict(os.environ)
    
    def load_yaml(self, path: str) -> dict[str, Any]:
        """Load YAML configuration"""
        import yaml
        with open(path, 'r') as f:
            return yaml.safe_load(f) or {}
    
    def load_constants(self, constants: dict[str, Any]) -> dict[str, Any]:
        """Load constants"""
        return constants.copy()


class ConfigurationNormalizer:
    """
    Normalizes configuration data.
    
    Applies precedence rules and normalization logic.
    """
    
    def normalize(
        self,
        env_config: dict[str, Any] | None = None,
        yaml_config: dict[str, Any] | None = None,
        provider_config: dict[str, Any] | None = None,
        constants_config: dict[str, Any] | None = None,
        yaml_path: str | None = None,
        environment_name: str | None = None,
    ) -> tuple[dict[str, Any], list[ConfigurationSourceIdentity]]:
        """
        Normalize configuration from multiple sources.
        
        Merges configuration in order of precedence:
        1. constants (lowest)
        2. yaml
        3. provider_config
        4. env (highest)
        
        Returns source identities with hashes for constitutional tracking.
        """
        source_identities = []
        merged_config: dict[str, Any] = {}
        
        # Merge in order of precedence
        if constants_config:
            merged_config.update(constants_config)
            source_identities.append(ConfigurationSourceIdentity(
                source_type=ConfigurationSource.CONSTANTS,
                source_identity_hash=self._hash_identity("constants"),
            ))
        
        if yaml_config:
            self._deep_merge(merged_config, yaml_config)
            yaml_identity = yaml_path or "yaml"
            source_identities.append(ConfigurationSourceIdentity(
                source_type=ConfigurationSource.YAML,
                source_identity_hash=self._hash_identity(yaml_identity),
            ))
        
        if provider_config:
            self._deep_merge(merged_config, provider_config)
            source_identities.append(ConfigurationSourceIdentity(
                source_type=ConfigurationSource.PROVIDER_CONFIG,
                source_identity_hash=self._hash_identity("provider_config"),
            ))
        
        if env_config:
            self._deep_merge(merged_config, env_config)
            env_identity = environment_name or "env"
            source_identities.append(ConfigurationSourceIdentity(
                source_type=ConfigurationSource.ENV,
                source_identity_hash=self._hash_identity(env_identity),
            ))
        
        return merged_config, source_identities
    
    def _hash_identity(self, identity: str) -> str:
        """Hash source identity for constitutional tracking"""
        import hashlib
        return hashlib.sha256(identity.encode("utf-8")).hexdigest()
    
    def _deep_merge(self, base: dict[str, Any], override: dict[str, Any]) -> None:
        """Deep merge override into base"""
        for key, value in override.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                self._deep_merge(base[key], value)
            else:
                base[key] = value


class ConfigurationAuthority:
    """
    Constitutional configuration authority (focused on configuration certification).
    
    Does NOT know how to parse YAML or load environment variables.
    Only certifies a normalized constitutional configuration.
    
    Delegates to:
    - ImplementationAuthority (implementation hashing)
    - WitnessAuthority (witness generation)
    
    Architecture:
    ConfigLoader → ConfigurationNormalizer → ConfigurationAuthority → ConfigurationSnapshot
    """
    
    def __init__(
        self,
        implementation_authority: ImplementationAuthority,
        witness_authority: WitnessAuthority,
        authority_version: str = "1.0.0",
    ):
        self.implementation_authority = implementation_authority
        self.witness_authority = witness_authority
        self.authority_version = authority_version
        self._serializer = CanonicalSerializer()
        self._hash_authority = HashAuthority(algorithm=HashAlgorithm.SHA256_V1)
        self._snapshot: ConfigurationSnapshot | None = None
    
    def certify_configuration(
        self,
        normalized_config: dict[str, Any],
        source_identities: list[ConfigurationSourceIdentity],
        loader_module: str = "runtime.configuration_authority",
        normalizer_module: str = "runtime.configuration_authority",
    ) -> ConfigurationSnapshot:
        """
        Certify normalized configuration as constitutional snapshot.
        
        ConfigurationAuthority should only certify, not load or normalize.
        
        Delegates implementation hashing to ImplementationAuthority.
        Delegates witness generation to WitnessAuthority.
        """
        # Hash configuration data
        config_bytes = self._serializer.serialize(normalized_config)
        configuration_hash = self._hash_authority.hash_bytes(config_bytes.value).value
        
        # Get implementation identities from ImplementationAuthority
        loader_identity = self.implementation_authority.hash_module(loader_module)
        normalizer_identity = self.implementation_authority.hash_module(normalizer_module)
        
        # Create constitutional witness (uses implementation hashes, not version strings)
        witness = ConfigurationWitness(
            configuration_hash=configuration_hash,
            loader_implementation_hash=loader_identity.implementation_hash,
            normalizer_implementation_hash=normalizer_identity.implementation_hash,
            authority_version=self.authority_version,
        )
        
        # Generate configuration ID from witness hash
        witness_data = witness.to_dict()
        witness_bytes = self._serializer.serialize(witness_data)
        configuration_id = self._hash_authority.hash_bytes(witness_bytes.value).value
        
        # Create snapshot
        self._snapshot = ConfigurationSnapshot(
            configuration_id=configuration_id,
            witness=witness,
            configuration_data=normalized_config,
            source_identities=source_identities,
            version=self.authority_version,
            created_at=datetime.utcnow(),
        )
        
        return self._snapshot
    
    def get_snapshot(self) -> ConfigurationSnapshot:
        """Get current configuration snapshot"""
        if not self._snapshot:
            raise RuntimeError("Configuration not certified. Call certify_configuration() first.")
        return self._snapshot
    
    def get_witness(self) -> ConfigurationWitness:
        """Get constitutional witness"""
        snapshot = self.get_snapshot()
        return snapshot.witness
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value by key"""
        snapshot = self.get_snapshot()
        return snapshot.get(key, default)
    
    def get_provider_config(self, provider_name: str) -> dict[str, Any]:
        """Get provider-specific configuration"""
        return self.get(f"providers.{provider_name}", {})
    
    def get_database_config(self) -> dict[str, Any]:
        """Get database configuration"""
        return self.get("database", {})
    
    def get_notification_config(self) -> dict[str, Any]:
        """Get notification configuration"""
        return self.get("notification", {})
