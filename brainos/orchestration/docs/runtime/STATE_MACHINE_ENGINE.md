# State Machine Engine

**Phase 6:** Design aggregate state machines

---

## Overview

State Machine Engine provides aggregate state machine management for the runtime. State machines handle state transitions, transition validation, transition witnesses, transition replay, transition hashing, and transition verification.

---

## State Machine Architecture

### State Machine Flow
```
Current State
    ↓
Transition Request
    ↓
Transition Validation
    ↓
Transition Execution
    ↓
State Mutation
    ↓
Transition Witness Generation
    ↓
Transition Persistence
```

---

## State Machine Definition

### State Machine Structure
```python
class StateMachine:
    """Aggregate state machine."""
    
    def __init__(
        self,
        aggregate_id: UUID,
        aggregate_type: str,
        initial_state: str,
        states: Dict[str, Dict],
        transitions: Dict[str, Dict]
    ):
        self.aggregate_id = aggregate_id
        self.aggregate_type = aggregate_type
        self.current_state = initial_state
        self.states = states
        self.transitions = transitions
        self.state_history = []
```

### State Definition
```python
class State:
    """State definition."""
    
    def __init__(
        self,
        state_name: str,
        state_data: Dict = None,
        entry_actions: List[str] = None,
        exit_actions: List[str] = None
    ):
        self.state_name = state_name
        self.state_data = state_data or {}
        self.entry_actions = entry_actions or []
        self.exit_actions = exit_actions or []
```

### Transition Definition
```python
class Transition:
    """Transition definition."""
    
    def __init__(
        self,
        from_state: str,
        to_state: str,
        trigger: str,
        guard: str = None,
        actions: List[str] = None
    ):
        self.from_state = from_state
        self.to_state = to_state
        self.trigger = trigger
        self.guard = guard
        self.actions = actions or []
```

---

## State Transitions

### Transition Process
```python
def transition_state(
    state_machine: StateMachine,
    trigger: str,
    event_data: Dict = None
) -> StateMachine:
    """
    Transition state machine to new state.
    
    Args:
        state_machine: State machine to transition
        trigger: Trigger for transition
        event_data: Event data (optional)
    
    Returns:
        Updated state machine
    
    Guarantee:
        Deterministic transition
        Replayable transition
    """
    # Get current state
    current_state = state_machine.current_state
    
    # Find transition
    transition = find_transition(state_machine, current_state, trigger)
    
    if not transition:
        raise InvalidTransitionError(f"No transition from {current_state} on {trigger}")
    
    # Validate transition
    validate_transition(state_machine, transition, event_data)
    
    # Execute transition
    execute_transition(state_machine, transition, event_data)
    
    # Generate witness
    witness = generate_transition_witness(state_machine, transition)
    
    # Persist transition
    persist_transition(state_machine, transition, witness)
    
    return state_machine
```

### Transition Finding
```python
def find_transition(
    state_machine: StateMachine,
    from_state: str,
    trigger: str
) -> Transition:
    """
    Find transition for trigger.
    
    Args:
        state_machine: State machine
        from_state: Current state
        trigger: Trigger
    
    Returns:
        Transition or None
    """
    transitions = state_machine.transitions.get(from_state, {})
    
    for transition in transitions.values():
        if transition.trigger == trigger:
            return transition
    
    return None
```

---

## Transition Validation

### Validation Rules
```python
def validate_transition(
    state_machine: StateMachine,
    transition: Transition,
    event_data: Dict = None
):
    """
    Validate transition.
    
    Args:
        state_machine: State machine
        transition: Transition to validate
        event_data: Event data (optional)
    
    Raises:
        InvalidTransitionError: If transition is invalid
    """
    # Validate from state
    if transition.from_state != state_machine.current_state:
        raise InvalidTransitionError(
            f"Transition from {transition.from_state} but current state is {state_machine.current_state}"
        )
    
    # Validate to state exists
    if transition.to_state not in state_machine.states:
        raise InvalidTransitionError(f"Target state {transition.to_state} does not exist")
    
    # Execute guard if present
    if transition.guard:
        guard_result = execute_guard(state_machine, transition.guard, event_data)
        if not guard_result:
            raise InvalidTransitionError(f"Guard {transition.guard} failed")
```

### Guard Execution
```python
def execute_guard(
    state_machine: StateMachine,
    guard: str,
    event_data: Dict = None
) -> bool:
    """
    Execute guard function.
    
    Args:
        state_machine: State machine
        guard: Guard function name
        event_data: Event data (optional)
    
    Returns:
        Guard result
    """
    guard_func = GUARD_FUNCTIONS.get(guard)
    
    if not guard_func:
        raise Exception(f"Guard function {guard} not found")
    
    return guard_func(state_machine, event_data)
```

---

## Transition Execution

### Execution Process
```python
def execute_transition(
    state_machine: StateMachine,
    transition: Transition,
    event_data: Dict = None
):
    """
    Execute transition.
    
    Args:
        state_machine: State machine
        transition: Transition to execute
        event_data: Event data (optional)
    """
    # Execute exit actions of current state
    current_state_def = state_machine.states[state_machine.current_state]
    for action in current_state_def.exit_actions:
        execute_action(state_machine, action, event_data)
    
    # Record state history
    state_machine.state_history.append({
        'from_state': state_machine.current_state,
        'to_state': transition.to_state,
        'trigger': transition.trigger,
        'timestamp': datetime.utcnow().isoformat()
    })
    
    # Transition to new state
    state_machine.current_state = transition.to_state
    
    # Execute entry actions of new state
    new_state_def = state_machine.states[transition.to_state]
    for action in new_state_def.entry_actions:
        execute_action(state_machine, action, event_data)
    
    # Execute transition actions
    for action in transition.actions:
        execute_action(state_machine, action, event_data)
```

