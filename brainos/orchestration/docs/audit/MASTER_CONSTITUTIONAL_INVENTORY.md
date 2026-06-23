# MASTER_CONSTITUTIONAL_INVENTORY

**Analysis Date:** 2026-06-14
**Phase:** CONSTITUTIONAL ARCHAEOLOGY PHASE 2 - EXECUTION
**Objective:** Excavate existing ecosystem, identify duplication, determine survivors

---

## PHASE 1: FILE CENSUS

### repository_inventory.csv

| Repository | Path | File Count | LOC | Languages | Last Modified | Purpose |
| ---------- | ---- | ---------- | --- | --------- | ------------- | ------- |
| PING | C:\Users\nolan\PING | 80 | ~15,000 | TypeScript, JavaScript, Python, Markdown | 2026-06-13 | runtime |
| Brain | C:\Users\nolan\CascadeProjects\brain | 54 | ~50,000 | Markdown, SQL | 2026-06-14 | constitutional |
| CRX-Digestion-Worker | C:\Users\nolan\CascadeProjects\crx-digestion-worker | 12 | ~1,500 | Python, YAML, Markdown | 2026-06-14 | ingestion |
| CRX-Newsletter-Brain | C:\Users\nolan\CascadeProjects\crx-newsletter-brain | 25 | ~2,000 | Python, YAML, Markdown, JSON | 2026-06-14 | ingestion |
| PING-Observatory | C:\Users\nolan\CascadeProjects\PING_OBSERVATORY | 45 | ~3,000 | Python, Markdown, JSON, JavaScript | 2026-06-14 | experimental |
| Research-Pipeline | C:\Users\nolan\research-pipeline | 2 | ~500 | Python, Markdown | Unknown | unknown |
| CRX-Remote | C:\Users\nolan\CRX_REMOTE | 64 | ~8,000 | TypeScript, JavaScript, Markdown, JSON | 2026-06-13 | duplicate |
| CRX-Backup | C:\Users\nolan\CRX_BACKUP | 60 | ~7,000 | TypeScript, JavaScript, Python, Markdown | 2026-06-13 | abandoned |

### repository_inventory.md

**PING:**
- Purpose: runtime
- Status: ACTIVE (executing)
- Languages: TypeScript, JavaScript, Python, Markdown
- File Count: 80
- LOC: ~15,000
- Last Modified: 2026-06-13

**Brain:**
- Purpose: constitutional
- Status: ACTIVE (documentation-only)
- Languages: Markdown, SQL
- File Count: 54
- LOC: ~50,000
- Last Modified: 2026-06-14

**CRX-Digestion-Worker:**
- Purpose: ingestion
- Status: EXPERIMENTAL
- Languages: Python, YAML, Markdown
- File Count: 12
- LOC: ~1,500
- Last Modified: 2026-06-14

**CRX-Newsletter-Brain:**
- Purpose: ingestion
- Status: EXPERIMENTAL
- Languages: Python, YAML, Markdown, JSON
- File Count: 25
- LOC: ~2,000
- Last Modified: 2026-06-14

**PING-Observatory:**
- Purpose: experimental
- Status: EXPERIMENTAL
- Languages: Python, Markdown, JSON, JavaScript
- File Count: 45
- LOC: ~3,000
- Last Modified: 2026-06-14

**Research-Pipeline:**
- Purpose: unknown
- Status: UNKNOWN
- Languages: Python, Markdown
- File Count: 2
- LOC: ~500
- Last Modified: Unknown

**CRX-Remote:**
- Purpose: duplicate
- Status: DUPLICATE
- Languages: TypeScript, JavaScript, Markdown, JSON
- File Count: 64
- LOC: ~8,000
- Last Modified: 2026-06-13

**CRX-Backup:**
- Purpose: abandoned
- Status: ABANDONED
- Languages: TypeScript, JavaScript, Python, Markdown
- File Count: 60
- LOC: ~7,000
- Last Modified: 2026-06-13

---

## PHASE 2: DOMAIN DISCOVERY

### domain_inventory.json

