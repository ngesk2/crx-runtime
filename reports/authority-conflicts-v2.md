# Authority Conflicts v2.0

**Audit Date:** 2026-06-07  
**Protocol:** CRX Layer 0B — Sovereignty Stabilization Audit  
**Mode:** READ-ONLY  
**Classification:** FACT, INFERENCE, UNKNOWN

---

## Executive Summary

**FACT:** Multiple constitutional authorities exist with overlapping scopes and potential contradictions.

**FACT:** Authority hierarchy is defined in AGENT.md but implementation drift exists.

**INFERENCE:** Authority consolidation required before Layer 1 implementation.

---

## Constitutional Authority Hierarchy

**FACT:** Per AGENT.md, authority hierarchy is:

| Priority | Document | Scope | Status |
|----------|----------|-------|--------|
| 1 | AGENT.md | Agent execution, infrastructure, consolidation, audit behavior | CANONICAL |
| 2 | knowledge/authoritative/UCIA-CONSTITUTION-v1.0.md | Kernel primitives, survivability, replay semantics | AUTHORITATIVE |
| 3 | vos/cos/CONSTITUTION.md | Engineering process, WAIT default, 8-stage gate | AUTHORITATIVE |
| 4 | agents/agent_permissions.md | Bounded agent permission matrix | AUTHORITATIVE |
| 5 | Domain specs under knowledge/authoritative/ | Specialized constitutional layers | AUTHORITATIVE |

---

## Authority Dependency Graph

```
AGENT.md (Priority 1)
├── UCIA-CONSTITUTION-v1.0.md (Priority 2)
│   ├── Kernel primitives (Assertion, Relation, Evaluator, Governance, Identity, Time, Ordering)
│   ├── Replay Theorem
│   └── Runtime definitions (Knowledge, Attention, Narrative, Media, Agent)
├── vos/cos/CONSTITUTION.md (Priority 3)
│   ├── Constitutional primitives (Truth > Reasoning, Verification > Confidence, etc.)
│   ├── Four domains of governance (Understanding, Reasoning, Decision Making, Execution)
│   └── Entropy reduction mandate
├── agents/agent_permissions.md (Priority 4)
│   ├── Agent permission matrix
│   └── Safety mechanisms
└── Domain specs (Priority 5)
    ├── claim.schema.json
    ├── decision.schema.json
    ├── replay-reconstruction.md
    └── mutation-governance-model.md
```

---

## Identified Contradictions

### Contradiction 1: Primitive Definitions

**FACT:** AGENT.md defines 5 foundational primitives (Provenance, Claim, Decision, Fact, Rule).

**FACT:** UCIA-CONSTITUTION-v1.0.md defines 7 kernel primitives (Assertion, Relation, Evaluator, Evaluator Selection, Canonical ID, Timestamp, Causal Ordering).

**CONTRADICTION:** Different primitive sets for constitutional foundation.

**SEVERITY:** HIGH

**RESOLUTION REQUIRED:** Canonicalize primitive definitions across AGENT.md and UCIA-CONSTITUTION-v1.0.md.

---

### Contradiction 2: Identity Authority

**FACT:** CRX_CONSTITUTION.md states Canonicalization is MERGED into Identity authority (eliminated as independent authority).

**FACT:** AGENT.md lists canonicalization as separate concern in search locations.

**CONTRADICTION:** AGENT.md references eliminated authority.

**SEVERITY:** MEDIUM

**RESOLUTION REQUIRED:** Update AGENT.md to reflect CRX_CONSTITUTION.md authority elimination.

---

### Contradiction 3: Witness Authority

**FACT:** CRX_CONSTITUTION.md states Witness is ELIMINATED as independent authority (absorbed by Identity + Replay).

**FACT:** AGENT.md does not mention Witness elimination.

**CONTRADICTION:** AGENT.md does not reflect constitutional authority elimination.

**SEVERITY:** MEDIUM

**RESOLUTION REQUIRED:** Update AGENT.md to reflect CRX_CONSTITUTION.md authority elimination.

---

### Contradiction 4: Infrastructure Mandate

**FACT:** AGENT.md mandates "There must be ONE canonical infrastructure stack" in infra/.

