-- Constitutional Memory Ingestion Event Flow
-- Priority 1: Constitutional Memory Ingestion
-- Date: 2026-06-23

-- Event Flow Architecture:
-- Document → DocumentDiscovered → DocumentIngested → DocumentEmbedded → ProjectedToQdrant
-- Every state change is an event
-- Events are append-only
-- State is reconstructable from events

-- Event Stream: documents
-- Event Types:
-- - DOCUMENT_DISCOVERED
-- - DOCUMENT_INGESTED
-- - DOCUMENT_EMBEDDED
-- - DOCUMENT_PROJECTED
-- - DOCUMENT_FAILED
-- - DOCUMENT_UPDATED
-- - DOCUMENT_DELETED

-- Event Payload Schemas

-- DOCUMENT_DISCOVERED Event
{
  "document_hash": "string",           -- SHA-256 hash of document
  "source_type": "string",            -- 'vault', 'drive', 'research', 'scripts', 'transcripts', 'notes'
  "source_path": "string",            -- Original file path
  "title": "string",                  -- Document title
  "content_hash": "string",           -- SHA-256 hash of content
  "author": "string",                 -- Document author
  "created_at": "string",             -- Document creation timestamp
  "discovered_at": "string",          -- Discovery timestamp
  "content_length": "integer",        -- Content length
  "word_count": "integer",            -- Word count
  "language": "string",               -- Document language
  "metadata": "object"                -- Additional metadata
}

-- DOCUMENT_INGESTED Event
{
  "document_id": "bigint",            -- PostgreSQL document.id
  "document_hash": "string",          -- SHA-256 hash of document
  "ingested_at": "string",            -- Ingestion timestamp
  "content_stored": "boolean",        -- Whether content was stored
  "content_hash": "string",           -- SHA-256 hash of stored content
  "ingestion_duration_ms": "integer"  -- Ingestion duration
}

-- DOCUMENT_EMBEDDED Event
{
  "document_id": "bigint",            -- PostgreSQL document.id
  "document_hash": "string",          -- SHA-256 hash of document
  "embedding_model": "string",       -- Model used for embedding
  "embedding_dimension": "integer", -- Embedding dimension
  "embedded_at": "string",            -- Embedding timestamp
  "embedding_hash": "string",        -- SHA-256 hash of embedding
  "embedding_duration_ms": "integer" -- Embedding duration
}

-- DOCUMENT_PROJECTED Event
{
  "document_id": "bigint",            -- PostgreSQL document.id
  "document_hash": "string",          -- SHA-256 hash of document
  "qdrant_collection": "string",      -- Qdrant collection name
  "qdrant_id": "bigint",              -- Qdrant point ID
  "projected_at": "string",           -- Projection timestamp
  "projection_duration_ms": "integer" -- Projection duration
}

-- DOCUMENT_FAILED Event
{
  "document_hash": "string",          -- SHA-256 hash of document
  "source_type": "string",            -- Source type
  "source_path": "string",            -- Source path
  "failed_at": "string",              -- Failure timestamp
  "failure_stage": "string",          -- 'discovery', 'ingestion', 'embedding', 'projection'
  "error_message": "string",          -- Error message
  "error_type": "string",             -- Error type
  "retry_count": "integer"            -- Number of retries
}

-- DOCUMENT_UPDATED Event
{
  "document_id": "bigint",            -- PostgreSQL document.id
  "document_hash": "string",          -- New SHA-256 hash
  "previous_hash": "string",          -- Previous SHA-256 hash
  "updated_at": "string",             -- Update timestamp
  "update_type": "string",            -- 'content', 'metadata', 'tags'
  "changes": "object"                 -- Detailed changes
}

-- DOCUMENT_DELETED Event
{
  "document_id": "bigint",            -- PostgreSQL document.id
  "document_hash": "string",          -- SHA-256 hash of document
  "deleted_at": "string",             -- Deletion timestamp
  "deletion_reason": "string",        -- Reason for deletion
  "soft_delete": "boolean"            -- Whether this is a soft delete
}

