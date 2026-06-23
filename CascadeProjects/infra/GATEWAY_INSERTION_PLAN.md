# CRX Gateway Insertion Plan

**Date**: 2026-06-08  
**Location**: C:\Users\nolan\CRX\CascadeProjects\infra  
**Phase**: PHASE C — Gateway Insertion Plan  
**Mission**: Design Gateway service for model provider abstraction

---

## 1. Gateway Service Design

### 1.1 Purpose

The Gateway serves as the **single entry point** for all LLM interactions in the CRX system. It:

- Abstracts model providers (Ollama, OpenRouter, future providers)
- Provides a stable REST API for UI and other services
- Handles provider switching without client changes
- Implements rate limiting, caching, and observability
- Routes requests to Replay Kernel for certification when required

### 1.2 Non-Requirements (Explicitly Excluded)

❌ **NO LangChain** - Avoid heavy framework dependencies  
❌ **NO Vercel AI SDK** - Avoid vendor-specific abstractions  
❌ **NO frontier-specific abstractions** - Keep provider-agnostic  
❌ **NO authentication complexity** - Local deployment, no auth required initially  

### 1.3 Architecture Principles

✅ **Minimal dependencies** - Use only what's necessary  
✅ **Provider-agnostic interface** - Easy to add new providers  
✅ **Stateless** - No persistent state, easy to scale  
✅ **Observable** - Metrics, logs, traces for all operations  
✅ **Fast** - Minimal overhead, direct provider calls  

---

## 2. Provider Interface

### 2.1 Core Interface

```typescript
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMResponse {
  content: string;
  model: string;
  provider: string;
  tokens_used?: number;
  latency_ms: number;
}

interface LLMProvider {
  /**
   * Send chat completion request
   * @param messages - Conversation history
   * @param options - Model parameters (temperature, max_tokens, etc.)
   * @returns Response with content and metadata
   */
  chat(messages: Message[], options?: ChatOptions): Promise<LLMResponse>;
  
  /**
   * List available models
   * @returns Array of model identifiers
   */
  listModels(): Promise<string[]>;
  
  /**
   * Health check
   * @returns true if provider is healthy
   */
  health(): Promise<boolean>;
  
  /**
   * Provider name for observability
   */
  readonly name: string;
}

interface ChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}
```

### 2.2 Provider Implementations

#### 2.2.1 OllamaProvider

