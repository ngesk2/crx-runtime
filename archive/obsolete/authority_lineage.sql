-- authority_lineage.sql
-- Store parent-child relationships between authority objects

CREATE TABLE IF NOT EXISTS authority_lineage (
  id UUID PRIMARY KEY,
  authority_id UUID NOT NULL,
  parent_authority UUID NOT NULL,
  relationship_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_authority FOREIGN KEY(authority_id) REFERENCES authority_objects(authority_id) ON DELETE CASCADE,
  CONSTRAINT fk_parent FOREIGN KEY(parent_authority) REFERENCES authority_objects(authority_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_authority_lineage_authority ON authority_lineage(authority_id);
CREATE INDEX IF NOT EXISTS idx_authority_lineage_parent ON authority_lineage(parent_authority);
