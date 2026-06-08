# MODULARIZATION_PLAN.md

**Generated:** 2026-06-07
**Principle:** Separate constitutional authority from infrastructure. Archive losers. Preserve legacy.

---

## CURRENT STATE

```
CRX/
├── AGENT.md
├── CRX_CONSTITUTION.md
├── runtime/           ← 12 .ts files, ~179 LOC (minimal skeleton)
├── knowledge/         ← 35+ .md files + schemas
├── vos/               ← COS constitution + schemas
├── reports/           ← 30+ analysis reports
├── inventory/         ← 14 inventory files
├── agents/            ← Dockerfiles, compose, scripts
├── infra/             ← 9 EMPTY directories (scaffolding only)
└── constitutional-integration-lab/  ← Analysis workspace (not part of CRX)
```

## TARGET STATE

```
CRX/
├── constitutional/           ← SUPREME AUTHORITY DOCUMENTS
│   ├── AGENT.md              ← (moved from root)
│   ├── CRX_CONSTITUTION.md   ← (moved from root)
│   ├── UCIA-CONSTITUTION-v1.0.md ← (moved from knowledge/authoritative/)
│   ├── COS-CONSTITUTION.md   ← (moved from vos/cos/)
│   └── persistence-constitution.md ← (moved from knowledge/authoritative/)
│
├── runtime/                  ← EXECUTABLE AUTHORITIES (ported from archive)
│   ├── identity/             ← FINGERPRINT AUTHORITY
│   │   └── canonical_fingerprint_service.ts  ← (ported from JS archive)
│   ├── lineage/              ← LINEAGE AUTHORITY
│   │   └── formal_invariant_graph_verifier.ts  ← (ported from JS archive)
│   ├── replay/               ← REPLAY AUTHORITY
│   │   ├── deterministic_replay_harness.ts  ← (ported from JS archive)
│   │   └── replay_controller.ts
│   ├── witness/              ← WITNESS AUTHORITY
│   │   ├── merkle_anchor_chain_validator.ts  ← (ported from JS archive)
│   │   ├── merkle_anchor_replay_verifier.ts
│   │   ├── authority_boundary_prover.ts
│   │   └── execution_integrity_auditor.ts
│   ├── policy/               ← POLICY AUTHORITY
│   │   └── constitutional_ci_gate.ts  ← (ported from JS archive)
│   ├── state/                ← STATE AUTHORITY (new — built from schema)
│   │   ├── state_derivation_engine.ts
│   │   └── constitutional_state.ts
│   ├── event/                ← EVENT RECORDING AUTHORITY
│   │   ├── event_envelope.ts  ← (from canonical-event-envelope.json)
│   │   └── event_log.ts       ← (refactored to use envelope)
│   ├── transcript/           ← TRANSCRIPT AUTHORITY
│   │   └── transcript_generator.ts
│   ├── persistence/          ← PERSISTENCE LAYER
│   │   ├── init-db.sql        ← (replaces ledger_schema.sql)
│   │   ├── artifact_store.ts
│   │   ├── lineage_store.ts
│   │   └── event_store.ts
│   ├── api/                  ← INFRASTRUCTURE ADAPTER (Express HTTP)
│   │   ├── commit_controller.ts
│   │   ├── audit_controller.ts  ← (refactored to use witness system)
│   │   └── replay_controller.ts
│   └── server.ts             ← (Express entry point)
│
├── schemas/                  ← JSON SCHEMAS (single source of truth)
│   ├── canonical-event-envelope.json  ← (moved from CascadeProjects)
│   ├── constitutional-state.schema.json  ← (moved from Codex/2026-06-04)
│   ├── claim.schema.json
│   ├── decision.schema.json
│   ├── fact.schema.json
│   ├── invariant.schema.json
│   ├── obligation.schema.json
│   ├── capability.schema.json
│   └── foundational-primitives.json
│
├── knowledge/                ← KNOWLEDGE SUBSTRATE (unchanged)
│   ├── authoritative/        ← (35+ .md files — research, not authority)
│   ├── derived/              ← (60+ .md files — analysis, not authority)
│   └── experimental/         ← (3 .md files — experiments)
│
├── vos/                      ← VISUAL OPERATING SYSTEM (unchanged)
│   └── cos/                  ← (diagrams, templates, checklists)
│
├── archives/                 ← DEPRECATED / LEGACY IMPLEMENTATIONS
│   ├── runtime-fingerprint/  ← identity_engine.ts, canonical_engine.ts
│   ├── runtime-lineage/      ← dag_validator.ts
│   ├── runtime-events/       ← old event_log.ts
│   ├── runtime-persistence/  ← ledger_schema.sql
│   ├── runtime-api/          ← old audit_controller.ts
│   ├── js-archive/           ← Original JS.txt + extracted js_txt/ (59 files)
│   ├── python-legacy/        ← All .docx files with Python source (16 files)
│   ├── codex-archive/        ← Codex/2026-06-04/outputs/ (23 files)
│   └── cascade-archive/      ← CascadeProjects/ (if not merged into schemas/)
│
├── infra/                    ← INFRASTRUCTURE DEPLOYMENT (Docker, etc.)
│   ├── docker-compose.yml
│   ├── .env.example
│   ├── postgres/
│   ├── redis/
│   ├── ollama/
│   ├── api/
│   ├── worker/
│   └── observability/
│
├── reports/                  ← ANALYSIS RECORDS (unchanged)
│
├── miscellaneous/            ← UNASSIGNED (temporary holding)
│   └── (anything not classified above)
│
└── docs/                     ← DOCUMENTATION
    ├── architecture/
    ├── getting-started/
    └── api-reference/
```

