# Kernel API Contract

**Phase 10:** Define APIs future layers consume

---

## Overview

Kernel API Contract defines the APIs that future layers will consume. Required APIs: POST /commands, POST /tasks, POST /workflows, GET /state, GET /artifacts, GET /lineage, GET /witnesses, POST /replay. Everything else remains internal.

---

## API Endpoints

### POST /commands
**Purpose:** Submit commands for execution

**Request:**
```http
POST /commands
Content-Type: application/json

{
  "command_type": "CREATE_ARTIFACT",
  "command_data": {
    "artifact_type": "document",
    "title": "Document Title",
    "content": "Document content"
  },
  "user_id": "UUID"
}
```

**Response:**
```http
201 Created
Content-Type: application/json

{
  "command_id": "UUID",
  "status": "submitted",
  "timestamp": "ISO 8601"
}
```

### POST /tasks
**Purpose:** Create and schedule tasks

**Request:**
```http
POST /tasks
Content-Type: application/json

{
  "task_type": "PROCESS_ARTIFACT",
  "task_data": {
    "artifact_id": "UUID",
    "processor": "extractor"
  },
  "workflow_id": "UUID"
}
```

**Response:**
```http
201 Created
Content-Type: application/json

{
  "task_id": "UUID",
  "status": "pending",
  "created_at": "ISO 8601"
}
```

### POST /workflows
**Purpose:** Create and execute workflows

**Request:**
```http
POST /workflows
Content-Type: application/json

{
  "workflow_type": "DOCUMENT_PROCESSING",
  "workflow_definition": {
    "tasks": [
      {
        "task_id": "extract",
        "task_type": "EXTRACT_ENTITIES",
        "task_data": {},
        "dependencies": []
      },
      {
        "task_id": "index",
        "task_type": "INDEX_DOCUMENT",
        "task_data": {},
        "dependencies": ["extract"]
      }
    ]
  },
  "user_id": "UUID"
}
```

**Response:**
```http
201 Created
Content-Type: application/json

{
  "workflow_id": "UUID",
  "status": "pending",
  "created_at": "ISO 8601"
}
```

### GET /state
**Purpose:** Get current system state

**Request:**
```http
GET /state
```

**Response:**
```http
200 OK
Content-Type: application/json

{
  "state_hash": "SHA256",
  "object_count": 100,
  "event_count": 1000,
  "task_count": 10,
  "workflow_count": 5,
  "timestamp": "ISO 8601"
}
```

### GET /artifacts
**Purpose:** Get artifacts

**Request:**
```http
GET /artifacts?artifact_type=document&limit=10
```

**Response:**
```http
200 OK
Content-Type: application/json

{
  "artifacts": [
    {
      "artifact_id": "UUID",
      "artifact_type": "document",
      "content_hash": "SHA256",
      "lineage_id": "UUID",
      "created_at": "ISO 8601"
    }
  ],
  "total": 100,
  "limit": 10
}
```

### GET /lineage
**Purpose:** Get lineage information

**Request:**
```http
GET /lineage?lineage_id=UUID
```

**Response:**
```http
200 OK
Content-Type: application/json

{
  "lineage_id": "UUID",
  "root_artifact_id": "UUID",
  "artifact_chain": ["UUID", "UUID", "UUID"],
  "processor_chain": [
    {
      "processor_name": "extractor",
      "processor_version": "v1"
    }
  ]
}
```

### GET /witnesses
**Purpose:** Get execution witnesses

**Request:**
```http
GET /witnesses?execution_id=UUID
```

**Response:**
```http
200 OK
Content-Type: application/json

{
  "witnesses": [
    {
      "witness_id": "UUID",
      "execution_id": "UUID",
      "state_hash": "SHA256",
      "event_hashes": ["SHA256", "SHA256"],
      "timestamp": "ISO 8601"
    }
  ]
}
```

### POST /replay
**Purpose:** Replay events or workflows

**Request:**
```http
POST /replay
Content-Type: application/json

{
  "replay_type": "events",
  "from_event_id": "UUID",
  "to_event_id": "UUID"
}
```

**Response:**
```http
200 OK
Content-Type: application/json

{
  "replay_id": "UUID",
  "status": "completed",
  "events_replayed": 100,
  "state_hash": "SHA256",
  "timestamp": "ISO 8601"
}
```

---

## API Implementation

### Command Submission
```python
@app.post('/commands')
def submit_command(request: Dict) -> Dict:
    """
    Submit command for execution.
    
    Args:
        request: Command request
    
    Returns:
        Command response
    """
    # Create command
    command = Command(
        command_id=uuid4(),
        command_type=request['command_type'],
        command_data=request['command_data'],
        user_id=UUID(request['user_id']),
        timestamp=datetime.utcnow()
    )
    
    # Submit command
    command_bus.submit_command(command)
    
    return {
        'command_id': str(command.command_id),
        'status': 'submitted',
        'timestamp': command.timestamp.isoformat()
    }
```

### Task Creation
```python
@app.post('/tasks')
def create_task(request: Dict) -> Dict:
    """
    Create and schedule task.
    
    Args:
        request: Task request
    
    Returns:
        Task response
    """
    # Create task definition
    task_definition = TaskDefinition(
        task_type=request['task_type'],
        task_data=request['task_data']
    )
    
    # Create task
    task = create_task(task_definition, UUID(request.get('workflow_id')))
    
    # Schedule task
    task_scheduler.schedule_task(task)
    
    return {
        'task_id': str(task.task_id),
        'status': task.state,
        'created_at': task.created_at.isoformat()
    }
```

