# Workflow Engine

**Phase 5:** Design constitutional workflows

---

## Overview

Workflow Engine provides constitutional workflow orchestration for the runtime. Workflows have definitions, state, replay, recovery, versioning, and witness generation. Workflows must execute identically during replay.

---

## Workflow Architecture

### Workflow Flow
```
Workflow Definition
    ↓
Workflow Execution
    ↓
Workflow State Management
    ↓
Task Execution
    ↓
Workflow Completion / Failure
    ↓
Workflow Recovery (if needed)
    ↓
Workflow Replay (if needed)
```

---

## Workflow Definition

### Workflow Definition Structure
```python
class WorkflowDefinition:
    """Workflow definition."""
    
    def __init__(
        self,
        workflow_type: str,
        workflow_name: str,
        tasks: List[Dict],
        dependencies: Dict[str, List[str]] = None,
        version: str = "1.0"
    ):
        self.workflow_type = workflow_type
        self.workflow_name = workflow_name
        self.tasks = tasks
        self.dependencies = dependencies or {}
        self.version = version
```

### Task Definition
```python
class TaskDefinition:
    """Task definition within workflow."""
    
    def __init__(
        self,
        task_id: str,
        task_type: str,
        task_data: Dict,
        dependencies: List[str] = None
    ):
        self.task_id = task_id
        self.task_type = task_type
        self.task_data = task_data
        self.dependencies = dependencies or []
```

---

## Workflow State Management

### Workflow States
```python
WORKFLOW_STATES = {
    'pending': 'Workflow pending execution',
    'running': 'Workflow currently running',
    'completed': 'Workflow completed successfully',
    'failed': 'Workflow failed',
    'paused': 'Workflow paused',
    'cancelled': 'Workflow cancelled'
}
```

### State Transitions
```python
WORKFLOW_STATE_TRANSITIONS = {
    'pending': ['running', 'cancelled'],
    'running': ['completed', 'failed', 'paused', 'cancelled'],
    'paused': ['running', 'cancelled'],
    'failed': ['pending'],  # For retry
    'completed': [],  # Terminal state
    'cancelled': []  # Terminal state
}
```

### State Machine
```python
class WorkflowStateMachine:
    """Workflow state machine."""
    
    def __init__(self, workflow: Workflow):
        """Initialize state machine."""
        self.workflow = workflow
        self.current_state = workflow.state
    
    def transition_to(self, new_state: str):
        """
        Transition to new state.
        
        Args:
            new_state: New state to transition to
        
        Raises:
            InvalidStateTransition: If transition is invalid
        """
        valid_transitions = WORKFLOW_STATE_TRANSITIONS[self.current_state]
        
        if new_state not in valid_transitions:
            raise InvalidStateTransition(
                f"Cannot transition from {self.current_state} to {new_state}"
            )
        
        self.current_state = new_state
        self.workflow.state = new_state
```

---

## Workflow Execution

### Execution Process
```python
def execute_workflow(workflow: Workflow) -> Workflow:
    """
    Execute workflow.
    
    Args:
        workflow: Workflow to execute
    
    Returns:
        Executed workflow
    
    Guarantee:
        Same workflow → same execution → same witness
    """
    # Validate workflow definition
    validate_workflow_definition(workflow)
    
    # Update state to running
    workflow.state = 'running'
    
    try:
        # Execute tasks in dependency order
        executed_tasks = execute_workflow_tasks(workflow)
        
        # Update state to completed
        workflow.state = 'completed'
        workflow.completed_at = datetime.utcnow()
        
        # Generate witness
        workflow.witness = generate_workflow_witness(workflow, executed_tasks)
        
    except Exception as e:
        # Update state to failed
        workflow.state = 'failed'
        workflow.completed_at = datetime.utcnow()
        
        # Generate failure witness
        workflow.witness = generate_workflow_failure_witness(workflow, e)
    
    return workflow
```

### Task Execution Order
```python
def execute_workflow_tasks(workflow: Workflow) -> List[Task]:
    """
    Execute workflow tasks in dependency order.
    
    Args:
        workflow: Workflow to execute
    
    Returns:
        List of executed tasks
    """
    # Build dependency graph
    dependency_graph = build_dependency_graph(workflow)
    
    # Get topological order
    task_order = topological_sort(dependency_graph)
    
    # Execute tasks in order
    executed_tasks = []
    for task_id in task_order:
        task_definition = get_task_definition(workflow, task_id)
        task = create_task(task_definition, workflow.workflow_id)
        task = execute_task(task)
        executed_tasks.append(task)
        
        # Check if task failed
        if task.state == 'failed':
            raise Exception(f"Task {task_id} failed")
    
    return executed_tasks
```