```json
{
  "Object System": [
    {
      "repository": "PING",
      "path": "runtime/kernel/commit-service/src/models/artifact.ts",
      "imports": ["pg"],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    },
    {
      "repository": "CRX-Digestion-Worker",
      "path": "database.py",
      "imports": ["sqlite3"],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    },
    {
      "repository": "CRX-Newsletter-Brain",
      "path": "database.py",
      "imports": ["sqlite3"],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    }
  ],
  "Event System": [
    {
      "repository": "PING",
      "path": "runtime/kernel/commit-service/src/server.ts",
      "imports": ["pg"],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    }
  ],
  "Replay System": [
    {
      "repository": "PING",
      "path": "runtime/replay/",
      "imports": [],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    },
    {
      "repository": "CRX-Remote",
      "path": "tests/replay/replay.test.ts",
      "imports": [],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    }
  ],
  "Storage": [
    {
      "repository": "PING",
      "path": "runtime/kernel/commit-service/",
      "imports": ["pg"],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    },
    {
      "repository": "CRX-Digestion-Worker",
      "path": "database.py",
      "imports": ["sqlite3"],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    },
    {
      "repository": "CRX-Newsletter-Brain",
      "path": "database.py",
      "imports": ["sqlite3"],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    }
  ],
  "Retrieval": [
    {
      "repository": "CRX-Digestion-Worker",
      "path": "tools.py",
      "imports": ["sqlite3"],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    },
    {
      "repository": "CRX-Newsletter-Brain",
      "path": "database.py",
      "imports": ["sqlite3"],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    }
  ],
  "Search": [
    {
      "repository": "CRX-Digestion-Worker",
      "path": "tools.py",
      "imports": ["sqlite3"],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    },
    {
      "repository": "CRX-Newsletter-Brain",
      "path": "database.py",
      "imports": ["sqlite3"],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    }
  ],
  "Knowledge": [
    {
      "repository": "PING",
      "path": "knowledge/",
      "imports": [],
      "runtime_status": "DOCUMENTATION_ONLY",
      "executing": false,
      "referenced": false,
      "orphaned": true,
      "dead": true,
      "authoritative": false
    },
    {
      "repository": "Brain",
      "path": "docs/",
      "imports": [],
      "runtime_status": "DOCUMENTATION_ONLY",
      "executing": false,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": true
    },
    {
      "repository": "CRX-Digestion-Worker",
      "path": "knowledge/",
      "imports": [],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    },
    {
      "repository": "CRX-Newsletter-Brain",
      "path": "knowledge/",
      "imports": [],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    }
  ],
  "Workflow": [
    {
      "repository": "CRX-Digestion-Worker",
      "path": "worker.py",
      "imports": ["feedparser", "requests"],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    },
    {
      "repository": "CRX-Newsletter-Brain",
      "path": "worker.py",
      "imports": ["imaplib"],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    }
  ],
  "Agent": [],
  "Protocol": [
    {
      "repository": "PING",
      "path": "gateway/",
      "imports": ["express"],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    },
    {
      "repository": "CRX-Digestion-Worker",
      "path": "worker.py",
      "imports": ["feedparser"],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    },
    {
      "repository": "CRX-Newsletter-Brain",
      "path": "yahoo_client.py",
      "imports": ["imaplib"],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    }
  ],
  "Identity": [],
  "Trust": [],
  "Graph": [],
  "Classification": [],
  "Intelligence": [
    {
      "repository": "CRX-Digestion-Worker",
      "path": "summarizer.py",
      "imports": ["requests"],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    },
    {
      "repository": "CRX-Newsletter-Brain",
      "path": "summarizer.py",
      "imports": ["requests"],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    }
  ],
  "UI": [
    {
      "repository": "CRX-Digestion-Worker",
      "path": "dashboard.py",
      "imports": ["flask"],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    },
    {
      "repository": "CRX-Newsletter-Brain",
      "path": "dashboard.py",
      "imports": ["flask"],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    }
  ],
  "Infrastructure": [
    {
      "repository": "PING",
      "path": "infra/",
      "imports": [],
      "runtime_status": "CONFIG_ONLY",
      "executing": false,
      "referenced": false,
      "orphaned": true,
      "dead": true,
      "authoritative": false
    },
    {
      "repository": "CRX-Digestion-Worker",
      "path": "docker-compose.yml",
      "imports": [],
      "runtime_status": "CONFIG_ONLY",
      "executing": false,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    },
    {
      "repository": "CRX-Newsletter-Brain",
      "path": "docker-compose.yml",
      "imports": [],
      "runtime_status": "CONFIG_ONLY",
      "executing": false,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    }
  ],
  "Utility": [
    {
      "repository": "PING",
      "path": "analyze.py",
      "imports": [],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": false,
      "orphaned": true,
      "dead": true,
      "authoritative": false
    },
    {
      "repository": "PING",
      "path": "compare_stacks.py",
      "imports": [],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": false,
      "orphaned": true,
      "dead": true,
      "authoritative": false
    },
    {
      "repository": "PING-Observatory",
      "path": "execute_phase2.py",
      "imports": [],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": true,
      "orphaned": false,
      "dead": false,
      "authoritative": false
    },
    {
      "repository": "research-pipeline",
      "path": "scan_and_synthesize.py",
      "imports": [],
      "runtime_status": "EXECUTING",
      "executing": true,
      "referenced": false,
      "orphaned": true,
      "dead": true,
      "authoritative": false
    }
  ],
  "Unknown": [
    {
      "repository": "PING",
      "path": "constitution/",
      "imports": [],
      "runtime_status": "DOCUMENTATION_ONLY",
      "executing": false,
      "referenced": false,
      "orphaned": true,
      "dead": true,
      "authoritative": false
    },
    {
      "repository": "PING",
      "path": "vos/",
      "imports": [],
      "runtime_status": "DOCUMENTATION_ONLY",
      "executing": false,
      "referenced": false,
      "orphaned": true,
      "dead": true,
      "authoritative": false
    }
  ]
}
```