-- Event Emission Functions

-- Emit DOCUMENT_DISCOVERED Event
CREATE OR REPLACE FUNCTION emit_document_discovered(
    p_document_hash TEXT,
    p_source_type TEXT,
    p_source_path TEXT,
    p_title TEXT DEFAULT NULL,
    p_content_hash TEXT DEFAULT NULL,
    p_author TEXT DEFAULT NULL,
    p_created_at TEXT DEFAULT NULL,
    p_content_length INTEGER DEFAULT NULL,
    p_word_count INTEGER DEFAULT NULL,
    p_language TEXT DEFAULT 'en',
    p_metadata JSONB DEFAULT '{}'
) RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO events (stream, event_type, payload, created_at)
    VALUES (
        'documents',
        'DOCUMENT_DISCOVERED',
        jsonb_build_object(
            'document_hash', p_document_hash,
            'source_type', p_source_type,
            'source_path', p_source_path,
            'title', p_title,
            'content_hash', p_content_hash,
            'author', p_author,
            'created_at', COALESCE(p_created_at, NOW()),
            'discovered_at', NOW(),
            'content_length', p_content_length,
            'word_count', p_word_count,
            'language', p_language,
            'metadata', p_metadata
        ),
        NOW()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Emit DOCUMENT_INGESTED Event
CREATE OR REPLACE FUNCTION emit_document_ingested(
    p_document_id BIGINT,
    p_document_hash TEXT,
    p_content_stored BOOLEAN DEFAULT TRUE,
    p_content_hash TEXT DEFAULT NULL,
    p_ingestion_duration_ms INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO events (stream, event_type, payload, created_at)
    VALUES (
        'documents',
        'DOCUMENT_INGESTED',
        jsonb_build_object(
            'document_id', p_document_id,
            'document_hash', p_document_hash,
            'ingested_at', NOW(),
            'content_stored', p_content_stored,
            'content_hash', p_content_hash,
            'ingestion_duration_ms', p_ingestion_duration_ms
        ),
        NOW()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Emit DOCUMENT_EMBEDDED Event
CREATE OR REPLACE FUNCTION emit_document_embedded(
    p_document_id BIGINT,
    p_document_hash TEXT,
    p_embedding_model TEXT,
    p_embedding_dimension INTEGER,
    p_embedding_hash TEXT DEFAULT NULL,
    p_embedding_duration_ms INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO events (stream, event_type, payload, created_at)
    VALUES (
        'documents',
        'DOCUMENT_EMBEDDED',
        jsonb_build_object(
            'document_id', p_document_id,
            'document_hash', p_document_hash,
            'embedding_model', p_embedding_model,
            'embedding_dimension', p_embedding_dimension,
            'embedded_at', NOW(),
            'embedding_hash', p_embedding_hash,
            'embedding_duration_ms', p_embedding_duration_ms
        ),
        NOW()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Emit DOCUMENT_PROJECTED Event
CREATE OR REPLACE FUNCTION emit_document_projected(
    p_document_id BIGINT,
    p_document_hash TEXT,
    p_qdrant_collection TEXT DEFAULT 'documents',
    p_qdrant_id BIGINT,
    p_projection_duration_ms INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO events (stream, event_type, payload, created_at)
    VALUES (
        'documents',
        'DOCUMENT_PROJECTED',
        jsonb_build_object(
            'document_id', p_document_id,
            'document_hash', p_document_hash,
            'qdrant_collection', p_qdrant_collection,
            'qdrant_id', p_qdrant_id,
            'projected_at', NOW(),
            'projection_duration_ms', p_projection_duration_ms
        ),
        NOW()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Emit DOCUMENT_FAILED Event
CREATE OR REPLACE FUNCTION emit_document_failed(
    p_document_hash TEXT,
    p_source_type TEXT,
    p_source_path TEXT,
    p_failure_stage TEXT,
    p_error_message TEXT,
    p_error_type TEXT DEFAULT 'unknown',
    p_retry_count INTEGER DEFAULT 0
) RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO events (stream, event_type, payload, created_at)
    VALUES (
        'documents',
        'DOCUMENT_FAILED',
        jsonb_build_object(
            'document_hash', p_document_hash,
            'source_type', p_source_type,
            'source_path', p_source_path,
            'failed_at', NOW(),
            'failure_stage', p_failure_stage,
            'error_message', p_error_message,
            'error_type', p_error_type,
            'retry_count', p_retry_count
        ),
        NOW()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Document State Reconstruction Function
CREATE OR REPLACE FUNCTION reconstruct_document_state(p_document_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    state JSONB;
BEGIN
    SELECT jsonb_build_object(
        'document_id', p_document_id,
        'discovered', (
            SELECT jsonb_agg(payload)
            FROM events
            WHERE stream = 'documents'
              AND event_type = 'DOCUMENT_DISCOVERED'
              AND payload->>'document_hash' = (SELECT document_hash FROM documents WHERE id = p_document_id)
        ),
        'ingested', (
            SELECT jsonb_agg(payload)
            FROM events
            WHERE stream = 'documents'
              AND event_type = 'DOCUMENT_INGESTED'
              AND payload->>'document_id' = p_document_id::TEXT
        ),
        'embedded', (
            SELECT jsonb_agg(payload)
            FROM events
            WHERE stream = 'documents'
              AND event_type = 'DOCUMENT_EMBEDDED'
              AND payload->>'document_id' = p_document_id::TEXT
        ),
        'projected', (
            SELECT jsonb_agg(payload)
            FROM events
            WHERE stream = 'documents'
              AND event_type = 'DOCUMENT_PROJECTED'
              AND payload->>'document_id' = p_document_id::TEXT
        ),
        'failures', (
            SELECT jsonb_agg(payload)
            FROM events
            WHERE stream = 'documents'
              AND event_type = 'DOCUMENT_FAILED'
              AND payload->>'document_hash' = (SELECT document_hash FROM documents WHERE id = p_document_id)
        )
    ) INTO state;
    
    RETURN state;
END;
$$ LANGUAGE plpgsql;

-- Document Event Timeline Function
CREATE OR REPLACE FUNCTION get_document_timeline(p_document_id BIGINT)
RETURNS TABLE (
    event_type TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        event_type,
        payload,
        created_at
    FROM events
    WHERE stream = 'documents'
      AND (
          payload->>'document_id' = p_document_id::TEXT
          OR payload->>'document_hash' = (SELECT document_hash FROM documents WHERE id = p_document_id)
      )
    ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Document Pipeline Statistics Function
CREATE OR REPLACE FUNCTION get_document_pipeline_statistics()
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_documents', (SELECT COUNT(*) FROM documents),
        'discovered', (SELECT COUNT(*) FROM documents WHERE status = 'discovered'),
        'ingested', (SELECT COUNT(*) FROM documents WHERE status = 'ingested'),
        'embedded', (SELECT COUNT(*) FROM documents WHERE status = 'embedded'),
        'projected', (SELECT COUNT(*) FROM documents WHERE status = 'projected'),
        'failed', (SELECT COUNT(*) FROM documents WHERE status = 'failed'),
        'by_source_type', (
            SELECT jsonb_object_agg(source_type, COUNT(*))
            FROM documents
            GROUP BY source_type
        ),
        'total_events', (SELECT COUNT(*) FROM events WHERE stream = 'documents'),
        'events_by_type', (
            SELECT jsonb_object_agg(event_type, COUNT(*))
            FROM events
            WHERE stream = 'documents'
            GROUP BY event_type
        )
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;
