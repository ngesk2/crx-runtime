---
title: Organizational & Architectural Patterns
type: pattern
updated: 2026-07-29
tags: [pattern, organizational, architectural, delegation, consensus]
links:
  - INDEX.md
  - ../research/02-multi-agent-orchestration.md
  - ../research/05-business-operating-systems.md
  - ../research/07-decision-systems.md
---

# Patterns

## Pattern 1: Manager-Worker Delegation

**Source:** Research area 2 (CrewAI, AutoGen), research area 5 (EOS)
**Applicable to:** MissionRuntime + Scheduler
**Status:** Partially implemented (Scheduler assigns, no manager agent)

One agent assigns work, many execute. The manager owns decomposition and sequencing; workers own execution.

**PING implementation:** Scheduler.dispatchToAssignment() selects workers by capability and transitions to assigned state. What's missing is the decomposition step — the Scheduler assumes missions are atomic, not decomposable.

**Variations:**
- **Flat delegation** (implemented): Scheduler assigns mission to 1 worker
- **Consensus delegation** (implemented): Scheduler assigns to 3 workers (+ ConsensusEngine)
- **Hierarchical delegation** (missing): Manager mission spawns sub-missions, collects results, synthesizes output

---

## Pattern 2: Event-Sourced State Machine

**Source:** Research area 8 (Temporal, event sourcing), PING's MissionRuntime
**Applicable to:** MissionRuntime, UnifiedEventRuntime, all entity authorities
**Status:** Implemented for missions, missing for entities

State is the replay of all prior events. No mutable state object — only the event stream is authoritative. Checkpointing (snapshot) is an optimization, not a source of truth.

**PING implementation:** MissionRuntime states are driven by event transitions. UnifiedEventRuntime stores events immutably. Entities (Customer, Project, Review) use mutable CRUD — NOT event-sourced. This is the biggest pattern violation.

**Variations:**
- **Full event sourcing** (ideal): Entity state = replay of entity events
- **Hybrid** (PING's current approach): Missions are event-sourced, entities are CRUD
- **Snapshot** (future optimization): Periodic state capture + incremental event replay

---

## Pattern 3: OODA Decision Loop

**Source:** Research area 7 (OODA, Boyd), PING's event→observation→claim→classification→recommendation→projection pipeline
**Applicable to:** ConsensusEngine, knowledge pipeline
**Status:** Structurally aligned, dormant

Observe → Orient → Decide → Act, continuously. PING maps to this naturally:

| OODA Phase | PING Component | Status |
|------------|---------------|--------|
| Observe | UnifiedEventRuntime (events) | Working |
| Orient | KnowledgeGraph + Memory (context) | Empty |
| Decide | ConsensusEngine (recommendation) | Only system decisions |
| Act | MissionRuntime (execution) | Only system missions |

---

## Pattern 4: Deterministic Retry with Dead Letter Queue

**Source:** Research area 8 (Temporal, Airflow, n8n), research area 1 (browser agents)
**Applicable to:** WorkerRuntime, MissionRuntime
**Status:** Missing entirely in PING

Every action has a retry policy. After max retries, the action goes to a dead letter queue for human review. Retry policy is part of the mission template, not the executor.

**PING implementation gap:** WorkerRuntime has no retry logic. MissionRuntime has no retry policies. Event processing has no max retries. No DLQ exists.

**Pattern specification:**
```
retryPolicy = { maxAttempts: 3, backoff: 'exponential', initialDelay: 1000, maxDelay: 30000 }
DLQ = { store: 'postgres', table: 'dead_letter_queue', actions: [retry, escalate, abandon] }
```

---

## Pattern 5: Rocks-Pebbles-Sand Capacity Allocation

**Source:** Research area 5 (EOS), organizational intelligence
**Applicable to:** MissionRuntime, mission prioritization
**Status:** Not implemented

Work is categorized by size and priority:
- **Rocks** (3-7 per quarter): Top priorities, must be completed
- **Pebbles** (daily/weekly): Recurring tasks, keep the business running
- **Sand** (as available): Low-priority, fill remaining capacity

**PING implementation:** Mission priority is a single integer (1-10). No concept of capacity allocation across time horizons. Mission templates don't have size classification.

**Application:** Priority 8-10 = Quarterly rocks. Priority 4-7 = Weekly pebbles. Priority 1-3 = Daily sand. MissionRuntime should enforce capacity limits per time horizon.

---

## Pattern 6: Industry Lifecycle Parameterization

**Source:** Research area 6, research area 12
**Applicable to:** All entity authorities, mission templates
**Status:** Not implemented

Entity lifecycles, terminology, KPIs, and missions are parameterized by industry. The same entity (Project, Customer, Job) has different states and transitions in different industries.

**Example:**
- Roofing project lifecycle: estimate → permit → materials_delivery → tear_off → install → inspection → final
- HVAC project lifecycle: estimate → equipment_order → install → test → permit_inspection → final
- Landscaping project lifecycle: estimate → material_order → site_prep → install → clean_up → final

---

## Pattern 7: Capability-Based Connector Discovery

**Source:** Research area 9 (connector universe), PING's ConnectorRegistry
**Applicable to:** ConnectorRegistry
**Status:** Architecture correct, unfilled

Every connector registers capabilities. Consumers query by capability, never by provider. The capability registry is the only interface.

**PING implementation:** ConnectorRegistry has `byCapability.get(capability)` and `byProvider.get(provider)`. `findConnectorByCapability()` returns connectors sorted by priority. Architecture is correct and used.

---

## Pattern 8: Knowledge Evolution Pipeline

**Source:** Research areas 3, 4
**Applicable to:** KnowledgeGraph, workers, event pipeline
**Status:** Architecture exists, dormant

Knowledge evolves through deterministic stages:

```
Event → Observation → Evidence → Fact → Knowledge → Wisdom
  │          │           │         │        │           │
  raw     context+    confidence  high      applied     strategic
  data    verification  > 0.7    confidence knowledge   insight
```

**PING alignment:** The event→observation→claim→classification→recommendation→projection pipeline maps stages 1-5. Missing: confidence thresholds per stage, provenance tracking, fact consolidation.

---

## Pattern 9: Provider Abstraction with Fallback

**Source:** Research area 10 (LiteLLM, Ollama, vLLM), PING's AIRuntime
**Applicable to:** AIRuntime, OllamaProvider
**Status:** Architecture correct, implementation single-provider

Model selection is capability-based. A provider registry maps capability → model → provider. Fallback chain: primary unavailable → secondary → tertiary → deterministic fallback.

**PING implementation:** AIRuntime has `chat()`, `embed()`, `health()` interface. OllamaProvider implements it. No fallback. When Ollama is down (current state), AI capabilities are completely unavailable. The architectural pattern is correct — only the provider population is missing.