**FACT:** AGENT.md mandates "All services boot from docker compose up -d ONLY".

**FACT:** infra/ does NOT exist.

**FACT:** agents/docker-compose.yml exists (broken scaffold).

**CONTRADICTION:** Constitutional infrastructure mandate violated by missing infra/ and broken agents/docker-compose.yml.

**SEVERITY:** HIGH

**RESOLUTION REQUIRED:** Create infra/ with canonical docker-compose.yml, delete agents/docker-compose.yml.

---

### Contradiction 5: Event Schema Drift

**FACT:** AGENT.md states "No competing event schemas allowed".

**FACT:** 4 competing event schemas exist:
- vos/cos/schema/audit-event.schema.json (COS governance audit)
- runtime/kernel/commit-service/src/persistence/ledger_schema.sql (execution_events table)
- knowledge/authoritative/claim.schema.json (UCIA claim events)
- knowledge/authoritative/decision.schema.json (UCIA decision events)

**CONTRADICTION:** Constitutional mandate violated by competing event schemas.

**SEVERITY:** HIGH

**RESOLUTION REQUIRED:** Consolidate all event schemas into AGENT.md canonical event envelope.

---

### Contradiction 6: Agent Ontology Duplication

**FACT:** AGENT.md states "Three agent ontologies exist today — canonicalize to one".

**FACT:** 3 agent ontologies exist:
- Docker agents (agents/docker-compose.yml: planner, refactor, documentation, governance)
- Creator workflow agents (knowledge/derived/agent-workflow-topology.md)
- UCIA constitutional agents (knowledge/authoritative/constitutional-agent-infrastructure.md)

**CONTRADICTION:** Agent ontology duplication not resolved.

**SEVERITY:** MEDIUM

**RESOLUTION REQUIRED:** Canonicalize to single agent ontology per AGENT.md instruction.

---

### Contradiction 7: Repository Model

**FACT:** AGENT.md states "GitHub is the Constitutional Root Filesystem".

**FACT:** CRX root has NO .git (constitutional workspace root, not yet initialized as single repo).

**FACT:** Sub-repos exist (knowledge/, vos/, runtime/) with separate .git.

**CONTRADICTION:** Repository model does not match AGENT.md specification.

**SEVERITY:** MEDIUM

**RESOLUTION REQUIRED:** Initialize CRX root as single git repository or clarify multi-repo model in AGENT.md.

---

## Authority Boundary Violations

### Violation 1: Mixed Authority Ownership

**FACT:** Per AUTHORITY_CONFLICT_REPORT.md, Transport layer (commit_controller.ts) owns derivation (canonicalization, identity computation).

**SEVERITY:** MEDIUM

**VIOLATION:** Orchestration layer encroaching on Constitutional authorities (Canonicalization, Identity).

**RESOLUTION REQUIRED:** Refactor to separate transport from derivation authorities.

---

### Violation 2: Shadow Authority

**FACT:** CascadeProjects/AGENT.md exists (duplicate constitutional document).

**FACT:** Per REPOSITORY_PROVENANCE_MAP.md, CascadeProjects is GENERATED_BY_AGENT (wrong location).

**SEVERITY:** HIGH

**VIOLATION:** Shadow constitutional authority in wrong location.

**RESOLUTION REQUIRED:** Delete or clearly mark CascadeProjects as non-authoritative.

---

## Authority Consolidation Recommendations

### Priority 1: Resolve Primitive Contradiction

**ACTION:** Canonicalize primitive definitions between AGENT.md (5 primitives) and UCIA-CONSTITUTION-v1.0.md (7 primitives).

**DECISION REQUIRED:** Which primitive set is canonical?

---

### Priority 2: Create Canonical Infrastructure

**ACTION:** Create infra/ with canonical docker-compose.yml per AGENT.md mandate.

**ACTION:** Delete agents/docker-compose.yml (broken scaffold).

---

### Priority 3: Consolidate Event Schemas

**ACTION:** Consolidate 4 competing event schemas into AGENT.md canonical event envelope.

---

### Priority 4: Update AGENT.md for Authority Eliminations

