-- Constitutional Replay Kernel - Postgres Index Freeze
-- Phase 8: Replay Index Architecture
-- Date: 2026-06-07
-- Certification: CRX-CK-2026-06-07-v1

-- ============================================
-- Required Indexes
-- ============================================

-- replay_events
-- Index on replay_stream_id and event_sequence for ordered event retrieval
CREATE INDEX IF NOT EXISTS idx_replay_stream_sequence
ON replay_events(replay_stream_id, event_sequence);

-- witness_roots
-- Unique index on witness_root for deduplication and fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_witness_root
ON witness_roots(witness_root);

-- lineage_edges
-- Index on parent_id for parent-to-child lookups
CREATE INDEX IF NOT EXISTS idx_lineage_parent
ON lineage_edges(parent_id);

-- Index on child_id for child-to-parent lookups
CREATE INDEX IF NOT EXISTS idx_lineage_child
ON lineage_edges(child_id);

-- replay_states
-- Index on fingerprint_hash for state lookup by fingerprint
CREATE INDEX IF NOT EXISTS idx_state_fingerprint
ON replay_states(fingerprint_hash);

-- ============================================
-- Additional Performance Indexes
-- ============================================

-- replay_events
-- Index on event_id for fast event lookup
CREATE INDEX IF NOT EXISTS idx_replay_event_id
ON replay_events(event_id);

-- Index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_replay_events_created_at
ON replay_events(created_at);

-- replay_states
-- Index on state_version for version filtering
CREATE INDEX IF NOT EXISTS idx_state_version
ON replay_states(state_version);

-- Index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_replay_states_created_at
ON replay_states(created_at);

-- witness_roots
-- Index on witness_algorithm for algorithm filtering
CREATE INDEX IF NOT EXISTS idx_witness_algorithm
ON witness_roots(witness_algorithm);

-- Index on witness_version for version filtering
CREATE INDEX IF NOT EXISTS idx_witness_version
ON witness_roots(witness_version);

-- Index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_witness_roots_created_at
ON witness_roots(created_at);

-- lineage_edges
-- Index on edge_type for type filtering
CREATE INDEX IF NOT EXISTS idx_lineage_edge_type
ON lineage_edges(edge_type);

-- Index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_lineage_edges_created_at
ON lineage_edges(created_at);

-- invariant_violations
-- Index on invariant_id for violation lookup by invariant
CREATE INDEX IF NOT EXISTS idx_violation_invariant_id
ON invariant_violations(invariant_id);

-- Index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_invariant_violations_created_at
ON invariant_violations(created_at);

-- certification_vectors
-- Index on vector_hash for hash lookup
CREATE INDEX IF NOT EXISTS idx_certification_vector_hash
ON certification_vectors(vector_hash);

-- Index on witness_root for witness lookup
CREATE INDEX IF NOT EXISTS idx_certification_witness_root
ON certification_vectors(witness_root);

-- Index on fingerprint for fingerprint lookup
CREATE INDEX IF NOT EXISTS idx_certification_fingerprint
ON certification_vectors(fingerprint);

-- Index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_certification_vectors_created_at
ON certification_vectors(created_at);

-- replay_artifacts
-- Index on artifact_hash for hash lookup
CREATE INDEX IF NOT EXISTS idx_artifact_hash
ON replay_artifacts(artifact_hash);

-- Index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_replay_artifacts_created_at
ON replay_artifacts(created_at);

-- ============================================
-- Index Version
-- ============================================

-- Track index version for migration purposes
CREATE TABLE IF NOT EXISTS index_version (
  version VARCHAR(50) PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO index_version (version) VALUES ('1.0')
ON CONFLICT (version) DO NOTHING;

-- ============================================
-- Notes
-- ============================================

-- Constitutional Rule: SQL is storage only
-- - Indexes are for query performance only
-- - No computation in indexes
-- - No canonicalization in indexes
-- - No witness generation in indexes

-- All replay computation is performed by the constitutional kernel (runtime/replay/)
-- SQL stores and indexes only the pre-computed results
