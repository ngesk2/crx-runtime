# Replay Boundary Audit

**Generated:** 2026-06-07  
**Audit:** CRX Layer 0 Phase 7 — Discovery (Read-Only)  
**Law:** Replay is frozen. No implementation.

---

## Replay Status

| Capability | Classification | Location |
|------------|----------------|----------|
| Replay double execution | DECLARED | UCIA-CONSTITUTION, replay-reconstruction.md |
| Replay harness (executable) | ABSENT | JS.txt archive only |
| Witness generation | DECLARED | Docs + JS.txt merkle modules |
| Witness (executable) | ABSENT | Active runtime |
| Deterministic sandbox | ABSENT | No VM isolation |
| Schema versioning at replay | ABSENT | No runtime check |
| Monotonic event counter | ABSENT | DB timestamps only |

---

## Replay Assumptions (Documented / Implicit)

| # | Assumption | Classification |
|---|------------|----------------|
| 1 | Committed artifacts in artifact_store + lineage_store are replay-ready | INFERENCE from runtime design |
| 2 | Events can be re-executed deterministically in Node.js | DECLARED — unverified |
| 3 | PostgreSQL state is reconstructible from event log | INFERENCE |
| 4 | Canonical hash is stable across environments | PARTIALLY OBSERVED — naive sorter |
| 5 | Policy decisions are recorded and replayable | DECLARED — no policy engine |
| 6 | Witness proofs can validate replay output | DECLARED — archived JS only |

---

## Replay Dependencies

| Dependency | Required For | Available |
|------------|--------------|-----------|
| Node.js | Runtime execution | YES |
| PostgreSQL | Event/artifact persistence | CONFIGURED not RUNNING |
| express | HTTP (not replay core) | YES |
| DATABASE_URL | DB connection | UNKNOWN value |
| JS.txt modules | Full replay harness | ARCHIVED only |
| plugin_execution_scheduler.js | Replay harness dep | ARCHIVED — unmapped |
| runtime_adapter.js | Replay harness dep | ARCHIVED — unmapped |
| VM / container sandbox | Deterministic isolation | NO |

---

## Determinism Breakers (Observed)

| Breaker | Evidence | Risk |
|---------|----------|------|
| No Date.now() virtualization | commit-service runs in bare Node | HIGH |
| No Math.random() override | Same | HIGH |
| DB insertion timestamps | event ordering | MEDIUM |
| No schema version gate | Replay against migrated schemas | HIGH |
| Identity=hash collapse | identity_engine.ts | HIGH |
| Transport-layer authority | commit_controller.ts | MEDIUM |

---

## Replay Violations (Authority Boundary)

| ID | Violation | Impact on Replay |
|----|-----------|------------------|
| V-003 | Identity collapses into hashing | Cross-domain collision on replay |
| V-004 | Hashing coupled to canonicalization | Cannot swap normalization law independently |
| V-001 | Transport mediates identity/lineage | Replay substrate mixed with HTTP layer |
| V-002 | DB constraints as truth | Replay state tied to migration history |

**Source:** `CRX/reports/authority_boundary_violations.md`

---

## Archived Replay Assets (Archaeological — Do Not Promote Without Amendment)

| Module | Location | Reusability (per forensic verdict) |
|--------|----------|-------------------------------------|
| canonical_fingerprint_service.js | JS.txt + integration-lab/extracted | SAFE (pure) |
| formal_invariant_graph_verifier.js | JS.txt + integration-lab/extracted | SAFE (pure) |
| deterministic_replay_harness.js | JS.txt | INSPIRATIONAL — deps unmapped |
| execution_integrity_auditor.js | JS.txt | INSPIRATIONAL — schema emergent |
| merkle_anchor_replay_verifier.js | JS.txt | DANGEROUS — external anchor assumptions |

---

## Minimum Replay-Safe Kernel (Forensic Recommendation)

Per `CRX/reports/FINAL_FORENSIC_VERDICT.md`:

> Zero-dependency TypeScript package containing `/canonical`, `/fingerprint`, and `/lineage` verifiers.

**Status:** NOT IMPLEMENTED

---

## What Must Not Be Done (Replay Freeze)

- Implement replay engine
- Import merkle_anchor modules into runtime
- Merge identity and fingerprint authorities
- Boot infra assuming replay readiness
- Treat CascadeProjects DDL as replay authority without reconciliation
