# Failure Law

**Phase 6:** Design deterministic failures

---

## Overview

Failure Law establishes deterministic failure handling. No runtime exception messages in replay, no stack traces in replay state. All failures become replayable constitutional events.

---

## Failure Requirements

### Deterministic Failures
**Requirement:** Failures must be deterministic and replayable

**Definition:**
```python
def deterministic_failure(error: Exception) -> Dict:
    """
    Convert exception to deterministic failure event.
    
    Args:
        error: Exception to convert
    
    Returns:
        Failure event
    
    Guarantee:
        Same exception → same failure event
        No stack traces
        No runtime messages
    """
    return {
        'event_type': 'FAILURE_OCCURRED',
        'event_data': {
            'failure_code': classify_error(error),
            'failure_phase': identify_phase(error),
            'failure_category': categorize_error(error)
        }
    }
```

---

## Failure Classification

### Error Codes
```python
ERROR_CODES = {
    'OBJECT_NOT_FOUND': 'OBJ_001',
    'CONTENT_HASH_MISMATCH': 'OBJ_002',
    'EVENT_SEQUENCE_GAP': 'EVT_001',
    'EVENT_CORRUPTION': 'EVT_002',
    'STATE_INCONSISTENCY': 'STA_001',
    'SERIALIZATION_ERROR': 'SER_001',
    'HASH_ERROR': 'HSH_001',
    'ORDERING_VIOLATION': 'ORD_001',
    'CAUSAL_VIOLATION': 'ORD_002',
    'UNKNOWN_ERROR': 'UNK_000'
}

def classify_error(error: Exception) -> str:
    """
    Classify error into error code.
    
    Args:
        error: Exception to classify
    
    Returns:
        Error code
    
    Guarantee:
        Same error type → same error code
        Deterministic classification
    """
    error_type = type(error).__name__
    
    if error_type == 'ObjectNotFoundError':
        return ERROR_CODES['OBJECT_NOT_FOUND']
    elif error_type == 'ContentHashMismatchError':
        return ERROR_CODES['CONTENT_HASH_MISMATCH']
    elif error_type == 'EventSequenceGapError':
        return ERROR_CODES['EVENT_SEQUENCE_GAP']
    elif error_type == 'EventCorruptionError':
        return ERROR_CODES['EVENT_CORRUPTION']
    elif error_type == 'StateInconsistencyError':
        return ERROR_CODES['STATE_INCONSISTENCY']
    elif error_type == 'SerializationError':
        return ERROR_CODES['SERIALIZATION_ERROR']
    elif error_type == 'HashError':
        return ERROR_CODES['HASH_ERROR']
    elif error_type == 'OrderingViolationError':
        return ERROR_CODES['ORDERING_VIOLATION']
    elif error_type == 'CausalViolationError':
        return ERROR_CODES['CAUSAL_VIOLATION']
    else:
        return ERROR_CODES['UNKNOWN_ERROR']
```

### Failure Phases
```python
FAILURE_PHASES = {
    'OBJECT_STORAGE': 'OBJ',
    'EVENT_LOGGING': 'EVT',
    'STATE_TRANSITION': 'STA',
    'SERIALIZATION': 'SER',
    'HASHING': 'HSH',
    'ORDERING': 'ORD',
    'REPLAY': 'RPL',
    'UNKNOWN': 'UNK'
}

def identify_phase(error: Exception) -> str:
    """
    Identify phase where error occurred.
    
    Args:
        error: Exception to identify
    
    Returns:
        Failure phase
    
    Guarantee:
        Same error context → same phase
        Deterministic identification
    """
    # Identify phase from error context
    error_context = get_error_context(error)
    
    if 'object_storage' in error_context:
        return FAILURE_PHASES['OBJECT_STORAGE']
    elif 'event_logging' in error_context:
        return FAILURE_PHASES['EVENT_LOGGING']
    elif 'state_transition' in error_context:
        return FAILURE_PHASES['STATE_TRANSITION']
    elif 'serialization' in error_context:
        return FAILURE_PHASES['SERIALIZATION']
    elif 'hashing' in error_context:
        return FAILURE_PHASES['HASHING']
    elif 'ordering' in error_context:
        return FAILURE_PHASES['ORDERING']
    elif 'replay' in error_context:
        return FAILURE_PHASES['REPLAY']
    else:
        return FAILURE_PHASES['UNKNOWN']
```