**ACTION:** Update AGENT.md to reflect CRX_CONSTITUTION.md authority eliminations (Canonicalization, Witness).

---

### Priority 5: Resolve Repository Model

**ACTION:** Initialize CRX root as single git repository OR clarify multi-repo model in AGENT.md.

---

### Priority 6: Canonicalize Agent Ontology

**ACTION:** Canonicalize 3 agent ontologies to single ontology per AGENT.md instruction.

---

### Priority 7: Eliminate Shadow Authority

**ACTION:** Delete or clearly mark CascadeProjects as non-authoritative.

---

## Authority Dependency Chain

```
Constitutional Authority (AGENT.md)
├── Identity Authority
│   ├── Identity Engine (identity_engine.ts) - VERIFIED_RUNTIME_TRUTH
│   └── Canonicalization Engine (canonical_engine.ts) - VERIFIED_RUNTIME_TRUTH
├── Lineage Authority
│   ├── DAG Validator (dag_validator.ts) - VERIFIED_RUNTIME_TRUTH
│   └── Lineage Store (lineage_store.ts) - VERIFIED_RUNTIME_TRUTH
├── Event Recording Authority
│   ├── Event Log (event_log.ts) - VERIFIED_RUNTIME_TRUTH
│   └── execution_events table - VERIFIED_RUNTIME_TRUTH
├── Replay Authority
│   ├── replay-reconstruction.md - DOC_ONLY
│   ├── deterministic-replay-infrastructure.md - DOC_ONLY
│   └── replay-verification-model.md - DOC_ONLY
└── Policy Authority
    ├── AGENT.md - CANONICAL
    ├── UCIA-CONSTITUTION-v1.0.md - AUTHORITATIVE
    ├── vos/cos/CONSTITUTION.md - AUTHORITATIVE
    └── agents/agent_permissions.md - AUTHORITATIVE
```

---

## Critical Authority Gaps

### Gap 1: Replay Authority Not Executable

**FACT:** Replay authority is ROOT AUTHORITY per CRX_CONSTITUTION.md.

**FACT:** replay-reconstruction.md exists (specification).

**FACT:** NO executable replay engine exists.

**GAP:** Replay authority cannot be enforced.

---

### Gap 2: Policy Authority Not Executable

**FACT:** Policy authority is ROOT AUTHORITY per CRX_CONSTITUTION.md.

**FACT:** Policy documents exist.

**FACT:** NO executable policy engine exists.

**GAP:** Policy authority cannot be enforced.

---

### Gap 3: Infrastructure Authority Not Implemented

**FACT:** AGENT.md mandates canonical infrastructure in infra/.

**FACT:** infra/ does NOT exist.

**GAP:** Constitutional infrastructure authority cannot be enforced.

---

## Authority Sovereignty Assessment

| Authority | Status | Implementation | Gaps |
|-----------|--------|----------------|------|
| AGENT.md | CANONICAL | N/A (constitutional document) | None |
| UCIA-CONSTITUTION-v1.0.md | AUTHORITATIVE | N/A (constitutional document) | None |
| vos/cos/CONSTITUTION.md | AUTHORITATIVE | N/A (constitutional document) | None |
| agents/agent_permissions.md | AUTHORITATIVE | N/A (constitutional document) | None |
| Identity | PARTIAL | identity_engine.ts, canonical_engine.ts | None |
| Lineage | PARTIAL | dag_validator.ts, lineage_store.ts | None |
| Event Recording | PARTIAL | event_log.ts, execution_events table | None |
| Replay | DOC_ONLY | replay-reconstruction.md (spec only) | Executable engine |
| Policy | DOC_ONLY | Policy documents (spec only) | Executable engine |
| Infrastructure | NOT IMPLEMENTED | infra/ does not exist | Entire stack |

---

## Final Classification

**FACT:** 7 contradictions identified.

**FACT:** 2 authority boundary violations identified.

**FACT:** 3 critical authority gaps identified.

**INFERENCE:** Authority consolidation required before Layer 1 implementation.

**RECOMMENDATION:** Resolve Priority 1-3 contradictions before proceeding with any implementation work.
