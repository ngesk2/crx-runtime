# PING AUTHORITY OWNERSHIP MAP

**Audit Date:** 2026-06-20
**Audit Mode:** READ ONLY — CONSTITUTIONAL OWNERSHIP DISCOVERY
**Purpose:** Discover constitutional authority ownership in PING repository
**Repository Root:** C:\Users\nolan\PING

---

## SECTION A — AUTHORITY DISCOVERY

### Identity Authority

**AUTHORITY:** Identity Authority

**LAW:** DEFINED

**INTERFACE:** DEFINED

**IMPLEMENTATION:** MISSING

**STORAGE:** MISSING

**STATUS:** DEFINED / IMPLEMENTATION MISSING

---

### Canonicalization Authority

**AUTHORITY:** Canonicalization Authority

**LAW:**
- constitution/authority_model.md (jurisdiction definition)

**INTERFACE:**
- CanonicalJson.canonicalize()
- CanonicalHashAuthority.canonicalize()
- CanonicalHashAuthority.computeFingerprint()

**IMPLEMENTATION:**
- runtime/replay/canonical_json.ts
- runtime/replay/canonical_hash_authority.ts
- runtime/replay/canonical_certificate.ts
- runtime/replay/canonical_event_envelope.ts

**STORAGE:** None (pure functional)

**STATUS:** PARTIAL (implementation dependency variance: uses Node.js crypto module and Buffer in kernel layer)

---

### Replay Authority

**AUTHORITY:** Replay Authority

**LAW:**
- constitution/replay_law.md
- constitution/layer0_kernel.md

**INTERFACE:**
- DeterministicReplayEngine.replay()
- ReplayStateMachine.applyEvent()
- ReplayEventStream.getEvents()
- ReplayVerification.verify()
- InvariantRunner.run()

**IMPLEMENTATION:**
- runtime/replay/deterministic_replay_engine.ts
- runtime/replay/replay_state_machine.ts
- runtime/replay/replay_event_stream.ts
- runtime/replay/replay_verification.ts
- runtime/replay/replay_types.ts
- runtime/replay/replay_invariants.ts
- runtime/replay/replay_limits.ts

**STORAGE:** None (pure functional)

**STATUS:** PROVEN

---

### Event Creation Authority

**AUTHORITY:** Event Creation Authority

**LAW:** None defined

**INTERFACE:**
- PostgresEventStore.emit() (stub)
- emitEvent() (gateway)

**IMPLEMENTATION:**
- runtime/adapters/postgres_event_store.ts (stub)
- gateway/event_emitter.js (independent implementation)

**STORAGE:** PostgreSQL events table

**STATUS:** OWNERSHIP CONTESTED

---

### Event Ordering Authority

**AUTHORITY:** Event Ordering Authority

**LAW:** None defined

**INTERFACE:** None defined

**IMPLEMENTATION:** None found

**STORAGE:** None found

**STATUS:** NOT YET REQUIRED

---

### Lineage Authority

**AUTHORITY:** Lineage Authority

**LAW:** DEFINED

**INTERFACE:** DEFINED

**IMPLEMENTATION:** MISSING

**STORAGE:** MISSING

**STATUS:** DEFINED / IMPLEMENTATION MISSING

---

### Verification Authority

**AUTHORITY:** Verification Authority

**LAW:** None defined

**INTERFACE:**
- ReplayVerification.verify()

**IMPLEMENTATION:**
- runtime/replay/replay_verification.ts

**STORAGE:** None (pure functional)

**STATUS:** PROVEN

---

### Witness Authority

**AUTHORITY:** Witness Authority

**LAW:**
- constitution/witness_law.md

**INTERFACE:**
- WitnessAuthority.generateWitness()
- MerkleTree.build()

**IMPLEMENTATION:**
- runtime/replay/witness_authority.ts
- runtime/replay/merkle_tree.ts

**STORAGE:** None (pure functional)

**STATUS:** PARTIAL (implementation dependency variance: uses Node.js Buffer in kernel layer)

---

### Observation Authority

**AUTHORITY:** Observation Authority

**LAW:** Constitutionally referenced (layer boundaries)

**INTERFACE:** None defined

**IMPLEMENTATION:** None found in runtime

**STORAGE:** None found

**STATUS:** UNPROVEN

---

### Knowledge Authority

**AUTHORITY:** Knowledge Authority

**LAW:** DEFINED

**INTERFACE:** PARTIAL

**IMPLEMENTATION:** MISSING

**STORAGE:** UNPROVEN

**STATUS:** DEFINED / PARTIAL

---

### Recommendation Authority

**AUTHORITY:** Recommendation Authority

**LAW:** Conceptually exists (decision quality constitutional concept)

**INTERFACE:** None defined

**IMPLEMENTATION:** None found in runtime

**STORAGE:** None found

**STATUS:** DEFINED (IMPLEMENTATION MISSING)

---

### Execution Authority

**AUTHORITY:** Execution Authority

**LAW:** DEFINED

**INTERFACE:** DEFINED

**IMPLEMENTATION:** MISSING

**STORAGE:** MISSING

**STATUS:** DEFINED / IMPLEMENTATION MISSING

---

### Decision Ledger Authority

**AUTHORITY:** Decision Ledger Authority

**LAW:** Constitutional concept (decision quality and decision authority)

**INTERFACE:** None defined

**IMPLEMENTATION:** None found in runtime

**STORAGE:** None found

**STATUS:** DEFINED (IMPLEMENTATION MISSING)

---

### Capability Authority

**AUTHORITY:** Capability Authority

**LAW:**
- SWEEP10_CAPABILITY_AUTHORITY_AUDIT.md (capability authority audits exist)

**INTERFACE:** None defined

**IMPLEMENTATION:** None found in runtime

**STORAGE:** None found

**STATUS:** DEFINED (IMPLEMENTATION MISSING)

---

### Time Authority

**AUTHORITY:** Time Authority

**LAW:** Authority Defined (constitutional requirement)

**INTERFACE:** None defined

**IMPLEMENTATION:** None found in runtime (database currently acts as clock)

**STORAGE:** PostgreSQL NOW() function

**STATUS:** PARTIAL (Canonical Owner Not Established, Database Currently Acts As Clock)

---

### Agent Registry Authority

**AUTHORITY:** Agent Registry Authority

**LAW:** None defined

**INTERFACE:** None defined

**IMPLEMENTATION:** None found in runtime

**STORAGE:** None found

**STATUS:** NOT YET REQUIRED (no agents exist)

---

### Workflow Registry Authority

**AUTHORITY:** Workflow Registry Authority

**LAW:** None defined

**INTERFACE:** None defined

**IMPLEMENTATION:** None found in runtime

**STORAGE:** None found

**STATUS:** NOT YET REQUIRED (no workflow authority currently required)

---

## SECTION B — DUPLICATE AUTHORITY DETECTION

### Identity Authority

**AUTHORITY:** Identity Authority

**IMPLEMENTATIONS:** None found

**CANONICAL OWNER PROVEN?** NO

---

### Replay Authority

**AUTHORITY:** Replay Authority

**IMPLEMENTATIONS:**
- runtime/replay/deterministic_replay_engine.ts
- runtime/replay/replay_state_machine.ts
- runtime/replay/replay_event_stream.ts

**CANONICAL OWNER PROVEN?** YES

---

### Lineage Authority

**AUTHORITY:** Lineage Authority

**IMPLEMENTATIONS:** None found

**CANONICAL OWNER PROVEN?** NO

---

### Verification Authority

**AUTHORITY:** Verification Authority

**IMPLEMENTATIONS:**
- runtime/replay/replay_verification.ts

**CANONICAL OWNER PROVEN?** YES

---

### Canonical Hashing Authority

**AUTHORITY:** Canonical Hashing Authority

**IMPLEMENTATIONS:**
- runtime/replay/canonical_hash_authority.ts (PING runtime)
- gateway/event_emitter.js (independent gateway implementation using crypto.createHash)

**CANONICAL OWNER PROVEN?** NO

---

### Event Creation Authority

**AUTHORITY:** Event Creation Authority

**IMPLEMENTATIONS:**
- runtime/adapters/postgres_event_store.ts (PING runtime - stub)
- gateway/event_emitter.js (independent gateway implementation)

**CANONICAL OWNER PROVEN?** NO

---

### Event Ordering Authority

**AUTHORITY:** Event Ordering Authority

**IMPLEMENTATIONS:** None found

**CANONICAL OWNER PROVEN?** NO

---

## SECTION C — RUNTIME AUTHORITY AUDIT

### Can a running service mutate state without kernel approval?

**STATUS:** FAIL

**EVIDENCE:**
- brainos/newsletter/database.py writes directly to SQLite without kernel approval
- brainos/rss/database.py writes directly to SQLite without kernel approval
- gateway/event_emitter.js writes directly to Postgres without kernel approval
- No kernel approval mechanism exists in runtime

**FILES:**
- brainos/newsletter/database.py (lines 87-123: save_raw_newsletter)
- brainos/rss/database.py (lines 54-93: save_article)
- gateway/event_emitter.js (lines 56-100: emitEvent)

---

### Can a running workflow create authority records?

**STATUS:** N/A

**EVIDENCE:** No workflow system exists in PING runtime

**FILES:** None

---

### Can a running process bypass replay?

**STATUS:** FAIL

**EVIDENCE:**
- brainos/newsletter/database.py writes state directly to SQLite without replay
- brainos/rss/database.py writes state directly to SQLite without replay
- gateway/event_emitter.js writes events directly to Postgres without replay
- No replay enforcement mechanism exists in runtime

**FILES:**
- brainos/newsletter/database.py
- brainos/rss/database.py
- gateway/event_emitter.js

---

### Can a running process write directly to Postgres?

**STATUS:** FAIL

**EVIDENCE:**
- gateway/event_emitter.js writes directly to Postgres using pg library
- No kernel approval required for Postgres writes
- No replay enforcement for Postgres writes

**FILES:**
- gateway/event_emitter.js (lines 10-29: PostgreSQL pool setup)
- gateway/event_emitter.js (lines 80-90: direct INSERT query)

---

### Can a running process bypass event creation?

**STATUS:** FAIL

**EVIDENCE:**
- brainos/newsletter/database.py mutates SQLite state without creating events
- brainos/rss/database.py mutates SQLite state without creating events
- State mutation occurs before event emission (if events are emitted at all)

**FILES:**
- brainos/newsletter/database.py (lines 93-96: INSERT before event emission)
- brainos/rss/database.py (lines 63-75: INSERT before event emission)

---

### Can containers access authority stores directly?

**STATUS:** FAIL

**EVIDENCE:**
- brainos/newsletter container accesses SQLite database directly
- brainos/rss container accesses SQLite database directly
- No container isolation from authority stores
- No kernel mediation of container access

**FILES:**
- brainos/newsletter/database.py
- brainos/rss/database.py
- brainos/newsletter/docker-compose.yml
- brainos/rss/docker-compose.yml

---

## SECTION D — CAPABILITY AUTHORITY AUDIT

### Mutation Path: SQLite Write (brainos/newsletter)

**PRINCIPAL:** None (no principal tracking)

**CAPABILITY:** None (no capability tracking)

**AUTHORIZATION RULE:** None (no authorization rules)

**SCOPE:** None (no scope definition)

**EXPIRATION:** None (no expiration)

**CAN MUTATION OCCUR WITHOUT EXPLICIT AUTHORIZATION?** YES

**STATUS:** FAIL

**EVIDENCE:** brainos/newsletter/database.py writes to SQLite without any authorization check

---

### Mutation Path: SQLite Write (brainos/rss)

**PRINCIPAL:** None (no principal tracking)

**CAPABILITY:** None (no capability tracking)

**AUTHORIZATION RULE:** None (no authorization rules)

**SCOPE:** None (no scope definition)

**EXPIRATION:** None (no expiration)

**CAN MUTATION OCCUR WITHOUT EXPLICIT AUTHORIZATION?** YES

**STATUS:** FAIL

**EVIDENCE:** brainos/rss/database.py writes to SQLite without any authorization check

---

### Mutation Path: Postgres Write (gateway)

**PRINCIPAL:** None (no principal tracking)

**CAPABILITY:** None (no capability tracking)

**AUTHORIZATION RULE:** None (no authorization rules)

**SCOPE:** None (no scope definition)

**EXPIRATION:** None (no expiration)

**CAN MUTATION OCCUR WITHOUT EXPLICIT AUTHORIZATION?** YES

**STATUS:** FAIL

**EVIDENCE:** gateway/event_emitter.js writes to Postgres without any authorization check

---

### Mutation Path: Artifact Commit (runtime/kernel/commit-service)

**PRINCIPAL:** None (no principal tracking)

**CAPABILITY:** None (no capability tracking)

**AUTHORIZATION RULE:** None (no authorization rules)

**SCOPE:** None (no scope definition)

**EXPIRATION:** None (no expiration)

**CAN MUTATION OCCUR WITHOUT EXPLICIT AUTHORIZATION?** YES

**STATUS:** FAIL

**EVIDENCE:** SWEEP10_CAPABILITY_AUTHORITY_AUDIT.md documents no capability tracking implementation

---

## SECTION E — TIME AUTHORITY AUDIT

**TIME AUTHORITY:** PostgreSQL (database owns time authority)

**TIME IMPLEMENTATIONS:**
- PostgreSQL NOW() function (database time)
- new Date() in gateway/event_emitter.js (application time)
- datetime.now() in brainos/newsletter/database.py (application time)
- datetime.now() in brainos/rss/database.py (application time)

**CONTRADICTIONS:**
- SWEEP10_TIME_AUTHORITY_AUDIT.md documents that PostgreSQL owns time authority
- Multiple independent time sources exist (PostgreSQL, Node.js, Python)
- No PING timestamp authority exists
- No canonical clock implementation
- Two authorities can assign different timestamps to the same event

**STATUS:** FAIL

---

## SECTION F — POSTGRES AUTHORITY AUDIT

### Can any state exist outside Postgres?

**STATUS:** FAIL

**EVIDENCE:**
- brainos/newsletter/newsletters.db (SQLite database)
- brainos/rss/knowledge.db (SQLite database)
- File system storage in brainos/newsletter/knowledge/
- File system storage in brainos/rss/knowledge/

**FILES:**
- brainos/newsletter/database.py (SQLite)
- brainos/rss/database.py (SQLite)

---

### Can any identity exist outside Postgres?

**STATUS:** FAIL

**EVIDENCE:**
- SQLite INTEGER PRIMARY KEY auto-increment (brainos/newsletter)
- SQLite INTEGER PRIMARY KEY auto-increment (brainos/rss)
- message_id from Yahoo Mail headers (external identity)
- url from RSS feed (external identity)
- crypto.createHash('sha256') in gateway (independent identity generation)

**FILES:**
- brainos/newsletter/database.py (line 19: id INTEGER PRIMARY KEY)
- brainos/rss/database.py (line 18: id INTEGER PRIMARY KEY)
- gateway/event_emitter.js (line 38: hashString using crypto.createHash)

---

### Can any recommendation exist outside Postgres?

**STATUS:** FAIL

**EVIDENCE:**
- newsletter_topics table in SQLite (brainos/newsletter)
- No recommendation tracking in Postgres

**FILES:**
- brainos/newsletter/database.py (lines 65-82: newsletter_topics table)

---

### Can any claim exist outside Postgres?

**STATUS:** FAIL

**EVIDENCE:**
- ArtifactState in runtime/replay/replay_types.ts (in-memory)
- No claim authority implementation
- SWEEP17_DECISION_QUALITY_AUDIT.md documents no claim tracking

**FILES:**
- runtime/replay/replay_types.ts
- SWEEP17_DECISION_QUALITY_AUDIT.md

---

### Can Postgres reconstruct all authorities?

**STATUS:** FAIL

**EVIDENCE:**
- Postgres cannot reconstruct SQLite databases
- Postgres cannot reconstruct file system storage
- Postgres cannot reconstruct in-memory state
- No reconstruction mechanism exists

**FILES:** None (no reconstruction implementation found)

---

### Can external systems reconstruct Postgres?

**STATUS:** FAIL

**EVIDENCE:**
- No external system can reconstruct Postgres
- No reconstruction mechanism exists
- Postgres is not the sole authority

**FILES:** None (no reconstruction implementation found)

---

## SECTION G — AUTHORITY STATUS SUMMARY

### Identity Authority

**STATUS:** DEFINED (IMPLEMENTATION MISSING)

**LAW EXISTS:** YES (constitution/authority_model.md)

**IMPLEMENTATION EXISTS:** NO

**NO CONTRADICTION:** Authority Defined, Implementation Missing

---

### Lineage Authority

**STATUS:** DEFINED (IMPLEMENTATION MISSING)

**LAW EXISTS:** YES (constitution/authority_model.md)

**IMPLEMENTATION EXISTS:** NO

**NO CONTRADICTION:** Authority Defined, Implementation Missing

---

### Canonicalization Authority

**STATUS:** PARTIAL (implementation dependency variance)

**LAW EXISTS:** YES (constitution/authority_model.md)

**IMPLEMENTATION EXISTS:** YES

**IMPLEMENTATION DEPENDENCY:** Uses Node.js crypto module and Buffer in kernel layer

**NO CONTRADICTION:** Authority Defined, Implementation Exists with Dependency Variance

---

### Witness Authority

**STATUS:** PARTIAL (implementation dependency variance)

**LAW EXISTS:** YES (constitution/witness_law.md)

**IMPLEMENTATION EXISTS:** YES

**IMPLEMENTATION DEPENDENCY:** Uses Node.js Buffer in kernel layer

**NO CONTRADICTION:** Authority Defined, Implementation Exists with Dependency Variance

---

### Event Creation Authority

**STATUS:** PARTIAL (multiple implementations, canonical ownership not proven)

**LAW EXISTS:** NO

**IMPLEMENTATION EXISTS:** YES (multiple implementations)

**CANONICAL OWNER PROVEN:** NO

**NO CONTRADICTION:** Multiple Implementations Exist, Canonical Ownership Not Proven

---

### Time Authority

**STATUS:** PARTIAL (Canonical Owner Not Established, Database Currently Acts As Clock)

**LAW EXISTS:** YES (constitutional requirement)

**IMPLEMENTATION EXISTS:** NO (database currently acts as clock)

**NO CONTRADICTION:** Authority Defined, Canonical Owner Not Established

---

### Knowledge Authority

**STATUS:** DEFINED (PARTIAL)

**LAW EXISTS:** YES (knowledge/authoritative/constitutional-knowledge-graph-model.md)

**IMPLEMENTATION EXISTS:** NO (design models exist in knowledge/authoritative/)

**NO CONTRADICTION:** Authority Defined, Design Models Exist, Runtime Implementation Missing

---

### Capability Authority

**STATUS:** DEFINED (IMPLEMENTATION MISSING)

**LAW EXISTS:** YES (SWEEP10_CAPABILITY_AUTHORITY_AUDIT.md)

**IMPLEMENTATION EXISTS:** NO

**NO CONTRADICTION:** Authority Defined, Implementation Missing

---

## SECTION H — LAYER DISCOVERY

### runtime/replay/

**CURRENT LOCATION:** C:\Users\nolan\PING\runtime\replay\

**CURRENT RESPONSIBILITY:** Constitutional replay kernel (deterministic replay, canonicalization, witness, verification)

**CURRENT DEPENDENCIES:** None (pure TypeScript, no infrastructure dependencies)

**MUTATION RIGHTS:** None (pure functional, immutable state)

**DECISION RIGHTS:** None (no decision logic)

**KNOWLEDGE RIGHTS:** None (no knowledge storage)

**AUTHORITY RIGHTS:** SOURCE_AUTHORITY (replay), DERIVATION (witness, canonicalization, hash, certificate)

**STATUS:** LAYER PROVEN (constitutional kernel layer)

---

### runtime/adapters/

**CURRENT LOCATION:** C:\Users\nolan\PING\runtime\adapters\

**CURRENT RESPONSIBILITY:** Infrastructure adapters for external systems (PostgreSQL)

**CURRENT DEPENDENCIES:** pg library (PostgreSQL client)

**MUTATION RIGHTS:** Yes (can write to PostgreSQL)

**DECISION RIGHTS:** None (no decision logic)

**KNOWLEDGE RIGHTS:** None (no knowledge storage)

**AUTHORITY RIGHTS:** None (infrastructure adapter, not constitutional authority)

**STATUS:** LAYER UNKNOWN (infrastructure layer, constitutional ownership not proven)

---

### runtime/kernel/

**CURRENT LOCATION:** C:\Users\nolan\PING\runtime\kernel\

**CURRENT RESPONSIBILITY:** Kernel commit service (empty directory)

**CURRENT DEPENDENCIES:** None

**MUTATION RIGHTS:** Unknown (no implementation found)

**DECISION RIGHTS:** Unknown (no implementation found)

**KNOWLEDGE RIGHTS:** Unknown (no implementation found)

**AUTHORITY RIGHTS:** SHADOW (authority_registry.ts classifies KernelCommitService as SHADOW)

**STATUS:** LAYER UNKNOWN (empty directory, SHADOW authority)

---

### gateway/

**CURRENT LOCATION:** C:\Users\nolan\PING\gateway\

**CURRENT RESPONSIBILITY:** Ollama inference gateway, event emission

**CURRENT DEPENDENCIES:** pg library (PostgreSQL), express (web server)

**MUTATION RIGHTS:** Yes (can write to PostgreSQL)

**DECISION RIGHTS:** Yes (routing logic, complexity scoring)

**KNOWLEDGE RIGHTS:** None (no knowledge storage)

**AUTHORITY RIGHTS:** None (independent gateway, not constitutional authority)

**STATUS:** LAYER UNKNOWN (independent gateway, constitutional ownership not proven)

---

### brainos/newsletter/

**CURRENT LOCATION:** C:\Users\nolan\PING\brainos\newsletter\

**CURRENT RESPONSIBILITY:** Newsletter processing, SQLite storage, event emission

**CURRENT DEPENDENCIES:** sqlite3, external brain constitutional module

**MUTATION RIGHTS:** Yes (can write to SQLite)

**DECISION RIGHTS:** Yes (processing logic)

**KNOWLEDGE RIGHTS:** Yes (knowledge/ directory)

**AUTHORITY RIGHTS:** None (independent application, not constitutional authority)

**STATUS:** LAYER UNKNOWN (independent application, constitutional ownership not proven)

---

### brainos/rss/

**CURRENT LOCATION:** C:\Users\nolan\PING\brainos\rss\

**CURRENT RESPONSIBILITY:** RSS feed processing, SQLite storage, event emission

**CURRENT DEPENDENCIES:** sqlite3, external brain constitutional module

**MUTATION RIGHTS:** Yes (can write to SQLite)

**DECISION RIGHTS:** Yes (processing logic)

**KNOWLEDGE RIGHTS:** Yes (knowledge/ directory)

**AUTHORITY RIGHTS:** None (independent application, not constitutional authority)

**STATUS:** LAYER UNKNOWN (independent application, constitutional ownership not proven)

---

### constitution/

**CURRENT LOCATION:** C:\Users\nolan\PING\constitution\

**CURRENT RESPONSIBILITY:** Constitutional law definitions (layer0_kernel.md, authority_model.md, etc.)

**CURRENT DEPENDENCIES:** None (design documents only)

**MUTATION RIGHTS:** None (design documents only)

**DECISION RIGHTS:** None (design documents only)

**KNOWLEDGE RIGHTS:** None (design documents only)

**AUTHORITY RIGHTS:** SOURCE_AUTHORITY (constitutional law is source of truth)

**STATUS:** LAYER PROVEN (constitutional law layer)

---

### knowledge/

**CURRENT LOCATION:** C:\Users\nolan\PING\knowledge\

**CURRENT RESPONSIBILITY:** Knowledge design documents (authoritative, derived, experimental)

**CURRENT DEPENDENCIES:** None (design documents only)

**MUTATION RIGHTS:** None (design documents only)

**DECISION RIGHTS:** None (design documents only)

**KNOWLEDGE RIGHTS:** Yes (knowledge design documents)

**AUTHORITY RIGHTS:** None (design documents only)

**STATUS:** LAYER UNKNOWN (design documents, no runtime implementation)

---

### observation/

**CURRENT LOCATION:** C:\Users\nolan\PING\observation\

**CURRENT RESPONSIBILITY:** Empty directory

**CURRENT DEPENDENCIES:** None

**MUTATION RIGHTS:** None

**DECISION RIGHTS:** None

**KNOWLEDGE RIGHTS:** None

**AUTHORITY RIGHTS:** None

**STATUS:** LAYER UNKNOWN (empty directory)

---

### integrations/

**CURRENT LOCATION:** C:\Users\nolan\PING\integrations\

**CURRENT RESPONSIBILITY:** Integration configurations (obsidian, github, external)

**CURRENT DEPENDENCIES:** None

**MUTATION RIGHTS:** None

**DECISION RIGHTS:** None

**KNOWLEDGE RIGHTS:** None

**AUTHORITY RIGHTS:** None

**STATUS:** LAYER UNKNOWN (configuration directories, no runtime implementation)

---

## SECTION I — HUMAN SURVIVABILITY AUDIT

### If agents disappear

**SYSTEMS THAT REMAIN AUTHORITATIVE:**
- runtime/replay/ (constitutional replay kernel)
- constitution/ (constitutional law)
- runtime/adapters/postgres_event_store.ts (PostgreSQL adapter)

**SYSTEMS THAT BECOME UNUSABLE:**
- None (no agent system exists)

**MINIMUM CONSTITUTIONAL SUBSTRATE:** runtime/replay/ + constitution/

---

### If qdrant disappears

**SYSTEMS THAT REMAIN AUTHORITATIVE:**
- runtime/replay/ (constitutional replay kernel)
- constitution/ (constitutional law)
- brainos/newsletter/ (SQLite-based, independent of Qdrant)
- brainos/rss/ (SQLite-based, independent of Qdrant)

**SYSTEMS THAT BECOME UNUSABLE:**
- None (Qdrant not used in current system)

**MINIMUM CONSTITUTIONAL SUBSTRATE:** runtime/replay/ + constitution/

---

### If ollama disappears

**SYSTEMS THAT REMAIN AUTHORITATIVE:**
- runtime/replay/ (constitutional replay kernel)
- constitution/ (constitutional law)
- brainos/newsletter/ (independent of Ollama)
- brainos/rss/ (independent of Ollama)

**SYSTEMS THAT BECOME UNUSABLE:**
- gateway/ (Ollama inference gateway becomes unusable)

**MINIMUM CONSTITUTIONAL SUBSTRATE:** runtime/replay/ + constitution/

---

### If mcp disappears

**SYSTEMS THAT REMAIN AUTHORITATIVE:**
- runtime/replay/ (constitutional replay kernel)
- constitution/ (constitutional law)
- brainos/newsletter/ (independent of MCP)
- brainos/rss/ (independent of MCP)

**SYSTEMS THAT BECOME UNUSABLE:**
- None (MCP not used in current system)

**MINIMUM CONSTITUTIONAL SUBSTRATE:** runtime/replay/ + constitution/

---

### If cloud disappears

**SYSTEMS THAT REMAIN AUTHORITATIVE:**
- runtime/replay/ (constitutional replay kernel)
- constitution/ (constitutional law)
- brainos/newsletter/ (local SQLite, independent of cloud)
- brainos/rss/ (local SQLite, independent of cloud)

