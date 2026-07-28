# MIGRATION ROADMAP

**Report Date:** 2026-06-19  
**Report Name:** MIGRATION_ROADMAP  
**Purpose:** Ordered migration roadmap by dependency

---

# MIGRATION PRINCIPLES

## Dependency Ordering

1. **Foundational Authorities** - Must be implemented first
2. **Core Infrastructure** - Depends on foundational authorities
3. **Application Layer** - Depends on core infrastructure
4. **Advanced Features** - Depends on application layer

## Blocking Rules

- Phase 1 must complete before Phase 2 can begin
- Phase 2 must complete before Phase 3 can begin
- Phase 3 must complete before Phase 4 can begin

## Parallel Execution

- Within each phase, tasks can execute in parallel
- Cross-phase dependencies must be respected

---

# PHASE 1: FOUNDATIONAL AUTHORITIES (CRITICAL)

**Priority:** CRITICAL  
**Timeline:** 1-2 weeks  
**Dependencies:** None  
**Blocking:** All subsequent phases

---

## 1.1 Identity Authority Migration

**Task:** Replace Node.js crypto with CertificateAuthority

**Files:**
- runtime/kernel/commit-service/src/engines/identity_engine.ts

**Changes:**
```typescript
// BEFORE
import crypto from "crypto"
const hash = crypto.createHash("sha256").update(serialized).digest("hex")

// AFTER
import { CertificateAuthority } from "@crx/replay"
const hash = CertificateAuthority.sha256(serialized)
```

**Dependencies:** None
**Estimated Time:** 1 day
**Risk:** LOW - Direct replacement

---

## 1.2 Persistence Authority Implementation

**Task:** Implement constitutional persistence layer

**Files:**
- runtime/kernel/commit-service/src/persistence/db.ts (remove)
- runtime/kernel/commit-service/src/persistence/constitutional_persistence.ts (create)

**Changes:**
- Remove direct PostgreSQL pool
- Implement constitutional persistence authority
- Route all persistence through constitutional authority

**Dependencies:** 1.1 (Identity Authority)
**Estimated Time:** 3-5 days
**Risk:** HIGH - Core infrastructure change

---

## 1.3 Event Authority Migration

**Task:** Move event creation before state mutation

**Files:**
- runtime/kernel/commit-service/src/api/commit_controller.ts

**Changes:**
```typescript
// BEFORE
await storeArtifact(artifactId, artifact)
await storeLineage(parentIds, artifactId)
await logEvent("artifact_commit", { artifactId })

// AFTER
await logEvent("artifact_commit", { artifactId })
await storeArtifact(artifactId, artifact)
await storeLineage(parentIds, artifactId)
```

**Dependencies:** 1.2 (Persistence Authority)
**Estimated Time:** 1 day
**Risk:** MEDIUM - Ordering change

---

## 1.4 PostgreSQL Redundancy

**Task:** Implement PostgreSQL replication and failover

**Files:**
- runtime/kernel/commit-service/src/persistence/replication.ts (create)

**Changes:**
- Implement PostgreSQL replication (primary/standby)
- Implement automatic failover
- Implement backup and restore
- Implement event log redundancy

**Dependencies:** 1.2 (Persistence Authority)
**Estimated Time:** 3-5 days
**Risk:** HIGH - Infrastructure change

---

## 1.5 Schema Migration Layer

**Task:** Implement migration layer for multi-version replay

**Files:**
- runtime/replay/schema_migration.ts (create)
- runtime/replay/replay_types.ts (extend)

**Changes:**
- Add migration layer for schema evolution
- Implement v1, v2, v3 event replay
- Implement state migration

**Dependencies:** None
**Estimated Time:** 2-3 days
**Risk:** MEDIUM - Schema evolution

---

## 1.6 Deletion Authority Implementation

**Task:** Implement Constitutional Identity Algebra deletion laws

**Files:**
- runtime/kernel/commit-service/src/persistence/deletion_authority.ts (create)

**Changes:**
- Implement deleted vs superseded vs expired distinctions
- Implement Constitutional Identity Algebra deletion laws
- Implement history preservation

