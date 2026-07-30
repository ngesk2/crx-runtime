# HPP Ownership Audit

**Purpose:** Audit HPP components for compliance with Three-Layer Ownership Model

---

## Three-Layer Ownership Model

### Layer 1 — Platform (PING)
**Owns only universal capabilities.**

**Allowed:**
- Event Runtime
- Replay
- Identity
- Evidence
- Authorities
- Capability Registry
- Observation pipeline
- Knowledge pipeline
- Learning pipeline

**Never owns:**
- Roofing
- HVAC
- Marketing
- Business-specific concepts

### Layer 2 — Business Platform (HPP)
**Owns only blue-collar business concepts.**

**Allowed:**
- Estimates
- Projects
- Customers
- Services
- Newsletter
- Guides
- Resources
- Reviews
- Photos

**Never owns:**
- Replay
- Runtime
- Orchestration
- Constitutional logic

### Layer 3 — Presentation
**Owns:**
- React components
- Pages
- Layouts
- Styling

---

## Audit Results

### ✅ Compliant Components

| Component | Canonical File | Owner | Status |
|-----------|----------------|-------|--------|
| Estimate Service | `website/src/services/estimate.ts` | HPP | ✅ Compliant |
| Project Provider | `website/src/services/projectProvider.ts` | HPP | ✅ Compliant |
| Company Service | `website/src/services/company.ts` | HPP | ✅ Compliant |
| Kit Adapter | `website/src/lib/kit-adapter.ts` | HPP | ✅ Compliant |

### ⚠️ Borderline Components (Review Required)

| Component | Canonical File | Current Owner | Should Be | Issue |
|-----------|----------------|--------------|-----------|-------|
| Analytics | `website/src/services/analytics.ts` | HPP | PING | Could be universal (Observation pipeline) |
| Notification | `website/src/services/notification.ts` | HPP | PING | Could be universal (Notification service) |
| Workflow Engine | `website/src/automation/workflow-engine.ts` | HPP | PING | Could be universal (Orchestration/Runtime) |
| Automation Authority | `website/src/automation/automation-authority.ts` | HPP | PING | Could be universal (Authorities/Orchestration) |

---

## Detailed Analysis

### ✅ Compliant Components

#### 1. Estimate Service
**File:** `website/src/services/estimate.ts`

**Status:** ✅ Compliant

**Reasoning:**
- Business-specific: Estimate submission for roofing services
- Domain-specific: Handles estimate requests, property details, service selection
- Belongs to HPP: Estimates is a blue-collar business concept

**Recommendation:** Keep in HPP.

---

#### 2. Project Provider
**File:** `website/src/services/projectProvider.ts`

**Status:** ✅ Compliant

**Reasoning:**
- Business-specific: Project data for roofing projects
- Domain-specific: Handles project listings and details
- Belongs to HPP: Projects is a blue-collar business concept

**Recommendation:** Keep in HPP.

---

#### 3. Company Service
**File:** `website/src/services/company.ts`

**Status:** ✅ Compliant

**Reasoning:**
- Business-specific: Company data for roofing business
- Domain-specific: Handles company information
- Belongs to HPP: Customers/Company is a blue-collar business concept

**Recommendation:** Keep in HPP.

---

#### 4. Kit Adapter
**File:** `website/src/lib/kit-adapter.ts`

**Status:** ✅ Compliant

**Reasoning:**
- Business-specific: Marketing adapter for Kit API
- Domain-specific: Handles newsletter subscriptions, tags, sequences
- Belongs to HPP: Newsletter is a blue-collar business concept

**Recommendation:** Keep in HPP.

---

### ⚠️ Borderline Components

#### 1. Analytics
**File:** `website/src/services/analytics.ts`

**Status:** ⚠️ Borderline

**Current Implementation:**
- No-op interface for tracking events
- Tracks: EstimateStarted, EstimateSubmitted, PhoneClicked, EmailClicked
- Currently no providers, no SDKs, no network

**Arguments for HPP:**
- Currently tracks business-specific events (EstimateStarted, EstimateSubmitted)
- Implementation is business-specific to HPP

**Arguments for PING:**
- Analytics is a universal capability (Observation pipeline)
- Could be reused across industries
- Should be part of PING's Observation pipeline

**Recommendation:** Move to PING as part of Observation pipeline. HPP should use PING's Analytics service.

---

#### 2. Notification
**File:** `website/src/services/notification.ts`

**Status:** ⚠️ Borderline

**Current Implementation:**
- Interface for sending notifications
- Currently mock implementation (logs to console)
- Server-only implementations

