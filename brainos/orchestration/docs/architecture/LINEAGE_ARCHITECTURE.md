# Object Lineage Architecture

**Constitutional Law 2:** Every transformation must produce lineage

---

## Overview

Every artifact in the system must have complete provenance. No artifact may exist without knowing its origin, transformations, and processing history. This enables deterministic replay, debugging, and auditability.

---

## Lineage Model

### Artifact Identity

Every artifact contains:

```json
{
  "artifact_id": "UUID",
  "content_hash": "SHA256",
  "lineage_id": "UUID",
  "version": 1,
  "created_at": "ISO 8601",
  "parent_artifact_id": "UUID",
  "origin_artifact_id": "UUID",
  "processor_name": "string",
  "processor_version": "string",
  "processor_checksum": "SHA256",
  "processor_configuration": {},
  "processing_timestamp": "ISO 8601"
}
```

### Field Definitions

| Field | Type | Description |
|-------|------|-------------|
| artifact_id | UUID v4 | Unique artifact identifier |
| content_hash | SHA256 | Cryptographic hash of content |
| lineage_id | UUID v4 | Tracks artifact evolution |
| version | integer | Artifact version number |
| created_at | ISO 8601 | Creation timestamp |
| parent_artifact_id | UUID v4 | Direct parent artifact |
| origin_artifact_id | UUID v4 | Original source artifact |
| processor_name | string | Processor that created artifact |
| processor_version | string | Processor version |
| processor_checksum | SHA256 | Processor binary checksum |
| processor_configuration | JSON | Processor configuration |
| processing_timestamp | ISO 8601 | When processing occurred |

---

## Lineage Tables

### lineage Table

```sql
CREATE TABLE lineage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lineage_id UUID NOT NULL UNIQUE,
    root_artifact_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    current_version INTEGER NOT NULL DEFAULT 1,
    metadata JSONB,
    CONSTRAINT valid_version CHECK (version >= 1)
);

CREATE INDEX idx_lineage_lineage_id ON lineage(lineage_id);
CREATE INDEX idx_lineage_root_artifact_id ON lineage(root_artifact_id);
```

### artifact_lineage Table

```sql
CREATE TABLE artifact_lineage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artifact_id UUID NOT NULL,
    parent_artifact_id UUID,
    origin_artifact_id UUID NOT NULL,
    lineage_id UUID NOT NULL,
    version INTEGER NOT NULL,
    processor_name VARCHAR(255) NOT NULL,
    processor_version VARCHAR(255) NOT NULL,
    processor_checksum VARCHAR(64),
    processor_configuration JSONB,
    processing_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT valid_processor_checksum CHECK (length(processor_checksum) = 64)
);

CREATE INDEX idx_artifact_lineage_artifact_id ON artifact_lineage(artifact_id);
CREATE INDEX idx_artifact_lineage_parent_artifact_id ON artifact_lineage(parent_artifact_id);
CREATE INDEX idx_artifact_lineage_origin_artifact_id ON artifact_lineage(origin_artifact_id);
CREATE INDEX idx_artifact_lineage_lineage_id ON artifact_lineage(lineage_id);
CREATE INDEX idx_artifact_lineage_processor_name ON artifact_lineage(processor_name);
```

---

## Lineage Traversal

### Upward Traversal (Ancestors)

```python
def get_ancestors(artifact_id: UUID) -> List[Dict]:
    """
    Get all ancestor artifacts.
    
    Args:
        artifact_id: Starting artifact ID
    
    Returns:
        List of ancestor artifacts
    """
    ancestors = []
    current_id = artifact_id
    
    while current_id:
        # Get parent artifact
        parent = get_parent_artifact(current_id)
        
        if not parent:
            break
        
        ancestors.append(parent)
        current_id = parent['parent_artifact_id']
    
    return ancestors
```

### Downward Traversal (Descendants)

