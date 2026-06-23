# Artifact Graph

**Phase 7:** Design runtime artifact model

---

## Overview

Artifact Graph provides the runtime artifact model. Artifacts include documents, notes, projects, tasks, entities, relationships, workflows, and events. Artifacts must be represented as constitutional objects. No runtime-only artifacts allowed.

---

## Artifact Types

### Document Artifact
**Purpose:** Document representation
**Characteristics:**
- Content-addressable
- Lineage-tracked
- Versioned
- Constitutional object

**Structure:**
```python
class DocumentArtifact(Artifact):
    """Document artifact."""
    
    def __init__(
        self,
        artifact_id: UUID,
        content_hash: str,
        lineage_id: UUID,
        title: str,
        content: str,
        metadata: Dict = None
    ):
        super().__init__(artifact_id, 'document', content_hash, lineage_id)
        self.title = title
        self.content = content
        self.metadata = metadata or {}
```

### Note Artifact
**Purpose:** Note representation
**Characteristics:**
- Content-addressable
- Lineage-tracked
- Versioned
- Constitutional object

**Structure:**
```python
class NoteArtifact(Artifact):
    """Note artifact."""
    
    def __init__(
        self,
        artifact_id: UUID,
        content_hash: str,
        lineage_id: UUID,
        title: str,
        content: str,
        parent_artifact_id: UUID = None
    ):
        super().__init__(artifact_id, 'note', content_hash, lineage_id)
        self.title = title
        self.content = content
        self.parent_artifact_id = parent_artifact_id
```

### Project Artifact
**Purpose:** Project representation
**Characteristics:**
- Content-addressable
- Lineage-tracked
- Versioned
- Constitutional object

**Structure:**
```python
class ProjectArtifact(Artifact):
    """Project artifact."""
    
    def __init__(
        self,
        artifact_id: UUID,
        content_hash: str,
        lineage_id: UUID,
        name: str,
        description: str,
        metadata: Dict = None
    ):
        super().__init__(artifact_id, 'project', content_hash, lineage_id)
        self.name = name
        self.description = description
        self.metadata = metadata or {}
```

### Task Artifact
**Purpose:** Task representation
**Characteristics:**
- Content-addressable
- Lineage-tracked
- Versioned
- Constitutional object

**Structure:**
```python
class TaskArtifact(Artifact):
    """Task artifact."""
    
    def __init__(
        self,
        artifact_id: UUID,
        content_hash: str,
        lineage_id: UUID,
        task_type: str,
        task_data: Dict,
        workflow_id: UUID
    ):
        super().__init__(artifact_id, 'task', content_hash, lineage_id)
        self.task_type = task_type
        self.task_data = task_data
        self.workflow_id = workflow_id
```

### Entity Artifact
**Purpose:** Entity representation
**Characteristics:**
- Content-addressable
- Lineage-tracked
- Versioned
- Constitutional object

**Structure:**
```python
class EntityArtifact(Artifact):
    """Entity artifact."""
    
    def __init__(
        self,
        artifact_id: UUID,
        content_hash: str,
        lineage_id: UUID,
        entity_type: str,
        entity_name: str,
        entity_attributes: Dict
    ):
        super().__init__(artifact_id, 'entity', content_hash, lineage_id)
        self.entity_type = entity_type
        self.entity_name = entity_name
        self.entity_attributes = entity_attributes
```

### Relationship Artifact
**Purpose:** Relationship representation
**Characteristics:**
- Content-addressable
- Lineage-tracked
- Versioned
- Constitutional object

**Structure:**
```python
class RelationshipArtifact(Artifact):
    """Relationship artifact."""
    
    def __init__(
        self,
        artifact_id: UUID,
        content_hash: str,
        lineage_id: UUID,
        source_entity_id: UUID,
        target_entity_id: UUID,
        relationship_type: str,
        relationship_attributes: Dict
    ):
        super().__init__(artifact_id, 'relationship', content_hash, lineage_id)
        self.source_entity_id = source_entity_id
        self.target_entity_id = target_entity_id
        self.relationship_type = relationship_type
        self.relationship_attributes = relationship_attributes
```

### Workflow Artifact
**Purpose:** Workflow representation
**Characteristics:**
- Content-addressable
- Lineage-tracked
- Versioned
- Constitutional object

**Structure:**
```python
class WorkflowArtifact(Artifact):
    """Workflow artifact."""
    
    def __init__(
        self,
        artifact_id: UUID,
        content_hash: str,
        lineage_id: UUID,
        workflow_type: str,
        workflow_definition: Dict,
        version: str
    ):
        super().__init__(artifact_id, 'workflow', content_hash, lineage_id)
        self.workflow_type = workflow_type
        self.workflow_definition = workflow_definition
        self.version = version
```

### Event Artifact
**Purpose:** Event representation
**Characteristics:**
- Content-addressable
- Lineage-tracked
- Versioned
- Constitutional object

**Structure:**
```python
class EventArtifact(Artifact):
    """Event artifact."""
    
    def __init__(
        self,
        artifact_id: UUID,
        content_hash: str,
        lineage_id: UUID,
        event_type: str,
        event_data: Dict,
        aggregate_id: UUID
    ):
        super().__init__(artifact_id, 'event', content_hash, lineage_id)
        self.event_type = event_type
        self.event_data = event_data
        self.aggregate_id = aggregate_id
```

