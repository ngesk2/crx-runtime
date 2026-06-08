# Authority Map

**Generated:** 2026-06-07  
**Audit:** CRX Layer 0 — Discovery (Read-Only)  
**Canonical Root:** `C:\Users\nolan\CRX`

---

## Authority Hierarchy (Declared per AGENT.md)

| Priority | Document | Layer | Owner | Risk |
|----------|----------|-------|-------|------|
| 1 | `AGENT.md` | Agent constitution | Declared canonical | LOW (declared) |
| 2 | `knowledge/authoritative/UCIA-CONSTITUTION-v1.0.md` | Kernel primitives | UCIA v1.0 | LOW |
| 3 | `vos/cos/CONSTITUTION.md` | Engineering process | COS v1.0.0 | LOW |
| 4 | `agents/agent_permissions.md` | Agent permissions | Bounded matrix | LOW |
| 5 | `knowledge/authoritative/*` | Domain specs | Various | MEDIUM (volume) |

---

## Undeclared Constitutional Authority (UNRESOLVED)

| Document | Location | Status | Risk |
|----------|----------|--------|------|
| `CRX_CONSTITUTION.md` | `C:\Users\nolan\CRX\` | FROZEN Phase 3.5A; **not in AGENT.md hierarchy** | **CRITICAL** |

**Classification:** UNKNOWN which document is supreme. Do not resolve in discovery phase.

---

## Constitutional Documents

| Artifact | Location | Authority Level | Owner | Risk | Lineage |
|----------|----------|-----------------|-------|------|---------|
| AGENT.md | CRX root | CANONICAL (declared P1) | Agent directive | LOW | 2026-06-06 |
| CRX_CONSTITUTION.md | CRX root | FROZEN (undeclared) | Kernel spec 3.5A | **CRITICAL** | 2026-06-07 |
| UCIA-CONSTITUTION-v1.0.md | knowledge/authoritative | AUTHORITATIVE (P2) | UCIA | LOW | knowledge git |
| persistence-constitution.md | knowledge/authoritative | CRITICAL per inventory | Persistence law | MEDIUM | knowledge git |
| claim.schema.json | knowledge/authoritative | CRITICAL schema | Identity/claims | HIGH if drifted | knowledge git |
| decision.schema.json | knowledge/authoritative | CRITICAL schema | Decisions | HIGH if drifted | knowledge git |
| constitutional-state-hash-model.md | knowledge/authoritative | CRITICAL schema | State hashing | HIGH | knowledge git |
| replay-reconstruction.md | knowledge/authoritative | Replay spec (doc-only) | Replay semantics | HIGH — no executable | knowledge git |
| vos/cos/CONSTITUTION.md | vos/cos | AUTHORITATIVE (P3) | COS process | LOW | vos git |
| vos/cos/ARCHITECTURE.md | vos/cos | DERIVED | Architecture | LOW | vos git |

---

## Governance Documents

| Artifact | Location | Authority Level | Risk |
|----------|----------|-----------------|------|
| agent_permissions.md | CRX/agents | AUTHORITATIVE (P4) | LOW |
| cos-mapping.md | knowledge/derived | BRIDGE (non-authoritative) | LOW |
| reports/*.md (19 files) | CRX/reports | FORENSIC RECORD | MEDIUM — do not mutate |
| AUTHORITY_CONFLICT_REPORT.md | CRX root | AUDIT ARTIFACT | LOW |
| EXECUTION_REALITY_REPORT.md | CRX root | AUDIT ARTIFACT | LOW |

---

## Runtime Implementations

| Artifact | Location | Authority Level | Status | Risk |
|----------|----------|-----------------|--------|------|
| commit-service (12 TS files) | runtime/kernel/commit-service | **CANONICAL RUNTIME** | PARTIAL impl | MEDIUM |
| canonical_engine.ts | runtime/.../engines | Observed authority | IMPLEMENTED | HIGH — coupled |
| identity_engine.ts | runtime/.../engines | Observed authority | IMPLEMENTED | HIGH — hash=identity |
| dag_validator.ts | runtime/.../validation | Observed authority | IMPLEMENTED | MEDIUM |
| event_log.ts | runtime/.../events | Observed authority | IMPLEMENTED | MEDIUM |
| ledger_schema.sql | runtime/.../persistence | Schema authority | IMPLEMENTED | MEDIUM |
| agents/docker-compose.yml | CRX/agents | SCAFFOLD | BROKEN | HIGH if used |
| ai-stack/main.py | ai-stack/api | **SHADOW RUNTIME** | EXPERIMENTAL | **CRITICAL** |

---

## Experimental Implementations

| Artifact | Location | Authority Level | Risk |
|----------|----------|-----------------|------|
| knowledge/experimental/ (3 files) | CRX/knowledge | EXPERIMENTAL | LOW |
| CascadeProjects/ entire tree | home | SHADOW | **CRITICAL** |
| constitutional-integration-lab/extracted/ | home | EXTRACTION QUARANTINE | MEDIUM |
| ai-stack/ | home | UNDOCUMENTED RUNTIME | HIGH |

---

## Historical Archives

| Artifact | Location | Authority Level | Risk |
|----------|----------|-----------------|------|
| JS.txt (421 KB, 59+ modules) | Documents/Codex/2026-05-31/... | ARCHAEOLOGICAL | MEDIUM — inspirational only |
| MCP0.txt | Documents/Codex/2026-05-31/... | ARCHAEOLOGICAL | LOW |
| Codex outputs (56 files) | Documents/Codex/ | ARCHAEOLOGICAL | LOW |
| CascadeProjects/constitutional-extraction-lab/ | CascadeProjects | ARCHAEOLOGICAL | LOW |

---

## Shadow Authorities (Must Not Become Canonical)

| Artifact | Location | Conflict | Classification |
|----------|----------|----------|----------------|
| CascadeProjects/AGENT.md | CascadeProjects | Conflicts with CRX/AGENT.md | **DUPLICATE** |
| CascadeProjects/infra/docker-compose.yml | CascadeProjects | Competes with absent CRX/infra | **DUPLICATE** |
| CascadeProjects/schemas/ | CascadeProjects | Competes with knowledge schemas | **DUPLICATE** |
| ai-stack FastAPI | ai-stack | Competes with commit-service | **DUPLICATE** |
| Downloads/Pig CRX_KnowledgeOS refs | Obsidian workspace.json | Stale paths to migrated content | **STALE** |

---

## Cognition Layer (Non-Constitutional)

| Artifact | Location | Authority | Classification |
|----------|----------|-----------|----------------|
| Obsidian vault `Pig` | Downloads/Pig | **NOT constitutional authority** | Cognition substrate |
| CRX/knowledge/ | CRX | Documentation authority only | Knowledge substrate |
| Creator pipeline notes | Pig/15_Pipelines | Workflow notes | INFERENCE — export candidate |

---

## Authority Boundary Violations (Observed in Runtime)

| ID | Violation | Location | Risk |
|----|-----------|----------|------|
| V-001 | Transport executes canonicalization + lineage | commit_controller.ts | HIGH |
| V-002 | DB schema grants truth authority | ledger_schema.sql | MEDIUM |
| V-003 | Identity collapses into hashing | identity_engine.ts | HIGH |
| V-004 | Hashing collapses into canonicalization | identity_engine.ts | MEDIUM |

**Source:** `CRX/reports/authority_boundary_violations.md` (2026-06-06 forensic audit)
