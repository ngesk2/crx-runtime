# OPERATOR RUNBOOKS

**Date:** 2026-06-22  
**Phase:** Phase 6 - Operator Runbooks  
**Purpose:** Executable procedures for system recovery  
**Status:** COMPLETE

---

## RUNBOOK: Rebuild Qdrant

**Purpose:** Rebuild Qdrant vector database from Postgres events

**Commands:**
```powershell
# 1. Delete existing Qdrant collections
docker exec ping-mission-control python -c "
from qdrant_client import QdrantClient
import os
client = QdrantClient(url=os.getenv('QDRANT_URL'), api_key=os.getenv('QDRANT_API_KEY'))
collections = client.get_collections()
for c in collections.collections:
    client.delete_collection(c.name)
print('Collections deleted')
"

# 2. Create target collection
docker exec ping-mission-control python -c "
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
import os
client = QdrantClient(url=os.getenv('QDRANT_URL'), api_key=os.getenv('QDRANT_API_KEY'))
client.create_collection(
    collection_name='constitutional_memory',
    vectors_config=VectorParams(size=768, distance=Distance.COSINE)
)
print('Collection created')
"

# 3. Replay events to Qdrant (requires projection worker)
# Note: Projection worker not yet implemented
# Manual replay required via Mission Control API
```

**Expected Output:**
- Collections deleted: [list of deleted collections]
- Collection created: constitutional_memory

**Verification Steps:**
```powershell
# Verify collection exists
powershell -Command "Invoke-WebRequest -Uri http://localhost:8000/qdrant/health -UseBasicParsing | Select-Object -ExpandProperty Content"

# Expected: "collection_exists": true
```

---

## RUNBOOK: Replace Ollama

**Purpose:** Replace Ollama inference service

**Commands:**
```powershell
# 1. Stop existing Ollama container
docker stop brain-ollama
docker rm brain-ollama

# 2. Pull new Ollama image
docker pull ollama/ollama:latest

# 3. Start new Ollama container
cd brainos\orchestration\infrastructure\docker\compose
docker-compose -f docker-compose-mission-control.yml --env-file ../../../config/environments/.env.mission-control up -d ollama

# 4. Pull required models
docker exec brain-ollama ollama pull qwen2.5-coder:7b
docker exec brain-ollama ollama pull qwen2.5-coder:14b
```

**Expected Output:**
- Container: brain-ollama running
- Models: qwen2.5-coder:7b, qwen2.5-coder:14b available

**Verification Steps:**
```powershell
# Verify Ollama health
powershell -Command "Invoke-WebRequest -Uri http://localhost:8000/ollama/models -UseBasicParsing | Select-Object -ExpandProperty Content"

# Expected: "status": "healthy", models list
```

---

## RUNBOOK: Replace Open WebUI

**Purpose:** Replace Open WebUI frontend service

**Commands:**
```powershell
# 1. Stop existing Open WebUI container
docker stop brain-openwebui
docker rm brain-openwebui

# 2. Pull new Open WebUI image
docker pull ghcr.io/open-webui/open-webui:latest

# 3. Start new Open WebUI container
cd brainos\orchestration\infrastructure\docker\compose
docker-compose -f docker-compose-mission-control.yml --env-file ../../../config/environments/.env.mission-control up -d openwebui

# 4. Wait for initialization (30 seconds)
Start-Sleep -Seconds 30
```

**Expected Output:**
- Container: brain-openwebui running
- Health: healthy

**Verification Steps:**
```powershell
# Verify Open WebUI accessible
powershell -Command "Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing | Select-Object -ExpandProperty StatusCode"

# Expected: 200
```

---

## RUNBOOK: Restore Postgres

**Purpose:** Restore Postgres from backup

