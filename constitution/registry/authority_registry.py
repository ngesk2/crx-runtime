"""
Authority Registry - Central registry for constitutional authorities.

This registry defines all constitutional authorities that can authorize
actions within the system.
"""

from typing import Any, Dict, List, Optional, Protocol, runtime_checkable
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime


class AuthorityCategory(Enum):
    """Categories of constitutional authorities."""
    ACQUIRE = "acquire"           # Authorize evidence acquisition
    INGEST = "ingest"             # Authorize evidence ingestion
    TRANSFORM = "transform"       # Authorize data transformation
    EXECUTE = "execute"           # Authorize external actions
    DEPLOY = "deploy"             # Authorize infrastructure deployment
    ACCESS = "access"             # Authorize resource access
    MODIFY = "modify"             # Authorize state modification
    DELETE = "delete"             # Authorize deletion


@dataclass
class AuthorityMetadata:
    """Metadata for an authority."""
    name: str
    version: str
    category: AuthorityCategory
    description: str
    author: str
    required_capabilities: List[str] = field(default_factory=list)
    required_objects: List[str] = field(default_factory=list)
    constraints: Dict[str, Any] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)
    registered_at: datetime = field(default_factory=datetime.utcnow)


@runtime_checkable
class Authority(Protocol):
    """Protocol that all authorities must implement."""
    
    @property
    def metadata(self) -> AuthorityMetadata:
        """Return authority metadata."""
        ...
    
    async def authorize(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Authorize an action with given context."""
        ...
    
    async def check_constraints(self, context: Dict[str, Any]) -> bool:
        """Check if context satisfies authority constraints."""
        ...


class AuthorityRegistry:
    """
    Central registry for constitutional authorities.
    
    This registry provides:
    - Authority discovery
    - Authority registration
    - Authorization execution
    - Constraint checking
    """
    
    def __init__(self):
        self._authorities: Dict[str, Authority] = {}
        self._metadata: Dict[str, AuthorityMetadata] = {}
        self._categories: Dict[AuthorityCategory, List[str]] = {
            category: [] for category in AuthorityCategory
        }
    
    def register(self, authority: Authority) -> None:
        """Register an authority."""
        metadata = authority.metadata
        name = metadata.name
        
        if name in self._authorities:
            raise ValueError(f"Authority {name} already registered")
        
        self._authorities[name] = authority
        self._metadata[name] = metadata
        self._categories[metadata.category].append(name)
        
        print(f"Registered authority: {name} ({metadata.category.value})")
    
    def get(self, name: str) -> Optional[Authority]:
        """Get an authority by name."""
        return self._authorities.get(name)
    
    def list(self, category: Optional[AuthorityCategory] = None) -> List[str]:
        """List authority names, optionally filtered by category."""
        if category is None:
            return list(self._authorities.keys())
        return self._categories[category].copy()
    
    def get_metadata(self, name: str) -> Optional[AuthorityMetadata]:
        """Get authority metadata."""
        return self._metadata.get(name)
    
    async def authorize(self, name: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Authorize an action by authority name."""
        authority = self.get(name)
        if authority is None:
            raise ValueError(f"Authority {name} not found")
        
        return await authority.authorize(context)
    
    async def check_constraints(self, name: str, context: Dict[str, Any]) -> bool:
        """Check constraints for an authority."""
        authority = self.get(name)
        if authority is None:
            return False
        
        return await authority.check_constraints(context)


# Global registry instance
_global_registry: Optional[AuthorityRegistry] = None


def get_authority_registry() -> AuthorityRegistry:
    """Get the global authority registry."""
    global _global_registry
    if _global_registry is None:
        _global_registry = AuthorityRegistry()
    return _global_registry


def register_authority(authority: Authority) -> None:
    """Register an authority with the global registry."""
    registry = get_authority_registry()
    registry.register(authority)
