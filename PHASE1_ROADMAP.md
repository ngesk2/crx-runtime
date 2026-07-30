# Phase 1 Roadmap - Minimum Backend Services for HPP

**Purpose:** Build minimum backend services that HPP needs to acquire customers immediately while PING grows underneath

---

## Constitutional Boundaries

**HPP** = Production application and marketing engine
- Landing pages
- Kit integration
- Welcome sequence
- Lead capture
- Estimate funnel

**PING** = Experimental deterministic backend services
- Identity Service
- Property Service
- Artifact Service
- Event Service
- Graph Service
- Classifier Service
- Replay Service

**Constitutional Runtime (CRX)** = Infrastructure that hosts PING

---

## Phase 1 Services

### 1. Identity Service

**Owns:**
- Customer
- Crew
- Company
- Roles

**Produces Events:**
- CustomerCreated
- CustomerUpdated
- CrewMemberAdded
- CrewMemberRemoved
- CompanyCreated
- RoleAssigned

**Constitutional Rules:**
- No CRM logic
- Identity is canonical source of truth
- All entities have immutable IDs
- Role-based access control

**API:**
```typescript
createCustomer(data): Promise<Customer>
updateCustomer(id, data): Promise<Customer>
addCrewMember(data): Promise<CrewMember>
createCompany(data): Promise<Company>
assignRole(userId, role): Promise<void>
```

---

### 2. Property Service

**Owns:**
- Property
- Address
- Ownership
- Geo

**Produces Events:**
- PropertyRegistered
- PropertyUpdated
- OwnershipTransferred
- AddressUpdated

**Constitutional Rules:**
- Property is canonical source of truth
- Ownership history is append-only
- Address normalization required
- Geo coordinates immutable

**API:**
```typescript
registerProperty(data): Promise<Property>
updateProperty(id, data): Promise<Property>
transferOwnership(propertyId, ownerId): Promise<void>
updateAddress(propertyId, address): Promise<Address>
```

---

### 3. Artifact Service

**Universal Abstraction**

Instead of:
- Estimate
- Review
- Project
- Inspection
- Photo
- Invoice
- Permit
- Warranty
- Maintenance
- Conversation
- Document

Everything becomes:
- Artifact (with types)

**Artifact Types:**
- Estimate
- Inspection
- Review
- Photo
- Invoice
- Permit
- Warranty
- Maintenance
- Conversation
- Document

**Produces Events:**
- ArtifactCreated
- ArtifactUpdated
- ArtifactDeleted
- ArtifactLinked

**Constitutional Rules:**
- Everything references Artifact IDs
- Artifacts are immutable (create new version for updates)
- Artifact type is discriminator
- Artifact links are append-only

**API:**
```typescript
createArtifact(type, data): Promise<Artifact>
updateArtifact(id, data): Promise<Artifact>
linkArtifacts(sourceId, targetId, relation): Promise<void>
getArtifact(id): Promise<Artifact>
getArtifactsByType(type): Promise<Artifact[]>
```

---

### 4. Event Service

**Core Operations:**
- AppendEvent()
- Replay()
- Snapshot()
- Witness()
- Verify()

**Constitutional Rules:**
- Nothing business-specific
- Events are append-only
- Replay is deterministic
- Snapshots are derived from events
- Witnesses prove event integrity

**API:**
```typescript
appendEvent(event): Promise<void>
replay(aggregateId): Promise<Event[]>
snapshot(aggregateId): Promise<Snapshot>
witness(event): Promise<Witness>
verify(event, witness): Promise<boolean>
```

---

### 5. Graph Service

**Consumes:** Events

**Produces:**
- Nodes
- Edges
- Relationships

**Constitutional Rules:**
- No business logic
- Graph is derived from events
- Graph is rebuildable
- Relationships are append-only

**API:**
```typescript
buildGraph(): Promise<Graph>
getNodes(type): Promise<Node[]>
getEdges(sourceId, targetId): Promise<Edge[]>
getPath(sourceId, targetId): Promise<Path[]>
```

---

### 6. Classifier Service

**Consumes:** Artifacts

**Produces:** ClassifierResult

**Classifiers:**
- Sentiment
- Review Quality
- Urgency
- Fraud
- Maintenance Risk

**Constitutional Rules:**
- Classifiers are deterministic
- Classifiers are pluggable
- Classifier results are events
- No AI black boxes (explainable)

**API:**
```typescript
classify(artifactId, classifier): Promise<ClassifierResult>
registerClassifier(classifier): Promise<void>
getClassifierResults(artifactId): Promise<ClassifierResult[]>
```

---

### 7. Replay Service

**Provides:**
- Replay Aggregate
- Replay Property
- Replay Customer
- Replay Artifact
- Replay Entire Timeline

**Constitutional Rules:**
- Replay is deterministic
- Replay produces certificates
- Replay is testable
- Replay is the foundation for CRX

