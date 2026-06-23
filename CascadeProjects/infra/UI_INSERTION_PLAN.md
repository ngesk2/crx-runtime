# CRX UI Insertion Plan

**Date**: 2026-06-08  
**Location**: C:\Users\nolan\CRX\CascadeProjects\infra  
**Phase**: PHASE D — UI Insertion Plan  
**Mission**: Design UI integration with Gateway → Provider → Replay Kernel architecture

---

## 1. Architecture Requirements

### 1.1 Required Flow

```
UI (Next.js)
  ↓ HTTP
Gateway (REST API)
  ↓ HTTP
Provider (Ollama/OpenRouter)
  ↓ (optional)
Replay Kernel (certification/witness)
```

### 1.2 Forbidden Flow

```
❌ UI → Provider (direct)
❌ UI → Ollama (direct)
❌ UI → OpenRouter (direct)
```

**Rationale**: Gateway provides:
- Provider abstraction
- Caching layer
- Observability
- Rate limiting
- Replay Kernel integration point
- Single authority boundary

### 1.3 Architectural Principles

✅ **UI is stateless** - No direct provider connections  
✅ **UI is presentation layer** - No business logic  
✅ **Gateway is authority boundary** - All LLM calls go through Gateway  
✅ **Replay Kernel is certification authority** - Optional certification path  

---

## 2. Service Placement

### 2.1 Directory Structure

```
CRX/CascadeProjects/infra/
├── ui-next/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── chat/
│       │       └── page.tsx
│       ├── components/
│       │   ├── ChatInterface.tsx
│       │   ├── MessageList.tsx
│       │   └── ModelSelector.tsx
│       ├── lib/
│       │   ├── gateway-client.ts
│       │   └── types.ts
│       └── styles/
│           └── globals.css
```

### 2.2 Technology Stack

**Framework**: Next.js 14+ (App Router)  
**Language**: TypeScript  
**Styling**: Tailwind CSS  
**Components**: React Server Components + Client Components  
**State Management**: React hooks (useState, useReducer)  
**HTTP Client**: Native fetch (no Axios, no custom wrappers)  

**Dependencies**: Minimal
- `next`
- `react`
- `react-dom`
- `typescript`
- `tailwindcss`
- `lucide-react` (icons)

**No AI/LLM libraries** - All LLM calls via Gateway

---

## 3. Routing

### 3.1 Application Routes

```
/                    → Landing page (redirects to /chat)
/chat               → Main chat interface
/models             → Model selection and info
/settings           → Configuration (provider, model)
/health             → System health status
```

### 3.2 Chat Interface

**Route**: `/chat`

**Features**:
- Message history display
- Message input
- Model selector
- Provider status indicator
- Streaming response support
- Error handling

**Components**:
- `ChatInterface` - Main container
- `MessageList` - Display conversation
- `MessageInput` - Input field with send button
- `ModelSelector` - Dropdown for model selection
- `StatusIndicator` - Provider health status

### 3.3 API Routes (Next.js)

**Internal API Routes** (optional, for server-side calls):
```
/api/chat          → Proxy to Gateway (server-side)
/api/models        → Proxy to Gateway (server-side)
/api/health        → Proxy to Gateway (server-side)
```

**Note**: Can also call Gateway directly from client-side. Server-side routes provide:
- CORS handling
- Request/response transformation
- Additional authentication (future)

---

## 4. Gateway Client

### 4.1 Client Implementation

