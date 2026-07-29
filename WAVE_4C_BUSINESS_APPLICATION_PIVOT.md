# WAVE 4C — Business Application Pivot (Read-Only Synthesis)

**Mode:** STRICTLY READ ONLY. No code changes. No new architecture. Synthesis + mapping only.
**Context:** WAVE 4A (BI Refactor) + WAVE 4B (Runtime Reconciliation) confirmed the PING platform is the center of gravity.
This document answers the strategic question the CEO raised: **the platform is ~90–95% complete; the largest remaining gap is the business application (~35–45%), not infrastructure.**

---

## 1. Verdict (confirmed)

| Layer | State | Evidence |
|---|---|---|
| PING platform (runtime, authorities, replay, event model, BI, signals, health models, recommendations, forecasting, prioritization, knowledge, observability, integrations, governance) | **~90–95% complete** | WAVE 4A/4B; BI layer built + 9 tests pass; Observation Layer connections wiring (this session) |
| HPP business application (Mission Control, Project-first model, semantic search UX, AI Workspace, end-to-end workflows) | **~35–45% complete** | Canonical object model + frontend scaffolding exist; operational console, AI Workspace, search UX, workflows are thin/red |

**The red domains are application, not platform:** Customers, Projects, Scheduling, Gallery, Portfolio, CRM, AI Workspace are thin. Auth, Tenant, Event arch, Runtime, BI, Knowledge, AI runtime are green.

**Conclusion:** Shift almost all effort from platform to the business application. The platform is mature enough to *run Happy Place daily*; the application is what makes it pay.

---

## 2. The refactor is ownership, not runtime

PING thinks in **Objects / Events / Artifacts / Knowledge / Actions**. HPP should too. The smell: runtime capabilities still organized as technical subsystems (`notification`, `gallery`, `review`, `automation`) rather than services that *enrich business objects*.

**Do not delete modules. Make them services attached to a Project or Customer.**

This aligns with WAVE 4B Step 6 (Object Runtime): every object versioned, observable, queryable, replayable, diffable, composable. The HPP canonical object model (Customer / Project / Review / Estimate / Photo) already exists — it must become the *center*, not a sidebar.

---

## 3. First-class business objects (map to existing assets)

| Business Object | Owns | Already-built asset to consume |
|---|---|---|
| **Customer** | Leads, Projects, Reviews, Communications, Documents, AI context | HPP canonical-object model; PING knowledge graph (per-customer node) |
| **Project** | Estimate, Schedule, Photos, Materials, Crew, Reviews, Portfolio, Artifacts, Knowledge | HPP object model; PING Object Runtime (event-sourced aggregate); artifact repo |
| **Artifact** (business) | Estimate PDF, Invoice, Before photo, Warranty, Permit, Inspection, Proposal, Marketing asset | PING artifact ontology + Hermes artifact repository; make them *searchable* |

**Everything becomes searchable.** The artifact + knowledge layers already exist in PING; HPP must expose them per-object.

---

## 4. Mission Control = queues, not pages (projection over event stream)

Instead of sections (Reviews / Projects / Customers / Gallery), think in **queues** — each a *projection over the same canonical event stream* PING already emits:

```
Needs Attention · Needs Approval · Needs Scheduling · Needs Photos
· Needs Customer Response · Needs AI Review · Completed Today
```

This aligns with the event architecture: PING's `EventEnvelope` + store + NATS + EventBus are the single source; Mission Control queues are *read models* (projections), exactly like the BI Health Models. No new event model — new *projections*.

---

## 5. Admin stops being CRUD → observe → propose → act

Every screen supports the closed loop (north star from the 10-step order):
- **Observe** — project missing before photos (projected from events)
- **Propose** — request customer upload / generate reminder / create crew task
- **Act** — one click

This is the same loop PING's runtime lives by (observe → understand → propose → act → verify). The application UI should mirror it.

---

## 6. AI Workspace (highest-value feature not built)

Not chat — **workspace per project**. Each project view composes already-built PING assets:

| Workspace panel | Consumes (PING asset) |
|---|---|
| Timeline | Event stream (EventEnvelope store) |
| Knowledge | PING knowledge graph (per-project nodes) |
| Photos | Artifact repo (business artifacts) |
| Artifacts | PING artifact ontology |
| Communications | Notification events (EmailSent/SmsSent — now emitted) |
| Health | BI Health Models (RevenueHealth / PipelineHealth / ReputationHealth) |
| Recommendations | BI recommendation fields |
| Next actions | BI prioritization (ranked problems) + propose-act loop |

This is dramatically more useful than a generic assistant — and it consumes assets that **already exist**.

---

## 7. Universal semantic search (expose existing infra)

PING has semantic/knowledge infrastructure. The application must expose it so the owner asks:
- "Which cedar fence projects don't have before photos?"
- "Show me customers likely to leave reviews."
- "Which estimates are at risk?"
- "Which completed projects should become case studies?"

These are **queries over the event stream + knowledge graph + artifacts** — all built. The gap is the UX layer that phrases them.

---

## 8. End-to-end workflows (event-driven, already supported)

```
Lead → Estimate → Project → Work → Photos → Review → Portfolio → Referral
```
Every transition is a canonical event PING already persists + projects. The application must *drive* each transition through the event pipeline (not ad-hoc CRUD). The Observation Layer connections (this session) already make providers emit events — the workflow is the next consumer.

---

## 9. Leave alone (foundational assets)

Per the CEO: **do not touch** Authorities, Replay, Event model, BI, Signals, Health Models, Recommendations, Forecasting, Knowledge infrastructure, Runtime governance. These are done and load-bearing. The application *consumes* them.

---

## 10. Next-90-days workstreams (application, not platform)

1. **Mission Control** — single operational console organized around work queues + health (projections over event stream), not dashboards/pages.
2. **Project-first model** — Project = central business object; attach photos, documents, estimates, schedules, reviews, artifacts, AI context.
3. **Universal semantic search** — expose knowledge + artifact + event infra through one query experience.
4. **AI Workspace per project** — timeline, knowledge, recommendations, next actions, explainability.
5. **End-to-end workflows** — lead→estimate→project→work→photos→review→portfolio→referral, driven by the existing event pipeline.

---

## Architectural purity (closing)

- **Platform = center of gravity.** WAVE 4A/4B confirmed BI is single-source; runtime is reconciled; Observation Layer is connecting.
- **Application = consumer.** The HPP application should *never redefine* platform primitives (events, health, knowledge) — only project/compose them into business objects, queues, and workspaces.
- **No new infrastructure needed** for the next 90 days. The platform already provides every primitive. The work is *application layers that consume*.

**This is the pivot:** from building the operating system's engine (done) to building the cockpit that runs Happy Place every day.
