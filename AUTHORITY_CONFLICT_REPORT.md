# AUTHORITY_CONFLICT_REPORT.md

**Repository:** C:\Users\nolan\CRX
**Audit Date:** 2026-06-06
**Audit Type:** Constitutional Reality Reconciliation

---

## PHASE 4 — CONSTITUTIONAL AUTHORITY RECONCILIATION

### Authority Hierarchy (per AGENT.md)

| Priority | Document | Scope | Status |
|----------|----------|-------|--------|
| 1 | `AGENT.md` | Agent execution, infrastructure, consolidation, audit behavior | CANONICAL |
| 2 | `knowledge/authoritative/UCIA-CONSTITUTION-v1.0.md` | Kernel primitives, survivability, replay semantics | AUTHORITATIVE |
| 3 | `vos/cos/CONSTITUTION.md` | Engineering process, WAIT default, 8-stage gate | AUTHORITATIVE |
| 4 | `agents/agent_permissions.md` | Bounded agent permission matrix | AUTHORITATIVE |
| 5 | Domain specs under `knowledge/authoritative/` | Specialized constitutional layers | AUTHORITATIVE |

### Authority Claims Analysis

#### 1. AGENT.md

**FILE:** `C:\Users\nolan\CRX\AGENT.md`
**AUTHORITY CLAIM:** Canonical Root Instruction - supreme law for all agent execution
**CANONICAL:** YES (declared as Priority 1)
**DERIVED:** NO
**CONFLICTING:** NO
**SHADOW_AUTHORITY:** NO
**RATIONALE:** Explicitly declared as highest priority constitutional document

**Authority Scope:**
- Agent execution behavior
- Infrastructure consolidation
- Audit behavior
- REUSE_BEFORE_CREATE law
- Repository model
- Event law
- Infrastructure law
- Worktree law
- Configuration law
- Observability law
- Security law
- Agent behavior law

---

#### 2. knowledge/authoritative/UCIA-CONSTITUTION-v1.0.md

**FILE:** `C:\Users\nolan\CRX\knowledge\authoritative\UCIA-CONSTITUTION-v1.0.md`
**AUTHORITY CLAIM:** Universal Constitutional Intelligence Architecture - kernel primitives
**CANONICAL:** YES (declared as Priority 2)
**DERIVED:** NO
**CONFLICTING:** NO
**SHADOW_AUTHORITY:** NO
**RATIONALE:** Explicitly declared as Priority 2 in AGENT.md authority hierarchy

**Authority Scope:**
- Kernel primitives (Provenance, Claim, Decision, Fact, Rule)
- Constitutional survivability
- Replay semantics
- Mutation governance
- Persistence constitution
- Constitutional threat model

---

#### 3. vos/cos/CONSTITUTION.md

**FILE:** `C:\Users\nolan\CRX\vos\cos\CONSTITUTION.md`
**AUTHORITY CLAIM:** CRX Cognitive Constitution v1.0.0 - governs thinking, decisions, execution
**CANONICAL:** YES (declared as Priority 3)
**DERIVED:** NO
**CONFLICTING:** NO
**SHADOW_AUTHORITY:** NO
**RATIONALE:** Explicitly declared as Priority 3 in AGENT.md authority hierarchy

**Authority Scope:**
- Constitutional primitives (Truth > Reasoning, Verification > Confidence, etc.)
- Understanding domain (Problem Statement, Stakeholder Registry, Evidence Log, Assumption Registry)
- Reasoning domain (epistemic labels: KNOWN, INFERRED, UNKNOWN, SPECULATIVE)
- Decision Making (Decision ID, Trigger, Central claim, Alternatives, Rejection rationale)
- Execution domain (authorization, gates, Execution Approval)
- Entropy Reduction Mandate
- Amendment Process

---

#### 4. agents/agent_permissions.md

**FILE:** `C:\Users\nolan\CRX\agents\agent_permissions.md`
**AUTHORITY CLAIM:** Bounded agent permission matrix
**CANONICAL:** YES (declared as Priority 4)
**DERIVED:** NO
**CONFLICTING:** NO
**SHADOW_AUTHORITY:** NO
**RATIONALE:** Explicitly declared as Priority 4 in AGENT.md authority hierarchy

**Authority Scope:**
- Agent permission matrix
- Bounded agent worker definitions

---

#### 5. vos/cos/ARCHITECTURE.md

**FILE:** `C:\Users\nolan\CRX\vos\cos\ARCHITECTURE.md`
**AUTHORITY CLAIM:** CRX Cognitive Operating System — Architecture v1.0.0
**CANONICAL:** NO (marked as DERIVED in metadata)
**DERIVED:** YES (metadata: `crx-authority: DERIVED | layer: architecture | source: CONSTITUTION.md`)
**CONFLICTING:** NO
**SHADOW_AUTHORITY:** NO
**RATIONALE:** Explicitly marked as DERIVED from CONSTITUTION.md in file metadata

