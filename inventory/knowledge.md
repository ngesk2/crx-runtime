# Knowledge Inventory

**Generated:** 2026-06-07  
**Audit:** CRX Layer 0 Phase 4 — Discovery (Read-Only)  
**Primary Source:** `C:\Users\nolan\CRX\knowledge`  
**Secondary Source:** `C:\Users\nolan\Downloads\Pig`

---

## Primary: CRX/knowledge

| Tier | Path | File Count | Classification |
|------|------|------------|----------------|
| Authoritative | `knowledge/authoritative/` | 34 md + 2 json schemas | CONSTITUTIONAL DOCS |
| Derived | `knowledge/derived/` | 67 md | ANALYSIS / NON-AUTHORITATIVE |
| Experimental | `knowledge/experimental/` | 3 md | EXPERIMENTAL |
| Inventory | `knowledge/inventory.json` | 1 (137 KB) | LINEAGE INDEX |
| Tooling | `knowledge/` root | indexer refs in agents/ | SUPPORT |

**Total:** ~111 files | **FACT**

---

## Secondary: Obsidian Vault (Downloads/Pig)

| Attribute | Value | Classification |
|-----------|-------|----------------|
| Path | `C:\Users\nolan\Downloads\Pig` | FACT |
| Total size | ~7.27 MB | FACT |
| Markdown notes | 29 files (~70 KB content) | FACT |
| Plugin overhead | ~7.5 MB in `.obsidian/plugins/` | FACT |
| Active vaults found | 1 (only `.obsidian` under home) | FACT |

### Vault Folder Population

| Folder | Files | Domain |
|--------|-------|--------|
| 15_Pipelines | 7 | Video production workflows |
| 15_Systems | 7 | Metadata, naming, automation |
| 13_Dashboards | 5 | Content dashboards |
| 12_AI | 2 | AI prompts (script, research) |
| Templates | 4 | Daily/video templates |
| 02_Scripts, 05_Production, 10_Templates | 1–2 each | Content drafts |
| 00–24 (most others) | 0 | Empty scaffold |

**INFERENCE:** Vault is **creator/production workflow**, not live constitutional store.

---

## Migration Status

| Signal | Finding | Classification |
|--------|---------|----------------|
| Stale vault refs | 21 unique `CRX_KnowledgeOS/*.md` paths in `workspace.json` | FACT |
| Paths exist in vault? | NO — folder absent | FACT |
| Paths exist in CRX/knowledge? | YES — 10/10 sampled refs found in derived/ or authoritative/ | FACT |
| Vault CRX content today | Only stale editor history refs | FACT |

**INFERENCE:** Constitutional knowledge **migrated** from Obsidian `CRX_KnowledgeOS/` → `CRX/knowledge/`. Migration is **complete for content** but **incomplete for Obsidian metadata** (stale refs remain).

---

## Overlap Analysis

| Content Type | In CRX/knowledge | In Pig vault | Overlap |
|--------------|------------------|--------------|---------|
| Constitutional specs | YES (111 files) | NO (stale refs only) | MIGRATED OUT |
| Creator pipelines | NO | YES (15_Pipelines) | NONE |
| AI prompts | Derived docs in knowledge | YES (12_AI) | PARTIAL — different purpose |
| Video scripts | NO | YES (02_Scripts) | NONE |
| System standards | Partial in derived | YES (15_Systems) | LOW |

---

## Duplication

| Item | Locations | Risk |
|------|-----------|------|
| CRX_KnowledgeOS docs | knowledge/ + vault workspace.json refs | LOW (refs stale) |
| Schemas | knowledge/authoritative + CascadeProjects/schemas + Codex | **HIGH** |
| Ingestion architecture | knowledge/derived/signal-ingestion-architecture-v0.1.md | SINGLE canonical doc |

---

## Stale References (Do Not Treat as Authority)

**Location:** `Downloads/Pig/.obsidian/workspace.json`  
**Pattern:** `CRX_KnowledgeOS/<filename>.md`  
**Count:** 21 unique paths  
**Status:** Files do not exist in vault; content lives in `CRX/knowledge/`

---

## Knowledge Authority Classification

| Source | Role | Constitutional Authority? |
|--------|------|---------------------------|
| CRX/knowledge/authoritative/ | Specs, schemas, replay docs | YES (declared P2–P5) |
| CRX/knowledge/derived/ | Analysis, bridges | NO |
| CRX/knowledge/experimental/ | Tests | NO |
| Downloads/Pig | Creator workflow notes | **NO** — cognition substrate only |
| Documents/Codex | Historical archives | NO — archaeological |
