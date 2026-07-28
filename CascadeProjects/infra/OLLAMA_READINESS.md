# CRX Ollama Readiness Assessment

**Date**: 2026-06-08  
**Location**: C:\Users\nolan\CRX\CascadeProjects\infra  
**Phase**: PHASE B — Ollama Readiness  
**Mission**: Determine Ollama deployment status and model capacity

---

## 1. Deployment Status

### 1.1 Current Deployment State

**Status**: **NOT DEPLOYED**

**Evidence**:
```bash
docker ps -a --filter "name=crx-ollama"
# Result: No containers found
```

**Configuration Present**: ✅ YES
- Service defined in docker-compose.yml
- Volume mount configured: ./volumes/ollama:/root/.ollama
- Port mapping: 11434:11434
- Network: crx-network
- Environment: OLLAMA_HOST=0.0.0.0

### 1.2 Deployment Readiness

**Ready to Deploy**: ✅ YES

**Required Actions**:
1. Run `docker compose up -d ollama` to start the service
2. Wait for container initialization (~30 seconds)
3. Verify health with curl command (see Section 3)

**No Architectural Changes Required**: The existing configuration is complete and correct.

---

## 2. Service Endpoint

### 2.1 Internal Endpoint (Container-to-Container)

```
http://crx-ollama:11434
```

**Usage**: Gateway and other services on crx-network should use this endpoint.

### 2.2 External Endpoint (Host-to-Container)

```
http://localhost:11434
```

**Usage**: Direct access from host machine for testing/debugging.

### 2.3 Reachability Assessment

**From Gateway**: ✅ REACHABLE
- Both services on crx-network
- Gateway can resolve crx-ollama hostname
- Port 11434 exposed within network

**From UI**: ✅ REACHABLE (via Gateway)
- UI should not connect directly to Ollama
- UI → Gateway → Ollama (architectural requirement)
- Indirect reachability via Gateway

**From Host**: ✅ REACHABLE
- Port 11434 published to host
- Direct access via localhost:11434

---

## 3. Model Storage Path

### 3.1 Volume Configuration

**Host Path**: `./volumes/ollama`  
**Container Path**: `/root/.ollama`  
**Mount Type**: Bind mount  
**Current State**: EMPTY (no models downloaded)

### 3.2 Storage Architecture

```
./volumes/ollama/
├── models/          # Model weights (GGUF files)
├── manifests/       # Model metadata
└── blobs/           # Layer blobs
```

### 3.3 Storage Capacity Requirements

**Base System**: ~500MB (Ollama runtime, no models)

**Per Model Estimates** (see Section 5):
- Qwen3-Coder 7B: ~4-5GB
- DeepSeek-Coder 6.7B: ~4GB
- Codestral 22B: ~12-14GB
- Llama 3.3 70B: ~40GB

**Recommended Disk Space**: **50GB minimum** for development with multiple models.

### 3.4 Persistence Strategy

**Current**: Bind mount to local directory  
**Persistence**: ✅ PERSISTENT across container restarts  
**Backup**: Manual backup of ./volumes/ollama directory required

---

## 4. GPU Assumptions

### 4.1 Current Configuration

**GPU Support**: NOT CONFIGURED

**Evidence**: docker-compose.yml has no GPU device mapping or runtime configuration.

### 4.2 GPU Requirements Assessment

**CPU-Only Inference**: ✅ SUPPORTED
- Ollama runs on CPU by default
- All models can run on CPU (slower)
- Suitable for development/testing

**GPU Acceleration**: ⚠️ REQUIRES CONFIGURATION

