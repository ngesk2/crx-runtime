-- Lifecycle Checkpointing Table
-- Enables resumption from failed stages instead of restarting entire lifecycle

CREATE TABLE IF NOT EXISTS lifecycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  current_stage VARCHAR(100),
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  CONSTRAINT valid_status CHECK (status IN (
    'pending',
    'pending_github_snapshot',
    'pending_build_objects',
    'pending_persist',
    'pending_embedding',
    'pending_projection',
    'pending_analysis',
    'pending_reflection',
    'pending_mission',
    'pending_replay',
    'pending_witness',
    'complete',
    'failed'
  ))
);

CREATE INDEX IF NOT EXISTS idx_lifecycles_status ON lifecycles(status);
CREATE INDEX IF NOT EXISTS idx_lifecycles_started_at ON lifecycles(started_at DESC);

-- PostgreSQL indexes for events table (ConstitutionalObjects)
-- These indexes optimize queries for kind, authority, canonical_hash, and created_at

CREATE INDEX IF NOT EXISTS idx_events_kind ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_aggregate_type ON events(aggregate_type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_aggregate_id ON events(aggregate_id);

-- Index for canonical_hash in event_data JSONB
CREATE INDEX IF NOT EXISTS idx_events_canonical_hash ON events USING GIN ((event_data->>'canonical_hash') gin_trgm_ops);

-- Index for lifecycle_id in event_data metadata
CREATE INDEX IF NOT EXISTS idx_events_lifecycle_id ON events USING GIN ((event_data->'metadata'->>'lifecycle_id') gin_trgm_ops);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_events_type_timestamp ON events(event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_lifecycle_type ON events USING GIN ((event_data->'metadata'->>'lifecycle_id'), event_type);
CREATE INDEX IF NOT EXISTS idx_events_aggregate_timestamp ON events(aggregate_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_lifecycles_status_started ON lifecycles(status, started_at DESC);

-- Lifecycle stage checkpoints for detailed tracking
CREATE TABLE IF NOT EXISTS lifecycle_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lifecycle_id UUID NOT NULL REFERENCES lifecycles(id) ON DELETE CASCADE,
  stage_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  input_ids JSONB DEFAULT '[]',
  output_ids JSONB DEFAULT '[]',
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  CONSTRAINT valid_stage_status CHECK (status IN ('pending', 'running', 'complete', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_stages_lifecycle_id ON lifecycle_stages(lifecycle_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_stages_status ON lifecycle_stages(status);

-- Function to update lifecycle timestamp
CREATE OR REPLACE FUNCTION update_lifecycle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lifecycle_updated_at
  BEFORE UPDATE ON lifecycles
  FOR EACH ROW
  EXECUTE FUNCTION update_lifecycle_updated_at();
