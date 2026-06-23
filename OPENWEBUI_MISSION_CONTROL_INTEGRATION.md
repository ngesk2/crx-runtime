# OPENWEBUI MISSION CONTROL INTEGRATION

**Date:** 2026-06-22  
**Phase:** Phase 3 - Open WebUI Integration  
**Purpose:** Integrate Open WebUI with Mission Control  
**Status:** BASELINE ESTABLISHED

---

## EXECUTION SUMMARY

Open WebUI is operational and connected to Ollama. Mission Control is operational with REST API endpoints. Integration requires implementing Open WebUI's external API or tool mechanism to connect to Mission Control.

**Current State:**
- Open WebUI: Running on port 3000, connected to Ollama
- Mission Control: Running on port 8000, with 13 REST endpoints
- Integration: NOT IMPLEMENTED (baseline established)

---

## CURRENT ARCHITECTURE

### Open WebUI Configuration
**Container:** `brain-openwebui`  
**Image:** `ghcr.io/open-webui/open-webui:latest`  
**Port:** 3000 (external) → 8080 (internal)  
**Ollama Connection:** `OLLAMA_BASE_URL=http://ollama:11434`  
**Database:** SQLite (internal to container)  
**Authentication:** Local (default)

**Current Features:**
- Chat interface with Ollama models
- Model selection (qwen2.5-coder:7b, qwen2.5-coder:14b)
- User management
- Chat history
- Document upload
- Knowledge base

### Mission Control Configuration
**Container:** `ping-mission-control`  
**Image:** `compose-mission-control` (custom build)  
**Port:** 8000  
**Dependencies:** PostgreSQL, Qdrant, Ollama  
**Framework:** FastAPI  
**Authentication:** None (CORS enabled for all origins)

**Available Endpoints:**
- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /infrastructure/status` - Service status dashboard
- `GET /credentials/inventory` - Credential metadata
- `GET /memory/stats` - Memory statistics
- `GET /memory/search` - Memory search (placeholder)
- `GET /qdrant/health` - Qdrant health status
- `GET /ollama/models` - Ollama model inventory
- `GET /events/recent` - Recent events
- `GET /events/summary` - Event summary by type/stream
- `GET /lineage/graph` - Lineage graph data
- `GET /replay/status` - Replay status
- `GET /backup/status` - Backup status

---

## INTEGRATION MECHANISMS

### Option 1: Open WebUI Custom API Endpoint
**Description:** Add Mission Control as a custom API provider in Open WebUI settings  
**Pros:**
- Native Open WebUI feature
- No code changes required
- User-configurable
- Supports function calling

**Cons:**
- Requires Open WebUI configuration UI access
- Limited to chat completion endpoints
- May not support all Mission Control endpoints

**Implementation:**
1. Access Open WebUI settings
2. Add custom API endpoint: `http://mission-control:8000`
3. Configure API key (if authentication added)
4. Map Mission Control endpoints to Open WebUI functions

**Status:** NOT IMPLEMENTED

---

### Option 2: OpenAPI Import
**Description:** Import Mission Control OpenAPI spec into Open WebUI  
**Pros:**
- Automatic endpoint discovery
- Full endpoint coverage
- Type-safe integration
- Documentation included

**Cons:**
- Requires OpenAPI spec generation
- Open WebUI may not support all OpenAPI features
- Complex configuration

**Implementation:**
1. Generate OpenAPI spec from Mission Control (FastAPI auto-generates at `/docs`)
2. Import spec into Open WebUI
3. Configure authentication
4. Test endpoint mapping

**Status:** NOT IMPLEMENTED

---

### Option 3: Tool/Function Integration
**Description:** Create custom tools that call Mission Control endpoints  
**Pros:**
- Flexible implementation
- Can add business logic
- Supports complex workflows
- Can be versioned

**Cons:**
- Requires code development
- Maintenance overhead
- Need to deploy alongside services

**Implementation:**
1. Create tool definitions for Mission Control endpoints
2. Implement tool functions in Python
3. Register tools with Open WebUI
4. Test tool execution

**Status:** NOT IMPLEMENTED

---

### Option 4: Reverse Proxy
**Description:** Proxy Mission Control through Open WebUI  
**Pros:**
- Single entry point
- Unified authentication
- CORS handling
- URL rewriting

**Cons:**
- Infrastructure complexity
- Need to configure proxy
- Potential performance overhead

**Implementation:**
1. Configure nginx or similar proxy
2. Route `/mission-control/*` to Mission Control
3. Handle authentication
4. Test proxy functionality

**Status:** NOT IMPLEMENTED

---

## RECOMMENDED INTEGRATION

**Selected Approach:** Option 1 (Custom API Endpoint) + Option 3 (Tool Integration)

**Rationale:**
- Start with Custom API Endpoint for quick baseline
- Add Tool Integration for advanced features
- Minimal infrastructure changes
- Leverages existing Open WebUI capabilities

**Implementation Plan:**

### Phase 1: Baseline Integration (Custom API)
1. Add Mission Control as custom API in Open WebUI
2. Configure base URL: `http://mission-control:8000`
3. Map key endpoints:
   - `/health` → Health check tool
   - `/infrastructure/status` → Infrastructure dashboard
   - `/memory/stats` → Memory statistics
4. Test basic connectivity

### Phase 2: Advanced Integration (Tools)
1. Create Python tool functions for Mission Control
2. Implement tools for:
   - Infrastructure monitoring
   - Memory search
   - Event querying
   - Credential inventory
