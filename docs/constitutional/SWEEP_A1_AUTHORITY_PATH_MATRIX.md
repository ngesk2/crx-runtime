# SWEEP A1 — AUTHORITY PATH AUDIT

**Audit Date:** 2026-06-18  
**Audit Mode:** ZERO ASSUMPTION — READ ONLY — RUNTIME REALITY ONLY  
**Audit Principle:** Determine whether applications delegate authority to PING before mutating state.

---

## EXECUTIVE SUMMARY

**PRIMARY OBJECTIVE:** Determine who creates events, who generates IDs, who canonicalizes payloads, who stores lineage.

**FINAL DETERMINATION:** Applications do NOT delegate authority to PING. Applications create events independently, generate IDs independently, do NOT canonicalize payloads, do NOT store lineage.

**KEY FINDINGS:**
- CRX Newsletter Brain uses brain/src/constitutional (NOT PING Runtime) for event emission
- CRX Digestion Worker uses brain/src/constitutional (NOT PING Runtime) for event emission
- PING Gateway uses gateway/event_emitter.js (NOT PING Runtime) for event emission
- CRX Newsletter Brain uses external identity (message_id from Yahoo Mail)
- CRX Digestion Worker uses external identity (url from RSS feed)
- PING Gateway uses independent hash generation (crypto.createHash from Node.js)
- No application uses PING's CanonicalJson for canonicalization
- No application uses PING's CanonicalHashAuthority for hashing
- No application uses PING's LineageAuthority for lineage tracking
- No application delegates to PING for any constitutional authority

---

## AUTHORITY PATH MATRIX

| System | Event Authority | Identity Authority | Canonical Authority | Lineage Authority | Delegated to PING |
| ------ | --------------- | ------------------ | ------------------- | ----------------- | ----------------- |
| CRX Newsletter Brain | brain/src/constitutional (NOT PING) | External (message_id from Yahoo Mail) | None (no canonicalization) | None (no lineage) | NO |
| CRX Digestion Worker | brain/src/constitutional (NOT PING) | External (url from RSS feed) | None (no canonicalization) | None (no lineage) | NO |
| PING Gateway | gateway/event_emitter.js (NOT PING) | Independent (crypto.createHash from Node.js) | None (JSON.stringify, not canonical) | None (no lineage) | NO |
| PING Runtime | PING Event Authority | PING Identity Authority (artifact_id) | PING Canonical Authority (CanonicalJson) | PING Lineage Authority (LineageAuthority) | YES (self) |

---

## DETAILED EVIDENCE

### CRX Newsletter Brain

#### Event Authority

**Who creates events?** brain/src/constitutional (NOT PING Runtime)

**Evidence:**
- File: database.py line 7
- Import: `from src.constitutional import emit_newsletter_created, emit_digest_generated`
- File: database.py line 107
- Call: `emit_newsletter_created(newsletter)`
- File: database.py line 271
- Call: `emit_digest_generated({...})`

**Call Stack:**
```
database.py:save_raw_newsletter()
  ↓
emit_newsletter_created(newsletter)  [brain/src/constitutional]
  ↓
PostgreSQL INSERT (events table)
```

**Authority Owner:** brain/src/constitutional (NOT PING Runtime)

#### Identity Authority

**Who generates IDs?** External (message_id from Yahoo Mail)

**Evidence:**
- File: worker.py line 45
- Source: `newsletter['message_id']` (from Yahoo Mail API)
- File: database.py line 97
- Usage: `newsletter['message_id']` (external identity)
- No canonical hash generation
- No PING Identity Authority

**Call Stack:**
```
worker.py:run_ingestion_cycle()
  ↓
Yahoo Mail API returns message_id
  ↓
database.py:save_raw_newsletter(newsletter)
  ↓
SQLite INSERT (message_id from external source)
```

**Authority Owner:** Yahoo Mail API (NOT PING Runtime)

#### Canonical Authority

**Who canonicalizes payloads?** None (no canonicalization)

**Evidence:**
- File: database.py line 93-103
- Direct SQLite INSERT without canonicalization
- No CanonicalJson usage
- No deterministic ordering
- No RFC-8785 compliance

**Call Stack:**
```
database.py:save_raw_newsletter(newsletter)
  ↓
cursor.execute("INSERT INTO newsletters ...")
  ↓
SQLite INSERT (raw newsletter, not canonical)
```

**Authority Owner:** None (no canonicalization)