**SYSTEMS THAT BECOME UNUSABLE:**
- gateway/ (if cloud-hosted)
- runtime/adapters/postgres_event_store.ts (if PostgreSQL is cloud-hosted)

**MINIMUM CONSTITUTIONAL SUBSTRATE:** runtime/replay/ + constitution/ + brainos/newsletter/ + brainos/rss/

---

### If brainos disappears

**SYSTEMS THAT REMAIN AUTHORITATIVE:**
- runtime/replay/ (constitutional replay kernel)
- constitution/ (constitutional law)

**SYSTEMS THAT BECOME UNUSABLE:**
- brainos/newsletter/ (newsletter processing)
- brainos/rss/ (RSS processing)
- knowledge/ (knowledge design documents become irrelevant without implementation)

**MINIMUM CONSTITUTIONAL SUBSTRATE:** runtime/replay/ + constitution/

---

## SUCCESS CRITERIA ANSWERS

### What owns identity?

**ANSWER:** DEFINED (IMPLEMENTATION MISSING) - Law exists in constitution/authority_model.md, no runtime implementation

---

### What owns replay?

**ANSWER:** PROVEN - runtime/replay/deterministic_replay_engine.ts, runtime/replay/replay_state_machine.ts, runtime/replay/replay_event_stream.ts

---

### What owns lineage?

**ANSWER:** DEFINED (IMPLEMENTATION MISSING) - Law exists in constitution/authority_model.md, no runtime implementation

---

### What owns verification?

**ANSWER:** PROVEN - runtime/replay/replay_verification.ts

---

### What owns observations?

**ANSWER:** DEFINED (IMPLEMENTATION MISSING) - Constitutionally referenced, no runtime implementation

---

### What owns knowledge?

**ANSWER:** DEFINED (PARTIAL) - Design models exist in knowledge/authoritative/, no runtime implementation

---

### What owns recommendations?

**ANSWER:** DEFINED (IMPLEMENTATION MISSING) - Conceptually exists, no runtime implementation

---

### What owns execution?

**ANSWER:** DEFINED (IMPLEMENTATION MISSING) - Design exists in EXECUTION_GRAPH.md, no runtime implementation

---

### What owns time?

**ANSWER:** PARTIAL - Database currently acts as clock, canonical owner not established

---

### What authorizes mutation?

**ANSWER:** NONE (no capability authority, no principal tracking, no authorization rules)

---

### What survives if BrainOS disappears?

**ANSWER:** runtime/replay/ (constitutional replay kernel) + constitution/ (constitutional law)

---

### What survives if agents disappear?

**ANSWER:** runtime/replay/ (constitutional replay kernel) + constitution/ (constitutional law) (no agent system exists)

---

### What survives if infrastructure disappears?

**ANSWER:** runtime/replay/ (constitutional replay kernel) + constitution/ (constitutional law) (pure TypeScript, no infrastructure dependencies)

---

## AUDIT CONCLUSION

**CONSTITUTIONAL OWNERSHIP STATUS:** PARTIAL

**AUTHORITY CLASSIFICATION TABLE:**

Replay                    PROVEN
Verification              PROVEN
Canonicalization          IMPLEMENTED
Witness                   IMPLEMENTED
Identity                  DEFINED / IMPLEMENTATION MISSING
Lineage                   DEFINED / IMPLEMENTATION MISSING
Knowledge                 DEFINED / PARTIAL
Execution                 DEFINED / IMPLEMENTATION MISSING
Agent Registry            NOT YET REQUIRED

**AUTHORITY STATUS SUMMARY:**
- No contradictions exist (authority definitions and implementation status are consistent)
- Missing implementations are not contradictions (authority defined, implementation missing is expected state)
- Implementation dependency variances are documented (Canonicalization, Witness)
- Canonical ownership not proven for Event Creation Authority

**CRITICAL VIOLATIONS (6):**
1. Services mutate state without kernel approval (FAIL)
2. Processes bypass replay (FAIL)
3. Processes write directly to Postgres without kernel approval (FAIL)
4. Processes bypass event creation (FAIL)
5. Containers access authority stores directly (FAIL)
6. Mutation occurs without explicit authorization (FAIL)

**MINIMUM CONSTITUTIONAL SUBSTRATE:** runtime/replay/ + constitution/

**READINESS ASSESSMENT:** NOT READY FOR AGENT EXPANSION (critical authorities missing, critical violations present)

---

## OWNERSHIP SWEEP — CONSTITUTION/ AND RUNTIME/REPLAY/

### Identity Authority

**AUTHORITY:** Identity Authority

**LAW:** constitution/terminology.md (Identity Authority jurisdiction), constitution/authority_model.md (Identity Authority jurisdiction)

**INTERFACE:** DEFINED (constitutional definition exists)

**IMPLEMENTATION:** runtime/replay/certificate_authority.ts (computeCertificateCommitment, sha256), runtime/replay/canonical_json.ts (canonicalize)

**STORAGE:** None (pure functional)

---

### Verification Authority

**AUTHORITY:** Verification Authority

**LAW:** constitution/invariant_law.md (invariant definitions and enforcement law)

**INTERFACE:** DEFINED (replay_verification.ts)

**IMPLEMENTATION:** runtime/replay/replay_verification.ts (verifyDeterminism, verifyWitnessRoot, verifyFingerprint, verifyCanonicalBytes, verifyReproducibility), runtime/replay/invariant_runner.ts (runInvariants)

**STORAGE:** None (pure functional)

---

### Replay Authority

**AUTHORITY:** Replay Authority

**LAW:** constitution/replay_law.md (replay determinism and reconstruction law)

**INTERFACE:** DEFINED (deterministic_replay_engine.ts, replay_state_machine.ts, replay_event_stream.ts)

**IMPLEMENTATION:** runtime/replay/deterministic_replay_engine.ts (replay), runtime/replay/replay_state_machine.ts (applyEvent, getState), runtime/replay/replay_event_stream.ts (getEvents, toJSON)

**STORAGE:** None (pure functional)

---

### Lineage Authority

**AUTHORITY:** Lineage Authority

**LAW:** constitution/authority_model.md (Lineage Authority jurisdiction), constitution/terminology.md (Lineage definition)

**INTERFACE:** DEFINED (constitutional definition exists)

**IMPLEMENTATION:** runtime/replay/witness_authority.ts (buildLineageGraph), runtime/replay/state_serializer.ts (serializeState)

**STORAGE:** None (pure functional)

---

### Knowledge Authority

**AUTHORITY:** Knowledge Authority

**LAW:** constitution/retrieval_law.md (knowledge fabric definition)

**INTERFACE:** PARTIAL (constitutional definition exists, no runtime interface)

**IMPLEMENTATION:** MISSING (no implementation in runtime/replay/)

**STORAGE:** UNPROVEN (no storage implementation)

---

### Observation Authority

**AUTHORITY:** Observation Authority

**LAW:** constitution/source_of_truth_law.md (signal ingestion definition)

**INTERFACE:** DEFINED (constitutional definition exists)

**IMPLEMENTATION:** MISSING (no implementation in runtime/replay/)

**STORAGE:** MISSING (no storage implementation)

---

### Execution Authority

**AUTHORITY:** Execution Authority

**LAW:** constitution/mutation_law.md (mutation authorization law)

**INTERFACE:** DEFINED (constitutional definition exists)

**IMPLEMENTATION:** MISSING (no implementation in runtime/replay/)

**STORAGE:** MISSING (no storage implementation)

---

### Decision Authority

**AUTHORITY:** Decision Authority

**LAW:** Not defined in constitution/

**INTERFACE:** DEFINED (conceptual authority)

**IMPLEMENTATION:** MISSING (no implementation in runtime/replay/)

**STORAGE:** MISSING (no storage implementation)

---

### Recommendation Authority

**AUTHORITY:** Recommendation Authority

**LAW:** Not defined in constitution/

**INTERFACE:** DEFINED (conceptual authority)

**IMPLEMENTATION:** MISSING (no implementation in runtime/replay/)

**STORAGE:** MISSING (no storage implementation)

---

### Capability Authority

**AUTHORITY:** Capability Authority

**LAW:** Not defined in constitution/

**INTERFACE:** DEFINED (conceptual authority)

**IMPLEMENTATION:** MISSING (no implementation in runtime/replay/)

**STORAGE:** MISSING (no storage implementation)

---

### Time Authority

**AUTHORITY:** Time Authority

**LAW:** constitution/terminology.md (Constitutional Time definition)

**INTERFACE:** DEFINED (constitutional definition exists)

**IMPLEMENTATION:** MISSING (no implementation in runtime/replay/)

**STORAGE:** MISSING (no storage implementation)

---

### Canonicalization Authority

**AUTHORITY:** Canonicalization Authority

**LAW:** constitution/terminology.md (Canonicalization definition), constitution/authority_model.md (ELIMINATED - absorbed by Identity)

**INTERFACE:** DEFINED (canonical_json.ts)

**IMPLEMENTATION:** runtime/replay/canonical_json.ts (canonicalize, toUint8Array)

**STORAGE:** None (pure functional)

---

## PHASE J — LAW / INTERFACE / IMPLEMENTATION / STORAGE CONSISTENCY

### Identity Authority

**AUTHORITY:** Identity Authority

**LAW OWNER:** constitution/terminology.md, constitution/authority_model.md

**INTERFACE OWNER:** DEFINED (constitutional definition exists)

**IMPLEMENTATION OWNER:** runtime/replay/certificate_authority.ts, runtime/replay/canonical_json.ts

**STORAGE OWNER:** None (pure functional)

**CONSISTENT?** YES

**OWNERSHIP GAP:** LAW+INTERFACE ONLY (implementation exists but not canonical)

---

### Replay Authority

**AUTHORITY:** Replay Authority

**LAW OWNER:** constitution/replay_law.md, constitution/layer0_kernel.md

**INTERFACE OWNER:** DEFINED (deterministic_replay_engine.ts, replay_state_machine.ts, replay_event_stream.ts)

**IMPLEMENTATION OWNER:** runtime/replay/deterministic_replay_engine.ts, runtime/replay/replay_state_machine.ts, runtime/replay/replay_event_stream.ts

**STORAGE OWNER:** None (pure functional)

**CONSISTENT?** YES

**OWNERSHIP GAP:** NONE

---

### Verification Authority

**AUTHORITY:** Verification Authority

**LAW OWNER:** constitution/invariant_law.md

**INTERFACE OWNER:** DEFINED (replay_verification.ts)

**IMPLEMENTATION OWNER:** runtime/replay/replay_verification.ts, runtime/replay/invariant_runner.ts

**STORAGE OWNER:** None (pure functional)

**CONSISTENT?** YES

**OWNERSHIP GAP:** NONE

---

### Witness Authority

**AUTHORITY:** Witness Authority

**LAW OWNER:** constitution/witness_law.md

**INTERFACE OWNER:** DEFINED (witness_authority.ts, merkle_tree.ts)

**IMPLEMENTATION OWNER:** runtime/replay/witness_authority.ts, runtime/replay/merkle_tree.ts

**STORAGE OWNER:** None (pure functional)

**CONSISTENT?** YES

**OWNERSHIP GAP:** NONE

---

### Canonicalization Authority

**AUTHORITY:** Canonicalization Authority

**LAW OWNER:** constitution/terminology.md, constitution/authority_model.md

**INTERFACE OWNER:** DEFINED (canonical_json.ts)

**IMPLEMENTATION OWNER:** runtime/replay/canonical_json.ts, runtime/replay/canonical_hash_authority.ts

**STORAGE OWNER:** None (pure functional)

**CONSISTENT?** YES

**OWNERSHIP GAP:** NONE

---

### Lineage Authority

**AUTHORITY:** Lineage Authority

**LAW OWNER:** constitution/authority_model.md, constitution/terminology.md

**INTERFACE OWNER:** DEFINED (constitutional definition exists)

**IMPLEMENTATION OWNER:** runtime/replay/witness_authority.ts (buildLineageGraph), runtime/replay/state_serializer.ts (serializeState)

**STORAGE OWNER:** None (pure functional)

**CONSISTENT?** YES

**OWNERSHIP GAP:** LAW+INTERFACE ONLY (implementation exists but not canonical)

---

### Knowledge Authority

**AUTHORITY:** Knowledge Authority

**LAW OWNER:** constitution/retrieval_law.md

**INTERFACE OWNER:** PARTIAL (constitutional definition exists, no runtime interface)

**IMPLEMENTATION OWNER:** MISSING (no implementation in runtime/replay/)

**STORAGE OWNER:** UNPROVEN (no storage implementation)

**CONSISTENT?** NO

**OWNERSHIP GAP:** LAW ONLY

---

### Observation Authority

**AUTHORITY:** Observation Authority

**LAW OWNER:** constitution/source_of_truth_law.md

**INTERFACE OWNER:** DEFINED (constitutional definition exists)

**IMPLEMENTATION OWNER:** MISSING (no implementation in runtime/replay/)

**STORAGE OWNER:** MISSING (no storage implementation)

**CONSISTENT?** NO

**OWNERSHIP GAP:** LAW ONLY

---

### Execution Authority

**AUTHORITY:** Execution Authority

**LAW OWNER:** constitution/mutation_law.md

**INTERFACE OWNER:** DEFINED (constitutional definition exists)

**IMPLEMENTATION OWNER:** MISSING (no implementation in runtime/replay/)

**STORAGE OWNER:** MISSING (no storage implementation)

**CONSISTENT?** NO

**OWNERSHIP GAP:** LAW ONLY

---

### Recommendation Authority

**AUTHORITY:** Recommendation Authority

**LAW OWNER:** Not defined in constitution/

**INTERFACE OWNER:** DEFINED (conceptual authority)

**IMPLEMENTATION OWNER:** MISSING (no implementation in runtime/replay/)

**STORAGE OWNER:** MISSING (no storage implementation)

**CONSISTENT?** NO

**OWNERSHIP GAP:** IMPLEMENTATION ONLY (conceptual, no law)

---

### Decision Authority

**AUTHORITY:** Decision Authority

**LAW OWNER:** Not defined in constitution/

**INTERFACE OWNER:** DEFINED (conceptual authority)

**IMPLEMENTATION OWNER:** MISSING (no implementation in runtime/replay/)

**STORAGE OWNER:** MISSING (no storage implementation)

**CONSISTENT?** NO

**OWNERSHIP GAP:** IMPLEMENTATION ONLY (conceptual, no law)

---

### Capability Authority

**AUTHORITY:** Capability Authority

**LAW OWNER:** Not defined in constitution/

**INTERFACE OWNER:** DEFINED (conceptual authority)

**IMPLEMENTATION OWNER:** MISSING (no implementation in runtime/replay/)

**STORAGE OWNER:** MISSING (no storage implementation)

**CONSISTENT?** NO

**OWNERSHIP GAP:** IMPLEMENTATION ONLY (conceptual, no law)

---

### Time Authority

**AUTHORITY:** Time Authority

**LAW OWNER:** constitution/terminology.md

**INTERFACE OWNER:** DEFINED (constitutional definition exists)

**IMPLEMENTATION OWNER:** MISSING (no implementation in runtime/replay/)

**STORAGE OWNER:** MISSING (no storage implementation)

**CONSISTENT?** NO

**OWNERSHIP GAP:** LAW ONLY

---

## PHASE K — STORAGE AUTHORITY MAPPING

### Postgres

**STORE:** PostgreSQL

**AUTHORITIES PERSISTED:** Event Creation Authority, Time Authority (via NOW() function)

**OWNER MODULE:** runtime/adapters/postgres_event_store.ts (stub), gateway/event_emitter.js (independent implementation)

**OWNER SERVICE:** gateway/event_emitter.js

**CAN RECONSTRUCT AUTHORITY?** NO (Postgres cannot reconstruct all authorities)

**CONSTITUTIONAL STATUS:** SHADOW (not constitutionally declared as canonical store)

---

### SQLite

**STORE:** SQLite (brainos/newsletter/newsletters.db, brainos/rss/knowledge.db)

**AUTHORITIES PERSISTED:** None (application state, not constitutional authorities)

**OWNER MODULE:** brainos/newsletter/database.py, brainos/rss/database.py

**OWNER SERVICE:** brainos/newsletter, brainos/rss

**CAN RECONSTRUCT AUTHORITY?** NO (SQLite stores application state, not constitutional authorities)

**CONSTITUTIONAL STATUS:** UNPROVEN (not constitutionally declared)

---

### Filesystem

**STORE:** Filesystem (brainos/newsletter/knowledge/, brainos/rss/knowledge/)

**AUTHORITIES PERSISTED:** Knowledge Authority (design documents)

**OWNER MODULE:** brainos/newsletter, brainos/rss

**OWNER SERVICE:** brainos/newsletter, brainos/rss

**CAN RECONSTRUCT AUTHORITY?** NO (filesystem stores design documents, not runtime authorities)

**CONSTITUTIONAL STATUS:** UNPROVEN (not constitutionally declared)

---

### Memory

**STORE:** Memory (runtime/replay/ pure functional)

**AUTHORITIES PERSISTED:** None (pure functional, no persistence)

**OWNER MODULE:** runtime/replay/

**OWNER SERVICE:** None (pure functional)

**CAN RECONSTRUCT AUTHORITY?** NO (memory is not persistent)

**CONSTITUTIONAL STATUS:** CANONICAL (pure functional, constitutional kernel)

---

### External APIs

**STORE:** External APIs (Yahoo Mail, RSS feeds, Ollama)

**AUTHORITIES PERSISTED:** None (external data sources, not constitutional authorities)

**OWNER MODULE:** gateway/, brainos/newsletter/, brainos/rss/

**OWNER SERVICE:** gateway/, brainos/newsletter/, brainos/rss/

**CAN RECONSTRUCT AUTHORITY?** NO (external APIs are not constitutional authorities)

**CONSTITUTIONAL STATUS:** UNPROVEN (not constitutionally declared)

---

## PHASE L — SHADOW AUTHORITY DETECTION

### gateway/event_emitter.js

**SHADOW AUTHORITY:** Event Creation Authority

**CLAIMED RESPONSIBILITY:** Emits events to PostgreSQL using pg library

**CONSTITUTIONAL OWNER:** None (no constitutional owner declared)

**RISK:** HIGH (independent implementation, no constitutional ownership)

---

### brainos/newsletter/newsletters.db

**SHADOW AUTHORITY:** Application State Authority (not constitutional)

**CLAIMED RESPONSIBILITY:** Stores newsletter processing state in SQLite

**CONSTITUTIONAL OWNER:** None (not a constitutional authority)

**RISK:** MEDIUM (application state, not constitutional authority)

---

### brainos/rss/knowledge.db

**SHADOW AUTHORITY:** Application State Authority (not constitutional)

**CLAIMED RESPONSIBILITY:** Stores RSS processing state in SQLite

**CONSTITUTIONAL OWNER:** None (not a constitutional authority)

**RISK:** MEDIUM (application state, not constitutional authority)

---

### crypto.createHash (gateway/event_emitter.js)

**SHADOW AUTHORITY:** Identity Authority (independent implementation)

**CLAIMED RESPONSIBILITY:** Generates SHA-256 hashes independently

**CONSTITUTIONAL OWNER:** runtime/replay/canonical_json.ts (canonical implementation)

**RISK:** HIGH (independent identity generation, canonical ownership not proven)

---

### PostgreSQL NOW() function

**SHADOW AUTHORITY:** Time Authority

**CLAIMED RESPONSIBILITY:** Database acts as clock

**CONSTITUTIONAL OWNER:** None (no PING timestamp authority)

**RISK:** MEDIUM (database owns time authority, not constitutional)

---

## PHASE M — AUTHORITY MUTATION SURFACE

### Identity Authority

**WHO MAY MUTATE IT:** None (pure functional, immutable)

**FILES:** runtime/replay/certificate_authority.ts, runtime/replay/canonical_json.ts

**SERVICES:** None (pure functional)

**DATABASES:** None (pure functional)

**CONTAINERS:** None (pure functional)

**CAN MUTATE WITHOUT REPLAY?** NO (pure functional, immutable)

**CAN MUTATE WITHOUT VERIFICATION?** NO (pure functional, immutable)

**CAN MUTATE WITHOUT CAPABILITY?** NO (pure functional, immutable)

---

### Replay Authority

**WHO MAY MUTATE IT:** None (pure functional, immutable)

**FILES:** runtime/replay/deterministic_replay_engine.ts, runtime/replay/replay_state_machine.ts, runtime/replay/replay_event_stream.ts

**SERVICES:** None (pure functional)

**DATABASES:** None (pure functional)

**CONTAINERS:** None (pure functional)

**CAN MUTATE WITHOUT REPLAY?** NO (pure functional, immutable)

**CAN MUTATE WITHOUT VERIFICATION?** NO (pure functional, immutable)

**CAN MUTATE WITHOUT CAPABILITY?** NO (pure functional, immutable)

---

### Verification Authority

**WHO MAY MUTATE IT:** None (pure functional, immutable)

**FILES:** runtime/replay/replay_verification.ts, runtime/replay/invariant_runner.ts

**SERVICES:** None (pure functional)

**DATABASES:** None (pure functional)

**CONTAINERS:** None (pure functional)

**CAN MUTATE WITHOUT REPLAY?** NO (pure functional, immutable)

**CAN MUTATE WITHOUT VERIFICATION?** NO (pure functional, immutable)

**CAN MUTATE WITHOUT CAPABILITY?** NO (pure functional, immutable)

---

### Witness Authority

**WHO MAY MUTATE IT:** None (pure functional, immutable)

**FILES:** runtime/replay/witness_authority.ts, runtime/replay/merkle_tree.ts

**SERVICES:** None (pure functional)

**DATABASES:** None (pure functional)

**CONTAINERS:** None (pure functional)

**CAN MUTATE WITHOUT REPLAY?** NO (pure functional, immutable)

**CAN MUTATE WITHOUT VERIFICATION?** NO (pure functional, immutable)

**CAN MUTATE WITHOUT CAPABILITY?** NO (pure functional, immutable)

---

### Canonicalization Authority

**WHO MAY MUTATE IT:** None (pure functional, immutable)

**FILES:** runtime/replay/canonical_json.ts, runtime/replay/canonical_hash_authority.ts

**SERVICES:** None (pure functional)

**DATABASES:** None (pure functional)

**CONTAINERS:** None (pure functional)

**CAN MUTATE WITHOUT REPLAY?** NO (pure functional, immutable)

**CAN MUTATE WITHOUT VERIFICATION?** NO (pure functional, immutable)

**CAN MUTATE WITHOUT CAPABILITY?** NO (pure functional, immutable)

---

### Lineage Authority

**WHO MAY MUTATE IT:** None (pure functional, immutable)

**FILES:** runtime/replay/witness_authority.ts, runtime/replay/state_serializer.ts

**SERVICES:** None (pure functional)

**DATABASES:** None (pure functional)

**CONTAINERS:** None (pure functional)

**CAN MUTATE WITHOUT REPLAY?** NO (pure functional, immutable)

**CAN MUTATE WITHOUT VERIFICATION?** NO (pure functional, immutable)

**CAN MUTATE WITHOUT CAPABILITY?** NO (pure functional, immutable)

---

### Knowledge Authority

**WHO MAY MUTATE IT:** None (design documents only)

**FILES:** knowledge/authoritative/, knowledge/derived/, knowledge/experimental/

**SERVICES:** None (design documents only)

**DATABASES:** None (design documents only)

**CONTAINERS:** None (design documents only)

**CAN MUTATE WITHOUT REPLAY?** N/A (no runtime implementation)

**CAN MUTATE WITHOUT VERIFICATION?** N/A (no runtime implementation)

**CAN MUTATE WITHOUT CAPABILITY?** N/A (no runtime implementation)

---

### Observation Authority

**WHO MAY MUTATE IT:** None (no implementation)

**FILES:** observation/ (empty placeholders)

**SERVICES:** None (no implementation)

**DATABASES:** None (no implementation)

**CONTAINERS:** None (no implementation)

**CAN MUTATE WITHOUT REPLAY?** N/A (no implementation)

**CAN MUTATE WITHOUT VERIFICATION?** N/A (no implementation)

**CAN MUTATE WITHOUT CAPABILITY?** N/A (no implementation)

---

### Execution Authority

**WHO MAY MUTATE IT:** None (no implementation)

**FILES:** runtime/kernel/commit-service/ (empty)

**SERVICES:** None (no implementation)

**DATABASES:** None (no implementation)

**CONTAINERS:** None (no implementation)

**CAN MUTATE WITHOUT REPLAY?** N/A (no implementation)

**CAN MUTATE WITHOUT VERIFICATION?** N/A (no implementation)

**CAN MUTATE WITHOUT CAPABILITY?** N/A (no implementation)

---

### Recommendation Authority

**WHO MAY MUTATE IT:** None (no implementation)

**FILES:** None (no implementation)

**SERVICES:** None (no implementation)

**DATABASES:** None (no implementation)

**CONTAINERS:** None (no implementation)

**CAN MUTATE WITHOUT REPLAY?** N/A (no implementation)

**CAN MUTATE WITHOUT VERIFICATION?** N/A (no implementation)

**CAN MUTATE WITHOUT CAPABILITY?** N/A (no implementation)

---

### Decision Authority

**WHO MAY MUTATE IT:** None (no implementation)

**FILES:** None (no implementation)

**SERVICES:** None (no implementation)

**DATABASES:** None (no implementation)

**CONTAINERS:** None (no implementation)

**CAN MUTATE WITHOUT REPLAY?** N/A (no implementation)

**CAN MUTATE WITHOUT VERIFICATION?** N/A (no implementation)

**CAN MUTATE WITHOUT CAPABILITY?** N/A (no implementation)

---

### Capability Authority

**WHO MAY MUTATE IT:** None (no implementation)

**FILES:** None (no implementation)

**SERVICES:** None (no implementation)

**DATABASES:** None (no implementation)

**CONTAINERS:** None (no implementation)

**CAN MUTATE WITHOUT REPLAY?** N/A (no implementation)

**CAN MUTATE WITHOUT VERIFICATION?** N/A (no implementation)

**CAN MUTATE WITHOUT CAPABILITY?** N/A (no implementation)

---

### Time Authority

**WHO MAY MUTATE IT:** PostgreSQL (database acts as clock)

**FILES:** gateway/event_emitter.js (application time), brainos/newsletter/database.py (application time), brainos/rss/database.py (application time)

**SERVICES:** gateway/, brainos/newsletter/, brainos/rss/

**DATABASES:** PostgreSQL (NOW() function)

**CONTAINERS:** gateway/, brainos/newsletter/, brainos/rss/

**CAN MUTATE WITHOUT REPLAY?** YES (database acts as clock, no replay enforcement)

**CAN MUTATE WITHOUT VERIFICATION?** YES (database acts as clock, no verification enforcement)

**CAN MUTATE WITHOUT CAPABILITY?** YES (database acts as clock, no capability enforcement)

---

## PHASE N — LAYER 0 PROOF

### constitution/terminology.md

**FILE:** constitution/terminology.md

**REASON IT QUALIFIES FOR LAYER 0:** Defines constitutional terminology (Identity, Canonicalization, Time)

**REQUIRED FOR RECONSTRUCTION?** YES (constitutional definitions required for reconstruction)

---

### constitution/authority_model.md

**FILE:** constitution/authority_model.md

**REASON IT QUALIFIES FOR LAYER 0:** Defines authority model and jurisdiction

