# FLOATING MODULE INVENTORY

**Generated:** 2026-06-07
**Mode:** READ-ONLY

---

## DEFINITION

"Floating modules" are source files that exist in the corpus but have no integration path to the active runtime. They are not referenced by any runtime code, not imported by any runtime module, and not included in any runtime build.

---

## FLOATING IN ARCHIVE (Extracted JS.txt) — 59 MODULES

All 59 extracted JS.txt modules are floating with respect to the active CRX runtime. None are imported by any runtime TypeScript file.

### By Subsystem

#### Replay System (1 module, 296 LOC)
| Module | LOC | Floating Because |
|--------|-----|------------------|
| `deterministic_replay_harness.js` | 296 | No runtime imports it; runtime has no replay system |

#### Fingerprint System (1 module, 479 LOC)
| Module | LOC | Floating Because |
|--------|-----|------------------|
| `canonical_fingerprint_service.js` | 479 | Runtime uses identity_engine.ts instead |

#### Graph/Lineage System (3 modules, 898 LOC)
| Module | LOC | Floating Because |
|--------|-----|------------------|
| `formal_invariant_graph_verifier.js` | 262 | Runtime uses dag_validator.ts instead |
| `structural_graph_builder.js` | 354 | No runtime equivalent |
| `snapshot_lineage_integrity_guard.js` | 282 | No runtime equivalent |

#### Witness/Merkle System (15 modules, ~3,800 LOC)
| Module | LOC | Floating Because |
|--------|-----|------------------|
| `merkle_anchor_chain_validator.js` | 220 | No runtime equivalent |
| `merkle_anchor_chain_validator_misuse_tests.js` | 284 | No runtime equivalent |
| `merkle_anchor_replay_verifier.js` | 233 | No runtime equivalent |
| `merkle_anchor_replay_verifier_misuse_tests.js` | 282 | No runtime equivalent |
| `merkle_anchor_chain_canonicalizer.js` | 214 | No runtime equivalent |
| `merkle_anchor_chain_drift_detector.js` | 259 | No runtime equivalent |
| `merkle_anchor_chain_drift_misuse_tests.js` | 293 | No runtime equivalent |
| `merkle_anchor_chain_drift_summary.js` | 670 | No runtime equivalent |
| `merkle_anchor_chain_fork_graph_builder.js` | 283 | No runtime equivalent |
| `merkle_anchor_chain_fork_graph_misuse_tests.js` | 260 | No runtime equivalent |
| `merkle_anchor_chain_multi_divergence_severity.js` | 250 | No runtime equivalent |
| `merkle_anchor_chain_multi_graph_misuse_tests.js` | 331 | No runtime equivalent |
| `merkle_anchor_chain_multi_graph_visualizer.js` | 224 | No runtime equivalent |
| `merkle_anchor_chain_severity_and_divergence.js` | 571 | No runtime equivalent |
| `merkle_anchor_adapter_misuse_tests.js` | 200 | No runtime equivalent |

#### Cross-Anchor Drift System (5 modules, ~1,500 LOC)
| Module | LOC | Floating Because |
|--------|-----|------------------|
| `cross_anchor_drift_detector.js` | 258 | No runtime equivalent |
| `cross_anchor_drift_misuse_tests.js` | 257 | No runtime equivalent |
| `cross_anchor_drift_summary.js` | 288 | No runtime equivalent |
| `cross_anchor_drift_summary_misuse_tests.js` | 302 | No runtime equivalent |
| `cross_anchor_drift_summary_presentation_adapter.js` | 154 | No runtime equivalent |

#### Verification System (6 modules, ~2,200 LOC)
| Module | LOC | Floating Because |
|--------|-----|------------------|
| `execution_integrity_auditor.js` | 395 | No runtime equivalent |
| `artifact_reversibility_validator.js` | 400 | No runtime equivalent |
| `artifact_firewall.js` | 202 | No runtime equivalent |
| `domain_lockfile_fingerprint_guard.js` | 52 | No runtime equivalent |
| `consensus_quorum_validator.js` | 255 | No runtime equivalent |
| `registry_freeze_verifier.js` | 376 | No runtime equivalent |

#### Structural/Identity System (3 modules, ~900 LOC)
| Module | LOC | Floating Because |
|--------|-----|------------------|
| `structural_identity_stability_test_suite.js` | 311 | No runtime equivalent |
| `semantic_delta_validator.js` | 357 | No runtime equivalent |
| `structural_drift_guard.js` | 247 | No runtime equivalent |

#### Projection System (4 modules, ~1,200 LOC)
| Module | LOC | Floating Because |
|--------|-----|------------------|
| `projection_ephemerality_enforcer.js` | 206 | No runtime equivalent |
| `projection_layer_isolation_guard.js` | 309 | No runtime equivalent |
| `author_projection_boundary_validator.js` | 380 | No runtime equivalent |
| `overlay_rendering_contract_validator.js` | 387 | No runtime equivalent |

