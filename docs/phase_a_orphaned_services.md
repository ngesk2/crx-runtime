# Phase A: Orphaned Services Analysis

**Status:** In Progress
**Last Updated:** 2026-07-13
**Purpose:** Repository Understanding - Orphaned Service Identification

---

## Orphaned Service Definition

An orphaned service is:
1. A service with no consumers
2. A service with no producers
3. A service with no health checks
4. A service with no monitoring
5. A service with no documentation
6. A service with no configuration
7. A service with no tests

---

## Orphaned Services Analysis

### 1. Orphaned NATS Services
**Status:** Medium Risk
**Location:** `transport/nats/transport.py`

**Analysis:**
- NATS transport is used by API layer
- NATS subjects are published but no consumers are defined
- No NATS subscription code found in main entry points

**Orphaned Subjects:**
- `constitutional.events.{event_type}` - Published but no consumers
- `constitutional.commands` - Published but no consumers

**Impact:**
- Events are published but not consumed
- Commands are published but not consumed
- No event-driven architecture implementation

**Recommendation:** Implement NATS consumers or remove NATS dependency

---

### 2. Orphaned Authority Services
**Status:** High Risk
**Location:** `authority/`

**Analysis:**
- Authority services are defined but not integrated with runtime
- No consumers of authority decisions
- No health checks for authority services
- No monitoring of authority services

**Orphaned Services:**
- `AggregateAuthority` - Not used by runtime
- `MigrationAuthority` - Not used by runtime
- `ProjectionAuthority` - Not used by runtime
- `RegistryAuthority` - Not used by runtime
- `SnapshotAuthority` - Not used by runtime

**Impact:**
- Constitutional validation not enforced
- No authority-based decision making
- Constitutional laws not enforced

**Recommendation:** Integrate authority services with runtime

---

### 3. Orphaned Capability Services
**Status:** High Risk
**Location:** `capabilities/`

**Analysis:**
- Capability implementations are defined but not registered
- No consumers of capability services
- No health checks for capability services
- No monitoring of capability services

**Orphaned Services:**
- `agent.py` - Agent capabilities not registered
- `connector.py` - Connector capabilities not registered
- `filesystem.py` - Filesystem capabilities not registered
- `github/acquire_repository.py` - GitHub capabilities not registered
- `media.py` - Media capabilities not registered
- `network.py` - Network capabilities not registered
- `search.py` - Search capabilities not registered
- `storage.py` - Storage capabilities not registered
- `tool.py` - Tool capabilities not registered
- `workflow.py` - Workflow capabilities not registered

**Impact:**
- Capabilities cannot be executed
- No capability-based operations
- Runtime cannot use capabilities

**Recommendation:** Register capability implementations with CapabilityRegistry

---

### 4. Orphaned Planning Services
**Status:** High Risk
**Location:** `runtime/planning/`

**Analysis:**
- Planning services are defined but not integrated
- No consumers of planning services
- No health checks for planning services
- No monitoring of planning services

**Orphaned Services:**
- `compiler_stages.py` - Compiler stages not used
- `hierarchy.py` - Planning hierarchy not used
- `mission_compiler.py` - Mission compiler not used
- `objective_compiler.py` - Objective compiler not used
- `optimization_passes.py` - Optimization passes not used
- `strategy.py` - Planning strategy not used
- `transient_objectives.py` - Transient objectives not used

**Impact:**
- Planning pipeline not implemented
- No mission compilation
- No objective compilation
- No optimization

**Recommendation:** Integrate planning services with runtime

---

### 5. Orphaned Registry Services
**Status:** Medium Risk
**Location:** `runtime/registry/`

**Analysis:**
- Registry services are defined but not integrated
- No consumers of registry services
- No health checks for registry services
- No monitoring of registry services

**Orphaned Services:**
- `oracle_reviewer.py` - Oracle reviewer not used
- `oracle_sandbox.py` - Oracle sandbox not used
- `promotion_pipeline.py` - Promotion pipeline not used
- `work_claim_manager.py` - Work claim manager not used

