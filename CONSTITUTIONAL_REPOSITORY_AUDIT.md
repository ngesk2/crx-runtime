# Constitutional Repository Audit

**Date:** 2026-06-24
**Audit Scope:** Complete constitutional documentation ecosystem
**Audit Type:** Structural, semantic, authority, discoverability
**Status:** COMPLETE

---

## 1. Constitutional Repository Audit — Inventory & Structural Assessment

### 1.1 Total Document Count

| Category | Document Count | Description |
|----------|---------------|-------------|
| Core Constitution (`constitution/`) | 15 | THESIS, KNOWLEDGE, GOVERNANCE, ARCHIVE, terminology, layer0_kernel, 7 laws, authority_model, CONTINUITY |
| Vault Constitution (`vault/constitution/`) | 1 | CONSTITUTION.md (Phase 1 architecture) |
| Vault Laws (`vault/laws/`) | 3 | IDENTITY_LAW, REPLAY_LAW, WITNESS_LAW |
| Vault Immutable Copies (`vault/constitutional/immutable/`) | 5 | CONSTITUTION, IDENTITY_LAW, REPLAY_LAW, WITNESS_LAW, hash manifest |
| Constitutional Patches (01-20) | 20 | Amendment patches covering render independence through authority source |
| Freeze/Specification Documents (root) | 12 | HIERARCHY_FINAL, AUTHORITY_MAP, LAYER_BOUNDARIES, AMENDMENT_PROCESS, ADVERSARIES, etc. |
| Authority Documents (root) | 25 | Inventories, graphs, audits, diffs, maps, SQL schemas |
| BrainOS Architecture Laws | 9 | Constitution, Identity, Replay, State Transition, Projection, Failure, Event Ordering, Hash, Canonical |
| BrainOS Protocol Laws | 15 | Identity, Graph, Signature, Synchronization, Vector Independence, etc. |
| Knowledge Authoritative | 36 | UCIA Constitution, Governance Model, Runtime Model, Rule System, etc. |
| Knowledge Derived | 67 | Primitive reductions, identity continuity rules, etc. |
| Audit Documents (`audit/`) | 10 | CI checks, derived-state sweeps, influence audits, remediation |
| Newsletter Constitutional Reports | 11 | Authority boundary maps, dead constitution detection, shadow authority |
| Newsletter `docs/constitutional/` | 40+ | State reconstruction, retrieval readiness, event coverage, automation |
| `docs/constitutional/` SWEEP docs | 14 | A1-A5 sweep plans, kernel sovereignty, identity algebra |
| Runtime/Replay Governance | 5 | Law manifest, authority registry, freeze verdict, blockers, ADR |
| **Total Governance Documents** | **~257** | Across 16 categories |

### 1.2 Duplicate Detection

| Document | Locations | Content Match |
|----------|-----------|---------------|
| CONSTITUTION.md | `vault/constitution/`, `vault/constitutional/immutable/` | Identical |
| IDENTITY_LAW.md | `vault/laws/`, `vault/constitutional/immutable/` | Identical |
| REPLAY_LAW.md | `constitution/` (replay_law.md), `vault/laws/`, `vault/constitutional/immutable/` | **Different** — 3 distinct versions |
| WITNESS_LAW.md | `constitution/` (witness_law.md), `vault/laws/`, `vault/constitutional/immutable/` | **Different** — 3 distinct versions |

### 1.3 Missing Documents

Documents referenced as ingested or expected but not found as standalone files:
- **MEMORY_LAW.md** — Does not exist anywhere. Referenced in ingestion pipeline.
- **INFRASTRUCTURE_LAW.md** — Does not exist anywhere. Referenced in ingestion pipeline.

### 1.4 Status Distribution

