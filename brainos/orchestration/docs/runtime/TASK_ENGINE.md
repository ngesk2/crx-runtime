# Task Engine

**Phase 4:** Design deterministic task engine

---

## Overview

Task Engine provides deterministic task execution for the runtime. Tasks are created, scheduled, executed, completed, failed, retried, and replayed. Tasks must be replay-safe.

---

## Task Architecture

### Task Flow
```
Task Creation
    ↓
Task Scheduling
    ↓
Task Execution
    ↓
Task Completion / Failure
    ↓
Task Retry (if failed)
    ↓
Task Replay (if needed)
```

---

## Task Creation

### Task Definition
```python
class TaskDefinition:
    """Task definition."""
    
    def __init__(
        self,
        task_type: str,
        task_data: Dict,
        retry_policy: Dict = None
    ):
        self.task_type = task_type
        self.task_data = task_data
        self.retry_policy = retry_policy or {
            'max_retries': 3,
            'retry_delay_ms': 1000,
            'backoff_multiplier': 2
        }
```

### Task Creation
```python
def create_task(task_definition: TaskDefinition, workflow_id: UUID) -> Task:
    """
    Create task from definition.
    
    Args:
        task_definition: Task definition
        workflow_id: Workflow ID
    
    Returns:
        Created task
    """
    task = Task(
        task_id=uuid4(),
        task_type=task_definition.task_type,
        task_data=task_definition.task_data,
        workflow_id=workflow_id,
        state='pending',
        created_at=datetime.utcnow()
    )
    
    # Store task
    store_task(task)
    
    return task
```

---

## Task Scheduling

### Scheduling Strategy
```python
class TaskScheduler:
    """Task scheduler."""
    
    def __init__(self):
        """Initialize task scheduler."""
        self.task_queue = []
        self.scheduled_tasks = {}
    
    def schedule_task(self, task: Task):
        """
        Schedule task for execution.
        
        Args:
            task: Task to schedule
        """
        # Add to queue
        self.task_queue.append(task)
        
        # Mark as scheduled
        self.scheduled_tasks[task.task_id] = task
    
    def get_next_task(self) -> Task:
        """
        Get next task to execute.
        
        Returns:
            Next task or None
        """
        if self.task_queue:
            return self.task_queue.pop(0)
        return None
```

### Priority Scheduling
```python
def schedule_task_with_priority(task: Task, priority: int):
    """
    Schedule task with priority.
    
    Args:
        task: Task to schedule
        priority: Task priority (higher = more important)
    """
    # Add priority to task
    task.priority = priority
    
    # Insert into queue based on priority
    task_queue.insert_sorted(task, key=lambda t: t.priority, reverse=True)
```

---

## Task Execution

### Execution Process
```python
def execute_task(task: Task) -> TaskResult:
    """
    Execute task.
    
    Args:
        task: Task to execute
    
    Returns:
        Task result
    """
    # Update task state
    task.state = 'running'
    
    try:
        # Get task executor
        executor = TASK_EXECUTORS.get(task.task_type)
        
        if not executor:
            raise Exception(f"No executor for task type: {task.task_type}")
        
        # Execute task
        result = executor(task)
        
        # Update task state
        task.state = 'completed'
        task.completed_at = datetime.utcnow()
        
        # Generate witness
        task.witness = generate_task_witness(task, result)
        
        return TaskResult(success=True, data=result.data)
        
    except Exception as e:
        # Update task state
        task.state = 'failed'
        task.completed_at = datetime.utcnow()
        
        # Generate failure witness
        task.witness = generate_task_failure_witness(task, e)
        
        return TaskResult(success=False, error=str(e))
```

### Task Executors
```python
TASK_EXECUTORS = {
    'PROCESS_ARTIFACT': execute_process_artifact_task,
    'GENERATE_EMBEDDINGS': execute_generate_embeddings_task,
    'EXTRACT_ENTITIES': execute_extract_entities_task,
    'INDEX_DOCUMENT': execute_index_document_task,
    'RUN_ANALYSIS': execute_run_analysis_task
}
```

