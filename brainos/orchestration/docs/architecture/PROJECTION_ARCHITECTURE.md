# Projection Architecture

**Constitutional Law 7:** Future systems must never become truth

---

## Overview

Projections are disposable, rebuildable representations derived exclusively from constitutional truth (Layers 0-2). No projection may contain unique information or become a source of truth.

---

## Projection Sovereignty

### Constitutional Principle

**Constitutional Truth:** Layers 0-2 only
- Layer 0: Immutable Object Store
- Layer 1: Event Log
- Layer 2: Canonical State

**Disposable Projections:** Layers 3-5
- Layer 3: Knowledge Graph Projection
- Layer 4: Vector Projection
- Layer 5: Interfaces and Agents

**Rule:** Any projection must be rebuildable entirely from constitutional truth.

**Prohibition:** No projection may become a source of truth.

---

## Projection Types

### Vector Projection

**Purpose:** Similarity search and semantic retrieval

**Technology:** Qdrant, Pinecone, Weaviate

**Source:** Canonical state (chunks, entities)

**Rebuildable:** Yes

**Example:**
```json
{
  "projection_id": "UUID",
  "projection_type": "vector",
  "projection_name": "document_vectors",
  "source_aggregate_id": "UUID",
  "projection_configuration": {
    "embedding_model": "text-embedding-ada-002",
    "dimension": 1536,
    "metric": "cosine"
  },
  "builder_version": "v1"
}
```

### Graph Projection

**Purpose:** Knowledge reasoning and relationship traversal

**Technology:** Neo4j, ArangoDB, TigerGraph

**Source:** Canonical state (entities, relationships)

**Rebuildable:** Yes

**Example:**
```json
{
  "projection_id": "UUID",
  "projection_type": "graph",
  "projection_name": "knowledge_graph",
  "source_aggregate_id": "UUID",
  "projection_configuration": {
    "node_properties": ["entity_type", "entity_name"],
    "edge_properties": ["relationship_type", "confidence"]
  },
  "builder_version": "v1"
}
```

### Search Projection

**Purpose:** Full-text search and filtering

**Technology:** OpenSearch, Elasticsearch, Meilisearch

**Source:** Canonical state (documents, chunks)

**Rebuildable:** Yes

**Example:**
```json
{
  "projection_id": "UUID",
  "projection_type": "search",
  "projection_name": "document_search",
  "source_aggregate_id": "UUID",
  "projection_configuration": {
    "index_fields": ["title", "content", "metadata"],
    "analyzer": "standard"
  },
  "builder_version": "v1"
}
```

### Entity Projection

**Purpose:** Entity aggregation and filtering

**Technology:** DuckDB, PostgreSQL, ClickHouse

**Source:** Canonical state (entities)

**Rebuildable:** Yes

**Example:**
```json
{
  "projection_id": "UUID",
  "projection_type": "entity",
  "projection_name": "entity_index",
  "source_aggregate_id": "UUID",
  "projection_configuration": {
    "index_fields": ["entity_type", "entity_name"],
    "filters": ["confidence > 0.8"]
  },
  "builder_version": "v1"
}
```

### Relationship Projection

**Purpose:** Relationship aggregation and analysis

**Technology:** DuckDB, PostgreSQL, ClickHouse

**Source:** Canonical state (relationships)

**Rebuildable:** Yes

**Example:**
```json
{
  "projection_id": "UUID",
  "projection_type": "relationship",
  "projection_name": "relationship_index",
  "source_aggregate_id": "UUID",
  "projection_configuration": {
    "index_fields": ["relationship_type", "confidence"],
    "aggregations": ["count", "avg_confidence"]
  },
  "builder_version": "v1"
}
```

### AI Projection

**Purpose:** AI model inference and generation

**Technology:** Ollama, OpenAI, Anthropic

**Source:** Canonical state (chunks, entities)

**Rebuildable:** Yes

**Example:**
```json
{
  "projection_id": "UUID",
  "projection_type": "ai",
  "projection_name": "llm_inference",
  "source_aggregate_id": "UUID",
  "projection_configuration": {
    "model": "gpt-4",
    "temperature": 0.7,
    "max_tokens": 2000
  },
  "builder_version": "v1"
}
```

---

## Projection Registry

### Registry Schema

```sql
CREATE TABLE projection_registry (
    id UUID PRIMARY KEY,
    registry_id UUID NOT NULL UNIQUE,
    projection_type VARCHAR(255) NOT NULL,
    projection_name VARCHAR(255) NOT NULL,
    projection_schema JSONB NOT NULL,
    dependencies JSONB,
    build_schedule VARCHAR(255),
    invalidation_rules JSONB,
    rebuild_strategy VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_projection_name UNIQUE (projection_type, projection_name)
);
```

### Registry Entry Example

