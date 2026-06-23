# PHASE 8: MINIMUM SURVIVABLE SYSTEM

**Audit Type:** OWNERSHIP PROOF + EXECUTION REALITY  
**Scope:** Determine smallest surviving system (Layer 0, Layer 1, Layer 2, Layer 3)  
**Evidence Only:** Running code only, not documentation  

---

## CRITICAL FINDING

**PostgreSQL events table is NOT required for survival.** Applications use SQLite as authoritative storage. Events are emitted after SQLite writes. If events are lost, applications can still function from SQLite.

**Brain's event_emitter.py is NOT required for survival.** Applications can function without event emission. Event emission is optional (catch-all error handling).

**PING Gateway is NOT required for survival.** Applications don't use PING Gateway. PING Gateway is only used for chat API.

---

## LAYER 0: CONSTITUTIONAL ROOT

### Files

**NONE.** No constitutional files are required for survival. Applications use SQLite as authoritative storage, not constitutional primitives.

### Services

**NONE.** No constitutional services are required for survival. Applications don't use PING's constitutional primitives.

### Databases

**NONE.** No constitutional databases are required for survival. Applications use SQLite, not PostgreSQL events table.

### Boot Order

**N/A.** No constitutional layer is required for survival.

### Capabilities Retained

**NONE.** No constitutional capabilities are retained in Layer 0.

---

## LAYER 1: APPLICATION STATE

### Files

**C:\Users\nolan\CascadeProjects\crx-digestion-worker\knowledge.db**  
**Type:** SQLite database  
**Purpose:** Authoritative storage for articles and sources  
**Required:** YES (catastrophic if deleted)

**C:\Users\nolan\CascadeProjects\crx-newsletter-brain\newsletters.db**  
**Type:** SQLite database  
**Purpose:** Authoritative storage for newsletters and digests  
**Required:** YES (catastrophic if deleted)

### Services

**crx-digestion-worker (worker)**  
**Container:** digestion-worker  
**Purpose:** RSS processing and article summarization  
**Required:** YES (required for RSS processing)

**crx-newsletter-brain (worker)**  
**Container:** newsletter-brain-worker  
**Purpose:** Newsletter processing and digest generation  
**Required:** YES (required for newsletter processing)

### Databases

**SQLite (crx-digestion-worker knowledge.db)**  
**Type:** SQLite database file  
**Purpose:** Authoritative storage for articles and sources  
**Required:** YES (catastrophic if deleted)

**SQLite (crx-newsletter-brain newsletters.db)**  
**Type:** SQLite database file  
**Purpose:** Authoritative storage for newsletters and digests  
**Required:** YES (catastrophic if deleted)

### Boot Order

1. Start SQLite databases (knowledge.db, newsletters.db)
2. Start crx-digestion-worker worker
3. Start crx-newsletter-brain worker

### Capabilities Retained

- **Store objects:** YES (SQLite databases)
- **Record events:** NO (event emission is optional)
- **Replay state:** NO (no replay mechanism)
- **Serve users:** YES (worker services)

---

## LAYER 2: INFRASTRUCTURE

### Files

**C:\Users\nolan\CascadeProjects\crx-digestion-worker\knowledge\**  
**Type:** Filesystem (markdown files)  
**Purpose:** Authoritative archive for articles  
**Required:** YES (catastrophic if deleted)

**C:\Users\nolan\CascadeProjects\crx-newsletter-brain\knowledge\**  
**Type:** Filesystem (markdown files)  
**Purpose:** Authoritative archive for newsletters  
**Required:** YES (catastrophic if deleted)

**C:\Users\nolan\CascadeProjects\crx-newsletter-brain\digests\**  
**Type:** Filesystem (markdown files)  
**Purpose:** Authoritative archive for digests  
**Required:** NO (can be regenerated from SQLite)

### Services

**crx-ollama-worker**  
**Container:** crx-ollama-worker  
**Purpose:** Ollama inference service  
**Required:** YES (required for summarization)

### Databases

**NONE.** No infrastructure databases are required for survival.

### Boot Order

1. Start crx-ollama-worker
2. Start filesystem (knowledge/, digests/ directories)

### Capabilities Retained

- **Store objects:** YES (markdown files)
- **Record events:** NO
- **Replay state:** NO
- **Serve users:** YES (inference service)

---

## LAYER 3: INTERFACES

### Files

