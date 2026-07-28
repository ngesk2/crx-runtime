# Surgical Patch Implementation Guide

**Scope:** Layer 0 replay kernel constitutional authority restoration  
**Strategy:** Minimal code movement, no rewrites, delegations only  
**Target:** Four surgical patches in strict order  

---

## Patch 1: Create ByteAuthority (No Implementation Yet — Design Only)

### File to Create
`runtime/replay/byte_authority.ts`

### Responsibility
- Centralized byte encoding/decoding
- UTF-8, hex, base64, base64url semantics
- Buffer concatenation governance
- Replaces: 15+ `Buffer.from()`, 5+ `Buffer.toString()`, 3+ `Buffer.concat()` calls

### Planned Implementation
```typescript
/**
 * BYTE AUTHORITY
 * 
 * Pure TypeScript implementation of byte encoding/decoding governance.
 * Unified byte semantics for deterministic replay.
 */

export class ByteAuthority {
  /**
   * UTF-8 encoding
   */
  static encodeUtf8(str: string): Buffer {
    return Buffer.from(str, 'utf8');
  }

  /**
   * UTF-8 decoding
   */
  static decodeUtf8(buf: Buffer): string {
    return buf.toString('utf8');
  }

  /**
   * Hex encoding
   */
  static encodeHex(buf: Buffer): string {
    return buf.toString('hex');
  }

  /**
   * Hex decoding
   */
  static decodeHex(hex: string): Buffer {
    return Buffer.from(hex, 'hex');
  }

  /**
   * Base64 encoding
   */
  static encodeBase64(buf: Buffer): string {
    return buf.toString('base64');
  }

  /**
   * Base64 decoding
   */
  static decodeBase64(b64: string): Buffer {
    return Buffer.from(b64, 'base64');
  }

  /**
   * Base64url encoding
   */
  static encodeBase64url(buf: Buffer): string {
    return buf.toString('base64url');
  }

  /**
   * Base64url decoding
   */
  static decodeBase64url(b64url: string): Buffer {
    return Buffer.from(b64url, 'base64url');
  }

  /**
   * Buffer concatenation
   */
  static concat(buffers: Buffer[]): Buffer {
    return Buffer.concat(buffers);
  }

  /**
   * Create Merkle leaf with UTF-8 bytes
   */
  static createUtf8Leaf(leaf_id: string, value: string): { leaf_bytes: Buffer } {
    return {
      leaf_bytes: this.encodeUtf8(value)
    };
  }

  /**
   * Create Merkle leaf with hex-decoded bytes
   */
  static createHexLeaf(leaf_id: string, hex: string): { leaf_bytes: Buffer } {
    return {
      leaf_bytes: this.decodeHex(hex)
    };
  }

  /**
   * Create Merkle leaf with base64url-decoded bytes
   */
  static createBase64urlLeaf(leaf_id: string, b64url: string): { leaf_bytes: Buffer } {
    return {
      leaf_bytes: this.decodeBase64url(b64url)
    };
  }
}
```

### Surgical Impact
- **Lines added:** 80
- **Files modified:** 1 (new file)
- **Breaking changes:** None (new class, no API changes)

### Acceptance Criteria
- [ ] All methods are static (no state)
- [ ] No Buffer operations leak outside this class
- [ ] Clear governance comments on each method

---

## Patch 2: Create ReplayDomains Registry (No Implementation Yet — Design Only)

### File to Create
`runtime/replay/replay_domains.ts`

### Responsibility
- Centralized, immutable domain registry
- Replaces: Missing FINGERPRINT_DOMAINS
- Reference: `constitutional-integration-lab/extracted/js_txt/canonical_fingerprint_service.js:44–75`

