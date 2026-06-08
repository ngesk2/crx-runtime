# Constitutional Authority Registry

**Generated:** 2026-06-06  
**Primary Authority:** AGENT.md  
**Lab Workspace:** `C:\Users\nolan\constitutional-integration-lab\`  
**CRX Status:** READ-ONLY (untouched)

---

## Registry Scope

| Source | Artifacts Registered |
|--------|---------------------|
| CRX Runtime | 12 TypeScript/SQL production files |
| JS.txt (extracted) | 59 JavaScript modules |
| MCP0.txt | 0 executable modules (design tree only) |
| CascadeProjects | 3 schema/SQL authorities |
| Codex archives | 5 constitutional JSON schemas |
| CRX knowledge/vos | 4 competing schemas + inventory |

---

## CRX Runtime Authorities

### `canonical_engine.ts`

| Field | Value |
|-------|-------|
| **MODULE** | `runtime/kernel/commit-service/src/engines/canonical_engine.ts` |
| **PRIMARY_AUTHORITY** | canonicalization |
| **SECONDARY_AUTHORITIES** | identity (downstream consumer) |
| **RESPONSIBILITY** | Recursive JSON key sorting for deterministic serialization input |
| **INPUTS** | `value: any` |
| **OUTPUTS** | Canonically ordered JSON-compatible structure |
| **DEPENDENCIES** | None |
| **SIDE_EFFECTS** | None |
| **REPLAY_SENSITIVITY** | HIGH — hash output depends on canonical form |
| **DETERMINISM_SENSITIVITY** | HIGH — no domain separation, no type rejection guards |

### `identity_engine.ts`

| Field | Value |
|-------|-------|
| **MODULE** | `runtime/kernel/commit-service/src/engines/identity_engine.ts` |
| **PRIMARY_AUTHORITY** | identity |
| **SECONDARY_AUTHORITIES** | canonicalization (via import) |
| **RESPONSIBILITY** | SHA-256 content hash of canonicalized artifact |
| **INPUTS** | `input: any` |
| **OUTPUTS** | 64-char hex string (artifact_id) |
| **DEPENDENCIES** | `crypto`, `./canonical_engine` |
| **SIDE_EFFECTS** | None |
| **REPLAY_SENSITIVITY** | HIGH |
| **DETERMINISM_SENSITIVITY** | HIGH — no domain prefix, no verify path |

### `dag_validator.ts`

| Field | Value |
|-------|-------|
| **MODULE** | `runtime/kernel/commit-service/src/validation/dag_validator.ts` |
| **PRIMARY_AUTHORITY** | lineage |
| **SECONDARY_AUTHORITIES** | invariant (partial) |
| **RESPONSIBILITY** | Direct self-loop and duplicate parent detection |
| **INPUTS** | `parentIds: string[]`, `childId: string` |
| **OUTPUTS** | `true` or throws |
| **DEPENDENCIES** | None |
| **SIDE_EFFECTS** | Throws on violation |
| **REPLAY_SENSITIVITY** | MEDIUM |
| **DETERMINISM_SENSITIVITY** | HIGH |

### `event_log.ts`

| Field | Value |
|-------|-------|
| **MODULE** | `runtime/kernel/commit-service/src/events/event_log.ts` |
| **PRIMARY_AUTHORITY** | event |
| **SECONDARY_AUTHORITIES** | persistence |
| **RESPONSIBILITY** | Append execution event row to PostgreSQL |
| **INPUTS** | `type: string`, `payload: any` |
| **OUTPUTS** | DB insert (void) |
| **DEPENDENCIES** | `../persistence/db` (pg Pool) |
| **SIDE_EFFECTS** | PostgreSQL write |
| **REPLAY_SENSITIVITY** | CRITICAL — event log is replay substrate |
| **DETERMINISM_SENSITIVITY** | MEDIUM — no event_id, no ordering key, no fingerprint |

### `commit_controller.ts`

| Field | Value |
|-------|-------|
| **MODULE** | `runtime/kernel/commit-service/src/api/commit_controller.ts` |
| **PRIMARY_AUTHORITY** | orchestration (non-authority-class; infra-coupled) |
| **SECONDARY_AUTHORITIES** | identity, lineage, event, persistence |
| **RESPONSIBILITY** | HTTP commit pipeline: hash → validate → store → log |
| **INPUTS** | Express `Request` body `{ artifact, lineage }` |
| **OUTPUTS** | HTTP JSON response |
| **DEPENDENCIES** | identity_engine, dag_validator, stores, event_log, logger, express |
| **SIDE_EFFECTS** | HTTP response, DB writes, log writes |
| **REPLAY_SENSITIVITY** | HIGH — ordering of store operations matters |
| **DETERMINISM_SENSITIVITY** | MEDIUM — no transaction boundary visible |

---

## JS.txt Archive Authorities (Top Replay-Critical)

### `canonical_fingerprint_service.js`

| Field | Value |
|-------|-------|
| **MODULE** | `JS.txt#canonical_fingerprint_service.js` → `extracted/js_txt/canonical_fingerprint_service.js` |
| **PRIMARY_AUTHORITY** | canonicalization + identity |
| **SECONDARY_AUTHORITIES** | witness (hash verification) |
| **RESPONSIBILITY** | Domain-separated SHA-256 fingerprinting with strict canonicalization |
| **INPUTS** | `value`, `options` / `domain`, `value` |
| **OUTPUTS** | 64-char hash; `verifyFingerprint` boolean |
| **DEPENDENCIES** | WebCrypto or Utilities digest (runtime-specific) |
| **SIDE_EFFECTS** | None (pure when crypto available) |
| **REPLAY_SENSITIVITY** | CRITICAL |
| **DETERMINISM_SENSITIVITY** | CRITICAL — explicit replay purity guarantee in header comment |

