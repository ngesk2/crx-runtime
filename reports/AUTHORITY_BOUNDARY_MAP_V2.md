# AUTHORITY_BOUNDARY_MAP_V2

**Map Date:** 2026-06-07  
**Protocol:** CRX-REPOSITORY-CONSOLIDATION-V2  
**Mode:** READ-ONLY  
**Classification:** FACT, INFERENCE, UNKNOWN

---

## Executive Summary

**FACT:** 7 authority layers exist in proposed repository structure.

**FACT:** Dependency hierarchy must be enforced to maintain authority boundaries.

**FACT:** Agents may depend on all layers.

**FACT:** No reverse dependencies allowed (lower layers cannot depend on higher layers).

**INFERENCE:** Authority boundary enforcement is required for constitutional compliance.

**RECOMMENDATION:** Enforce dependency hierarchy as specified below.

---

## Authority Layers

### Layer 1: constitutional/

**Purpose:** Supreme authority (constitutional documents)

**Contents:**
- AGENT.md (supreme law for agent execution)
- CRX_CONSTITUTION.md (constitutional kernel specification)
- policies/ (future policy documents)

**Authority Level:** SUPREME

**Dependencies:** NONE (supreme authority)

**Dependents:** knowledge/, runtime/, infra/, agents/, docs/

**Classification:** AUTHORITATIVE

---

### Layer 2: knowledge/

**Purpose:** Knowledge repository (authoritative and derived)

**Contents:**
- authoritative/ (constitutional knowledge specifications)
- derived/ (derived knowledge from authoritative sources)

**Authority Level:** HIGH

**Dependencies:** constitutional/

**Dependents:** runtime/, infra/, agents/, docs/

**Classification:** AUTHORITATIVE (authoritative/), DERIVED (derived/)

---

### Layer 3: vos/

**Purpose:** Visual Operating System (constitutional governance)

**Contents:**
- cos/ (constitutional governance)
- proposals/ (proposals)
- viz/ (visualizations)

**Authority Level:** HIGH

**Dependencies:** constitutional/

**Dependents:** runtime/, infra/, agents/, docs/

**Classification:** AUTHORITATIVE (cos/), DERIVED (proposals/, viz/)

---

### Layer 4: runtime/

**Purpose:** Runtime code (kernel and services)

**Contents:**
- kernel/ (kernel implementation)
- services/ (future services)

**Authority Level:** MEDIUM

**Dependencies:** constitutional/, knowledge/, vos/

**Dependents:** infra/, agents/

**Classification:** RUNTIME

---

### Layer 5: infra/

**Purpose:** Infrastructure (compose, postgres, redis, ollama, observability)

**Contents:**
- compose/ (docker-compose.yml)
- postgres/ (postgres configuration)
- redis/ (redis configuration)
- ollama/ (ollama configuration)
- observability/ (observability configuration)
- scripts/ (infrastructure scripts)
- volumes/ (volume definitions)

**Authority Level:** MEDIUM

**Dependencies:** constitutional/, knowledge/, vos/, runtime/

**Dependents:** agents/

**Classification:** INFRASTRUCTURE

---

### Layer 6: agents/

**Purpose:** Agent runtime and templates

**Contents:**
- runtime/ (agent runtime scripts)
- templates/ (agent Dockerfiles and templates)
- permissions/ (agent permissions)

**Authority Level:** LOW

**Dependencies:** constitutional/, knowledge/, vos/, runtime/, infra/

**Dependents:** NONE (agents are execution workers)

**Classification:** SCAFFOLD (templates/), RUNTIME (runtime/), AUTHORITATIVE (permissions/)

---

### Layer 7: reports/

**Purpose:** Generated reports (audit outputs)

**Contents:**
- generated/ (all generated reports)

**Authority Level:** LOW

**Dependencies:** constitutional/, knowledge/, vos/, runtime/, infra/, agents/

**Dependents:** NONE (reports are outputs)

**Classification:** GENERATED

---

### Layer 8: legacy/

**Purpose:** Legacy artifacts (old audits, abandoned projects, historical artifacts)

**Contents:**
- audits/ (old audit reports)
- abandoned/ (abandoned projects)
- historical/ (historical artifacts)
- constitutional-integration-lab/ (legacy integration lab)
- ai-stack/ (legacy AI stack)
- CascadeProjects/ (legacy cascade projects)