### Planned Implementation
```typescript
/**
 * REPLAY DOMAINS
 * 
 * Frozen domain registry for fingerprint governance.
 * Constitutional: immutable, single authority.
 */

export const FINGERPRINT_DOMAINS = Object.freeze({
  SNAPSHOT: "SNAPSHOT",
  ARTIFACT: "ARTIFACT",
  DIFF: "DIFF",
  RELATIONSHIP: "RELATIONSHIP",
  ANCHOR: "ANCHOR",
  DRIFT_REPORT: "DRIFT_REPORT",
  EXECUTION_RECORD: "EXECUTION_RECORD",
  EXECUTION_FAILURE: "EXECUTION_FAILURE",
  EXECUTION_ID: "EXECUTION_ID",
  EXECUTION_ENVELOPE: "EXECUTION_ENVELOPE",
  SCHEDULER: "SCHEDULER",
  SCHEDULER_SUMMARY: "SCHEDULER_SUMMARY",
  PLUGIN_SEED: "PLUGIN_SEED",
  TIMEOUT: "TIMEOUT",
  CAPABILITY_DECLARATION: "CAPABILITY_DECLARATION",
  STRUCTURAL_NODE: "STRUCTURAL_NODE",
  PROJECTION: "PROJECTION",
  DIFF_ARTIFACT: "DIFF_ARTIFACT"
});

// Immutable domain set for O(1) validation
const DOMAIN_SET = new Set(Object.values(FINGERPRINT_DOMAINS));
Object.freeze(DOMAIN_SET);

export const FINGERPRINT_SCHEMA_VERSION = "fingerprint.schema.3.0";
export const HASH_ALGORITHM = "SHA-256";

/**
 * Validate domain against registry
 */
export function validateDomain(domain: string): void {
  if (!DOMAIN_SET.has(domain)) {
    throw new Error(`Invalid fingerprint domain: ${domain}`);
  }
}
```

### Surgical Impact
- **Lines added:** 50
- **Files modified:** 1 (new file)
- **Breaking changes:** None

### Acceptance Criteria
- [ ] All domains are strings (no enums, no tuples)
- [ ] Frozen with `Object.freeze()`
- [ ] `validateDomain()` available for consumers

---

## Patch 3: Create FingerprintAuthority (No Implementation Yet — Design Only)

### File to Create
`runtime/replay/fingerprint_authority.ts`

### Responsibility
- Restore single hash authority
- Domain-separated fingerprinting
- Runtime abstraction (WebCrypto + Node.js fallback)
- Reference: `constitutional-integration-lab/extracted/js_txt/canonical_fingerprint_service.js:140–478`

### Planned Implementation (Skeleton)
```typescript
/**
 * FINGERPRINT AUTHORITY
 * 
 * Pure TypeScript implementation of deterministic, domain-separated SHA-256 hashing.
 * Ported from canonical_fingerprint_service.js.
 * 
 * CONSTITUTIONAL GUARANTEE: Single hash authority for deterministic replay.
 */

import { FINGERPRINT_DOMAINS, FINGERPRINT_SCHEMA_VERSION, HASH_ALGORITHM, validateDomain } from './replay_domains';
import { ByteAuthority } from './byte_authority';
import { CanonicalJson } from './canonical_json';

export class FingerprintAuthority {
  /**
   * Canonicalize and hash with domain separation
   */
  static async fingerprintWithDomain(domain: string, value: any): Promise<string> {
    validateDomain(domain);
    
    const canonical = CanonicalJson.canonicalize(value);
    const preimage = this.buildPreimage(domain, canonical);
    
    return await this.sha256Hex(preimage);
  }

  /**
   * Verify fingerprint
   */
  static async verifyFingerprint(expected: string, value: any): Promise<boolean> {
    const computed = await this.fingerprintWithDomain(FINGERPRINT_DOMAINS.SNAPSHOT, value);
    return computed === expected;
  }

  /**
   * Hash bytes directly
   */
  static async hashBytes(bytes: Buffer, domain: string): Promise<string> {
    validateDomain(domain);
    
    const hex = ByteAuthority.encodeHex(bytes);
    const preimage = this.buildPreimage(domain, hex);
    
    return await this.sha256Hex(preimage);
  }

  /**
   * Build length-prefixed preimage
   */
  private static buildPreimage(domain: string, canonicalString: string): string {
    const schemaPart = this.lengthPrefix(FINGERPRINT_SCHEMA_VERSION);
    const domainPart = this.lengthPrefix(domain);
    const payloadPart = this.lengthPrefix(canonicalString);
    
    return schemaPart + domainPart + payloadPart;
  }

  /**
   * Length-prefix helper
   */
  private static lengthPrefix(str: string): string {
    return str.length + "|" + str;
  }

  /**
   * SHA-256 with runtime abstraction
   */
  private static async sha256Hex(inputString: string): Promise<string> {
    // Try WebCrypto first (browser-compatible)
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(inputString);
        const buffer = await globalThis.crypto.subtle.digest(HASH_ALGORITHM, data);
        return Array.from(new Uint8Array(buffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      } catch {
        // Fall through to Node.js
      }
    }

    // Fallback to Node.js crypto
    try {
      const crypto = await import('crypto');
      return crypto
        .createHash('sha256')
        .update(inputString, 'utf8')
        .digest('hex');
    } catch {
      throw new Error('No compatible crypto implementation available');
    }
  }
}
```

