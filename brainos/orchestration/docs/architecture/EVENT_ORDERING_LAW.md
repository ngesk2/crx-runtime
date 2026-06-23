# Event Ordering Law

**Phase 5:** Define global ordering authority

---

## Overview

Event Ordering Law establishes the global ordering authority for events. Must survive DB ordering, parallel ingestion, clock skew, and concurrent processing.

---

## Ordering Requirements

### Global Ordering
**Requirement:** Single global ordering for all events

**Definition:**
```python
def global_event_order(events: List[Dict]) -> List[Dict]:
    """
    Order events globally.
    
    Args:
        events: Events to order
    
    Returns:
        Globally ordered events
    
    Guarantee:
        Consistent ordering across systems
        Survives parallel ingestion
        Survives clock skew
        Survives concurrent processing
    """
    return order_events(events)
```

---

## Event Ordering Comparator

### Comparator Definition
```python
def event_comparator(event1: Dict, event2: Dict) -> int:
    """
    Compare two events for ordering.
    
    Args:
        event1: First event
        event2: Second event
    
    Returns:
        -1 if event1 < event2
        0 if event1 == event2
        1 if event1 > event2
    
    Guarantee:
        Deterministic comparison
        Consistent across systems
    """
    # Compare by timestamp
    if event1['timestamp'] < event2['timestamp']:
        return -1
    elif event1['timestamp'] > event2['timestamp']:
        return 1
    
    # Compare by event_id (tie-breaker)
    if event1['event_id'] < event2['event_id']:
        return -1
    elif event1['event_id'] > event2['event_id']:
        return 1
    
    return 0
```

---

## Causal Ordering

### Causal Relationship
```python
def is_causal(event1: Dict, event2: Dict) -> bool:
    """
    Check if event1 causally precedes event2.
    
    Args:
        event1: First event
        event2: Second event
    
    Returns:
        True if event1 causally precedes event2
    """
    # Check causation_id
    if event2.get('causation_id') == event1['event_id']:
        return True
    
    # Check correlation_id
    if event2.get('correlation_id') == event1['correlation_id']:
        if event1['timestamp'] < event2['timestamp']:
            return True
    
    return False
```

### Causal Ordering
```python
def causal_order(events: List[Dict]) -> List[Dict]:
    """
    Order events causally.
    
    Args:
        events: Events to order
    
    Returns:
        Causally ordered events
    """
    # Build causal graph
    graph = build_causal_graph(events)
    
    # Topological sort
    ordered = topological_sort(graph)
    
    return ordered
```

---

## Tie-Breaking Strategy

### Tie-Breaking Rules
```python
def tie_breaker(event1: Dict, event2: Dict) -> Dict:
    """
    Break ties between events.
    
    Args:
        event1: First event
        event2: Second event
    
    Returns:
        Event that comes first
    
    Guarantee:
        Deterministic tie-breaking
        Consistent across systems
    """
    # Rule 1: Timestamp
    if event1['timestamp'] != event2['timestamp']:
        return event1 if event1['timestamp'] < event2['timestamp'] else event2
    
    # Rule 2: Event ID (lexicographic)
    if event1['event_id'] != event2['event_id']:
        return event1 if event1['event_id'] < event2['event_id'] else event2
    
    # Rule 3: Aggregate ID (lexicographic)
    if event1['aggregate_id'] != event2['aggregate_id']:
        return event1 if event1['aggregate_id'] < event2['aggregate_id'] else event2
    
    # Rule 4: Event type (lexicographic)
    return event1 if event1['event_type'] < event2['event_type'] else event2
```

---

## Replay Ordering Algorithm

### Algorithm Definition
```python
def replay_order(events: List[Dict]) -> List[Dict]:
    """
    Order events for replay.
    
    Args:
        events: Events to order
    
    Returns:
        Replay-ordered events
    
    Guarantee:
        Deterministic ordering
        Causal ordering preserved
        Survives clock skew
        Survives parallel ingestion
    """
    # Step 1: Sort by timestamp
    events_sorted = sorted(events, key=lambda e: e['timestamp'])
    
    # Step 2: Apply tie-breaking
    events_ordered = []
    for i in range(len(events_sorted)):
        for j in range(i + 1, len(events_sorted)):
            if events_sorted[i]['timestamp'] == events_sorted[j]['timestamp']:
                events_sorted[i], events_sorted[j] = tie_breaker_pair(
                    events_sorted[i], 
                    events_sorted[j]
                )
    
    # Step 3: Verify causal ordering
    if not verify_causal_ordering(events_sorted):
        raise Exception("Causal ordering violation")
    
    return events_sorted
```

