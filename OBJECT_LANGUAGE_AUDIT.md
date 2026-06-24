OBJECT LANGUAGE AUDIT
=====================

Purpose
-------
Document ontology separation: classify existing repo events into the canonical object language:
- DOCUMENT — artifacts that entered or were created in the system
- OBSERVATION — facts extracted from artifacts by agents or workers
- CLAIM — assertions, analyses, interpretations made by agents/humans
- EVIDENCE — representations derived from documents used to support claims (embeddings, projections, indexes)
- DECISION — explicit decisions or control actions (approvals, rejections, policy actions)

Scope
-----
This audit maps event names observed across the repository (drive ingestion, projection worker, constitutional search, filesystem workers, and related modules) to the above ontology. This is a classification-only change; no code is modified.

Mapping (event -> ontology category) with rationale
--------------------------------------------------
- DOCUMENT_IMPORTED / DocumentImported -> DOCUMENT
  - Rationale: file/artifact entered the system; canonical artifact creation.

- DOCUMENT_UPDATED -> DOCUMENT
  - Rationale: artifact mutation; remains an artifact.

- DOCUMENT_OBSERVED -> OBSERVATION (deprecated)
  - Rationale: current code conflates artifact entry and extracted facts. This should be split: keep only agent-extracted facts as OBSERVATION (see next two events).

- OBSERVATION_CREATED (recommended replacement for DOCUMENT_OBSERVED) -> OBSERVATION
  - Rationale: explicit agent extraction of facts from an artifact (who observed, when, and extracted content/metadata).

- DOCUMENT_IMPORTED (explicit import event) -> DOCUMENT
  - Rationale: artifact-level event indicating an object exists in storage/postgres.

- DOCUMENT_EMBEDDED / DocumentEmbedded -> EVIDENCE
  - Rationale: embedding or vector representation produced from a document; used as supporting evidence in search/retrieval.

- PROJECTION_CREATED / ProjectionCreated -> EVIDENCE
  - Rationale: projection (upsert into Qdrant) generates searchable evidence (indexed vectors) tied to an event_id.

- QDRANT_* (status/ops events) -> EVIDENCE (infrastructure-level)
  - Rationale: Qdrant collection/point events represent evidence indexing state; treat as evidence infra signals.

- NEWSLETTER_CREATED / ARTICLE_CREATED / *_CREATED (content generation) -> DOCUMENT
  - Rationale: these create new artifacts (documents) in the system.

- NEWSLETTER_UPDATED / ARTICLE_UPDATED -> DOCUMENT
  - Rationale: artifact update events.

- DOCUMENT_INDEXED -> EVIDENCE
  - Rationale: artifact was indexed / an evidence artifact was produced.

- OBSERVATION_ACCEPTED / OBSERVATION_REJECTED (if present) -> DECISION
  - Rationale: explicit acceptance/rejection of an observation is a decision/action.

- CLAIM_CREATED / ANALYSIS_* / SUMMARY_* -> CLAIM
  - Rationale: higher-level assertions, analyses, or summaries produced by agents/humans.

- BACKUP_OCCURRED / BACKUPS.* events -> DECISION (operational) or EVIDENCE (backup artifacts)
  - Rationale: backups are operational decisions producing durable artifacts; map depending on intended semantics.

Ambiguities / Notes
-------------------
- `DOCUMENT_OBSERVED` currently conflates two distinct facts. Recommended replacement pattern:
  - Emit `DOCUMENT_IMPORTED` when the artifact is first ingested and stored (artifact-level event).
  - Emit `OBSERVATION_CREATED` when an agent extracts structured facts, metadata, or observations from that artifact.

- Embeddings and projection-related events (embedding created, projection upserted) should be treated as `EVIDENCE` because they are derived representations used to support retrieval and claims.

- Some events in the repo are domain-specific (newsletter/article) and may be conceptually either DOCUMENT or CLAIM depending on whether the artifact is treated as immutable evidence or an authored assertion. Default to `DOCUMENT` for created content artifacts.

- There are infra/status events (e.g., Qdrant health, projection worker heartbeats). These should be kept separate from the object-language ontology, but when they reflect the creation of an index or persisted artifact, classify as `EVIDENCE`.

Next steps / Recommendations
----------------------------
- Replace uses of `DOCUMENT_OBSERVED` with the two explicit events (`DOCUMENT_IMPORTED` and `OBSERVATION_CREATED`) in all ingestion and worker emitters (no code changes here; recorded as a suggested plan).
- Update the event schemas and any downstream consumers (projection worker, constitutional_search) to accept the new event split.
- Add this audit to the repo root and use it as the canonical mapping when migrating event emitters.

