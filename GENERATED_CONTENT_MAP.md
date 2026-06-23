# GENERATED CONTENT MAP

**Date**: 2026-06-20
**Purpose**: Identify every location containing generated content in the PING repository
**Mode**: READ-ONLY - No modifications, no code changes, no file moves

---

## CONTENT CLASSIFICATION DEFINITIONS

- **SOURCE**: Human-authored source code, configuration, and documentation
- **GENERATED**: Automatically generated artifacts, exports, and build outputs
- **RUNTIME_STATE**: Runtime state data, databases, and caches
- **ARCHIVE**: Historical archives and backups

---

## SQLITE DATABASES

| Location | Classification | Size | Purpose | System |
|----------|---------------|------|---------|--------|
| brainos/newsletter/newsletters.db | RUNTIME_STATE | 36KB | Newsletter metadata storage | BrainOS Newsletter |
| brainos/rss/knowledge.db | RUNTIME_STATE | 36KB | RSS metadata storage | BrainOS RSS |

**Total SQLite Databases**: 2

---

## REPORTS

| Location | Classification | Size | Purpose | System |
|----------|---------------|------|---------|--------|
| brainos/research/reports/briefing_2026-06-08.md | GENERATED | Unknown | Research briefing report | BrainOS Research |

**Total Reports**: 1

---

## EXPORTS

| Location | Classification | Size | Purpose | System |
|----------|---------------|------|---------|--------|
| presentping/engine/PING_Presentation_V17_ConstitutionalCity.pptx | GENERATED | 816KB | PowerPoint presentation export | PresentPNG |
| presentping/exports/ | GENERATED | Empty | PowerPoint exports directory | PresentPNG |

**Total Exports**: 1 file + 1 empty directory

---

## GENERATED PRESENTATIONS

| Location | Classification | Size | Purpose | System |
|----------|---------------|------|---------|--------|
| presentping/engine/PING_Presentation_V17_ConstitutionalCity.pptx | GENERATED | 816KB | V17 constitutional city presentation | PresentPNG |

**Total Generated Presentations**: 1

---

## GENERATED ARTIFACTS

| Location | Classification | Size | Purpose | System |
|----------|---------------|------|---------|--------|
| presentping/artifacts/camera-paths.json | GENERATED | 2.3KB | Camera path artifacts | PresentPNG |
| presentping/artifacts/district-geometry.json | GENERATED | 2KB | District geometry artifacts | PresentPNG |
| presentping/artifacts/failure-routes.json | GENERATED | 3.6KB | Failure route artifacts | PresentPNG |
| presentping/artifacts/packet-layout.json | GENERATED | 14.3KB | Packet layout artifacts | PresentPNG |
| presentping/artifacts/world-layout.json | GENERATED | 4.7KB | World layout artifacts | PresentPNG |
| presentping/engine/v17-artifacts/camera-paths.json | GENERATED | 2.3KB | Camera path artifacts (duplicate) | PresentPNG |
| presentping/engine/v17-artifacts/district-geometry.json | GENERATED | 2KB | District geometry artifacts (duplicate) | PresentPNG |
| presentping/engine/v17-artifacts/failure-routes.json | GENERATED | 3.6KB | Failure route artifacts (duplicate) | PresentPNG |
| presentping/engine/v17-artifacts/packet-layout.json | GENERATED | 14.3KB | Packet layout artifacts (duplicate) | PresentPNG |
| presentping/engine/v17-artifacts/world-layout.json | GENERATED | 4.7KB | World layout artifacts (duplicate) | PresentPNG |

**Total Generated Artifacts**: 10 (5 unique, 5 duplicates)

---

## LOGS

| Location | Classification | Size | Purpose | System |
|----------|---------------|------|---------|--------|
| brainos/orchestration/logs/ | RUNTIME_STATE | Empty | Orchestration logs directory | BrainOS Orchestration |

**Total Logs**: 1 empty directory

---

## CACHE FILES

| Location | Classification | Size | Purpose | System |
|----------|---------------|------|---------|--------|
| brainos/newsletter/__pycache__/ | RUNTIME_STATE | Unknown | Python cache directory | BrainOS Newsletter |
| brainos/rss/__pycache__/ | RUNTIME_STATE | Unknown | Python cache directory | BrainOS RSS |

**Total Cache Directories**: 2

---

## NODE_MODULES

