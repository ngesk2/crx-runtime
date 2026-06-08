# Repository Inventory

**Generated:** 2026-06-07  
**Audit:** CRX Layer 0 — Discovery (Read-Only)  
**Canonical Root:** `C:\Users\nolan\CRX`  
**Classification:** FACT unless marked INFERENCE or UNKNOWN

---

## Summary

| Metric | Value |
|--------|-------|
| Git repos under canonical CRX root | 3 (sub-repos only; root is NOT git) |
| Git repos in secondary locations | 0 |
| Repos with GitHub remote | 1 (`runtime/`) |
| Unpushed commits | 3 (`runtime/` ahead of origin) |
| Duplicated implementations | 4+ parallel trees (see §Duplicates) |

---

## Canonical Root

| Path | Git | Classification |
|------|-----|----------------|
| `C:\Users\nolan\CRX` | **NO** | **FACT** — filesystem assembly, not unified repo |

---

## Git Repositories (CRX Sub-Repos)

### 1. `C:\Users\nolan\CRX\knowledge`

| Field | Value |
|-------|-------|
| Branch | `master` |
| Remote | **None** |
| Recent commits | `46954c4` add .gitignore, `bcad7e6` move agent infra, `2129b63` initial |
| Divergence | **UNKNOWN** — no remote to compare |
| Role | Constitutional knowledge corpus (111 files) |
| Authoritative? | **INFERENCE** — yes for documentation layer |

### 2. `C:\Users\nolan\CRX\vos`

| Field | Value |
|-------|-------|
| Branch | `main` |
| Remote | **None** |
| Recent commits | `7d92543` add .gitignore, `a46091c` initial |
| Divergence | **UNKNOWN** — no remote |
| Role | Cognitive Operating System (COS) governance |
| Authoritative? | **INFERENCE** — yes for process/governance layer |

### 3. `C:\Users\nolan\CRX\runtime`

| Field | Value |
|-------|-------|
| Branch | `audit-hardening` |
| Remote | `https://github.com/ngesk2/crx-runtime.git` |
| Tracking | `origin/audit-hardening` — **ahead by 3 commits** |
| Unpushed commits | `10353c8` add .gitignore, `5e6c82e` fix canonicalization, `f4f9e96` remove dead freeze-audit files |
| Git user (local) | `Nolan` / `nolan@local` |
| Role | Kernel commit-service implementation |
| Authoritative? | **FACT** — only repo with GitHub remote; canonical runtime code |

---

## Secondary Locations (No Git)

| Path | Files | Role | Classification |
|------|-------|------|----------------|
| `C:\Users\nolan\CascadeProjects` | ~38 | Agent-generated shadow repo, infra compose | **DUPLICATE / EXPERIMENTAL** |
| `C:\Users\nolan\constitutional-integration-lab` | 100+ | Extraction archaeology, JS.txt copies | **ARCHAEOLOGICAL LAB** |
| `C:\Users\nolan\ai-stack` | 2 source files | FastAPI memory engine experiment | **EXPERIMENTAL** |
| `C:\Users\nolan\Documents\Codex` | 56 | Historical archives incl. JS.txt (421 KB) | **ARCHAEOLOGICAL** |
| `C:\Users\nolan\Downloads\Pig` | 29 md notes | Obsidian vault (creator workflow) | **COGNITION SUBSTRATE** |

---

## GitHub Identity

| Signal | Value | Classification |
|--------|-------|----------------|
| Remote URL | `ngesk2/crx-runtime` | **FACT** |
| Docker Hub credential user | `ngeske` | **FACT** (Credential Manager target only) |
| Global git user.name | Not configured | **FACT** |
| Global git user.email | Not configured | **FACT** |
| Runtime local git email | `nolan@local` | **FACT** |
| `gh` CLI | Not installed | **FACT** |
| GitHub Desktop | Not installed | **FACT** |
| Remote read access | `git ls-remote` succeeds | **FACT** |
| SSH keys (`~/.ssh`) | Directory absent | **FACT** |

**INFERENCE:** Canonical GitHub identity is **`ngesk2`** (from remote URL). Auth method is likely HTTPS + Credential Manager or cached token — **UNKNOWN** which credential backs git push.

---

## Duplicated Implementations

| System A | System B | Overlap |
|----------|----------|---------|
| `CRX/runtime/kernel/commit-service/` | `constitutional-integration-lab/extracted/runtime/` | Extracted copy of TS kernel |
| `CRX/knowledge/authoritative/*.schema.json` | `CascadeProjects/schemas/` | Competing schema definitions |
| `CRX/knowledge/` | `Downloads/Pig` stale `CRX_KnowledgeOS/` refs | Migrated content (21 stale vault refs) |
| `CRX/agents/docker-compose.yml` | `CascadeProjects/infra/docker-compose.yml` | Broken agents compose vs full infra stack |
| `CRX/runtime/commit-service` | `ai-stack/api/main.py` | Parallel event/memory APIs |
| `JS.txt` archived modules | `constitutional-integration-lab/extracted/js_txt/` | 59 extracted JS modules |
| `CRX/AGENT.md` | `CascadeProjects/AGENT.md` | Shadow authority document |

---

## Repository Authority Ranking

| Rank | Repository | Rationale |
|------|------------|-----------|
| 1 | `C:\Users\nolan\CRX` (filesystem root) | User-declared canonical root |
| 2 | `CRX/runtime/` | Only GitHub-connected implementation |
| 3 | `CRX/knowledge/` | Constitutional documentation corpus |
| 4 | `CRX/vos/` | Governance/process layer |
| 5 | All secondary locations | Discovery sources only — not authority |
