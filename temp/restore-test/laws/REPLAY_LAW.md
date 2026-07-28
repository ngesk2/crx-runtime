# Replay Law

**Phase 4:** Define replay constitution

---

## Overview

Replay Law establishes the constitutional requirements for replay. Replay must be deterministic, reproducible, and idempotent. Same event stream must always produce same state.

---

## Replay Constitution

### Deterministic Replay
**Requirement:** Same event stream → same state

**Definition:**
```python
def replay_deterministic(events: List[Dict]) -> Dict:
    """
    Replay events deterministically.
    
    Args:
        events: Event stream to replay
    
    Returns:
        Resulting state
    
    Guarantee:
        Same events → same state
        No exceptions
    """
    state = initialize_state()
    
    for event in events:
        state = apply_event(state, event)
    
    return state
```

### Reproducible Replay
**Requirement:** Replay produces same results across systems

**Definition:**
```python
def replay_reproducible(events: List[Dict]) -> Dict:
    """
    Replay events reproducibly.
    
    Args:
        events: Event stream to replay
    
    Returns:
        Resulting state
    
    Guarantee:
        Same events → same state on any system
        No system-specific behavior
    """
    # Use canonical serialization
    # Use canonical hashing
    # Use deterministic ordering
    return replay_deterministic(events)
```

### Idempotent Replay
**Requirement:** Replay can be repeated without side effects

**Definition:**
```python
def replay_idempotent(events: List[Dict]) -> Dict:
    """
    Replay events idempotently.
    
    Args:
        events: Event stream to replay
    
    Returns:
        Resulting state
    
    Guarantee:
        Multiple replays → same state
        No side effects
    """
    state = initialize_state()
    
    for event in events:
        # Check if event already applied
        if not event_already_applied(state, event):
            state = apply_event(state, event)
    
    return state
```

---

## Replay Requirements

### 1. Same Event Stream → Same State
**Requirement:** Identical event streams must produce identical states

**Verification:**
```python
def verify_replay_determinism(events: List[Dict]):
    """
    Verify replay determinism.
    
    Args:
        events: Event stream to verify
    """
    # Replay multiple times
    states = []
    for _ in range(10):
        state = replay_deterministic(events)
        states.append(state)
    
    # Verify all states identical
    first_state = states[0]
    for state in states[1:]:
        assert states_equal(first_state, state)
```

### 2. No Exceptions in Replay
**Requirement:** Replay must never raise exceptions

**Implementation:**
```python
def replay_no_exceptions(events: List[Dict]) -> Dict:
    """
    Replay events without exceptions.
    
    Args:
        events: Event stream to replay
    
    Returns:
        Resulting state
    
    Guarantee:
        No exceptions raised
        All errors become events
    """
    state = initialize_state()
    
    for event in events:
        try:
            state = apply_event(state, event)
        except Exception as e:
            # Convert exception to event
            error_event = {
                'event_type': 'REPLAY_ERROR',
                'event_data': {
                    'error_code': classify_error(e),
                    'error_phase': identify_phase(e),
                    'original_event_id': event['event_id']
                }
            }
            state = apply_event(state, error_event)
    
    return state
```

### 3. Deterministic Event Application
**Requirement:** Event application must be deterministic

**Implementation:**
```python
def apply_event_deterministic(state: Dict, event: Dict) -> Dict:
    """
    Apply event deterministically.
    
    Args:
        state: Current state
        event: Event to apply
    
    Returns:
        Updated state
    
    Guarantee:
        Same state + same event → same result
    """
    # Use canonical event handling
    # Use deterministic state transitions
    # Use canonical serialization
    return apply_event(state, event)
```

---

## Replay State Machine

### State Definition
```python
class ReplayState:
    """Replay state machine."""
    
    def __init__(self):
        self.state = {}
        self.event_index = 0
        self.events_applied = []
        self.events_failed = []
    
    def apply_event(self, event: Dict):
        """
        Apply event to state.
        
        Args:
            event: Event to apply
        """
        try:
            # Apply event
            new_state = apply_event_deterministic(self.state, event)
            
            # Update state
            self.state = new_state
            self.event_index += 1
            self.events_applied.append(event['event_id'])
            
        except Exception as e:
            # Record failure
            self.events_failed.append({
                'event_id': event['event_id'],
                'error_code': classify_error(e),
                'error_phase': identify_phase(e)
            })
    
    def get_state(self) -> Dict:
        """
        Get current state.
        
        Returns:
            Current state
        """
        return self.state.copy()
```

---

## Replay Verification

### State Verification
```python
def verify_replay_state(expected_state: Dict, actual_state: Dict) -> bool:
    """
    Verify replay state matches expected.
    
    Args:
        expected_state: Expected state
        actual_state: Actual state
    
    Returns:
        True if states match
    """
    # Compare state hashes
    expected_hash = hash_object(hash_authority, expected_state)
    actual_hash = hash_object(hash_authority, actual_state)
    
    return expected_hash == actual_hash
```

### Event Verification
```python
def verify_replay_events(events: List[Dict]) -> bool:
    """
    Verify replay events are valid.
    
    Args:
        events: Events to verify
    
    Returns:
        True if events valid
    """
    # Verify event ordering
    if not verify_event_ordering(events):
        return False
    
    # Verify event integrity
    for event in events:
        if not verify_event_integrity(event):
            return False
    
    return True
```

---

## Replay Guarantees

### Guarantee 1: Determinism
**Statement:** Same event stream always produces same state

**Proof:**
- Events are immutable
- Event application is deterministic
- State transitions are deterministic
- No external state dependencies

### Guarantee 2: Reproducibility
**Statement:** Replay produces same results across systems

**Proof:**
- Canonical serialization
- Canonical hashing
- Deterministic ordering
- No system-specific behavior

### Guarantee 3: Idempotence
**Statement:** Replay can be repeated without side effects

**Proof:**
- Event application is idempotent
- State transitions are idempotent
- No external side effects
- No hidden state

---

## Replay Best Practices

### 1. Deterministic Event Application
- Use deterministic event handlers
- Use deterministic state transitions
- Use canonical serialization
- Use canonical hashing

### 2. Error Handling
- Never raise exceptions in replay
- Convert errors to events
- Classify errors deterministically
- Record errors in state

### 3. State Verification
- Verify state after each event
- Verify state after replay
- Verify state hashes
- Verify state integrity

### 4. Event Verification
- Verify event ordering
- Verify event integrity
- Verify event sequence
- Verify event completeness

### 5. Testing
- Test replay determinism
- Test replay reproducibility
- Test replay idempotence
- Test replay with edge cases
