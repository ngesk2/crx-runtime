# RUNTIME REGISTRATION TRACE

## Scope
This report reconstructs the runtime registration sequence from the observable startup path in the workspace. It stops at the first point where the registration chain cannot be proven from available evidence.

## Phase A — Entrypoint Discovery

| EntryPoint | Process | Command | Boot File | Next Step | Status |
|---|---|---|---|---|---|
| Gateway container startup | Container process | `node server.js` | [gateway/Dockerfile](gateway/Dockerfile) | Load bootstrap entrypoint | PROVEN |
| Node bootstrap | Node process | `require('./bootstrap/main')` | [gateway/server.js](gateway/server.js) | Initialize runtime objects and gateway | PROVEN |
| Gateway bootstrap main | Node process | `main()` | [gateway/bootstrap/main.js](gateway/bootstrap/main.js) | Create registries, repository, pipeline, gateway runtime | PROVEN |

### Entrypoint evidence
- The gateway container entrypoint is defined as `node server.js` in [gateway/Dockerfile](gateway/Dockerfile).
- The server entrypoint requires [gateway/bootstrap/main.js](gateway/bootstrap/main.js) in [gateway/server.js](gateway/server.js).
- The bootstrap main function creates the runtime objects that form the first proven registration phase in [gateway/bootstrap/main.js](gateway/bootstrap/main.js).

## Phase B — Boot Chain

| Source | Destination | Function | File | Line | Status |
|---|---|---|---|---|---|
| Container start | Node entrypoint | Starts process with `node server.js` | [gateway/Dockerfile](gateway/Dockerfile) | Not available | PROVEN |
| Node entrypoint | Bootstrap main | Requires bootstrap module | [gateway/server.js](gateway/server.js) | Not available | PROVEN |
| Bootstrap main | Runtime object construction | Instantiates `ReducerRegistry`, `ProjectionRegistry`, `Dispatcher`, `ReplayDecisionAuthority`, `EventRepository`, `ConstitutionalExecutionPipeline` | [gateway/bootstrap/main.js](gateway/bootstrap/main.js) | Not available | PROVEN |
| Bootstrap main | Event repository init | Calls `eventRepository.initialize()` | [gateway/bootstrap/main.js](gateway/bootstrap/main.js) | Not available | PROVEN |
| Bootstrap main | Gateway runtime start | Creates `GatewayRuntime` and calls `gateway.start()` | [gateway/bootstrap/main.js](gateway/bootstrap/main.js) | Not available | PROVEN |
| Gateway runtime | Service initialization | Calls `_initializeServices()` | [gateway/bootstrap/gateway_runtime.js](gateway/bootstrap/gateway_runtime.js) | Not available | PROVEN |
| Gateway runtime | Route mounting | Calls `_mountRoutes(services)` | [gateway/bootstrap/gateway_runtime.js](gateway/bootstrap/gateway_runtime.js) | Not available | PROVEN |
| Gateway runtime | Network listen | Calls `this._app.listen(...)` | [gateway/bootstrap/gateway_runtime.js](gateway/bootstrap/gateway_runtime.js) | Not available | PROVEN |

### Boot chain summary
The startup chain is proven through the following path:

Docker container entrypoint → Node server entrypoint → bootstrap main → runtime object creation → event repository initialization → gateway service initialization → route registration → listen for requests.

## Phase C — Registration Events

| Type | Object | Owner | Registry | File | Function | When executed |
|---|---|---|---|---|---|---|
| Construction | `ReducerRegistry` | Bootstrap main | In-memory registry object | [gateway/bootstrap/main.js](gateway/bootstrap/main.js) | `main()` | Before gateway startup |
| Construction | `ProjectionRegistry` | Bootstrap main | In-memory registry object | [gateway/bootstrap/main.js](gateway/bootstrap/main.js) | `main()` | Before gateway startup |
| Construction | `Dispatcher` | Bootstrap main | Execution dispatcher | [gateway/bootstrap/main.js](gateway/bootstrap/main.js) | `main()` | Before gateway startup |
| Construction | `ReplayDecisionAuthority` | Bootstrap main | Replay decision authority | [gateway/bootstrap/main.js](gateway/bootstrap/main.js) | `main()` | Before gateway startup |
| Construction | `EventRepository` | Bootstrap main | Repository object | [gateway/bootstrap/main.js](gateway/bootstrap/main.js) | `main()` | Before gateway startup |
| Initialization | `EventReadAuthority` | Gateway runtime | Service initialization | [gateway/bootstrap/gateway_runtime.js](gateway/bootstrap/gateway_runtime.js) | `_initializeServices()` | During gateway startup |
| Initialization | `RepositoryStore` | Gateway runtime | Service initialization | [gateway/bootstrap/gateway_runtime.js](gateway/bootstrap/gateway_runtime.js) | `_initializeServices()` | During gateway startup |
| Route registration | Express routes | Gateway runtime | Route registry | [gateway/bootstrap/gateway_runtime.js](gateway/bootstrap/gateway_runtime.js) | `_mountRoutes()` | During gateway startup |
| Service registration | `/health`, `/events`, `/context`, `/api/v1/repository`, `/system` | Gateway runtime | Express route registry | [gateway/bootstrap/gateway_runtime.js](gateway/bootstrap/gateway_runtime.js) | `_mountRoutes()` | During gateway startup |