```json
{
  "registry_id": "UUID",
  "projection_type": "vector",
  "projection_name": "document_vectors",
  "projection_schema": {
    "fields": [
      {"name": "vector", "type": "vector", "dimension": 1536},
      {"name": "chunk_id", "type": "uuid"},
      {"name": "document_id", "type": "uuid"}
    ]
  },
  "dependencies": [
    {"projection_type": "search", "projection_name": "document_search"}
  ],
  "build_schedule": "0 2 * * *",
  "invalidation_rules": [
    {"event_type": "CHUNKED", "action": "invalidate"}
  ],
  "rebuild_strategy": "incremental"
}
```

---

## Projection Builder

### Builder Architecture

```python
class ProjectionBuilder:
    """Build projections from canonical state."""
    
    def __init__(self, projection_config: Dict):
        self.config = projection_config
        self.projection_type = projection_config['projection_type']
        self.builder_version = projection_config['builder_version']
    
    def build(self, canonical_state: Dict) -> Dict:
        """
        Build projection from canonical state.
        
        Args:
            canonical_state: Current canonical state
        
        Returns:
            Projection data
        """
        # Get source data
        source_data = self.get_source_data(canonical_state)
        
        # Transform data
        transformed_data = self.transform(source_data)
        
        # Validate data
        self.validate(transformed_data)
        
        # Return projection
        return {
            'projection_id': uuid4(),
            'projection_type': self.projection_type,
            'projection_data': transformed_data,
            'builder_version': self.builder_version,
            'built_at': datetime.utcnow().isoformat()
        }
    
    def get_source_data(self, canonical_state: Dict) -> Dict:
        """Get source data from canonical state."""
        # Implementation depends on projection type
        pass
    
    def transform(self, source_data: Dict) -> Dict:
        """Transform source data to projection format."""
        # Implementation depends on projection type
        pass
    
    def validate(self, data: Dict):
        """Validate projection data."""
        # Validate against schema
        pass
```

### Vector Builder

```python
class VectorBuilder(ProjectionBuilder):
    """Build vector projection."""
    
    def get_source_data(self, canonical_state: Dict) -> List[Dict]:
        """Get chunks from canonical state."""
        return canonical_state['chunks']
    
    def transform(self, source_data: List[Dict]) -> List[Dict]:
        """Transform chunks to vectors."""
        vectors = []
        
        for chunk in source_data:
            # Generate embedding
            embedding = self.generate_embedding(chunk['chunk_text'])
            
            vectors.append({
                'vector': embedding,
                'chunk_id': chunk['chunk_id'],
                'document_id': chunk['canonical_document_id']
            })
        
        return vectors
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text."""
        # Call embedding service
        pass
```

### Graph Builder

```python
class GraphBuilder(ProjectionBuilder):
    """Build graph projection."""
    
    def get_source_data(self, canonical_state: Dict) -> Dict:
        """Get entities and relationships from canonical state."""
        return {
            'entities': canonical_state['entities'],
            'relationships': canonical_state['relationships']
        }
    
    def transform(self, source_data: Dict) -> Dict:
        """Transform entities and relationships to graph."""
        nodes = []
        edges = []
        
        # Create nodes from entities
        for entity in source_data['entities']:
            nodes.append({
                'id': entity['entity_id'],
                'labels': [entity['entity_type']],
                'properties': {
                    'name': entity['entity_name'],
                    'attributes': entity['entity_attributes']
                }
            })
        
        # Create edges from relationships
        for relationship in source_data['relationships']:
            edges.append({
                'id': relationship['relationship_id'],
                'source': relationship['source_entity_id'],
                'target': relationship['target_entity_id'],
                'type': relationship['relationship_type'],
                'properties': {
                    'attributes': relationship['relationship_attributes'],
                    'confidence': relationship['confidence']
                }
            })
        
        return {'nodes': nodes, 'edges': edges}
```

---

## Projection Invalidation

### Invalidation Rules

```json
{
  "invalidation_rules": [
    {
      "event_type": "CHUNKED",
      "action": "invalidate",
      "projection_types": ["vector", "search"]
    },
    {
      "event_type": "ENTITY_CREATED",
      "action": "invalidate",
      "projection_types": ["graph", "entity"]
    },
    {
      "event_type": "RELATIONSHIP_CREATED",
      "action": "invalidate",
      "projection_types": ["graph", "relationship"]
    }
  ]
}
```

### Invalidation Process

```python
def invalidate_projection(projection_id: UUID, event: Dict):
    """
    Invalidate projection based on event.
    
    Args:
        projection_id: Projection to invalidate
        event: Event that triggered invalidation
    """
    # Get projection
    projection = get_projection(projection_id)
    
    # Check invalidation rules
    for rule in projection['invalidation_rules']:
        if rule['event_type'] == event['event_type']:
            # Invalidate projection
            set_projection_status(projection_id, 'invalid')
            
            # Schedule rebuild
            schedule_projection_rebuild(projection_id)
            
            break
```

