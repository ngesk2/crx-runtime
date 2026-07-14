"""
Semantic Capability Types - Hierarchical capability types.

Instead of string capabilities like "filesystem.read":
Capability → Filesystem → Directory → Workspace → Artifact → Operation

Then capability negotiation becomes mathematical:

Hermes asks:
Need: Write → Artifact → Workspace → Mission Workspace

Broker proves:
Allowed because:
- Mission owns workspace
- Workspace owns artifact
- Artifact allows write
- Lease valid

No string matching. Real graph reasoning.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Set
from datetime import datetime, timezone
from enum import Enum
import json
import uuid
from pathlib import Path


class CapabilityDomain(Enum):
    """Top-level capability domains."""
    FILESYSTEM = "filesystem"
    NETWORK = "network"
    SHELL = "shell"
    MEMORY = "memory"
    ARTIFACT = "artifact"
    POLICY = "policy"
    CAPABILITY = "capability"


class Operation(Enum):
    """Operations on capabilities."""
    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    EXECUTE = "execute"
    CONNECT = "connect"
    LIST = "list"
    CREATE = "create"
    MODIFY = "modify"


@dataclass
class CapabilityPath:
    """
    Hierarchical capability path.
    
    Example: filesystem.directory.workspace.artifact.write
    """
    domain: CapabilityDomain
    path_components: List[str]
    operation: Operation
    
    def to_string(self) -> str:
        """Convert to string representation."""
        path_str = ".".join(self.path_components)
        return f"{self.domain.value}.{path_str}.{self.operation.value}"
    
    @classmethod
    def from_string(cls, path_str: str) -> 'CapabilityPath':
        """Parse from string."""
        parts = path_str.split(".")
        domain = CapabilityDomain(parts[0])
        operation = Operation(parts[-1])
        path_components = parts[1:-1]
        return cls(domain, path_components, operation)
    
    def is_ancestor_of(self, other: 'CapabilityPath') -> bool:
        """Check if this path is an ancestor of another."""
        if self.domain != other.domain:
            return False
        if self.operation != other.operation:
            return False
        
        # Check if this path is a prefix of the other
        for i, component in enumerate(self.path_components):
            if i >= len(other.path_components):
                return False
            if component != other.path_components[i]:
                return False
        
        return len(self.path_components) < len(other.path_components)
    
    def is_descendant_of(self, other: 'CapabilityPath') -> bool:
        """Check if this path is a descendant of another."""
        return other.is_ancestor_of(self)
    
    def matches(self, pattern: 'CapabilityPath') -> bool:
        """Check if this path matches a pattern (supports wildcards)."""
        if pattern.domain != CapabilityDomain.ANY and pattern.domain != self.domain:
            return False
        if pattern.operation != Operation.ANY and pattern.operation != self.operation:
            return False
        
        # Check path components
        for i, component in enumerate(pattern.path_components):
            if component == "*":
                continue  # Wildcard matches anything
            if i >= len(self.path_components):
                return False
            if component != self.path_components[i]:
                return False
        
        return True


@dataclass
class Ownership:
    """Ownership information for resources."""
    owner_id: str
    owner_type: str  # mission, agent, system
    granted_at: str
    expires_at: Optional[str]
    inherited: bool
    parent_owners: List[str]


@dataclass
class SemanticCapability:
    """
    A semantic capability with hierarchical structure.
    
    Enables mathematical capability negotiation.
    """
    capability_id: str
    path: CapabilityPath
    ownership: Ownership
    allowed_operations: List[Operation]
    denied_operations: List[Operation]
    constraints: Dict[str, Any]
    metadata: Dict[str, Any]
    
    def allows(self, operation: Operation) -> bool:
        """Check if operation is allowed."""
        if operation in self.denied_operations:
            return False
        if operation in self.allowed_operations:
            return True
        return False
    
    def is_valid(self) -> bool:
        """Check if capability is still valid."""
        if self.ownership.expires_at:
            expires = datetime.fromisoformat(self.ownership.expires_at)
            return datetime.now(timezone.utc) < expires
        return True


class SemanticCapabilityBroker:
    """
    Broker for semantic capabilities.
    
    Performs mathematical capability negotiation using graph reasoning.
    """
    
    def __init__(self):
        self._capabilities: Dict[str, SemanticCapability] = {}
        self._ownership_graph: Dict[str, List[str]] = {}  # owner_id → owned_resources
        self._resource_owners: Dict[str, str] = {}  # resource_id → owner_id
    
    def register_capability(self, capability: SemanticCapability) -> None:
        """Register a semantic capability."""
        self._capabilities[capability.capability_id] = capability
        
        # Update ownership graph
        owner_id = capability.ownership.owner_id
        if owner_id not in self._ownership_graph:
            self._ownership_graph[owner_id] = []
        self._ownership_graph[owner_id].append(capability.capability_id)
        
        # Map resource to owner
        resource_path = capability.path.to_string()
        self._resource_owners[resource_path] = owner_id
    
    def request_capability(
        self,
        requester_id: str,
        requested_path: CapabilityPath,
        context: Dict[str, Any]
    ) -> tuple[bool, str, Optional[SemanticCapability]]:
        """
        Request a capability using semantic negotiation.
        
        Args:
            requester_id: ID of requester
            requested_path: Requested capability path
            context: Context information
        
        Returns:
            (allowed, reason, capability)
        """
        # Check if requester owns the resource
        resource_path_str = requested_path.to_string()
        resource_owner = self._resource_owners.get(resource_path_str)
        
        if resource_owner == requester_id:
            # Direct ownership
            capability = self._find_capability(requested_path)
            if capability and capability.is_valid():
                return True, "Direct ownership", capability
            return False, "Ownership exists but capability invalid", None
        
        # Check for inherited ownership
        if self._has_ownership_chain(requester_id, resource_path_str):
            capability = self._find_capability(requested_path)
            if capability and capability.is_valid():
                return True, "Inherited ownership", capability
            return False, "Inherited ownership exists but capability invalid", None
        
        # Check if any ancestor grants permission
        for cap_id, capability in self._capabilities.items():
            if capability.path.is_ancestor_of(requested_path):
                if capability.ownership.owner_id == requester_id:
                    if capability.allows(requested_path.operation):
                        return True, "Ancestor capability grants permission", capability
        
        return False, "No ownership or permission found", None
    
    def _find_capability(self, path: CapabilityPath) -> Optional[SemanticCapability]:
        """Find capability matching path."""
        for capability in self._capabilities.values():
            if capability.path.to_string() == path.to_string():
                return capability
        return None
    
    def _has_ownership_chain(self, requester_id: str, resource_path: str) -> bool:
        """Check if there's an ownership chain from requester to resource."""
        # Simplified: check if requester owns any ancestor
        for cap_id, capability in self._capabilities.items():
            if capability.ownership.owner_id == requester_id:
                cap_path = capability.path.to_string()
                if resource_path.startswith(cap_path):
                    return True
        return False
    
    def prove_permission(
        self,
        requester_id: str,
        capability_path: CapabilityPath
    ) -> List[str]:
        """
        Generate proof of permission.
        
        Returns list of reasoning steps.
        """
        proof = []
        
        # Step 1: Check direct ownership
        resource_path_str = capability_path.to_string()
        resource_owner = self._resource_owners.get(resource_path_str)
        
        if resource_owner == requester_id:
            proof.append(f"Step 1: {requester_id} directly owns {resource_path_str}")
            proof.append(f"Step 2: Direct ownership grants permission")
            return proof
        
        # Step 2: Check inherited ownership
        if self._has_ownership_chain(requester_id, resource_path_str):
            proof.append(f"Step 1: {requester_id} owns ancestor of {resource_path_str}")
            proof.append(f"Step 2: Ownership chain grants inherited permission")
            return proof
        
        # Step 3: Check ancestor capabilities
        for cap_id, capability in self._capabilities.items():
            if capability.path.is_ancestor_of(capability_path):
                if capability.ownership.owner_id == requester_id:
                    if capability.allows(capability_path.operation):
                        proof.append(f"Step 1: {requester_id} owns {capability.path.to_string()}")
                        proof.append(f"Step 2: {capability.path.to_string()} is ancestor of {resource_path_str}")
                        proof.append(f"Step 3: Ancestor capability grants {capability_path.operation.value} permission")
                        return proof
        
        proof.append("Step 1: No ownership chain found")
        proof.append("Step 2: Permission denied")
        return proof