**Dependencies:** 1.2 (Persistence Authority)
**Estimated Time:** 2-3 days
**Risk:** MEDIUM - New authority

---

## 1.7 Resource Controls Implementation

**Task:** Implement budget authority, rate limits, capability checks

**Files:**
- runtime/kernel/commit-service/src/authority/budget_authority.ts (create)
- runtime/kernel/commit-service/src/authority/rate_limiter.ts (create)
- runtime/kernel/commit-service/src/authority/capability_checker.ts (create)

**Changes:**
- Implement token budget authority
- Implement GPU budget authority
- Implement cloud budget authority
- Implement API request budget authority
- Implement rate limiting
- Implement capability checks

**Dependencies:** 1.2 (Persistence Authority)
**Estimated Time:** 3-5 days
**Risk:** MEDIUM - New authorities

---

**Phase 1 Summary:**
- Tasks: 7
- Estimated Time: 1-2 weeks
- Risk: HIGH (core infrastructure changes)
- Blocking: All subsequent phases

---

# PHASE 2: KNOWLEDGE FABRIC (HIGH PRIORITY)

**Priority:** HIGH  
**Timeline:** 2-4 weeks  
**Dependencies:** Phase 1 complete  
**Blocking:** Phase 3

---

## 2.1 Signal Layer Implementation

**Task:** Implement signal layer for raw input capture

**Files:**
- runtime/kernel/knowledge/signal_layer.ts (create)

**Changes:**
- Implement signal capture
- Implement signal metadata
- Implement signal validation

**Dependencies:** Phase 1 complete
**Estimated Time:** 2-3 days
**Risk:** MEDIUM - New layer

---

## 2.2 Observation Layer Implementation

**Task:** Implement observation layer for processed signals

**Files:**
- runtime/kernel/knowledge/observation_layer.ts (create)

**Changes:**
- Implement observation processing
- Implement observation metadata
- Implement observation validation

**Dependencies:** 2.1 (Signal Layer)
**Estimated Time:** 2-3 days
**Risk:** MEDIUM - New layer

---

## 2.3 Claim Layer Implementation

**Task:** Implement claim layer with evidence linking

**Files:**
- runtime/kernel/knowledge/claim_layer.ts (create)

**Changes:**
- Implement claim creation
- Implement evidence linking
- Implement claim validation
- Implement claim provenance

**Dependencies:** 2.2 (Observation Layer)
**Estimated Time:** 3-4 days
**Risk:** MEDIUM - New layer

---

## 2.4 Evidence Layer Implementation

**Task:** Implement evidence layer for supporting data

**Files:**
- runtime/kernel/knowledge/evidence_layer.ts (create)

**Changes:**
- Implement evidence storage
- Implement evidence linking
- Implement evidence validation

**Dependencies:** 2.3 (Claim Layer)
**Estimated Time:** 2-3 days
**Risk:** MEDIUM - New layer

---

## 2.5 Knowledge Layer Implementation

**Task:** Implement knowledge layer for validated claims

**Files:**
- runtime/kernel/knowledge/knowledge_layer.ts (create)

**Changes:**
- Implement knowledge validation
- Implement knowledge storage
- Implement knowledge retrieval

**Dependencies:** 2.4 (Evidence Layer)
**Estimated Time:** 3-4 days
**Risk:** MEDIUM - New layer

---

## 2.6 Recommendation Layer Implementation

**Task:** Implement recommendation layer for actionable insights

**Files:**
- runtime/kernel/knowledge/recommendation_layer.ts (create)

**Changes:**
- Implement recommendation generation
- Implement recommendation validation
- Implement recommendation storage

**Dependencies:** 2.5 (Knowledge Layer)
**Estimated Time:** 3-4 days
**Risk:** MEDIUM - New layer

---

## 2.7 Confidence Fabric Implementation

**Task:** Add confidence, freshness, verification status to all objects

**Files:**
- runtime/replay/replay_types.ts (extend)
- runtime/kernel/commit-service/src/models/artifact.ts (extend)

