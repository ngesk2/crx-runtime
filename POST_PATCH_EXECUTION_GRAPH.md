# POST_PATCH_EXECUTION_GRAPH.md

**Repository Root**: C:\Users\nolan\CRX  
**Analysis Date**: 2026-06-11  
**Phase**: PHASE 3 — ENTRYPOINT REACHABILITY

---

## Entrypoints

### Entrypoint 1: gateway/server.js
- **Location**: C:\Users\nolan\CRX\gateway\server.js
- **Startup**: `gateway/package.json:7` - `"start": "node server.js"`
- **Runtime Reach**: YES (when `npm start` is run)
- **Import Reach**: NO (standalone file, no imports)

### Entrypoint 2: kernel/commit-service/src/server.ts
- **Location**: C:\Users\nolan\CRX\kernel\commit-service\src\server.ts
- **Startup**: `kernel/commit-service/package.json:8` - `"dev": "ts-node src/server.ts"`
- **Runtime Reach**: YES (when `npm run dev` is run)
- **Import Reach**: YES (imports from local modules)

### Entrypoint 3: runtime/kernel/commit-service/src/server.ts
- **Location**: C:\Users\nolan\CRX\runtime\kernel\commit-service\src\server.ts
- **Startup**: `runtime/kernel/commit-service/package.json:8` - `"dev": "ts-node src/server.ts"`
- **Runtime Reach**: YES (when `npm run dev` is run)
- **Import Reach**: YES (imports from local modules)

---

## Import Graph

### gateway/server.js
```
gateway/server.js
└─ (no imports - standalone Express server)
```

### kernel/commit-service/src/server.ts
```
kernel/commit-service/src/server.ts
├─ ./api/commit_controller.ts
│  ├─ ../engines/identity_engine.ts
│  │  ├─ ./canonical_engine.ts (FIXED - was broken)
│  │  └─ crypto (Node.js)
│  ├─ ../validation/dag_validator.ts
│  ├─ ../persistence/artifact_store.ts
│  │  └─ ../persistence/db.ts
│  ├─ ../persistence/lineage_store.ts
│  │  └─ ../persistence/db.ts
│  ├─ ../events/event_log.ts
│  │  └─ ../persistence/db.ts
│  └─ ../utils/logger.ts
└─ ./api/audit_controller.ts
   └─ ../persistence/db.ts
```

### runtime/kernel/commit-service/src/server.ts
```
runtime/kernel/commit-service/src/server.ts
├─ ./api/commit_controller.ts
│  ├─ ../engines/identity_engine.ts
│  │  ├─ ./canonical_engine.ts (FIXED - now identical to kernel/commit-service)
│  │  └─ crypto (Node.js)
│  ├─ ../validation/dag_validator.ts (FIXED - removed broken import)
│  ├─ ../persistence/artifact_store.ts
│  │  └─ ../persistence/db.ts
│  ├─ ../persistence/lineage_store.ts
│  │  └─ ../persistence/db.ts
│  ├─ ../events/event_log.ts
│  │  └─ ../persistence/db.ts
│  └─ ../utils/logger.ts
└─ ./api/audit_controller.ts
   └─ ../persistence/db.ts
```

---

## File Reachability Matrix

| File | Runtime Reach | Import Reach |
| ---- | ------------- | ------------- |
| gateway/server.js | YES | NO |
| kernel/commit-service/src/server.ts | YES | YES |
| kernel/commit-service/src/api/commit_controller.ts | YES | YES |
| kernel/commit-service/src/api/audit_controller.ts | YES | YES |
| kernel/commit-service/src/engines/identity_engine.ts | YES | YES |
| kernel/commit-service/src/engines/canonical_engine.ts | YES | YES |
| kernel/commit-service/src/validation/dag_validator.ts | YES | YES |
| kernel/commit-service/src/persistence/db.ts | YES | YES |
| kernel/commit-service/src/persistence/artifact_store.ts | YES | YES |
| kernel/commit-service/src/persistence/lineage_store.ts | YES | YES |
| kernel/commit-service/src/events/event_log.ts | YES | YES |
| kernel/commit-service/src/utils/logger.ts | YES | YES |
| kernel/commit-service/src/models/artifact.ts | NO | NO |
| runtime/kernel/commit-service/src/server.ts | YES | YES |
| runtime/kernel/commit-service/src/api/commit_controller.ts | YES | YES |
| runtime/kernel/commit-service/src/api/audit_controller.ts | YES | YES |
| runtime/kernel/commit-service/src/engines/identity_engine.ts | YES | YES |
| runtime/kernel/commit-service/src/engines/canonical_engine.ts | YES | YES |
| runtime/kernel/commit-service/src/validation/dag_validator.ts | YES | YES |
| runtime/kernel/commit-service/src/persistence/db.ts | YES | YES |
| runtime/kernel/commit-service/src/persistence/artifact_store.ts | YES | YES |
| runtime/kernel/commit-service/src/persistence/lineage_store.ts | YES | YES |
| runtime/kernel/commit-service/src/events/event_log.ts | YES | YES |
| runtime/kernel/commit-service/src/utils/logger.ts | YES | YES |
| runtime/replay/*.ts (21 sovereign files) | NO | YES (internal imports only) |

---

## Status

**Broken Imports**: 0 (all repaired)
**Entrypoints**: 3 (gateway, kernel/commit-service, runtime/kernel/commit-service)
**Runtime Reach**: gateway (YES), kernel/commit-service (YES), runtime/kernel/commit-service (YES)
**Import Reach**: gateway (NO), kernel/commit-service (YES), runtime/kernel/commit-service (YES)
**runtime/replay Reach**: NO (no entrypoint, no execution reach)
**Next Action**: PHASE 4 — DUPLICATE STACK REDUCTION
