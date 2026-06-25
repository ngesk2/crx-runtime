# AUTHORITY MAP

**Generated:** 2026-06-22  
**Purpose:** Map authority sources and their relationships  
**Authority:** C:\PING\vault

---

## AUTHORITY HIERARCHY

```
PostgreSQL (Canonical State)
    ↓
Qdrant (Vector Projection)
    ↓
Mission Control (Observability & Control)
    ↓
Vault (Human-Readable Authority)
    ↓
Google Drive (Survivability Layer)
```

---

## CONSTITUTIONAL AUTHORITY

### Layer 0: Constitution
**Source:** `vault/constitution/CONSTITUTION.md`  
**Authority:** HIGHEST  
**Purpose:** Foundational constitutional document  
**Projection:** Qdrant constitutional_documents collection  
**Backup:** Google Drive PING_BACKUPS

### Layer 1: Laws
**Source:** `vault/laws/`  
**Authority:** HIGH  
**Purpose:** System laws and constraints  
**Documents:**
- IDENTITY_LAW.md
- REPLAY_LAW.md
- WITNESS_LAW.md

**Projection:** Qdrant constitutional_documents collection  
**Backup:** Google Drive PING_BACKUPS

---

## OPERATIONAL AUTHORITY

### Layer 2: Audits
**Source:** `vault/audits/`  
**Authority:** OPERATIONAL  
**Purpose:** System audits and certifications  
**Documents:**
- CONTINUITY_DESTRUCTION_AUDIT.md
- CREDENTIAL_AUTHORITY_CENSUS.md
- EXECUTION_SUMMARY.md
- HUMAN_OBSERVABILITY_CERTIFICATION.md
- POSTGRES_SURVIVABILITY_REPORT.md
- QDRANT_OPERATIONAL_PROOF.md
- REALITY_CHECK.md

**Projection:** Qdrant constitutional_documents collection  
**Backup:** Google Drive PING_BACKUPS

### Layer 3: Capabilities
**Source:** `vault/capabilities/`  
**Authority:** CAPABILITY  
**Purpose:** Capability matrices and integration docs  
**Documents:**
- CREDENTIAL_SURVIVABILITY_MATRIX.md
- MISSION_CONTROL_CAPABILITY_MATRIX.md
- OBSERVABILITY_MATRIX.md
- OPENWEBUI_MISSION_CONTROL_INTEGRATION.md

**Projection:** Qdrant constitutional_documents collection  
**Backup:** Google Drive PING_BACKUPS

### Layer 4: Runbooks
**Source:** `vault/runbooks/`  
**Authority:** OPERATIONAL  
**Purpose:** Operator procedures  
**Documents:**
- OPERATOR_RUNBOOKS.md

**Projection:** Qdrant constitutional_documents collection  
**Backup:** Google Drive PING_BACKUPS

---

## SYSTEM AUTHORITY

### PostgreSQL
**Role:** Canonical state  
**Authority:** ABSOLUTE  
**Tables:**
- events (append-only event log)
- credentials (credential metadata)
- lineage (identity lineage)

### Qdrant
**Role:** Vector projection  
**Authority:** PROJECTION  
**Collections:**
- constitutional_documents (16 docs)
- tier2_operational (0 docs)
- tier3_working (0 docs)

### Mission Control
**Role:** Observability and control  
**Authority:** OPERATIONAL  
**Endpoints:**
- /constitution/search
- /constitution/doc/{id}
- /constitution/authority
- /backup/status
- /backup/manual
- /backup/verify
- /backup/restore-verify
- /infrastructure/status
- /memory/stats
- /models/capabilities
- /models/validate

### MCP
**Role:** Tool access layer  
**Authority:** PROXY  
**Tools:**
- search_constitution
- get_constitution_doc
- search_memory
- memory_stats
- recent_events
- event_summary
- lineage_lookup
- continuity_status
- replay_status
- credential_inventory
- infrastructure_status

### Open WebUI
**Role:** Operator interface  
**Authority:** PRESENTATION  
**Access:**
- Constitutional search via MCP
- Memory search via MCP
- Document lookup via MCP

### Ollama
**Role:** Reasoning and embeddings  
**Authority:** COMPUTATION  
**Models:**
- nomic-embed-text (embeddings)
- llama3 (chat)
- qwen2.5-coder:7b (chat)
- qwen2.5-coder:14b (chat)

### Google Drive
**Role:** Survivability layer  
**Authority:** BACKUP  
**Backup Scope:**
- VAULT_INDEX.md
- AUTHORITY_MAP.md
- HASH_MANIFEST.json
- constitution/**/*.md
- laws/**/*.md
- audits/**/*.md
- runbooks/**/*.md

---

## AUTHORITY FLOW

1. **Human writes** → Vault markdown files
2. **Projection Worker** → Qdrant constitutional_documents
3. **Mission Control** → Observability endpoints
4. **MCP** → Tool access layer
5. **Open WebUI** → Operator interface
6. **Google Drive** → Survivability backup

---

## AUTHORITY VALIDATION

**Verification Query:** "Why is replay deterministic?"  
**Expected Result:** REPLAY_LAW.md retrieved from Qdrant  
**Score Threshold:** > 0.6  
**Status:** ✅ VERIFIED (score: 0.669)

---

## LAST UPDATED

2026-06-22 - Initial authority map generated
