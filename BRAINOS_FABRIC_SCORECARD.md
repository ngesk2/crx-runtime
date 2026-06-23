# BRAINOS FABRIC SCORECARD

## PHASE 6 — BRAINOS READINESS SCORE

### SCORING CRITERIA
- **5/5:** Fully operational, no configuration required
- **4/5:** Operational, minor configuration required
- **3/5:** Partially operational, moderate configuration required
- **2/5:** Limited operation, significant configuration required
- **1/5:** Not operational, major work required
- **0/5:** Not possible with current infrastructure

### SCORE BREAKDOWN

#### 1. Phone Access
**Score: 5/5**
- **Status:** FULLY OPERATIONAL
- **Evidence:**
  - Tailscale running on laptop (IP: 100.79.154.43)
  - Open WebUI accessible via Tailscale (http://100.79.154.43:3001)
  - Phone connected to Tailscale network (iphone-13: 100.111.42.94)
  - Port 3001 accessible via Tailscale
  - Test-NetConnection confirmed connectivity
- **Configuration:** None required (already working)
- **Notes:** Phone can access Open WebUI via Tailscale without public exposure

#### 2. Persistence
**Score: 5/5**
- **Status:** FULLY OPERATIONAL
- **Evidence:**
  - SQLite database (webui.db) in Docker volume
  - Volume: crx-digestion-worker_open-webui-data
  - 1 conversation persisted with full history
  - Database survives container restart
  - Restart policy: unless-stopped
- **Configuration:** None required (already working)
- **Notes:** Conversations persist across container lifecycle

#### 3. Model Routing
**Score: 4/5**
- **Status:** OPERATIONAL WITH MINOR CONFIGURATION
- **Evidence:**
  - Open WebUI supports multiple backends (Ollama, OpenAI-compatible)
  - OLLAMA_BASE_URL configured and working
  - OPENAI_API_BASE_URL available but not configured
  - Per-conversation model selection supported
  - Can switch between backends per conversation
- **Configuration Required:**
  - Add OPENAI_API_BASE_URL environment variable
  - Restart Open WebUI container
- **Notes:** Multi-backend support built-in, just needs configuration

#### 4. Local Ollama
**Score: 5/5**
- **Status:** FULLY OPERATIONAL
- **Evidence:**
  - crx-ollama-worker container running
  - Port 11434 accessible
  - 2 models installed (qwen2.5-coder:7b, qwen2.5-coder:14b)
  - Open WebUI connected via host.docker.internal:11434
  - Test query successful
- **Configuration:** None required (already working)
- **Notes:** Local Ollama fully operational with models

#### 5. Local vLLM
**Score: 2/5**
- **Status:** LIMITED OPERATION
- **Evidence:**
  - Hardware meets minimum requirements (CUDA 13.0, RTX A2000 8GB)
  - 64GB RAM exceeds requirements
  - vLLM can run on current hardware
- **Limitations:**
  - 8GB VRAM is marginal (minimum for vLLM)
  - Only 7B models fit (14B models do not fit)
  - Windows support limited (better on Linux)
  - Not currently deployed
- **Configuration Required:**
  - Deploy vLLM container
  - Configure CUDA environment
  - Pull and load models
  - Configure OpenAI-compatible endpoint
  - Add to Open WebUI configuration
- **Notes:** Possible but limited by VRAM, Ollama better for local use

#### 6. Remote vLLM
**Score: 4/5**
- **Status:** OPERATIONAL WITH MINOR CONFIGURATION
- **Evidence:**
  - Open WebUI supports OpenAI-compatible APIs
  - vLLM exposes OpenAI-compatible endpoint (/v1/chat/completions)
  - Can configure via OPENAI_API_BASE_URL
  - No source modification required
  - Tailscale provides secure networking
- **Configuration Required:**
  - Deploy vLLM on Vast.ai
  - Configure Tailscale on Vast.ai instance
  - Add OPENAI_API_BASE_URL to Open WebUI
  - Restart Open WebUI container
- **Notes:** Straightforward integration, minimal configuration

#### 7. Conversation Capture
**Score: 3/5**
- **Status:** PARTIALLY OPERATIONAL
- **Evidence:**
  - SQLite database with conversation data
  - Webhook table exists (channel_webhook)
  - API documentation accessible
  - Multiple capture options available without source modification
- **Limitations:**
  - No automatic event generation
  - No automatic observation generation
  - Postgres not configured for capture
  - Capture script not deployed
- **Configuration Required:**
  - Deploy Postgres (brain-postgres or standalone)
  - Implement capture script (polling or webhook)
  - Create event/observation tables
  - Configure transformation logic
- **Notes:** Capture possible but requires external infrastructure

#### 8. Knowledge Extraction Readiness
**Score: 2/5**
- **Status:** LIMITED OPERATION
- **Evidence:**
  - Open WebUI has knowledge table
  - RAG embedding model configured (sentence-transformers/all-MiniLM-L6-v2)
  - Vector database available (vector_db directory)
  - Knowledge extraction possible from conversations
- **Limitations:**
  - Knowledge extraction not automated
  - No pipeline for conversation → knowledge
  - Knowledge table empty
  - No integration with Postgres canonical state
- **Configuration Required:**
  - Implement knowledge extraction pipeline
  - Configure RAG system
  - Integrate with Postgres
  - Automate extraction from conversations
- **Notes:** Infrastructure exists but pipeline not implemented

### OVERALL SCORE

#### Total Score: 30/40 (75%)
- **Phone Access:** 5/5
- **Persistence:** 5/5
- **Model Routing:** 4/5
- **Local Ollama:** 5/5
- **Local vLLM:** 2/5
- **Remote vLLM:** 4/5
- **Conversation Capture:** 3/5
- **Knowledge Extraction Readiness:** 2/5

#### Readiness Classification: **OPERATIONAL WITH MODERATE CONFIGURATION**

### STRENGTHS
1. **Phone Access:** Fully operational via Tailscale
2. **Persistence:** Fully operational with Docker volume
3. **Local Ollama:** Fully operational with models
4. **Model Routing:** Built-in multi-backend support
5. **Remote vLLM:** Straightforward integration path

### WEAKNESSES
1. **Local vLLM:** Limited by 8GB VRAM, Ollama better for local
2. **Conversation Capture:** Requires external infrastructure (Postgres, capture script)
3. **Knowledge Extraction:** Pipeline not implemented

### FASTEST PATH TO FULL READINESS

#### Immediate (No Configuration)
- Phone access
- Persistence
- Local Ollama

#### Short-term (Minor Configuration)
- Model routing (add OPENAI_API_BASE_URL)
- Remote vLLM (deploy on Vast.ai, configure endpoint)

#### Medium-term (Moderate Configuration)
- Conversation capture (deploy Postgres, implement capture script)
- Knowledge extraction (implement pipeline)

#### Long-term (Major Work)
- Local vLLM (GPU upgrade recommended for meaningful benefit)

### RECOMMENDATION
**Focus on remote vLLM for burst compute**
- Local vLLM limited by 8GB VRAM
- Ollama better for local 7B models
- Remote vLLM on Vast.ai for 14B+ models
- Cost-effective burst compute
- Minimal configuration required

**Implement conversation capture via polling**
- Database polling is most reliable
- No Open WebUI modification required
- Straightforward implementation
- Can be deployed alongside existing infrastructure
