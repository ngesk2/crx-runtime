# RUNTIME HARDENING

**Repository**: CRX (Constitutional Runtime eXtension)
**Date**: 2026-06-13
**Authority**: EXECUTION TRUTH ONLY

---

## HARDENING PRINCIPLES

**Focus ONLY on**:
- Actual runtime risks identified by forensic audit
- Stabilization of existing functionality
- Production readiness of current architecture

**DO NOT suggest**:
- Kubernetes
- Redis
- Queues
- Microservices
- Orchestration
- Vector DBs
- Agent frameworks
- Observability stacks
- Event buses
- Abstractions

**Goal**: Stabilize the real runtime, not add speculative complexity.

---

## RISK 1: HARDCODED LOCALHOST URL

### Location
`CascadeProjects/infra/ui-next/src/app/chat/page.tsx` line 33

### Current Code
```typescript
const response = await fetch('http://localhost:8080/api/v1/chat', {...})
```

### Risk
**HIGH** - Containerization failure. If Next.js UI is containerized, `localhost:8080` will not resolve to the Gateway service.

### Fix
**Add environment variable support**

#### Step 1: Create .env.example
**File**: `CascadeProjects/infra/ui-next/.env.example`
```bash
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8080
```

#### Step 2: Update chat/page.tsx
**File**: `CascadeProjects/infra/ui-next/src/app/chat/page.tsx`
```typescript
const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8080';

const response = await fetch(`${GATEWAY_URL}/api/v1/chat`, {...})
```

#### Step 3: Update Dockerfile
**File**: `CascadeProjects/infra/ui-next/Dockerfile`
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
ARG NEXT_PUBLIC_GATEWAY_URL=http://localhost:8080
ENV NEXT_PUBLIC_GATEWAY_URL=${NEXT_PUBLIC_GATEWAY_URL}
EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "start"]
```

### Priority
**CRITICAL** - Blocks containerized deployment

---

## RISK 2: DOCKER DNS ASSUMPTION

### Location
`gateway/server.js` line 7

### Current Code
```javascript
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://crx-ollama:11434';
```

### Risk
**HIGH** - DNS resolution failure. Default assumes Docker network with service named `crx-ollama`. Will fail in non-Docker environments.

### Fix
**Change default to localhost**

#### Step 1: Update gateway/server.js
**File**: `gateway/server.js`
```javascript
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
```

#### Step 2: Create .env.example
**File**: `gateway/.env.example`
```bash
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:14b
PORT=8080
```

### Priority
**CRITICAL** - Blocks non-Docker deployment

---

## RISK 3: EMPTY DATABASE_URL DEFAULT

### Location
`runtime/kernel/commit-service/src/persistence/db.ts` line 10

### Current Code
```typescript
export const pool = createPool(process.env.DATABASE_URL || '')
```

### Risk
**HIGH** - Runtime failure. Empty string will cause Postgres connection to fail. No validation on startup.

### Fix
**Add validation on startup**

#### Step 1: Update db.ts
**File**: `runtime/kernel/commit-service/src/persistence/db.ts`
```typescript
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});
```

#### Step 2: Create .env.example
**File**: `runtime/kernel/commit-service/.env.example`
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/crx
PORT=8081
```

### Priority
**CRITICAL** - Silent runtime failure

---

## RISK 4: PORT CONFLICT

### Location
- `gateway/server.js` line 102 (defaults to 8080)
- `runtime/kernel/commit-service/src/server.ts` line 12 (hardcoded to 8080)

### Current Code
```javascript
// gateway/server.js
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {...})

// commit-service/src/server.ts
app.listen(8080, () => {...})
```

### Risk
**MODERATE** - Service conflict. Both services default to port 8080, cannot run simultaneously.

### Fix
**Change Commit Service default port to 8081**

#### Step 1: Update commit-service/server.ts
**File**: `runtime/kernel/commit-service/src/server.ts`
```typescript
const PORT = process.env.PORT || 8081;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Commit service listening on port ${PORT}`);
});
```

#### Step 2: Update .env.example
**File**: `runtime/kernel/commit-service/.env.example`
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/crx
PORT=8081
```

### Priority
**HIGH** - Prevents running both services simultaneously

---

## RISK 5: MISSING HEALTH CHECKS

### Location
- `gateway/server.js` - Has `/health` endpoint
- `runtime/kernel/commit-service/src/server.ts` - No health check
- `CascadeProjects/infra/ui-next` - Has `/api/health` endpoint

### Risk
**MODERATE** - No way to verify Commit Service is running. No database connectivity check.

### Fix
**Add health check to Commit Service**

#### Step 1: Add health check endpoint
**File**: `runtime/kernel/commit-service/src/server.ts`
```typescript
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected', error: err.message });
  }
});
```

#### Step 2: Improve Gateway health check
**File**: `gateway/server.js`
```javascript
app.get('/health', async (req, res) => {
  try {
    // Test Ollama connectivity
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      res.json({ status: 'healthy', ollama: 'connected' });
    } else {
      res.status(503).json({ status: 'degraded', ollama: 'unreachable' });
    }
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', ollama: 'disconnected', error: err.message });
  }
});
```

### Priority
**MEDIUM** - Improves observability

---

## RISK 6: UNHANDLED FETCH FAILURES

### Location
`CascadeProjects/infra/ui-next/src/app/chat/page.tsx` line 33-58

### Current Code
```typescript
try {
  const response = await fetch('http://localhost:8080/api/v1/chat', {...})
  if (response.ok) {
    const data = await response.json()
    // handle success
  }
} catch (error) {
  console.error('Error:', error)
  setMessages(prev => [...prev, { 
    role: 'assistant', 
    content: 'Error connecting to gateway',
    timestamp: new Date()
  }])
}
```