### Dependency Resolution
```python
def build_dependency_graph(workflow: Workflow) -> Dict[str, List[str]]:
    """
    Build dependency graph from workflow definition.
    
    Args:
        workflow: Workflow to build graph from
    
    Returns:
        Dependency graph
    """
    graph = {}
    
    for task in workflow.workflow_definition['tasks']:
        task_id = task['task_id']
        dependencies = task.get('dependencies', [])
        graph[task_id] = dependencies
    
    return graph

def topological_sort(graph: Dict[str, List[str]]) -> List[str]:
    """
    Perform topological sort on dependency graph.
    
    Args:
        graph: Dependency graph
    
    Returns:
        Topologically ordered task IDs
    """
    # Kahn's algorithm
    in_degree = {node: 0 for node in graph}
    
    for node in graph:
        for neighbor in graph[node]:
            in_degree[neighbor] += 1
    
    queue = [node for node in in_degree if in_degree[node] == 0]
    result = []
    
    while queue:
        node = queue.pop(0)
        result.append(node)
        
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    
    if len(result) != len(graph):
        raise Exception("Cycle detected in dependency graph")
    
    return result
```

---

## Workflow Replay

### Replay Process
```python
def replay_workflow(workflow: Workflow) -> Workflow:
    """
    Replay workflow.
    
    Args:
        workflow: Workflow to replay
    
    Returns:
        Replayed workflow
    
    Guarantee:
        Same workflow → same execution → same witness
    """
    # Reset workflow state
    workflow.state = 'pending'
    workflow.completed_at = None
    workflow.witness = None
    
    # Execute workflow
    executed_workflow = execute_workflow(workflow)
    
    # Verify replay correctness
    verify_workflow_replay(workflow, executed_workflow)
    
    return executed_workflow
```

### Replay Verification
```python
def verify_workflow_replay(original_workflow: Workflow, replayed_workflow: Workflow):
    """
    Verify workflow replay correctness.
    
    Args:
        original_workflow: Original workflow
        replayed_workflow: Replayed workflow
    
    Raises:
        ReplayVerificationError: If replay is incorrect
    """
    # Compare workflow states
    if original_workflow.state != replayed_workflow.state:
        raise ReplayVerificationError("Workflow state mismatch")
    
    # Compare workflow witnesses
    if original_workflow.witness != replayed_workflow.witness:
        raise ReplayVerificationError("Workflow witness mismatch")
```

---

## Workflow Recovery

### Recovery Process
```python
def recover_workflow(workflow: Workflow) -> Workflow:
    """
    Recover workflow from failure.
    
    Args:
        workflow: Workflow to recover
    
    Returns:
        Recovered workflow
    """
    # Identify failed tasks
    failed_tasks = identify_failed_tasks(workflow)
    
    # Reset failed tasks
    for task in failed_tasks:
        reset_task(task)
    
    # Resume workflow execution
    return execute_workflow(workflow)
```

### Failed Task Identification
```python
def identify_failed_tasks(workflow: Workflow) -> List[Task]:
    """
    Identify failed tasks in workflow.
    
    Args:
        workflow: Workflow to check
    
    Returns:
        List of failed tasks
    """
    failed_tasks = []
    
    for task in get_workflow_tasks(workflow.workflow_id):
        if task.state == 'failed':
            failed_tasks.append(task)
    
    return failed_tasks
```

---

## Workflow Versioning

### Version Management
```python
class WorkflowVersion:
    """Workflow version."""
    
    def __init__(
        self,
        version: str,
        workflow_definition: WorkflowDefinition,
        created_at: datetime
    ):
        self.version = version
        self.workflow_definition = workflow_definition
        self.created_at = created_at
```

### Version Migration
```python
def migrate_workflow_version(workflow: Workflow, target_version: str) -> Workflow:
    """
    Migrate workflow to new version.
    
    Args:
        workflow: Workflow to migrate
        target_version: Target version
    
    Returns:
        Migrated workflow
    """
    # Get target version definition
    target_definition = get_workflow_version_definition(target_version)
    
    # Update workflow definition
    workflow.workflow_definition = target_definition
    workflow.version = target_version
    
    return workflow
```

---

## Workflow Witness Generation

### Witness Components
```python
def generate_workflow_witness(workflow: Workflow, executed_tasks: List[Task]) -> Witness:
    """
    Generate workflow execution witness.
    
    Args:
        workflow: Workflow that was executed
        executed_tasks: Tasks that were executed
    
    Returns:
        Workflow witness
    """
    witness = Witness(
        witness_id=uuid4(),
        execution_id=workflow.workflow_id,
        state_hash=compute_workflow_state_hash(workflow),
        event_hashes=[task.witness for task in executed_tasks],
        timestamp=datetime.utcnow()
    )
    
    # Add workflow-specific data
    witness.workflow_id = workflow.workflow_id
    witness.workflow_type = workflow.workflow_type
    witness.workflow_version = workflow.version
    witness.task_ids = [task.task_id for task in executed_tasks]
    witness.task_states = [task.state for task in executed_tasks]
    
    return witness
```

---

## Workflow Engine Best Practices

### 1. Deterministic Execution
- All workflows deterministic
- All workflows replayable
- All workflows verifiable
- Same workflow → same execution

### 2. Dependency Management
- Clear task dependencies
- Topological ordering
- Cycle detection
- Dependency validation

### 3. State Management
- Clear state transitions
- State machine enforcement
- State persistence
- State recovery

### 4. Version Management
- Workflow versioning
- Version migration
- Backward compatibility
- Forward compatibility

### 5. Verification
- Verify workflow execution
- Verify workflow replay
- Verify workflow witnesses
- Verify workflow recovery
