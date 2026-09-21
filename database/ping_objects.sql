-- PING Social Object Schema
-- PATCH 3: Object Kernel
-- Date: 2026-09-20
-- Classification: PROJECTION / MATERIALIZED STATE
-- Rebuild Source: canonical event history (ping_events table)
-- NOTE: These tables are projections, NOT canonical state
-- Canonical truth resides in the ping_events table
-- These tables can be destroyed and rebuilt from canonical history

-- PING Objects Table
-- Stores all PING social objects (posts, profiles, etc.)
-- PROJECTION: Rebuildable from canonical event history
CREATE TABLE IF NOT EXISTS ping_objects (
  -- Identity (deterministic, content-addressed)
  object_id VARCHAR(255) PRIMARY KEY,
  schema VARCHAR(255) NOT NULL,
  
  -- Controller
  controller VARCHAR(255) NOT NULL,
  
  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Content
  content JSONB NOT NULL,
  
  -- References (to other objects)
  refs JSONB NOT NULL DEFAULT '[]',
  
  -- Visibility
  visibility VARCHAR(50) DEFAULT 'public',
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Constraints
  CHECK (schema LIKE 'ping.%@%'),
  CHECK (visibility IN ('public', 'private', 'followers')),
  CHECK (status IN ('active', 'tombstoned'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ping_objects_controller ON ping_objects(controller);
CREATE INDEX IF NOT EXISTS idx_ping_objects_schema ON ping_objects(schema);
CREATE INDEX IF NOT EXISTS idx_ping_objects_created_at ON ping_objects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ping_objects_visibility ON ping_objects(visibility);
CREATE INDEX IF NOT EXISTS idx_ping_objects_status ON ping_objects(status);
CREATE INDEX IF NOT EXISTS idx_ping_objects_content_gin ON ping_objects USING GIN(content);

-- PING Relationships Table
-- Stores relationships between actors and objects (follows, replies, references)
-- PROJECTION: Rebuildable from canonical event history
CREATE TABLE IF NOT EXISTS ping_relationships (
  -- Identity (deterministic)
  relationship_id VARCHAR(255) PRIMARY KEY,
  
  -- Subject (who is relating)
  subject VARCHAR(255) NOT NULL,
  
  -- Predicate (type of relationship)
  predicate VARCHAR(255) NOT NULL,
  
  -- Object (what is being related to)
  object VARCHAR(255) NOT NULL,
  
  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Constraints
  -- 2026-09-21: predicate vocabulary reconciled with runtime/constitutional/src/ping-vocabulary.ts.
  -- 'references' and 'mentions' removed: no defined semantics, no projector handling, no live use.
  -- They are RESERVED (not forbidden); reintroduction requires a vocabulary decision plus projector semantics.
  CHECK (predicate IN ('follows', 'likes', 'replies_to', 'approves', 'denies')),
  CHECK (status IN ('active', 'inactive')),
  UNIQUE (subject, predicate, object)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ping_relationships_subject ON ping_relationships(subject);
CREATE INDEX IF NOT EXISTS idx_ping_relationships_object ON ping_relationships(object);
CREATE INDEX IF NOT EXISTS idx_ping_relationships_predicate ON ping_relationships(predicate);
CREATE INDEX IF NOT EXISTS idx_ping_relationships_status ON ping_relationships(status);
CREATE INDEX IF NOT EXISTS idx_ping_relationships_subject_predicate ON ping_relationships(subject, predicate);

-- PING Transitions Table
-- Immutable transitions representing state changes (create, relate, propose, approve, publish, tombstone)
-- PROJECTION: Rebuildable from canonical event history
CREATE TABLE IF NOT EXISTS ping_transitions (
  -- Identity (deterministic)
  transition_id VARCHAR(255) PRIMARY KEY,
  
  -- Target object
  object_id VARCHAR(255) NOT NULL,
  
  -- Operation
  operation VARCHAR(255) NOT NULL,
  
  -- Actor
  actor_id VARCHAR(255) NOT NULL,
  
  -- Sequence (per object)
  sequence BIGINT NOT NULL,
  
  -- Previous transition (for chaining)
  previous_transition VARCHAR(255),
  
  -- Content hash (for verification)
  payload_hash VARCHAR(255) NOT NULL,
  
  -- Timing
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Proof (signature, verification method)
  proof JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Constraints
  -- 2026-09-21: operation vocabulary reconciled with ping-vocabulary.ts (create/update/relate).
  -- Legacy 'unrelate' retired: revocation is status 'inactive' on the same predicate, projected as
  -- operation 'relate' with relationship_status in transition metadata. 'propose'/'approve'/'publish'/'tombstone'
  -- retired: no journal events, no projector paths, no live rows; preserved in git history.
  CHECK (operation IN ('create', 'update', 'relate')),
  UNIQUE (object_id, sequence)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ping_transitions_object_id ON ping_transitions(object_id);
CREATE INDEX IF NOT EXISTS idx_ping_transitions_actor_id ON ping_transitions(actor_id);
CREATE INDEX IF NOT EXISTS idx_ping_transitions_operation ON ping_transitions(operation);
CREATE INDEX IF NOT EXISTS idx_ping_transitions_timestamp ON ping_transitions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ping_transitions_previous ON ping_transitions(previous_transition);

-- Trigger to prevent updates (append-only)
CREATE OR REPLACE FUNCTION prevent_transition_updates()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'ping_transitions table is append-only. Updates are not allowed.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_transition_updates ON ping_transitions;
CREATE TRIGGER trigger_prevent_transition_updates
  BEFORE UPDATE ON ping_transitions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_transition_updates();

-- Trigger to prevent deletes
CREATE OR REPLACE FUNCTION prevent_transition_deletes()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'ping_transitions table is append-only. Deletes are not allowed.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_transition_deletes ON ping_transitions;
CREATE TRIGGER trigger_prevent_transition_deletes
  BEFORE DELETE ON ping_transitions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_transition_deletes();
