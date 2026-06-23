# Command Bus

**Phase 3:** Design constitutional command system

---

## Overview

Command Bus provides the constitutional command system for the runtime. Commands submit, validate, authorize, execute, replay, and audit. Commands never mutate state directly - commands emit events, events mutate state.

---

## Command System Architecture

### Command Flow
```
Command Submission
    ↓
Command Validation
    ↓
Command Authorization
    ↓
Command Execution
    ↓
Event Emission
    ↓
State Mutation
    ↓
Command Auditing
    ↓
Witness Generation
```

---

## Command Submission

### Submission Interface
```python
class CommandBus:
    """Command bus for command submission."""
    
    def submit_command(self, command: Command) -> UUID:
        """
        Submit command for execution.
        
        Args:
            command: Command to submit
        
        Returns:
            Command ID
        """
        # Assign command ID if not present
        if not command.command_id:
            command.command_id = uuid4()
        
        # Set timestamp if not present
        if not command.timestamp:
            command.timestamp = datetime.utcnow()
        
        # Submit to command queue
        self.command_queue.put(command)
        
        return command.command_id
```

### Command Queue
```python
class CommandQueue:
    """Command queue for command submission."""
    
    def __init__(self):
        """Initialize command queue."""
        self.queue = []
    
    def put(self, command: Command):
        """
        Put command in queue.
        
        Args:
            command: Command to queue
        """
        self.queue.append(command)
    
    def get(self) -> Command:
        """
        Get command from queue.
        
        Returns:
            Command from queue
        """
        if self.queue:
            return self.queue.pop(0)
        return None
```

---

## Command Validation

### Validation Rules
```python
def validate_command(command: Command):
    """
    Validate command.
    
    Args:
        command: Command to validate
    
    Raises:
        ValidationError: If command is invalid
    """
    # Validate command ID
    if not command.command_id:
        raise ValidationError("Command ID required")
    
    # Validate command type
    if not command.command_type:
        raise ValidationError("Command type required")
    
    # Validate command data
    if not command.command_data:
        raise ValidationError("Command data required")
    
    # Validate user ID
    if not command.user_id:
        raise ValidationError("User ID required")
    
    # Validate timestamp
    if not command.timestamp:
        raise ValidationError("Timestamp required")
    
    # Validate command type specific rules
    validate_command_type_specific(command)
```

### Command Type Validation
```python
COMMAND_VALIDATORS = {
    'CREATE_ARTIFACT': validate_create_artifact_command,
    'UPDATE_ARTIFACT': validate_update_artifact_command,
    'DELETE_ARTIFACT': validate_delete_artifact_command,
    'CREATE_WORKFLOW': validate_create_workflow_command,
    'EXECUTE_WORKFLOW': validate_execute_workflow_command
}

def validate_command_type_specific(command: Command):
    """
    Validate command type specific rules.
    
    Args:
        command: Command to validate
    
    Raises:
        ValidationError: If command is invalid
    """
    validator = COMMAND_VALIDATORS.get(command.command_type)
    
    if validator:
        validator(command)
```

---

## Command Authorization

### Authorization Model
```python
def authorize_command(command: Command):
    """
    Authorize command execution.
    
    Args:
        command: Command to authorize
    
    Raises:
        AuthorizationError: If command is not authorized
    """
    # Get user permissions
    user_permissions = get_user_permissions(command.user_id)
    
    # Check if user has permission for command type
    required_permission = get_required_permission(command.command_type)
    
    if required_permission not in user_permissions:
        raise AuthorizationError(f"User lacks permission: {required_permission}")
    
    # Check object-level permissions if applicable
    if 'artifact_id' in command.command_data:
        artifact_permissions = get_artifact_permissions(
            command.user_id,
            command.command_data['artifact_id']
        )
        
        if 'write' not in artifact_permissions:
            raise AuthorizationError("User lacks artifact write permission")
```

### Permission Model
```python
class Permission:
    """Permission model."""
    
    def __init__(
        self,
        permission_id: UUID,
        user_id: UUID,
        permission_type: str,
        resource_type: str,
        resource_id: UUID = None
    ):
        self.permission_id = permission_id
        self.user_id = user_id
        self.permission_type = permission_type  # read, write, execute, admin
        self.resource_type = resource_type  # artifact, workflow, task
        self.resource_id = resource_id
```

---

## Command Execution