**Authority Level:** NONE

**Dependencies:** NONE (legacy is isolated)

**Dependents:** NONE (legacy is isolated)

**Classification:** LEGACY

---

### Layer 9: misc/

**Purpose:** Miscellaneous artifacts (uncategorized, imports, recovery)

**Contents:**
- uncategorized/ (files with unclear ownership)
- imports/ (imported artifacts)
- recovery/ (recovery artifacts)

**Authority Level:** NONE

**Dependencies:** NONE (misc is isolated)

**Dependents:** NONE (misc is isolated)

**Classification:** UNKNOWN

---

### Layer 10: docs/

**Purpose:** Documentation (architecture, operations, onboarding)

**Contents:**
- architecture/ (architecture documentation)
- operations/ (operations documentation)
- onboarding/ (onboarding documentation)

**Authority Level:** LOW

**Dependencies:** constitutional/, knowledge/, vos/, runtime/, infra/

**Dependents:** NONE (docs are outputs)

**Classification:** DERIVED

---

## Dependency Hierarchy

```
constitutional/ (SUPREME)
    ↓
knowledge/ (HIGH)
    ↓
vos/ (HIGH)
    ↓
runtime/ (MEDIUM)
    ↓
infra/ (MEDIUM)
    ↓
agents/ (LOW)
```

**Special Cases:**
- agents/ may depend on all layers (constitutional/, knowledge/, vos/, runtime/, infra/)
- reports/ may depend on all layers (constitutional/, knowledge/, vos/, runtime/, infra/, agents/)
- docs/ may depend on all layers (constitutional/, knowledge/, vos/, runtime/, infra/)
- legacy/ is isolated (no dependencies, no dependents)
- misc/ is isolated (no dependencies, no dependents)

---

## Allowed Dependency Directions

### constitutional/ → All Layers

**Allowed:** YES

**Reason:** Constitutional documents are supreme authority

**Examples:**
- constitutional/AGENT.md → agents/permissions/agent_permissions.md
- constitutional/CRX_CONSTITUTION.md → runtime/kernel/commit-service/src/persistence/ledger_schema.sql

**Classification:** ALLOWED

---

### knowledge/ → runtime/, infra/, agents/, docs/

**Allowed:** YES

**Reason:** Knowledge specifications guide implementation

**Examples:**
- knowledge/authoritative/constitutional-database-spec.md → runtime/kernel/commit-service/src/persistence/db.ts
- knowledge/authoritative/constitutional-agent-infrastructure.md → agents/templates/Dockerfile

**Classification:** ALLOWED

---

### vos/ → runtime/, infra/, agents/, docs/

**Allowed:** YES

**Reason:** VOS governance guides implementation

**Examples:**
- vos/cos/CONSTITUTION.md → runtime/kernel/commit-service/src/validation/dag_validator.ts
- vos/cos/schema/audit-event.schema.json → runtime/kernel/commit-service/src/api/audit_controller.ts

**Classification:** ALLOWED

---

### runtime/ → infra/, agents/

**Allowed:** YES

**Reason:** Runtime code depends on infrastructure

**Examples:**
- runtime/kernel/commit-service/src/persistence/db.ts → infra/postgres/init/01-artifacts.sql
- runtime/kernel/commit-service/src/server.ts → infra/compose/docker-compose.yml

**Classification:** ALLOWED

---

### infra/ → agents/

**Allowed:** YES

**Reason:** Agents depend on infrastructure

**Examples:**
- infra/compose/docker-compose.yml → agents/templates/docker-compose.yml
- infra/redis/redis.conf → agents/runtime/crx_workspace_indexer.py

**Classification:** ALLOWED

---

### agents/ → All Layers

**Allowed:** YES

**Reason:** Agents are execution workers that depend on all layers

**Examples:**
- agents/permissions/agent_permissions.md → constitutional/AGENT.md
- agents/runtime/crx_workspace_indexer.py → runtime/kernel/commit-service/src/api/commit_controller.ts

**Classification:** ALLOWED

---

### reports/ → All Layers

**Allowed:** YES

**Reason:** Reports are outputs that document all layers

**Examples:**
- reports/generated/INFRA_GAP_REPORT.md → infra/compose/docker-compose.yml
- reports/generated/sovereignty-gap-report.md → runtime/kernel/commit-service/src/events/event_log.ts