## Phase D — Registry Inventory

| Registry | Owner | Creation point | Population point | Readers | Writers | Lifetime |
|---|---|---|---|---|---|---|
| Reducer registry | Bootstrap main | [gateway/bootstrap/main.js](gateway/bootstrap/main.js) | [gateway/runtime/reducer_registry.js](gateway/runtime/reducer_registry.js) | `ConstitutionalExecutionPipeline`, `Dispatcher` | `ReducerRegistry.register()` | Process lifetime |
| Projection registry | Bootstrap main | [gateway/bootstrap/main.js](gateway/bootstrap/main.js) | Not proven from the startup path | Not proven | Not proven | Not proven |
| Route registry | Gateway runtime | [gateway/bootstrap/gateway_runtime.js](gateway/bootstrap/gateway_runtime.js) | `_mountRoutes()` | Express request handling | `this._app.use(...)` | Process lifetime |
| Event repository | EventRepository | [gateway/bootstrap/main.js](gateway/bootstrap/main.js) | `eventRepository.initialize()` | Pipeline, gateway routes | Repository initialization | Process lifetime |
| Execution infrastructure registry | ExecutionRuntime | [runtime/execution_runtime.js](runtime/execution_runtime.js) | `initialize()` | Execution dispatch | `registerAdapter()` | Process lifetime |

## Phase E — Registration Graph

The proven startup graph stops at the first unproven registration step.

```text
Entrypoint
↓
Node server entrypoint
↓
Bootstrap main
↓
Runtime object construction
↓
Event repository initialization
↓
Gateway service initialization
↓
Route registration
↓
Gateway ready to handle requests
```

### Edge status
- Entrypoint → Node server entrypoint: PROVEN
- Node server entrypoint → Bootstrap main: PROVEN
- Bootstrap main → Runtime object construction: PROVEN
- Runtime object construction → Event repository initialization: PROVEN
- Event repository initialization → Gateway service initialization: PROVEN
- Gateway service initialization → Route registration: PROVEN
- Route registration → Gateway ready to handle requests: PROVEN

The next step in the broader constitutional runtime model is the activation of an `ExecutionRuntime` instance and its adapter/authority registration path, but that transition is not proven by the current startup path.

## Phase F — First Unknown

### Unknown object
ExecutionRuntime authority/adapter registration chain

### Why it cannot be proven
The startup path proves that the gateway process starts, initializes an event repository, initializes gateway services, and mounts routes. However, the current entrypoint does not show that an `ExecutionRuntime` instance is created and populated with authorities or adapters during startup. The relevant runtime class exists in [runtime/execution_runtime.js](runtime/execution_runtime.js), but the startup path in [gateway/bootstrap/main.js](gateway/bootstrap/main.js) does not invoke it.

### What evidence is missing
To prove the next registration step, the following evidence is required:
- A startup log showing `ExecutionRuntime.initialize()` or equivalent execution-runtime registration
- A runtime object dump showing the populated infrastructure registry
- A startup path that explicitly instantiates and initializes the constitutional execution runtime
- A registry snapshot showing authorities, capabilities, or adapters after startup

### Files to inspect next
- [runtime/execution_runtime.js](runtime/execution_runtime.js)
- [runtime/di_container.js](runtime/di_container.js)
- [gateway/bootstrap/main.js](gateway/bootstrap/main.js)
- [gateway/bootstrap/gateway_runtime.js](gateway/bootstrap/gateway_runtime.js)

## Answers to the success criteria

- First registry created: `ReducerRegistry`, created in [gateway/bootstrap/main.js](gateway/bootstrap/main.js).
- First authority registered: The first authority-like object instantiated in the proven startup path is `EventReadAuthority` in [gateway/bootstrap/gateway_runtime.js](gateway/bootstrap/gateway_runtime.js); however, no authority-registry population is proven from the startup path.
- First capability registered: Not proven from the current startup path.
- When execution becomes possible: Execution becomes possible once the gateway process completes service initialization, mounts routes, and starts listening on its port in [gateway/bootstrap/gateway_runtime.js](gateway/bootstrap/gateway_runtime.js).
- First point where runtime reconstruction loses proof: The transition from gateway startup to the constitutional execution-runtime registration chain is the first unproven step.
