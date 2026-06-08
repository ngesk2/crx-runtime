# Ingestion Gap Report

**Generated:** 2026-06-07  
**Audit:** CRX Layer 0B — Ingestion Readiness (Read-Only)  
**Law:** No ingestion performed. No credentials accessed.

---

## Specification Inventory

### Primary Ingestion Architecture

| Document | Location | Size | Classification |
|----------|----------|------|----------------|
| signal-ingestion-architecture-v0.1.md | CRX/knowledge/derived | ~41 KB | **FACT** — primary spec |
| claim-lifecycle-model.md | knowledge/authoritative | signal_type enum | FACT |
| constitutional-runtime-objects.md | knowledge/authoritative | signal types | FACT |
| unified-creator-intelligence-runtime.md | knowledge/derived | UCIR ingestion | FACT |
| creator-canonical-storage-spec-v1.md | knowledge/derived | Storage post-ingest | FACT |
| agent-workflow-topology.md | knowledge/derived | Agent ingestion roles | FACT |
| script-generation-pipeline-v2.md | knowledge/derived | Content pipeline | FACT |
| mandatory-questions-answers-creator.md | knowledge/derived | Creator domain Q&A | FACT |

### Secondary / Shadow References

| Document | Location | Classification |
|----------|----------|----------------|
| CascadeProjects/events/canonical-event-envelope.json | Shadow | DUPLICATE envelope |
| integration-lab/extracted/schemas/canonical-event-envelope.json | Extracted | COPY |
| Pig/15_Pipelines/*.md | Obsidian | Human workflow only |
| Pig/12_AI/04_AI_Prompts/*.md | Obsidian | Prompt templates |

---

## Source Coverage in Primary Spec

| Source | In signal-ingestion-architecture-v0.1.md | Implementation | Auth State |
|--------|------------------------------------------|----------------|------------|
| RSS | YES — polling/parser | NONE | UNKNOWN |
| YouTube | YES — Data API v3 + transcripts | NONE | UNKNOWN |
| X/Twitter | YES — API v2 | NONE | UNKNOWN |
| Reddit | YES — PRAW/official API | NONE | UNKNOWN |
| GitHub | YES — repos/issues/PRs | git read only | PARTIAL |
| Papers/blogs | YES — RSS/scraping | NONE | N/A |
| Newsletter/email | YES — IMAP | NONE | UNKNOWN |
| Podcast | YES — RSS + ASR | NONE | UNKNOWN |
| **Spotify** | **NO** — not in spec | Store app stub only | UNKNOWN |

**FACT:** Spotify appears in primitive enums elsewhere but not in primary ingestion architecture.  
**Classification:** INFERENCE — Spotify ingestion is **unspecified**.

---

## Local Tooling Inventory

| Tool | Status | Purpose | Classification |
|------|--------|---------|----------------|
| yt-dlp | NOT FOUND | YouTube extraction | FACT |
| youtube-dl | NOT FOUND | YouTube extraction | FACT |
| ffmpeg | INSTALLED (8.1.1) | Media processing | FACT |
| Spotify app | WindowsApps stub | Playback | FACT — not API |
| spotdl | NOT FOUND | Spotify download | FACT |
| feedreader/newsboat/miniflux | NOT FOUND | RSS | FACT |
| rclone | NOT FOUND | Cloud sync | FACT |
| curl | System | HTTP | FACT |
| git | 2.54.0 | GitHub read | FACT |
| gh CLI | NOT INSTALLED | GitHub API | FACT |
| Python pip | NOT ON PATH | Package mgmt | FACT |
| npm global ingestion pkgs | NONE FOUND | — | FACT |

---

## Implementation Gap Matrix

| Capability | Specified | Code | Config | Credentials | Gap |
|------------|-----------|------|--------|-------------|-----|
| RSS polling | YES | NO | NO | UNKNOWN | **FULL** |
| Feed normalization | YES | NO | NO | N/A | **FULL** |
| YouTube metadata | YES | NO | NO | UNKNOWN | **FULL** |
| YouTube transcripts | YES | NO | NO | UNKNOWN | **FULL** |
| Twitter stream/search | YES | NO | NO | UNKNOWN | **FULL** |
| Reddit ingest | YES | NO | NO | UNKNOWN | **FULL** |
| GitHub webhook/poll | YES | NO | NO | PARTIAL | **NEAR FULL** |
| Email/IMAP | YES | NO | NO | UNKNOWN | **FULL** |
| Podcast RSS+ASR | YES | NO | NO | UNKNOWN | **FULL** |
| Provenance envelope | YES | PARTIAL (commit API) | NO | N/A | **HIGH** |
| Deduplication | YES | NO | NO | N/A | **FULL** |
| Rate limiting | YES | NO | NO | N/A | **FULL** |
| robots.txt compliance | YES | NO | N/A | N/A | **FULL** |
| Signal → claim pipeline | YES | NO | NO | N/A | **FULL** |

---

## Runtime Ingestion Surface

| Surface | Endpoint | Accepts Feeds? | Canonical? |
|---------|----------|----------------|------------|
| commit-service | POST /kernel/commit | NO — artifact+lineage JSON | **YES** (runtime) |
| ai-stack | POST /event | NO — generic event | NO (shadow) |
| Obsidian vault | Manual notes | NO — human entry | NO |
| Workspace indexer | File scan | NO — local files only | TOOLING |

**FACT:** No ingestion entrypoint exists.  
**INFERENCE:** Canonical ingestion surface is **undeclared and unbuilt**.

---

## Authentication State (No Secrets)

| Provider | Credential Location Found | Usable for Ingestion | Classification |
|----------|---------------------------|----------------------|----------------|
| GitHub | git HTTPS (remote read works) | Read-only clone/fetch | PARTIAL |
| GitHub API token | Not found in CRX tree | UNKNOWN | UNKNOWN |
| Google/YouTube | Not inventoried | UNKNOWN | UNKNOWN |
| Twitter/X API | Not found | NO | UNKNOWN |
| Reddit API | Not found | NO | UNKNOWN |
| Spotify API | Not found | NO | UNKNOWN |
| RSS feeds | N/A (public) | YES when tooling exists | FACT |

**FACT:** No credential values were read, copied, or used in this audit.

---

## Spec vs Shadow Envelope

| Field | signal-ingestion spec | canonical-event-envelope.json (shadow) | commit-service body |
|-------|----------------------|------------------------------------------|---------------------|
| source_type enum | 8+ types | **UNKNOWN** without parse | artifact.artifact_type |
| provenance block | Detailed | Envelope schema | Minimal |
| lineage | Specified | Envelope | Optional parents |

**INFERENCE:** Three parallel ingestion/commit models — reconciliation required before Layer 1.

---

## Obsidian as Ingestion Candidate

| Content | Files | Automation | Classification |
|---------|-------|------------|----------------|
| 15_Pipelines workflows | 7 | Manual | EXPORT candidate |
| 12_AI prompts | 2 | Manual | EXPORT candidate |
| 02_Scripts | 1 | Manual | INGEST candidate (human) |
| CRX_KnowledgeOS refs | 21 stale | None | DO NOT ingest from vault |

---

## Readiness Matrix

| Source | Spec | Tooling | Auth | Pipeline | Readiness |
|--------|------|---------|------|----------|-----------|
| RSS | READY | NOT READY | UNKNOWN | NOT READY | **NOT READY** |
| YouTube | READY | NOT READY | UNKNOWN | NOT READY | **NOT READY** |
| GitHub | READY | PARTIAL | PARTIAL | NOT READY | **PARTIAL** |
| Reddit | READY | NOT READY | UNKNOWN | NOT READY | **NOT READY** |
| Twitter/X | READY | NOT READY | UNKNOWN | NOT READY | **NOT READY** |
| Spotify | **GAP** | NOT READY | UNKNOWN | NOT READY | **NOT READY** |
| Podcast | READY | NOT READY | UNKNOWN | NOT READY | **NOT READY** |
| Email | READY | NOT READY | UNKNOWN | NOT READY | **NOT READY** |

---

## Layer 1 Ingestion Planning Sequence

**INFERENCE** (not executed):

1. Amend spec to include or explicitly exclude Spotify
2. Select single envelope schema (AGENT.md target)
3. Install minimal RSS tooling before social APIs
4. GitHub: `gh` or token strategy — decision required
5. Build ingestion → commit-service adapter (not raw HTTP to shadow APIs)
6. Never store provider credentials in CascadeProjects `.env` without migration plan

**FACT:** No ingestion implementation. No authentication performed.