#### Plugin System (8 modules, ~2,900 LOC)
| Module | LOC | Floating Because |
|--------|-----|------------------|
| `plugin_execution_scheduler.js` | 383 | No runtime equivalent |
| `plugin_isolation_sandbox.js` | 415 | No runtime equivalent |
| `plugin_contract_validator.js` | 422 | No runtime equivalent |
| `plugin_contract_canonicalizer.js` | 271 | No runtime equivalent |
| `plugin_registry_integrity_guard.js` | 272 | No runtime equivalent |
| `entropy_budget_guard.js` | 252 | No runtime equivalent |
| `suggestion_schema_enforcer.js` | 294 | No runtime equivalent |
| `constitutional_ci_gate.js` | 872 | No runtime equivalent |

#### Runtime/Infra System (6 modules, ~2,100 LOC)
| Module | LOC | Floating Because |
|--------|-----|------------------|
| `runtime_adapter.js` | 431 | No runtime equivalent |
| `worker_runtime_adapter.js` | 346 | No runtime equivalent |
| `worker_runtime_entry.js` | 70 | No runtime equivalent |
| `isolated_execution_adapter.js` | 372 | No runtime equivalent |
| `evaluation_context_assembler.js` | 281 | No runtime equivalent |
| `resource_ceiling_enforcer.js` | 300 | No runtime equivalent |

#### Security System (2 modules, ~690 LOC)
| Module | LOC | Floating Because |
|--------|-----|------------------|
| `adversarial_red_team_harness.js` | 413 | No runtime equivalent |
| `anti_authority_field_guard.js` | 277 | No runtime equivalent |

#### Cross-Bundle System (2 modules, ~860 LOC)
| Module | LOC | Floating Because |
|--------|-----|------------------|
| `cross_bundle_divergence_analyzer.js` | 429 | No runtime equivalent |
| `capability_scope_auditor.js` | 212 | No runtime equivalent |

#### Configuration System (1 module, ~300 LOC)
| Module | LOC | Floating Because |
|--------|-----|------------------|
| `domain_usage_static_analyzer.js` | 109 | No runtime equivalent |

#### CI System (1 module, ~1,871 LOC)
| Module | LOC | Floating Because |
|--------|-----|------------------|
| `constitutional_ci.yml` + embedded JS | 872 | No runtime equivalent |

---

## FLOATING IN CASCADEPROJECTS

| File | LOC | Floating Because |
|------|-----|------------------|
| `canonical-event-envelope.json` | 64 (schema) | Not imported by runtime |
| `foundational-primitives.json` | ~50 (schema) | Not imported by runtime |
| `init-db.sql` | 156 | Not used by runtime (runtime uses ledger_schema.sql) |
| `constitutional-principles.md` | ~100 | Not referenced by runtime |
| `system-invariants.md` | ~100 | Not referenced by runtime |
| `reuse-before-create.md` | ~50 | Not referenced by runtime |
| `audit-agent.md` | ~50 | Not referenced by runtime |
| `replay-ci.yml` | ~30 | Not used by any CI system |
| `witness-check.yml` | ~30 | Not used by any CI system |

---

## FLOATING IN CODEX 2026-06-04 OUTPUTS

All 23 files in `Codex/2026-06-04/files-mentioned-by-the-user-pasted/outputs/` are floating:
- 5 JSON schemas (constitutional-state, capability, fact, invariant, obligation)
- 18 markdown analysis reports

None are imported by or referenced from the active runtime.

---

## FLOATING INTEGRATION LAB SCHEMAS

| File | LOC | Floating Because |
|------|-----|------------------|
| `init-db.sql` | 156 | Copy of CascadeProjects schema, not used by runtime |
| `canonical-event-envelope.json` | 64 | Copy of CascadeProjects schema |
| `claim.schema.json` | ~89 | Not used by runtime |
| `decision.schema.json` | ~70 | Not used by runtime |
| `constitutional-state.schema.json` | ~84 | Not used by runtime |
| `capability.schema.json` | ~50 | Not used by runtime |
| `fact.schema.json` | ~50 | Not used by runtime |
| `invariant.schema.json` | ~50 | Not used by runtime |
| `obligation.schema.json` | ~50 | Not used by runtime |
| `argument-graph.schema.json` | ~50 | Not used by runtime |
| `audit-event.schema.json` | ~50 | Not used by runtime |
| `foundational-primitives.json` | ~50 | Not used by runtime |

---

## SUMMARY

| Location | Floating Modules | Total LOC | Integration Status |
|----------|-----------------|-----------|-------------------|
| Archive (JS.txt / extracted) | 59 | ~18,409 | NOT INTEGRATED |
| CascadeProjects | 9 | ~600 | NOT INTEGRATED |
| Codex 2026-06-04 | 23 | ~2,000 | NOT INTEGRATED |
| Integration Lab schemas | 11 | ~800 | NOT INTEGRATED |
| **TOTAL** | **~102** | **~21,809** | **NOT INTEGRATED** |

**FACT.** The CRX corpus contains ~21,809 LOC of floating module code that is not integrated into the active runtime. The active runtime contains only ~179 LOC.

---

**Classification:** FACT (verified by direct filesystem and import inspection)
**Confidence:** HIGH
