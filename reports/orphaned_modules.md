# ORPHANED MODULES REPORT

**Generated:** 2026-06-07
**Mode:** READ-ONLY

---

## ORPHANED IN ACTIVE RUNTIME

### models/artifact.ts
- **Path:** `CRX/runtime/kernel/commit-service/src/models/artifact.ts`
- **Size:** 0 bytes (EMPTY)
- **Referenced by:** `commit_controller.ts` (lines 12-13 access `artifact.artifact_type` and `artifact.content`)
- **Orphan type:** Stale stub — file exists but has no content
- **Risk:** MEDIUM — Runtime accesses properties on an undefined type

### audit_controller.ts
- **Path:** `CRX/runtime/kernel/commit-service/src/api/audit_controller.ts`
- **LOC:** 14
- **Functionality:** Lists 100 most recent artifacts from PostgreSQL
- **Orphan type:** Incomplete implementation — named "audit" but performs no audit logic, no witness verification, no integrity checking
- **Risk:** LOW — Functional as a basic query endpoint, but misnamed

---

## ORPHANED IN ARCHIVE (Extracted JS.txt)

### Presentation/UI Modules (No UI System Exists)

| Module | LOC | Orphan Reason |
|--------|-----|---------------|
| `cross_anchor_drift_summary_presentation_adapter.js` | 154 | Depends on external visualization system |
| `overlay_rendering_contract_validator.js` | 387 | Depends on UI overlay system |
| `merkle_anchor_chain_multi_graph_visualizer.js` | 224 | Depends on graph visualization system |

### Worker System (No Worker Exists)

| Module | LOC | Orphan Reason |
|--------|-----|---------------|
| `worker_runtime_entry.js` | 70 | Worker entry point — no worker system in runtime |
| `worker_runtime_adapter.js` | 346 | Worker runtime adapter — no worker system |

### CI System (No CI Pipeline Exists Locally)

| Module | LOC | Orphan Reason |
|--------|-----|---------------|
| `constitutional_ci.yml` | ~50 (YAML) | CI config — references CI system that doesn't exist locally |
| `constitutional_ci_gate.js` | 872 | CI gate logic — depends on CI pipeline |

### Resource Management (No Resource Ceiling System)

| Module | LOC | Orphan Reason |
|--------|-----|---------------|
| `resource_ceiling_enforcer.js` | 300 | Resource limits — no integration path to runtime |

### Domain Lockfile (No Lockfile System)

| Module | LOC | Orphan Reason |
|--------|-----|---------------|
| `domain_lockfile_fingerprint_guard.js` | 52 | Domain lockfile — no lockfile system in runtime |

---

## ORPHANED IN INTEGRATION LAB

### Stale Inventories

| File | Status | Reason |
|------|--------|--------|
| `crx_repository_inventory.md` | STALE | Superseded by this analysis |
| `js_txt_analysis.csv` | STALE | Point-in-time analysis |

### Comparison Reports (Analysis Complete, Not Actioned)

All 6 comparison reports in `comparisons/` describe gaps between archive and runtime implementations. None have been actioned:
- `canonical_engine_vs_canonical_fingerprint_service.md`
- `commit_controller_vs_execution_integrity_auditor.md`
- `dag_validator_vs_formal_invariant_graph_verifier.md`
- `event_log_vs_deterministic_replay_harness.md`
- `identity_engine_vs_canonical_fingerprint_service.md` (2 variants)

---

## ORPHANED SCHEMAS

### Schemas With No Implementing Code

| Schema | Location | Orphan Reason |
|--------|----------|---------------|
| `witness-report.schema.json` | Codex/.../governance/schemas/ | No witness system to produce reports |
| `replay-audit.schema.json` | Codex/.../governance/schemas/ | No replay audit system |
| `deterministic-test.schema.json` | Codex/.../governance/schemas/ | No deterministic test system |
| `constitutional-pr.schema.json` | Codex/.../governance/schemas/ | No constitutional PR system |

### Schemas With No Database Tables

| Schema | Location | Orphan Reason |
|--------|----------|---------------|
| `constitutional-state.schema.json` | Codex/2026-06-04/outputs/ | No state computation engine |
| `capability.schema.json` | Codex/2026-06-04/outputs/ | No capability system |
| `fact.schema.json` | Codex/2026-06-04/outputs/ | No fact derivation engine |
| `invariant.schema.json` | Codex/2026-06-04/outputs/ | No invariant checking system |
| `obligation.schema.json` | Codex/2026-06-04/outputs/ | No obligation tracking system |

---

## ORPHANED CONSTITUTION LAWS

### Stub Files in Primary Archive

| File | Size | Status |
|------|------|--------|
| `constitution/03-replay.md` | 13 bytes (1 line: "# Replay Law") | STUB — No content |
| `constitution/10-witness-law.md` | 14 bytes (1 line: "# Witness Law") | STUB — No content |

### Laws With No Implementing Code

| Law | File | Implementation Status |
|-----|------|----------------------|
| Replay Law | `03-replay.md` (stub) | `deterministic_replay_harness.js` exists in archive but not integrated |
| Witness Law | `10-witness-law.md` (stub) | 15+ Merkle modules exist in archive but not integrated |
| Canonical Binary Law | `01-canonical-binary.md` | `canonical_fingerprint_service.js` exists but not integrated |
| Identity Law | `02-identity-law.md` | `identity_engine.ts` exists but incomplete |
| Failure Law | `04-failure-law.md` | No failure analysis system |
| Import Sovereignty Law | `05-import-sovereignty.md` | No import validation system |
| Mutation Law | `06-mutation-law.md` | No mutation governance system |
| Temporal Law | `07-temporal-law.md` | No temporal ordering system |
| Unicode Sovereignty Law | `08-unicode-sovereignty.md` | NFC normalization exists in archive but not runtime |
| DB Determinism Law | `09-db-determinism.md` | No DB-level determinism enforcement |

---

**Classification:** FACT (all orphans verified by direct inspection)
**Confidence:** HIGH
