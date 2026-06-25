-- Constitutional Freeze Registry Seed Data
-- Purpose: Populate registry with kernel constitutional documents
-- Authority: CONSTITUTIONAL_LAW
-- Status: SEED DATA ONLY
-- Version: 1.0
-- Date: 2026-06-24
-- Dependencies: constitutional_freeze_registry.sql must be run first

-- Insert kernel constitutional documents
INSERT INTO constitutional_freeze_registry (
    document_id,
    file_path,
    authority_class,
    status,
    kernel_position,
    sha256_hash,
    hash_algorithm,
    hash_encoding,
    frozen_at,
    frozen_by,
    freeze_reason,
    dependencies,
    dependents,
    metadata,
    created_by,
    updated_by
) VALUES
(
    'TRUTH_LAW',
    'constitution/TRUTH_LAW.md',
    'CONSTITUTIONAL_LAW',
    'FROZEN',
    'root_law',
    '6e3ee57fd969a50db97a4e408dbd3f97708b32b9c1d48ed626b4a76b5c079a48',
    'SHA256',
    'hexadecimal_lowercase',
    '2026-06-24 00:00:00+00',
    'constitutional_audit',
    'Root constitutional law defining truth as immutable verified event',
    '[]'::jsonb,
    '["EVENT_LAW", "IDENTITY_LAW", "MUTATION_LAW", "TIME_LAW", "STATE_TRANSITION_LAW", "REPLAY_LAW", "WITNESS_LAW", "AUTHORITY_TAXONOMY_SPEC", "GOVERNANCE", "retrieval_law", "source_of_truth_law", "invariant_law"]'::jsonb,
    '{"root_law": true, "supersedes": ["source_of_truth_law.md", "OBJECT_STATE_LAW.md"], "constitutional_primitives": ["truth", "immutable_verified_event"]}'::jsonb,
    'constitutional_audit',
    'constitutional_audit'
),
(
    'EVENT_LAW',
    'constitution/EVENT_LAW.md',
    'CONSTITUTIONAL_LAW',
    'FROZEN',
    'ontological',
    '4765d8ee3c1d0aa8f796e174d3d3ae67210e74684d9d19731bdd76d4f68c306c',
    'SHA256',
    'hexadecimal_lowercase',
    '2026-06-24 00:00:00+00',
    'constitutional_audit',
    'Event ontology and classification - events are sole primitive for constitutional truth',
    '["TRUTH_LAW"]'::jsonb,
    '["REPLAY_LAW", "STATE_TRANSITION_LAW", "TIME_LAW", "WITNESS_LAW"]'::jsonb,
    '{"event_classes": ["Constitutional", "Governance", "Observation", "Inference", "Projection", "System"], "sole_primitive": true}'::jsonb,
    'constitutional_audit',
    'constitutional_audit'
),
(
    'IDENTITY_LAW',
    'vault/constitutional/immutable/IDENTITY_LAW.md',
    'CONSTITUTIONAL_LAW',
    'FROZEN',
    'ontological',
    'e34fb6957484efe1ead5db864fbee127c07f408e99a2014b6396b1dd2dfa1577',
    'SHA256',
    'hexadecimal_lowercase',
    '2026-06-24 00:00:00+00',
    'constitutional_audit',
    'Constitutional identity determinism, immutability, and content-addressability',
    '["TRUTH_LAW", "REPLAY_LAW"]'::jsonb,
    '["WITNESS_LAW", "MUTATION_LAW"]'::jsonb,
    '{"identity_types": ["content_hash", "deterministic_uuid_v5"], "prohibited_identifiers": ["random_uuid", "mutable_identifier", "temporary_identifier", "file_path", "insertion_ordering"]}'::jsonb,
    'constitutional_audit',
    'constitutional_audit'
),
(
    'MUTATION_LAW',
    'constitution/mutation_law.md',
    'CONSTITUTIONAL_LAW',
    'FROZEN',
    'ontological',
    '173a30dcb2e3a65102b89380b54a6991c9e833e9030dfb4e48e94fb399af88ed',
    'SHA256',
    'hexadecimal_lowercase',
    '2026-06-24 00:00:00+00',
    'constitutional_audit',
    'Mutation authorization and legality - prevents unauthorized state changes',
    '["TRUTH_LAW", "STATE_TRANSITION_LAW"]'::jsonb,
    '["AGENT_CONSTITUTION"]'::jsonb,
    '{"legal_mutation_pipeline": ["Proposal", "Claim", "Policy Evaluation", "Policy Decision", "Event Recording", "Replay", "Witness", "State Promotion"], "no_mutation_without_recorded_policy": true}'::jsonb,
    'constitutional_audit',
    'constitutional_audit'
),
(
    'TIME_LAW',
    'constitution/TIME_LAW.md',
    'CONSTITUTIONAL_LAW',
    'FROZEN',
    'ontological',
    'a76941589ab23b5fcdc0d68f8aa7860bd9f4748d892d8e659cef3166c3b70d9d',
    'SHA256',
    'hexadecimal_lowercase',
    '2026-06-24 00:00:00+00',
    'constitutional_audit',
    'Constitutional time as event order - prohibits wall clock, system clock, network time',
    '["TRUTH_LAW", "EVENT_LAW", "REPLAY_LAW"]'::jsonb,
    '[]'::jsonb,
    '{"prohibited_time_sources": ["wall_clock", "system_clock", "network_time"], "constitutional_time": "event_order", "append_only": true}'::jsonb,
    'constitutional_audit',
    'constitutional_audit'
),
(
    'STATE_TRANSITION_LAW',
    'constitution/STATE_TRANSITION_LAW.md',
    'CONSTITUTIONAL_LAW',
    'FROZEN',
    'ontological',
    '29e9ca269221232368ce80aaba0e431d1911713f7b001dcccf678ffd4045d07d',
    'SHA256',
    'hexadecimal_lowercase',
    '2026-06-24 00:00:00+00',
    'constitutional_audit',
    'State transition semantics - prohibits illegal transitions and state regression',
    '["TRUTH_LAW", "EVENT_LAW"]'::jsonb,
    '["MUTATION_LAW"]'::jsonb,
    '{"prohibited_transitions": ["state_regression", "terminal_state_transition", "verification_bypass"], "state_machines": ["Claim", "Verification", "Event"]}'::jsonb,
    'constitutional_audit',
    'constitutional_audit'
),
(
    'REPLAY_LAW',
    'vault/constitutional/immutable/REPLAY_LAW.md',
    'CONSTITUTIONAL_LAW',
    'FROZEN',
    'ontological',
    '48e610b710f7a161b118b660264c502f87bf7e1c5f569d012bedf3194c4a960b',
    'SHA256',
    'hexadecimal_lowercase',
    '2026-06-24 00:00:00+00',
    'constitutional_audit',
    'Replay determinism, reproducibility, and idempotence - same event stream produces same state',
    '["TRUTH_LAW"]'::jsonb,
    '["IDENTITY_LAW", "TIME_LAW", "WITNESS_LAW"]'::jsonb,
    '{"replay_properties": ["deterministic", "reproducible", "idempotent"], "error_handling": "convert_all_errors_to_events", "never_raise_exceptions": true}'::jsonb,
    'constitutional_audit',
    'constitutional_audit'
),
(
    'WITNESS_LAW',
    'vault/constitutional/immutable/WITNESS_LAW.md',
    'CONSTITUTIONAL_LAW',
    'FROZEN',
    'ontological',
    '1693e1a559794a69aedb2e574b261b39da6a1f1c440b360c22a91851546bd48f',
    'SHA256',
    'hexadecimal_lowercase',
    '2026-06-24 00:00:00+00',
    'constitutional_audit',
    'Witness generation and verification - deterministic evidence artifact for proving replay correctness',
    '["TRUTH_LAW", "EVENT_LAW", "IDENTITY_LAW", "REPLAY_LAW"]'::jsonb,
    '["CONSTITUTIONAL_SNAPSHOT_SPEC"]'::jsonb,
    '{"witness_flow": ["Event Stream", "Canonicalization", "Fingerprint", "Lineage Verification", "Replay State", "Witness Root"], "witness_properties": ["deterministic", "pure", "infrastructure_independent", "verifiable"]}'::jsonb,
    'constitutional_audit',
    'constitutional_audit'
),
(
    'AUTHORITY_TAXONOMY_SPEC',
    'AUTHORITY_TAXONOMY_SPEC.md',
    'CONSTITUTIONAL_LAW',
    'CONSTITUTIONAL_FREEZE',
    'ontological',
    '1a7873771e11b92187c50db087f5ee89d6e9d38fa6e3e4f4d1de6f363e95603c',
    'SHA256',
    'hexadecimal_lowercase',
    '2026-06-24 00:00:00+00',
    'constitutional_audit',
    'Constitutional authority taxonomy - classifies authority and truth-defining permissions',
    '["TRUTH_LAW"]'::jsonb,
    '["GOVERNANCE", "AGENT_CONSTITUTION"]'::jsonb,
    '{"authority_categories": ["Constitutional Law", "Governance", "Runtime", "Discovery", "Search", "AI"], "constitutional_law": ["defines_constitutional_truth", "defines_constitutional_ordering", "defines_constitutional_interpretation"]}'::jsonb,
    'constitutional_audit',
    'constitutional_audit'
),
(
    'CONSTITUTION',
    'vault/constitutional/immutable/CONSTITUTION.md',
    'CONSTITUTIONAL_LAW',
    'FOUNDATIONAL',
    'foundational',
    'f0712cb735c4550b5b93db86629bd11aabd641762a605d75af6dfecf4244dfaa',
    'SHA256',
    'hexadecimal_lowercase',
    '2026-06-24 00:00:00+00',
    'constitutional_audit',
    'Foundational constitutional architecture - immutable architectural principles for PING',
    '[]'::jsonb,
    '["TRUTH_LAW", "layering_law"]'::jsonb,
    '{"core_principles": ["Local First", "Self Hosted", "Privacy Preserving", "Deterministic", "Event Sourced", "Content Addressable", "Reproducible"], "architectural_layers": ["Constitutional Truth (Layers 0-2)", "Disposable Projections (Layers 3-5)"]}'::jsonb,
    'constitutional_audit',
    'constitutional_audit'
);