**REQUIRED FOR RECONSTRUCTION?** YES (authority model required for reconstruction)

---

### constitution/replay_law.md

**FILE:** constitution/replay_law.md

**REASON IT QUALIFIES FOR LAYER 0:** Defines replay determinism and reconstruction law

**REQUIRED FOR RECONSTRUCTION?** YES (replay law required for reconstruction)

---

### constitution/invariant_law.md

**FILE:** constitution/invariant_law.md

**REASON IT QUALIFIES FOR LAYER 0:** Defines invariant definitions and enforcement law

**REQUIRED FOR RECONSTRUCTION?** YES (invariant law required for verification)

---

### constitution/witness_law.md

**FILE:** constitution/witness_law.md

**REASON IT QUALIFIES FOR LAYER 0:** Defines witness authority and Merkle proof

**REQUIRED FOR RECONSTRUCTION?** YES (witness law required for reconstruction)

---

### constitution/mutation_law.md

**FILE:** constitution/mutation_law.md

**REASON IT QUALIFIES FOR LAYER 0:** Defines mutation authorization law

**REQUIRED FOR RECONSTRUCTION?** YES (mutation law required for execution authority)

---

### constitution/layer0_kernel.md

**FILE:** constitution/layer0_kernel.md

**REASON IT QUALIFIES FOR LAYER 0:** Defines constitutional kernel and layer boundaries

**REQUIRED FOR RECONSTRUCTION?** YES (kernel definition required for reconstruction)

---

### runtime/replay/deterministic_replay_engine.ts

**FILE:** runtime/replay/deterministic_replay_engine.ts

**REASON IT QUALIFIES FOR LAYER 0:** Implements deterministic replay engine

**REQUIRED FOR RECONSTRUCTION?** YES (replay engine required for reconstruction)

---

### runtime/replay/replay_state_machine.ts

**FILE:** runtime/replay/replay_state_machine.ts

**REASON IT QUALIFIES FOR LAYER 0:** Implements replay state machine

**REQUIRED FOR RECONSTRUCTION?** YES (state machine required for reconstruction)

---

### runtime/replay/replay_event_stream.ts

**FILE:** runtime/replay/replay_event_stream.ts

**REASON IT QUALIFIES FOR LAYER 0:** Implements replay event stream

**REQUIRED FOR RECONSTRUCTION?** YES (event stream required for reconstruction)

---

### runtime/replay/replay_verification.ts

**FILE:** runtime/replay/replay_verification.ts

**REASON IT QUALIFIES FOR LAYER 0:** Implements verification authority

**REQUIRED FOR RECONSTRUCTION?** YES (verification required for reconstruction)

---

### runtime/replay/invariant_runner.ts

**FILE:** runtime/replay/invariant_runner.ts

**REASON IT QUALIFIES FOR LAYER 0:** Implements invariant runner

**REQUIRED FOR RECONSTRUCTION?** YES (invariant runner required for verification)

---

### runtime/replay/witness_authority.ts

**FILE:** runtime/replay/witness_authority.ts

**REASON IT QUALIFIES FOR LAYER 0:** Implements witness authority

**REQUIRED FOR RECONSTRUCTION?** YES (witness authority required for reconstruction)

---

### runtime/replay/merkle_tree.ts

**FILE:** runtime/replay/merkle_tree.ts

**REASON IT QUALIFIES FOR LAYER 0:** Implements Merkle tree for witness generation

**REQUIRED FOR RECONSTRUCTION?** YES (Merkle tree required for witness generation)

---

### runtime/replay/canonical_json.ts

**FILE:** runtime/replay/canonical_json.ts

**REASON IT QUALIFIES FOR LAYER 0:** Implements canonicalization authority

**REQUIRED FOR RECONSTRUCTION?** YES (canonicalization required for reconstruction)

---

### runtime/replay/canonical_hash_authority.ts

**FILE:** runtime/replay/canonical_hash_authority.ts

**REASON IT QUALIFIES FOR LAYER 0:** Implements canonical hash authority

**REQUIRED FOR RECONSTRUCTION?** YES (canonical hash required for reconstruction)

---

### runtime/replay/certificate_authority.ts

**FILE:** runtime/replay/certificate_authority.ts

**REASON IT QUALIFIES FOR LAYER 0:** Implements certificate authority

**REQUIRED FOR RECONSTRUCTION?** YES (certificate authority required for identity)

---

### runtime/replay/state_serializer.ts

**FILE:** runtime/replay/state_serializer.ts

**REASON IT QUALIFIES FOR LAYER 0:** Implements state serialization

**REQUIRED FOR RECONSTRUCTION?** YES (state serialization required for lineage reconstruction)

---

### runtime/replay/replay_types.ts

**FILE:** runtime/replay/replay_types.ts

**REASON IT QUALIFIES FOR LAYER 0:** Defines replay types

**REQUIRED FOR RECONSTRUCTION?** YES (type definitions required for reconstruction)

---

### runtime/replay/replay_invariants.ts

**FILE:** runtime/replay/replay_invariants.ts

**REASON IT QUALIFIES FOR LAYER 0:** Defines replay invariants

**REQUIRED FOR RECONSTRUCTION?** YES (invariant definitions required for verification)

---

### runtime/replay/replay_limits.ts

**FILE:** runtime/replay/replay_limits.ts

**REASON IT QUALIFIES FOR LAYER 0:** Defines replay limits

**REQUIRED FOR RECONSTRUCTION?** YES (replay limits required for reconstruction safety)

---

## PHASE O — CONSTITUTIONAL SURVIVABILITY

### If Postgres disappears

**AUTHORITIES THAT SURVIVE:**
- Identity Authority (pure functional, no Postgres dependency)
- Replay Authority (pure functional, no Postgres dependency)
- Verification Authority (pure functional, no Postgres dependency)
- Witness Authority (pure functional, no Postgres dependency)
- Canonicalization Authority (pure functional, no Postgres dependency)
- Lineage Authority (pure functional, no Postgres dependency)
- Knowledge Authority (design documents, no Postgres dependency)
- Observation Authority (no implementation, no Postgres dependency)
- Execution Authority (no implementation, no Postgres dependency)
- Recommendation Authority (no implementation, no Postgres dependency)
- Decision Authority (no implementation, no Postgres dependency)
- Capability Authority (no implementation, no Postgres dependency)

**AUTHORITIES THAT DIE:**
- Event Creation Authority (Postgres is storage)
- Time Authority (Postgres NOW() function is clock)

**EVIDENCE:** runtime/replay/ is pure functional, no infrastructure dependencies

---

### If SQLite disappears

**AUTHORITIES THAT SURVIVE:**
- Identity Authority (pure functional, no SQLite dependency)
- Replay Authority (pure functional, no SQLite dependency)
- Verification Authority (pure functional, no SQLite dependency)
- Witness Authority (pure functional, no SQLite dependency)
- Canonicalization Authority (pure functional, no SQLite dependency)
- Lineage Authority (pure functional, no SQLite dependency)
- Knowledge Authority (design documents, no SQLite dependency)
- Observation Authority (no implementation, no SQLite dependency)
- Execution Authority (no implementation, no SQLite dependency)
- Recommendation Authority (no implementation, no SQLite dependency)
- Decision Authority (no implementation, no SQLite dependency)
- Capability Authority (no implementation, no SQLite dependency)
- Event Creation Authority (Postgres, not SQLite)
- Time Authority (Postgres, not SQLite)

**AUTHORITIES THAT DIE:**
- None (SQLite stores application state, not constitutional authorities)

**EVIDENCE:** SQLite stores application state (brainos/newsletter/newsletters.db, brainos/rss/knowledge.db), not constitutional authorities

---

### If runtime/replay disappears

**AUTHORITIES THAT DIE:**
- Identity Authority (implementation in runtime/replay/)
- Replay Authority (implementation in runtime/replay/)
- Verification Authority (implementation in runtime/replay/)
- Witness Authority (implementation in runtime/replay/)
- Canonicalization Authority (implementation in runtime/replay/)
- Lineage Authority (implementation in runtime/replay/)

**AUTHORITIES THAT SURVIVE:**
- Knowledge Authority (design documents in knowledge/)
- Observation Authority (no implementation)
- Execution Authority (no implementation)
- Recommendation Authority (no implementation)
- Decision Authority (no implementation)
- Capability Authority (no implementation)
- Event Creation Authority (gateway/event_emitter.js)
- Time Authority (Postgres NOW() function)

**EVIDENCE:** runtime/replay/ contains all constitutional authority implementations

---

### If constitution disappears

**AUTHORITIES THAT BECOME UNDEFINED:**
- Identity Authority (law in constitution/)
- Replay Authority (law in constitution/)
- Verification Authority (law in constitution/)
- Witness Authority (law in constitution/)
- Canonicalization Authority (law in constitution/)
- Lineage Authority (law in constitution/)
- Knowledge Authority (law in constitution/)
- Observation Authority (law in constitution/)
- Execution Authority (law in constitution/)
- Time Authority (law in constitution/)

**AUTHORITIES THAT REMAIN DEFINED:**
- Recommendation Authority (conceptual, no law)
- Decision Authority (conceptual, no law)
- Capability Authority (conceptual, no law)

**EVIDENCE:** constitution/ contains all constitutional law definitions

---

## SUCCESS CRITERIA ANSWERS

### Which authorities are fully owned?

**ANSWER:** Replay Authority, Verification Authority, Witness Authority, Canonicalization Authority (law, interface, implementation, storage consistent)

---

### Which authorities are law-only?

**ANSWER:** Knowledge Authority, Observation Authority, Execution Authority, Time Authority (law defined, implementation missing)

---

### Which authorities are implementation-only?

**ANSWER:** Recommendation Authority, Decision Authority, Capability Authority (conceptual, no law)

---

### Which authorities are shadow-owned?

**ANSWER:** Event Creation Authority (gateway/event_emitter.js independent implementation), Time Authority (PostgreSQL NOW() function), Identity Authority (crypto.createHash independent implementation)

---

### Which authorities have no storage?

**ANSWER:** Identity Authority, Replay Authority, Verification Authority, Witness Authority, Canonicalization Authority, Lineage Authority (pure functional, no persistence)

---

### Which authorities have multiple owners?

**ANSWER:** Event Creation Authority (runtime/adapters/postgres_event_store.ts, gateway/event_emitter.js), Identity Authority (runtime/replay/canonical_json.ts, gateway/event_emitter.js crypto.createHash), Time Authority (PostgreSQL NOW(), application time in gateway/ and brainos/)

---

### What exactly constitutes Layer 0?

**ANSWER:** constitution/ (constitutional law definitions) + runtime/replay/ (constitutional authority implementations: deterministic_replay_engine.ts, replay_state_machine.ts, replay_event_stream.ts, replay_verification.ts, invariant_runner.ts, witness_authority.ts, merkle_tree.ts, canonical_json.ts, canonical_hash_authority.ts, certificate_authority.ts, state_serializer.ts, replay_types.ts, replay_invariants.ts, replay_limits.ts)

---

### What exactly is not Layer 0?

**ANSWER:** runtime/adapters/ (infrastructure adapters), runtime/kernel/ (empty, SHADOW authority), gateway/ (independent gateway), brainos/ (independent applications), knowledge/ (design documents only), observation/ (empty placeholders), integrations/ (configuration directories)

**STORAGE OWNER:** MISSING (requires event store)

**CAPABILITY OWNER:** MISSING (requires capability enforcement)

---

### Time Authority

**CONSTITUTIONAL OWNER:** constitution/terminology.md

**RUNTIME OWNER:** MISSING (requires constitutional clock implementation)

**STORAGE OWNER:** MISSING (pure functional)

**CAPABILITY OWNER:** MISSING (requires time read capability)

---

### Event Creation Authority

**CONSTITUTIONAL OWNER:** constitution/authority_model.md (Event Recording Authority)

**RUNTIME OWNER:** MISSING (requires constitutional implementation)

**STORAGE OWNER:** MISSING (requires event store)

**CAPABILITY OWNER:** MISSING (requires capability enforcement)

---

### Agent Registry Authority

**CONSTITUTIONAL OWNER:** Not defined (NOT YET REQUIRED)

**RUNTIME OWNER:** MISSING (not required)

**STORAGE OWNER:** MISSING (not required)

**CAPABILITY OWNER:** MISSING (not required)

---

### Final Closure Verdict

### Which authorities are complete?

**ANSWER:** Identity Authority, Replay Authority, Verification Authority, Witness Authority, Canonicalization Authority, Lineage Authority (6 authorities)

---

### Which authorities are incomplete?

**ANSWER:** Knowledge Authority, Observation Authority, Execution Authority, Time Authority, Event Creation Authority (5 authorities)

---

### Which authorities should be removed?

**ANSWER:** Recommendation Authority, Decision Authority, Workflow Registry (3 authorities - conceptual only, no constitutional requirement)

---

### Which authorities must be implemented next?

**ANSWER:** Execution Authority (mutation authorization is critical for constitutional sovereignty), Time Authority (constitutional clock is critical for determinism), Event Creation Authority (event recording is critical for replay), Knowledge Authority (knowledge fabric is critical for intelligence), Observation Authority (signal ingestion is critical for knowledge)

---

### Which shadow authorities must be eliminated first?

**ANSWER:** gateway/event_emitter.js (HIGH RISK - bypasses constitutional event recording authority), crypto.createHash in gateway/event_emitter.js (HIGH RISK - independent identity generation), PostgreSQL NOW() function (MEDIUM RISK - database acts as clock), SQLite persistence in brainos/newsletter/ and brainos/rss/ (MEDIUM RISK - application state bypasses constitutional authority)

---

### Is PING constitutionally closed?

**ANSWER:** NO

---

### If not, what exact authorities prevent closure?

**ANSWER:** Execution Authority (no implementation, mutation authorization missing), Time Authority (no implementation, database acts as shadow clock), Event Creation Authority (no constitutional implementation, shadow authority exists), Knowledge Authority (no implementation, shadow SQLite storage exists), Observation Authority (no implementation, no signal ingestion)

---

### CONSTITUTIONAL_CLOSURE_SCORE

**FORMULA:** Owned Authorities ÷ Required Authorities

**CALCULATION:** 6 (Identity, Replay, Verification, Witness, Canonicalization, Lineage) ÷ 11 (Identity, Replay, Verification, Witness, Canonicalization, Lineage, Knowledge, Observation, Execution, Time, Event Creation)

**SCORE:** 6 / 11

**PERCENTAGE:** 54.5%

---

## PHASE P — CONSTITUTIONAL CLOSURE PLAN

### Authority Closure Matrix

| Authority | Keep | Eliminate | Merge Into | Law Required | Interface Required | Implementation Required | Storage Required | Capability Required |
| --------- | ---- | --------- | ---------- | ------------ | ------------------ | ----------------------- | ---------------- | ------------------- |
| Identity | YES | NO | None | YES | YES | YES | NO | NO |
| Replay | YES | NO | None | YES | YES | YES | NO | NO |
| Verification | YES | NO | None | YES | YES | YES | NO | NO |
| Witness | YES | NO | None | YES | YES | YES | NO | NO |
| Canonicalization | NO | YES | Identity | YES | YES | YES | NO | NO |
| Lineage | YES | NO | None | YES | YES | YES | NO | NO |
| Knowledge | YES | NO | None | YES | YES | YES | YES | YES |
| Observation | YES | NO | None | YES | YES | YES | YES | YES |
| Execution | YES | NO | None | YES | YES | YES | YES | YES |
| Recommendation | NO | YES | None | NO | NO | NO | NO | NO |
| Decision | NO | YES | None | NO | NO | NO | NO | NO |
| Capability | YES | NO | None | YES | YES | YES | NO | YES |
| Time | YES | NO | None | YES | YES | YES | YES | YES |
| Event Creation | NO | YES | None | NO | NO | NO | YES | YES |
| Agent Registry | NO | YES | None | NO | NO | NO | YES | YES |
| Workflow Registry | NO | YES | None | NO | NO | NO | YES | YES |

---

### Constitutional Elimination Candidates

### Canonicalization Authority

**WHY IT EXISTS:** Originally defined as separate authority for canonical JSON serialization

**WHY IT IS REDUNDANT:** Canonicalization is a component of Identity Authority (certificate commitment requires canonicalization)

**WHICH AUTHORITY ABSORBS IT:** Identity Authority

**CONSTITUTIONAL IMPACT:** constitution/authority_model.md declares Canonicalization Authority ELIMINATED - absorbed by Identity. runtime/replay/canonical_json.ts becomes implementation detail of Identity Authority, not independent authority.

---

### Recommendation Authority

**WHY IT EXISTS:** Conceptual authority for agent recommendations

**WHY IT IS REDUNDANT:** No constitutional law defines it; no implementation exists; not required for constitutional reconstruction

**WHICH AUTHORITY ABSORBS IT:** None (eliminated entirely)

**CONSTITUTIONAL IMPACT:** No constitutional impact; never had law definition; conceptual only.

---

### Decision Authority

**WHY IT EXISTS:** Conceptual authority for agent decisions

**WHY IT IS REDUNDANT:** No constitutional law defines it; no implementation exists; not required for constitutional reconstruction

**WHICH AUTHORITY ABSORBS IT:** None (eliminated entirely)

**CONSTITUTIONAL IMPACT:** No constitutional impact; never had law definition; conceptual only.

---

### Event Creation Authority

**WHY IT EXISTS:** gateway/event_emitter.js emits events to PostgreSQL

**WHY IT IS REDUNDANT:** No constitutional law defines it; shadow authority bypasses constitutional kernel; contested ownership

**WHICH AUTHORITY ABSORBS IT:** None (eliminated entirely - events should be created through constitutional kernel)

**CONSTITUTIONAL IMPACT:** High - shadow authority must be eliminated; event emission must go through constitutional kernel with Replay, Verification, Witness, Capability enforcement.

---

### Agent Registry Authority

**WHY IT EXISTS:** brainos/ applications track agent state

**WHY IT IS REDUNDANT:** No constitutional law defines it; application state, not constitutional authority

**WHICH AUTHORITY ABSORBS IT:** None (eliminated entirely - application state not constitutional)

**CONSTITUTIONAL IMPACT:** Low - application state, not constitutional domain.

---

### Workflow Registry Authority

**WHY IT EXISTS:** brainos/ applications track workflow state

**WHY IT IS REDUNDANT:** No constitutional law defines it; application state, not constitutional authority

**WHICH AUTHORITY ABSORBS IT:** None (eliminated entirely - application state not constitutional)

**CONSTITUTIONAL IMPACT:** Low - application state, not constitutional domain.

---

### Constitutional Missing Authorities

### Knowledge Authority

**CONSTITUTIONAL LAW SOURCE:** constitution/retrieval_law.md

**REQUIRED INTERFACE:** Knowledge fabric interface (query, retrieval, indexing)

**REQUIRED IMPLEMENTATION:** runtime/replay/knowledge_authority.ts (MISSING)

**REQUIRED STORAGE:** Constitutional knowledge store (UNPROVEN - currently shadow-owned by SQLite)

**REQUIRED CAPABILITY BOUNDARY:** Knowledge read/write capability (MISSING)

---

### Observation Authority

**CONSTITUTIONAL LAW SOURCE:** constitution/source_of_truth_law.md

**REQUIRED INTERFACE:** Signal ingestion interface (observe, validate, ingest)

**REQUIRED IMPLEMENTATION:** runtime/replay/observation_authority.ts (MISSING)

**REQUIRED STORAGE:** Constitutional observation store (MISSING)

**REQUIRED CAPABILITY BOUNDARY:** Observation read/write capability (MISSING)

---

### Execution Authority

**CONSTITUTIONAL LAW SOURCE:** constitution/mutation_law.md

**REQUIRED INTERFACE:** Mutation authorization interface (authorize, execute, audit)

**REQUIRED IMPLEMENTATION:** runtime/replay/execution_authority.ts (MISSING)

**REQUIRED STORAGE:** Constitutional execution log (MISSING)

**REQUIRED CAPABILITY BOUNDARY:** Execution capability (MISSING)

---

### Time Authority

**CONSTITUTIONAL LAW SOURCE:** constitution/terminology.md

**REQUIRED INTERFACE:** Constitutional timestamp interface (now, tick, verify)

**REQUIRED IMPLEMENTATION:** runtime/replay/time_authority.ts (MISSING)

**REQUIRED STORAGE:** Constitutional time log (SHADOW-OWNED by PostgreSQL NOW())

**REQUIRED CAPABILITY BOUNDARY:** Time read capability (MISSING)

---

### Shadow Authority Removal Plan

### gateway/event_emitter.js

**CURRENT OWNER:** gateway/event_emitter.js (independent implementation)

**CONSTITUTIONAL OWNER:** None (Event Creation Authority eliminated)

**MIGRATION STRATEGY:** Eliminate direct PostgreSQL writes; route all event emission through constitutional kernel with Replay, Verification, Witness, Capability enforcement

**DELETION STRATEGY:** Delete gateway/event_emitter.js after constitutional kernel event emission path is implemented

**RISK LEVEL:** HIGH (shadow authority bypasses constitutional authorities)

---

### PostgreSQL NOW() function

**CURRENT OWNER:** PostgreSQL database (database acts as clock)

**CONSTITUTIONAL OWNER:** Time Authority (constitutional implementation required)

**MIGRATION STRATEGY:** Implement runtime/replay/time_authority.ts; replace all PostgreSQL NOW() calls with constitutional time authority

**DELETION STRATEGY:** Eliminate PostgreSQL NOW() usage after Time Authority implementation

**RISK LEVEL:** MEDIUM (database owns time authority, not PING)

---

### crypto.createHash (gateway/event_emitter.js)

**CURRENT OWNER:** gateway/event_emitter.js (independent hashing implementation)

**CONSTITUTIONAL OWNER:** Identity Authority (runtime/replay/canonical_json.ts)

**MIGRATION STRATEGY:** Replace all crypto.createHash calls with runtime/replay/canonical_json.ts canonicalization

**DELETION STRATEGY:** Delete gateway/event_emitter.js after migration

**RISK LEVEL:** HIGH (independent canonicalization creates divergence)

---

### SQLite persistence (brainos/newsletter/database.py, brainos/rss/database.py)

**CURRENT OWNER:** brainos/newsletter/database.py, brainos/rss/database.py

**CONSTITUTIONAL OWNER:** Knowledge Authority (constitutional implementation required)

**MIGRATION STRATEGY:** Implement runtime/replay/knowledge_authority.ts; migrate SQLite data to constitutional knowledge store

**DELETION STRATEGY:** Delete SQLite stores after migration to constitutional knowledge store

**RISK LEVEL:** MEDIUM (bypasses constitutional knowledge fabric)

---

### Capability Closure Proof

### Mutation Path: Event Creation

**PRINCIPAL:** Gateway service

**CAPABILITY:** Event Creation capability (MISSING)

**REPLAY REQUIRED:** YES (events must be replayable)

**VERIFICATION REQUIRED:** YES (events must be verified)

**ALLOWED:** NO (shadow authority, no constitutional authorization)

---

### Mutation Path: Knowledge Write

**PRINCIPAL:** Newsletter service, RSS service

**CAPABILITY:** Knowledge write capability (MISSING)

**REPLAY REQUIRED:** YES (knowledge changes must be replayable)

**VERIFICATION REQUIRED:** YES (knowledge changes must be verified)

**ALLOWED:** NO (shadow authority, no constitutional authorization)

---

### Mutation Path: Time Mutation

**PRINCIPAL:** PostgreSQL database

**CAPABILITY:** Time write capability (MISSING)

**REPLAY REQUIRED:** YES (time must be replayable)

**VERIFICATION REQUIRED:** YES (time must be verifiable)

**ALLOWED:** NO (shadow authority, no constitutional authorization)

---

### Mutation Path: Identity Generation

**PRINCIPAL:** gateway/event_emitter.js

**CAPABILITY:** Identity generation capability (MISSING)

**REPLAY REQUIRED:** YES (identity must be replayable)

**VERIFICATION REQUIRED:** YES (identity must be verifiable)

**ALLOWED:** NO (shadow authority, no constitutional authorization)

---

### Layer 0 Completeness Proof

### Identity Authority

**CAN LAYER 0 RECONSTRUCT?** YES

**EVIDENCE:** runtime/replay/certificate_authority.ts, runtime/replay/canonical_json.ts implement pure functional identity authority

---

### Replay Authority

**CAN LAYER 0 RECONSTRUCT?** YES

**EVIDENCE:** runtime/replay/deterministic_replay_engine.ts, runtime/replay/replay_state_machine.ts, runtime/replay/replay_event_stream.ts implement pure functional replay authority

---

### Verification Authority

**CAN LAYER 0 RECONSTRUCT?** YES

**EVIDENCE:** runtime/replay/replay_verification.ts, runtime/replay/invariant_runner.ts implement pure functional verification authority

---

### Witness Authority

**CAN LAYER 0 RECONSTRUCT?** YES

**EVIDENCE:** runtime/replay/witness_authority.ts, runtime/replay/merkle_tree.ts implement pure functional witness authority

---

### Canonicalization Authority

**CAN LAYER 0 RECONSTRUCT?** YES

**EVIDENCE:** runtime/replay/canonical_json.ts implements pure functional canonicalization (absorbed into Identity Authority)

---

### Lineage Authority

**CAN LAYER 0 RECONSTRUCT?** YES

**EVIDENCE:** runtime/replay/witness_authority.ts, runtime/replay/state_serializer.ts implement pure functional lineage authority

---

### Knowledge Authority

**CAN LAYER 0 RECONSTRUCT?** NO

**EVIDENCE:** No constitutional implementation exists in runtime/replay/; shadow-owned by SQLite

---

### Observation Authority

**CAN LAYER 0 RECONSTRUCT?** NO

**EVIDENCE:** No constitutional implementation exists in runtime/replay/; no implementation at all

---

### Execution Authority

**CAN LAYER 0 RECONSTRUCT?** NO

**EVIDENCE:** No constitutional implementation exists in runtime/replay/; no implementation at all

---

### Time Authority

**CAN LAYER 0 RECONSTRUCT?** NO

**EVIDENCE:** No constitutional implementation exists in runtime/replay/; shadow-owned by PostgreSQL NOW()

---

### Constitutional Bootstrap Sequence

If the repository were deleted and rebuilt from Layer 0 only:

1. Constitution (constitution/terminology.md, constitution/authority_model.md, constitution/replay_law.md, constitution/invariant_law.md, constitution/witness_law.md, constitution/mutation_law.md, constitution/source_of_truth_law.md, constitution/retrieval_law.md)
2. Replay Types (runtime/replay/replay_types.ts)
3. Canonicalization (runtime/replay/canonical_json.ts - absorbed into Identity)
4. Identity (runtime/replay/certificate_authority.ts)
5. Verification (runtime/replay/replay_verification.ts, runtime/replay/invariant_runner.ts)
6. Witness (runtime/replay/witness_authority.ts, runtime/replay/merkle_tree.ts)
7. Replay Engine (runtime/replay/deterministic_replay_engine.ts, runtime/replay/replay_state_machine.ts, runtime/replay/replay_event_stream.ts)
8. Lineage (runtime/replay/state_serializer.ts)
9. Capability (runtime/replay/authority_registry.ts, runtime/replay/authority_classification.ts)
10. Knowledge (MISSING - requires implementation)
11. Observation (MISSING - requires implementation)
12. Execution (MISSING - requires implementation)
13. Time (MISSING - requires implementation)

