# State Transition Law

**Phase 7:** Design aggregate/reducer/snapshot models

---

## Overview

State Transition Law establishes that every state mutation must be event-driven, replayable, and reconstructable. Defines aggregate model, reducer model, snapshot model, and snapshot rebuild procedure.

---

## Aggregate Model

### Aggregate Definition
```python
class Aggregate:
    """Aggregate base class."""
    
    def __init__(self, aggregate_id: UUID):
        """
        Initialize aggregate.
        
        Args:
            aggregate_id: Aggregate identifier
        """
        self.aggregate_id = aggregate_id
        self.version = 0
        self.state = {}
    
    def apply_event(self, event: Dict):
        """
        Apply event to aggregate.
        
        Args:
            event: Event to apply
        
        Returns:
            Updated state
        """
        # Apply event to state
        self.state = self.reducer(self.state, event)
        self.version += 1
        
        return self.state
    
    @staticmethod
    def reducer(state: Dict, event: Dict) -> Dict:
        """
        Reducer function for aggregate.
        
        Args:
            state: Current state
            event: Event to apply
        
        Returns:
            Updated state
        """
        # Implement aggregate-specific reducer
        pass
```

### Aggregate Types

#### Object Aggregate
```python
class ObjectAggregate(Aggregate):
    """Object aggregate."""
    
    @staticmethod
    def reducer(state: Dict, event: Dict) -> Dict:
        """
        Object aggregate reducer.
        
        Args:
            state: Current state
            event: Event to apply
        
        Returns:
            Updated state
        """
        event_type = event['event_type']
        
        if event_type == 'OBJECT_CREATED':
            state['objects'][event['event_data']['object_id']] = event['event_data']
        
        elif event_type == 'OBJECT_VERSIONED':
            object_id = event['event_data']['object_id']
            state['objects'][object_id]['version'] = event['event_data']['new_version']
        
        elif event_type == 'OBJECT_ARCHIVED':
            object_id = event['event_data']['object_id']
            state['objects'][object_id]['archived_at'] = event['event_data']['archive_timestamp']
        
        return state
```

#### Event Aggregate
```python
class EventAggregate(Aggregate):
    """Event aggregate."""
    
    @staticmethod
    def reducer(state: Dict, event: Dict) -> Dict:
        """
        Event aggregate reducer.
        
        Args:
            state: Current state
            event: Event to apply
        
        Returns:
            Updated state
        """
        event_type = event['event_type']
        
        if event_type == 'EVENT_CREATED':
            state['events'][event['event_id']] = event
        
        elif event_type == 'FAILURE_OCCURRED':
            state['failures'].append(event)
        
        return state
```

---

## Reducer Model

### Reducer Definition
```python
def reducer(state: Dict, event: Dict) -> Dict:
    """
    Generic reducer function.
    
    Args:
        state: Current state
        event: Event to apply
    
    Returns:
        Updated state
    
    Guarantee:
        Deterministic state transition
        Replayable state transition
    """
    event_type = event['event_type']
    
    # Get reducer for event type
    reducer_func = REDUCERS.get(event_type)
    
    if reducer_func:
        return reducer_func(state, event)
    else:
        # Default reducer
        return state
```

### Reducer Registry
```python
REDUCERS = {
    'OBJECT_CREATED': object_created_reducer,
    'OBJECT_VERSIONED': object_versioned_reducer,
    'OBJECT_ARCHIVED': object_archived_reducer,
    'FILE_DETECTED': file_detected_reducer,
    'FILE_CLASSIFIED': file_classified_reducer,
    'METADATA_EXTRACTED': metadata_extracted_reducer,
    'NORMALIZED': normalized_reducer,
    'CANONICALIZED': canonicalized_reducer,
    'CHUNKED': chunked_reducer,
    'ENTITY_CREATED': entity_created_reducer,
    'RELATIONSHIP_CREATED': relationship_created_reducer,
    'FAILURE_OCCURRED': failure_occurred_reducer
}
```