-- Insert initial audit log entries for freeze actions
INSERT INTO constitutional_freeze_audit_log (
    document_id,
    action,
    action_type,
    actor,
    action_timestamp,
    old_sha256_hash,
    new_sha256_hash,
    reason,
    action_metadata,
    constitutional_compliance,
    registry_id
)
SELECT 
    document_id,
    'FREEZE',
    'initial_freeze',
    'constitutional_audit',
    '2026-06-24 00:00:00+00',
    NULL,
    sha256_hash,
    'Initial constitutional freeze for kernel document',
    '{"phase": "Phase 6", "audit": "constitutional_discovery_audit"}'::jsonb,
    true,
    id
FROM constitutional_freeze_registry;

-- Insert initial verification log entries
INSERT INTO constitutional_verification_log (
    document_id,
    verification_type,
    verified_by,
    verification_timestamp,
    verification_method,
    expected_sha256_hash,
    actual_sha256_hash,
    hash_match,
    content_integrity,
    dependency_integrity,
    verification_result,
    verification_notes,
    registry_id
)
SELECT 
    document_id,
    'hash',
    'constitutional_audit',
    '2026-06-24 00:00:00+00',
    'SHA256_file_hash',
    sha256_hash,
    sha256_hash,
    true,
    true,
    true,
    'passed',
    'Initial hash verification during constitutional freeze',
    id
FROM constitutional_freeze_registry;

-- Seed data complete
-- Total kernel documents inserted: 10
-- Total audit log entries: 10
-- Total verification log entries: 10
-- Next step: Phase 7 - Witness Root Planning