---

## MIGRATION PRIORITY

### Phase 1: Foundation (No dependencies)
1. Create `schemas/` directory. Move all JSON schemas there.
2. Create `archives/` directory. Move deprecated runtime files there.
3. Replace `ledger_schema.sql` with `init-db.sql`.
4. Refactor `event_log.ts` to use canonical event envelope.

### Phase 2: Core Authorities (Depends on Phase 1)
5. Port `canonical_fingerprint_service.js` → `identity/canonical_fingerprint_service.ts`
6. Port `formal_invariant_graph_verifier.js` → `lineage/formal_invariant_graph_verifier.ts`
7. Replace `identity_engine.ts` and `canonical_engine.ts` with ported version.
8. Replace `dag_validator.ts` with ported version.

### Phase 3: Advanced Authorities (Depends on Phase 2)
9. Port `deterministic_replay_harness.js` → `replay/deterministic_replay_harness.ts`
10. Port `merkle_anchor_chain_validator.js` → `witness/merkle_anchor_chain_validator.ts`
11. Port remaining 14 witness modules.
12. Port `constitutional_ci_gate.js` → `policy/constitutional_ci_gate.ts`

### Phase 4: New Build (Depends on Phase 2)
13. Build `state/state_derivation_engine.ts` from `constitutional-state.schema.json`
14. Build `transcript/transcript_generator.ts`

### Phase 5: Infrastructure (Depends on Phases 1-4)
15. Populate `infra/` with Docker configurations.
16. Wire API controllers to new authority modules.
17. Add replay endpoint.

---

## CONSTRAINTS

1. **READ-ONLY during audit.** No files moved until audit is complete.
2. **No authority promotion without verification.** Every port must pass `node --check` or `tsc`.
3. **No deletion.** All deprecated files go to `archives/`, never deleted.
4. **No silent constitutional drift.** Every move is documented.
5. **Infrastructure is subordinate.** `infra/` never contains constitutional logic.

---

**Classification:** PRESCRIPTIVE (based on audit findings)
**Confidence:** HIGH (all source locations verified)