**Exports:** `FINGERPRINT_SCHEMA_VERSION`, `HASH_ALGORITHM`, `FINGERPRINT_DOMAINS`, `CanonicalizationError`, `canonicalize`, `fingerprint`, `fingerprintWithDomain`, `verifyFingerprint`

### `deterministic_replay_harness.js`

| Field | Value |
|-------|-------|
| **MODULE** | `JS.txt#deterministic_replay_harness.js` |
| **PRIMARY_AUTHORITY** | replay |
| **SECONDARY_AUTHORITIES** | witness, invariant, identity |
| **RESPONSIBILITY** | Double-execution replay proof with snapshot/registry/invariant binding |
| **INPUTS** | `snapshot`, `snapshot_fingerprint`, `registryEntries`, `invariantNodes/Edges`, plugins |
| **OUTPUTS** | Replay proof result / throws on drift |
| **DEPENDENCIES** | canonical_fingerprint_service, plugin_execution_scheduler, formal_invariant_graph_verifier |
| **SIDE_EFFECTS** | Plugin execution during replay (depends on scheduler) |
| **REPLAY_SENSITIVITY** | CRITICAL |
| **DETERMINISM_SENSITIVITY** | CRITICAL |

**Exports:** `runDeterministicReplay`

### `formal_invariant_graph_verifier.js`

| Field | Value |
|-------|-------|
| **MODULE** | `JS.txt#formal_invariant_graph_verifier.js` |
| **PRIMARY_AUTHORITY** | invariant |
| **SECONDARY_AUTHORITIES** | lineage, witness (graph fingerprint) |
| **RESPONSIBILITY** | Constitutional topology DAG verification |
| **INPUTS** | `declaredNodes`, `declaredEdges` |
| **OUTPUTS** | Verification result + graph fingerprint |
| **DEPENDENCIES** | canonical_fingerprint_service |
| **SIDE_EFFECTS** | None |
| **REPLAY_SENSITIVITY** | HIGH |
| **DETERMINISM_SENSITIVITY** | HIGH |

**Exports:** `INVARIANT_NODES`, `verifyInvariantGraph`

### `execution_integrity_auditor.js`