```python
def get_descendants(artifact_id: UUID) -> List[Dict]:
    """
    Get all descendant artifacts.
    
    Args:
        artifact_id: Starting artifact ID
    
    Returns:
        List of descendant artifacts
    """
    descendants = []
    queue = [artifact_id]
    
    while queue:
        current_id = queue.pop(0)
        
        # Get child artifacts
        children = get_child_artifacts(current_id)
        
        for child in children:
            descendants.append(child)
            queue.append(child['artifact_id'])
    
    return descendants
```

### Lineage Path

```python
def get_lineage_path(artifact_id: UUID) -> List[Dict]:
    """
    Get complete lineage path from origin to artifact.
    
    Args:
        artifact_id: Target artifact ID
    
    Returns:
        List of artifacts in lineage path
    """
    path = []
    current_id = artifact_id
    
    while current_id:
        # Get artifact
        artifact = get_artifact(current_id)
        path.append(artifact)
        
        # Get parent
        parent = get_parent_artifact(current_id)
        
        if not parent:
            break
        
        current_id = parent['parent_artifact_id']
    
    return list(reversed(path))
```

---

## Lineage Replay

### Replay from Artifact

```python
def replay_from_artifact(artifact_id: UUID):
    """
    Replay processing from a specific artifact.
    
    Args:
        artifact_id: Artifact to replay from
    
    Returns:
        Reconstructed artifacts
    """
    # Get lineage path
    path = get_lineage_path(artifact_id)
    
    # Replay each transformation
    for i in range(len(path) - 1):
        source = path[i]
        target = path[i + 1]
        
        # Get processor
        processor = get_processor(
            target['processor_name'],
            target['processor_version']
        )
        
        # Replay transformation
        result = processor.process(
            source['content'],
            target['processor_configuration']
        )
        
        # Verify result
        assert result['content_hash'] == target['content_hash']
    
    return path[-1]
```

### Replay Lineage

```python
def replay_lineage(lineage_id: UUID):
    """
    Replay entire lineage.
    
    Args:
        lineage_id: Lineage to replay
    
    Returns:
        Reconstructed artifacts
    """
    # Get lineage
    lineage = get_lineage(lineage_id)
    
    # Get root artifact
    root = get_artifact(lineage['root_artifact_id'])
    
    # Get all artifacts in lineage
    artifacts = get_artifacts_by_lineage(lineage_id)
    
    # Sort by version
    artifacts.sort(key=lambda x: x['version'])
    
    # Replay each version
    for i in range(len(artifacts) - 1):
        source = artifacts[i]
        target = artifacts[i + 1]
        
        # Replay transformation
        replay_transformation(source, target)
    
    return artifacts[-1]
```

---

## Lineage Validation

### Consistency Validation

```python
def validate_lineage_consistency(lineage_id: UUID) -> bool:
    """
    Validate lineage consistency.
    
    Args:
        lineage_id: Lineage to validate
    
    Returns:
        True if consistent
    """
    # Get all artifacts in lineage
    artifacts = get_artifacts_by_lineage(lineage_id)
    
    # Validate each artifact
    for artifact in artifacts:
        # Validate content hash
        if not validate_content_hash(artifact):
            return False
        
        # Validate parent reference
        if artifact['parent_artifact_id']:
            parent = get_artifact(artifact['parent_artifact_id'])
            if not parent:
                return False
        
        # Validate processor
        if not validate_processor(artifact):
            return False
    
    return True
```

### Processor Validation

```python
def validate_processor(artifact: Dict) -> bool:
    """
    Validate processor information.
    
    Args:
        artifact: Artifact to validate
    
    Returns:
        True if valid
    """
    # Get processor
    processor = get_processor(
        artifact['processor_name'],
        artifact['processor_version']
    )
    
    # Verify processor exists
    if not processor:
        return False
    
    # Verify processor checksum
    if processor['checksum'] != artifact['processor_checksum']:
        return False
    
    # Verify processor configuration
    if not validate_configuration(
        artifact['processor_configuration'],
        processor['expected_configuration']
    ):
        return False
    
    return True
```