### domain_inventory.md

**Object System:**
- PING: PostgreSQL artifacts (non-constitutional)
- CRX-Digestion-Worker: SQLite articles (non-constitutional)
- CRX-Newsletter-Brain: SQLite newsletters (non-constitutional)
- Classification: COMPETING FOUNDATIONS

**Event System:**
- PING: Minimal event logging (non-constitutional)
- Classification: SINGLE FOUNDATION (minimal)

**Replay System:**
- PING: Canonicalization library (minimal)
- CRX-Remote: Replay tests (test-only)
- Classification: COMPETING FOUNDATIONS

**Storage:**
- PING: PostgreSQL (external)
- CRX-Digestion-Worker: SQLite (file-based)
- CRX-Newsletter-Brain: SQLite (file-based)
- Classification: COMPETING FOUNDATIONS

**Retrieval:**
- CRX-Digestion-Worker: SQLite search (basic)
- CRX-Newsletter-Brain: SQLite search (basic)
- Classification: DUPLICATE PROJECTIONS

**Search:**
- CRX-Digestion-Worker: SQLite search (basic)
- CRX-Newsletter-Brain: SQLite search (basic)
- Classification: DUPLICATE PROJECTIONS

**Knowledge:**
- PING: Documentation-only (dead)
- Brain: Documentation-only (authoritative)
- CRX-Digestion-Worker: Markdown archive (non-constitutional)
- CRX-Newsletter-Brain: Markdown archive (non-constitutional)
- Classification: DUPLICATE PROJECTIONS

**Workflow:**
- CRX-Digestion-Worker: RSS worker loop (basic)
- CRX-Newsletter-Brain: Yahoo worker loop (basic)
- Classification: DUPLICATE PROJECTIONS

**Protocol:**
- PING: HTTP proxy to Ollama (simple)
- CRX-Digestion-Worker: RSS protocol (external)
- CRX-Newsletter-Brain: IMAP protocol (external)
- Classification: DUPLICATE PROJECTIONS

**Intelligence:**
- CRX-Digestion-Worker: Ollama summarization (external AI)
- CRX-Newsletter-Brain: Ollama summarization (external AI)
- Classification: DUPLICATE PROJECTIONS

**UI:**
- CRX-Digestion-Worker: Flask dashboard (basic)
- CRX-Newsletter-Brain: Flask dashboard (basic)
- Classification: DUPLICATE PROJECTIONS

**Infrastructure:**
- PING: infra/ (dead, empty)
- CRX-Digestion-Worker: docker-compose.yml (config)
- CRX-Newsletter-Brain: docker-compose.yml (config)
- Classification: MIXED (dead + config)

**Utility:**
- PING: analyze.py, compare_stacks.py (dead)
- PING-Observatory: execute_phase2.py (executing)
- research-pipeline: scan_and_synthesize.py (dead)
- Classification: MIXED (dead + executing)

**Unknown:**
- PING: constitution/ (dead, documentation-only)
- PING: vos/ (dead, documentation-only)
- Classification: DEAD CODE

---

## PHASE 3: DUPLICATE DETECTION

### duplication_matrix.md

