# LOCAL CORPUS TOPOLOGY

**Generated:** 2026-06-07
**Mode:** READ-ONLY

---

## TOPOLOGY MAP

The CRX corpus is a **distributed local corpus** spanning 7 disconnected components across 4 top-level directories. No single git repository contains the complete system.

---

## COMPONENT MAP

```
C:\Users\nolan\
│
├── Documents\Codex\2026-05-31\phase-1a-context-foundation-only-objective\crx\  [PRIMARY ARCHIVE]
│   ├── JS.txt (18,409 lines — 59 embedded JS modules)
│   ├── MCP0.txt (22,537 lines — design tree + narrative)
│   ├── constitution\ (10 constitutional law stubs)
│   ├── governance\ (CI configs, policies, prompts, schemas)
│   ├── c-20260601T001331Z-3-001\ (Python runtime in .docx format)
│   ├── replay\ [EMPTY]
│   ├── witness\ [EMPTY]
│   ├── verifier\ [EMPTY]
│   └── kernel\ [EMPTY]
│
├── CRX\  [ACTIVE WORKSPACE — NOT A GIT REPO]
│   ├── AGENT.md (13,529 bytes)
│   ├── CRX_CONSTITUTION.md (22,885 bytes)
│   ├── runtime\ [GIT: github.com/ngesk2/crx-runtime.git — audit-hardening branch]
│   │   └── kernel\commit-service\src\ (12 .ts/.sql files, ~179 LOC)
│   ├── knowledge\ [GIT: no remote — master branch]
│   │   └── authoritative\ (35+ .md files + claim.schema.json + decision.schema.json)
│   ├── vos\ [GIT: no remote — main branch]
│   │   └── cos\ (CONSTITUTION.md, schemas, governance, protocols)
│   ├── reports\ (30+ analysis reports from prior agents)
│   ├── inventory\ (14 inventory files from prior agents)
│   └── agents\ (Dockerfiles, compose, scripts)
│
├── constitutional-integration-lab\  [ANALYSIS WORKSPACE — NOT A GIT REPO]
│   ├── extracted\
│   │   ├── js_txt\ (59 .js files — extracted from JS.txt)
│   │   ├── runtime\ (12 .ts/.sql files — copy of CRX runtime)
│   │   └── schemas\ (11 JSON/SQL schema files)
│   ├── comparisons\ (6 comparison reports)
│   ├── reports\ (17 phase-based analysis reports PHASE A through PHASE G+)
│   ├── inventories\ (2 inventory files)
│   ├── mappings\ (2 mapping files)
│   ├── duplicate_matrix\ (1 duplicate matrix)
│   └── temporary\ (4 CSV files)
│
├── CascadeProjects\  [SIBLING WORKSPACE — NOT A GIT REPO]
│   ├── events\canonical-event-envelope.json
│   ├── schemas\foundational-primitives.json
│   ├── kernel\doctrine\constitutional-principles.md
│   ├── kernel\invariants\system-invariants.md
│   ├── policies\constitutional\reuse-before-create.md
│   ├── prompts\constitutional\audit-agent.md
│   ├── governance\ci\ (replay-ci.yml, witness-check.yml)
│   ├── infra\ (docker-compose.yml, observability, scripts\init-db.sql)
│   └── tests\, agents\, replay\, runtime\ [ALL EMPTY]
│
├── Documents\Codex\2026-06-04\files-mentioned-by-the-user-pasted\outputs\  [AGENT OUTPUTS]
│   ├── constitutional-state.schema.json
│   ├── capability.schema.json
│   ├── fact.schema.json
│   ├── invariant.schema.json
│   ├── obligation.schema.json
│   ├── crx-constitutional-replay-infrastructure-v1.md
│   ├── crx-meta-constitutional-audit-assume-everything-is-wrong.md
│   └── ... (17 more agent-authored outputs)
│
├── Downloads\Pig\  [OBSIDIAN VAULT — NOT CRX]
│   └── (Content creation system — 27+ folders, unrelated to CRX kernel)
│
└── ai-stack\  [MINIMAL — TANGENTIAL]
    ├── api\main.py
    └── python-env\Dockerfile
```

---

## CONNECTIVITY MATRIX

| Component | Git | Remote | Connected To |
|-----------|-----|--------|-------------|
| CRX root | NO | — | Assembly of sub-repos |
| CRX/runtime | YES | github.com/ngesk2/crx-runtime.git | GitHub |
| CRX/knowledge | YES | None | Isolated |
| CRX/vos | YES | None | Isolated |
| Integration Lab | NO | — | None (extracted copies) |
| CascadeProjects | NO | — | None |
| Codex Archive | NO | — | None |
| Codex 2026-06-04 | NO | — | None |

**FACT.** There are **zero git connections** between any of the 7 components. They are completely isolated.

---

## CROSS-COMPONENT DEPENDENCIES (Logical, Not Physical)

```
Codex Archive (JS.txt) ──extracted──► Integration Lab (js_txt/)
Integration Lab (comparisons/) ──analyzes──► CRX Runtime (runtime/)
CascadeProjects (canonical-event-envelope.json) ──should-define──► CRX Runtime (event_log.ts)
Codex 2026-06-04 (constitutional-state.schema.json) ──should-define──► CRX Runtime (state)
```

---

## FILE COUNT BY COMPONENT

| Component | Total Files | Source Files | Schema Files | Report Files |
|-----------|-------------|--------------|--------------|--------------|
| Codex Archive (2026-05-31) | ~95 | ~70 (.txt, .md, .json, .docx) | ~5 (.json schemas) | ~20 (.md docs) |
| CRX Root | ~50+ | ~12 (.ts) | ~3 (.json) | ~30+ (.md reports) |
| Integration Lab | ~120 | ~71 (.js + .ts) | ~11 (.json + .sql) | ~25 (.md reports) |
| CascadeProjects | ~40 | ~5 (.md + .yml) | ~2 (.json) | 0 |
| Codex 2026-06-04 | ~25 | 0 | ~5 (.json) | ~20 (.md reports) |
| Downloads/Pig | ~35 | 0 | 0 | 0 |
| ai-stack | ~3 | ~1 (.py) | 0 | 0 |
| **TOTAL** | **~368** | **~159** | **~26** | **~95** |

---

## TOPOLOGY INSIGHTS

1. **No single source of truth.** The CRX corpus is fragmented across 7+ disconnected directories with no unified git repository.

2. **The integration lab is the only bridge.** It contains extracted copies from both the archive (JS.txt) and the runtime, plus analysis comparing them. It is the only location where both codebases coexist.

3. **CascadeProjects is a parallel design workspace.** It contains proposed schemas (canonical-event-envelope.json) and infrastructure (init-db.sql) that are more complete than the active runtime but are not connected to it.

4. **The Codex 2026-06-04 outputs are agent-authored schemas.** A prior agent produced 23 schema and analysis files that are not integrated into any runtime.

5. **Three independent schema layers exist:**
   - **Runtime schema:** `ledger_schema.sql` (3 tables, minimal)
   - **Integration lab schema:** `init-db.sql` (10+ tables, comprehensive)
   - **CascadeProjects schema:** `init-db.sql` (identical to integration lab version)

6. **The archive (Codex 2026-05-31) is the deepest source.** It contains JS.txt (59 modules) and MCP0.txt (design tree), which are the original sources from which the integration lab extractions were made.

---

**Classification:** FACT (verified by direct filesystem enumeration)
**Confidence:** HIGH
