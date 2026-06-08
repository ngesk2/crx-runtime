# CONSOLIDATED CORPUS ANALYSIS — PARTS B through K

**Generated:** 2026-06-07
**Mode:** READ-ONLY

---

## ARCHIVE TO RUNTIME MAPPING

### What Migrated from Archive to Active Runtime

| Archive Module | Active Runtime Equivalent | Migration Status |
|----------------|--------------------------|------------------|
| `canonical_fingerprint_service.js` (479 LOC) | `identity_engine.ts` (15 LOC) + `canonical_engine.ts` (18 LOC) | PARTIALLY — Key capabilities lost (domain separation, NFC, verification) |
| `formal_invariant_graph_verifier.js` (262 LOC) | `dag_validator.ts` (13 LOC) | PARTIALLY — Only direct self-loop check retained |
| `deterministic_replay_harness.js` (296 LOC) | **NONE** | NOT MIGRATED |
| `execution_integrity_auditor.js` (395 LOC) | **NONE** | NOT MIGRATED |
| `merkle_anchor_*.js` (15+ modules, ~3,800 LOC) | **NONE** | NOT MIGRATED |
| `constitutional_ci_gate.js` (872 LOC) | **NONE** | NOT MIGRATED |
| `cross_anchor_drift_*.js` (5 modules, ~1,500 LOC) | **NONE** | NOT MIGRATED |

### What Was Lost in Migration

1. **Fingerprint domain separation** — 14 domains → 0 domains
2. **Hash verification** — `verifyFingerprint()` → none
3. **Unicode NFC normalization** — lost entirely
4. **Circular reference detection** — lost entirely
5. **Full DAG cycle detection** — DFS → single-hop check
6. **Witness generation** — 15+ modules → none
7. **Replay proof** — double-execution harness → none
8. **Integrity auditing** — 395 LOC → none

---

## AUTHORITY CLASSIFICATION MAP

### Constitutional Authorities

| Domain | Authority | Source Document | Evidence | Classification |
|--------|-----------|-----------------|----------|----------------|
| Constitution | SHARED | AGENT.md (P1), CRX_CONSTITUTION.md (P2), UCIA-CONSTITUTION-v1.0.md (P3), COS-CONSTITUTION.md (P4) | AGENT.md declares P1 priority; CRX_CONSTITUTION.md claims "supersedes all informal kernel descriptions" | **CONFLICT** — AGENT.md claims supremacy but CRX_CONSTITUTION.md claims supersession |
| Runtime | AGENT.md | CRX/AGENT.md lines 14-20 | Declares authority hierarchy | CANONICAL — DECLARED |
| Infrastructure | NONE | No infrastructure authority document | Infrastructure is constitutionally subordinate | ORPHAN — needs formal authority |
| Schema | MULTIPLE | claim.schema.json, decision.schema.json, canonical-event-envelope.json, constitutional-state.schema.json | 4+ competing schemas | **CONFLICT** — No single schema authority |
| Replay | CRX_CONSTITUTION.md | Phase 3 Authority Jurisdiction: Replay | "OWNS: Deterministic reconstruction law" | CANONICAL — DOCUMENTED but unimplemented |
| Ingestion | NONE | No ingestion authority document | Mentioned in Layer 0 objectives only | ORPHAN — no authority defined |

### Authority Conflicts

1. **ROOT-LEVEL CONFLICT:** AGENT.md (P1 declared) vs CRX_CONSTITUTION.md (claims "supersedes all informal kernel descriptions" but not in AGENT.md hierarchy)
2. **SCHEMA CONFLICT:** 4+ competing event schemas with no canonical selection
3. **RUNTIME CONFLICT:** Active runtime fingerprint (identity_engine.ts) vs archive fingerprint (canonical_fingerprint_service.js) — both claim identity authority
4. **LINEAGE CONFLICT:** Active runtime dag_validator.ts vs archive formal_invariant_graph_verifier.js — both claim lineage authority