**Impact:**
- Oracle workflow not implemented
- Promotion pipeline not implemented
- Work claiming not implemented

**Recommendation:** Integrate registry services with runtime

---

### 6. Orphaned Security Services
**Status:** Medium Risk
**Location:** `runtime/security/`

**Analysis:**
- Security services are defined but not integrated
- No consumers of security services
- No health checks for security services
- No monitoring of security services

**Orphaned Services:**
- `capability_tokens.py` - Capability tokens not used
- `execution_policy.py` - Execution policy not used
- `semantic_capabilities.py` - Semantic capabilities not used
- `signed_policy.py` - Signed policy not used

**Impact:**
- Advanced security features not implemented
- No capability token management
- No execution policy enforcement

**Recommendation:** Integrate security services with runtime

---

### 7. Orphaned Storage Services
**Status:** Medium Risk
**Location:** `storage/`

**Analysis:**
- Storage services are defined but not integrated
- No consumers of storage services
- No health checks for storage services
- No monitoring of storage services

**Orphaned Services:**
- `artifact_adapter.py` - Artifact adapter not used
- `artifact_store.py` - Artifact store not used
- `event_store.py` - Event store not used

**Impact:**
- Alternative storage not available
- No artifact storage
- No event store abstraction

**Recommendation:** Integrate storage services with runtime

---

### 8. Orphaned Replay Services
**Status:** Medium Risk
**Location:** `kernel/replay/`

**Analysis:**
- Replay services are defined but not integrated
- No consumers of replay services
- No health checks for replay services
- No monitoring of replay services

**Orphaned Services:**
- `event_stream.py` - Event stream not used
- `replay_executor.py` - Replay executor not used
- `replay_kernel.py` - Replay kernel not used
- `replay_planner.py` - Replay planner not used
- `replay_verifier.py` - Replay verifier not used

**Impact:**
- Replay functionality not implemented
- No event stream replay
- No replay verification

**Recommendation:** Integrate replay services with runtime

---

### 9. Orphaned Skill Services
**Status:** Low Risk
**Location:** `runtime/skills/`

**Analysis:**
- Skill services are defined but not integrated
- No consumers of skill services
- No health checks for skill services
- No monitoring of skill services

**Orphaned Services:**
- `classify_existing_skills.py` - Skill classification not used
- `pure_functions.py` - Pure functions not used
- `skill_classification.py` - Skill classification not used
- `skill_registry.py` - Skill registry not used

**Impact:**
- Skill system not implemented
- No skill classification
- No skill registry

**Recommendation:** Integrate skill services with runtime

---

### 10. Orphaned Architecture Services
**Status:** Low Risk
**Location:** `architecture/replay/`

**Analysis:**
- Architecture services are defined but not integrated
- No consumers of architecture services
- No health checks for architecture services
- No monitoring of architecture services

**Orphaned Services:**
- `canonical_events.py` - Canonical events not used
- `canonical_ir.py` - Canonical IR not used
- `event_store.py` - Event store not used
- `ir_lowering.py` - IR lowering not used
- `migrations/mission_v1_to_v2.py` - Migration not used
- `schema_versioning.py` - Schema versioning not used

**Impact:**
- Architecture components not integrated
- No canonical event processing
- No IR lowering

**Recommendation:** Integrate architecture services with runtime

---

### 11. Orphaned Constitutional Services
**Status:** Medium Risk
**Location:** `constitution/`

**Analysis:**
- Constitutional services are defined but not integrated
- No consumers of constitutional services
- No health checks for constitutional services
- No monitoring of constitutional services

**Orphaned Services:**
- `intents.py` - Intents not used
- `transcript.py` - Transcript not used
- `value_objects.py` - Value objects not used
- `registries.py` - Registries not used
- `schema_registry.py` - Schema registry not used
- `hashing.py` - Hashing not used
- `hashing/merkle.py` - Merkle tree not used
- `authority/` - Constitutional authorities not used

**Impact:**
- Constitutional utilities not integrated
- No intent processing
- No transcript management
- No schema registry

