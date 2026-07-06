# Repository Runtime Report — Phase 42 Tier 2B

## Component Inventory

| Component | File | Classification | Evidence |
|-----------|------|---------------|----------|
| **GitHubAdapter** | `gateway/github_adapter.js` (121L) | **DORMANT** | Not imported by any bootstrap file. Only referenced in docs. |
| **GitHubIngestion** | `gateway/github_ingestion.js` (142L) | **BROKEN** | Imports `./event_emitter` which does not exist. Produces REPOSITORY_DISCOVERED, COMMIT_CREATED, FILE_INDEXED events. |
| **GitHubSnapshot** | `gateway/github_snapshot.js` (400L) | **DORMANT** | Fetches repos/branches/commits/PRs/issues/releases/tags/contributors. Imported by non-production files only (`constitutional_runtime.js`, `continuous_acquisition.js`, `end_to_end_verifier.js`). |
| **GitHubReleaseWatcher** | `gateway/github_release_watcher.js` (250L) | **DORMANT** | Polls GitHub releases on 1h interval. Has `startPolling()`. Not imported by any production code. |
| **GitHubWorker** | `runtime/workers/github_worker.py` | **UNREACHABLE** | In untracked `runtime/`. Not in any docker-compose service. Emits REPOSITORY_DISCOVERED, COMMIT_CREATED, FILE_INDEXED via direct psycopg2. |
| **DriveIngestor** | `runtime/ingestion/drive_ingestor.py` (270L) | **UNREACHABLE** | Untracked `runtime/`. Uses `uuid.uuid4()`. Writes DOCUMENT_IMPORTED to `events` table. Not in docker-compose. |
| **GoogleDriveIngestion** | `brainos/.../google_drive_ingestion.py` (335L) | **DORMANT** | Standalone with `__main__` perpetual 300s loop. Direct psycopg2 + hashlib.sha256 + uuid. Referenced by mission_control for status only. |
| **GoogleDriveAdapter** | `runtime/adapters/google_drive/...` (332L) | **UNREACHABLE** | Untracked `runtime/`. Not in docker-compose. |
| **FilesystemAuthority** | `gateway/filesystem_authority.js` (350L) | **DORMANT** | Not imported by any bootstrap. 7 responsibilities. Has `filesystem_cache` table. |
| **FileWatcher** | `gateway/file_watcher.js` (224L) | **DORMANT** | chokidar-based watch. `start()`/`stop()`. Not imported. |
| **FilesystemWorker** | `filesystem_worker.py` (224L) | **DORMANT** | CLI-only. Generates SQL file output. Not in docker-compose. |
| **RepositoryScanner** | `repository_scanner.py` (225L) | **DORMANT** | CLI-only. Direct psycopg2 INSERT to `events` table. Not imported. |
| **VaultScanner** | `vault_scanner.py` (311L) | **DORMANT** | CLI-only. SHA256 scanning. Generates JSON/MD reports. |
| **RepositoryClient** | `workers/repository_client.py` (58L) | **ACTIVE** | Imported by 6 workers in `workers/`. Stdlib-only HTTP client for gateway API. |
| **RepositoryStore** | `gateway/repository_store.js` (123L) | **ACTIVE** | Wired in `bootstrap/gateway_runtime.js`. 4 REST routes for `repository_objects`. |
| **EventRepository** | `gateway/event_repository.js` (221L) | **ACTIVE** | Wired in `bootstrap/main.js`. Handles `repository_events` + `event_processing` tables. |
| **SnapshotRepository** | `gateway/snapshot_repository.js` (81L) | **DORMANT** | `repository_snapshots` table. Not imported by any production code. |
| **DocumentIngestion** | `gateway/document_ingestion.js` (369L) | **DORMANT** | Wired in legacy `bootstrap/wiring.js` only (not production `main.js`). Has standalone `__main__`. Filesystem → Qdrant. |
| **RepositoryDiscoveryAuthority** | `gateway/repository_discovery_authority.js` (88L) | **DORMANT** | Used only by dormant `github_adapter.js`. |
| **RepositoryAuthority (JS)** | `gateway/repository_authority.js` (250L) | **DORMANT** | Not imported by any bootstrap. |
| **RepositoryAuthority (Python)** | `runtime/authorities/repository_authority.py` | **UNREACHABLE** | Untracked `runtime/`. Not in docker-compose. |
| **RepositoryAuthority (TS)** | `runtime/kernel/repository/repository-authority.ts` | **UNREACHABLE** | Untracked `runtime/`. TS file, needs compilation. |
| **RepositoryFingerprinting** | `gateway/repository_fingerprinting.js` | **DORMANT** | Not imported. |
| **RepositoryIndexer** | — | **MISSING** | No indexer file exists in the entire codebase. |
| **Repository Routes** | `gateway/routes/repository.js` (45L) | **ACTIVE** | Mounted in production gateway. POST/GET/DELETE for `repository_objects`. |
| **WorkerRuntime** | `workers/worker_runtime.py` (94L) | **DORMANT** | No running instance. No docker-compose service. |

## Classification Summary

| Classification | Count | Components |
|---------------|-------|-----------|
| **ACTIVE** | 4 | RepositoryClient, RepositoryStore, EventRepository, Repository Routes |
| **DORMANT** | 13 | GitHubAdapter, GitHubSnapshot, GitHubReleaseWatcher, GoogleDriveIngestion, FilesystemAuthority, FileWatcher, FilesystemWorker, RepositoryScanner, VaultScanner, DocumentIngestion, RepositoryDiscoveryAuthority, RepositoryAuthority (JS), RepositoryFingerprinting, SnapshotRepository |
| **BROKEN** | 1 | GitHubIngestion (missing `event_emitter` import) |
| **UNREACHABLE** | 5 | GitHubWorker, DriveIngestor, GoogleDriveAdapter, RepositoryAuthority (Python), RepositoryAuthority (TS) |
| **MISSING** | 1 | RepositoryIndexer |

## Key Findings

1. **4 active components**: RepositoryClient, RepositoryStore, EventRepository, and the repository routes. These form the minimal production repository runtime — REST API for `repository_objects` and `repository_events` tables.

2. **Active components only provide storage and retrieval**. They do NOT ingest, scan, index, or discover. Ingestion requires the dormant/broken components (GitHubIngestion, DriveIngestor, FileWatcher, RepositoryScanner).

3. **GitHubIngestion is BROKEN** — `./event_emitter` module does not exist. Even if deployed, it would crash on module load.

4. **All ingestion components are dormant or unreachable** — no scanner, watcher, or ingestor runs in any production container.

5. **RepositoryIndexer does not exist anywhere** in the codebase — neither JS nor Python.

6. **3 separate RepositoryAuthority implementations** (JS, Python, TS) — all dormant/unreachable. The JS version in `gateway/` is the most likely canonical target but is not wired into any bootstrap.

7. **The production code path** for repository objects is: HTTP route → `RepositoryStore` → `repository_objects` table. This is REST-only. No event-driven object creation exists.
