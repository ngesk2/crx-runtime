# PING v2 Constitutional Operational Plane (Read-only SPEC)

**Status:** Read-only specification. No implementation.
**Role:** PING becomes the single operational authority for every deployed TenantOS application.

---

## Mission

PING becomes the single operational authority for every deployed TenantOS application.

It never owns business meaning.
It owns execution.
It owns visibility.
It owns recovery.
It owns deployment.
It owns automation.

Everything else references PING.

---

## Oracle Layer

Oracle should become almost invisible.

Oracle owns:
- Compute
- Kubernetes (or OCI Container Instances)
- OCI Functions
- Load Balancer
- DNS
- Certificates
- Vault
- Object Storage
- PostgreSQL hosting
- Networking
- Monitoring agents

Oracle should never know:
- Customer
- Review
- Project
- Invoice
- Workflow
- Knowledge
- Compiler

Those remain constitutional.

---

## PING Layer

PING should become roughly these domains:

Fleet, Tenants, Deployments, Runtime, Automation, Notifications, Observability, Health, Secrets References, AI Runtime, Scheduling, Recovery, Administration.

Notice none of these are business objects.

### Proposed Module Structure

```
PING/
  /apps
    admin/
    fleet/
    deployments/
    runtime/
    automation/
    notifications/
    observability/
    analytics/
    integrations/
    workers/
    agents/
```

Organized around capabilities, not UI pages.

---

## Fleet

Fleet becomes:
```
Fleet
├── HPP
├── Demo
├── Internal
├── Future Restaurant
├── Future Church
├── Future Law Firm
```

Each tenant publishes:
- Health
- Version
- Events
- Capabilities
- Automation State
- Queues

PING consumes.

---

## Runtime

Runtime should become:
- Hermes
- Ollama
- MCP
- Workers
- Queue
- Scheduler
- Cron
- Event Bus

These are persistent Oracle services. Every tenant references them.
No tenant runs their own Ollama. No tenant runs Hermes. Oracle hosts. PING manages.

### Hermes
```
Hermes Runtime
↓ Memory
↓ Agents
↓ Prompt Registry
↓ Tool Registry
↓ Execution Queue
↓ PING
↓ Tenant
```
HPP should never start Hermes. PING does.

### Ollama
```
Oracle
↓ Persistent Ollama
↓ PING
↓ Tenant
```
No duplicated models. No duplicated embeddings. One AI platform.

---

## Capability Registry

Missing generator. Should eventually become:
- Capability: Name, Version, Owner, Authority, Health, Available, Dependencies

PING reads. Compiler generates.

---

## Observability

Every tenant should emit:
- Heartbeat
- Version
- Latency
- Queue Depth
- Memory
- CPU
- Errors
- Automation Events
- Notifications
- Deployments

PING becomes Grafana-like.

---

## Event Bus

Every tenant should emit only Canonical Envelope:
- event_id
- tenant_id
- authority
- workflow
- type
- timestamp
- hash

PING does not need payload. Only metadata.

---

## Deployment Registry

Every deployment:
- Deployment ID
- Tenant
- Git SHA
- Compiler Version
- Generator Version
- IR Version
- Manifest Version
- OCI Region
- Environment
- Rollback Target
- Health

One table.

---

## Website Administration

Every tenant gets:
- Configuration
- Domains
- SSL
- DNS
- Backups
- Maintenance
- Secrets References
- Notifications
- Deployments
- Health

Never rebuild this. Every site inherits it.

HPP should expose (instead of custom admin):
- Projects
- Reviews
- Customers
- Knowledge
- Estimates

Everything operational disappears into PING.

---

## Automation

Automation timeline:
```
Estimate Submitted
↓ Queue
↓ AI Review
↓ Routing
↓ Notification
↓ CRM
↓ Completed
```
PING owns this visualization. HPP owns the meaning.

---

## AI Control

PING should own:
- Models
- Providers
- Costs
- Inference
- Embedding Jobs
- Prompt Versions
- Caches
- Failures

Every tenant benefits.

---

## Oracle Persistence (priority)

Stand up these persistent services next:
- **Hermes Runtime** — long-running, shared by all tenants
- **Ollama Runtime** — shared model server, GPU-aware if available, warm model cache
- **Neo4j** — hosted once, HPP owns graph contents
- **Qdrant** — hosted once, HPP owns vectors
- **PostgreSQL** — separate schema/database per tenant; PING stores operational metadata; tenants store business data
- **Redis** — queues, scheduling, sessions, caching

---

## Generator Priority

