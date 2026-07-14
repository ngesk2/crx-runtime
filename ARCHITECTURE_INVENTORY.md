# Architecture Inventory

**Authoritative inventory of existing constitutional infrastructure and components.**

**Status:** Read-only reference document. Update only when new components are added.

**Last Updated:** 2026-07-12

**Overall Completeness:** ~80-85%

---

## Layer Status Summary

| Layer | Status | Completeness |
|-------|--------|--------------|
| Infrastructure | ✅ Complete | 100% |
| Domain Models | ✅ Complete | 95% |
| Canonical IR | ✅ Complete | 100% |
| Registry System | ✅ Complete | 95% |
| Deployment | ✅ Complete | 100% |
| Monitoring | ✅ Complete | 100% |
| Runtime | ⚠️ Partial | 20% |
| Execution Engine | ⚠️ Partial | 10% |
| Normalization Pipeline | ⚠️ Partial | 15% |

---

## 1. Infrastructure (100% Complete)

### Oracle Cloud Always Free
**Location:** `infra/oracle/`

**Components:**
- `bootstrap.sh` - Server bootstrap (Docker, swap, firewall, fail2ban, Node Exporter, cron, systemd)
- `deploy-oracle.sh` - Deployment script

**Capabilities:**
- Ubuntu ARM instance provisioning
- Docker and Docker Compose installation
- Swap configuration (4GB)
- Firewall (UFW) configuration
- Fail2ban security
- SSH key authentication
- Automatic security updates
- Systemd service management
- Cron job scheduling
- Log rotation

### Fly.io Edge
**Location:** `infra/fly/`

**Components:**
- `fly.toml` - Edge service configuration
- `fly-api-gateway.toml` - API Gateway
- `fly-omniroute.toml` - Omniroute
- `fly-webhook.toml` - Webhook Receiver
- `fly-worker.toml` - Lightweight Worker
- `deploy-fly.sh` - Deployment script

**Capabilities:**
- API Gateway deployment
- Omniroute deployment
- Webhook Receiver deployment
- Worker Runtime deployment
- Auto-scaling configuration
- Health checks
- Secret management

### Docker Compose Stack
**Location:** `infra/docker/`

**Components:**
- `docker-compose.yml` - Production stack
- `config/prometheus.yml` - Prometheus configuration
- `config/grafana/datasources/` - Grafana datasources
- `config/grafana/dashboards/` - Grafana dashboards
- `config/loki-config.yaml` - Loki configuration
- `config/otel-collector-config.yaml` - OTEL Collector configuration
- `config/litellm.yaml` - LiteLLM configuration

**Services:**
- PostgreSQL (database)
- Qdrant (vector database)
- Temporal (workflow engine)
- Temporal UI (workflow dashboard)
- LiteLLM (LLM gateway)
- Ollama (local inference)
- OpenTelemetry Collector (telemetry)
- Prometheus (metrics)
- Grafana (dashboards)
- Loki (logs)
- Traefik (reverse proxy)
- ping-api (main API)
- ping-workers (temporal workers)
- mission-control (scheduler)

**Capabilities:**
- Named volumes for persistence
- Health checks for all services
- Resource limits
- Logging configuration
- Internal and external networks
- SSL/TLS via Let's Encrypt

### Networking & Security
**Components:**
- Traefik reverse proxy
- SSL/TLS termination
- Internal Docker network
- External API network
- UFW firewall (SSH, HTTP, HTTPS only)
- Fail2ban intrusion prevention
- SSH key authentication (password disabled)
- Automatic security updates

### Monitoring & Observability
**Components:**
- Prometheus (metrics collection)
- Grafana (visualization and dashboards)
- Loki (log aggregation)
- OpenTelemetry Collector (telemetry pipeline)
- Node Exporter (system metrics)

**Capabilities:**
- Metrics scraping from all services
- Log centralization
- Distributed tracing
- Dashboard provisioning
- Alert configuration

### Scheduling
**Components:**
- Cron jobs (`/etc/cron.d/ping`)
- Systemd services (`ping-runtime.service`)
- Log rotation (`/etc/logrotate.d/ping`)

**Scheduled Tasks:**
- Hourly maintenance
- Daily executive brief
- Weekly engineering newsletter
- Connector health checks
- Repository inventory refresh

### Secrets Management
**Location:** `infra/SECRETS.md`, `infra/.env.example`

**Capabilities:**
- Environment variable templates
- Secret rotation procedures
- Vault integration (optional)
- Oracle Cloud Vault (optional)

---

## 2. Constitutional Domain Models (95% Complete)

