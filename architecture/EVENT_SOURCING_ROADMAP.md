# Constitutional Runtime 2.1 - Event Sourcing Roadmap

## Overview

This document outlines the roadmap for implementing event sourcing in Constitutional Runtime 2.1. Event sourcing transforms the runtime from mutable state to canonical events with derived projections.

**Key Principle:** Events become canonical truth. Mutable state becomes derived projections. All state changes are recorded as immutable events.

---

## Current State

### Completed Foundation

**Status:** ✅ Completed

**Deliverables:**
- ✅ Canonical event types defined (`architecture/canonical_events.py`)
- ✅ Event store implemented (`architecture/event_store.py`)
- ✅ Event factory for creating events
- ✅ Event streams per aggregate
- ✅ Event subscriptions
- ✅ Optimistic concurrency control

**Event Types Defined:**
- IntentCreated, StrategyCreated, ObjectiveCreated
- MissionCreated, MissionCompiled, MissionOptimized, MissionScheduled, MissionStarted, MissionCompleted, MissionFailed, MissionCancelled, MissionArchived
- CapabilityRequested, CapabilityGranted, CapabilityRevoked, CapabilityDenied
- LeaseIssued, LeaseRevoked, LeaseExpired
- PlanningIRGenerated, CIRGenerated, ExecutionGraphGenerated
- NodeScheduled, NodeStarted, NodeCompleted, NodeFailed, NodePreempted
- ArtifactProduced, ArtifactVerified, ArtifactSigned, ArtifactArchived
- VerificationStarted, VerificationSucceeded, VerificationFailed
- EvidenceCollected, EvidenceVerified
- StateTransition

**Event Store Capabilities:**
- Append-only event storage
- Event streams per aggregate
- Optimistic concurrency control
- Event subscriptions
- Event querying by type, correlation, aggregate

---

## Roadmap Phases

### Phase 1: Event Emission Integration

**Objective:** Integrate event emission into existing subsystems

**Status:** ⏳ Pending

**Duration:** 2 weeks

**Deliverables:**
- ⏳ Event emission integrated into Mission lifecycle
- ⏳ Event emission integrated into Capability lifecycle
- ⏳ Event emission integrated into Lease lifecycle
- ⏳ Event emission integrated into Node execution
- ⏳ Event emission integrated into Artifact lifecycle
- ⏳ Event emission integrated into Verification lifecycle
- ⏳ Event emission integrated into Evidence lifecycle

**Tasks:**

1. **Mission Lifecycle Events**
   - Emit MissionCreated when mission is created
   - Emit MissionCompiled when mission is compiled
   - Emit MissionOptimized when mission is optimized
   - Emit MissionScheduled when mission is scheduled
   - Emit MissionStarted when mission starts
   - Emit MissionCompleted when mission completes
   - Emit MissionFailed when mission fails
   - Emit MissionCancelled when mission is cancelled
   - Emit MissionArchived when mission is archived

2. **Capability Lifecycle Events**
   - Emit CapabilityRequested when capability is requested
   - Emit CapabilityGranted when capability is granted
   - Emit CapabilityRevoked when capability is revoked
   - Emit CapabilityDenied when capability is denied

3. **Lease Lifecycle Events**
   - Emit LeaseIssued when lease is issued
   - Emit LeaseRevoked when lease is revoked
   - Emit LeaseExpired when lease expires

4. **Node Execution Events**
   - Emit NodeScheduled when node is scheduled
   - Emit NodeStarted when node starts
   - Emit NodeCompleted when node completes
   - Emit NodeFailed when node fails
   - Emit NodePreempted when node is preempted

5. **Artifact Lifecycle Events**
   - Emit ArtifactProduced when artifact is produced
   - Emit ArtifactVerified when artifact is verified
   - Emit ArtifactSigned when artifact is signed
   - Emit ArtifactArchived when artifact is archived

6. **Verification Lifecycle Events**
   - Emit VerificationStarted when verification starts
   - Emit VerificationSucceeded when verification succeeds
   - Emit VerificationFailed when verification fails

7. **Evidence Lifecycle Events**
   - Emit EvidenceCollected when evidence is collected
   - Emit EvidenceVerified when evidence is verified

