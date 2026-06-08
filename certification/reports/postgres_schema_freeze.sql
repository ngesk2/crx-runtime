-- Constitutional Replay Kernel - Postgres Schema Freeze
-- Phase 7: Postgres Schema Freeze
-- Date: 2026-06-07
-- Certification: CRX-CK-2026-06-07-v1

-- ============================================
-- Required Tables
-- ============================================

-- replay_events
-- Stores: event_id, canonical_event_bytes, event_sequence, replay_stream_id
CREATE TABLE IF NOT EXISTS replay_events (
  event_id VARCHAR(255) PRIMARY KEY,
  canonical_event_bytes TEXT NOT NULL,
  event_sequence INTEGER NOT NULL,
  replay_stream_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- replay_states
-- Stores: replay_state_id, canonical_state_bytes, state_version, fingerprint_hash
CREATE TABLE IF NOT EXISTS replay_states (
  replay_state_id VARCHAR(255) PRIMARY KEY,
  canonical_state_bytes TEXT NOT NULL,
  state_version VARCHAR(50) NOT NULL,
  fingerprint_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- witness_roots
-- Stores: witness_root, witness_algorithm, witness_version, leaf_count, tree_height
CREATE TABLE IF NOT EXISTS witness_roots (
  witness_root VARCHAR(64) PRIMARY KEY,
  witness_algorithm VARCHAR(100) NOT NULL,
  witness_version VARCHAR(50) NOT NULL,
  leaf_count INTEGER NOT NULL,
  tree_height INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- lineage_edges
-- Stores: parent_id, child_id, edge_type
CREATE TABLE IF NOT EXISTS lineage_edges (
  id SERIAL PRIMARY KEY,
  parent_id VARCHAR(255) NOT NULL,
  child_id VARCHAR(255) NOT NULL,
  edge_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- invariant_violations
-- Stores: violation_id, invariant_id, canonical_violation_bytes
CREATE TABLE IF NOT EXISTS invariant_violations (
  violation_id VARCHAR(255) PRIMARY KEY,
  invariant_id VARCHAR(255) NOT NULL,
  canonical_violation_bytes TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- certification_vectors
-- Stores: vector_id, vector_hash, witness_root, fingerprint
CREATE TABLE IF NOT EXISTS certification_vectors (
  vector_id VARCHAR(255) PRIMARY KEY,
  vector_hash VARCHAR(64) NOT NULL,
  witness_root VARCHAR(64) NOT NULL,
  fingerprint VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- replay_artifacts
-- Stores: artifact_id, artifact_hash, artifact_lineage
CREATE TABLE IF NOT EXISTS replay_artifacts (
  artifact_id VARCHAR(255) PRIMARY KEY,
  artifact_hash VARCHAR(64) NOT NULL,
  artifact_lineage TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Constitutional Constraints
-- ============================================

-- Ensure canonical_event_bytes is not empty
ALTER TABLE replay_events
ADD CONSTRAINT chk_canonical_event_bytes_not_empty
CHECK (LENGTH(canonical_event_bytes) > 0);

-- Ensure canonical_state_bytes is not empty
ALTER TABLE replay_states
ADD CONSTRAINT chk_canonical_state_bytes_not_empty
CHECK (LENGTH(canonical_state_bytes) > 0);

-- Ensure fingerprint_hash is valid SHA256 (64 hex characters)
ALTER TABLE replay_states
ADD CONSTRAINT chk_fingerprint_hash_valid
CHECK (fingerprint_hash ~ '^[A-F0-9]{64}$');

-- Ensure witness_root is valid SHA256 (64 hex characters)
ALTER TABLE witness_roots
ADD CONSTRAINT chk_witness_root_valid
CHECK (witness_root ~ '^[A-F0-9]{64}$');

-- Ensure leaf_count is positive
ALTER TABLE witness_roots
ADD CONSTRAINT chk_leaf_count_positive
CHECK (leaf_count > 0);

-- Ensure tree_height is non-negative
ALTER TABLE witness_roots
ADD CONSTRAINT chk_tree_height_non_negative
CHECK (tree_height >= 0);

-- Ensure artifact_hash is valid SHA256 (64 hex characters)
ALTER TABLE replay_artifacts
ADD CONSTRAINT chk_artifact_hash_valid
CHECK (artifact_hash ~ '^[A-F0-9]{64}$');

-- ============================================
-- Schema Version
-- ============================================

-- Track schema version for migration purposes
CREATE TABLE IF NOT EXISTS schema_version (
  version VARCHAR(50) PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_version (version) VALUES ('1.0')
ON CONFLICT (version) DO NOTHING;

-- ============================================
-- Notes
-- ============================================

-- Constitutional Rule: SQL is storage only
-- - No canonicalization in SQL
-- - No witness generation in SQL
-- - No fingerprint generation in SQL
-- - No Merkle construction in SQL

-- All replay computation is performed by the constitutional kernel (runtime/replay/)
-- SQL stores only the pre-computed results