### Mission & Goal
**Location:** `constitution/models/mission.py`

**Components:**
- `Mission` - Immutable mission primitive (aggregate root)
- `Goal` - Immutable goal primitive

**Capabilities:**
- SHA256-based IDs from canonical serialization
- Aggregate versioning
- Constraint-based authorization
- Goal success criteria
- Priority and deadline tracking
- Immutable (frozen) data structures

**Status:** ✅ Complete

### CanonicalArtifact IR
**Location:** `constitution/models/evidence.py`

**Components:**
- `CanonicalArtifact` - Universal data contract
- `Evidence` - Specialization for IO operations
- `FilesystemEvidence` - Filesystem capability evidence
- `NetworkEvidence` - Network capability evidence
- `StorageEvidence` - Storage capability evidence
- `SearchEvidence` - Search capability evidence
- `ConnectorEvidence` - Connector capability evidence

**Provenance Hierarchy:**
- `CapabilityProvenance` - Capability-level
- `ImplementationProvenance` - Implementation-level
- `AcquisitionProvenance` - Acquisition-level
- `PlatformProvenance` - Platform-level

**Capabilities:**
- Comprehensive provenance tracking
- Constitutional hashing
- Build witness verification
- Acquisition witness verification
- Immutable (frozen) data structures
- Type-specific evidence specializations

**Status:** ✅ Complete

### Value Objects
**Location:** `constitution/value_objects.py`

**Status:** ✅ Complete

### Intents
**Location:** `constitution/intents.py`

**Status:** ✅ Complete

### Transcript
**Location:** `constitution/transcript.py`

**Status:** ✅ Complete

---

## 3. Canonical IR (100% Complete)

### Evidence Pipeline
**Status:** CanonicalArtifact IR exists, but Normalizer → Authority pipeline missing

**Existing:**
- CanonicalArtifact IR (comprehensive provenance)
- Evidence specializations
- Constitutional hashing
- Build witness integration

**Missing:**
- Normalizer layer (source-specific normalization)
- Authority pipeline (authorization through constitutional authorities)
- Event store integration

**Status:** ⚠️ IR Complete, Pipeline Missing

---

## 4. Registry System (95% Complete)

### Existing Registries
**Location:** `constitution/registries.py`

**Components:**
- `TypeRegistry` - Type definitions with compatibility
- `WorkflowRegistry` - Workflow definitions
- `PromptRegistry` - Prompt templates
- `ToolRegistry` - Tool definitions
- `AgentRegistry` - Agent definitions

**Capabilities:**
- Registration with versioning
- Compatibility checking (backward, forward, breaking, deprecated)
- Canonical hashing for integrity
- CRUD operations
- List operations
- Integrity verification

**Status:** ✅ Complete

### Schema Registry
**Location:** `constitution/schema_registry.py`

**Components:**
- `SchemaRegistry` - Schema definitions with validation

**Capabilities:**
- JSON Schema validation
- Canonicalization
- Version management
- Compatibility checking
- Hash-based integrity

**Status:** ✅ Complete

### Restored Registries
**Location:** `constitution/registry/`

**Components:**
- `CapabilityRegistry` - System capabilities
- `ObjectRegistry` - Constitutional objects
- `AuthorityRegistry` - Constitutional authorities

#### CapabilityRegistry
**Capabilities:**
- ✅ Registration
- ✅ Discovery
- ✅ Metadata
- ✅ Execution
- ✅ Health monitoring
- ✅ Dependency metadata
- ❌ Dependency ordering (runtime concern)
- ❌ Lifecycle persistence (runtime concern)

**Status:** ✅ Core Complete, Runtime Features Missing

#### ObjectRegistry
**Capabilities:**
- ✅ Schema registration
- ✅ Validation
- ✅ Serialization
- ✅ Relationships
- ✅ Category organization

**Status:** ✅ Complete

#### AuthorityRegistry
**Capabilities:**
- ✅ Authority discovery
- ✅ Authorization interface
- ✅ Constraint interface
- ✅ Execution
- ✅ Category organization

**Status:** ✅ Complete

### RegistryManager
**Location:** `constitution/registries.py`

**Components:**
- Unified interface for all registries
- Discovery across all registries
- Integrity verification

**Status:** ✅ Complete

---

## 5. Deployment (100% Complete)

### Oracle Cloud Deployment
**Location:** `infra/oracle/`

**Status:** ✅ Complete

### Fly.io Deployment
**Location:** `infra/fly/`

**Status:** ✅ Complete

### Bootstrap Scripts
**Location:** `infra/bootstrap/`

**Status:** ✅ Complete

