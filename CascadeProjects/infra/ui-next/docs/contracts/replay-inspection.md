# Replay inspection contract (minimal, exposes the existing engine)

Status: CONTRACT DEFINITION. No new replay engine, no new event bus, no new store.
This contract exposes what PING's replay machinery already records.

## What exists today (verified 2026-10-04, main ping repo)

### `replay_proof` artifacts
`ReplayArtifact.produce()` in
`ping-runtime/orchestration/execution/artifact_authorities.js` (line 240).
Every replay proof already carries:

| Field | Type | Notes |
|---|---|---|
| workerId | string | executor that ran the replay |
| missionId | string | mission the replay belongs to |
| functions | string[] | functions exercised |
| events | string[] | event ids covered |
| hash | string | proof hash (compare original vs replay) |
| deterministic | boolean | whether the replay was deterministic |
| duration | number | wall time |
| result | string | outcome (`'unknown'` when inconclusive) |
| confidence | number | 0–1 |

### `witness` artifacts
`WitnessArtifact.produce()` in the same file (line ~258):

| Field | Type | Notes |
|---|---|---|
| workerId | string | |
| missionId | string | |
| artifactId | string | the artifact witnessed |
| artifactHash | string | content hash at witness time |
| witnessType | string | `'content'` default |
| signature | string \| null | authority signature when present |
| confidence | number | 1.0 for witnesses |

### Aggregates (already served)
`GET /system/state` → `replay: { total_runs, success_rate, failures,
latest_replay, witness_coverage }`. Counts only — no per-run detail.

## Proposed read contract (new gateway surface, existing data)

`GET /api/v1/replay/proofs?missionId=&limit=`
→ `{ proofs: ReplayProof[] }` where ReplayProof is the artifact above plus
`proofId` and `producedAt` from the artifact store envelope.

`GET /api/v1/witnesses?artifactId=&missionId=`
→ `{ witnesses: Witness[] }` with the witness fields above.

Both are pure projections over the existing artifact store. No new authority,
no new semantics — the UI finally opens what the backend already knows.

## Genuinely missing (needs backend work before the visual replay story)

1. **Per-stage replay records.** Nothing today records stage-by-stage
   (stageId, type, actor, inputDigest, outputDigest, timing). The visual
   ORIGINAL ↔ REPLAY comparison cannot be built until the engine emits these.
2. **Replay trigger.** No UI-callable verb starts a replay; `ReplayWorker`
   (`ping-runtime/agents/replay_worker.js`) is a 27-line stub extending
   BaseWorker with no trigger path wired to the gateway.
3. **`differences[]`.** No structured diff between original and replay output
   exists; `hash` comparison is the only divergence signal today.

UI rule until these land: replay surfaces render from proofs/witnesses only,
with honest "per-stage detail unavailable" states. No fake replay.
