-- Canonical State Schema
-- Layer 2 — Constitutional Truth
-- PostgreSQL as canonical database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Objects table
CREATE TABLE objects (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    object_id UUID NOT NULL UNIQUE,
    content_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    lineage_id UUID NOT NULL,
    content_type VARCHAR(255),
    content_size BIGINT,
    metadata JSONB,
    archived_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_content_hash CHECK (length(content_hash) = 64),
    CONSTRAINT valid_version CHECK (version >= 1)
);

-- Indexes for objects
CREATE INDEX idx_objects_object_id ON objects(object_id);
CREATE INDEX idx_objects_content_hash ON objects(content_hash);
CREATE INDEX idx_objects_lineage_id ON objects(lineage_id);
CREATE INDEX idx_objects_created_at ON objects(created_at);
CREATE INDEX idx_objects_archived_at ON objects(archived_at) WHERE archived_at IS NOT NULL;

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    event_id UUID NOT NULL UNIQUE,
    event_type VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    aggregate_id VARCHAR(255) NOT NULL,
    aggregate_type VARCHAR(255) NOT NULL,
    event_data JSONB NOT NULL,
    causation_id UUID,
    correlation_id UUID,
    metadata JSONB,
    processed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_event_type CHECK (event_type IN (
        'OBJECT_CREATED',
        'OBJECT_UPDATED',
        'OBJECT_VERSIONED',
        'FILE_INGESTED',
        'ENTITY_CREATED',
        'RELATIONSHIP_CREATED',
        'PROJECTION_REBUILT',
        'SYSTEM_EVENT'
    ))
);

-- Indexes for events
CREATE INDEX idx_events_event_id ON events(event_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_timestamp ON events(timestamp);
CREATE INDEX idx_events_aggregate_id ON events(aggregate_id);
CREATE INDEX idx_events_aggregate_type ON events(aggregate_type);
CREATE INDEX idx_events_causation_id ON events(causation_id);
CREATE INDEX idx_events_correlation_id ON events(correlation_id);
CREATE INDEX idx_events_processed_at ON events(processed_at) WHERE processed_at IS NOT NULL;

-- Composite index for event replay
CREATE INDEX idx_events_aggregate_timestamp ON events(aggregate_id, timestamp);

-- Lineage table
CREATE TABLE lineage (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    lineage_id UUID NOT NULL UNIQUE,
    root_object_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    current_version INTEGER NOT NULL DEFAULT 1,
    metadata JSONB
);

-- Indexes for lineage
CREATE INDEX idx_lineage_lineage_id ON lineage(lineage_id);
CREATE INDEX idx_lineage_root_object_id ON lineage(root_object_id);

-- Projections table
CREATE TABLE projections (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    projection_id UUID NOT NULL UNIQUE,
    projection_type VARCHAR(255) NOT NULL,
    projection_name VARCHAR(255) NOT NULL,
    source_aggregate_id UUID,
    projection_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_event_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'error', 'rebuilding'))
);

-- Indexes for projections
CREATE INDEX idx_projections_projection_id ON projections(projection_id);
CREATE INDEX idx_projections_projection_type ON projections(projection_type);
CREATE INDEX idx_projections_source_aggregate_id ON projections(source_aggregate_id);
CREATE INDEX idx_projections_status ON projections(status);
CREATE INDEX idx_projections_updated_at ON projections(updated_at);

-- System metadata table
CREATE TABLE system_metadata (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    key VARCHAR(255) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    version INTEGER NOT NULL DEFAULT 1
);

-- Indexes for system_metadata
CREATE INDEX idx_system_metadata_key ON system_metadata(key);
CREATE INDEX idx_system_metadata_updated_at ON system_metadata(updated_at);

-- Audit log table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    audit_id UUID NOT NULL UNIQUE,
    action VARCHAR(255) NOT NULL,
    actor VARCHAR(255) NOT NULL,
    resource_type VARCHAR(255) NOT NULL,
    resource_id UUID NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT
);

-- Indexes for audit_log
CREATE INDEX idx_audit_log_audit_id ON audit_log(audit_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_actor ON audit_log(actor);
CREATE INDEX idx_audit_log_resource_type ON audit_log(resource_type);
CREATE INDEX idx_audit_log_resource_id ON audit_log(resource_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);

-- Foreign key constraints
ALTER TABLE lineage ADD CONSTRAINT fk_lineage_root_object 
    FOREIGN KEY (root_object_id) REFERENCES objects(object_id);

ALTER TABLE projections ADD CONSTRAINT fk_projections_source_aggregate 
    FOREIGN KEY (source_aggregate_id) REFERENCES objects(object_id);

ALTER TABLE projections ADD CONSTRAINT fk_projections_last_event 
    FOREIGN KEY (last_event_id) REFERENCES events(event_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_projections_updated_at BEFORE UPDATE ON projections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_metadata_updated_at BEFORE UPDATE ON system_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for content hash verification
CREATE OR REPLACE FUNCTION verify_content_hash(content_hash VARCHAR(64))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN content_hash ~ '^[a-f0-9]{64}$';
END;
$$ language 'plpgsql';

-- Constraint for content hash format
ALTER TABLE objects ADD CONSTRAINT valid_content_hash_format 
    CHECK (verify_content_hash(content_hash));

-- Initial system metadata
INSERT INTO system_metadata (key, value, created_at, updated_at, version) VALUES
    ('schema_version', '{"version": "1.0", "applied_at": "2026-06-14T18:00:00Z"}', NOW(), NOW(), 1),
    ('system_initialized', '{"initialized": true, "initialized_at": "2026-06-14T18:00:00Z"}', NOW(), NOW(), 1);
