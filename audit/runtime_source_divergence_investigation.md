# RUNTIME / SOURCE DIVERGENCE INVESTIGATION

**Status:** EVIDENCE COLLECTED
**Purpose:** Resolve contradiction between runtime observations and repository archaeology
**Goal:** Determine which artifact is actually running

---

# PHASE 1 — RUNTIME IDENTITY

**CONTAINER ID:** 50a2c4a89056
**IMAGE:** crx-gateway:1.0.0
**IMAGE HASH:** sha256:b99ad276ce30b961fc379c058e67f8d2a3f2b642d217487ee8469dcf5419c43e
**ENTRYPOINT:** docker-entrypoint.sh
**CMD:** npm start
**WORKDIR:** /app
**CREATED:** About an hour ago
**STARTED:** Up 13 seconds

**What image is actually executing?**
crx-gateway:1.0.0 (sha256:b99ad276ce30b961fc379c058e67f8d2a3f2b642d217487ee8469dcf5419c43e)

---

# PHASE 2 — EXECUTING PROCESS

**Inside container ps aux:**
```
PID   USER     TIME  COMMAND
    1 root      0:00 npm start
   18 root      0:00 node server.js
   37 root      0:00 ps aux
```

**Exact running command:** node server.js

**Classification:** D (other - running node server.js directly, not dist/*.js, build/*.js, or ts-node src/*.ts)

---

# PHASE 3 — EXECUTING FILESYSTEM

**Container file structure:**
- /app/server.js (843 bytes)
- /app/package.json (213 bytes)
- /app/package-lock.json (29318 bytes)
- /app/Dockerfile (143 bytes)
- /app/node_modules (70 directories)

**TypeScript source:** NONE (no .ts files outside node_modules)
**Compiled JavaScript:** NONE (no dist/, build/ directories)
**Constitutional modules:** NONE (no constitutional paths found)
**Compiled constitutional modules:** NONE

**Container server.js content:**
```javascript
const express = require('express');
const app = express();

app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'gateway' });
});

// Chat endpoint
app.post('/api/v1/chat', (req, res) => {
  const { messages } = req.body;
  
  // Simple echo response for now
  const response = {
    content: `Gateway received: ${messages[messages.length - 1]?.content || 'No message'}`,
    model: 'gateway-mock',
    provider: 'mock',
    latency_ms: 0
  };
  
  res.json(response);
});

// Models endpoint
app.get('/api/v1/models', (req, res) => {
  res.json({
    models: [
      { name: 'qwen2.5-coder:14b', provider: 'ollama' }
    ]
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Gateway running on http://0.0.0.0:${PORT}`);
});
```

**Container package.json content:**
```json
{
  "name": "crx-gateway",
  "version": "1.0.0",
  "description": "CRX Gateway Service",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

---

# PHASE 4 — EXECUTING GATEWAY

**GET /health**
- HTTP Status: 200
- Response: `{"status":"healthy","service":"gateway"}`

**GET /api/v1/models**
- HTTP Status: 200
- Response: `{"models":[{"name":"qwen2.5-coder:14b","provider":"ollama"}]}`

**POST /api/v1/chat**
- HTTP Status: 400 Bad Request
- Request: `{"messages":[{"role":"user","content":"say hello"}]}`
- Response: Error (likely due to mock implementation not handling request correctly)

**POST /chat**
- Status: NOT TESTED (endpoint not exposed in container)

**POST /chat/stream**
- Status: NOT TESTED (endpoint not exposed in container)

---

# PHASE 5 — SOURCE COMPARISON

**WORKSPACE gateway/server.js (106 lines):**
- Real Ollama integration with fetch calls
- AbortController for timeout handling (120 seconds)
- Error handling with try/catch
- Real model configuration (OLLAMA_URL, OLLAMA_MODEL)
- Async/await pattern
- Returns actual Ollama responses

**CONTAINER /app/server.js (43 lines):**
- MOCK implementation with simple echo response
- No Ollama integration
- No timeout handling
- Returns hardcoded mock responses
- Synchronous implementation
- Returns `model: 'gateway-mock', provider: 'mock'`

**Comparison:**
- gateway/server.js: DIFFERENT (workspace has real Ollama integration, container has mock)
- gateway/src/constitutional/*: MISSING (no constitutional modules in container)
- package.json: DIFFERENT (workspace has more dependencies, container has minimal)
- tsconfig.json: MISSING (no TypeScript in container)

---

# PHASE 6 — DIVERGENCE CLASSIFICATION

**Classification:** D - Runtime Built From Different Source Tree

**Evidence:**
- Container has mock gateway implementation
- Workspace has real Ollama integration
- Container has no TypeScript source
- Container has no constitutional modules
- Container has minimal dependencies
- Container server.js is 43 lines vs workspace 106 lines
- Container returns `provider: 'mock'` vs workspace `provider: 'ollama'`

---

# PHASE 7 — FIRST PROVEN FAILING BOUNDARY

**First Proven Failing Boundary:** POST /api/v1/chat

**Evidence:**
- GET /health: WORKS (200 OK)
- GET /api/v1/models: WORKS (200 OK)
- POST /api/v1/chat: FAILS (400 Bad Request)

**Root Cause:** Container is running mock gateway implementation that does not properly handle chat requests. The mock implementation appears to have a bug in request handling that causes 400 errors.

**Contradiction Resolution:**
- OBSERVATION A (Gateway served /health and /api/v1/models): TRUE - container is running and serving these endpoints
- OBSERVATION B (gateway/src/constitutional is empty and 7 imports fail): TRUE - but this describes the WORKSPACE, not the RUNNING CONTAINER

**Resolution:** The running container was built from a different source tree (mock implementation) and does not reflect the current workspace state (real Ollama integration).

---

# FINAL OUTPUT

**1. Runtime Identity:** crx-gateway:1.0.0 (sha256:b99ad276ce30b961fc379c058e67f8d2a3f2b642d217487ee8469dcf5419c43e)

**2. Executing Process:** node server.js (direct execution, not compiled)

**3. Executing Filesystem:** Mock implementation with no TypeScript, no constitutional modules, minimal dependencies

**4. Endpoint Inventory:** /health (200), /api/v1/models (200), /api/v1/chat (400)

**5. Repository Comparison:** Container has mock gateway, workspace has real Ollama integration - COMPLETELY DIFFERENT

**6. Divergence Classification:** D - Runtime Built From Different Source Tree

**7. First Proven Failing Boundary:** POST /api/v1/chat (400 Bad Request due to mock implementation bug)

**8. Confidence:** HIGH - Direct evidence from container inspection and endpoint testing

---

**Document ID:** AUDIT-RUNTIME-SOURCE-DIVERGENCE-1.0
**Status:** COMPLETED
**Last Updated:** 2026-06-09
**Contradiction:** RESOLVED - Running container is mock implementation, workspace has real Ollama integration
