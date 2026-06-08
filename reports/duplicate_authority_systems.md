# DUPLICATE AUTHORITY SYSTEMS REPORT

**Generated:** 2026-06-07
**Mode:** READ-ONLY

---

## FINGERPRINT AUTHORITY DUPLICATION

### Three Competing Systems

| System | Location | LOC | Domain Separation | Verification | Schema Version | Recommendation |
|--------|----------|-----|-------------------|--------------|----------------|----------------|
| `canonical_fingerprint_service.js` | constitutional-integration-lab/extracted/js_txt/ | 479 | YES (14 domains) | YES (verifyFingerprint) | fingerprint.schema.3.0 | **PROMOTE** — Strictly superior |
| `identity_engine.ts` | CRX/runtime/kernel/commit-service/src/engines/ | 15 | NO | NO | NONE | **REPLACE** — Incomplete |
| `canonical_engine.ts` | CRX/runtime/kernel/commit-service/src/engines/ | 18 | NO | NO | NONE | **REPLACE** — Incomplete |

**Evidence of duplication:**
- `canonical_fingerprint_service.js` exports `canonicalize()`, `fingerprint()`, `fingerprintWithDomain()`, `verifyFingerprint()`
- `identity_engine.ts` exports `computeCanonicalHash()` which calls `canonicalize()` from `canonical_engine.ts`
- Both produce SHA-256 hex hashes but with different preimage construction
- The runtime version lacks: domain separation, NFC normalization, circular detection, type rejection, verification, schema version tracking

**Risk:** CRITICAL — Active runtime produces non-deterministic fingerprints for Unicode variants.

---

## LINEAGE AUTHORITY DUPLICATION

### Two Competing Systems

| System | Location | LOC | Full Cycle Detection | Graph Fingerprinting | Invariant Binding | Recommendation |
|--------|----------|-----|---------------------|---------------------|-------------------|----------------|
| `formal_invariant_graph_verifier.js` | constitutional-integration-lab/extracted/js_txt/ | 262 | YES (DFS) | YES | YES (9 nodes, 8 required edges) | **PROMOTE** — Strictly superior |
| `dag_validator.ts` | CRX/runtime/kernel/commit-service/src/validation/ | 13 | NO (direct self-loop only) | NO | NO | **REPLACE** — Incomplete |

**Evidence of duplication:**
- `formal_invariant_graph_verifier.js` exports `verifyInvariantGraph()` with full DFS cycle detection, required/forbidden edge verification, graph fingerprinting
- `dag_validator.ts` exports `validateLineage()` which only checks `parentIds.includes(childId)` and duplicate detection
- Both validate lineage/DAG structure but at vastly different completeness levels

**Risk:** CRITICAL — Active runtime allows transitive cycles (A→B→C→A).

---

## EVENT SCHEMA DUPLICATION

### Five Competing Schemas

| Schema | Location | Fields | Event ID | Fingerprint | Lineage | Replay Ordering | Recommendation |
|--------|----------|--------|----------|-------------|---------|-----------------|----------------|
| `canonical-event-envelope.json` | CascadeProjects/events/ | 7 required | UUID v4 | No (schema only) | YES (parent_event_ids, causal_chain) | ISO 8601 timestamp | **PROMOTE** — Most complete |
| `init-db.sql` (events table) | constitutional-integration-lab/extracted/schemas/ | 8 columns | UUID v4 | No | JSONB lineage | timestamptz | **PROMOTE** — Matches envelope |
| `audit-event.schema.json` | CRX/vos/cos/schema/ | 8 fields | String | No | YES | ISO 8601 | **QUARANTINE** — Audit domain only |
| `claim.schema.json` | CRX/knowledge/authoritative/ | 9 required | UUID v4 | No | No | ISO 8601 | **QUARANTINE** — UCIA domain only |
| `event_log.ts` (runtime) | CRX/runtime/ | 2 fields | SERIAL | No | No | DEFAULT NOW() | **REPLACE** — Minimal |

**Evidence of duplication:**
- Each schema defines a different event structure
- No single schema governs all events
- The runtime `event_log.ts` uses the most minimal structure (event_type + payload only)

**Risk:** HIGH — Event substrate is fragmented, replay ordering not guaranteed.

---

## VALIDATOR DUPLICATION

### Multiple Overlapping Validators

