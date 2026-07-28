# Replay — Queries (AI Navigation)

Where is the canonical replay implementation?
→ runtime/kernel/replay/replay_verification.ts

Who calls ReplayVerification?
→ runtime/adapters/express_commit_adapter.ts (call site)

What duplicates exist?
→ runtime/kernel/witness/replay-verifier.ts
→ runtime/kernel/replay/witness_authority.ts (verifyWitnessRoot)
→ replay_worker.py
→ repository_event_layer.py (verify_replay)

Which tests verify replay?
→ tests/certification/replay-*
