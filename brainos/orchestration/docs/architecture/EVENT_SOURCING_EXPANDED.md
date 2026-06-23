# Event Sourcing Architecture (Expanded)

**Constitutional Law 9:** Expand event architecture with complete event schemas

---

## Expanded Event Types

### Core Object Events

#### OBJECT_CREATED
```json
{
  "event_id": "UUID",
  "event_type": "OBJECT_CREATED",
  "timestamp": "ISO 8601",
  "aggregate_id": "UUID",
  "aggregate_type": "object",
  "event_data": {
    "object_id": "UUID",
    "content_hash": "SHA256",
    "content_type": "MIME type",
    "content_size": 1024,
    "metadata": {}
  },
  "causation_id": "UUID",
  "correlation_id": "UUID"
}
```

#### OBJECT_VERSIONED
```json
{
  "event_id": "UUID",
  "event_type": "OBJECT_VERSIONED",
  "timestamp": "ISO 8601",
  "aggregate_id": "UUID",
  "aggregate_type": "object",
  "event_data": {
    "object_id": "UUID",
    "previous_version": 1,
    "new_version": 2,
    "content_hash": "SHA256",
    "lineage_id": "UUID",
    "reason": "content_update"
  },
  "causation_id": "UUID",
  "correlation_id": "UUID"
}
```

#### OBJECT_ARCHIVED
```json
{
  "event_id": "UUID",
  "event_type": "OBJECT_ARCHIVED",
  "timestamp": "ISO 8601",
  "aggregate_id": "UUID",
  "aggregate_type": "object",
  "event_data": {
    "object_id": "UUID",
    "archive_location": "s3://archive/",
    "archive_timestamp": "ISO 8601",
    "reason": "retention_policy"
  },
  "causation_id": "UUID",
  "correlation_id": "UUID"
}
```

### File Processing Events

#### FILE_DETECTED
```json
{
  "event_id": "UUID",
  "event_type": "FILE_DETECTED",
  "timestamp": "ISO 8601",
  "aggregate_id": "UUID",
  "aggregate_type": "file",
  "event_data": {
    "file_id": "UUID",
    "file_path": "/path/to/file.pdf",
    "file_size": 1024,
    "file_type": "pdf",
    "detected_at": "ISO 8601",
    "detection_source": "filesystem_watch"
  },
  "causation_id": "UUID",
  "correlation_id": "UUID"
}
```

#### FILE_CLASSIFIED
```json
{
  "event_id": "UUID",
  "event_type": "FILE_CLASSIFIED",
  "timestamp": "ISO 8601",
  "aggregate_id": "UUID",
  "aggregate_type": "file",
  "event_data": {
    "file_id": "UUID",
    "classification": "document",
    "confidence": 0.95,
    "classifier_version": "v1",
    "classification_timestamp": "ISO 8601"
  },
  "causation_id": "UUID",
  "correlation_id": "UUID"
}
```

#### METADATA_EXTRACTED
```json
{
  "event_id": "UUID",
  "event_type": "METADATA_EXTRACTED",
  "timestamp": "ISO 8601",
  "aggregate_id": "UUID",
  "aggregate_type": "document",
  "event_data": {
    "document_id": "UUID",
    "metadata": {
      "title": "Document Title",
      "author": "Author Name",
      "created_date": "ISO 8601",
      "modified_date": "ISO 8601",
      "page_count": 10,
      "word_count": 5000
    },
    "extractor_version": "tika-v1",
    "extraction_timestamp": "ISO 8601"
  },
  "causation_id": "UUID",
  "correlation_id": "UUID"
}
```

#### NORMALIZED
```json
{
  "event_id": "UUID",
  "event_type": "NORMALIZED",
  "timestamp": "ISO 8601",
  "aggregate_id": "UUID",
  "aggregate_type": "document",
  "event_data": {
    "document_id": "UUID",
    "normalized_document_id": "UUID",
    "normalization_rules": {
      "remove_whitespace": true,
      "normalize_unicode": true,
      "standardize_encoding": true
    },
    "normalizer_version": "v1",
    "normalization_timestamp": "ISO 8601"
  },
  "causation_id": "UUID",
  "correlation_id": "UUID"
}
```

#### CANONICALIZED
```json
{
  "event_id": "UUID",
  "event_type": "CANONICALIZED",
  "timestamp": "ISO 8601",
  "aggregate_id": "UUID",
  "aggregate_type": "document",
  "event_data": {
    "document_id": "UUID",
    "canonical_document_id": "UUID",
    "canonicalization_rules": {
      "standardize_format": true,
      "preserve_structure": true,
      "embed_metadata": true
    },
    "canonicalizer_version": "v1",
    "canonicalization_timestamp": "ISO 8601"
  },
  "causation_id": "UUID",
  "correlation_id": "UUID"
}
```