**Changes:**
- Add confidence field to all objects
- Add freshness field to all objects
- Add verification status field to all objects

**Dependencies:** Phase 1 complete
**Estimated Time:** 2-3 days
**Risk:** LOW - Schema extension

---

## 2.8 Contradiction Detection Implementation

**Task:** Implement contradiction detection and resolution workflow

**Files:**
- runtime/kernel/knowledge/contradiction_detector.ts (create)
- runtime/kernel/knowledge/resolution_workflow.ts (create)

**Changes:**
- Implement contradiction detection
- Implement claim validation
- Implement resolution workflow
- Implement conflict resolution policies

**Dependencies:** 2.3 (Claim Layer)
**Estimated Time:** 3-4 days
**Risk:** MEDIUM - New system

---

**Phase 2 Summary:**
- Tasks: 8
- Estimated Time: 2-4 weeks
- Risk: MEDIUM (new layers)
- Blocking: Phase 3

---

# PHASE 3: SURVIVABILITY & HUMAN OPERATIONS (HIGH PRIORITY)

**Priority:** HIGH  
**Timeline:** 1-2 weeks  
**Dependencies:** Phase 2 complete  
**Blocking:** Phase 4

---

## 3.1 Search Only Mode Implementation

**Task:** Implement search-only fallback mode

**Files:**
- runtime/kernel/survivability/search_mode.ts (create)

**Changes:**
- Implement search interface
- Implement search fallback
- Implement search-only operation

**Dependencies:** Phase 2 complete
**Estimated Time:** 2-3 days
**Risk:** MEDIUM - New mode

---

## 3.2 Database Only Mode Implementation

**Task:** Implement database-only mode with human interface

**Files:**
- runtime/kernel/survivability/database_mode.ts (create)

**Changes:**
- Implement database-only interface
- Implement human-friendly database access
- Implement manual database operation

**Dependencies:** Phase 2 complete
**Estimated Time:** 2-3 days
**Risk:** MEDIUM - New mode

---

## 3.3 Human Only Mode Implementation

**Task:** Implement human-only mode with manual processes

**Files:**
- runtime/kernel/survivability/human_mode.ts (create)

**Changes:**
- Implement human-only interface
- Implement manual processes
- Implement manual operation workflow

**Dependencies:** 3.2 (Database Only Mode)
**Estimated Time:** 2-3 days
**Risk:** MEDIUM - New mode

---

## 3.4 Graceful Degradation Path

**Task:** Implement degradation path

**Files:**
- runtime/kernel/survivability/degradation_path.ts (create)

**Changes:**
- Implement degradation detection
- Implement degradation triggers
- Implement degradation path execution

**Dependencies:** 3.1, 3.2, 3.3
**Estimated Time:** 2-3 days
**Risk:** MEDIUM - New system

---

**Phase 3 Summary:**
- Tasks: 4
- Estimated Time: 1-2 weeks
- Risk: MEDIUM (new modes)
- Blocking: Phase 4

---

# PHASE 4: ECONOMIC & DECISION QUALITY (MEDIUM PRIORITY)

**Priority:** MEDIUM  
**Timeline:** 2-3 weeks  
**Dependencies:** Phase 3 complete  
**Blocking:** None

---

## 4.1 Cost Tracking Implementation

**Task:** Implement cost tracking for all operations

**Files:**
- runtime/kernel/economic/cost_tracker.ts (create)

**Changes:**
- Implement cost per observation tracking
- Implement cost per claim tracking
- Implement cost per knowledge object tracking
- Implement cost per recommendation tracking
- Implement cost per action tracking

**Dependencies:** Phase 3 complete
**Estimated Time:** 3-4 days
**Risk:** MEDIUM - New system

---

## 4.2 Cost Attribution Implementation

**Task:** Implement cost attribution system

**Files:**
- runtime/kernel/economic/cost_attribution.ts (create)

**Changes:**
- Implement cost attribution to operations
- Implement cost attribution to users
- Implement cost attribution to projects
- Implement cost attribution to time periods

