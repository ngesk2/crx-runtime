# Constitutional Kernel

This directory contains the constitutional truth substrate - the foundational primitives of the system.

## Foundational Primitives

These are the canonical primitives from which everything else is derived:

- **Provenance**: What happened?
- **Claim**: What is asserted?
- **Decision**: What was accepted?
- **Fact**: What is currently true?
- **Rule**: What constrains truth?

## Kernel Structure

```
kernel/
├── doctrine/         # Constitutional doctrine and principles
├── invariants/       # System invariants that must always hold
├── contracts/        # Constitutional contracts between components
└── decisions/       # Canonical decision records
```

## Constitutional Principles

1. **Events own truth, not agents**
2. **Lineage is immutable**
3. **Policy evaluation is mandatory**
4. **Replay validation is required**
5. **Audit is continuous**

## Kernel Invariants

The kernel maintains these invariants:
- All state transitions are event-sourced
- All events have complete lineage
- All policy decisions are recorded
- All mutations are replayable
- All audits are append-only