| Domain | Repositories | Competing Implementations | Authority | Action |
| ------ | ------------ | ------------------------- | --------- | ------ |
| **Object System** | PING, CRX-Digestion-Worker, CRX-Newsletter-Brain | PostgreSQL artifacts, SQLite articles, SQLite newsletters | None (all non-constitutional) | REWRITE (implement constitutional object store) |
| **Event System** | PING | Minimal event logging | PING (minimal) | REWRITE (implement constitutional event log) |
| **Replay System** | PING, CRX-Remote | Canonicalization library, replay tests | PING (minimal) | REWRITE (implement constitutional replay engine) |
| **Storage** | PING, CRX-Digestion-Worker, CRX-Newsletter-Brain | PostgreSQL, SQLite, SQLite | None (all non-constitutional) | REWRITE (implement constitutional object store) |
| **Retrieval** | CRX-Digestion-Worker, CRX-Newsletter-Brain | SQLite search, SQLite search | None (both basic) | MERGE (unify into constitutional retrieval) |
| **Search** | CRX-Digestion-Worker, CRX-Newsletter-Brain | SQLite search, SQLite search | None (both basic) | MERGE (unify into constitutional search) |
| **Knowledge** | PING, CRX-Digestion-Worker, CRX-Newsletter-Brain | Documentation, markdown archive, markdown archive | Brain (documentation authority) | DELETE (PING knowledge/, merge CRX archives) |
| **Workflow** | CRX-Digestion-Worker, CRX-Newsletter-Brain | RSS worker loop, Yahoo worker loop | None (both basic) | MERGE (unify into constitutional worker) |
| **Protocol** | PING, CRX-Digestion-Worker, CRX-Newsletter-Brain | HTTP proxy, RSS protocol, IMAP protocol | None (all non-constitutional) | MERGE (unify into constitutional protocol layer) |
| **Intelligence** | CRX-Digestion-Worker, CRX-Newsletter-Brain | Ollama summarization, Ollama summarization | None (both external AI) | MERGE (unify Ollama integration) |
| **UI** | CRX-Digestion-Worker, CRX-Newsletter-Brain | Flask dashboard, Flask dashboard | None (both basic) | MERGE (unify into single dashboard) |

### Critical Finding

**HIGH DUPLICATION:**
- Object System: 3 competing implementations (PostgreSQL, SQLite, SQLite)
- Storage: 3 competing implementations (PostgreSQL, SQLite, SQLite)
- Knowledge: 3 competing implementations (Documentation, markdown, markdown)

**MEDIUM DUPLICATION:**
- Retrieval: 2 duplicate implementations (SQLite search)
- Search: 2 duplicate implementations (SQLite search)
- Workflow: 2 duplicate implementations (RSS worker, Yahoo worker)
- Protocol: 3 competing implementations (HTTP, RSS, IMAP)
- Intelligence: 2 duplicate implementations (Ollama, Ollama)
- UI: 2 duplicate implementations (Flask dashboard, Flask dashboard)

**RECOMMENDATION:** Rewrite object system, event system, replay system, storage as constitutional primitives. Merge all duplicates into unified constitutional projections.

---

## PHASE 4: KNOWLEDGE DISCOVERY

### knowledge_locations.md

| Location | Type | Repository | Authority | Active | Duplicate | Action |
| -------- | ---- | ---------- | --------- | ------ | --------- | ------ |
| knowledge/ | Markdown | PING | SHADOW | NO | YES | DELETE |
| docs/ | Markdown | Brain | AUTHORITATIVE | YES | NO | KEEP |
| knowledge/ | Markdown | CRX-Digestion-Worker | PROJECTION | YES | YES | MERGE |
| knowledge/ | Markdown | CRX-Newsletter-Brain | PROJECTION | YES | YES | MERGE |
| knowledge.db | SQLite | CRX-Digestion-Worker | PROJECTION | YES | YES | DELETE |
| newsletters.db | SQLite | CRX-Newsletter-Brain | PROJECTION | YES | YES | DELETE |
| PostgreSQL | PostgreSQL | PING | PROJECTION | YES | YES | MIGRATE |
| newsletter_candidates.json | JSON | CRX-Newsletter-Brain | TEMPORARY | YES | NO | DELETE |
| sources.yaml | YAML | CRX-Digestion-Worker | TEMPORARY | YES | NO | KEEP (config) |

### Authority Labels

**AUTHORITATIVE:** Brain docs/ (constitutional authority)
**SHADOW:** PING knowledge/ (documentation-only, not executing)
**DUPLICATE:** CRX-Digestion-Worker knowledge/, CRX-Newsletter-Brain knowledge/ (markdown archives)
**ABANDONED:** None
**PROJECTION:** knowledge.db, newsletters.db, PostgreSQL (non-constitutional storage)

### Critical Finding

**Severe Knowledge Fragmentation:** Knowledge stored in 5 different locations across 4 repositories. No authoritative constitutional knowledge storage. All knowledge storage is non-constitutional.

