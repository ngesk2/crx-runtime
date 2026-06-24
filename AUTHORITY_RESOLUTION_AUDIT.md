AUTHORITY RESOLUTION AUDIT
==========================

Purpose
-------
Assess whether the system can resolve authority for a given question — not about retrieval quality or embeddings, but about where authority is rooted and how it can be verified, superseded, and traced.

Scope & constraints
-------------------
- Read-only analysis only: no runtime changes.
- Minimal mutation: collect evidence and produce verifiable artifacts (reports, queries, examples).
- Use existing artifacts (Drive, Postgres, Qdrant, Mission Control endpoints) where available.

Key audit questions
-------------------
1. Where does authority live for a given artifact/document?
2. How is authority verified (what canonical identifiers / hashes / signatures exist)?
3. Can authority supersede prior authority (versioning, replacement rules)?
4. Can authority lineage be reconstructed end-to-end (artifact → event → projection)?
5. Can the governing authority for an answer be determined and presented (and with what confidence)?

Evidence items to collect
-------------------------
- Drive: file paths, modification timestamps, hashes (where available), and canonical folder mapping (target canonical folders list).
- Postgres: event records for document imports and observations, payload_hash values, projected_to_qdrant flags, projected_at timestamps.
- Qdrant: projection payloads containing `event_id`, `payload_hash`, `projection_hash` and timestamps.
- Mission Control: retrieval endpoints and any audit metadata returned (e.g., `projected` flags, source attribution).
- Replay: deterministic replay outputs and witness roots for sampled artifacts/events.

Verification procedure
----------------------
1. Select sample of artifacts from canonical Drive folders.
2. For each artifact, find corresponding `DOCUMENT_IMPORTED` or `DOCUMENT_OBSERVED` events in Postgres.
3. For each matched event, locate matching Qdrant projection point(s) and compare `payload_hash`.
4. Use the deterministic replay engine to reconstruct lineage and verify that witness roots align with event payloads.
5. Record cases where:
   - projection matches event payload (verified)
   - projection exists but payload mismatch (mismatch)
   - projection references missing event (orphan)
   - event exists but no projection (unprojected)

Success criteria
----------------
- For sampled artifacts, authority lineage can be reconstructed: Artifact → Event → Verified Projection.
- The system can present, for a given candidate answer, the Highest Governing Authority and the chain of superseding authority (if present).

Deliverables
------------
- `AUTHORITY_RESOLUTION_AUDIT.md` (this file)
- CSV report of sampled artifact → event → projection verification results
- Short findings summary with gaps and recommended minimal mitigations

Next actions (pick one)
-----------------------
- I can run the Projection Sovereignty audit script now (requires installing `qdrant-client` and `psycopg2-binary`).
- I can produce the Drive canonicalization checklist and a minimal ingestion test harness to validate Drive→Event mapping.
- I can collect a small sample (n=20) of artifacts and produce the CSV verification report (needs Qdrant/Postgres access).

Tell me which action to take next.