# READ ONLY — EXECUTION DIRECTIVE
## PING Sprint 1 — Operational Automation Platform

### Constitutional Status: FROZEN

### Compiler Status: DO NOT MODIFY

### Document Status: APPEND ONLY

---

# Purpose

This document defines the **only approved implementation objective** for the PING repository.

This is **NOT** a compiler sprint.
This is **NOT** a constitutional redesign.
This is **NOT** a runtime refactor.

PING consumes the generated runtime produced by Happy Place Platform.
Happy Place Platform remains the compiler.
PING becomes the operational automation engine.

---

# Repository Ownership

## Happy Place Platform

Repository Owner: PIGING90

Responsibility:

```
Manifest
↓
Compiler
↓
Canonical IR
↓
Generated Runtime
```

Happy Place Platform owns:
* Constitution
* Compiler
* Canonical IR
* Runtime generation
* Repository generation
* Event generation
* Replay generation
* Projection generation
* Authority generation

PING MUST NOT duplicate these.

---

## PING

Repository Owner: PIGING85

PING consumes generated runtime.

PING owns:
* OAuth
* Automation
* Provider integrations
* Operational orchestration
* Observability
* AI automation
* Sync engines
* Task execution
* External systems

PING MUST NOT modify compiler outputs.

---

# Single Deliverable

## Operational Automation Layer

Build:

```
Generated Runtime
↓
Automation Engine
↓
Task Provider
↓
Google Tasks
```

Nothing else.

---

# Existing Infrastructure (DO NOT REBUILD)

These systems already exist.
Reuse them.
Do not replace them.

---

## PostgreSQL

Operational state.

Continue using:
* projects
* tasks
* sync_state
* provider_mapping
* workflow_execution
* automation_runs
* oauth_tokens

No new operational database.

---

## Neo4j

Relationship graph.

Continue using:
* Project
* Mission
* Task
* Crew
* Evidence
* Observation

Tasks should become graph nodes.

Do not build another graph.

---

## Qdrant

Semantic memory.

Continue using:
* completed work
* lessons learned
* maintenance history
* failures
* warranties
* observations

Completed Tasks become searchable memories.

---

## Existing Event Pipeline

Reuse the existing domain event pipeline.

Never poll if events already exist.

Consume:
* EstimateSent
* ProjectBooked
* ProjectStarted
* CrewAssigned
* MaterialsRequired
* ProjectCompleted
* WarrantyCreated
* InspectionScheduled

Automation subscribes.

Never duplicates.

---

# Architecture

```
Compiler
↓
Generated Runtime
↓
Domain Events
↓
PING Automation Engine
↓
Task Provider
↓
Google Tasks
```

Google never talks directly to project logic.

---

# Required Structure

```
automation/

    automation-engine.ts
    workflow-engine.ts
    provider-registry.ts
    task-provider.ts

    templates/
        painting.workflow.yaml
        flooring.workflow.yaml
        repairs.workflow.yaml
        kitchens.workflow.yaml
        bathrooms.workflow.yaml
        restoration.workflow.yaml
        decks.workflow.yaml
        fencing.workflow.yaml

    providers/
        google/
            GoogleTasksProvider.ts
```

Future providers plug in here.
No compiler changes required.

---

# Task Provider Contract

```
interface TaskProvider {
    createTask()
    updateTask()
    completeTask()
    deleteTask()
}
```

Google Tasks is Provider #1.
No provider-specific logic outside providers/google.

---

# Security Boundary

Tenant OS owns:
* CRM
* Customers
* Addresses
* Emails
* Phones
* Contracts
* Estimates
* Pricing
* AI
* Photos
* Evidence
* Notes

Google receives only:
* Project #2026-041
* Prime siding
* Due Tuesday

Open in Tenant OS.

Nothing else.
No exceptions.

---

# Synchronization

Bidirectional:
```
PING ↓ Google Tasks
Google Tasks ↓ PING
```

Conflict resolution:
Tenant OS always wins.

---

# Observability

Every automation emits telemetry.

Example:
```
ProjectBooked
↓
WorkflowStarted
↓
TasksGenerated
↓
SyncSucceeded
↓
Completed
```

PING dashboard exposes:
* Automation Health
* OAuth Status
* Sync Queue
* Retry Queue
* Dead Letter Queue
* Provider Latency
* Google API Quota
* Task Sync Status

Reuse existing telemetry.
Do not create another monitoring system.

---

# AI Layer

PING agents consume operational events.

Example:
```
Painting scheduled
↓
Weather forecast
↓
Recommend delay
↓
Human approval
↓
Update Google Tasks
↓
Notify Crew
```

Agents never modify compiler outputs.
Agents operate above generated runtime.

---

# Existing Pipeline Integration

