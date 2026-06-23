# WORKSPACE_PATCH.md

**Repository Root**: C:\Users\nolan\CRX  
**Analysis Date**: 2026-06-11  
**Phase**: PHASE 2 — ESTABLISH BUILD GRAPH

---

## Workspace Definition Created

**File**: C:\Users\nolan\CRX\pnpm-workspace.yaml
**Type**: pnpm workspace
**Packages**:
- gateway
- kernel/commit-service
- runtime/kernel/commit-service

---

## Root Package.json Created

**File**: C:\Users\nolan\CRX\package.json
**Scripts**:
- `dev`: Start gateway service
- `dev:kernel`: Start kernel/commit-service
- `dev:runtime`: Start runtime/kernel/commit-service

---

## Package Dependencies

**gateway**:
- Dependencies: express@^4.18.2
- Startup: `node server.js`

**kernel/commit-service**:
- Dependencies: express@^5.2.1, pg@^8.20.0, pino@^9.5.0
- Dev Dependencies: typescript, ts-node, @types/*
- Startup: `ts-node src/server.ts`

**runtime/kernel/commit-service**:
- Dependencies: express@^5.2.1, pg@^8.20.0, pino@^9.5.0
- Dev Dependencies: typescript, ts-node, @types/*
- Startup: `ts-node src/server.ts`
- Additional: `replay:test` script

---

## Startup Order

1. gateway (port 8080)
2. kernel/commit-service (port 8080 - CONFLICT)
3. runtime/kernel/commit-service (port 8080 - CONFLICT)

**Issue**: All services use port 8080, causing conflicts if run simultaneously.

---

## Status

**Workspace Definition**: CREATED (pnpm-workspace.yaml)
**Root Package.json**: CREATED
**Package Dependencies**: IDENTIFIED
**Startup Order**: IDENTIFIED (port conflicts detected)
**Next Action**: PHASE 3 — ENTRYPOINT REACHABILITY
