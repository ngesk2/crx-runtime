"""Constitution Authority

Single immutable root authority for all constitutional concerns.

This is the constitutional root of the entire system.
Every other authority derives from this single immutable source.

Architecture:
RuntimeBootstrap
  ↓
  wires dependencies
  ↓
  ConstitutionAuthority (immutable constitutional references)

RuntimeBootstrap owns dependency wiring.
ConstitutionAuthority owns immutable constitutional references.

ConstitutionAuthority describes the runtime, doesn't assemble it.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from .hash_authority import HashAuthority, HashAlgorithm
from .canonical_serializer import CanonicalSerializer
from .canonical_byte_authority import CanonicalByteAuthority
from .canonical_traversal_authority import CanonicalTraversalAuthority
from runtime.configuration_authority import ConfigurationAuthority


@dataclass(frozen=True)
class ConstitutionVersion:
    """
    Immutable constitutional version.
    
    All constitutional authorities are versioned together.
    """
    major: int
    minor: int
    patch: int
    pre_release: str = ""
    build_metadata: str = ""
    
    def __str__(self) -> str:
        parts = [f"{self.major}.{self.minor}.{self.patch}"]
        if self.pre_release:
            parts.append(f"-{self.pre_release}")
        if self.build_metadata:
            parts.append(f"+{self.build_metadata}")
        return "".join(parts)
    
    @classmethod
    def v1(cls) -> "ConstitutionVersion":
        """Constitution version 1.0.0"""
        return cls(major=1, minor=0, patch=0)


@dataclass(frozen=True)
class ConstitutionIdentity:
    """
    Immutable constitutional identity.
    
    The single source of truth for constitutional identity.
    """
    version: ConstitutionVersion
    hash_algorithm: HashAlgorithm
    canonical_version: str
    encoding_version: str
    authority_version: str
    constitution_hash: str  # Hash of all constitutional authorities
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary"""
        return {
            "version": str(self.version),
            "hash_algorithm": self.hash_algorithm.value,
            "canonical_version": self.canonical_version,
            "encoding_version": self.encoding_version,
            "authority_version": self.authority_version,
            "constitution_hash": self.constitution_hash,
        }