### Workflow Creation
```python
@app.post('/workflows')
def create_workflow(request: Dict) -> Dict:
    """
    Create and execute workflow.
    
    Args:
        request: Workflow request
    
    Returns:
        Workflow response
    """
    # Create workflow definition
    workflow_definition = WorkflowDefinition(
        workflow_type=request['workflow_type'],
        workflow_name=request['workflow_type'],
        tasks=request['workflow_definition']['tasks'],
        dependencies=request['workflow_definition'].get('dependencies')
    )
    
    # Create workflow
    workflow = Workflow(
        workflow_id=uuid4(),
        workflow_type=request['workflow_type'],
        workflow_definition=workflow_definition,
        state='pending',
        version='1.0',
        created_at=datetime.utcnow()
    )
    
    # Store workflow
    store_workflow(workflow)
    
    # Execute workflow
    workflow = execute_workflow(workflow)
    
    return {
        'workflow_id': str(workflow.workflow_id),
        'status': workflow.state,
        'created_at': workflow.created_at.isoformat()
    }
```

### State Query
```python
@app.get('/state')
def get_state() -> Dict:
    """
    Get current system state.
    
    Returns:
        State response
    """
    state = get_current_state()
    
    return {
        'state_hash': state.compute_hash(hash_authority),
        'object_count': len(state.objects),
        'event_count': len(state.events),
        'task_count': len(state.tasks),
        'workflow_count': len(state.workflows),
        'timestamp': datetime.utcnow().isoformat()
    }
```

### Artifact Query
```python
@app.get('/artifacts')
def get_artifacts(artifact_type: str = None, limit: int = 10) -> Dict:
    """
    Get artifacts.
    
    Args:
        artifact_type: Artifact type filter (optional)
        limit: Result limit (optional)
    
    Returns:
        Artifacts response
    """
    # Query artifacts
    artifacts = query_artifacts(artifact_type, limit)
    
    return {
        'artifacts': [
            {
                'artifact_id': str(a.artifact_id),
                'artifact_type': a.artifact_type,
                'content_hash': a.content_hash,
                'lineage_id': str(a.lineage_id),
                'created_at': a.created_at.isoformat()
            }
            for a in artifacts
        ],
        'total': count_artifacts(artifact_type),
        'limit': limit
    }
```

### Lineage Query
```python
@app.get('/lineage')
def get_lineage(lineage_id: UUID) -> Dict:
    """
    Get lineage information.
    
    Args:
        lineage_id: Lineage ID
    
    Returns:
        Lineage response
    """
    lineage = get_lineage(lineage_id)
    
    return {
        'lineage_id': str(lineage.lineage_id),
        'root_artifact_id': str(lineage.root_artifact_id),
        'artifact_chain': [str(aid) for aid in lineage.artifact_chain],
        'processor_chain': lineage.processor_chain
    }
```

### Witness Query
```python
@app.get('/witnesses')
def get_witnesses(execution_id: UUID = None) -> Dict:
    """
    Get execution witnesses.
    
    Args:
        execution_id: Execution ID (optional)
    
    Returns:
        Witnesses response
    """
    witnesses = query_witnesses(execution_id)
    
    return {
        'witnesses': [
            {
                'witness_id': str(w.witness_id),
                'execution_id': str(w.execution_id),
                'state_hash': w.state_hash,
                'event_hashes': w.event_hashes,
                'timestamp': w.timestamp.isoformat()
            }
            for w in witnesses
        ]
    }
```

### Replay Execution
```python
@app.post('/replay')
def replay(request: Dict) -> Dict:
    """
    Replay events or workflows.
    
    Args:
        request: Replay request
    
    Returns:
        Replay response
    """
    replay_type = request['replay_type']
    
    if replay_type == 'events':
        # Replay events
        from_event_id = UUID(request.get('from_event_id'))
        to_event_id = UUID(request.get('to_event_id'))
        
        events = get_events(from_event_id, to_event_id)
        state = replay_events(events)
        
    elif replay_type == 'workflow':
        # Replay workflow
        workflow_id = UUID(request['workflow_id'])
        
        workflow = get_workflow(workflow_id)
        workflow = replay_workflow(workflow)
        state = get_current_state()
    
    return {
        'replay_id': str(uuid4()),
        'status': 'completed',
        'events_replayed': len(events) if replay_type == 'events' else 0,
        'state_hash': state.compute_hash(hash_authority),
        'timestamp': datetime.utcnow().isoformat()
    }
```

---

## API Best Practices

### 1. Constitutional Truth Only
- APIs consume only constitutional truth
- APIs never consume projections
- APIs never consume external services
- Verify constitutional truth

### 2. Deterministic Responses
- API responses deterministic
- API responses reproducible
- API responses verifiable
- API responses auditable

### 3. Event Sourcing
- API operations emit events
- API operations event sourced
- API operations replayable
- API operations verifiable

### 4. Permission Enforcement
- All APIs enforce permissions
- All APIs check authorization
- All APIs audit access
- All APIs track usage

### 5. Error Handling
- Deterministic error handling
- Consistent error responses
- Error event emission
- Error witness generation
