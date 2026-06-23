# Permission Model

**Phase 9:** Design runtime authorization

---

## Overview

Permission Model provides runtime authorization for the kernel. Includes users, roles, capabilities, execution permissions, object permissions, workflow permissions, and replay permissions. Permissions must be event sourced.

---

## Permission Architecture

### Permission Flow
```
User
    ↓
Roles
    ↓
Capabilities
    ↓
Execution Permissions
    ↓
Object Permissions
    ↓
Workflow Permissions
    ↓
Replay Permissions
```

---

## User Model

### User Structure
```python
class User:
    """User model."""
    
    def __init__(
        self,
        user_id: UUID,
        username: str,
        email: str,
        created_at: datetime
    ):
        self.user_id = user_id
        self.username = username
        self.email = email
        self.created_at = created_at
        self.roles = []
```

### User Creation
```python
def create_user(username: str, email: str) -> User:
    """
    Create user.
    
    Args:
        username: Username
        email: Email
    
    Returns:
        Created user
    """
    user = User(
        user_id=uuid4(),
        username=username,
        email=email,
        created_at=datetime.utcnow()
    )
    
    # Emit user created event
    emit_user_created_event(user)
    
    # Store user
    store_user(user)
    
    return user
```

---

## Role Model

### Role Structure
```python
class Role:
    """Role model."""
    
    def __init__(
        self,
        role_id: UUID,
        role_name: str,
        role_description: str,
        capabilities: List[str]
    ):
        self.role_id = role_id
        self.role_name = role_name
        self.role_description = role_description
        self.capabilities = capabilities
```

### Role Definition
```python
ROLES = {
    'admin': {
        'capabilities': ['*'],
        'description': 'Full system access'
    },
    'user': {
        'capabilities': ['read_artifacts', 'create_artifacts', 'execute_workflows'],
        'description': 'Standard user access'
    },
    'viewer': {
        'capabilities': ['read_artifacts'],
        'description': 'Read-only access'
    }
}
```

### Role Assignment
```python
def assign_role(user_id: UUID, role_name: str):
    """
    Assign role to user.
    
    Args:
        user_id: User ID
        role_name: Role name
    """
    # Get role
    role = get_role(role_name)
    
    # Assign role to user
    user = get_user(user_id)
    user.roles.append(role.role_id)
    
    # Emit role assigned event
    emit_role_assigned_event(user_id, role.role_id)
    
    # Update user
    update_user(user)
```

---

## Capability Model

### Capability Definition
```python
CAPABILITIES = {
    'read_artifacts': 'Read artifacts',
    'create_artifacts': 'Create artifacts',
    'update_artifacts': 'Update artifacts',
    'delete_artifacts': 'Delete artifacts',
    'execute_workflows': 'Execute workflows',
    'create_workflows': 'Create workflows',
    'read_workflows': 'Read workflows',
    'delete_workflows': 'Delete workflows',
    'replay_events': 'Replay events',
    'replay_workflows': 'Replay workflows',
    'admin_users': 'Manage users',
    'admin_roles': 'Manage roles',
    '*': 'All capabilities'
}
```

### Capability Check
```python
def has_capability(user_id: UUID, capability: str) -> bool:
    """
    Check if user has capability.
    
    Args:
        user_id: User ID
        capability: Capability to check
    
    Returns:
        True if user has capability
    """
    # Get user
    user = get_user(user_id)
    
    # Get user roles
    roles = [get_role(role_id) for role_id in user.roles]
    
    # Check if any role has capability
    for role in roles:
        if '*' in role.capabilities:
            return True
        if capability in role.capabilities:
            return True
    
    return False
```

---

## Execution Permissions

### Permission Check
```python
def check_execution_permission(user_id: UUID, command: Command) -> bool:
    """
    Check execution permission for command.
    
    Args:
        user_id: User ID
        command: Command to check
    
    Returns:
        True if user has permission
    """
    # Get required capability for command type
    required_capability = get_required_capability(command.command_type)
    
    # Check if user has capability
    return has_capability(user_id, required_capability)
```

### Capability Mapping
```python
COMMAND_CAPABILITIES = {
    'CREATE_ARTIFACT': 'create_artifacts',
    'UPDATE_ARTIFACT': 'update_artifacts',
    'DELETE_ARTIFACT': 'delete_artifacts',
    'CREATE_WORKFLOW': 'create_workflows',
    'EXECUTE_WORKFLOW': 'execute_workflows',
    'DELETE_WORKFLOW': 'delete_workflows',
    'REPLAY_EVENTS': 'replay_events',
    'REPLAY_WORKFLOWS': 'replay_workflows'
}
```

---

## Object Permissions

### Object Permission Structure
```python
class ObjectPermission:
    """Object permission."""
    
    def __init__(
        self,
        permission_id: UUID,
        user_id: UUID,
        artifact_id: UUID,
        permission_type: str  # read, write, admin
    ):
        self.permission_id = permission_id
        self.user_id = user_id
        self.artifact_id = artifact_id
        self.permission_type = permission_type
```