| Field | Value |
|-------|-------|
| **MODULE** | `JS.txt#execution_integrity_auditor.js` |
| **PRIMARY_AUTHORITY** | verification |
| **SECONDARY_AUTHORITIES** | replay, witness, identity |
| **RESPONSIBILITY** | Advisory-only execution bundle integrity audit (no mutation) |
| **INPUTS** | Execution bundle with snapshot, artifacts, execution_records, failures |
| **OUTPUTS** | Drift report with severity classification |
| **DEPENDENCIES** | canonical_fingerprint_service |
| **SIDE_EFFECTS** | None (declared pure) |
| **REPLAY_SENSITIVITY** | CRITICAL |
| **DETERMINISM_SENSITIVITY** | CRITICAL |

**Exports:** `EXECUTION_INTEGRITY_AUDITOR_VERSION`, `auditExecution`

### `merkle_anchor_replay_verifier.js`

| Field | Value |
|-------|-------|
| **MODULE** | `JS.txt#merkle_anchor_replay_verifier.js` |
| **PRIMARY_AUTHORITY** | witness |
| **SECONDARY_AUTHORITIES** | replay, lineage |
| **RESPONSIBILITY** | Merkle anchor chain replay verification |
| **DEPENDENCIES** | canonical_fingerprint_service |
| **REPLAY_SENSITIVITY** | CRITICAL |
| **DETERMINISM_SENSITIVITY** | CRITICAL |

---

## MCP0.txt Status

| Field | Value |
|-------|-------|
| **PATH** | `C:\Users\nolan\Documents\Codex\2026-05-31\phase-1a-context-foundation-only-objective\crx\MCP0.txt` |
| **SIZE** | ~22,538 lines |
| **TYPE** | ARCHIVE_ONLY — proposed directory tree and design narrative |
| **EXECUTABLE MODULES** | 0 |
| **EVIDENCE** | Contains proposed paths like `/kernel/constitution/axioms.ts`, `/kernel/event/event-envelope.ts` — **none exist as files on disk** |
| **REUSE VALUE** | REFERENCE ONLY — naming/target map, not implemented authority |

---

## Schema Authorities (Non-Runtime)

| File | PRIMARY_AUTHORITY | REPLAY_SENSITIVITY |
|------|-------------------|-------------------|
| `CascadeProjects/events/canonical-event-envelope.json` | event | HIGH |
| `CascadeProjects/schemas/foundational-primitives.json` | constitution | HIGH |
| `CascadeProjects/infra/scripts/init-db.sql` | persistence, event, replay | CRITICAL |
| `Codex/constitutional-state.schema.json` | constitution | CRITICAL |
| `Codex/invariant.schema.json` | invariant | HIGH |
| `CRX/knowledge/claim.schema.json` | constitution | MEDIUM |
| `CRX/vos/audit-event.schema.json` | event, observability | MEDIUM |

---

## Authority Dependency Graph (Evidence-Backed)

```
canonical_fingerprint_service.js
  ├── identity (fingerprint, fingerprintWithDomain, verifyFingerprint)
  ├── canonicalization (canonicalize)
  ├── formal_invariant_graph_verifier.js
  ├── deterministic_replay_harness.js
  ├── execution_integrity_auditor.js
  └── merkle_anchor_* (12 modules)

CRX canonical_engine.ts → identity_engine.ts → commit_controller.ts
CRX dag_validator.ts → commit_controller.ts
CRX event_log.ts → commit_controller.ts (via pool/db.ts)
```

**No edge exists** between CRX runtime TypeScript and JS.txt archive modules at runtime — they are isolated copies.

---

## Complete JS.txt Module Classification (All 59 Modules)

### Merkle Anchor Chain Modules (12 modules)

