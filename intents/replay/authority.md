# Replay — Authority

## Sole Authority

| Authority | Owner | Status |
|-----------|-------|--------|
| ReplayTranscript | runtime/kernel/replay/replay-transcript.ts | IMPLEMENTED |
| ReplayVerification | runtime/kernel/replay/replay_verification.ts | IMPLEMENTED |
| ReplayExecution | runtime/kernel/replay/deterministic_replay_engine.ts | IMPLEMENTED |
| WitnessAuthority | runtime/kernel/replay/witness_authority.ts | IMPLEMENTED |
| CertificateAuthority | runtime/kernel/witness/certificate_authority.ts | IMPLEMENTED |
| MerkleTree | runtime/kernel/replay/merkle_tree.ts | IMPLEMENTED |

## Duplicate Authorities (being eliminated)

| File | Classification | Action |
|------|---------------|--------|
| runtime/kernel/witness/replay-verifier.ts | DuplicateAlgorithm | Consolidate → call canonical |
| runtime/kernel/replay/witness_authority.ts verifyWitnessRoot | DuplicateAlgorithm | Consolidate → call ReplayVerification |
| replay_worker.py | DuplicateAlgorithm | Delete (Python duplicate) |
| repository_event_layer.py verify_replay | DuplicateAlgorithm | Delete (filesystem domain) |
| workers/replay_worker.py | Stub | Implement as adapter |