---

## Snapshot Model

### Snapshot Definition
```python
class Snapshot:
    """State snapshot."""
    
    def __init__(self, state: Dict, event_id: UUID, version: int):
        """
        Initialize snapshot.
        
        Args:
            state: State to snapshot
            event_id: Last event ID
            version: State version
        """
        self.state = state
        self.event_id = event_id
        self.version = version
        self.timestamp = datetime.utcnow()
        self.state_hash = hash_object(hash_authority, state)
    
    def to_dict(self) -> Dict:
        """
        Convert snapshot to dictionary.
        
        Returns:
            Snapshot dictionary
        """
        return {
            'state': self.state,
            'event_id': str(self.event_id),
            'version': self.version,
            'timestamp': self.timestamp.isoformat(),
            'state_hash': self.state_hash
        }
```

### Snapshot Creation
```python
def create_snapshot(state: Dict, event_id: UUID, version: int) -> Snapshot:
    """
    Create state snapshot.
    
    Args:
        state: State to snapshot
        event_id: Last event ID
        version: State version
    
    Returns:
        Snapshot
    """
    return Snapshot(state, event_id, version)
```

---

## Snapshot Rebuild Procedure

### Rebuild from Snapshot
```python
def rebuild_from_snapshot(snapshot: Snapshot, events: List[Dict]) -> Dict:
    """
    Rebuild state from snapshot.
    
    Args:
        snapshot: Snapshot to rebuild from
        events: Events to replay
    
    Returns:
        Rebuilt state
    
    Guarantee:
        Rebuilt state matches original state
        Deterministic rebuild
    """
    # Restore state from snapshot
    state = snapshot.state.copy()
    
    # Find snapshot event index
    snapshot_index = None
    for i, event in enumerate(events):
        if event['event_id'] == snapshot.event_id:
            snapshot_index = i
            break
    
    if snapshot_index is None:
        raise Exception("Snapshot event not found in event stream")
    
    # Replay events after snapshot
    for event in events[snapshot_index + 1:]:
        state = reducer(state, event)
    
    # Verify state hash
    rebuilt_hash = hash_object(hash_authority, state)
    if rebuilt_hash != snapshot.state_hash:
        raise Exception("State hash mismatch after rebuild")
    
    return state
```

### Rebuild from Beginning
```python
def rebuild_from_beginning(events: List[Dict]) -> Dict:
    """
    Rebuild state from beginning.
    
    Args:
        events: Events to replay
    
    Returns:
        Rebuilt state
    
    Guarantee:
        Deterministic rebuild
        Reproducible rebuild
    """
    state = initialize_state()
    
    for event in events:
        state = reducer(state, event)
    
    return state
```

---

## State Transition Verification

### Transition Verification
```python
def verify_state_transition(state: Dict, event: Dict, new_state: Dict) -> bool:
    """
    Verify state transition is valid.
    
    Args:
        state: Original state
        event: Event applied
        new_state: Resulting state
    
    Returns:
        True if transition is valid
    """
    # Verify state hash
    expected_hash = hash_object(hash_authority, new_state)
    
    # Re-apply event
    rebuilt_state = reducer(state, event)
    rebuilt_hash = hash_object(hash_authority, rebuilt_state)
    
    return expected_hash == rebuilt_hash
```

---

## State Transition Best Practices

### 1. Event-Driven Transitions
- All state mutations event-driven
- No direct state mutations
- No side effects
- Deterministic transitions

### 2. Replayable Transitions
- All transitions replayable
- All transitions deterministic
- All transitions reproducible
- No hidden state

### 3. Reconstructable State
- State reconstructable from events
- State reconstructable from snapshots
- State verifiable
- State hashable

### 4. Snapshot Strategy
- Create snapshots regularly
- Verify snapshots
- Use snapshots for optimization
- Rebuild from snapshots

### 5. Verification
- Verify state transitions
- Verify state hashes
- Verify rebuilds
- Verify snapshots