**Dependencies:** 4.1 (Cost Tracking)
**Estimated Time:** 2-3 days
**Risk:** MEDIUM - New system

---

## 4.3 Cost Reporting Implementation

**Task:** Implement cost reporting system

**Files:**
- runtime/kernel/economic/cost_reporting.ts (create)

**Changes:**
- Implement real-time cost monitoring
- Implement cost dashboards
- Implement cost alerts
- Implement cost optimization recommendations

**Dependencies:** 4.2 (Cost Attribution)
**Estimated Time:** 2-3 days
**Risk:** LOW - Reporting system

---

## 4.4 Decision Quality Tracking Implementation

**Task:** Implement decision quality tracking

**Files:**
- runtime/kernel/decision/decision_tracker.ts (create)

**Changes:**
- Implement recommendation tracking
- Implement acceptance tracking
- Implement action tracking (linked to recommendations)
- Implement outcome tracking
- Implement improvement tracking

**Dependencies:** Phase 3 complete
**Estimated Time:** 3-4 days
**Risk:** MEDIUM - New system

---

## 4.5 Decision Metrics Implementation

**Task:** Implement decision quality metrics

**Files:**
- runtime/kernel/decision/decision_metrics.ts (create)

**Changes:**
- Implement acceptance rate
- Implement action rate
- Implement outcome quality
- Implement improvement measurement
- Implement decision effectiveness

**Dependencies:** 4.4 (Decision Quality Tracking)
**Estimated Time:** 2-3 days
**Risk:** LOW - Metrics system

---

## 4.6 Decision Engine Implementation

**Task:** Transform from memory system to decision engine

**Files:**
- runtime/kernel/decision/decision_engine.ts (create)

**Changes:**
- Implement decision recommendation engine
- Implement decision validation
- Implement decision optimization
- Implement decision learning
- Implement decision feedback loop

**Dependencies:** 4.5 (Decision Metrics)
**Estimated Time:** 3-4 days
**Risk:** MEDIUM - New engine

---

**Phase 4 Summary:**
- Tasks: 6
- Estimated Time: 2-3 weeks
- Risk: MEDIUM (new systems)
- Blocking: None

---

# PHASE 5: RETRIEVAL SYSTEM (MEDIUM PRIORITY)

**Priority:** MEDIUM  
**Timeline:** 2-3 weeks  
**Dependencies:** Phase 3 complete  
**Blocking:** None

---

## 5.1 Vector System Implementation

**Task:** Implement vector storage with authority projection

**Files:**
- runtime/kernel/retrieval/vector_system.ts (create)

**Changes:**
- Implement Qdrant integration (projection only)
- Implement embedding generation from authority
- Implement vector reconstruction from authority
- Implement event stream to vector projection

**Dependencies:** Phase 3 complete
**Estimated Time:** 3-4 days
**Risk:** MEDIUM - New system

---

## 5.2 Embedding ROI Tracking Implementation

**Task:** Implement retrieval frequency, last retrieval, vector age tracking

**Files:**
- runtime/kernel/retrieval/embedding_roi.ts (create)

**Changes:**
- Implement retrieval frequency tracking
- Implement last retrieval timestamp
- Implement vector age tracking
- Implement 0-retrieval deletion (180+ days)
- Implement on-demand rebuild

**Dependencies:** 5.1 (Vector System)
**Estimated Time:** 2-3 days
**Risk:** MEDIUM - New system

---

## 5.3 Hot Warm Cold Classification Implementation

**Task:** Implement HOT/WARM/COLD classification with policies

**Files:**
- runtime/kernel/retrieval/classification.ts (create)

**Changes:**
- Implement HOT classification (current projects)
- Implement WARM classification (reference material)
- Implement COLD classification (archive)
- Implement storage policies (tiered storage)
- Implement retrieval policies (tiered retrieval)

**Dependencies:** 5.2 (Embedding ROI)
**Estimated Time:** 2-3 days
**Risk:** MEDIUM - New system

---

**Phase 5 Summary:**
- Tasks: 3
- Estimated Time: 2-3 weeks
- Risk: MEDIUM (new system)
- Blocking: None