### Execution Process
```python
def execute_command(command: Command) -> Tuple[State, List[Event]]:
    """
    Execute command.
    
    Args:
        command: Command to execute
    
    Returns:
        Tuple of (new state, events)
    """
    # Validate command
    validate_command(command)
    
    # Authorize command
    authorize_command(command)
    
    # Emit events
    events = emit_events(command)
    
    # Apply events to state
    state = apply_events(get_current_state(), events)
    
    return state, events
```

### Event Emission
```python
def emit_events(command: Command) -> List[Event]:
    """
    Emit events from command.
    
    Args:
        command: Command to emit events from
    
    Returns:
        List of events
    """
    events = []
    
    # Get event emitter for command type
    emitter = COMMAND_EVENT_EMITTERS.get(command.command_type)
    
    if emitter:
        events = emitter(command)
    else:
        # Default event emission
        events = [create_command_executed_event(command)]
    
    return events
```

### Command Event Emitters
```python
COMMAND_EVENT_EMITTERS = {
    'CREATE_ARTIFACT': emit_create_artifact_events,
    'UPDATE_ARTIFACT': emit_update_artifact_events,
    'DELETE_ARTIFACT': emit_delete_artifact_events,
    'CREATE_WORKFLOW': emit_create_workflow_events,
    'EXECUTE_WORKFLOW': emit_execute_workflow_events
}
```

---

## Command Replay

### Replay Process
```python
def replay_command(command: Command) -> Tuple[State, List[Event]]:
    """
    Replay command.
    
    Args:
        command: Command to replay
    
    Returns:
        Tuple of (new state, events)
    
    Guarantee:
        Same command → same events → same state
    """
    # Replay command execution
    state, events = execute_command(command)
    
    # Verify replay correctness
    verify_command_replay(command, events, state)
    
    return state, events
```

### Replay Verification
```python
def verify_command_replay(command: Command, events: List[Event], state: State):
    """
    Verify command replay correctness.
    
    Args:
        command: Command that was replayed
        events: Events emitted
        state: Resulting state
    
    Raises:
        ReplayVerificationError: If replay is incorrect
    """
    # Verify event count
    expected_event_count = get_expected_event_count(command)
    if len(events) != expected_event_count:
        raise ReplayVerificationError("Event count mismatch")
    
    # Verify event types
    expected_event_types = get_expected_event_types(command)
    actual_event_types = [e.event_type for e in events]
    if actual_event_types != expected_event_types:
        raise ReplayVerificationError("Event type mismatch")
    
    # Verify state hash
    expected_state_hash = get_expected_state_hash(command)
    actual_state_hash = state.compute_hash(hash_authority)
    if actual_state_hash != expected_state_hash:
        raise ReplayVerificationError("State hash mismatch")
```

---

## Command Auditing

### Audit Process
```python
def audit_command_execution(command: Command, events: List[Event]):
    """
    Audit command execution.
    
    Args:
        command: Command that was executed
        events: Events emitted
    """
    # Create audit record
    audit_record = {
        'audit_id': uuid4(),
        'command_id': str(command.command_id),
        'command_type': command.command_type,
        'user_id': str(command.user_id),
        'timestamp': command.timestamp.isoformat(),
        'event_ids': [str(e.event_id) for e in events],
        'event_types': [e.event_type for e in events]
    }
    
    # Store audit record
    store_audit_record(audit_record)
```

### Audit Query
```python
def query_command_audit(command_id: UUID) -> List[Dict]:
    """
    Query command audit records.
    
    Args:
        command_id: Command ID to query
    
    Returns:
        List of audit records
    """
    query = """
        SELECT * FROM audit_log
        WHERE command_id = $1
        ORDER BY timestamp
    """
    
    return execute_query(query, [str(command_id)])
```

---

## Command Bus Best Practices

### 1. Command Validation
- Validate all commands
- Validate command structure
- Validate command type specific rules
- Validate user permissions

### 2. Command Authorization
- Authorize all commands
- Check user permissions
- Check resource permissions
- Maintain permission model

### 3. Command Execution
- Commands emit events
- Events mutate state
- Commands never mutate state directly
- Maintain event sourcing

### 4. Command Replay
- All commands replayable
- Replay produces same results
- Verify replay correctness
- Maintain replayability

### 5. Command Auditing
- Audit all command executions
- Track command history
- Track event history
- Maintain audit trail