#### CHUNKED
```json
{
  "event_id": "UUID",
  "event_type": "CHUNKED",
  "timestamp": "ISO 8601",
  "aggregate_id": "UUID",
  "aggregate_type": "document",
  "event_data": {
    "document_id": "UUID",
    "chunk_strategy": "semantic",
    "chunk_size": 1000,
    "chunk_overlap": 200,
    "chunks_created": 10,
    "chunk_ids": ["UUID", "UUID", "..."],
    "chunker_version": "v3",
    "chunking_timestamp": "ISO 8601"
  },
  "causation_id": "UUID",
  "correlation_id": "UUID"
}
```

### Entity and Relationship Events

#### ENTITY_CREATED
```json
{
  "event_id": "UUID",
  "event_type": "ENTITY_CREATED",
  "timestamp": "ISO 8601",
  "aggregate_id": "UUID",
  "aggregate_type": "entity",
  "event_data": {
    "entity_id": "UUID",
    "entity_type": "person",
    "entity_name": "John Doe",
    "entity_attributes": {
      "age": 30,
      "location": "New York"
    },
    "source_chunk_id": "UUID",
    "confidence": 0.9,
    "extractor_version": "v7",
    "extraction_timestamp": "ISO 8601"
  },
  "causation_id": "UUID",
  "correlation_id": "UUID"
}
```

#### RELATIONSHIP_CREATED
```json
{
  "event_id": "UUID",
  "event_type": "RELATIONSHIP_CREATED",
  "timestamp": "ISO 8601",
  "aggregate_id": "UUID",
  "aggregate_type": "relationship",
  "event_data": {
    "relationship_id": "UUID",
    "source_entity_id": "UUID",
    "target_entity_id": "UUID",
    "relationship_type": "knows",
    "relationship_attributes": {
      "since": "2020-01-01",
      "context": "work"
    },
    "source_chunk_id": "UUID",
    "confidence": 0.85,
    "extractor_version": "v7",
    "extraction_timestamp": "ISO 8601"
  },
  "causation_id": "UUID",
  "correlation_id": "UUID"
}
```

### Processing Events

#### PROCESSING_COMPLETED
```json
{
  "event_id": "UUID",
  "event_type": "PROCESSING_COMPLETED",
  "timestamp": "ISO 8601",
  "aggregate_id": "UUID",
  "aggregate_type": "processing_run",
  "event_data": {
    "processing_run_id": "UUID",
    "processor_name": "chunker",
    "processor_version": "v3",
    "input_artifact_id": "UUID",
    "output_artifact_ids": ["UUID", "UUID", "..."],
    "processing_duration_ms": 1000,
    "success": true,
    "completion_timestamp": "ISO 8601"
  },
  "causation_id": "UUID",
  "correlation_id": "UUID"
}
```

#### PROCESSING_FAILED
```json
{
  "event_id": "UUID",
  "event_type": "PROCESSING_FAILED",
  "timestamp": "ISO 8601",
  "aggregate_id": "UUID",
  "aggregate_type": "processing_run",
  "event_data": {
    "processing_run_id": "UUID",
    "processor_name": "chunker",
    "processor_version": "v3",
    "input_artifact_id": "UUID",
    "error_message": "Chunk size too small",
    "error_code": "INVALID_CHUNK_SIZE",
    "error_stack_trace": "...",
    "failure_timestamp": "ISO 8601"
  },
  "causation_id": "UUID",
  "correlation_id": "UUID"
}
```

### Projection Events

#### PROJECTION_CREATED
```json
{
  "event_id": "UUID",
  "event_type": "PROJECTION_CREATED",
  "timestamp": "ISO 8601",
  "aggregate_id": "UUID",
  "aggregate_type": "projection",
  "event_data": {
    "projection_id": "UUID",
    "projection_type": "vector",
    "projection_name": "document_vectors",
    "source_aggregate_id": "UUID",
    "projection_configuration": {},
    "builder_version": "v1",
    "creation_timestamp": "ISO 8601"
  },
  "causation_id": "UUID",
  "correlation_id": "UUID"
}
```

#### PROJECTION_REBUILT
```json
{
  "event_id": "UUID",
  "event_type": "PROJECTION_REBUILT",
  "timestamp": "ISO 8601",
  "aggregate_id": "UUID",
  "aggregate_type": "projection",
  "event_data": {
    "projection_id": "UUID",
    "projection_type": "vector",
    "rebuild_reason": "schema_change",
    "event_range": {
      "from_event_id": "UUID",
      "to_event_id": "UUID"
    },
    "build_duration_ms": 5000,
    "records_processed": 1000,
    "rebuild_timestamp": "ISO 8601"
  },
  "causation_id": "UUID",
  "correlation_id": "UUID"
}
```

### Replay Events

#### REPLAY_STARTED
```json
{
  "event_id": "UUID",
  "event_type": "REPLAY_STARTED",
  "timestamp": "ISO 8601",
  "aggregate_id": "UUID",
  "aggregate_type": "replay_run",
  "event_data": {
    "replay_id": "UUID",
    "from_event_id": "UUID",
    "to_event_id": "UUID",
    "replay_mode": "full",
    "checkpoint": false,
    "start_timestamp": "ISO 8601"
  },
  "causation_id": "UUID",
  "correlation_id": "UUID"
}
```

