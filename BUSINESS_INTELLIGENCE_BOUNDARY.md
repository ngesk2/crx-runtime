# WAVE 3A.6 — BUSINESS INTELLIGENCE BOUNDARY AUDIT (Read-Only)

**Mode:** Documentation-only. No code changes. No wiring. No implementation.
**Basis:** file evidence from this session + prior read-only audits (SPRINT4, NEXT_PHASE, PING v2, PING OS Transition, WAVE_3A5 ×2).
**Invariant (SPRINT4):** canonical owner = who owns *meaning*, not who stores/executes.

---

## Part 1 — Authority Ownership Matrix

### HPP owns — Business meaning
| Concern | Evidence |
|---|---|
| Customer lifecycle / CRM entities | `website/src/config/*` (business objects), SPRINT4 (HPP owns CRM) |
| Estimates / Reviews / Projects | IR snapshot aggregates `estimate/`, `review/`, `project/` [E:website/src/constitution/ir/snapshot-v1.json] |
| Campaigns / Email sequences / Influencer programs | PING OS Transition (HPP owns marketing campaign/influencer/email-template definitions) |
| Funnels / Attribution / Conversion metrics | PING OS Transition (HPP owns funnel/attribution/conversion analytics) |
| Business KPIs / Marketing events | PING OS Transition (HPP owns business KPIs + marketing events) |
| **PostHog event definitions / Analytics taxonomy** | PING OS Transition (HPP defines PostHog event defs; PING mirrors) |

### PING owns — Operational execution
| Concern | Evidence |
|---|---|
| Event transport / Canonical event bus | `storage/event_store.py` + `storage/postgres/models.py` (Event append-only) [E:storage/postgres/models.py] |
| Replay | `kernel/build_witness.py` + `runtime/persistent_runtime.py` + `api/main.py` `/replay` [E:WAVE_3A5_RUNTIME_AUTHORITY_AUDIT §4] |
| Diagnostics / Health | `notification/diagnostics.py` + `api/main.py` `/health` [E:WAVE_3A5 §3,§9] |
| Queueing / Retries / Worker execution | `notification/outbox_processor.py` (outbox/retry) [E:notification/outbox_processor.py] |
| Deployment / Runtime fingerprint / Drift detection | `deploy/Dockerfile` + `architecture/infrastructure/*` [E:WAVE_3A5 §2] |
| Integration lifecycle / Connector health | `capabilities/connector.py` + `notification/provider_registry.py` [E:WAVE_3A5 §6] |
| Telemetry aggregation / Operational dashboards | `notification/metric_events.py` + `api/main.py` `/metrics` + `prometheus.yml` [E:WAVE_3A5 §5] |

