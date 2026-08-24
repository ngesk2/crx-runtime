# WAVE 3D — GROWTH INTELLIGENCE SPEC (Read-Only)

**Mode:** Read-only specification. No code changes. No business definitions.
**Basis:** BUSINESS_INTELLIGENCE_BOUNDARY.md (HPP owns funnels/attribution/conversion; PING read-only), WAVE_3A5_RUNTIME_AUTHORITY_AUDIT §6 (connector surface), WAVE_3C (dashboard embeds PostHog projections), WAVE_3B_GENERATOR_GAP_CLOSURE.md (Event Generator populates projections).
**User thesis:** "Your business model changes what PING should observe. Influencer marketing, email marketing, free-first acquisition should appear as operational pipelines. PING measures every transition. HPP defines the campaign."

---

## 1. The Growth Pipeline (operational view)

```
Influencer          (HPP defines program; PING observes connector health)
   ↓  InfluencerConverted        [business event, HPP-owned — BI Boundary §4]
Landing Page         (HPP content; PING serves/deploys)
   ↓  SignupCreated              [business event, HPP-owned]
Signup               (HPP CRM entity)
   ↓  (PING: provisioning triggered)
Compiler provisions tenant   [operational, PING — Generation Manifest → IR → runtime]
   ↓  TenantProvisioned          [operational event, PING]
Deployment           (PING deployment registry)
   ↓  DeploymentStarted/Succeeded [operational event, PING]
Email automation      (HPP defines sequence; PING delivers via provider_registry)
   ↓  EmailSent/Opened/Clicked   [integration event, PING delivers / HPP defines]
AI onboarding         (PING hermes/runtime executes; HPP defines content)
   ↓  AIOnboardingCompleted      [operational event, PING]
Activation            (HPP business KPI)
   ↓  ActivationRecorded         [business event, HPP-owned]
Conversion            (HPP business KPI)
   ↓  ConversionRecorded         [business event, HPP-owned]
Expansion             (HPP business KPI)
   ↓  ExpansionRecorded          [business event, HPP-owned]
```

**Key:** every transition emits a **canonical event**. Business events (InfluencerConverted, SignupCreated, Activation, Conversion, Expansion) are **HPP-owned**. Operational events (TenantProvisioned, Deployment*, EmailSent, AIOnboarding) are **PING-owned delivery/execution**. PING measures transitions; HPP defines why.

---

## 2. Event Inventory (growth-specific)

| Transition | Event | Class | Owner | PING role |
|---|---|---|---|---|
| Influencer click | InfluencerConverted | Business | HPP | observes delivery only |
| Landing visit | PageView | Telemetry | PING | aggregates |
| Signup | SignupCreated | Business | HPP | transports |
| Tenant provision | TenantProvisioned | Operational | PING | executes (compiler→runtime) |
| Deploy | DeploymentStarted/Succeeded | Operational | PING | executes |
| Email send | EmailSent | Integration | PING delivers / HPP defines | delivers |
| Email open/click | EmailOpened/EmailClicked | Integration | PING delivers / HPP defines | delivers |
| AI onboarding | AIOnboardingCompleted | Operational | PING | executes (hermes) |
| Activation | ActivationRecorded | Business | HPP | transports |
| Conversion | ConversionRecorded | Business | HPP | transports |
| Expansion | ExpansionRecorded | Business | HPP | transports |

**Gap:** `InfluencerConverted`, `SignupCreated`, `ActivationRecorded`, `ConversionRecorded`, `ExpansionRecorded` require HPP funnel definitions + the **Event Generator** (WAVE_3B P003) to produce canonical→analytics projections. Until P003 lands, these have no PostHog projection (BI Boundary §5).

---

## 3. PING's Observability Role (read-only)

Per BUSINESS_INTELLIGENCE_BOUNDARY §3, PING MAY for growth:
- **Read** canonical events (`/events`).
- **Aggregate** delivery telemetry (email send/open latency via `notification/metric_events.py`).
- **Project** canonical → analytics shape (P003).
- **Diagnose** delivery failures (`notification/outbox_processor.py` retry, `runtime/failure_authority.py`).
- **Observe** connector health (`capabilities/connector.py` + `provider_registry.py`).