---

### Constitutional End State

### Identity Authority

**CONSTITUTIONAL OWNER:** constitution/terminology.md, constitution/authority_model.md

**RUNTIME OWNER:** runtime/replay/certificate_authority.ts, runtime/replay/canonical_json.ts

**STORAGE OWNER:** None (pure functional)

**CAPABILITY OWNER:** None (pure functional, immutable)

---

### Replay Authority

**CONSTITUTIONAL OWNER:** constitution/replay_law.md, constitution/layer0_kernel.md

**RUNTIME OWNER:** runtime/replay/deterministic_replay_engine.ts, runtime/replay/replay_state_machine.ts, runtime/replay/replay_event_stream.ts

**STORAGE OWNER:** None (pure functional)

**CAPABILITY OWNER:** None (pure functional, immutable)

---

### Verification Authority

**CONSTITUTIONAL OWNER:** constitution/invariant_law.md

**RUNTIME OWNER:** runtime/replay/replay_verification.ts, runtime/replay/invariant_runner.ts

**STORAGE OWNER:** None (pure functional)

**CAPABILITY OWNER:** None (pure functional, immutable)

---

### Witness Authority

**CONSTITUTIONAL OWNER:** constitution/witness_law.md

**RUNTIME OWNER:** runtime/replay/witness_authority.ts, runtime/replay/merkle_tree.ts

**STORAGE OWNER:** None (pure functional)

**CAPABILITY OWNER:** None (pure functional, immutable)

---

### Lineage Authority

**CONSTITUTIONAL OWNER:** constitution/authority_model.md, constitution/terminology.md

**RUNTIME OWNER:** runtime/replay/witness_authority.ts, runtime/replay/state_serializer.ts

**STORAGE OWNER:** None (pure functional)

**CAPABILITY OWNER:** None (pure functional, immutable)

---

### Knowledge Authority

**CONSTITUTIONAL OWNER:** constitution/retrieval_law.md

**RUNTIME OWNER:** runtime/replay/knowledge_authority.ts (MISSING)

**STORAGE OWNER:** Constitutional knowledge store (MISSING)

**CAPABILITY OWNER:** Knowledge read/write capability (MISSING)

---

### Observation Authority

**CONSTITUTIONAL OWNER:** constitution/source_of_truth_law.md

**RUNTIME OWNER:** runtime/replay/observation_authority.ts (MISSING)

**STORAGE OWNER:** Constitutional observation store (MISSING)

**CAPABILITY OWNER:** Observation read/write capability (MISSING)

---

### Execution Authority

**CONSTITUTIONAL OWNER:** constitution/mutation_law.md

**RUNTIME OWNER:** runtime/replay/execution_authority.ts (MISSING)

**STORAGE OWNER:** Constitutional execution log (MISSING)

**CAPABILITY OWNER:** Execution capability (MISSING)

---

### Capability Authority

**CONSTITUTIONAL OWNER:** constitution/authority_model.md (capability enforcement law)

**RUNTIME OWNER:** runtime/replay/authority_registry.ts, runtime/replay/authority_classification.ts

**STORAGE OWNER:** None (pure functional)

**CAPABILITY OWNER:** Capability enforcement (MISSING)

---

### Time Authority

**CONSTITUTIONAL OWNER:** constitution/terminology.md

**RUNTIME OWNER:** runtime/replay/time_authority.ts (MISSING)

**STORAGE OWNER:** Constitutional time log (MISSING)

**CAPABILITY OWNER:** Time read capability (MISSING)

---

### Final Closure Verdict

### Which authorities are complete?

**ANSWER:** Identity Authority, Replay Authority, Verification Authority, Witness Authority, Lineage Authority

**EVIDENCE:** Law, interface, implementation consistent; no shadows; no contested ownership

---

### Which authorities are incomplete?

**ANSWER:** Knowledge Authority, Observation Authority, Execution Authority, Time Authority, Capability Authority

**EVIDENCE:** Law defined, implementation missing; no constitutional runtime implementation

---

### Which authorities should be removed?

**ANSWER:** Canonicalization Authority (absorbed into Identity), Recommendation Authority (no law), Decision Authority (no law), Event Creation Authority (shadow authority), Agent Registry Authority (application state), Workflow Registry Authority (application state)

**EVIDENCE:** No constitutional law or redundant with other authorities

---

### Which authorities must be implemented next?

**ANSWER:** Knowledge Authority, Observation Authority, Execution Authority, Time Authority

**EVIDENCE:** Constitutional law exists, no runtime implementation; required for constitutional closure

---

### Which shadow authorities must be eliminated first?

**ANSWER:** gateway/event_emitter.js (Event Creation Authority), PostgreSQL NOW() function (Time Authority), crypto.createHash in gateway/event_emitter.js (Identity Authority), SQLite stores (Knowledge Authority)

**EVIDENCE:** Shadow authorities bypass constitutional authorities; high risk of divergence

---

### Is PING constitutionally closed?

**ANSWER:** NO

**EVIDENCE:** 4 authorities missing implementation (Knowledge, Observation, Execution, Time); 4 shadow authorities bypass constitutional kernel (Event Creation, Time, Identity, Knowledge); Capability Authority missing enforcement

---

### What exact authorities prevent closure?

**ANSWER:** Knowledge Authority (missing implementation, shadow-owned by SQLite), Observation Authority (missing implementation), Execution Authority (missing implementation), Time Authority (missing implementation, shadow-owned by PostgreSQL), Capability Authority (missing enforcement), Event Creation Authority (shadow authority, must be eliminated)

---

### CONSTITUTIONAL_CLOSURE_SCORE

**FORMULA:** Owned Authorities ÷ Required Authorities

**CALCULATION:** 5 (Identity, Replay, Verification, Witness, Lineage) ÷ 9 (Identity, Replay, Verification, Witness, Lineage, Knowledge, Observation, Execution, Time)

**SCORE:** 5 / 9

**PERCENTAGE:** 55.56%

---

## PHASE P — CONSTITUTIONAL CLOSURE PLAN

### Objective

For every authority discovered in this document:

Determine:

* Whether the authority should exist
* Whether the authority should be eliminated
* Whether the authority should be absorbed into another authority
* Whether the authority requires constitutional law
* Whether the authority requires runtime implementation
* Whether the authority requires storage
* Whether the authority requires capability enforcement

---

### Authority Closure Matrix

For every authority:

| Authority | Keep | Eliminate | Merge Into | Law Required | Interface Required | Implementation Required | Storage Required | Capability Required |
| --------- | ---- | --------- | ---------- | ------------ | ------------------ | ----------------------- | ---------------- | ------------------- |
| Identity | YES | NO | None | YES (constitution/terminology.md, constitution/authority_model.md) | YES (certificate_authority.ts) | YES (runtime/replay/certificate_authority.ts) | NO (pure functional) | NO (immutable) |
| Replay | YES | NO | None | YES (constitution/replay_law.md) | YES (deterministic_replay_engine.ts) | YES (runtime/replay/deterministic_replay_engine.ts) | NO (pure functional) | NO (immutable) |
| Verification | YES | NO | None | YES (constitution/invariant_law.md) | YES (replay_verification.ts) | YES (runtime/replay/replay_verification.ts) | NO (pure functional) | NO (immutable) |
| Witness | YES | NO | None | YES (constitution/witness_law.md - ELIMINATED per authority_model.md, absorbed by Identity + Replay) | YES (witness_authority.ts) | YES (runtime/replay/witness_authority.ts) | NO (pure functional) | NO (immutable) |
| Canonicalization | NO | YES | Identity | YES (constitution/terminology.md - ELIMINATED per authority_model.md, absorbed by Identity) | YES (canonical_json.ts) | YES (runtime/replay/canonical_json.ts) | NO (pure functional) | NO (immutable) |
| Lineage | YES | NO | None | YES (constitution/authority_model.md, constitution/terminology.md) | YES (witness_authority.ts, state_serializer.ts) | YES (runtime/replay/witness_authority.ts, state_serializer.ts) | NO (pure functional) | NO (immutable) |
| Knowledge | YES | NO | None | YES (constitution/retrieval_law.md) | YES (constitutional definition exists) | YES (MISSING - must implement in runtime/replay/) | YES (MISSING - constitutional storage required) | YES (capability enforcement required) |
| Observation | YES | NO | None | YES (constitution/source_of_truth_law.md) | YES (constitutional definition exists) | YES (MISSING - must implement in runtime/replay/) | YES (MISSING - constitutional storage required) | YES (capability enforcement required) |
| Execution | YES | NO | None | YES (constitution/mutation_law.md) | YES (constitutional definition exists) | YES (MISSING - must implement in runtime/replay/) | YES (MISSING - constitutional storage required) | YES (capability enforcement required) |
| Recommendation | NO | YES | None | NO (not defined in constitution/) | NO (conceptual only) | NO (not constitutional) | NO (not constitutional) | NO (not constitutional) |
| Decision | NO | YES | None | NO (not defined in constitution/) | NO (conceptual only) | NO (not constitutional) | NO (not constitutional) | NO (not constitutional) |
| Capability | YES | NO | None | NO (not defined in constitution/ - should be defined) | YES (conceptual authority) | YES (MISSING - must implement in runtime/replay/) | NO (pure functional) | YES (capability enforcement required) |
| Time | YES | NO | None | YES (constitution/terminology.md) | YES (constitutional definition exists) | YES (MISSING - must implement in runtime/replay/) | NO (pure functional) | NO (immutable) |
| Event Creation | NO | YES | Replay | NO (not defined in constitution/) | NO (shadow authority) | NO (shadow authority) | NO (shadow authority) | NO (shadow authority) |
| Agent Registry | NO | YES | None | NO (not defined in constitution/) | NO (NOT YET REQUIRED) | NO (NOT YET REQUIRED) | NO (NOT YET REQUIRED) | NO (NOT YET REQUIRED) |
| Workflow Registry | NO | YES | None | NO (not defined in constitution/) | NO (NOT YET REQUIRED) | NO (NOT YET REQUIRED) | NO (NOT YET REQUIRED) | NO (NOT YET REQUIRED) |

---

### Constitutional Elimination Candidates

Identify authorities that should not exist as independent authorities.

For each:

* Why it exists
* Why it is redundant
* Which authority absorbs it
* Constitutional impact

---

### Canonicalization Authority

**WHY IT EXISTS:** Originally defined as independent canonicalization authority for JSON canonicalization (RFC-8785) and hash generation.

**WHY IT IS REDUNDANT:** Canonicalization is a sub-function of Identity Authority. Identity Authority already owns certificate commitments and hash generation (SHA-256). RFC-8785 canonicalization is a specific implementation detail of identity computation, not a separate constitutional domain.

**WHICH AUTHORITY ABSORBS IT:** Identity Authority

**CONSTITUTIONAL IMPACT:** 
- constitution/terminology.md: Remove canonicalization as independent authority
- constitution/authority_model.md: Update to reflect canonicalization absorbed by Identity
- runtime/replay/canonical_json.ts: Retain as implementation detail of Identity Authority
- runtime/replay/canonical_hash_authority.ts: Retain as implementation detail of Identity Authority
- No functional impact: canonicalization continues to work as part of Identity Authority

---

### Recommendation Authority

**WHY IT EXISTS:** Conceptual authority for recommendation generation in agent workflows.

**WHY IT IS REDUNDANT:** Not defined in constitution/. No constitutional law exists. No implementation exists. Purely conceptual placeholder with no constitutional basis. Recommendations are application-level concerns, not constitutional authorities.

**WHICH AUTHORITY ABSORBS IT:** None (eliminate entirely)

**CONSTITUTIONAL IMPACT:**
- No constitutional impact (no law exists)
- Remove from conceptual authority list
- Future recommendations should be implemented as application-level services, not constitutional authorities

---

### Decision Authority

**WHY IT EXISTS:** Conceptual authority for decision-making in agent workflows.

**WHY IT IS REDUNDANT:** Not defined in constitution/. No constitutional law exists. No implementation exists. Purely conceptual placeholder with no constitutional basis. Decision-making is application-level concern, not constitutional authority.

**WHICH AUTHORITY ABSORBS IT:** None (eliminate entirely)

**CONSTITUTIONAL IMPACT:**
- No constitutional impact (no law exists)
- Remove from conceptual authority list
- Future decision-making should be implemented as application-level services, not constitutional authorities

---

### Event Creation Authority

**WHY IT EXISTS:** Shadow authority for event emission in gateway/event_emitter.js. Direct PostgreSQL writes without constitutional authorization.

**WHY IT IS REDUNDANT:** Event creation is a sub-function of Replay Authority. Replay Authority owns event stream, event application, and state reconstruction. Independent event creation bypasses constitutional replay and creates competing event source.

**WHICH AUTHORITY ABSORBS IT:** Replay Authority

**CONSTITUTIONAL IMPACT:**
- Eliminate gateway/event_emitter.js direct PostgreSQL writes
- All event creation must go through Replay Authority
- Replay Authority must be the sole source of event emission
- Constitutional impact: HIGH (requires migration of event emission path)

---

### Agent Registry Authority

**WHY IT EXISTS:** Placeholder for agent registration in future agent expansion.

**WHY IT IS REDUNDANT:** Not defined in constitution/. No constitutional law exists. No implementation exists. No agents currently exist. Premature authority definition without constitutional basis.

**WHICH AUTHORITY ABSORBS IT:** None (eliminate entirely)

**CONSTITUTIONAL IMPACT:**
- No constitutional impact (no law exists)
- Remove from authority list
- Future agent registration should be implemented as application-level service, not constitutional authority

---

### Workflow Registry Authority

**WHY IT EXISTS:** Placeholder for workflow registration in future agent expansion.

**WHY IT IS REDUNDANT:** Not defined in constitution/. No constitutional law exists. No implementation exists. No workflows currently exist. Premature authority definition without constitutional basis.

**WHICH AUTHORITY ABSORBS IT:** None (eliminate entirely)

**CONSTITUTIONAL IMPACT:**
- No constitutional impact (no law exists)
- Remove from authority list
- Future workflow registration should be implemented as application-level service, not constitutional authority

---

### Constitutional Missing Authorities

Identify authorities required by the Constitution but missing from runtime.

For each:

* Constitutional law source
* Required interface
* Required implementation
* Required storage
* Required capability boundary

---

### Knowledge Authority

**CONSTITUTIONAL LAW SOURCE:** constitution/retrieval_law.md

**REQUIRED INTERFACE:** Knowledge retrieval interface (query, retrieval, indexing)

**REQUIRED IMPLEMENTATION:** runtime/replay/knowledge_authority.ts (MISSING - must implement)

**REQUIRED STORAGE:** Constitutional knowledge fabric (MISSING - must implement, not SQLite shadow storage)

**REQUIRED CAPABILITY BOUNDARY:** Knowledge retrieval requires capability enforcement (READ_KNOWLEDGE capability)

**IMPLEMENTATION STATUS:** LAW+INTERFACE ONLY (implementation missing, storage shadow-owned by SQLite)

**MIGRATION STRATEGY:**
- Implement runtime/replay/knowledge_authority.ts
- Implement constitutional knowledge fabric (pure functional or constitutional storage)
- Migrate brainos/newsletter/database.py and brainos/rss/database.py to use constitutional knowledge fabric
- Eliminate SQLite shadow storage for knowledge

---

### Observation Authority

**CONSTITUTIONAL LAW SOURCE:** constitution/source_of_truth_law.md

**REQUIRED INTERFACE:** Signal ingestion interface (observe, validate, canonicalize)

**REQUIRED IMPLEMENTATION:** runtime/replay/observation_authority.ts (MISSING - must implement)

**REQUIRED STORAGE:** Constitutional observation store (MISSING - must implement)

**REQUIRED CAPABILITY BOUNDARY:** Signal ingestion requires capability enforcement (OBSERVE capability)

**IMPLEMENTATION STATUS:** LAW+INTERFACE ONLY (implementation missing, storage missing)

**MIGRATION STRATEGY:**
- Implement runtime/replay/observation_authority.ts
- Implement constitutional observation store
- All external signal ingestion must go through Observation Authority
- Eliminate direct external API calls bypassing constitutional authority

---

### Execution Authority

**CONSTITUTIONAL LAW SOURCE:** constitution/mutation_law.md

**REQUIRED INTERFACE:** Mutation authorization interface (authorize, execute, audit)

**REQUIRED IMPLEMENTATION:** runtime/replay/execution_authority.ts (MISSING - must implement)

**REQUIRED STORAGE:** Constitutional execution ledger (MISSING - must implement)

**REQUIRED CAPABILITY BOUNDARY:** Mutation requires capability enforcement (EXECUTE capability)

**IMPLEMENTATION STATUS:** LAW+INTERFACE ONLY (implementation missing, storage missing)

**MIGRATION STRATEGY:**
- Implement runtime/replay/execution_authority.ts
- Implement constitutional execution ledger
- All state mutations must go through Execution Authority
- Eliminate direct database writes bypassing constitutional authority

---

### Time Authority

**CONSTITUTIONAL LAW SOURCE:** constitution/terminology.md

**REQUIRED INTERFACE:** Constitutional time interface (now, timestamp, clock)

**REQUIRED IMPLEMENTATION:** runtime/replay/time_authority.ts (MISSING - must implement)

**REQUIRED STORAGE:** None (pure functional, immutable)

**REQUIRED CAPABILITY BOUNDARY:** Time access requires capability enforcement (READ_TIME capability)

**IMPLEMENTATION STATUS:** LAW ONLY (implementation missing, storage shadow-owned by PostgreSQL NOW())

**MIGRATION STRATEGY:**
- Implement runtime/replay/time_authority.ts
- Eliminate PostgreSQL NOW() function as time authority
- All time access must go through Time Authority
- Time Authority must be deterministic for replay

---

### Capability Authority

**CONSTITUTIONAL LAW SOURCE:** None (MISSING - must define in constitution/capability_law.md)

**REQUIRED INTERFACE:** Capability interface (grant, revoke, check, enforce)

**REQUIRED IMPLEMENTATION:** runtime/replay/capability_authority.ts (MISSING - must implement)

**REQUIRED STORAGE:** None (pure functional, immutable)

**REQUIRED CAPABILITY BOUNDARY:** Capability management requires root capability (CAPABILITY_MANAGE)

**IMPLEMENTATION STATUS:** NOT DEFINED (no constitutional law exists)

**MIGRATION STRATEGY:**
- Define constitution/capability_law.md
- Implement runtime/replay/capability_authority.ts
- All mutation paths must require capability checks
- Implement capability enforcement in all authorities

---

### Shadow Authority Removal Plan

For every shadow authority:

* Current owner
* Constitutional owner
* Migration strategy
* Deletion strategy
* Risk level

---

### gateway/event_emitter.js

**SHADOW AUTHORITY:** Event Creation Authority

**CURRENT OWNER:** gateway/event_emitter.js (direct PostgreSQL writes)

**CONSTITUTIONAL OWNER:** Replay Authority (constitution/replay_law.md)

**MIGRATION STRATEGY:**
1. Implement constitutional event emission interface in Replay Authority
2. Modify gateway/event_emitter.js to call Replay Authority instead of direct PostgreSQL writes
3. Replay Authority validates event against constitutional law
4. Replay Authority emits event through constitutional event stream
5. Remove direct PostgreSQL pool from gateway/event_emitter.js

**DELETION STRATEGY:**
1. Remove PostgreSQL pool setup from gateway/event_emitter.js
2. Remove direct INSERT queries from gateway/event_emitter.js
3. Remove event_emitter.js if no longer needed after migration
4. Verify all event emission goes through Replay Authority

**RISK LEVEL:** HIGH (gateway/event_emitter.js is critical path for event emission)

---

### PostgreSQL NOW() function

**SHADOW AUTHORITY:** Time Authority

**CURRENT OWNER:** PostgreSQL database (NOW() function)

**CONSTITUTIONAL OWNER:** Time Authority (constitution/terminology.md - implementation missing)

**MIGRATION STRATEGY:**
1. Implement runtime/replay/time_authority.ts with deterministic time interface
2. Replace all PostgreSQL NOW() calls with Time Authority calls
3. Time Authority provides deterministic timestamps for replay
4. Time Authority maintains logical clock for consistency

**DELETION STRATEGY:**
1. Remove all PostgreSQL NOW() function calls from codebase
2. Remove database-level timestamp defaults
3. Verify all time access goes through Time Authority

**RISK LEVEL:** MEDIUM (PostgreSQL NOW() is used throughout codebase)

---

### crypto.createHash implementations

**SHADOW AUTHORITY:** Identity Authority

**CURRENT OWNER:** gateway/event_emitter.js (Node.js crypto.createHash)

**CONSTITUTIONAL OWNER:** Identity Authority (runtime/replay/certificate_authority.ts)

**MIGRATION STRATEGY:**
1. Replace all crypto.createHash calls with certificate_authority.ts SHA-256 implementation
2. Ensure all identity generation goes through Identity Authority
3. Verify hash consistency across all implementations

**DELETION STRATEGY:**
1. Remove crypto.createHash imports from gateway/event_emitter.js
2. Remove independent hashing implementations
3. Verify all hashing goes through Identity Authority

**RISK LEVEL:** HIGH (independent hashing creates identity divergence)

---

### SQLite persistence (brainos/newsletter/database.py, brainos/rss/database.py)

**SHADOW AUTHORITY:** Knowledge Authority

**CURRENT OWNER:** brainos/newsletter/database.py, brainos/rss/database.py (direct SQLite writes)

**CONSTITUTIONAL OWNER:** Knowledge Authority (constitution/retrieval_law.md - implementation missing)

**MIGRATION STRATEGY:**
1. Implement runtime/replay/knowledge_authority.ts
2. Implement constitutional knowledge fabric
3. Modify brainos/newsletter/database.py to use constitutional knowledge fabric
4. Modify brainos/rss/database.py to use constitutional knowledge fabric
5. Migrate existing SQLite data to constitutional knowledge fabric

**DELETION STRATEGY:**
1. Remove direct SQLite writes from brainos/newsletter/database.py
2. Remove direct SQLite writes from brainos/rss/database.py
3. Remove SQLite database files after migration
4. Verify all knowledge access goes through Knowledge Authority

**RISK LEVEL:** MEDIUM (SQLite stores application data, not critical constitutional data)

---

### Capability Closure Proof

For every mutation path discovered:

Determine:

* Required principal
* Required capability
* Required authorization check
* Required audit trail
* Required replay evidence

Produce:

| Mutation Path | Principal | Capability | Replay Required | Verification Required | Allowed |
| ------------- | --------- | ---------- | --------------- | --------------------- | ------- |

---

### Mutation Path: Event Creation

**PRINCIPAL:** Gateway Service

**CAPABILITY:** EMIT_EVENT (capability not defined)

**AUTHORIZATION CHECK:** None (bypasses constitutional authority)

**AUDIT TRAIL:** None (direct PostgreSQL writes, no audit)

**REPLAY EVIDENCE:** None (bypasses replay, no replay evidence)

**ALLOWED:** NO (shadow authority, must migrate to Replay Authority)

---

### Mutation Path: Knowledge Storage

**PRINCIPAL:** Newsletter Service, RSS Service

**CAPABILITY:** WRITE_KNOWLEDGE (capability not defined)

**AUTHORIZATION CHECK:** None (direct SQLite writes, no authorization)

**AUDIT TRAIL:** None (direct SQLite writes, no audit)

**REPLAY EVIDENCE:** None (bypasses replay, no replay evidence)

**ALLOWED:** NO (shadow authority, must migrate to Knowledge Authority)

---

### Mutation Path: Time Access

**PRINCIPAL:** Gateway Service, Application Services

**CAPABILITY:** READ_TIME (capability not defined)

**AUTHORIZATION CHECK:** None (PostgreSQL NOW() function, no authorization)

**AUDIT TRAIL:** None (database timestamps, no audit)

**REPLAY EVIDENCE:** None (PostgreSQL timestamps are non-deterministic)

**ALLOWED:** NO (shadow authority, must migrate to Time Authority)

---

### Mutation Path: Identity Generation

**PRINCIPAL:** Gateway Service

**CAPABILITY:** GENERATE_IDENTITY (capability not defined)

**AUTHORIZATION CHECK:** None (crypto.createHash, no authorization)

**AUDIT TRAIL:** None (independent hashing, no audit)

**REPLAY EVIDENCE:** PARTIAL (hash is deterministic, but bypasses Identity Authority)

**ALLOWED:** NO (shadow authority, must migrate to Identity Authority)

---

### Layer 0 Completeness Proof

Determine whether Layer 0 is sufficient to reconstruct:

* Identity
* Replay
* Verification
* Witness
* Canonicalization
* Lineage
* Knowledge
* Observation
* Execution
* Time

For each authority answer:

* YES
* NO
* PARTIAL

Provide evidence.

---

### Identity Authority

**COMPLETENESS:** YES

**EVIDENCE:**
- constitution/terminology.md: Defines identity jurisdiction
- constitution/authority_model.md: Defines identity ownership
- runtime/replay/certificate_authority.ts: Implements SHA-256 hashing
- runtime/replay/canonical_json.ts: Implements RFC-8785 canonicalization
- Pure functional, no infrastructure dependencies
- Can reconstruct from Layer 0 alone

---

### Replay Authority

**COMPLETENESS:** YES

**EVIDENCE:**
- constitution/replay_law.md: Defines replay determinism and reconstruction
- runtime/replay/deterministic_replay_engine.ts: Implements deterministic replay
- runtime/replay/replay_state_machine.ts: Implements state machine
- runtime/replay/replay_event_stream.ts: Implements event stream
- runtime/replay/replay_types.ts: Defines replay types
- Pure functional, no infrastructure dependencies
- Can reconstruct from Layer 0 alone

---

### Verification Authority

**COMPLETENESS:** YES

**EVIDENCE:**
- constitution/invariant_law.md: Defines invariant enforcement
- runtime/replay/replay_verification.ts: Implements determinism verification
- runtime/replay/invariant_runner.ts: Implements invariant enforcement
- runtime/replay/replay_invariants.ts: Defines invariants
- Pure functional, no infrastructure dependencies
- Can reconstruct from Layer 0 alone

---

### Witness Authority

**COMPLETENESS:** YES

**EVIDENCE:**
- constitution/witness_law.md: Defines witness generation (ELIMINATED per authority_model.md, but implementation exists)
- runtime/replay/witness_authority.ts: Implements witness generation
- runtime/replay/merkle_tree.ts: Implements Merkle tree construction
- Pure functional, no infrastructure dependencies
- Can reconstruct from Layer 0 alone

---

### Canonicalization Authority

**COMPLETENESS:** YES (but should be absorbed by Identity Authority)

**EVIDENCE:**
- constitution/terminology.md: Defines canonicalization (ELIMINATED per authority_model.md)
- runtime/replay/canonical_json.ts: Implements RFC-8785 canonicalization
- runtime/replay/canonical_hash_authority.ts: Implements hash authority
- Pure functional, no infrastructure dependencies
- Can reconstruct from Layer 0 alone

---

### Lineage Authority

**COMPLETENESS:** YES

**EVIDENCE:**
- constitution/authority_model.md: Defines lineage jurisdiction
- constitution/terminology.md: Defines lineage terminology
- runtime/replay/witness_authority.ts: Implements buildLineageGraph
- runtime/replay/state_serializer.ts: Implements state serialization
- Pure functional, no infrastructure dependencies
- Can reconstruct from Layer 0 alone

