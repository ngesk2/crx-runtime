---
title: Capability Matrix — Research Areas × PING Components
type: capability
updated: 2026-07-29
tags: [capability, matrix, mapping, component]
links:
  - INDEX.md
  - ../research/README.md
  - ../../gateway/connector_registry.js
  - ../../ping-runtime/orchestration/mission_runtime.js
---

# Capability Matrix: Research Areas × PING Components

## Matrix

| Research Area | PING Component | Match | Gap | Action |
|---------------|---------------|-------|-----|--------|
| **01 Browser Agent** | ConnectorRegistry | Architecture — browser agent is a connector type | No BrowserConnector exists; no browser capability in registry | Create BrowserConnector following GoogleConnector pattern |
| **01 Browser Agent** | WorkerRuntime | Dispatch pattern matches browser agent execution | No workflow definition language for browser steps | Define browser workflow schema for MissionRuntime |
| **01 Browser Agent** | AIRuntime | Could route browser task generation | No model configured for browser workflow planning | Add browser capability to provider registry |
| **02 Multi-Agent** | Scheduler | SHA-256 deterministic dispatch by capability is correct | Capability-to-worker mapping is system-only, not business | Populate WorkerPortRegistry with business workers |
| **02 Multi-Agent** | ConsensusEngine | Multi-agent consensus pattern is correct | Never used for business decisions | Wire ConsensusEngine.evaluate() into business decision missions |
| **02 Multi-Agent** | WorkerPortRegistry | findAvailable/findBest by capability | 1 worker registered (OpenCode), not business role agents | Register per-role workers (dispatcher, estimator, tech) |
| **02 Multi-Agent** | MissionRuntime | Lifecycle (created→assigned→running→completed→failed→archived) | No delegation patterns (peer, broadcast, supervisor) | Add delegation type to mission metadata |
| **03 Memory Systems** | EventQueue (Orca) | Event-sourced architecture is the foundation for episodic memory | Zero business events processed through Orca | Wire UnifiedEventRuntime events into Orca EventQueue |
| **03 Memory Systems** | KnowledgeGraph | Nodes + edges model is correct for semantic memory | Empty — 0 nodes, 0 edges | Define fact extraction pipeline from events |
| **03 Memory Systems** | UnifiedEventRuntime | Single canonical event pipeline is correct | Events flow but no memory consolidation step | Add consolidation worker: event→semantic fact |
| **03 Memory Systems** | WorkerRuntime | Procedural memory = mission templates | Zero mission templates exist | Create mission template catalog from business processes |
| **04 Knowledge Systems** | KnowledgeGraph | Event→Observation→Claim→Classification→Recommendation→Projection pipeline | All workers dormant, zero facts derived | Activate knowledge pipeline by deploying workers |
| **04 Knowledge Systems** | QdrantAdapter | Vector storage exists | 2 collections, 5 points — empty | Populate from derived facts, not raw events |
| **04 Knowledge Systems** | Neo4jAdapter | Graph storage exists | Not wired — no Neo4j container | Defer — KnowledgeGraph (PG) covers initial needs |
| **05 Business OS** | MissionRuntime | Mission is architecturally correct for EOS rocks/tasks | No EOS primitives (rocks/pebbles/sand, scorecards, Level 10) | Model EOS primitives as mission subtypes |
| **05 Business OS** | GatewayRuntime | /mc routes already defined for Mission Control | Dashboard shows system health, not business metrics | Add business KPI widgets (revenue, jobs, reviews) |
| **05 Business OS** | AuthorityRegistry | 17-authority chain from Raw Transport to Verification | All authorities are operational, none are business | Add BusinessOperatingSystem authority with EOS methods |
| **05 Business OS** | CustomerAuthority | CRUD exists | No lifecycle, no mission triggering, no EOS alignment | Add lifecycle state machine + auto-mission creation |
| **06 Industry Intel** | ProjectAuthority | Project CRUD exists | Industry-specific lifecycle not modeled | Parameterize lifecycle by industry (roofing vs HVAC vs plumbing) |
| **06 Industry Intel** | AIRuntime | Could route industry-specific analysis | No industry models configured | Add industry-specific system prompts to provider registry |
| **06 Industry Intel** | WorkerRuntime | Mission templates could be industry-specific | Zero industry templates exist | Build per-industry mission template library |
| **07 Decision Systems** | ConsensusEngine | OODA cycle matches PING's decision pipeline | No Cynefin classification on recommendations | Add decision_framework field to Decision object |
| **07 Decision Systems** | ConsensusEngine | Confidence scoring exists | No outcome tracking → no improvement loop | Add outcome feedback to ConsensusEngine |
| **07 Decision Systems** | Recommendation → Projection pipeline | Structurally correct for Orient→Decide→Act | All dormant | Activate by populating decision framework |
| **08 Workflow Systems** | MissionRuntime | Event-sourced mission state is architecturally correct | No retry policies, no DLQ, no idempotency keys | Add retry policy + DLQ + idempotency to MissionRuntime |
| **08 Workflow Systems** | WorkerRuntime | _poll() disabled — dispatch-only mode prevents auto-recovery | No checkpoint/resume for long-running missions | Add mission checkpointing to WorkerRuntime |
| **08 Workflow Systems** | UnifiedEventRuntime | Event sourcing is correct for workflow state | No step-level checkpoint, no mid-workflow restart | Add step tracking to mission lifecycle |
| **09 Connector Universe** | ConnectorRegistry | 9-method Connector interface (connect, disconnect, health, execute, subscribe, etc.) | 5 connectors wired, 0 authenticated | Populate credentials for existing connectors |
| **09 Connector Universe** | ConnectorRegistry | byCapability index is correct abstraction | 0 third-party connectors (QuickBooks, Stripe, Slack, etc.) | Build connector backlog by business ROI |
| **09 Connector Universe** | GoogleConnector | Reference implementation wraps 5 Google adapters | Only Google — needs Microsoft 365, QuickBooks, Stripe | Add connector priority queue by customer demand |
| **10 AI Infrastructure** | AIRuntime | Provider abstraction with chat/embed/health interface | Ollama container stopped, no alternative provider | Add vLLM or LiteLLM provider as fallback |
| **10 AI Infrastructure** | AIRuntime | Capability-based routing architecture | Model selection hardcoded to Ollama | Add capability→model→provider mapping table |
| **10 AI Infrastructure** | OllamaProvider | Exists and wired | Stopped container, no connection since Session 12 | Fix Ollama network or add alternative |
| **11 Org Intelligence** | MissionRuntime | Mission is the right primitive for role-based work | No role model — missions have no role owner | Add owner_role to mission metadata |
| **11 Org Intelligence** | AuthorityRegistry | 17-authority chain models operational concerns | No organizational model authority | Add OrganizationAuthority for role/permission/team model |
| **11 Org Intelligence** | GatewayRuntime | /mc routes define the organizational dashboard | Dashboard shows system metrics, not role-specific views | Add per-role dashboard routing |
| **12 Business Ontology** | UnifiedEventRuntime | 23 business event types exist | No entity-to-event mapping | Create entity→event type manifest |
| **12 Business Ontology** | CustomerAuthority | CRUD exists | No lifecycle model | Add lifecycle state + valid transitions |
| **12 Business Ontology** | ProjectAuthority | CRUD exists | No relationship model | Add parent/child entity references |
| **12 Business Ontology** | ReviewAuthority | CRUD exists | No mission triggering | Add event→mission auto-creation |

## Summary

| Classification | Count |
|---------------|-------|
| Architecture correct, implementation empty | 24 |
| Architecture correct, implementation partial | 8 |
| Architecture needs extension | 5 |
| Architecture missing entirely | 4 |
| **Total gaps** | **41** |

## Highest-Value Closures

1. **Populate 5 connector credentials** — zero code changes, unlocks 5 integrations
2. **Create entity lifecycle model** — define state machines for Customer, Lead, Estimate, Project, Job, Invoice, Review
3. **Deploy WorkerRuntime in polling mode** — enable the disabled `_poll()` to start auto-processing events
4. **Wire ConsensusEngine into business decisions** — use existing pure computation engine for recommendation validation
5. **Add idempotency keys to MissionRuntime** — prevent duplicate external actions on retry
