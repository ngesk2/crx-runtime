# CRX - Constitutional Runtime for Cognition

A replayable constitutional cognition substrate.

## What This Is

CRX is:
- Constitutional infrastructure
- Deterministic runtime substrate
- Event lineage system
- Replay engine
- Policy engine
- Audit system
- Observability system

CRX is NOT:
- An AI app
- An automation playground
- A multi-agent experiment
- A framework showcase

## Constitutional Foundation

The repository is governed by the [CRX-RUNTIME CONSTITUTIONAL AGENT DIRECTIVE](AGENT.md).

**Primary Law**: REUSE BEFORE CREATE

Before creating ANY file, search the repository for overlapping functionality. If functionality overlaps, MERGE IT. If systems duplicate, CANONICALIZE THEM. If architecture forks, SIMPLIFY IT.

## Architecture

```
GitHub Kernel
 ↓
Event Runtime
 ↓
Replay Engine
 ↓
Policy Engine
 ↓
Tool Routing
 ↓
Agent Runtime
 ↓
Observability Layer
 ↓
Domain Layers
```

## Repository Structure

```
/
├── AGENT.md                 # Constitutional directive (CORE LAW)
├── infra/                   # Canonical infrastructure stack
│   ├── docker-compose.yml   # All services boot from here
│   ├── .env                 # Centralized configuration
│   ├── postgres/            # PostgreSQL data
│   ├── redis/               # Redis data
│   ├── ollama/              # Ollama data
│   ├── observability/       # Prometheus, Grafana, Loki, Tempo configs
│   ├── scripts/             # Initialization scripts
│   └── volumes/             # Persistent volumes
├── kernel/                  # Constitutional truth substrate
│   ├── doctrine/            # Constitutional principles
│   ├── invariants/          # System invariants
│   ├── contracts/           # Constitutional contracts
│   └── decisions/           # Canonical decision records
├── runtime/                 # Orchestration and execution
│   ├── orchestration/       # Event-driven orchestration
│   ├── execution/           # Agent execution engine
│   ├── scheduling/          # Cron and task scheduling
│   ├── tool-routing/        # MCP/Composio tool routing
│   └── queues/              # Event queues and workers
├── events/                  # Canonical event system
│   └── canonical-event-envelope.json  # Single canonical event schema
├── schemas/                 # Canonical schema definitions
├── policies/                # Constitutional policies
├── prompts/                 # Agent prompts
├── agents/                  # Constrained execution workers
├── replay/                  # Deterministic reconstruction
└── tests/                   # Constitutional validation tests
```

## Quick Start

### Prerequisites
- Docker Desktop
- Git

### Bootstrap Infrastructure

```bash
# From repository root
cd infra
docker compose up -d
```

This boots:
- PostgreSQL (constitutional kernel database)
- Redis (event queues)
- Ollama (local inference)
- Prometheus (metrics)
- Grafana (observability)
- Loki (logs)
- Tempo (distributed tracing)

### Access Services

- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Ollama**: http://localhost:11434

## Foundational Primitives

The system is built on five canonical primitives:

- **Provenance**: What happened?
- **Claim**: What is asserted?
- **Decision**: What was accepted?
- **Fact**: What is currently true?
- **Rule**: What constrains truth?

Everything else is derived.

## Event Flow

All state transitions follow this path:

```
Event
 → Policy
 → Assignment
 → Execution
 → Validation
 → Replay Check
 → Audit Event
```

## Constitutional Invariants

The system maintains these invariants:
- All state transitions are event-sourced
- All events have complete lineage
- All policy decisions are recorded
- All mutations are replayable
- All audits are append-only

## Optimization Targets

Always optimize for:
- Replayability
- Auditability
- Lineage integrity
- Deterministic reconstruction
- Policy enforcement
- Observability
- Infrastructure coherence
- Provider portability
- Operational simplicity
- Long-term maintainability

DO NOT optimize for:
- Feature count
- Abstraction quantity
- Framework novelty
- Autonomous behavior
- Speculative architecture
- Microservice proliferation

## License

Constitutional Infrastructure
