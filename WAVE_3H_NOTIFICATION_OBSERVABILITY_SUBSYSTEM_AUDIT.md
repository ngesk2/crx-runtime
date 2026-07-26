# WAVE 3H — NOTIFICATION & OBSERVABILITY SUBSYSTEM AUDIT (Read-Only)

**Mode:** Read-only audit. No code changes.
**Basis:** `notification/provider_registry.py`, `provider_runtime.py`, `provider_descriptor.py`, `provider_id.py`, `capability_resolver.py`, `providers/twilio.py`, `providers/kit.py`, `metric_events.py`, `outbox_processor.py`, `diagnostics.py`, `ingress/adapters/twilio_webhook.py`, `kit_webhook.py`, `http.py`, WAVE_3A5_RUNTIME_AUTHORITY_AUDIT.md §5/§6, BUSINESS_INTELLIGENCE_BOUNDARY.md.
**Role:** this subsystem is PING's **delivery + telemetry** core — the operational layer that sends notifications and emits metrics. HPP owns the *content*; PING owns the *delivery + observation*.

---

## 1. Subsystem Definition

```
HPP defines email sequence / content   (business meaning)
   ↓ (canonical event: EmailSent with content ref)
PING delivers:
   capability_resolver → provider_registry → provider_runtime → provider (Twilio/Kit)
   ↓ (outbox retry on failure)
PING observes:
   metric_events → /metrics → prometheus
   diagnostics → failure_authority
```

PING owns **delivery + telemetry** (operational). HPP owns **content + sequences** (business).

---

## 2. Module Inventory

| Module | Role (evidence) | Status |
|---|---|---|
| `notification/provider_registry.py` | Provider registry (IntegrationAuthority) [WAVE_3A5 §6] | present, used |
| `notification/provider_runtime.py` | Provider runtime execution | present, used |
| `notification/provider_descriptor.py` | Provider descriptor | present, used |
| `notification/provider_id.py` | Provider ID | present, used |
| `notification/capability_resolver.py` | Capability resolution | present, used |
| `notification/providers/twilio.py` | SMS provider | present |
| `notification/providers/kit.py` | ConvertKit (email) provider | present |
| `notification/metric_events.py` | Metrics emission (MetricsPort) [WAVE_3A5 §5] | present |
| `notification/outbox_processor.py` | Outbox + retry | present |
| `notification/diagnostics.py` | Diagnostics | present |
| `ingress/adapters/twilio_webhook.py` | Twilio inbound webhook | present |
| `ingress/adapters/kit_webhook.py` | Kit inbound webhook | present |
| `ingress/adapters/http.py` | HTTP adapter | present |

**Finding:** the delivery + telemetry subsystem is **complete and used**. No missing module except additional providers (Google Workspace/Stripe/HubSpot — aspirational, HPP-defined where business).

---

## 3. Delivery Flow

```
CapabilityResolver.resolve(capability)
   ↓
ProviderRegistry.lookup(provider_id)
   ↓
ProviderRuntime.execute(provider, payload_ref)
   ↓
Provider (Twilio/Kit) sends
   ↓ (failure?)
OutboxProcessor.retry (exponential backoff)
   ↓
MetricEvents.emit(delivery latency/success)
```

This is the **outbox pattern** — durable delivery with retry. Present and operational.

---

## 4. Telemetry Flow

```
MetricEvents.emit(metric)
   ↓
/api/metrics  (Prometheus scrape endpoint)  [WAVE_3A5 §5]
   ↓
prometheus.yml (scrape config)  [architecture/infrastructure/prometheus.yml]
   ↓
Operational dashboard (WAVE_3C Observability page)
```

Telemetry is decentralized but complete: metric_events (emit) + /metrics (expose) + prometheus (scrape). No single "telemetry service" needed — it's a pattern, not a module.

---

## 5. Event Inventory (notification/observability)

| Event | Class | Owner |
|---|---|---|
| NotificationSent | Operational | PING (delivery) |
| EmailOpened | Integration | PING delivers / HPP defines |
| EmailClicked | Integration | PING delivers / HPP defines |
| MetricEmitted | Telemetry | PING |
| DiagnosticsEmitted | Diagnostic | PING |
| FailureDetected | Diagnostic | PING (failure_authority) |
| WebhookReceived | Integration | PING (ingress adapter) |

