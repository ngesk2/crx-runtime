# PRODUCTION_EXECUTION_GRAPH.md

**Repository Root**: C:\Users\nolan\CRX  
**Analysis Date**: 2026-06-11  
**Phase**: PATCH P6 — Production Execution Graph

---

## Execution Trace

### Entrypoint
**File**: runtime/kernel/commit-service/src/server.ts
**Line**: 9
**Route**: POST /kernel/commit
**Handler**: commitArtifact

### Step 1: Server Route
**File**: runtime/kernel/commit-service/src/server.ts:9
```typescript
app.post("/kernel/commit", commitArtifact)
```
**Status**: REACHED

### Step 2: Commit Controller
**File**: runtime/kernel/commit-service/src/api/commit_controller.ts:13
```typescript
const artifactId = computeCanonicalHash(artifact)
```
**Import**: runtime/kernel/commit-service/src/engines/identity_engine.ts
**Status**: REACHED

### Step 3: Identity Engine
**File**: runtime/kernel/commit-service/src/engines/identity_engine.ts:5
```typescript
const canonical = canonicalize(input)
```
**Import**: runtime/kernel/commit-service/src/engines/canonical_engine.ts
**Status**: REACHED

### Step 4: Canonical Engine
**File**: runtime/kernel/commit-service/src/engines/canonical_engine.ts:4
```typescript
return CanonicalJson.canonicalize(value);
```
**Import**: @crx/replay
**Status**: REACHED

### Step 5: CanonicalJson
**File**: runtime/replay/canonical_json.ts:27
```typescript
static canonicalize(value: unknown): string {
  return JSON.stringify(this.canonicalizeValue(value));
}
```
**Status**: REACHED

### Step 6: Hash Generation
**File**: runtime/kernel/commit-service/src/engines/identity_engine.ts:7-12
```typescript
const serialized = JSON.stringify(canonical)

const hash = crypto
  .createHash("sha256")
  .update(serialized)
  .digest("hex")
```
**Status**: REACHED

---

## Execution Chain Summary

```
server.ts (POST /kernel/commit)
  ↓
commit_controller.ts (commitArtifact)
  ↓
identity_engine.ts (computeCanonicalHash)
  ↓
canonical_engine.ts (canonicalize)
  ↓
@crx/replay (CanonicalJson.canonicalize)
  ↓
identity_engine.ts (JSON.stringify)
  ↓
identity_engine.ts (crypto.createHash("sha256"))
  ↓
identity_engine.ts (digest("hex"))
```

---

## Result

**Chain Status**: REACHED

**Evidence**:
- server.ts:9 → commitArtifact (REACHED)
- commit_controller.ts:13 → computeCanonicalHash (REACHED)
- identity_engine.ts:5 → canonicalize (REACHED)
- canonical_engine.ts:4 → CanonicalJson.canonicalize (REACHED)
- identity_engine.ts:7-12 → hash generation (REACHED)

**Conclusion**: Production executes runtime/replay canonicalization through the commit-service path.