| Location | Classification | Size | Purpose | System |
|----------|---------------|------|---------|--------|
| gateway/node_modules/ | GENERATED | Unknown | npm dependencies | Gateway |
| node_modules/ | GENERATED | Unknown | npm dependencies | PING Root |
| runtime/kernel/commit-service/node_modules/ | GENERATED | Unknown | npm dependencies | Runtime Kernel |

**Total Node Modules Directories**: 3

---

## MARKDOWN ARCHIVES

| Location | Classification | Size | Purpose | System |
|----------|---------------|------|---------|--------|
| brainos/newsletter/knowledge/ | ARCHIVE | Unknown | Newsletter markdown archives | BrainOS Newsletter |
| brainos/rss/knowledge/ | ARCHIVE | Unknown | RSS markdown archives | BrainOS RSS |

**Total Markdown Archives**: 2

---

## METADATA FILES

| Location | Classification | Size | Purpose | System |
|----------|---------------|------|---------|--------|
| presentping/metadata/presentation-v17-metadata.json | GENERATED | 139KB | V17 presentation metadata | PresentPNG |
| presentping/metadata/presentation-v16-metadata.json | GENERATED | 23KB | V16 presentation metadata | PresentPNG |
| presentping/metadata/presentation-v14-metadata.json | GENERATED | 116KB | V14 presentation metadata | PresentPNG |
| presentping/engine/presentation-v17-metadata.json | GENERATED | 139KB | V17 presentation metadata (duplicate) | PresentPNG |
| brainos/newsletter/newsletter_candidates.json | GENERATED | 22.9KB | Newsletter candidates metadata | BrainOS Newsletter |
| knowledge/inventory.json | SOURCE | 137KB | Knowledge inventory | Knowledge |

**Total Metadata Files**: 6 (5 generated, 1 source)

---

## ROOT LEVEL MARKDOWN FILES (DOCUMENTATION)

| Location | Classification | Size | Purpose | System |
|----------|---------------|------|---------|--------|
| *.md (100+ files at root level) | SOURCE | Various | Audit reports, governance documentation | PING Root |

**Total Root Level Markdown Files**: 100+ (all SOURCE - documentation)

---

## GENERATED CONTENT SUMMARY

**By Classification Type:**

- **SOURCE**: 100+ markdown files (documentation)
- **GENERATED**: 19 files (artifacts, metadata, presentations, node_modules)
- **RUNTIME_STATE**: 5 locations (databases, cache, logs)
- **ARCHIVE**: 2 locations (markdown archives)

**By System:**

- **PresentPNG**: 11 generated files (artifacts, metadata, presentation)
- **BrainOS Newsletter**: 3 generated/runtime locations (database, cache, metadata)
- **BrainOS RSS**: 2 generated/runtime locations (database, cache)
- **BrainOS Research**: 1 generated file (report)
- **BrainOS Orchestration**: 1 runtime location (logs)
- **Gateway**: 1 generated location (node_modules)
- **Runtime**: 1 generated location (node_modules)
- **PING Root**: 1 generated location (node_modules)

**Key Observations:**

1. **Duplicate Artifacts**: PresentPNG has duplicate artifact files in both presentping/artifacts/ and presentping/engine/v17-artifacts/
2. **Duplicate Metadata**: PresentPNG has duplicate presentation-v17-metadata.json in both presentping/metadata/ and presentping/engine/
3. **Runtime State**: BrainOS systems maintain SQLite databases and Python cache directories
4. **Node Modules**: Multiple node_modules directories exist (gateway, runtime/kernel/commit-service, root)
5. **Markdown Archives**: BrainOS systems maintain markdown knowledge archives
6. **Documentation**: 100+ markdown audit reports exist at root level (SOURCE classification)

**High Priority for Cleanup:**

1. **Duplicate Artifacts**: Consolidate presentping/artifacts/ and presentping/engine/v17-artifacts/
2. **Duplicate Metadata**: Consolidate presentping/metadata/ and presentping/engine/presentation-v17-metadata.json
3. **Node Modules**: Consider consolidating or standardizing node_modules locations
4. **Runtime State**: Consider standardizing database and cache locations across BrainOS systems

**Protected Content (Do Not Delete):**

- brainos/newsletter/newsletters.db (RUNTIME_STATE - critical for newsletter system)
- brainos/rss/knowledge.db (RUNTIME_STATE - critical for RSS system)
- brainos/newsletter/knowledge/ (ARCHIVE - newsletter archives)
- brainos/rss/knowledge/ (ARCHIVE - RSS archives)
- presentping/engine/PING_Presentation_V17_ConstitutionalCity.pptx (GENERATED - presentation export)