**Commands:**
```powershell
# 1. Stop Postgres container
docker stop brain-postgres

# 2. Backup current data (if needed)
docker run --rm -v compose_postgres_data:/data -v %cd%:/backup alpine tar czf /backup/postgres_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').tar.gz -C /data .

# 3. Delete volume
docker volume rm compose_postgres_data

# 4. Restore from backup (if backup exists)
# Note: rclone not configured, manual restore required
# Example: docker run --rm -v compose_postgres_data:/data -v /path/to/backup:/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /data

# 5. Start Postgres container
cd brainos\orchestration\infrastructure\docker\compose
docker-compose -f docker-compose-mission-control.yml --env-file ../../../config/environments/.env.mission-control up -d postgres

# 6. Wait for Postgres to be ready (10 seconds)
Start-Sleep -Seconds 10

# 7. Verify schema
docker exec brain-postgres psql -U postgres -d crx_runtime -c "\dt"
```

**Expected Output:**
- Container: brain-postgres running
- Tables: 6 tables (audit_log, events, lineage, objects, projections, system_metadata)

**Verification Steps:**
```powershell
# Verify Postgres health
powershell -Command "Invoke-WebRequest -Uri http://localhost:8000/infrastructure/status -UseBasicParsing | Select-Object -ExpandProperty Content"

# Expected: PostgreSQL status: "healthy"
```

---

## RUNBOOK: Restore Backups

**Purpose:** Restore system from Google Drive backup

**Commands:**
```powershell
# 1. Configure rclone (first time setup)
rclone config

# 2. List available backups
rclone ls gdrive:PING_BACKUPS

# 3. Download backup
rclone copy gdrive:PING_BACKUPS/postgres_backup_latest.tar.gz C:\temp\

# 4. Extract backup
tar -xzf C:\temp\postgres_backup_latest.tar.gz -C C:\temp\

# 5. Stop services
cd brainos\orchestration\infrastructure\docker\compose
docker-compose -f docker-compose-mission-control.yml --env-file ../../../config/environments/.env.mission-control down

# 6. Restore Postgres volume
docker run --rm -v compose_postgres_data:/data -v C:\temp:/backup alpine tar xzf /backup/postgres_data.tar.gz -C /data

# 7. Start services
docker-compose -f docker-compose-mission-control.yml --env-file ../../../config/environments/.env.mission-control up -d
```

**Expected Output:**
- Backup downloaded
- Volume restored
- Services running

**Verification Steps:**
```powershell
# Verify system health
powershell -Command "Invoke-WebRequest -Uri http://localhost:8000/continuity/status -UseBasicParsing | Select-Object -ExpandProperty Content"

# Expected: "continuity_status": "CERTIFIED"
```

**Note:** rclone not currently configured. This runbook requires rclone setup.

---

## RUNBOOK: Rotate Credentials

**Purpose:** Rotate system credentials

**Commands:**

### Rotate Postgres Password
```powershell
# 1. Generate new password
$newPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# 2. Update Postgres password
docker exec brain-postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD '$newPassword';"

# 3. Update environment file
(Get-Content brainos\orchestration\config\environments\.env.mission-control) -replace 'POSTGRES_PASSWORD=.*', "POSTGRES_PASSWORD=$newPassword" | Set-Content brainos\orchestration\config\environments\.env.mission-control

# 4. Restart Mission Control
docker restart ping-mission-control

# 5. Verify connection
powershell -Command "Invoke-WebRequest -Uri http://localhost:8000/health -UseBasicParsing | Select-Object -ExpandProperty Content"
```

### Rotate Qdrant API Key
```powershell
# 1. Generate new API key via Qdrant Cloud Console
# Manual step: https://cloud.qdrant.io/

# 2. Update environment file
$newApiKey = "your_new_api_key_here"
(Get-Content brainos\orchestration\config\environments\.env.mission-control) -replace 'QDRANT_API_KEY=.*', "QDRANT_API_KEY=$newApiKey" | Set-Content brainos\orchestration\config\environments\.env.mission-control

# 3. Restart Mission Control
docker restart ping-mission-control

# 4. Verify connection
powershell -Command "Invoke-WebRequest -Uri http://localhost:8000/qdrant/health -UseBasicParsing | Select-Object -ExpandProperty Content"
```