**Integration Points:**
- `runtime/planning/hierarchy.py` - Mission lifecycle
- `runtime/security/semantic_capabilities.py` - Capability lifecycle
- `hermes/runtime/constitutional_citizen.py` - Lease lifecycle
- `runtime/scheduler/constitutional_scheduler.py` - Node scheduling
- `runtime/executor/executor.py` - Node execution
- `runtime/artifacts/artifact_ontology.py` - Artifact lifecycle
- `runtime/verification/verifier.py` - Verification lifecycle
- `runtime/evidence/evidence_compiler.py` - Evidence lifecycle

**Backwards Compatibility:**
- Existing state mutations continue to work
- Event emission is additive
- No changes to existing behavior
- Feature flag to enable/disable event emission

**Validation:**
- Events emitted for all state changes
- Event data matches state changes
- Event ordering correct
- Event metadata complete

---

### Phase 2: Projection Implementation

**Objective:** Create projections for all runtime state

**Status:** ⏳ Pending

**Duration:** 3 weeks

**Deliverables:**
- ⏳ Mission projection
- ⏳ Artifact projection
- ⏳ Capability projection
- ⏳ Lease projection
- ⏳ Node projection
- ⏳ Verification projection
- ⏳ Evidence projection

**Tasks:**

1. **Mission Projection**
   - Create MissionProjection class
   - Update from MissionCreated, MissionCompiled, MissionOptimized, MissionScheduled, MissionStarted, MissionCompleted, MissionFailed, MissionCancelled, MissionArchived
   - Rebuild from event stream
   - Query current state

2. **Artifact Projection**
   - Create ArtifactProjection class
   - Update from ArtifactProduced, ArtifactVerified, ArtifactSigned, ArtifactArchived
   - Rebuild from event stream
   - Query current state

3. **Capability Projection**
   - Create CapabilityProjection class
   - Update from CapabilityRequested, CapabilityGranted, CapabilityRevoked, CapabilityDenied
   - Rebuild from event stream
   - Query current state

4. **Lease Projection**
   - Create LeaseProjection class
   - Update from LeaseIssued, LeaseRevoked, LeaseExpired
   - Rebuild from event stream
   - Query current state

5. **Node Projection**
   - Create NodeProjection class
   - Update from NodeScheduled, NodeStarted, NodeCompleted, NodeFailed, NodePreempted
   - Rebuild from event stream
   - Query current state

6. **Verification Projection**
   - Create VerificationProjection class
   - Update from VerificationStarted, VerificationSucceeded, VerificationFailed
   - Rebuild from event stream
   - Query current state

7. **Evidence Projection**
   - Create EvidenceProjection class
   - Update from EvidenceCollected, EvidenceVerified
   - Rebuild from event stream
   - Query current state

**Projection Interface:**

```python
class Projection[T]:
    def __init__(self, event_store: EventStore):
        self.event_store = event_store
        self._state: Dict[str, T] = {}
    
    def update(self, event: CanonicalEvent) -> None:
        """Update projection from event."""
        raise NotImplementedError
    
    def rebuild(self, aggregate_id: str) -> T:
        """Rebuild projection from event stream."""
        events = self.event_store.get_stream(aggregate_id)
        state = None
        for event in events:
            state = self.update(event)
        return state
    
    def get_state(self, aggregate_id: str) -> Optional[T]:
        """Get current state."""
        return self._state.get(aggregate_id)
```

**Backwards Compatibility:**
- Existing state access continues to work
- Projections run in parallel
- No changes to existing behavior
- Feature flag to enable/disable projections

**Validation:**
- Projections update correctly from events
- Event replay produces same state
- Projection rebuild works correctly
- Projection queries return correct state

---

### Phase 3: State Migration

**Objective:** Migrate existing state to events

**Status:** ⏳ Pending

**Duration:** 2 weeks

**Deliverables:**
- ⏳ State migration tool
- ⏳ Existing state to event conversion
- ⏳ Migration validation
- ⏳ Migration rollback procedure

**Tasks:**

1. **State Migration Tool**
   - Create migration tool
   - Scan existing state
   - Generate events from state
   - Write events to event store
   - Validate event generation