```typescript
class OllamaProvider implements LLMProvider {
  readonly name = 'ollama';
  private baseUrl: string;
  
  constructor(baseUrl: string = 'http://crx-ollama:11434') {
    this.baseUrl = baseUrl;
  }
  
  async chat(messages: Message[], options?: ChatOptions): Promise<LLMResponse> {
    const start = Date.now();
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options?.model || 'qwen2.5-coder:7b',
        messages: messages,
        stream: false,
        options: {
          temperature: options?.temperature || 0.7,
          num_predict: options?.max_tokens
        }
      })
    });
    
    const data = await response.json();
    const latency = Date.now() - start;
    
    return {
      content: data.message?.content || data.response,
      model: data.model,
      provider: this.name,
      latency_ms: latency
    };
  }
  
  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`);
    const data = await response.json();
    return data.models?.map((m: any) => m.name) || [];
  }
  
  async health(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

#### 2.2.2 OpenRouterProvider

```typescript
class OpenRouterProvider implements LLMProvider {
  readonly name = 'openrouter';
  private baseUrl: string;
  private apiKey: string;
  
  constructor(apiKey: string, baseUrl: string = 'https://openrouter.ai/api/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }
  
  async chat(messages: Message[], options?: ChatOptions): Promise<LLMResponse> {
    const start = Date.now();
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'CRX Local Stack'
      },
      body: JSON.stringify({
        model: options?.model || 'anthropic/claude-3-haiku',
        messages: messages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.max_tokens
      })
    });
    
    const data = await response.json();
    const latency = Date.now() - start;
    
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: data.model,
      provider: this.name,
      tokens_used: data.usage?.total_tokens,
      latency_ms: latency
    };
  }
  
  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    const data = await response.json();
    return data.data?.map((m: any) => m.id) || [];
  }
  
  async health(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

### 2.3 Provider Registry

```typescript
class ProviderRegistry {
  private providers: Map<string, LLMProvider> = new Map();
  private defaultProvider: string;
  
  constructor(defaultProvider: string) {
    this.defaultProvider = defaultProvider;
  }
  
  register(provider: LLMProvider): void {
    this.providers.set(provider.name, provider);
  }
  
  get(name?: string): LLMProvider {
    const providerName = name || this.defaultProvider;
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider not found: ${providerName}`);
    }
    return provider;
  }
  
  async health(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const [name, provider] of this.providers) {
      results[name] = await provider.health();
    }
    return results;
  }
}
```

---

## 3. REST API Design

### 3.1 Endpoints

#### 3.1.1 Chat Completion

```
POST /api/v1/chat
```

**Request Body**:
```json
{
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello" }
  ],
  "model": "qwen2.5-coder:7b",
  "provider": "ollama",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Response**:
```json
{
  "content": "Hello! How can I help you today?",
  "model": "qwen2.5-coder:7b",
  "provider": "ollama",
  "tokens_used": 25,
  "latency_ms": 1234
}
```

#### 3.1.2 List Models

```
GET /api/v1/models
```

**Response**:
```json
{
  "models": [
    { "name": "qwen2.5-coder:7b", "provider": "ollama" },
    { "name": "llama3.2:3b", "provider": "ollama" }
  ]
}
```

#### 3.1.3 Health Check

```
GET /api/v1/health
```

**Response**:
```json
{
  "status": "ok",
  "providers": {
    "ollama": true,
    "openrouter": false
  }
}
```

#### 3.1.4 Provider Status

```
GET /api/v1/providers
```

**Response**:
```json
{
  "providers": [
    { "name": "ollama", "healthy": true, "default": true },
    { "name": "openrouter", "healthy": false, "default": false }
  ]
}
```

### 3.2 Error Responses

**400 Bad Request**:
```json
{
  "error": "Invalid request",
  "message": "messages field is required"
}
```

**503 Service Unavailable**:
```json
{
  "error": "Provider unavailable",
  "message": "Ollama provider is not responding"
}
```

---

## 4. Service Location

### 4.1 Directory Structure

```
CRX/CascadeProjects/infra/
├── gateway/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts (entry point)
│       ├── server.ts (Express/Fastify setup)
│       ├── routes/
│       │   ├── chat.ts
│       │   ├── models.ts
│       │   └── health.ts
│       ├── providers/
│       │   ├── base.ts (LLMProvider interface)
│       │   ├── ollama.ts
│       │   └── openrouter.ts
│       ├── registry.ts (ProviderRegistry)
│       └── middleware/
│           ├── logging.ts
│           └── metrics.ts
```

### 4.2 Technology Stack

**Runtime**: Node.js 20+  
**Framework**: Fastify (lightweight, fast) or Express (familiar)  
**Language**: TypeScript  
**Dependencies**: Minimal
- `fastify` or `express`
- `@types/node`
- `typescript`
- `pino` (logging)
- `prom-client` (metrics)

**No AI/LLM libraries** - Direct HTTP calls to providers

---

## 5. Compose Modifications

### 5.1 Docker Compose Addition

**Add to docker-compose.yml** (after ollama service):

```yaml
  gateway:
    build:
      context: ./gateway
      dockerfile: Dockerfile
    container_name: crx-gateway
    ports:
      - "${GATEWAY_PORT:-3001}:3001"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - DEFAULT_PROVIDER=ollama
      - OLLAMA_BASE_URL=http://crx-ollama:11434
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY:-}
      - REDIS_URL=redis://crx-redis:6379
      - POSTGRES_URL=postgres://crx:crx_dev_password@crx-postgres:5432/crx_kernel
    depends_on:
      ollama:
        condition: service_started
      redis:
        condition: service_healthy
      postgres:
        condition: service_healthy
    networks:
      - crx-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

### 5.2 Environment Variables

**Add to .env**:

```env
# Gateway Configuration
GATEWAY_PORT=3001
DEFAULT_PROVIDER=ollama
OLLAMA_BASE_URL=http://crx-ollama:11434
OPENROUTER_API_KEY=
```

### 5.3 Port Allocation

**Gateway**: 3001 (chosen to avoid conflict with UI on 3000 and Grafana moved to 3002)

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

## 6. Dependency Graph

### 6.1 Service Dependencies

```
gateway
├── ollama (required for primary provider)
├── redis (optional, for caching)
└── postgres (optional, for metadata/logging)

UI
└── gateway (required)

Replay Kernel
├── postgres (required for certification storage)
└── gateway (optional, for LLM access during replay)
```

### 6.2 Startup Order

```
1. postgres (health check)
2. redis (health check)
3. ollama (start)
4. gateway (depends on postgres, redis, ollama)
5. ui-next (depends on gateway)
6. replay-kernel (depends on postgres)
```

### 6.3 Network Communication

```
UI (localhost:3000)
  ↓ HTTP
Gateway (crx-gateway:3001)
  ↓ HTTP
Ollama (crx-ollama:11434)
```

---

## 7. Implementation Plan

### 7.1 Phase 1: Core Gateway (MVP)

**Scope**:
- Ollama provider only
- Basic chat endpoint
- Health check endpoint
- No caching
- No metrics
- No Replay Kernel integration

**Effort**: 2-3 hours

**Deliverables**:
- gateway/Dockerfile
- gateway/package.json
- gateway/src/index.ts
- gateway/src/server.ts
- gateway/src/providers/ollama.ts
- docker-compose.yml addition

### 7.2 Phase 2: OpenRouter Integration

**Scope**:
- Add OpenRouter provider
- Provider registry
- Provider switching via API
- Provider health monitoring

**Effort**: 1-2 hours

**Deliverables**:
- gateway/src/providers/openrouter.ts
- gateway/src/registry.ts
- Updated routes

### 7.3 Phase 3: Observability

**Scope**:
- Structured logging (Pino)
- Prometheus metrics
- Loki log shipping
- Tempo tracing

**Effort**: 2-3 hours

**Deliverables**:
- gateway/src/middleware/logging.ts
- gateway/src/middleware/metrics.ts
- Updated prometheus.yml scrape config

### 7.4 Phase 4: Caching

**Scope**:
- Redis integration
- Request caching
- Cache invalidation strategy

**Effort**: 1-2 hours

**Deliverables**:
- Redis cache layer
- Cache middleware

### 7.5 Phase 5: Replay Kernel Integration

**Scope**:
- Forward requests to Replay Kernel for certification
- Witness authority integration
- Certified response routing

**Effort**: 2-3 hours

**Deliverables**:
- Replay Kernel client
- Certification middleware
- Authority-aware routing

---

## 8. Dockerfile

### 8.1 Gateway Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/api/v1/health || exit 1

CMD ["node", "dist/index.js"]
```

### 8.2 Package.json

```json
{
  "name": "crx-gateway",
  "version": "1.0.0",
  "description": "CRX Gateway for LLM provider abstraction",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts"
  },
  "dependencies": {
    "fastify": "^4.25.0",
    "pino": "^8.17.0",
    "prom-client": "^15.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.0"
  }
}
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

- Provider implementations
- Provider registry
- Request/response validation

### 9.2 Integration Tests

- Gateway → Ollama communication
- Gateway → OpenRouter communication (with mock)
- Health check endpoints
- Error handling

### 9.3 End-to-End Tests

- UI → Gateway → Ollama flow
- Provider switching
- Failover scenarios

---

## 10. Risks and Mitigations

### 10.1 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Ollama unavailable | Medium | High | Health checks, failover to OpenRouter |
| OpenRouter API changes | Low | Medium | Versioned client, fallback to Ollama |
| Gateway becomes bottleneck | Low | Medium | Stateless, easy to scale horizontally |
| Provider API divergence | Medium | Medium | Strict interface, adapter pattern |
| Replay Kernel integration complexity | Medium | High | Clear authority boundaries, optional integration |

### 10.2 Mitigation Strategies

**Health Checks**: Continuous monitoring of provider health  
**Circuit Breakers**: Fail fast when providers are down  
**Fallback**: Always have at least one working provider  
**Observability**: Full visibility into gateway operations  
**Simplicity**: Minimal dependencies, easy to debug  

---

## 11. Success Criteria

### 11.1 Functional Requirements

✅ Gateway exposes REST API at port 3001  
✅ Ollama provider works end-to-end  
✅ OpenRouter provider works when API key configured  
✅ Provider switching works without client changes  
✅ Health checks report provider status  
✅ Errors are handled gracefully  

### 11.2 Non-Functional Requirements

✅ Gateway startup time < 10 seconds  
✅ Request latency < 100ms overhead over provider  
✅ No LangChain or Vercel AI SDK dependencies  
✅ Logs shipped to Loki  
✅ Metrics exposed to Prometheus  
✅ Traces sent to Tempo  

---

## Conclusion

**Gateway Insertion**: ✅ READY FOR IMPLEMENTATION

**Architecture**: Clean, minimal, provider-agnostic  
**Dependencies**: Minimal (Fastify, TypeScript)  
**Integration**: Straightforward with existing infrastructure  
**Effort**: 8-12 hours for full implementation  
**Risk**: Low - well-understood problem space  

**Next Phase**: PHASE D — UI Insertion Plan
