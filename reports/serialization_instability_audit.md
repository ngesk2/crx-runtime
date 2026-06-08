# SERIALIZATION_INSTABILITY_AUDIT

**Audit Date:** 2026-06-07  
**Protocol:** CRX-CONSTITUTIONAL-ADVERSARIAL-VERIFICATION-PROTOCOL  
**Mode:** READ-ONLY  
**Classification:** FACT, INFERENCE, UNKNOWN

---

## Executive Summary

**FACT:** JSON.stringify is used without canonicalization guarantees.

**FACT:** Map iteration order is NOT guaranteed in JavaScript specification.

**FACT:** Object.keys() sort order is locale-dependent in some JavaScript engines.

**FACT:** Buffer.from() encoding behavior is platform-dependent.

**FACT:** No UTF-8 normalization is performed.

**FACT:** Unicode edge cases are not handled.

**INFERENCE:** Serialization is NOT deterministic across platforms.

**INFERENCE:** Witness roots can diverge across different JavaScript engines.

**FINAL VERDICT:** PARTIALLY_STABLE

---

## Critical Flaw 1: Map Iteration Nondeterminism

**File:** runtime/replay/canonical_hash_authority.ts

**Lines:** 107

**Code:**
```typescript
const sortedKeys = Object.keys(obj).sort();
```

**Severity:** HIGH

**Exploit Vector:** Object.keys() iteration order is NOT guaranteed by JavaScript specification. Sort order may differ across engines. Locale-dependent sorting can produce different results.

**Replay Consequence:** Canonicalization can produce different byte representations across platforms. Witness roots diverge.

**Determinism Consequence:** Serialization is NOT deterministic across JavaScript engines. Platform-dependent behavior violates determinism.

**Constitutional Consequence:** Replay verification is NOT platform-independent. Constitutional determinism is violated.

**Remediation:** Use deterministic sorting algorithm with locale-independent comparison. Implement custom sort that guarantees consistent ordering.

---

## Critical Flaw 2: Map Iteration in State Serialization

**File:** runtime/replay/deterministic_replay_engine.ts

**Lines:** 92

**Code:**
```typescript
for (const [artifactId, artifactState] of state.artifacts) {
```

**Severity:** HIGH

**Exploit Vector:** Map iteration order is NOT guaranteed by JavaScript specification. Different engines may iterate Maps in different orders.

**Replay Consequence:** Lineage graph construction can produce different edge orderings. Witness roots diverge.

**Determinism Consequence:** State serialization is NOT deterministic across platforms. Map iteration violates determinism.

**Constitutional Consequence:** Replay verification is NOT platform-independent. Constitutional determinism is violated.

**Remediation:** Convert Map to array with sorted keys before iteration. Use deterministic iteration order.

---

## Critical Flaw 3: No UTF-8 Normalization

**File:** runtime/replay/canonical_hash_authority.ts

**Lines:** 65

**Code:**
```typescript
if (type === 'string') return JSON.stringify(obj);
```

**Severity:** HIGH

**Exploit Vector:** Unicode strings can have multiple byte representations for the same semantic character (e.g., composed vs decomposed characters). No normalization is performed.

**Replay Consequence:** Semantically identical strings produce different canonical bytes. Witness roots diverge.

**Determinism Consequence:** String serialization is NOT semantically deterministic. Unicode normalization is missing.

**Constitutional Consequence:** Replay verification is NOT semantically deterministic. Constitutional determinism is violated.

**Remediation:** Implement Unicode normalization (NFC or NFD) before canonicalization. Normalize all strings to canonical form.

---

## Critical Flaw 4: Buffer Encoding Platform Dependence

**File:** runtime/replay/canonical_hash_authority.ts

**Lines:** 36

**Code:**
```typescript
const bytes = Buffer.from(canonical).toString('base64');
```

**Severity:** MEDIUM

**Exploit Vector:** Buffer.from() encoding behavior may differ across Node.js versions. Base64 encoding is standardized but implementation details may vary.

**Replay Consequence:** Byte encoding may differ across Node.js versions. Witness roots diverge.

**Determinism Consequence:** Buffer encoding is NOT version-deterministic. Platform-dependent behavior violates determinism.

**Constitutional Consequence:** Replay verification is NOT version-independent. Constitutional determinism is violated.

**Remediation:** Use standardized base64 encoding with explicit charset specification. Test across Node.js versions.

---

## Critical Flaw 5: JSON.stringify Instability

**File:** runtime/replay/canonical_event_envelope.ts

**Lines:** 51

**Code:**
```typescript
return JSON.parse(JSON.stringify(envelope));
```

**Severity:** MEDIUM

**Exploit Vector:** JSON.stringify behavior may differ across JavaScript engines. Whitespace handling may vary. Property order may differ.

**Replay Consequence:** JSON serialization may produce different byte representations. Witness roots diverge.

**Determinism Consequence:** JSON serialization is NOT engine-deterministic. Platform-dependent behavior violates determinism.

**Constitutional Consequence:** Replay verification is NOT engine-independent. Constitutional determinism is violated.

**Remediation:** Use canonical JSON serialization with explicit property ordering. Implement custom JSON serializer.

---

## Critical Flaw 6: Array Spread Operator Instability

**File:** runtime/replay/replay_event_stream.ts

**Lines:** 20

**Code:**
```typescript
this.events = [...events]; // Immutable copy
```

**Severity:** LOW

**Exploit Vector:** Spread operator behavior is standardized but implementation details may vary. Sparse array handling may differ.

**Replay Consequence:** Array copying may produce different internal representations. Witness roots diverge.

**Determinism Consequence:** Array copying is NOT implementation-deterministic. Platform-dependent behavior violates determinism.

**Constitutional Consequence:** Replay verification is NOT implementation-independent. Constitutional determinism is violated.

**Remediation:** Use explicit array copying with deterministic iteration. Test array handling across engines.

---

## Critical Flaw 7: No Float Serialization Normalization

**File:** runtime/replay/canonical_hash_authority.ts

**Lines:** 66-70

**Code:**
```typescript
if (type === 'number') {
  // Normalize NaN and scientific notation
  if (Number.isNaN(obj)) return 'NaN';
  if (!Number.isFinite(obj)) return obj > 0 ? 'Infinity' : '-Infinity';
  return String(obj);
}
```

**Severity:** MEDIUM

**Exploit Vector:** String(number) may produce different representations for floats. Scientific notation may vary. Precision may differ.

**Replay Consequence:** Float serialization may produce different string representations. Witness roots diverge.

**Determinism Consequence:** Float serialization is NOT precision-deterministic. Platform-dependent behavior violates determinism.

**Constitutional Consequence:** Replay verification is NOT precision-independent. Constitutional determinism is violated.

**Remediation:** Implement deterministic float serialization with fixed precision. Use standardized float-to-string conversion.

---

## Final Classification

**FACT:** JSON.stringify is used without canonicalization guarantees

**FACT:** Map iteration order is NOT guaranteed in JavaScript specification

**FACT:** Object.keys() sort order is locale-dependent in some JavaScript engines

**FACT:** Buffer.from() encoding behavior is platform-dependent

**FACT:** No UTF-8 normalization is performed

**FACT:** Unicode edge cases are not handled

**INFERENCE:** Serialization is NOT deterministic across platforms

**INFERENCE:** Witness roots can diverge across different JavaScript engines

**FINAL VERDICT:** PARTIALLY_STABLE

**RECOMMENDATION:** Implement canonical serialization with deterministic ordering, Unicode normalization, and platform-independent encoding