**Classification:** ALLOWED

---

### docs/ → All Layers

**Allowed:** YES

**Reason:** Documentation documents all layers

**Examples:**
- docs/architecture/ → runtime/kernel/commit-service/src/
- docs/operations/ → infra/compose/docker-compose.yml

**Classification:** ALLOWED

---

## Prohibited Dependency Directions

### runtime/ → constitutional/

**Allowed:** NO

**Reason:** Runtime code cannot modify constitutional documents

**Classification:** PROHIBITED

---

### runtime/ → knowledge/

**Allowed:** NO

**Reason:** Runtime code cannot modify knowledge specifications

**Classification:** PROHIBITED

---

### runtime/ → vos/

**Allowed:** NO

**Reason:** Runtime code cannot modify VOS governance

**Classification:** PROHIBITED

---

### infra/ → constitutional/

**Allowed:** NO

**Reason:** Infrastructure cannot modify constitutional documents

**Classification:** PROHIBITED

---

### infra/ → knowledge/

**Allowed:** NO

**Reason:** Infrastructure cannot modify knowledge specifications

**Classification:** PROHIBITED

---

### infra/ → vos/

**Allowed:** NO

**Reason:** Infrastructure cannot modify VOS governance

**Classification:** PROHIBITED

---

### infra/ → runtime/

**Allowed:** NO

**Reason:** Infrastructure cannot modify runtime code

**Classification:** PROHIBITED

---

### agents/ → constitutional/ (WRITE)

**Allowed:** NO

**Reason:** Agents cannot modify constitutional documents (READ-ONLY access only)

**Classification:** PROHIBITED (WRITE), ALLOWED (READ)

---

### agents/ → knowledge/authoritative/ (WRITE)

**Allowed:** NO

**Reason:** Agents cannot modify authoritative knowledge (READ-ONLY access only)

**Classification:** PROHIBITED (WRITE), ALLOWED (READ)

---

### legacy/ → Any Layer

**Allowed:** NO

**Reason:** Legacy is isolated and has no authority

**Classification:** PROHIBITED

---

### misc/ → Any Layer

**Allowed:** NO

**Reason:** Misc is isolated and has no authority

**Classification:** PROHIBITED

---

## Authority Boundary Enforcement

### Enforcement Mechanism 1: File Permissions

**Implementation:** Set file permissions based on authority level

**constitutional/**: READ-ONLY for all except Governance Agent

**knowledge/authoritative/**: READ-ONLY for all except Governance Agent

**knowledge/derived/**: READ/WRITE for Documentation Agent, READ for others

**runtime/**: READ/WRITE for Refactor Agent, READ for others

**infra/**: READ/WRITE for Governance Agent, READ for others

**agents/**: READ/WRITE for Governance Agent, READ for others

**reports/**: READ/WRITE for Governance Agent, READ for others

**legacy/**: READ-ONLY for all

**misc/**: READ-ONLY for all

**docs/**: READ/WRITE for Documentation Agent, READ for others

**Classification:** PERMISSION_ENFORCEMENT

---

### Enforcement Mechanism 2: Dependency Validation

**Implementation:** Validate dependencies during code review

**Validation Rules:**
- No imports from lower layers to higher layers
- No modifications to constitutional documents
- No modifications to authoritative knowledge
- No modifications to VOS governance

**Classification:** DEPENDENCY_VALIDATION

---

### Enforcement Mechanism 3: Agent Permission Matrix

**Implementation:** Enforce agent_permissions.md

**Permission Matrix:**
- Planner Agent: READ-ONLY access to all layers
- Refactor Agent: READ/WRITE access to runtime/, READ access to others
- Documentation Agent: READ/WRITE access to docs/, knowledge/derived/, READ access to others
- Governance Agent: READ/WRITE access to reports/, infra/, READ/WRITE access to audits in authoritative/, READ access to others

**Classification:** AGENT_PERMISSION_ENFORCEMENT

---

## Final Classification

**FACT:** 10 authority layers defined

**FACT:** Dependency hierarchy established (constitutional → knowledge → vos → runtime → infra → agents)

**FACT:** Agents may depend on all layers

**FACT:** No reverse dependencies allowed

**FACT:** Legacy and misc are isolated

**INFERENCE:** Authority boundary enforcement is required for constitutional compliance

**RECOMMENDATION:** Enforce authority boundaries as specified above