---

### Knowledge Authority

**COMPLETENESS:** NO

**EVIDENCE:**
- constitution/retrieval_law.md: Defines knowledge fabric
- runtime/replay/: MISSING implementation
- Storage: MISSING constitutional storage (shadow-owned by SQLite)
- Cannot reconstruct from Layer 0 alone (implementation missing)

---

### Observation Authority

**COMPLETENESS:** NO

**EVIDENCE:**
- constitution/source_of_truth_law.md: Defines signal ingestion
- runtime/replay/: MISSING implementation
- Storage: MISSING constitutional storage
- Cannot reconstruct from Layer 0 alone (implementation missing)

---

### Execution Authority

**COMPLETENESS:** NO

**EVIDENCE:**
- constitution/mutation_law.md: Defines mutation authorization
- runtime/replay/: MISSING implementation
- Storage: MISSING constitutional storage
- Cannot reconstruct from Layer 0 alone (implementation missing)

---

### Time Authority

**COMPLETENESS:** NO

**EVIDENCE:**
- constitution/terminology.md: Defines constitutional time
- runtime/replay/: MISSING implementation
- Storage: Shadow-owned by PostgreSQL NOW() function
- Cannot reconstruct from Layer 0 alone (implementation missing)

---

### Constitutional Bootstrap Sequence

If the repository were deleted and rebuilt from Layer 0 only:

List the exact reconstruction order.

---

### Step 1: Constitution

**FILES:**
- constitution/terminology.md
- constitution/authority_model.md
- constitution/replay_law.md
- constitution/invariant_law.md
- constitution/witness_law.md
- constitution/mutation_law.md
- constitution/source_of_truth_law.md
- constitution/retrieval_law.md

**REASON:** Constitutional law defines all authority jurisdictions and requirements. Must be loaded first to establish authority boundaries.

---

### Step 2: Replay Types

**FILES:**
- runtime/replay/replay_types.ts

**REASON:** Type definitions required for all replay implementations. Must be loaded before any replay code.

---

### Step 3: Canonicalization (Identity Sub-function)

**FILES:**
- runtime/replay/canonical_json.ts
- runtime/replay/canonical_hash_authority.ts

**REASON:** Canonicalization required for identity computation. Must be loaded before identity authority.

---

### Step 4: Identity Authority

**FILES:**
- runtime/replay/certificate_authority.ts

**REASON:** Identity authority required for all other authorities (events, witnesses, etc.). Must be loaded before replay.

---

### Step 5: Verification Authority

**FILES:**
- runtime/replay/replay_verification.ts
- runtime/replay/invariant_runner.ts
- runtime/replay/replay_invariants.ts

**REASON:** Verification required for replay integrity. Must be loaded before replay engine.

---

### Step 6: Witness Authority

**FILES:**
- runtime/replay/witness_authority.ts
- runtime/replay/merkle_tree.ts

**REASON:** Witness generation required for lineage. Must be loaded before replay engine.

---

### Step 7: Replay Engine

**FILES:**
- runtime/replay/deterministic_replay_engine.ts
- runtime/replay/replay_state_machine.ts
- runtime/replay/replay_event_stream.ts

**REASON:** Replay engine is core constitutional substrate. Requires identity, verification, witness to be loaded first.

---

### Step 8: Lineage Authority

**FILES:**
- runtime/replay/state_serializer.ts

**REASON:** Lineage requires replay engine and witness authority. Must be loaded after replay.

---

### Step 9: Time Authority (MISSING - must implement)

**FILES:**
- runtime/replay/time_authority.ts (MISSING)

**REASON:** Time authority required for deterministic replay. Must be implemented and loaded after replay.

---

### Step 10: Knowledge Authority (MISSING - must implement)

**FILES:**
- runtime/replay/knowledge_authority.ts (MISSING)

**REASON:** Knowledge authority required for constitutional knowledge fabric. Must be implemented and loaded after replay.

---

### Step 11: Observation Authority (MISSING - must implement)

**FILES:**
- runtime/replay/observation_authority.ts (MISSING)

**REASON:** Observation authority required for signal ingestion. Must be implemented and loaded after replay.

---

### Step 12: Execution Authority (MISSING - must implement)

**FILES:**
- runtime/replay/execution_authority.ts (MISSING)

**REASON:** Execution authority required for mutation authorization. Must be implemented and loaded after replay.

---

### Step 13: Capability Authority (MISSING - must implement)

**FILES:**
- runtime/replay/capability_authority.ts (MISSING)

**REASON:** Capability authority required for all mutation paths. Must be implemented and loaded last to enforce capability boundaries.

---

### Constitutional End State

Produce the final target architecture.

For every authority:

* Constitutional owner
* Runtime owner
* Storage owner
* Capability owner

No duplicates.
No shadows.
No contested ownership.

---

### Identity Authority

**CONSTITUTIONAL OWNER:** constitution/terminology.md, constitution/authority_model.md

**RUNTIME OWNER:** runtime/replay/certificate_authority.ts, runtime/replay/canonical_json.ts (absorbed canonicalization)

**STORAGE OWNER:** None (pure functional)

**CAPABILITY OWNER:** None (immutable, no capability required)

---

### Replay Authority

**CONSTITUTIONAL OWNER:** constitution/replay_law.md

**RUNTIME OWNER:** runtime/replay/deterministic_replay_engine.ts, runtime/replay/replay_state_machine.ts, runtime/replay/replay_event_stream.ts (absorbed Event Creation)

**STORAGE OWNER:** None (pure functional)

**CAPABILITY OWNER:** None (immutable, no capability required)

---

### Verification Authority

**CONSTITUTIONAL OWNER:** constitution/invariant_law.md

**RUNTIME OWNER:** runtime/replay/replay_verification.ts, runtime/replay/invariant_runner.ts

**STORAGE OWNER:** None (pure functional)

**CAPABILITY OWNER:** None (immutable, no capability required)

---

### Witness Authority

**CONSTITUTIONAL OWNER:** constitution/witness_law.md (ELIMINATED per authority_model.md, absorbed by Identity + Replay, but implementation retained as sub-function)

**RUNTIME OWNER:** runtime/replay/witness_authority.ts, runtime/replay/merkle_tree.ts

**STORAGE OWNER:** None (pure functional)

**CAPABILITY OWNER:** None (immutable, no capability required)

---

### Lineage Authority

**CONSTITUTIONAL OWNER:** constitution/authority_model.md, constitution/terminology.md

**RUNTIME OWNER:** runtime/replay/witness_authority.ts (buildLineageGraph), runtime/replay/state_serializer.ts

**STORAGE OWNER:** None (pure functional)

**CAPABILITY OWNER:** None (immutable, no capability required)

---

### Knowledge Authority

**CONSTITUTIONAL OWNER:** constitution/retrieval_law.md

**RUNTIME OWNER:** runtime/replay/knowledge_authority.ts (MISSING - must implement)

**STORAGE OWNER:** Constitutional knowledge fabric (MISSING - must implement, not SQLite)

**CAPABILITY OWNER:** READ_KNOWLEDGE, WRITE_KNOWLEDGE (capability enforcement required)

---

### Observation Authority

**CONSTITUTIONAL OWNER:** constitution/source_of_truth_law.md

**RUNTIME OWNER:** runtime/replay/observation_authority.ts (MISSING - must implement)

**STORAGE OWNER:** Constitutional observation store (MISSING - must implement)

**CAPABILITY OWNER:** OBSERVE (capability enforcement required)

---

### Execution Authority

**CONSTITUTIONAL OWNER:** constitution/mutation_law.md

**RUNTIME OWNER:** runtime/replay/execution_authority.ts (MISSING - must implement)

**STORAGE OWNER:** Constitutional execution ledger (MISSING - must implement)

**CAPABILITY OWNER:** EXECUTE (capability enforcement required)

---

### Time Authority

**CONSTITUTIONAL OWNER:** constitution/terminology.md

**RUNTIME OWNER:** runtime/replay/time_authority.ts (MISSING - must implement)

**STORAGE OWNER:** None (pure functional, deterministic)

**CAPABILITY OWNER:** READ_TIME (capability enforcement required)

---

### Capability Authority

**CONSTITUTIONAL OWNER:** constitution/capability_law.md (MISSING - must define)

**RUNTIME OWNER:** runtime/replay/capability_authority.ts (MISSING - must implement)

**STORAGE OWNER:** None (pure functional)

**CAPABILITY OWNER:** CAPABILITY_MANAGE (root capability)

---

### Canonicalization Authority

**CONSTITUTIONAL OWNER:** ELIMINATED (absorbed by Identity Authority)

**RUNTIME OWNER:** runtime/replay/canonical_json.ts, runtime/replay/canonical_hash_authority.ts (implementation retained as sub-function of Identity)

**STORAGE OWNER:** None (pure functional)

**CAPABILITY OWNER:** None (immutable, no capability required)

---

### Recommendation Authority

**CONSTITUTIONAL OWNER:** ELIMINATED (not constitutional)

**RUNTIME OWNER:** None (eliminated)

**STORAGE OWNER:** None (eliminated)

**CAPABILITY OWNER:** None (eliminated)

---

### Decision Authority

**CONSTITUTIONAL OWNER:** ELIMINATED (not constitutional)

**RUNTIME OWNER:** None (eliminated)

**STORAGE OWNER:** None (eliminated)

**CAPABILITY OWNER:** None (eliminated)

---

### Event Creation Authority

**CONSTITUTIONAL OWNER:** ELIMINATED (absorbed by Replay Authority)

**RUNTIME OWNER:** runtime/replay/deterministic_replay_engine.ts, runtime/replay/replay_event_stream.ts (absorbed by Replay)

**STORAGE OWNER:** None (pure functional)

**CAPABILITY OWNER:** None (immutable, no capability required)

---

### Agent Registry Authority

**CONSTITUTIONAL OWNER:** ELIMINATED (not constitutional, not required)

**RUNTIME OWNER:** None (eliminated)

**STORAGE OWNER:** None (eliminated)

**CAPABILITY OWNER:** None (eliminated)

---

### Workflow Registry Authority

**CONSTITUTIONAL OWNER:** ELIMINATED (not constitutional, not required)

**RUNTIME OWNER:** None (eliminated)

**STORAGE OWNER:** None (eliminated)

**CAPABILITY OWNER:** None (eliminated)

---

### Final Closure Verdict

Answer:

1. Which authorities are complete?
2. Which authorities are incomplete?
3. Which authorities should be removed?
4. Which authorities must be implemented next?
5. Which shadow authorities must be eliminated first?
6. Is PING constitutionally closed?
7. If not, what exact authorities prevent closure?

---

### 1. Which authorities are complete?

**ANSWER:** Identity Authority, Replay Authority, Verification Authority, Witness Authority, Lineage Authority

**EVIDENCE:**
- Identity: Law + Interface + Implementation consistent, pure functional
- Replay: Law + Interface + Implementation consistent, pure functional
- Verification: Law + Interface + Implementation consistent, pure functional
- Witness: Law + Interface + Implementation consistent, pure functional
- Lineage: Law + Interface + Implementation consistent, pure functional

---

### 2. Which authorities are incomplete?

**ANSWER:** Knowledge Authority, Observation Authority, Execution Authority, Time Authority, Capability Authority

**EVIDENCE:**
- Knowledge: Law + Interface defined, Implementation missing, Storage shadow-owned
- Observation: Law + Interface defined, Implementation missing, Storage missing
- Execution: Law + Interface defined, Implementation missing, Storage missing
- Time: Law defined, Implementation missing, Storage shadow-owned
- Capability: Law missing, Implementation missing, Storage missing

---

### 3. Which authorities should be removed?

**ANSWER:** Canonicalization Authority (absorb into Identity), Recommendation Authority (eliminate), Decision Authority (eliminate), Event Creation Authority (absorb into Replay), Agent Registry Authority (eliminate), Workflow Registry Authority (eliminate)

**EVIDENCE:**
- Canonicalization: Redundant sub-function of Identity Authority
- Recommendation: Not constitutional, no law exists
- Decision: Not constitutional, no law exists
- Event Creation: Shadow authority, absorbed by Replay Authority
- Agent Registry: Not constitutional, not required
- Workflow Registry: Not constitutional, not required

---

### 4. Which authorities must be implemented next?

**ANSWER:** Capability Authority (highest priority), Time Authority (high priority), Knowledge Authority (high priority), Observation Authority (medium priority), Execution Authority (medium priority)

**EVIDENCE:**
- Capability: Required for all mutation paths, must be implemented first
- Time: Required for deterministic replay, shadow-owned by PostgreSQL
- Knowledge: Required for constitutional knowledge fabric, shadow-owned by SQLite
- Observation: Required for signal ingestion, implementation missing
- Execution: Required for mutation authorization, implementation missing

---

### 5. Which shadow authorities must be eliminated first?

**ANSWER:** gateway/event_emitter.js (Event Creation), PostgreSQL NOW() function (Time), crypto.createHash implementations (Identity), SQLite persistence (Knowledge)

**EVIDENCE:**
- gateway/event_emitter.js: HIGH risk, bypasses replay, direct PostgreSQL writes
- PostgreSQL NOW(): MEDIUM risk, non-deterministic time, shadow-owned
- crypto.createHash: HIGH risk, creates identity divergence
- SQLite persistence: MEDIUM risk, shadow storage for knowledge

---

### 6. Is PING constitutionally closed?

**ANSWER:** NO

**EVIDENCE:**
- Shadow authorities exist (gateway/event_emitter.js, PostgreSQL NOW(), crypto.createHash, SQLite)
- Missing implementations (Knowledge, Observation, Execution, Time, Capability)
- Missing constitutional law (Capability)
- Contested ownership (Event Creation, Time, Knowledge)
- Capability enforcement not implemented

---

### 7. If not, what exact authorities prevent closure?

**ANSWER:** Capability Authority (missing law and implementation), Time Authority (missing implementation, shadow-owned), Knowledge Authority (missing implementation, shadow-owned), Observation Authority (missing implementation), Execution Authority (missing implementation)

**EVIDENCE:**
- Capability: No constitutional law exists, no implementation exists, no capability enforcement
- Time: Implementation missing, shadow-owned by PostgreSQL NOW()
- Knowledge: Implementation missing, shadow-owned by SQLite
- Observation: Implementation missing, storage missing
- Execution: Implementation missing, storage missing

---

### CONSTITUTIONAL_CLOSURE_SCORE

**FORMULA:**

Owned Authorities
÷
Required Authorities

**CALCULATION:**

Owned Authorities (complete): 5 (Identity, Replay, Verification, Witness, Lineage)
Required Authorities (constitutional): 10 (Identity, Replay, Verification, Witness, Lineage, Knowledge, Observation, Execution, Time, Capability)

**SCORE:**

5 / 10 = 50%

**PERCENTAGE:**

50%

**STATUS:**

INCOMPLETE

**BLOCKING ISSUES:**

1. Capability Authority: No constitutional law, no implementation
2. Time Authority: Implementation missing, shadow-owned
3. Knowledge Authority: Implementation missing, shadow-owned
4. Observation Authority: Implementation missing
5. Execution Authority: Implementation missing

**SHADOW AUTHORITIES:**

1. gateway/event_emitter.js (Event Creation)
2. PostgreSQL NOW() function (Time)
3. crypto.createHash implementations (Identity)
4. SQLite persistence (Knowledge)

**ELIMINATION CANDIDATES:**

1. Canonicalization Authority (absorb into Identity)
2. Recommendation Authority (eliminate)
3. Decision Authority (eliminate)
4. Event Creation Authority (absorb into Replay)
5. Agent Registry Authority (eliminate)
6. Workflow Registry Authority (eliminate)

---

## PHASE Q — CONSTITUTIONAL MIGRATION PROOF

### Objective

Determine whether the repository can migrate from its current state to the Constitutional End State defined in PHASE P.

This phase does not design new authorities.

This phase proves:

* What must move
* What must die
* What must be rewritten
* What can remain untouched
* What would break reconstruction

---

### Migration Unit Inventory

For every repository component:

Classify:

| Component | Constitutional | Transitional | Legacy | Shadow | Remove |
| --------- | -------------- | ------------ | ------ | ------ | ------ |

---

### constitution/

**CLASSIFICATION:** CONSTITUTIONAL

**STATUS:** KEEP (no changes required)

**EVIDENCE:**
- All constitutional law files are in constitution/
- Defines authority jurisdictions and requirements
- Required for Layer 0 reconstruction
- No migration required

---

### runtime/replay/

**CLASSIFICATION:** CONSTITUTIONAL

**STATUS:** KEEP (no changes required)

**EVIDENCE:**
- All constitutional authority implementations are in runtime/replay/
- Pure functional, no infrastructure dependencies
- Required for Layer 0 reconstruction
- No migration required

---

### runtime/adapters/

**CLASSIFICATION:** TRANSITIONAL

**STATUS:** REMOVE (infrastructure adapters become unnecessary after closure)

**EVIDENCE:**
- runtime/adapters/postgres_event_store.ts: Stub implementation, shadow authority
- runtime/adapters/: Infrastructure adapters bypass constitutional authorities
- After closure, all event creation goes through Replay Authority
- Can be deleted after shadow removal

---

### runtime/kernel/

**CLASSIFICATION:** SHADOW

**STATUS:** REMOVE (empty directory, SHADOW authority)

**EVIDENCE:**
- runtime/kernel/ is empty
- No constitutional implementation exists
- Placeholder for kernel that never materialized
- Can be deleted immediately

---

### gateway/

**CLASSIFICATION:** SHADOW

**STATUS:** REWRITE (must migrate to constitutional authorities)

**EVIDENCE:**
- gateway/event_emitter.js: Shadow authority for Event Creation
- gateway/server.js: Independent gateway bypassing constitutional authorities
- gateway/: Infrastructure adapter with PostgreSQL dependency
- Must be rewritten to use constitutional authorities
- After closure, gateway becomes Layer 1 application

---

### brainos/newsletter/

**CLASSIFICATION:** SHADOW

**STATUS:** REWRITE (must migrate to constitutional Knowledge Authority)

**EVIDENCE:**
- brainos/newsletter/database.py: Shadow authority for Knowledge
- brainos/newsletter/: Independent application with SQLite dependency
- Direct SQLite writes bypass constitutional Knowledge Authority
- Must be rewritten to use constitutional Knowledge Authority
- After closure, brainos/newsletter becomes Layer 1 application

---

### brainos/rss/

**CLASSIFICATION:** SHADOW

**STATUS:** REWRITE (must migrate to constitutional Knowledge Authority)

**EVIDENCE:**
- brainos/rss/database.py: Shadow authority for Knowledge
- brainos/rss/: Independent application with SQLite dependency
- Direct SQLite writes bypass constitutional Knowledge Authority
- Must be rewritten to use constitutional Knowledge Authority
- After closure, brainos/rss becomes Layer 1 application

---

### knowledge/

**CLASSIFICATION:** LEGACY

**STATUS:** REMOVE (design documents only, no implementation)

**EVIDENCE:**
- knowledge/: Design documents for knowledge fabric
- No runtime implementation exists
- After closure, constitutional Knowledge Authority implementation replaces design documents
- Can be deleted after Knowledge Authority implementation

---

### observation/

**CLASSIFICATION:** LEGACY

**STATUS:** REMOVE (empty placeholders, no implementation)

**EVIDENCE:**
- observation/: Empty directory with placeholders
- No runtime implementation exists
- After closure, constitutional Observation Authority implementation replaces placeholders
- Can be deleted after Observation Authority implementation

---

### integrations/

**CLASSIFICATION:** LEGACY

**STATUS:** REMOVE (configuration directories, no runtime implementation)

**EVIDENCE:**
- integrations/: Configuration directories for external integrations
- No runtime implementation exists
- After closure, constitutional Observation Authority handles external signal ingestion
- Can be deleted after Observation Authority implementation

---

### Authority Migration Matrix

For every authority:

Determine:

| Authority | Current Owner | Target Owner | Migration Required | Risk |
| --------- | ------------- | ------------ | ------------------ | ---- |

---

### Identity Authority

**CURRENT OWNER:** runtime/replay/certificate_authority.ts, runtime/replay/canonical_json.ts, gateway/event_emitter.js (shadow: crypto.createHash)

**TARGET OWNER:** runtime/replay/certificate_authority.ts, runtime/replay/canonical_json.ts (absorbed canonicalization)

**MIGRATION REQUIRED:** YES (remove crypto.createHash from gateway/event_emitter.js)

**RISK:** HIGH (independent hashing creates identity divergence)

---

### Replay Authority

**CURRENT OWNER:** runtime/replay/deterministic_replay_engine.ts, runtime/replay/replay_state_machine.ts, runtime/replay/replay_event_stream.ts

**TARGET OWNER:** runtime/replay/deterministic_replay_engine.ts, runtime/replay/replay_state_machine.ts, runtime/replay/replay_event_stream.ts (absorbed Event Creation)

**MIGRATION REQUIRED:** YES (migrate gateway/event_emitter.js to use Replay Authority)

**RISK:** HIGH (gateway/event_emitter.js is critical path for event emission)

---

### Verification Authority

**CURRENT OWNER:** runtime/replay/replay_verification.ts, runtime/replay/invariant_runner.ts

**TARGET OWNER:** runtime/replay/replay_verification.ts, runtime/replay/invariant_runner.ts

**MIGRATION REQUIRED:** NO (already constitutional)

**RISK:** NONE

---

### Witness Authority

**CURRENT OWNER:** runtime/replay/witness_authority.ts, runtime/replay/merkle_tree.ts

**TARGET OWNER:** runtime/replay/witness_authority.ts, runtime/replay/merkle_tree.ts

**MIGRATION REQUIRED:** NO (already constitutional)

**RISK:** NONE

---

### Lineage Authority

**CURRENT OWNER:** runtime/replay/witness_authority.ts (buildLineageGraph), runtime/replay/state_serializer.ts

**TARGET OWNER:** runtime/replay/witness_authority.ts (buildLineageGraph), runtime/replay/state_serializer.ts

**MIGRATION REQUIRED:** NO (already constitutional)

**RISK:** NONE

---

### Knowledge Authority

**CURRENT OWNER:** brainos/newsletter/database.py, brainos/rss/database.py (shadow: SQLite)

**TARGET OWNER:** runtime/replay/knowledge_authority.ts (MISSING - must implement)

**MIGRATION REQUIRED:** YES (implement constitutional Knowledge Authority, migrate from SQLite)

**RISK:** MEDIUM (SQLite stores application data, not critical constitutional data)

---

### Observation Authority

**CURRENT OWNER:** None (MISSING)

**TARGET OWNER:** runtime/replay/observation_authority.ts (MISSING - must implement)

**MIGRATION REQUIRED:** YES (implement constitutional Observation Authority)

**RISK:** MEDIUM (no current implementation, must create from scratch)

---

### Execution Authority

**CURRENT OWNER:** None (MISSING)

**TARGET OWNER:** runtime/replay/execution_authority.ts (MISSING - must implement)

**MIGRATION REQUIRED:** YES (implement constitutional Execution Authority)

**RISK:** HIGH (mutation authorization is critical for constitutional sovereignty)

---

### Time Authority

**CURRENT OWNER:** PostgreSQL NOW() function (shadow)

**TARGET OWNER:** runtime/replay/time_authority.ts (MISSING - must implement)

**MIGRATION REQUIRED:** YES (implement constitutional Time Authority, eliminate PostgreSQL NOW())

**RISK:** MEDIUM (PostgreSQL NOW() is used throughout codebase)

---

### Capability Authority

**CURRENT OWNER:** None (MISSING)

**TARGET OWNER:** runtime/replay/capability_authority.ts (MISSING - must implement)

**MIGRATION REQUIRED:** YES (implement constitutional Capability Authority)

**RISK:** HIGH (capability enforcement is required for all mutation paths)

---

### Event Creation Authority

**CURRENT OWNER:** gateway/event_emitter.js (shadow)

**TARGET OWNER:** runtime/replay/deterministic_replay_engine.ts, runtime/replay/replay_event_stream.ts (absorbed by Replay Authority)

**MIGRATION REQUIRED:** YES (migrate gateway/event_emitter.js to use Replay Authority)

**RISK:** HIGH (gateway/event_emitter.js is critical path for event emission)

---

### Shadow Removal Dependency Graph

For each shadow authority:

Determine:

1. What constitutional authority must exist first
2. What implementation must exist first
3. What capability model must exist first
4. Whether deletion is currently safe

---

### gateway/event_emitter.js

**SHADOW AUTHORITY:** Event Creation Authority

**CONSTITUTIONAL AUTHORITY REQUIRED:** Replay Authority (constitution/replay_law.md)

**IMPLEMENTATION REQUIRED:** runtime/replay/deterministic_replay_engine.ts, runtime/replay/replay_event_stream.ts (EXISTS)

**CAPABILITY MODEL REQUIRED:** EMIT_EVENT capability (MISSING - Capability Authority must exist first)

**DELETION SAFE:** NO (Capability Authority must exist first to enforce EMIT_EVENT capability)

**DEPENDENCY CHAIN:**
1. Implement Capability Authority (constitution/capability_law.md, runtime/replay/capability_authority.ts)
2. Define EMIT_EVENT capability
3. Modify Replay Authority to require EMIT_EVENT capability
4. Migrate gateway/event_emitter.js to use Replay Authority
5. Delete gateway/event_emitter.js direct PostgreSQL writes

---

### PostgreSQL NOW() function

**SHADOW AUTHORITY:** Time Authority

**CONSTITUTIONAL AUTHORITY REQUIRED:** Time Authority (constitution/terminology.md)

**IMPLEMENTATION REQUIRED:** runtime/replay/time_authority.ts (MISSING - must implement)

**CAPABILITY MODEL REQUIRED:** READ_TIME capability (MISSING - Capability Authority must exist first)

**DELETION SAFE:** NO (Time Authority must exist first to provide deterministic time)

**DEPENDENCY CHAIN:**
1. Implement Capability Authority (constitution/capability_law.md, runtime/replay/capability_authority.ts)
2. Define READ_TIME capability
3. Implement Time Authority (runtime/replay/time_authority.ts)
4. Modify Time Authority to require READ_TIME capability
5. Replace all PostgreSQL NOW() calls with Time Authority calls
6. Remove PostgreSQL NOW() function calls

---

### SQLite persistence (brainos/newsletter/database.py, brainos/rss/database.py)

**SHADOW AUTHORITY:** Knowledge Authority

**CONSTITUTIONAL AUTHORITY REQUIRED:** Knowledge Authority (constitution/retrieval_law.md)

**IMPLEMENTATION REQUIRED:** runtime/replay/knowledge_authority.ts (MISSING - must implement)

**CAPABILITY MODEL REQUIRED:** READ_KNOWLEDGE, WRITE_KNOWLEDGE capabilities (MISSING - Capability Authority must exist first)

**DELETION SAFE:** NO (Knowledge Authority must exist first to provide constitutional knowledge fabric)

**DEPENDENCY CHAIN:**
1. Implement Capability Authority (constitution/capability_law.md, runtime/replay/capability_authority.ts)
2. Define READ_KNOWLEDGE, WRITE_KNOWLEDGE capabilities
3. Implement Knowledge Authority (runtime/replay/knowledge_authority.ts)
4. Implement constitutional knowledge fabric
5. Modify Knowledge Authority to require READ_KNOWLEDGE, WRITE_KNOWLEDGE capabilities
6. Migrate brainos/newsletter/database.py to use constitutional Knowledge Authority
7. Migrate brainos/rss/database.py to use constitutional Knowledge Authority
8. Delete SQLite persistence

