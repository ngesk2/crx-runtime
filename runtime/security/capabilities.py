"""
Capability-Based Authorization System

Constitutional: Capability-based access control for all operations.
No role-based checks directly in business logic.

Architecture:
User/API/Worker
        ↓
Auth Layer
        ↓
Capability Resolver
        ↓
Policy Engine
        ↓
Allowed Operation
        ↓
Event Store

Capabilities (not roles):
EVENT_WRITE - Can append events to event store
EVENT_READ - Can read events from event store
REPLAY_ENGINE - Can trigger replay operations
CONSTITUTION_ADMIN - Can modify constitutional documents
PROJECTION_WORKER - Can project events to Qdrant
MEMORY_READ - Can read from memory collections
ARCHIVE_READ - Can read from archive
SEARCH_AGENT - Can perform search operations
SECRET_READ - Can read secrets from Vault
DRIVE_INGEST - Can ingest from Google Drive
SYSTEM_MONITOR - Can read system metrics
"""

from enum import Enum
from typing import Set, List, Optional
from dataclasses import dataclass
from functools import wraps


class Capability(Enum):
    """System capabilities."""
    EVENT_WRITE = "EVENT_WRITE"
    EVENT_READ = "EVENT_READ"
    REPLAY_ENGINE = "REPLAY_ENGINE"
    CONSTITUTION_ADMIN = "CONSTITUTION_ADMIN"
    PROJECTION_WORKER = "PROJECTION_WORKER"
    MEMORY_READ = "MEMORY_READ"
    ARCHIVE_READ = "ARCHIVE_READ"
    SEARCH_AGENT = "SEARCH_AGENT"
    SECRET_READ = "SECRET_READ"
    DRIVE_INGEST = "DRIVE_INGEST"
    SYSTEM_MONITOR = "SYSTEM_MONITOR"


@dataclass
class Role:
    """Role with associated capabilities."""
    name: str
    capabilities: Set[Capability]
    description: str


# Role definitions
ROLES: dict[str, Role] = {
    "EVENT_WRITER": Role(
        name="EVENT_WRITER",
        capabilities={Capability.EVENT_WRITE, Capability.EVENT_READ},
        description="Can write and read events"
    ),
    "REPLAY_ENGINE": Role(
        name="REPLAY_ENGINE",
        capabilities={Capability.EVENT_READ, Capability.REPLAY_ENGINE},
        description="Can trigger replay operations"
    ),
    "CONSTITUTION_ADMIN": Role(
        name="CONSTITUTION_ADMIN",
        capabilities={
            Capability.EVENT_WRITE,
            Capability.EVENT_READ,
            Capability.CONSTITUTION_ADMIN,
            Capability.PROJECTION_WORKER
        },
        description="Full constitutional administration"
    ),
    "PROJECTION_WORKER": Role(
        name="PROJECTION_WORKER",
        capabilities={
            Capability.EVENT_READ,
            Capability.PROJECTION_WORKER,
            Capability.MEMORY_READ
        },
        description="Projects events to memory stores"
    ),
    "ARCHIVE_READER": Role(
        name="ARCHIVE_READER",
        capabilities={Capability.ARCHIVE_READ, Capability.EVENT_READ},
        description="Read-only archive access"
    ),
    "SEARCH_AGENT": Role(
        name="SEARCH_AGENT",
        capabilities={Capability.SEARCH_AGENT, Capability.MEMORY_READ},
        description="Can perform search operations"
    ),
    "SECRET_READER": Role(
        name="SECRET_READER",
        capabilities={Capability.SECRET_READ},
        description="Can read secrets from Vault"
    ),
    "DRIVE_INGESTOR": Role(
        name="DRIVE_INGESTOR",
        capabilities={
            Capability.EVENT_WRITE,
            Capability.DRIVE_INGEST,
            Capability.EVENT_READ
        },
        description="Can ingest from Google Drive"
    ),
    "SYSTEM_MONITOR": Role(
        name="SYSTEM_MONITOR",
        capabilities={Capability.SYSTEM_MONITOR, Capability.EVENT_READ},
        description="Can read system metrics"
    ),
}


