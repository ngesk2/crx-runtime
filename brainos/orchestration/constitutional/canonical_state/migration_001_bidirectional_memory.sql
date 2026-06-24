-- Phase E.1 + E.2 Migration
-- Bidirectional Memory + Graph Storage Layer
-- Date: 2026-06-23

-- ============================================================
-- Phase E.1: Bidirectional Projection
-- ============================================================

-- Add projected_at timestamp to events
ALTER TABLE events
ADD COLUMN IF NOT EXISTS projected_at TIMESTAMP WITH TIME ZONE;

-- Update CHECK constraint to include new event types
ALTER TABLE events DROP CONSTRAINT IF EXISTS valid_event_type;
ALTER TABLE events ADD CONSTRAINT valid_event_type CHECK (event_type IN (
    'OBJECT_CREATED',
    'OBJECT_UPDATED',
    'OBJECT_VERSIONED',
    'FILE_INGESTED',
    'ENTITY_CREATED',
    'RELATIONSHIP_CREATED',
    'PROJECTION_REBUILT',
    'SYSTEM_EVENT',
    'FILE_DISCOVERED',
    'FILE_INDEXED',
    'FILE_CREATED',
    'FILE_MODIFIED',
    'FILE_DELETED',
    'DOCUMENT_IMPORTED',
    'DOCUMENT_OBSERVED',
    'DOCUMENT_DIGESTED',
    'DOCUMENT_EMBEDDED',
    'ENTITY_DISCOVERED',
    'CLAIM_DISCOVERED',
    'RELATIONSHIP_DISCOVERED',
    'TOPIC_DISCOVERED',
    'CITATION_DISCOVERED'
));

-- ============================================================
-- Phase E.2: Graph Storage Layer
-- ============================================================

-- Table: objects (alter existing if present, create if absent)
CREATE TABLE IF NOT EXISTS objects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    object_id UUID NOT NULL UNIQUE,
    content_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    lineage_id UUID NOT NULL,
    content_type VARCHAR(255),
    content_size BIGINT,
    metadata JSONB,
    archived_at TIMESTAMP WITH TIME ZONE,
    source TEXT,
    source_id TEXT,
    title TEXT,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_content_hash CHECK (length(content_hash::text) = 64),
    CONSTRAINT valid_version CHECK (version >= 1)
);

-- Add graph layer columns if objects table pre-existed with different schema
ALTER TABLE objects ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE objects ADD COLUMN IF NOT EXISTS source_id TEXT;
ALTER TABLE objects ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE objects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_objects_content_type ON objects(content_type);
CREATE INDEX IF NOT EXISTS idx_objects_source ON objects(source);

-- Table: topics
CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: entities
CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    entity_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);

-- Table: claims
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_text TEXT NOT NULL,
    confidence NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claims_text
ON claims USING gin(to_tsvector('english', claim_text));

-- Table: citations
CREATE TABLE IF NOT EXISTS citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_object UUID REFERENCES objects(id),
    target_object UUID REFERENCES objects(id),
    citation_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citations_source ON citations(source_object);
CREATE INDEX IF NOT EXISTS idx_citations_target ON citations(target_object);

-- Table: relationships
CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_object UUID REFERENCES objects(id),
    target_object UUID REFERENCES objects(id),
    relationship_type TEXT NOT NULL,
    confidence NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(source_object);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(target_object);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relationship_type);