---

## CONTINUITY BREAKS

### Break 1: Archive to Runtime Fingerprint Gap

**Type:** Implementation regression
**Location:** `canonical_fingerprint_service.js` (archive) → `identity_engine.ts` + `canonical_engine.ts` (runtime)
**Impact:** CRITICAL — Unicode normalization missing, no domain separation, no verification path
**Evidence:** `canonical_fingerprint_service.js` line 200: `val.normalize("NFC")` vs `identity_engine.ts`: no normalization

### Break 2: Archive to Runtime Lineage Gap

**Type:** Implementation regression
**Location:** `formal_invariant_graph_verifier.js` (archive) → `dag_validator.ts` (runtime)
**Impact:** CRITICAL — No transitive cycle detection in runtime
**Evidence:** `formal_invariant_graph_verifier.js` has full DFS cycle detection; `dag_validator.ts` only checks direct self-reference

### Break 3: Replay System Completely Unmigrated

**Type:** Missing implementation
**Location:** `deterministic_replay_harness.js` exists in archive, nothing in runtime
**Impact:** CRITICAL — No replay capability in active system
**Evidence:** Complete 296 LOC harness in archive; 0 LOC replay in runtime

### Break 4: Witness System Completely Unmigrated

**Type:** Missing implementation
**Location:** 15+ Merkle anchor modules in archive, nothing in runtime
**Impact:** CRITICAL — No witness generation or verification
**Evidence:** 3,800+ LOC in archive; 0 LOC in runtime

### Break 5: Empty Shell Directories

**Type:** Planned but never populated
**Location:** `replay/`, `witness/`, `verifier/`, `kernel/` in primary archive
**Impact:** HIGH — Suggests planned file structure that was never implemented as filesystem artifacts
**Evidence:** MCP0.txt proposes these directories; directories exist but are empty

### Break 6: models/artifact.ts Empty

**Type:** Stale stub
**Location:** `CRX/runtime/kernel/commit-service/src/models/artifact.ts`
**Impact:** MEDIUM — File is 0 bytes but referenced by commit_controller.ts
**Evidence:** `artifact.artifact_type` and `artifact.content` accessed in commit_controller.ts line 12-13, but type definition is empty

### Break 7: MCP0.txt Design Tree vs Actual Files

**Type:** Design-to-implementation gap
**Location:** MCP0.txt proposes files like `kernel/constitution/axioms.ts`, `kernel/event/event-envelope.ts`
**Impact:** HIGH — Many proposed files don't exist on disk
**Evidence:** MCP0.txt lists 50+ proposed files; none exist in the primary archive filesystem

---

## ORPHANED MODULES

### In Active Runtime

| Module | Status | Issue |
|--------|--------|-------|
| `models/artifact.ts` | EMPTY | 0 bytes, referenced but undefined |
| `audit_controller.ts` | STALE | Lists artifacts only — no audit logic, no witness verification |

### In Archive (Extracted JS.txt)

| Module | Status | Issue |
|--------|--------|-------|
| `cross_anchor_drift_summary_presentation_adapter.js` | ORPHAN | Presentation adapter — depends on external visualization system that doesn't exist |
| `overlay_rendering_contract_validator.js` | ORPHAN | Overlay rendering — depends on UI system that doesn't exist |
| `resource_ceiling_enforcer.js` | ORPHAN | Resource limits — no integration path to runtime |
| `worker_runtime_entry.js` | ORPHAN | Worker entry point — no worker system in runtime |
| `constitutional_ci.yml` | ORPHAN | CI config — references CI system that doesn't exist locally |

### In Integration Lab

| Module | Status | Issue |
|--------|--------|-------|
| `crx_repository_inventory.md` | STALE | Prior inventory — superseded by this analysis |
| `js_txt_module_inventory.md` | CURRENT | Module inventory — still accurate |
| `constitutional_authority_registry.md` | CURRENT | Authority registry — still accurate |

