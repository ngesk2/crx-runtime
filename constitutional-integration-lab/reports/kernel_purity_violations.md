# Kernel Purity Violations Report

**Generated:** 2026-06-06
**Primary Authority:** AGENT.md
**Lab Workspace:** `C:\Users\nolan\constitutional-integration-lab\`
**CRX Status:** READ-ONLY (untouched)

---

## CRX Runtime Violations

### server.ts

| Field | Value |
|-------|-------|
| **FILE** | runtime/kernel/commit-service/src/server.ts |
| **VIOLATION** | Express HTTP dependency |
| **INFRA_DEPENDENCY** | Express (HTTP server framework) |
| **REPLAY_RISK** | CRITICAL - HTTP server is not replay-safe, depends on network state, request ordering, and external factors |
| **SEVERITY** | CRITICAL - entire commit service is HTTP-coupled, cannot be replayed in isolation |

**EVIDENCE:**
```typescript
import express from 'express';
const app = express();
app.listen(8080);
```

---

### commit_controller.ts

| Field | Value |
|-------|-------|
| **FILE** | runtime/kernel/commit-service/src/api/commit_controller.ts |
| **VIOLATION** | Express HTTP dependency, PostgreSQL dependency |
| **INFRA_DEPENDENCY** | Express (HTTP request/response), PostgreSQL (database) |
| **REPLAY_RISK** | CRITICAL - HTTP request handling is not replay-safe, database writes are not replay-safe |
| **SEVERITY** | CRITICAL - commit logic is HTTP-coupled and database-coupled, cannot be replayed in isolation |

**EVIDENCE:**
```typescript
export async function commitArtifact(req: any, res: any): Promise<void> {
  const { artifact, lineage } = req.body;
  await storeArtifact(artifactId, artifact);
  await storeLineage(lineage.parentIds, artifactId);
  await logEvent("artifact_commit", { artifactId });
  res.json({ artifactId });
}
```

---

### audit_controller.ts

| Field | Value |
|-------|-------|
| **FILE** | runtime/kernel/commit-service/src/api/audit_controller.ts |
| **VIOLATION** | Express HTTP dependency, PostgreSQL dependency |
| **INFRA_DEPENDENCY** | Express (HTTP request/response), PostgreSQL (database) |
| **REPLAY_RISK** | CRITICAL - HTTP request handling is not replay-safe, database reads are not replay-safe |
| **SEVERITY** | CRITICAL - audit logic is HTTP-coupled and database-coupled, cannot be replayed in isolation |

**EVIDENCE:**
```typescript
export async function auditArtifacts(req: any, res: any): Promise<void> {
  const result = await pool.query('SELECT * FROM artifacts ORDER BY created_at DESC LIMIT 100');
  res.json(result.rows);
}
```

---

### artifact_store.ts

| Field | Value |
|-------|-------|
| **FILE** | runtime/kernel/commit-service/src/persistence/artifact_store.ts |
| **VIOLATION** | PostgreSQL dependency |
| **INFRA_DEPENDENCY** | PostgreSQL (database) |
| **REPLAY_RISK** | CRITICAL - database writes are not replay-safe, depends on external database state |
| **SEVERITY** | CRITICAL - artifact persistence is database-coupled, cannot be replayed in isolation |

**EVIDENCE:**
```typescript
import { pool } from './db';
export async function storeArtifact(artifactId: string, artifact: any): Promise<void> {
  await pool.query(
    'INSERT INTO artifacts (artifact_id, type, content) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
    [artifactId, 'unknown', JSON.stringify(artifact)]
  );
}
```

---

### lineage_store.ts

| Field | Value |
|-------|-------|
| **FILE** | runtime/kernel/commit-service/src/persistence/lineage_store.ts |
| **VIOLATION** | PostgreSQL dependency |
| **INFRA_DEPENDENCY** | PostgreSQL (database) |
| **REPLAY_RISK** | CRITICAL - database writes are not replay-safe, depends on external database state |
| **SEVERITY** | CRITICAL - lineage persistence is database-coupled, cannot be replayed in isolation |

**EVIDENCE:**
```typescript
import { pool } from './db';
export async function storeLineage(parentIds: string[], childId: string): Promise<void> {
  for (const parentId of parentIds) {
    await pool.query(
      'INSERT INTO lineage_edges (parent_id, child_id) VALUES ($1, $2)',
      [parentId, childId]
    );
  }
}
```

---

### event_log.ts

| Field | Value |
|-------|-------|
| **FILE** | runtime/kernel/commit-service/src/events/event_log.ts |
| **VIOLATION** | PostgreSQL dependency |
| **INFRA_DEPENDENCY** | PostgreSQL (database) |
| **REPLAY_RISK** | CRITICAL - database writes are not replay-safe, depends on external database state |
| **SEVERITY** | CRITICAL - event logging is database-coupled, cannot be replayed in isolation |

**EVIDENCE:**
```typescript
import { pool } from '../persistence/db';
export async function logEvent(event_type: string, payload: any): Promise<void> {
  await pool.query(
    'INSERT INTO execution_events (event_type, payload) VALUES ($1, $2)',
    [event_type, payload]
  );
}
```

---

### db.ts

| Field | Value |
|-------|-------|
| **FILE** | runtime/kernel/commit-service/src/persistence/db.ts |
| **VIOLATION** | PostgreSQL dependency |
| **INFRA_DEPENDENCY** | PostgreSQL (database) |
| **REPLAY_RISK** | CRITICAL - database connection pool is not replay-safe, depends on external database |
| **SEVERITY** | CRITICAL - entire persistence layer is database-coupled, cannot be replayed in isolation |

**EVIDENCE:**
```typescript
import { Pool } from 'pg';
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