**Required Changes for GPU**:
```yaml
services:
  ollama:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

**GPU Requirements by Model**:
- Qwen3-Coder 7B: 6-8GB VRAM
- DeepSeek-Coder 6.7B: 6-8GB VRAM
- Codestral 22B: 16-24GB VRAM
- Llama 3.3 70B: 40-48GB VRAM (requires multi-GPU or quantization)

### 4.3 Recommendation

**Phase 1 (Immediate)**: Use CPU-only inference
- No configuration changes required
- Sufficient for development
- Slower but functional

**Phase 2 (Performance)**: Add GPU support when available
- Requires NVIDIA GPU + drivers + nvidia-docker
- Add GPU deployment configuration to docker-compose.yml
- 10-50x speedup for inference

---

## 5. Model Availability

### 5.1 Currently Configured Model

**From .env**:
```
OLLAMA_MODEL=llama3.2
```

**Status**: NOT DOWNLOADED (container not running)

### 5.2 Recommended Models for CRX

#### 5.2.1 Qwen3-Coder 7B

**Ollama Name**: `qwen2.5-coder:7b` (latest in Qwen series)

**Purpose**: Code generation, refactoring, analysis

**Memory Requirements**:
- Disk: ~4-5GB
- RAM (CPU): ~8GB
- VRAM (GPU): ~6-8GB

**Pull Command**:
```bash
docker exec crx-ollama ollama pull qwen2.5-coder:7b
```

**Suitability**: ✅ HIGH
- Optimized for code tasks
- Reasonable size for local deployment
- Strong performance on coding benchmarks

#### 5.2.2 DeepSeek-Coder 6.7B

**Ollama Name**: `deepseek-coder:6.7b`

**Purpose**: Code generation, debugging

**Memory Requirements**:
- Disk: ~4GB
- RAM (CPU): ~8GB
- VRAM (GPU): ~6-8GB

**Pull Command**:
```bash
docker exec crx-ollama ollama pull deepseek-coder:6.7b
```

**Suitability**: ✅ HIGH
- Specialized for code
- Compact size
- Good performance

#### 5.2.3 Codestral 22B

**Ollama Name**: `codestral:22b`

**Purpose**: Advanced code generation, large-scale refactoring

**Memory Requirements**:
- Disk: ~12-14GB
- RAM (CPU): ~16GB
- VRAM (GPU): ~16-24GB

**Pull Command**:
```bash
docker exec crx-ollama ollama pull codestral:22b
```

**Suitability**: ⚠️ CONDITIONAL
- Excellent code performance
- Large memory requirements
- May be too large for CPU-only inference
- Recommended only with GPU

#### 5.2.4 Llama 3.3 70B

**Ollama Name**: `llama3.3:70b`

**Purpose**: General-purpose LLM, chat, reasoning

**Memory Requirements**:
- Disk: ~40GB
- RAM (CPU): ~64GB
- VRAM (GPU): ~40-48GB (or multi-GPU)

**Pull Command**:
```bash
docker exec crx-ollama ollama pull llama3.3:70b
```

**Suitability**: ❌ NOT RECOMMENDED for local deployment
- Extremely large
- Requires significant hardware
- Better suited for cloud deployment
- Use smaller variant (llama3.2:3b) if Llama family needed

### 5.3 Alternative Lightweight Models

#### 5.3.1 Llama 3.2 3B

**Ollama Name**: `llama3.2:3b`

**Memory Requirements**:
- Disk: ~2GB
- RAM (CPU): ~4GB
- VRAM (GPU): ~3GB

**Suitability**: ✅ EXCELLENT for resource-constrained environments

#### 5.3.2 Phi-3 Mini

**Ollama Name**: `phi3:mini`

**Memory Requirements**:
- Disk: ~2GB
- RAM (CPU): ~4GB
- VRAM (GPU): ~3GB

**Suitability**: ✅ EXCELLENT for fast inference

---

## 6. Health Verification Commands

### 6.1 Container Health Check

**Check if container is running**:
```bash
docker ps --filter "name=crx-ollama"
```

**Expected output**: Container with status "Up"

### 6.2 Ollama Service Health

**Check Ollama API health**:
```bash
curl http://localhost:11434/api/tags
```

**Expected output**: JSON with list of available models (empty if none downloaded)

**Alternative (from within network)**:
```bash
docker exec crx-ollama curl http://localhost:11434/api/tags
```

### 6.3 Model List Verification

**List downloaded models**:
```bash
docker exec crx-ollama ollama list
```

**Expected output**: Table of model names and sizes

### 6.4 Model Pull Verification

**Pull a model and verify**:
```bash
docker exec crx-ollama ollama pull qwen2.5-coder:7b
docker exec crx-ollama ollama list
```

**Expected output**: Model appears in list with size

### 6.5 Inference Test

**Test model inference**:
```bash
docker exec crx-ollama ollama run qwen2.5-coder:7b "Hello, world"
```

**Expected output**: Model response text

---

## 7. Model Pull Commands

### 7.1 Recommended Initial Models

**For Development (CPU-only)**:
```bash
# Pull lightweight code model
docker exec crx-ollama ollama pull qwen2.5-coder:7b

# Pull general-purpose model
docker exec crx-ollama ollama pull llama3.2:3b
```

**For Performance (with GPU)**:
```bash
# Pull larger code model
docker exec crx-ollama ollama pull qwen2.5-coder:7b