class CapabilityPathBuilder:
    """
    Builder for constructing capability paths.
    """
    
    @staticmethod
    def filesystem(directory: str, workspace: str, artifact: str, operation: Operation) -> CapabilityPath:
        """Build filesystem capability path."""
        return CapabilityPath(
            domain=CapabilityDomain.FILESYSTEM,
            path_components=[directory, workspace, artifact],
            operation=operation
        )
    
    @staticmethod
    def network(host: str, port: str, operation: Operation) -> CapabilityPath:
        """Build network capability path."""
        return CapabilityPath(
            domain=CapabilityDomain.NETWORK,
            path_components=[host, str(port)],
            operation=operation
        )
    
    @staticmethod
    def artifact(artifact_type: str, artifact_id: str, operation: Operation) -> CapabilityPath:
        """Build artifact capability path."""
        return CapabilityPath(
            domain=CapabilityDomain.ARTIFACT,
            path_components=[artifact_type, artifact_id],
            operation=operation
        )
    
    @staticmethod
    def policy(policy_type: str, policy_id: str, operation: Operation) -> CapabilityPath:
        """Build policy capability path."""
        return CapabilityPath(
            domain=CapabilityDomain.POLICY,
            path_components=[policy_type, policy_id],
            operation=operation
        )


class SemanticCapabilityBuilder:
    """
    Builder for creating semantic capabilities.
    """
    
    def __init__(self):
        self._capability_id = None
        self._path = None
        self._owner_id = None
        self._owner_type = "mission"
        self._expires_at = None
        self._allowed_operations: List[Operation] = []
        self._denied_operations: List[Operation] = []
        self._constraints: Dict[str, Any] = {}
        self._metadata: Dict[str, Any] = {}
    
    def with_id(self, capability_id: str) -> 'SemanticCapabilityBuilder':
        """Set capability ID."""
        self._capability_id = capability_id
        return self
    
    def with_path(self, path: CapabilityPath) -> 'SemanticCapabilityBuilder':
        """Set capability path."""
        self._path = path
        return self
    
    def with_owner(self, owner_id: str, owner_type: str = "mission") -> 'SemanticCapabilityBuilder':
        """Set owner."""
        self._owner_id = owner_id
        self._owner_type = owner_type
        return self
    
    def with_expiration(self, expires_at: str) -> 'SemanticCapabilityBuilder':
        """Set expiration."""
        self._expires_at = expires_at
        return self
    
    def with_allowed_operation(self, operation: Operation) -> 'SemanticCapabilityBuilder':
        """Add allowed operation."""
        self._allowed_operations.append(operation)
        return self
    
    def with_denied_operation(self, operation: Operation) -> 'SemanticCapabilityBuilder':
        """Add denied operation."""
        self._denied_operations.append(operation)
        return self
    
    def with_constraint(self, key: str, value: Any) -> 'SemanticCapabilityBuilder':
        """Add constraint."""
        self._constraints[key] = value
        return self
    
    def with_metadata(self, key: str, value: Any) -> 'SemanticCapabilityBuilder':
        """Add metadata."""
        self._metadata[key] = value
        return self
    
    def build(self) -> SemanticCapability:
        """Build the semantic capability."""
        import uuid
        
        if not self._capability_id:
            self._capability_id = str(uuid.uuid4())
        
        ownership = Ownership(
            owner_id=self._owner_id or "system",
            owner_type=self._owner_type,
            granted_at=datetime.now(timezone.utc).isoformat(),
            expires_at=self._expires_at,
            inherited=False,
            parent_owners=[]
        )
        
        return SemanticCapability(
            capability_id=self._capability_id,
            path=self._path,
            ownership=ownership,
            allowed_operations=self._allowed_operations,
            denied_operations=self._denied_operations,
            constraints=self._constraints,
            metadata=self._metadata
        )


# Singleton instance
_semantic_broker = SemanticCapabilityBroker()


def get_semantic_capability_broker() -> SemanticCapabilityBroker:
    """Get the singleton semantic capability broker."""
    return _semantic_broker