### Surgical Impact
- **Lines added:** 100–120
- **Files modified:** 1 (new file)
- **Breaking changes:** None

### Acceptance Criteria
- [ ] Single `crypto.createHash()` location
- [ ] Runtime abstraction implemented (WebCrypto + Node fallback)
- [ ] All hash calls routed through FingerprintAuthority
- [ ] Domain validation enforced
- [ ] Async-only hashing (matches legacy)

---

## Patch 4: Update MerkleTree to Delegate (Minimal, Surgical Only)

### File to Modify
`runtime/replay/merkle_tree.ts`

### Current State (Fragment 1)
```typescript
// Lines 250–252: Private hash method
private hashBytes(bytes: Buffer, isLeaf: boolean = true): string {
  const prefix = isLeaf ? Buffer.from([HASH_DOMAIN_LEAF]) : Buffer.from([HASH_DOMAIN_PARENT]);
  const combined = Buffer.concat([prefix, bytes]);
  return crypto.createHash('sha256').update(combined).digest('hex');
}
```

### Planned Change (Fragment 1)
```typescript
// IMPORT at top
import { FingerprintAuthority } from './fingerprint_authority';
import { ByteAuthority } from './byte_authority';
import { FINGERPRINT_DOMAINS } from './replay_domains';

// REPLACE: Lines 250–252
private async hashBytes(bytes: Buffer, isLeaf: boolean = true): Promise<string> {
  const domain = isLeaf ? 'MERKLE_LEAF' : 'MERKLE_PARENT';
  
  // If MERKLE_LEAF/MERKLE_PARENT not in FINGERPRINT_DOMAINS, define locally:
  const prefix = isLeaf 
    ? ByteAuthority.encodeUtf8('LEAF')
    : ByteAuthority.encodeUtf8('PARENT');
  const combined = ByteAuthority.concat([prefix, bytes]);
  
  return await FingerprintAuthority.hashBytes(combined, domain);
}
```

### Current State (Fragment 2)
```typescript
// Lines 267–269: Static hash parent method
private static hashParent(left: Buffer, right: Buffer): string {
  const prefix = Buffer.from([HASH_DOMAIN_PARENT]);
  const combined = Buffer.concat([prefix, left, right]);
  return crypto.createHash('sha256').update(combined).digest('hex');
}
```

### Planned Change (Fragment 2)
```typescript
private static async hashParent(left: Buffer, right: Buffer): Promise<string> {
  const prefix = ByteAuthority.encodeUtf8('PARENT');
  const combined = ByteAuthority.concat([prefix, left, right]);
  return await FingerprintAuthority.hashBytes(combined, 'MERKLE_PARENT');
}
```

### Impact Assessment
- **Lines changed:** ~15 (2 methods + imports)
- **Breaking changes:** ASYNC (must update call sites)
- **Risk:** MEDIUM (async propagation required)

---

## Patch 5: Update CanonicalHashAuthority Delegation (Minimal)

### File to Modify
`runtime/replay/canonical_hash_authority.ts`

### Current State
```typescript
// Lines 67–74
private hashBytes(bytes: string): string {
  const buffer = Buffer.from(bytes, 'base64url');
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  return `${this.hashAlgorithm}:${hash}`;
}
```

### Planned Change
```typescript
// IMPORT
import { FingerprintAuthority } from './fingerprint_authority';
import { ByteAuthority } from './byte_authority';

// REPLACE: Lines 67–74
private async hashBytes(bytes: string): Promise<string> {
  const buffer = ByteAuthority.decodeBase64url(bytes);
  const hash = await FingerprintAuthority.hashBytes(buffer, 'ARTIFACT');
  return `${this.hashAlgorithm}:${hash}`;
}
```

