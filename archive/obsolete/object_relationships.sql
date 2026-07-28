-- object_relationships.sql
-- Relationship graph schema for Phase E.4

CREATE TABLE IF NOT EXISTS object_relationships (
  relationship_id UUID PRIMARY KEY,
  source_object_id UUID NOT NULL,
  target_object_id UUID NOT NULL,
  relationship_type TEXT NOT NULL,
  confidence REAL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_object_relationships_source ON object_relationships(source_object_id);
CREATE INDEX IF NOT EXISTS idx_object_relationships_target ON object_relationships(target_object_id);
CREATE INDEX IF NOT EXISTS idx_object_relationships_type ON object_relationships(relationship_type);
