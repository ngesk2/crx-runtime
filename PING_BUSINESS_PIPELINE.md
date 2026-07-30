# PING Business Pipeline

**Purpose:** Define the complete business loop from lead acquisition to learning

---

## The Business Loop

```
Lead
↓
Customer
↓
Property
↓
Artifact
↓
Knowledge
↓
Prediction
↓
Decision
↓
Action
↓
Outcome
↓
Learning
↓
Repeat
```

This is the entire business. Not CRM, not marketing, not inspections. Those are producers.

---

## Stage 1: Lead Acquisition

**Purpose:** Capture potential customers from all sources

**Sources:**
- Website (HPP)
- Google (reviews, ads)
- Referral (word-of-mouth)
- Phone (inbound calls)
- Forms (estimate requests)
- CRM (imported leads)

**Output Events:**
- `LeadCreated`
- `LeadQualified`
- `LeadDisqualified`

**Constitutional Rules:**
- All leads MUST be captured as events
- Lead source MUST be tracked
- Lead qualification MUST be explicit
- No lead data lost

**Producer Responsibility:**
- HPP: Website leads
- Google Adapter: Google leads
- CRM Adapter: CRM leads
- Phone Adapter: Phone leads

---

## Stage 2: Qualification

**Purpose:** Convert leads to customers with associated properties

**Transformation:**
```
Lead → Customer
Lead → Property
```

**Output Events:**
- `CustomerCreated`
- `PropertyCreated`
- `EstimateRequested`

**Constitutional Rules:**
- Customer creation MUST be explicit event
- Property creation MUST be explicit event
- Estimate request MUST be explicit event
- No implicit state changes

**Producer Responsibility:**
- HPP: Qualification logic
- Kit: Marketing automation (sequences, tags)

---

## Stage 3: Operations

**Purpose:** Execute business operations, create artifacts

**Artifacts Created:**
- Estimate
- Inspection
- Project
- Permit
- Invoice
- Warranty
- Review

**Output Events:**
- `EstimateCreated`
- `EstimateAccepted`
- `EstimateRejected`
- `InspectionScheduled`
- `InspectionCompleted`
- `ProjectStarted`
- `ProjectCompleted`
- `PermitIssued`
- `InvoiceSent`
- `InvoicePaid`
- `WarrantyClaimed`
- `ReviewSubmitted`

**Constitutional Rules:**
- Every artifact MUST be created as event
- Artifact state changes MUST be events
- No artifact mutation, only state transitions
- All artifacts immutable once created

**Producer Responsibility:**
- HPP: Estimate, review
- Google: Review
- Operations System: Inspection, project, permit, invoice, warranty

---

## Stage 4: Knowledge

**Purpose:** Build intelligence from artifacts

**Knowledge Graphs:**
- Timeline (chronological event history)
- Graph (entity relationships)
- Entity links (customer ↔ property ↔ project ↔ crew)
- Maintenance history (property lifecycle)
- Material history (materials used across projects)
- Crew history (crew performance across projects)
- Manufacturer history (manufacturer reliability)

**Output Events:**
- `KnowledgeUpdated`
- `GraphRebuilt`
- `TimelineRebuilt`

**Constitutional Rules:**
- Knowledge MUST be derived from events
- Knowledge MUST be rebuildable from events
- Knowledge MUST be deterministic
- No independent knowledge sources

**PING Responsibility:**
- Canonical Artifact Authority: Artifact storage
- Canonical Entity Authority: Entity normalization
- Relationship Graph: Graph construction

---

## Stage 5: Prediction

**Purpose:** Classify and predict using knowledge

**Classifiers:**
- Maintenance Risk (property failure probability)
- Referral Probability (customer referral likelihood)
- Upsell Score (additional service likelihood)
- Insurance Risk (claim probability)
- Customer Lifetime Value (revenue potential)
- Failure Probability (project failure risk)
- Seasonality (timing patterns)

**Output Events:**
- `MaintenanceRiskComputed`
- `ReferralProbabilityComputed`
- `UpsellScoreComputed`
- `InsuranceRiskComputed`
- `CustomerLifetimeValueComputed`
- `FailureProbabilityComputed`
- `SeasonalityComputed`

**Constitutional Rules:**
- Classifiers MUST be deterministic
- Classifiers MUST be pluggable
- Classifiers MUST produce events
- No AI black boxes (explainable predictions)

**PING Responsibility:**
- Classifier Engine: Pluggable deterministic classifiers

---

## Stage 6: Policy

**Purpose:** Make decisions based on predictions

**Policy Examples:**
```
Roof
Age > 18
AND
Failure Risk > 0.8
↓
Schedule Inspection
```

```
Customer
Lifetime Value > $10,000
AND
Referral Probability > 0.7
↓
Send Referral Request
```

```
Project
Upsell Score > 0.8
AND
Seasonality = Spring
↓
Suggest Spring Maintenance Package
```

**Output Events:**
- `InspectionScheduled`
- `ReferralRequested`
- `MaintenancePackageSuggested`
- `InsuranceAlertTriggered`
- `WarrantyReviewTriggered`

**Constitutional Rules:**
- Policies MUST be rules over classifier outputs
- Policies MUST be explicit (no AI)
- Policies MUST be constitutional rules
- Policy decisions MUST produce events
- No implicit policy execution

**PING Responsibility:**
- Policy Engine: Rules over classifier outputs