```typescript
// src/lib/gateway-client.ts

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: Message[];
  model?: string;
  provider?: string;
  temperature?: number;
  max_tokens?: number;
}

interface ChatResponse {
  content: string;
  model: string;
  provider: string;
  tokens_used?: number;
  latency_ms: number;
}

class GatewayClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      throw new Error(`Gateway error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async listModels(): Promise<{ name: string; provider: string }[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/models`);
    if (!response.ok) {
      throw new Error(`Gateway error: ${response.statusText}`);
    }
    const data = await response.json();
    return data.models;
  }
  
  async health(): Promise<{ status: string; providers: Record<string, boolean> }> {
    const response = await fetch(`${this.baseUrl}/api/v1/health`);
    if (!response.ok) {
      throw new Error(`Gateway error: ${response.statusText}`);
    }
    return response.json();
  }
}

export const gateway = new GatewayClient();
```

### 4.2 Usage in Components

```typescript
// src/components/ChatInterface.tsx

'use client';

import { useState } from 'react';
import { gateway } from '@/lib/gateway-client';

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  
  const sendMessage = async (content: string) => {
    setLoading(true);
    try {
      const request = {
        messages: [...messages, { role: 'user', content }],
        model: 'qwen2.5-coder:7b'
      };
      
      const response = await gateway.chat(request);
      
      setMessages([
        ...messages,
        { role: 'user', content },
        { role: 'assistant', content: response.content }
      ]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // ... render UI
}
```

---

## 5. Authentication Assumptions

### 5.1 Current State

**Authentication**: NONE

**Rationale**: Local development environment, no external access required.

### 5.2 Future Authentication (Optional)

**Phase 1**: No authentication  
**Phase 2**: Basic API key (if external access needed)  
**Phase 3**: OAuth/OIDC (if multi-user)  

**Implementation Location**: Gateway layer (not UI)

**UI Changes**: Minimal - just add token to Gateway client

```typescript
class GatewayClient {
  private apiKey?: string;
  
  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    const response = await fetch(`${this.baseUrl}/api/v1/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    });
    
    // ...
  }
}
```

---

## 6. Replay Kernel Integration Points

### 6.1 Current Architecture

```
UI → Gateway → Provider
```

### 6.2 Future Architecture (with Replay Kernel)

```
UI → Gateway → Provider → Replay Kernel (certification)
                     ↓
                (certified response)
```

### 6.3 Integration Points

#### 6.3.1 Certification Request (Gateway → Replay Kernel)

**When to certify**:
- Critical code changes
- Constitutional violations
- User-initiated certification
- Periodic certification (configurable)

**Gateway Flow**:
```typescript
async chatWithCertification(request: ChatRequest): Promise<ChatResponse> {
  // 1. Get response from provider
  const response = await this.provider.chat(request.messages, request.options);
  
  // 2. Check if certification required
  if (this.shouldCertify(request, response)) {
    // 3. Send to Replay Kernel for certification
    const certified = await this.replayKernel.certify({
      request,
      response,
      context: this.buildContext(request)
    });
    
    // 4. Return certified response
    return certified.response;
  }
  
  // 5. Return uncetified response
  return response;
}
```

#### 6.3.2 Witness Authority (Replay Kernel)

**Replay Kernel Responsibilities**:
- Witness LLM interactions
- Certify responses
- Detect constitutional violations
- Maintain audit trail

**UI Integration**:
- Display certification status
- Show witness metadata
- Allow manual certification requests
- Display constitutional violations

### 6.4 UI Components for Replay Integration

#### 6.4.1 Certification Badge

```typescript
interface CertificationBadgeProps {
  certified: boolean;
  witnessId?: string;
  timestamp?: Date;
}

export function CertificationBadge({ certified, witnessId, timestamp }: CertificationBadgeProps) {
  if (!certified) {
    return <span className="badge-uncertified">Uncertified</span>;
  }
  
  return (
    <span className="badge-certified">
      Certified by {witnessId} at {timestamp?.toLocaleString()}
    </span>
  );
}
```

#### 6.4.2 Certification Request Button

```typescript
export function CertificationButton({ responseId }: { responseId: string }) {
  const requestCertification = async () => {
    await gateway.requestCertification(responseId);
  };
  
  return (
    <button onClick={requestCertification}>
      Request Certification
    </button>
  );
}
```

#### 6.4.3 Constitutional Violation Alert

```typescript
interface ViolationAlertProps {
  violation: {
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  };
}

export function ViolationAlert({ violation }: ViolationAlertProps) {
  return (
    <div className={`alert alert-${violation.severity}`}>
      <strong>Constitutional Violation:</strong> {violation.type}
      <p>{violation.description}</p>
    </div>
  );
}
```

---

## 7. Docker Compose Addition

### 7.1 Service Definition

**Add to docker-compose.yml** (after gateway service):

```yaml
  ui-next:
    build:
      context: ./ui-next
      dockerfile: Dockerfile
    container_name: crx-ui-next
    ports:
      - "${UI_PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_GATEWAY_URL=http://crx-gateway:3001
      - NEXT_PUBLIC_API_KEY=${NEXT_PUBLIC_API_KEY:-}
    depends_on:
      gateway:
        condition: service_healthy
    networks:
      - crx-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

### 7.2 Environment Variables

**Add to .env**:

```env
# UI Configuration
UI_PORT=3000
NEXT_PUBLIC_GATEWAY_URL=http://localhost:3001
NEXT_PUBLIC_API_KEY=
```