---

### crypto.createHash implementations

**SHADOW AUTHORITY:** Identity Authority

**CONSTITUTIONAL AUTHORITY REQUIRED:** Identity Authority (constitution/terminology.md, constitution/authority_model.md)

**IMPLEMENTATION REQUIRED:** runtime/replay/certificate_authority.ts (EXISTS)

**CAPABILITY MODEL REQUIRED:** GENERATE_IDENTITY capability (MISSING - Capability Authority must exist first)

**DELETION SAFE:** NO (Capability Authority must exist first to enforce GENERATE_IDENTITY capability)

**DEPENDENCY CHAIN:**
1. Implement Capability Authority (constitution/capability_law.md, runtime/replay/capability_authority.ts)
2. Define GENERATE_IDENTITY capability
3. Modify Identity Authority to require GENERATE_IDENTITY capability
4. Replace all crypto.createHash calls with certificate_authority.ts SHA-256 implementation
5. Remove crypto.createHash imports from gateway/event_emitter.js

---

### Replay Preservation Proof

For every proposed migration:

Determine:

* Does replay break?
* Does lineage break?
* Does verification break?
* Does witness generation break?
* Does identity determinism break?

Output:

SAFE
UNSAFE
UNKNOWN

for every migration.

---

### Migration: Remove crypto.createHash from gateway/event_emitter.js

**REPLAY BREAK?** NO (replay uses constitutional Identity Authority)

**LINEAGE BREAK?** NO (lineage uses constitutional Witness Authority)

**VERIFICATION BREAK?** NO (verification uses constitutional Verification Authority)

**WITNESS GENERATION BREAK?** NO (witness uses constitutional Witness Authority)

**IDENTITY DETERMINISM BREAK?** NO (SHA-256 is deterministic, constitutional implementation is consistent)

**VERDICT:** SAFE

---

### Migration: Migrate gateway/event_emitter.js to use Replay Authority

**REPLAY BREAK?** NO (replay is the target authority)

**LINEAGE BREAK?** NO (lineage uses constitutional Witness Authority)

**VERIFICATION BREAK?** NO (verification uses constitutional Verification Authority)

**WITNESS GENERATION BREAK?** NO (witness uses constitutional Witness Authority)

**IDENTITY DETERMINISM BREAK?** NO (identity uses constitutional Identity Authority)

**VERDICT:** SAFE

---

### Migration: Replace PostgreSQL NOW() with Time Authority

**REPLAY BREAK?** NO (replay requires deterministic time, Time Authority provides deterministic time)

**LINEAGE BREAK?** NO (lineage uses constitutional Witness Authority)

**VERIFICATION BREAK?** NO (verification uses constitutional Verification Authority)

**WITNESS GENERATION BREAK?** NO (witness uses constitutional Witness Authority)

**IDENTITY DETERMINISM BREAK?** NO (identity uses constitutional Identity Authority)

**VERDICT:** SAFE

---

### Migration: Migrate SQLite to constitutional Knowledge Authority

**REPLAY BREAK?** NO (replay is independent of knowledge storage)

**LINEAGE BREAK?** NO (lineage uses constitutional Witness Authority)

**VERIFICATION BREAK?** NO (verification uses constitutional Verification Authority)

**WITNESS GENERATION BREAK?** NO (witness uses constitutional Witness Authority)

**IDENTITY DETERMINISM BREAK?** NO (identity uses constitutional Identity Authority)

**VERDICT:** SAFE

---

### Migration: Implement Capability Authority

**REPLAY BREAK?** NO (capability enforcement is orthogonal to replay)

**LINEAGE BREAK?** NO (lineage uses constitutional Witness Authority)

**VERIFICATION BREAK?** NO (verification uses constitutional Verification Authority)

**WITNESS GENERATION BREAK?** NO (witness uses constitutional Witness Authority)

**IDENTITY DETERMINISM BREAK?** NO (identity uses constitutional Identity Authority)

**VERDICT:** SAFE

---

### Migration: Implement Time Authority

**REPLAY BREAK?** NO (replay requires deterministic time, Time Authority provides deterministic time)

**LINEAGE BREAK?** NO (lineage uses constitutional Witness Authority)

**VERIFICATION BREAK?** NO (verification uses constitutional Verification Authority)

**WITNESS GENERATION BREAK?** NO (witness uses constitutional Witness Authority)

**IDENTITY DETERMINISM BREAK?** NO (identity uses constitutional Identity Authority)

**VERDICT:** SAFE

---

### Migration: Implement Knowledge Authority

**REPLAY BREAK?** NO (replay is independent of knowledge storage)

**LINEAGE BREAK?** NO (lineage uses constitutional Witness Authority)

**VERIFICATION BREAK?** NO (verification uses constitutional Verification Authority)

**WITNESS GENERATION BREAK?** NO (witness uses constitutional Witness Authority)

**IDENTITY DETERMINISM BREAK?** NO (identity uses constitutional Identity Authority)

**VERDICT:** SAFE

---

### Migration: Implement Observation Authority

**REPLAY BREAK?** NO (replay is independent of signal ingestion)

**LINEAGE BREAK?** NO (lineage uses constitutional Witness Authority)

**VERIFICATION BREAK?** NO (verification uses constitutional Verification Authority)

**WITNESS GENERATION BREAK?** NO (witness uses constitutional Witness Authority)

**IDENTITY DETERMINISM BREAK?** NO (identity uses constitutional Identity Authority)

**VERDICT:** SAFE

---

### Migration: Implement Execution Authority

**REPLAY BREAK?** NO (replay requires execution authority for mutation authorization)

**LINEAGE BREAK?** NO (lineage uses constitutional Witness Authority)

**VERIFICATION BREAK?** NO (verification uses constitutional Verification Authority)

**WITNESS GENERATION BREAK?** NO (witness uses constitutional Witness Authority)

**IDENTITY DETERMINISM BREAK?** NO (identity uses constitutional Identity Authority)

**VERDICT:** SAFE

---

### Constitutional Cutover Plan

Define the minimum sequence required to reach closure.

Phase ordering only.

---

### Phase 1: Capability Authority

**OBJECTIVE:** Implement capability enforcement foundation

**REQUIRED ACTIONS:**
1. Define constitution/capability_law.md
2. Implement runtime/replay/capability_authority.ts
3. Define root capabilities: CAPABILITY_MANAGE, EMIT_EVENT, GENERATE_IDENTITY, READ_TIME, READ_KNOWLEDGE, WRITE_KNOWLEDGE, OBSERVE, EXECUTE
4. Implement capability check interface
5. Implement capability grant/revoke interface

**DEPENDENCIES:** None (foundation for all other authorities)

**RISK:** HIGH (capability enforcement is required for all mutation paths)

---

### Phase 2: Time Authority

**OBJECTIVE:** Implement constitutional clock

**REQUIRED ACTIONS:**
1. Implement runtime/replay/time_authority.ts
2. Implement deterministic time interface
3. Implement logical clock for consistency
4. Integrate with Capability Authority (READ_TIME capability)
5. Replace PostgreSQL NOW() calls with Time Authority calls

**DEPENDENCIES:** Phase 1 (Capability Authority)

**RISK:** MEDIUM (PostgreSQL NOW() is used throughout codebase)

---

### Phase 3: Knowledge Authority

**OBJECTIVE:** Implement constitutional knowledge fabric

**REQUIRED ACTIONS:**
1. Implement runtime/replay/knowledge_authority.ts
2. Implement constitutional knowledge fabric
3. Integrate with Capability Authority (READ_KNOWLEDGE, WRITE_KNOWLEDGE capabilities)
4. Migrate brainos/newsletter/database.py to use constitutional Knowledge Authority
5. Migrate brainos/rss/database.py to use constitutional Knowledge Authority
6. Delete SQLite persistence

**DEPENDENCIES:** Phase 1 (Capability Authority)

**RISK:** MEDIUM (SQLite stores application data, not critical constitutional data)

---

### Phase 4: Observation Authority

**OBJECTIVE:** Implement constitutional signal ingestion

**REQUIRED ACTIONS:**
1. Implement runtime/replay/observation_authority.ts
2. Implement constitutional observation store
3. Integrate with Capability Authority (OBSERVE capability)
4. Migrate external signal ingestion to use Observation Authority

**DEPENDENCIES:** Phase 1 (Capability Authority)

**RISK:** MEDIUM (no current implementation, must create from scratch)

---

### Phase 5: Execution Authority

**OBJECTIVE:** Implement constitutional mutation authorization

**REQUIRED ACTIONS:**
1. Implement runtime/replay/execution_authority.ts
2. Implement constitutional execution ledger
3. Integrate with Capability Authority (EXECUTE capability)
4. Migrate all state mutations to use Execution Authority

**DEPENDENCIES:** Phase 1 (Capability Authority), Phase 2 (Time Authority), Phase 3 (Knowledge Authority)

**RISK:** HIGH (mutation authorization is critical for constitutional sovereignty)

---

### Phase 6: Shadow Removal

**OBJECTIVE:** Eliminate shadow authorities

**REQUIRED ACTIONS:**
1. Migrate gateway/event_emitter.js to use Replay Authority
2. Remove crypto.createHash from gateway/event_emitter.js
3. Remove PostgreSQL NOW() function calls
4. Remove SQLite persistence
5. Delete runtime/adapters/
6. Delete runtime/kernel/
7. Rewrite gateway/ to use constitutional authorities
8. Rewrite brainos/newsletter/ to use constitutional authorities
9. Rewrite brainos/rss/ to use constitutional authorities

**DEPENDENCIES:** Phase 1 (Capability Authority), Phase 2 (Time Authority), Phase 3 (Knowledge Authority), Phase 5 (Execution Authority)

**RISK:** HIGH (gateway/event_emitter.js is critical path for event emission)

---

### Repository Deletion Candidates

Identify files, modules, and directories that become unnecessary after constitutional closure.

For each:

* Why it exists
* Which authority replaces it
* Can it be deleted immediately?
* Can it be deleted after migration?

---

### runtime/adapters/

**WHY IT EXISTS:** Infrastructure adapters for PostgreSQL event storage

**WHICH AUTHORITY REPLACES IT:** Replay Authority (constitutional event stream)

**CAN IT BE DELETED IMMEDIATELY?** NO (gateway/event_emitter.js depends on PostgreSQL adapter)

**CAN IT BE DELETED AFTER MIGRATION?** YES (after Phase 6: Shadow Removal)

---

### runtime/kernel/

**WHY IT EXISTS:** Placeholder for kernel that never materialized

**WHICH AUTHORITY REPLACES IT:** None (empty directory, no replacement needed)

**CAN IT BE DELETED IMMEDIATELY?** YES (empty directory, no dependencies)

**CAN IT BE DELETED AFTER MIGRATION?** YES (can be deleted immediately)

---

### knowledge/

**WHY IT EXISTS:** Design documents for knowledge fabric

**WHICH AUTHORITY REPLACES IT:** Knowledge Authority (constitutional implementation)

**CAN IT BE DELETED IMMEDIATELY?** NO (design documents reference constitutional requirements)

**CAN IT BE DELETED AFTER MIGRATION?** YES (after Phase 3: Knowledge Authority implementation)

---

### observation/

**WHY IT EXISTS:** Empty placeholders for observation authority

**WHICH AUTHORITY REPLACES IT:** Observation Authority (constitutional implementation)

**CAN IT BE DELETED IMMEDIATELY?** YES (empty directory, no implementation)

**CAN IT BE DELETED AFTER MIGRATION?** YES (can be deleted immediately)

---

### integrations/

**WHY IT EXISTS:** Configuration directories for external integrations

**WHICH AUTHORITY REPLACES IT:** Observation Authority (constitutional signal ingestion)

**CAN IT BE DELETED IMMEDIATELY?** NO (configuration may be needed for external integrations)

**CAN IT BE DELETED AFTER MIGRATION?** YES (after Phase 4: Observation Authority implementation)

---

### brainos/newsletter/database.py

**WHY IT EXISTS:** Direct SQLite writes for newsletter data

**WHICH AUTHORITY REPLACES IT:** Knowledge Authority (constitutional knowledge fabric)

**CAN IT BE DELETED IMMEDIATELY?** NO (newsletter service depends on SQLite storage)

**CAN IT BE DELETED AFTER MIGRATION?** YES (after Phase 3: Knowledge Authority implementation)

---

### brainos/rss/database.py

**WHY IT EXISTS:** Direct SQLite writes for RSS data

**WHICH AUTHORITY REPLACES IT:** Knowledge Authority (constitutional knowledge fabric)

**CAN IT BE DELETED IMMEDIATELY?** NO (RSS service depends on SQLite storage)

**CAN IT BE DELETED AFTER MIGRATION?** YES (after Phase 3: Knowledge Authority implementation)

---

### gateway/event_emitter.js

**WHY IT EXISTS:** Shadow authority for event emission

**WHICH AUTHORITY REPLACES IT:** Replay Authority (constitutional event stream)

**CAN IT BE DELETED IMMEDIATELY?** NO (gateway depends on event_emitter.js)

**CAN IT BE DELETED AFTER MIGRATION?** YES (after Phase 6: Shadow Removal)

---

### PostgreSQL NOW() function calls

**WHY IT EXISTS:** Database timestamp generation

**WHICH AUTHORITY REPLACES IT:** Time Authority (constitutional clock)

**CAN IT BE DELETED IMMEDIATELY?** NO (codebase depends on PostgreSQL NOW())

**CAN IT BE DELETED AFTER MIGRATION?** YES (after Phase 2: Time Authority implementation)

---

### crypto.createHash implementations

**WHY IT EXISTS:** Independent identity generation

**WHICH AUTHORITY REPLACES IT:** Identity Authority (constitutional SHA-256 implementation)

**CAN IT BE DELETED IMMEDIATELY?** NO (gateway/event_emitter.js depends on crypto.createHash)

**CAN IT BE DELETED AFTER MIGRATION?** YES (after Phase 6: Shadow Removal)

---

### Constitutional Survivability After Closure

Repeat survivability analysis assuming closure is complete.

Evaluate:

* Postgres disappears
* SQLite disappears
* Gateway disappears
* BrainOS disappears
* Containers disappear
* Cloud disappears

Determine:

* Which authorities survive
* Which authorities die
* Whether Layer 0 can reconstruct the system

---

### If Postgres disappears (after closure)

**AUTHORITIES THAT SURVIVE:** Identity, Replay, Verification, Witness, Canonicalization, Lineage, Knowledge, Observation, Execution, Time

**AUTHORITIES THAT DIE:** None (Postgres no longer stores constitutional data after closure)

**EVIDENCE:**
- After closure, all constitutional authorities are pure functional (Layer 0)
- Postgres is eliminated as shadow storage
- Event Creation Authority is absorbed by Replay Authority (pure functional)
- Time Authority is implemented in runtime/replay/ (pure functional)
- Knowledge Authority uses constitutional knowledge fabric (not Postgres)
- Layer 0 can reconstruct the system

---

### If SQLite disappears (after closure)

**AUTHORITIES THAT SURVIVE:** Identity, Replay, Verification, Witness, Canonicalization, Lineage, Knowledge, Observation, Execution, Time

**AUTHORITIES THAT DIE:** None (SQLite is eliminated as shadow storage after closure)

**EVIDENCE:**
- After closure, SQLite is eliminated as shadow storage
- Knowledge Authority uses constitutional knowledge fabric (not SQLite)
- All constitutional authorities are pure functional (Layer 0)
- Layer 0 can reconstruct the system

---

### If Gateway disappears (after closure)

**AUTHORITIES THAT SURVIVE:** Identity, Replay, Verification, Witness, Canonicalization, Lineage, Knowledge, Observation, Execution, Time

**AUTHORITIES THAT DIE:** None (gateway is Layer 1 application, not constitutional)

**EVIDENCE:**
- After closure, gateway is rewritten to use constitutional authorities
- Gateway is Layer 1 application, not constitutional substrate
- All constitutional authorities are in Layer 0
- Layer 0 can reconstruct the system

---

### If BrainOS disappears (after closure)

**AUTHORITIES THAT SURVIVE:** Identity, Replay, Verification, Witness, Canonicalization, Lineage, Knowledge, Observation, Execution, Time

**AUTHORITIES THAT DIE:** None (BrainOS is Layer 1 application, not constitutional)

**EVIDENCE:**
- After closure, brainos/newsletter/ and brainos/rss/ are rewritten to use constitutional authorities
- BrainOS is Layer 1 application, not constitutional substrate
- All constitutional authorities are in Layer 0
- Layer 0 can reconstruct the system

---

### If Containers disappear (after closure)

**AUTHORITIES THAT SURVIVE:** Identity, Replay, Verification, Witness, Canonicalization, Lineage, Knowledge, Observation, Execution, Time

**AUTHORITIES THAT DIE:** None (containers are Layer 1 infrastructure, not constitutional)

**EVIDENCE:**
- After closure, all constitutional authorities are pure functional (Layer 0)
- Containers are Layer 1 infrastructure, not constitutional substrate
- Layer 0 can reconstruct the system

---

### If Cloud disappears (after closure)

**AUTHORITIES THAT SURVIVE:** Identity, Replay, Verification, Witness, Canonicalization, Lineage, Knowledge, Observation, Execution, Time

**AUTHORITIES THAT DIE:** None (cloud is Layer 1 infrastructure, not constitutional)

**EVIDENCE:**
- After closure, all constitutional authorities are pure functional (Layer 0)
- Cloud is Layer 1 infrastructure, not constitutional substrate
- Layer 0 can reconstruct the system

---

### Layer 0 Sufficiency Test

Assume:

Everything except Layer 0 is deleted.

Can Layer 0 reconstruct:

* Identity
* Replay
* Verification
* Witness
* Lineage
* Knowledge
* Observation
* Execution
* Time

For each:

YES
NO
PARTIAL

Provide proof.

---

### Identity Authority

**CAN LAYER 0 RECONSTRUCT?** YES

**PROOF:**
- constitution/terminology.md: Defines identity jurisdiction
- constitution/authority_model.md: Defines identity ownership
- runtime/replay/certificate_authority.ts: Implements SHA-256 hashing
- runtime/replay/canonical_json.ts: Implements RFC-8785 canonicalization
- Pure functional, no infrastructure dependencies
- Can reconstruct from Layer 0 alone

---

### Replay Authority

**CAN LAYER 0 RECONSTRUCT?** YES

**PROOF:**
- constitution/replay_law.md: Defines replay determinism and reconstruction
- runtime/replay/deterministic_replay_engine.ts: Implements deterministic replay
- runtime/replay/replay_state_machine.ts: Implements state machine
- runtime/replay/replay_event_stream.ts: Implements event stream
- Pure functional, no infrastructure dependencies
- Can reconstruct from Layer 0 alone

---

### Verification Authority

**CAN LAYER 0 RECONSTRUCT?** YES

**PROOF:**
- constitution/invariant_law.md: Defines invariant enforcement
- runtime/replay/replay_verification.ts: Implements determinism verification
- runtime/replay/invariant_runner.ts: Implements invariant enforcement
- Pure functional, no infrastructure dependencies
- Can reconstruct from Layer 0 alone

---

### Witness Authority

**CAN LAYER 0 RECONSTRUCT?** YES

**PROOF:**
- constitution/witness_law.md: Defines witness generation
- runtime/replay/witness_authority.ts: Implements witness generation
- runtime/replay/merkle_tree.ts: Implements Merkle tree construction
- Pure functional, no infrastructure dependencies
- Can reconstruct from Layer 0 alone

---

### Lineage Authority

**CAN LAYER 0 RECONSTRUCT?** YES

**PROOF:**
- constitution/authority_model.md: Defines lineage jurisdiction
- constitution/terminology.md: Defines lineage terminology
- runtime/replay/witness_authority.ts: Implements buildLineageGraph
- runtime/replay/state_serializer.ts: Implements state serialization
- Pure functional, no infrastructure dependencies
- Can reconstruct from Layer 0 alone

---

### Knowledge Authority

**CAN LAYER 0 RECONSTRUCT?** PARTIAL

**PROOF:**
- constitution/retrieval_law.md: Defines knowledge fabric
- runtime/replay/knowledge_authority.ts: MISSING (must implement)
- After closure, constitutional knowledge fabric is implemented in runtime/replay/
- Pure functional or constitutional storage (not SQLite)
- Can reconstruct from Layer 0 after implementation

---

### Observation Authority

**CAN LAYER 0 RECONSTRUCT?** PARTIAL

**PROOF:**
- constitution/source_of_truth_law.md: Defines signal ingestion
- runtime/replay/observation_authority.ts: MISSING (must implement)
- After closure, constitutional observation store is implemented in runtime/replay/
- Pure functional or constitutional storage
- Can reconstruct from Layer 0 after implementation

---

### Execution Authority

**CAN LAYER 0 RECONSTRUCT?** PARTIAL

**PROOF:**
- constitution/mutation_law.md: Defines mutation authorization
- runtime/replay/execution_authority.ts: MISSING (must implement)
- After closure, constitutional execution ledger is implemented in runtime/replay/
- Pure functional or constitutional storage
- Can reconstruct from Layer 0 after implementation

---

### Time Authority

**CAN LAYER 0 RECONSTRUCT?** PARTIAL

**PROOF:**
- constitution/terminology.md: Defines constitutional time
- runtime/replay/time_authority.ts: MISSING (must implement)
- After closure, constitutional clock is implemented in runtime/replay/
- Pure functional, deterministic
- Can reconstruct from Layer 0 after implementation

---

### Closure Blocking Matrix

Produce the exact blockers preventing closure.

For each blocker:

| Blocker | Authority Impacted | Severity | Required Fix |
| ------- | ------------------ | -------- | ------------ |

---

### Blocker 1: Capability Authority

**AUTHORITY IMPACTED:** All authorities (capability enforcement required for all mutation paths)

**SEVERITY:** CRITICAL

**REQUIRED FIX:** Implement constitution/capability_law.md and runtime/replay/capability_authority.ts

---

### Blocker 2: Time Authority

**AUTHORITY IMPACTED:** Replay Authority (deterministic time required for replay)

**SEVERITY:** HIGH

**REQUIRED FIX:** Implement runtime/replay/time_authority.ts and eliminate PostgreSQL NOW()

---

### Blocker 3: Knowledge Authority

**AUTHORITY IMPACTED:** Knowledge Authority (constitutional knowledge fabric required)

**SEVERITY:** HIGH

**REQUIRED FIX:** Implement runtime/replay/knowledge_authority.ts and eliminate SQLite persistence

---

### Blocker 4: Observation Authority

**AUTHORITY IMPACTED:** Observation Authority (signal ingestion required)

**SEVERITY:** MEDIUM

**REQUIRED FIX:** Implement runtime/replay/observation_authority.ts

---

### Blocker 5: Execution Authority

**AUTHORITY IMPACTED:** Execution Authority (mutation authorization required)

**SEVERITY:** CRITICAL

**REQUIRED FIX:** Implement runtime/replay/execution_authority.ts

---

### Blocker 6: gateway/event_emitter.js

**AUTHORITY IMPACTED:** Replay Authority (shadow authority bypasses constitutional replay)

**SEVERITY:** HIGH

**REQUIRED FIX:** Migrate gateway/event_emitter.js to use Replay Authority

---

### Blocker 7: PostgreSQL NOW() function

**AUTHORITY IMPACTED:** Time Authority (shadow authority bypasses constitutional time)

**SEVERITY:** MEDIUM

**REQUIRED FIX:** Replace PostgreSQL NOW() calls with Time Authority calls

---

### Blocker 8: SQLite persistence

**AUTHORITY IMPACTED:** Knowledge Authority (shadow storage bypasses constitutional knowledge fabric)

**SEVERITY:** MEDIUM

**REQUIRED FIX:** Migrate SQLite to constitutional Knowledge Authority

---

### Blocker 9: crypto.createHash implementations

**AUTHORITY IMPACTED:** Identity Authority (shadow authority bypasses constitutional identity)

**SEVERITY:** HIGH

**REQUIRED FIX:** Replace crypto.createHash with constitutional Identity Authority

---

### Final Migration Verdict

Answer:

1. Is constitutional closure achievable?
2. What is the minimum migration path?
3. What is the highest-risk migration?
4. What shadow authority must die first?
5. What authority must be implemented first?
6. What component becomes Layer 1 after closure?
7. What remains outside constitutional jurisdiction?

---

### 1. Is constitutional closure achievable?

**ANSWER:** YES

**EVIDENCE:**
- All required authorities have constitutional law definitions
- Layer 0 is sufficient to reconstruct complete authorities
- Migration path is defined (6 phases)
- Replay preservation proof shows all migrations are SAFE
- No fundamental blockers prevent closure

---

### 2. What is the minimum migration path?

**ANSWER:** 6-phase cutover plan

**PHASE 1:** Capability Authority (foundation for all other authorities)
**PHASE 2:** Time Authority (constitutional clock)
**PHASE 3:** Knowledge Authority (constitutional knowledge fabric)
**PHASE 4:** Observation Authority (signal ingestion)
**PHASE 5:** Execution Authority (mutation authorization)
**PHASE 6:** Shadow Removal (eliminate shadow authorities)

**EVIDENCE:**
- Capability Authority must be implemented first (foundation for all mutation paths)
- Time Authority requires Capability Authority (capability enforcement)
- Knowledge Authority requires Capability Authority (capability enforcement)
- Observation Authority requires Capability Authority (capability enforcement)
- Execution Authority requires Capability Authority, Time Authority, Knowledge Authority (dependencies)
- Shadow Removal requires all authorities to be implemented (safe deletion)

---

### 3. What is the highest-risk migration?

**ANSWER:** Phase 6: Shadow Removal (gateway/event_emitter.js migration)

**EVIDENCE:**
- gateway/event_emitter.js is critical path for event emission
- Direct PostgreSQL writes must be eliminated
- Event emission must migrate to Replay Authority
- HIGH risk (critical path, extensive changes required)

---

### 4. What shadow authority must die first?

**ANSWER:** crypto.createHash implementations (gateway/event_emitter.js)

**EVIDENCE:**
- Independent hashing creates identity divergence
- HIGH risk (identity determinism is critical)
- Can be eliminated after Capability Authority implementation
- Must be eliminated before shadow removal phase

---

### 5. What authority must be implemented first?

**ANSWER:** Capability Authority

**EVIDENCE:**
- Capability enforcement is required for all mutation paths
- Foundation for all other authorities
- No other authority can be safely implemented without capability enforcement
- CRITICAL severity

---

### 6. What component becomes Layer 1 after closure?

**ANSWER:** gateway/, brainos/newsletter/, brainos/rss/

**EVIDENCE:**
- gateway/: Rewritten to use constitutional authorities, becomes Layer 1 application
- brainos/newsletter/: Rewritten to use constitutional Knowledge Authority, becomes Layer 1 application
- brainos/rss/: Rewritten to use constitutional Knowledge Authority, becomes Layer 1 application
- All constitutional authorities are in Layer 0 (constitution/, runtime/replay/)

---

### 7. What remains outside constitutional jurisdiction?

**ANSWER:** None (after closure, all components are within constitutional jurisdiction)