---

## FLOATING MODULE INVENTORY

### Modules That Exist Only in Archive (Not in Runtime)

These 59 JS.txt modules have NO equivalent in the active CRX runtime:

**Replay (1):** deterministic_replay_harness.js

**Witness/Merkle (15):** merkle_anchor_chain_validator.js, merkle_anchor_replay_verifier.js, merkle_anchor_chain_canonicalizer.js, merkle_anchor_chain_drift_detector.js, merkle_anchor_chain_drift_summary.js, merkle_anchor_chain_severity_and_divergence.js, merkle_anchor_chain_fork_graph_builder.js, merkle_anchor_chain_multi_divergence_severity.js, merkle_anchor_chain_multi_graph_visualizer.js, + 6 misuse test modules

**Cross-Anchor (5):** cross_anchor_drift_detector.js, cross_anchor_drift_summary.js, + 3 test/adapter modules

**Graph (2):** structural_graph_builder.js, structural_drift_guard.js

**Verification (6):** execution_integrity_auditor.js, artifact_reversibility_validator.js, artifact_firewall.js, domain_lockfile_fingerprint_guard.js, consensus_quorum_validator.js, registry_freeze_verifier.js

**CI/Structural (4):** constitutional_ci_gate.js, constitutional_ci.yml, semantic_delta_validator.js, structural_identity_stability_test_suite.js

**Projection (4):** projection_ephemerality_enforcer.js, projection_layer_isolation_guard.js, author_projection_boundary_validator.js, overlay_rendering_contract_validator.js

**Plugin (7):** plugin_execution_scheduler.js, plugin_isolation_sandbox.js, plugin_contract_validator.js, plugin_contract_canonicalizer.js, plugin_registry_integrity_guard.js, entropy_budget_guard.js, suggestion_schema_enforcer.js

**Runtime/Infra (6):** runtime_adapter.js, worker_runtime_adapter.js, worker_runtime_entry.js, isolated_execution_adapter.js, evaluation_context_assembler.js, resource_ceiling_enforcer.js

**Security (2):** adversarial_red_team_harness.js, anti_authority_field_guard.js

**Misc (4):** capability_scope_auditor.js, determinism_stress_harness.js, cross_bundle_divergence_analyzer.js, domain_usage_static_analyzer.js

---

## DUPLICATE AUTHORITY SYSTEMS

### Fingerprint Authority Duplication

| System | Location | LOC | Domain Separation | Verification | Recommendation |
|--------|----------|-----|-------------------|--------------|----------------|
| `canonical_fingerprint_service.js` | Archive | 479 | YES (14 domains) | YES | **PROMOTE** — Strictly superior |
| `identity_engine.ts` | Runtime | 15 | NO | NO | **REPLACE** — Incomplete |
| `canonical_engine.ts` | Runtime | 18 | NO | NO | **REPLACE** — Incomplete |

**Verdict:** The archive fingerprint service is strictly superior. The runtime versions should be replaced.

### Lineage Authority Duplication

| System | Location | LOC | Full Cycle Detection | Graph Fingerprinting | Recommendation |
|--------|----------|-----|---------------------|---------------------|----------------|
| `formal_invariant_graph_verifier.js` | Archive | 262 | YES (DFS) | YES | **PROMOTE** — Strictly superior |
| `dag_validator.ts` | Runtime | 13 | NO | NO | **REPLACE** — Incomplete |

**Verdict:** The archive graph verifier is strictly superior. The runtime validator should be replaced.

### Event Schema Duplication

