# PHASE9_PING_LAYER_0_DEFINITION.md

**Definition Type:** PING LAYER 0 SCOPE DEFINITION  
**Definition Date:** 2025-01-18  
**Repository Root:** C:\Users\nolan\PING  
**Status:** PHASE 9 COMPLETE  

---

## EXECUTIVE SUMMARY

**Purpose:** Define what PING should own as Layer 0 (Constitutional Runtime) based on actual repository evidence.

**Critical Finding:** PING is already correctly structured as a constitutional runtime. Layer 0 should include ONLY constitutional capabilities, not application-level capabilities.

**Layer 0 Scope (Constitutional Runtime):**
- Canonical Authority
- Identity Authority
- Lineage Authority
- Event Authority
- Replay Authority
- Witness Authority
- Hash Authority
- Gateway (constitutional event recording)
- Database (constitutional storage)

**NOT in Layer 0 (Application-Level or Separate Systems):**
- Inference Authority (delegated to Ollama)
- Retrieval Authority (not implemented)
- Knowledge Authority (separate system: KnowledgeOS)
- Memory Authority (not implemented)
- Recommendation Authority (not implemented)
- Task Authority (not implemented)
- VOS (separate system with own governance)

---

## LAYER 0 DEFINITION

### What PING Should Own (Layer 0 - Constitutional Runtime)

#### 1. Canonical Authority

**Location:** `runtime/replay/`  
**Implementation:** `canonical_json.ts`, `canonical_event_envelope.ts`, `canonical_hash_authority.ts`  
**Purpose:** JSON canonicalization for replay and identity  
**Status:** ACTIVE (pure TypeScript, no infrastructure dependencies)  
**Evidence:** `runtime/replay/index.ts` exports CanonicalJson, CanonicalEventEnvelope, CanonicalHashAuthority

**Why in Layer 0:**
- Constitutional primitive required for deterministic replay
- No application-level logic
- Infrastructure-independent

#### 2. Identity Authority

**Location:** `runtime/kernel/commit-service/src/engines/`  
**Implementation:** `identity_engine.ts`  
**Purpose:** SHA256 hash computation for artifact identity  
**Status:** ACTIVE (used by commit service)  
**Evidence:** `runtime/kernel/commit-service/src/api/commit_controller.ts` imports from identity_engine

**Why in Layer 0:**
- Constitutional primitive required for artifact identity
- No application-level logic
- Foundation for lineage tracking

#### 3. Lineage Authority

**Location:** `runtime/kernel/commit-service/src/persistence/`  
**Implementation:** `lineage_store.ts`, `dag_validator.ts`  
**Purpose:** Lineage edge storage and DAG validation  
**Status:** ACTIVE (used by commit service)  
**Evidence:** `runtime/kernel/commit-service/src/api/commit_controller.ts` imports from lineage_store and dag_validator

**Why in Layer 0:**
- Constitutional primitive required for artifact lineage
- No application-level logic
- Foundation for replay and verification

#### 4. Event Authority

**Location:** `gateway/`  
**Implementation:** `event_emitter.js`  
**Purpose:** Constitutional event recording to PostgreSQL  
**Status:** ACTIVE (used by gateway)  
**Evidence:** `gateway/server.js` imports from event_emitter

**Why in Layer 0:**
- Constitutional primitive required for event sourcing
- Append-only event log
- Foundation for replay and verification

#### 5. Replay Authority

**Location:** `runtime/replay/`  
**Implementation:** `deterministic_replay_engine.ts`, `replay_verification.ts`, `replay_state_machine.ts`  
**Purpose:** Deterministic replay from events  
**Status:** LIBRARY (pure TypeScript, not a service)  
**Evidence:** `runtime/replay/index.ts` exports DeterministicReplayEngine, ReplayVerification

**Why in Layer 0:**
- Constitutional primitive required for state reconstruction
- No application-level logic
- Infrastructure-independent (pure library)

#### 6. Witness Authority

**Location:** `runtime/replay/`  
**Implementation:** `witness_authority.ts`, `merkle_tree.ts`  
**Purpose:** Merkle tree for event witnessing  
**Status:** LIBRARY (pure TypeScript, not a service)  
**Evidence:** `runtime/replay/index.ts` exports WitnessAuthority, MerkleTree

**Why in Layer 0:**
- Constitutional primitive required for event verification
- No application-level logic
- Infrastructure-independent (pure library)

#### 7. Hash Authority

**Location:** `runtime/replay/`  
**Implementation:** `canonical_hash_authority.ts`  
**Purpose:** SHA256 hash computation for canonicalization  
**Status:** LIBRARY (pure TypeScript, not a service)  
**Evidence:** `runtime/replay/index.ts` exports CanonicalHashAuthority

**Why in Layer 0:**
- Constitutional primitive required for identity
- No application-level logic
- Infrastructure-independent (pure library)

#### 8. Gateway (Constitutional Event Recording)