The audits consistently point to the same missing compiler pieces:
1. Generation Manifest (unblocks everything)
2. Workflow Generator
3. Event Generator
4. Capability Registry Generator
5. Deployment Artifact Generator
6. State Machine Generator

Those six complete the compiler→runtime bridge.

---

## End-State

```
Oracle
├── Kubernetes / Compute
├── Vault
├── Redis
├── PostgreSQL
├── Neo4j
├── Qdrant
├── Ollama
└── Hermes
        ↓
PING
├── Fleet
├── Deployments
├── Runtime
├── Automation
├── Notifications
├── Observability
├── AI Control
└── Tenant Administration
        ↓
HPP
├── Projects
├── Reviews
├── Estimates
├── Customers
├── Knowledge
└── Business Workflows
```

Business meaning remains with the tenant; all operational concerns converge into PING; all infrastructure is hosted by Oracle. Once the missing generators exist, they target this runtime consistently without each tenant reinventing execution, observability, or deployment.

================================================================================
# READ-ONLY CONSISTENCY REVIEW (appended)

**Verified against:** `SPRINT4_INFRASTRUCTURE_AUDIT.md`, `NEXT_PHASE_PLANNING_REVIEW.md`, `PING_OPERATIONAL_CONTROL_PLANE_AUDIT.md`, and the HPP `GENERATION_MANIFEST.yaml` built this session.

## 1. Consistency with prior audits — CONFIRMED
- **Single-owner invariant (SPRINT4):** preserved — PING owns operational execution/visibility/recovery/deployment/automation; business meaning (Customer/Review/Project/Invoice/Workflow/Knowledge/Compiler) stays HPP/Oracle-free. ✅
- **Three-tier model:** Oracle hosts, HPP knows, PING executes+observes. Matches `PING_OPERATIONAL_CONTROL_PLANE_AUDIT.md` §0. ✅
- **Event Bus envelope-only:** `event_id/tenant_id/authority/workflow/type/timestamp/hash` — PING sees metadata, not payload. Reinforces SPRINT4. ✅
- **Generator gap list:** the 6-item priority (Manifest→Workflow→Event→Capability→Deployment→StateMachine) = the missing compiler→runtime bridge from `NEXT_PHASE_PLANNING_REVIEW.md`. ✅

## 2. Refinements this spec ADDS (resolves prior ambiguities)
- **PostgreSQL per-tenant split:** "separate schema/database per tenant; PING stores operational metadata; tenants store business data." This resolves the earlier "PING owns Operational State (PostgreSQL)" ambiguity — PING owns the *operational metadata* store, HPP owns the *business data* store. Clean separation. ✅
- **Shared Hermes/Ollama:** "No tenant runs their own Ollama. No tenant runs Hermes. Oracle hosts. PING manages." Resolves the SPRINT4/NEXT_PHASE Ollama-ownership ambiguity — one shared AI platform, PING monitors, Oracle hosts. ✅
- **HPP never starts Hermes; PING does:** clarifies runtime ownership definitively. ✅
- **Website Administration inherited, never rebuilt:** every tenant gets config/domains/SSL/DNS/backups/maintenance/secrets-refs/notifications/deployments/health from PING. ✅

## 3. Status of the 6 generators
- **#1 Generation Manifest — DONE.** `website/src/constitution/GENERATION_MANIFEST.yaml` already exists (built + committed this session). So the "unblocks everything" item is complete; the remaining 5 are the open gaps.
- **#2–#6 (Workflow / Event / Capability Registry / Deployment Artifact / State Machine):** NOT built. These are the compiler→runtime bridge. Consistent with `NEXT_PHASE` Tier 1/2.

## 4. Residual ambiguities (read-only flags)
- **AI Control "Models":** PING "owns Models/Providers/Costs/Inference/..." — interpret as *operational metadata about models* (which are loaded, versions, cost, cache), not the model weights (Oracle-hosted Ollama owns those). Confirm PING owns model *operational state*, not model *meaning*.
- **Oracle "Identity" overlap (carried from NEXT_PHASE):** still unresolved — Oracle IAM/tenant auth vs HPP business identity. This spec puts Identity under Oracle (Vault/IAM) but HPP owns business identity meaning; the split must be explicit.
- **Capability Registry generator:** IR has capabilities (`calendar.v1` etc.) but no generated *registry artifact*. The spec correctly flags it as a missing generator. ✅

## 5. Conclusion
PING v2 is the canonical consolidation of the operational-plane vision. It is constitutionally sound, freeze-compatible, and resolves three prior ambiguities (PostgreSQL split, shared AI, envelope-only bus). The only remaining work is the 5 missing generators (Manifest already done). No implementation performed.

*Read-only spec + review. No code changed.*
