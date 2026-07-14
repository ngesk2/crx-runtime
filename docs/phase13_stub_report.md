# Phase 13: Stubbed/Incomplete Infrastructure Report

## Step 1: Find Stubbed/Incomplete Infrastructure

### Stubs Found

1. **kernel/event_dag.py:264** - `detect_joins` method
   - Status: TODO
   - Impact: Low (join detection not critical for replay)
   - Type: Constitutional code (should not replace)

2. **api/main.py:81** - PostgreSQL connection check
   - Status: TODO (hardcoded True)
   - Impact: Medium (health checks inaccurate)
   - Type: Infrastructure (should replace)

3. **api/main.py:82** - NATS connection check
   - Status: TODO (hardcoded True)
   - Impact: Medium (health checks inaccurate)
   - Type: Infrastructure (should replace)

4. **api/main.py:152** - NATS publishing (events)
   - Status: TODO (no publishing)
   - Impact: High (events not published to NATS)
   - Type: Infrastructure (should replace)

5. **api/main.py:194** - NATS publishing (commands)
   - Status: TODO (no publishing)
   - Impact: High (commands not published to NATS)
   - Type: Infrastructure (should replace)

6. **api/main.py:260** - Replay logic
   - Status: TODO (stubbed)
   - Impact: High (replay not functional)
   - Type: Constitutional code (should not replace in Phase 13)

7. **api/main.py:282** - Metrics
   - Status: TODO (stubbed)
   - Impact: Medium (no observability)
   - Type: Infrastructure (should replace with Prometheus/OpenTelemetry)

8. **transport/nats/__init__.py** - Empty file
   - Status: Empty (no implementation)
   - Impact: High (no NATS transport)
   - Type: Infrastructure (should replace)

## Step 2: Infrastructure Replacement Priority

### REPLACE IMMEDIATELY (High Impact, Infrastructure Only)

1. **NATS Transport** - `transport/nats/__init__.py`
   - OSS: nats-py (mature, audited)
   - Constitutional: No (transport infrastructure)
   - Risk: LOW

2. **NATS Publishing** - `api/main.py:152, 194`
   - OSS: nats-py (mature, audited)
   - Constitutional: No (transport infrastructure)
   - Risk: LOW

3. **PostgreSQL Connection Check** - `api/main.py:81`
   - OSS: SQLAlchemy (already using)
   - Constitutional: No (health check infrastructure)
   - Risk: LOW

4. **NATS Connection Check** - `api/main.py:82`
   - OSS: nats-py (mature, audited)
   - Constitutional: No (health check infrastructure)
   - Risk: LOW

### REPLACE LATER (Medium Impact, Infrastructure Only)

5. **Metrics** - `api/main.py:282`
   - OSS: Prometheus/OpenTelemetry
   - Constitutional: No (observability infrastructure)
   - Risk: LOW
   - Note: Defer until observability requirements defined

### KEEP (Constitutional Code, Do Not Replace)

6. **Join Detection** - `kernel/event_dag.py:264`
   - Type: Constitutional code (DAG semantics)
   - Reason: Expresses constitutional law (causal relationships)
   - Action: Keep stub, implement later if needed

7. **Replay Logic** - `api/main.py:260`
   - Type: Constitutional code (replay semantics)
   - Reason: Expresses constitutional law (replay determinism)
   - Action: Keep stub, implement in separate phase

## Step 3: Preserve Interfaces

### Interfaces to Preserve

- Capability interfaces (all 9 capabilities)
- Evidence IR (constitution/models/evidence.py)
- Request IR (constitution/models/request.py)
- Kernel APIs (kernel/*.py)
- Storage APIs (storage/*.py)

### Internals to Replace

- NATS transport implementation (transport/nats/__init__.py)
- Health check implementations (api/main.py)
- Event publishing (api/main.py)

## Step 4: Adapter Strategy

### NATS Transport Adapter

```
Old: transport/nats/__init__.py (empty)
↓
Adapter: NATSTransportAdapter (implements EventPublisher interface)
↓
OSS: nats-py
```

### Health Check Adapter

```
Old: api/main.py (hardcoded True)
↓
Adapter: HealthCheckAdapter (implements HealthChecker interface)
↓
OSS: SQLAlchemy (PostgreSQL), nats-py (NATS)
```

## Step 5: Determinism Verification

### Verification Points

For each migration, verify:
- Replay hash unchanged
- Evidence hash unchanged
- Canonical bytes unchanged
- Event hash unchanged
- Projection hash unchanged
- BuildWitness unchanged

### Test Strategy

- Run existing replay tests before and after migration
- Compare hashes for identical inputs
- Ensure no changes to constitutional models

## Step 6: Compatibility Tests

### Test Cases

1. **NATS Transport**
   - Old: No publishing (events not published)
   - New: nats-py publishing
   - Compatibility: Not applicable (no old implementation)
   - Test: Verify events published to NATS

2. **Health Checks**
   - Old: Hardcoded True
   - New: Actual connection checks
   - Compatibility: Not applicable (no old implementation)
   - Test: Verify health checks reflect actual state

## Step 7: Constitutional Code Protection

### Never Replace

- CanonicalHasher (constitution/hashing.py)
- BuildWitness (kernel/build_witness.py)
- Evidence (constitution/models/evidence.py)
- Event (constitution/models/event.py)
- Replay ordering (kernel/replay.py)
- Merkle ordering (constitution/hashing/merkle.py)
- Canonical serialization (constitution/hashing.py)

### Only Replace Plumbing

- Transport adapters
- Health checks
- Metrics
- Filesystem adapters (already done in Phase 12)
- Storage adapters (already done in Phase 12)
