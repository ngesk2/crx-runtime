# Entrypoint Chain Analysis — Phase 5

## Service: ping-mission-control

```
docker-compose-mission-control.yml
  → service: mission-control
    → build: Dockerfile.mission-control
      → FROM python:3.11-slim
      → WORKDIR /app
      → COPY brainos/orchestration/requirements-mission-control.txt .
      → RUN pip install -r requirements-mission-control.txt
      → COPY brainos/orchestration/src ./src
      → COPY runtime/constitutional ./runtime/constitutional
      → COPY runtime/adapters ./runtime/adapters
      → COPY runtime/security ./runtime/security
      → COPY runtime/cognitive ./runtime/cognitive
      → COPY runtime/tools ./runtime/tools
      → COPY runtime/data ./runtime/data
      → CMD ["uvicorn", "src.mission_control.app:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Runtime Execution Chain (verified)

```
uvicorn src.mission_control.app:app           # PID 1, 24 threads
  → import app.py                              # FastAPI app
    → import constitutional.secret_adapter     # runtime/constitutional/
    → import security.projection_integrity     # runtime/security/
    → import ProjectionIntegrity, ProjectionMetadata
  → HTTP API endpoints (on port 8000):
    ├── /constitutional/ingest
    │   → constitutional_integration.ingest_constitutional_docs()
    │     → constitutional_retrieval.ingest_document()
    │       → psycopg2 (INSERT INTO events)
    │       → qdrant_client.upsert (into constitutional_documents)
    ├── /constitutional/retrieve
    │   → constitutional_integration.get_constitutional_context()
    │     → constitutional_retrieval.retrieve_for_question()
    │       → qdrant_client.search
    ├── /constitutional/query
    │   → qdrant_client.search (constitutional_documents)
    │   → inference_adapter.embed() for query
    ├── /constitution/search
    │   → qdrant_client.search
    │   → psycopg2 (verification SELECT)
    ├── /reasoning/query
    │   → ReasoningGateway.reason()
    │     → Supervisor.reason()
    │       → Supervisor.plan()              # Creates ReasoningPlan
    │       → Supervisor.execute_plan()
    │         → SearchWorker.execute()        # runtime/cognitive/search_worker.py
    │           → WorkerProtocol.call_tool('authority_search')  # subprocess!
    │             → subprocess.run([sys.executable, 'runtime/tools/authority_search.py'])
    │               → Python subprocess: authority_search.py
    │                 → psycopg2 (SELECT from authority_objects)
    │                 → json.dumps(result) → stdout
    │           → WorkerProtocol.call_tool('lineage_search')    # subprocess!
    │             → subprocess.run([sys.executable, 'runtime/tools/lineage_search.py'])
    │           → WorkerProtocol.call_tool('graph_expand')      # subprocess!
    │             → subprocess.run([sys.executable, 'runtime/tools/graph_expand.py'])
    │         → ContradictionWorker.execute() # runtime/cognitive/contradiction_worker.py
    │           → WorkerProtocol.call_tool('contradiction_search')  # subprocess!
    │         → ArchitectureWorker.execute()  # runtime/cognitive/architecture_worker.py
    │           → WorkerProtocol.call_tool('repository_symbols')    # subprocess!
    │           → WorkerProtocol.call_tool('repository_relationships')  # subprocess!
    │         → MemoryWorker.execute()        # runtime/cognitive/memory_worker.py
    │           → ContextPackBuilder.build()
    │       → Supervisor.synthesize_answer()
    │         → inference_adapter.chat()  # Ollama API call (qwen2.5-coder:14b)
    └── /google-drive/ingest
        → google_drive_ingestion.GoogleDriveIngestion
```

### Subprocess Evidence
- `/proc/1/fd/1` and `/proc/1/fd/2` are **pipes** (not TTY, not files) — these carry subprocess output to the parent process
- `parent process → stdin pipe → subprocess → stdout/stderr pipe → parent` is the standard subprocess.run IPC mechanism
- The pipes exist and are open, confirming subprocess spawning has occurred
- No child processes currently visible (subprocesses are short-lived, spawn-per-request, synchronous subprocess.run)

## Service: brain-postgres

```
docker-compose-mission-control.yml
  → service: postgres
    → image: postgres:15-alpine
    → volumes:
      → schema.sql → /docker-entrypoint-initdb.d/
    → healthcheck: pg_isready
```

## Service: brain-qdrant

```
docker-compose-mission-control.yml
  → service: qdrant
    → image: qdrant/qdrant:latest
    → env: QDRANT__SERVICE__API_KEY
    → Cmd: ["./entrypoint.sh"]
    → process: Qdrant 1.18.2 (Rust)
    → 23 actix-web workers
```

## Service: brain-ollama

```
docker-compose-mission-control.yml
  → service: ollama
    → image: ollama/ollama:latest
    → process: /bin/ollama serve
```

## Service: brain-openwebui

```
docker-compose-mission-control.yml
  → service: openwebui
    → image: ghcr.io/open-webui/open-webui:latest
    → process: python3 -m uvicorn open_webui.main:app
    → Network: brain_internal (172.21.0.3)
```

## Service: brain-repo-runtime

```
docker-compose-mission-control.yml
  → service: repo_runtime
    → image: alpine:latest
    → command: ["sleep", "infinity"]
    → volumes: read-only bind mounts of repo
    → Network: brain_internal (172.21.0.6)
```

## Service: open-webui (old/separate)

```
crx-digestion-worker/docker-compose.yml
  → service: open-webui
    → image: ghcr.io/open-webui/open-webui:main
    → process: bash start.sh → python3 uvicorn
    → Network: crx-digestion-worker_default (172.20.0.2)
    → NOT connected to brain_internal
    → NOT part of PING infrastructure
```

## IMPORTANT: No Entrypoint for Projection Workers
No docker-compose service, no cron job, no systemd timer, no shell script, no supervisor configuration starts `projection_worker.py`, `simple_projection_worker.py`, `qdrant_projection_worker.py`, or `constitutional_projection_worker.py`. The only executed Python is `uvicorn src.mission_control.app:app` and the 6 short-lived tool subprocesses spawned by `WorkerProtocol.call_tool()`.

## IMPORTANT: No Node.js in Execution Chain
No docker-compose service, no Dockerfile, no CMD, no entrypoint, no shell script references any TypeScript file or Node.js runtime. The `gateway/Dockerfile` builds a Node.js image but it is NOT deployed (no running container from it). The three `.ts` files in `runtime/adapters/` are dead code in the container.