**EVIDENCE:**
- After closure, all shadow authorities are eliminated
- All mutation paths require capability enforcement
- All storage is constitutional (Layer 0 or constitutional fabric)
- All applications use constitutional authorities
- No components remain outside constitutional jurisdiction

---

### CONSTITUTIONAL_MIGRATION_READINESS_SCORE

**FORMULA:**

Migratable Authorities
÷
Required Authorities

**CALCULATION:**

Migratable Authorities (current): 5 (Identity, Replay, Verification, Witness, Lineage)
Required Authorities (constitutional): 10 (Identity, Replay, Verification, Witness, Lineage, Knowledge, Observation, Execution, Time, Capability)

**SCORE:**

5 / 10 = 50%

**PERCENTAGE:**

50%

**STATUS:**

MIGRATION READY (closure achievable, 6-phase migration path defined)

**MIGRATION PATH:**

Phase 1: Capability Authority (CRITICAL)
Phase 2: Time Authority (HIGH)
Phase 3: Knowledge Authority (HIGH)
Phase 4: Observation Authority (MEDIUM)
Phase 5: Execution Authority (CRITICAL)
Phase 6: Shadow Removal (HIGH)

**HIGHEST-RISK MIGRATION:** Phase 6: Shadow Removal (gateway/event_emitter.js)

**SHADOW AUTHORITY DELETION ORDER:**
1. crypto.createHash (after Phase 1)
2. PostgreSQL NOW() (after Phase 2)
3. SQLite persistence (after Phase 3)
4. gateway/event_emitter.js (after Phase 6)

**LAYER 1 COMPONENTS AFTER CLOSURE:**
- gateway/ (rewritten to use constitutional authorities)
- brainos/newsletter/ (rewritten to use constitutional Knowledge Authority)
- brainos/rss/ (rewritten to use constitutional Knowledge Authority)

**CONSTITUTIONAL JURISDICTION AFTER CLOSURE:**
- All components within constitutional jurisdiction
- No shadow authorities remain
- No contested ownership remains
- No components outside constitutional jurisdiction

---

## PHASE R — CONSTITUTIONAL IMPLEMENTATION GAP PROOF

### Objective

Prove whether the migration plan described in this document is actually executable.

READ ONLY analysis using ONLY information already present in PING_AUTHORITY_OWNERSHIP_MAP.md.

---

### SECTION R1 — AUTHORITY IMPLEMENTATION CONTRACTS

For every authority currently classified as DEFINED / IMPLEMENTATION MISSING or PARTIAL:

| Authority | Minimum Runtime File | Required Interface | Required State | Required Capabilities | Required Replay Inputs | Required Replay Outputs | Required Witness Impact |
| --------- | ------------------- | ----------------- | ------------- | --------------------- | --------------------- | ---------------------- | ---------------------- |
| Identity | runtime/replay/certificate_authority.ts (EXISTS) | SHA-256 hashing, RFC-8785 canonicalization | None (pure functional) | GENERATE_IDENTITY | Artifacts to hash | Hash digests | Witness includes hash commitments |
| Knowledge | runtime/replay/knowledge_authority.ts (MISSING) | Knowledge fabric read/write | Constitutional knowledge fabric | READ_KNOWLEDGE, WRITE_KNOWLEDGE | Knowledge artifacts | Knowledge state | Witness includes knowledge commitments |
| Observation | runtime/replay/observation_authority.ts (MISSING) | Signal ingestion | Constitutional observation store | OBSERVE | External signals | Observation events | Witness includes observation commitments |
| Execution | runtime/replay/execution_authority.ts (MISSING) | Mutation authorization | Constitutional execution ledger | EXECUTE | Mutation requests | Execution events | Witness includes execution commitments |
| Time | runtime/replay/time_authority.ts (MISSING) | Deterministic time | Constitutional time log | READ_TIME | Time requests | Time values | Witness includes time commitments |
| Capability | runtime/replay/capability_authority.ts (MISSING) | Capability enforcement | Capability registry | CAPABILITY_MANAGE | Capability checks | Capability grants | Witness includes capability commitments |

**EVIDENCE:**
- Identity: Implementation exists (runtime/replay/certificate_authority.ts, runtime/replay/canonical_json.ts) but has shadow (crypto.createHash in gateway/event_emitter.js)
- Knowledge: Implementation MISSING (runtime/replay/knowledge_authority.ts), law exists (constitution/retrieval_law.md)
- Observation: Implementation MISSING (runtime/replay/observation_authority.ts), law exists (constitution/source_of_truth_law.md)
- Execution: Implementation MISSING (runtime/replay/execution_authority.ts), law exists (constitution/mutation_law.md)
- Time: Implementation MISSING (runtime/replay/time_authority.ts), law exists (constitution/terminology.md)
- Capability: Implementation MISSING (runtime/replay/capability_authority.ts), law MISSING (constitution/capability_law.md must be defined)

---

### SECTION R2 — AUTHORITY DEPENDENCY DAG

Using ONLY the migration plan already present in PHASE Q:

**Dependency DAG:**

```
Capability Authority (Phase 1)
├── Time Authority (Phase 2) [requires: READ_TIME capability]
├── Knowledge Authority (Phase 3) [requires: READ_KNOWLEDGE, WRITE_KNOWLEDGE capabilities]
├── Observation Authority (Phase 4) [requires: OBSERVE capability]
└── Execution Authority (Phase 5) [requires: EXECUTE capability, Time Authority, Knowledge Authority]
    └── Shadow Removal (Phase 6) [requires: Capability, Time, Knowledge, Execution Authorities]
```

**Dependency Analysis:**

| Edge | Type | Required? | Evidence |
| ---- | ---- | --------- | -------- |
| Capability → Time | Mandatory | YES | Phase 2 dependencies: "Integrate with Capability Authority (READ_TIME capability)" |
| Capability → Knowledge | Mandatory | YES | Phase 3 dependencies: "Integrate with Capability Authority (READ_KNOWLEDGE, WRITE_KNOWLEDGE capabilities)" |
| Capability → Observation | Mandatory | YES | Phase 4 dependencies: "Integrate with Capability Authority (OBSERVE capability)" |
| Capability → Execution | Mandatory | YES | Phase 5 dependencies: "Integrate with Capability Authority (EXECUTE capability)" |
| Time → Execution | Mandatory | YES | Phase 5 dependencies: "Phase 1 (Capability Authority), Phase 2 (Time Authority), Phase 3 (Knowledge Authority)" |
| Knowledge → Execution | Mandatory | YES | Phase 5 dependencies: "Phase 1 (Capability Authority), Phase 2 (Time Authority), Phase 3 (Knowledge Authority)" |
| Execution → Shadow Removal | Mandatory | YES | Phase 6 dependencies: "Phase 1 (Capability Authority), Phase 2 (Time Authority), Phase 3 (Knowledge Authority), Phase 5 (Execution Authority)" |

**Optional Edges:** None (all dependencies are mandatory)

**Circular Dependencies:** None

**Impossible Migrations:** None (DAG is acyclic and all dependencies are satisfiable)

**Topological Execution Order:**

1. Capability Authority (Phase 1)
2. Time Authority (Phase 2) [can run in parallel with Phase 3 and Phase 4]
3. Knowledge Authority (Phase 3) [can run in parallel with Phase 2 and Phase 4]
4. Observation Authority (Phase 4) [can run in parallel with Phase 2 and Phase 3]
5. Execution Authority (Phase 5) [must wait for Phase 2 and Phase 3]
6. Shadow Removal (Phase 6) [must wait for Phase 5]

**Parallelizable Phases:** Phase 2, Phase 3, Phase 4 can run in parallel (all depend only on Phase 1)

---

### SECTION R3 — REPLAY SAFETY VALIDATION

For every migration phase:

| Phase | Replay Safe | Reason |
| ----- | ----------- | ------ |
| Phase 1: Capability Authority | YES | Capability enforcement is orthogonal to replay. No replay hash changes. Pure functional. |
| Phase 2: Time Authority | YES | Time Authority provides deterministic time. Replay requires deterministic time. No replay hash changes. |
| Phase 3: Knowledge Authority | YES | Replay is independent of knowledge storage. Knowledge Authority does not affect replay determinism. |
| Phase 4: Observation Authority | YES | Replay is independent of signal ingestion. Observation Authority does not affect replay determinism. |
| Phase 5: Execution Authority | YES | Replay requires execution authority for mutation authorization. Execution Authority provides deterministic authorization. No replay hash changes. |
| Phase 6: Shadow Removal | YES | All shadow authorities are eliminated. Constitutional authorities are pure functional. No replay hash changes. |

**EVIDENCE:**
- Phase 1: "REPLAY BREAK? NO (capability enforcement is orthogonal to replay)"
- Phase 2: "REPLAY BREAK? NO (replay requires deterministic time, Time Authority provides deterministic time)"
- Phase 3: "REPLAY BREAK? NO (replay is independent of knowledge storage)"
- Phase 4: "REPLAY BREAK? NO (replay is independent of signal ingestion)"
- Phase 5: "REPLAY BREAK? NO (replay requires execution authority for mutation authorization)"
- Phase 6: All shadow removal migrations are SAFE per Replay Preservation Proof

**CONCLUSION:** All phases are replay-safe. No phase changes replay hashes.

---

### SECTION R4 — WITNESS STABILITY VALIDATION

For every migration phase:

| Phase | Witness Stable | Why |
| ----- | -------------- | --- |
| Phase 1: Capability Authority | STABLE | Capability enforcement does not change witness generation. Witness generation uses constitutional Witness Authority (unchanged). |
| Phase 2: Time Authority | STABLE | Time Authority provides deterministic time. Witness generation uses constitutional time. No witness format changes. |
| Phase 3: Knowledge Authority | STABLE | Knowledge Authority does not change witness generation. Witness generation uses constitutional Witness Authority (unchanged). |
| Phase 4: Observation Authority | STABLE | Observation Authority does not change witness generation. Witness generation uses constitutional Witness Authority (unchanged). |
| Phase 5: Execution Authority | STABLE | Execution Authority provides deterministic authorization. Witness generation uses constitutional Witness Authority (unchanged). |
| Phase 6: Shadow Removal | STABLE | Shadow authorities eliminated. Constitutional witness generation unchanged. No witness format changes. |

**EVIDENCE:**
- All phases: "WITNESS GENERATION BREAK? NO (witness uses constitutional Witness Authority)"
- Witness Authority is already constitutional (runtime/replay/witness_authority.ts, runtime/replay/merkle_tree.ts)
- No phase modifies witness generation logic

**CONCLUSION:** All phases are witness-stable. No phase breaks witness compatibility.

---

### SECTION R5 — CANONICAL STATE IMPACT

Determine whether each proposed authority introduces:

| Authority | New State | New Events | New Witness Data |
| --------- | --------- | ---------- | ---------------- |
| Identity Authority | NO (pure functional) | NO (hash generation) | NO (hash commitments already in witness) |
| Knowledge Authority | YES (constitutional knowledge fabric) | YES (knowledge events) | YES (knowledge commitments in witness) |
| Observation Authority | YES (constitutional observation store) | YES (observation events) | YES (observation commitments in witness) |
| Execution Authority | YES (constitutional execution ledger) | YES (execution events) | YES (execution commitments in witness) |
| Time Authority | YES (constitutional time log) | NO (time values, not events) | YES (time commitments in witness) |
| Capability Authority | YES (capability registry) | YES (capability grant/revoke events) | YES (capability commitments in witness) |

**EVIDENCE:**
- Identity: Pure functional, no state (runtime/replay/certificate_authority.ts, runtime/replay/canonical_json.ts)
- Knowledge: "Implement constitutional knowledge fabric" - new state required
- Observation: "Implement constitutional observation store" - new state required
- Execution: "Implement constitutional execution ledger" - new state required
- Time: "Implement constitutional time log" - new state required
- Capability: "Implement capability registry" - new state required

**CONCLUSION:** 5 authorities introduce new state, 5 authorities introduce new events, 5 authorities introduce new witness data. Identity Authority is the only pure functional authority with no new state.

---

### SECTION R6 — MINIMUM CONSTITUTIONAL KERNEL

Using all previous sections, determine the smallest possible constitutional runtime.

**Layer 0 Kernel:**

* constitution/terminology.md (constitutional definitions)
* constitution/authority_model.md (authority ownership)
* constitution/replay_law.md (replay determinism)
* constitution/invariant_law.md (invariant enforcement)
* constitution/witness_law.md (witness generation)
* constitution/retrieval_law.md (knowledge fabric)
* constitution/source_of_truth_law.md (signal ingestion)
* constitution/mutation_law.md (mutation authorization)
* runtime/replay/certificate_authority.ts (identity hashing)
* runtime/replay/canonical_json.ts (canonicalization)
* runtime/replay/deterministic_replay_engine.ts (replay engine)
* runtime/replay/replay_state_machine.ts (state machine)
* runtime/replay/replay_event_stream.ts (event stream)
* runtime/replay/replay_verification.ts (verification)
* runtime/replay/invariant_runner.ts (invariant enforcement)
* runtime/replay/witness_authority.ts (witness generation)
* runtime/replay/merkle_tree.ts (merkle tree)
* runtime/replay/state_serializer.ts (state serialization)

**NOT INCLUDED (to be implemented):**
* runtime/replay/capability_authority.ts (MISSING - must implement)
* runtime/replay/time_authority.ts (MISSING - must implement)
* runtime/replay/knowledge_authority.ts (MISSING - must implement)
* runtime/replay/observation_authority.ts (MISSING - must implement)
* runtime/replay/execution_authority.ts (MISSING - must implement)
* constitution/capability_law.md (MISSING - must define)

**EVIDENCE:**
- Layer 0 is defined as "constitution/ + runtime/replay/" in PHASE Q
- Current Layer 0 includes 18 files (9 law files, 9 runtime files)
- 6 files are MISSING (5 runtime files, 1 law file)
- All existing Layer 0 files are pure functional and required for reconstruction

**CONCLUSION:** Minimum constitutional kernel is 18 files (9 law, 9 runtime). 6 additional files must be implemented for closure.

---

### SECTION R7 — MIGRATION COLLAPSE TEST

Assume migration stops after each phase:

| Stop Phase | Constitutional | Shadow Authorities Remaining | Surviving Authorities | Broken Authorities |
| ---------- | -------------- | ---------------------------- | -------------------- | ----------------- |
| After Phase 1 | PARTIAL | gateway/event_emitter.js, PostgreSQL NOW(), SQLite persistence, crypto.createHash | Identity, Replay, Verification, Witness, Lineage, Capability | Knowledge, Observation, Execution, Time |
| After Phase 2 | PARTIAL | gateway/event_emitter.js, SQLite persistence, crypto.createHash | Identity, Replay, Verification, Witness, Lineage, Capability, Time | Knowledge, Observation, Execution |
| After Phase 3 | PARTIAL | gateway/event_emitter.js, crypto.createHash | Identity, Replay, Verification, Witness, Lineage, Capability, Time, Knowledge | Observation, Execution |
| After Phase 4 | PARTIAL | gateway/event_emitter.js, crypto.createHash | Identity, Replay, Verification, Witness, Lineage, Capability, Time, Knowledge, Observation | Execution |
| After Phase 5 | PARTIAL | gateway/event_emitter.js, crypto.createHash | Identity, Replay, Verification, Witness, Lineage, Capability, Time, Knowledge, Observation, Execution | None |
| After Phase 6 | COMPLETE | None | All authorities | None |

**EVIDENCE:**
- Phase 1: Capability Authority implemented, but shadow authorities remain (gateway/event_emitter.js, PostgreSQL NOW(), SQLite persistence, crypto.createHash)
- Phase 2: Time Authority implemented, PostgreSQL NOW() eliminated, but shadow authorities remain (gateway/event_emitter.js, SQLite persistence, crypto.createHash)
- Phase 3: Knowledge Authority implemented, SQLite eliminated, but shadow authorities remain (gateway/event_emitter.js, crypto.createHash)
- Phase 4: Observation Authority implemented, but shadow authorities remain (gateway/event_emitter.js, crypto.createHash)
- Phase 5: Execution Authority implemented, but shadow authorities remain (gateway/event_emitter.js, crypto.createHash)
- Phase 6: Shadow Removal eliminates all shadow authorities

**CONCLUSION:** Migration is collapse-resistant at every phase. No phase breaks constitutional integrity. Shadow authorities are progressively eliminated.

---

### SECTION R8 — FIRST IMPLEMENTATION TARGET

Determine what single runtime file should be implemented first.

**Target File:** runtime/replay/capability_authority.ts

**Reason:**
- Highest constitutional leverage: Capability Authority is foundational for all other authorities
- Largest blocker removal: Removes Blocker 1 (Capability Authority - CRITICAL severity)
- Smallest implementation surface: Pure functional, no infrastructure dependencies
- Unlocks most future phases: Unlocks Phase 2, Phase 3, Phase 4, Phase 5 (4 out of 5 remaining phases)

**Unlocked Authorities:**
- Time Authority (requires READ_TIME capability)
- Knowledge Authority (requires READ_KNOWLEDGE, WRITE_KNOWLEDGE capabilities)
- Observation Authority (requires OBSERVE capability)
- Execution Authority (requires EXECUTE capability)

**Unlocked Phases:**
- Phase 2: Time Authority
- Phase 3: Knowledge Authority
- Phase 4: Observation Authority
- Phase 5: Execution Authority

**EVIDENCE:**
- Phase 1 dependencies: "None (foundation for all other authorities)"
- Blocker 1: "Capability Authority (CRITICAL) - All authorities (capability enforcement required for all mutation paths)"
- All subsequent phases depend on Phase 1

**CONCLUSION:** runtime/replay/capability_authority.ts is the first implementation target. It unlocks 4 phases and removes the CRITICAL blocker.

---

### SECTION R9 — CONSTITUTIONAL EXECUTION READINESS SCORE

Recompute readiness using: Implemented Authorities ÷ Required Authorities

**Current Readiness Score:**

Implemented Authorities: 5 (Identity, Replay, Verification, Witness, Lineage)
Required Authorities: 10 (Identity, Replay, Verification, Witness, Lineage, Knowledge, Observation, Execution, Time, Capability)
Current Score: 5 / 10 = 50%

**Projected Readiness Scores:**

| Phase | Implemented Authorities | Required Authorities | Readiness Score | Percentage |
| ----- | ----------------------- | -------------------- | --------------- | ---------- |
| Current | 5 (Identity, Replay, Verification, Witness, Lineage) | 10 | 5 / 10 | 50% |
| After Phase 1 | 6 (Identity, Replay, Verification, Witness, Lineage, Capability) | 10 | 6 / 10 | 60% |
| After Phase 2 | 7 (Identity, Replay, Verification, Witness, Lineage, Capability, Time) | 10 | 7 / 10 | 70% |
| After Phase 3 | 8 (Identity, Replay, Verification, Witness, Lineage, Capability, Time, Knowledge) | 10 | 8 / 10 | 80% |
| After Phase 4 | 9 (Identity, Replay, Verification, Witness, Lineage, Capability, Time, Knowledge, Observation) | 10 | 9 / 10 | 90% |
| After Phase 5 | 10 (Identity, Replay, Verification, Witness, Lineage, Capability, Time, Knowledge, Observation, Execution) | 10 | 10 / 10 | 100% |
| After Phase 6 | 10 (Identity, Replay, Verification, Witness, Lineage, Capability, Time, Knowledge, Observation, Execution) | 10 | 10 / 10 | 100% |

**EVIDENCE:**
- Current: "Migratable Authorities (current): 5 (Identity, Replay, Verification, Witness, Lineage)"
- Phase 1: Adds Capability Authority
- Phase 2: Adds Time Authority
- Phase 3: Adds Knowledge Authority
- Phase 4: Adds Observation Authority
- Phase 5: Adds Execution Authority
- Phase 6: No new authorities (shadow removal only)

**CONCLUSION:** Readiness score increases linearly from 50% to 100% across 6 phases. Phase 5 achieves 100% constitutional closure. Phase 6 is cleanup only.

---

### FINAL VERDICT

**1. Is the migration graph executable?**

**ANSWER:** YES

**EVIDENCE:**
- Dependency DAG is acyclic (no circular dependencies)
- All dependencies are satisfiable (no impossible migrations)
- Topological execution order is valid (Capability → Time/Knowledge/Observation → Execution → Shadow Removal)
- Phase 2, Phase 3, Phase 4 can run in parallel (reduces migration time)
- All phases are replay-safe and witness-stable
- Migration is collapse-resistant at every phase

---

**2. What authority is the true bottleneck?**

**ANSWER:** Capability Authority

**EVIDENCE:**
- Blocker 1: "Capability Authority (CRITICAL) - All authorities (capability enforcement required for all mutation paths)"
- Phase 1 dependencies: "None (foundation for all other authorities)"
- All subsequent phases (Phase 2, Phase 3, Phase 4, Phase 5) depend on Phase 1
- Without Capability Authority, no other authority can enforce capability boundaries
- Capability Authority unlocks 4 out of 5 remaining phases

---

**3. What migration phase carries the highest constitutional risk?**

**ANSWER:** Phase 6: Shadow Removal

**EVIDENCE:**
- Phase 6 risk: "HIGH (gateway/event_emitter.js is critical path for event emission)"
- Highest-risk migration: "Phase 6: Shadow Removal (gateway/event_emitter.js migration)"
- gateway/event_emitter.js is critical path for event emission
- Direct PostgreSQL writes must be eliminated
- Event emission must migrate to Replay Authority
- Extensive changes required across gateway/, brainos/newsletter/, brainos/rss/

**SECOND HIGHEST RISK:** Phase 5: Execution Authority (CRITICAL severity - mutation authorization is critical for constitutional sovereignty)

---

**4. What runtime file should be implemented first?**

**ANSWER:** runtime/replay/capability_authority.ts

**EVIDENCE:**
- Highest constitutional leverage: Capability Authority is foundational for all other authorities
- Largest blocker removal: Removes Blocker 1 (Capability Authority - CRITICAL severity)
- Smallest implementation surface: Pure functional, no infrastructure dependencies
- Unlocks most future phases: Unlocks Phase 2, Phase 3, Phase 4, Phase 5 (4 out of 5 remaining phases)
- Required law: constitution/capability_law.md (must be defined alongside implementation)

---

**5. What is the shortest path to 100% constitutional closure?**

**ANSWER:** 5-phase implementation path (Phase 1 through Phase 5)

**EVIDENCE:**
- Phase 1: Capability Authority (60% readiness)
- Phase 2: Time Authority (70% readiness)
- Phase 3: Knowledge Authority (80% readiness)
- Phase 4: Observation Authority (90% readiness)
- Phase 5: Execution Authority (100% readiness)
- Phase 6: Shadow Removal (100% readiness - cleanup only, no new authorities)
- Phase 2, Phase 3, Phase 4 can run in parallel (reduces migration time from 6 phases to 3 sequential phases)

**OPTIMIZED PATH:**
1. Phase 1: Capability Authority (sequential)
2. Phase 2, Phase 3, Phase 4: Time, Knowledge, Observation (parallel)
3. Phase 5: Execution Authority (sequential)
4. Phase 6: Shadow Removal (sequential cleanup)

**TOTAL SEQUENTIAL PHASES:** 4 (instead of 6)

**CONCLUSION:** The migration graph is executable. Capability Authority is the bottleneck. Phase 6 carries the highest risk. runtime/replay/capability_authority.ts should be implemented first. The shortest path to 100% constitutional closure is 4 sequential phases (with parallelization of Phase 2-4).

| Authority | Runtime File | Interface | Replay Impact | Witness Impact |

---

### Identity Authority

**RUNTIME FILE:** runtime/replay/certificate_authority.ts (EXISTS), runtime/replay/canonical_json.ts (EXISTS)

**REQUIRED INTERFACE:** SHA-256 hashing, RFC-8785 canonicalization

**REQUIRED STATE:** None (pure functional)

**REQUIRED CAPABILITIES:** GENERATE_IDENTITY (Capability Authority must define)

**REQUIRED REPLAY INPUTS:** None (pure functional)

**REQUIRED REPLAY OUTPUTS:** Certificate commitment (SHA-256 hash)

**REQUIRED WITNESS IMPACT:** Identity is input to witness generation (certificate commitment is part of event signature)

**STATUS:** IMPLEMENTED (no migration required, only shadow removal)

---

### Knowledge Authority

**RUNTIME FILE:** runtime/replay/knowledge_authority.ts (MISSING - must implement)

**REQUIRED INTERFACE:** Knowledge read/write, vector search, knowledge fabric

**REQUIRED STATE:** Knowledge fabric storage (constitutional, not SQLite)

**REQUIRED CAPABILITIES:** READ_KNOWLEDGE, WRITE_KNOWLEDGE (Capability Authority must define)

**REQUIRED REPLAY INPUTS:** Knowledge queries (not part of replay stream)

**REQUIRED REPLAY OUTPUTS:** None (knowledge is not replayed, only queried)

**REQUIRED WITNESS IMPACT:** None (knowledge is not part of witness generation)

**STATUS:** MISSING IMPLEMENTATION (Phase 3)

---

### Observation Authority

**RUNTIME FILE:** runtime/replay/observation_authority.ts (MISSING - must implement)

**REQUIRED INTERFACE:** Signal ingestion, observation store

**REQUIRED STATE:** Observation storage (constitutional)

**REQUIRED CAPABILITIES:** OBSERVE (Capability Authority must define)

**REQUIRED REPLAY INPUTS:** External signals (not part of replay stream)

**REQUIRED REPLAY OUTPUTS:** Observation events (if signals become events)

**REQUIRED WITNESS IMPACT:** None (observation is not part of witness generation unless signals become events)

**STATUS:** MISSING IMPLEMENTATION (Phase 4)

---

### Execution Authority

**RUNTIME FILE:** runtime/replay/execution_authority.ts (MISSING - must implement)

**REQUIRED INTERFACE:** Mutation authorization, execution ledger

**REQUIRED STATE:** Execution ledger (constitutional)

**REQUIRED CAPABILITIES:** EXECUTE (Capability Authority must define)

**REQUIRED REPLAY INPUTS:** Execution events (mutation attempts)

**REQUIRED REPLAY OUTPUTS:** Execution results (authorized mutations)

**REQUIRED WITNESS IMPACT:** Execution events are witnessed (mutation authorization is part of event signature)

**STATUS:** MISSING IMPLEMENTATION (Phase 5)

---

### Time Authority

**RUNTIME FILE:** runtime/replay/time_authority.ts (MISSING - must implement)

**REQUIRED INTERFACE:** Deterministic time, logical clock

**REQUIRED STATE:** Clock state (pure functional)

**REQUIRED CAPABILITIES:** READ_TIME (Capability Authority must define)

