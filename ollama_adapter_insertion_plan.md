# OLLAMA ADAPTER INSERTION PLAN

**Date:** 2026-06-22  
**Phase:** SWEEP27 Phase 7 - Ollama Preparation  
**Purpose:** Identify adapter insertion point in runtime/adapters  
**Mode:** PLANNING ONLY - NO IMPLEMENTATION

---

## ADAPTER LANDSCAPE

### Existing Adapters
1. **config_adapter.ts** (1,696 bytes)
   - Role: Configuration injection
   - Depends on: replay/replay_types
   - Interface: ConfigAdapter class

2. **express_commit_adapter.ts** (1,228 bytes)
   - Role: Express HTTP API
   - Depends on: replay/canonical_event_envelope, replay_verification, replay_event_stream
   - Interface: ExpressCommitAdapter class

3. **postgres_event_store.ts** (6,125 bytes)
   - Role: PostgreSQL event storage
   - Depends on: replay/canonical_event_envelope, replay_event_stream
   - Interface: PostgresEventStore class
   - Constitutional Authority: EVENT_PERSISTENCE

---

## OLLAMA ADAPTER INSERTION POINT

### Recommended Location
**File:** runtime/adapters/ollama_adapter.ts  
**Location:** After postgres_event_store.ts (alphabetical order)

### Adapter Pattern
**Follow existing adapter pattern:**
```typescript
/**
 * OLLAMA ADAPTER
 * 
 * Infrastructure adapter for Ollama LLM and embedding service.
 * Depends on replay/ for canonicalization.
 * replay/ NEVER depends on this adapter.
 */
```

---

## REQUIRED INTERFACE

### OllamaAdapter Class
```typescript
export class OllamaAdapter {
  private ollamaBaseUrl: string;
  private embeddingModel: string;
  private chatModel: string;

  constructor(baseUrl: string, embeddingModel: string, chatModel: string);

  // Embedding generation
  async generateEmbedding(text: string): Promise<number[]>;

  // Chat completion
  async chatCompletion(messages: any[], options?: any): Promise<any>;

  // Model capability check
  async modelCapability(model: string, capability: string): Promise<boolean>;

  // Health check
  async healthCheck(): Promise<boolean>;
}
```

---

## DEPENDENCIES

### External Dependencies
- **ollama npm package** (for HTTP client)
- **TypeScript types** (for Ollama API)

### Internal Dependencies
- **replay/canonical_event_envelope** (for event canonicalization)
- **replay/replay_types** (for type definitions)

