# Service ABI (Application Binary Interface)

## Overview

The PING Cognitive Operating System defines a stable Service ABI through environment variables. These variables represent long-term service contracts that define the platform's architecture, even when individual services are not yet implemented.

**Purpose:** Maintain architectural stability as the system evolves by reserving service names, ports, and responsibilities.

**Version:** v1
**Stability:** Stable
**Last Updated:** 2026-06-25

---

## What is the Service ABI?

The Service ABI is the set of environment variables that define:

1. **Service Names** - Canonical identifiers for each service
2. **Service Ports** - Reserved network ports for inter-service communication
3. **Service Responsibilities** - Defined scope and purpose of each service
4. **Service Contracts** - Expected interfaces and behaviors

These contracts are **intentionally reserved** even when services are not yet implemented. This prevents:
- Port conflicts during development
- Architectural drift as new services are added
- Breaking changes to existing integrations
- Confusion about service responsibilities

---

## Reserved Service Contracts

### Core Constitutional Services

| Service | Port | Status | Responsibility |
|---------|------|--------|----------------|
| Constitution Service | 8082 | ✅ Implemented | Constitutional runtime, event processing, aggregate identity |
| Witness Service | 8090 | ✅ Implemented | Witness generation, determinism verification |
| Replay Service | 8091 | ✅ Implemented | Event replay, state reconstruction |
| Projection Service | 8084 | ✅ Implemented | Projection rebuild, materialized views |
| Ledger Service | 8083 | ⚠️ Partial | Immutable ledger, event signing |

### Cognitive Services

| Service | Port | Status | Responsibility |
|---------|------|--------|----------------|
| Retrieval Service | 8086 | ⚠️ Partial | Semantic retrieval, context packing |
| Agent Runtime | 8087 | ⚠️ Partial | Agent orchestration, tool execution |
| Memory Service | 8093 | ⚠️ Partial | Memory management, vector/graph storage |
| Graph Service | 8092 | ⚠️ Partial | Graph operations, relationship traversal |

### Infrastructure Services

| Service | Port | Status | Responsibility |
|---------|------|--------|----------------|
| Repository Runtime | 8085 | ✅ Implemented | Repository indexing, symbol extraction |
| Skills Service | 8088 | ⚠️ Partial | Skill registry, capability discovery |
| Filesystem Service | 8089 | ⚠️ Partial | Filesystem monitoring, change detection |
| Scheduler Service | 8094 | ⚠️ Partial | Task scheduling, cron management |

---

## Port Allocation Strategy

### Port Ranges

| Range | Purpose | Example |
|-------|---------|---------|
| 8080-8089 | Core Infrastructure | Constitution (8082), Ledger (8083), Projection (8084) |
| 8090-8099 | Cognitive Services | Witness (8090), Replay (8091), Graph (8092), Memory (8093), Scheduler (8094) |
| 6333 | Qdrant | Vector database |
| 5432 | PostgreSQL | Event store, authority storage |
| 11434 | Ollama | LLM inference |
| 4317 | OpenTelemetry | Tracing exporter |
| 16686 | Jaeger | Tracing UI |
| 3100 | Loki | Log aggregation |

### Allocation Rules

1. **Sequential Allocation** - Ports are allocated sequentially within ranges
2. **Semantic Grouping** - Related services share port ranges
3. **No Overlap** - Ports are never reused for different purposes
4. **Documentation First** - Ports are reserved before implementation

---

## Service Contract Stability

### Stability Guarantees

**Stable (v1):**
- Service names will not change
- Service ports will not change
- Service responsibilities will not change
- Environment variable names will not change

**Breaking Changes Require:**
1. Major version increment (v1 → v2)
2. Migration path for existing deployments
3. Backward compatibility period (minimum 6 months)
4. Updated documentation
5. Release notes with migration guide

### Evolution Without Breaking

Services can evolve within their contracts:

**Allowed Changes:**
- Internal implementation improvements
- Performance optimizations
- Additional optional features
- Bug fixes
- Enhanced error handling

**Not Allowed Without Major Version:**
- Service name changes
- Port changes
- Responsibility scope changes
- Environment variable name changes
- Contract interface changes

---

## Constitutional Implications

### Constitutional Runtime Stability

The Service ABI is part of the constitutional runtime's stability guarantees:

1. **Event Sourcing** - Services must emit events to stable endpoints
2. **Replay Determinism** - Service contracts must remain stable for replay
3. **Witness Verification** - Witness roots depend on stable service contracts
4. **Projection Rebuild** - Projections depend on stable service interfaces

### Architectural Invariants

**Invariant 1:** Service names are canonical identifiers
- `CONSTITUTION_SERVICE_URL` always points to the constitution service
- Changing this breaks event sourcing and replay

**Invariant 2:** Service ports are reserved allocations
- Port 8082 is always the constitution service
- Changing this breaks inter-service communication

**Invariant 3:** Service responsibilities are defined scopes
- The witness service always generates witnesses
- Changing this breaks constitutional verification

---

## Implementation Status

### Fully Implemented
- Constitution Service (8082)
- Witness Service (8090)
- Replay Service (8091)
- Projection Service (8084)
- Repository Runtime (8085)

### Partially Implemented
- Ledger Service (8083) - Basic storage, verification pending
- Retrieval Service (8086) - Basic retrieval, context packing pending
- Agent Runtime (8087) - Basic orchestration, tools pending
- Memory Service (8093) - Basic storage, backends pending
- Graph Service (8092) - Basic operations, traversal pending
- Skills Service (8088) - Registry pending
- Filesystem Service (8089) - Monitoring pending
- Scheduler Service (8094) - Scheduling pending

