# Constitutional Graph Law

**Phase 23:** Objects must project into graphs

---

## Overview

Constitutional Graph Law establishes that objects must project into graphs. Graphs are not truth. Objects remain truth. Events remain truth. Lineage remains truth. Witnesses remain truth. Graphs are projections. Required graph projections: knowledge graph, object graph, relationship graph, trust graph, protocol graph, collaboration graph. Graphs must be fully rebuildable. Destroying every graph must not destroy knowledge.

---

## Graph Philosophy

### What Graphs Are
- Projections of constitutional truth
- Derived from objects, events, relationships, lineage
- Rebuildable from constitutional truth
- Disposable and replaceable

### What Graphs Are Not
- NOT sources of truth
- NOT storage for knowledge
- NOT authoritative state
- NOT required for knowledge survival

---

## Required Graph Projections

### Knowledge Graph
**Purpose:** Represent knowledge relationships
**Source:** Constitutional objects, events, relationships
**Characteristics:**
- Entity nodes from entity artifacts
- Relationship edges from relationship artifacts
- Derived from canonical state
- Rebuildable from events

**Structure:**
```python
class KnowledgeGraph:
    """Knowledge graph projection."""
    
    def __init__(self):
        """Initialize knowledge graph."""
        self.nodes = {}  # entity_id -> EntityArtifact
        self.edges = {}  # (source_id, target_id) -> RelationshipArtifact
        self.witness = None
    
    def rebuild_from_constitutional_truth(self):
        """
        Rebuild graph from constitutional truth.
        
        Requirement:
            Rebuild from objects, events, relationships, lineage
        """
        # Get entities from canonical state
        entities = get_entities_from_canonical_state()
        
        # Get relationships from canonical state
        relationships = get_relationships_from_canonical_state()
        
        # Build graph
        for entity in entities:
            self.nodes[entity.artifact_id] = entity
        
        for relationship in relationships:
            edge_key = (relationship.source_entity_id, relationship.target_entity_id)
            self.edges[edge_key] = relationship
        
        # Generate witness
        self.witness = generate_graph_witness(self)
```

### Object Graph
**Purpose:** Represent object relationships
**Source:** Constitutional objects, lineage
**Characteristics:**
- Object nodes from artifacts
- Lineage edges from lineage
- Derived from canonical state
- Rebuildable from events

**Structure:**
```python
class ObjectGraph:
    """Object graph projection."""
    
    def __init__(self):
        """Initialize object graph."""
        self.nodes = {}  # artifact_id -> Artifact
        self.edges = {}  # (parent_id, child_id) -> Lineage
        self.witness = None
    
    def rebuild_from_constitutional_truth(self):
        """
        Rebuild graph from constitutional truth.
        
        Requirement:
            Rebuild from objects, events, lineage
        """
        # Get artifacts from canonical state
        artifacts = get_artifacts_from_canonical_state()
        
        # Get lineage from canonical state
        lineages = get_lineages_from_canonical_state()
        
        # Build graph
        for artifact in artifacts:
            self.nodes[artifact.artifact_id] = artifact
        
        for lineage in lineages:
            for i in range(len(lineage.artifact_chain) - 1):
                parent_id = lineage.artifact_chain[i]
                child_id = lineage.artifact_chain[i + 1]
                edge_key = (parent_id, child_id)
                self.edges[edge_key] = lineage
        
        # Generate witness
        self.witness = generate_graph_witness(self)
```

### Relationship Graph
**Purpose:** Represent entity relationships
**Source:** Constitutional relationships
**Characteristics:**
- Entity nodes from entity artifacts
- Relationship edges from relationship artifacts
- Derived from canonical state
- Rebuildable from events

