# Replay Gap Report

**Audit Date:** 2026-06-25
**Audit Type:** PHASE F.1 — Replay Gap Analysis
**Objective:** For every constitutional artifact, determine whether it is replayable — can be deterministically reconstructed from the event stream.

---

# Replay Requirements per Constitution

## REPLAY_LAW.md Requirements

| Requirement | Current State | Gap |
|------------|--------------|-----|
| Deterministic: same event stream → same state | Events are append-only and timestamp-ordered | No replay engine exists to verify determinism |
| Exact reconstruction: must produce byte-identical projections | No replay function exists for any artifact type | No replay engine at all |
| Minimum replay set: events, lineage edges, identity assignments, policy decisions, actor identities, claim records | Events exist (1,044). Lineage edges partially exist. Identity assignments exist. Policy decisions: MISSING. Actor identities: PARTIAL. Claim records: PARTIAL (empty table). | 3 of 6 minimum replay set items missing or incomplete |
| Replay must produce witness root | No witness infrastructure exists | Cannot verify replay correctness |
| Partial-replay: replay subset of events | No replay engine supports this | Cannot replay specific artifact types independently |
| Replay failure: convert to REPLAY_ERROR events | No REPLAY_ERROR events ever created | Failure path untested |
| Replay must be pure: no LLM calls, no API calls | All workers potentially called during replay | Cannot guarantee LLM-free replay |

## WITNESS_LAW.md Requirements

| Requirement | Current State | Gap |
|------------|--------------|-----|
| Step 1: Event stream input | Events table (1,044 rows) | ✅ Events available |
| Step 2: Canonicalize to RFC-8785 JCS | No canonicalization function exists | ❌ Cannot canonicalize |
| Step 3: Compute SHA-256 fingerprint | SHA-256 available in Python stdlib | ✅ Algorithm available |
| Step 4: Verify lineage integrity | Lineage table exists. authority_lineage missing. | ⚠️ Lineage verification incomplete |
| Step 5: Replay state | No state reconstruction function | ❌ Cannot replay to state |
| Step 6: Compute witness root via Merkle tree | No Merkle tree implementation | ❌ Cannot compute witness root |
| Step 7: Include constitutional law commitment | No law manifest exists | ❌ Cannot commit to law version |

---

# Per-Artifact Replay Status

## constitutional_event

| Replay Aspect | Status |
|---------------|--------|
| Can be replayed? | ✅ YES — events are append-only, timestamp-ordered, CQRS schema |
| Replay produces? | Event stream replay |
| Replay determinism? | ✅ Events are immutable — replay is deterministic within the same stream |
| Replay function exists? | ❌ NO — no replay worker or function exists |
| Integrated into pipeline? | ❌ NO — event_chain.py creates hash chain but is not called by any pipeline |
| **Score** | **2/5** |

## lineage

| Replay Aspect | Status |
|---------------|--------|
| Can be replayed? | ✅ YES — lineage table records object version lineage (root_object_id, current_version) |
| Replay produces? | Object ancestry DAG |
| Replay determinism? | ✅ Version tracking is mechanical |
| Replay function exists? | ❌ NO — no lineage-specific replay |
| Integrated into pipeline? | ❌ NO |
| **Score** | **2/5** |

## projection

| Replay Aspect | Status |
|---------------|--------|
| Can be replayed? | ✅ YES — projections are disposable (CONSTITUTION.md Layer 4). Rebuild from events. |
| Replay produces? | Qdrant vectors from event_data content |
| Replay determinism? | ⚠️ Embedding model must be deterministic. nomic-embed-text is deterministic for same input. |
| Replay function exists? | ⚠️ PARTIAL — qdrant_projection_worker.py replays events to Qdrant. But not all event types are projected. |
| Integrated into pipeline? | ✅ YES — projection worker runs periodically |
| **Score** | **4/5** |

## document

| Replay Aspect | Status |
|---------------|--------|
| Can be replayed? | ✅ YES — DOCUMENT_IMPORTED events contain document content in event_data |
| Replay produces? | Document content from event stream |
| Replay determinism? | ✅ Documents are immutable once imported |
| Replay function exists? | ❌ NO — no document-specific replay |
| Integrated into pipeline? | ❌ NO |
| **Score** | **2/5** |

## object

| Replay Aspect | Status |
|---------------|--------|
| Can be replayed? | ✅ YES — objects table records content_hash, version, lineage_id |
| Replay produces? | Immutable content with version history |
| Replay determinism? | ✅ Content-addressed — same content_hash = same object |
| Replay function exists? | ❌ NO |
| Integrated into pipeline? | ❌ NO |
| **Score** | **2/5** |

## authority_object

| Replay Aspect | Status |
|---------------|--------|
| Can be replayed? | ❌ NO — authority_objects table doesn't exist. Authority is in-memory only. |
| Replay produces? | N/A |
| Replay determinism? | N/A |
| Replay function exists? | ❌ NO |
| Integrated into pipeline? | ❌ NO |
| **Score** | **0/5** |

## claim

| Replay Aspect | Status |
|---------------|--------|
| Can be replayed? | ⚠️ PARTIAL — claims table exists but is empty. CLAIM_CREATED events use old schema (silently fail). |
| Replay produces? | Claim text with confidence |
| Replay determinism? | N/A — no data to replay |
| Replay function exists? | ❌ NO |
| Integrated into pipeline? | ❌ NO |
| **Score** | **0/5** |

