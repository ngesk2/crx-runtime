# Replay Truth Audit Report
**Version:** Pre-Replay Execution  
**Context:** C:\Users\nolan\CRX  
**Classification:** Forensics (Read-Only)

---

## 1. Classification Matrix

| Capability / Semantics | Classification | File Location / Path | Proof / Evidence |
|---|---|---|---|
| Replay Double Execution | **DECLARED** | [UCIA-CONSTITUTION-v1.0.md](file:///C:/Users/nolan/CRX/knowledge/authoritative/UCIA-CONSTITUTION-v1.0.md), [replay-reconstruction.md](file:///C:/Users/nolan/CRX/knowledge/authoritative/replay-reconstruction.md) | Documented rules in knowledge base only. No executable ts/js runtime exists in CRX. |
| Replay Validation Logic | **DECLARED** (Observed in archive) | [JS.txt#deterministic_replay_harness.js](file:///C:/Users/nolan/Documents/Codex/2026-05-31/phase-1a-context-foundation-only-objective/crx/JS.txt) | Exists as archived JS code in Codex directory. Absent from active runtime. |
| Time Leakage Guard | **DECLARED** | [UCIA-CONSTITUTION-v1.0.md](file:///C:/Users/nolan/CRX/knowledge/authoritative/UCIA-CONSTITUTION-v1.0.md) | Standard time-seeding constraints documented. No live execution sandbox exists in CRX. |
| Event Lineage Anchor | **OBSERVED** (in database DDL) | [init-db.sql](file:///C:/Users/nolan/CascadeProjects/infra/scripts/init-db.sql) | DDL defines `lineage_chains` and `replay_snapshots` tables. |
| Cryptographic Proof of Replay | **DECLARED** (Observed in archive) | [JS.txt#merkle_anchor_replay_verifier.js](file:///C:/Users/nolan/Documents/Codex/2026-05-31/phase-1a-context-foundation-only-objective/crx/JS.txt) | Archived JavaScript verifiers exist in `JS.txt`. Absent from active runtime. |

---

## 2. Forensic Findings

### Replay Semantics Existing:
- **Specifications Only:** `knowledge/authoritative/replay-reconstruction.md` defines terms like `witness`, `reconstruction`, `entropy budget`, and `snapshot validation`.
- **Archived Code Only:** `JS.txt` contains an archived copy of `deterministic_replay_harness.js` and `merkle_anchor_replay_verifier.js`.

### Replay Assumptions:
- The system assumes that if events are committed to `persistence/artifact_store.ts` and `persistence/lineage_store.ts`, they are replay-ready.
- The system assumes that the execution engine can rerun events deterministically without capturing local system clock drift, floating-point rounding changes, or environment variations.

### Determinism Breakers:
- **No VM Isolation:** The active `commit-service` runtime does not execute inside a sandboxed VM or container. It runs directly inside Node.js (`ts-node src/server.ts`).
- **Time/Math Heuristics:** There is no override or virtualization of `Date.now()` or `Math.random()`, meaning any time-dependent or random code will drift upon replay.

### Infrastructure Dependencies:
- Replay requires Node.js, `express`, `pg`, and an external Postgres database. There is no offline, infrastructure-independent replay tool.

### Ordering and Versioning Gaps:
- **Undefined Replay Ordering:** Events are written to the database with a database-generated timestamp, exposing them to clock skew. There is no logical clock (e.g., Lamport timestamps) or monotonic counter enforced by the kernel.
- **Absent Versioning:** There is no schema versioning or policy versioning check executed at runtime to verify if the replay is running against historical schemas.