---

# MIGRATION TIMELINE

## Overall Timeline

| Phase | Duration | Start | End | Dependencies |
|-------|----------|-------|-----|--------------|
| Phase 1 | 1-2 weeks | Week 1 | Week 2 | None |
| Phase 2 | 2-4 weeks | Week 3 | Week 6 | Phase 1 |
| Phase 3 | 1-2 weeks | Week 7 | Week 8 | Phase 2 |
| Phase 4 | 2-3 weeks | Week 9 | Week 11 | Phase 3 |
| Phase 5 | 2-3 weeks | Week 9 | Week 11 | Phase 3 |

**Total Duration:** 11 weeks

**Parallel Execution:** Phase 4 and Phase 5 can execute in parallel

---

# RISK ASSESSMENT

## High Risk Tasks

1. **1.2 Persistence Authority Implementation** - Core infrastructure change
2. **1.4 PostgreSQL Redundancy** - Infrastructure change

## Medium Risk Tasks

1. **1.3 Event Authority Migration** - Ordering change
2. **1.5 Schema Migration Layer** - Schema evolution
3. **1.6 Deletion Authority Implementation** - New authority
4. **1.7 Resource Controls Implementation** - New authorities
5. **2.1-2.6 Knowledge Fabric Layers** - New layers
6. **2.8 Contradiction Detection** - New system
7. **3.1-3.4 Survivability Modes** - New modes
8. **4.1 Cost Tracking** - New system
9. **4.2 Cost Attribution** - New system
10. **4.4 Decision Quality Tracking** - New system
11. **4.6 Decision Engine** - New engine
12. **5.1 Vector System** - New system
13. **5.2 Embedding ROI** - New system
14. **5.3 Hot Warm Cold** - New system

## Low Risk Tasks

1. **1.1 Identity Authority Migration** - Direct replacement
2. **2.7 Confidence Fabric** - Schema extension
3. **4.3 Cost Reporting** - Reporting system
4. **4.5 Decision Metrics** - Metrics system

---

# SUCCESS CRITERIA

## Phase 1 Success Criteria

- [ ] Identity Authority uses CertificateAuthority
- [ ] Persistence Authority is constitutional
- [ ] Event Authority uses event-first ordering
- [ ] PostgreSQL has replication and failover
- [ ] Schema migration layer is implemented
- [ ] Deletion Authority is implemented
- [ ] Resource controls are implemented

## Phase 2 Success Criteria

- [ ] Signal layer is implemented
- [ ] Observation layer is implemented
- [ ] Claim layer is implemented
- [ ] Evidence layer is implemented
- [ ] Knowledge layer is implemented
- [ ] Recommendation layer is implemented
- [ ] Confidence fabric is added to all objects
- [ ] Contradiction detection is implemented

## Phase 3 Success Criteria

- [ ] Search-only mode is implemented
- [ ] Database-only mode is implemented
- [ ] Human-only mode is implemented
- [ ] Graceful degradation path is implemented

## Phase 4 Success Criteria

- [ ] Cost tracking is implemented
- [ ] Cost attribution is implemented
- [ ] Cost reporting is implemented
- [ ] Decision quality tracking is implemented
- [ ] Decision metrics are implemented
- [ ] Decision engine is implemented

## Phase 5 Success Criteria

- [ ] Vector system is implemented
- [ ] Embedding ROI tracking is implemented
- [ ] Hot/warm/cold classification is implemented

---

# CONCLUSION

**Total Phases:** 5  
**Total Tasks:** 28  
**Total Duration:** 11 weeks  
**Estimated Effort:** 8-12 developer-weeks

**Critical Path:** Phase 1 → Phase 2 → Phase 3 → Phase 4/5 (parallel)

**Blocking Issues:** Phase 1 must complete before any other work can proceed

**Risk Level:** HIGH (Phase 1 has core infrastructure changes)

**Recommendation:** Start with Phase 1 immediately, focus on identity authority and persistence authority migration

---

# Next Step

**Deliverable 4: Compute Broker Design**