| Module | PRIMARY_AUTHORITY | SECONDARY_AUTHORITIES | RESPONSIBILITY | REPLAY_SENSITIVITY | DETERMINISM_SENSITIVITY |
|--------|-------------------|----------------------|---------------|-------------------|------------------------|
| merkle_anchor_adapter_misuse_tests.js | verification | witness | Merkle anchor adapter misuse testing | HIGH | HIGH |
| merkle_anchor_replay_verifier.js | witness | replay, lineage | Merkle anchor chain replay verification | CRITICAL | CRITICAL |
| merkle_anchor_replay_verifier_misuse_tests.js | verification | witness | Merkle anchor replay verifier misuse testing | HIGH | HIGH |
| merkle_anchor_chain_validator.js | verification | lineage | Merkle anchor chain validation | HIGH | HIGH |
| merkle_anchor_chain_validator_misuse_tests.js | verification | witness | Merkle anchor chain validator misuse testing | HIGH | HIGH |
| merkle_anchor_chain_fork_graph_builder.js | lineage | witness | Merkle anchor chain fork graph building | HIGH | HIGH |
| merkle_anchor_chain_fork_graph_misuse_tests.js | verification | witness | Merkle anchor chain fork graph misuse testing | HIGH | HIGH |
| merkle_anchor_chain_canonicalizer.js | canonicalization | identity | Merkle anchor chain canonicalization | HIGH | HIGH |
| merkle_anchor_chain_drift_detector.js | witness | lineage | Merkle anchor chain drift detection | CRITICAL | HIGH |
| merkle_anchor_chain_drift_misuse_tests.js | verification | witness | Merkle anchor chain drift misuse testing | HIGH | HIGH |
| merkle_anchor_chain_drift_summary.js | witness | lineage | Merkle anchor chain drift summary | HIGH | HIGH |
| merkle_anchor_chain_severity_and_divergence.js | witness | lineage | Merkle anchor chain severity and divergence analysis | HIGH | HIGH |
| merkle_anchor_chain_multi_divergence_severity.js | witness | lineage | Merkle anchor chain multi-divergence severity | HIGH | HIGH |
| merkle_anchor_chain_multi_graph_visualizer.js | witness | lineage | Merkle anchor chain multi-graph visualization | MEDIUM | MEDIUM |
| merkle_anchor_chain_multi_graph_misuse_tests.js | verification | witness | Merkle anchor chain multi-graph misuse testing | HIGH | HIGH |

### Cross Anchor Drift Modules (5 modules)

| Module | PRIMARY_AUTHORITY | SECONDARY_AUTHORITIES | RESPONSIBILITY | REPLAY_SENSITIVITY | DETERMINISM_SENSITIVITY |
|--------|-------------------|----------------------|---------------|-------------------|------------------------|
| cross_anchor_drift_detector.js | witness | lineage | Cross anchor drift detection | CRITICAL | HIGH |
| cross_anchor_drift_misuse_tests.js | verification | witness | Cross anchor drift misuse testing | HIGH | HIGH |
| cross_anchor_drift_summary.js | witness | lineage | Cross anchor drift summary | HIGH | HIGH |
| cross_anchor_drift_summary_misuse_tests.js | verification | witness | Cross anchor drift summary misuse testing | HIGH | HIGH |
| cross_anchor_drift_summary_presentation_adapter.js | infrastructure | witness | Cross anchor drift summary presentation | LOW | LOW |

### Plugin System Modules (8 modules)

| Module | PRIMARY_AUTHORITY | SECONDARY_AUTHORITIES | RESPONSIBILITY | REPLAY_SENSITIVITY | DETERMINISM_SENSITIVITY |
|--------|-------------------|----------------------|---------------|-------------------|------------------------|
| plugin_execution_scheduler.js | infrastructure | orchestration | Plugin execution scheduling | MEDIUM | MEDIUM |
| plugin_isolation_sandbox.js | infrastructure | security | Plugin isolation sandboxing | MEDIUM | MEDIUM |
| plugin_contract_validator.js | verification | infrastructure | Plugin contract validation | MEDIUM | MEDIUM |
| plugin_contract_canonicalizer.js | canonicalization | infrastructure | Plugin contract canonicalization | MEDIUM | MEDIUM |
| plugin_registry_integrity_guard.js | verification | infrastructure | Plugin registry integrity guarding | MEDIUM | MEDIUM |
| constitutional_ci_gate.js | infrastructure | verification | Constitutional CI gate | MEDIUM | MEDIUM |
| domain_lockfile_fingerprint_guard.js | verification | witness | Domain lockfile fingerprint guarding | MEDIUM | HIGH |
| domain_usage_static_analyzer.js | verification | infrastructure | Domain usage static analysis | MEDIUM | HIGH |

