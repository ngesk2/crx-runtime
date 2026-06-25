# Runtime Process Map — Phase 2

## Container: ping-mission-control
| PID | Process | Started By | Evidence |
|---|---|---|---|
| 1 (Tgid:1) | uvicorn (Python 3.11) | Docker CMD | `/proc/1/cmdline` → `/usr/local/bin/python3.11 /usr/local/bin/uvicorn src.mission_control.app:app --host 0.0.0.0 --port 8000` |
| 7-29 | uvicorn worker threads (24 total) | uvicorn ASGI server | `/proc/1/task/*/status` → all 24 threads named "uvicorn" |

### Process Details
- **PID 1 status**: Sleeping (S), UID 0, PPID 0
- **Open FDs**: 7 total (2 pipes for stdout/stderr, 1 eventpoll, 3 sockets, 1 null)
- **Child processes during inspection**: None active (subprocesses are short-lived, spawn-per-request)
- **Network**: Listening on 0.0.0.0:8000 (0x1F40), connected to Qdrant and DNS resolver
- **Execution model**: subprocess.run() spawns Python tool scripts per request, then reaps

## Container: brain-postgres
| PID | Process | Started By | Evidence |
|---|---|---|---|
| 1 | postgres | Docker entrypoint | `ps aux`, `cat /proc/1/cmdline` |
| 27 | postgres: checkpointer | PostgreSQL | ps aux |
| 28 | postgres: background writer | PostgreSQL | ps aux |
| 30 | postgres: walwriter | PostgreSQL | ps aux |
| 31 | postgres: autovacuum launcher | PostgreSQL | ps aux |
| 32 | postgres: logical replication launcher | PostgreSQL | ps aux |

## Container: brain-qdrant
| PID | Process | Started By | Evidence |
|---|---|---|---|
| 1 | ./entrypoint.sh → Qdrant 1.18.2 | Docker entrypoint | docker inspect Cmd: `["./entrypoint.sh"]` |
| 23 workers | actix-web service workers | Qdrant | Qdrant logs: "starting 23 workers" |

## Container: brain-ollama
| PID | Process | Started By | Evidence |
|---|---|---|---|
| 1 | /bin/ollama serve | Docker CMD | `ps aux` |

## Container: brain-openwebui
| PID | Process | Started By | Evidence |
|---|---|---|---|
| 1 | python3 -m uvicorn open_webui.main:app | Docker CMD | `/proc/1/cmdline` |

## Container: brain-repo-runtime
| PID | Process | Started By | Evidence |
|---|---|---|---|
| 1 | sleep infinity | Docker CMD | `ps aux` |

## Container: open-webui
| PID | Process | Started By | Evidence |
|---|---|---|---|
| 1 | python3 (uvicorn) | Docker CMD | docker inspect shows Cmd: `["bash", "start.sh"]` |

## NOT Running (defined in compose but absent)
- brain-neo4j
- brain-temporal
- brain-kafka
- brain-zookeeper
- brain-duckdb
- brain-opensearch
- brain-tika
- brain-vault
- newsletter-brain-worker
- newsletter-brain-dashboard
- digestion-worker

## No Active:
- Windows Scheduled Tasks matching PING/brain/crx/mission — NONE found
- systemd timers — N/A (WSL2 environment, no systemd)
- Cron jobs — NONE found