### Object Permission Grant
```python
def grant_object_permission(
    user_id: UUID,
    artifact_id: UUID,
    permission_type: str
):
    """
    Grant object permission.
    
    Args:
        user_id: User ID
        artifact_id: Artifact ID
        permission_type: Permission type
    """
    permission = ObjectPermission(
        permission_id=uuid4(),
        user_id=user_id,
        artifact_id=artifact_id,
        permission_type=permission_type
    )
    
    # Emit permission granted event
    emit_permission_granted_event(permission)
    
    # Store permission
    store_permission(permission)
```

### Object Permission Check
```python
def check_object_permission(
    user_id: UUID,
    artifact_id: UUID,
    permission_type: str
) -> bool:
    """
    Check object permission.
    
    Args:
        user_id: User ID
        artifact_id: Artifact ID
        permission_type: Permission type
    
    Returns:
        True if user has permission
    """
    # Check if user has admin capability
    if has_capability(user_id, 'admin_users'):
        return True
    
    # Check object-specific permission
    permission = get_object_permission(user_id, artifact_id, permission_type)
    
    return permission is not None
```

---

## Workflow Permissions

### Workflow Permission Structure
```python
class WorkflowPermission:
    """Workflow permission."""
    
    def __init__(
        self,
        permission_id: UUID,
        user_id: UUID,
        workflow_id: UUID,
        permission_type: str  # read, write, execute, admin
    ):
        self.permission_id = permission_id
        self.user_id = user_id
        self.workflow_id = workflow_id
        self.permission_type = permission_type
```

### Workflow Permission Grant
```python
def grant_workflow_permission(
    user_id: UUID,
    workflow_id: UUID,
    permission_type: str
):
    """
    Grant workflow permission.
    
    Args:
        user_id: User ID
        workflow_id: Workflow ID
        permission_type: Permission type
    """
    permission = WorkflowPermission(
        permission_id=uuid4(),
        user_id=user_id,
        workflow_id=workflow_id,
        permission_type=permission_type
    )
    
    # Emit permission granted event
    emit_permission_granted_event(permission)
    
    # Store permission
    store_permission(permission)
```

### Workflow Permission Check
```python
def check_workflow_permission(
    user_id: UUID,
    workflow_id: UUID,
    permission_type: str
) -> bool:
    """
    Check workflow permission.
    
    Args:
        user_id: User ID
        workflow_id: Workflow ID
        permission_type: Permission type
    
    Returns:
        True if user has permission
    """
    # Check if user has admin capability
    if has_capability(user_id, 'admin_users'):
        return True
    
    # Check workflow-specific permission
    permission = get_workflow_permission(user_id, workflow_id, permission_type)
    
    return permission is not None
```

---

## Replay Permissions

### Replay Permission Check
```python
def check_replay_permission(user_id: UUID) -> bool:
    """
    Check replay permission.
    
    Args:
        user_id: User ID
    
    Returns:
        True if user has replay permission
    """
    return has_capability(user_id, 'replay_events')
```

---

## Event Sourcing

### Permission Events
```python
def emit_permission_granted_event(permission):
    """
    Emit permission granted event.
    
    Args:
        permission: Permission that was granted
    """
    event = Event(
        event_id=uuid4(),
        event_type='PERMISSION_GRANTED',
        event_data={
            'permission_id': str(permission.permission_id),
            'user_id': str(permission.user_id),
            'resource_type': 'artifact' if isinstance(permission, ObjectPermission) else 'workflow',
            'resource_id': str(permission.artifact_id if isinstance(permission, ObjectPermission) else permission.workflow_id),
            'permission_type': permission.permission_type
        },
        aggregate_id=permission.permission_id,
        causation_id=None,
        correlation_id=None,
        timestamp=datetime.utcnow()
    )
    
    # Emit event
    emit_event(event)
```

### Permission Replay
```python
def replay_permissions(events: List[Event]) -> Dict:
    """
    Replay permissions from events.
    
    Args:
        events: Permission events
    
    Returns:
        Permission state
    """
    state = initialize_permission_state()
    
    for event in events:
        state = apply_permission_event(state, event)
    
    return state
```

---

## Permission Model Best Practices

### 1. Event Sourcing
- All permissions event sourced
- All permissions replayable
- All permissions verifiable
- All permissions auditable

### 2. Role-Based Access
- Role-based access control
- Capability-based permissions
- Hierarchical roles
- Role inheritance

### 3. Object-Level Permissions
- Object-specific permissions
- Fine-grained control
- Permission inheritance
- Permission propagation

### 4. Workflow Permissions
- Workflow-specific permissions
- Execution permissions
- Read permissions
- Admin permissions

### 5. Verification
- Verify permission grants
- Verify permission checks
- Verify permission replay
- Verify permission consistency