### Risk
**MODERATE** - HTTP error responses not handled. Only network errors are caught.

### Fix
**Handle HTTP error responses**

#### Step 1: Update chat/page.tsx
**File**: `CascadeProjects/infra/ui-next/src/app/chat/page.tsx`
```typescript
try {
  const response = await fetch(`${GATEWAY_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [...messages, userMessage] })
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  
  const data = await response.json()
  // handle success
} catch (error) {
  console.error('Error:', error)
  setMessages(prev => [...prev, { 
    role: 'assistant', 
    content: `Error: ${error.message}`,
    timestamp: new Date()
  }])
}
```

### Priority
**MEDIUM** - Better error handling

---

## RISK 7: MISSING ENV VALIDATION

### Location
All services lack environment variable validation on startup

### Risk
**MODERATE** - Silent failures when required env vars are missing.

### Fix
**Add env validation on startup**

#### Step 1: Create env validation for Gateway
**File**: `gateway/server.js`
```javascript
const requiredEnvVars = ['OLLAMA_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}
```

#### Step 2: Create env validation for Commit Service
**File**: `runtime/kernel/commit-service/src/server.ts`
```typescript
const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}
```

### Priority
**MEDIUM** - Fail fast on configuration errors

---

## RISK 8: MISSING RETRIES/TIMEOUTS

### Location
`gateway/server.js` - Has 120-second timeout, no retries

### Current Code
```javascript
const timeout = setTimeout(() => {
  controller.abort();
}, 120000);
```

### Risk
**LOW** - No retry logic for transient failures. 120-second timeout is reasonable but no retry.

### Fix
**Add simple retry logic**

#### Step 1: Add retry helper
**File**: `gateway/server.js`
```javascript
async function fetchWithRetry(url, options, maxRetries = 3, timeout = 120000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      }
      
      if (i === maxRetries - 1) {
        return response;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

#### Step 2: Use retry in invokeOllama
**File**: `gateway/server.js`
```javascript
const response = await fetchWithRetry(`${OLLAMA_URL}/api/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: OLLAMA_MODEL, messages, stream: false })
}, 3, 120000);
```

### Priority
**LOW** - Improves resilience

---

## RISK 9: STARTUP FAILURES

### Location
All services lack graceful startup error handling

### Risk
**LOW** - Services may crash silently on startup errors.

### Fix
**Add startup error handling**

#### Step 1: Add startup error handling to Gateway
**File**: `gateway/server.js`
```javascript
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Gateway listening on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
```

#### Step 2: Add startup error handling to Commit Service
**File**: `runtime/kernel/commit-service/src/server.ts`
```typescript
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Commit service listening on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
```

### Priority
**LOW** - Better error messages

---

## RISK 10: MISSING GRACEFUL SHUTDOWN

### Location
All services lack graceful shutdown handling

### Risk
**LOW** - In-flight requests may be dropped on shutdown.

### Fix
**Add graceful shutdown**

#### Step 1: Add graceful shutdown to Gateway
**File**: `gateway/server.js`
```javascript
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Gateway listening on port ${PORT}`);
});

const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}, shutting down gracefully`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

#### Step 2: Add graceful shutdown to Commit Service
**File**: `runtime/kernel/commit-service/src/server.ts`
```typescript
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Commit service listening on port ${PORT}`);
});

const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}, shutting down gracefully`);
  
  // Close database connections
  await pool.end();
  console.log('Database connections closed');
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

### Priority
**LOW** - Better shutdown behavior

---

## HARDENING PRIORITY ORDER

### CRITICAL (Blocks deployment)
1. Fix hardcoded localhost URL in Next.js UI
2. Fix Docker DNS assumption in Gateway
3. Add DATABASE_URL validation in Commit Service
4. Resolve port conflict (change Commit Service to 8081)

### HIGH (Improves reliability)
5. Add health check to Commit Service
6. Add env validation on startup

### MEDIUM (Improves observability)
7. Handle HTTP error responses in Next.js UI
8. Improve Gateway health check with Ollama connectivity

### LOW (Nice to have)
9. Add retry logic to Gateway
10. Add startup error handling
11. Add graceful shutdown

---

## ESTIMATED EFFORT

- CRITICAL fixes: 2-4 hours
- HIGH fixes: 1-2 hours
- MEDIUM fixes: 1-2 hours
- LOW fixes: 2-3 hours

**Total**: 6-11 hours

---

## TESTING RECOMMENDATIONS

After each fix:
1. Restart service
2. Verify health check
3. Test actual functionality
4. Verify error handling

After all fixes:
1. Test containerized deployment
2. Test with missing env vars
3. Test with database down
4. Test with Ollama down
5. Test graceful shutdown

---

## WHAT NOT TO DO

**DO NOT add**:
- Kubernetes manifests
- Redis integration
- Message queues
- Microservices
- Service mesh
- Observability stacks
- Event buses
- Vector databases
- Agent frameworks

**Reason**: The current architecture is simple and functional. Adding these would increase complexity without addressing actual runtime risks.

---

## SUMMARY

**Critical Risks**: 4 (hardcoded URLs, DNS assumptions, empty defaults, port conflicts)
**High Risks**: 2 (health checks, env validation)
**Medium Risks**: 2 (error handling, observability)
**Low Risks**: 3 (retries, startup errors, graceful shutdown)

**Focus**: Stabilize the existing runtime for production deployment without adding speculative complexity.

**Goal**: Make the simple HTTP proxy chain robust and production-ready.