### Rotate WebUI Secret Key
```powershell
# 1. Generate new secret key
$secretKey = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})

# 2. Update environment file
(Get-Content brainos\orchestration\config\environments\.env.mission-control) -replace 'WEBUI_SECRET_KEY=.*', "WEBUI_SECRET_KEY=$secretKey" | Set-Content brainos\orchestration\config\environments\.env.mission-control

# 3. Restart Open WebUI
docker restart brain-openwebui

# 4. Verify accessibility
powershell -Command "Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing | Select-Object -ExpandProperty StatusCode"
```

**Expected Output:**
- Passwords updated
- Services restarted
- Connections verified

**Verification Steps:**
```powershell
# Verify all services healthy
powershell -Command "Invoke-WebRequest -Uri http://localhost:8000/infrastructure/status -UseBasicParsing | Select-Object -ExpandProperty Content"

# Expected: All services status: "healthy"
```

---

## RUNBOOK: Full System Recovery

**Purpose:** Recover entire system from Postgres only

**Commands:**
```powershell
# 1. Stop all services except Postgres
docker stop brain-openwebui ping-mission-control brain-qdrant brain-ollama

# 2. Verify Postgres is running
docker ps | findstr brain-postgres

# 3. Start services in order
cd brainos\orchestration\infrastructure\docker\compose

# Start Qdrant
docker-compose -f docker-compose-mission-control.yml --env-file ../../../config/environments/.env.mission-control up -d qdrant

# Start Ollama
docker-compose -f docker-compose-mission-control.yml --env-file ../../../config/environments/.env.mission-control up -d ollama

# Pull models
docker exec brain-ollama ollama pull qwen2.5-coder:7b
docker exec brain-ollama ollama pull qwen2.5-coder:14b

# Start Mission Control
docker-compose -f docker-compose-mission-control.yml --env-file ../../../config/environments/.env.mission-control up -d mission-control

# Start Open WebUI
docker-compose -f docker-compose-mission-control.yml --env-file ../../../config/environments/.env.mission-control up -d openwebui

# 4. Verify system health
Start-Sleep -Seconds 30
```

**Expected Output:**
- All containers running
- All services healthy

**Verification Steps:**
```powershell
# Verify continuity status
powershell -Command "Invoke-WebRequest -Uri http://localhost:8000/continuity/status -UseBasicParsing | Select-Object -ExpandProperty Content"

# Expected: "continuity_status": "CERTIFIED"
```

---

## RUNBOOK: Continuity Verification

**Purpose:** Verify system continuity after recovery

**Commands:**
```powershell
# 1. Check continuity status
powershell -Command "Invoke-WebRequest -Uri http://localhost:8000/continuity/status -UseBasicParsing | Select-Object -ExpandProperty Content"

# 2. Check infrastructure status
powershell -Command "Invoke-WebRequest -Uri http://localhost:8000/infrastructure/status -UseBasicParsing | Select-Object -ExpandProperty Content"

# 3. Check Postgres event count
docker exec brain-postgres psql -U postgres -d crx_runtime -c "SELECT COUNT(*) FROM events"

# 4. Check Qdrant collections
powershell -Command "Invoke-WebRequest -Uri http://localhost:8000/qdrant/health -UseBasicParsing | Select-Object -ExpandProperty Content"

# 5. Check Ollama models
powershell -Command "Invoke-WebRequest -Uri http://localhost:8000/ollama/models -UseBasicParsing | Select-Object -ExpandProperty Content"
```

**Expected Output:**
- continuity_status: "CERTIFIED"
- All services: "healthy"
- Event count: preserved
- Collections: available
- Models: available

---

## CONCLUSION

**Phase 6 Status:** COMPLETE

**Runbooks Created:** 7

**Coverage:**
- ✅ Rebuild Qdrant
- ✅ Replace Ollama
- ✅ Replace Open WebUI
- ✅ Restore Postgres
- ✅ Restore Backups
- ✅ Rotate Credentials
- ✅ Full System Recovery
- ✅ Continuity Verification

**Limitations:**
- Qdrant replay requires projection worker (not implemented)
- Backup restore requires rclone configuration (not configured)
- Credential rotation requires manual steps for external services

**Operator Capability:** PARTIAL

**Next:** Phase 7 - Final Certification