### Infrastructure Dependencies
- **Ollama service** (http://ollama:11434)
- **Environment variables** (OLLAMA_BASE_URL, EMBEDDING_MODEL, CHAT_MODEL)

---

## CONSTITUTIONAL EVENT HOOK LOCATION

### Hook Point: NONE - Ollama decoupled from event ingestion

**Constitutional Principle:** Truth ≠ Embedding

**Correct Architecture:**
```
Event
  ↓
PostgresEventStore.append()
  ↓ (Event persistence only)
PostgreSQL (events table)
  ↓ (Projection worker reads events)
Projection Worker
  ↓ (Ollama generates embeddings)
Ollama
  ↓ (Embeddings stored in Qdrant)
Qdrant (constitutional_documents)
```

**Incorrect Architecture (REJECTED):**
```
Event
  ↓
PostgresEventStore.append()
  ↓ (Generate embedding)
Ollama
  ↓ (Store embedding)
PostgreSQL
```

**Rationale:**
- If Ollama dies, Postgres must still work
- Event ingestion must not depend on inference infrastructure
- Embeddings are projections, not truth
- Events are truth
- Keep them separate

**Constitutional Authority:**
- PostgresEventStore: EVENT_PERSISTENCE (truth creation)
- Projection Worker: PROJECTION (embedding generation)
- Ollama: INFRASTRUCTURE (computation only)

---

## CONSTITUTIONAL AUTHORITY CONSIDERATIONS

### Authority Classification
**Class:** INFRASTRUCTURE_ADAPTER  
**Creates Truth:** NO  
**Derives Truth:** NO  
**Stores Truth:** NO  
**Presents Truth:** NO

**Rationale:**
- Ollama adapter is infrastructure only
- Does not create constitutional truth
- Does not derive truth from events
- Provides computation (embeddings, chat) only
- Truth source remains replay/ → PostgreSQL

### Dependency Direction
**Correct Direction:**
- OllamaAdapter → replay/ (depends on replay for canonicalization)
- replay/ → OllamaAdapter (NEVER depends on OllamaAdapter)

**Incorrect Direction:**
- replay/ → OllamaAdapter (violates constitutional authority)

---

## INTEGRATION POINTS

### Point 1: Projection Worker Embedding
**Location:** projection_worker/projection_worker.py  
**Purpose:** Generate embeddings for vault documents  
**Trigger:** During vault indexing  
**Architecture:** Projection Worker → Ollama → Qdrant

### Point 2: Chat Completion
**Location:** ExpressCommitAdapter.handleCommitRequest()  
**Purpose:** LLM reasoning for commit verification  
**Trigger:** Before commit approval  
**Architecture:** Express Adapter → Ollama → Response

### Point 3: Model Capability Validation
**Location:** ConfigAdapter.loadFromEnvironment()  
**Purpose:** Validate model capabilities on startup  
**Trigger:** During initialization  
**Architecture:** Config Adapter → Ollama API → Capability Check

---

## ENVIRONMENT CONFIGURATION

### Required Environment Variables
```bash
OLLAMA_BASE_URL=http://ollama:11434
EMBEDDING_MODEL=nomic-embed-text
CHAT_MODEL=llama3
```

### Configuration Loading
**Location:** ConfigAdapter.loadFromEnvironment()  
**Integration:**
```typescript
if (process.env.OLLAMA_BASE_URL) {
  this.setConfig('ollama_base_url', process.env.OLLAMA_BASE_URL);
}
if (process.env.EMBEDDING_MODEL) {
  this.setConfig('embedding_model', process.env.EMBEDDING_MODEL);
}
if (process.env.CHAT_MODEL) {
  this.setConfig('chat_model', process.env.CHAT_MODEL);
}
```

---

## IMPLEMENTATION READINESS

### Prerequisites
✅ Adapter pattern established  
✅ Dependency direction defined  
✅ Hook locations identified  
✅ Interface specified  
⏳ Ollama npm package not installed  
⏳ TypeScript types not defined  

### Blockers
❌ Ollama npm package installation required  
❌ TypeScript type definitions required  
❌ Integration testing required  

### Non-Blockers
⏳ Environment variable configuration  
⏳ Hook implementation in PostgresEventStore  
⏳ Hook implementation in ExpressCommitAdapter  

---

## NEXT STEPS (NOT FOR SWEEP27)

### Future Implementation
1. Install ollama npm package
2. Create runtime/adapters/ollama_adapter.ts
3. Implement OllamaAdapter class
4. Add hooks to PostgresEventStore
5. Add hooks to ExpressCommitAdapter
6. Configure environment variables
7. Integration testing

---

## CONCLUSION

**Adapter Insertion Point:** runtime/adapters/ollama_adapter.ts  
**Best Location:** After postgres_event_store.ts  
**Required Interface:** OllamaAdapter class with embedding/chat methods  
**Dependencies:** ollama npm package, replay/ canonicalization  
**Constitutional Hook:** NONE - Ollama decoupled from event ingestion  
**Authority Classification:** INFRASTRUCTURE_ADAPTER (no truth creation)

**Constitutional Principle:** Truth ≠ Embedding  
**Architecture:** Event persistence (Postgres) → Projection (Projection Worker + Ollama) → Storage (Qdrant)

**Status:** ✅ PLANNING COMPLETE - Implementation deferred to future phase

**Next Phase:** SWEEP27 Final Deliverable - Generate SWEEP27_FINAL_DECISION.md