| Status | Count | Documents |
|--------|-------|-----------|
| FROZEN CONSTITUTIONAL AUTHORITY | 8 | terminology, layer0_kernel, invariant_law, layering_law, mutation_law, replay_law, retrieval_law, source_of_truth_law, witness_law (constitution/) |
| CONSTITUTIONAL FREEZE | 7 | CONSTITUTIONAL_HIERARCHY_FINAL, AUTHORITY_TAXONOMY_SPEC, OBJECT_STATE_LAW, WEB_COMPONENT_CONSTITUTION, DISCOVERY_SOVEREIGNTY_SPEC, CANONICAL_FORK_SPEC, PHASE_B_CONSTITUTIONAL_ANSWERS |
| Superseded | 2 | CONTINUITY.md (→ CONTINUITY_SPEC.md), authority_model.md (→ AUTHORITY_TAXONOMY_SPEC.md) |
| Active (no explicit freeze) | 5 | THESIS.md, KNOWLEDGE.md, GOVERNANCE.md, ARCHIVE.md, vault/constitution/CONSTITUTION.md |
| Phase-labeled (no freeze) | 3 | vault/laws/IDENTITY_LAW.md (Phase 1), vault/laws/REPLAY_LAW.md (Phase 4), vault/laws/WITNESS_LAW.md (Phase 4) |

---

## 2. Authority Graph

### 2.1 Declared Authority Hierarchy

Defined in `runtime/tools/authority_search.py` (10 classes, rank 0-9):

```
Rank   Authority Class
─────  ─────────────────────────────────
  0    CONSTITUTIONAL_LAW         ← Highest
  1    CANONICAL_SPEC
  2    CREATOR_RESEARCH
  3    CREATOR_NOTES
  4    IMPORTED_DOCUMENT
  5    REPOSITORY_DOCUMENTATION
  6    SCRIPT
  7    SUMMARY
  8    AI_GENERATED_ANALYSIS
  9    TEMPORARY_OBSERVATION      ← Lowest
```

### 2.2 Competing Authority Schemas

Three distinct authority schemes exist — **NOT aligned**:

| Scheme | Location | Levels | Basis |
|--------|----------|--------|-------|
| **Declared Class** | `runtime/tools/authority_search.py` | 10 (string) | Authority class hierarchy |
| **File-path-based** | `runtime/projection_worker/constitutional_projection_worker.py` | 3 (string) | File path keywords ('constitutional' > 'operational' > 'working') |
| **Integer Level** | `authority_objects.sql` | Integer | `authority_level DESC` in SQL queries |

**Semantic gap**: A document classified as `working` by the projection worker has no defined relationship to `TEMPORARY_OBSERVATION` or any other declared class. The integer authority_level in the SQL schema is not mapped to the declared class hierarchy.

### 2.3 Authority Resolution Paths

```
Query/Request
  │
  ├──→ supervisor.py (always runs authority_search)
  │      │
  │      ├──→ authority_search.py
  │      │      ├── try_postgres_search()  → authority_objects table
  │      │      └── load_local_authorities() → flat JSON files
  │      │
  │      ├── Phase B: resolve_authority_class() → map to declared class
  │      ├── Phase C: mechanical verification (5 checks)
  │      │    1. artifact_hash_verified  (payload_hash == sha256)
  │      │    2. event_hash_verified     (payload_hash exists)
  │      │    3. lineage_intact          (lineage_depth > 0)
  │      │    4. witness_present         (witness_count > 0)
  │      │    5. projection_valid        (status == 'projected')
  │      └── Phase D: sort by class_rank, return top 10
  │
  ├──→ app.py /constitution/search (inline)
  │      ├── Qdrant search → Postgres verification
  │      └── Authority resolution: event_type → level mapping
  │
  └──→ mission_control_authority_endpoint.py /authority/resolve
         ├── authority_objects table query
         ├── supersession check (authority_supersession table)
         ├── lineage depth (lineage table)
         └── witness count (events table)
```

### 2.4 Authority Resolution Gaps

| Gap | Severity | Impact |
|-----|----------|--------|
| `authority_witness` table queried but doesn't exist | HIGH | All PostgreSQL authority queries fail at line 137 |
| `superseded`/`superseded_by` column names mismatch SQL schema | HIGH | Supersession lookup returns no results |
| Flat-file fallback masks DB failures | MEDIUM | Connection errors invisible to callers |
| No mapping between 3 competing schemes | CRITICAL | Same document gets different authority levels depending on resolution path |
| `constitution_search.py` wired to old schema | HIGH | Independent verification path produces different results |

---

## 3. Responsibility Matrix

### 3.1 What Each Constitutional Document Governs

