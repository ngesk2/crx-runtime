# Phase 14: Updated Dependency Graph

## Deliverable F: Dependency Graph

### Constitutional Layer

**Constitutional Code (No External Dependencies)**

```
constitution/
├── hashing.py (CanonicalHasher - constitutional law)
├── hashing/merkle.py (MerkleTree - constitutional law)
├── models/
│   ├── artifact.py (Artifact - constitutional law)
│   ├── command.py	Command - constitutional law)
│   ├── event.py (Event - constitutional law)
│   ├── evidence.py (Evidence - constitutional law)
│   ├── mission.py (Mission - constitutional law)
│   ├── projection.py (Projection - constitutional law)
│   └── request.py (Request - constitutional law)
├── registries.py (Registries - constitutional law)
└── schema_registry.py (SchemaRegistry - constitutional law)
```

**Dependencies:**
- Python stdlib (hashlib, json, unicodedata)
- pydantic (for data validation only, not constitutional logic)

**Boundary:** Constitutional code uses only Python stdlib and pydantic for validation. No infrastructure dependencies.

---

### Kernel Layer

**Constitutional Code (Minimal Infrastructure Dependencies)**

```
kernel/
├── aggregate.py (Aggregate - constitutional law)
├── build_witness.py (BuildWitness - constitutional law)
├── command_bus.py (CommandBus - constitutional law)
├── event_dag.py (EventDAG - constitutional law)
├── projection.py (Projection - constitutional law)
├── replay.py (Replay - constitutional law)
├── scheduler.py (Scheduler - constitutional law)
└── snapshot.py (Snapshot - constitutional law)
```

**Dependencies:**
- Python stdlib
- constitution/ (constitutional layer)
- pydantic (for data validation only)

**Boundary:** Kernel code uses constitutional layer and pydantic. No infrastructure dependencies.

---

### Storage Layer

**Infrastructure Layer (OSS Dependencies)**

```
storage/
├── event_store.py (EventStore - constitutional semantics, infrastructure implementation)
├── artifact_store.py (ArtifactStore - constitutional semantics, infrastructure implementation)
├── artifact_adapter.py (StorageAdapter - infrastructure only)
└── postgres/
    ├── database.py (Database - infrastructure only)
    └── models.py (SQLAlchemy models - infrastructure only)
```

**Dependencies:**
- Python stdlib
- constitution/ (constitutional layer)
- sqlalchemy (OSS - infrastructure)
- asyncpg (OSS - infrastructure)
- alembic (OSS - infrastructure)
- aiofiles (OSS - infrastructure - Phase 12)
- boto3 (OSS - infrastructure - Phase 12)
- botocore (OSS - infrastructure - Phase 12)
- config/settings.py (configuration - Phase 14)

**Boundary:** Storage layer uses constitutional layer and OSS infrastructure. No constitutional code in infrastructure.

---

### Transport Layer

**Infrastructure Layer (OSS Dependencies)**

```
transport/
├── event_bus.py (EventBus - infrastructure only)
└── nats/
    ├── __init__.py (empty - replaced)
    └── transport.py (NATSTransportAdapter - infrastructure only - Phase 13, Phase 14)
```

**Dependencies:**
- Python stdlib
- nats-py (OSS - infrastructure - Phase 13)
- config/settings.py (configuration - Phase 14)

**Boundary:** Transport layer uses OSS infrastructure only. No constitutional code.

---

### API Layer

**Infrastructure Layer (OSS Dependencies)**

```
api/
├── __init__.py
└── main.py (FastAPI - infrastructure only - Phase 14)
```

**Dependencies:**
- Python stdlib
- constitution/ (constitutional layer)
- storage/ (storage layer)
- transport/ (transport layer)
- fastapi (OSS - infrastructure)
- uvicorn (OSS - infrastructure)
- config/settings.py (configuration - Phase 14)
- config/logging.py (logging - Phase 14)
- runtime/observability.py (metrics - Phase 14)

**Boundary:** API layer uses constitutional, storage, transport layers and OSS infrastructure. No constitutional code in API.

---

### Runtime Layer

**Infrastructure Layer (OSS Dependencies)**

```
runtime/
├── loop.py (Runtime loop - infrastructure only)
└── observability.py (Observability - infrastructure only)
```

**Dependencies:**
- Python stdlib
- prometheus-client (OSS - infrastructure)

**Boundary:** Runtime layer uses OSS infrastructure only. No constitutional code.

---

### Configuration Layer

**Infrastructure Layer (OSS Dependencies)**

```
config/
├── __init__.py
├── settings.py (Settings - infrastructure only - Phase 14)
└── logging.py (Logging - infrastructure only - Phase 14)
```

**Dependencies:**
- Python stdlib
- pydantic-settings (OSS - infrastructure - Phase 14)
- structlog (OSS - infrastructure - Phase 14)

**Boundary:** Configuration layer uses OSS infrastructure only. No constitutional code.

---

### Capabilities Layer

**Constitutional Code (Minimal Infrastructure Dependencies)**

```
capabilities/
├── __init__.py
├── agent.py (Agent capability - constitutional law)
├── connector.py (Connector capability - constitutional law)
├── filesystem.py (Filesystem capability - constitutional law)
├── media.py (Media capability - constitutional law)
├── network.py (Network capability - constitutional law)
├── search.py (Search capability - constitutional law)
├── storage.py (Storage capability - constitutional law)
├── tool.py (Tool capability - constitutional law)
└── workflow.py (Workflow capability - constitutional law)
```

