# Replay — Mission

Provide deterministic, verifiable, and replayable execution of constitutional event streams.

## Why

Every constitutional decision, every authority resolution, every capability grant must be replayable from raw events. Replay is the foundation of trust in the constitutional system.

## What

- Record event execution history as transcripts
- Verify determinism: same events → same state
- Generate witness roots for cryptographic verification
- Support incremental and full replay modes

## Non-Goals

- Not responsible for witness verification (handled by witness intent)
- Not responsible for lineage tracking (handled separately)
- Not responsible for projection state management