## observation

| Replay Aspect | Status |
|---------------|--------|
| Can be replayed? | ⚠️ PARTIAL — stored as OBSERVATION_CREATED events. Events exist. |
| Replay produces? | Observation text |
| Replay determinism? | ✅ Deterministic from event stream |
| Replay function exists? | ❌ NO |
| Integrated into pipeline? | ❌ NO |
| **Score** | **1/5** |

## evidence

| Replay Aspect | Status |
|---------------|--------|
| Can be replayed? | ❌ NO — evidence is ephemeral (in-memory only during reasoning query) |
| Replay produces? | N/A |
| Replay determinism? | N/A |
| Replay function exists? | ❌ NO |
| Integrated into pipeline? | ❌ NO |
| **Score** | **0/5** |

## witness

| Replay Aspect | Status |
|---------------|--------|
| Can be replayed? | ❌ NO — no witness infrastructure at all |
| Replay produces? | N/A |
| Replay determinism? | N/A |
| Replay function exists? | ❌ NO |
| Integrated into pipeline? | ❌ NO |
| **Score** | **0/5** |

## supersession

| Replay Aspect | Status |
|---------------|--------|
| Can be replayed? | ❌ NO — no supersession infrastructure |
| Replay produces? | N/A |
| Replay determinism? | N/A |
| Replay function exists? | ❌ NO |
| Integrated into pipeline? | ❌ NO |
| **Score** | **0/5** |

## capability

| Replay Aspect | Status |
|---------------|--------|
| Can be replayed? | ❌ NO — capabilities are hardcoded Python enums, not persisted |
| Replay produces? | N/A |
| Replay determinism? | N/A |
| Replay function exists? | ❌ NO |
| Integrated into pipeline? | ❌ NO |
| **Score** | **0/5** |

## policy_decision

| Replay Aspect | Status |
|---------------|--------|
| Can be replayed? | ❌ NO — policy decisions do not exist |
| Replay produces? | N/A |
| Replay determinism? | N/A |
| Replay function exists? | ❌ NO |
| Integrated into pipeline? | ❌ NO |
| **Score** | **0/5** |

## attestation

| Replay Aspect | Status |
|---------------|--------|
| Can be replayed? | ❌ NO |
| Replay produces? | N/A |
| Replay determinism? | N/A |
| Replay function exists? | ❌ NO |
| Integrated into pipeline? | ❌ NO |
| **Score** | **0/5** |

---

# Replay Score Summary

| Artifact | Replayable? | Function Exists? | Score |
|----------|------------|-----------------|-------|
| projection | ✅ YES | ⚠️ PARTIAL (qdrant_projection_worker) | 4/5 |
| constitutional_event | ✅ YES | ❌ NO | 2/5 |
| lineage | ✅ YES | ❌ NO | 2/5 |
| document | ✅ YES | ❌ NO | 2/5 |
| object | ✅ YES | ❌ NO | 2/5 |
| observation | ⚠️ PARTIAL | ❌ NO | 1/5 |
| claim | ❌ NO | ❌ NO | 0/5 |
| authority_object | ❌ NO | ❌ NO | 0/5 |
| evidence | ❌ NO | ❌ NO | 0/5 |
| witness | ❌ NO | ❌ NO | 0/5 |
| supersession | ❌ NO | ❌ NO | 0/5 |
| capability | ❌ NO | ❌ NO | 0/5 |
| policy_decision | ❌ NO | ❌ NO | 0/5 |
| attestation | ❌ NO | ❌ NO | 0/5 |

---

# Minimum Replay Set Gap

REPLAY_LAW.md defines the minimum replay set as:

| Element | Status |
|---------|--------|
| Event stream | ✅ EXISTS (1,044 events) |
| Lineage edges | ⚠️ PARTIAL (lineage table exists, authority_lineage missing) |
| Identity assignments | ⚠️ PARTIAL (objects table has IDs, no actor identity registry) |
| Policy decisions | ❌ MISSING |
| Actor identities | ❌ MISSING (no actor_id in event causation chain) |
| Claim records and dispositions | ❌ MISSING (claims table empty, no claim → event link) |

**Minimum replay set completeness: 2/6 elements fully present.**

---

# Critical Replay Gaps

1. **No replay engine exists.** No function reads events and reconstructs state. The closest is qdrant_projection_worker.py which rebuilds Qdrant projections — but this is projection-specific, not a general replay engine.

2. **event_chain.py is unused.** The hash chain implementation exists (CryptographicEvent, event_chain table) but no worker integrates with it. The chain is append-only but nothing appends to it.

3. **No witness root produced.** WITNESS_LAW.md requires witness root as replay output. No Merkle tree implementation exists. No canonicalization function exists (RFC-8785 JCS).

4. **3 of 6 minimum replay set elements missing.** Policy decisions, actor identities, and claim records/dispositions do not exist in any form that could be replayed.

5. **Partial-replay not supported.** Cannot replay a subset of artifacts (e.g., "replay only claims") — all artifact types are interleaved in the events table with no type-specific replay path.

6. **Replay purity cannot be guaranteed.** Workers use LLM calls during processing. A replay engine that invokes workers would introduce non-determinism from model temperature. The constitutional requirement (REPLAY_LAW.md Formal Invariants: "pure functions, no side effects") cannot be met with current worker architecture.

---

**Report Status:** COMPLETED
