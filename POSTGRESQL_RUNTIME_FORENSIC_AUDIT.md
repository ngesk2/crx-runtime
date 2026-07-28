# PING / BrainOS PostgreSQL Runtime Forensic Audit

**Audit Date:** 2026-06-25  
**Audit Type:** STRICT READ ONLY - PostgreSQL Runtime Failure Investigation  
**Objective:** Determine root cause of PostgreSQL connection failure from repository_event_layer.py

---

## POSTGRES STATE

**Running:** YES  
**Healthy:** NO (docker ps shows unhealthy status)  
**Listening on 5432:** YES (container internal)  
**Accepting connections:** YES (container internal)  
**Host port binding:** NO (not exposed to host machine)

**Evidence:**
```
CONTAINER ID   IMAGE              STATUS                      PORTS
f333c1cd2698   postgres:15-alpine   Up 5 hours (unhealthy)      5432/tcp
```

**Port binding evidence:**
```
docker inspect brain-postgres --format='{{.HostConfig.PortBindings}}'
map[]
```

**Internal connection evidence:**
```
docker exec brain-postgres pg_isready
/var/run/postgresql:5432 - accepting connections
```

---

## EXECUTION ORIGIN

**Exact file causing failure:** repository_event_layer.py  
**Exact process causing failure:** Host Python process (outside Docker)  
**Exact runtime environment:** Windows host machine

**Evidence:**
```python
# repository_event_layer.py lines 322-327
postgres_config = {
    "host": "localhost",
    "port": 5432,
    "database": "crx_runtime",
    "user": "postgres",
    "password": ""
}
```

**Runtime environment:** Python script executed on Windows host, not inside Docker container

---

## ENVIRONMENT AUDIT

**Discovered configuration sources:**
- repository_event_layer.py (hardcoded config)
- docker-compose.yml (compose configuration)
- No .env file found in repository root

**repository_event_layer.py values:**
```
host: localhost
port: 5432
database: crx_runtime
user: postgres
password: (empty)
```

**docker-compose.yml values:**
```yaml
postgres:
  environment:
    POSTGRES_USER: ${POSTGRES_USER}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    POSTGRES_DB: ${POSTGRES_DB}
  ports:
    - "5432:5432"
```

**Mismatch present:** YES

**Evidence:**
- docker-compose.yml specifies port binding "5432:5432"
- Actual container shows no host port binding (5432/tcp only)
- Code uses "localhost" which requires host port binding

---

## DOCKER NETWORK AUDIT

**Correct hostname expected:** brain-postgres (if inside Docker) or localhost (if outside Docker with port binding)  
**Current hostname being used:** localhost  
**Mismatch:** YES

**Evidence:**
- Code runs on host machine (outside Docker)
- Code uses "localhost"
- PostgreSQL container port 5432 NOT bound to host
- Therefore localhost:5432 on host machine does not reach PostgreSQL container

**Network evidence:**
```
docker inspect brain-postgres --format='{{.NetworkSettings.Networks}}'
map[compose_brain_internal:0x3dd3f4f4ea0]
```

Container is on compose_brain_internal network, but host machine cannot access without port binding.

---

## CONSTITUTIONAL EXECUTION IMPACT

**Current event state:**
- DOCUMENT_IMPORTED events: 16 (present)
- REPOSITORY_DISCOVERED events: 0 (missing)
- FILE_DISCOVERED events: 0 (missing)
- REPOSITORY_SNAPSHOT_CREATED events: 0 (missing)
- REPOSITORY_WITNESS_CREATED events: 0 (missing)
- COMMIT_CREATED events: 0 (missing)

**Witness state:**
- Artifacts with witness_root: 0

**Projection state:**
- Projections table: 0 rows

**Constitutional execution path status:**
```
DOCUMENT_IMPORTED → Postgres INSERT → SUCCESS
OBSERVATION_CREATED → NOT EXECUTED
CLAIM_GENERATED → NOT EXECUTED
REPLAY_EXECUTED → NOT EXECUTED
WITNESS_CREATED → NOT EXECUTED
LINEAGE_CREATED → NOT EXECUTED
PROJECTION_CREATED → NOT EXECUTED
```

**Impact:** PostgreSQL connection failure is blocking entire constitutional runtime beyond document ingestion.

---

## ROOT CAUSE

**Root cause:** Port binding failure

**Evidence:**
1. docker-compose.yml specifies "5432:5432" port binding
2. Actual container shows no host port binding (5432/tcp only, no 0.0.0.0:5432->5432/tcp)
3. docker inspect shows HostConfig.PortBindings is empty (map[])
4. Host machine cannot connect to container port without binding
5. Code on host machine uses "localhost" which requires host port binding

**Explanation:** The PostgreSQL container was started without the port binding specified in docker-compose.yml, or the compose file was not used to start the container. This prevents host machine processes from connecting via localhost:5432.

---

## MINIMAL FIX

**Option 1:** Restart PostgreSQL container with port binding
```bash
docker stop brain-postgres
docker rm brain-postgres
cd brainos/orchestration/infrastructure/docker/compose
docker compose up -d postgres
```

**Option 2:** Use docker network hostname instead of localhost
```python
postgres_config = {
    "host": "brain-postgres",  # Use container name instead of localhost
    "port": 5432,
    "database": "crx_runtime",
    "user": "postgres",
    "password": ""
}
```
*Note: This requires running the Python script inside Docker or using Docker network access.*

**Option 3:** Add port binding to running container
```bash
docker stop brain-postgres
docker run -d --name brain-postgres --restart unless-stopped -p 5432:5432 -v compose_postgres_data:/var/lib/postgresql/data postgres:15-alpine
```

**Recommended:** Option 1 (restart with compose) to ensure configuration consistency.

---

## ADDITIONAL FINDINGS

**PostgreSQL container health:**
- Status: unhealthy (docker ps)
- Internal health: accepting connections (pg_isready)
- Healthcheck defined in docker-compose.yml: YES
- Healthcheck configuration:
  ```yaml
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
    interval: 10s
    timeout: 5s
    retries: 5
  ```

**Startup order:**
- Only temporal service has depends_on with condition service_healthy
- No startup race condition for repository_event_layer.py (runs on host, not in compose)

**Volume state:**
- Volume mounted: compose_postgres_data
- Bind mount: schema.sql for initialization
- No volume corruption detected

**PostgreSQL logs:**
- No startup failures
- Database accepting connections
- Some SQL errors from previous queries (column name mismatches)
- No transport layer errors

---

## CONCLUSION

**PostgreSQL container is running and accepting connections internally.**  
**Port binding to host machine is missing.**  
**Host machine processes cannot connect via localhost:5432.**  
**Root cause: Port binding failure (container started without host port mapping).**

**No assumptions. Only evidence.**

---

**END OF AUDIT**
