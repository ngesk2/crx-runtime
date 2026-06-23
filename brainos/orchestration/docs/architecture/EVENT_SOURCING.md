# Event Sourcing Architecture

**Layer:** 1 — Event Log
**Status:** CONSTITUTIONAL TRUTH
**Purpose:** Record all state changes as immutable, append-only events

---

## Overview

The event log is the second constitutional layer. All state changes are recorded as immutable events. The event log is the single source of truth for system state. Current state is always reconstructable from event history.

---

## Design Principles

### 1. Append-Only
- Events are only appended
- Events are never modified
- Events are never deleted
- Ordered by timestamp

### 2. Immutable
- Events are immutable after creation
- No updates to existing events
- No deletions of existing events
- Corrections through new events

### 3. Reconstructable
- State derived from event log
- Complete state rebuild possible
- Temporal queries supported
- Event replay capability

### 4. Ordered
- Events ordered by timestamp
- Causality preserved
- Event sequencing
- Conflict resolution

---

## Event Structure

### Event Schema
```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "event_type": "OBJECT_CREATED",
  "timestamp": "2026-06-14T18:00:00Z",
  "aggregate_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "aggregate_type": "object",
  "event_data": {},
  "causation_id": "550e8400-e29b-41d4-a716-446655440000",
  "correlation_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "metadata": {}
}
```

### Field Definitions

| Field | Type | Description |
|-------|------|-------------|
| event_id | UUID v4 | Unique event identifier |
| event_type | string | Type of event |
| timestamp | ISO 8601 | Event timestamp |
| aggregate_id | UUID v4 | Aggregate identifier |
| aggregate_type | string | Aggregate type |
| event_data | JSON | Event-specific data |
| causation_id | UUID v4 | Causation chain |
| correlation_id | UUID v4 | Correlation identifier |
| metadata | JSON | Event metadata |

---

## Event Types

### Core Events

#### OBJECT_CREATED
```json
{
  "event_type": "OBJECT_CREATED",
  "event_data": {
    "object_id": "UUID",
    "content_hash": "SHA256",
    "content_type": "MIME type",
    "content_size": 1024,
    "metadata": {}
  }
}
```

#### OBJECT_UPDATED
```json
{
  "event_type": "OBJECT_UPDATED",
  "event_data": {
    "object_id": "UUID",
    "content_hash": "SHA256",
    "content_type": "MIME type",
    "content_size": 1024,
    "metadata": {}
  }
}
```

#### OBJECT_VERSIONED
```json
{
  "event_type": "OBJECT_VERSIONED",
  "event_data": {
    "object_id": "UUID",
    "previous_version": 1,
    "new_version": 2,
    "content_hash": "SHA256",
    "lineage_id": "UUID"
  }
}
```

#### FILE_INGESTED
```json
{
  "event_type": "FILE_INGESTED",
  "event_data": {
    "file_id": "UUID",
    "filename": "document.pdf",
    "content_hash": "SHA256",
    "content_size": 1024,
    "source": "upload"
  }
}
```

#### ENTITY_CREATED
```json
{
  "event_type": "ENTITY_CREATED",
  "event_data": {
    "entity_id": "UUID",
    "entity_type": "person",
    "attributes": {}
  }
}
```

#### RELATIONSHIP_CREATED
```json
{
  "event_type": "RELATIONSHIP_CREATED",
  "event_data": {
    "relationship_id": "UUID",
    "source_id": "UUID",
    "target_id": "UUID",
    "relationship_type": "knows",
    "attributes": {}
  }
}
```

#### PROJECTION_REBUILT
```json
{
  "event_type": "PROJECTION_REBUILT",
  "event_data": {
    "projection_type": "vector",
    "projection_id": "UUID",
    "event_range": {
      "from": "UUID",
      "to": "UUID"
    }
  }
}
```

#### SYSTEM_EVENT
```json
{
  "event_type": "SYSTEM_EVENT",
  "event_data": {
    "event_category": "backup",
    "event_message": "Backup completed",
    "event_severity": "info"
  }
}
```

---

## Event Storage

### Storage Format
- Append-only log files
- JSON Lines format
- One event per line
- Compressed archives

### File Structure
```
events/
  2026/
    06/
      14/
        events-2026-06-14-000000.log.gz
        events-2026-06-14-000001.log.gz
```

### Rotation Policy
- Daily rotation
- Size-based rotation (1GB)
- Compression after rotation
- Retention policy

---

## Event Ordering

### Timestamp Ordering
- Events ordered by timestamp
- ISO 8601 format
- UTC timezone
- Millisecond precision

### Sequence Numbers
- Per-aggregate sequence
- Monotonically increasing
- Gap detection
- Ordering verification

### Causality
- Causation_id chain
- Correlation_id grouping
- Event ordering verification
- Conflict detection

---

## Event Replay

### Replay Algorithm
```python
def replay_events(aggregate_id: UUID, from_event: UUID = None):
    """
    Replay events to reconstruct state.
    
    Args:
        aggregate_id: Aggregate identifier
        from_event: Starting event (optional)
    
    Returns:
        Current state
    """
    events = load_events(aggregate_id, from_event)
    state = initialize_state()
    
    for event in events:
        state = apply_event(state, event)
    
    return state
```

