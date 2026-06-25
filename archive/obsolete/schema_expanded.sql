-- Canonical State Schema (Expanded)
-- Constitutional Law 6: Complete schemas for all constitutional entities
-- Layer 2 — Constitutional Truth

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- OBJECTS TABLE (Layer 0 reference)
-- =============================================================================
CREATE TABLE IF NOT EXISTS objects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    object_id UUID NOT NULL UNIQUE,
    content_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    lineage_id UUID NOT NULL,
    content_type VARCHAR(255),
    content_size BIGINT,
    metadata JSONB,
    archived_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_content_hash CHECK (length(content_hash) = 64),
    CONSTRAINT valid_version CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_objects_object_id ON objects(object_id);
CREATE INDEX IF NOT EXISTS idx_objects_content_hash ON objects(content_hash);
CREATE INDEX IF NOT EXISTS idx_objects_lineage_id ON objects(lineage_id);
CREATE INDEX IF NOT EXISTS idx_objects_created_at ON objects(created_at);
CREATE INDEX IF NOT EXISTS idx_objects_archived_at ON objects(archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_objects_deleted_at ON objects(deleted_at) WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- LINEAGE TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS lineage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lineage_id UUID NOT NULL UNIQUE,
    root_artifact_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    current_version INTEGER NOT NULL DEFAULT 1,
    metadata JSONB,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_version CHECK (current_version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_lineage_lineage_id ON lineage(lineage_id);
CREATE INDEX IF NOT EXISTS idx_lineage_root_artifact_id ON lineage(root_artifact_id);
CREATE INDEX IF NOT EXISTS idx_lineage_deleted_at ON lineage(deleted_at) WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- ARTIFACT LINEAGE TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS artifact_lineage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artifact_id UUID NOT NULL,
    parent_artifact_id UUID,
    origin_artifact_id UUID NOT NULL,
    lineage_id UUID NOT NULL,
    version INTEGER NOT NULL,
    processor_name VARCHAR(255) NOT NULL,
    processor_version VARCHAR(255) NOT NULL,
    processor_checksum VARCHAR(64),
    processor_configuration JSONB,
    processing_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_processor_checksum CHECK (processor_checksum IS NULL OR length(processor_checksum) = 64),
    CONSTRAINT valid_version CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_artifact_lineage_artifact_id ON artifact_lineage(artifact_id);
CREATE INDEX IF NOT EXISTS idx_artifact_lineage_parent_artifact_id ON artifact_lineage(parent_artifact_id);
CREATE INDEX IF NOT EXISTS idx_artifact_lineage_origin_artifact_id ON artifact_lineage(origin_artifact_id);
CREATE INDEX IF NOT EXISTS idx_artifact_lineage_lineage_id ON artifact_lineage(lineage_id);
CREATE INDEX IF NOT EXISTS idx_artifact_lineage_processor_name ON artifact_lineage(processor_name);
CREATE INDEX IF NOT EXISTS idx_artifact_lineage_deleted_at ON artifact_lineage(deleted_at) WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- EVENTS TABLE (Layer 1 reference)
-- =============================================================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL UNIQUE,
    event_type VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(255) NOT NULL,
    event_data JSONB NOT NULL,
    causation_id UUID,
    correlation_id UUID,
    metadata JSONB,
    processed_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_event_type CHECK (event_type IN (
        'OBJECT_CREATED',
        'OBJECT_VERSIONED',
        'OBJECT_ARCHIVED',
        'FILE_DETECTED',
        'FILE_CLASSIFIED',
        'METADATA_EXTRACTED',
        'NORMALIZED',
        'CANONICALIZED',
        'CHUNKED',
        'ENTITY_CREATED',
        'RELATIONSHIP_CREATED',
        'PROCESSING_COMPLETED',
        'PROCESSING_FAILED',
        'PROJECTION_CREATED',
        'PROJECTION_REBUILT',
        'REPLAY_STARTED',
        'REPLAY_COMPLETED',
        'SCHEMA_MIGRATED',
        'BACKUP_CREATED',
        'RESTORE_COMPLETED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_events_event_id ON events(event_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_aggregate_id ON events(aggregate_id);
CREATE INDEX IF NOT EXISTS idx_events_aggregate_type ON events(aggregate_type);
CREATE INDEX IF NOT EXISTS idx_events_causation_id ON events(causation_id);
CREATE INDEX IF NOT EXISTS idx_events_correlation_id ON events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_events_processed_at ON events(processed_at) WHERE processed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON events(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_aggregate_timestamp ON events(aggregate_id, timestamp);

-- =============================================================================
-- DOCUMENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL UNIQUE,
    object_id UUID NOT NULL,
    file_path VARCHAR(1024),
    file_size BIGINT,
    file_type VARCHAR(255),
    classification VARCHAR(255),
    confidence REAL,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_confidence CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

CREATE INDEX IF NOT EXISTS idx_documents_document_id ON documents(document_id);
CREATE INDEX IF NOT EXISTS idx_documents_object_id ON documents(object_id);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);
CREATE INDEX IF NOT EXISTS idx_documents_classification ON documents(classification);
CREATE INDEX IF NOT EXISTS idx_documents_detected_at ON documents(detected_at);
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON documents(deleted_at) WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- CANONICAL DOCUMENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS canonical_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canonical_document_id UUID NOT NULL UNIQUE,
    document_id UUID NOT NULL,
    object_id UUID NOT NULL,
    metadata JSONB,
    canonicalization_rules JSONB,
    canonicalizer_version VARCHAR(255),
    canonicalization_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_canonical_documents_canonical_document_id ON canonical_documents(canonical_document_id);
CREATE INDEX IF NOT EXISTS idx_canonical_documents_document_id ON canonical_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_canonical_documents_object_id ON canonical_documents(object_id);
CREATE INDEX IF NOT EXISTS idx_canonical_documents_canonicalizer_version ON canonical_documents(canonicalizer_version);
CREATE INDEX IF NOT EXISTS idx_canonical_documents_deleted_at ON canonical_documents(deleted_at) WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- CHUNKS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chunk_id UUID NOT NULL UNIQUE,
    canonical_document_id UUID NOT NULL,
    object_id UUID NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_strategy VARCHAR(255),
    chunk_size INTEGER,
    chunk_overlap INTEGER,
    chunker_version VARCHAR(255),
    chunking_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_chunk_index CHECK (chunk_index >= 0)
);

CREATE INDEX IF NOT EXISTS idx_chunks_chunk_id ON chunks(chunk_id);
CREATE INDEX IF NOT EXISTS idx_chunks_canonical_document_id ON chunks(canonical_document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_object_id ON chunks(object_id);
CREATE INDEX IF NOT EXISTS idx_chunks_chunk_index ON chunks(chunk_index);
CREATE INDEX IF NOT EXISTS idx_chunks_chunk_strategy ON chunks(chunk_strategy);
CREATE INDEX IF NOT EXISTS idx_chunks_deleted_at ON chunks(deleted_at) WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- ENTITIES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL UNIQUE,
    entity_type VARCHAR(255) NOT NULL,
    entity_name VARCHAR(1024),
    entity_attributes JSONB,
    source_chunk_id UUID,
    confidence REAL,
    extractor_version VARCHAR(255),
    extraction_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_confidence CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

CREATE INDEX IF NOT EXISTS idx_entities_entity_id ON entities(entity_id);
CREATE INDEX IF NOT EXISTS idx_entities_entity_type ON entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_entity_name ON entities(entity_name);
CREATE INDEX IF NOT EXISTS idx_entities_source_chunk_id ON entities(source_chunk_id);
CREATE INDEX IF NOT EXISTS idx_entities_extractor_version ON entities(extractor_version);
CREATE INDEX IF NOT EXISTS idx_entities_deleted_at ON entities(deleted_at) WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- RELATIONSHIPS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL UNIQUE,
    source_entity_id UUID NOT NULL,
    target_entity_id UUID NOT NULL,
    relationship_type VARCHAR(255) NOT NULL,
    relationship_attributes JSONB,
    source_chunk_id UUID,
    confidence REAL,
    extractor_version VARCHAR(255),
    extraction_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_confidence CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

CREATE INDEX IF NOT EXISTS idx_relationships_relationship_id ON relationships(relationship_id);
CREATE INDEX IF NOT EXISTS idx_relationships_source_entity_id ON relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target_entity_id ON relationships(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_relationship_type ON relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_relationships_source_chunk_id ON relationships(source_chunk_id);
CREATE INDEX IF NOT EXISTS idx_relationships_extractor_version ON relationships(extractor_version);
CREATE INDEX IF NOT EXISTS idx_relationships_deleted_at ON relationships(deleted_at) WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- PROCESSORS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS processors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    processor_id UUID NOT NULL UNIQUE,
    processor_name VARCHAR(255) NOT NULL,
    processor_version VARCHAR(255) NOT NULL,
    processor_checksum VARCHAR(64),
    processor_configuration JSONB,
    expected_configuration JSONB,
    processor_type VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_processor_checksum CHECK (processor_checksum IS NULL OR length(processor_checksum) = 64),
    CONSTRAINT unique_processor_version UNIQUE (processor_name, processor_version)
);

CREATE INDEX IF NOT EXISTS idx_processors_processor_id ON processors(processor_id);
CREATE INDEX IF NOT EXISTS idx_processors_processor_name ON processors(processor_name);
CREATE INDEX IF NOT EXISTS idx_processors_processor_version ON processors(processor_version);
CREATE INDEX IF NOT EXISTS idx_processors_processor_type ON processors(processor_type);
CREATE INDEX IF NOT EXISTS idx_processors_deleted_at ON processors(deleted_at) WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- PROCESSING RUNS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS processing_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    processing_run_id UUID NOT NULL UNIQUE,
    processor_name VARCHAR(255) NOT NULL,
    processor_version VARCHAR(255) NOT NULL,
    input_artifact_id UUID NOT NULL,
    output_artifact_ids JSONB,
    processing_duration_ms BIGINT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    error_code VARCHAR(255),
    error_stack_trace TEXT,
    processing_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_processing_runs_processing_run_id ON processing_runs(processing_run_id);
CREATE INDEX IF NOT EXISTS idx_processing_runs_processor_name ON processing_runs(processor_name);
CREATE INDEX IF NOT EXISTS idx_processing_runs_processor_version ON processing_runs(processor_version);
CREATE INDEX IF NOT EXISTS idx_processing_runs_input_artifact_id ON processing_runs(input_artifact_id);
CREATE INDEX IF NOT EXISTS idx_processing_runs_success ON processing_runs(success);
CREATE INDEX IF NOT EXISTS idx_processing_runs_processing_timestamp ON processing_runs(processing_timestamp);
CREATE INDEX IF NOT EXISTS idx_processing_runs_deleted_at ON processing_runs(deleted_at) WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- REPLAY RUNS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS replay_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    replay_id UUID NOT NULL UNIQUE,
    from_event_id UUID,
    to_event_id UUID,
    replay_mode VARCHAR(255) NOT NULL,
    checkpoint BOOLEAN NOT NULL DEFAULT false,
    events_replayed INTEGER,
    replay_duration_ms BIGINT,
    state_restored BOOLEAN,
    projections_rebuilt INTEGER,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    start_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    completion_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_replay_runs_replay_id ON replay_runs(replay_id);
CREATE INDEX IF NOT EXISTS idx_replay_runs_from_event_id ON replay_runs(from_event_id);
CREATE INDEX IF NOT EXISTS idx_replay_runs_to_event_id ON replay_runs(to_event_id);
CREATE INDEX IF NOT EXISTS idx_replay_runs_replay_mode ON replay_runs(replay_mode);
CREATE INDEX IF NOT EXISTS idx_replay_runs_success ON replay_runs(success);
CREATE INDEX IF NOT EXISTS idx_replay_runs_start_timestamp ON replay_runs(start_timestamp);
CREATE INDEX IF NOT EXISTS idx_replay_runs_deleted_at ON replay_runs(deleted_at) WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- PROJECTIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS projections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    projection_id UUID NOT NULL UNIQUE,
    projection_type VARCHAR(255) NOT NULL,
    projection_name VARCHAR(255) NOT NULL,
    source_aggregate_id UUID,
    projection_configuration JSONB,
    projection_data JSONB NOT NULL,
    builder_version VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_event_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'error', 'rebuilding'))
);

CREATE INDEX IF NOT EXISTS idx_projections_projection_id ON projections(projection_id);
CREATE INDEX IF NOT EXISTS idx_projections_projection_type ON projections(projection_type);
CREATE INDEX IF NOT EXISTS idx_projections_projection_name ON projections(projection_name);
CREATE INDEX IF NOT EXISTS idx_projections_source_aggregate_id ON projections(source_aggregate_id);
CREATE INDEX IF NOT EXISTS idx_projections_status ON projections(status);
CREATE INDEX IF NOT EXISTS idx_projections_updated_at ON projections(updated_at);
CREATE INDEX IF NOT EXISTS idx_projections_deleted_at ON projections(deleted_at) WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- PROJECTION REGISTRY TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS projection_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registry_id UUID NOT NULL UNIQUE,
    projection_type VARCHAR(255) NOT NULL,
    projection_name VARCHAR(255) NOT NULL,
    projection_schema JSONB NOT NULL,
    dependencies JSONB,
    build_schedule VARCHAR(255),
    invalidation_rules JSONB,
    rebuild_strategy VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_projection_name UNIQUE (projection_type, projection_name)
);