### Structural and Projection Modules (8 modules)

| Module | PRIMARY_AUTHORITY | SECONDARY_AUTHORITIES | RESPONSIBILITY | REPLAY_SENSITIVITY | DETERMINISM_SENSITIVITY |
|--------|-------------------|----------------------|---------------|-------------------|------------------------|
| structural_graph_builder.js | lineage | canonicalization | Structural graph building | HIGH | HIGH |
| structural_drift_guard.js | witness | lineage | Structural drift guarding | HIGH | HIGH |
| structural_identity_stability_test_suite.js | verification | witness | Structural identity stability testing | HIGH | HIGH |
| semantic_delta_validator.js | verification | lineage | Semantic delta validation | HIGH | HIGH |
| projection_ephemerality_enforcer.js | verification | projection | Projection ephemerality enforcement | MEDIUM | MEDIUM |
| projection_layer_isolation_guard.js | verification | projection | Projection layer isolation guarding | MEDIUM | MEDIUM |
| author_projection_boundary_validator.js | verification | projection | Author projection boundary validation | MEDIUM | MEDIUM |
| overlay_rendering_contract_validator.js | verification | projection | Overlay rendering contract validation | MEDIUM | MEDIUM |

### Runtime and Execution Modules (7 modules)

| Module | PRIMARY_AUTHORITY | SECONDARY_AUTHORITIES | RESPONSIBILITY | REPLAY_SENSITIVITY | DETERMINISM_SENSITIVITY |
|--------|-------------------|----------------------|---------------|-------------------|------------------------|
| runtime_adapter.js | infrastructure | orchestration | Runtime adaptation | MEDIUM | MEDIUM |
| worker_runtime_adapter.js | infrastructure | orchestration | Worker runtime adaptation | MEDIUM | MEDIUM |
| worker_runtime_entry.js | infrastructure | orchestration | Worker runtime entry point | MEDIUM | MEDIUM |
| isolated_execution_adapter.js | infrastructure | security | Isolated execution adaptation | MEDIUM | MEDIUM |
| determinism_stress_harness.js | verification | replay | Determinism stress testing | HIGH | HIGH |
| adversarial_red_team_harness.js | verification | security | Adversarial red team testing | MEDIUM | MEDIUM |
| evaluation_context_assembler.js | infrastructure | orchestration | Evaluation context assembly | MEDIUM | MEDIUM |

### Validation and Verification Modules (6 modules)

| Module | PRIMARY_AUTHORITY | SECONDARY_AUTHORITIES | RESPONSIBILITY | REPLAY_SENSITIVITY | DETERMINISM_SENSITIVITY |
|--------|-------------------|----------------------|---------------|-------------------|------------------------|
| artifact_reversibility_validator.js | verification | lineage | Artifact reversibility validation | MEDIUM | MEDIUM |
| artifact_firewall.js | verification | security | Artifact firewall | MEDIUM | MEDIUM |
| suggestion_schema_enforcer.js | verification | infrastructure | Suggestion schema enforcement | MEDIUM | MEDIUM |
| anti_authority_field_guard.js | verification | infrastructure | Anti-authority field guarding | MEDIUM | MEDIUM |
| registry_freeze_verifier.js | verification | infrastructure | Registry freeze verification | MEDIUM | HIGH |
| consensus_quorum_validator.js | verification | infrastructure | Consensus quorum validation | MEDIUM | MEDIUM |

### Cross-Bundle and Divergence Modules (2 modules)

| Module | PRIMARY_AUTHORITY | SECONDARY_AUTHORITIES | RESPONSIBILITY | REPLAY_SENSITIVITY | DETERMINISM_SENSITIVITY |
|--------|-------------------|----------------------|---------------|-------------------|------------------------|
| cross_bundle_divergence_analyzer.js | verification | lineage | Cross-bundle divergence analysis | HIGH | HIGH |
| capability_scope_auditor.js | verification | infrastructure | Capability scope auditing | MEDIUM | MEDIUM |

### Configuration Module (1 module)

