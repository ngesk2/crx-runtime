# FRONTEND / BACKEND REALITY GAP REPORT

**Repository**: CRX (Constitutional Runtime eXtension)
**Analysis Date**: 2026-06-13
**Phase**: PHASE 7 — FRONTEND / BACKEND REALITY GAP

---

## EXECUTIVE SUMMARY

**Frontend**: Next.js UI (CascadeProjects/infra/ui-next)
**Backend**: Gateway (Express) + Commit Service (Express)

**Frontend Assumptions**: 
- Gateway exists at http://localhost:8080
- Gateway exposes /api/v1/chat endpoint
- Gateway returns model, provider, latency_ms in response

**Backend Reality**:
- Gateway exists at http://localhost:8080 (matches)
- Gateway exposes /api/v1/chat endpoint (matches)
- Gateway returns model, provider, latency_ms in response (matches)

**Gap Assessment**: MINIMAL (frontend and backend are aligned for chat functionality)

**Critical Issue**: Hardcoded localhost URL in frontend (won't work in containerized deployment)

---

## FRONTEND API ASSUMPTIONS

### Next.js UI Chat Page
**Location**: CascadeProjects/infra/ui-next/src/app/chat/page.tsx

**API Call**:
```typescript
const response = await fetch('http://localhost:8080/api/v1/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: [...messages, userMessage] })
})
```

**Assumptions**:
1. Gateway is accessible at http://localhost:8080
2. Gateway accepts POST requests to /api/v1/chat
3. Gateway accepts JSON body with messages array
4. Gateway returns JSON response with content field

**Expected Response Structure**:
```typescript
{
  content: string,
  model: string,
  provider: string,
  latency_ms: number
}
```

---

## BACKEND API REALITY

### Gateway API Routes
**Location**: gateway/server.js

**Actual Endpoints**:
1. `GET /health` - Health check
2. `POST /api/v1/chat` - Chat endpoint
3. `GET /api/v1/models` - Models list

### /api/v1/chat Endpoint
**Implementation**:
```javascript
app.post('/api/v1/chat', async (req, res) => {
  const { messages = [] } = req.body;
  const result = await invokeOllama(messages);
  const latency_ms = Date.now() - started;
  
  if (!result.success) {
    return res.status(500).json({
      error: result.error,
      provider: result.provider,
      model: result.model,
      latency_ms
    });
  }
  
  return res.json({
    content: result.content,
    provider: result.provider,
    model: result.model,
    latency_ms
  });
});
```

**Actual Request Structure**:
```javascript
{
  messages: Array<{role: string, content: string}>
}
```

**Actual Response Structure**:
```javascript
{
  content: string,
  provider: string,
  model: string,
  latency_ms: number
}
```

**Error Response Structure**:
```javascript
{
  error: string,
  provider: string,
  model: string,
  latency_ms: number
}
```

---

## COMMIT SERVICE API (NOT USED BY FRONTEND)

### Commit Service Endpoints
**Location**: runtime/kernel/commit-service/src/server.ts

**Actual Endpoints**:
1. `POST /kernel/commit` - Commit artifact with lineage
2. `GET /kernel/audit` - Audit artifacts

### /kernel/commit Endpoint
**Implementation**:
```typescript
app.post("/kernel/commit", commitArtifact)
```

**Request Structure**:
```typescript
{
  artifact: {
    artifact_type: string,
    content: any
  },
  lineage: {
    parents: string[]
  }
}
```

**Response Structure**:
```typescript
{
  accepted: boolean,
  artifact_id: string
}
```

**Frontend Usage**: NONE (frontend does not call commit service)

---

## API ROUTE AUDIT

### Frontend Calls
| Endpoint | Method | Called By | Backend Exists | Status |
|----------|--------|-----------|----------------|--------|
| http://localhost:8080/api/v1/chat | POST | chat/page.tsx | YES (gateway) | ALIGNED |
| /api/health | GET | N/A | YES (gateway) | NOT USED |
| /api/v1/models | GET | N/A | YES (gateway) | NOT USED |

### Backend Exposes (Not Called by Frontend)
| Endpoint | Method | Location | Frontend Usage | Status |
|----------|--------|----------|----------------|--------|
| /health | GET | gateway/server.js | NONE | STALE |
| /api/v1/models | GET | gateway/server.js | NONE | STALE |
| /kernel/commit | POST | commit-service | NONE | STALE |
| /kernel/audit | GET | commit-service | NONE | STALE |

---

## FETCH URL ANALYSIS

### Frontend Fetch URLs
1. `http://localhost:8080/api/v1/chat` (chat/page.tsx line 33)

**Issues**:
- Hardcoded localhost (won't work in containerized deployment)
- No environment variable configuration
- No fallback URL
- No error handling for network failures

**Recommendation**: Use NEXT_PUBLIC_GATEWAY_URL environment variable

---

## GATEWAY ASSUMPTIONS

### Frontend Gateway Assumptions
1. Gateway is always available
2. Gateway responds within reasonable time
3. Gateway returns expected JSON structure
4. Gateway handles errors gracefully

**Reality**:
- Gateway has 120-second timeout for Ollama calls
- Gateway returns error responses with provider, model, latency_ms
- Gateway has no retry logic
- Gateway has no circuit breaker

**Gap**: Frontend assumes gateway availability, but no health checks or fallbacks exist

---

## WEBSOCKET ASSUMPTIONS

### Frontend WebSocket Usage
**Status**: NONE

**Backend WebSocket Support**
**Status**: NONE

**Gap**: NONE (no WebSocket assumptions)

---

## PROXY ASSUMPTIONS

### Frontend Proxy Assumptions
**Status**: NONE (direct HTTP calls to gateway)

**Backend Proxy Support**
**Status**: NONE (gateway is a proxy to Ollama, not a proxy for frontend)

**Gap**: NONE

---

## STALE ENDPOINTS

### Gateway Stale Endpoints
1. `GET /health` - Exposed but not called by frontend
2. `GET /api/v1/models` - Exposed but not called by frontend

**Status**: STALE (could be used for monitoring or model selection)

**Recommendation**: Keep for debugging/monitoring purposes

---

### Commit Service Stale Endpoints
1. `POST /kernel/commit` - Exposed but not called by frontend
2. `GET /kernel/audit` - Exposed but not called by frontend

**Status**: STALE (not integrated with frontend)

**Recommendation**: Integrate with frontend if artifact management is needed, or remove if not used

---

## DEAD UI PANELS

### Next.js UI View Modes
**Location**: CascadeProjects/infra/ui-next/src/app/chat/page.tsx

**View Modes**:
1. Chat (ACTIVE)
2. Observatory (NOT IMPLEMENTED)
3. Architecture (NOT IMPLEMENTED)

**Observatory Mode**
- Button exists (line 91-99)
- Component imported (ObservatoryMode)
- Component not implemented (empty or stub)

**Architecture Mode**
- Button exists (line 102-111)
- Component imported (ArchitectureView)
- Component not implemented (empty or stub)

**Status**: DEAD UI PANELS (buttons exist but components not implemented)

---

## FRONTEND COMPONENTS NOT IMPLEMENTED

### Imported Components
**Location**: CascadeProjects/infra/ui-next/src/components/

1. **MissionControlHeader** (imported, not implemented)
2. **PremiumChatBubble** (imported, not implemented)
3. **ObservatoryMode** (imported, not implemented)
4. **ArchitectureView** (imported, not implemented)
5. **EmptyStateRedesign** (imported, not implemented)
6. **PromptLibrary** (imported, not implemented)
7. **MarkdownRenderer** (imported, not used)
8. **MessageInput** (imported, not used)

**Status**: DEAD COMPONENTS (imported but not implemented)

---

## RESPONSE STRUCTURE VALIDATION

### Frontend Expected Response
```typescript
{
  content: string,
  metadata: {
    model: string,
    provider: string,
    generationTime: number,
    tokenCount: number
  }
}
```

### Backend Actual Response
```javascript
{
  content: string,
  provider: string,
  model: string,
  latency_ms: number
}
```

### Frontend Mapping
```typescript
metadata: {
  model: data.model || 'qwen3-coder',
  provider: data.provider || 'ollama',
  generationTime: data.latency_ms / 1000,
  tokenCount: Math.floor(data.content.length / 4)
}
```

**Gap**: Frontend adds computed fields (generationTime, tokenCount) that backend doesn't provide

**Status**: ACCEPTABLE (frontend computes additional metadata)

---

## ERROR HANDLING GAP

### Frontend Error Handling
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

### Backend Error Handling
```javascript
if (!result.success) {
  return res.status(500).json({
    error: result.error,
    provider: result.provider,
    model: result.model,
    latency_ms
  });
}
```

**Gap**: Frontend doesn't handle HTTP error responses (only network errors)

**Status**: MINOR GAP (frontend should handle HTTP error responses)

---

## SUMMARY

**Frontend/Backend Alignment**: GOOD (for chat functionality)

**Critical Issues**:
1. Hardcoded localhost URL in frontend (deployment risk)
2. Frontend doesn't handle HTTP error responses
3. Commit service endpoints not integrated with frontend

**Stale Endpoints**:
- Gateway: /health, /api/v1/models (not called by frontend)
- Commit Service: /kernel/commit, /kernel/audit (not called by frontend)

**Dead UI Panels**:
- Observatory mode (button exists, component not implemented)
- Architecture mode (button exists, component not implemented)

**Dead Components**:
- 8 React components imported but not implemented

**Recommendations**:
1. Replace hardcoded localhost with NEXT_PUBLIC_GATEWAY_URL
2. Add HTTP error response handling in frontend
3. Either integrate commit service with frontend or remove unused endpoints
4. Remove or implement dead UI panels and components
5. Add health check calls from frontend to gateway