3. Register tools with Open WebUI
4. Add authentication if needed

---

## WHAT WORKS NOW

### Open WebUI
✅ Running on port 3000  
✅ Connected to Ollama  
✅ Serving web interface  
✅ Chat functionality operational  
✅ Model selection working  
✅ User authentication (local)  

### Mission Control
✅ Running on port 8000  
✅ All 13 endpoints operational  
✅ PostgreSQL connected  
✅ Qdrant connected  
✅ Ollama connected  
✅ CORS enabled for all origins  

### Network Connectivity
✅ Both services on same Docker network (`brain_internal`)  
✅ DNS resolution working (`mission-control`, `ollama`)  
✅ Port mapping correct (8000, 3000)  
✅ No firewall blocking  

---

## WHAT REMAINS FUTURE WORK

### Immediate (Required for Integration)
1. **Add Mission Control to Open WebUI Custom APIs**
   - Access Open WebUI settings
   - Add custom API endpoint
   - Test connectivity
   - Map key endpoints

2. **Implement Basic Tool Functions**
   - Create tool for infrastructure status
   - Create tool for memory statistics
   - Register with Open WebUI
   - Test tool execution

### Short-term (Enhanced Integration)
1. **Add Authentication to Mission Control**
   - Implement JWT or API key authentication
   - Configure Open WebUI with credentials
   - Secure endpoint access

2. **Create Comprehensive Tool Suite**
   - Tools for all Mission Control endpoints
   - Error handling and retry logic
   - Response formatting for chat interface

3. **Implement Dashboard Integration**
   - Create Open WebUI dashboard page
   - Display Mission Control metrics
   - Real-time updates via WebSocket

### Long-term (Advanced Features)
1. **Two-Way Integration**
   - Mission Control triggers Open WebUI actions
   - Open WebUI commands Mission Control operations
   - Event-driven architecture

2. **Unified Authentication**
   - Single sign-on between services
   - Shared user database
   - Role-based access control

3. **Advanced Monitoring**
   - Alert integration
   - Automated responses
   - Predictive analytics

---

## INTEGRATION TEST PLAN

### Test 1: Basic Connectivity
```bash
# From Open WebUI container
curl http://mission-control:8000/health
```
**Expected:** `{"status":"healthy"}`

### Test 2: Infrastructure Status
```bash
curl http://mission-control:8000/infrastructure/status
```
**Expected:** JSON with service statuses

### Test 3: Memory Statistics
```bash
curl http://mission-control:8000/memory/stats
```
**Expected:** JSON with memory metrics

### Test 4: Custom API Configuration
1. Access Open WebUI at http://localhost:3000
2. Navigate to Settings → Providers
3. Add Custom API
4. Configure Mission Control endpoint
5. Test connection

**Expected:** Successful connection

---

## NETWORK CONFIGURATION

**Docker Network:** `brain_internal` (bridge)  
**Services on Network:**
- `mission-control` (ping-mission-control)
- `postgres` (brain-postgres)
- `qdrant` (brain-qdrant)
- `ollama` (brain-ollama)
- `openwebui` (brain-openwebui)

**DNS Resolution:**
- `mission-control` → ping-mission-control container
- `postgres` → brain-postgres container
- `qdrant` → brain-qdrant container
- `ollama` → brain-ollama container
- `openwebui` → brain-openwebui container

**Port Mappings:**
- `0.0.0.0:8000` → mission-control:8000
- `0.0.0.0:3000` → openwebui:8080
- `0.0.0.0:6333` → qdrant:6333
- `0.0.0.0:11434` → ollama:11434

---

## SECURITY CONSIDERATIONS

### Current State
- Mission Control: No authentication (CORS enabled for all origins)
- Open WebUI: Local authentication (SQLite)
- Network: Internal Docker network (isolated)
- Encryption: None (HTTP only)

### Recommendations
1. **Add Authentication to Mission Control**
   - Implement API key authentication
   - Add JWT token support
   - Configure Open WebUI with credentials

2. **Enable HTTPS**
   - Add TLS termination
   - Use reverse proxy (nginx)
   - Secure inter-service communication

3. **Network Segmentation**
   - Separate public and private networks
   - Restrict external access
   - Implement network policies

4. **Audit Logging**
   - Log all API calls
   - Track authentication events
   - Monitor for unauthorized access

---

## CONCLUSION

**Phase 3 Status:** BASELINE ESTABLISHED

**Integration Status:** NOT IMPLEMENTED

**Current State:**
- ✅ Open WebUI operational
- ✅ Mission Control operational
- ✅ Network connectivity verified
- ❌ Integration not implemented
- ❌ Tools not created
- ❌ Authentication not configured

**Next Steps:**
1. Configure Mission Control as custom API in Open WebUI
2. Implement basic tool functions
3. Add authentication to Mission Control
4. Create comprehensive tool suite

**Estimated Effort:**
- Baseline integration: 2-4 hours
- Enhanced integration: 1-2 days
- Advanced features: 1-2 weeks

---

## SUCCESS CRITERIA

Integration will be considered complete when:
1. Open WebUI can call Mission Control endpoints
2. Mission Control data displays in Open WebUI interface
3. Tools are functional and tested
4. Authentication is implemented
5. Documentation is updated

---

## NEXT PHASE

**Phase 7: Remove Report Fantasy** - Ensure all reports include proof/evidence