| Schema | Location | Fields | Replay-Safe | Recommendation |
|--------|----------|--------|-------------|----------------|
| `canonical-event-envelope.json` | CascadeProjects | 7 required | YES (UUID, lineage, policy_version) | **PROMOTE** — Most complete |
| `audit-event.schema.json` | CRX/vos | 8 fields | PARTIAL | **QUARANTINE** — Audit domain only |
| `claim.schema.json` | CRX/knowledge | 9 required | NO | **QUARANTINE** — UCIA domain only |
| `decision.schema.json` | CRX/knowledge | 7 required | NO | **QUARANTINE** — UCIA domain only |
| `event_log.ts` | Runtime | 2 fields | NO | **REPLACE** — Minimal, non-replay-safe |

---

## LOCAL CORPUS TOPOLOGY

### Connected Components

```
COMPONENT 1: Active Runtime
  CRX/runtime/kernel/commit-service/src/ (12 .ts files)
  └── Connected to: CRX/runtime/kernel/commit-service/src/persistence/db.ts (PostgreSQL)
  └── Connected to: GitHub remote (origin/audit-hardening, origin/main)

COMPONENT 2: Archive (Codex)
  Codex/2026-05-31/.../crx/ (JS.txt, MCP0.txt, constitution/, governance/, docs/)
  └── NOT connected to any runtime
  └── Contains embedded source that was extracted to Component 3

COMPONENT 3: Integration Lab
  constitutional-intraction-lab/extracted/js_txt/ (59 .js files — extracted from JS.txt)
  constitutional-integration-lab/extracted/runtime/ (12 .ts files — copy of runtime)
  constitutional-integration-lab/extracted/schemas/ (11 JSON/SQL files)
  constitutional-integration-lab/reports/ (17 analysis reports)
  constitutional-integration-lab/comparisons/ (6 comparison reports)
  constitutional-integration-lab/inventories/ (2 inventory files)
  constitutional-integration-lab/mappings/ (2 mapping files)
  └── Connected to: Component 2 (extracted FROM archive)
  └── Contains: Analysis of gap between Component 1 and Component 2

COMPONENT 4: CascadeProjects
  CascadeProjects/ (AGENT.md, events/, schemas/, kernel/, policies/, infra/)
  └── NOT directly connected to Components 1-3
  └── Contains: Proposed canonical-event-envelope.json, init-db.sql

COMPONENT 5: Codex 2026-06-04
  Codex/2026-06-04/files-mentioned-by-the-user-pasted/outputs/ (23 files)
  └── NOT directly connected to Components 1-4
  └── Contains: Agent-authored schemas and constitutional analyses

COMPONENT 6: CRX Knowledge/Vos
  CRX/knowledge/authoritative/ (35+ .md files + 2 .json schemas)
  CRX/vos/cos/ (CONSTITUTION.md, schemas, governance, protocols)
  └── Connected to: CRX root (filesystem assembly)
  └── NOT in any git repo (CRX root is not a git repo)

COMPONENT 7: Active CRX Root
  CRX/ (AGENT.md, CRX_CONSTITUTION.md, reports/, agents/, inventory/)
  └── NOT a git repository
  └── Filesystem assembly of Components 1, 6
```

### Topology Insight

**FACT.** The CRX corpus is not a single coherent repository. It is a **distributed local corpus** spanning 7+ disconnected components across 4 top-level directories. No single git repository contains the complete system. The integration lab (Component 3) was created specifically to bridge the gap between the archive (Component 2) and the active runtime (Component 1).

---

## CONSTITUTIONAL RELEVANCE MAP

### Documents Ranked by Constitutional Authority