### Not Yet Implemented
All services have reserved contracts even when not implemented. This allows:
- Incremental development without port conflicts
- Clear roadmap for service development
- Stable integration points for future services
- Architectural planning without implementation pressure

---

## Development Guidelines

### Adding New Services

When adding a new service to the platform:

1. **Reserve a Port** - Choose an available port from the appropriate range
2. **Define Contract** - Document service responsibility and interface
3. **Add to .env.example** - Add service URL variable with default
4. **Add to Documentation** - Update this document and ENVIRONMENT_REFERENCE.md
5. **Implement Service** - Build service to contract specifications
6. **Test Integration** - Verify service works with existing services

**Example:**
```bash
# Reserve port
NEW_SERVICE_PORT=8095

# Add to .env.example
NEW_SERVICE_URL=http://new_service:8095

# Document in ENVIRONMENT_REFERENCE.md
NEW_SERVICE_URL=http://new_service:8095 | New service URL

# Document in SERVICE_ABI.md
New Service | 8095 | ⚠️ Pending | Service responsibility
```

### Modifying Existing Services

When modifying an existing service:

1. **Check Contract** - Verify change doesn't break service contract
2. **Maintain Compatibility** - Ensure backward compatibility
3. **Update Documentation** - Document any behavioral changes
4. **Test Integration** - Verify service works with all dependents
5. **Version if Breaking** - If breaking change, increment major version

---

## Integration Patterns

### Service Discovery

Services discover each other via environment variables:

```python
import os

constitution_url = os.getenv("CONSTITUTION_SERVICE_URL")
witness_url = os.getenv("WITNESS_SERVICE_URL")
replay_url = os.getenv("REPLAY_SERVICE_URL")
```

### Inter-Service Communication

Services communicate via HTTP on reserved ports:

```python
import requests

def call_witness_service(aggregate_id, replay_fingerprint):
    witness_url = os.getenv("WITNESS_SERVICE_URL")
    response = requests.post(
        f"{witness_url}/generate",
        json={"aggregate_id": aggregate_id, "replay_fingerprint": replay_fingerprint}
    )
    return response.json()
```

### Docker Compose Integration

Services are defined in Docker Compose with reserved ports:

```yaml
services:
  constitution:
    ports:
      - "8082:8082"
    environment:
      - CONSTITUTION_SERVICE_URL=http://constitution:8082
  
  witness:
    ports:
      - "8090:8090"
    environment:
      - WITNESS_SERVICE_URL=http://witness:8090
```

---

## Future Evolution

### Planned Services

The following services are planned for future implementation:

| Service | Port | Planned Features |
|---------|------|------------------|
| Skills Service | 8088 | Skill registry, capability discovery, dynamic loading |
| Filesystem Service | 8089 | Filesystem monitoring, change detection, indexing |
| Scheduler Service | 8094 | Task scheduling, cron management, distributed execution |

### Service Enhancements

Existing services may be enhanced with:

- **Ledger Service** - Event signing, cryptographic verification
- **Retrieval Service** - Advanced context packing, citation generation
- **Agent Runtime** - Multi-agent coordination, distributed execution
- **Memory Service** - Multi-backend support, hierarchical memory
- **Graph Service** - Advanced traversal, graph algorithms

### ABI Evolution

The Service ABI may evolve in future versions:

- **v2** - May add new services, ports, or contracts
- **v3** - May deprecate old services with migration path
- **v4** - May reorganize service responsibilities

**Evolution Rules:**
1. Maintain backward compatibility for at least one major version
2. Provide migration guides for breaking changes
3. Announce changes in release notes
4. Update all documentation
5. Test migration paths thoroughly

---

## Constitutional Test: Service Contract Stability

**Test:** Verify service contracts remain stable across deployments

**Steps:**
1. Record all service URLs and ports from environment
2. Deploy to new environment
3. Verify service URLs and ports are identical
4. Test inter-service communication
5. Verify constitutional runtime processes events correctly

**Expected Result:** Service contracts are identical across deployments

**Failure Condition:** Service contracts differ between deployments

---

## Troubleshooting

### Port Conflicts

**Symptom:** Service fails to start with "port already in use"

**Solution:**
1. Check if another service is using the reserved port
2. Verify the conflicting service is not part of the PING platform
3. Reconfigure the conflicting service to use a different port
4. Do not change the PING service port

### Service Not Found

**Symptom:** Service URL resolves but service is not implemented

**Solution:**
1. Check implementation status in this document
2. Verify the service is marked as "Not Yet Implemented"
3. Implement the service or use a mock for development
4. Do not change the service URL or port

### Integration Failures

**Symptom:** Services cannot communicate despite correct URLs

**Solution:**
1. Verify environment variables are loaded correctly
2. Check Docker network configuration
3. Verify service is running and listening on the correct port
4. Check firewall rules
5. Verify service contract is not broken

---

## References

- `docs/environment/ENVIRONMENT_REFERENCE.md` - Complete environment variable reference
- `docs/architecture/aggregate_identity.md` - Aggregate identity contracts
- `docs/architecture/witness_determinism.md` - Witness determinism contracts
- `docs/CONSTITUTIONAL_FREEZE_READINESS.md` - Constitutional runtime status
- `.env.example` - Environment variable template

---

## Summary

The Service ABI provides:

1. **Stability** - Reserved service names and ports prevent conflicts
2. **Clarity** - Defined responsibilities prevent ambiguity
3. **Evolution** - Planned services have clear integration points
4. **Constitutionality** - Stable contracts support replay and verification
5. **Documentation** - Complete reference for all service contracts

This ABI is part of the constitutional runtime's stability guarantees and must be maintained for the platform to function correctly.