2. **Mission State Migration**
   - Migrate existing missions to events
   - Generate MissionCreated events
   - Generate mission lifecycle events
   - Validate migration

3. **Artifact State Migration**
   - Migrate existing artifacts to events
   - Generate ArtifactProduced events
   - Generate artifact lifecycle events
   - Validate migration

4. **Capability State Migration**
   - Migrate existing capabilities to events
   - Generate capability lifecycle events
   - Validate migration

5. **Lease State Migration**
   - Migrate existing leases to events
   - Generate LeaseIssued events
   - Validate migration

**Migration Procedure:**

1. Backup existing state
2. Run migration tool
3. Validate event generation
4. Validate projection rebuild
5. Switch to event-driven state
6. Monitor for issues
7. Rollback if issues detected

**Rollback Procedure:**

1. Disable event-driven state
2. Restore from backup
3. Verify functionality
4. Monitor for issues

**Backwards Compatibility:**
- Existing state preserved during migration
- Migration is additive
- Rollback procedure available
- No data loss

**Validation:**
- All state migrated to events
- Event replay produces same state
- Migration completes without errors
- Rollback procedure works

---

### Phase 4: Subsystem Updates

**Objective:** Update subsystems to consume events

**Status:** ⏳ Pending

**Duration:** 3 weeks

**Deliverables:**
- ⏳ Scheduler updated to consume events
- ⏳ Verifier updated to consume events
- ⏳ Evidence Engine updated to consume events
- ⏳ State Machine updated to consume events
- ⏳ Security Manager updated to consume events

**Tasks:**

1. **Scheduler Updates**
   - Subscribe to NodeScheduled, NodeStarted, NodeCompleted, NodeFailed events
   - Update scheduling state from events
   - Remove direct state mutations
   - Use projections for state queries

2. **Verifier Updates**
   - Subscribe to VerificationStarted, VerificationSucceeded, VerificationFailed events
   - Update verification state from events
   - Remove direct state mutations
   - Use projections for state queries

3. **Evidence Engine Updates**
   - Subscribe to EvidenceCollected, EvidenceVerified events
   - Update evidence state from events
   - Remove direct state mutations
   - Use projections for state queries

4. **State Machine Updates**
   - Subscribe to StateTransition events
   - Update state machine from events
   - Remove direct state mutations
   - Use projections for state queries

5. **Security Manager Updates**
   - Subscribe to CapabilityRequested, CapabilityGranted, CapabilityRevoked events
   - Update security state from events
   - Remove direct state mutations
   - Use projections for state queries

**Backwards Compatibility:**
- Existing state mutations continue to work
- Event consumption is additive
- Gradual migration to event-driven updates
- Feature flag to enable/disable event consumption

**Validation:**
- Subsystems consume events correctly
- State updates from events correct
- Projections provide correct state
- Existing functionality unchanged

---

### Phase 5: Event Replay

**Objective:** Implement event replay for debugging and audit

**Status:** ⏳ Pending

**Duration:** 2 weeks

**Deliverables:**
- ⏳ Event replay implementation
- ⏳ Replay for debugging
- ⏳ Replay for audit
- ⏳ Replay for testing

**Tasks:**

1. **Event Replay Implementation**
   - Create replay engine
   - Replay events from specific position
   - Replay events for specific aggregate
   - Replay events for specific time range

2. **Debugging Replay**
   - Replay events to debug issues
   - Inspect state at any point in time
   - Step through event stream
   - Visualize state changes

3. **Audit Replay**
   - Replay events for audit
   - Generate audit reports
   - Verify compliance
   - Track state changes

4. **Testing Replay**
   - Replay events for testing
   - Test with historical events
   - Validate event handling
   - Test edge cases

**Replay Interface:**

```python
class EventReplay:
    def __init__(self, event_store: EventStore):
        self.event_store = event_store
    
    def replay_from_position(self, position: int) -> List[CanonicalEvent]:
        """Replay events from position."""
        pass
    
    def replay_aggregate(self, aggregate_id: str) -> List[CanonicalEvent]:
        """Replay events for aggregate."""
        pass
    
    def replay_time_range(self, start: str, end: str) -> List[CanonicalEvent]:
        """Replay events in time range."""
        pass
    
    def replay_to_projection(self, events: List[CanonicalEvent], projection: Projection) -> Any:
        """Replay events to projection."""
        pass
```