### Impact Assessment
- **Lines changed:** ~8
- **Breaking changes:** ASYNC
- **Risk:** MEDIUM (async propagation)

---

## Patch 6: Update WitnessAuthority Byte Delegation (Moderate)

### File to Modify
`runtime/replay/witness_authority.ts`

### Current State (Fragment)
```typescript
// Lines 119–192: Direct byte construction in computeWitnessRoot
const baseLeaves: MerkleLeaf[] = [
  {
    leaf_id: toWitnessLeafId('canonical_bytes'),
    leaf_bytes: Buffer.from(canonicalBytes.bytes, 'base64url'),
  },
  {
    leaf_id: toWitnessLeafId('fingerprint'),
    leaf_bytes: Buffer.from(fingerprint.hash.replace(/^sha256:/, ''), 'hex'),
  },
  {
    leaf_id: toWitnessLeafId('lineage'),
    leaf_bytes: CanonicalJson.toBuffer(lineage),
  },
  {
    leaf_bytes: Buffer.from(state.state_version, 'utf8'),
  },
  // ... 8 more Buffer.from() calls
];
```

### Planned Change
```typescript
// IMPORT
import { ByteAuthority } from './byte_authority';

// Create helper method
private createUtf8Leaf(leaf_id: WitnessLeafId, value: string): MerkleLeaf {
  return {
    leaf_id,
    leaf_bytes: ByteAuthority.encodeUtf8(value),
    leaf_hash: ''
  };
}

private createHexLeaf(leaf_id: WitnessLeafId, hex: string): MerkleLeaf {
  return {
    leaf_id,
    leaf_bytes: ByteAuthority.decodeHex(hex),
    leaf_hash: ''
  };
}

private createBase64urlLeaf(leaf_id: WitnessLeafId, b64url: string): MerkleLeaf {
  return {
    leaf_id,
    leaf_bytes: ByteAuthority.decodeBase64url(b64url),
    leaf_hash: ''
  };
}

// REPLACE: Lines 119–192
const baseLeaves: MerkleLeaf[] = [
  this.createBase64urlLeaf(toWitnessLeafId('canonical_bytes'), canonicalBytes.bytes),
  this.createHexLeaf(toWitnessLeafId('fingerprint'), fingerprint.hash.replace(/^sha256:/, '')),
  {
    leaf_id: toWitnessLeafId('lineage'),
    leaf_bytes: CanonicalJson.toBuffer(lineage),
    leaf_hash: ''
  },
  this.createUtf8Leaf(toWitnessLeafId('state_version'), state.state_version),
  this.createUtf8Leaf(toWitnessLeafId('schema_version'), '1.0'),
  this.createUtf8Leaf(toWitnessLeafId('replay_version'), '1.0'),
  this.createUtf8Leaf(toWitnessLeafId('policy_version'), '1.0'),
  this.createUtf8Leaf(toWitnessLeafId('canonicalization_version'), '1.0'),
  this.createUtf8Leaf(toWitnessLeafId('hash_version'), 'sha256'),
  this.createUtf8Leaf(toWitnessLeafId('artifact_count'), state.artifacts.size.toString()),
  // ... remaining leaves follow same pattern
];
```

### Impact Assessment
- **Lines added:** ~20 (3 leaf factory methods)
- **Lines changed:** ~15 (delegation calls)
- **Breaking changes:** None (internal methods)
- **Risk:** LOW

---

## Patch 7: Update CanonicalJson (Byte Delegation)

### File to Modify
`runtime/replay/canonical_json.ts`

### Current State
```typescript
// Line 169–171
static toBuffer(value: unknown): Buffer {
  const canonical = CanonicalJson.canonicalize(value);
  return Buffer.from(canonical, 'utf8');
}
```

### Planned Change
```typescript
// IMPORT
import { ByteAuthority } from './byte_authority';

// REPLACE: Line 169–171
static toBuffer(value: unknown): Buffer {
  const canonical = CanonicalJson.canonicalize(value);
  return ByteAuthority.encodeUtf8(canonical);
}
```

### Impact Assessment
- **Lines changed:** 1
- **Breaking changes:** None
- **Risk:** NONE (pure delegation)