#### Lineage Authority

**Who stores lineage?** None (no lineage)

**Evidence:**
- File: database.py line 93-103
- SQLite INSERT without lineage
- No parent tracking
- No DAG structure
- No ancestry tracking

**Call Stack:**
```
database.py:save_raw_newsletter(newsletter)
  ↓
cursor.execute("INSERT INTO newsletters ...")
  ↓
SQLite INSERT (no lineage)
```

**Authority Owner:** None (no lineage)

---

### CRX Digestion Worker

#### Event Authority

**Who creates events?** brain/src/constitutional (NOT PING Runtime)

**Evidence:**
- File: database.py line 7
- Import: `from src.constitutional import emit_article_created`
- File: database.py line 78
- Call: `emit_article_created(article)`

**Call Stack:**
```
database.py:save_article()
  ↓
emit_article_created(article)  [brain/src/constitutional]
  ↓
PostgreSQL INSERT (events table)
```

**Authority Owner:** brain/src/constitutional (NOT PING Runtime)

#### Identity Authority

**Who generates IDs?** External (url from RSS feed)

**Evidence:**
- File: worker.py line 46
- Source: `article['url']` (from RSS feed)
- File: database.py line 67
- Usage: `article['url']` (external identity)
- No canonical hash generation
- No PING Identity Authority

**Call Stack:**
```
worker.py:process_source()
  ↓
RSS feed returns url
  ↓
database.py:save_article(article)
  ↓
SQLite INSERT (url from external source)
```

**Authority Owner:** RSS feed (NOT PING Runtime)

#### Canonical Authority

**Who canonicalizes payloads?** None (no canonicalization)

**Evidence:**
- File: database.py line 63-74
- Direct SQLite INSERT without canonicalization
- No CanonicalJson usage
- No deterministic ordering
- No RFC-8785 compliance

**Call Stack:**
```
database.py:save_article(article)
  ↓
cursor.execute("INSERT INTO articles ...")
  ↓
SQLite INSERT (raw article, not canonical)
```

**Authority Owner:** None (no canonicalization)

#### Lineage Authority

**Who stores lineage?** None (no lineage)

**Evidence:**
- File: database.py line 63-74
- SQLite INSERT without lineage
- No parent tracking
- No DAG structure
- No ancestry tracking

**Call Stack:**
```
database.py:save_article(article)
  ↓
cursor.execute("INSERT INTO articles ...")
  ↓
SQLite INSERT (no lineage)
```

**Authority Owner:** None (no lineage)

---

### PING Gateway

#### Event Authority

**Who creates events?** gateway/event_emitter.js (NOT PING Runtime)

**Evidence:**
- File: server.js line 3
- Import: `const { emitInferenceRequest, emitInferenceResponse, emitInferenceFailed } = require('./event_emitter')`
- File: server.js line 140
- Call: `emitInferenceRequest(model, messages)`
- File: server.js line 173
- Call: `emitInferenceResponse(model, content, 0)`
- File: server.js line 190
- Call: `emitInferenceFailed(model, error.message, 'ollama')`

**Call Stack:**
```
server.js:invokeOllama()
  ↓
emitInferenceRequest(model, messages)  [gateway/event_emitter.js]
  ↓
PostgreSQL INSERT (events table)
```

**Authority Owner:** gateway/event_emitter.js (NOT PING Runtime)

#### Identity Authority

**Who generates IDs?** Independent (crypto.createHash from Node.js)

**Evidence:**
- File: event_emitter.js line 37-39
- Function: `hashString(str)` using `crypto.createHash('sha256')`
- File: event_emitter.js line 111
- Call: `requestHash = hashString(messagesString)`
- File: event_emitter.js line 132
- Call: `responseHash = hashString(response)`
- No PING CanonicalHashAuthority
- No PING Identity Authority

**Call Stack:**
```
event_emitter.js:emitInferenceRequest()
  ↓
hashString(messagesString)  [crypto.createHash('sha256') from Node.js]
  ↓
SHA-256 hash generation (independent)
```

**Authority Owner:** Node.js crypto (NOT PING Runtime)

#### Canonical Authority

**Who canonicalizes payloads?** None (JSON.stringify, not canonical)

**Evidence:**
- File: event_emitter.js line 88
- Call: `JSON.stringify(payload)`
- File: event_emitter.js line 110
- Call: `JSON.stringify(messages)`
- File: server.js line 151
- Call: `JSON.stringify(payload)`
- No CanonicalJson usage
- No deterministic ordering
- No RFC-8785 compliance

