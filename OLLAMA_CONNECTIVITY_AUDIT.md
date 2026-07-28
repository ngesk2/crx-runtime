OLLAMA CONNECTIVITY AUDIT
=========================

Purpose
-------
Answer the connectivity and operational questions for the local Ollama inference service and provide reproducible tests to verify reachability from host, WSL, and Docker, plus embedding/generation tests and failure-recovery steps.

Quick summary (live observation)
--------------------------------
- Local host `http://localhost:11434` responded to `GET /api/tags` and returned models including:
  - `qwen2.5-coder:14b` (qwen family)
  - `llama3:latest` (llama family)
  - `nomic-embed-text:latest` (embed model)
- In the current environment the Ollama instance did not require authentication for `GET /api/tags`.

Checklist & Questions
---------------------
1. Is `localhost:11434` reachable from the host?
   - Test: `curl -sS http://localhost:11434/api/tags` → expect 200 + JSON with `models` array.

2. Is WSL → Ollama reachable?
   - Test from WSL: `curl -sS http://localhost:11434/api/tags` (same as host). If WSL is using host network, this should succeed.

3. Is Docker → host Ollama reachable?
   - Host-binding: Ollama listens on host port 11434 (published). From a container, reach host via `host.docker.internal` on Windows/Mac, or the host's IP on Linux.
   - Test from a container: `docker run --rm curlimages/curl:7.88.1 curl -sS http://host.docker.internal:11434/api/tags`

4. Is Docker Compose service name reachable (service-to-service)?
   - Inside compose network, services can reach Ollama by the service name (`ollama`) if compose defines it. Test from a running service container: `curl -sS http://ollama:11434/api/tags`.
   - Note: the name only resolves inside the compose network.

5. Authentication required?
   - Test: `curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:11434/api/tags` → `200` indicates no auth required for this endpoint. If behind auth, Ollama returns 401/403 for protected endpoints.

6. Model inventory
   - Expected models to verify exist:
     - `nomic-embed-text`
     - `qwen*` family
     - `llama*` family
     - `deepseek` (if installed)
   - Test: inspect `GET /api/tags` JSON and look for the model names above.

7. Embedding test (POST /api/embeddings)
   - Example curl:

```bash
curl -sS -X POST http://localhost:11434/api/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"nomic-embed-text:latest","input":"hello world"}'
```

- Expected: 200 and JSON containing an `embedding` array of numbers.

8. Generation test (POST /api/generate)
   - Example curl:

```bash
curl -sS -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen2.5-coder:14b","prompt":"Summarize: hello world","max_tokens":64}'
```

- Expected: 200 and JSON with `completion`/`output` text.

9. Concurrent request test
   - Use xargs or parallel to send multiple embedding requests concurrently (example using GNU parallel):

```bash
printf '1\n2\n3\n4\n' | parallel -j4 \
  curl -sS -X POST http://localhost:11434/api/embeddings -H "Content-Type: application/json" -d '{"model":"nomic-embed-text:latest","input":"hello world"}'
```

- On Windows PowerShell, use background jobs or `Start-Job` to spawn concurrent requests.
- Expected: service responds to concurrent requests without crashing; measure latency and error rates.

10. Failure recovery test
    - Stop the Ollama container or process, then restart it and confirm it returns to serving requests.
    - Commands (Docker):

```bash
docker stop brain-ollama
sleep 5
docker start brain-ollama
curl -sS http://localhost:11434/api/tags
```

    - Expected: after restart, `GET /api/tags` returns the model list again. If models are stored on disk or require loading, allow model warmup time.

Diagnostics & Troubleshooting
-----------------------------
- If `localhost:11434` fails from host but container is running: inspect container logs `docker logs brain-ollama`.
- If WSL cannot reach host `localhost`, try `curl http://host.docker.internal:11434` (WSL2 on Windows may map differently).
- If containers cannot resolve service name `ollama`, confirm `docker-compose` service name and that requests are made from within the same compose network.

Sample Python snippet (embedding test)
-------------------------------------

```python
import requests
resp = requests.post('http://localhost:11434/api/embeddings', json={
    'model':'nomic-embed-text:latest',
    'input':'hello world'
}, timeout=10)
print(resp.status_code)
print(resp.json())
```

Interpretation guidance
-----------------------
- 200 + expected JSON structure = reachable and usable.
- 401/403 = authentication required.
- 5xx or connection refused = service down or misconfigured.
- High error rate on concurrent tests = capacity or model-loading issues; consider model warmup.

Appendix: observed live response (from earlier probe)
-----------------------------------------------------
We successfully queried `GET /api/tags` and received a models list including `qwen2.5-coder:14b`, `llama3:latest`, and `nomic-embed-text:latest`.

Next steps (pick one)
---------------------
- I can run the embedding and generation tests now from this environment and report results (will attempt to reach `http://localhost:11434`).
- I can generate a small script that runs all checks (host/WSL/Docker/service-name/concurrency/recovery) and aggregates results into `OLLAMA_CONNECTIVITY_AUDIT.md`.

Which would you like me to do next?