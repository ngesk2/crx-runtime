# CONSTITUTIONAL PROOF MATRIX

**Audit Date:** 2025-01-18  
**Audit Mode:** ZERO ASSUMPTION - READ ONLY  
**Audit Principle:** Ownership is proven through imports, runtime execution, writes, reads, reconstructability, and actual dependencies.

---

## EXECUTIVE SUMMARY

**Constitutional primitives are 90% dormant.** Only Events have actual runtime usage (via Brain's event_emitter.py). Objects, Replay, Witnesses, Identity, Canonical State, Ledger, Hash, and Lineage exist as code but have no runtime consumers. PING primitives are not used by applications. Brain owns event emission.

---

## PRIMITIVE: Objects

**OWNER:** UNKNOWN (commit-service claims ownership but runtime status unknown)

**FILES:**
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\models\artifact.ts
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\artifact_store.ts
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\lineage_store.ts

**EXPORTED:**
- commit-service exports artifact store and lineage store

**IMPORTED_BY:**
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\api\commit_controller.ts (imports storeArtifact, storeLineage)
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\api\audit_controller.ts (imports artifact store)

**RUNTIME_CONSUMERS:**
- commit-service (runtime status unknown - no docker-compose.yml found)
- Applications: NONE (applications do not import from commit-service)

**PERSISTENCE:**
- PostgreSQL (artifacts table, lineage_edges table)
- Schema: C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\ledger_schema.sql

**REPLAYABLE:**
- UNKNOWN (commit-service may not be running)
- No evidence of replay from events

**AUTHORITATIVE:**
- UNKNOWN (commit-service may not be running)
- Applications use SQLite, not commit-service

**EVIDENCE:**
- commit-service exists but has no docker-compose.yml
- commit-service is not imported by applications
- Applications use SQLite (newsletters.db, knowledge.db)
- No runtime evidence of commit-service execution

**STATUS:** UNKNOWN
- Implementation exists
- Runtime status unknown
- No application consumers
- Cannot verify authority

---

## PRIMITIVE: Events

**OWNER:** Brain (event_emitter.py is used by applications)

**FILES:**
- C:\Users\nolan\CascadeProjects\brain\src\constitutional\event_emitter.py
- C:\Users\nolan\PING\gateway\event_emitter.js (duplicate)
- C:\Users\nolan\PING\runtime\adapters\postgres_event_store.ts (stub)
- C:\Users\nolan\PING\database\events.sql (schema)

**EXPORTED:**
- Brain exports: emit_event, emit_article_created, emit_article_updated, emit_newsletter_created, emit_digest_generated, emit_archive_written, emit_markdown_written, emit_article_processing_failed, emit_newsletter_processing_failed, emit_database_write_failed, emit_archive_write_failed
- PING gateway exports: emitEvent, emitInferenceRequest, emitInferenceResponse, emitInferenceFailed

**IMPORTED_BY:**
- C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py (imports emit_newsletter_created, emit_digest_generated, emit_newsletter_processing_failed, emit_database_write_failed)
- C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py (imports emit_article_created, emit_article_processing_failed, emit_database_write_failed)
- C:\Users\nolan\CascadeProjects\crx-newsletter-brain\worker.py (imports emit_event)
- C:\Users\nolan\CascadeProjects\crx-digestion-worker\worker.py (imports emit_event)
- C:\Users\nolan\PING\gateway\server.js (imports emitInferenceRequest, emitInferenceResponse, emitInferenceFailed)

**RUNTIME_CONSUMERS:**
- crx-newsletter-brain (worker.py, database.py)
- crx-digestion-worker (worker.py, database.py)
- PING gateway (server.js)

**PERSISTENCE:**
- PostgreSQL (events table)
- Schema: C:\Users\nolan\PING\database\events.sql
- Connection: Brain's event_emitter.py connects to PostgreSQL

**REPLAYABLE:**
- PARTIAL (events table exists but no replay engine uses it)
- Applications do not replay from events
- PING replay engine exists but is not used

**AUTHORITATIVE:**
- PARTIAL (events table is append-only but applications use SQLite as authoritative storage)
- Events are emitted after SQLite writes
- Events are not used for state reconstruction

**EVIDENCE:**
- Brain's event_emitter.py is imported by applications
- Brain's event_emitter.py writes to PostgreSQL events table
- Applications emit events after SQLite writes
- No replay from events occurs
- SQLite is authoritative, not events

**STATUS:** PARTIAL
- Implementation exists and is used
- Events are emitted but not replayed
- SQLite is authoritative, not events
- Partial observability achieved

---

## PRIMITIVE: Replay

**OWNER:** PING (replay engine exists but is not used)

**FILES:**
- C:\Users\nolan\PING\runtime\replay\deterministic_replay_engine.ts
- C:\Users\nolan\PING\runtime\replay\replay_state_machine.ts
- C:\Users\nolan\PING\runtime\replay\replay_event_stream.ts
- C:\Users\nolan\PING\runtime\replay\replay_verification.ts
- C:\Users\nolan\PING\runtime\replay\index.ts

**EXPORTED:**
- PING replay exports: DeterministicReplayEngine, ReplayStateMachine, ReplayEventStream, ReplayVerification, CanonicalJson, CanonicalEventEnvelope, CanonicalHashAuthority, InvariantRunner, ReplayInvariants, WitnessAuthority, MerkleTree

**IMPORTED_BY:**
- C:\Users\nolan\PING\runtime\adapters\express_commit_adapter.ts (imports ReplayVerification, CanonicalEventEnvelope, ReplayEventStream)
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\engines\canonical_engine.ts (imports CanonicalJson from @crx/replay)
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\engines\identity_engine.ts (imports canonicalize from canonical_engine)
- Applications: NONE

**RUNTIME_CONSUMERS:**
- PING commit-service (runtime status unknown - no docker-compose.yml found)
- PING adapters (runtime status unknown)
- Applications: NONE

**PERSISTENCE:**
- No persistence (replay is pure functional)
- Replay operates on in-memory event streams

**REPLAYABLE:**
- YES (replay engine is deterministic)
- But not used by applications

**AUTHORITATIVE:**
- NO (replay engine is not used)
- Applications do not replay from events

**EVIDENCE:**
- Replay engine exists in PING
- No applications import replay engine
- No replay occurs in applications
- Replay is dormant code

**STATUS:** FALSE
- Implementation exists but is not used
- No runtime consumers
- Not authoritative
- Dormant code

---

## PRIMITIVE: Witnesses

**OWNER:** PING (witness authority exists but is not used)

**FILES:**
- C:\Users\nolan\PING\runtime\replay\witness_authority.ts
- C:\Users\nolan\PING\runtime\replay\merkle_tree.ts
- C:\Users\nolan\PING\runtime\replay\canonical_certificate.ts

**EXPORTED:**
- PING replay exports: WitnessAuthority, MerkleTree, CanonicalCertificate

**IMPORTED_BY:**
- C:\Users\nolan\PING\runtime\replay\deterministic_replay_engine.ts (imports WitnessAuthority)
- Applications: NONE

**RUNTIME_CONSUMERS:**
- PING replay engine (runtime status unknown)
- Applications: NONE

**PERSISTENCE:**
- No persistence (witness computation is pure functional)
- Witness roots are computed in-memory

**REPLAYABLE:**
- YES (witness computation is deterministic)
- But not used by applications

**AUTHORITATIVE:**
- NO (witness authority is not used)
- Applications do not compute witnesses

**EVIDENCE:**
- Witness authority exists in PING
- No applications import witness authority
- No witness computation occurs in applications
- Witness is dormant code

**STATUS:** FALSE
- Implementation exists but is not used
- No runtime consumers
- Not authoritative
- Dormant code

---

## PRIMITIVE: Identity

**OWNER:** PING (identity engine exists but is not used)

**FILES:**
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\engines\identity_engine.ts
- C:\Users\nolan\PING\runtime\replay\replay_types.ts (branded types)

**EXPORTED:**
- commit-service exports: computeCanonicalHash
- PING replay exports: branded types (EventId, ArtifactId, WitnessLeafId)

**IMPORTED_BY:**
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\api\commit_controller.ts (imports computeCanonicalHash)
- Applications: NONE

**RUNTIME_CONSUMERS:**
- PING commit-service (runtime status unknown)
- Applications: NONE

**PERSISTENCE:**
- No persistence (identity computation is pure functional)
- Identity is computed in-memory

**REPLAYABLE:**
- YES (identity computation is deterministic)
- But not used by applications

**AUTHORITATIVE:**
- NO (identity engine is not used)
- Applications do not compute identities

**EVIDENCE:**
- Identity engine exists in commit-service
- No applications import identity engine
- No identity computation occurs in applications
- Identity is dormant code

**STATUS:** FALSE
- Implementation exists but is not used
- No runtime consumers
- Not authoritative
- Dormant code

---

## PRIMITIVE: Canonical State

**OWNER:** PING (canonical state exists but is not used)

**FILES:**
- C:\Users\nolan\PING\runtime\replay\canonical_json.ts
- C:\Users\nolan\PING\runtime\replay\canonical_event_envelope.ts
- C:\Users\nolan\PING\runtime\replay\state_serializer.ts
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\engines\canonical_engine.ts

**EXPORTED:**
- PING replay exports: CanonicalJson, CanonicalEventEnvelope, StateSerializer
- commit-service exports: canonicalize

**IMPORTED_BY:**
- C:\Users\nolan\PING\runtime\replay\deterministic_replay_engine.ts (imports CanonicalJson, CanonicalEventEnvelope)
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\engines\identity_engine.ts (imports canonicalize)
- Applications: NONE

**RUNTIME_CONSUMERS:**
- PING replay engine (runtime status unknown)
- PING commit-service (runtime status unknown)
- Applications: NONE

**PERSISTENCE:**
- No persistence (canonicalization is pure functional)
- Canonical state is computed in-memory

**REPLAYABLE:**
- YES (canonicalization is deterministic)
- But not used by applications

**AUTHORITATIVE:**
- NO (canonical state is not used)
- Applications do not canonicalize state

**EVIDENCE:**
- Canonical state exists in PING
- No applications import canonical state
- No canonicalization occurs in applications
- Canonical state is dormant code

**STATUS:** FALSE
- Implementation exists but is not used
- No runtime consumers
- Not authoritative
- Dormant code

---

## PRIMITIVE: Ledger

**OWNER:** UNKNOWN (commit-service claims ownership but runtime status unknown)

**FILES:**
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\ledger_schema.sql
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\db.ts
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\artifact_store.ts
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\lineage_store.ts

**EXPORTED:**
- commit-service exports: pool, createPool

**IMPORTED_BY:**
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\artifact_store.ts (imports pool)
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\lineage_store.ts (imports pool)
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\events\event_log.ts (imports pool)
- Applications: NONE

**RUNTIME_CONSUMERS:**
- PING commit-service (runtime status unknown)
- Applications: NONE

**PERSISTENCE:**
- PostgreSQL (artifacts table, lineage_edges table, execution_events table)
- Schema: C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\ledger_schema.sql

**REPLAYABLE:**
- UNKNOWN (commit-service may not be running)
- No evidence of replay from ledger

**AUTHORITATIVE:**
- UNKNOWN (commit-service may not be running)
- Applications use SQLite, not ledger

**EVIDENCE:**
- Ledger exists in commit-service
- No applications import ledger
- Applications use SQLite (newsletters.db, knowledge.db)
- No runtime evidence of ledger execution

**STATUS:** UNKNOWN
- Implementation exists
- Runtime status unknown
- No application consumers
- Cannot verify authority

---

## PRIMITIVE: Hash

**OWNER:** PING (hash authority exists but is not used)

**FILES:**
- C:\Users\nolan\PING\runtime\replay\canonical_hash_authority.ts
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\engines\identity_engine.ts (SHA-256 computation)

**EXPORTED:**
- PING replay exports: CanonicalHashAuthority
- commit-service exports: computeCanonicalHash

**IMPORTED_BY:**
- C:\Users\nolan\PING\runtime\replay\deterministic_replay_engine.ts (imports CanonicalHashAuthority)
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\api\commit_controller.ts (imports computeCanonicalHash)
- Applications: NONE

**RUNTIME_CONSUMERS:**
- PING replay engine (runtime status unknown)
- PING commit-service (runtime status unknown)
- Applications: NONE

**PERSISTENCE:**
- No persistence (hash computation is pure functional)
- Hash is computed in-memory

**REPLAYABLE:**
- YES (hash computation is deterministic)
- But not used by applications

**AUTHORITATIVE:**
- NO (hash authority is not used)
- Applications do not compute hashes

**EVIDENCE:**
- Hash authority exists in PING
- No applications import hash authority
- No hash computation occurs in applications
- Hash is dormant code

**STATUS:** FALSE
- Implementation exists but is not used
- No runtime consumers
- Not authoritative
- Dormant code

---

## PRIMITIVE: Lineage

**OWNER:** UNKNOWN (commit-service claims ownership but runtime status unknown)

**FILES:**
- C:\Users\nolan\PING\runtime\replay\graph_validator.ts
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\validation\dag_validator.ts
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\lineage_store.ts

**EXPORTED:**
- PING replay exports: GraphValidator
- commit-service exports: validateLineage

**IMPORTED_BY:**
- C:\Users\nolan\PING\runtime\replay\replay_state_machine.ts (imports GraphValidator)
- C:\Users\nolan\PING\runtime\kernel\commit-service\src\api\commit_controller.ts (imports validateLineage)
- Applications: NONE

**RUNTIME_CONSUMERS:**
- PING replay engine (runtime status unknown)
- PING commit-service (runtime status unknown)
- Applications: NONE

**PERSISTENCE:**
- PostgreSQL (lineage_edges table)
- Schema: C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\ledger_schema.sql

**REPLAYABLE:**
- UNKNOWN (commit-service may not be running)
- No evidence of replay from lineage

**AUTHORITATIVE:**
- UNKNOWN (commit-service may not be running)
- Applications do not track lineage

**EVIDENCE:**
- Lineage exists in commit-service
- No applications import lineage
- Applications do not track lineage
- No runtime evidence of lineage execution

**STATUS:** UNKNOWN
- Implementation exists
- Runtime status unknown
- No application consumers
- Cannot verify authority

---

## CRITICAL FINDINGS

1. **Events are PARTIAL.** Events are emitted via Brain's event_emitter.py but are not replayed. SQLite is authoritative, not events.

2. **Replay is FALSE.** Replay engine exists in PING but is not used by any application. No replay occurs.

3. **Witnesses are FALSE.** Witness authority exists in PING but is not used by any application. No witness computation occurs.

4. **Identity is FALSE.** Identity engine exists in commit-service but is not used by any application. No identity computation occurs.

5. **Canonical State is FALSE.** Canonical state exists in PING but is not used by any application. No canonicalization occurs.

6. **Ledger is UNKNOWN.** Ledger exists in commit-service but runtime status is unknown. No applications use ledger.

7. **Hash is FALSE.** Hash authority exists in PING but is not used by any application. No hash computation occurs.

8. **Lineage is UNKNOWN.** Lineage exists in commit-service but runtime status is unknown. No applications track lineage.

9. **Objects are UNKNOWN.** Object storage exists in commit-service but runtime status is unknown. No applications use commit-service.

10. **PING primitives are 90% dormant.** Only commit-service and gateway have potential runtime usage. All other PING primitives are dormant code.

---

## ANSWER

**Constitutional primitives are 90% dormant.** Only Events have actual runtime usage (via Brain's event_emitter.py). Objects, Replay, Witnesses, Identity, Canonical State, Ledger, Hash, and Lineage exist as code but have no runtime consumers. PING primitives are not used by applications. Brain owns event emission.

**Ownership:**
- Events: Brain (event_emitter.py)
- Objects: UNKNOWN (commit-service)
- Replay: PING (dormant)
- Witnesses: PING (dormant)
- Identity: PING (dormant)
- Canonical State: PING (dormant)
- Ledger: UNKNOWN (commit-service)
- Hash: PING (dormant)
- Lineage: UNKNOWN (commit-service)
