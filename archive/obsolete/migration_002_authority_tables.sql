-- Migration 002: Create missing authority tables
-- Reconciles Python code column expectations with DDL definitions
-- Python code is authoritative (DDL was never applied)

BEGIN;

-- ============================================================
-- 1. authority_objects
-- Matches authority_search.py + mission_control_authority_endpoint.py
-- ============================================================
CREATE TABLE IF NOT EXISTS authority_objects (
  authority_id UUID PRIMARY KEY,
  artifact_id UUID,
  authority_type TEXT NOT NULL,
  authority_level INTEGER NOT NULL DEFAULT 0,
  title TEXT,
  description TEXT,
  category TEXT,
  sha256 TEXT,
  payload_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  supersedes_authority UUID,
  source_system TEXT,
  canonical_path TEXT,
  status TEXT DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_authority_objects_artifact_id ON authority_objects(artifact_id);
CREATE INDEX IF NOT EXISTS idx_authority_objects_type_level ON authority_objects(authority_type, authority_level);
CREATE INDEX IF NOT EXISTS idx_authority_objects_title ON authority_objects(title);

-- ============================================================
-- 2. authority_lineage
-- Matches authority_search.py, lineage_search.py, graph_expand.py
-- Python queries: ancestor, descendant, relation, metadata
-- ============================================================
CREATE TABLE IF NOT EXISTS authority_lineage (
  id UUID PRIMARY KEY,
  ancestor UUID NOT NULL,
  descendant UUID NOT NULL,
  relation TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_authority_lineage_ancestor ON authority_lineage(ancestor);
CREATE INDEX IF NOT EXISTS idx_authority_lineage_descendant ON authority_lineage(descendant);

-- ============================================================
-- 3. authority_supersession
-- Matches authority_search.py, mission_control_authority_endpoint.py
-- Python queries: superseded, superseded_by
-- ============================================================
CREATE TABLE IF NOT EXISTS authority_supersession (
  id UUID PRIMARY KEY,
  superseded UUID NOT NULL,
  superseded_by UUID,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_authority_supersession_superseded ON authority_supersession(superseded);
CREATE INDEX IF NOT EXISTS idx_authority_supersession_superseded_by ON authority_supersession(superseded_by);

-- ============================================================
-- 4. authority_witness
-- NO DDL existed previously. Created from code expectations.
-- Python queries: aw.artifact_id = ao.artifact_id (COUNT subquery)
-- ============================================================
CREATE TABLE IF NOT EXISTS authority_witness (
  id UUID PRIMARY KEY,
  artifact_id UUID,
  witness_root TEXT,
  witness_signature TEXT,
  witness_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_authority_witness_artifact_id ON authority_witness(artifact_id);

-- Populate authority_objects from existing DOCUMENT_IMPORTED events
INSERT INTO authority_objects (authority_id, artifact_id, authority_type, authority_level, title, category, sha256, payload_hash, source_system, status, created_at)
SELECT 
  gen_random_uuid(),
  (event_data->>'artifact_id')::uuid,
  COALESCE(event_data->>'authority_type', 'IMPORTED_DOCUMENT'),
  CASE COALESCE(event_data->>'authority_type', '')
    WHEN 'CONSTITUTIONAL_LAW' THEN 100
    WHEN 'CANONICAL_SPEC' THEN 90
    WHEN 'CREATOR_RESEARCH' THEN 80
    WHEN 'IMPORTED_DOCUMENT' THEN 70
    WHEN 'SCRIPT' THEN 60
    WHEN 'SUMMARY' THEN 50
    ELSE 40
  END,
  event_data->>'title',
  COALESCE(event_data->>'authority_type', 'IMPORTED_DOCUMENT'),
  event_data->>'sha256',
  event_data->>'content_hash',
  'constitutional_ingestion',
  'active',
  timestamp
FROM events
WHERE event_type = 'DOCUMENT_IMPORTED'
ON CONFLICT DO NOTHING;

COMMIT;