---

## Lineage Visualization

### Visualization Model

```python
def visualize_lineage(lineage_id: UUID):
    """
    Generate lineage visualization.
    
    Args:
        lineage_id: Lineage to visualize
    
    Returns:
        Visualization data
    """
    # Get all artifacts in lineage
    artifacts = get_artifacts_by_lineage(lineage_id)
    
    # Build graph
    graph = {
        'nodes': [],
        'edges': []
    }
    
    for artifact in artifacts:
        # Add node
        graph['nodes'].append({
            'id': str(artifact['artifact_id']),
            'label': artifact['processor_name'],
            'version': artifact['version'],
            'timestamp': artifact['processing_timestamp']
        })
        
        # Add edge
        if artifact['parent_artifact_id']:
            graph['edges'].append({
                'source': str(artifact['parent_artifact_id']),
                'target': str(artifact['artifact_id']),
                'label': artifact['processor_name']
            })
    
    return graph
```

---

## Lineage Queries

### By Processor

```python
def get_artifacts_by_processor(processor_name: str, processor_version: str = None):
    """
    Get artifacts processed by specific processor.
    
    Args:
        processor_name: Processor name
        processor_version: Processor version (optional)
    
    Returns:
        List of artifacts
    """
    query = """
        SELECT * FROM artifact_lineage
        WHERE processor_name = $1
    """
    
    params = [processor_name]
    
    if processor_version:
        query += " AND processor_version = $2"
        params.append(processor_version)
    
    return execute_query(query, params)
```

### By Time Range

```python
def get_artifacts_by_time_range(start: datetime, end: datetime):
    """
    Get artifacts processed in time range.
    
    Args:
        start: Start time
        end: End time
    
    Returns:
        List of artifacts
    """
    query = """
        SELECT * FROM artifact_lineage
        WHERE processing_timestamp >= $1
        AND processing_timestamp <= $2
        ORDER BY processing_timestamp
    """
    
    return execute_query(query, [start, end])
```

### By Origin

```python
def get_artifacts_by_origin(origin_artifact_id: UUID):
    """
    Get all artifacts derived from origin.
    
    Args:
        origin_artifact_id: Origin artifact ID
    
    Returns:
        List of descendant artifacts
    """
    query = """
        SELECT * FROM artifact_lineage
        WHERE origin_artifact_id = $1
        ORDER BY processing_timestamp
    """
    
    return execute_query(query, [origin_artifact_id])
```

---

## Lineage Events

### Lineage Events

```json
{
  "event_type": "LINEAGE_CREATED",
  "event_data": {
    "lineage_id": "UUID",
    "root_artifact_id": "UUID",
    "artifact_count": 10
  }
}

{
  "event_type": "ARTIFACT_VERSIONED",
  "event_data": {
    "artifact_id": "UUID",
    "lineage_id": "UUID",
    "previous_version": 1,
    "new_version": 2,
    "processor_name": "normalizer",
    "processor_version": "v1"
  }
}

{
  "event_type": "LINEAGE_COMPLETED",
  "event_data": {
    "lineage_id": "UUID",
    "final_artifact_id": "UUID",
    "total_transformations": 5
  }
}
```

---

## Lineage Best Practices

### 1. Complete Provenance
- Every artifact must have lineage
- Every transformation must be tracked
- Every processor must be versioned
- Every configuration must be stored

### 2. Deterministic Processing
- Same inputs → same outputs
- Processor versioning
- Configuration versioning
- Checksum verification

### 3. Lineage Validation
- Validate lineage consistency
- Validate processor information
- Validate content hashes
- Validate transformations

### 4. Lineage Replay
- Support lineage replay
- Support artifact replay
- Support transformation replay
- Verify replay results

### 5. Lineage Visualization
- Visualize lineage paths
- Visualize transformations
- Visualize processor usage
- Visualize time evolution