### Event Application
```python
def apply_event(state: dict, event: dict) -> dict:
    """
    Apply event to state.
    
    Args:
        state: Current state
        event: Event to apply
    
    Returns:
        Updated state
    """
    event_type = event['event_type']
    handler = EVENT_HANDLERS[event_type]
    return handler(state, event)
```

---

## Event Handlers

### Handler Registry
```python
EVENT_HANDLERS = {
    'OBJECT_CREATED': handle_object_created,
    'OBJECT_UPDATED': handle_object_updated,
    'OBJECT_VERSIONED': handle_object_versioned,
    'FILE_INGESTED': handle_file_ingested,
    'ENTITY_CREATED': handle_entity_created,
    'RELATIONSHIP_CREATED': handle_relationship_created,
    'PROJECTION_REBUILT': handle_projection_rebuilt,
    'SYSTEM_EVENT': handle_system_event
}
```

### Handler Implementation
```python
def handle_object_created(state: dict, event: dict) -> dict:
    """Handle OBJECT_CREATED event."""
    event_data = event['event_data']
    object_id = event_data['object_id']
    
    state['objects'][object_id] = {
        'object_id': object_id,
        'content_hash': event_data['content_hash'],
        'content_type': event_data['content_type'],
        'content_size': event_data['content_size'],
        'metadata': event_data['metadata'],
        'created_at': event['timestamp'],
        'version': 1
    }
    
    return state
```

---

## Event Queries

### Temporal Queries
```python
def get_state_at_time(aggregate_id: UUID, timestamp: datetime):
    """
    Get state at specific timestamp.
    
    Args:
        aggregate_id: Aggregate identifier
        timestamp: Target timestamp
    
    Returns:
        State at timestamp
    """
    events = load_events_before(aggregate_id, timestamp)
    state = initialize_state()
    
    for event in events:
        state = apply_event(state, event)
    
    return state
```

### Event Range Queries
```python
def get_events_in_range(from_event: UUID, to_event: UUID):
    """
    Get events in range.
    
    Args:
        from_event: Starting event
        to_event: Ending event
    
    Returns:
        List of events
    """
    return load_events_between(from_event, to_event)
```

### Aggregate Queries
```python
def get_aggregate_events(aggregate_id: UUID):
    """
    Get all events for aggregate.
    
    Args:
        aggregate_id: Aggregate identifier
    
    Returns:
        List of events
    """
    return load_events_by_aggregate(aggregate_id)
```

---

## Event Validation

### Schema Validation
- Event schema validation
- Event type validation
- Required field validation
- Data type validation

### Business Validation
- Business rule validation
- State transition validation
- Constraint validation
- Conflict detection

### Causality Validation
- Causation chain validation
- Correlation validation
- Ordering validation
- Cycle detection

---

## Event Compression

### Compression Strategy
- Gzip compression
- After rotation
- Transparent decompression
- Compression ratio tracking

### Compression Benefits
- Reduced storage
- Faster transfer
- Lower bandwidth
- Cost savings

---

## Event Retention

### Retention Policy
- Hot retention: 7 days
- Warm retention: 90 days
- Cold retention: 7 years
- Archive retention: permanent

### Archival Strategy
- Move to cold storage
- Compress archives
- Encrypt archives
- Verify integrity

---

## Event Backup

### Backup Strategy
- Incremental backups
- Full backups weekly
- Backup verification
- Restore testing

### Backup Format
- Event log archives
- Metadata snapshots
- Checksum files
- Manifest files

---

## Event Security

### Encryption at Rest
- AES-256 encryption
- Per-archive keys
- Key rotation
- HSM compatibility

### Encryption in Transit
- TLS 1.3
- Certificate pinning
- Mutual TLS
- Secure protocols

### Access Control
- Read/write permissions
- Role-based access
- Audit logging
- IP restrictions

---

## Event Monitoring

### Metrics
- Event rate
- Event latency
- Event size
- Error rates
- Replay time

### Alerts
- Event rate anomalies
- Replay failures
- Corruption detection
- Storage capacity

---

## Event API

### Emit Event
```http
POST /events
Content-Type: application/json

{
  "event_type": "OBJECT_CREATED",
  "aggregate_id": "UUID",
  "aggregate_type": "object",
  "event_data": {}
}

Response:
{
  "event_id": "UUID",
  "timestamp": "ISO 8601"
}
```

### Get Events
```http
GET /events?aggregate_id={aggregate_id}

Response:
{
  "events": [
    {
      "event_id": "UUID",
      "event_type": "OBJECT_CREATED",
      "timestamp": "ISO 8601",
      "event_data": {}
    }
  ]
}
```

### Replay Events
```http
POST /events/replay
Content-Type: application/json

{
  "aggregate_id": "UUID",
  "from_event": "UUID"
}

Response:
{
  "state": {},
  "events_replayed": 10
}
```

---

## Implementation Notes

### Filesystem Backend
- Default for laptop deployment
- Simple implementation
- No external dependencies
- Direct file access

### Kafka Backend
- Distributed event log
- High throughput
- Durability guarantees
- Consumer groups

### Hybrid Backend
- Hot tier: Kafka
- Warm tier: Filesystem
- Cold tier: S3
- Unified interface

---

## Future Considerations

### Event Schemas
- Avro schema evolution
- Protocol Buffers
- Schema registry
- Backward compatibility

### Event Versioning
- Schema versioning
- Migration procedures
- Compatibility checks
- Deprecation policy

### Event Routing
- Event filtering
- Event routing
- Event transformation
- Event enrichment