| Validator | Location | LOC | Validates | Used By |
|-----------|----------|-----|-----------|---------|
| `formal_invariant_graph_verifier.js` | Archive | 262 | Invariant topology DAG | deterministic_replay_harness.js |
| `dag_validator.ts` | Runtime | 13 | Lineage edge (shallow) | commit_controller.ts |
| `plugin_contract_validator.js` | Archive | 422 | Plugin contracts | plugin_execution_scheduler.js |
| `merkle_anchor_chain_validator.js` | Archive | 220 | Merkle anchor chain | Standalone |
| `artifact_reversibility_validator.js` | Archive | 400 | Artifact reversibility | Standalone |
| `artifact_firewall.js` | Archive | 202 | Artifact security | Standalone |
| `snapshot_lineage_integrity_guard.js` | Archive | 282 | Snapshot lineage | Standalone |
| `execution_integrity_auditor.js` | Archive | 395 | Execution bundle integrity | Standalone |
| `authority_boundary_prover.js` | Archive | 342 | Authority boundary | Standalone |
| `domain_lockfile_fingerprint_guard.js` | Archive | 52 | Domain lockfile | Standalone |
| `registry_freeze_verifier.js` | Archive | 376 | Registry freeze | Standalone |
| `consensus_quorum_validator.js` | Archive | 255 | Consensus quorum | Standalone |

**Note:** Many of these validators serve different domains and are NOT duplicates. The true duplicates are:
- `formal_invariant_graph_verifier.js` vs `dag_validator.ts` (both validate DAG structure)

---

## AUDIT SYSTEM DUPLICATION

### Three Audit-Related Systems

| System | Location | LOC | Audit Type |Recommendation |
|--------|----------|-----|------------|---------------|
| `execution_integrity_auditor.js` | Archive | 395 | Execution bundle integrity | **PROMOTE** — Complete |
| `determinism_stress_harness.js` | Archive | 221 | Determinism stress testing | **QUARANTINE** — Test-only |
| `structural_identity_stability_test_suite.js` | Archive | 311 | Structural identity testing | **QUARANTINE** — Test-only |
| `audit_controller.ts` | Runtime | 14 | Artifact listing (not audit) | **REPLACE** — Not an audit |

**Note:** Only `execution_integrity_auditor.js` is a production audit system. The others are test harnesses. `audit_controller.ts` is misnamed — it only lists artifacts.

---

## PERSISTENCE DUPLICATION

### Two Competing Persistence Schemas

| Schema | Location | Tables | Replay Tables | Recommendation |
|--------|----------|--------|---------------|----------------|
| `init-db.sql` | constitutional-integration-lab/extracted/schemas/ | 10+ (events, policy_evaluations, lineage_chains, replay_snapshots, constitutional_violations, agent_executions, facts, claims, rules, audit_log) | YES (replay_snapshots, lineage_chains) | **PROMOTE** — Complete |
| `ledger_schema.sql` | CRX/runtime/ | 3 (artifacts, lineage_edges, execution_events) | NO | **REPLACE** — Incomplete |

**Evidence of duplication:**
- Both define `events`/`execution_events` tables with different structures
- `init-db.sql` has 10+ tables covering the full constitutional substrate
- `ledger_schema.sql` has only 3 tables covering basic commit-and-store

**Risk:** HIGH — Multiple schemas define the same entities differently.

---

## SUMMARY OF DUPLICATE AUTHORITY SYSTEMS

| Category | Canonical | Duplicate | Risk | Action |
|----------|-----------|-----------|------|--------|
| Fingerprint | canonical_fingerprint_service.js | identity_engine.ts + canonical_engine.ts | CRITICAL | Replace runtime with archive version |
| Lineage | formal_invariant_graph_verifier.js | dag_validator.ts | CRITICAL | Replace runtime with archive version |
| Event Schema | canonical-event-envelope.json + init-db.sql | claim.schema.json, decision.schema.json, event_log.ts | HIGH | Adopt canonical envelope |
| Persistence | init-db.sql | ledger_schema.sql | HIGH | Replace runtime schema |
| Audit | execution_integrity_auditor.js | audit_controller.ts (misnamed) | MEDIUM | Replace audit endpoint |

---

**Classification:** FACT (verified by direct source inspection)
**Confidence:** HIGH