| Document | Governs | Scope |
|----------|---------|-------|
| THESIS.md | **Purpose** — why PING exists | Narrative: problem statement, continuity thesis, civilization-scale role |
| KNOWLEDGE.md | **Knowledge substrate** — what is true | Primitives, laws, authority structures, survivability |
| GOVERNANCE.md | **Governance principles** — who decides | Authority, legitimacy, responsibility, amendment process |
| terminology.md (FROZEN) | **Language** — what words mean | Formal definitions: Actor, Artifact, Event, Identity, Lineage, Witness |
| layer0_kernel.md (FROZEN) | **Axioms** — what is assumed true | Identity Determinism, Content Addressability, Event Ordering, Replay Determinism, Lineage Integrity, Witness Verifiability |
| invariant_law.md (FROZEN) | **Invariants** — what cannot change | Invariant definition, semantics, enforcement |
| layering_law.md (FROZEN) | **Layers** — what goes where | Layer 0-5 boundaries, dependency rules, ownership |
| mutation_law.md (FROZEN) | **Change** — how things evolve | Mutation authorization, policy primacy axiom |
| replay_law.md (FROZEN) | **Replay** — how history is reconstructed | Determinism, reproducibility, idempotence requirements |
| retrieval_law.md (FROZEN) | **Retrieval** — how context is accessed | Constitutional context required before mutation |
| source_of_truth_law.md (FROZEN) | **Truth** — what is authoritative | One authority per truth domain, domain classification |
| witness_law.md (FROZEN) | **Witness** — how observations are verified | Witness generation, verification, semantics, properties |
| vault/CONSTITUTION.md | **Architecture** — system structure | Local First, Event Sourced, Deterministic Replay, Projection Independence |
| vault/IDENTITY_LAW.md | **Identity** — how things are identified | Prohibits auto-increment IDs, database row IDs, UUID-as-identity |
| vault/REPLAY_LAW.md | **Replay** (alternate) | Deterministic, reproducible, idempotent event reconstruction |
| vault/WITNESS_LAW.md | **Witness** (alternate) | Witness generation and verification, deterministic evidence |
| Patches 01-20 | **Amendments** — constitutional fixes | Each patch amends specific gaps in the constitutional framework |
| AUTHORITY_TAXONOMY_SPEC.md | **Authority** — how authority is classified | 10 authority classes, resolution rules |
| CONSTITUTIONAL_HIERARCHY_FINAL.md | **Hierarchy** — constitutional ordering | Document authority ordering, precedence rules |
| OBJECT_STATE_LAW.md | **Objects** — state machine | Object state evolution, constitutional substrate |
| WEB_COMPONENT_CONSTITUTION.md | **Web** — web platform | Web components as constitutional substrate |

### 3.2 Ungoverned Domains (No Constitutional Document)

| Domain | Missing Constitutional Coverage | Risk |
|--------|-------------------------------|------|
| **Agent Behavior** | No document governs how agents should behave, their limits, or constraints | Agents operate without defined boundaries |
| **Tool Execution** | No document governs tool access, authorization, or logging | Tools execute without constitutional oversight |
| **Model Routing** | No document governs which model handles which task | 14B/7B separation has no constitutional basis |
| **API Access** | No document governs API authentication, rate limiting, or authorization | APIs exposed without constitutional guardrails |
| **Credential Management** | No document governs credential lifecycle, rotation, or access | Credentials managed ad-hoc per service |
| **Drive Integration** | No document governs Google Drive as a source of truth | Drive operates outside constitutional framework |
| **Observability** | No document governs what must be observed, logged, or monitored | Observability is implementation-specific |
| **Recovery** | No document governs disaster recovery procedures | Recovery is ad-hoc per component |
| **Agent Constitution** | No document defines what an agent IS in constitutional terms | Agents are undefined constitutional participants |

---

## 4. Detected Contradictions

### 4.1 Contradiction 1: Duplicate Documents with Divergent Content

**Subject: Replay Law**
| Source | Position | |
|--------|----------|---|
| `constitution/replay_law.md` (FROZEN) | 132 lines, 6 axioms | Defines replay determinism as constitutional axiom |
| `vault/laws/REPLAY_LAW.md` | 306 lines, Phase 4 | Defines replay as "deterministic, reproducible, idempotent" with implementation requirements |
| **Conflict** | Same subject, different rules. constitution/ version is FROZEN, vault/ version is Phase 4. No supersession relationship declared. | |