---

## Stage 7: Publisher

**Purpose:** Distribute information to appropriate channels

**Channels:**
- Email (Kit)
- SMS (Twilio)
- Website (HPP)
- CRM (Salesforce, HubSpot)
- Dashboard (PING UI)
- Analytics (Google Analytics, Mixpanel)
- Calendar (Google Calendar)
- Notifications (Push, in-app)

**Output Events:**
- `EmailSent`
- `SMSSent`
- `WebsiteNotificationDisplayed`
- `CRMRecordUpdated`
- `DashboardUpdated`
- `AnalyticsEventTracked`
- `CalendarEventCreated`
- `NotificationSent`

**Constitutional Rules:**
- Publisher MUST be single output authority
- Publisher MUST decide where information goes
- Publisher MUST produce events for all outputs
- No direct channel access (go through Publisher)
- Channel adapters MUST be isolated

**PING Responsibility:**
- Publisher: Single output authority

---

## Stage 8: Learning

**Purpose:** Capture outcomes and improve predictions

**Outcome Events:**
- `EmailOpened`
- `EmailClicked`
- `EstimateAccepted`
- `EstimateLost`
- `ProjectFinished`
- `ReviewSubmitted`
- `MaintenanceIgnored`
- `WarrantyUsed`
- `ReferralCompleted`
- `UpsellAccepted`
- `UpsellRejected`

**Constitutional Rules:**
- Every outcome MUST be captured as event
- Outcomes MUST feed back into knowledge
- Outcomes MUST improve predictions
- No outcome data lost

**Producer Responsibility:**
- Kit: Email opened, clicked
- HPP: Estimate accepted/lost, review submitted
- Operations: Project finished, warranty used
- Publisher: All delivery outcomes

---

## Constitutional Separation

### HPP Responsibilities
- Producer: Website events
- Adapter: Kit integration
- Event Emitter: Canonical events
- Projection Consumer: Read from PING projections

**HPP MUST NOT:**
- Contain business logic in Kit adapters
- Make predictions
- Execute policies
- Build knowledge graphs
- Publish to channels directly

### PING Responsibilities
- Replay Kernel: Event replay engine
- Graph Engine: Relationship graph construction
- Classifier Engine: Pluggable deterministic classifiers
- Policy Engine: Rules over classifier outputs
- Publisher: Single output authority
- Intelligence Operating System: Complete pipeline orchestration

**PING MUST NOT:**
- Directly interact with website users
- Directly send emails (go through Publisher)
- Directly access CRM (go through Publisher)
- Contain business logic from HPP

---

## Pipeline Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     PRODUCERS                                │
│  HPP │ Google │ CRM │ Phone │ Operations │ Kit              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
                    ┌───────────────┐
                    │  Event Stream  │
                    └───────┬───────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      PING KERNEL                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │  Artifact     │  │   Entity      │  │  Relationship  │  │
│  │  Authority    │  │   Authority   │  │    Graph       │  │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  │
│          │                  │                  │            │
│          └──────────────────┴──────────────────┘            │
│                            │                                 │
│                            ↓                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │  Classifier   │  │   Policy      │  │   Publisher    │  │
│  │   Engine      │  │   Engine      │  │               │  │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  │
│          │                  │                  │            │
│          └──────────────────┴──────────────────┘            │
│                            │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ↓
                    ┌───────────────┐
                    │  Projections  │
                    └───────┬───────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    CONSUMERS                                  │
│  HPP │ Kit │ CRM │ Dashboard │ Analytics │ Calendar          │
└─────────────────────────────────────────────────────────────┘
```

---

## Replay Certificates

**Purpose:** Prove that the entire pipeline reproduced the same outcome

**Certificate Contents:**
- Event stream hash
- Classifier versions
- Policy versions
- Publisher versions
- Outcome hash

**Constitutional Rules:**
- Every pipeline execution MUST produce certificate
- Certificate MUST verify reproducibility
- Certificate MUST be stored with outcome
- Replay MUST produce identical certificate

---

## Boundary Check

**Purpose:** Ensure constitutional boundaries are respected

**Checks:**
- HPP contains no business logic
- Kit adapters contain no business logic
- PING contains no direct channel access
- All state changes are events
- All predictions are deterministic
- All policies are explicit rules
- Publisher is single output authority

**Constitutional Rules:**
- Boundary checks MUST run on deployment
- Boundary checks MUST run on replay
- Boundary violations MUST fail deployment
- Boundary violations MUST fail replay

---

## Next Steps

### Phase 1: Stabilize HPP
- Verify Kit V4 endpoints and payloads
- Verify Kit webhook behavior
- Verify Kit tag and sequence behavior
- Verify Kit duplicate handling
- Verify Kit retry behavior
- Verify Kit failure responses
- Ensure no business logic in Kit adapters
- Commit HPP (freeze constitutional boundary)

### Phase 2: Build PING Cores
1. Canonical Artifact Authority
2. Canonical Entity Authority
3. Relationship Graph
4. Classifier Engine
5. Policy Engine
6. Publisher
7. Replay Certificates
8. Boundary Check

### Phase 3: Integrate Pipeline
- Connect HPP to PING event stream
- Build projections for HPP
- Implement classifiers
- Implement policies
- Implement publisher
- Implement learning loop

---

## Blocking Issues

None - This is architectural documentation, no implementation required.
