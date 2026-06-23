# INFERENCE AND TOOL AUTHORITY AUDIT

**Document ID:** INFERENCE-TOOL-AUTHORITY-AUDIT-1.0  
**Purpose:** Determine actual production authority chain for User → Tool → Model → Event → Artifact  
**Scope:** Current inference authority, tool execution authority, replacement paths

---

## SECTION 0 — EXECUTIVE SUMMARY

**Current Inference Authority:** Ollama (multiple direct calls, no unified abstraction)  
**Current Tool Authority:** Mission Control (authoritative for all data)  
**MCP Status:** Implemented as thin proxy to Mission Control (Layer 3 adapter, not constitutional authority)  
**vLLM Status:** NOT IMPLEMENTED  
**OpenAI-Compatible Status:** NOT IMPLEMENTED

---

## SECTION 1 — CURRENT INFERENCE AUTHORITY GRAPH

### Inference Call Locations

**1. gateway/server.js (Node.js)**
- Line 128-214: `invokeOllama()` function
- Line 135: `${OLLAMA_URL}/api/chat`
- Line 39-40: OLLAMA_URL environment variable
- Line 42-43: OLLAMA_MODEL environment variable
- **Authority:** Direct Ollama API call
- **Abstraction:** None (direct fetch)

**2. brainos/orchestration/src/ollama_harness.py (Python)**
- Line 90-292: `OllamaHarness` class
- Line 124-158: `generate_embedding()` method
- Line 160-193: `chat()` method
- Line 195-225: `tool_call()` method
- Line 19: OLLAMA_BASE_URL environment variable
- **Authority:** OllamaHarness abstraction
- **Abstraction:** Model type enforcement (EMBEDDING/CHAT/TOOL)

**3. brainos/newsletter/summarizer.py (Python)**
- Line 1: `import ollama`
- Line 17: `client = ollama.Client(host=OLLAMA_BASE_URL)`
- Line 42: `client.chat(model=OLLAMA_MODEL, messages=[...])`
- **Authority:** Direct ollama.Client usage
- **Abstraction:** None (direct library call)

**4. brainos/orchestration/src/projection_worker.py (Python)**
- Line 87-114: `generate_embedding()` function
- Line 92-98: Direct Ollama API call to `${OLLAMA_BASE_URL}/api/embeddings`
- **Authority:** Direct Ollama API call
- **Abstraction:** None (direct requests.post)

**5. brainos/orchestration/src/mission_control/app.py (Python)**
- Line 717-725: OllamaAdapter import and usage
- Line 720: `from ollama_adapter import OllamaAdapter`
- Line 722: `ollama_adapter = OllamaAdapter()`
- Line 725: `query_embedding = ollama_adapter.embed(query)`
- **Authority:** OllamaAdapter (runtime/adapters/ollama)
- **Abstraction:** Adapter pattern (but Ollama-specific)

### Inference Authority Classification

**Current State:**
- **Gateway:** Direct Ollama API call (no abstraction)
- **Newsletter:** Direct ollama.Client (no abstraction)
- **Projection Worker:** Direct Ollama API call (no abstraction)
- **Mission Control:** OllamaAdapter (Ollama-specific adapter)
- **OllamaHarness:** Model type enforcement (Python-only abstraction)

**Abstraction Layer:** PARTIALLY IMPLEMENTED
- Python has OllamaHarness (model type enforcement)
- Node.js has no abstraction
- No unified abstraction across languages
- No OpenAI-compatible interface

---

## SECTION 2 — CURRENT TOOL AUTHORITY GRAPH

### Tool Execution Locations

**1. Mission Control (brainos/orchestration/src/mission_control/app.py)**
- **Authority:** CONSTITUTIONAL AUTHORITY for all data
- **Endpoints:** /constitution/search, /memory/search, /events/recent, /lineage/graph, etc.
- **Role:** Authoritative data source

