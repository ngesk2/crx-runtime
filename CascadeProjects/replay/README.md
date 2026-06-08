# Replay Engine

This directory contains the deterministic reconstruction subsystem.

## Replay Philosophy

The system must be reconstructable from the event log. Replay validation is mandatory for all mutations.

## Replay Principles

1. **Determinism**: Replaying the event log from any snapshot must produce identical state
2. **Validation**: All mutations must pass replay validation before being accepted
3. **Snapshots**: Replay snapshots represent complete, consistent system state
4. **Lineage Preservation**: Replay preserves complete causal lineage
5. **Audit Integration**: All replay operations are audited

## Replay Operations

### Snapshot Creation
- Capture complete system state at an event
- Store state hash for verification
- Record snapshot event with lineage

### Replay Execution
- Load snapshot
- Replay events from snapshot point
- Verify state hash at each step
- Detect divergences
- Generate replay validation event

### Divergence Detection
- Compare replayed state with current state
- Identify divergent events
- Generate divergence report
- Trigger repair workflow if needed

## Replay Validation

All mutations must:
1. Pass policy evaluation
2. Execute in isolated context
3. Generate replay validation event
4. Verify state hash consistency
5. Append to audit log

## Replay Risk Assessment

Replay operations assess:
- State divergence risk
- Lineage breakage risk
- Policy violation risk
- Determinism violations

## Replay Outputs

Replay generates:
- Replay timelines
- Lineage chains
- Event traces
- Policy decisions
- Execution graphs
- Constitutional violations
- Repair workflows