**Location:** `gateway/`  
**Implementation:** `server.js`, `event_emitter.js`  
**Purpose:** Gateway service for inference routing and constitutional event recording  
**Status:** ACTIVE (Express server)  
**Evidence:** `gateway/server.js` Express server with Ollama routing and event_emitter

**Why in Layer 0:**
- Entry point for constitutional event recording
- Delegates inference to Ollama (not implementing inference)
- Records events to constitutional event log

**Note:** Gateway is in Layer 0 for event recording, NOT for inference. Inference is delegated to Ollama.

#### 9. Database (Constitutional Storage)

**Location:** `database/`  
**Implementation:** `events.sql`, `operational_intelligence.sql`  
**Purpose:** Constitutional database schemas for events and operational intelligence  
**Status:** ACTIVE (PostgreSQL schemas)  
**Evidence:** `database/events.sql` events table schema, `database/operational_intelligence.sql` operational intelligence

**Why in Layer 0:**
- Constitutional storage for events
- Append-only event log
- Foundation for replay and verification

**Note:** Database is infrastructure (PostgreSQL), but schemas are constitutional.

---

## WHAT PING SHOULD NOT OWN (NOT Layer 0)

### 1. Inference Authority

**Status:** NOT IN PING  
**Current Location:** Delegated to Ollama (external service)  
**Evidence:** `gateway/server.js` line 39-43: Ollama routing

**Why NOT in Layer 0:**
- Inference is application-level capability
- Constitutional runtime should not implement inference
- Delegated to external service (Ollama)
- Provider-agnostic design requires abstraction layer (not implemented yet)

**Recommendation:** Keep delegated to Ollama. Implement Inference Gateway abstraction if provider flexibility is needed.

### 2. Retrieval Authority

**Status:** NOT IN PING  
**Current Location:** Not implemented  
**Evidence:** No retrieval implementation found in PING

**Why NOT in Layer 0:**
- Retrieval is application-level capability
- Constitutional runtime should not implement retrieval
- Should be implemented in applications or separate system

**Recommendation:** Do NOT implement in PING. Implement in applications or separate Retrieval Authority system.

### 3. Knowledge Authority

**Status:** SEPARATE SYSTEM  
**Current Location:** `knowledge/` (KnowledgeOS)  
**Evidence:** `knowledge/README.md` - KnowledgeOS with own governance model

**Why NOT in Layer 0:**
- KnowledgeOS is a separate system with own governance
- Three-tier authority structure (authoritative/derived/experimental)
- Independent from PING constitutional runtime

**Recommendation:** Keep as separate system. Do NOT absorb into PING.

### 4. Memory Authority

**Status:** NOT IN PING  
**Current Location:** Not implemented  
**Evidence:** No memory implementation found in PING

**Why NOT in Layer 0:**
- Memory is application-level capability
- Constitutional runtime should not implement memory
- Should be implemented in applications or separate system

**Recommendation:** Do NOT implement in PING. Implement in applications or separate Memory Authority system.

### 5. Recommendation Authority

**Status:** NOT IN PING  
**Current Location:** Not implemented  
**Evidence:** No recommendation implementation found in PING

**Why NOT in Layer 0:**
- Recommendation is application-level capability
- Constitutional runtime should not implement recommendations
- Should be implemented in applications or separate system

**Recommendation:** Do NOT implement in PING. Implement in applications or separate Recommendation Authority system.

### 6. Task Authority

**Status:** NOT IN PING  
**Current Location:** Not implemented  
**Evidence:** No task management implementation found in PING

**Why NOT in Layer 0:**
- Task management is application-level capability
- Constitutional runtime should not implement task management
- Should be implemented in applications or separate system

**Recommendation:** Do NOT implement in PING. Implement in applications or separate Task Authority system.

### 7. VOS (Visual/Cognitive OS)

**Status:** SEPARATE SYSTEM  
**Current Location:** `vos/`  
**Evidence:** `vos/README.md` - VOS with own governance (COS)

**Why NOT in Layer 0:**
- VOS is a separate system with own governance (COS)
- Cognitive Operating System (ACTIVE)
- Visual OS (FROZEN)
- Independent from PING constitutional runtime

**Recommendation:** Keep as separate system. Do NOT absorb into PING.

---

## LAYER 0 SCOPE SUMMARY

### Constitutional Authorities (IN Layer 0)

| Authority | Location | Implementation | Status |
|-----------|----------|---------------|--------|
| Canonical Authority | runtime/replay/ | canonical_json.ts, canonical_event_envelope.ts, canonical_hash_authority.ts | ACTIVE |
| Identity Authority | runtime/kernel/commit-service/src/engines/ | identity_engine.ts | ACTIVE |
| Lineage Authority | runtime/kernel/commit-service/src/persistence/ | lineage_store.ts, dag_validator.ts | ACTIVE |
| Event Authority | gateway/ | event_emitter.js | ACTIVE |
| Replay Authority | runtime/replay/ | deterministic_replay_engine.ts, replay_verification.ts | LIBRARY |
| Witness Authority | runtime/replay/ | witness_authority.ts, merkle_tree.ts | LIBRARY |
| Hash Authority | runtime/replay/ | canonical_hash_authority.ts | LIBRARY |

