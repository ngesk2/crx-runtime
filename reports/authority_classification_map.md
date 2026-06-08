# AUTHORITY CLASSIFICATION MAP

**Generated:** 2026-06-07
**Mode:** READ-ONLY

---

## SUPREME AUTHORITY

| Candidate | Document | Claim | Evidence | Classification |
|-----------|----------|-------|----------|----------------|
| AGENT.md | CRX/AGENT.md | "Authority: Repository Constitutional Layer — supreme law for all agent execution" | Declared P1 in own hierarchy | CANONICAL — DECLARED |
| CRX_CONSTITUTION.md | CRX/CRX_CONSTITUTION.md | "Supersedes: All informal kernel descriptions for purposes of extraction and implementation conformance" | FROZEN Phase 3.5A, 641 lines | CANONICAL — CONFLICTS with AGENT.md hierarchy |
| UCIA-CONSTITUTION-v1.0.md | CRX/knowledge/authoritative/ | "The Constitutional Source of Truth for Replayable Constitutional Civilization Infrastructure" | Referenced as P2 by AGENT.md | CANONICAL — DOMAIN (UCIA) |

**Conflict:** AGENT.md does not include CRX_CONSTITUTION.md in its hierarchy. CRX_CONSTITUTION.md claims supersession over "all informal kernel descriptions." Unclear which is supreme.

---

## CONSTITUTIONAL AUTHORITY BY DOMAIN

### Identity Authority

| Source | Location | Capability | Status |
|--------|----------|------------|--------|
| CRX_CONSTITUTION.md Phase 3 | CRX/ | Declares Identity Authority owns: content normalization law, identity assignment, verification, equality judgment | DEFINED |
| `identity_engine.ts` | CRX/runtime/ | SHA-256 hash, no domain separation, no verification | INCOMPLETE IMPLEMENTATION |
| `canonical_engine.ts` | CRX/runtime/ | JSON key-sort only | INCOMPLETE IMPLEMENTATION |
| `canonical_fingerprint_service.js` | constitutional-integration-lab/extracted/js_txt/ | Domain-separated, verified, complete | ARCHIVED — NOT INTEGRATED |

### Lineage Authority

| Source | Location | Capability | Status |
|--------|----------|------------|--------|
| CRX_CONSTITUTION.md Phase 3 | CRX/ | Declares Lineage Authority owns: parent-child relationships, DAG legality, ancestry queries, fork detection | DEFINED |
| `dag_validator.ts` | CRX/runtime/ | Self-loop + duplicate parent only | INCOMPLETE IMPLEMENTATION |
| `formal_invariant_graph_verifier.js` | constitutional-integration-lab/extracted/js_txt/ | Full DFS cycle detection, graph fingerprinting, invariant binding | ARCHIVED — NOT INTEGRATED |

### Event Recording Authority

| Source | Location | Capability | Status |
|--------|----------|------------|--------|
| CRX_CONSTITUTION.md Phase 3 | CRX/ | Declares Event Recording Authority owns: occurrence capture, append-only sequence, immutability, temporal ordering | DEFINED |
| `event_log.ts` | CRX/runtime/ | Minimal PostgreSQL INSERT | INCOMPLETE IMPLEMENTATION |
| `canonical-event-envelope.json` | CascadeProjects/events/ | Complete event envelope schema (7 required fields) | PROPOSED — NOT IMPLEMENTED |
| `init-db.sql` | constitutional-integration-lab/extracted/schemas/ | Full event table with UUID, lineage, policy_version | ARCHIVED SCHEMA — NOT INTEGRATED |

### Replay Authority

| Source | Location | Capability | Status |
|--------|----------|------------|--------|
| CRX_CONSTITUTION.md Phase 3 | CRX/ | Declares Replay Authority owns: deterministic reconstruction law, integrity verification, divergence detection, replay proof | DEFINED |
| `deterministic_replay_harness.js` | constitutional-integration-lab/extracted/js_txt/ | Double-execution proof, snapshot/registry/invariant binding | ARCHIVED — NOT INTEGRATED |
| Runtime implementation | CRX/runtime/ | **NONE** | MISSING |

### Policy Authority

| Source | Location | Capability | Status |
|--------|----------|------------|--------|
| CRX_CONSTITUTION.md Phase 3 | CRX/ | Declares Policy Authority owns: mutation authorization, constraint evaluation, versioning, claim disposition | DEFINED |
| Runtime implementation | **NONE** | No policy tables, no policy engine, no policy evaluation | MISSING |
| `constitutional_ci_gate.js` | constitutional-integration-lab/extracted/js_txt/ | CI gate enforcement (archival) | ARCHIVED — NOT INTEGRATED |

