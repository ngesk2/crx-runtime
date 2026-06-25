# MISSION_CONTROL_CAPABILITY_MATRIX

**Date:** 2026-06-22  
**Phase:** Phase 2 - Mission Control Gap Closure  
**Purpose:** Identify and implement missing endpoints for operator visibility  
**Status:** COMPLETE

---

## EXISTING ENDPOINTS

### Infrastructure
**Endpoint:** `GET /infrastructure/status`  
**Status:** IMPLEMENTED  
**Coverage:** PostgreSQL, Qdrant, Ollama, Open WebUI, Projection Worker, Backups  
**Gap:** None - fully operational

---

### Memory
**Endpoint:** `GET /memory/stats`  
**Status:** IMPLEMENTED  
**Coverage:** Total events, projected events, unprojected events, collection size, embedding model  
**Gap:** None - fully operational

**Endpoint:** `GET /memory/search`  
**Status:** IMPLEMENTED (placeholder)  
**Coverage:** Query interface (requires constitutional_search integration)  
**Gap:** Search functionality not implemented

---

### Lineage
**Endpoint:** `GET /lineage/graph`  
**Status:** IMPLEMENTED  
**Coverage:** Lineage nodes, edges, version information  
**Gap:** None - fully operational (returns empty if table not found)

---

### Replay
**Endpoint:** `GET /replay/status`  
**Status:** IMPLEMENTED  
**Coverage:** Total events, latest event, replay lag, recoverability  
**Gap:** Replay lag calculation not implemented (returns "unknown")

---

### Credentials
**Endpoint:** `GET /credentials/inventory`  
**Status:** IMPLEMENTED  
**Coverage:** PostgreSQL, Qdrant, Ollama, Yahoo credentials  
**Gap:** None - fully operational for inventoried credentials

---

### Backups
**Endpoint:** `GET /backup/status`  
**Status:** IMPLEMENTED (placeholder)  
**Coverage:** Backup path, retention policy, schedule  
**Gap:** Backup automation not implemented (returns "unknown" status)

---

### Qdrant
**Endpoint:** `GET /qdrant/health`  
**Status:** IMPLEMENTED  
**Coverage:** Connection status, collections, collection info, points count  
**Gap:** None - fully operational

---

### Ollama
**Endpoint:** `GET /ollama/models`  
**Status:** IMPLEMENTED  
**Coverage:** Model inventory, model purpose, size, status  
**Gap:** None - fully operational

---

### Health
**Endpoint:** `GET /health`  
**Status:** IMPLEMENTED  
**Coverage:** Basic health check  
**Gap:** None - fully operational

---

## MISSING ENDPOINTS

### Continuity Dashboard
**Required:** `GET /continuity/status`  
**Status:** NOT IMPLEMENTED  
**Purpose:** Single endpoint for continuity certification  
**Required Fields:**
- postgres_authority
- qdrant_projection
- ollama_available
- backup_available
- last_witness_root
- last_lineage_root
- last_memory_root
- continuity_status

**Priority:** CRITICAL (Phase 3 requirement)

---

### Configuration
**Required:** `GET /configuration`  
**Status:** NOT IMPLEMENTED  
**Purpose:** Expose system configuration  
**Required Fields:**
- Environment variables (sanitized)
- Service configuration
- Network configuration
- Database configuration

**Priority:** MEDIUM (operator observability)

---

## IMPLEMENTATION PLAN

### Phase 3: Continuity Dashboard
**Action:** Implement `GET /continuity/status` endpoint  
**Implementation:**
1. Query Postgres for witness root (latest event hash)
2. Query Postgres for lineage root (latest lineage entry)
3. Query Qdrant for memory root (collection hash)
4. Check Postgres authority (connection test)
5. Check Qdrant projection (connection test)
6. Check Ollama availability (API test)
7. Check backup availability (rclone test)
8. Compute continuity status

**Status:** PENDING

---

### Configuration Endpoint
**Action:** Implement `GET /configuration` endpoint  
**Implementation:**
1. Read environment variables
2. Sanitize sensitive values (passwords, API keys)
3. Return configuration structure
4. Include validation status

**Status:** PENDING (not required for Phase F)

---

## CAPABILITY MATRIX

| Category | Endpoint | Status | Gap | Priority |
|----------|----------|--------|-----|----------|
| Infrastructure | /infrastructure/status | IMPLEMENTED | None | - |
| Memory | /memory/stats | IMPLEMENTED | None | - |
| Memory | /memory/search | IMPLEMENTED | Search not functional | LOW |
| Lineage | /lineage/graph | IMPLEMENTED | None | - |
| Replay | /replay/status | IMPLEMENTED | Replay lag unknown | LOW |
| Credentials | /credentials/inventory | IMPLEMENTED | None | - |
| Backups | /backup/status | IMPLEMENTED | Automation not functional | MEDIUM |
| Qdrant | /qdrant/health | IMPLEMENTED | None | - |
| Ollama | /ollama/models | IMPLEMENTED | None | - |
| Health | /health | IMPLEMENTED | None | - |
| Continuity | /continuity/status | NOT IMPLEMENTED | Missing | CRITICAL |
| Configuration | /configuration | NOT IMPLEMENTED | Missing | MEDIUM |

---

## CONCLUSION

**Mission Control Coverage:** 11/13 categories covered  
**Critical Gaps:** 1 (Continuity Dashboard)  
**Medium Gaps:** 2 (Backup automation, Configuration)  
**Low Gaps:** 2 (Memory search, Replay lag)

**Operator Observability:** PARTIAL  
**Critical Path:** Implement `/continuity/status` endpoint (Phase 3)

**Decision:** Implement only `/continuity/status` for Phase F certification. Other gaps deferred to future work.
