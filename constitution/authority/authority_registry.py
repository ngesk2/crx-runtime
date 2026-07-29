"""Authority Registry

First-class constitutional artifacts for authorities.

Architecture:
AuthorityRegistry
  ↓
  AuthorityDescriptor (AuthorityHash, version, dependencies)
  ↓
  Constitutional description of runtime

The registry becomes the constitutional description of the runtime itself.
At that point the runtime can prove not only what it executed,
but which authorities defined its behavior.

Registry
  ↓
  Registry Hash
  ↓
  Registry Descriptor
  ↓
  Constitution
"""

from dataclasses import dataclass
from typing import Any

from .authority_hash import AuthorityHash


@dataclass(frozen=True)
class AuthorityDescriptor:
    """
    Immutable descriptor for a constitutional authority.
    
    Contains:
    - name (authority name)
    - hash (canonical hash of authority implementation as AuthorityHash)
    - version (authority version)
    - dependencies (other authorities this depends on)
    """
    name: str
    hash: AuthorityHash
    version: str
    dependencies: list[str]  # Names of dependent authorities
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary"""
        return {
            "name": self.name,
            "hash": self.hash.value,
            "version": self.version,
            "dependencies": self.dependencies,
        }


@dataclass(frozen=True)
class RegistryDescriptor:
    """
    Immutable descriptor for the authority registry itself.
    
    The registry becomes a constitutional artifact:
    - hash (canonical hash of all registered authorities)
    - version (registry version)
    - authorities (list of registered authority names)
    """
    hash: AuthorityHash
    version: str
    authorities: list[str]
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary"""
        return {
            "hash": self.hash.value,
            "version": self.version,
            "authorities": self.authorities,
        }


class AuthorityRegistry:
    """
    Registry for first-class constitutional authority artifacts.
    
    Each authority becomes a constitutional artifact with:
    - Canonical hash (of implementation)
    - Version
    - Dependencies
    
    The registry itself becomes a constitutional artifact:
    - Hash of all registered authorities
    - Version
    - List of authorities
    
    This allows the runtime to prove which authorities defined its behavior.
    """
    
    def __init__(self, version: str = "1.0.0"):
        self._authorities: dict[str, AuthorityDescriptor] = {}
        self._version = version
        self._descriptor: RegistryDescriptor | None = None
    
    def register_authority(
        self,
        name: str,
        hash: str | AuthorityHash,
        version: str,
        dependencies: list[str] | None = None,
    ) -> None:
        """
        Register an authority descriptor.
        
        Args:
            name: Authority name (e.g., "HashAuthority")
            hash: Canonical hash of authority implementation (as AuthorityHash or str for backward compatibility)
            version: Authority version
            dependencies: List of authority names this depends on
        """
        # Convert string to AuthorityHash for backward compatibility
        if isinstance(hash, str):
            hash = AuthorityHash(value=hash)
        
        descriptor = AuthorityDescriptor(
            name=name,
            hash=hash,
            version=version,
            dependencies=dependencies or [],
        )
        self._authorities[name] = descriptor
        
        # Invalidate cached descriptor
        self._descriptor = None
    
    def get_authority(self, name: str) -> AuthorityDescriptor:
        """Get authority descriptor by name"""
        descriptor = self._authorities.get(name)
        if not descriptor:
            raise ValueError(f"No authority registered: {name}")
        return descriptor
    
    def list_authorities(self) -> list[AuthorityDescriptor]:
        """List all registered authorities"""
        return list(self._authorities.values())
    
    def get_dependency_graph(self) -> dict[str, list[str]]:
        """
        Get dependency graph of all authorities.
        
        Returns a mapping from authority name to list of dependencies.
        """
        return {
            name: descriptor.dependencies
            for name, descriptor in self._authorities.items()
        }
    
    def verify_dependencies(self) -> dict[str, bool]:
        """
        Verify that all authority dependencies are satisfied.
        
        Returns a mapping from authority name to whether dependencies are satisfied.
        """
        authority_names = set(self._authorities.keys())
        results = {}
        
        for name, descriptor in self._authorities.items():
            satisfied = all(dep in authority_names for dep in descriptor.dependencies)
            results[name] = satisfied
        
        return results
    
    def to_dict(self) -> dict[str, Any]:
        """
        Convert registry to dictionary for constitutional storage.
        
        This is the constitutional description of the runtime.
        """
        return {
            "authorities": [
                descriptor.to_dict()
                for descriptor in self._authorities.values()
            ],
            "dependency_graph": self.get_dependency_graph(),
            "dependency_verification": self.verify_dependencies(),
        }
    
    def _compute_registry_hash(self) -> AuthorityHash:
        """
        Compute canonical hash of the entire registry.
        
        This hash represents the constitutional state of all authorities.
        """
        import hashlib
        import json
        
        # Get all authority data in canonical form
        authorities_data = []
        for name in sorted(self._authorities.keys()):
            descriptor = self._authorities[name]
            authorities_data.append(descriptor.to_dict())
        
        # Canonical JSON encoding (sorted keys, no extra whitespace)
        registry_json = json.dumps({
            "version": self._version,
            "authorities": authorities_data,
        }, sort_keys=True, separators=(",", ":"))
        
        # Hash the canonical JSON
        hash_obj = hashlib.sha256(registry_json.encode("utf-8"))
        return AuthorityHash(value=hash_obj.hexdigest())
    
    def get_registry_descriptor(self) -> RegistryDescriptor:
        """
        Get the constitutional descriptor for the registry itself.
        
        The registry becomes a constitutional artifact with its own descriptor.
        """
        if self._descriptor is None:
            # Compute registry hash
            registry_hash = self._compute_registry_hash()
            
            # Get list of authority names
            authority_names = sorted(self._authorities.keys())
            
            # Create registry descriptor
            self._descriptor = RegistryDescriptor(
                hash=registry_hash,
                version=self._version,
                authorities=authority_names,
            )
        
        return self._descriptor
    
    def compute_registry_hash(self, hash_func: callable) -> str:
        """
        Compute canonical hash of the entire registry.
        
        This hash represents the constitutional state of all authorities.
        """
        descriptor = self.get_registry_descriptor()
        return descriptor.hash.value