CREATE INDEX IF NOT EXISTS idx_projection_registry_registry_id ON projection_registry(registry_id);
CREATE INDEX IF NOT EXISTS idx_projection_registry_projection_type ON projection_registry(projection_type);
CREATE INDEX IF NOT EXISTS idx_projection_registry_projection_name ON projection_registry(projection_name);
CREATE INDEX IF NOT EXISTS idx_projection_registry_deleted_at ON projection_registry(deleted_at) WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- SCHEMA VERSIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS schema_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schema_id UUID NOT NULL UNIQUE,
    schema_name VARCHAR(255) NOT NULL,
    version VARCHAR(255) NOT NULL,
    previous_version VARCHAR(255),
    migration_script TEXT,
    migration_duration_ms BIGINT,
    tables_affected JSONB,
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL,
    rollback_script TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_schema_versions_schema_id ON schema_versions(schema_id);
CREATE INDEX IF NOT EXISTS idx_schema_versions_schema_name ON schema_versions(schema_name);
CREATE INDEX IF NOT EXISTS idx_schema_versions_version ON schema_versions(version);
CREATE INDEX IF NOT EXISTS idx_schema_versions_applied_at ON schema_versions(applied_at);
CREATE INDEX IF NOT EXISTS idx_schema_versions_deleted_at ON schema_versions(deleted_at) WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- ARTIFACT REGISTRY TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS artifact_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artifact_id UUID NOT NULL UNIQUE,
    artifact_type VARCHAR(255) NOT NULL,
    artifact_name VARCHAR(1024),
    artifact_schema JSONB,
    lineage_id UUID,
    processor_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_artifact_registry_artifact_id ON artifact_registry(artifact_id);