**Call Stack:**
```
event_emitter.js:emitEvent()
  ↓
JSON.stringify(payload)  [standard JSON, not canonical]
  ↓
PostgreSQL INSERT (non-canonical payload)
```

**Authority Owner:** None (JSON.stringify is not canonical)

#### Lineage Authority

**Who stores lineage?** None (no lineage)

**Evidence:**
- File: event_emitter.js line 80-90
- PostgreSQL INSERT without lineage
- No parent tracking
- No DAG structure
- No ancestry tracking

**Call Stack:**
```
event_emitter.js:emitEvent()
  ↓
pool.query("INSERT INTO events ...")
  ↓
PostgreSQL INSERT (no lineage)
```

**Authority Owner:** None (no lineage)

---

### PING Runtime

#### Event Authority

**Who creates events?** PING Event Authority

**Evidence:**
- File: canonical_event_envelope.ts
- Class: `CanonicalEventEnvelope`
- Constitutional rule: event_id, event_type, actor_id, timestamp, lineage, schema_version, replay_version, policy_version
- File: replay_state_machine.ts
- Method: `applyEvent(event: CanonicalEventEnvelope)`
- Constitutional rule: event-first architecture

**Call Stack:**
```
ReplayStateMachine:applyEvent()
  ↓
CanonicalEventEnvelope validation
  ↓
Event Authority (PING Runtime)
```

**Authority Owner:** PING Runtime (self)

#### Identity Authority

**Who generates IDs?** PING Identity Authority (artifact_id)

**Evidence:**
- File: canonical_hash_authority.ts
- Class: `CanonicalHashAuthority`
- Method: `computeFingerprint(canonicalBytes: CanonicalBytes): Fingerprint`
- Constitutional rule: SHA-256 cryptographic hashing
- File: replay_types.ts
- Type: `ArtifactId` (branded type)
- Constitutional rule: artifact IDs are branded

**Call Stack:**
```
CanonicalHashAuthority:computeFingerprint()
  ↓
CertificateAuthority['sha256'](string)
  ↓
Identity Authority (PING Runtime)
```

**Authority Owner:** PING Runtime (self)

#### Canonical Authority

**Who canonicalizes payloads?** PING Canonical Authority (CanonicalJson)

**Evidence:**
- File: canonical_json.ts
- Class: `CanonicalJson`
- Method: `canonicalize(value: unknown): string`
- Constitutional rule: RFC-8785 JSON Canonicalization Scheme (JCS)
- Constitutional rule: lexicographic property ordering
- Constitutional rule: deterministic numeric rendering
- Constitutional rule: UTF-8 normalization

**Call Stack:**
```
CanonicalJson:canonicalize()
  ↓
canonicalizeValue() with lexicographic sorting
  ↓
Canonical Authority (PING Runtime)
```

**Authority Owner:** PING Runtime (self)

#### Lineage Authority

**Who stores lineage?** PING Lineage Authority (LineageAuthority)

**Evidence:**
- File: replay_state_machine.ts
- Method: `handleArtifactCommit(event, state)`
- Constitutional rule: lineage validation
- Constitutional rule: namespace consistency (event IDs vs artifact IDs)
- Constitutional rule: parent validation
- File: replay_types.ts
- Type: `LineageGraph`
- Constitutional rule: lineage uses artifact IDs only

**Call Stack:**
```
ReplayStateMachine:handleArtifactCommit()
  ↓
validateLineage(parentIds, artifactId)
  ↓
Lineage Authority (PING Runtime)
```

**Authority Owner:** PING Runtime (self)

---

## CONCLUSION

**Authority Delegation Status:**

- CRX Newsletter Brain: NO (uses brain/src/constitutional, external identity, no canonicalization, no lineage)
- CRX Digestion Worker: NO (uses brain/src/constitutional, external identity, no canonicalization, no lineage)
- PING Gateway: NO (uses gateway/event_emitter.js, independent hash generation, no canonicalization, no lineage)
- PING Runtime: YES (self-delegated, uses PING Event Authority, PING Identity Authority, PING Canonical Authority, PING Lineage Authority)

**Final Determination:** Applications do NOT delegate authority to PING. Applications create events independently, generate IDs independently, do NOT canonicalize payloads, do NOT store lineage. PING Runtime is self-sovereign but applications do NOT delegate to PING.