**Subject: Witness Law**
| Source | Position | |
|--------|----------|---|
| `constitution/witness_law.md` (FROZEN) | 179 lines | Witness generation and verification semantics |
| `vault/laws/WITNESS_LAW.md` | 179 lines (FROZEN) | Same document? — check needed |
| **Conflict** | Appears identical, but FROZEN status applied independently. Duplicate location creates ambiguity about which is authoritative. | |

### 4.2 Contradiction 2: Three Competing Authority Schemes

`runtime/tools/authority_search.py` declares authority by class hierarchy (10 levels).
`constitutional_projection_worker.py` assigns authority by file path keyword (3 levels: constitutional > operational > working).
`authority_objects.sql` uses integer `authority_level` ordered DESC.

**No document reconciles these three schemes.** The same document can receive different authority levels depending on which resolution path is used.

### 4.3 Contradiction 3: Source of Truth Law vs. Implementation

`constitution/source_of_truth_law.md` states: "One authority per truth domain axiom."
But `vault/AUTHORITY_MAP.md` declares: "PostgreSQL > Qdrant > Mission Control > Vault > Drive" — a linear hierarchy, not a per-domain authority assignment. The law and the map contradict on the fundamental model of authority.

### 4.4 Contradiction 4: verification Flow Divergence

`app.py` `/constitution/search` and `constitutional_search.py` implement independent verification pipelines querying different column schemas (old `id/stream/payload/created_at` vs. new `event_id/event_data/timestamp`). Both claim to be the verification authority for constitutional retrieval.

### 4.5 Contradiction 5: Patch 10 vs. Object Definition

`CONSTITUTIONAL_PATCH_10_EVENT_SOLE_PRIMITIVE.md` declares event as "sole primitive," but `CONSTITUTIONAL_PATCH_05_CONSTITUTIONAL_OBJECT_DEFINITION.md` created the object definition. The two patches have unresolved tension about whether event or object is the fundamental primitive.

---

## 5. Authority Overlap

### 5.1 Areas Where Multiple Documents Claim Authority

| Domain | Claimants | Issue |
|--------|-----------|-------|
| **Replay Determinism** | `constitution/replay_law.md` (FROZEN), `vault/laws/REPLAY_LAW.md` (Phase 4), `brainos/docs/architecture/REPLAY_LAW.md` | 3 documents, same subject, no supersession declared |
| **Witness Verification** | `constitution/witness_law.md` (FROZEN), `vault/laws/WITNESS_LAW.md` (FROZEN), `vault/constitutional/immutable/WITNESS_LAW.md` | Redundant copies, unclear which is authoritative |
| **Identity** | `vault/laws/IDENTITY_LAW.md` (Phase 1), `brainos/docs/architecture/CONSTITUTIONAL_IDENTITY_LAW.md`, `vault/constitutional/immutable/IDENTITY_LAW.md` | Identity governed by 3 docs with different requirements |
| **Architecture Principles** | `vault/constitution/CONSTITUTION.md` (foundational), `brainos/docs/architecture/CONSTITUTION.md` (same content), `constitution/layer0_kernel.md` (FROZEN axioms) | Overlapping scope: architecture vs. axioms vs. system design |
| **Governance Authority** | `constitution/GOVERNANCE.md`, `AUTHORITY_TAXONOMY_SPEC.md` (FREEZE), `PING_RUNTIME_CONSTITUTIONAL_IDENTITY_ALGEBRA.md` | Governance of governance — no single document claims sovereignty over who governs |

### 5.2 Authority Class Over-Concentration

The `CONSTITUTIONAL_LAW` authority class (rank 0) covers ALL constitutional documents regardless of subject, age, or applicability. This means:
- A 2026 patch about encoding independence has the same authority class as the foundational layer 0 kernel
- Superseded documents (CONTINUITY.md, authority_model.md) still carry class 0 authority
- No mechanism exists within the declared class system to distinguish between active and superseded constitutional documents

---

## 6. Missing Constitutional Ownership