CREATE INDEX IF NOT EXISTS idx_artifact_registry_artifact_type ON artifact_registry(artifact_type);
CREATE INDEX IF NOT EXISTS idx_artifact_registry_lineage_id ON artifact_registry(lineage_id);
CREATE INDEX IF NOT EXISTS idx_artifact_registry_processor_id ON artifact_registry(processor_id);
CREATE INDEX IF NOT EXISTS idx_artifact_registry_deleted_at ON artifact_registry(deleted_at) WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- SYSTEM METADATA TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS system_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_system_metadata_key ON system_metadata(key);
CREATE INDEX IF NOT EXISTS idx_system_metadata_updated_at ON system_metadata(updated_at);
CREATE INDEX IF NOT EXISTS idx_system_metadata_deleted_at ON system_metadata(deleted_at) WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- AUDIT LOG TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL UNIQUE,
    action VARCHAR(255) NOT NULL,
    actor VARCHAR(255) NOT NULL,
    resource_type VARCHAR(255) NOT NULL,
    resource_id UUID NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_audit_log_audit_id ON audit_log(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource_type ON audit_log(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource_id ON audit_log(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_deleted_at ON audit_log(deleted_at) WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- FOREIGN KEY CONSTRAINTS
-- =============================================================================
ALTER TABLE lineage ADD CONSTRAINT fk_lineage_root_object 
    FOREIGN KEY (root_artifact_id) REFERENCES objects(object_id);

ALTER TABLE artifact_lineage ADD CONSTRAINT fk_artifact_lineage_artifact 
    FOREIGN KEY (artifact_id) REFERENCES objects(object_id);

ALTER TABLE artifact_lineage ADD CONSTRAINT fk_artifact_lineage_parent 
    FOREIGN KEY (parent_artifact_id) REFERENCES objects(object_id);

ALTER TABLE artifact_lineage ADD CONSTRAINT fk_artifact_lineage_origin 
    FOREIGN KEY (origin_artifact_id) REFERENCES objects(object_id);

ALTER TABLE artifact_lineage ADD CONSTRAINT fk_artifact_lineage_lineage 
    FOREIGN KEY (lineage_id) REFERENCES lineage(lineage_id);

ALTER TABLE documents ADD CONSTRAINT fk_documents_object 
    FOREIGN KEY (object_id) REFERENCES objects(object_id);

ALTER TABLE canonical_documents ADD CONSTRAINT fk_canonical_documents_document 
    FOREIGN KEY (document_id) REFERENCES documents(document_id);

ALTER TABLE canonical_documents ADD CONSTRAINT fk_canonical_documents_object 
    FOREIGN KEY (object_id) REFERENCES objects(object_id);

ALTER TABLE chunks ADD CONSTRAINT fk_chunks_canonical_document 
    FOREIGN KEY (canonical_document_id) REFERENCES canonical_documents(canonical_document_id);

ALTER TABLE chunks ADD CONSTRAINT fk_chunks_object 
    FOREIGN KEY (object_id) REFERENCES objects(object_id);

ALTER TABLE entities ADD CONSTRAINT fk_entities_source_chunk 
    FOREIGN KEY (source_chunk_id) REFERENCES chunks(chunk_id);

ALTER TABLE relationships ADD CONSTRAINT fk_relationships_source_entity 
    FOREIGN KEY (source_entity_id) REFERENCES entities(entity_id);

ALTER TABLE relationships ADD CONSTRAINT fk_relationships_target_entity 
    FOREIGN KEY (target_entity_id) REFERENCES entities(entity_id);

ALTER TABLE relationships ADD CONSTRAINT fk_relationships_source_chunk 
    FOREIGN KEY (source_chunk_id) REFERENCES chunks(chunk_id);

ALTER TABLE processing_runs ADD CONSTRAINT fk_processing_runs_input_artifact 
    FOREIGN KEY (input_artifact_id) REFERENCES objects(object_id);

ALTER TABLE projections ADD CONSTRAINT fk_projections_source_aggregate 
    FOREIGN KEY (source_aggregate_id) REFERENCES objects(object_id);

ALTER TABLE projections ADD CONSTRAINT fk_projections_last_event 
    FOREIGN KEY (last_event_id) REFERENCES events(event_id);

ALTER TABLE artifact_registry ADD CONSTRAINT fk_artifact_registry_lineage 
    FOREIGN KEY (lineage_id) REFERENCES lineage(lineage_id);

ALTER TABLE artifact_registry ADD CONSTRAINT fk_artifact_registry_processor 
    FOREIGN KEY (processor_id) REFERENCES processors(processor_id);

-- =============================================================================
-- FUNCTIONS FOR AUTOMATIC TIMESTAMP UPDATES
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_canonical_documents_updated_at BEFORE UPDATE ON canonical_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chunks_updated_at BEFORE UPDATE ON chunks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processors_updated_at BEFORE UPDATE ON processors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projections_updated_at BEFORE UPDATE ON projections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projection_registry_updated_at BEFORE UPDATE ON projection_registry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artifact_registry_updated_at BEFORE UPDATE ON artifact_registry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_metadata_updated_at BEFORE UPDATE ON system_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FUNCTIONS FOR CONTENT HASH VERIFICATION
-- =============================================================================
CREATE OR REPLACE FUNCTION verify_content_hash(content_hash VARCHAR(64))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN content_hash ~ '^[a-f0-9]{64}$';
END;
$$ language 'plpgsql';

-- =============================================================================
-- INITIAL SYSTEM METADATA
-- =============================================================================
INSERT INTO system_metadata (key, value, created_at, updated_at, version) VALUES
    ('schema_version', '{"version": "2.0", "applied_at": "2026-06-14T18:00:00Z"}', NOW(), NOW(), 1),
    ('system_initialized', '{"initialized": true, "initialized_at": "2026-06-14T18:00:00Z"}', NOW(), NOW(), 1),
    ('replay_kernel_version', '{"version": "2.0", "constitutional_laws": 12}', NOW(), NOW(), 1);