**2. MCP Server (mcp/ping_mcp_server.py)**
- Line 12: `MISSION_CONTROL_URL = "http://mission-control:8000"`
- Line 15-26: `search_constitution()` proxies to Mission Control
- Line 29-39: `get_constitution_doc()` proxies to Mission Control
- Line 42-67: `search_constitutional_memory()` proxies to Mission Control
- **Authority:** THIN PROXY (no business logic, no duplicate authority)
- **Role:** Layer 3 adapter (not constitutional authority)

### Tool Authority Classification

**Current State:**
- **Mission Control:** CONSTITUTIONAL AUTHORITY
- **MCP:** THIN PROXY to Mission Control
- **No standalone tool execution authority**

**Abstraction Layer:** IMPLEMENTED
- MCP provides unified tool interface
- All tools proxy to Mission Control
- No duplicate authority

---

## SECTION 3 — MCP IMPLEMENTATION STATUS

### MCP Server Analysis

**File:** mcp/ping_mcp_server.py

**Tools Implemented (11 total):**
1. search_constitution → GET /constitution/search
2. get_constitution_doc → GET /constitution/doc/{id}
3. search_constitutional_memory → GET /constitutional/query
4. search_memory → GET /memory/search
5. memory_stats → GET /memory/stats
6. recent_events → GET /events/recent
7. event_summary → GET /events/summary
8. lineage_lookup → GET /lineage/graph
9. continuity_status → GET /continuity/status
10. replay_status → GET /replay/status
11. credential_inventory → GET /credentials/inventory
12. infrastructure_status → GET /infrastructure/status

**Architecture:**
- Thin proxy pattern
- NO business logic
- NO duplicate authority
- All calls proxy to Mission Control

**Certification Status:** ✅ CERTIFIED (MCP_CERTIFICATION.md)
- 10/11 tools verified working
- recent_events has Mission Control-side issue (not MCP issue)

**Classification:** LAYER 3 ADAPTER (not constitutional authority)

---

## SECTION 4 — EXACT INSERTION POINT FOR vLLM

### vLLM Insertion Strategy

**Target:** Replace Ollama with OpenAI-compatible client

**Insertion Points:**

**1. gateway/server.js**
- **Current:** Line 128-214 `invokeOllama()` function
- **Replace with:** OpenAI-compatible client (e.g., OpenAI SDK or fetch to vLLM OpenAI-compatible endpoint)
- **Environment variable:** Change `OLLAMA_URL` to `VLLM_URL`
- **API change:** None (vLLM provides OpenAI-compatible /v1/chat/completions endpoint)

**2. brainos/orchestration/src/ollama_harness.py**
- **Current:** Line 90-292 `OllamaHarness` class
- **Replace with:** `OpenAICompatibleHarness` class
- **Environment variable:** Change `OLLAMA_BASE_URL` to `VLLM_URL`
- **API change:** 
  - `/api/embeddings` → `/v1/embeddings`
  - `/api/chat` → `/v1/chat/completions`
  - `/api/generate` → `/v1/completions`

**3. brainos/newsletter/summarizer.py**
- **Current:** Line 1 `import ollama`, Line 17 `client = ollama.Client()`
- **Replace with:** OpenAI Python SDK
- **Environment variable:** Change `OLLAMA_BASE_URL` to `VLLM_URL`
- **API change:** Use OpenAI client with `base_url=VLLM_URL`

**4. brainos/orchestration/src/projection_worker.py**
- **Current:** Line 92-98 direct Ollama API call
- **Replace with:** OpenAI-compatible embedding call
- **Environment variable:** Change `OLLAMA_BASE_URL` to `VLLM_URL`
- **API change:** `/api/embeddings` → `/v1/embeddings`

**5. brainos/orchestration/src/mission_control/app.py**
- **Current:** Line 720 `from ollama_adapter import OllamaAdapter`
- **Replace with:** `from openai_compatible_adapter import OpenAICompatibleAdapter`
- **Environment variable:** Change `OLLAMA_BASE_URL` to `VLLM_URL`
- **API change:** Use OpenAI-compatible adapter

