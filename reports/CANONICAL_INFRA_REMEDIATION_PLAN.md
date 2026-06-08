# CANONICAL_INFRA_REMEDIATION_PLAN

**Audit Date:** 2026-06-07  
**Protocol:** CRX-INFRA-CONSOLIDATION  
**Mode:** READ-ONLY  
**Classification:** FACT, INFERENCE, UNKNOWN

---

## Executive Summary

**FACT:** CRX/infra exists but is COMPLETELY EMPTY (no docker-compose.yml, no .env, no .env.example).

**FACT:** 10/10 required services are MISSING or BROKEN.

**FACT:** Runtime kernel exists with 11 TypeScript files (PARTIALLY IMPLEMENTED).

**FACT:** origin/audit-hardening has BROKEN import and DELETED files.

**INFERENCE:** CRX infrastructure is NOT compliant with AGENT.md mandate.

**RECOMMENDATION:** Execute remediation steps in priority order to establish constitutional infrastructure.

---

## Exact Missing Files

### Priority 1: Infrastructure Configuration

**Missing File 1:** `C:\Users\nolan\CRX\infra\docker-compose.yml`

**Status:** MISSING

**Required Services:**
- postgres
- redis
- ollama
- api
- worker
- scheduler
- prometheus
- grafana
- loki
- tempo

**Classification:** CRITICAL

---

**Missing File 2:** `C:\Users\nolan\CRX\infra\.env`

**Status:** MISSING

**Required Configuration:**
- POSTGRES_HOST
- POSTGRES_PORT
- POSTGRES_USER
- POSTGRES_PASSWORD
- POSTGRES_DB
- REDIS_HOST
- REDIS_PORT
- OLLAMA_HOST
- OLLAMA_PORT
- OLLAMA_MODEL
- API_PORT
- WORKER_PORT
- SCHEDULER_PORT
- PROMETHEUS_PORT
- GRAFANA_PORT
- LOKI_PORT
- TEMPO_PORT

**Classification:** CRITICAL

---

**Missing File 3:** `C:\Users\nolan\CRX\infra\.env.example`

**Status:** MISSING

**Purpose:** Template for .env configuration

**Classification:** HIGH

---

### Priority 2: Service Implementations

**Missing File 4:** `C:\Users\nolan\CRX\infra\api\Dockerfile`

**Status:** MISSING

**Purpose:** API service container definition

**Classification:** CRITICAL

---

**Missing File 5:** `C:\Users\nolan\CRX\infra\api\package.json`

**Status:** MISSING

**Purpose:** API service dependencies

**Classification:** CRITICAL

---