PING MAY NOT:
- Define the funnel (HPP owns).
- Set conversion KPIs (HPP owns business KPIs).
- Attribute revenue (HPP owns attribution).
- Publish campaign content (HPP owns).

This is structurally enforced: a PING attempt to redefine `InfluencerConverted` meaning would change `producer_id`/`schema_version`, rejected by witness hash (BI Boundary §3).

---

## 4. Integration Authority Model (growth integrations)

Every growth integration exposes operational health to PING (from user's "Integration Authority model"):

| Integration | Health | Latency | Auth status | Rate limits | Webhook status | Retry queue | Event volume |
|---|---|---|---|---|---|---|---|
| PostHog | PING monitors ingestion | — | HPP-owned key | — | n/a | n/a | PING delivers |
| Resend/Kit | `provider_registry` | metric_events | provider auth | provider | n/a | outbox | metric_events |
| GitHub | `capabilities/github` | — | provider auth | — | webhook adapter | n/a | — |
| Stripe | (future) | — | — | — | — | — | — |
| Slack/Discord | `ingress/adapters/*` | — | provider auth | — | webhook | n/a | — |
| HubSpot (CRM) | HPP-owned | — | HPP-owned | — | — | — | — |

All integrations fit PING's operational observability (WAVE_3A5 §6). No new integration manager — promote `capabilities/connector.py` + `provider_registry.py`.

---

## 5. Boundary Verification (growth-specific)

| Check | Result | Evidence |
|---|---|---|
| Funnels owned by HPP | ✅ | BI Boundary §1 (HPP owns funnels/attribution/conversion) |
| PING read-only on growth analytics | ✅ | BI Boundary §3 (structurally enforced) |
| Canonical events authoritative | ✅ | Event store source of truth; PostHog projection |
| No business authority in PING | ✅ | WAVE_3A5 §2 (no CRM/estimate/review aggregates in PING) |
| Oracle never publishes campaigns | ✅ | BI Boundary §9 (no Oracle publication path) |

---

## 6. What NOT to Build (preserve freeze)

| Tempting growth feature | Verdict | Reason |
|---|---|---|
| Funnel builder | ❌ DON'T | HPP owns funnels |
| Attribution engine | ❌ DON'T | HPP owns attribution |
| Conversion KPI calculator | ❌ DON'T | HPP owns business KPIs |
| Campaign content publisher | ❌ DON'T | HPP owns; Oracle never publishes |
| New integration manager | ❌ DON'T | exists (connector.py + provider_registry) |
| New analytics store | ❌ DON'T | PostHog = projection; Event store = source |

PING's growth role is **observability of delivery + execution**, not definition of business outcomes.

---

## 7. Build Prerequisites (read-only dependency)

Growth Intelligence panels are populated only after:
1. **P003 Event Generator** (WAVE_3B) — produces InfluencerConverted/SignupCreated/Activation/Conversion/Expansion projections.
2. **HPP funnel definitions** — HPP must define the influencer program + funnel (currently absent, BI Boundary §10 Gap 2).
3. **P002 Capability Registry** — so Integration Authority model has a generated source.
4. **Dashboard Growth page** (WAVE_3C) — embeds the PostHog projection read-only.

Until P003 + HPP defs exist, Growth Intelligence has no data. This is the same generator-gap pattern (WAVE_3B): infra exists, definitions + projections missing.

---

## 8. Success Criteria (answered)

| Question | Answer |
|---|---|
| Who owns growth funnels? | **HPP** (BI Boundary §1) |
| Who owns growth attribution? | **HPP** |
| Who measures growth delivery? | **PING** (observability only) |
| Are growth events canonical? | **YES** — Event store authoritative; PostHog = projection |
| Is PING read-only on growth analytics? | **YES** — structurally enforced |
| What builds growth intelligence? | HPP funnel defs + P003 Event Generator + dashboard Growth panel (WAVE_3C) |
| Any boundary violation? | **NONE** — all checks PASS |

*Read-only specification. No code changed. Committed as WAVE_3D_GROWTH_INTELLIGENCE.md.*