### Constitutional Infrastructure (IN Layer 0)

| Component | Location | Implementation | Status |
|-----------|----------|---------------|--------|
| Gateway | gateway/ | server.js, event_emitter.js | ACTIVE |
| Database | database/ | events.sql, operational_intelligence.sql | ACTIVE |
| Constitution | constitution/ | 11 constitutional documents | ACTIVE |

### Application-Level Authorities (NOT in Layer 0)

| Authority | Status | Current Location | Recommendation |
|-----------|--------|-----------------|----------------|
| Inference Authority | Delegated to Ollama | gateway/ (routing only) | Keep delegated |
| Retrieval Authority | Not implemented | N/A | Do NOT implement in PING |
| Knowledge Authority | Separate system | knowledge/ (KnowledgeOS) | Keep separate |
| Memory Authority | Not implemented | N/A | Do NOT implement in PING |
| Recommendation Authority | Not implemented | N/A | Do NOT implement in PING |
| Task Authority | Not implemented | N/A | Do NOT implement in PING |

### Separate Systems (NOT in Layer 0)

| System | Status | Current Location | Recommendation |
|--------|--------|-----------------|----------------|
| KnowledgeOS | Separate system | knowledge/ | Keep separate |
| VOS | Separate system | vos/ | Keep separate |

---

## LAYER 0 ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                     LAYER 0 - PING CONSTITUTIONAL RUNTIME         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Constitutional Authorities (Pure TypeScript):                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ runtime/replay/                                          │  │
│  │ - Canonical Authority (canonical_json.ts)               │  │
│  │ - Replay Authority (deterministic_replay_engine.ts)       │  │
│  │ - Witness Authority (witness_authority.ts, merkle_tree.ts) │  │
│  │ - Hash Authority (canonical_hash_authority.ts)             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Constitutional Services (Infrastructure-Dependent):             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ runtime/kernel/commit-service/                            │  │
│  │ - Identity Authority (identity_engine.ts)                  │  │
│  │ - Lineage Authority (lineage_store.ts, dag_validator.ts)   │  │
│  │ - Event Authority (event_log.ts)                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ gateway/                                                 │  │
│  │ - Event Authority (event_emitter.js)                     │  │
│  │ - Inference Routing (to Ollama, NOT implementation)       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Constitutional Storage:                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ database/                                                │  │
│  │ - Events Table (append-only)                              │  │
│  │ - Operational Intelligence                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Constitutional Laws:                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ constitution/                                             │  │
│  │ - Authority Model, Invariant Law, Layering Law            │  │
│  │ - Mutation Law, Replay Law, Retrieval Law                 │  │
│  │ - Source of Truth Law, Witness Law, Terminology          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     SEPARATE SYSTEMS (NOT LAYER 0)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  KnowledgeOS (knowledge/)                                      │
│  - Own governance model (authoritative/derived/experimental)   │
│  - Agent permission matrix                                     │
│  - Workspace inventory                                         │
│                                                                 │
│  VOS (vos/)                                                   │
│  - Cognitive Operating System (COS)                            │
│  - Visual OS (FROZEN)                                          │
│  - Own governance model                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION-LEVEL (NOT IN PING)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Inference (delegated to Ollama)                               │
│  Retrieval (not implemented)                                   │
│  Memory (not implemented)                                     │
│  Recommendation (not implemented)                              │
│  Task Management (not implemented)                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## EVIDENCE SOURCES

**Code Files:**
- `runtime/replay/index.ts` - Pure TypeScript exports
- `runtime/kernel/commit-service/src/server.ts` - Commit service server
- `runtime/kernel/commit-service/src/api/commit_controller.ts` - Commit controller
- `gateway/server.js` - Gateway server with Ollama routing
- `gateway/event_emitter.js` - Event emitter

**Database Schemas:**
- `database/events.sql` - Events table schema
- `database/operational_intelligence.sql` - Operational intelligence

**Constitutional Documents:**
- `constitution/authority_model.md` - Authority model
- `constitution/invariant_law.md` - Invariant law
- `constitution/layer0_kernel.md` - Layer 0 kernel

**Separate Systems:**
- `knowledge/README.md` - KnowledgeOS documentation
- `vos/README.md` - VOS documentation

---

## CONCLUSION

**PING Layer 0 Scope:**
- Constitutional Authorities: Canonical, Identity, Lineage, Event, Replay, Witness, Hash
- Constitutional Infrastructure: Gateway, Database, Constitution
- Pure TypeScript constitutional runtime (runtime/replay/)
- Infrastructure-dependent services (gateway/, runtime/kernel/commit-service/)

**NOT in Layer 0:**
- Application-level authorities: Inference, Retrieval, Memory, Recommendation, Task
- Separate systems: KnowledgeOS, VOS

**PING is correctly structured as a constitutional runtime.** No absorption needed. Application-level capabilities are intentionally NOT in PING.