@dataclass
class Identity:
    """System identity with roles and capabilities."""
    subject: str  # e.g., "agent_001", "user_123"
    roles: Set[str]
    capabilities: Set[Capability]
    
    def has_capability(self, capability: Capability) -> bool:
        """Check if identity has capability."""
        return capability in self.capabilities
    
    def has_any_capability(self, capabilities: Set[Capability]) -> bool:
        """Check if identity has any of the specified capabilities."""
        return bool(self.capabilities & capabilities)
    
    def has_all_capabilities(self, capabilities: Set[Capability]) -> bool:
        """Check if identity has all of the specified capabilities."""
        return capabilities.issubset(self.capabilities)


class CapabilityResolver:
    """
    Resolves capabilities from roles.
    
    Constitutional: Single authority for capability resolution.
    """
    
    @staticmethod
    def resolve_capabilities(roles: Set[str]) -> Set[Capability]:
        """
        Resolve capabilities from roles.
        
        Args:
            roles: Set of role names
        
        Returns:
            Set of capabilities
        """
        capabilities = set()
        
        for role_name in roles:
            if role_name in ROLES:
                role = ROLES[role_name]
                capabilities.update(role.capabilities)
        
        return capabilities
    
    @staticmethod
    def create_identity(subject: str, roles: List[str]) -> Identity:
        """
        Create identity from subject and roles.
        
        Args:
            subject: Subject identifier
            roles: List of role names
        
        Returns:
            Identity object
        """
        role_set = set(roles)
        capabilities = CapabilityResolver.resolve_capabilities(role_set)
        
        return Identity(
            subject=subject,
            roles=role_set,
            capabilities=capabilities
        )


def requires_capability(*required_capabilities: Capability):
    """
    Decorator to require capabilities for function execution.
    
    Usage:
        @requires_capability(Capability.EVENT_WRITE)
        def create_event():
            ...
    
    Args:
        required_capabilities: Required capabilities
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Get identity from context (would be set by auth middleware)
            from .policy_engine import get_current_identity
            
            identity = get_current_identity()
            
            if identity is None:
                raise PermissionError("No identity in context")
            
            required = set(required_capabilities)
            
            if not identity.has_all_capabilities(required):
                missing = required - identity.capabilities
                raise PermissionError(
                    f"Missing required capabilities: {missing}. "
                    f"Identity: {identity.subject}, Capabilities: {identity.capabilities}"
                )
            
            return func(*args, **kwargs)
        
        return wrapper
    return decorator


def requires_any_capability(*required_capabilities: Capability):
    """
    Decorator to require any of the specified capabilities.
    
    Usage:
        @requires_any_capability(Capability.EVENT_WRITE, Capability.CONSTITUTION_ADMIN)
        def modify_event():
            ...
    
    Args:
        required_capabilities: Required capabilities (any one is sufficient)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            from .policy_engine import get_current_identity
            
            identity = get_current_identity()
            
            if identity is None:
                raise PermissionError("No identity in context")
            
            required = set(required_capabilities)
            
            if not identity.has_any_capability(required):
                raise PermissionError(
                    f"Missing required capabilities. Need one of: {required}. "
                    f"Identity: {identity.subject}, Capabilities: {identity.capabilities}"
                )
            
            return func(*args, **kwargs)
        
        return wrapper
    return decorator


def main():
    """Test capability system."""
    # Create identity with multiple roles
    identity = CapabilityResolver.create_identity(
        subject="agent_001",
        roles=["PROJECTION_WORKER", "EVENT_WRITER"]
    )
    
    print(f"Identity: {identity.subject}")
    print(f"Roles: {identity.roles}")
    print(f"Capabilities: {[c.value for c in identity.capabilities]}")
    
    # Test capability checks
    print(f"\nHas EVENT_WRITE: {identity.has_capability(Capability.EVENT_WRITE)}")
    print(f"Has CONSTITUTION_ADMIN: {identity.has_capability(Capability.CONSTITUTION_ADMIN)}")
    print(f"Has any (EVENT_WRITE, CONSTITUTION_ADMIN): {identity.has_any_capability({Capability.EVENT_WRITE, Capability.CONSTITUTION_ADMIN})}")
    print(f"Has all (EVENT_WRITE, PROJECTION_WORKER): {identity.has_all_capabilities({Capability.EVENT_WRITE, Capability.PROJECTION_WORKER})}")


if __name__ == '__main__':
    main()