---

## Projection Rebuild

### Rebuild Strategies

#### Full Rebuild
- Rebuild from scratch
- Delete all existing data
- Rebuild from canonical state
- Slow but complete

#### Incremental Rebuild
- Rebuild only changed data
- Use event log for changes
- Faster but more complex

#### Checkpoint Rebuild
- Rebuild from checkpoint
- Replay events from checkpoint
- Balance between speed and completeness

### Rebuild Workflow

```python
def rebuild_projection(projection_id: UUID, strategy: str = "incremental"):
    """
    Rebuild projection.
    
    Args:
        projection_id: Projection to rebuild
        strategy: Rebuild strategy
    """
    # Get projection
    projection = get_projection(projection_id)
    
    # Set status to rebuilding
    set_projection_status(projection_id, 'rebuilding')
    
    # Emit rebuild event
    emit_event({
        'event_type': 'PROJECTION_REBUILT',
        'event_data': {
            'projection_id': projection_id,
            'rebuild_strategy': strategy
        }
    })
    
    # Rebuild based on strategy
    if strategy == "full":
        rebuild_full(projection)
    elif strategy == "incremental":
        rebuild_incremental(projection)
    elif strategy == "checkpoint":
        rebuild_checkpoint(projection)
    
    # Set status to active
    set_projection_status(projection_id, 'active')
    
    # Verify projection
    verify_projection(projection_id)
```

### Full Rebuild

```python
def rebuild_full(projection: Dict):
    """
    Full projection rebuild.
    
    Args:
        projection: Projection configuration
    """
    # Get canonical state
    canonical_state = get_canonical_state()
    
    # Delete existing projection data
    delete_projection_data(projection['projection_id'])
    
    # Build projection
    builder = get_builder(projection['projection_type'])
    projection_data = builder.build(canonical_state)
    
    # Store projection data
    store_projection_data(projection['projection_id'], projection_data)
```

### Incremental Rebuild

```python
def rebuild_incremental(projection: Dict):
    """
    Incremental projection rebuild.
    
    Args:
        projection: Projection configuration
    """
    # Get last event ID
    last_event_id = get_last_event_id(projection['projection_id'])
    
    # Get events since last rebuild
    events = get_events_since(last_event_id)
    
    # Process events
    for event in events:
        # Update projection based on event
        update_projection_from_event(projection, event)
    
    # Update last event ID
    set_last_event_id(projection['projection_id'], events[-1]['event_id'])
```

---

## Projection Verification

### Verification Process

```python
def verify_projection(projection_id: UUID) -> bool:
    """
    Verify projection integrity.
    
    Args:
        projection_id: Projection to verify
    
    Returns:
        True if valid
    """
    # Get projection
    projection = get_projection(projection_id)
    
    # Get canonical state
    canonical_state = get_canonical_state()
    
    # Rebuild projection
    builder = get_builder(projection['projection_type'])
    rebuilt_data = builder.build(canonical_state)
    
    # Compare with existing projection
    existing_data = get_projection_data(projection_id)
    
    # Verify data matches
    return compare_projection_data(existing_data, rebuilt_data)
```

---

## Projection API

### Create Projection
```http
POST /projections
Content-Type: application/json

{
  "projection_type": "vector",
  "projection_name": "document_vectors",
  "projection_configuration": {}
}

Response:
{
  "projection_id": "UUID",
  "status": "created"
}
```

### Get Projection
```http
GET /projections/{projection_id}

Response:
{
  "projection_id": "UUID",
  "projection_type": "vector",
  "projection_name": "document_vectors",
  "status": "active",
  "last_event_id": "UUID"
}
```

### Rebuild Projection
```http
POST /projections/{projection_id}/rebuild
Content-Type: application/json

{
  "strategy": "incremental"
}

Response:
{
  "projection_id": "UUID",
  "status": "rebuilding"
}
```

### Invalidate Projection
```http
POST /projections/{projection_id}/invalidate

Response:
{
  "projection_id": "UUID",
  "status": "invalid"
}
```

---

## Projection Best Practices

### 1. Disposable Design
- Projections must be disposable
- No unique information in projections
- All data from constitutional truth
- Easy to delete and rebuild

### 2. Rebuildable Design
- Projections must be rebuildable
- Rebuild from canonical state
- Support multiple rebuild strategies
- Verify rebuild results

### 3. Invalidation Strategy
- Define clear invalidation rules
- Invalidate on relevant events
- Schedule automatic rebuilds
- Monitor invalidation frequency

### 4. Performance Optimization
- Use incremental rebuilds
- Cache projection data
- Parallelize rebuilds
- Optimize data access

### 5. Monitoring
- Monitor projection health
- Monitor rebuild performance
- Monitor invalidation rate
- Alert on failures