### Deployment Documentation
**Location:** `infra/README.md`, `infra/INFRASTRUCTURE_CHECKLIST.md`

**Status:** ✅ Complete

---

## 6. Monitoring (100% Complete)

### Metrics
**Components:**
- Prometheus scraping
- Grafana dashboards
- Node Exporter
- Service metrics

**Status:** ✅ Complete

### Logging
**Components:**
- Loki log aggregation
- Centralized logging
- Log rotation
- Grafana log visualization

**Status:** ✅ Complete

### Tracing
**Components:**
- OpenTelemetry Collector
- Distributed tracing
- Telemetry pipeline

**Status:** ✅ Complete

### Health Checks
**Components:**
- Service health checks
- Runtime health checks
- Capability health checks

**Status:** ✅ Complete

---

## 7. Runtime (20% Complete)

### Existing
- None (runtime layer not implemented)

### Missing
- Hermes Runtime (persistent service)
- Mission Queue
- Worker Pool
- Timer
- Watchdog
- Health Loop

**Status:** ⚠️ Not Implemented

---

## 8. Execution Engine (10% Complete)

### Existing
- Mission model (immutable primitive)
- Goal model (immutable primitive)

### Missing
- MissionExecutor
- TaskGraph
- Scheduler
- LeaseManager
- RetryEngine
- StateStore
- Task DAG execution
- State transitions

**Status:** ⚠️ Models Exist, Engine Missing

---

## 9. Normalization Pipeline (15% Complete)

### Existing
- CanonicalArtifact IR
- Evidence specializations
- Provenance tracking

### Missing
- Normalizer (source-specific normalization)
- Canonicalizer
- AuthorityPipeline
- ValidationPipeline
- Event store integration

**Status:** ⚠️ IR Exists, Pipeline Missing

---

## 10. Capabilities

### Existing Capabilities
**Location:** `capabilities/`

**Components:**
- `agent.py` - Agent capabilities
- `connector.py` - Connector capabilities
- `filesystem.py` - Filesystem capabilities
- `media.py` - Media capabilities
- `network.py` - Network capabilities
- `search.py` - Search capabilities
- `storage.py` - Storage capabilities
- `tool.py` - Tool capabilities
- `workflow.py` - Workflow capabilities

**Status:** ✅ Capability Definitions Exist

### Missing
- Capability registration with CapabilityRegistry
- Capability initialization
- Capability health monitoring

**Status:** ⚠️ Definitions Exist, Registration Missing

---

## 11. Authorities

### Existing Authorities
**Location:** `authority/`

**Components:**
- `aggregate_authority.py` - Aggregate authority
- `migration_authority.py` - Migration authority
- `projection_authority.py` - Projection authority
- `registry_authority.py` - Registry authority
- `snapshot_authority.py` - Snapshot authority

**Status:** ✅ Authority Implementations Exist

### Missing
- Authority registration with AuthorityRegistry
- Authority constraint checking
- Authority pipeline integration

**Status:** ⚠️ Implementations Exist, Registration Missing

---

## 12. Kernel

### Existing
**Location:** `kernel/`

- Projection system
- Replay verifier
- Execution layer

**Status:** ✅ Partial

---

## 13. Storage

### Existing
**Location:** `storage/`

- PostgreSQL models
- Database migrations
- Session management

**Status:** ✅ Complete

---

## Summary

### What's Complete (Frozen)
- Infrastructure (Oracle Cloud, Fly.io, Docker Compose)
- Domain Models (Mission, Goal, CanonicalArtifact, Evidence)
- Canonical IR (comprehensive provenance)
- Registry System (Type, Workflow, Prompt, Tool, Agent, Schema, Capability, Object, Authority)
- Deployment scripts and documentation
- Monitoring and observability
- Networking and security
- Scheduling infrastructure

### What's Missing (Implementation Backlog)
- **Execution Layer:** MissionExecutor, TaskGraph, Scheduler, LeaseManager, RetryEngine, StateStore
- **Normalization Layer:** Normalizer, Canonicalizer, AuthorityPipeline, ValidationPipeline
- **Runtime Layer:** Hermes Runtime, Mission Queue, Worker Pool, Timer, Watchdog, Health Loop

### Overall Assessment

**Architectural Completeness:** ~80-85%

The foundational models, infrastructure, and registries are complete. The remaining work is concentrated in the runtime and orchestration layers rather than the foundational components.

---

## Maintenance Notes

**This document is read-only.** Update only when new components are added to the system.

For implementation planning, reference `IMPLEMENTATION_BACKLOG.md` which contains only the missing components.

**Do not modify existing components listed as complete without explicit architectural review.**
