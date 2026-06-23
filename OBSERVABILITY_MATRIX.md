# OBSERVABILITY_MATRIX

**Date:** 2026-06-22  
**Phase:** Phase 1 - Open WebUI Operational Surface Audit  
**Purpose:** Inventory everything visible from Open WebUI  
**Status:** COMPLETE

---

## AUDIT METHODOLOGY

**Surface:** Open WebUI (http://localhost:3000)  
**Access Method:** Direct web interface inspection  
**Observation Type:** UI visibility, API accessibility, configuration exposure  

---

## CAPABILITY AUDIT

### Infrastructure

**Status:** NOT VISIBLE

**What's Missing:**
- Service status dashboard
- Container health monitoring
- Network topology
- Resource utilization
- Service dependencies

**Available via Mission Control:** YES (`GET /infrastructure/status`)

**Integration Required:** Custom API or tool integration

---

### Credentials

**Status:** NOT VISIBLE

**What's Missing:**
- Credential inventory
- Credential status
- Rotation status
- Risk assessment
- Storage locations

**Available via Mission Control:** YES (`GET /credentials/inventory`)

**Integration Required:** Custom API or tool integration

---

### Memory

**Status:** NOT VISIBLE

**What's Missing:**
- Memory statistics
- Event counts
- Projection status
- Collection information
- Memory graph

**Available via Mission Control:** YES (`GET /memory/stats`)

**Integration Required:** Custom API or tool integration

---

### Events

**Status:** NOT VISIBLE

**What's Missing:**
- Recent events
- Event summary
- Event types
- Event streams
- Event history

**Available via Mission Control:** YES (`GET /events/recent`, `GET /events/summary`)

**Integration Required:** Custom API or tool integration

---

### Lineage

**Status:** NOT VISIBLE

**What's Missing:**
- Lineage graph
- Object relationships
- Dependency tracking
- Lineage history
- Root objects

**Available via Mission Control:** YES (`GET /lineage/graph`)

**Integration Required:** Custom API or tool integration

---

### Replay

**Status:** NOT VISIBLE

**What's Missing:**
- Replay status
- Replay progress
- Replay history
- Replay configuration
- Replay controls

**Available via Mission Control:** YES (`GET /replay/status`)

**Integration Required:** Custom API or tool integration

---

### Qdrant

**Status:** NOT VISIBLE

**What's Missing:**
- Qdrant health
- Collection status
- Vector counts
- Search statistics
- Collection management

**Available via Mission Control:** YES (`GET /qdrant/health`)

**Integration Required:** Custom API or tool integration

---

### Ollama

**Status:** PARTIALLY VISIBLE

**What's Visible:**
- Model selection dropdown
- Model information (name, size)
- Chat completion interface

**What's Missing:**
- Model inventory
- Model health
- Model statistics
- Model management
- Model performance metrics

**Available via Mission Control:** YES (`GET /ollama/models`)

**Integration Required:** Enhanced model inventory

---

### Backups

**Status:** NOT VISIBLE

**What's Missing:**
- Backup status
- Backup history
- Backup configuration
- Backup schedules
- Backup verification

**Available via Mission Control:** YES (`GET /backup/status`)

**Integration Required:** Custom API or tool integration

---

### Health

**Status:** NOT VISIBLE

**What's Missing:**
- System health dashboard
- Service health indicators
- Health history
- Health alerts
- Health trends

**Available via Mission Control:** YES (`GET /health`, `GET /infrastructure/status`)

**Integration Required:** Health dashboard integration

---

### Configuration

**Status:** NOT VISIBLE

**What's Missing:**
- System configuration
- Environment variables
- Service configuration
- Network configuration
- Configuration validation

**Available via Mission Control:** NO

**Integration Required:** Configuration endpoint to be implemented

---

### Models

**Status:** PARTIALLY VISIBLE

**What's Visible:**
- Model selection in chat interface
- Model names
- Model sizes

**What's Missing:**
- Full model inventory
- Model capabilities
- Model performance
- Model versions
- Model metadata

**Available via Mission Control:** YES (`GET /ollama/models`)

**Integration Required:** Enhanced model inventory

---

### Collections

**Status:** NOT VISIBLE

**What's Missing:**
- Collection inventory
- Collection statistics
- Collection health
- Collection management
- Collection metadata

**Available via Mission Control:** PARTIAL (`GET /qdrant/health` includes collection info)

**Integration Required:** Collection management endpoint

---

## SUMMARY MATRIX

| Capability | Open WebUI Visibility | Mission Control Available | Integration Required |
|------------|---------------------|---------------------------|---------------------|
| Infrastructure | NOT VISIBLE | YES | Custom API |
| Credentials | NOT VISIBLE | YES | Custom API |
| Memory | NOT VISIBLE | YES | Custom API |
| Events | NOT VISIBLE | YES | Custom API |
| Lineage | NOT VISIBLE | YES | Custom API |
| Replay | NOT VISIBLE | YES | Custom API |
| Qdrant | NOT VISIBLE | YES | Custom API |
| Ollama | PARTIALLY VISIBLE | YES | Enhancement |
| Backups | NOT VISIBLE | YES | Custom API |
| Health | NOT VISIBLE | YES | Custom API |
| Configuration | NOT VISIBLE | NO | To be implemented |
| Models | PARTIALLY VISIBLE | YES | Enhancement |
| Collections | NOT VISIBLE | PARTIAL | Enhancement |

---

## CONCLUSION

**Open WebUI Operational Surface:** LIMITED

**Current Visibility:** 0/13 capabilities fully visible  
**Partial Visibility:** 2/13 capabilities  
**No Visibility:** 11/13 capabilities  

**Mission Control Coverage:** 11/13 capabilities available via API  
**Missing:** Configuration endpoint  
**Partial:** Collections endpoint  

**Integration Required:** Custom API integration for 11 capabilities  
**Enhancement Required:** 2 capabilities (Ollama, Models)  

**Operator Observability:** NOT CERTIFIED via Open WebUI alone  
**Alternative:** Mission Control API provides full observability  