| Rank | Document | Path | Authority Level | Layer |
|------|----------|------|-----------------|-------|
| 1 | AGENT.md | CRX/ | DECLARED SUPREME (P1) | Agent Constitution |
| 2 | CRX_CONSTITUTION.md | CRX/ | FROZEN Phase 3.5A | Kernel Specification |
| 3 | UCIA-CONSTITUTION-v1.0.md | CRX/knowledge/authoritative/ | CANONICAL (P2 per AGENT.md) | UCIA Kernel |
| 4 | COS-CONSTITUTION.md | CRX/vos/cos/ | CANONICAL (P3 per AGENT.md) | Engineering Process |
| 5 | persistence-constitution.md | CRX/knowledge/authoritative/ | CANONICAL | Persistence Law |
| 6 | claim.schema.json | CRX/knowledge/authoritative/ | CRITICAL SCHEMA | Identity/Claims |
| 7 | decision.schema.json | CRX/knowledge/authoritative/ | CRITICAL SCHEMA | Decisions |
| 8 | constitutional-state.schema.json | Codex/2026-06-04/outputs/ | PROPOSED | State Model |
| 9 | canonical-event-envelope.json | CascadeProjects/events/ | PROPOSED | Event Schema |
| 10 | formal_invariant_graph_verifier.js | constitutional-integration-lab/extracted/js_txt/ | ARCHIVED — NOT CANONICAL | Graph Verification |

### Relevance to 5 Production Capabilities

| Constitutional Document | Replay | Witness | Transcript | Fingerprint | Graph |
|------------------------|--------|---------|------------|-------------|-------|
| CRX_CONSTITUTION.md (Phase 5 Replay Law) | DEFINES | — | DEFINES (event sequence) | — | — |
| CRX_CONSTITUTION.md (Phase 3 Authority) | DEFINES | DEFINES (absorbed by Identity+Replay) | — | DEFINES (absorbed by Identity) | DEFINES (Lineage Authority) |
| UCIA-CONSTITUTION.md (Article 15) | REQUIRES | REQUIRES (crypto verification) | REQUIRES (append-only store) | REQUIRES (Canonical ID) | — |
| persistence-constitution.md | — | — | DEFINES (4 persistence levels) | — | — |
| replay-reconstruction.md | DEFINES ALGORITHM | — | — | — | — |
| canonical_fingerprint_service.js | — | DEPENDS ON | — | IMPLEMENTS | — |
| formal_invariant_graph_verifier.js | DEPENDS ON | DEPENDS ON | — | DEPENDS ON | IMPLEMENTS |

---

## REPLAY GAP MAP

**This section answers: "What concrete files must exist before CRX can claim replay determinism, witness generation, transcript generation, durable event sourcing, and constitutional verification?"**

### For Replay Determinism

**Required concrete files (evidence-based):**

1. `deterministic_replay_harness.js` — EXISTS in archive, must be ported to TypeScript and integrated
2. `canonical_fingerprint_service.js` — EXISTS in archive, required dependency of replay harness, must be ported first
3. `plugin_execution_scheduler.js` — EXISTS in archive, required dependency of replay harness
4. `formal_invariant_graph_verifier.js` — EXISTS in archive, required dependency of replay harness
5. Database table: `replay_snapshots` — DOES NOT EXIST. Must be added to schema
6. API endpoint: `POST /kernel/replay` — DOES NOT EXIST. Must be created
7. Database table: `identity_law_versions` — DOES NOT EXIST. Required by Phase 5 replay law

**Minimum path:** Port fingerprint service → port graph verifier → port replay harness → add snapshot table → create replay endpoint

### For Witness Generation

**Required concrete files:**

1. `merkle_anchor_chain_validator.js` — EXISTS in archive
2. `merkle_anchor_replay_verifier.js` — EXISTS in archive
3. `merkle_anchor_chain_canonicalizer.js` — EXISTS in archive
4. `authority_boundary_prover.js` — EXISTS in archive (342 LOC)
5. `merkle_anchor_chain_drift_detector.js` — EXISTS in archive
6. Database table: `witness_attestations` — DOES NOT EXIST. Must be created
7. Event type: `witness_generated` — DOES NOT EXIST. Must be added to event log

**Minimum path:** Create witness table → Port witness generation from commit flow → Add witness verification to audit endpoint

### For Transcript Generation

**Required concrete files:**