**C:\Users\nolan\PING\CascadeProjects\infra\ui-next\**  
**Type:** Next.js application  
**Purpose:** UI for CRX system  
**Required:** NO (optional for user interaction)

### Services

**crx-ui-next**  
**Container:** crx-ui-next  
**Purpose:** UI for CRX system  
**Required:** NO (optional for user interaction)

### Databases

**NONE.** No interface databases are required for survival.

### Boot Order

1. Start crx-ui-next (optional)

### Capabilities Retained

- **Store objects:** NO
- **Record events:** NO
- **Replay state:** NO
- **Serve users:** YES (UI)

---

## SUMMARY

### Minimum Survivable System

| Layer | Files | Services | Databases | Boot Order | Capabilities Retained |
|-------|-------|----------|-----------|------------|----------------------|
| Layer 0 (Constitutional Root) | NONE | NONE | NONE | N/A | NONE |
| Layer 1 (Application State) | knowledge.db, newsletters.db | crx-digestion-worker, crx-newsletter-brain | SQLite (knowledge.db, newsletters.db) | 1. SQLite databases, 2. Workers | Store objects, Serve users |
| Layer 2 (Infrastructure) | knowledge/, digests/ | crx-ollama-worker | NONE | 1. crx-ollama-worker, 2. Filesystem | Store objects, Serve users |
| Layer 3 (Interfaces) | ui-next/ | crx-ui-next | NONE | 1. crx-ui-next (optional) | Serve users |

### Critical Findings

1. **Layer 0 (Constitutional Root) is NOT required for survival.** No constitutional files, services, or databases are required. Applications use SQLite as authoritative storage, not constitutional primitives.

2. **PostgreSQL events table is NOT required for survival.** Applications use SQLite as authoritative storage. Events are emitted after SQLite writes. If events are lost, applications can still function from SQLite.

3. **Brain's event_emitter.py is NOT required for survival.** Applications can function without event emission. Event emission is optional (catch-all error handling in event_emitter.py).

4. **PING Gateway is NOT required for survival.** Applications don't use PING Gateway. PING Gateway is only used for chat API.

5. **SQLite databases are REQUIRED for survival.** knowledge.db and newsletters.db are the authoritative sources for application state. If deleted, catastrophic data loss occurs.

6. **Markdown files are REQUIRED for survival.** knowledge/ directories are the authoritative archives. If deleted, catastrophic data loss occurs.

7. **crx-ollama-worker is REQUIRED for survival.** Ollama inference service is required for summarization.

8. **Workers are REQUIRED for survival.** crx-digestion-worker and crx-newsletter-brain workers are required for RSS and newsletter processing.

9. **crx-ui-next is NOT required for survival.** UI is optional for user interaction. Applications can function without UI.

### Answer

**What is the smallest set that still:**

**Stores objects?**
**SQLite databases (knowledge.db, newsletters.db) and markdown files (knowledge/, digests/ directories).**

**Records events?**
**NONE.** Event recording is not required for survival. Applications can function without event emission.

**Replays state?**
**NONE.** Replay is not required for survival. No replay mechanism exists.

**Serves users?**
**Workers (crx-digestion-worker, crx-newsletter-brain) and inference service (crx-ollama-worker). UI (crx-ui-next) is optional.

**Minimum Survivable System:**
- **Layer 0:** NONE (no constitutional layer required)
- **Layer 1:** SQLite databases (knowledge.db, newsletters.db), Workers (crx-digestion-worker, crx-newsletter-brain)
- **Layer 2:** crx-ollama-worker, Markdown files (knowledge/, digests/ directories)
- **Layer 3:** NONE (UI is optional)

**Total Components Required:**
- 2 SQLite databases (knowledge.db, newsletters.db)
- 2 Workers (crx-digestion-worker, crx-newsletter-brain)
- 1 Inference service (crx-ollama-worker)
- 2 Filesystem directories (knowledge/, digests/)

**Total Components NOT Required:**
- PostgreSQL events table
- Brain's event_emitter.py
- PING Gateway
- PING's replay engine (30 TypeScript files)
- PING's artifact store
- PING's commit service
- Brain's canonical state schemas
- Brain's services (Qdrant, Neo4j, Temporal, Kafka, Zookeeper, DuckDB, OpenSearch, Tika, Ollama, Open WebUI)
- Open WebUI (crx-digestion-worker)
- crx-ui-next (optional)