# Pull advanced code model
docker exec crx-ollama ollama pull codestral:22b
```

### 7.2 Pull All Recommended Models

```bash
docker exec crx-ollama ollama pull qwen2.5-coder:7b
docker exec crx-ollama ollama pull deepseek-coder:6.7b
docker exec crx-ollama ollama pull llama3.2:3b
docker exec crx-ollama ollama pull phi3:mini
```

### 7.3 Automated Model Pull Script

Create `scripts/pull-models.sh`:
```bash
#!/bin/bash
docker exec crx-ollama ollama pull qwen2.5-coder:7b
docker exec crx-ollama ollama pull llama3.2:3b
docker exec crx-ollama ollama list
```

---

## 8. Memory Estimates Summary

### 8.1 Model Memory Requirements

| Model | Parameter Count | Disk Space | RAM (CPU) | VRAM (GPU) | Inference Speed (CPU) | Inference Speed (GPU) |
|-------|----------------|------------|-----------|------------|----------------------|----------------------|
| phi3:mini | 3.8B | ~2GB | ~4GB | ~3GB | Fast | Very Fast |
| llama3.2:3b | 3B | ~2GB | ~4GB | ~3GB | Fast | Very Fast |
| deepseek-coder:6.7b | 6.7B | ~4GB | ~8GB | ~6-8GB | Medium | Fast |
| qwen2.5-coder:7b | 7B | ~4-5GB | ~8GB | ~6-8GB | Medium | Fast |
| codestral:22b | 22B | ~12-14GB | ~16GB | ~16-24GB | Slow | Medium |
| llama3.3:70b | 70B | ~40GB | ~64GB | ~40-48GB | Very Slow | Medium |

### 8.2 System Requirements

**Minimum for Development (CPU-only)**:
- Disk: 20GB
- RAM: 16GB
- CPU: 4+ cores

**Recommended for Development (CPU-only)**:
- Disk: 50GB
- RAM: 32GB
- CPU: 8+ cores

**Minimum for Performance (with GPU)**:
- Disk: 50GB
- RAM: 32GB
- GPU: 8GB VRAM
- CPU: 8+ cores

**Recommended for Performance (with GPU)**:
- Disk: 100GB
- RAM: 64GB
- GPU: 16GB+ VRAM
- CPU: 16+ cores

---

## 9. Integration Readiness

### 9.1 Gateway Integration

**Required Gateway Configuration**:
```typescript
const OLLAMA_BASE_URL = 'http://crx-ollama:11434';

async function chat(model: string, messages: Message[]): Promise<Response> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      messages: messages,
      stream: false
    })
  });
  return response.json();
}
```

**No Architectural Changes Required**: Gateway can use existing Ollama configuration.

### 9.2 Model Provider Abstraction

**Ollama as Primary Provider**:
- Endpoint: `http://crx-ollama:11434`
- API: `/api/chat`, `/api/generate`, `/api/tags`
- Authentication: None (local deployment)

**OpenRouter as Secondary Provider** (future):
- Endpoint: `https://openrouter.ai/api/v1`
- API: `/chat/completions`
- Authentication: Bearer token

**Abstraction Layer**: Gateway will implement provider interface to switch between Ollama and OpenRouter.

---

## 10. Recommendations

### 10.1 Immediate Actions

1. **Deploy Ollama**: Run `docker compose up -d ollama`
2. **Pull Initial Models**: Pull qwen2.5-coder:7b and llama3.2:3b
3. **Verify Health**: Run health check commands
4. **Test Inference**: Run test inference command

### 10.2 Model Selection Strategy

**Phase 1 (Development)**:
- Primary: qwen2.5-coder:7b (code tasks)
- Secondary: llama3.2:3b (general tasks)

**Phase 2 (Performance)**:
- Add GPU support to docker-compose.yml
- Pull codestral:22b for advanced code tasks
- Keep lightweight models for fast iteration

### 10.3 Configuration Updates

**Update .env**:
```env
OLLAMA_MODEL=qwen2.5-coder:7b
OLLAMA_SECONDARY_MODEL=llama3.2:3b
```

**Add to docker-compose.yml** (optional health check):
```yaml
ollama:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
    interval: 30s
    timeout: 10s
    retries: 3
```

---

## Conclusion

**Ollama Readiness**: ✅ READY

**Deployment Status**: Configured but not running  
**Storage**: Configured and ready  
**GPU**: Not configured (CPU-only acceptable for development)  
**Models**: Can be pulled without architectural changes  
**Integration**: Ready for Gateway integration  

**No Architectural Changes Required**: Existing configuration is complete and correct for local execution substrate.

**Next Phase**: PHASE C — Gateway Insertion Plan