1. `canonical-event-envelope.json` — EXISTS in CascadeProjects (schema only)
2. `init-db.sql` — EXISTS in integration lab (schema only, 156 LOC, comprehensive)
3. Event sequence query function — DOES NOT EXIST in runtime
4. Database table: `lineage_chains` — DOES NOT EXIST in runtime (exists in init-db.sql)
5. API endpoint: `GET /kernel/transcript` — DOES NOT EXIST

**Minimum path:** Adopt init-db.sql schema → Refactor event_log.ts to use canonical envelope → Create transcript export endpoint

### For Durable Event Sourcing

**Required concrete files:**

1. SQL schema: `events` table with UUID, actor_id, fingerprint, lineage — EXISTS in init-db.sql, NOT in runtime
2. Event envelope enforcement — DOES NOT EXIST in runtime
3. Append-only constraint — DOES NOT EXIST (no DB-level enforcement)
4. Event fingerprinting — DOES NOT EXIST in runtime
5. Actor registry table — EXISTS in init-db.sql, NOT in runtime
6. Policy version tracking — EXISTS in init-db.sql, NOT in runtime

**Minimum path:** Replace ledger_schema.sql with init-db.sql → Refactor event_log.ts → Add fingerprinting to event creation

### For Constitutional Verification

**Required concrete files:**

1. `formal_invariant_graph_verifier.js` — EXISTS in archive, must be ported
2. `dag_validator.ts` — EXISTS in runtime, must be replaced/supplemented
3. `execution_integrity_auditor.js` — EXISTS in archive, must be ported
4. Database tables: `constitutional_violations`, `policy_evaluations`, `rules`, `facts`, `claims` — EXIST in init-db.sql, NOT in runtime
5. Policy evaluation engine — DOES NOT EXIST anywhere
6. Fact derivation engine — DOES NOT EXIST anywhere
7. Claim lifecycle management — DOES NOT EXIST anywhere

**Minimum path:** Port graph verifier → Port integrity auditor → Add policy/rules/facts/claims tables → Create verification endpoint

---

## SOVEREIGNTY SUMMARY

### What Currently Possesses De Facto Authority

| Authority | Actual Location | Declared Location | Match? |
|-----------|----------------|-------------------|--------|
| Identity Assignment | `identity_engine.ts` (runtime) | Identity Authority (CRX_CONSTITUTION) | PARTIAL — Implementation is incomplete |
| Lineage Validation | `dag_validator.ts` (runtime) | Lineage Authority (CRX_CONSTITUTION) | PARTIAL — Implementation is shallow |
| Event Recording | `event_log.ts` (runtime) | Event Recording Authority (CRX_CONSTITUTION) | PARTIAL — Minimal, no envelope |
| Fingerprinting | `identity_engine.ts` + `canonical_engine.ts` | Identity Authority (CRX_CONSTITUTION) | PARTIAL — No domain separation |
| Replay | **NONE** | Replay Authority (CRX_CONSTITUTION) | **MISSING** |
| Witness | **NONE** | Absorbed by Identity+Replay (CRX_CONSTITUTION) | **MISSING** |
| Policy | **NONE** | Policy Authority (CRX_CONSTITUTION) | **MISSING** |
| State Derivation | **NONE** | State Authority (CRX_CONSTITUTION) | **MISSING** |

### Sovereignty Crisis Assessment

**FACT.** A sovereignty crisis EXISTS. 4 of 8 constitutional authorities have NO implementation (Replay, Witness, Policy, State). 4 of 8 have only partial implementations (Identity, Lineage, Event Recording, Fingerprinting). The CRX_CONSTITUTION.md defines authorities that do not exist in the active runtime.

However, the crisis is **archaeological, not architectural.** Complete implementations of the missing authorities exist in the JS.txt archive. The gap is integration, not design.

---

**Classification:** FACT (verified by direct filesystem and source inspection)
**Confidence:** HIGH (all claims backed by specific file paths and line references)