### vLLM Implementation Path

**Step 1:** Create OpenAI-compatible adapter in runtime/adapters/
**Step 2:** Replace OllamaHarness with OpenAICompatibleHarness
**Step 3:** Replace direct Ollama calls with OpenAI SDK
**Step 4:** Update environment variables
**Step 5:** Test with vLLM OpenAI-compatible endpoint

---

## SECTION 5 — EXACT INSERTION POINT FOR MCP

### MCP Insertion Strategy

**Current Status:** MCP already implemented as thin proxy

**Can MCP become sole tool authority?**

**Answer:** YES, with Mission Control delegation

**Insertion Points:**

**1. Mission Control → MCP Delegation**
- **Current:** Mission Control is authoritative
- **Change:** Mission Control delegates tool authority to MCP
- **Mechanism:** Mission Control calls MCP tools instead of direct database access
- **Constitutional impact:** MCP becomes Layer 3 tool authority

**2. Gateway → MCP Direct**
- **Current:** Gateway calls Ollama directly
- **Change:** Gateway calls MCP for tool execution
- **Mechanism:** Gateway → MCP → Mission Control
- **Constitutional impact:** MCP becomes tool execution authority

### MCP Implementation Path

**Step 1:** Mission Control delegates tool authority to MCP
**Step 2:** Gateway routes tool calls through MCP
**Step 3:** MCP remains thin proxy (no business logic)
**Step 4:** Verify constitutional compliance

---

## SECTION 6 — FILES TO MODIFY

### Files to Modify (vLLM Replacement)

**1. gateway/server.js**
- Replace `invokeOllama()` with OpenAI-compatible client
- Change `OLLAMA_URL` to `VLLM_URL`
- Change `/api/chat` to `/v1/chat/completions`

**2. brainos/orchestration/src/ollama_harness.py**
- Rename to `openai_compatible_harness.py`
- Replace OllamaHarness with OpenAICompatibleHarness
- Change Ollama API endpoints to OpenAI-compatible endpoints
- Change `OLLAMA_BASE_URL` to `VLLM_URL`

**3. brainos/newsletter/summarizer.py**
- Replace `import ollama` with OpenAI SDK
- Replace `ollama.Client()` with OpenAI client
- Change `OLLAMA_BASE_URL` to `VLLM_URL`

**4. brainos/orchestration/src/projection_worker.py**
- Replace direct Ollama API call with OpenAI-compatible call
- Change `/api/embeddings` to `/v1/embeddings`
- Change `OLLAMA_BASE_URL` to `VLLM_URL`

**5. brainos/orchestration/src/mission_control/app.py**
- Replace `from ollama_adapter import OllamaAdapter` with OpenAI-compatible adapter
- Change `OLLAMA_BASE_URL` to `VLLM_URL`

### Files to Create (vLLM Replacement)

**1. runtime/adapters/openai_compatible_adapter.ts**
- New OpenAI-compatible TypeScript adapter
- Replaces OllamaAdapter

**2. brainos/orchestration/src/openai_compatible_harness.py**
- New OpenAI-compatible Python harness
- Replaces OllamaHarness

### Files to Delete (vLLM Replacement)

**1. runtime/adapters/ollama/ollama_adapter.ts**
- Delete after OpenAI-compatible adapter is created

**2. brainos/orchestration/src/ollama_harness.py**
- Delete after OpenAI-compatible harness is created

**3. brainos/orchestration/src/ollama_adapter.py**
- Delete if exists

### Files to Modify (MCP Authority)

**1. brainos/orchestration/src/mission_control/app.py**
- Delegate tool authority to MCP
- Route tool calls through MCP

**2. gateway/server.js**
- Route tool execution through MCP
- Add MCP client integration

### Files to Keep (No Changes)

**1. mcp/ping_mcp_server.py**
- Keep as thin proxy
- No business logic changes

**2. MCP_CERTIFICATION.md**
- Keep as certification record

---

## SECTION 7 — CONSTITUTIONAL BLOCKERS