**Note**: `NEXT_PUBLIC_` prefix makes variables available in browser (client-side).

### 7.3 Port Allocation

**UI**: 3000 (standard Next.js port)

**Updated Port Map**:
- 3000: UI (Next.js)
- 3001: Gateway
- 3002: Grafana (moved from 3000)
- 11434: Ollama
- 5432: PostgreSQL
- 6379: Redis
- 9090: Prometheus
- 3100: Loki
- 3200: Tempo
- 4317: Tempo OTLP

---

## 8. Dockerfile

### 8.1 UI Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public

EXPOSE 3000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
```

### 8.2 Package.json

```json
{
  "name": "crx-ui-next",
  "version": "1.0.0",
  "description": "CRX Next.js UI",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.344.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 9. Implementation Plan

### 9.1 Phase 1: Basic UI (MVP)

**Scope**:
- Next.js setup with Tailwind
- Basic chat interface
- Gateway client integration
- Model selector
- No Replay Kernel integration

**Effort**: 4-6 hours

**Deliverables**:
- ui-next/Dockerfile
- ui-next/package.json
- ui-next/src/app/chat/page.tsx
- ui-next/src/components/ChatInterface.tsx
- ui-next/src/lib/gateway-client.ts
- docker-compose.yml addition

### 9.2 Phase 2: Enhanced UI

**Scope**:
- Streaming responses
- Message history persistence (localStorage)
- Model information display
- Provider status indicator
- Error handling and retry logic

**Effort**: 3-4 hours

**Deliverables**:
- Enhanced ChatInterface component
- Streaming support
- LocalStorage persistence
- Status indicators

### 9.3 Phase 3: Replay Kernel Integration

**Scope**:
- Certification badge display
- Certification request button
- Constitutional violation alerts
- Witness metadata display
- Gateway API updates for certification

**Effort**: 4-6 hours

**Deliverables**:
- Certification components
- Gateway certification API
- Replay Kernel client in Gateway
- UI integration

### 9.4 Phase 4: Observability

**Scope**:
- UI metrics to Prometheus
- UI logs to Loki
- UI traces to Tempo
- Error tracking

**Effort**: 2-3 hours

**Deliverables**:
- Metrics instrumentation
- Log shipping
- Tracing integration

---

## 10. Testing Strategy

### 10.1 Unit Tests

- Gateway client methods
- Component rendering
- State management

### 10.2 Integration Tests

- UI → Gateway communication
- Error handling
- Model selection

### 10.3 End-to-End Tests

- Full chat flow
- Provider switching
- Certification flow (when implemented)

---

## 11. Risks and Mitigations

### 11.1 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Gateway unavailable | Medium | High | Health checks, error messages |
| CORS issues | Low | Medium | Configure Gateway CORS properly |
| Streaming complexity | Medium | Medium | Implement non-streaming first |
| Replay Kernel integration complexity | Medium | High | Clear API boundaries, optional feature |
| State management complexity | Low | Medium | Use simple React hooks, avoid Redux |

### 11.2 Mitigation Strategies

**Health Checks**: Monitor Gateway status, show errors to user  
**Error Boundaries**: React error boundaries for graceful failures  
**Fallback**: Show helpful error messages, retry buttons  
**Simplicity**: Avoid complex state management, use built-in React features  
**Progressive Enhancement**: Start with basic features, add complexity incrementally  

---

## 12. Success Criteria

### 12.1 Functional Requirements

✅ UI loads at http://localhost:3000  
✅ Chat interface sends messages to Gateway  
✅ Responses display correctly  
✅ Model selector works  
✅ Provider status displays  
✅ Errors are handled gracefully  

### 12.2 Non-Functional Requirements

✅ UI startup time < 5 seconds  
✅ Page load time < 2 seconds  
✅ No direct provider connections (all via Gateway)  
✅ Responsive design (mobile-friendly)  
✅ Accessible (ARIA labels, keyboard navigation)  

---

## Conclusion

**UI Insertion**: ✅ READY FOR IMPLEMENTATION

**Architecture**: Clean separation, Gateway as authority boundary  
**Dependencies**: Minimal (Next.js, React, Tailwind)  
**Integration**: Straightforward with Gateway  
**Effort**: 13-19 hours for full implementation  
**Risk**: Low - well-understood stack  

**Next Phase**: PHASE E — CRX Authority Alignment