#### REPLAY_COMPLETED
```json
{
  "event_id": "UUID",
  "event_type": "REPLAY_COMPLETED",
  "timestamp": "ISO 8601",
  "aggregate_id": "UUID",
  "aggregate_type": "replay_run",
  "event_data": {
    "replay_id": "UUID",
    "events_replayed": 1000,
    "replay_duration_ms": 10000,
    "state_restored": true,
    "projections_rebuilt": 5,
    "success": true,
    "completion_timestamp": "ISO 8601"
  },
  "causation_id": "UUID",
  "correlation_id": "UUID"
}
```

### System Events

#### SCHEMA_MIGRATED
```json
{
  "event_id": "UUID",
  "event_type": "SCHEMA_MIGRATED",
  "timestamp": "ISO 8601",
  "aggregate_id": "UUID",
  "aggregate_type": "schema",
  "event_data": {
    "schema_id": "UUID",
    "previous_version": "v1",
    "new_version": "v2",
    "migration_script": "migration_v1_to_v2.sql",
    "migration_duration_ms": 5000,
    "tables_affected": ["objects", "events"],
    "migration_timestamp": "ISO 8601"
  },
  "causation_id": "UUID",
  "correlation_id": "UUID"
}
```

#### BACKUP_CREATED
```json
{
  "event_id": "UUID",
  "event_type": "BACKUP_CREATED",
  "timestamp": "ISO 8601",
  "aggregate_id": "UUID",
  "aggregate_type": "backup",
  "event_data": {
    "backup_id": "UUID",
    "backup_type": "hot",
    "backup_location": "/storage/backups/",
    "backup_size_bytes": 1024000,
    "backup_checksum": "SHA256",
    "backup_duration_ms": 30000,
    "backup_timestamp": "ISO 8601"
  },
  "causation_id": "UUID",
  "correlation_id": "UUID"
}
```

#### RESTORE_COMPLETED
```json
{
  "event_id": "UUID",
  "event_type": "RESTORE_COMPLETED",
  "timestamp": "ISO 8601",
  "aggregate_id": "UUID",
  "aggregate_type": "restore",
  "event_data": {
    "restore_id": "UUID",
    "backup_id": "UUID",
    "restore_type": "full",
    "restore_location": "/storage/",
    "restore_duration_ms": 60000,
    "objects_restored": 1000,
    "events_restored": 5000,
    "restore_timestamp": "ISO 8601"
  },
  "causation_id": "UUID",
  "correlation_id": "UUID"
}
```

---

## Aggregate Boundaries

### Object Aggregate
- **Aggregate ID:** object_id
- **Events:** OBJECT_CREATED, OBJECT_VERSIONED, OBJECT_ARCHIVED
- **Invariant:** Content hash never changes for version

### File Aggregate
- **Aggregate ID:** file_id
- **Events:** FILE_DETECTED, FILE_CLASSIFIED
- **Invariant:** File path and size immutable

### Document Aggregate
- **Aggregate ID:** document_id
- **Events:** METADATA_EXTRACTED, NORMALIZED, CANONICALIZED, CHUNKED
- **Invariant:** Document content immutable after canonicalization

### Entity Aggregate
- **Aggregate ID:** entity_id
- **Events:** ENTITY_CREATED
- **Invariant:** Entity type immutable

### Relationship Aggregate
- **Aggregate ID:** relationship_id
- **Events:** RELATIONSHIP_CREATED
- **Invariant:** Relationship type immutable

### Processing Run Aggregate
- **Aggregate ID:** processing_run_id
- **Events:** PROCESSING_COMPLETED, PROCESSING_FAILED
- **Invariant:** Processing run immutable

### Projection Aggregate
- **Aggregate ID:** projection_id
- **Events:** PROJECTION_CREATED, PROJECTION_REBUILT
- **Invariant:** Projection type immutable

### Replay Run Aggregate
- **Aggregate ID:** replay_id
- **Events:** REPLAY_STARTED, REPLAY_COMPLETED
- **Invariant:** Replay mode immutable

---

## Event Replay Semantics

### Event Ordering
- Events ordered by timestamp
- Events within aggregate ordered by sequence
- Causality preserved through causation_id
- Correlation groups events through correlation_id

### Event Application
- Events applied in timestamp order
- Events applied atomically
- Events validated before application
- Events logged after application

### Event Validation
- Schema validation
- Business rule validation
- State transition validation
- Causality validation

### Event Compensation
- Compensating events for corrections
- Never modify existing events
- Never delete existing events
- Always create new events

---

## Event Schema Evolution

### Versioning Strategy
- Event schemas versioned
- Backward compatibility maintained
- Forward compatibility maintained
- Migration procedures documented

### Schema Changes
- Additive changes only
- Never remove fields
- Never change field types
- Never change field names

### Migration Procedures
- Event schema migration
- Event data migration
- Event validation
- Event verification