Piggyback existing systems whenever possible.

Reuse:
* PostgreSQL persistence
* Neo4j relationships
* Qdrant semantic memory
* existing event bus
* existing replay
* existing authority enforcement
* existing generated repositories

Avoid introducing parallel infrastructure.

---

# Out of Scope

Do not implement:
* GraphQL
* REST generation
* SDK generation
* Terraform
* UI
* Compiler
* Canonical IR
* Runtime generation
* Repository generation

Those belong to Happy Place Platform.

---

# Success Criterion

The compiler remains unchanged.

PING consumes generated runtime.

A ProjectBooked event automatically results in:
```
Generated Runtime
↓
Automation Engine
↓
Workflow Template
↓
Task Provider
↓
Google Tasks
↓
Neo4j Task Node
↓
PostgreSQL Sync State
↓
Qdrant Memory
↓
Observability Event
↓
Agent Awareness
```
with zero duplicated business logic.

---

# Reporting Rules

This document is APPEND ONLY.
Do not rewrite previous sections.
Each implementation session appends:
```
Date
Completed
Files Changed
Tests
Outstanding Work
Next Deliverable
```

Only one active deliverable exists at any time.
No architectural redesigns.
No scope expansion.
Compiler remains frozen.
PING remains the operational automation layer.

================================================================================
# APPENDED SESSION REPORT

[2026-07-24T21:40:00Z]

Completed:
- Read-only discovery of `constitutional-runtime` (PING) per directive.
- Confirmed present in repo:
  * Constitutional event store (`storage/postgres/models.py`): generic `Event` model + 6 registries. NO operational tables.
  * Notification providers (Twilio/Kit) under `notification/`. NOT task providers.
  * Qdrant: exists ONLY as a Docker deployment service (referenced in `infra/` docs). NOT repo code.
  * `infra/docker/docker-compose.yml` defines Qdrant/PostgreSQL services for deployment.
- Confirmed ABSENT (contrary to directive's "already exists" premise):
  * PostgreSQL operational tables (projects/tasks/sync_state/provider_mapping/workflow_execution/automation_runs/oauth_tokens) — `storage/postgres/models.py` has only the `Event` model + registries.
  * Neo4j — `search "neo4j"` across repo = 0 results. Not present (deployment service only).
  * oauth — `search "oauth"` across repo = 0 results. Not present.
  * Business domain events (EstimateSent/ProjectBooked/ProjectStarted/CrewAssigned/MaterialsRequired/ProjectCompleted/WarrantyCreated/InspectionScheduled) — NOT defined in PING; these are Happy Place Platform generated-runtime events, consumed by NAME via an event bus.
  * `automation/` directory — does not exist (0 results).

Files Changed:
- NONE. Read-only discovery only (directive treats this doc as APPEND ONLY; no previous file existed, so this report initializes the doc with the pasted directive + this report).

Blocker:
- Building the Operational Automation Layer as specified REQUIRES infrastructure the directive says "already exists" and "Do NOT REBUILD" / "no new operational database":
  * PostgreSQL operational tables + Neo4j graph + oauth are NOT in `constitutional-runtime`.
  * Qdrant exists only as a Docker deployment service.
- Per directive rule "If the generator requires a compiler change: STOP. Append the issue." The automation layer as specified requires infra that is forbidden to create (would violate "no new operational database" / "Out of Scope: Runtime/Repository generation belong to HPP").
- The directive is also internally inconsistent: "Single Deliverable: Build automation/ ..." but its own "Existing Infrastructure (DO NOT REBUILD)" + "Out of Scope: Runtime generation" imply the sync sinks (PostgreSQL/Neo4j/Qdrant) live in deployment, not this repo. The automation LOGIC (automation-engine/workflow-engine/provider-registry/task-provider/templates/google) is buildable infra-agnostic; the SYNC to PostgreSQL/Neo4j requires infra absent here.

Outstanding Work:
- Determine where the operational infrastructure actually lives:
  (a) If PostgreSQL operational tables + Neo4j + oauth are in a SEPARATE PING operational repo (owner PIGING85, distinct from `constitutional-runtime`), point me there and I will build the layer against them.
  (b) If they are deployment-only and the directive intends adapter seams, confirm and I will build `automation/` infra-agnostic (provider-registry + task-provider + google provider + 8 YAML templates + automation/workflow engines) WITHOUT creating operational DBs — sync sinks become adapter interfaces the deployment wires (respecting "no new operational database").

Next Deliverable:
- AWAIT CLARIFICATION: which repo holds the operational infra (PostgreSQL/Neo4j/oauth), OR confirm build infra-agnostic with adapter seams. Do not invent infrastructure per directive's "Do not invent" / "no new operational database" rules.
