# Failure Recovery

**Phase 14:** Design runtime recovery

---

## Overview

Failure Recovery provides runtime recovery procedures for crash recovery, workflow recovery, task recovery, replay recovery, snapshot recovery, and witness verification after recovery.

---

## Crash Recovery

### Crash Detection
```python
def detect_crash():
    """
    Detect system crash.
    
    Returns:
        True if crash detected
    """
    # Check if runtime process is running
    if not is_runtime_process_running():
        return True
    
    # Check if last heartbeat is recent
    last_heartbeat = get_last_heartbeat()
    if datetime.utcnow() - last_heartbeat > timedelta(minutes=5):
        return True
    
    return False
```

### Crash Recovery Procedure
```python
def recover_from_crash():
    """
    Recover from system crash.
    
    Returns:
        Recovery status
    """
    # Detect crash
    if not detect_crash():
        return {'status': 'no_crash'}
    
    # Restore state from event log
    state = replay_events()
    
    # Recover running workflows
    recover_running_workflows()
    
    # Recover running tasks
    recover_running_tasks()
    
    # Verify state integrity
    verify_state_integrity(state)
    
    # Verify witnesses
    verify_all_witnesses()
    
    return {'status': 'recovered'}
```

---

## Workflow Recovery

### Workflow Failure Detection
```python
def detect_workflow_failure(workflow_id: UUID) -> bool:
    """
    Detect workflow failure.
    
    Args:
        workflow_id: Workflow ID
    
    Returns:
        True if workflow failed
    """
    workflow = get_workflow(workflow_id)
    
    return workflow.state == 'failed'
```

### Workflow Recovery Procedure
```python
def recover_workflow(workflow_id: UUID) -> Workflow:
    """
    Recover failed workflow.
    
    Args:
        workflow_id: Workflow ID
    
    Returns:
        Recovered workflow
    """
    # Get workflow
    workflow = get_workflow(workflow_id)
    
    # Identify failed tasks
    failed_tasks = identify_failed_tasks(workflow)
    
    # Reset failed tasks
    for task in failed_tasks:
        reset_task(task)
    
    # Resume workflow execution
    workflow = execute_workflow(workflow)
    
    # Verify workflow witness
    verify_workflow_witness(workflow)
    
    return workflow
```

---

## Task Recovery

### Task Failure Detection
```python
def detect_task_failure(task_id: UUID) -> bool:
    """
    Detect task failure.
    
    Args:
        task_id: Task ID
    
    Returns:
        True if task failed
    """
    task = get_task(task_id)
    
    return task.state == 'failed'
```

### Task Recovery Procedure
```python
def recover_task(task_id: UUID) -> Task:
    """
    Recover failed task.
    
    Args:
        task_id: Task ID
    
    Returns:
        Recovered task
    """
    # Get task
    task = get_task(task_id)
    
    # Reset task state
    task.state = 'pending'
    task.completed_at = None
    task.witness = None
    
    # Execute task
    task = execute_task(task)
    
    # Verify task witness
    verify_task_witness(task)
    
    return task
```

---

## Replay Recovery

### Replay Failure Detection
```python
def detect_replay_failure(replay_id: UUID) -> bool:
    """
    Detect replay failure.
    
    Args:
        replay_id: Replay ID
    
    Returns:
        True if replay failed
    """
    replay = get_replay(replay_id)
    
    return replay.status == 'failed'
```

### Replay Recovery Procedure
```python
def recover_replay(replay_id: UUID) -> Dict:
    """
    Recover failed replay.
    
    Args:
        replay_id: Replay ID
    
    Returns:
        Recovered state
    """
    # Get replay
    replay = get_replay(replay_id)
    
    # Identify failure point
    failure_event_id = identify_failure_point(replay)
    
    # Replay from failure point
    events = get_events_since(failure_event_id)
    state = replay_events(events)
    
    # Verify state integrity
    verify_state_integrity(state)
    
    # Generate new witness
    witness = generate_replay_witness(replay_id, state)
    
    return {
        'state': state,
        'witness': witness
    }
```

---

## Snapshot Recovery

### Snapshot Creation
```python
def create_runtime_snapshot() -> Snapshot:
    """
    Create runtime snapshot.
    
    Returns:
        Runtime snapshot
    """
    # Get current state
    state = get_current_state()
    
    # Get latest event ID
    latest_event_id = get_latest_event_id()
    
    # Create snapshot
    snapshot = Snapshot(
        state=state,
        event_id=latest_event_id,
        version=get_runtime_version(),
        timestamp=datetime.utcnow()
    )
    
    # Store snapshot
    store_snapshot(snapshot)
    
    return snapshot
```

### Snapshot Recovery Procedure
```python
def recover_from_snapshot(snapshot: Snapshot) -> Dict:
    """
    Recover from snapshot.
    
    Args:
        snapshot: Snapshot to recover from
    
    Returns:
        Recovered state
    """
    # Restore state from snapshot
    state = snapshot.state.copy()
    
    # Replay events since snapshot
    events = get_events_since(snapshot.event_id)
    for event in events:
        state = apply_event(state, event)
    
    # Verify state integrity
    verify_state_integrity(state)
    
    # Verify state hash
    state_hash = state.compute_hash(hash_authority)
    if state_hash != snapshot.state_hash:
        raise Exception("State hash mismatch after snapshot recovery")
    
    return state
```

---

## Witness Verification After Recovery

### Verification Procedure
```python
def verify_witnesses_after_recovery():
    """
    Verify all witnesses after recovery.
    
    Returns:
        Verification status
    """
    # Get all witnesses
    witnesses = get_all_witnesses()
    
    # Verify each witness
    for witness in witnesses:
        # Get associated execution
        execution = get_execution(witness.execution_id)
        
        # Reconstruct witness
        reconstructed_witness = generate_witness(execution)
        
        # Verify witness matches
        if witness != reconstructed_witness:
            raise Exception(f"Witness mismatch for execution {witness.execution_id}")
    
    return {'status': 'verified'}
```

---

## Failure Recovery Best Practices

### 1. Crash Recovery
- Detect crashes automatically
- Recover state from event log
- Recover running workflows
- Recover running tasks
- Verify state integrity

### 2. Workflow Recovery
- Detect workflow failures
- Identify failed tasks
- Reset failed tasks
- Resume workflow execution
- Verify workflow witness

### 3. Task Recovery
- Detect task failures
- Reset task state
- Retry task execution
- Verify task witness
- Update task lineage

### 4. Replay Recovery
- Detect replay failures
- Identify failure point
- Replay from failure point
- Verify state integrity
- Generate new witness

### 5. Snapshot Recovery
- Create snapshots regularly
- Use snapshots for recovery
- Replay events since snapshot
- Verify state integrity
- Verify state hash

### 6. Witness Verification
- Verify witnesses after recovery
- Reconstruct witnesses
- Compare with stored witnesses
- Verify witness consistency
- Verify witness integrity