**Backwards Compatibility:**
- Event replay is additive
- No changes to existing behavior
- Optional feature

**Validation:**
- Event replay works correctly
- Replay produces same state
- Debugging with replay works
- Audit reports correct

---

### Phase 6: Event Archiving

**Objective:** Implement event archiving for storage management

**Status:** ⏳ Pending

**Duration:** 2 weeks

**Deliverables:**
- ⏳ Event archiving implementation
- ⏳ Archive retention policy
- ⏳ Archive retrieval
- ⏳ Archive cleanup

**Tasks:**

1. **Event Archiving Implementation**
   - Create archiving system
   - Archive old events
   - Compress archived events
   - Store archives separately

2. **Archive Retention Policy**
   - Define retention periods
   - Define archive criteria
   - Implement retention enforcement
   - Monitor archive growth

3. **Archive Retrieval**
   - Retrieve archived events
   - Restore from archive
   - Query archived events
   - Merge archived and active events

4. **Archive Cleanup**
   - Delete expired archives
   - Cleanup temporary archives
   - Monitor storage usage
   - Alert on storage issues

**Backwards Compatibility:**
- Event archiving is transparent
- No changes to event access
- Optional feature

**Validation:**
- Archiving works correctly
- Archived events retrievable
- Retention policy enforced
- Storage usage controlled

---

## Timeline

### Phase 1: Event Emission Integration
- Duration: 2 weeks
- Status: ⏳ Pending
- Start: TBD
- End: TBD

### Phase 2: Projection Implementation
- Duration: 3 weeks
- Status: ⏳ Pending
- Start: TBD
- End: TBD

### Phase 3: State Migration
- Duration: 2 weeks
- Status: ⏳ Pending
- Start: TBD
- End: TBD

### Phase 4: Subsystem Updates
- Duration: 3 weeks
- Status: ⏳ Pending
- Start: TBD
- End: TBD

### Phase 5: Event Replay
- Duration: 2 weeks
- Status: ⏳ Pending
- Start: TBD
- End: TBD

### Phase 6: Event Archiving
- Duration: 2 weeks
- Status: ⏳ Pending
- Start: TBD
- End: TBD

**Total Duration:** 14 weeks

---

## Success Criteria

### Phase Success Criteria

Each phase is successful when:

1. All deliverables implemented
2. All tests passing
3. Backwards compatibility validated
4. Performance acceptable
5. Documentation complete
6. Rollback procedure tested

### Overall Success Criteria

Event sourcing is successful when:

1. All phases completed
2. All state changes emit events
3. All projections update correctly
4. Event replay works correctly
5. All subsystems consume events
6. No breaking changes
7. Performance acceptable
8. Documentation complete

---

## Risk Mitigation

### Risk 1: Event Emission Overhead

**Mitigation:**
- Batch event emission
- Async event emission
- Event emission optimization
- Monitor event emission performance

### Risk 2: Projection Lag

**Mitigation:**
- Incremental projection updates
- Projection caching
- Projection optimization
- Monitor projection lag

### Risk 3: Event Store Growth

**Mitigation:**
- Event archiving
- Event compression
- Retention policies
- Monitor storage usage

### Risk 4: Migration Failures

**Mitigation:**
- Comprehensive testing
- Migration validation
- Rollback procedure
- Backup before migration

### Risk 5: Replay Performance

**Mitigation:**
- Replay optimization
- Replay caching
- Incremental replay
- Monitor replay performance

---

## Monitoring

### Metrics to Track

- Event emission rate
- Event store size
- Projection update latency
- Projection lag
- Replay performance
- Archive size
- Storage usage
- Error rates

### Alerts

- Event emission failures
- Projection update failures
- Projection lag threshold
- Storage capacity threshold
- Replay performance threshold
- Archive failure

---

## Conclusion

The event sourcing roadmap provides a clear path to implementing event sourcing in Constitutional Runtime 2.1. The roadmap is incremental, backwards-compatible, and low-risk. Each phase can be rolled back independently, and feature flags enable gradual rollout.

Event sourcing provides canonical truth through events, derived state through projections, and enables audit, replay, and distributed runtime.