**RECOMMENDATION:** Delete all non-constitutional knowledge storage. Implement constitutional object store. Migrate all knowledge to constitutional objects.

---

## PHASE 5: CONSTITUTIONAL PRIMITIVE DISCOVERY

### constitutional_primitive_inventory.md

| Primitive | Repository | File | Runtime Used | Authority | Action |
| --------- | ---------- | ---- | ------------ | --------- | ------ |
| **Object** | PING | runtime/kernel/commit-service/src/models/artifact.ts | YES | NO | REWRITE |
| **Object** | CRX-Digestion-Worker | database.py | YES | NO | REWRITE |
| **Object** | CRX-Newsletter-Brain | database.py | YES | NO | REWRITE |
| **Event** | PING | runtime/kernel/commit-service/src/server.ts | YES | NO | REWRITE |
| **Replay** | PING | runtime/replay/ | YES | NO | REWRITE |
| **Replay** | CRX-Remote | tests/replay/replay.test.ts | YES | NO | DELETE (test-only) |
| **Identity** | None | None | NO | NO | IMPLEMENT |
| **Trust** | None | None | NO | NO | IMPLEMENT |
| **Lineage** | None | None | NO | NO | IMPLEMENT |
| **Relationship** | None | None | NO | NO | IMPLEMENT |
| **Canonicalization** | PING | runtime/replay/ | YES | NO | REWRITE |

### Critical Finding

**NO CONSTITUTIONAL PRIMITIVES EXIST.** All object/event/replay implementations are non-constitutional. Identity, trust, lineage, relationship systems do not exist.

**RECOMMENDATION:** Rewrite all object/event/replay implementations as constitutional primitives. Implement identity, trust, lineage, relationship systems.

---

## PHASE 6: RUNTIME DISCOVERY

### runtime_inventory.md

| Runtime | Repository | Startup Path | Dependencies | Inputs | Outputs | Active |
| ------- | ---------- | ------------ | ------------ | ------ | ------- | ------ |
| Gateway | PING | gateway/index.js | express | HTTP requests | Ollama proxy | EXECUTING |
| Commit Service | PING | runtime/kernel/commit-service/src/server.ts | pg | Artifact commits | PostgreSQL | EXECUTING |
| RSS Worker | CRX-Digestion-Worker | worker.py | feedparser, requests, sqlite3 | RSS feeds | SQLite + Markdown | EXECUTING |
| Yahoo Worker | CRX-Newsletter-Brain | worker.py | imaplib, sqlite3 | Yahoo Mail | SQLite + Markdown | EXECUTING |
| Dashboard | CRX-Digestion-Worker | dashboard.py | flask, sqlite3 | HTTP requests | Metrics | EXECUTING |
| Dashboard | CRX-Newsletter-Brain | dashboard.py | flask, sqlite3 | HTTP requests | Metrics | EXECUTING |
| Observatory | PING-Observatory | execute_phase2.py | matplotlib, networkx | File system | Visualizations | EXECUTING |
| Research Pipeline | research-pipeline | scan_and_synthesize.py | None | File system | Reports | ABANDONED |

### Classification

**EXECUTING:** Gateway, Commit Service, RSS Worker, Yahoo Worker, 2 Dashboards, Observatory
**CONFIG_ONLY:** docker-compose.yml files
**ABANDONED:** Research Pipeline
**THEATER:** PING infra/, PING vos/, PING constitution/ (documentation-only)

### Critical Finding

**6 EXECUTING RUNTIMES:** Gateway, Commit Service, RSS Worker, Yahoo Worker, 2 Dashboards, Observatory. All are non-constitutional. No constitutional runtime exists.

**RECOMMENDATION:** Rewrite all runtimes as constitutional projections. Implement constitutional runtime kernel.

---

## PHASE 7: INTELLIGENCE DISCOVERY

### intelligence_inventory.md

| Capability | Repository | File | Runtime Used | Authority | Action |
| ---------- | ---------- | ---- | ------------ | --------- | ------ |
| **Summarization** | CRX-Digestion-Worker | summarizer.py | Ollama (external AI) | NO | MERGE |
| **Summarization** | CRX-Newsletter-Brain | summarizer.py | Ollama (external AI) | NO | MERGE |
| **Extraction** | CRX-Newsletter-Brain | summarizer.py | Ollama (external AI) | NO | MERGE |
| **Classification** | CRX-Digestion-Worker | summarizer.py | Ollama (external AI) | NO | MERGE |
| **Classification** | CRX-Newsletter-Brain | summarizer.py | Ollama (external AI) | NO | MERGE |
| **Retrieval** | CRX-Digestion-Worker | tools.py | SQLite (basic) | NO | DELETE |
| **Retrieval** | CRX-Newsletter-Brain | database.py | SQLite (basic) | NO | DELETE |
| **Entity Extraction** | CRX-Newsletter-Brain | summarizer.py | Ollama (external AI) | NO | MERGE |
| **Topic Detection** | CRX-Newsletter-Brain | summarizer.py | Ollama (external AI) | NO | MERGE |

