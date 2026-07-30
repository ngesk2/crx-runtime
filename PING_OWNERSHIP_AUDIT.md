# PING Ownership Audit

**Purpose:** Audit PING components for compliance with Three-Layer Ownership Model

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
| Event Runtime | `src/services/event-service.ts` | PING | ✅ Compliant |
| Identity | `src/services/identity-service.ts` | PING | ✅ Compliant |

### ❌ Non-Compliant Components

| Component | Canonical File | Current Owner | Should Be | Violation |
|-----------|----------------|--------------|-----------|-----------|
| Artifact Service | `src/services/artifact-service.ts` | PING | HPP | Contains business-specific artifact types |
| Property Service | `src/services/property-service.ts` | PING | HPP | Contains roofing-specific concepts |
| Classifier Service | `src/services/classifier-service.ts` | PING | HPP | Contains business-specific classifiers |

---

## Detailed Violations

### 1. Artifact Service
**File:** `src/services/artifact-service.ts`

**Violation:** Contains business-specific artifact types that should belong to HPP.

**Business-Specific Types Found:**
- Estimate (HPP)
- Inspection (HPP)
- Review (HPP)
- Photo (HPP)
- Invoice (HPP)
- Permit (HPP)
- Warranty (HPP)
- Maintenance (HPP)

**Recommendation:** Move Artifact Service to HPP. PING should only provide a generic Artifact capability if needed for universal use.

---

### 2. Property Service
**File:** `src/services/property-service.ts`

**Violation:** Contains roofing-specific concepts that should belong to HPP.

**Roofing-Specific Concepts Found:**
- Property (HPP)
- Address (HPP)
- Ownership Transfer (HPP)
- Geo (HPP)

**Recommendation:** Move Property Service to HPP. PING should not own domain-specific property concepts.

---

### 3. Classifier Service
**File:** `src/services/classifier-service.ts`

**Violation:** Contains business-specific classifiers that should belong to HPP.

**Business-Specific Classifiers Found:**
- Review Quality (HPP)
- Maintenance Risk (HPP)
- Fraud (HPP)

**Potentially Universal:**
- Sentiment (could be universal)
- Urgency (could be universal)

**Recommendation:** Move Classifier Service to HPP. If PING needs universal classifiers, extract only Sentiment and Urgency as a separate universal service.

---

## Required Actions

### Immediate Actions

1. **Move Artifact Service to HPP**
   - Move `src/services/artifact-service.ts` to HPP
   - Update imports in PING services
   - Register in HPP component registry

2. **Move Property Service to HPP**
   - Move `src/services/property-service.ts` to HPP
   - Update imports in PING services
   - Register in HPP component registry

3. **Move Classifier Service to HPP**
   - Move `src/services/classifier-service.ts` to HPP
   - Update imports in PING services
   - Register in HPP component registry

### Optional Actions

4. **Extract Universal Classifiers** (if needed)
   - Create new PING service for universal classifiers
   - Extract only Sentiment and Urgency
   - Keep business-specific classifiers in HPP

---

## PING Service Registry (Post-Audit)

### Layer 1 — Platform (PING)

| Name | Canonical File | Consumers | Status |
|------|----------------|-----------|--------|
| Event Runtime | `src/services/event-service.ts` | HPP, Presentation | Production |
| Identity | `src/services/identity-service.ts` | HPP, Presentation | Production |
| Replay | `src/services/replay-service.ts` | HPP, Presentation | Production |
| Evidence | (to be implemented) | HPP, Presentation | Pending |
| Authorities | (to be implemented) | HPP, Presentation | Pending |
| Capability Registry | (to be implemented) | HPP, Presentation | Pending |
| Observation Pipeline | (to be implemented) | HPP, Presentation | Pending |
| Knowledge Pipeline | (to be implemented) | HPP, Presentation | Pending |
| Learning Pipeline | (to be implemented) | HPP, Presentation | Pending |

### Services to Move to HPP

| Name | Canonical File | Destination | Status |
|------|----------------|-------------|--------|
| Artifact Service | `src/services/artifact-service.ts` | HPP | Pending |
| Property Service | `src/services/property-service.ts` | HPP | Pending |
| Classifier Service | `src/services/classifier-service.ts` | HPP | Pending |

---

## Constitutional Rules Violated

### One Canonical File Rule
- ❌ Artifact Service exists in PING but should be in HPP
- ❌ Property Service exists in PING but should be in HPP
- ❌ Classifier Service exists in PING but should be in HPP

### Three-Layer Ownership Model
- ❌ PING owns business-specific artifact types (Estimate, Inspection, Review, Photo, etc.)
- ❌ PING owns roofing-specific concepts (Property, Address, Ownership)
- ❌ PING owns business-specific classifiers (Review Quality, Maintenance Risk, Fraud)

### HPP Rule
- ❌ These components do not help acquire/convert customers in their current location
- ❌ These components are not reusable across industries in their current form

---

## Next Steps

1. **Update CANONICAL_COMPONENT_REGISTRY.md** with corrected ownership
2. **Move non-compliant services to HPP**
3. **Update PING service registry**
4. **Verify no other PING components violate ownership model**
5. **Audit HPP components** (next task)
6. **Audit Presentation components** (following task)
