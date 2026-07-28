-- Migration 003: Populate authority_lineage + create artifact_registry

BEGIN;

-- ============================================================
-- 1. Create artifact_registry (referenced by lineage_search.py)
-- ============================================================
CREATE TABLE IF NOT EXISTS artifact_registry (
  artifact_id UUID PRIMARY KEY,
  artifact_type TEXT,
  canonical_path TEXT,
  sha256 TEXT,
  payload_hash TEXT,
  source_system TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  modified_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  lineage_root UUID,
  witness_root TEXT,
  status TEXT DEFAULT 'active'
);

-- Populate artifact_registry from authority_objects
INSERT INTO artifact_registry (artifact_id, artifact_type, sha256, payload_hash, source_system, status, created_at)
SELECT artifact_id, authority_type, sha256, payload_hash, source_system, status, created_at
FROM authority_objects
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. Populate authority_lineage with constitutional hierarchy
-- ============================================================
-- PING CONSTITUTION is root (no parent within this system)
-- Other constitutional laws are descendants of PING CONSTITUTION

INSERT INTO authority_lineage (id, ancestor, descendant, relation, metadata)
SELECT 
  gen_random_uuid(),
  (SELECT artifact_id FROM authority_objects WHERE title = 'PING CONSTITUTION'),
  ao.artifact_id,
  'derived_from',
  '{"authority": "constitutional_hierarchy", "description": "Derived from PING CONSTITUTION"}'
FROM authority_objects ao
WHERE ao.title IN ('REPLAY LAW', 'INFRASTRUCTURE LAW', 'MEMORY LAW', 'IDENTITY LAW')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. Update artifact_registry lineage_root for constitutional docs
-- ============================================================
UPDATE artifact_registry ar
SET lineage_root = (SELECT artifact_id FROM authority_objects WHERE title = 'PING CONSTITUTION')
WHERE ar.artifact_id IN (
  SELECT artifact_id FROM authority_objects WHERE title IN ('REPLAY LAW', 'INFRASTRUCTURE LAW', 'MEMORY LAW', 'IDENTITY LAW')
);

COMMIT;
