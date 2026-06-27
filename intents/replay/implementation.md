# Replay — Implementation

## Architecture

```
Events → ReplayEventStream → ReplayTranscriptBuilder
                                         ↓
                            DeterministicReplayEngine
                            ├── ReplayStateMachine
                            ├── InvariantRunner
                            ├── WitnessAuthority → MerkleTree
                            └── ReplayVerification
                                         ↓
                              ReplayResult (deepFrozen)
```

## Files

| File | Purpose |
|------|---------|
| runtime/kernel/replay/deterministic_replay_engine.ts | Core replay execution engine |
| runtime/kernel/replay/replay_state_machine.ts | Deterministic state transitions |
| runtime/kernel/replay/replay_verification.ts | Verifies replay determinism |
| runtime/kernel/replay/replay-transcript.ts | Records execution history |
| runtime/kernel/replay/witness_authority.ts | Generates Merkle witness roots |
| runtime/kernel/replay/merkle_tree.ts | Domain-separated Merkle tree |
| runtime/kernel/replay/canonical_json.ts | RFC-8785 canonical JSON |
| runtime/kernel/replay/replay_event_stream.ts | Event stream abstraction |

## Dependencies

- crypto (commodity — no infrastructure)
- None on runtime/adapters/ or constitutional-compiler/
