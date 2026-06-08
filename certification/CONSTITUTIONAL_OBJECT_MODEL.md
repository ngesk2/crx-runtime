# Constitutional Object Model

**Status:** CONSTITUTIONALLY FROZEN  
**Date:** 2026-06-08  
**Version:** 1.0.0

## Constitutional Principle

Before writing a single schema, we freeze exactly seven constitutional definitions. These definitions are permanent foundational infrastructure for replayable internet relationship systems.

## 1. Identity

**Definition:** A cryptographically verifiable entity capable of signing events and owning objects.

**Type Definition:**
```typescript
type IdentityId = Brand<string, 'IdentityId'>;

interface Identity {
  identity_id: IdentityId;
  public_key: string;
  created_at: EventTime;
  witness_root: WitnessRoot;
}
```

**Constitutional Rules:**
- Identity is cryptographically verifiable via public key
- Identity can sign events
- Identity can own objects
- Identity is immutable once created
- Identity cannot be deleted (only revoked)

**Forbidden:**
- No OAuth assumptions
- No email identity assumptions
- No centralized account assumptions
- No platform-specific ID assumptions

**Future-Proof:**
- Supports public-key identity
- Supports passkeys
- Supports domain verification
- Supports future DID migration

---

## 2. Object

**Definition:** A canonical, witnessed payload with immutable lineage and state transitions.

**Type Definition:**
```typescript
type ObjectId = Brand<string, 'ObjectId'>;
type ObjectType = Brand<string, 'ObjectType'>;
type CanonicalHash = Brand<string, 'CanonicalHash'>;

interface PingObject {
  object_id: ObjectId;
  object_type: ObjectType;
  creator_id: IdentityId;
  owner_id: IdentityId;
  payload_hash: CanonicalHash;
  payload_schema: string;
  payload_version: string;
  witness_root: WitnessRoot;
  state: ObjectState;
  created_at: EventTime;
  lineage_root: LineageRoot;
}
```

**Constitutional Rules:**
- Object is canonical (RFC-8785)
- Object is witnessed (Merkle tree)
- Object has immutable lineage
- Object has deterministic state transitions
- Object payload is hash-referenced (not inline)
- Object schema is versioned
- Object is replayable from event ledger

**Primitive Status:**
- PingObject is the constitutional primitive
- FOLLOW is merely a specialized object
- All social constructs derive from Object

---

## 3. Placement

**Definition:** The constitutional primitive for sponsorship, ownership, permissions, and monetization of objects.

**Type Definition:**
```typescript
type PlacementId = Brand<string, 'PlacementId'>;

interface Placement {
  placement_id: PlacementId;
  object_id: ObjectId;
  host_id: IdentityId;
  sponsor_id: IdentityId;
  placement_type: PlacementType;
  permissions: PermissionSet;
  monetization_config: MonetizationConfig;
  witness_root: WitnessRoot;
  state: PlacementState;
  created_at: EventTime;
  lineage_root: LineageRoot;
}
```

**Constitutional Events:**
- PlacementCreated
- PlacementUpdated
- PlacementRevoked

**Constitutional Rules:**
- Placement is an event, not a relationship
- Placement enables sponsorship
- Placement enables ownership
- Placement enables permissions
- Placement enables monetization
- Placement is witnessed
- Placement is replayable

**Critical Importance:**
- Placement is where sponsorship, ownership, permissions, and monetization actually happen
- Placement is the bridge between Object and Marketplace
- Placement is constitutional, not infrastructural

---

## 4. Host

**Definition:** An identity that provides placement infrastructure for objects.

**Type Definition:**
```typescript
interface Host {
  host_id: IdentityId;
  host_type: HostType;
  placement_capacity: number;
  placement_policy: PlacementPolicy;
  witness_root: WitnessRoot;
  created_at: EventTime;
}
```

**Constitutional Rules:**
- Host is an identity with placement infrastructure
- Host provides placement capacity
- Host enforces placement policy
- Host is witnessed
- Host is replayable

---

## 5. Owner

**Definition:** An identity that holds ownership rights over an object or placement.

**Type Definition:**
```typescript
interface Owner {
  owner_id: IdentityId;
  owned_object_ids: ObjectId[];
  owned_placement_ids: PlacementId[];
  ownership_rights: OwnershipRights;
  witness_root: WitnessRoot;
  created_at: EventTime;
}
```

**Constitutional Rules:**
- Owner is an identity with ownership rights
- Owner can own objects
- Owner can own placements
- Ownership rights are witnessed
- Ownership is replayable

---

## 6. Revocation

**Definition:** The constitutional mechanism for terminating permissions, ownership, or placement.

**Type Definition:**
```typescript
type RevocationId = Brand<string, 'RevocationId'>;

interface Revocation {
  revocation_id: RevocationId;
  target_type: RevocationTargetType;
  target_id: string;
  revoker_id: IdentityId;
  reason: RevocationReason;
  witness_root: WitnessRoot;
  created_at: EventTime;
  lineage_root: LineageRoot;
}
```

**Constitutional Events:**
- PermissionRevoked
- OwnershipRevoked
- PlacementRevoked

