# System Invariants

These invariants must always hold true. Violations trigger constitutional alerts.

## Event Invariants

### INV-001: Event Uniqueness
Every event has a unique UUID. No two events share the same event_id.

### INV-002: Event Immutability
Once created, events are never modified. Only new events may be created.

### INV-003: Event Lineage Completeness
Every event (except root events) must reference parent events in its lineage.

### INV-004: Event Timestamp Ordering
Event timestamps are monotonically increasing within a causal chain.

## Lineage Invariants

### INV-005: Lineage Append-Only
Lineage chains are append-only. Historical lineage is never modified.

### INV-006: Lineage Acyclicity
Lineage graphs must be acyclic. No event may be its own ancestor.

### INV-007: Lineage Traceability
Every event must be traceable to a root event via its lineage chain.

## Policy Invariants

### INV-008: Policy Evaluation Completeness
Every state transition must have a corresponding policy evaluation record.

### INV-009: Policy Version Consistency
All events within a policy version must be evaluated against that version.

### INV-010: Policy Decision Recording
All policy decisions (allow, deny, modify) must be recorded with reasoning.

## Replay Invariants

### INV-011: Replay Determinism
Replaying the event log from any snapshot must produce identical state.

### INV-012: Replay Validation Required
All mutations must pass replay validation before being accepted.

### INV-013: Snapshot Consistency
Replay snapshots must represent complete, consistent system state.

## Audit Invariants

### INV-014: Audit Append-Only
Audit records are append-only. Historical audit records are never modified.

### INV-015: Audit Completeness
All state transitions must have corresponding audit records.

### INV-016: Audit Attribution
Every audit record must attribute the actor responsible for the action.

## Fact Invariants

### INV-017: Fact Derivation
All facts must be derived from events via accepted claims.

### INV-018: Fact Temporal Validity
Facts have valid_from and valid_until timestamps. Only current facts are active.

### INV-019: Fact Uniqueness
Only one fact with a given key may be current at any time.

## Claim Invariants

### INV-020: Claim Validation
All claims must be validated before becoming facts.

### INV-021: Claim Source Attribution
Every claim must reference its source event.

### INV-022: Claim Status Tracking
Claims track their validation status (pending, accepted, rejected).
