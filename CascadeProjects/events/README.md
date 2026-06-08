# Events Module

This module contains the canonical event system for the constitutional cognition substrate.

## Canonical Event Envelope

All events MUST use the canonical event envelope defined in `canonical-event-envelope.json`.

No competing event schemas are allowed.

## Event Types

Events are categorized into types:

### Constitutional Events
- `policy_evaluation`
- `constitutional_violation`
- `policy_update`

### Runtime Events
- `agent_execution`
- `tool_invocation`
- `workflow_start`
- `workflow_complete`

### Repository Events
- `repo_change`
- `commit_created`
- `branch_created`
- `pr_created`

### Lineage Events
- `lineage_append`
- `replay_validation`
- `audit_event`

## Event Flow

Required execution path:
```
Event
 → Policy
 → Assignment
 → Execution
 → Validation
 → Replay Check
 → Audit Event
```

## Event Ownership

Agents do NOT own truth.
Events own truth.

Agents may:
- analyze
- classify
- summarize
- propose
- validate
- repair
- generate diffs
- generate tests

Agents may NOT:
- mutate canonical truth directly
- bypass policy
- fabricate lineage
- overwrite history
- bypass replay validation