### Action Execution
```python
def execute_action(
    state_machine: StateMachine,
    action: str,
    event_data: Dict = None
):
    """
    Execute action function.
    
    Args:
        state_machine: State machine
        action: Action function name
        event_data: Event data (optional)
    """
    action_func = ACTION_FUNCTIONS.get(action)
    
    if not action_func:
        raise Exception(f"Action function {action} not found")
    
    action_func(state_machine, event_data)
```

---

## Transition Witnesses

### Witness Generation
```python
def generate_transition_witness(
    state_machine: StateMachine,
    transition: Transition
) -> Witness:
    """
    Generate transition witness.
    
    Args:
        state_machine: State machine
        transition: Transition that was executed
    
    Returns:
        Transition witness
    """
    witness = Witness(
        witness_id=uuid4(),
        execution_id=state_machine.aggregate_id,
        state_hash=compute_state_hash(state_machine),
        event_hashes=[],
        timestamp=datetime.utcnow()
    )
    
    # Add transition-specific data
    witness.aggregate_id = state_machine.aggregate_id
    witness.aggregate_type = state_machine.aggregate_type
    witness.from_state = transition.from_state
    witness.to_state = transition.to_state
    witness.trigger = transition.trigger
    witness.transition_hash = compute_transition_hash(transition)
    
    return witness
```

---

## Transition Replay

### Replay Process
```python
def replay_transition(
    state_machine: StateMachine,
    transition: Transition,
    event_data: Dict = None
) -> StateMachine:
    """
    Replay transition.
    
    Args:
        state_machine: State machine
        transition: Transition to replay
        event_data: Event data (optional)
    
    Returns:
        Replayed state machine
    
    Guarantee:
        Same transition → same state → same witness
    """
    # Execute transition
    execute_transition(state_machine, transition, event_data)
    
    # Generate witness
    witness = generate_transition_witness(state_machine, transition)
    
    # Verify replay correctness
    verify_transition_replay(state_machine, transition, witness)
    
    return state_machine
```

### Replay Verification
```python
def verify_transition_replay(
    state_machine: StateMachine,
    transition: Transition,
    witness: Witness
):
    """
    Verify transition replay correctness.
    
    Args:
        state_machine: Replayed state machine
        transition: Transition that was replayed
        witness: Generated witness
    
    Raises:
        ReplayVerificationError: If replay is incorrect
    """
    # Get original witness
    original_witness = get_original_transition_witness(
        state_machine.aggregate_id,
        transition
    )
    
    # Compare witnesses
    if witness != original_witness:
        raise ReplayVerificationError("Transition witness mismatch")
```

---

## Transition Hashing

### Hash Computation
```python
def compute_transition_hash(transition: Transition) -> str:
    """
    Compute transition hash.
    
    Args:
        transition: Transition to hash
    
    Returns:
        Transition hash
    """
    # Serialize transition
    transition_dict = {
        'from_state': transition.from_state,
        'to_state': transition.to_state,
        'trigger': transition.trigger,
        'guard': transition.guard,
        'actions': transition.actions
    }
    
    # Hash using canonical serialization
    return hash_object(hash_authority, transition_dict)
```

### State Hash Computation
```python
def compute_state_hash(state_machine: StateMachine) -> str:
    """
    Compute state hash.
    
    Args:
        state_machine: State machine
    
    Returns:
        State hash
    """
    # Serialize state
    state_dict = {
        'aggregate_id': str(state_machine.aggregate_id),
        'aggregate_type': state_machine.aggregate_type,
        'current_state': state_machine.current_state,
        'state_data': state_machine.states[state_machine.current_state].state_data
    }
    
    # Hash using canonical serialization
    return hash_object(hash_authority, state_dict)
```

---

## Transition Verification

### Verification Process
```python
def verify_transition(
    state_machine: StateMachine,
    transition: Transition,
    witness: Witness
) -> bool:
    """
    Verify transition correctness.
    
    Args:
        state_machine: State machine
        transition: Transition that was executed
        witness: Transition witness
    
    Returns:
        True if transition is valid
    """
    # Verify state hash
    state_hash = compute_state_hash(state_machine)
    if state_hash != witness.state_hash:
        return False
    
    # Verify transition hash
    transition_hash = compute_transition_hash(transition)
    if transition_hash != witness.transition_hash:
        return False
    
    # Verify state transition
    if witness.from_state != transition.from_state:
        return False
    
    if witness.to_state != transition.to_state:
        return False
    
    return True
```

---

## State Machine Engine Best Practices

### 1. Deterministic Transitions
- All transitions deterministic
- All transitions replayable
- All transitions verifiable
- No random state transitions

### 2. Transition Validation
- Validate all transitions
- Validate guards
- Validate state existence
- Validate transition legality

### 3. Witness Generation
- Generate witnesses for all transitions
- Verify witnesses
- Persist witnesses
- Support replay verification

### 4. Hash Computation
- Compute state hashes
- Compute transition hashes
- Use canonical serialization
- Support verification

### 5. Verification
- Verify transition correctness
- Verify replay correctness
- Verify witness correctness
- Verify hash correctness