### Critical Finding

**ALL INTELLIGENCE IS EXTERNAL AI DEPENDENCY.** No constitutional intelligence system. All intelligence depends on Ollama (external AI). All intelligence is projection, not foundation.

**RECOMMENDATION:** Merge Ollama integrations into single constitutional projection. Delete SQLite retrieval. Intelligence is projection, not foundation.

---

## PHASE 8: BUILD DEPENDENCY GRAPH

### repository_dependency_graph.md

**PING Dependencies:**
- Imports: express, pg, pino, next, react, react-dom, lucide-react
- Runtime Coupling: PostgreSQL (external), Ollama (external)
- Storage Coupling: PostgreSQL (external)
- Deployment Coupling: None
- Duplicated Foundations: None
- Circular Dependencies: None
- Orphan Repositories: None

**Brain Dependencies:**
- Imports: None (documentation-only)
- Runtime Coupling: None
- Storage Coupling: None
- Deployment Coupling: None
- Duplicated Foundations: None
- Circular Dependencies: None
- Orphan Repositories: None

**CRX-Digestion-Worker Dependencies:**
- Imports: feedparser, requests, flask, sqlite3
- Runtime Coupling: Ollama (external AI)
- Storage Coupling: SQLite (file-based)
- Deployment Coupling: docker-compose
- Duplicated Foundations: SQLite (duplicate with CRX-Newsletter-Brain)
- Circular Dependencies: None
- Orphan Repositories: None

**CRX-Newsletter-Brain Dependencies:**
- Imports: imaplib, flask, sqlite3
- Runtime Coupling: Ollama (external AI)
- Storage Coupling: SQLite (file-based)
- Deployment Coupling: docker-compose
- Duplicated Foundations: SQLite (duplicate with CRX-Digestion-Worker)
- Circular Dependencies: None
- Orphan Repositories: None

**PING-Observatory Dependencies:**
- Imports: matplotlib, networkx
- Runtime Coupling: None
- Storage Coupling: None
- Deployment Coupling: None
- Duplicated Foundations: None
- Circular Dependencies: None
- Orphan Repositories: None

**Research-Pipeline Dependencies:**
- Imports: None
- Runtime Coupling: None
- Storage Coupling: None
- Deployment Coupling: None
- Duplicated Foundations: None
- Circular Dependencies: None
- Orphan Repositories: YES (orphaned, not referenced)

**CRX-Remote Dependencies:**
- Imports: Same as PING (duplicate)
- Runtime Coupling: Same as PING (duplicate)
- Storage Coupling: Same as PING (duplicate)
- Deployment Coupling: Same as PING (duplicate)
- Duplicated Foundations: DUPLICATE OF PING
- Circular Dependencies: None
- Orphan Repositories: NO (mirror of PING)

**CRX-Backup Dependencies:**
- Imports: Same as CRX-Remote (duplicate)
- Runtime Coupling: Same as CRX-Remote (duplicate)
- Storage Coupling: Same as CRX-Remote (duplicate)
- Deployment Coupling: Same as CRX-Remote (duplicate)
- Duplicated Foundations: DUPLICATE OF CRX-REMOTE
- Circular Dependencies: None
- Orphan Repositories: NO (backup of CRX-Remote)

### Critical Finding

**DUPLICATE REPOSITORIES:** CRX-Remote is duplicate of PING. CRX-Backup is backup of CRX-Remote.

**ORPHAN REPOSITORY:** Research-Pipeline is orphaned (not referenced).

**DUPLICATE FOUNDATIONS:** SQLite is duplicated across CRX-Digestion-Worker and CRX-Newsletter-Brain.

**EXTERNAL DEPENDENCIES:** All repositories depend on external systems (PostgreSQL, Ollama, SQLite).

**RECOMMENDATION:** Delete CRX-Remote, CRX-Backup, Research-Pipeline. Consolidate SQLite usage. Implement constitutional object store to eliminate external dependencies.

---

## PHASE 9: SURVIVOR SELECTION

