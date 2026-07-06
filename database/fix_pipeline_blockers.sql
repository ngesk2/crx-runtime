-- Phase 43: PostgreSQL Schema Fixes
-- Apply AFTER Docker is running and Postgres is accessible
-- Fixes the 3 pipeline-blocking schema issues

-- Fix 1: Change aggregate_id from UUID to VARCHAR(255)
-- Workers insert string IDs like 'doc_0', 'claim_9', not UUIDs
ALTER TABLE events ALTER COLUMN aggregate_id TYPE VARCHAR(255);
ALTER TABLE observations ALTER COLUMN event_id TYPE VARCHAR(255);

-- Fix 2: Extend valid_event_type CHECK constraint
-- Add all 6 worker-pipeline event types that were silently rejected
ALTER TABLE events DROP CONSTRAINT IF EXISTS valid_event_type;

ALTER TABLE events ADD CONSTRAINT valid_event_type CHECK (event_type IN (
    'OBJECT_CREATED', 'OBJECT_UPDATED', 'OBJECT_VERSIONED', 'FILE_INGESTED',
    'ENTITY_CREATED', 'RELATIONSHIP_CREATED', 'PROJECTION_REBUILT', 'SYSTEM_EVENT',
    'FILE_DISCOVERED', 'FILE_INDEXED', 'FILE_CREATED', 'FILE_MODIFIED', 'FILE_DELETED',
    'DOCUMENT_IMPORTED', 'DOCUMENT_OBSERVED', 'DOCUMENT_DIGESTED', 'DOCUMENT_EMBEDDED',
    'ENTITY_DISCOVERED', 'CLAIM_DISCOVERED', 'RELATIONSHIP_DISCOVERED', 'TOPIC_DISCOVERED',
    'CITATION_DISCOVERED', 'REPOSITORY_DISCOVERED', 'REPOSITORY_SNAPSHOT_CREATED',
    'REPOSITORY_SNAPSHOT_VERIFIED', 'REPOSITORY_WITNESS_CREATED', 'COMMIT_CREATED', 'COMMIT_VERIFIED',
    -- Added worker pipeline event types:
    'OBSERVATION_CREATED', 'CANDIDATE_CLAIM_CREATED', 'CLAIM_GENERATED',
    'REPLAY_EXECUTED', 'WITNESS_CREATED', 'LINEAGE_CREATED', 'PROJECTION_CREATED'
));

-- Fix 3: Create event_processing table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_processing (
    event_id TEXT PRIMARY KEY,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    worker TEXT NOT NULL DEFAULT 'unknown',
    retries INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_processing_processed ON event_processing(processed);
CREATE INDEX IF NOT EXISTS idx_event_processing_worker ON event_processing(worker);

-- Fix 4: Add FK from event_processing to events (if running on events table)
-- Note: The gateway pipeline writes to repository_events, not events
-- This FK is for the events table path
-- ALTER TABLE event_processing ADD CONSTRAINT fk_event_processing_event
--     FOREIGN KEY (event_id) REFERENCES events(event_id);