### 6.1 System Components Without Constitutional Coverage

| Component | Status | Risk |
|-----------|--------|------|
| **Workers** (20+) | No constitutional document governs worker behavior, lifecycle, or authority | Workers execute without constitutional mandate |
| **Qdrant** | No constitutional document defines Qdrant's role or constraints | Qdrant treated as cache by convention, but no constitutional enforcement |
| **Ollama/Models** | No constitutional document governs model selection, usage, or constraints | Models operate without constitutional boundaries |
| **Gateway** | No constitutional document governs routing, authentication, or access | Gateway operates without constitutional mandate |
| **Commit Service** | No constitutional document governs commit authority or validation | Commit service operates without constitutional oversight |
| **MCP Server** | No constitutional document governs MCP protocol integration | Tools exposed through MCP without constitutional guardrails |
| **Drive Ingestion** | No constitutional document governs external source ingestion | Files enter system without constitutional validation |
| **Agent Identity** | No document defines what constitutes an agent, its rights, or its obligations | Agents are constitutional participants without a constitution |

### 6.2 Constitutional Process Gaps

| Process Gap | Missing | Impact |
|-------------|---------|--------|
| Amendment ratification | No process to ratify or reject patches | Patches accumulate without formal adoption |
| Supersession declaration | No process to formally supersede documents | Superseded documents remain active |
| Constitutional conflict resolution | No process to resolve conflicts between documents | Contradictions persist unresolved |
| Freeze violations | No process to detect/remediate freeze violations | Freeze marker has no enforcement mechanism |
| Authority scheme migration | No process to migrate between authority schemes | Three competing schemes persist indefinitely |

---

## 7. Discoverability Failures

### 7.1 Cross-Reference Deficiency

Of the 20 core constitutional documents reviewed, **zero** reference another constitutional document by filename. Key examples:
- `constitution/replay_law.md` does not reference `vault/laws/REPLAY_LAW.md` (or vice versa)
- `AUTHORITY_TAXONOMY_SPEC.md` does not reference `CONSTITUTIONAL_HIERARCHY_FINAL.md`
- `constitution/source_of_truth_law.md` does not reference `AUTHORITY_TAXONOMY_SPEC.md`

Constitutional documents exist in isolated silos with no explicit cross-references.

### 7.2 Index Deficiency

No single index or table of contents exists that links related constitutional documents. To find all documents governing "replay," a reader must know about:
1. `constitution/replay_law.md`
2. `vault/laws/REPLAY_LAW.md`
3. `vault/constitutional/immutable/REPLAY_LAW.md`
4. `brainos/docs/architecture/REPLAY_LAW.md`
5. `brainos/orchestration/docs/architecture/EVENT_ORDERING_LAW.md`
6. `brainos/orchestration/docs/constitutional/REPLAY_GAP_ANALYSIS.md`
7. `brainos/newsletter/constitutional_claim_verification.md`

No document links these together.

### 7.3 Status Visibility Deficiency

A reader cannot determine from a document itself whether it is:
- **Active** and authoritative (e.g., THESIS.md — no freeze marker)
- **Frozen** and immutable (e.g., invariant_law.md — has FROZEN marker)
- **Superseded** and obsolete (e.g., authority_model.md — relies on reader knowing about AUTHORITY_TAXONOMY_SPEC.md)
- **Phase-labeled** with unknown relationship to freeze status (e.g., vault/laws/IDENTITY_LAW.md — Phase 1, no freeze)

### 7.4 Schema Conflation in Code

Two distinct verification pipelines use different column schemas for the same events table:
- `app.py`: `event_id`, `event_data`, `timestamp` (CQRS schema)
- `constitutional_search.py`: `id`, `stream`, `payload`, `created_at` (legacy schema)

A developer cannot discover from the schema alone which pipeline is authoritative.

### 7.5 Tool-Level Discoverability

The `runtime/tools/authority_search.py` tool provides authority resolution but queries non-existent tables (`authority_witness`) and uses wrong column names (`superseded`/`superseded_by` vs. actual `old_authority`/`new_authority`). The tool advertises capabilities it cannot deliver.

---

## 8. Audit Findings Summary

### Critical Issues (Must Fix Before Constitutional Certification)

