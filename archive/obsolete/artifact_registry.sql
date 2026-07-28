-- artifact_registry.sql
-- Kernel Mirror artifact registry schema

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

CREATE INDEX IF NOT EXISTS idx_artifact_registry_path ON artifact_registry(canonical_path);
CREATE INDEX IF NOT EXISTS idx_artifact_registry_type ON artifact_registry(artifact_type);