class ConstitutionAuthority:
    """
    Single immutable root authority for all constitutional concerns.
    
    Owns immutable constitutional references to:
    - HashAuthority
    - CanonicalSerializer
    - CanonicalTraversalAuthority
    - CanonicalByteAuthority
    - ConfigurationAuthority
    
    Does NOT own:
    - Dependency wiring (that's RuntimeBootstrap)
    - Authority construction (that's RuntimeBootstrap)
    
    ConstitutionAuthority describes the runtime, doesn't assemble it.
    """
    
    def __init__(
        self,
        version: ConstitutionVersion = ConstitutionVersion.v1(),
        hash_algorithm: HashAlgorithm = HashAlgorithm.SHA256_V1,
        canonical_version: str = "1.0.0",
        encoding_version: str = "1.0.0",
        authority_version: str = "1.0.0",
        hash_authority: HashAuthority | None = None,
        canonical_serializer: CanonicalSerializer | None = None,
        canonical_traversal_authority: CanonicalTraversalAuthority | None = None,
        canonical_byte_authority: CanonicalByteAuthority | None = None,
        configuration_authority: ConfigurationAuthority | None = None,
    ):
        self.version = version
        self.hash_algorithm = hash_algorithm
        self.canonical_version = canonical_version
        self.encoding_version = encoding_version
        self.authority_version = authority_version
        
        # Accept pre-wired authorities from RuntimeBootstrap
        # If not provided, create defaults (for backward compatibility)
        self.hash_authority = hash_authority or HashAuthority(algorithm=hash_algorithm)
        self.canonical_serializer = canonical_serializer or CanonicalSerializer(version=canonical_version)
        self.canonical_traversal_authority = canonical_traversal_authority or CanonicalTraversalAuthority()
        self.canonical_byte_authority = canonical_byte_authority or CanonicalByteAuthority(
            serializer=self.canonical_serializer,
            hash_authority=self.hash_authority,
        )
        
        # Configuration authority (requires implementation hashes)
        # MVP: If not provided, create with computed hashes (not source code hashing yet)
        if configuration_authority:
            self.configuration_authority = configuration_authority
        else:
            # MVP: Skip ConfigurationAuthority for now due to dependency complexity
            # Future: Wire ImplementationAuthority and WitnessAuthority
            self.configuration_authority = None
        
        # Compute constitutional identity
        self.identity = self._compute_identity()
    
    def _compute_loader_hash(self) -> str:
        """
        Compute loader implementation hash.

        Hashes the actual bootstrap_loader.py source file.
        """
        from pathlib import Path
        loader_path = Path(__file__).parent.parent.parent / "hermes" / "runtime" / "bootstrap_loader.py"
        if loader_path.exists():
            with open(loader_path, 'rb') as f:
                source_bytes = f.read()
            return self.hash_authority.hash_bytes(source_bytes).value
        return self.hash_authority.hash_string("config_loader_v1").value

    def _compute_normalizer_hash(self) -> str:
        """
        Compute normalizer implementation hash.

        MVP: No normalizer file exists yet, returns placeholder.
        """
        return self.hash_authority.hash_string("config_normalizer_v1").value

    def _compute_constitution_hash(self) -> str:
        """
        Compute constitution implementation hash.

        Hashes the constitution authority source files.
        """
        from pathlib import Path
        constitution_path = Path(__file__).parent
        if constitution_path.exists():
            # Hash all Python files in constitution/authority
            hashes = []
            for py_file in constitution_path.glob("*.py"):
                with open(py_file, 'rb') as f:
                    source_bytes = f.read()
                hashes.append(self.hash_authority.hash_bytes(source_bytes).value)
            # Combine hashes
            combined = "".join(sorted(hashes))
            return self.hash_authority.hash_string(combined).value
        return self.hash_authority.hash_string("constitution_v1").value

    def _compute_capability_registry_hash(self) -> str:
        """
        Compute capability registry implementation hash.

        Hashes the capability registry source file.
        """
        from pathlib import Path
        registry_path = Path(__file__).parent.parent / "registry" / "capability_registry.py"
        if registry_path.exists():
            with open(registry_path, 'rb') as f:
                source_bytes = f.read()
            return self.hash_authority.hash_bytes(source_bytes).value
        return self.hash_authority.hash_string("capability_registry_v1").value

    def _compute_kernel_hash(self) -> str:
        """
        Compute kernel implementation hash.

        Hashes kernel source files.
        """
        from pathlib import Path
        kernel_path = Path(__file__).parent.parent.parent / "runtime" / "kernel"
        if kernel_path.exists():
            hashes = []
            for py_file in kernel_path.rglob("*.py"):
                with open(py_file, 'rb') as f:
                    source_bytes = f.read()
                hashes.append(self.hash_authority.hash_bytes(source_bytes).value)
            combined = "".join(sorted(hashes))
            return self.hash_authority.hash_string(combined).value
        return self.hash_authority.hash_string("kernel_v1").value
    
    def _compute_identity(self) -> ConstitutionIdentity:
        """
        Compute constitutional identity.
        
        Hashes all constitutional authorities into a single identity.
        """
        identity_data = {
            "version": str(self.version),
            "hash_algorithm": self.hash_algorithm.value,
            "canonical_version": self.canonical_version,
            "encoding_version": self.encoding_version,
            "authority_version": self.authority_version,
        }
        
        canonical_bytes = self.canonical_serializer.serialize(identity_data)
        constitution_hash = self.hash_authority.hash_bytes(canonical_bytes.value).value
        
        return ConstitutionIdentity(
            version=self.version,
            hash_algorithm=self.hash_algorithm,
            canonical_version=self.canonical_version,
            encoding_version=self.encoding_version,
            authority_version=self.authority_version,
            constitution_hash=constitution_hash,
        )
    
    def get_identity(self) -> ConstitutionIdentity:
        """Get constitutional identity"""
        return self.identity
    
    def get_hash_authority(self) -> HashAuthority:
        """Get hash authority"""
        return self.hash_authority
    
    def get_canonical_serializer(self) -> CanonicalSerializer:
        """Get canonical serializer"""
        return self.canonical_serializer
    
    def get_canonical_traversal_authority(self) -> CanonicalTraversalAuthority:
        """Get canonical traversal authority"""
        return self.canonical_traversal_authority
    
    def get_canonical_byte_authority(self) -> CanonicalByteAuthority:
        """Get canonical byte authority"""
        return self.canonical_byte_authority
    
    def get_configuration_authority(self) -> ConfigurationAuthority:
        """Get configuration authority"""
        return self.configuration_authority
    
    def certify_build_witness(
        self,
        git_commit: str,
        tool_registry_hash: str,
        workflow_registry_hash: str,
        prompt_registry_hash: str,
        agent_registry_hash: str,
        type_registry_hash: str,
        reducer_hash: str,
        capability_registry_hash: str,
        kernel_constitution_hash: str,
    ) -> str:
        """
        Certify a build witness.
        
        Returns the configuration witness hash to include in BuildWitness.
        """
        # Get configuration witness
        config_witness = self.configuration_authority.get_witness()
        config_witness_data = config_witness.to_dict()
        config_witness_bytes = self.canonical_serializer.serialize(config_witness_data)
        config_witness_hash = self.hash_authority.hash_bytes(config_witness_bytes.value).value
        
        return config_witness_hash
    
    def serialize_to_canonical_bytes(self, data: dict[str, Any]) -> bytes:
        """
        Serialize data to canonical bytes (via CanonicalByteAuthority).
        
        This is the single entry point for all canonical serialization.
        """
        canonical_bytes = self.canonical_byte_authority.serialize(data)
        return canonical_bytes.value
    
    def hash_canonical_bytes(self, data: bytes) -> str:
        """
        Hash canonical bytes (via HashAuthority).
        
        This is the single entry point for all canonical hashing.
        """
        return self.hash_authority.hash_bytes(data).value
    
    def verify_hash(self, data: bytes, hash_value: str) -> bool:
        """
        Verify hash (via HashAuthority).
        
        This is the single entry point for all hash verification.
        """
        return self.hash_authority.verify_hash(data, hash_value)