### State Authority

| Source | Location | Capability | Status |
|--------|----------|------------|--------|
| CRX_CONSTITUTION.md Phase 3 | CRX/ | Declares State Authority is jurisdictionally derived — operates on replay and policy outputs only | DEFINED |
| `constitutional-state.schema.json` | Codex/2026-06-04/outputs/ | State schema (stateId, facts, capabilities, invariants, obligations, validity, stateHash) | PROPOSED — NOT IMPLEMENTED |
| Runtime implementation | **NONE** | No state derivation, no state projection | MISSING |

### Witness (Absorbed Authority)

| Source | Location | Capability | Status |
|--------|----------|------------|--------|
| CRX_CONSTITUTION.md Phase 3 | CRX/ | Witness is eliminated as independent authority. Absorbed by Identity (creation) and Replay (verification) | DEFINED |
| `merkle_anchor_*.js` (15+ modules) | constitutional-integration-lab/extracted/js_txt/ | Merkle chain validation, drift detection, fork graph building, replay verification | ARCHIVED — NOT INTEGRATED |
| `authority_boundary_prover.js` | constitutional-integration-lab/extracted/js_txt/ | Authority boundary attestation | ARCHIVED — NOT INTEGRATED |
| Runtime implementation | **NONE** | No witness generation, no witness verification | MISSING |

---

## SPAN OF AUTHORITY PER ARTIFACT

### AGENT.md
- **Span:** Agent execution, infrastructure, consolidation, audit behavior
- **Does NOT span:** Kernel internals (delegated to UCIA), engineering process (delegated to COS)
- **Amendment mechanism:** Not explicitly defined
- **Risk:** LOW — Well-defined scope

### CRX_CONSTITUTION.md
- **Span:** Constitutional law only (explicitly excludes: migration, extraction, infrastructure, repository layout, implementation)
- **Does NOT span:** Implementation details
- **Amendment mechanism:** Not explicitly defined (FROZEN status implies amendments require freeze lift)
- **Risk:** MEDIUM — Frozen status may block necessary changes

### UCIA-CONSTITUTION-v1.0.md
- **Span:** Kernel primitives, survivability, replay semantics, knowledge/attention/narrative/media/agent/governance runtimes, persistence, distributed sync, threat model
- **Amendment mechanism:** Article 17 (proposal → legitimacy verification → consensus → application → record)
- **Risk:** LOW — Well-defined amendment process

### COS-CONSTITUTION.md
- **Span:** Engineering process, WAIT default, 8-stage gate, epistemic labels, decision records, execution authorization
- **Amendment mechanism:** Amendment Proposal (AMEND-XXX) → impact analysis → replay verification → version bump → archive
- **Risk:** LOW — Well-defined amendment process

---

## ORPHAN AUTHORITIES

The following domains have NO identified authority:

1. **Infrastructure Authority** — Docker, PostgreSQL, Redis, Ollama have no governing document
2. **Ingestion Authority** — RSS, YouTube, GitHub, Spotify have no governing document
3. **Export Authority** — Output formatting, markdown generation have no governing document
4. **Agent Permission Authority** — `agent_permissions.md` exists but is not declared as constitutional authority

---

## AUTHORITY DEPENDENCY GRAPH

```
AGENT.md (P1) ──── UNKNOWN RELATIONSHIP ──── CRX_CONSTITUTION.md (FROZEN)
    │                                                │
    ├── UCIA-CONSTITUTION-v1.0.md (P2) ◄────────────┤
    ├── COS-CONSTITUTION.md (P3)                     │
    │       │                                        │
    │       └── VOS diagrams (FROZEN at v1.0.0)      │
    │                                                │
    └── Domain specs under knowledge/authoritative/ (P5)
            │
            ├── claim.schema.json
            ├── decision.schema.json
            ├── constitutional-agent-infrastructure.md
            └── ... (30+ documents)

PARALLEL: canonical-event-envelope.json (CascadeProjects)
PARALLEL: init-db.sql (integration lab)
PARALLEL: JS.txt archive (constitutional-integration-lab)
    │
    ├── canonical_fingerprint_service.js (Identity + Canonicalization)
    ├── formal_invariant_graph_verifier.js (Lineage + Invariant)
    ├── deterministic_replay_harness.js (Replay)
    ├── execution_integrity_auditor.js (Verification)
    └── merkle_anchor_*.js (Witness — 15+ modules)

ISOLATED: Codex/2026-06-04/outputs/ (23 agent-authored schemas/reports)
ISOLATED: Codex/2026-05-31/crx/constitution/ (10 constitutional laws — stubs)
```

---

**Classification:** FACT (verified by direct document inspection)
**Confidence:** HIGH