**Arguments for HPP:**
- Currently used for business-specific notifications
- Implementation is business-specific to HPP

**Arguments for PING:**
- Notification is a universal capability
- Could be reused across industries
- Should be part of PING's Notification service

**Recommendation:** Move to PING as universal Notification service. HPP should use PING's Notification service.

---

#### 3. Workflow Engine
**File:** `website/src/automation/workflow-engine.ts`

**Status:** ⚠️ Borderline

**Current Implementation:**
- Capability-based workflow engine for automation
- Executes workflows through automation authority
- Handles workflow templates and executions

**Arguments for HPP:**
- Currently used for business-specific workflows
- Implementation is business-specific to HPP

**Arguments for PING:**
- Workflow orchestration is a universal capability (Runtime/Orchestration)
- Could be reused across industries
- Should be part of PING's Runtime/Orchestration

**Recommendation:** Move to PING as part of Runtime/Orchestration. HPP should use PING's Workflow Engine.

---

#### 4. Automation Authority
**File:** `website/src/automation/automation-authority.ts`

**Status:** ⚠️ Borderline

**Current Implementation:**
- Central authority for routing automation tasks
- Routes to external task providers
- Knows capabilities, not providers directly

**Arguments for HPP:**
- Currently used for business-specific automation
- Implementation is business-specific to HPP

**Arguments for PING:**
- Automation authority is a universal capability (Authorities)
- Could be reused across industries
- Should be part of PING's Authorities

**Recommendation:** Move to PING as part of Authorities. HPP should use PING's Automation Authority.

---

## Required Actions

### Immediate Actions

1. **Move Analytics to PING**
   - Move `website/src/services/analytics.ts` to PING
   - Implement as part of Observation pipeline
   - Update HPP to use PING's Analytics service
   - Register in PING component registry

2. **Move Notification to PING**
   - Move `website/src/services/notification.ts` to PING
   - Implement as universal Notification service
   - Update HPP to use PING's Notification service
   - Register in PING component registry

3. **Move Workflow Engine to PING**
   - Move `website/src/automation/workflow-engine.ts` to PING
   - Implement as part of Runtime/Orchestration
   - Update HPP to use PING's Workflow Engine
   - Register in PING component registry

4. **Move Automation Authority to PING**
   - Move `website/src/automation/automation-authority.ts` to PING
   - Implement as part of Authorities
   - Update HPP to use PING's Automation Authority
   - Register in PING component registry

### Optional Actions

5. **Keep Business-Specific Event Tracking in HPP**
   - If PING's Analytics service is too generic, keep business-specific event tracking in HPP
   - HPP can emit canonical events to PING's Observation pipeline
   - PING's Analytics service handles universal tracking

---

## HPP Service Registry (Post-Audit)

### Layer 2 — Business Platform (HPP)

| Name | Canonical File | Consumers | Status |
|------|----------------|-----------|--------|
| Estimate Service | `website/src/services/estimate.ts` | Presentation | Production |
| Project Provider | `website/src/services/projectProvider.ts` | Presentation | Production |
| Company Service | `website/src/services/company.ts` | Presentation | Production |
| Kit Adapter | `website/src/lib/kit-adapter.ts` | Presentation | Production |

### Services to Move to PING

| Name | Canonical File | Destination | Status |
|------|----------------|-------------|--------|
| Analytics | `website/src/services/analytics.ts` | PING (Observation pipeline) | Pending |
| Notification | `website/src/services/notification.ts` | PING (Notification service) | Pending |
| Workflow Engine | `website/src/automation/workflow-engine.ts` | PING (Runtime/Orchestration) | Pending |
| Automation Authority | `website/src/automation/automation-authority.ts` | PING (Authorities) | Pending |

---

## Constitutional Rules Violated

### Three-Layer Ownership Model
- ⚠️ HPP owns Analytics (should be PING - Observation pipeline)
- ⚠️ HPP owns Notification (should be PING - Notification service)
- ⚠️ HPP owns Workflow Engine (should be PING - Runtime/Orchestration)
- ⚠️ HPP owns Automation Authority (should be PING - Authorities)

### HPP Rule
- ⚠️ These components could be reusable across industries
- ⚠️ These components are not strictly blue-collar business concepts

---

## Next Steps

1. **Update CANONICAL_COMPONENT_REGISTRY.md** with corrected ownership
2. **Move borderline services to PING**
3. **Update HPP service registry**
4. **Update PING service registry**
5. **Audit Presentation components** (next task)
6. **Identify and catalog all duplicate implementations** (following task)