---

## Patch 8: Update CanonicalEventEnvelope (Byte Delegation)

### File to Modify
`runtime/replay/canonical_event_envelope.ts`

### Current State
```typescript
// Line 115
return Buffer.from(CanonicalJson.canonicalize(this.envelope)).toString('base64');
```

### Planned Change
```typescript
// IMPORT
import { ByteAuthority } from './byte_authority';

// REPLACE: Line 115
return ByteAuthority.encodeBase64(
  ByteAuthority.encodeUtf8(CanonicalJson.canonicalize(this.envelope))
);
```

### Impact Assessment
- **Lines changed:** 2
- **Breaking changes:** None
- **Risk:** NONE

---

## Patch 9: Verify ConstitutionalSelfCheck (Hash Delegation)

### File to Review
`runtime/replay/constitutional_self_check.ts`

### Current State
```typescript
// Line 83
const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();
```

### Planned Change (If in scope)
```typescript
// IMPORT
import { FingerprintAuthority } from './fingerprint_authority';

// REPLACE: Line 83
const actualHash = (await FingerprintAuthority.hashBytes(fileBuffer, 'SELF_CHECK')).toUpperCase();
```

### Status
- Only if self-check needs replay governance
- May remain as utility function (not replay-critical)
- Decision: Mark for review post-patches

---

## Implementation Sequencing (No Code Changes Yet)

**Phase 1: Foundation (No API changes, no breaking changes)**
1. Create ByteAuthority (isolated, new file)
2. Create ReplayDomains (isolated, new file)
3. Create FingerprintAuthority (isolated, new file)

**Phase 2: Delegation (Low risk, internal methods)**
1. Update CanonicalJson.toBuffer() (1 line)
2. Update CanonicalEventEnvelope (2 lines)
3. Update WitnessAuthority (add 3 methods, update 15 lines)

**Phase 3: Hash Consolidation (Medium risk, async propagation)**
1. Update MerkleTree (async propagation needed)
2. Update CanonicalHashAuthority (async propagation needed)
3. Verify all call sites support async

**Phase 4: Testing & Verification**
1. Run existing test suite
2. Verify hash consistency
3. Verify domain governance active
4. Verify byte authority centralized

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| **Async propagation cascade** | Plan async chains end-to-end; test with await chains before deployment |
| **Hash format drift** | Verify FingerprintAuthority returns consistent format; add format validation |
| **Domain validation gaps** | Add validateDomain() to all fingerprint consumers; test with unknown domains |
| **Byte encoding issues** | Test UTF-8, hex, base64 round-trips; verify no truncation or corruption |
| **Existing tests break** | Keep old methods as deprecated wrappers during transition if needed |

---

## Rollback Plan

If issues arise:

1. **Pre-patch state:** Commit current code to branch `layer0-authority-audit`
2. **If async issues:** Revert Phase 3; keep Phases 1–2 (they are isolated)
3. **If hash drift:** Revert FingerprintAuthority; keep ByteAuthority and ReplayDomains
4. **If byte issues:** Revert ByteAuthority; keep other patches (they compose independently)

---

## Success Criteria

After all patches:

✓ **Hash Authority:**
- Single `crypto.createHash('sha256')` location (FingerprintAuthority)
- All other hashing routed through FingerprintAuthority
- Domain validation active
- Async throughout

✓ **Byte Authority:**
- All `Buffer.from()` calls → ByteAuthority.encodeXxx() or decodeXxx()
- All `Buffer.toString()` calls → ByteAuthority.encodeXxx()
- All `Buffer.concat()` calls → ByteAuthority.concat()
- No direct Buffer operations in business logic

✓ **WitnessAuthority:**
- Owns ONLY witness composition
- No byte operations in computeWitnessRoot()
- All byte leaf construction delegated

✓ **Domain Registry:**
- FINGERPRINT_DOMAINS is frozen
- validateDomain() enforced at API boundaries
- No domains registered outside this constant

✓ **Constitutional Authority:**
- Each authority owns exactly one semantic domain
- No cross-layer violations
- No duplicated hashing or byte semantics

---

## NO IMPLEMENTATION YET

This guide describes patches only. No code changes have been applied.

**Next Steps:** User approval to proceed with Phase 1 implementation.
