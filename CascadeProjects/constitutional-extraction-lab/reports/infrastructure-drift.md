# Infrastructure Drift Report

## Constitutional Requirements

**AGENT.md MANDATES:**
- Kernel must NOT depend on Express, Docker, Postgres, Redis, HTTP, agents, orchestration, UI, dashboards
- Kernel must be deterministic, replayable, transport-independent, provider-independent, infrastructure-independent
- Infrastructure must be canonical and minimal
- No duplicate infrastructure
- No scattered configs
- No hidden state
- No orphaned infra

---

## Infrastructure Inventory

**EXISTING INFRASTRUCTURE:**
- agents/docker-compose.yml (broken - missing directories)
- runtime/kernel/commit-service/package.json (dev script: ts-node src/server.ts)
- runtime/kernel/commit-service/src/persistence/db.ts (PostgreSQL pool)
- runtime/kernel/commit-service/src/server.ts (Express server)
- runtime/kernel/commit-service/src/utils/logger.ts (Pino logger)

**MISSING INFRASTRUCTURE:**
- infra/ directory (canonical infra directory missing)
- Docker Compose for runtime (canonical infra missing)
- Environment configuration ( scattered, no canonical env file)
- Infrastructure documentation (no canonical infra docs)

---

## Infrastructure Drift Violations

**VIOLATION 1: Missing Canonical Infrastructure Directory**
- AGENT.md mandates infra/ as canonical infrastructure directory
- infra/ does not exist
- No canonical infrastructure location

**SEVERITY:** HIGH

**EVIDENCE:** No infra/ directory in C:\Users\nolan\CRX\

**CONSTITUTIONAL VIOLATION:** AGENT.md mandates infra/docker-compose.yml as canonical infrastructure

---

**VIOLATION 2: Broken Docker Compose**
- agents/docker-compose.yml exists but is broken
- References missing directories
- Cannot be used for infrastructure

**SEVERITY:** HIGH

**EVIDENCE:** agents/docker-compose.yml references missing directories

**FILE:** agents/docker-compose.yml
**CONSTITUTIONAL VIOLATION:** AGENT.md mandates canonical infrastructure

---

**VIOLATION 3: Scattered Environment Configuration**
- DATABASE_URL environment variable used in db.ts
- No canonical .env file
- No environment configuration documentation
- Environment configuration scattered across files

**SEVERITY:** MEDIUM

**EVIDENCE:** db.ts uses process.env.DATABASE_URL without canonical env file

**FILE:** runtime/kernel/commit-service/src/persistence/db.ts
**LINE:** 3-5
```typescript
import { Pool } from 'pg';
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

**CONSTITUTIONAL VIOLATION:** AGENT.md mandates canonical infrastructure

---

**VIOLATION 4: Hardcoded Port**
- Server listens on hardcoded port 8080
- No configuration for port
- No environment variable for port

**SEVERITY:** MEDIUM

**EVIDENCE:** server.ts hardcodes port 8080

**FILE:** runtime/kernel/commit-service/src/server.ts
**LINE:** 10-11
```typescript
const port = 8080
app.listen(port, () => {
  console.log(`CRX kernel running on ${port}`)
})
```

**CONSTITUTIONAL VIOLATION:** AGENT.md mandates canonical infrastructure

---

**VIOLATION 5: No Infrastructure Abstraction**
- No infrastructure abstraction layer
- Kernel directly depends on Express
- Kernel directly depends on PostgreSQL
- Kernel directly depends on HTTP

**SEVERITY:** HIGH

**EVIDENCE:** server.ts imports express, db.ts imports pg

**CONSTITUTIONAL VIOLATION:** AGENT.md mandates kernel must NOT depend on Express, Docker, Postgres, Redis, HTTP

---

**VIOLATION 6: No Infrastructure Documentation**
- No infrastructure documentation
- No deployment documentation
- No environment setup documentation
- No infrastructure configuration documentation

**SEVERITY:** MEDIUM

**EVIDENCE:** No infrastructure-related markdown files in C:\Users\nolan\CRX\

**CONSTITUTIONAL VIOLATION:** AGENT.md mandates canonical infrastructure

---

**VIOLATION 7: No Infrastructure Testing**
- No infrastructure tests
- No deployment tests
- No environment configuration tests
- No infrastructure validation tests

**SEVERITY:** MEDIUM

**EVIDENCE:** No test files in runtime/kernel/commit-service/

**CONSTITUTIONAL VIOLATION:** AGENT.md mandates constitutional testing

---

## Duplicate Infrastructure

**DUPLICATE 1: Docker Compose Files**
- agents/docker-compose.yml (broken)
- No other Docker Compose files exist
- No canonical Docker Compose file

**SEVERITY:** HIGH

**EVIDENCE:** Only one Docker Compose file exists and it's broken

**CONSTITUTIONAL VIOLATION:** AGENT.md mandates canonical infrastructure

---

**DUPLICATE 2: Environment Configuration**
- DATABASE_URL used in db.ts
- No canonical .env file
- No environment configuration standard

**SEVERITY:** MEDIUM

**EVIDENCE:** Environment configuration scattered

**CONSTITUTIONAL VIOLATION:** AGENT.md mandates canonical infrastructure

---

## Hidden State

**HIDDEN STATE 1: PostgreSQL Connection Pool**
- db.ts exports pool as singleton
- Pool state is hidden
- No pool state verification
- No pool state replay verification

**SEVERITY:** MEDIUM

**EVIDENCE:** db.ts exports pool

**FILE:** runtime/kernel/commit-service/src/persistence/db.ts
**LINE:** 3-5
```typescript
import { Pool } from 'pg';
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