**Authority Scope:**
- Architecture overview
- Core components
- Data model
- State machine
- Compiler pipeline
- Integration points

---

#### 6. vos/cos/STRUCTURE.md

**FILE:** `C:\Users\nolan\CRX\vos\cos\STRUCTURE.md`
**AUTHORITY CLAIM:** COS structure documentation
**CANONICAL:** NO (not in authority hierarchy)
**DERIVED:** YES (implied from ARCHITECTURE.md pattern)
**CONFLICTING:** NO
**SHADOW_AUTHORITY:** NO
**RATIONALE:** Structural documentation, not constitutional law

---

#### 7. knowledge/derived/cos-mapping.md

**FILE:** `C:\Users\nolan\CRX\knowledge\derived\cos-mapping.md`
**AUTHORITY CLAIM:** UCIA ↔ COS unification bridge document
**CANONICAL:** NO (marked as derived in path)
**DERIVED:** YES (path: knowledge/derived/)
**CONFLICTING:** NO
**SHADOW_AUTHORITY:** NO
**RATIONALE:** Bridge document explicitly listed in AGENT.md as "do not duplicate — read and canonicalize"

---

#### 8. CascadeProjects/AGENT.md (WRONG LOCATION)

**FILE:** `C:\Users\nolan\CascadeProjects\AGENT.md`
**AUTHORITY CLAIM:** CRX-RUNTIME CONSTITUTIONAL AGENT DIRECTIVE
**CANONICAL:** NO (wrong location)
**DERIVED:** YES (generated during confusion)
**CONFLICTING:** YES (conflicts with actual CRX/AGENT.md)
**SHADOW_AUTHORITY:** YES (shadow authority in wrong location)
**RATIONALE:** Generated in wrong directory during initial confusion. Should be IGNORED.

**Conflict Details:**
- Different content (7,050 bytes vs 13,529 bytes)
- Different structure
- Wrong location (CascadeProjects instead of CRX)
- Should be deleted or ignored

---

### Authority Conflicts

#### CONFLICT-001: Duplicate AGENT.md

**PRIMARY AUTHORITY:** `C:\Users\nolan\CRX\AGENT.md` (13,529 bytes)
**SHADOW AUTHORITY:** `C:\Users\nolan\CascadeProjects\AGENT.md` (7,050 bytes)
**WHY BOTH EXIST:** I generated CascadeProjects/AGENT.md during initial confusion when I thought CascadeProjects was the repository
**WHICH IS REACHABLE:** CRX/AGENT.md is the actual repository authority
**RESOLUTION:** Delete CascadeProjects/AGENT.md and entire CascadeProjects/ directory

---

### Schema Authority Conflicts

#### SCHEMA-001: Event Schema Drift

**PRIMARY AUTHORITY:** AGENT.md canonical event envelope (target for consolidation)
**SHADOW AUTHORITY 1:** `vos/cos/schema/audit-event.schema.json` (governance audit events)
**SHADOW AUTHORITY 2:** `runtime/kernel/commit-service/src/persistence/ledger_schema.sql` (execution_events table)
**SHADOW AUTHORITY 3:** `knowledge/authoritative/claim.schema.json` (claim lifecycle events)
**SHADOW AUTHORITY 4:** `knowledge/authoritative/decision.schema.json` (decision lifecycle events)

**WHY BOTH EXIST:** Historical development - different subsystems defined their own event schemas before consolidation
**WHICH IS REACHABLE:** All are reachable in their respective contexts
**CONFLICT:** AGENT.md states "No competing event schemas allowed" but 4 competing schemas exist
**RESOLUTION:** Consolidate all event schemas into AGENT.md canonical event envelope (per AGENT.md instruction)

---

### Infrastructure Authority Conflicts

#### INFRA-001: Duplicate Compose Stacks

**PRIMARY AUTHORITY:** AGENT.md mandates `infra/docker-compose.yml` as canonical (does NOT exist yet)
**SHADOW AUTHORITY:** `agents/docker-compose.yml` (exists but broken - missing code/dirs)
**WHY BOTH EXIST:** agents/docker-compose.yml was created as scaffold before infra/ was specified as canonical target
**WHICH IS REACHABLE:** agents/docker-compose.yml exists but is broken (references non-existent directories)
**CONFLICT:** AGENT.md states "There must be ONE canonical infrastructure stack" but two compose stacks exist (one canonical target missing, one broken scaffold)
**RESOLUTION:** Merge agents/docker-compose.yml into infra/docker-compose.yml as optional profile, then delete agents/docker-compose.yml

---

### Agent Ontology Conflicts

#### AGENT-001: Three Agent Ontologies

**PRIMARY AUTHORITY:** AGENT.md references `agents/agent_permissions.md` as canonical
**SHADOW AUTHORITY 1:** Docker agents (Planner/Refactor/Documentation/Governance) in `agents/`
**SHADOW AUTHORITY 2:** Creator workflow agents in `knowledge/derived/agent-workflow-topology.md`
**SHADOW AUTHORITY 3:** UCIA constitutional agents in `knowledge/authoritative/constitutional-agent-infrastructure.md`