### repository_survivor_matrix.md

| Repository | Decision | Reason | Target |
| ---------- | -------- | ------ | ------ |
| PING | SURVIVES | Executing runtime, minimal HTTP proxy chain | Keep as runtime foundation |
| Brain | SURVIVES | Constitutional authority, comprehensive documentation | Keep as constitutional reference |
| CRX-Digestion-Worker | MERGE | RSS ingestion logic only | Merge into PING as constitutional projection |
| CRX-Newsletter-Brain | MERGE | Yahoo ingestion logic only | Merge into PING as constitutional projection |
| PING-Observatory | ARCHIVE | Visualization tool, not constitutional | Archive for reference |
| Research-Pipeline | DELETE | Orphaned, not referenced, unknown purpose | None |
| CRX-Remote | DELETE | Duplicate of PING | None |
| CRX-Backup | DELETE | Backup-only duplicate | None |

### Critical Finding

**SURVIVORS:** 2 (PING, Brain)
**MERGES:** 2 (CRX-Digestion-Worker, CRX-Newsletter-Brain)
**ARCHIVES:** 1 (PING-Observatory)
**DELETIONS:** 3 (Research-Pipeline, CRX-Remote, CRX-Backup)

**RECOMMENDATION:** Consolidate from 8 repositories to 2 repositories. Merge CRX workers into PING as constitutional projections. Delete all duplicates and orphans.

---

## PHASE 10: CONSTITUTIONAL CONSOLIDATION MAP

### Foundations

**Authoritative Constitutional Primitives:**
- **NONE EXIST.** No constitutional object system exists.
- **NONE EXIST.** No constitutional event system exists.
- **NONE EXIST.** No constitutional replay system exists.
- **NONE EXIST.** No constitutional identity system exists.
- **NONE EXIST.** No constitutional trust system exists.
- **NONE EXIST.** No constitutional lineage system exists.

**Non-Foundational Primitives:**
- PING: PostgreSQL artifacts (non-constitutional)
- PING: Minimal event logging (non-constitutional)
- PING: Canonicalization library (non-constitutional)
- CRX-Digestion-Worker: SQLite articles (non-constitutional)
- CRX-Newsletter-Brain: SQLite newsletters (non-constitutional)

### Projections

**Recoverable Systems:**
- CRX-Digestion-Worker: RSS ingestion (recoverable from constitutional primitives)
- CRX-Newsletter-Brain: Yahoo ingestion (recoverable from constitutional primitives)
- PING: HTTP proxy to Ollama (recoverable from constitutional primitives)
- CRX-Digestion-Worker: SQLite search (recoverable from constitutional retrieval)
- CRX-Newsletter-Brain: SQLite search (recoverable from constitutional retrieval)
- CRX-Digestion-Worker: Flask dashboard (recoverable from constitutional UI)
- CRX-Newsletter-Brain: Flask dashboard (recoverable from constitutional UI)
- CRX-Digestion-Worker: Ollama summarization (recoverable from constitutional intelligence)
- CRX-Newsletter-Brain: Ollama summarization (recoverable from constitutional intelligence)

### Duplicates

**Competing Implementations:**
- Object System: PostgreSQL artifacts (PING) vs SQLite articles (CRX-Digestion-Worker) vs SQLite newsletters (CRX-Newsletter-Brain)
- Storage: PostgreSQL (PING) vs SQLite (CRX-Digestion-Worker) vs SQLite (CRX-Newsletter-Brain)
- Knowledge: PING knowledge/ vs CRX-Digestion-Worker knowledge/ vs CRX-Newsletter-Brain knowledge/
- Workflow: RSS worker (CRX-Digestion-Worker) vs Yahoo worker (CRX-Newsletter-Brain)
- Intelligence: Ollama summarization (CRX-Digestion-Worker) vs Ollama summarization (CRX-Newsletter-Brain)
- UI: Flask dashboard (CRX-Digestion-Worker) vs Flask dashboard (CRX-Newsletter-Brain)

### Theater

**Non-Executing Architecture:**
- PING constitution/ (documentation-only, not executing)
- PING vos/ (documentation-only, not executing)
- PING knowledge/ (documentation-only, not executing)
- PING infra/ (empty, not executing)
- PING workers/ (YAML files, no implementation)
- PING runtime/adapters/ (never used)
- Brain entire repository (documentation-only, not executing)

### Survivors

**Systems Retained:**
- PING: Gateway (HTTP proxy to Ollama)
- PING: Commit Service (artifact persistence)
- PING: Runtime/Replay (canonicalization library)
- Brain: Constitutional documentation (authoritative reference)

