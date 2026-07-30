# Phase 7 - Infrastructure Sovereignty

**Objective:** Inventory every gateway resolution

**Expected Convergence:**
```
Component
    ↓
Gateway Library
    ↓
Gateway Authority
    ↓
Gateway
```

**Acceptance Criteria:** No component constructs URLs, No hardcoded topology

---

## Gateway Resolution Inventory

**Repository:** `crx-ui-next` (separate repository from constitutional-runtime)

**Note:** This audit is based on findings from the convergence audit addendum. The crx-ui-next repository is not in the current workspace.

---

### 1. Shared Gateway Library

**Location:** `src/lib/gateway.ts`
**Type:** ✅ **Constitutional**
**Authority Owner:** Gateway Library (Constitutional Authority)
**Current Usage:**
- Uses `NEXT_PUBLIC_GATEWAY_URL` with fallback
- Provides centralized.gateway resolution

**Gateway Resolution:**
```typescript
// Constitutional gateway resolution
const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8080';
```

**Constitutional Status:** ✅ This is the intended canonical gateway resolution

**Action:** ✅ **Preserve** - This is the intended gateway authority

---

### 2. Inline Environment Variable

**Location:** Multiple files
**Type:** ⚠ **Authority Duplication**
**Authority Owner:** Individual Components
**Current Usage:**
- Two write paths duplicate gateway resolution
- Components read `NEXT_PUBLIC_GATEWAY_URL` directly

**Gateway Resolution:**
```typescript
// Inline environment variable (authority duplication)
const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL;
```

**Constitutional Violation:** Authority duplication - should use shared Gateway Library

**Action:** ❌ **Harvest** - Route through Gateway Library

---

### 3. Hardcoded Gateway Constant

**Location:** `CockpitDashboard.tsx`
**Type:** ❌ **Constitutional Violation**
**Authority Owner:** CockpitDashboard Component
**Current Usage:**
```typescript
// Hardcoded gateway constant
const GATEWAY_URL = 'http://localhost:8080';
```

**Constitutional Violation:** Completely bypasses constitutional configuration

**Action:** ❌ **Harvest** - Use Gateway Library

---

### 4. Hardcoded Fetch URLs

**Location:** Multiple files
**Type:** ❌ **Constitutional Violation**
**Authority Owner:** Individual Components
**Current Usage:**
- Multiple files directly call `http://localhost:8080`
- Ignore environment configuration

**Affected Files:**
- command-center
- chat
- CockpitDashboard

**Gateway Resolution:**
```typescript
// Hardcoded fetch URLs
fetch('http://localhost:8080/api/...')
```

**Constitutional Violation:** Components construct URLs independently

**Action:** ❌ **Harvest** - Use Gateway Library

---

## Gateway Resolution Summary

**Total Gateway Resolution Patterns:** 4
**✅ Constitutional:** 1 (Shared Gateway Library)
**❌ Alternative:** 3 (Inline Environment Variable, Hardcoded Constant, Hardcoded Fetch URLs)

---

## Gateway Resolution Classification

### Constitutional Gateway Authority
- ✅ Shared Gateway Library (src/lib/gateway.ts) - Preserve

### Alternative Gateway Resolution (Harvest Targets)
- ❌ Inline Environment Variable - Harvest
- ❌ Hardcoded Gateway Constant - Harvest
- ❌ Hardcoded Fetch URLs - Harvest

---

## Environment Audit

### Status: ⚠ **Missing**

**Finding:**
- No `.env` files exist
- No `.env.local` files exist

**Consequence:**
- Local execution silently falls back to `localhost:8080`
- Creates implicit runtime assumptions

**Action:** ❌ **Add** - Create environment configuration files

---

## Docker Audit

### Status: ⚠ **Partial**

**Finding:**
- Docker Compose correctly injects `NEXT_PUBLIC_GATEWAY_URL=http://gateway:8080`
- However, hardcoded localhost URLs ignore Docker DNS

**Consequence:**
- Runtime divergence between local execution and Docker execution

**Action:** ❌ **Fix** - Remove hardcoded localhost URLs, use environment configuration

---

## Proxy Layer

### Status: ❌ **Missing**

**Finding:**
- No `next.config.js` `rewrites()` configuration exists
- Browser communicates directly with Gateway

**Consequences:**
- CORS dependency
- Duplicated gateway resolution
- Frontend owns infrastructure topology

**Action:** ❌ **Add** - Implement Next.js gateway rewrite/proxy

---

## Constitutional Violation Analysis

### Gateway Authority Fragmentation
**Issue:** 4 competing gateway resolution authorities
**Problem:** Configuration drift, frontend owns infrastructure topology
**Constitutional Rule:** Gateway Authority must be singular

**Current Flow:**
```
Component
    ↓
4 competing authorities:
    - Shared Gateway Library
    - Inline Environment Variable
    - Hardcoded Constant
    - Hardcoded Fetch URLs
    ↓
Configuration Drift
```

**Constitutional Flow:**
```
Component
    ↓
Gateway Library
    ↓
NEXT_PUBLIC_GATEWAY_URL
    ↓
Gateway
```

---

## Acceptance Criteria Status

- [x] Complete inventory of gateway resolution - ✅ 4 resolution patterns identified
- [ ] No component constructs URLs - ❌ 3 URL construction violations
- [ ] No hardcoded topology - ❌ Hardcoded URLs exist

---

## Required Actions

### 1. Harvest Inline Environment Variable
**Target:** Components with inline environment variable reads
**Action:** Route through Gateway Library
**Disposition:** Components become Gateway Library clients

### 2. Harvest Hardcoded Gateway Constant
**Target:** CockpitDashboard.tsx
**Action:** Remove hardcoded GATEWAY_URL, use Gateway Library
**Disposition:** Component becomes Gateway Library client

### 3. Harvest Hardcoded Fetch URLs
**Target:** command-center, chat, CockpitDashboard
**Action:** Remove hardcoded URLs, use Gateway Library
**Disposition:** Components become Gateway Library clients

### 4. Add Environment Configuration
**Target:** crx-ui-next repository
**Action:** Create `.env` and `.env.local` files
**Disposition:** Explicit environment configuration

### 5. Fix Docker Configuration
**Target:** Docker Compose
**Action:** Ensure environment configuration works in Docker
**Disposition:** Docker and local execution converge

### 6. Add Next.js Gateway Proxy
**Target:** next.config.js
**Action:** Implement rewrites() for gateway proxy
**Disposition:** Browser → Next.js → Gateway Proxy → Gateway

---

## Disposition

**Finding:** Infrastructure Law Drift
**Status:** ❌ **Confirmed** - 3 alternative gateway resolution authorities exist
**Evidence:** Convergence audit addendum findings
**Action:** Harvest all alternative gateway resolution to Gateway Library

**Constitutional Target:**
```
Browser
    ↓
Next.js
    ↓
Gateway Proxy
    ↓
Gateway
    ↓
Oracle
```

**Current State:**
```
Browser
    ↓
4 competing gateway authorities
    ↓
Configuration Drift
    ↓
Infrastructure Constitutional Fragmentation
```

**Note:** This audit requires access to the crx-ui-next repository to implement the required changes. The constitutional-runtime repository does not contain the frontend code.
