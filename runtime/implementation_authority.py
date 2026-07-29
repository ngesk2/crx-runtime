"""Implementation Authority

Constitutional implementation authority for implementation hashing.

Architecture:
ImplementationAuthority
  ↓
  Implementation Hash
  ↓
  Constitutional Implementation Identity

Separates implementation hashing from configuration authority.
"""

from dataclasses import dataclass
from typing import Any

from runtime.implementation_hash import SemanticHasher


@dataclass(frozen=True)
class ImplementationIdentity:
    """
    Constitutional identity for an implementation.
    
    Contains:
    - implementation_hash (hash of implementation)
    - implementation_type (type of implementation: module, function, class)
    - implementation_name (name of implementation)
    - authority_version (authority version)
    """
    implementation_hash: str
    implementation_type: str
    implementation_name: str
    authority_version: str = "1.0.0"
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary"""
        return {
            "implementation_hash": self.implementation_hash,
            "implementation_type": self.implementation_type,
            "implementation_name": self.implementation_name,
            "authority_version": self.authority_version,
        }


class ImplementationAuthority:
    """
    Authority for constitutional implementation hashing.
    
    Separated from ConfigurationAuthority to focus on implementation identity.
    
    Responsibilities:
    - Hash implementations (modules, functions, classes)
    - Provide implementation identities
    - Track implementation versions
    """
    
    def __init__(self, authority_version: str = "1.0.0"):
        self.authority_version = authority_version
        self.hasher = SemanticHasher()
    
    def hash_module(self, module_name: str) -> ImplementationIdentity:
        """
        Hash a module implementation.
        
        Args:
            module_name: Module name to hash
        
        Returns:
            Implementation identity
        """
        implementation_hash = self.hasher.hash_module_source(module_name)
        return ImplementationIdentity(
            implementation_hash=implementation_hash,
            implementation_type="module",
            implementation_name=module_name,
            authority_version=self.authority_version,
        )
    
    def hash_function(self, func: callable) -> ImplementationIdentity:
        """
        Hash a function implementation.
        
        Args:
            func: Function to hash
        
        Returns:
            Implementation identity
        """
        implementation_hash = self.hasher.hash_function_source(func)
        func_name = f"{func.__module__}.{func.__name__}"
        return ImplementationIdentity(
            implementation_hash=implementation_hash,
            implementation_type="function",
            implementation_name=func_name,
            authority_version=self.authority_version,
        )
    
    def hash_class(self, cls: type) -> ImplementationIdentity:
        """
        Hash a class implementation.
        
        Args:
            cls: Class to hash
        
        Returns:
            Implementation identity
        """
        implementation_hash = self.hasher.hash_class_source(cls)
        class_name = f"{cls.__module__}.{cls.__name__}"
        return ImplementationIdentity(
            implementation_hash=implementation_hash,
            implementation_type="class",
            implementation_name=class_name,
            authority_version=self.authority_version,
        )