---

## Artifact Creation

### Creation Process
```python
def create_artifact(
    artifact_type: str,
    artifact_data: Dict,
    lineage_id: UUID = None
) -> Artifact:
    """
    Create artifact.
    
    Args:
        artifact_type: Type of artifact
        artifact_data: Artifact data
        lineage_id: Lineage ID (optional)
    
    Returns:
        Created artifact
    """
    # Generate artifact ID
    artifact_id = uuid4()
    
    # Serialize artifact data
    artifact_bytes = hash_authority.serialization_authority.serialize_bytes(artifact_data)
    
    # Compute content hash
    content_hash = hash_authority.hash_bytes(artifact_bytes)
    
    # Generate lineage ID if not provided
    if not lineage_id:
        lineage_id = uuid4()
    
    # Create artifact based on type
    artifact = create_artifact_by_type(
        artifact_id,
        artifact_type,
        content_hash,
        lineage_id,
        artifact_data
    )
    
    # Store artifact
    store_artifact(artifact)
    
    return artifact
```

### Type-Specific Creation
```python
def create_artifact_by_type(
    artifact_id: UUID,
    artifact_type: str,
    content_hash: str,
    lineage_id: UUID,
    artifact_data: Dict
) -> Artifact:
    """
    Create artifact by type.
    
    Args:
        artifact_id: Artifact ID
        artifact_type: Type of artifact
        content_hash: Content hash
        lineage_id: Lineage ID
        artifact_data: Artifact data
    
    Returns:
        Created artifact
    """
    artifact_creators = {
        'document': create_document_artifact,
        'note': create_note_artifact,
        'project': create_project_artifact,
        'task': create_task_artifact,
        'entity': create_entity_artifact,
        'relationship': create_relationship_artifact,
        'workflow': create_workflow_artifact,
        'event': create_event_artifact
    }
    
    creator = artifact_creators.get(artifact_type)
    
    if not creator:
        raise Exception(f"Unknown artifact type: {artifact_type}")
    
    return creator(artifact_id, content_hash, lineage_id, artifact_data)
```

---

## Artifact Retrieval

### Retrieval Process
```python
def get_artifact(artifact_id: UUID) -> Artifact:
    """
    Get artifact by ID.
    
    Args:
        artifact_id: Artifact ID
    
    Returns:
        Artifact
    """
    # Query constitutional state
    artifact_data = query_artifact_from_canonical_state(artifact_id)
    
    # Reconstruct artifact
    artifact = reconstruct_artifact(artifact_data)
    
    return artifact
```

### Content-Based Retrieval
```python
def get_artifact_by_content(content_hash: str) -> Artifact:
    """
    Get artifact by content hash.
    
    Args:
        content_hash: Content hash
    
    Returns:
        Artifact
    """
    # Query constitutional state
    artifact_data = query_artifact_by_content_hash(content_hash)
    
    # Reconstruct artifact
    artifact = reconstruct_artifact(artifact_data)
    
    return artifact
```

---

## Artifact Graph

### Graph Structure
```python
class ArtifactGraph:
    """Artifact graph."""
    
    def __init__(self):
        """Initialize artifact graph."""
        self.nodes = {}  # artifact_id -> Artifact
        self.edges = {}  # (source_id, target_id) -> Relationship
    
    def add_node(self, artifact: Artifact):
        """Add artifact node to graph."""
        self.nodes[artifact.artifact_id] = artifact
    
    def add_edge(self, relationship: RelationshipArtifact):
        """Add relationship edge to graph."""
        edge_key = (relationship.source_entity_id, relationship.target_entity_id)
        self.edges[edge_key] = relationship
```

### Graph Traversal
```python
def traverse_artifact_graph(
    graph: ArtifactGraph,
    start_artifact_id: UUID,
    max_depth: int = 3
) -> List[Artifact]:
    """
    Traverse artifact graph.
    
    Args:
        graph: Artifact graph
        start_artifact_id: Starting artifact ID
        max_depth: Maximum traversal depth
    
    Returns:
        List of artifacts
    """
    visited = set()
    queue = [(start_artifact_id, 0)]
    artifacts = []
    
    while queue:
        artifact_id, depth = queue.pop(0)
        
        if depth > max_depth:
            continue
        
        if artifact_id in visited:
            continue
        
        visited.add(artifact_id)
        artifacts.append(graph.nodes[artifact_id])
        
        # Get neighbors
        neighbors = get_artifact_neighbors(graph, artifact_id)
        for neighbor_id in neighbors:
            queue.append((neighbor_id, depth + 1))
    
    return artifacts
```

---

## Artifact Best Practices

### 1. Constitutional Objects
- All artifacts are constitutional objects
- Content-addressable storage
- Lineage-tracked
- Versioned

### 2. No Runtime-Only Artifacts
- No runtime-only artifacts allowed
- All artifacts stored in constitutional truth
- All artifacts replayable
- All artifacts verifiable

### 3. Type Safety
- Clear artifact types
- Type-specific creation
- Type-specific validation
- Type-specific storage

### 4. Graph Structure
- Clear artifact relationships
- Traversable graph
- Queryable graph
- Verifiable graph

### 5. Verification
- Verify artifact integrity
- Verify artifact lineage
- Verify artifact content
- Verify artifact relationships
