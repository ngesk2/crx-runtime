# Phase A: Authority Ownership Graph

**Status:** In Progress
**Last Updated:** 2026-07-13
**Purpose:** Repository Understanding - Authority Ownership Analysis

---

## Authority System Architecture

### Constitutional Authorities

Authorities are decision layers that determine constitutional validity. They do not execute operations - execution is the kernel's responsibility via capability interfaces.

```
┌─────────────────────────────────────────────────────────────┐
│                   Constitutional Authorities                  │
│                  (Decision Layer Only)                      │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Aggregate  │  │  Migration   │  │  Projection  │
│   Authority  │  │  Authority   │  │  Authority   │
└──────────────┘  └──────────────┘  └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Registry   │  │   Snapshot   │  │   Capability │
│   Authority  │  │   Authority   │  │   Registry   │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Authority Ownership Matrix

### 1. AggregateAuthority
**Location:** `authority/aggregate_authority.py`
**Dependencies:** `sqlalchemy.ext.asyncio.AsyncSession`

**Owned Decisions:**
- Aggregate state transition validity
- Aggregate snapshot constitutional validity
- Aggregate identity consistency
- Aggregate version authority

**Constitutional Laws Enforced:**
- Law 2: No subsystem grants itself authority (version authority)
- Law 9: Every action must be replayable (state transitions)

**Decision Methods:**
- `validate_state_transition()` - Version monotonicity, causal linking
- `validate_snapshot()` - Hash verification, BuildWitness matching
- `validate_identity()` - Identity hash, constitutional version
- `get_authoritative_version()` - Event log as single source of truth

**Data Ownership:**
- Aggregate state transitions
- Aggregate snapshots
- Aggregate identity hashes
- Aggregate version numbers

---

### 2. MigrationAuthority
**Location:** `authority/migration_authority.py`
**Dependencies:** `sqlalchemy.ext.asyncio.AsyncSession`

**Owned Decisions:**
- Migration constitutional validity
- Migration order correctness
- Migration rollback possibility
- Migration replayability

**Constitutional Laws Enforced:**
- Law 9: Every action must be replayable (migration replayability)
- Law 10: Rollback always exists (migration rollback)

**Decision Methods:**
- `validate_migration()` - Migration type, data well-formedness
- `validate_migration_order()` - Sequence correctness, no cycles
- `validate_rollback()` - Rollback data presence, safety
- `validate_replayability()` - Idempotency, external state independence
- `get_applied_migrations()` - Applied migration history

**Data Ownership:**
- Migration definitions
- Migration execution order
- Migration rollback data
- Migration history

---

### 3. ProjectionAuthority
**Location:** `authority/projection_authority.py`
**Dependencies:** `sqlalchemy.ext.asyncio.AsyncSession`, `constitution.hashing.CanonicalHasher`

**Owned Decisions:**
- Projection state constitutional validity
- Projection witness completeness
- Projection replay determinism
- Projection input hash correctness

**Constitutional Laws Enforced:**
- Law 9: Every action must be replayable (projection determinism)
- Law 7: All state changes are events (projection state)

**Decision Methods:**
- `validate_projection_state()` - State hash verification
- `validate_witness()` - Witness hash completeness
- `validate_input_hash()` - Input hash correctness
- `validate_determinism()` - Replay determinism verification

**Data Ownership:**
- Projection state hashes
- Projection witnesses
- Projection input hashes
- Projection execution orders

---

### 4. RegistryAuthority
**Location:** `authority/registry_authority.py`
**Dependencies:** `sqlalchemy.ext.asyncio.AsyncSession`

**Owned Decisions:**
- Registry entry constitutional validity
- Registry lineage immutability
- Registry version compatibility
- Registry canonical hash correctness

**Constitutional Laws Enforced:**
- Law 3: All state changes are immutable (lineage immutability)
- Law 5: All state is versioned (version compatibility)

**Decision Methods:**
- `validate_registry_entry()` - Canonical hash, parent hash
- `validate_lineage()` - Lineage immutability, no cycles
- `validate_compatibility()` - Compatibility type validity
- `get_authoritative_version()` - Registry as single source of truth

**Data Ownership:**
- Registry entries
- Registry lineages
- Registry versions
- Registry compatibility metadata

---

### 5. SnapshotAuthority
**Location:** `authority/snapshot_authority.py`
**Dependencies:** `sqlalchemy.ext.asyncio.AsyncSession`, `constitution.hashing.CanonicalHasher`

**Owned Decisions:**
- Snapshot constitutional validity
- Snapshot version matching BuildWitness
- Snapshot canonical bytes correctness
- Snapshot usage decision

**Constitutional Laws Enforced:**
- Law 9: Every action must be replayable (snapshot validity)
- Law 10: Rollback always exists (snapshot rollback)

**Decision Methods:**
- `validate_snapshot()` - Canonical bytes, BuildWitness matching
- `should_use_snapshot()` - Version matching decision
- `validate_canonical_bytes()` - JSON validity, deterministic ordering

**Data Ownership:**
- Snapshot canonical bytes
- Snapshot hashes
- Snapshot version metadata
- BuildWitness references

---

## Capability Registry

### CapabilityRegistry
**Location:** `constitution/registry/capability_registry.py`
**Dependencies:** None (independent)

**Owned Decisions:**
- Capability registration validity
- Capability execution routing
- Capability health monitoring
- Capability dependency resolution

**Constitutional Laws Enforced:**
- Law 0: Planning never executes (capability execution routing)
- Law 1: Execution never replans (capability execution)

**Decision Methods:**
- `register()` - Capability registration
- `unregister()` - Capability removal
- `get()` - Capability lookup
- `execute()` - Capability execution
- `health_check()` - Health monitoring
- `initialize_all()` - Dependency-ordered initialization
- `shutdown_all()` - Graceful shutdown

**Data Ownership:**
- Capability instances
- Capability metadata
- Capability categories
- Capability health states

**Pattern:** Singleton (global registry instance via `get_registry()`)

---

## Authority Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                           │
│              (PostgreSQL via AsyncSession)                  │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Aggregate  │  │  Migration   │  │  Projection  │
│   Authority  │  │  Authority   │  │  Authority   │
└──────────────┘  └──────────────┘  └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Registry   │  │   Snapshot   │  │              │
│   Authority  │  │   Authority   │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Constitution Hashing Layer                      │
│              (CanonicalHasher)                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Capability Registry (Independent)                │
│              (Singleton Pattern)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Authority Ownership Issues

### 1. Singleton Pattern in CapabilityRegistry
**Status:** High Risk
**Location:** `constitution/registry/capability_registry.py`

**Issue:** Global registry instance violates dependency injection principles
**Impact:** Difficult to test, creates hidden dependencies
**Recommendation:** Replace with factory pattern or dependency injection

### 2. Missing Authority Registration
**Status:** Medium Risk
**Location:** All authorities

**Issue:** Authorities are not registered with AuthorityRegistry
**Impact:** No centralized authority discovery
**Recommendation:** Register all authorities with AuthorityRegistry on startup

### 3. Database Session Dependency
**Status:** Low Risk
**Location:** All authorities

**Issue:** All authorities require AsyncSession dependency
**Impact:** Tight coupling to PostgreSQL
**Recommendation:** Abstract database interface for testability

### 4. BuildWitness Dependency
**Status:** Medium Risk
**Location:** SnapshotAuthority, AggregateAuthority

**Issue:** BuildWitness is passed as Dict[str, str] instead of typed object
**Impact:** No type safety, potential key errors
**Recommendation:** Create BuildWitness dataclass

---

## Constitutional Law Mapping

| Law | Authority | Enforcement Method |
|-----|-----------|-------------------|
| Law 0: Planning never executes | CapabilityRegistry | Execution routing validation |
| Law 1: Execution never replans | CapabilityRegistry | Execution routing validation |
| Law 2: No subsystem grants itself authority | AggregateAuthority | Version authority validation |
| Law 3: All state changes are immutable | RegistryAuthority | Lineage immutability validation |
| Law 5: All state is versioned | RegistryAuthority | Version compatibility validation |
| Law 7: All state changes are events | ProjectionAuthority | State hash verification |
| Law 9: Every action must be replayable | MigrationAuthority, ProjectionAuthority, SnapshotAuthority | Replayability validation |
| Law 10: Rollback always exists | MigrationAuthority, SnapshotAuthority | Rollback data validation |

---

## Authority Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Kernel Layer                              │
│              (Execution via Capabilities)                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Authority Decision Request                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Appropriate Authority                           │
│         (Aggregate, Migration, Projection, etc.)              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Constitutional Validation                         │
│         (Hash verification, version checks, etc.)            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Decision: Valid / Invalid                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Kernel Executes or Rejects                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Recommendations

1. **Eliminate Singleton Pattern:** Replace CapabilityRegistry singleton with dependency injection
2. **Register Authorities:** Create AuthorityRegistry and register all authorities on startup
3. **Type BuildWitness:** Create BuildWitness dataclass for type safety
4. **Abstract Database Interface:** Create database interface for testability
5. **Document Authority Boundaries:** Clearly document what each authority owns

---

## Next Steps

- Create AuthorityRegistry for centralized authority discovery
- Implement dependency injection for CapabilityRegistry
- Create BuildWitness dataclass
- Abstract database interface
- Document authority boundaries in code
