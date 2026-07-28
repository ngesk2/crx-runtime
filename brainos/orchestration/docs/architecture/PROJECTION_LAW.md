# Projection Law

**Phase 8:** Define disposable projections

---

## Overview

Projection Law defines that Layer 3 (Knowledge Graph), Layer 4 (Vector Space), and Layer 5 (Agents) are disposable projections. All projections must rebuild from Layer 1, be deletable, be replaceable, and never become source of truth.

---

## Projection Layers

### Layer 3: Knowledge Graph Projection
**Status:** DISPOSABLE
**Technology:** Neo4j, ArangoDB, TigerGraph
**Source:** Layer 1 (Event Log)
**Rebuildable:** Yes
**Deletable:** Yes
**Replaceable:** Yes

### Layer 4: Vector Space Projection
**Status:** DISPOSABLE
**Technology:** Qdrant, Pinecone, Weaviate
**Source:** Layer 1 (Event Log)
**Rebuildable:** Yes
**Deletable:** Yes
**Replaceable:** Yes

### Layer 5: Agents Projection
**Status:** DISPOSABLE
**Technology:** LangGraph, CrewAI, Custom
**Source:** Layer 1 (Event Log)
**Rebuildable:** Yes
**Deletable:** Yes
**Replaceable:** Yes

---

## Projection Requirements

### 1. Rebuild from Layer 1
**Requirement:** All projections must rebuild from Layer 1 (Event Log)

**Implementation:**
```python
def rebuild_projection_from_events(projection_type: str, events: List[Dict]) -> Dict:
    """
    Rebuild projection from event log.
    
    Args:
        projection_type: Type of projection to rebuild
        events: Event log
    
    Returns:
        Rebuilt projection data
    
    Guarantee:
        Projection rebuilt from events only
        No external dependencies
    """
    # Rebuild from events
    state = initialize_state()
    
    for event in events:
        state = reducer(state, event)
    
    # Build projection from state
    projection_data = build_projection(projection_type, state)
    
    return projection_data
```

### 2. Deletable
**Requirement:** All projections must be deletable without affecting constitutional truth

**Implementation:**
```python
def delete_projection(projection_id: UUID):
    """
    Delete projection.
    
    Args:
        projection_id: Projection to delete
    
    Guarantee:
        Projection deleted
        Constitutional truth unaffected
    """
    # Delete projection data
    delete_projection_data(projection_id)
    
    # Delete projection metadata
    delete_projection_metadata(projection_id)
    
    # Verify constitutional truth unchanged
    verify_canonical_truth()
```

### 3. Replaceable
**Requirement:** All projections must be replaceable without affecting constitutional truth

**Implementation:**
```python
def replace_projection(projection_id: UUID, new_projection_data: Dict):
    """
    Replace projection.
    
    Args:
        projection_id: Projection to replace
        new_projection_data: New projection data
    
    Guarantee:
        Projection replaced
        Constitutional truth unaffected
    """
    # Delete old projection
    delete_projection(projection_id)
    
    # Create new projection
    create_projection(projection_id, new_projection_data)
    
    # Verify constitutional truth unchanged
    verify_canonical_truth()
```

### 4. Never Source of Truth
**Requirement:** Projections must never become source of truth

**Implementation:**
```python
def verify_projection_not_source_of_truth(projection_id: UUID) -> bool:
    """
    Verify projection is not source of truth.
    
    Args:
        projection_id: Projection to verify
    
    Returns:
        True if not source of truth
    """
    # Verify no references to projection from constitutional truth
    references = check_projection_references(projection_id)
    
    return len(references) == 0
```

---

## Projection Rebuild

### Rebuild Procedure
```python
def rebuild_projection(projection_id: UUID) -> Dict:
    """
    Rebuild projection from event log.
    
    Args:
        projection_id: Projection to rebuild
    
    Returns:
        Rebuilt projection data
    
    Guarantee:
        Projection rebuilt from events
        Deterministic rebuild
    """
    # Get projection metadata
    projection = get_projection(projection_id)
    
    # Get event log
    events = get_event_log()
    
    # Rebuild from events
    projection_data = rebuild_projection_from_events(
        projection['projection_type'],
        events
    )
    
    # Update projection
    update_projection(projection_id, projection_data)
    
    return projection_data
```

---

## Projection Invalidation

### Invalidation Procedure
```python
def invalidate_projection(projection_id: UUID):
    """
    Invalidate projection.
    
    Args:
        projection_id: Projection to invalidate
    
    Guarantee:
        Projection invalidated
        Rebuild triggered
    """
    # Mark projection as invalid
    mark_projection_invalid(projection_id)
    
    # Trigger rebuild
    schedule_projection_rebuild(projection_id)
```

---

## Projection Verification

### Verification Procedure
```python
def verify_projection(projection_id: UUID) -> bool:
    """
    Verify projection integrity.
    
    Args:
        projection_id: Projection to verify
    
    Returns:
        True if projection is valid
    """
    # Get projection
    projection = get_projection(projection_id)
    
    # Rebuild projection
    rebuilt_data = rebuild_projection(projection_id)
    
    # Compare with existing
    existing_data = get_projection_data(projection_id)
    
    return compare_projection_data(existing_data, rebuilt_data)
```

---

## Projection Best Practices

### 1. Rebuild from Layer 1
- Always rebuild from event log
- Never rebuild from other projections
- Never use external data
- Verify rebuild results

### 2. Deletable
- Support deletion without impact
- Delete projection data
- Delete projection metadata
- Verify constitutional truth

### 3. Replaceable
- Support replacement without impact
- Delete old projection
- Create new projection
- Verify constitutional truth

### 4. Never Source of Truth
- Never reference from constitutional truth
- Never use for state reconstruction
- Never use for event generation
- Always rebuildable

### 5. Verification
- Verify projection integrity
- Verify rebuild results
- Verify constitutional truth
- Verify no source of truth
