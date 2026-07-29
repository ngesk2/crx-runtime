"""Authority Graph

Declarative authority construction through AuthorityGraph.

Architecture:
AuthorityGraph
  ↓
  AuthorityGraphBuilder
  ↓
  AuthorityGraphExecutor
  ↓
  Runtime

Replaces hand-written authority construction with declarative graph.
"""

from dataclasses import dataclass
from typing import Any, Callable, Dict, List
from enum import Enum


class AuthorityType(Enum):
    """Types of authorities"""
    HASH_AUTHORITY = "hash_authority"
    CANONICAL_SERIALIZER = "canonical_serializer"
    CANONICAL_TRAVERSAL_AUTHORITY = "canonical_traversal_authority"
    CANONICAL_BYTE_AUTHORITY = "canonical_byte_authority"
    IMPLEMENTATION_AUTHORITY = "implementation_authority"
    WITNESS_AUTHORITY = "witness_authority"
    CONFIGURATION_AUTHORITY = "configuration_authority"


@dataclass(frozen=True)
class AuthorityDescriptor:
    """
    Declarative descriptor for an authority.
    
    Contains:
    - authority_type (type of authority)
    - name (authority name)
    - dependencies (list of authority names this depends on)
    - constructor (function to construct the authority)
    - config (configuration for the authority)
    """
    authority_type: AuthorityType
    name: str
    dependencies: List[str]
    constructor: Callable[..., Any]
    config: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "authority_type": self.authority_type.value,
            "name": self.name,
            "dependencies": self.dependencies,
            "config": self.config,
        }


@dataclass(frozen=True)
class AuthorityGraph:
    """
    Declarative graph of authority dependencies.
    
    Represents the entire runtime authority construction as a declarative graph.
    """
    authorities: Dict[str, AuthorityDescriptor]
    version: str = "1.0.0"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "version": self.version,
            "authorities": {
                name: descriptor.to_dict()
                for name, descriptor in self.authorities.items()
            },
        }
    
    def get_authority_descriptor(self, name: str) -> AuthorityDescriptor:
        """Get authority descriptor by name"""
        descriptor = self.authorities.get(name)
        if not descriptor:
            raise ValueError(f"No authority descriptor found: {name}")
        return descriptor
    
    def get_dependency_order(self) -> List[str]:
        """
        Get topological order of authority dependencies.
        
        Returns:
            List of authority names in dependency order
        """
        # Topological sort using Kahn's algorithm
        in_degree = {name: 0 for name in self.authorities}
        dependency_map = {name: [] for name in self.authorities}
        
        for name, descriptor in self.authorities.items():
            for dep in descriptor.dependencies:
                if dep in dependency_map:
                    dependency_map[dep].append(name)
                    in_degree[name] += 1
        
        # Queue of nodes with no dependencies
        queue = [name for name, degree in in_degree.items() if degree == 0]
        result = []
        
        while queue:
            node = queue.pop(0)
            result.append(node)
            
            for dependent in dependency_map[node]:
                in_degree[dependent] -= 1
                if in_degree[dependent] == 0:
                    queue.append(dependent)
        
        if len(result) != len(self.authorities):
            raise ValueError("Circular dependency detected in authority graph")
        
        return result


class AuthorityGraphBuilder:
    """
    Builder for declarative authority graphs.
    
    Provides a fluent interface for building authority graphs.
    """
    
    def __init__(self, version: str = "1.0.0"):
        self.version = version
        self._authorities: Dict[str, AuthorityDescriptor] = {}
    
    def add_authority(
        self,
        authority_type: AuthorityType,
        name: str,
        dependencies: List[str],
        constructor: Callable[..., Any],
        config: Dict[str, Any] | None = None,
    ) -> "AuthorityGraphBuilder":
        """
        Add an authority to the graph.
        
        Args:
            authority_type: Type of authority
            name: Authority name
            dependencies: List of authority names this depends on
            constructor: Function to construct the authority
            config: Configuration for the authority
        
        Returns:
            Self for chaining
        """
        descriptor = AuthorityDescriptor(
            authority_type=authority_type,
            name=name,
            dependencies=dependencies,
            constructor=constructor,
            config=config or {},
        )
        self._authorities[name] = descriptor
        return self
    
    def build(self) -> AuthorityGraph:
        """
        Build the authority graph.
        
        Returns:
            Authority graph
        """
        return AuthorityGraph(
            authorities=self._authorities.copy(),
            version=self.version,
        )


class AuthorityGraphExecutor:
    """
    Executor for authority graphs.
    
    Executes the authority graph to construct authorities.
    """
    
    def __init__(self, graph: AuthorityGraph):
        self.graph = graph
        self._constructed: Dict[str, Any] = {}
    
    def execute(self) -> Dict[str, Any]:
        """
        Execute the authority graph to construct authorities.
        
        Returns:
            Dictionary of constructed authorities
        """
        # Get dependency order
        order = self.graph.get_dependency_order()
        
        # Construct authorities in dependency order
        for name in order:
            descriptor = self.graph.get_authority_descriptor(name)
            
            # Get dependencies
            dependencies = {
                dep: self._constructed[dep]
                for dep in descriptor.dependencies
                if dep in self._constructed
            }
            
            # Construct authority
            authority = descriptor.constructor(
                **dependencies,
                **descriptor.config,
            )
            
            self._constructed[name] = authority
        
        return self._constructed
    
    def get_authority(self, name: str) -> Any:
        """
        Get a constructed authority by name.
        
        Args:
            name: Authority name
        
        Returns:
            Constructed authority
        """
        if name not in self._constructed:
            raise ValueError(f"Authority not constructed: {name}")
        return self._constructed[name]