**Missing File 6:** `C:\Users\nolan\CRX\infra\api\src\`

**Status:** MISSING

**Purpose:** API service source code

**Classification:** CRITICAL

---

**Missing File 7:** `C:\Users\nolan\CRX\infra\worker\Dockerfile`

**Status:** MISSING

**Purpose:** Worker service container definition

**Classification:** CRITICAL

---

**Missing File 8:** `C:\Users\nolan\CRX\infra\worker\package.json`

**Status:** MISSING

**Purpose:** Worker service dependencies

**Classification:** CRITICAL

---

**Missing File 9:** `C:\Users\nolan\CRX\infra\worker\src\`

**Status:** MISSING

**Purpose:** Worker service source code

**Classification:** CRITICAL

---

### Priority 3: Database Initialization

**Missing File 10:** `C:\Users\nolan\CRX\infra\postgres\init\01-artifacts.sql`

**Status:** MISSING

**Purpose:** Artifacts table initialization

**Classification:** CRITICAL

---

**Missing File 11:** `C:\Users\nolan\CRX\infra\postgres\init\02-lineage_edges.sql`

**Status:** MISSING

**Purpose:** Lineage edges table initialization

**Classification:** CRITICAL

---

**Missing File 12:** `C:\Users\nolan\CRX\infra\postgres\init\03-execution_events.sql`

**Status:** MISSING

**Purpose:** Execution events table initialization

**Classification:** CRITICAL

---

**Missing File 13:** `C:\Users\nolan\CRX\infra\postgres\init\04-assertions.sql`

**Status:** MISSING

**Purpose:** Assertions table initialization (constitutional requirement)

**Classification:** CRITICAL

---

**Missing File 14:** `C:\Users\nolan\CRX\infra\postgres\init\05-relations.sql`

**Status:** MISSING

**Purpose:** Relations table initialization (constitutional requirement)

**Classification:** CRITICAL

---

### Priority 4: Redis Configuration

**Missing File 15:** `C:\Users\nolan\CRX\infra\redis\redis.conf`

**Status:** MISSING

**Required Configuration:**
- appendonly yes
- appendfilename "appendonly.aof"
- save 900 1
- save 300 10
- save 60 10000

**Classification:** HIGH

---

### Priority 5: Ollama Configuration

**Missing File 16:** `C:\Users\nolan\CRX\infra\ollama\bootstrap.sh`

**Status:** MISSING

**Purpose:** Ollama model bootstrap script

**Required Action:** Pull llama3 model on startup

**Classification:** HIGH

---

## Exact Missing Services

### Service 1: postgres

**Status:** MISSING

**Missing Components:**
- docker-compose.yml service definition
- postgres/init/ schema files
- volume persistence configuration
- healthcheck configuration

**Classification:** CRITICAL

---

### Service 2: redis

**Status:** MISSING

**Missing Components:**
- docker-compose.yml service definition
- redis/redis.conf
- volume persistence configuration
- healthcheck configuration

**Classification:** CRITICAL

---

### Service 3: ollama

**Status:** MISSING

**Missing Components:**
- docker-compose.yml service definition
- ollama/bootstrap.sh
- volume persistence configuration
- model bootstrap strategy
- healthcheck configuration

**Classification:** CRITICAL

---

### Service 4: api

**Status:** MISSING

**Missing Components:**
- docker-compose.yml service definition
- api/Dockerfile
- api/package.json
- api/src/ source code
- healthcheck configuration

**Classification:** CRITICAL

---

### Service 5: worker

**Status:** MISSING

**Missing Components:**
- docker-compose.yml service definition
- worker/Dockerfile
- worker/package.json
- worker/src/ source code
- healthcheck configuration

**Classification:** CRITICAL

---

### Service 6: scheduler

**Status:** MISSING

**Missing Components:**
- docker-compose.yml service definition
- scheduler/Dockerfile
- scheduler/package.json
- scheduler/src/ source code
- healthcheck configuration

**Classification:** HIGH

---

### Service 7: prometheus

**Status:** MISSING

**Missing Components:**
- docker-compose.yml service definition
- prometheus/prometheus.yml
- volume persistence configuration
- healthcheck configuration

**Classification:** HIGH

---

### Service 8: grafana

**Status:** MISSING

**Missing Components:**
- docker-compose.yml service definition
- grafana/dashboards/
- grafana/provisioning/
- volume persistence configuration
- healthcheck configuration

**Classification:** HIGH

---

### Service 9: loki

**Status:** MISSING

**Missing Components:**
- docker-compose.yml service definition
- loki/loki-config.yml
- volume persistence configuration
- healthcheck configuration

**Classification:** HIGH

---

### Service 10: tempo

**Status:** MISSING

**Missing Components:**
- docker-compose.yml service definition
- tempo/tempo-config.yml
- volume persistence configuration
- healthcheck configuration

**Classification:** HIGH

---

## Exact Broken References

### Broken Reference 1: api build path

**Location:** docker-compose.yml (not yet created)

**Broken Reference:** `build: ./api`

**Issue:** api/ directory exists but is empty (no Dockerfile, package.json, src/)

**Classification:** BROKEN

---

### Broken Reference 2: worker build path

**Location:** docker-compose.yml (not yet created)

**Broken Reference:** `build: ./worker`

**Issue:** worker/ directory exists but is empty (no Dockerfile, package.json, src/)

**Classification:** BROKEN

---

### Broken Reference 3: postgres init path

**Location:** docker-compose.yml (not yet created)

**Broken Reference:** `./postgres/init`

**Issue:** postgres/init/ directory exists but is empty (no schema files)

**Classification:** BROKEN

---

### Broken Reference 4: redis config path

**Location:** docker-compose.yml (not yet created)

**Broken Reference:** `./redis/redis.conf`

**Issue:** redis/ directory exists but is empty (no redis.conf)

**Classification:** BROKEN

---

### Broken Reference 5: identity_engine.ts import

**Location:** runtime/kernel/commit-service/src/engines/identity_engine.ts

**Broken Reference:** `import { canonicalize } from "./touch src/engines/canonical_engine"`

**Issue:** Import path is invalid (contains "touch src/engines/" which is not a valid path)

**Classification:** BROKEN

**Branch:** origin/audit-hardening

**Recommendation:** Fix import to `import { canonicalize } from "./canonical_engine"`

---

## Exact Commands Required

### Step 1: Fix origin/audit-hardening broken import

**Command:** `git -C C:\Users\nolan\CRX\runtime checkout origin/audit-hardening`

**Command:** `Edit runtime/kernel/commit-service/src/engines/identity_engine.ts`

**Change:** `import { canonicalize } from "./touch src/engines/canonical_engine"` → `import { canonicalize } from "./canonical_engine"`

**Command:** `git -C C:\Users\nolan\CRX\runtime add runtime/kernel/commit-service/src/engines/identity_engine.ts`

**Command:** `git -C C:\Users\nolan\CRX\runtime commit -m "Fix broken import in identity_engine.ts"`

**Classification:** CRITICAL

---

### Step 2: Restore canonical_engine.ts content

**Command:** `git -C C:\Users\nolan\CRX\runtime checkout audit-hardening -- kernel/commit-service/src/engines/canonical_engine.ts`

**Command:** `git -C C:\Users\nolan\CRX\runtime add kernel/commit-service/src/engines/canonical_engine.ts`

**Command:** `git -C C:\Users\nolan\CRX\runtime commit -m "Restore canonical_engine.ts content"`

**Classification:** CRITICAL

---

### Step 3: Restore .gitignore

**Command:** `git -C C:\Users\nolan\CRX\runtime checkout audit-hardening -- .gitignore`

**Command:** `git -C C:\Users\nolan\CRX\runtime add .gitignore`

**Command:** `git -C C:\Users\nolan\CRX\runtime commit -m "Restore .gitignore"`

**Classification:** HIGH

---

### Step 4: Merge artifact.ts from origin/audit-hardening

**Command:** `git -C C:\Users\nolan\CRX\runtime checkout audit-hardening`

**Command:** `git -C C:\Users\nolan\CRX\runtime merge origin/audit-hardening`

**Expected Result:** artifact.ts added to audit-hardening branch

**Classification:** HIGH

---

### Step 5: Create docker-compose.yml

**Command:** `Create C:\Users\nolan\CRX\infra\docker-compose.yml`

**Required Services:**
- postgres (with healthcheck, restart policy, volume persistence)
- redis (with healthcheck, restart policy, volume persistence, config mount)
- ollama (with healthcheck, restart policy, volume persistence, model bootstrap)
- api (with healthcheck, restart policy, build context)
- worker (with healthcheck, restart policy, build context)
- scheduler (with healthcheck, restart policy, build context)
- prometheus (with healthcheck, restart policy, volume persistence)
- grafana (with healthcheck, restart policy, volume persistence)
- loki (with healthcheck, restart policy, volume persistence)
- tempo (with healthcheck, restart policy, volume persistence)

**Classification:** CRITICAL

---

### Step 6: Create .env file

**Command:** `Create C:\Users\nolan\CRX\infra\.env`

**Required Configuration:**
- POSTGRES_HOST=postgres
- POSTGRES_PORT=5432
- POSTGRES_USER=crx
- POSTGRES_PASSWORD=crx_password
- POSTGRES_DB=crx
- REDIS_HOST=redis
- REDIS_PORT=6379
- OLLAMA_HOST=ollama
- OLLAMA_PORT=11434
- OLLAMA_MODEL=llama3
- API_PORT=3000
- WORKER_PORT=3001
- SCHEDULER_PORT=3002
- PROMETHEUS_PORT=9090
- GRAFANA_PORT=3000
- LOKI_PORT=3100
- TEMPO_PORT=3200

**Classification:** CRITICAL

---

### Step 7: Create .env.example file

**Command:** `Create C:\Users\nolan\CRX\infra\.env.example`

**Purpose:** Template for .env configuration

**Classification:** HIGH

---

### Step 8: Create api/Dockerfile

**Command:** `Create C:\Users\nolan\CRX\infra\api\Dockerfile`

**Required:** Node.js base image, copy package.json, install dependencies, copy source code, expose port, start command

**Classification:** CRITICAL

---

### Step 9: Create api/package.json

**Command:** `Create C:\Users\nolan\CRX\infra\api\package.json`

**Required:** Dependencies (express, pg, redis, etc.), scripts (start, dev, test)

**Classification:** CRITICAL

---

### Step 10: Create api/src/ directory structure

**Command:** `Create C:\Users\nolan\CRX\infra\api\src\`

**Required:** API source code (controllers, services, routes)

**Classification:** CRITICAL

---

### Step 11: Create worker/Dockerfile

**Command:** `Create C:\Users\nolan\CRX\infra\worker\Dockerfile`

**Required:** Node.js base image, copy package.json, install dependencies, copy source code, start command

**Classification:** CRITICAL

---

### Step 12: Create worker/package.json

**Command:** `Create C:\Users\nolan\CRX\infra\worker\package.json`

**Required:** Dependencies (bull, pg, redis, etc.), scripts (start, dev, test)

**Classification:** CRITICAL

---

### Step 13: Create worker/src/ directory structure

**Command:** `Create C:\Users\nolan\CRX\infra\worker\src\`

**Required:** Worker source code (job processors, queues)

**Classification:** CRITICAL

---

### Step 14: Create postgres/init/ schema files

**Command:** `Create C:\Users\nolan\CRX\infra\postgres\init\01-artifacts.sql`

**Command:** `Create C:\Users\nolan\CRX\infra\postgres\init\02-lineage_edges.sql`

**Command:** `Create C:\Users\nolan\CRX\infra\postgres\init\03-execution_events.sql`

**Command:** `Create C:\Users\nolan\CRX\infra\postgres\init\04-assertions.sql`

**Command:** `Create C:\Users\nolan\CRX\infra\postgres\init\05-relations.sql`

**Classification:** CRITICAL

---

### Step 15: Create redis/redis.conf

**Command:** `Create C:\Users\nolan\CRX\infra\redis\redis.conf`

**Required Configuration:**
- appendonly yes
- appendfilename "appendonly.aof"
- save 900 1
- save 300 10
- save 60 10000

**Classification:** HIGH

---

### Step 16: Create ollama/bootstrap.sh

**Command:** `Create C:\Users\nolan\CRX\infra\ollama\bootstrap.sh`

**Required:** Pull llama3 model on startup

**Classification:** HIGH

---

### Step 17: Test docker-compose.yml parsing

**Command:** `docker-compose -f C:\Users\nolan\CRX\infra\docker-compose.yml config`

**Purpose:** Verify docker-compose.yml is valid YAML

**Classification:** CRITICAL

---

### Step 18: Test service dependencies

**Command:** `docker-compose -f C:\Users\nolan\CRX\infra\docker-compose.yml up -d postgres redis`

**Purpose:** Verify postgres and redis start successfully

**Classification:** CRITICAL

---

### Step 19: Test database initialization

**Command:** `docker-compose -f C:\Users\nolan\CRX\infra\docker-compose.yml exec postgres psql -U crx -d crx -c "\dt"`

**Purpose:** Verify database tables are created

**Classification:** CRITICAL

---

### Step 20: Test Ollama model bootstrap

**Command:** `docker-compose -f C:\Users\nolan\CRX\infra\docker-compose.yml up -d ollama`

**Command:** `docker-compose -f C:\Users\nolan\CRX\infra\docker-compose.yml exec ollama ollama list`

**Purpose:** Verify llama3 model is installed

**Classification:** HIGH

---

## Remediation Priority Order

### Priority 1: Fix Broken Branch (CRITICAL)

1. Fix origin/audit-hardening broken import in identity_engine.ts
2. Restore canonical_engine.ts content
3. Restore .gitignore
4. Merge artifact.ts from origin/audit-hardening to audit-hardening

**Estimated Time:** 15 minutes

**Risk:** LOW

---

### Priority 2: Create Infrastructure Configuration (CRITICAL)

5. Create docker-compose.yml with all required services
6. Create .env file with all required configuration
7. Create .env.example file

**Estimated Time:** 2 hours

**Risk:** MEDIUM

---

### Priority 3: Create Service Implementations (CRITICAL)

8. Create api/Dockerfile
9. Create api/package.json
10. Create api/src/ directory structure
11. Create worker/Dockerfile
12. Create worker/package.json
13. Create worker/src/ directory structure

**Estimated Time:** 4 hours

**Risk:** MEDIUM

---

### Priority 4: Create Database Initialization (CRITICAL)

14. Create postgres/init/ schema files (artifacts, lineage_edges, execution_events, assertions, relations)

**Estimated Time:** 1 hour

**Risk:** LOW

---

### Priority 5: Create Redis Configuration (HIGH)

15. Create redis/redis.conf with persistence configuration

**Estimated Time:** 30 minutes

**Risk:** LOW

---

### Priority 6: Create Ollama Configuration (HIGH)

16. Create ollama/bootstrap.sh with model bootstrap strategy

**Estimated Time:** 30 minutes

**Risk:** LOW

---

### Priority 7: Test Infrastructure (CRITICAL)

17. Test docker-compose.yml parsing
18. Test service dependencies
19. Test database initialization
20. Test Ollama model bootstrap

**Estimated Time:** 1 hour

**Risk:** MEDIUM

---

## Total Estimated Time

**Total Time:** 9 hours 15 minutes

**Risk Level:** MEDIUM

**Blocking Issues:** None (all issues are resolvable)

---

## Final Classification

**FACT:** 16 exact missing files identified

**FACT:** 10 exact missing services identified

**FACT:** 5 exact broken references identified

**FACT:** 20 exact commands required for remediation

**INFERENCE:** CRX infrastructure is NOT compliant with AGENT.md mandate

**INFERENCE:** Remediation requires 9 hours 15 minutes of work

**RECOMMENDATION:** Execute remediation steps in priority order to establish constitutional infrastructure compliance