---

## Clock Skew Handling

### Skew Detection
```python
def detect_clock_skew(events: List[Dict]) -> List[Dict]:
    """
    Detect clock skew in events.
    
    Args:
        events: Events to check
    
    Returns:
        Events with potential clock skew
    """
    skewed_events = []
    
    for i in range(len(events) - 1):
        event1 = events[i]
        event2 = events[i + 1]
        
        # Check for causation
        if event2.get('causation_id') == event1['event_id']:
            # Causation requires event1 before event2
            if event1['timestamp'] > event2['timestamp']:
                skewed_events.append(event2)
    
    return skewed_events
```

### Skew Correction
```python
def correct_clock_skew(events: List[Dict]) -> List[Dict]:
    """
    Correct clock skew in events.
    
    Args:
        events: Events to correct
    
    Returns:
        Events with corrected timestamps
    """
    # Build causal graph
    graph = build_causal_graph(events)
    
    # Assign timestamps based on causal order
    corrected_events = []
    for event in topological_sort(graph):
        # Get max timestamp from parents
        parent_timestamps = [
            parent['timestamp'] 
            for parent in graph[event['event_id']]['parents']
        ]
        
        if parent_timestamps:
            # Set timestamp to max parent + epsilon
            event['timestamp'] = max(parent_timestamps) + timedelta(microseconds=1)
        
        corrected_events.append(event)
    
    return corrected_events
```

---

## Parallel Ingestion Handling

### Parallel Event Detection
```python
def detect_parallel_ingestion(events: List[Dict]) -> List[Dict]:
    """
    Detect events from parallel ingestion.
    
    Args:
        events: Events to check
    
    Returns:
        Events from parallel ingestion
    """
    parallel_events = []
    
    # Group events by timestamp
    timestamp_groups = {}
    for event in events:
        timestamp = event['timestamp']
        if timestamp not in timestamp_groups:
            timestamp_groups[timestamp] = []
        timestamp_groups[timestamp].append(event)
    
    # Find groups with multiple events
    for timestamp, group in timestamp_groups.items():
        if len(group) > 1:
            parallel_events.extend(group)
    
    return parallel_events
```

### Parallel Event Ordering
```python
def order_parallel_events(events: List[Dict]) -> List[Dict]:
    """
    Order events from parallel ingestion.
    
    Args:
        events: Events to order
    
    Returns:
        Ordered events
    """
    # Apply tie-breaking to parallel events
    ordered = []
    timestamp_groups = {}
    
    for event in events:
        timestamp = event['timestamp']
        if timestamp not in timestamp_groups:
            timestamp_groups[timestamp] = []
        timestamp_groups[timestamp].append(event)
    
    # Order each group
    for timestamp in sorted(timestamp_groups.keys()):
        group = timestamp_groups[timestamp]
        if len(group) > 1:
            # Apply tie-breaking
            group.sort(key=lambda e: (e['event_id'], e['aggregate_id'], e['event_type']))
        ordered.extend(group)
    
    return ordered
```

---

## Ordering Verification

### Verification Procedure
```python
def verify_event_ordering(events: List[Dict]) -> bool:
    """
    Verify event ordering is correct.
    
    Args:
        events: Events to verify
    
    Returns:
        True if ordering is correct
    """
    # Verify timestamps are non-decreasing
    for i in range(len(events) - 1):
        if events[i]['timestamp'] > events[i + 1]['timestamp']:
            return False
    
    # Verify causal ordering
    for i in range(len(events)):
        for j in range(i + 1, len(events)):
            if is_causal(events[j], events[i]):
                return False
    
    return True
```

---

## Ordering Best Practices

### 1. Deterministic Ordering
- Use deterministic comparator
- Use deterministic tie-breaking
- Use deterministic sorting
- No random ordering

### 2. Causal Ordering
- Preserve causal relationships
- Use causation_id for ordering
- Use correlation_id for grouping
- Verify causal ordering

### 3. Clock Skew Handling
- Detect clock skew
- Correct clock skew
- Use causal ordering
- Use tie-breaking

### 4. Parallel Ingestion
- Detect parallel ingestion
- Order parallel events
- Use tie-breaking
- Verify ordering

### 5. Verification
- Verify event ordering
- Verify causal ordering
- Verify timestamp ordering
- Verify tie-breaking
