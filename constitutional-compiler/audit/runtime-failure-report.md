# Constitutional Runtime Failure Report

**Date:** June 28, 2026
**Objective:** Identify first missing runtime link in constitutional knowledge pipeline

---

## Container Verification

**Running Containers:**
- ✅ crx-gateway (Up 19 minutes, port 8080)
- ✅ brain-ollama (Up About an hour, port 11434)
- ✅ brain-postgres (Up 2 hours, port 5432)
- ⚠️ crx-ui-next (Up 2 hours, unhealthy, port 3000)
- ✅ brain-qdrant (Up 2 hours, ports 6333-6334)
- ✅ open-webui (Up 2 hours, healthy, port 3001)
- ❌ vault (not running)
- ❌ ping-mission-control (not running)

**Status:** 6/8 containers running, 2 missing

---

## Gateway API Endpoint Verification

**Existing Endpoints:**
- ✅ /health
- ✅ /api/v1/chat
- ✅ /api/v1/models
- ✅ /events (GET)
- ✅ /events/recent
- ✅ /events/stats
- ✅ /events/:stream
- ✅ /api/v1/events (POST)
- ✅ /api/v1/repository/objects (POST, GET, DELETE)
- ✅ /api/v1/autocomplete
- ✅ /system/state
- ✅ /api/v1/authority/health
- ✅ /api/v1/decision/weights
- ✅ /api/v1/mixer
- ✅ /api/v1/knowledge-graph
- ✅ /api/v1/system/nightshift
- ✅ /api/v1/github/summary
- ✅ /api/v1/github/commits
- ✅ /api/v1/github/pulls
- ✅ /api/v1/github/branches
- ✅ /api/v1/github/contributors
- ✅ /api/v1/github/languages
- ✅ /api/v1/mcp/providers
- ✅ /api/v1/missions
- ✅ /api/v1/missions/generate
- ✅ /api/v1/replay/verify

**Missing Endpoint:**
- ❌ /api/lifecycle (required by ConstitutionalLifecycle component)

---

## Pipeline Integration Analysis

### GitHub Ingestion

**Current Implementation:**
- `gateway/github_ingestion.js` - emits events (REPOSITORY_DISCOVERED, COMMIT_CREATED, FILE_INDEXED, FILE_DISCOVERED)
- `gateway/github_snapshot.js` - updated to build ConstitutionalObjects (Repository, Commit, Branch, Tag, Release, Issue, PullRequest, Contributor)

**Gap:** No API endpoint triggers GitHub snapshot ingestion using ConstitutionalObject approach. The new `buildConstitutionalObjects()` method exists but is not wired to any endpoint.

### EmbeddingAuthority

**Current Implementation:**
- `gateway/embedding_authority.js` - updated to remove deterministic fallback
- Requires Ollama with nomic-embed-text
- Returns structured embedding with vector, model, version, timestamp, dimension

**Gap:** No endpoint to trigger embedding generation for KnowledgeObjects.

### InferenceAuthority

**Current Implementation:**
- `gateway/inference_adapter.js` - updated with `analyze()` method
- Consumes KnowledgeObjects, produces AnalysisObjects
- Validates inputs are KnowledgeObjects (id, kind, payload)

**Gap:** No endpoint to trigger analysis of KnowledgeObjects.

### Reflection Generator

**Current Implementation:**
- `gateway/reflection_generator.js` - generates ReflectionObjects from KnowledgeObjects and AnalysisObjects
- Includes understanding, confidence, rationale, evidence_references, analysis_references

**Gap:** Not integrated into server.js. No endpoint to trigger reflection generation.

### Mission Generator

**Current Implementation:**
- `gateway/mission_generator.js` - generates MissionObjects from ReflectionObjects
- Includes priority, confidence, rationale, replay_safety, witness_requirements

**Gap:** Not integrated into server.js. No endpoint to trigger mission generation.

### Replay Recorder

**Current Implementation:**
- `gateway/replay_recorder.js` - records ReplayObjects for completed lifecycles
- Reconstructs lifecycle stages

**Gap:** Not integrated into server.js. No endpoint to trigger replay recording.

### Witness Recorder

**Current Implementation:**
- `gateway/witness_recorder.js` - records WitnessObjects for completed lifecycles
- Certifies replay with cryptographic verification

**Gap:** Not integrated into server.js. No endpoint to trigger witness recording.

---

## First Missing Runtime Link

**Critical Gap:** No end-to-end pipeline orchestration endpoint

The components exist (ConstitutionalObject, EmbeddingAuthority, InferenceAuthority.analyze(), ReflectionGenerator, MissionGenerator, ReplayRecorder, WitnessRecorder) but are not wired together in server.js.

**Current State:**
- Individual components are implemented
- No API endpoint triggers the full constitutional lifecycle
- No endpoint exists for /api/lifecycle (required by UI)
- GitHub snapshot builds ConstitutionalObjects but is not called
- Reflection, Mission, Replay, Witness generators are not integrated

**Required Fix:**
Create `/api/v1/lifecycle/ingest` endpoint that:
1. Fetches GitHub data via GitHubSnapshot
2. Builds ConstitutionalObjects
3. Stores in PostgreSQL
4. Generates embeddings via EmbeddingAuthority
5. Projects to Qdrant
6. Runs analysis via InferenceAuthority
7. Generates reflection via ReflectionGenerator
8. Generates mission via MissionGenerator
9. Records replay via ReplayRecorder
10. Records witness via WitnessRecorder
11. Returns lifecycle status

---

## Success Criteria

**Current Status:** ❌ Failed

**Blocking Issues:**
1. Missing `/api/lifecycle` endpoint for UI
2. Missing pipeline orchestration endpoint
3. New generators not integrated into server.js
4. No end-to-end execution path

**Next Steps:**
1. Create `/api/lifecycle` endpoint for UI polling
2. Create `/api/v1/lifecycle/ingest` endpoint for full pipeline execution
3. Integrate ReflectionGenerator, MissionGenerator, ReplayRecorder, WitnessRecorder into server.js
4. Wire GitHubSnapshot.buildConstitutionalObjects() to ingestion endpoint
5. Test end-to-end with single repository
