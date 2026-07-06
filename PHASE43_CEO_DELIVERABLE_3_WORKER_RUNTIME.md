# CEO Deliverable 3: Worker Runtime Architecture

## Architecture

```
┌─────────────────────────────────────────────┐
│  Gateway (ping-gateway)                     │
│  ┌───────────┐  ┌────────────────────────┐  │
│  │ /events/  │  │ repository_events table │  │
│  │ unprocessed│  │ (Postgres)              │  │
│  └─────┬─────┘  └────────────────────────┘  │
│        │                                      │
│        │ HTTP (ping_internal network)         │
└────────┼──────────────────────────────────────┘
         │
┌────────▼──────────────────────────────────────┐
│  Worker Runtime (ping-worker-runtime)         │
│  ┌─────────────────────────────────────────┐  │
│  │ Polls /events/unprocessed (5s)         │  │
│  │ Dispatches to 6 registered handlers    │  │
│  │ Marks via POST /events/processed       │  │
│  │ On failure: POST /events/failed        │  │
│  └─────────────────────────────────────────┘  │
│  Workers: observation → claim → replay →     │
│           witness → lineage → projection      │
└───────────────────────────────────────────────┘
```

## Pipeline Event Chain

```
DOCUMENT_IMPORTED  →  OBSERVATION_CREATED  →  CLAIM_GENERATED
       ↓                                         ↓
  observation_worker                        claim_worker
       ↓                                         ↓
  (chunking: paragraph split)              (proposition extraction)
       ↓                                         ↓
  OBSERVATION_CREATED                       CLAIM_GENERATED
       ↓                                         ↓
  ────────────────────────────────────────────────────────────
                        ↓
                 REPLAY_EXECUTED
                        ↓
                   replay_worker
                        ↓
                 WITNESS_CREATED
                        ↓
                   witness_worker
                        ↓
                 LINEAGE_CREATED
                        ↓
                   lineage_worker
                        ↓
                 PROJECTION_CREATED
                        ↓
                   projection_worker
```

## Deployment

- **Dockerfile**: `Dockerfile.worker-runtime` (python:3-alpine, no external deps)
- **Compose service**: `worker-runtime` in `compose.yaml:315-336`
- **Network**: `ping_internal` — communicates with gateway via HTTP only
- **No direct DB access** — all persistence goes through gateway API

## Zero External Dependencies

All 6 workers + runtime use only Python stdlib: `os`, `json`, `urllib`, `time`, `logging`. No `psycopg2`, no `qdrant-client`, no `requests`.
