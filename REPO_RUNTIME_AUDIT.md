# Repository Runtime Audit

**Date:** 2026-06-23
**Container:** brain-repo-runtime
**Image:** alpine:latest
**Mode:** read_only: true

---

## Mount Coverage

| Mount Point | Source | Mode | Status |
|---|---|---|---|
| /repo/ping | ./PING (entire repo) | ro | MOUNTED |
| /repo/content | ./vault (constitution, audits) | ro | MOUNTED |
| /repo/drive | ./DriveMirror (Google Drive sync target) | ro | MOUNTED |
| /repo/artifacts | ./Artifacts (architecture intelligence) | ro | MOUNTED |
| /repo/graphs | ./Graphs (knowledge graph data) | rw | MOUNTED |
| /repo/indexes | ./Indexes (search indexes) | rw | MOUNTED |

## Read-Only Enforcement

| Test | Result |
|---|---|
| Write to /repo (root) | BLOCKED: "Read-only file system" |
| Write to /repo/ping | BLOCKED (ro mount) |
| Write to /repo/content | BLOCKED (ro mount) |
| Write to /repo/drive | BLOCKED (ro mount) |
| Write to /repo/artifacts | BLOCKED (ro mount) |
| Write to /repo/graphs | ALLOWED (rw mount) |
| Write to /repo/indexes | ALLOWED (rw mount) |

## Content Visibility

| Directory | Contents Visible |
|---|---|
| /repo/ping | Full repository (PING/ root) |
| /repo/content | vault/ (19 files, 9 subdirs) |
| /repo/drive | DriveMirror/ (currently empty — no sync yet) |
| /repo/artifacts | Architecture Intelligence directory |
| /repo/graphs | Empty (writable) |
| /repo/indexes | Empty (writable) |

## Network

| Property | Value |
|---|---|
| Network | brain_internal (bridge) |
| DNS resolution | Container can reach postgres, qdrant, ollama by name |
| Container name | brain-repo-runtime |

## Summary

- **Status**: OPERATIONAL
- **All mounts verified**: YES (6/6)
- **Read-only enforced**: YES (ro mounts block writes)
- **Writable paths available**: YES (graphs, indexes)
- **All agents see identical filesystem**: YES (single source of truth)