### Merge Targets

**Systems Consolidated:**
- CRX-Digestion-Worker → PING (RSS ingestion as constitutional projection)
- CRX-Newsletter-Brain → PING (Yahoo ingestion as constitutional projection)
- SQLite databases → Constitutional object store
- Markdown archives → Constitutional object store
- Ollama integrations → Single constitutional intelligence projection
- Flask dashboards → Single constitutional UI projection

### Deletions

**Systems Removed:**
- Research-Pipeline (orphaned)
- CRX-Remote (duplicate of PING)
- CRX-Backup (backup-only)
- PING constitution/ (documentation-only)
- PING vos/ (documentation-only)
- PING knowledge/ (documentation-only)
- PING infra/ (empty)
- PING workers/ (YAML files, no implementation)
- PING runtime/adapters/ (never used)
- SQLite databases (knowledge.db, newsletters.db)
- Markdown archives (knowledge/ directories)

### Final Constitutional Core

**Minimal Surviving Kernel:**

**Layer 0 — Constitutional Objects:**
- **DOES NOT EXIST.** Must implement constitutional object store.
- Replace PostgreSQL artifacts with constitutional objects.
- Replace SQLite articles with constitutional objects.
- Replace SQLite newsletters with constitutional objects.

**Layer 1 — Immutable Events:**
- **DOES NOT EXIST.** Must implement constitutional event log.
- Replace minimal event logging with constitutional event log.
- Record all state changes as constitutional events.

**Layer 2 — Replay Authority:**
- **DOES NOT EXIST.** Must implement constitutional replay engine.
- Replace canonicalization library with constitutional replay engine.
- Implement deterministic replay from events.

**Layer 3 — Canonical State:**
- **DOES NOT EXIST.** Must implement canonical state projection.
- Derive state from replay of events.
- Materialize state on demand.

**Layer 4+ — Projections:**
- RSS ingestion (constitutional projection)
- Yahoo ingestion (constitutional projection)
- HTTP proxy to Ollama (constitutional projection)
- Ollama intelligence (constitutional projection)
- Flask dashboard (constitutional projection)

### Final Evaluation

**Where is the real object authority?**
- **NONE EXISTS.** No constitutional object authority. Must implement.

**Where is the real event authority?**
- **NONE EXISTS.** No constitutional event authority. Must implement.

**Where is replay authority?**
- **NONE EXISTS.** No constitutional replay authority. Must implement.

**Which repositories actually execute?**
- PING (Gateway, Commit Service, Runtime/Replay)
- CRX-Digestion-Worker (RSS Worker, Dashboard)
- CRX-Newsletter-Brain (Yahoo Worker, Dashboard)
- PING-Observatory (Observatory)

**Which systems are projections?**
- All executing systems are projections (non-constitutional).
- All intelligence systems are projections (external AI dependency).
- All storage systems are projections (external database dependency).

**Which systems are duplicated?**
- Object systems (3 competing implementations)
- Storage systems (3 competing implementations)
- Knowledge systems (3 competing implementations)
- Workflow systems (2 competing implementations)
- Intelligence systems (2 competing implementations)
- UI systems (2 competing implementations)

**Which systems are theater?**
- PING constitution/ (documentation-only)
- PING vos/ (documentation-only)
- PING knowledge/ (documentation-only)
- PING infra/ (empty)
- PING workers/ (YAML files, no implementation)
- Brain entire repository (documentation-only)

**Which systems survive?**
- PING (runtime foundation)
- Brain (constitutional authority)

**Which systems are deleted?**
- Research-Pipeline (orphaned)
- CRX-Remote (duplicate)
- CRX-Backup (backup-only)
- PING constitution/, vos/, knowledge/, infra/, workers/ (dead code)
- SQLite databases, markdown archives (non-constitutional storage)

**What is the minimum constitutional kernel?**
- **Layer 0:** Constitutional Object Store (must implement)
- **Layer 1:** Constitutional Event Log (must implement)
- **Layer 2:** Constitutional Replay Engine (must implement)
- **Layer 3:** Canonical State Projection (must implement)
- **Layer 4+:** Projections (RSS ingestion, Yahoo ingestion, HTTP proxy, Ollama intelligence, Flask dashboard)

**CONCLUSION:** No constitutional primitives exist. All systems are non-constitutional projections. Massive duplication across object systems, storage systems, knowledge systems. Immediate consolidation required. Implement constitutional foundations (Objects + Events + Replay) first. Defer all projections until foundations are solid.