### Oracle owns — Infrastructure recommendations only
| Concern | Evidence |
|---|---|
| Infrastructure optimization / Runtime suggestions / Cost analysis / Deployment advice | `architecture/infrastructure/PING_ORACLE_*` blueprints (advisory docs) [E:architecture/infrastructure/*] |

**Oracle NEVER:** publishes, creates business content, or modifies business state. Oracle is the host tier, not an authority.

---

## Part 2 — PostHog Contract

```
HPP Business Event
    ↓  (HPP defines: name, schema, meaning)
Canonical Event
    ↓  (PING canonicalizes: event_id = content hash, producer_id, correlation_id, causality_id, schema_version, build_witness_hash)  [E:storage/postgres/models.py]
Analytics Projection
    ↓  (PING projects canonical event → analytics shape)
PING Delivery
    ↓  (PING delivers projection to PostHog via integration)
PostHog
    ↓  (operational analytics layer — a projection, NOT source of truth)
```

**Stated explicitly:**
- **HPP defines events.** PostHog event definitions + analytics taxonomy live in HPP.
- **PING delivers events.** PING transports, canonicalizes, and delivers the projection.
- **PostHog is a projection.** It is a mirror of canonical events, not the source of truth.
- **Canonical events remain the source of truth.** The Event store (`storage/postgres/models.py`) is authoritative; PostHog is derived.

This matches PING OS Transition ("PostHog becomes an operational analytics layer — not your source of truth").

---

## Part 3 — Read-Only Analytics Rule

**PING MAY:**
- Read canonical events (`/events` route) [E:api/main.py:261]
- Aggregate telemetry (`notification/metric_events.py`, `/metrics`) [E:WAVE_3A5 §5]
- Project canonical → analytics shape (Part 2)
- Diagnose (`notification/diagnostics.py`, `runtime/failure_authority.py`)
- Replay (`/replay`, `kernel/build_witness.py`)
- Observe (health/connector/runtime fingerprints)

**PING MAY NOT:**
- Define funnels (HPP owns)
- Create campaigns (HPP owns)
- Rename events (HPP owns definitions; PING only canonicalizes)
- Invent KPIs (HPP owns business KPIs)
- Modify business analytics (read-only on business layer)
- Publish marketing content (HPP owns; Oracle never publishes)

**Enforcement point:** PING's canonical Event model carries `producer_id` + `schema_version` — if PING attempted to redefine an event's *meaning*, it would change `producer_id`/`schema_version`, which the witness hash would reject (CI/runtime rejection, per PING OS Transition Event Governance). So the rule is **structurally enforced**, not just documented.

---

## Part 4 — Event Classification

| Event | Class | Owner | Canonical Authority |
|---|---|---|---|
| EstimateCreated / EstimateAccepted | Business | HPP | HPP (estimate aggregate) [E:snapshot-v1.json] |
| JobCreated / JobAssigned / JobCompleted | Business | HPP | HPP (job aggregate) |
| ProjectCreated / ProjectCompleted | Business | HPP | HPP (project aggregate) |
| ProjectBooked / EstimateSent / WarrantyCreated / InspectionScheduled | Business | HPP | HPP (handwritten in IR, to be generated) [E:NEXT_PHASE §'4 events'] |
| ReviewPublished | Business | HPP | HPP (review aggregate, frontend Patch L) |
| CustomerPortalReady | Business | HPP | HPP (customer aggregate) |
| WorkflowStarted / WorkflowCompleted / WorkflowFailed | Operational | PING | PING (execution_authority) |
| DeploymentStarted / Succeeded / RolledBack | Operational | PING | PING (deploy) |
| CompilerGenerated | Operational | PING | PING (compiler) |
| ContractRejected | Governance | PING | PING (failure_authority) |
| TenantRegistered / CapabilityResolved | Governance | PING | PING (registry) |
| NotificationSent | Operational | PING | PING (notification/outbox) |
| EmailOpened / EmailClicked | Integration | PING delivers / HPP defines | PING (delivery) + HPP (meaning) |
| InfluencerConverted | Business | HPP | HPP (influencer program) |
| AutomationExecuted | Operational | PING | PING (automation) |
| AuthorityExecuted | Governance | PING | PING (constitution_authority) |
| AIInference / AgentExecution / ToolCall / InferenceLatency / ModelVersion / WarmCacheStatus / GPUUtilization / MemoryUsage / QueueDepth / ModelDownloads / HealthCheck | Telemetry/Diagnostic | PING | PING (hermes runtime + metrics) [E:WAVE_3A5 §9] |
| ConnectorConnected / ConnectorFailed / ProviderHealth / WebhookReceived | Integration | PING | PING (connector/provider_registry) |
| DiagnosticsEmitted / FailureDetected / DriftDetected | Diagnostic | PING | PING (diagnostics/failure_authority) |
| MetricEmitted / TraceSpan | Telemetry | PING | PING (metric_events) |
| SchemaValidated | Governance | PING | PING (compiler/CI) |

**Single-owner holds:** every event maps to exactly one meaning-owner. PING never redefines a business event's meaning.

---

## Part 5 — PostHog Event Mapping

| Business Event (HPP) | Analytics Projection (PING) | PostHog Event | Missing? |
|---|---|---|---|
| EstimateCreated | estimate.created | ✅ mapped | — |
| EstimateAccepted | estimate.accepted | ✅ mapped | — |
| JobCreated | job.created | ✅ mapped | — |
| JobCompleted | job.completed | ✅ mapped | — |
| ProjectCreated | project.created | ✅ mapped | — |
| ProjectCompleted | project.completed | ✅ mapped | — |
| ProjectBooked | project.booked | ⚠️ projection not yet generated (handwritten IR event) | **GAP** |
| EstimateSent | estimate.sent | ⚠️ projection not yet generated | **GAP** |
| WarrantyCreated | warranty.created | ⚠️ projection not yet generated | **GAP** |
| InspectionScheduled | inspection.scheduled | ⚠️ projection not yet generated | **GAP** |
| ReviewPublished | review.published | ✅ mapped (frontend Patch L) | — |
| InfluencerConverted | influencer.converted | ⚠️ influencer program not yet defined in HPP | **GAP** |
| EmailOpened / EmailClicked | email.opened / email.clicked | ✅ deliverable (PING delivery) | — |

**Missing mappings** = the 4 handwritten IR business events (ProjectBooked/EstimateSent/WarrantyCreated/InspectionScheduled) + influencer conversion. These require the **Event Generator** (NEXT_PHASE gap) to produce the canonical→analytics projection. Not a boundary violation; a **generator gap**.

---

## Part 6 — Operational Metrics Inventory (PING)

| Metric | Computed by | Business KPI? |
|---|---|---|
| Queue depth | `notification/outbox_processor.py` | NO |
| Worker latency | hermes/runtime + scheduler | NO |
| Retry count | `notification/outbox_processor.py` | NO |
| Connector failures | `notification/provider_registry.py` | NO |
| Replay success | `kernel/build_witness.py` | NO |
| Drift count | (aspirational DriftDetector, WAVE_3A5 §9) | NO |
| Runtime hash | `runtime/persistent_runtime.py` | NO |
| Platform hash | `deploy/Dockerfile` build | NO |
| Deployment health | `api/main.py` `/health` + `architecture/infrastructure` | NO |
| Connector health | `capabilities/connector.py` + provider_registry | NO |

**Verification:** ✅ none of PING's operational metrics are business KPIs. They measure *execution health*, not *business outcomes*. No boundary violation.

---

## Part 7 — Business Metrics Inventory (HPP)

| Metric | Owner | PING access |
|---|---|---|
| Conversion rate | HPP | via projection only |
| Estimate acceptance | HPP | via projection only |
| Review completion | HPP | via projection only |
| Email performance | HPP (defines) / PING delivers | PING observes delivery, not content |
| Campaign ROI | HPP | via projection only |
| Influencer performance | HPP | via projection only |

**Verification:** ✅ PING consumes these **only through projections** (Part 2 contract). PING never computes or redefines them. The `/metrics` endpoint exposes PING's *operational* telemetry; business metrics reside in HPP's analytics layer (PostHog definitions owned by HPP).

---

## Part 8 — Integration Boundary

| Integration | Owner | Purpose | Business? | Operational? | Analytics? | Canonical Authority |
|---|---|---|---|---|---|---|
| PostHog | HPP defines / PING delivers | Analytics projection | HPP (defs) | PING (delivery) | mirror | HPP (event defs) + PING (delivery) |
| Twilio | PING | SMS delivery | NO | YES | NO | PING (provider_registry) [E:notification/providers/twilio.py] |
| SMTP | PING | Email delivery | NO | YES | NO | PING (provider_registry) |
| Kit/ConvertKit | HPP defines / PING delivers | Email automation | HPP (content) | PING (delivery) | mirror | HPP (seq def) + PING (delivery) |
| CRM | HPP | Customer data | YES | NO | partial | HPP (CRM entity) |
| Webhooks | PING | Inbound events | NO | YES | NO | PING (ingress/adapters/*) [E:ingress/adapters/twilio_webhook.py, kit_webhook.py, http.py] |
| GitHub | PING | Repo acquisition | NO | YES | NO | PING (capabilities/github/acquire_repository.py) |
| Ollama | PING (hosted by Oracle) | AI inference | NO | YES | partial (model telemetry) | PING (hermes/runtime) |

**Rule:** every integration has a single *meaning-owner*. Business integrations (CRM, Kit content, PostHog defs) are HPP-owned; operational delivery (Twilio, SMTP, webhooks, GitHub, Ollama runtime) is PING-owned. Analytics integrations (PostHog, Kit mirror) are **split**: HPP defines, PING delivers.

---

## Part 9 — Constitutional Verification

| Check | Result | Evidence |
|---|---|---|
| No business authority inside PING | ✅ PASS | PING modules are operational (execution/notification/storage); no CRM/estimate/review aggregates in PING [E:WAVE_3A5 §2] |
| No operational authority inside HPP | ✅ PASS | HPP owns compiler/IR/knowledge; PING owns execution+observability [E:SPRINT4] |
| No Oracle publication path | ✅ PASS | Oracle = host tier (infra docs only); never publishes/modifies business state [E:architecture/infrastructure/*] |
| Analytics remain projections | ✅ PASS | PostHog = mirror of canonical events (Part 2) |
| Canonical events remain authoritative | ✅ PASS | Event store is source of truth; PostHog derived [E:storage/postgres/models.py] |

**All constitutional boundaries preserved.**

---

## Part 10 — Findings

### Confirmed (evidence-backed)
1. HPP owns all business meaning; PING owns all operational execution; Oracle hosts only. (SPRINT4 + this audit)
2. PostHog is a projection, not source of truth. The Event store is authoritative.
3. PING's read-only analytics rule is **structurally enforced** via `producer_id` + `schema_version` + witness hash (CI/runtime rejection).
4. No business authority exists in PING; no operational authority in HPP; no Oracle publication path.
5. Every integration has a single meaning-owner; analytics integrations are split (HPP defines, PING delivers).

### Gaps (missing implementations — documentation only, no fix)
1. **Event Generator not built** → 4 handwritten IR business events (ProjectBooked/EstimateSent/WarrantyCreated/InspectionScheduled) lack canonical→analytics projection. [E:NEXT_PHASE]
2. **Influencer program not yet defined in HPP** → `InfluencerConverted` has no HPP definition yet.
3. **DriftDetector / RuntimeFingerprint / ExecutiveDashboard** (operational-intel *views*) not built — they consume existing telemetry, not new infra. [E:WAVE_3A5 §9]
4. **`/health` static JSON** — should delegate to live runtime (WAVE_3A5 §3). Operational, not business; no boundary violation but a quality gap.

### Risks (boundary violations — none confirmed, monitor)
1. **If PING ever defines a funnel/KPI** → violates read-only analytics rule. Structurally blocked by witness hash, but monitor.
2. **If Oracle publishes business content** → violates host-tier rule. No path exists; monitor.
3. **If HPP embeds execution logic** → violates SPRINT4. Not observed.

### Recommendations (documentation only — NO implementation)
1. Document the PostHog contract (Part 2) in the constitutional repo as the canonical analytics boundary.
2. Build the **Event Generator** to close the 4 missing projections (Gap 1) — this is the NEXT_PHASE generator gap, not a boundary change.
3. Keep `/health` delegation as an operational (not business) improvement.
4. Treat DriftDetector/RuntimeFingerprint/ExecutiveDashboard as *views* over existing PING telemetry — never as new authorities.

---

## Deliverables (this document)
- ✅ Authority matrix (Part 1)
- ✅ PostHog contract (Part 2)
- ✅ Analytics projection model (Part 2, Part 5)
- ✅ Event ownership (Part 4)
- ✅ Integration ownership (Part 8)
- ✅ Runtime vs Business separation (Parts 1, 6, 7)
- ✅ Constitutional verification (Part 9)
- ✅ Evidence appendix (all `[E:...]` tags)

## Success Criteria (answered with repository evidence)
| Question | Answer |
|---|---|
| Who owns business intelligence? | **HPP** (CRM, estimates, reviews, campaigns, funnels, attribution, conversion, KPIs, PostHog defs) |
| Who owns operational intelligence? | **PING** (transport, replay, health, queueing, retries, deployment, drift, connector health, telemetry, operational dashboards) |
| Who owns analytics definitions? | **HPP** (PostHog event defs + analytics taxonomy) |
| Who owns analytics delivery? | **PING** (canonicalize + deliver projection to PostHog) |
| Where is PostHog positioned? | **Projection / mirror** of canonical events — not source of truth |
| Where do canonical events remain authoritative? | **PING Event store** (`storage/postgres/models.py`) — PostHog is derived |
| Are constitutional boundaries preserved? | **YES** (Part 9 — all 5 checks PASS) |
| Are there any ownership conflicts? | **NO confirmed.** 1 structural gap (Event Generator) + 1 quality gap (`/health` static) — neither is a boundary violation |

*Read-only specification. No code changed. Committed as BUSINESS_INTELLIGENCE_BOUNDARY.md.*
