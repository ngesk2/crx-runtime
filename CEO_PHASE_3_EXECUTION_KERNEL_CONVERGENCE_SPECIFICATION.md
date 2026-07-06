# CEO PHASE 3 — EXECUTION KERNEL CONVERGENCE SPECIFICATION (READ-ONLY)

## Purpose

This document is the canonical architectural specification for the intended end-state of the execution kernel after convergence.

It separates:

- current repository reality,
- architectural intent,
- execution ownership,
- future kernel boundaries.

No implementation or code changes are proposed.

---

## 1. Architectural Principle

The repository shall converge toward a single execution kernel.

The kernel becomes the exclusive owner of execution.

Everything else becomes one of the following:

- ingress,
- infrastructure,
- policy,
- persistence,
- projection,
- or presentation.

No other layer may orchestrate execution.

---

## 2. Canonical Layer Model

```text
Applications
  ↓
Gateway
  ↓
Execution Kernel
  ↓
Infrastructure
  ↓
Domain
```

### Intended ownership

- Applications consume.
- Gateway ingresses.
- Kernel executes.
- Infrastructure stores and serves.
- Domain defines rules.

---

## 3. Layer Responsibilities

### Applications

Applications consume APIs.

They must not:

- orchestrate execution,
- manipulate execution state,
- or own business logic.

### Gateway

The gateway owns ingress.

Its responsibilities are:

- routing,
- authentication,
- validation,
- serialization,
- protocol translation.

The gateway never executes missions.

### Execution Kernel

The execution kernel owns everything related to execution.

Only the kernel may:

- create missions,
- schedule work,
- dispatch work,
- assign workers,
- record execution,
- manage artifacts,
- coordinate consensus,
- and build replay graphs.

Execution ownership is exclusive.

### Infrastructure

Infrastructure stores state.

It never decides execution.

It never performs orchestration.

It never evaluates policy.

It only provides durable capabilities.

### Domain

The domain defines rules.

It never orchestrates.

Authorities answer questions such as:

```text
Is this permitted? Yes / No
```

Authorities never execute actions.

---

## 4. Runtime Ownership

The repository currently contains multiple runtime concepts.

The target convergence is a single kernel runtime.

### Target model

```text
Kernel
```

Everything else becomes a service.

Examples:

- Gateway Service
- Replay Service
- Projection Service
- Persistence Service

Only one runtime owns execution.

---

## 5. Mission Lifecycle

Every execution begins as a mission.

Canonical lifecycle:

```text
Mission
  ↓
Queued
  ↓
Planned
  ↓
Dispatched
  ↓
Executing
  ↓
Artifact Produced
  ↓
Consensus
  ↓
Completed
  ↓
Archived
```

No execution path may bypass mission ownership.

---

## 6. Planner

The planner owns:

- decomposition,
- dependency graphs,
- execution plans,
- capability requirements.

The planner never executes.

---

## 7. Scheduler

The scheduler owns:

- priority,
- retries,
- concurrency,
- backoff,
- worker availability,
- fairness.

The scheduler never performs work.

---

## 8. Dispatcher

The dispatcher owns exactly one mapping:

```text
Mission → Capability → Worker
```

Never:

```text
Mission → Worker
```

Capabilities remain stable contracts.

Workers remain replaceable implementations.

---

## 9. Worker Model

Workers become stateless execution engines.

Minimal contract:

```text
health()
capabilities()
execute()
cancel()
heartbeat()
```

Workers never:

- schedule,
- dispatch,
- evaluate policy,
- orchestrate,
- or coordinate consensus.

---

## 10. Authority Model

Authorities become policy engines.

Responsibilities:

- validation,
- constitutional compliance,
- verification,
- permission evaluation.

Authorities never:

- dispatch workers,
- call other authorities for execution,
- schedule missions,
- or modify runtime ownership.

Kernel asks.

Authorities answer.

---

## 11. Artifact Model

Artifacts become the durable operating system state.

Everything produces artifacts.

Examples:

- Mission
- Proposal
- Analysis
- Execution Record
- Witness
- Consensus
- Patch
- Replay
- Merge Decision
- Documentation
- Test Results

Artifacts are immutable.

Nothing disappears.

---

## 12. Consensus

Consensus consumes artifacts.

Never workers.

Execution becomes:

```text
Worker → Artifact → Consensus
```

Worker state is irrelevant once artifacts exist.

---

## 13. Replay

Replay reconstructs execution exclusively from durable state.

```text
Mission → Artifacts → Execution Graph → State
```

Replay never depends on live workers.

Replay never depends on runtime memory.

---

## 14. Queue Model

Generic event queues are replaced by responsibility-specific queues.

```text
Mission Queue
Artifact Queue
Projection Queue
```

Each queue owns exactly one concern.

---

## 15. Registries

Long-term kernel registries:

```text
Capability Registry
Worker Registry
Projection Registry
Plugin Registry
```

Everything else becomes implementation detail.

---

## 16. Reducers

Reducers are internal.

Public execution graph never exposes reducers.

Execution graph:

```text
Mission → Planner → Scheduler → Dispatcher → Worker → Artifact → Consensus → Projection → Persistence → Replay Index
```

Reducers remain invisible.

---

## 17. Public Kernel API

Target kernel surface:

```text
submitMission()
cancelMission()
resumeMission()
getMission()
replayMission()
registerWorker()
registerCapability()
registerProjection()
health()
```

Everything else remains internal.

---

## 18. Kernel Invariants

The following must always remain true:

1. One execution owner.
2. One canonical mission lifecycle.
3. Workers remain stateless.
4. Authorities remain declarative.
5. Capabilities remain contracts.
6. Artifacts remain immutable.
7. Replay remains deterministic.
8. Infrastructure remains replaceable.
9. Gateway remains thin.
10. Applications remain consumers.

---

## 19. Current Repository vs Target

| Area | Current Repository | Target |
|---|---|---|
| Runtime ownership | Fragmented | Single kernel |
| Mission ownership | Distributed | Kernel-owned |
| Scheduler | Partial | Exclusive scheduler |
| Dispatcher | Mixed | Mission → Capability → Worker |
| Workers | Semi-thin | Stateless executors |
| Authorities | Mixed policy/orchestration | Policy only |
| Replay | Structural | Deterministic artifact replay |
| Artifacts | Significant | Sole durable execution record |
| Gateway | Runtime participant | Thin ingress |
| Registries | Numerous | Minimal kernel registries |

---

## 20. Architectural North Star

The repository should converge toward a system where:

- the Gateway receives requests,
- the Kernel owns all execution,
- the Domain defines policy,
- Infrastructure provides durable services,
- Applications consume results.
