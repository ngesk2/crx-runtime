-- authority_objects.sql
-- Schema for authority registry

CREATE TABLE IF NOT EXISTS authority_objects (
  authority_id UUID PRIMARY KEY,
  artifact_id UUID,
  authority_type TEXT NOT NULL,
  authority_level INTEGER NOT NULL,
  title TEXT,
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