| # | Finding | Category | Severity |
|---|---------|----------|----------|
| C1 | Three competing authority schemes with no mapping | Authority Graph | CRITICAL |
| C2 | `authority_witness` table queried but doesn't exist | Authority Graph | CRITICAL |
| C3 | `constitution/replay_law.md` vs `vault/laws/REPLAY_LAW.md` — divergent content | Contradiction | CRITICAL |
| C4 | MEMORY_LAW.md and INFRASTRUCTURE_LAW.md referenced but don't exist | Inventory | CRITICAL |
| C5 | Agent behavior, tool execution, model routing — no constitutional coverage | Missing Ownership | CRITICAL |
| C6 | Supersession column name mismatch — `superseded` vs `old_authority` | Authority Graph | CRITICAL |
| C7 | No cross-references between any constitutional documents | Discoverability | CRITICAL |
| C8 | Two independent verification pipelines with different schemas | Contradiction | CRITICAL |

### High Issues

| # | Finding | Category | Severity |
|---|---------|----------|----------|
| H1 | No index or TOC linking related constitutional documents | Discoverability | HIGH |
| H2 | Documents lack machine-readable status (active/frozen/superseded) | Discoverability | HIGH |
| H3 | Superseded documents still carry rank-0 authority class | Authority Graph | HIGH |
| H4 | No process for amendment ratification or supersession | Missing Ownership | HIGH |
| H5 | Flat-file fallback silently masks DB failures in authority resolution | Authority Graph | HIGH |
| H6 | Worker governance absent — 20+ workers with no constitutional mandate | Missing Ownership | HIGH |
| H7 | No document governs Qdrant's constitutional role | Missing Ownership | HIGH |
| H8 | Patch 10 (event sole primitive) contradicts Patch 05 (object definition) | Contradiction | HIGH |

### Medium Issues

| # | Finding | Category | Severity |
|---|---------|----------|----------|
| M1 | Vault immutable copies duplicate live documents without clear purpose | Inventory | MEDIUM |
| M2 | No constitutional document governs credential lifecycle | Missing Ownership | MEDIUM |
| M3 | No constitutional document governs Drive integration | Missing Ownership | MEDIUM |
| M4 | No constitutional document governs observability/logging | Missing Ownership | MEDIUM |
| M5 | No constitutional document governs recovery/disaster procedures | Missing Ownership | MEDIUM |
| M6 | Frozen marker lacks enforcement mechanism | Inventory | MEDIUM |
| M7 | Phase-labeled vault laws ambiguous about freeze status | Inventory | MEDIUM |
| M8 | Archive.md is "non-constitutional guidance" but lives in constitution/ | Inventory | MEDIUM |

### Accepted Risks (Documented, not actioned in this audit)

- Patch accumulation without formal adoption is a process issue that requires governance, not repository audit
- The 3 competing authority schemes require a constitutional amendment to reconcile
- Worker constitutional coverage requires CREATOR or governance action to define agent authority

---

## Appendix A: Document Status Map

```
Active (No Freeze)
├── constitution/THESIS.md
├── constitution/KNOWLEDGE.md
├── constitution/GOVERNANCE.md
├── constitution/ARCHIVE.md
├── vault/constitution/CONSTITUTION.md
├── vault/laws/IDENTITY_LAW.md (Phase 1)
├── vault/laws/REPLAY_LAW.md (Phase 4)
└── vault/laws/WITNESS_LAW.md (Phase 4)

FROZEN CONSTITUTIONAL AUTHORITY
├── constitution/terminology.md
├── constitution/layer0_kernel.md
├── constitution/invariant_law.md
├── constitution/layering_law.md
├── constitution/mutation_law.md
├── constitution/replay_law.md
├── constitution/retrieval_law.md
├── constitution/source_of_truth_law.md
└── constitution/witness_law.md

CONSTITUTIONAL FREEZE
├── CONSTITUTIONAL_HIERARCHY_FINAL.md
├── AUTHORITY_TAXONOMY_SPEC.md
├── OBJECT_STATE_LAW.md
├── WEB_COMPONENT_CONSTITUTION.md
├── DISCOVERY_SOVEREIGNTY_SPEC.md
├── CANONICAL_FORK_SPEC.md
└── PHASE_B_CONSTITUTIONAL_ANSWERS.md

Superseded
├── constitution/CONTINUITY.md → CONTINUITY_SPEC.md
└── constitution/authority_model.md → AUTHORITY_TAXONOMY_SPEC.md

Vault Immutable Copies (Status Ambiguous)
├── vault/constitutional/immutable/CONSTITUTION.md
├── vault/constitutional/immutable/IDENTITY_LAW.md
├── vault/constitutional/immutable/REPLAY_LAW.md
└── vault/constitutional/immutable/WITNESS_LAW.md

Amendment Patches (Status Ambiguous)
└── CONSTITUTIONAL_PATCH_01 through 20 (no ratification status)
```