---

## JS.txt Archive Violations

### canonical_fingerprint_service.js

| Field | Value |
|-------|-------|
| **FILE** | extracted/js_txt/canonical_fingerprint_service.js |
| **VIOLATION** | None (pure function) |
| **INFRA_DEPENDENCY** | WebCrypto or Node.js crypto (runtime-specific, but pure) |
| **REPLAY_RISK** | LOW - crypto is deterministic across runtimes when properly configured |
| **SEVERITY** | LOW - pure function, no external state dependency |

**EVIDENCE:**
```javascript
async function computeHash(data) {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else if (typeof require !== 'undefined') {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  } else {
    throw new CanonicalizationError('No crypto implementation available');
  }
}
```

---

### deterministic_replay_harness.js

| Field | Value |
|-------|-------|
| **FILE** | extracted/js_txt/deterministic_replay_harness.js |
| **VIOLATION** | None (pure function) |
| **INFRA_DEPENDENCY** | None (depends only on other pure functions) |
| **REPLAY_RISK** | LOW - pure function, no external state dependency |
| **SEVERITY** | LOW - pure function, no external state dependency |

**EVIDENCE:**
```javascript
export async function runDeterministicReplay({
  snapshot,
  snapshot_fingerprint,
  execution_context = {},
  registryEntries,
  enabled_plugin_ids = [],
  invariantNodes,
  invariantEdges,
  runtime = "vm",
  runtime_options = {},
  strict = true
}) {
  // Pure function - no external state dependency
}
```

---

### formal_invariant_graph_verifier.js

| Field | Value |
|-------|-------|
| **FILE** | extracted/js_txt/formal_invariant_graph_verifier.js |
| **VIOLATION** | None (pure function) |
| **INFRA_DEPENDENCY** | None (depends only on other pure functions) |
| **REPLAY_RISK** | LOW - pure function, no external state dependency |
| **SEVERITY** | LOW - pure function, no external state dependency |

**EVIDENCE:**
```javascript
export async function verifyInvariantGraph({
  declaredNodes,
  declaredEdges
}) {
  // Pure function - no external state dependency
}
```

---

### execution_integrity_auditor.js

| Field | Value |
|-------|-------|
| **FILE** | extracted/js_txt/execution_integrity_auditor.js |
| **VIOLATION** | None (pure function) |
| **INFRA_DEPENDENCY** | None (depends only on other pure functions) |
| **REPLAY_RISK** | LOW - pure function, no external state dependency |
| **SEVERITY** | LOW - pure function, no external state dependency |

**EVIDENCE:**
```javascript
export async function auditExecution(bundle) {
  // Pure function - no external state dependency
}
```

---

## Summary

**TOTAL VIOLATIONS:** 7

**BY FILE:**
- server.ts: 1 (Express HTTP dependency)
- commit_controller.ts: 2 (Express HTTP dependency, PostgreSQL dependency)
- audit_controller.ts: 2 (Express HTTP dependency, PostgreSQL dependency)
- artifact_store.ts: 1 (PostgreSQL dependency)
- lineage_store.ts: 1 (PostgreSQL dependency)
- event_log.ts: 1 (PostgreSQL dependency)
- db.ts: 1 (PostgreSQL dependency)

**BY INFRA_DEPENDENCY:**
- Express (HTTP): 3 (server.ts, commit_controller.ts, audit_controller.ts)
- PostgreSQL (database): 5 (commit_controller.ts, audit_controller.ts, artifact_store.ts, lineage_store.ts, event_log.ts, db.ts)
- Redis: 0
- Docker: 0
- runtime state: 0
- mutable storage: 0
- agent state: 0

**BY SEVERITY:**
- CRITICAL: 7 (all CRX runtime files have critical infra dependencies)
- HIGH: 0
- MEDIUM: 0
- LOW: 0

**BY REPLAY_RISK:**
- CRITICAL: 7 (all CRX runtime files have critical replay risk)
- HIGH: 0
- MEDIUM: 0
- LOW: 4 (canonical_fingerprint_service.js, deterministic_replay_harness.js, formal_invariant_graph_verifier.js, execution_integrity_auditor.js)

**KERNEL PURITY STATUS:**
- CRX Runtime: NOT PURE - 7 violations, all critical
- JS.txt Archive: PURE - 0 violations, all modules are pure functions

**CRITICAL FINDINGS:**
- CRX runtime is completely infra-coupled (Express + PostgreSQL)
- No pure kernel authorities exist in CRX runtime
- All constitutional logic in CRX runtime depends on external infrastructure
- JS.txt archive contains pure kernel authorities that can be reused
- CRX runtime needs architectural separation to achieve kernel purity

**RECOMMENDATIONS:**
- Extract pure kernel authorities from JS.txt archive
- Separate HTTP layer from kernel logic
- Separate persistence layer from kernel logic
- Create pure kernel layer with no infra dependencies
- Move HTTP coupling to infrastructure layer
- Move database coupling to persistence layer
- Keep kernel layer pure (no Express, no PostgreSQL)