**CONSTITUTIONAL VIOLATION:** AGENT.md mandates no hidden state

---

**HIDDEN STATE 2: Pino Logger Instance**
- logger.ts exports logger as singleton
- Logger state is hidden
- No logger state verification
- No logger state replay verification

**SEVERITY:** LOW

**EVIDENCE:** logger.ts exports logger

**FILE:** runtime/kernel/commit-service/src/utils/logger.ts
**LINE:** 1-2
```typescript
import pino from 'pino';
export const logger = pino();
```

**CONSTITUTIONAL VIOLATION:** AGENT.md mandates no hidden state

---

## Orphaned Infrastructure

**ORPHANED 1: agents/docker-compose.yml**
- Docker Compose file exists but is broken
- References missing directories
- Cannot be used
- Should be deleted or fixed

**SEVERITY:** MEDIUM

**EVIDENCE:** agents/docker-compose.yml references missing directories

**CONSTITUTIONAL VIOLATION:** AGENT.md mandates canonical infrastructure

---

## Infrastructure Consolidation Strategy

**PHASE 1: Create Canonical Infrastructure Directory**
- Create infra/ directory
- Create infra/docker-compose.yml
- Create infra/.env.example
- Create infra/README.md

**PHASE 2: Fix or Delete Broken Infrastructure**
- Fix agents/docker-compose.yml or delete it
- Move working infrastructure to infra/
- Delete orphaned infrastructure

**PHASE 3: Create Canonical Environment Configuration**
- Create infra/.env.example
- Document all environment variables
- Add environment variable validation
- Add environment configuration tests

**PHASE 4: Remove Hardcoded Configuration**
- Remove hardcoded port from server.ts
- Add port configuration to .env
- Add configuration validation
- Add configuration tests

**PHASE 5: Create Infrastructure Abstraction Layer**
- Create infrastructure_adapter.ts
- Create configuration_adapter.ts
- Decouple kernel from infrastructure
- Add infrastructure tests

**PHASE 6: Create Infrastructure Documentation**
- Create infra/README.md
- Create DEPLOYMENT.md
- Create ENVIRONMENT_SETUP.md
- Create INFRASTRUCTURE.md

**PHASE 7: Create Infrastructure Testing**
- Create infrastructure tests
- Create deployment tests
- Create environment configuration tests
- Create infrastructure validation tests

---

## Proposed Infrastructure Structure

```
infra/ (canonical infrastructure)
├── docker-compose.yml (canonical Docker Compose)
├── .env.example (canonical environment configuration)
├── README.md (infrastructure documentation)
├── deployment.md (deployment documentation)
└── scripts/
    ├── setup.sh (infrastructure setup)
    ├── validate.sh (infrastructure validation)
    └── test.sh (infrastructure testing)

runtime/kernel/commit-service/
├── .env (local environment - gitignored)
├── package.json (runtime dependencies)
└── src/ (runtime source - infrastructure-independent)
```

---

## Proposed Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: crx
      POSTGRES_USER: crx
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  commit-service:
    build: .
    environment:
      DATABASE_URL: postgresql://crx:${POSTGRES_PASSWORD}@postgres:5432/crx
      PORT: ${PORT:-8080}
    ports:
      - "${PORT:-8080}:8080"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

---

## Proposed Environment Configuration

```bash
# Database Configuration
DATABASE_URL=postgresql://crx:password@localhost:5432/crx
POSTGRES_PASSWORD=password

# Server Configuration
PORT=8080

# Logging Configuration
LOG_LEVEL=info

# Replay Configuration
REPLAY_ENABLED=true
REPLAY_VERIFICATION=true

# Infrastructure Configuration
INFRASTRUCTURE_MODE=production
```

---

## Migration Path

**STEP 1: Create Canonical Infrastructure Directory**
- Create infra/ directory
- Create infra/docker-compose.yml
- Create infra/.env.example
- Create infra/README.md

**STEP 2: Fix or Delete Broken Infrastructure**
- Fix agents/docker-compose.yml or delete it
- Move working infrastructure to infra/
- Delete orphaned infrastructure

**STEP 3: Create Canonical Environment Configuration**
- Create infra/.env.example
- Document all environment variables
- Add environment variable validation
- Add environment configuration tests

**STEP 4: Remove Hardcoded Configuration**
- Remove hardcoded port from server.ts
- Add port configuration to .env
- Add configuration validation
- Add configuration tests

**STEP 5: Create Infrastructure Abstraction Layer**
- Create infrastructure_adapter.ts
- Create configuration_adapter.ts
- Decouple kernel from infrastructure
- Add infrastructure tests

**STEP 6: Create Infrastructure Documentation**
- Create infra/README.md
- Create DEPLOYMENT.md
- Create ENVIRONMENT_SETUP.md
- Create INFRASTRUCTURE.md

**STEP 7: Create Infrastructure Testing**
- Create infrastructure tests
- Create deployment tests
- Create environment configuration tests
- Create infrastructure validation tests

**STEP 8: Update Imports**
- Update all imports to use infrastructure abstraction
- Update package.json scripts
- Update documentation

---

## Risk Assessment

**MEDIUM RISK:**
- Requires infrastructure restructuring
- Requires breaking changes
- Requires extensive testing
- Requires migration of existing infrastructure

**MITIGATION:**
- Implement incrementally
- Create migration script
- Add comprehensive tests
- Document migration process
- Provide rollback plan