All are operational/integration/telemetry — none carry business meaning. EmailOpened/Clicked are delivered by PING but *defined* by HPP (content/sequence owner).

---

## 6. Integration Authority (per provider)

Each provider exposes (Integration Authority model, WAVE_3A5 §6):

| Provider | Health | Latency | Auth | Rate limits | Webhook | Retry | Volume |
|---|---|---|---|---|---|---|---|
| Twilio | provider_registry | metric_events | provider auth | provider | twilio_webhook | outbox | metric_events |
| Kit/ConvertKit | provider_registry | metric_events | provider auth | provider | kit_webhook | outbox | metric_events |
| (Google Workspace) | — | — | — | — | — | — | aspirational |
| (Stripe) | — | — | — | — | — | — | aspirational |
| (HubSpot/CRM) | HPP-owned | — | HPP-owned | — | — | — | HPP-owned |

PING observes provider health/latency/auth/rate-limits/webhook/retry/volume via `provider_registry` + `metric_events` + `outbox`. Business integrations (HubSpot/CRM) are HPP-owned; PING observes only the delivery telemetry.

---

## 7. Boundary Verification

| Check | Result | Evidence |
|---|---|---|
| PING owns delivery (operational) | ✅ | notification/providers/* |
| HPP owns email content/sequences | ✅ | BI Boundary §1 (HPP owns email automation defs) |
| PING read-only on business analytics | ✅ | BI Boundary §3 |
| Telemetry is operational (not business) | ✅ | metric_events = operational |
| No Oracle publication | ✅ | BI Boundary §9 |
| No business authority in PING | ✅ | WAVE_3A5 §2 (no CRM/estimate/review in PING) |

---

## 8. What Exists vs Missing

**Exists:** full delivery pipeline (resolver → registry → runtime → provider → outbox), telemetry (metric_events + /metrics + prometheus), diagnostics, webhook adapters (Twilio/Kit/HTTP).

**Missing (aspirational, do NOT build in PING):**
- Google Workspace / Stripe / HubSpot providers — these are **business integrations**; HPP defines them. PING would only *deliver* (if they become delivery channels) via the existing provider_registry pattern.
- New notification engine — **exists** (don't rebuild).
- New telemetry pipeline — **exists** (don't rebuild).
- IntegrationManager — **don't build**; promote `provider_registry` + `capabilities/connector` (WAVE_3A7 R5).

---

## 9. What NOT to Build (preserve freeze)

| Tempting feature | Verdict | Reason |
|---|---|---|
| New notification engine | ❌ DON'T | notification/* exists |
| New telemetry pipeline | ❌ DON'T | metric_events + prometheus exist |
| IntegrationManager | ❌ DON'T | provider_registry + connector exist |
| Email content editor | ❌ DON'T | HPP owns content |
| Business CRM in PING | ❌ DON'T | HPP owns CRM |
| Google Workspace/Stripe as PING-owned | ❌ DON'T (unless delivery channel) | HPP defines business integrations |

---

## 10. Build Prerequisites (read-only dependency)

Subsystem is **functional**. Remaining work (informational):
1. Event Generator (WAVE_3B P003) emits NotificationSent/EmailOpened/EmailClicked with correct `producer_id` so they reach PostHog mirror (HPP-defined projection).
2. Retire general dupes (WAVE_3A7) — no notification-specific rebuild.
3. If new delivery channels added (Stripe/HubSpot), implement as **providers** via existing `provider_registry` pattern — never a new engine.

No architectural change.

---

## 11. Success Criteria (answered)

| Question | Answer |
|---|---|
| Who owns delivery? | **PING** (operational) |
| Who owns email content? | **HPP** (business) |
| Is telemetry operational-only? | **YES** |
| Are providers observable? | **YES** (Integration Authority pattern) |
| Is subsystem complete? | **YES** (delivery + telemetry + diagnostics + webhooks) |
| Any boundary violation? | **NO** — all checks PASS |
| What to build? | **Nothing** — promote provider_registry; Event Generator populates projections |

*Read-only audit. No code changed. Committed as WAVE_3H_NOTIFICATION_OBSERVABILITY_SUBSYSTEM_AUDIT.md.*