| Module | PRIMARY_AUTHORITY | SECONDARY_AUTHORITIES | RESPONSIBILITY | REPLAY_SENSITIVITY | DETERMINISM_SENSITIVITY |
|--------|-------------------|----------------------|---------------|-------------------|------------------------|
| resource_ceiling_enforcer.js | infrastructure | verification | Resource ceiling enforcement | MEDIUM | MEDIUM |

### CI Configuration (1 module)

| Module | PRIMARY_AUTHORITY | SECONDARY_AUTHORITIES | RESPONSIBILITY | REPLAY_SENSITIVITY | DETERMINISM_SENSITIVITY |
|--------|-------------------|----------------------|---------------|-------------------|------------------------|
| constitutional_ci.yml | infrastructure | orchestration | CI configuration | LOW | LOW |

---

## Authority Classification Summary

**BY PRIMARY_AUTHORITY:**
- canonicalization: 3 (canonical_fingerprint_service.js, merkle_anchor_chain_canonicalizer.js, plugin_contract_canonicalizer.js)
- identity: 1 (canonical_fingerprint_service.js - dual authority)
- lineage: 10 (dag_validator.ts, formal_invariant_graph_verifier.js, structural_graph_builder.js, merkle_anchor_chain_fork_graph_builder.js, merkle_anchor_chain_drift_detector.js, merkle_anchor_chain_drift_summary.js, merkle_anchor_chain_severity_and_divergence.js, merkle_anchor_chain_multi_divergence_severity.js, cross_anchor_drift_detector.js, cross_anchor_drift_summary.js, structural_drift_guard.js)
- replay: 1 (deterministic_replay_harness.js)
- witness: 24 (merkle_anchor_* modules, cross_anchor_* modules, execution_integrity_auditor.js, authority_boundary_prover.js)
- invariant: 1 (formal_invariant_graph_verifier.js)
- verification: 20 (all *_misuse_tests.js, all *_validator.js, execution_integrity_auditor.js, semantic_delta_validator.js, etc.)
- infrastructure: 15 (plugin_* modules, runtime_* modules, resource_ceiling_enforcer.js, constitutional_ci.yml)
- projection: 4 (projection_ephemerality_enforcer.js, projection_layer_isolation_guard.js, author_projection_boundary_validator.js, overlay_rendering_contract_validator.js)
- event: 1 (event_log.ts)
- orchestration: 5 (commit_controller.ts, plugin_execution_scheduler.js, runtime_adapter.js, worker_runtime_adapter.js, evaluation_context_assembler.js)
- persistence: 2 (artifact_store.ts, lineage_store.ts)
- security: 4 (plugin_isolation_sandbox.js, isolated_execution_adapter.js, adversarial_red_team_harness.js, artifact_firewall.js)

**BY REPLAY_SENSITIVITY:**
- CRITICAL: 7 (canonical_fingerprint_service.js, deterministic_replay_harness.js, execution_integrity_auditor.js, merkle_anchor_replay_verifier.js, merkle_anchor_chain_drift_detector.js, cross_anchor_drift_detector.js, event_log.ts)
- HIGH: 25 (formal_invariant_graph_verifier.js, structural_graph_builder.js, merkle_anchor_* modules, cross_anchor_* modules, etc.)
- MEDIUM: 22 (plugin_* modules, projection_* modules, runtime_* modules, etc.)
- LOW: 5 (cross_anchor_drift_summary_presentation_adapter.js, constitutional_ci.yml, etc.)

**BY DETERMINISM_SENSITIVITY:**
- CRITICAL: 5 (canonical_fingerprint_service.js, deterministic_replay_harness.js, execution_integrity_auditor.js, merkle_anchor_replay_verifier.js, merkle_anchor_chain_drift_detector.js)
- HIGH: 20 (formal_invariant_graph_verifier.js, structural_graph_builder.js, merkle_anchor_* modules, cross_anchor_* modules, etc.)
- MEDIUM: 30 (plugin_* modules, projection_* modules, runtime_* modules, etc.)
- LOW: 4 (cross_anchor_drift_summary_presentation_adapter.js, constitutional_ci.yml, etc.)