**API:**
```typescript
replayAggregate(aggregateId): Promise<AggregateState>
replayProperty(propertyId): Promise<PropertyState>
replayCustomer(customerId): Promise<CustomerState>
replayArtifact(artifactId): Promise<ArtifactState>
replayTimeline(cursor): Promise<Event[]>
```

---

## MarketingProvider Abstraction

**Purpose:** Freeze Kit adapter interface

**Before:**
```typescript
// Website code knows Kit exists
createSubscriber(...)
applyWebsiteSubscriberTag(...)
enrollInWelcomeSequence(...)
```

**After:**
```typescript
// Website code knows only MarketingProvider
MarketingProvider.subscribe(...)
MarketingProvider.applyTag(...)
MarketingProvider.startSequence(...)
MarketingProvider.handleWebhook(...)
```

**Implementation:**
```typescript
interface MarketingProvider {
  subscribe(email, firstName, tags?, sequences?): Promise<LeadCaptured>
  applyTag(subscriberId, tag): Promise<TagApplied>
  startSequence(subscriberId, sequence): Promise<SequenceStarted>
  handleWebhook(payload, signature): Promise<CanonicalEvent[]>
}
```

**KitAdapter implements MarketingProvider:**
```typescript
class KitAdapter implements MarketingProvider {
  async subscribe(...): Promise<LeadCaptured> {
    const result = await createSubscriber(...)
    return {
      type: "LeadCaptured",
      data: { email: result.email_address, source: "kit" },
      timestamp: new Date().toISOString()
    }
  }

  async applyTag(...): Promise<TagApplied> {
    const result = await addTagToSubscriber(...)
    return {
      type: "TagApplied",
      data: { subscriberId, tagId },
      timestamp: new Date().toISOString()
    }
  }

  async startSequence(...): Promise<SequenceStarted> {
    const result = await enrollInSequence(...)
    return {
      type: "SequenceStarted",
      data: { subscriberId, sequenceId },
      timestamp: new Date().toISOString()
    }
  }

  async handleWebhook(...): Promise<CanonicalEvent[]> {
    const kitEvent = parseWebhook(payload)
    return normalizeToCanonical(kitEvent)
  }
}
```

---

## Every Kit Action Emits Events

**Instead of:**
- Subscriber created

**Emit:**
- LeadCaptured
- TagApplied
- SequenceStarted
- SequenceCompleted
- EmailOpened
- LinkClicked
- EstimateRequested

**Canonical Events:**
```typescript
type CanonicalEvent =
  | LeadCaptured
  | TagApplied
  | SequenceStarted
  | SequenceCompleted
  | EmailOpened
  | LinkClicked
  | EstimateRequested
```

**PING immediately gains historical intelligence.**

---

## Marketing Loop

```
Google
↓
Landing
↓
Kit
↓
LeadCaptured
↓
EstimateRequested
↓
EstimateAccepted
↓
ProjectCompleted
↓
ReviewCollected
↓
ReferralGenerated
↓
RepeatCustomer
```

Every box is events.

---

## Phase 1 Deliverables

### Marketing (HPP)
- ✅ Landing pages (existing)
- ✅ Kit integration (in progress)
- ✅ Welcome sequence (configured)
- ✅ Lead capture (existing)
- ✅ Estimate funnel (existing)

### Backend (PING)
- ⏸️ Identity Service
- ⏸️ Property Service
- ⏸️ Artifact Service
- ⏸️ Event Service
- ⏸️ Replay API
- ⏸️ Graph Builder
- ⏸️ Classifier API

### Kit Fixes
- ⏸️ Verify tag endpoint against official V4 docs
- ⏸️ Correct response parsing to match documented payloads
- ⏸️ Add pagination handling for subscriber lookups
- ⏸️ Preserve detailed enrollment results instead of boolean
- ⏸️ Verify webhook payloads and signatures

### Architecture
- ⏸️ Create MarketingProvider abstraction
- ⏸️ Implement KitAdapter
- ⏸️ Ensure every Kit action emits canonical events

---

## Implementation Order

1. **MarketingProvider Abstraction** - Freeze Kit adapter interface
2. **KitAdapter Implementation** - Implement MarketingProvider with Kit
3. **Canonical Events** - Define canonical event types
4. **Event Service** - Core append/replay/snapshot
5. **Identity Service** - Customer, Crew, Company
6. **Property Service** - Property, Address, Ownership
7. **Artifact Service** - Universal abstraction
8. **Replay Service** - Aggregate, Property, Customer, Artifact
9. **Graph Service** - Build from events
10. **Classifier Service** - Pluggable classifiers

---

## After Phase 1

Once customers are flowing through HPP, return to architectural harvest:

- Temporal → deterministic workflow execution
- Git → immutable lineage DAG
- GraphRAG → intelligence layer
- OpenTelemetry → replay causality
- Policy engine → replayable automation
- Constitutional scheduler
- Constitutional publisher layer

PING stops looking like a backend and starts looking like a deterministic intelligence platform.