### Failure Categories
```python
FAILURE_CATEGORIES = {
    'DATA_INTEGRITY': 'INT',
    'SEQUENCE_ERROR': 'SEQ',
    'STATE_ERROR': 'STA',
    'TRANSIENT_ERROR': 'TRN',
    'PERMANENT_ERROR': 'PRM',
    'UNKNOWN': 'UNK'
}

def categorize_error(error: Exception) -> str:
    """
    Categorize error.
    
    Args:
        error: Exception to categorize
    
    Returns:
        Failure category
    
    Guarantee:
        Same error type → same category
        Deterministic categorization
    """
    error_type = type(error).__name__
    
    if error_type in ['ObjectNotFoundError', 'ContentHashMismatchError', 'EventCorruptionError']:
        return FAILURE_CATEGORIES['DATA_INTEGRITY']
    elif error_type in ['EventSequenceGapError', 'OrderingViolationError', 'CausalViolationError']:
        return FAILURE_CATEGORIES['SEQUENCE_ERROR']
    elif error_type in ['StateInconsistencyError']:
        return FAILURE_CATEGORIES['STATE_ERROR']
    elif error_type in ['TransientError']:
        return FAILURE_CATEGORIES['TRANSIENT_ERROR']
    elif error_type in ['PermanentError']:
        return FAILURE_CATEGORIES['PERMANENT_ERROR']
    else:
        return FAILURE_CATEGORIES['UNKNOWN']
```

---

## Failure Events

### Failure Event Structure
```python
def create_failure_event(error: Exception, event_id: UUID = None) -> Dict:
    """
    Create failure event from exception.
    
    Args:
        error: Exception to convert
        event_id: Original event ID (optional)
    
    Returns:
        Failure event
    
    Guarantee:
        Same exception → same failure event
        No stack traces
        No runtime messages
    """
    return {
        'event_id': uuid4(),
        'event_type': 'FAILURE_OCCURRED',
        'timestamp': datetime.utcnow().isoformat(),
        'aggregate_id': event_id if event_id else uuid4(),
        'aggregate_type': 'failure',
        'event_data': {
            'failure_code': classify_error(error),
            'failure_phase': identify_phase(error),
            'failure_category': categorize_error(error),
            'original_event_id': str(event_id) if event_id else None
        },
        'causation_id': event_id if event_id else None,
        'correlation_id': None
    }
```

---

## Failure Handling in Replay

### Replay Failure Handling
```python
def replay_with_failure_handling(events: List[Dict]) -> Dict:
    """
    Replay events with deterministic failure handling.
    
    Args:
        events: Events to replay
    
    Returns:
        Resulting state
    
    Guarantee:
        No exceptions raised
        All failures become events
        Deterministic failure handling
    """
    state = initialize_state()
    
    for event in events:
        try:
            # Apply event
            state = apply_event(state, event)
            
        except Exception as e:
            # Convert to failure event
            failure_event = create_failure_event(e, event['event_id'])
            
            # Apply failure event
            state = apply_event(state, failure_event)
    
    return state
```

---

## Failure State

### Failure State Structure
```python
class FailureState:
    """Failure state tracking."""
    
    def __init__(self):
        self.failures = []
        self.failure_counts = {}
    
    def record_failure(self, failure_event: Dict):
        """
        Record failure event.
        
        Args:
            failure_event: Failure event to record
        """
        self.failures.append(failure_event)
        
        failure_code = failure_event['event_data']['failure_code']
        if failure_code not in self.failure_counts:
            self.failure_counts[failure_code] = 0
        self.failure_counts[failure_code] += 1
    
    def get_failure_summary(self) -> Dict:
        """
        Get failure summary.
        
        Returns:
            Failure summary
        """
        return {
            'total_failures': len(self.failures),
            'failure_counts': self.failure_counts,
            'last_failure': self.failures[-1] if self.failures else None
        }
```

---

## Failure Verification

### Failure Determinism Verification
```python
def verify_failure_determinism(error: Exception):
    """
    Verify failure classification is deterministic.
    
    Args:
        error: Exception to verify
    
    Returns:
        True if deterministic
    """
    # Classify error multiple times
    classifications = []
    for _ in range(10):
        code = classify_error(error)
        phase = identify_phase(error)
        category = categorize_error(error)
        classifications.append((code, phase, category))
    
    # Verify all classifications identical
    first = classifications[0]
    for classification in classifications[1:]:
        if classification != first:
            return False
    
    return True
```

---

## Failure Best Practices

### 1. Deterministic Classification
- Use deterministic error classification
- Use deterministic phase identification
- Use deterministic error categorization
- No runtime messages in classification

### 2. No Stack Traces
- Never include stack traces in events
- Never include runtime messages in events
- Never include system-specific information
- Use only error codes and phases

### 3. Failure Events
- Convert all failures to events
- Use standard failure event structure
- Include failure code, phase, category
- Reference original event if applicable

### 4. Failure State
- Track failures in state
- Count failures by type
- Summarize failures
- Verify failure determinism

### 5. Verification
- Verify failure classification determinism
- Verify failure event structure
- Verify failure state consistency
- Verify failure handling in replay
