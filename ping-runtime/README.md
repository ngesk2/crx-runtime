# PING Runtime Core v1

**The reusable Business Operating System platform.**

Happy Place is a reference application. PING is the platform.

## Architecture

```
External Ecosystem
    ↓
Thin Adapter (Connector Registry)
    ↓
Canonical Event
    ↓
Observation Layer
    ↓
Knowledge Graph
    ↓
Health Models
    ↓
PING Runtime
    ↓
Orca (Orchestration)
    ↓
Application (HPP)
```

## Directory Structure

```
ping-runtime/
  ai/              — AI Runtime (LiteLLM + provider abstraction)
  workers/         — Worker Runtime v1 (extracted from 38 implementations)
  connectors/      — Connector Registry (standardized provider interface)
  orchestration/   — Mission Runtime (Orca integration)
  events/          — Unified Event Runtime (single canonical pipeline)
  knowledge/       — Knowledge Graph (ingestion + retrieval)
  auth/            — OAuth + Authentication
  integrations/    — Business integrations (PostHog, Email, SMS, Webhook)
```

## Design Principles

1. **Everything is an event projection** — Mission Control, Inbox, Queues, Knowledge are all views over the event stream
2. **Connectors are interchangeable** — Google, GitHub, Cloudflare, OCI, Stripe, Twilio all implement the same interface
3. **AI is configuration, not code** — LiteLLM routes to providers; adding a model is a config change
4. **Workers are orchestrated** — Desktop agents coordinate; worker fleets execute
5. **No business object talks directly to infrastructure** — everything flows through adapters and events

## What We Keep (Class A — Platform Primitives)

- Worker system → `ping-runtime/workers/`
- Artifact Runtime → `ping-runtime/connectors/`
- Knowledge → `ping-runtime/knowledge/`
- Compiler → `constitutional-compiler/` (untouched)
- Gateway → `gateway/` (untouched)
- Orca → `orchestration/execution/` (untouched)
- OAuth → `ping-runtime/auth/`
- Events → `ping-runtime/events/`
- Context Builder → `orchestration/execution/artifact_router.js` (untouched)
- Mission Runtime → `ping-runtime/orchestration/`

## What We Archive (Class B — Valuable References)

See `archive/` directories with README.md in each.

## What We Defer (Class C — Generated/Caches/Temp)

- `gateway/generated/` — generated at build time, regenerated from compiler
- `node_modules/` — npm install
- `dist/`, `coverage/`, `tmp/`, `cache/` — build artifacts