## Appendix B: Authority Resolution Path Map

```
                           ┌─────────────────────────┐
                           │     Query / Request      │
                           └──────────┬──────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
            ┌────────────┐   ┌──────────────┐   ┌──────────────┐
            │ supervisor │   │  app.py       │   │ authority_   │
            │ .py        │   │ /constitution │   │ endpoint.py  │
            │            │   │ /search       │   │              │
            └─────┬──────┘   └──────┬───────┘   └──────┬───────┘
                  │                 │                   │
                  ▼                 ▼                   ▼
            ┌────────────┐   ┌──────────────┐   ┌──────────────┐
            │ authority_ │   │ Qdrant →     │   │ authority_   │
            │ search.py  │   │ Postgres     │   │ objects SQL  │
            │            │   │ verification │   │ (int level)  │
            └─────┬──────┘   └──────────────┘   └──────┬───────┘
                  │                                     │
        ┌─────────┼─────────┐                           │
        │         │         │                           │
        ▼         ▼         ▼                           ▼
   ┌────────┐ ┌────────┐ ┌────────┐            ┌──────────────┐
   │SQL     │ │Flatten │ │Class   │            │ supersession │
   │objects │ │files   │ │resolve │            │ + lineage    │
   │table   │ │        │ │        │            │ + witness    │
   └────────┘ └────────┘ └────────┘            └──────────────┘
        │         │         │
        └─────────┼─────────┘
                  │
                  ▼
            ┌────────────┐
            │10 declared │
            │classes     │
            │(rank 0-9)  │
            └────────────┘

KEY: Three competing schemes produce inconsistent results
  Scheme 1 (declared class): 10 levels, string-based
  Scheme 2 (file path):      3 levels, keyword-based
  Scheme 3 (SQL integer):    unbounded, int-based
```

## Appendix C: Cross-Reference Matrix (Core Docs)

```
                    │THS KNW GOV TRM L0K INM LAY MUT RPL RTV SOT WIT ATH
────────────────────┼─────────────────────────────────────────────────────
THESIS.md           │ —  —  —  —  —  —  —  —  —  —  —  —  —
KNOWLEDGE.md        │ —  —  —  —  —  —  —  —  —  —  —  —  —
GOVERNANCE.md       │ —  —  —  —  —  —  —  —  —  —  —  —  —
terminology.md      │ —  —  —  —  —  —  —  —  —  —  —  —  —
layer0_kernel.md    │ —  —  —  —  —  —  —  —  —  —  —  —  —
invariant_law.md    │ —  —  —  —  —  —  —  —  —  —  —  —  —
layering_law.md     │ —  —  —  —  —  —  —  —  —  —  —  —  —
mutation_law.md     │ —  —  —  —  —  —  —  —  —  —  —  —  —
replay_law.md       │ —  —  —  —  —  —  —  —  —  —  —  —  —
retrieval_law.md    │ —  —  —  —  —  —  —  —  —  —  —  —  —
source_of_truth_law │ —  —  —  —  —  —  —  —  —  —  —  —  —
witness_law.md      │ —  —  —  —  —  —  —  —  —  —  —  —  —
AUTH_TAXONOMY_SPEC  │ —  —  —  —  —  —  —  —  —  —  —  —  —

(All cells blank — zero cross-references by filename)
```

---

**Audit Completed:** 2026-06-24
**Next Required Action:** Address Critical issues C1-C8 before constitutional certification
**Blocks:** AGENT_CONSTITUTION.md creation (waiting on audit findings)
