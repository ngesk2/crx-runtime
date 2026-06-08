# Ingestion Readiness Inventory

**Generated:** 2026-06-07  
**Audit:** CRX Layer 0 Phase 5 — Discovery (Read-Only)  
**Spec Reference:** `knowledge/derived/signal-ingestion-architecture-v0.1.md`

No ingestion performed. Inventory only.

---

## Summary Matrix

| Source | Auth State | Extraction Method | API Available | Local Tooling | Readiness |
|--------|------------|-------------------|---------------|---------------|-----------|
| RSS | UNKNOWN | Spec: polling/parser | Public feeds | **NONE** | NOT READY |
| YouTube | UNKNOWN | Spec: Data API v3 + transcripts | Google API | ffmpeg only | NOT READY |
| Spotify | UNKNOWN | **Not in spec** | Spotify API | Store app on PATH | NOT READY |
| GitHub | PARTIAL | Spec: GitHub API | Yes (remote read works) | git 2.54.0 | PARTIAL |
| Reddit | UNKNOWN | Spec: PRAW/official API | Reddit API | **NONE** | NOT READY |
| Twitter/X | UNKNOWN | Spec: API v2 stream/search | X API | **NONE** | NOT READY |
| Podcast | UNKNOWN | Spec: RSS + ASR | RSS | **NONE** | NOT READY |
| Newsletter/Email | UNKNOWN | Spec: IMAP | Email | **NONE** | NOT READY |
| Web/Blog | UNKNOWN | Spec: RSS + scraping | HTTP | curl (system) | NOT READY |

---

## RSS Infrastructure

| Check | Result | Classification |
|-------|--------|----------------|
| RSS reader installed | NO (no feedreader, newsboat, miniflux) | FACT |
| Python feedparser | NOT VERIFIED (`pip` not on PATH) | FACT |
| npm RSS packages (global) | None found | FACT |
| RSS in codebase | Documentation only | FACT |
| Local RSS config files | None found in CRX tree | FACT |

**Readiness:** NOT READY

---

## YouTube Infrastructure

| Check | Result | Classification |
|-------|--------|----------------|
| yt-dlp | NOT FOUND | FACT |
| youtube-dl | NOT FOUND | FACT |
| ffmpeg | INSTALLED (WinGet 8.1.1) | FACT |
| YouTube API credentials | **UNKNOWN** | UNKNOWN |
| YouTube in vault | Pipeline docs (15_Pipelines) | FACT |

**Readiness:** NOT READY (ffmpeg alone insufficient)

---

## Spotify Infrastructure

| Check | Result | Classification |
|-------|--------|----------------|
| Spotify desktop/app | Windows Store stub on PATH | FACT |
| spotdl / spotify-cli | NOT FOUND | FACT |
| Spotify API credentials | **UNKNOWN** | UNKNOWN |
| Spotify in ingestion spec | NOT MENTIONED | FACT |
| Spotify in claim-lifecycle model | Listed as signal_type enum only | FACT |

**Readiness:** NOT READY

---

## GitHub Infrastructure

| Check | Result | Classification |
|-------|--------|----------------|
| git | 2.54.0 installed | FACT |
| gh CLI | NOT installed | FACT |
| GitHub Desktop | NOT installed | FACT |
| SSH keys | ~/.ssh absent | FACT |
| Remote read (crx-runtime) | Succeeds | FACT |
| GitHub API tokens | **UNKNOWN** (no .env in CRX) | UNKNOWN |
| Credential Manager | No explicit github.com target | FACT |

**Readiness:** PARTIAL — read-only git access verified; no ingestion pipeline

---

## Reddit Infrastructure

| Check | Result | Classification |
|-------|--------|----------------|
| PRAW / Reddit CLI | NOT FOUND | FACT |
| Reddit API credentials | **UNKNOWN** | UNKNOWN |
| Reddit in spec | Documented (PRAW) | FACT |

**Readiness:** NOT READY

---

## Twitter/X Infrastructure

| Check | Result | Classification |
|-------|--------|----------------|
| tweepy / X CLI | NOT FOUND | FACT |
| X API credentials | **UNKNOWN** | UNKNOWN |
| X in spec | Documented (API v2) | FACT |

**Readiness:** NOT READY

---

## Scraping / Feed Tooling

| Tool | Status |
|------|--------|
| curl | Available (system) |
| rclone | NOT FOUND |
| scrapy | NOT VERIFIED |
| beautifulsoup | NOT VERIFIED |
| Custom scrapers in CRX | NONE |

---

## Canonical Ingestion Surface

**INFERENCE:** No canonical ingestion surface exists today.

| Candidate | Location | Status |
|-----------|----------|--------|
| Designed architecture | `knowledge/derived/signal-ingestion-architecture-v0.1.md` | DOC ONLY |
| Runtime endpoint | commit-service `/kernel/commit` | Accepts commits, not feeds |
| ai-stack `/event` | FastAPI POST | Experimental, not canonical |
| Obsidian vault | Creator pipelines | Human workflow, not automated ingestion |

**Classification:** UNKNOWN what will become canonical ingestion entrypoint.