Appendix: events scanned (non-exhaustive examples discovered during audit)
-------------------------------------------------------------------------
- DOCUMENT_OBSERVED, DOCUMENT_IMPORTED, DOCUMENT_UPDATED, DOCUMENT_EMBEDDED
- ProjectionCreated, PROJECTION_CREATED, DOCUMENT_INDEXED
- NEWSLETTER_CREATED, ARTICLE_CREATED, NEWSLETTER_UPDATED
- BACKUP_OCCURRED, google_drive_observations (DB table)

If you want, I can now (a) produce a one-time PR-ready patch that renames emitter usages in code to the split events (emitter only—no behavioral change), or (b) generate a checklist for incremental migration across services.

Constitutional Doctrine & Immediate Actions
-------------------------------------------

Immediate freezes (as proposed):

Authority Layers

Drive  = Artifact Authority
Postgres  = Event Authority
Qdrant  = Projection Authority (disposable projection cache)
Inference (Ollama/vLLM)  = Reasoning Authority (disposable)
Mission Control  = Resolution Layer
MCP  = Transport Layer

Key constitutional statements (to record here):
- Truth survives deletion of Qdrant.
- Truth survives replacement of Ollama.
- Truth survives replacement of Open WebUI.
- Truth survives replacement of Mission Control.
- Truth does NOT survive loss of Drive + Postgres.

Projection Sovereignty — critical bug and required verification
-------------------------------------------------------------

Problem: current retrieval verifies only that `event_id` exists in Postgres. That proves "Event exists" but does NOT prove "Projection ← Event" (i.e., the Qdrant point actually corresponds to the persisted event payload).

Requirement (constitutional hardening): retrieval must verify the projection lineage and integrity using hashes.

Recommended minimal verification rules:
- Every projection (Qdrant point) MUST include: `event_id` and `projection_hash` and `payload_hash` in its payload.
- `payload_hash` is the canonical hash of the event payload as stored in Postgres (e.g., sha256(canonical_json(payload))).
- `projection_hash` is the hash of the projection artifact (e.g., sha256(canonical_json(point.payload))).

On retrieval, verify in this order:
1. Retrieve `event_id` from Qdrant point payload.
2. Fetch event from Postgres and obtain its `payload_hash`.
3. Compare Postgres `payload_hash` == Qdrant point `payload_hash`.
  - If mismatch, the projection is stale/mismatched — do not return as authoritative.
4. Optionally verify `projection_hash` to detect tampering of the projection artifact itself.

This enforces: Projection Hash ↓ Event Hash ↓ Source Event, not merely "event exists".

14B/7B Worker Hierarchy (operational guidance)
----------------------------------------------

Suggested conservative workflow for language-model-assisted extraction (no authority granted):

- 14B role: foreman / coordinator for complex extraction planning (generate tasks, prioritize sections, supervise quality).
- 7B role: laborer / extractor (shallow, focused extraction tasks that produce `OBSERVATION_CREATED` events).

Example flow:

Drive Document  → 14B Reader (plan/extract tasks) → Observation Queue → 7B Workers (extract) → `OBSERVATION_CREATED` → Postgres

Rules:
- Models produce observations only; they do not confer authority.
- Human or deterministic verification steps must exist before an `OBSERVATION_CREATED` event is accepted as authoritative (unless policy permits model-only acceptance for low-risk claims).

Object-language freeze
-----------------------

Freeze these ontology primitives now (canonical):

- DOCUMENT
- OBSERVATION
- CLAIM
- EVIDENCE
- DECISION

Do NOT freeze workflow states/derived concepts yet (e.g., CHALLENGE, RESOLUTION, SYNTHESIS).

Constitutional doctrine (engraved)
----------------------------------

- Artifacts are authoritative in Drive.
- Events are authoritative in Postgres.
- Projections are disposable.
- Embeddings are disposable.
- Models are disposable.
- Authority must never be inferred; authority must be resolved.

Next steps and options
----------------------

- I can create a small PR that updates projection payload shape (emit `payload_hash` and `projection_hash` and include `event_id`) and only touch emitter sites (no behavior changes). This implements projection sovereignty at the projection worker level.
- Alternatively, I can produce a migration checklist and PR plan for replacing `DOCUMENT_OBSERVED` emits with `DOCUMENT_IMPORTED` + `OBSERVATION_CREATED` across ingestion paths.

Tell me which action you prefer and I'll proceed (PR patch or migration checklist).