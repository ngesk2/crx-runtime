"""
Knowledge Graph - Separate Knowledge from Planning.

Planner never knows:
- Docker
- Git
- Python
- FastAPI
- Filesystem
- Linux

Those belong inside Knowledge.

Planner should only reason over abstract ontology.

Example:
Instead of "Use Git"
Planner thinks "Versioned storage required"
Knowledge Graph decides Git satisfies it.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Set
from datetime import datetime, timezone
from enum import Enum
import json
import uuid
from pathlib import Path


class KnowledgeType(Enum):
    """Types of knowledge."""
    CAPABILITY = "capability"
    SKILL = "skill"
    RESOURCE = "resource"
    CONSTRAINT = "constraint"
    PATTERN = "pattern"
    IMPLEMENTATION = "implementation"


class OntologyLevel(Enum):
    """Levels in the ontology hierarchy."""
    ABSTRACT = "abstract"  # High-level concepts
    CONCRETE = "concrete"  # Specific implementations
    INSTANCE = "instance"  # Concrete instances


@dataclass
class KnowledgeNode:
    """A node in the knowledge graph."""
    node_id: str
    node_type: KnowledgeType
    ontology_level: OntologyLevel
    name: str
    description: str
    properties: Dict[str, Any]
    capabilities_provided: List[str]
    resources_required: List[str]
    parents: List[str]  # Parent nodes in ontology
    children: List[str]  # Child nodes in ontology
    metadata: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "node_id": self.node_id,
            "node_type": self.node_type.value,
            "ontology_level": self.ontology_level.value,
            "name": self.name,
            "description": self.description,
            "properties": self.properties,
            "capabilities_provided": self.capabilities_provided,
            "resources_required": self.resources_required,
            "parents": self.parents,
            "children": self.children,
            "metadata": self.metadata
        }


@dataclass
class KnowledgeEdge:
    """An edge in the knowledge graph."""
    edge_id: str
    source_id: str
    target_id: str
    edge_type: str  # implements, provides, requires, specializes
    weight: float
    properties: Dict[str, Any]


class KnowledgeGraph:
    """
    Knowledge Graph - Abstract ontology separate from planning.
    
    Planner reasons over abstract concepts.
    Knowledge Graph maps abstract to concrete implementations.
    """
    
    def __init__(self, storage_path: str = "runtime/knowledge/graph.json"):
        self.storage_path = Path(storage_path)
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        self._nodes: Dict[str, KnowledgeNode] = {}
        self._edges: List[KnowledgeEdge] = []
        self._load()
    
    def _load(self) -> None:
        """Load knowledge graph from storage."""
        if not self.storage_path.exists():
            return
        
        with open(self.storage_path, 'r') as f:
            data = json.load(f)
            
            for node_data in data.get("nodes", []):
                node = KnowledgeNode(
                    node_id=node_data["node_id"],
                    node_type=KnowledgeType(node_data["node_type"]),
                    ontology_level=OntologyLevel(node_data["ontology_level"]),
                    name=node_data["name"],
                    description=node_data["description"],
                    properties=node_data.get("properties", {}),
                    capabilities_provided=node_data.get("capabilities_provided", []),
                    resources_required=node_data.get("resources_required", []),
                    parents=node_data.get("parents", []),
                    children=node_data.get("children", []),
                    metadata=node_data.get("metadata", {})
                )
                self._nodes[node.node_id] = node
            
            for edge_data in data.get("edges", []):
                edge = KnowledgeEdge(
                    edge_id=edge_data["edge_id"],
                    source_id=edge_data["source_id"],
                    target_id=edge_data["target_id"],
                    edge_type=edge_data["edge_type"],
                    weight=edge_data.get("weight", 1.0),
                    properties=edge_data.get("properties", {})
                )
                self._edges.append(edge)
    
    def _save(self) -> None:
        """Save knowledge graph to storage."""
        data = {
            "nodes": [node.to_dict() for node in self._nodes.values()],
            "edges": [
                {
                    "edge_id": edge.edge_id,
                    "source_id": edge.source_id,
                    "target_id": edge.target_id,
                    "edge_type": edge.edge_type,
                    "weight": edge.weight,
                    "properties": edge.properties
                }
                for edge in self._edges
            ],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        with open(self.storage_path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def add_node(self, node: KnowledgeNode) -> None:
        """Add a node to the knowledge graph."""
        self._nodes[node.node_id] = node
        self._save()
    
    def add_edge(self, edge: KnowledgeEdge) -> None:
        """Add an edge to the knowledge graph."""
        self._edges.append(edge)
        
        # Update parent/child relationships
        if edge.source_id in self._nodes:
            self._nodes[edge.source_id].children.append(edge.target_id)
        if edge.target_id in self._nodes:
            self._nodes[edge.target_id].parents.append(edge.source_id)
        
        self._save()
    
    def query_abstract_capability(self, capability_name: str) -> List[KnowledgeNode]:
        """
        Query for abstract capability.
        
        Planner asks: "Need versioned storage"
        Knowledge Graph returns: Git, SVN, Mercurial
        """
        matching = []
        
        for node in self._nodes.values():
            if node.ontology_level == OntologyLevel.ABSTRACT:
                if capability_name in node.capabilities_provided:
                    matching.append(node)
        
        return matching
    
    def find_implementations(self, abstract_node_id: str) -> List[KnowledgeNode]:
        """
        Find concrete implementations of an abstract node.
        
        Planner: "Versioned storage required"
        Knowledge Graph: Git satisfies it
        """
        implementations = []
        
        for edge in self._edges:
            if edge.source_id == abstract_node_id and edge.edge_type == "implements":
                target = self._nodes.get(edge.target_id)
                if target and target.ontology_level == OntologyLevel.CONCRETE:
                    implementations.append(target)
        
        return implementations
    
    def find_best_implementation(
        self,
        abstract_capability: str,
        constraints: Dict[str, Any]
    ) -> Optional[KnowledgeNode]:
        """
        Find best implementation given constraints.
        
        Args:
            abstract_capability: Abstract capability needed
            constraints: Constraints (e.g., offline, local, etc.)
        
        Returns:
            Best matching implementation
        """
        # Find abstract node
        abstract_nodes = self.query_abstract_capability(abstract_capability)
        if not abstract_nodes:
            return None
        
        # Find implementations
        implementations = []
        for abstract_node in abstract_nodes:
            implementations.extend(self.find_implementations(abstract_node.node_id))
        
        if not implementations:
            return None
        
        # Score implementations based on constraints
        best_implementation = None
        best_score = -1
        
        for impl in implementations:
            score = self._score_implementation(impl, constraints)
            if score > best_score:
                best_score = score
                best_implementation = impl
        
        return best_implementation
    
    def _score_implementation(self, node: KnowledgeNode, constraints: Dict[str, Any]) -> float:
        """Score an implementation against constraints."""
        score = 0.0
        
        # Check property matches
        for key, value in constraints.items():
            if key in node.properties:
                if node.properties[key] == value:
                    score += 1.0
                else:
                    score -= 0.5
        
        # Check resource requirements
        for resource in constraints.get("required_resources", []):
            if resource in node.resources_required:
                score += 0.5
        
        return score
    
    def get_ontology_path(self, node_id: str) -> List[str]:
        """Get the ontology path from abstract to concrete."""
        path = []
        current = self._nodes.get(node_id)
        
        while current:
            path.append(current.node_id)
            if current.parents:
                current = self._nodes.get(current.parents[0])
            else:
                break
        
        return list(reversed(path))


class KnowledgeInitializer:
    """
    Initializes the knowledge graph with base ontology.
    """
    
    def __init__(self, graph: KnowledgeGraph):
        self.graph = graph
    
    def initialize_base_ontology(self) -> None:
        """Initialize base knowledge ontology."""
        
        # Abstract: Storage
        storage = KnowledgeNode(
            node_id="storage_abstract",
            node_type=KnowledgeType.CAPABILITY,
            ontology_level=OntologyLevel.ABSTRACT,
            name="Storage",
            description="Abstract storage capability",
            properties={"type": "storage"},
            capabilities_provided=["read", "write", "delete"],
            resources_required=[],
            parents=[],
            children=[],
            metadata={}
        )
        self.graph.add_node(storage)
        
        # Abstract: Versioned Storage
        versioned_storage = KnowledgeNode(
            node_id="versioned_storage_abstract",
            node_type=KnowledgeType.CAPABILITY,
            ontology_level=OntologyLevel.ABSTRACT,
            name="Versioned Storage",
            description="Abstract versioned storage capability",
            properties={"type": "storage", "versioned": True},
            capabilities_provided=["read", "write", "delete", "version", "history"],
            resources_required=["storage_abstract"],
            parents=["storage_abstract"],
            children=[],
            metadata={}
        )
        self.graph.add_node(versioned_storage)
        
        # Concrete: Git
        git = KnowledgeNode(
            node_id="git_implementation",
            node_type=KnowledgeType.IMPLEMENTATION,
            ontology_level=OntologyLevel.CONCRETE,
            name="Git",
            description="Git version control system",
            properties={"offline": True, "distributed": True, "language": "C"},
            capabilities_provided=["read", "write", "delete", "version", "history", "branch", "merge"],
            resources_required=["filesystem", "network"],
            parents=["versioned_storage_abstract"],
            children=[],
            metadata={"command": "git"}
        )
        self.graph.add_node(git)
        
        # Concrete: SVN
        svn = KnowledgeNode(
            node_id="svn_implementation",
            node_type=KnowledgeType.IMPLEMENTATION,
            ontology_level=OntologyLevel.CONCRETE,
            name="SVN",
            description="Subversion version control system",
            properties={"offline": False, "centralized": True, "language": "C"},
            capabilities_provided=["read", "write", "delete", "version", "history"],
            resources_required=["filesystem", "network"],
            parents=["versioned_storage_abstract"],
            children=[],
            metadata={"command": "svn"}
        )
        self.graph.add_node(svn)
        
        # Abstract: Network
        network = KnowledgeNode(
            node_id="network_abstract",
            node_type=KnowledgeType.CAPABILITY,
            ontology_level=OntologyLevel.ABSTRACT,
            name="Network",
            description="Abstract network capability",
            properties={"type": "network"},
            capabilities_provided=["connect", "send", "receive"],
            resources_required=[],
            parents=[],
            children=[],
            metadata={}
        )
        self.graph.add_node(network)
        
        # Concrete: HTTP
        http = KnowledgeNode(
            node_id="http_implementation",
            node_type=KnowledgeType.IMPLEMENTATION,
            ontology_level=OntologyLevel.CONCRETE,
            name="HTTP",
            description="HTTP protocol implementation",
            properties={"protocol": "http", "stateless": True},
            capabilities_provided=["connect", "send", "receive"],
            resources_required=["network_abstract"],
            parents=["network_abstract"],
            children=[],
            metadata={"protocol": "HTTP/1.1"}
        )
        self.graph.add_node(http)
        
        # Add edges
        self.graph.add_edge(KnowledgeEdge(
            edge_id="edge_git_implements",
            source_id="versioned_storage_abstract",
            target_id="git_implementation",
            edge_type="implements",
            weight=1.0,
            properties={}
        ))
        
        self.graph.add_edge(KnowledgeEdge(
            edge_id="edge_svn_implements",
            source_id="versioned_storage_abstract",
            target_id="svn_implementation",
            edge_type="implements",
            weight=0.8,
            properties={}
        ))
        
        self.graph.add_edge(KnowledgeEdge(
            edge_id="edge_http_implements",
            source_id="network_abstract",
            target_id="http_implementation",
            edge_type="implements",
            weight=1.0,
            properties={}
        ))


# Singleton instance
_knowledge_graph = KnowledgeGraph()
_knowledge_initializer = KnowledgeInitializer(_knowledge_graph)

# Initialize base ontology if empty
if not _knowledge_graph._nodes:
    _knowledge_initializer.initialize_base_ontology()


def get_knowledge_graph() -> KnowledgeGraph:
    """Get the singleton knowledge graph."""
    return _knowledge_graph