**Structure:**
```python
class RelationshipGraph:
    """Relationship graph projection."""
    
    def __init__(self):
        """Initialize relationship graph."""
        self.nodes = {}  # entity_id -> EntityArtifact
        self.edges = {}  # (source_id, target_id, type) -> RelationshipArtifact
        self.witness = None
    
    def rebuild_from_constitutional_truth(self):
        """
        Rebuild graph from constitutional truth.
        
        Requirement:
            Rebuild from objects, events, relationships
        """
        # Get entities from canonical state
        entities = get_entities_from_canonical_state()
        
        # Get relationships from canonical state
        relationships = get_relationships_from_canonical_state()
        
        # Build graph
        for entity in entities:
            self.nodes[entity.artifact_id] = entity
        
        for relationship in relationships:
            edge_key = (
                relationship.source_entity_id,
                relationship.target_entity_id,
                relationship.relationship_type
            )
            self.edges[edge_key] = relationship
        
        # Generate witness
        self.witness = generate_graph_witness(self)
```

### Trust Graph
**Purpose:** Represent trust relationships
**Source:** Constitutional identities, trust edges
**Characteristics:**
- Identity nodes from identity artifacts
- Trust edges from trust artifacts
- Derived from canonical state
- Rebuildable from events

**Structure:**
```python
class TrustGraph:
    """Trust graph projection."""
    
    def __init__(self):
        """Initialize trust graph."""
        self.nodes = {}  # identity_id -> IdentityArtifact
        self.edges = {}  # (source_id, target_id) -> TrustEdge
        self.witness = None
    
    def rebuild_from_constitutional_truth(self):
        """
        Rebuild graph from constitutional truth.
        
        Requirement:
            Rebuild from objects, events, relationships
        """
        # Get identities from canonical state
        identities = get_identities_from_canonical_state()
        
        # Get trust edges from canonical state
        trust_edges = get_trust_edges_from_canonical_state()
        
        # Build graph
        for identity in identities:
            self.nodes[identity.identity_id] = identity
        
        for trust_edge in trust_edges:
            edge_key = (trust_edge.source_identity_id, trust_edge.target_identity_id)
            self.edges[edge_key] = trust_edge
        
        # Generate witness
        self.witness = generate_graph_witness(self)
```

### Protocol Graph
**Purpose:** Represent protocol relationships
**Source:** Constitutional protocol objects
**Characteristics:**
- Protocol nodes from protocol artifacts
- Protocol edges from protocol relationships
- Derived from canonical state
- Rebuildable from events

**Structure:**
```python
class ProtocolGraph:
    """Protocol graph projection."""
    
    def __init__(self):
        """Initialize protocol graph."""
        self.nodes = {}  # protocol_id -> ProtocolArtifact
        self.edges = {}  # (source_id, target_id) -> ProtocolRelationship
        self.witness = None
    
    def rebuild_from_constitutional_truth(self):
        """
        Rebuild graph from constitutional truth.
        
        Requirement:
            Rebuild from objects, events, relationships
        """
        # Get protocols from canonical state
        protocols = get_protocols_from_canonical_state()
        
        # Get protocol relationships from canonical state
        protocol_relationships = get_protocol_relationships_from_canonical_state()
        
        # Build graph
        for protocol in protocols:
            self.nodes[protocol.protocol_id] = protocol
        
        for relationship in protocol_relationships:
            edge_key = (relationship.source_protocol_id, relationship.target_protocol_id)
            self.edges[edge_key] = relationship
        
        # Generate witness
        self.witness = generate_graph_witness(self)
```

### Collaboration Graph
**Purpose:** Represent collaboration relationships
**Source:** Constitutional collaboration objects
**Characteristics:**
- Participant nodes from identity artifacts
- Collaboration edges from collaboration artifacts
- Derived from canonical state
- Rebuildable from events