---

## Task Completion

### Completion Handling
```python
def handle_task_completion(task: Task, result: TaskResult):
    """
    Handle task completion.
    
    Args:
        task: Completed task
        result: Task result
    """
    if result.success:
        # Handle successful completion
        handle_successful_completion(task, result)
    else:
        # Handle failure
        handle_task_failure(task, result)
```

### Successful Completion
```python
def handle_successful_completion(task: Task, result: TaskResult):
    """
    Handle successful task completion.
    
    Args:
        task: Completed task
        result: Task result
    """
    # Store result
    store_task_result(task.task_id, result)
    
    # Emit completion event
    emit_task_completed_event(task, result)
    
    # Update workflow state if applicable
    if task.workflow_id:
        update_workflow_state(task.workflow_id, task)
```

---

## Task Failure

### Failure Handling
```python
def handle_task_failure(task: Task, result: TaskResult):
    """
    Handle task failure.
    
    Args:
        task: Failed task
        result: Task result
    """
    # Store failure
    store_task_failure(task.task_id, result)
    
    # Emit failure event
    emit_task_failed_event(task, result)
    
    # Schedule retry if applicable
    if should_retry_task(task):
        schedule_task_retry(task)
```

### Retry Policy
```python
def should_retry_task(task: Task) -> bool:
    """
    Determine if task should be retried.
    
    Args:
        task: Task to check
    
    Returns:
        True if task should be retried
    """
    # Get retry count
    retry_count = get_task_retry_count(task.task_id)
    
    # Get retry policy
    retry_policy = get_task_retry_policy(task.task_id)
    
    # Check if max retries not exceeded
    return retry_count < retry_policy['max_retries']
```

### Task Retry
```python
def schedule_task_retry(task: Task):
    """
    Schedule task retry.
    
    Args:
        task: Task to retry
    """
    # Increment retry count
    increment_task_retry_count(task.task_id)
    
    # Calculate retry delay
    retry_count = get_task_retry_count(task.task_id)
    retry_policy = get_task_retry_policy(task.task_id)
    retry_delay = retry_policy['retry_delay_ms'] * (retry_policy['backoff_multiplier'] ** retry_count)
    
    # Schedule retry
    schedule_task_at(task, datetime.utcnow() + timedelta(milliseconds=retry_delay))
```

---

## Task Replay

### Replay Process
```python
def replay_task(task: Task) -> Task:
    """
    Replay task.
    
    Args:
        task: Task to replay
    
    Returns:
        Replayed task
    
    Guarantee:
        Same task → same result → same witness
    """
    # Reset task state
    task.state = 'pending'
    task.completed_at = None
    task.witness = None
    
    # Execute task
    result = execute_task(task)
    
    # Verify replay correctness
    verify_task_replay(task, result)
    
    return task
```

### Replay Verification
```python
def verify_task_replay(task: Task, result: TaskResult):
    """
    Verify task replay correctness.
    
    Args:
        task: Replayed task
        result: Task result
    
    Raises:
        ReplayVerificationError: If replay is incorrect
    """
    # Get original task witness
    original_witness = get_original_task_witness(task.task_id)
    
    # Compare with new witness
    if task.witness != original_witness:
        raise ReplayVerificationError("Task witness mismatch")
```

---

## Task Engine Best Practices

### 1. Deterministic Execution
- All tasks deterministic
- All tasks replayable
- All tasks verifiable
- No random number generation

### 2. Replay Safety
- Tasks must be replay-safe
- Tasks produce same results on replay
- Tasks generate consistent witnesses
- Tasks maintain idempotence

### 3. Failure Handling
- Clear failure classification
- Deterministic retry policy
- Exponential backoff
- Max retry limits

### 4. Scheduling
- Priority-based scheduling
- Fair scheduling
- Resource-aware scheduling
- Deadline-aware scheduling

### 5. Verification
- Verify task execution
- Verify task replay
- Verify task witnesses
- Verify task results
