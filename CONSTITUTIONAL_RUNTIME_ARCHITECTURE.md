# Constitutional Runtime Architecture

**Purpose:** PING becomes the reusable constitutional platform for all applications

---

## Architectural Shift

**Before:**
- HPP = Production application with embedded services
- PING = Backend services for HPP only

**After:**
- HPP = Domain application (roofing only)
- PING = Constitutional Runtime platform (all applications)

---

## Constitutional Runtime (PING)

**Generic Infrastructure for All Applications:**

### Core Services
- **Identity Service** - Customer, Crew, Company, Roles (generic entities)
- **Property Service** - Property, Address, Ownership, Geo (generic entities)
- **Artifact Service** - Universal abstraction for all artifacts
- **Event Service** - Append, Replay, Snapshot, Witness, Verify
- **Replay Service** - Universal replay engine for all subsystems
- **Graph Service** - Universal knowledge graph (all entities connected)
- **Classifier Engine** - Pluggable classifier infrastructure
- **Policy Engine** - Rules over classifier outputs
- **Marketing Pipeline** - Event Bus → Marketing → External providers
- **Search Service** - Universal search across all entities
- **Learning Service** - Machine learning and analytics
- **Audit Service** - Audit trail for all operations
- **Witness Service** - Cryptographic proofs of integrity

### Unified Ingestion Pipeline

**All inputs follow one canonical path:**

```
API
CSV
Webhook
Email
SMS
PDF
OCR
Voice
Images
↓
PING Ingestion
↓
Normalize
↓
Canonical Objects
↓
Classifier
↓
Policies
↓
Events
↓
Replay
↓
Graph
↓
Marketing
↓
Learning
```

**Benefits:**
- One validator
- One normalization engine
- One audit trail
- One replay path
- One witness
- One graph update

No subsystem invents its own parsing.

---

## HPP (Domain Application)

**Shrinks to roofing domain only:**

### Domain Services
- **Estimate Domain** - Estimate creation, pricing, approval
- **Project Domain** - Project management, scheduling
- **Insurance Domain** - Insurance claims, policies
- **Permit Domain** - Permit applications, tracking
- **Roof Inspection Domain** - Inspection scheduling, results

### UI
- Website
- Dashboard
- Admin panel

### Business Workflows
- Estimate funnel
- Project lifecycle
- Inspection workflow
- Permit process

### What HPP Does NOT Own
- Identity (PING owns)
- Property (PING owns)
- Artifacts (PING owns)
- Replay (PING owns)
- Classification (PING owns)
- Graph (PING owns)
- Marketing (PING owns)
- Search (PING owns)
- Learning (PING owns)

---

## Marketing Pipeline

**Before:**
```
HPP
↓
Kit
```

**After:**
```
HPP
↓
PING Event Bus
↓
Marketing Pipeline
↓
Kit
Mailchimp
Hubspot
Salesforce
Whatever
```

**HPP never knows Kit exists.**

**HPP emits:**
- LeadCaptured
- EstimateRequested
- ReviewSubmitted
- GuideDownloaded

**PING decides:**
- Tag
- Sequence
- Campaign
- Lead Score
- Learning
- Analytics

---

## Classifier Engine

**Before:**
- HPP owns ReviewQualityClassifier
- HPP owns MaintenanceRiskClassifier

**After:**
- PING owns Classifier Engine
- HPP registers domain classifiers:
  - RoofReviewClassifier
  - MaintenanceRiskClassifier
  - PermitClassifier
  - EstimateQualityClassifier

**PING provides:**
- Classifier infrastructure
- Deterministic execution
- Replay support
- Version tracking

---

## Universal Replay Engine

**PING provides replay for all subsystems:**
- Aggregate Replay
- Timeline Replay
- Customer Replay
- Property Replay
- Artifact Replay
- Workflow Replay
- Policy Replay
- Classifier Replay
- Marketing Replay
- Decision Replay

**Every subsystem can replay.**

---

## Universal Knowledge Graph

**PING builds graph of all entities:**
- Customer
- Property
- Artifact
- Permit
- Estimate
- Crew
- Review
- Policy
- Classifier
- Marketing
- Learning

**Everything is connected.**

---

## Multi-Product Architecture

```
HPP
CRM
Property Mgmt
Fleet Manager
Medical Records
Inventory
│
Constitutional Runtime
│
Replay
Events
Graph
Identity
Policies
Witness
Learning
Marketing
Classification
Search
Storage
```

**PING becomes the operating system for event-sourced applications.**

---

## Constitutional Rules

### HPP Rules
- HPP owns only roofing domain logic
- HPP emits canonical events
- HPP consumes PING projections
- HPP never directly accesses external providers
- HPP never implements generic infrastructure

### PING Rules
- PING owns all generic infrastructure
- PING provides canonical ingestion
- PING provides universal replay
- PING provides universal graph
- PING provides classifier engine
- PING provides marketing pipeline
- PING is domain-agnostic

### Boundary Rules
- HPP depends only on PING APIs
- PING depends on no domain logic
- External providers accessed only through PING
- All events flow through PING Event Bus
- All entities normalized by PING

---

## Implementation Order

### Phase 1: Move Generic Services to PING
1. Move Identity Service to PING
2. Move Property Service to PING
3. Move Artifact Service to PING
4. Move Event Service to PING
5. Move Replay Service to PING
6. Move Graph Service to PING
7. Move Classifier Engine to PING

### Phase 2: Unified Ingestion
1. Build Ingestion Pipeline
2. Build Normalization Engine
3. Build Validator
4. Connect all inputs to Ingestion

### Phase 3: Marketing Pipeline
1. Build Marketing Pipeline in PING
2. Move Kit integration to PING
3. HPP emits events only
4. PING decides marketing actions

### Phase 4: HPP Domain Shrink
1. Remove Kit from HPP
2. Remove generic services from HPP
3. Keep only roofing domain
4. Connect to PING APIs

### Phase 5: Universal Graph
1. Connect all entities to graph
2. Build universal relationships
3. Provide graph queries

### Phase 6: Universal Replay
1. Enable replay for all subsystems
2. Build replay certificates
3. Provide replay API

---

## Benefits

### For HPP
- Smaller codebase
- Focus on domain logic
- No infrastructure maintenance
- Automatic replay support
- Automatic graph intelligence
- Automatic classification
- Automatic marketing

### For PING
- Reusable across products
- Domain-agnostic
- Constitutional guarantees
- Deterministic replay
- Universal graph
- Unified ingestion

### For Future Products
- Instant infrastructure
- Instant replay
- Instant graph
- Instant classification
- Instant marketing
- Instant learning

---

## Long-Term Vision

PING stops looking like a library and starts looking like an operating system.

**Constitutional Runtime = Event-sourced operating system**

**Applications = Domain-specific kernels on top of Constitutional Runtime**

This is the long-term payoff of the constitutional architecture.