**Constitutional Rules:**
- Revocation is an event
- Revocation is witnessed
- Revocation is replayable
- Revocation is irreversible
- Revocation lineage is immutable

---

## 7. Witness

**Definition:** The cryptographic commitment to the canonical state of an object, placement, or event.

**Type Definition:**
```typescript
type WitnessRoot = Brand<string, 'WitnessRoot'>;
type LineageRoot = Brand<string, 'LineageRoot'>;

interface Witness {
  witness_root: WitnessRoot;
  leaf_count: number;
  tree_height: number;
  witness_algorithm: string;
  created_at: EventTime;
}
```

**Constitutional Rules:**
- Witness is a Merkle tree root
- Witness is deterministic
- Witness is canonical
- Witness is cryptographically scoped
- Witness is irreversible
- Witness mismatches produce typed replay failure (never silent recovery)

**Witness Commits:**
- Canonical payload
- Invariant version
- Replay config version
- Schema version
- Actor signature
- Permission state

---

## Object States

**Constitutional States (Frozen):**

1. **DRAFT** - Object created, not yet signed
2. **SIGNED** - Object signed by creator, not yet published
3. **PUBLISHED** - Object published to ledger
4. **PLACED** - Object placed by host
5. **ACTIVE** - Object actively serving
6. **PAUSED** - Object temporarily paused
7. **REVOKED** - Object permanently revoked
8. **ARCHIVED** - Object archived (read-only)

**Constitutional Rules:**
- State transitions are deterministic
- State transitions are witnessed
- State transitions are replayable
- State transitions are irreversible
- No other states permitted

---

## Constitutional Authorities

**Only these 7 modules may:**
- hash
- serialize
- witness
- replay
- verify lineage

**Constitutional Authorities:**
1. CanonicalJson
2. CanonicalHashAuthority
3. StateSerializer
4. ReplayStateMachine
5. DeterministicReplayEngine
6. InvariantRunner
7. WitnessAuthority

**Forbidden Future Violations:**
These modules should NEVER become authorities:
- identity_engine.ts (consumer only)
- social_graph.ts (consumer only)
- feed_engine.ts (consumer only)
- marketplace_engine.ts (consumer only)
- ad_engine.ts (consumer only)
- agent_runtime.ts (consumer only)

---

## Layer Hierarchy

**Layer 0 (Constitutional Kernel):**
- Replay Kernel
- Witness Authority
- Canonicalization
- Lineage
- Invariants
- Event Ledger

**Layer 1 (Constitutional Primitives):**
- Identity
- Object
- Placement
- Permissions
- Revocation

**Layer 2 (Marketplace):**
- Marketplace
- Discovery
- Search
- Recommendations
- Feeds

**Layer 3 (AI):**
- AI
- Agents
- RAG
- Optimization
- Semantic Search
- Curriculum
- Moderation

**Constitutional Rule:**
Layer 0 must be frozen before Layer 1.
Layer 1 must be frozen before Layer 2.
Layer 2 must be frozen before Layer 3.

---

## Deleted Concepts

**Aggressively Deleted from Scope (Layer 3 only):**
- Agent swarms
- Semantic web
- Trust graphs
- Portable follows
- Federation
- Curriculum systems
- Multi-agent orchestration
- Advertising auctions

**Reason:**
These are Layer 3 concepts.
We don't have Layer 1 frozen.
Constitutional kernel can support all four.
But Phase 1 must choose one.

---

## Architectural Pivot

**Before:**
Temporal was strongest.

**After:**
DBOS is significantly more aligned.

**Reason:**
Constitutional kernel already thinks:
- Event
- Replay
- Witness
- Ledger
- State Reconstruction

DBOS is effectively:
- Postgres
- Durable Execution
- Replay

**New Roadmap:**
1. Replay Freeze
2. Postgres
3. pgvector
4. DBOS
5. Object Layer
6. Placement Layer
7. Marketplace
8. Temporal (optional)
9. AI

---

## Expanded Certification Suite

**Current Tests:**
- 1000x determinism
- Ordering fuzz
- Unicode fuzz
- Mutation fuzz
- Witness regeneration

**New Tests Required:**
- Identity migration replay
- Schema migration replay
- Placement replay
- Revocation replay
- Cross-node replay
- Recovery replay

**Reason:**
These are future constitutional failures.
They must be certified before Layer 1 implementation.

---

## Constitutional Freeze Status

**Status:** CONSTITUTIONALLY FROZEN

**Frozen Definitions:**
- Identity ✓
- Object ✓
- Placement ✓
- Host ✓
- Owner ✓
- Revocation ✓
- Witness ✓

**Frozen States:**
- DRAFT ✓
- SIGNED ✓
- PUBLISHED ✓
- PLACED ✓
- ACTIVE ✓
- PAUSED ✓
- REVOKED ✓
- ARCHIVED ✓

**Frozen Authorities:**
- CanonicalJson ✓
- CanonicalHashAuthority ✓
- StateSerializer ✓
- ReplayStateMachine ✓
- DeterministicReplayEngine ✓
- InvariantRunner ✓
- WitnessAuthority ✓

**Next Step:**
Implement Layer 1 (Identity, Object, Placement, Permissions, Revocation) using frozen constitutional definitions.