### Blocker 1: No Unified Inference Abstraction

**Evidence:**
- Gateway uses direct Ollama API call
- Newsletter uses direct ollama.Client
- Projection Worker uses direct Ollama API call
- Mission Control uses OllamaAdapter
- OllamaHarness is Python-only

**Constitutional Impact:** Multiple inference authorities, no single point of control

**Required Fix:** Implement unified OpenAI-compatible abstraction across all languages

---

### Blocker 2: Ollama is Development-Only

**Evidence:**
- CEO directive: Ollama is development-only
- Target: vLLM (OpenAI-compatible)
- Current: Ollama deployed in production

**Constitutional Impact:** Development dependency in production

**Required Fix:** Replace Ollama with vLLM

---

### Blocker 3: No OpenAI-Compatible Interface

**Evidence:**
- No OpenAI SDK usage
- No OpenAI-compatible endpoint configuration
- Ollama-specific API endpoints

**Constitutional Impact:** Cannot swap backends without API changes

**Required Fix:** Implement OpenAI-compatible interface

---

### Blocker 4: MCP is Layer 3 Adapter

**Evidence:**
- MCP is thin proxy to Mission Control
- MCP is not constitutional authority
- Mission Control is authoritative for all data

**Constitutional Impact:** MCP cannot be sole tool authority without delegation

**Required Fix:** Mission Control delegates tool authority to MCP

---

## SECTION 8 — AUTHORITY DETERMINATION

### Current Inference Authority

**Answer:** Ollama (multiple direct calls, no unified abstraction)

**Constitutional Target:** OpenAI-compatible client (single authority, multiple backends)

**Gap:** No unified abstraction, Ollama-specific API endpoints

---

### Current Tool Authority

**Answer:** Mission Control (constitutional authority)

**Constitutional Target:** MCP (Layer 3 tool authority)

**Gap:** MCP is thin proxy, not delegated authority

---

### Can Ollama be Removed Without Architectural Breakage?

**Answer:** NO

**Evidence:**
- 5 direct Ollama call locations
- No unified abstraction
- Ollama-specific API endpoints
- No OpenAI-compatible interface

**Required:** Implement OpenAI-compatible abstraction before removing Ollama

---

### Can vLLM Be Swapped Without API Changes?

**Answer:** NO

**Evidence:**
- Current code uses Ollama-specific endpoints
- No OpenAI-compatible interface
- Direct Ollama library usage

**Required:** Implement OpenAI-compatible abstraction first

---

### Can MCP Become Sole Tool Authority?

**Answer:** YES (with Mission Control delegation)

**Evidence:**
- MCP already implemented as thin proxy
- MCP has 11 tools implemented
- MCP is certified (MCP_CERTIFICATION.md)

**Required:** Mission Control delegates tool authority to MCP

---

## SECTION 9 — FINAL CLASSIFICATION

### Inference Authority

**Current:** Ollama (multiple direct calls, no unified abstraction)  
**Target:** OpenAI-compatible client (single authority, multiple backends)  
**Status:** NOT IMPLEMENTED  
**Classification:** BROKEN (no unified abstraction)

---

### Tool Authority

**Current:** Mission Control (constitutional authority)  
**Target:** MCP (Layer 3 tool authority)  
**Status:** PARTIALLY IMPLEMENTED  
**Classification:** READY FOR DELEGATION

---

### vLLM Status

**Current:** NOT IMPLEMENTED  
**Target:** OpenAI-compatible vLLM  
**Status:** NOT IMPLEMENTED  
**Classification:** NOT IMPLEMENTED

---

### MCP Status

**Current:** Thin proxy to Mission Control  
**Target:** Sole tool authority  
**Status:** IMPLEMENTED (as proxy)  
**Classification:** LAYER 3 ADAPTER (not constitutional authority)

---

**Document ID:** INFERENCE-TOOL-AUTHORITY-AUDIT-1.0  
**Key Finding:** No unified inference abstraction, Ollama is development-only, MCP is ready for delegation