**Structure:**
```python
class CollaborationGraph:
    """Collaboration graph projection."""
    
    def __init__(self):
        """Initialize collaboration graph."""
        self.nodes = {}  # identity_id -> IdentityArtifact
        self.edges = {}  # (source_id, target_id, collaboration_id) -> CollaborationArtifact
        self.witness = None
    
    def rebuild_from_constitutional_truth(self):
        """
        Rebuild graph from constitutional truth.
        
        Requirement:
            Rebuild from objects, events, relationships
        """
        # Get identities from canonical state
        identities = get_identities_from_canonical_state()
        
        # Get collaborations from canonical state
        collaborations = get_collaborations_from_canonical_state()
        
        # Build graph
        for identity in identities:
            self.nodes[identity.identity_id] = identity
        
        for collaboration in collaborations:
            for participant in collaboration.participants:
                edge_key = (collaboration.creator_id, participant, collaboration.collaboration_id)
                self.edges[edge_key] = collaboration
        
        # Generate witness
        self.witness = generate_graph_witness(self)
```

---

## Graph Rebuildability

### Rebuild Procedure
```python
def rebuild_all_graphs():
    """
    Rebuild all graphs from constitutional truth.
    
    Requirement:
            Destroying every graph must not destroy knowledge
    """
    # Rebuild knowledge graph
    knowledge_graph = KnowledgeGraph()
    knowledge_graph.rebuild_from_constitutional_truth()
    
    # Rebuild object graph
    object_graph = ObjectGraph()
    object_graph.rebuild_from_constitutional_truth()
    
    # Rebuild relationship graph
    relationship_graph = RelationshipGraph()
    relationship_graph.rebuild_from_constitutional_truth()
    
    # Rebuild trust graph
    trust_graph = TrustGraph()
    trust_graph.rebuild_from_constitutional_truth()
    
    # Rebuild protocol graph
    protocol_graph = ProtocolGraph()
    protocol_graph.rebuild_from_constitutional_truth()
    
    # Rebuild collaboration graph
    collaboration_graph = CollaborationGraph()
    collaboration_graph.rebuild_from_constitutional_truth()
    
    return {
        'knowledge_graph': knowledge_graph,
        'object_graph': object_graph,
        'relationship_graph': relationship_graph,
        'trust_graph': trust_graph,
        'protocol_graph': protocol_graph,
        'collaboration_graph': collaboration_graph
    }
```

### Graph Destruction Test
```python
def test_graph_destruction():
    """
    Test that destroying graphs does not destroy knowledge.
    
    Requirement:
            Destroying every graph must not destroy knowledge
    """
    # Destroy all graphs
    destroy_all_graphs()
    
    # Rebuild graphs from constitutional truth
    graphs = rebuild_all_graphs()
    
    # Verify graphs are identical
    verify_graphs_identical(graphs)
    
    return True
```

---

## Graph Witness Generation

### Witness Structure
```python
def generate_graph_witness(graph) -> GraphWitness:
    """
    Generate graph witness.
    
    Args:
        graph: Graph to witness
    
    Returns:
        Graph witness
    """
    witness = GraphWitness(
        witness_id=uuid4(),
        graph_type=graph.__class__.__name__,
        node_count=len(graph.nodes),
        edge_count=len(graph.edges),
        node_hashes=[hash_object(hash_authority, node) for node in graph.nodes.values()],
        edge_hashes=[hash_object(hash_authority, edge) for edge in graph.edges.values()],
        timestamp=datetime.utcnow()
    )
    
    return witness
```

---

## Graph Best Practices

### 1. Graphs as Projections
- Graphs are projections, not truth
- Graphs derived from constitutional truth
- Graphs rebuildable from constitutional truth
- Graphs disposable and replaceable

### 2. Constitutional Truth Preservation
- Objects remain truth
- Events remain truth
- Lineage remains truth
- Witnesses remain truth

### 3. Rebuildability
- All graphs fully rebuildable
- Destroying graphs does not destroy knowledge
- Graph rebuild from objects, events, relationships, lineage
- Graph witnesses verify rebuild correctness

### 4. Determinism
- Same objects → same graph
- Same events → same graph
- Same lineage → same graph
- Graph rebuild deterministic

### 5. Verification
- Verify graph rebuild correctness
- Verify graph witness correctness
- Verify graph consistency
- Verify graph completeness