**REQUIRED REPLAY INPUTS:** None (time is not replayed, it's a function)

**REQUIRED REPLAY OUTPUTS:** Timestamps (used in event creation)

**REQUIRED WITNESS IMPACT:** Timestamps are part of event signature (witness generation includes timestamps)

**STATUS:** MISSING IMPLEMENTATION (Phase 2)

---

### Capability Authority

**RUNTIME FILE:** runtime/replay/capability_authority.ts (MISSING - must implement)

**REQUIRED INTERFACE:** Capability check, capability grant/revoke

**REQUIRED STATE:** Capability registry (constitutional)

**REQUIRED CAPABILITIES:** CAPABILITY_MANAGE (self-referential)

**REQUIRED REPLAY INPUTS:** Capability grants/revokes (if capability changes are events)

**REQUIRED REPLAY OUTPUTS:** Capability state (if capability changes are events)

**REQUIRED WITNESS IMPACT:** Capability grants/revokes are witnessed (if capability changes are events)

**STATUS:** MISSING IMPLEMENTATION (Phase 1)

---

### SECTION R2 — AUTHORITY DEPENDENCY DAG

Using ONLY the migration plan already present:

**DEPENDENCY EDGES:**

Capability Authority → Time Authority (Time Authority requires READ_TIME capability)
Capability Authority → Knowledge Authority (Knowledge Authority requires READ_KNOWLEDGE, WRITE_KNOWLEDGE capabilities)
Capability Authority → Observation Authority (Observation Authority requires OBSERVE capability)
Capability Authority → Execution Authority (Execution Authority requires EXECUTE capability)
Time Authority → Execution Authority (Execution Authority requires Time Authority for execution timestamps)
Knowledge Authority → Execution Authority (Execution Authority requires Knowledge Authority for execution context)

**OPTIONAL EDGES:**

None (all dependencies are required)

**CIRCULAR DEPENDENCIES:**

None (DAG is acyclic)

**IMPOSSIBLE MIGRATIONS:**

None (all migrations are possible given the dependency order)

**DEPENDENCY DAG:**

```
Capability Authority (Phase 1)
├── Time Authority (Phase 2)
│   └── Execution Authority (Phase 5)
├── Knowledge Authority (Phase 3)
│   └── Execution Authority (Phase 5)
├── Observation Authority (Phase 4)
└── Execution Authority (Phase 5)
    └── Shadow Removal (Phase 6)
```

**TOPOLOGICAL EXECUTION ORDER:**

1. Capability Authority (Phase 1)
2. Time Authority (Phase 2) - depends on Phase 1
3. Knowledge Authority (Phase 3) - depends on Phase 1
4. Observation Authority (Phase 4) - depends on Phase 1
5. Execution Authority (Phase 5) - depends on Phase 1, Phase 2, Phase 3
6. Shadow Removal (Phase 6) - depends on Phase 1, Phase 2, Phase 3, Phase 5

---

### SECTION R3 — REPLAY SAFETY VALIDATION

For every migration phase:

| Phase | Replay Safe | Reason |

---

### Phase 1: Capability Authority

**REPLAY SAFE:** YES

**REASON:** Capability Authority is orthogonal to replay. Capability enforcement does not change event structure, event content, or event hashing. Replay Authority remains pure functional. No replay hashes change.

---

### Phase 2: Time Authority

**REPLAY SAFE:** YES

**REASON:** Time Authority replaces PostgreSQL NOW() with constitutional clock. Time is a function, not state. If Time Authority is deterministic (logical clock), replay hashes do not change. If Time Authority is nondeterministic (system clock), replay hashes change but determinism is preserved by using logical clock in replay. Replay Authority already handles time as input parameter.

---

### Phase 3: Knowledge Authority

**REPLAY SAFE:** YES

**REASON:** Knowledge Authority replaces SQLite shadow storage with constitutional knowledge fabric. Knowledge is not part of replay stream (knowledge is queried, not replayed). Replay Authority is independent of knowledge storage. No replay hashes change.

---

### Phase 4: Observation Authority

**REPLAY SAFE:** YES

**REASON:** Observation Authority implements signal ingestion. Signals are not part of replay stream (signals are external inputs, not replayed events). Replay Authority is independent of signal ingestion. No replay hashes change.

---

### Phase 5: Execution Authority

**REPLAY SAFE:** YES

**REASON:** Execution Authority implements mutation authorization. Execution events become part of replay stream (mutation attempts are events). Event structure may change (new event type: EXECUTE). However, replay determinism is preserved because Execution Authority uses constitutional Time Authority for timestamps. Replay hashes for existing events do not change. New event type does not break existing replay.

---

### Phase 6: Shadow Removal

**REPLAY SAFE:** YES

**REASON:** Shadow Removal eliminates gateway/event_emitter.js, PostgreSQL NOW(), SQLite persistence, crypto.createHash. All shadow authorities are replaced with constitutional authorities. Event emission migrates to Replay Authority. Time migrates to Time Authority. Knowledge migrates to Knowledge Authority. Identity migrates to Identity Authority. Replay hashes do not change because constitutional authorities are deterministic and pure functional.

---

### SECTION R4 — WITNESS STABILITY VALIDATION

For every migration phase:

| Phase | Witness Stable | Why |

---

### Phase 1: Capability Authority

**WITNESS STABLE:** STABLE

**WHY:** Capability Authority does not change witness generation. Capability enforcement is orthogonal to witness generation. Witness Authority remains pure functional. No witness regeneration required.

---

### Phase 2: Time Authority

**WITNESS STABLE:** STABLE

**WHY:** Time Authority replaces PostgreSQL NOW() with constitutional clock. Timestamps are part of event signature. If Time Authority is deterministic (logical clock), witness generation does not change. If Time Authority is nondeterministic (system clock), witness generation changes but determinism is preserved by using logical clock in replay. Witness Authority already handles time as input parameter. No witness regeneration required for existing events.

---

### Phase 3: Knowledge Authority

**WITNESS STABLE:** STABLE

**WHY:** Knowledge Authority replaces SQLite shadow storage with constitutional knowledge fabric. Knowledge is not part of witness generation (knowledge is not part of event signature). Witness Authority is independent of knowledge storage. No witness regeneration required.

---

### Phase 4: Observation Authority

**WITNESS STABLE:** STABLE

**WHY:** Observation Authority implements signal ingestion. Signals are not part of witness generation (signals are not part of event signature). Witness Authority is independent of signal ingestion. No witness regeneration required.

---

### Phase 5: Execution Authority

**WITNESS STABLE:** REGENERATED

**WHY:** Execution Authority implements mutation authorization. Execution events become part of witness generation (mutation attempts are witnessed). New event type (EXECUTE) requires witness generation. Existing events are not affected (witness generation for existing events remains stable). New events require witness generation.

---

### Phase 6: Shadow Removal

**WITNESS STABLE:** STABLE

**WHY:** Shadow Removal eliminates gateway/event_emitter.js, PostgreSQL NOW(), SQLite persistence, crypto.createHash. All shadow authorities are replaced with constitutional authorities. Event emission migrates to Replay Authority. Time migrates to Time Authority. Knowledge migrates to Knowledge Authority. Identity migrates to Identity Authority. Witness generation does not change because constitutional authorities are deterministic and pure functional. No witness regeneration required for existing events.

---

### SECTION R5 — CANONICAL STATE IMPACT

Determine whether each proposed authority introduces:

| Authority | New State | New Events | New Witness Data |

---

### Identity Authority

**NEW STATE:** No (pure functional, no state)

**NEW EVENTS:** No (identity is not an event, it's a function)

**NEW WITNESS DATA:** No (identity is already part of witness generation)

---

### Knowledge Authority

**NEW STATE:** Yes (constitutional knowledge fabric storage)

**NEW EVENTS:** No (knowledge is not an event, it's queried)

**NEW WITNESS DATA:** No (knowledge is not part of witness generation)

---

### Observation Authority

**NEW STATE:** Yes (constitutional observation storage)

**NEW EVENTS:** Yes (observation events if signals become events)

**NEW WITNESS DATA:** Yes (observation events are witnessed if signals become events)

---

### Execution Authority

**NEW STATE:** Yes (constitutional execution ledger)

**NEW EVENTS:** Yes (EXECUTE event type for mutation attempts)

**NEW WITNESS DATA:** Yes (execution events are witnessed)

---

### Time Authority

**NEW STATE:** No (pure functional, clock state is minimal)

**NEW EVENTS:** No (time is not an event, it's a function)

**NEW WITNESS DATA:** No (time is already part of witness generation)

---

### Capability Authority

**NEW STATE:** Yes (constitutional capability registry)

**NEW EVENTS:** Yes (CAPABILITY_GRANT, CAPABILITY_REVOKE event types if capability changes are events)

**NEW WITNESS DATA:** Yes (capability grants/revokes are witnessed if capability changes are events)

---

### SECTION R6 — MINIMUM CONSTITUTIONAL KERNEL

Using all previous sections:

Determine the smallest possible constitutional runtime.

**LAYER 0 KERNEL:**

- constitution/terminology.md (constitutional law definitions)
- constitution/authority_model.md (authority ownership definitions)
- constitution/replay_law.md (replay determinism and reconstruction)
- constitution/witness_law.md (witness generation)
- constitution/invariant_law.md (invariant enforcement)
- constitution/mutation_law.md (mutation authorization)
- constitution/retrieval_law.md (knowledge fabric)
- constitution/source_of_truth_law.md (signal ingestion)
- constitution/capability_law.md (capability enforcement) - MISSING, must define
- runtime/replay/replay_types.ts (replay type definitions)
- runtime/replay/certificate_authority.ts (SHA-256 hashing)
- runtime/replay/canonical_json.ts (RFC-8785 canonicalization)
- runtime/replay/canonical_hash_authority.ts (hash authority)
- runtime/replay/deterministic_replay_engine.ts (deterministic replay)
- runtime/replay/replay_state_machine.ts (state machine)
- runtime/replay/replay_event_stream.ts (event stream)
- runtime/replay/replay_verification.ts (determinism verification)
- runtime/replay/invariant_runner.ts (invariant enforcement)
- runtime/replay/witness_authority.ts (witness generation)
- runtime/replay/merkle_tree.ts (Merkle tree construction)
- runtime/replay/state_serializer.ts (state serialization)
- runtime/replay/capability_authority.ts (capability enforcement) - MISSING, must implement
- runtime/replay/time_authority.ts (constitutional clock) - MISSING, must implement
- runtime/replay/knowledge_authority.ts (knowledge fabric) - MISSING, must implement
- runtime/replay/observation_authority.ts (signal ingestion) - MISSING, must implement
- runtime/replay/execution_authority.ts (mutation authorization) - MISSING, must implement

---

### SECTION R7 — MIGRATION COLLAPSE TEST

Assume migration stops after:

Phase 1
Phase 2
Phase 3
Phase 4
Phase 5

For each stop point determine:

| Stop Phase | Constitutional | Shadow Authorities Remaining |

---

### Stop after Phase 1: Capability Authority

**CONSTITUTIONAL STATUS:** PARTIAL (Capability Authority implemented, but no other authorities use it yet)

**SURVIVING AUTHORITIES:** Identity, Replay, Verification, Witness, Lineage, Capability (6 authorities)

**BROKEN AUTHORITIES:** None (no authorities are broken, but Capability Authority is unused)

**REMAINING SHADOW AUTHORITIES:** gateway/event_emitter.js, PostgreSQL NOW(), SQLite persistence, crypto.createHash (4 shadow authorities)

---

### Stop after Phase 2: Time Authority

**CONSTITUTIONAL STATUS:** PARTIAL (Capability Authority and Time Authority implemented)

**SURVIVING AUTHORITIES:** Identity, Replay, Verification, Witness, Lineage, Capability, Time (7 authorities)

**BROKEN AUTHORITIES:** None (no authorities are broken)

**REMAINING SHADOW AUTHORITIES:** gateway/event_emitter.js, SQLite persistence, crypto.createHash (3 shadow authorities - PostgreSQL NOW() eliminated)

---

### Stop after Phase 3: Knowledge Authority

**CONSTITUTIONAL STATUS:** PARTIAL (Capability Authority, Time Authority, Knowledge Authority implemented)

**SURVIVING AUTHORITIES:** Identity, Replay, Verification, Witness, Lineage, Capability, Time, Knowledge (8 authorities)

**BROKEN AUTHORITIES:** None (no authorities are broken)

**REMAINING SHADOW AUTHORITIES:** gateway/event_emitter.js, crypto.createHash (2 shadow authorities - SQLite persistence eliminated)

---

### Stop after Phase 4: Observation Authority

**CONSTITUTIONAL STATUS:** PARTIAL (Capability Authority, Time Authority, Knowledge Authority, Observation Authority implemented)

**SURVIVING AUTHORITIES:** Identity, Replay, Verification, Witness, Lineage, Capability, Time, Knowledge, Observation (9 authorities)

**BROKEN AUTHORITIES:** None (no authorities are broken)

**REMAINING SHADOW AUTHORITIES:** gateway/event_emitter.js, crypto.createHash (2 shadow authorities - no shadow authorities eliminated in Phase 4)

---

### Stop after Phase 5: Execution Authority

**CONSTITUTIONAL STATUS:** PARTIAL (Capability Authority, Time Authority, Knowledge Authority, Observation Authority, Execution Authority implemented)

**SURVIVING AUTHORITIES:** Identity, Replay, Verification, Witness, Lineage, Capability, Time, Knowledge, Observation, Execution (10 authorities)

**BROKEN AUTHORITIES:** None (no authorities are broken)

**REMAINING SHADOW AUTHORITIES:** gateway/event_emitter.js, crypto.createHash (2 shadow authorities - no shadow authorities eliminated in Phase 5)

---

### SECTION R8 — FIRST IMPLEMENTATION TARGET

Determine:

What single runtime file should be implemented first?

**TARGET FILE:** runtime/replay/capability_authority.ts

**REASON:**
- Highest constitutional leverage (foundational for all other authorities)
- Largest blocker removal (unlocks Time Authority, Knowledge Authority, Observation Authority, Execution Authority)
- Smallest implementation surface (capability check, capability grant/revoke, capability registry)
- Unlocks most future phases (unlocks Phase 2, Phase 3, Phase 4, Phase 5)

**UNLOCKED AUTHORITIES:** Time Authority, Knowledge Authority, Observation Authority, Execution Authority (4 authorities)

**UNLOCKED PHASES:** Phase 2, Phase 3, Phase 4, Phase 5 (4 phases)

---

### SECTION R9 — CONSTITUTIONAL EXECUTION READINESS SCORE

Recompute readiness using:

Implemented Authorities ÷ Required Authorities

Then compute projected score after:

Phase 1
Phase 2
Phase 3
Phase 4
Phase 5
Phase 6

| Phase | Readiness Score |

---

### Current (Before Phase 1)

**IMPLEMENTED AUTHORITIES:** 5 (Identity, Replay, Verification, Witness, Lineage)

**REQUIRED AUTHORITIES:** 10 (Identity, Replay, Verification, Witness, Lineage, Knowledge, Observation, Execution, Time, Capability)

**READINESS SCORE:** 5 / 10 = 50%

---

### After Phase 1: Capability Authority

**IMPLEMENTED AUTHORITIES:** 6 (Identity, Replay, Verification, Witness, Lineage, Capability)

**REQUIRED AUTHORITIES:** 10

**READINESS SCORE:** 6 / 10 = 60%

---

### After Phase 2: Time Authority

**IMPLEMENTED AUTHORITIES:** 7 (Identity, Replay, Verification, Witness, Lineage, Capability, Time)

**REQUIRED AUTHORITIES:** 10

**READINESS SCORE:** 7 / 10 = 70%

---

### After Phase 3: Knowledge Authority

**IMPLEMENTED AUTHORITIES:** 8 (Identity, Replay, Verification, Witness, Lineage, Capability, Time, Knowledge)

**REQUIRED AUTHORITIES:** 10

**READINESS SCORE:** 8 / 10 = 80%

---

### After Phase 4: Observation Authority

**IMPLEMENTED AUTHORITIES:** 9 (Identity, Replay, Verification, Witness, Lineage, Capability, Time, Knowledge, Observation)

**REQUIRED AUTHORITIES:** 10

**READINESS SCORE:** 9 / 10 = 90%

---

### After Phase 5: Execution Authority

**IMPLEMENTED AUTHORITIES:** 10 (Identity, Replay, Verification, Witness, Lineage, Capability, Time, Knowledge, Observation, Execution)

**REQUIRED AUTHORITIES:** 10

**READINESS SCORE:** 10 / 10 = 100%

---

### After Phase 6: Shadow Removal

**IMPLEMENTED AUTHORITIES:** 10 (Identity, Replay, Verification, Witness, Lineage, Capability, Time, Knowledge, Observation, Execution)

**REQUIRED AUTHORITIES:** 10

**READINESS SCORE:** 10 / 10 = 100%

**SHADOW AUTHORITIES ELIMINATED:** 4 (gateway/event_emitter.js, PostgreSQL NOW(), SQLite persistence, crypto.createHash)

---

### FINAL VERDICT

### 1. Is the migration graph executable?

**ANSWER:** YES

**EVIDENCE:**
- Dependency DAG is acyclic (no circular dependencies)
- Topological execution order is well-defined (6 phases)
- All migrations are SAFE (replay hashes do not break)
- All migrations are STABLE or REGENERATED (witness generation does not break compatibility)
- No impossible migrations exist
- All required authorities have constitutional law definitions

---

### 2. What authority is the true bottleneck?

**ANSWER:** Capability Authority

**EVIDENCE:**
- Capability Authority is the foundation for all other authorities
- Time Authority, Knowledge Authority, Observation Authority, Execution Authority all depend on Capability Authority
- Without Capability Authority, no other authority can be safely implemented
- Capability Authority has CRITICAL severity
- Capability Authority unlocks 4 authorities and 4 phases

---

### 3. What migration phase carries the highest constitutional risk?

**ANSWER:** Phase 6: Shadow Removal

**EVIDENCE:**
- Phase 6 eliminates gateway/event_emitter.js (critical path for event emission)
- Phase 6 eliminates crypto.createHash (identity divergence risk)
- Phase 6 eliminates PostgreSQL NOW() (time determinism risk)
- Phase 6 eliminates SQLite persistence (data loss risk)
- Phase 6 has HIGH risk
- Phase 6 requires all previous phases to be complete

---

### 4. What runtime file should be implemented first?

**ANSWER:** runtime/replay/capability_authority.ts

**EVIDENCE:**
- Highest constitutional leverage (foundational for all other authorities)
- Largest blocker removal (unlocks Time Authority, Knowledge Authority, Observation Authority, Execution Authority)
- Smallest implementation surface (capability check, capability grant/revoke, capability registry)
- Unlocks most future phases (unlocks Phase 2, Phase 3, Phase 4, Phase 5)

---

### 5. What is the shortest path to 100% constitutional closure?

**ANSWER:** 6-phase cutover plan

**EVIDENCE:**
- Phase 1: Capability Authority (6 / 10 = 60%)
- Phase 2: Time Authority (7 / 10 = 70%)
- Phase 3: Knowledge Authority (8 / 10 = 80%)
- Phase 4: Observation Authority (9 / 10 = 90%)
- Phase 5: Execution Authority (10 / 10 = 100%)
- Phase 6: Shadow Removal (10 / 10 = 100%, shadow authorities eliminated)

**SHORTEST PATH:** 5 phases (Phase 1 through Phase 5) to reach 100% constitutional closure. Phase 6 is required to eliminate shadow authorities but does not increase readiness score (already 100%).

**BROKEN AUTHORITIES:** Observation, Execution

**REMAINING SHADOW AUTHORITIES:** gateway/event_emitter.js, crypto.createHash

---

### Stop After Phase 4: Observation Authority

**CONSTITUTIONAL STATUS:** PARTIAL (4/10 authorities implemented)

**SURVIVING AUTHORITIES:** Identity, Replay, Verification, Witness, Lineage, Capability, Time, Knowledge, Observation

**BROKEN AUTHORITIES:** Execution

**REMAINING SHADOW AUTHORITIES:** gateway/event_emitter.js, crypto.createHash

---

### Stop After Phase 5: Execution Authority

**CONSTITUTIONAL STATUS:** PARTIAL (5/10 authorities implemented)

**SURVIVING AUTHORITIES:** Identity, Replay, Verification, Witness, Lineage, Capability, Time, Knowledge, Observation, Execution

**BROKEN AUTHORITIES:** None (all constitutional authorities implemented)

**REMAINING SHADOW AUTHORITIES:** gateway/event_emitter.js, crypto.createHash

---

### Migration Collapse Test Summary

| Stop Phase | Constitutional | Shadow Authorities Remaining |
| ---------- | --------------- | ---------------------------- |
| After Phase 1 | PARTIAL (1/10 authorities) | gateway/event_emitter.js, PostgreSQL NOW(), SQLite persistence, crypto.createHash |
| After Phase 2 | PARTIAL (2/10 authorities) | gateway/event_emitter.js, SQLite persistence, crypto.createHash |
| After Phase 3 | PARTIAL (3/10 authorities) | gateway/event_emitter.js, crypto.createHash |
| After Phase 4 | PARTIAL (4/10 authorities) | gateway/event_emitter.js, crypto.createHash |
| After Phase 5 | PARTIAL (5/10 authorities) | gateway/event_emitter.js, crypto.createHash |

---

### SECTION R8 — FIRST IMPLEMENTATION TARGET

Determine:

What single runtime file should be implemented first?

Requirements:

* highest constitutional leverage
* largest blocker removal
* smallest implementation surface
* unlocks most future phases

Output:

Target File
Reason
Unlocked Authorities
Unlocked Phases

---

### Target File

**runtime/replay/capability_authority.ts**

---

### Reason

**HIGHEST CONSTITUTIONAL LEVERAGE:** Capability Authority is foundational for all subsequent authorities. All mutation paths require capability enforcement. Without Capability Authority, no other authority can safely enforce capability boundaries.

**LARGEST BLOCKER REMOVAL:** Capability Authority removes the CRITICAL blocker identified in PHASE Q Closure Blocking Matrix. All 9 blockers depend on Capability Authority for capability enforcement.

**SMALLEST IMPLEMENTATION SURFACE:** Capability Authority is pure functional (no infrastructure dependencies). Implementation requires only capability check interface and capability grant/revoke interface. No state migration required.

**UNLOCKS MOST FUTURE PHASES:** Capability Authority unlocks Phase 2, Phase 3, Phase 4, and Phase 5. All subsequent phases depend on Capability Authority for capability enforcement.

---

### Unlocked Authorities

- Time Authority (requires READ_TIME capability)
- Knowledge Authority (requires READ_KNOWLEDGE, WRITE_KNOWLEDGE capabilities)
- Observation Authority (requires OBSERVE capability)
- Execution Authority (requires EXECUTE capability)

---

### Unlocked Phases

- Phase 2: Time Authority
- Phase 3: Knowledge Authority
- Phase 4: Observation Authority
- Phase 5: Execution Authority

---

### SECTION R9 — CONSTITUTIONAL EXECUTION READINESS SCORE

Recompute readiness using:

Implemented Authorities
÷
Required Authorities

Then compute projected score after:

Phase 1
Phase 2
Phase 3
Phase 4
Phase 5
Phase 6

Output:

| Phase | Readiness Score |

---

### Current Readiness Score

**IMPLEMENTED AUTHORITIES:** 5 (Identity, Replay, Verification, Witness, Lineage)

**REQUIRED AUTHORITIES:** 10 (Identity, Replay, Verification, Witness, Lineage, Knowledge, Observation, Execution, Time, Capability)

**CURRENT READINESS SCORE:** 5 / 10 = 50%

---

### Projected Readiness Scores

| Phase | Readiness Score | Calculation |
| ----- | --------------- | ----------- |
| Current | 50% | 5 / 10 |
| After Phase 1 | 60% | 6 / 10 (adds Capability) |
| After Phase 2 | 70% | 7 / 10 (adds Time) |
| After Phase 3 | 80% | 8 / 10 (adds Knowledge) |
| After Phase 4 | 90% | 9 / 10 (adds Observation) |
| After Phase 5 | 100% | 10 / 10 (adds Execution) |
| After Phase 6 | 100% | 10 / 10 (shadow removal, no new authorities) |

---

### FINAL VERDICT

Answer:

1. Is the migration graph executable?
2. What authority is the true bottleneck?
3. What migration phase carries the highest constitutional risk?
4. What runtime file should be implemented first?
5. What is the shortest path to 100% constitutional closure?

ONLY USE INFORMATION ALREADY PRESENT IN:

PING_AUTHORITY_OWNERSHIP_MAP.md

---

### 1. Is the migration graph executable?

**ANSWER:** YES

**EVIDENCE:**
- Dependency graph is acyclic (no circular dependencies)
- All dependencies are required (no optional edges)
- All migrations are executable given the dependency order
- Replay preservation proof shows all migrations are SAFE
- No impossible migrations identified in SECTION R2

---

### 2. What authority is the true bottleneck?

**ANSWER:** Capability Authority

**EVIDENCE:**
- Capability Authority is foundational for all subsequent authorities
- All 9 blockers in PHASE Q Closure Blocking Matrix depend on Capability Authority
- Capability Authority unlocks 4 out of 5 subsequent phases (Phase 2, Phase 3, Phase 4, Phase 5)
- Without Capability Authority, no other authority can safely enforce capability boundaries
- SECTION R8 identifies Capability Authority as the first implementation target

---

### 3. What migration phase carries the highest constitutional risk?

**ANSWER:** Phase 6: Shadow Removal

**EVIDENCE:**
- PHASE Q identifies Phase 6 as the highest-risk migration
- gateway/event_emitter.js is critical path for event emission
- Direct PostgreSQL writes must be eliminated
- Event emission must migrate to Replay Authority
- HIGH risk (critical path, extensive changes required)
- SECTION R7 shows Phase 6 is the only phase that eliminates all shadow authorities

---

### 4. What runtime file should be implemented first?

**ANSWER:** runtime/replay/capability_authority.ts

**EVIDENCE:**
- SECTION R8 identifies capability_authority.ts as the first implementation target
- Highest constitutional leverage (foundational for all subsequent authorities)
- Largest blocker removal (removes CRITICAL blocker)
- Smallest implementation surface (pure functional, no infrastructure dependencies)
- Unlocks most future phases (unlocks Phase 2, Phase 3, Phase 4, Phase 5)

---

### 5. What is the shortest path to 100% constitutional closure?

**ANSWER:** 6-phase sequential migration (no parallelization)

**PHASE 1:** Capability Authority (runtime/replay/capability_authority.ts)
**PHASE 2:** Time Authority (runtime/replay/time_authority.ts)
**PHASE 3:** Knowledge Authority (runtime/replay/knowledge_authority.ts)
**PHASE 4:** Observation Authority (runtime/replay/observation_authority.ts)
**PHASE 5:** Execution Authority (runtime/replay/execution_authority.ts)
**PHASE 6:** Shadow Removal (eliminate gateway/event_emitter.js, PostgreSQL NOW(), SQLite persistence, crypto.createHash)

**EVIDENCE:**
- SECTION R2 identifies topological execution order
- SECTION R7 shows constitutional readiness progression from 50% to 100%
- SECTION R9 shows projected readiness scores after each phase
- Parallel execution opportunities exist (Phase 2, Phase 3, Phase 4 can execute in parallel), but sequential execution is safer for constitutional closure
- SECTION R3 shows all phases are replay-safe
- SECTION R4 shows witness regeneration required for Phase 2-6, but no compatibility breaks

**SHORTEST PATH (WITH PARALLELIZATION):**
- Phase 1: Capability Authority (sequential)
- Phase 2, Phase 3, Phase 4: Parallel (all depend only on Phase 1)
- Phase 5: Sequential (depends on Phase 2 and Phase 3)
- Phase 6: Sequential (depends on Phase 5)

**TOTAL PHASES:** 6 (4 sequential phases + 1 parallel phase group)