**WHY BOTH EXIST:** Historical development - different agent ontologies evolved in different contexts
**WHICH IS REACHABLE:** All are documented but not implemented
**CONFLICT:** AGENT.md states "canonicalize to one" but three agent ontologies exist
**RESOLUTION:** Canonicalize to single agent ontology per AGENT.md instruction

---

### Mixed Authority Ownership

#### MIXED-001: Transport Owns Derivation

**FILE:** `runtime/kernel/commit-service/src/api/commit_controller.ts`
**ISSUE:** Transport layer (HTTP controller) owns derivation (canonicalization, identity computation)
**AUTHORITY LEAKAGE:** Orchestration layer encroaching on Canonicalization and Identity authorities
**RATIONALE:** Controller directly calls computeCanonicalHash() and validateLineage()
**SEVERITY:** MEDIUM (architectural concern, not functional bug)

---

### Shadow Authority Summary

| SHADOW AUTHORITY | PRIMARY AUTHORITY | CONFLICT TYPE | SEVERITY |
|------------------|-------------------|--------------|----------|
| CascadeProjects/AGENT.md | CRX/AGENT.md | Duplicate constitutional document | HIGH |
| vos/cos/schema/audit-event.schema.json | AGENT.md canonical event envelope | Schema drift | MEDIUM |
| runtime/kernel/commit-service/src/persistence/ledger_schema.sql | AGENT.md canonical event envelope | Schema drift | MEDIUM |
| knowledge/authoritative/claim.schema.json | AGENT.md canonical event envelope | Schema drift | MEDIUM |
| knowledge/authoritative/decision.schema.json | AGENT.md canonical event envelope | Schema drift | MEDIUM |
| agents/docker-compose.yml | infra/docker-compose.yml (missing) | Duplicate infrastructure | HIGH |
| knowledge/derived/agent-workflow-topology.md | agents/agent_permissions.md | Agent ontology duplication | MEDIUM |
| knowledge/authoritative/constitutional-agent-infrastructure.md | agents/agent_permissions.md | Agent ontology duplication | MEDIUM |

---

### Authority Ownership Classification

| FILE | CURRENT LOCATION | AUTHORITY | SECONDARY AUTHORITIES | SHADOW AUTHORITY | RATIONALE |
|------|------------------|----------|----------------------|------------------|-----------|
| AGENT.md | CRX/ | Canonical | None | CascadeProjects/AGENT.md | Priority 1 constitutional law |
| UCIA-CONSTITUTION-v1.0.md | knowledge/authoritative/ | Authoritative | None | None | Priority 2 kernel primitives |
| CONSTITUTION.md | vos/cos/ | Authoritative | None | None | Priority 3 engineering process |
| agent_permissions.md | agents/ | Authoritative | None | None | Priority 4 agent permissions |
| ARCHITECTURE.md | vos/cos/ | Derived | None | None | Derived from CONSTITUTION.md |
| audit-event.schema.json | vos/cos/schema/ | Shadow | None | AGENT.md canonical envelope | Schema drift |
| ledger_schema.sql | runtime/kernel/commit-service/src/persistence/ | Shadow | None | AGENT.md canonical envelope | Schema drift |
| claim.schema.json | knowledge/authoritative/ | Shadow | None | AGENT.md canonical envelope | Schema drift |
| decision.schema.json | knowledge/authoritative/ | Shadow | None | AGENT.md canonical envelope | Schema drift |
| docker-compose.yml | agents/ | Shadow | None | infra/docker-compose.yml (missing) | Duplicate infrastructure |

---

### Critical Rule Violations

**VIOLATION-001:** "No competing event schemas allowed" - 4 competing event schemas exist
**VIOLATION-002:** "There must be ONE canonical infrastructure stack" - 2 compose stacks (one missing, one broken)
**VIOLATION-003:** "Three agent ontologies exist today — canonicalize to one" - 3 agent ontologies exist

---

### Final Authority Assessment

**CANONICAL (4 documents):**
- AGENT.md (Priority 1)
- UCIA-CONSTITUTION-v1.0.md (Priority 2)
- CONSTITUTION.md (Priority 3)
- agent_permissions.md (Priority 4)

**DERIVED (1 document):**
- ARCHITECTURE.md

**SHADOW AUTHORITY (7 conflicts):**
- CascadeProjects/AGENT.md (HIGH severity)
- audit-event.schema.json (MEDIUM severity)
- ledger_schema.sql (MEDIUM severity)
- claim.schema.json (MEDIUM severity)
- decision.schema.json (MEDIUM severity)
- agents/docker-compose.yml (HIGH severity)
- agent-workflow-topology.md (MEDIUM severity)
- constitutional-agent-infrastructure.md (MEDIUM severity)

**MIXED AUTHORITY OWNERSHIP (1 issue):**
- commit_controller.ts (MEDIUM severity - transport owns derivation)