**Recommendation:** Integrate constitutional services with runtime

---

### 12. Orphaned Docker Services
**Status:** Low Risk
**Location:** `infra/docker/docker-compose.yml`

**Analysis:**
- Docker services are defined but may not be used by main entry points
- Some services may be orphaned if not referenced

**Potentially Orphaned Services:**
- `ping-workers` - Workers may not be used if Temporal not integrated
- `mission-control` - Mission control may not be used if scheduler not integrated

**Impact:**
- Docker resources may be unused
- Infrastructure overhead

**Recommendation:** Verify Docker service usage and remove unused services

---

## Orphaned Service Summary

### High Priority Orphaned Services
1. **Authority Services** - Constitutional validation not enforced
2. **Capability Services** - Capabilities not registered
3. **Planning Services** - Planning pipeline not implemented

### Medium Priority Orphaned Services
4. **Registry Services** - Oracle workflow not implemented
5. **Security Services** - Advanced security not implemented
6. **Storage Services** - Alternative storage not available
7. **Replay Services** - Replay functionality not implemented
8. **Constitutional Services** - Constitutional utilities not integrated
9. **NATS Services** - Events published but not consumed

### Low Priority Orphaned Services
10. **Skill Services** - Skill system not implemented
11. **Architecture Services** - Architecture components not integrated
12. **Docker Services** - Potentially unused infrastructure

---

## Orphaned Service Impact

### High Impact
1. **Authority Services** - No constitutional validation
2. **Capability Services** - No capability execution
3. **Planning Services** - No planning pipeline

### Medium Impact
4. **Registry Services** - No oracle workflow
5. **Security Services** - No advanced security
6. **Storage Services** - No alternative storage
7. **Replay Services** - No replay functionality
8. **Constitutional Services** - No constitutional utilities
9. **NATS Services** - No event consumption

### Low Impact
10. **Skill Services** - No skill system
11. **Architecture Services** - No architecture integration
12. **Docker Services** - Potential infrastructure waste

---

## Recommendations

### Immediate Actions (High Priority)
1. **Integrate Authority Services** - Integrate authority services with runtime
2. **Register Capability Services** - Register capability implementations with CapabilityRegistry
3. **Integrate Planning Services** - Integrate planning services with runtime

### Medium-Term Actions (Medium Priority)
4. **Integrate Registry Services** - Integrate registry services with runtime
5. **Integrate Security Services** - Integrate security services with runtime
6. **Integrate Storage Services** - Integrate storage services with runtime
7. **Integrate Replay Services** - Integrate replay services with runtime
8. **Integrate Constitutional Services** - Integrate constitutional services with runtime
9. **Implement NATS Consumers** - Implement NATS consumers or remove NATS dependency

### Long-Term Actions (Low Priority)
10. **Integrate Skill Services** - Integrate skill services with runtime
11. **Integrate Architecture Services** - Integrate architecture services with runtime
12. **Verify Docker Services** - Verify Docker service usage and remove unused services

---

## Service Discovery Recommendations

### 1. Implement Service Registry
**Location:** New module `runtime/service_registry.py`

**Purpose:** Central service discovery and registration

**Features:**
- Service registration
- Service discovery
- Health checking
- Service monitoring

### 2. Add Health Checks
**Location:** All service modules

**Purpose:** Health check endpoints for all services

**Features:**
- Service health status
- Dependency health status
- Resource usage metrics

### 3. Add Service Monitoring
**Location:** All service modules

**Purpose:** Monitor service health and performance

**Features:**
- Metrics collection
- Performance tracking
- Error tracking

### 4. Add Service Documentation
**Location:** All service modules

**Purpose:** Document service interfaces and usage

**Features:**
- Service description
- Service interface
- Service dependencies
- Service usage examples

---

## Next Steps

- Integrate authority services with runtime
- Register capability implementations with CapabilityRegistry
- Integrate planning services with runtime
- Implement NATS consumers or remove NATS dependency
- Implement service registry for service discovery
- Add health checks to all services
- Add monitoring to all services
- Add documentation to all services