**Dependencies:**
- Python stdlib
- constitution/ (constitutional layer)
- pydantic (for data validation only)

**Boundary:** Capabilities layer uses constitutional layer and pydantic. No infrastructure dependencies.

---

### Authority Layer

**Constitutional Code (Minimal Infrastructure Dependencies)**

```
authority/
├── __init__.py
├── aggregate_authority.py (AggregateAuthority - constitutional law)
├── migration_authority.py (MigrationAuthority - constitutional law)
├── projection_authority.py (ProjectionAuthority - constitutional law)
├── registry_authority.py (RegistryAuthority - constitutional law)
└── snapshot_authority.py (SnapshotAuthority - constitutional law)
```

**Dependencies:**
- Python stdlib
- constitution/ (constitutional layer)
- storage/ (storage layer)
- pydantic (for data validation only)

**Boundary:** Authority layer uses constitutional layer, storage layer, and pydantic. No infrastructure dependencies.

---

### OSS Dependencies Summary

**Constitutional Layer:**
- pydantic (data validation only)

**Kernel Layer:**
- pydantic (data validation only)

**Storage Layer:**
- sqlalchemy (OSS - infrastructure)
- asyncpg (OSS - infrastructure)
- alembic (OSS - infrastructure)
- aiofiles (OSS - infrastructure - Phase 12)
- boto3 (OSS - infrastructure - Phase 12)
- botocore (OSS - infrastructure - Phase 12)
- pydantic-settings (OSS - infrastructure - Phase 14)

**Transport Layer:**
- nats-py (OSS - infrastructure - Phase 13)
- pydantic-settings (OSS - infrastructure - Phase 14)

**API Layer:**
- fastapi (OSS - infrastructure)
- uvicorn (OSS - infrastructure)
- pydantic-settings (OSS - infrastructure - Phase 14)
- structlog (OSS - infrastructure - Phase 14)
- prometheus-client (OSS - infrastructure)

**Runtime Layer:**
- prometheus-client (OSS - infrastructure)

**Configuration Layer:**
- pydantic-settings (OSS - infrastructure - Phase 14)
- structlog (OSS - infrastructure - Phase 14)

**Capabilities Layer:**
- pydantic (data validation only)

**Authority Layer:**
- pydantic (data validation only)

---

### Dependency Graph Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                    Constitutional Layer                       │
│  (hashing, models, registries, schema_registry)             │
│  Dependencies: Python stdlib, pydantic                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ (constitutional law)
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌───────────────────┐  ┌───────────────────┐
│    Kernel Layer   │  │ Capabilities Layer│
│ (aggregate, replay,│  │ (agent, tool,     │
│  scheduler, etc.)  │  │  workflow, etc.)  │
│ Dependencies:      │  │ Dependencies:      │
│ Python stdlib,    │  │ Python stdlib,    │
│ pydantic          │  │ pydantic          │
└─────────┬─────────┘  └───────────────────┘
          │
          │ (constitutional law)
          │
          ▼
┌───────────────────┐
│ Authority Layer  │
│ (aggregate_auth, │
│  projection_auth,│
│  etc.)           │
│ Dependencies:    │
│ Python stdlib,   │
│ pydantic,        │
│ storage layer    │
└─────────┬─────────┘
          │
          │ (infrastructure)
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Storage   │  │  Transport  │  │     API     │          │
│  │  (SQLAlchemy,│  │  (nats-py)  │  │  (fastapi)  │          │
│  │   asyncpg,  │  │             │  │  (uvicorn)  │          │
│  │   aiofiles, │  │             │  │  (structlog)│          │
│  │   boto3)    │  │             │  │  (prometheus)│          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│  ┌─────────────┐  ┌─────────────┐                            │
│  │  Runtime    │  │ Configuration│                            │
│  │(prometheus) │  │(pydantic-   │                            │
│  │             │  │ settings)   │                            │
│  └─────────────┘  └─────────────┘                            │
│  Dependencies: OSS (sqlalchemy, asyncpg, nats-py, fastapi,   │
│                uvicorn, structlog, prometheus-client, etc.)   │
└─────────────────────────────────────────────────────────────┘
```

---

### OSS Boundaries

**Constitutional Boundary:**
- Constitutional code uses only Python stdlib and pydantic
- No infrastructure dependencies in constitutional layer
- Constitutional code is self-contained and deterministic

**Infrastructure Boundary:**
- Infrastructure code uses mature OSS libraries
- Infrastructure code is isolated from constitutional code
- Infrastructure code can be replaced without affecting constitutional behavior

**OSS Boundary:**
- All infrastructure uses mature, audited OSS libraries
- OSS libraries are well-maintained and production-ready
- OSS libraries are deterministic and replay-safe

---

### Summary

**Constitutional Code:**
- Layers: Constitutional, Kernel, Capabilities, Authority
- Dependencies: Python stdlib, pydantic
- Infrastructure dependencies: None

**Infrastructure Code:**
- Layers: Storage, Transport, API, Runtime, Configuration
- Dependencies: Mature OSS libraries
- Constitutional dependencies: Constitutional layer only

**OSS Libraries:**
- Total: 14 OSS libraries
- Constitutional: 0 (pydantic is for validation only)
- Infrastructure: 14 (all infrastructure)
- Mature: 14 (all mature and production-ready)

**Boundaries:**
- Constitutional code is isolated from infrastructure
- Infrastructure code is isolated from constitutional code
- OSS libraries are isolated from constitutional code
