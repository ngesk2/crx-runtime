# PHASE1_PROVIDER_ABSTRACTION_DESIGN.md

**Design Type:** INFERENCE GATEWAY ABSTRACTION  
**Design Date:** 2025-01-18  
**Design Scope:** Design InferenceGateway interface and provider implementations for multi-provider support  
**Status:** DESIGN ONLY - NO IMPLEMENTATION  

---

## EXECUTIVE SUMMARY

**Design Goal:** Create a provider-agnostic inference abstraction layer that enables Brain to switch between Ollama, OpenAI, Gemini, Claude, OpenRouter, and Mock providers without code changes.

**Key Design Decisions:**
1. **Interface-first design** - Define InferenceGateway interface before implementation
2. **Provider pattern** - Each provider implements the same interface
3. **Configuration-driven** - Provider selection via configuration, not code
4. **Unified response format** - All providers return standardized response objects
5. **Error handling** - Provider-specific errors mapped to gateway errors

**Migration Path:** Brain → InferenceGateway → Provider (instead of Brain → Ollama directly)

---

## INFERENCE GATEWAY INTERFACE

### Interface Definition

```python
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

@dataclass
class InferenceRequest:
    """Standardized inference request."""
    prompt: str
    model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    system_prompt: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class InferenceResponse:
    """Standardized inference response."""
    content: str
    model: str
    tokens_used: Optional[int] = None
    finish_reason: Optional[str] = None
    latency_ms: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class EmbeddingRequest:
    """Standardized embedding request."""
    text: str
    model: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class EmbeddingResponse:
    """Standardized embedding response."""
    embedding: List[float]
    model: str
    dimensions: int
    tokens_used: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class SummarizationRequest:
    """Standardized summarization request."""
    content: str
    max_length: Optional[int] = None
    style: Optional[str] = None  # concise, detailed, bullet_points
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class SummarizationResponse:
    """Standardized summarization response."""
    summary: str
    original_length: int
    summary_length: int
    compression_ratio: float
    model: str
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class ClassificationRequest:
    """Standardized classification request."""
    content: str
    categories: List[str]
    multi_label: bool = False
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class ClassificationResponse:
    """Standardized classification response."""
    categories: Dict[str, float]  # category -> confidence
    primary_category: str
    confidence: float
    model: str
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class ExtractionRequest:
    """Standardized extraction request."""
    content: str
    schema: Dict[str, Any]  # JSON schema for extraction
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class ExtractionResponse:
    """Standardized extraction response."""
    extracted: Dict[str, Any]
    model: str
    confidence: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class RankingRequest:
    """Standardized ranking request."""
    items: List[str]
    query: str
    top_k: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class RankingResponse:
    """Standardized ranking response."""
    ranked_items: List[Dict[str, Any]]  # [{"item": ..., "score": ...}, ...]
    model: str
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class RecommendationRequest:
    """Standardized recommendation request."""
    context: str
    user_preferences: Optional[Dict[str, Any]] = None
    num_recommendations: int = 5
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class RecommendationResponse:
    """Standardized recommendation response."""
    recommendations: List[Dict[str, Any]]
    model: str
    metadata: Optional[Dict[str, Any]] = None

class InferenceGateway(ABC):
    """Abstract base class for inference providers."""
    
    @abstractmethod
    def generate(self, request: InferenceRequest) -> InferenceResponse:
        """Generate text completion."""
        pass
    
    @abstractmethod
    def embed(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """Generate text embedding."""
        pass
    
    @abstractmethod
    def summarize(self, request: SummarizationRequest) -> SummarizationResponse:
        """Generate text summary."""
        pass
    
    @abstractmethod
    def classify(self, request: ClassificationRequest) -> ClassificationResponse:
        """Classify text into categories."""
        pass
    
    @abstractmethod
    def extract(self, request: ExtractionRequest) -> ExtractionResponse:
        """Extract structured data from text."""
        pass
    
    @abstractmethod
    def rank(self, request: RankingRequest) -> RankingResponse:
        """Rank items by relevance to query."""
        pass
    
    @abstractmethod
    def recommend(self, request: RecommendationRequest) -> RecommendationResponse:
        """Generate recommendations based on context."""
        pass
    
    @abstractmethod
    def health_check(self) -> bool:
        """Check if provider is healthy and accessible."""
        pass
    
    @abstractmethod
    def get_model_info(self, model: str) -> Dict[str, Any]:
        """Get information about a specific model."""
        pass
```

### Required Operations

| Operation | Purpose | Input | Output |
|-----------|---------|-------|--------|
| `generate()` | Text completion | InferenceRequest (prompt, model, temperature, max_tokens, system_prompt) | InferenceResponse (content, model, tokens_used, finish_reason, latency_ms) |
| `embed()` | Text embedding | EmbeddingRequest (text, model) | EmbeddingResponse (embedding, model, dimensions, tokens_used) |
| `summarize()` | Text summarization | SummarizationRequest (content, max_length, style) | SummarizationResponse (summary, compression_ratio, model) |
| `classify()` | Text classification | ClassificationRequest (content, categories, multi_label) | ClassificationResponse (categories with confidence, primary_category) |
| `extract()` | Structured extraction | ExtractionRequest (content, schema) | ExtractionResponse (extracted data, confidence) |
| `rank()` | Item ranking | RankingRequest (items, query, top_k) | RankingResponse (ranked items with scores) |
| `recommend()` | Recommendation generation | RecommendationRequest (context, user_preferences, num_recommendations) | RecommendationResponse (recommendations) |

---

## OLLAMA PROVIDER

### Provider Implementation

```python
class OllamaProvider(InferenceGateway):
    """Ollama provider implementation."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize Ollama provider.
        
        Required Configuration:
        - base_url: str (default: http://localhost:11434)
        - default_model: str (default: qwen2.5-coder:7b)
        - timeout: int (default: 30)
        """
        self.base_url = config.get('base_url', 'http://localhost:11434')
        self.default_model = config.get('default_model', 'qwen2.5-coder:7b')
        self.timeout = config.get('timeout', 30)
        self.client = None  # ollama.Client(host=self.base_url)
    
    def generate(self, request: InferenceRequest) -> InferenceResponse:
        """Generate text completion using Ollama chat API."""
        # Map InferenceRequest to Ollama format
        # Call ollama.Client.chat()
        # Map Ollama response to InferenceResponse
        pass
    
    def embed(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """Generate embedding using Ollama embed API."""
        # Map EmbeddingRequest to Ollama format
        # Call ollama.Client.embed()
        # Map Ollama response to EmbeddingResponse
        pass
    
    def summarize(self, request: SummarizationRequest) -> SummarizationResponse:
        """Generate summary using Ollama with summarization prompt."""
        # Construct summarization prompt
        # Call generate()
        # Map response to SummarizationResponse
        pass
    
    def classify(self, request: ClassificationRequest) -> ClassificationResponse:
        """Classify text using Ollama with classification prompt."""
        # Construct classification prompt
        # Call generate()
        # Parse JSON response
        # Map to ClassificationResponse
        pass
    
    def extract(self, request: ExtractionRequest) -> ExtractionResponse:
        """Extract structured data using Ollama with extraction prompt."""
        # Construct extraction prompt with schema
        # Call generate()
        # Parse JSON response
        # Map to ExtractionResponse
        pass
    
    def rank(self, request: RankingRequest) -> RankingResponse:
        """Rank items using Ollama with ranking prompt."""
        # Construct ranking prompt
        # Call generate()
        # Parse JSON response
        # Map to RankingResponse
        pass
    
    def recommend(self, request: RecommendationRequest) -> RecommendationResponse:
        """Generate recommendations using Ollama with recommendation prompt."""
        # Construct recommendation prompt
        # Call generate()
        # Parse JSON response
        # Map to RecommendationResponse
        pass
    
    def health_check(self) -> bool:
        """Check Ollama health."""
        # Call ollama.Client.list() or ping endpoint
        pass
    
    def get_model_info(self, model: str) -> Dict[str, Any]:
        """Get Ollama model information."""
        # Call ollama.Client.show()
        pass
```

### Required Configuration

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `base_url` | str | No | http://localhost:11434 | Ollama API endpoint |
| `default_model` | str | No | qwen2.5-coder:7b | Default model to use |
| `timeout` | int | No | 30 | Request timeout in seconds |

### Required Methods

| Method | Purpose | Return Type |
|--------|---------|-------------|
| `__init__(config)` | Initialize provider with configuration | None |
| `generate(request)` | Generate text completion | InferenceResponse |
| `embed(request)` | Generate text embedding | EmbeddingResponse |
| `summarize(request)` | Generate text summary | SummarizationResponse |
| `classify(request)` | Classify text into categories | ClassificationResponse |
| `extract(request)` | Extract structured data | ExtractionResponse |
| `rank(request)` | Rank items by relevance | RankingResponse |
| `recommend(request)` | Generate recommendations | RecommendationResponse |
| `health_check()` | Check provider health | bool |
| `get_model_info(model)` | Get model information | Dict[str, Any] |

### Expected Return Contracts

**generate():**
- Returns InferenceResponse with:
  - `content`: Generated text
  - `model`: Model name used
  - `tokens_used`: Token count (if available)
  - `finish_reason`: Completion reason (if available)
  - `latency_ms`: Request latency in milliseconds

**embed():**
- Returns EmbeddingResponse with:
  - `embedding`: List of floats (vector)
  - `model`: Model name used
  - `dimensions`: Embedding dimension count
  - `tokens_used`: Token count (if available)

**summarize():**
- Returns SummarizationResponse with:
  - `summary`: Generated summary
  - `original_length`: Original text length
  - `summary_length`: Summary length
  - `compression_ratio`: original_length / summary_length
  - `model`: Model name used

**classify():**
- Returns ClassificationResponse with:
  - `categories`: Dict mapping category to confidence (0-1)
  - `primary_category`: Category with highest confidence
  - `confidence`: Confidence of primary category
  - `model`: Model name used

**extract():**
- Returns ExtractionResponse with:
  - `extracted`: Dict matching requested schema
  - `model`: Model name used
  - `confidence`: Overall confidence (if available)

**rank():**
- Returns RankingResponse with:
  - `ranked_items`: List of dicts with "item" and "score" keys
  - `model`: Model name used

**recommend():**
- Returns RecommendationResponse with:
  - `recommendations`: List of recommendation dicts
  - `model`: Model name used

---

## OPENAI PROVIDER

### Provider Implementation

```python
class OpenAIProvider(InferenceGateway):
    """OpenAI provider implementation."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize OpenAI provider.
        
        Required Configuration:
        - api_key: str
        - base_url: str (optional, default: https://api.openai.com/v1)
        - default_model: str (default: gpt-4o-mini)
        - timeout: int (default: 30)
        """
        self.api_key = config.get('api_key')
        self.base_url = config.get('base_url', 'https://api.openai.com/v1')
        self.default_model = config.get('default_model', 'gpt-4o-mini')
        self.timeout = config.get('timeout', 30)
        self.client = None  # OpenAI(api_key=self.api_key, base_url=self.base_url)
    
    def generate(self, request: InferenceRequest) -> InferenceResponse:
        """Generate text completion using OpenAI chat API."""
        # Map InferenceRequest to OpenAI format
        # Call openai.ChatCompletion.create()
        # Map OpenAI response to InferenceResponse
        pass
    
    def embed(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """Generate embedding using OpenAI embeddings API."""
        # Map EmbeddingRequest to OpenAI format
        # Call openai.Embedding.create()
        # Map OpenAI response to EmbeddingResponse
        pass
    
    def summarize(self, request: SummarizationRequest) -> SummarizationResponse:
        """Generate summary using OpenAI with summarization prompt."""
        # Construct summarization prompt
        # Call generate()
        # Map response to SummarizationResponse
        pass
    
    def classify(self, request: ClassificationRequest) -> ClassificationResponse:
        """Classify text using OpenAI with classification prompt."""
        # Construct classification prompt
        # Call generate()
        # Parse JSON response
        # Map to ClassificationResponse
        pass
    
    def extract(self, request: ExtractionRequest) -> ExtractionResponse:
        """Extract structured data using OpenAI with extraction prompt."""
        # Construct extraction prompt with schema
        # Use OpenAI JSON mode if available
        # Call generate()
        # Parse JSON response
        # Map to ExtractionResponse
        pass
    
    def rank(self, request: RankingRequest) -> RankingResponse:
        """Rank items using OpenAI with ranking prompt."""
        # Construct ranking prompt
        # Call generate()
        # Parse JSON response
        # Map to RankingResponse
        pass
    
    def recommend(self, request: RecommendationRequest) -> RecommendationResponse:
        """Generate recommendations using OpenAI with recommendation prompt."""
        # Construct recommendation prompt
        # Call generate()
        # Parse JSON response
        # Map to RecommendationResponse
        pass
    
    def health_check(self) -> bool:
        """Check OpenAI health."""
        # Call OpenAI models list endpoint
        pass
    
    def get_model_info(self, model: str) -> Dict[str, Any]:
        """Get OpenAI model information."""
        # Call OpenAI model info endpoint
        pass
```

### Required Configuration

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `api_key` | str | Yes | None | OpenAI API key |
| `base_url` | str | No | https://api.openai.com/v1 | OpenAI API endpoint |
| `default_model` | str | No | gpt-4o-mini | Default model to use |
| `timeout` | int | No | 30 | Request timeout in seconds |

### Required Methods

Same as OllamaProvider (all InferenceGateway methods must be implemented)

### Expected Return Contracts

Same as OllamaProvider (all methods return same response types)

---

## GEMINI PROVIDER

### Provider Implementation

```python
class GeminiProvider(InferenceGateway):
    """Google Gemini provider implementation."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize Gemini provider.
        
        Required Configuration:
        - api_key: str
        - default_model: str (default: gemini-1.5-flash)
        - timeout: int (default: 30)
        """
        self.api_key = config.get('api_key')
        self.default_model = config.get('default_model', 'gemini-1.5-flash')
        self.timeout = config.get('timeout', 30)
        self.client = None  # genai.Client(api_key=self.api_key)
    
    def generate(self, request: InferenceRequest) -> InferenceResponse:
        """Generate text completion using Gemini API."""
        # Map InferenceRequest to Gemini format
        # Call genai.generate_content()
        # Map Gemini response to InferenceResponse
        pass
    
    def embed(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """Generate embedding using Gemini embedding API."""
        # Map EmbeddingRequest to Gemini format
        # Call genai.embed_content()
        # Map Gemini response to EmbeddingResponse
        pass
    
    def summarize(self, request: SummarizationRequest) -> SummarizationResponse:
        """Generate summary using Gemini with summarization prompt."""
        # Construct summarization prompt
        # Call generate()
        # Map response to SummarizationResponse
        pass
    
    def classify(self, request: ClassificationRequest) -> ClassificationResponse:
        """Classify text using Gemini with classification prompt."""
        # Construct classification prompt
        # Call generate()
        # Parse JSON response
        # Map to ClassificationResponse
        pass
    
    def extract(self, request: ExtractionRequest) -> ExtractionResponse:
        """Extract structured data using Gemini with extraction prompt."""
        # Construct extraction prompt with schema
        # Use Gemini JSON mode if available
        # Call generate()
        # Parse JSON response
        # Map to ExtractionResponse
        pass
    
    def rank(self, request: RankingRequest) -> RankingResponse:
        """Rank items using Gemini with ranking prompt."""
        # Construct ranking prompt
        # Call generate()
        # Parse JSON response
        # Map to RankingResponse
        pass
    
    def recommend(self, request: RecommendationRequest) -> RecommendationResponse:
        """Generate recommendations using Gemini with recommendation prompt."""
        # Construct recommendation prompt
        # Call generate()
        # Parse JSON response
        # Map to RecommendationResponse
        pass
    
    def health_check(self) -> bool:
        """Check Gemini health."""
        # Call Gemini models list endpoint
        pass
    
    def get_model_info(self, model: str) -> Dict[str, Any]:
        """Get Gemini model information."""
        # Call Gemini model info endpoint
        pass
```

### Required Configuration

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `api_key` | str | Yes | None | Google API key |
| `default_model` | str | No | gemini-1.5-flash | Default model to use |
| `timeout` | int | No | 30 | Request timeout in seconds |

### Required Methods

Same as OllamaProvider (all InferenceGateway methods must be implemented)

### Expected Return Contracts

Same as OllamaProvider (all methods return same response types)

---

## CLAUDE PROVIDER

### Provider Implementation

```python
class ClaudeProvider(InferenceGateway):
    """Anthropic Claude provider implementation."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize Claude provider.
        
        Required Configuration:
        - api_key: str
        - base_url: str (optional, default: https://api.anthropic.com)
        - default_model: str (default: claude-3-5-sonnet-20241022)
        - timeout: int (default: 30)
        """
        self.api_key = config.get('api_key')
        self.base_url = config.get('base_url', 'https://api.anthropic.com')
        self.default_model = config.get('default_model', 'claude-3-5-sonnet-20241022')
        self.timeout = config.get('timeout', 30)
        self.client = None  # anthropic.Anthropic(api_key=self.api_key, base_url=self.base_url)
    
    def generate(self, request: InferenceRequest) -> InferenceResponse:
        """Generate text completion using Claude API."""
        # Map InferenceRequest to Claude format
        # Call anthropic.messages.create()
        # Map Claude response to InferenceResponse
        pass
    
    def embed(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """Generate embedding using Claude embedding API (if available)."""
        # Note: Claude may not have embedding API
        # May need to use alternative or raise NotImplementedError
        pass
    
    def summarize(self, request: SummarizationRequest) -> SummarizationResponse:
        """Generate summary using Claude with summarization prompt."""
        # Construct summarization prompt
        # Call generate()
        # Map response to SummarizationResponse
        pass
    
    def classify(self, request: ClassificationRequest) -> ClassificationResponse:
        """Classify text using Claude with classification prompt."""
        # Construct classification prompt
        # Call generate()
        # Parse JSON response
        # Map to ClassificationResponse
        pass
    
    def extract(self, request: ExtractionRequest) -> ExtractionResponse:
        """Extract structured data using Claude with extraction prompt."""
        # Construct extraction prompt with schema
        # Use Claude JSON mode if available
        # Call generate()
        # Parse JSON response
        # Map to ExtractionResponse
        pass
    
    def rank(self, request: RankingRequest) -> RankingResponse:
        """Rank items using Claude with ranking prompt."""
        # Construct ranking prompt
        # Call generate()
        # Parse JSON response
        # Map to RankingResponse
        pass
    
    def recommend(self, request: RecommendationRequest) -> RecommendationResponse:
        """Generate recommendations using Claude with recommendation prompt."""
        # Construct recommendation prompt
        # Call generate()
        # Parse JSON response
        # Map to RecommendationResponse
        pass
    
    def health_check(self) -> bool:
        """Check Claude health."""
        # Call Claude models list endpoint
        pass
    
    def get_model_info(self, model: str) -> Dict[str, Any]:
        """Get Claude model information."""
        # Call Claude model info endpoint
        pass
```

### Required Configuration

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `api_key` | str | Yes | None | Anthropic API key |
| `base_url` | str | No | https://api.anthropic.com | Anthropic API endpoint |
| `default_model` | str | No | claude-3-5-sonnet-20241022 | Default model to use |
| `timeout` | int | No | 30 | Request timeout in seconds |

### Required Methods

Same as OllamaProvider (all InferenceGateway methods must be implemented)

### Expected Return Contracts

Same as OllamaProvider (all methods return same response types)

**Note:** Claude may not have a native embedding API. The `embed()` method may need to:
1. Raise NotImplementedError
2. Use a third-party embedding service
3. Use a different provider for embeddings

---

## OPENROUTER PROVIDER

### Provider Implementation

```python
class OpenRouterProvider(InferenceGateway):
    """OpenRouter provider implementation (multi-provider aggregator)."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize OpenRouter provider.
        
        Required Configuration:
        - api_key: str
        - base_url: str (optional, default: https://openrouter.ai/api/v1)
        - default_model: str (default: anthropic/claude-3.5-sonnet)
        - timeout: int (default: 30)
        """
        self.api_key = config.get('api_key')
        self.base_url = config.get('base_url', 'https://openrouter.ai/api/v1')
        self.default_model = config.get('default_model', 'anthropic/claude-3.5-sonnet')
        self.timeout = config.get('timeout', 30)
        self.client = None  # OpenAI-compatible client pointing to OpenRouter
    
    def generate(self, request: InferenceRequest) -> InferenceResponse:
        """Generate text completion using OpenRouter API (OpenAI-compatible)."""
        # Map InferenceRequest to OpenRouter format (OpenAI-compatible)
        # Call OpenRouter chat API
        # Map OpenRouter response to InferenceResponse
        pass
    
    def embed(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """Generate embedding using OpenRouter embedding API."""
        # Map EmbeddingRequest to OpenRouter format
        # Call OpenRouter embedding API
        # Map OpenRouter response to EmbeddingResponse
        pass
    
    def summarize(self, request: SummarizationRequest) -> SummarizationResponse:
        """Generate summary using OpenRouter with summarization prompt."""
        # Construct summarization prompt
        # Call generate()
        # Map response to SummarizationResponse
        pass
    
    def classify(self, request: ClassificationRequest) -> ClassificationResponse:
        """Classify text using OpenRouter with classification prompt."""
        # Construct classification prompt
        # Call generate()
        # Parse JSON response
        # Map to ClassificationResponse
        pass
    
    def extract(self, request: ExtractionRequest) -> ExtractionResponse:
        """Extract structured data using OpenRouter with extraction prompt."""
        # Construct extraction prompt with schema
        # Use OpenRouter JSON mode if available
        # Call generate()
        # Parse JSON response
        # Map to ExtractionResponse
        pass
    
    def rank(self, request: RankingRequest) -> RankingResponse:
        """Rank items using OpenRouter with ranking prompt."""
        # Construct ranking prompt
        # Call generate()
        # Parse JSON response
        # Map to RankingResponse
        pass
    
    def recommend(self, request: RecommendationRequest) -> RecommendationResponse:
        """Generate recommendations using OpenRouter with recommendation prompt."""
        # Construct recommendation prompt
        # Call generate()
        # Parse JSON response
        # Map to RecommendationResponse
        pass
    
    def health_check(self) -> bool:
        """Check OpenRouter health."""
        # Call OpenRouter models list endpoint
        pass
    
    def get_model_info(self, model: str) -> Dict[str, Any]:
        """Get OpenRouter model information."""
        # Call OpenRouter model info endpoint
        pass
```

### Required Configuration

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `api_key` | str | Yes | None | OpenRouter API key |
| `base_url` | str | No | https://openrouter.ai/api/v1 | OpenRouter API endpoint |
| `default_model` | str | No | anthropic/claude-3.5-sonnet | Default model to use |
| `timeout` | int | No | 30 | Request timeout in seconds |

### Required Methods

Same as OllamaProvider (all InferenceGateway methods must be implemented)

### Expected Return Contracts

Same as OllamaProvider (all methods return same response types)

---

## MOCK PROVIDER

### Provider Implementation

```python
class MockProvider(InferenceGateway):
    """Mock provider for testing and development."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize Mock provider.
        
        Required Configuration:
        - latency_ms: int (default: 0) - Simulated latency
        - error_rate: float (default: 0.0) - Simulated error rate (0-1)
        - deterministic: bool (default: True) - Return deterministic responses
        """
        self.latency_ms = config.get('latency_ms', 0)
        self.error_rate = config.get('error_rate', 0.0)
        self.deterministic = config.get('deterministic', True)
    
    def generate(self, request: InferenceRequest) -> InferenceResponse:
        """Generate mock text completion."""
        # Return deterministic or random mock response
        # Simulate latency
        # Simulate errors based on error_rate
        pass
    
    def embed(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """Generate mock embedding."""
        # Return deterministic or random mock embedding vector
        # Simulate latency
        # Simulate errors based on error_rate
        pass
    
    def summarize(self, request: SummarizationRequest) -> SummarizationResponse:
        """Generate mock summary."""
        # Return deterministic or random mock summary
        # Simulate latency
        # Simulate errors based on error_rate
        pass
    
    def classify(self, request: ClassificationRequest) -> ClassificationResponse:
        """Generate mock classification."""
        # Return deterministic or random mock classification
        # Simulate latency
        # Simulate errors based on error_rate
        pass
    
    def extract(self, request: ExtractionRequest) -> ExtractionResponse:
        """Generate mock extraction."""
        # Return deterministic or random mock extraction
        # Simulate latency
        # Simulate errors based on error_rate
        pass
    
    def rank(self, request: RankingRequest) -> RankingResponse:
        """Generate mock ranking."""
        # Return deterministic or random mock ranking
        # Simulate latency
        # Simulate errors based on error_rate
        pass
    
    def recommend(self, request: RecommendationRequest) -> RecommendationResponse:
        """Generate mock recommendations."""
        # Return deterministic or random mock recommendations
        # Simulate latency
        # Simulate errors based on error_rate
        pass
    
    def health_check(self) -> bool:
        """Mock health check always returns True."""
        return True
    
    def get_model_info(self, model: str) -> Dict[str, Any]:
        """Return mock model information."""
        return {
            'model': model,
            'provider': 'mock',
            'context_length': 128000,
            'pricing': {'input': 0.0, 'output': 0.0}
        }
```

### Required Configuration

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `latency_ms` | int | No | 0 | Simulated latency in milliseconds |
| `error_rate` | float | No | 0.0 | Simulated error rate (0-1) |
| `deterministic` | bool | No | True | Return deterministic responses |

### Required Methods

Same as OllamaProvider (all InferenceGateway methods must be implemented)

### Expected Return Contracts

Same as OllamaProvider (all methods return same response types)

**Note:** Mock provider is for testing and development only. It does not call any external API.

---

## GATEWAY FACTORY

### Factory Implementation

```python
class InferenceGatewayFactory:
    """Factory for creating InferenceGateway instances."""
    
    @staticmethod
    def create(provider_type: str, config: Dict[str, Any]) -> InferenceGateway:
        """
        Create an InferenceGateway instance based on provider type.
        
        Provider Types:
        - 'ollama': OllamaProvider
        - 'openai': OpenAIProvider
        - 'gemini': GeminiProvider
        - 'claude': ClaudeProvider
        - 'openrouter': OpenRouterProvider
        - 'mock': MockProvider
        
        Args:
            provider_type: str - Provider type identifier
            config: Dict[str, Any] - Provider configuration
        
        Returns:
            InferenceGateway instance
        
        Raises:
            ValueError: If provider_type is unknown
        """
        providers = {
            'ollama': OllamaProvider,
            'openai': OpenAIProvider,
            'gemini': GeminiProvider,
            'claude': ClaudeProvider,
            'openrouter': OpenRouterProvider,
            'mock': MockProvider
        }
        
        provider_class = providers.get(provider_type.lower())
        if not provider_class:
            raise ValueError(f"Unknown provider type: {provider_type}")
        
        return provider_class(config)
```

### Configuration Example

```python
# Example configuration for different providers

OLLAMA_CONFIG = {
    'base_url': 'http://localhost:11434',
    'default_model': 'qwen2.5-coder:7b',
    'timeout': 30
}

OPENAI_CONFIG = {
    'api_key': 'sk-...',
    'base_url': 'https://api.openai.com/v1',
    'default_model': 'gpt-4o-mini',
    'timeout': 30
}

GEMINI_CONFIG = {
    'api_key': '...',
    'default_model': 'gemini-1.5-flash',
    'timeout': 30
}

CLAUDE_CONFIG = {
    'api_key': 'sk-ant-...',
    'base_url': 'https://api.anthropic.com',
    'default_model': 'claude-3-5-sonnet-20241022',
    'timeout': 30
}

OPENROUTER_CONFIG = {
    'api_key': 'sk-or-...',
    'base_url': 'https://openrouter.ai/api/v1',
    'default_model': 'anthropic/claude-3.5-sonnet',
    'timeout': 30
}

MOCK_CONFIG = {
    'latency_ms': 100,
    'error_rate': 0.0,
    'deterministic': True
}
```

---

## MIGRATION PATH

### Current Architecture

```
Brain (worker.py, process_newsletters.py)
  ↓
summarizer.py (direct Ollama coupling)
  ↓
ollama.Client(host=OLLAMA_BASE_URL)
  ↓
Ollama API (http://localhost:11434)
```

### Target Architecture

```
Brain (worker.py, process_newsletters.py)
  ↓
InferenceGateway (interface)
  ↓
Provider Implementation (OllamaProvider, OpenAIProvider, etc.)
  ↓
Provider API (Ollama, OpenAI, Gemini, Claude, OpenRouter)
```

### Migration Steps

1. **Create InferenceGateway interface** - Define abstract base class
2. **Implement OllamaProvider** - Migrate current Ollama code to provider
3. **Create InferenceGatewayFactory** - Factory for provider instantiation
4. **Update Brain code** - Replace direct Ollama calls with InferenceGateway
5. **Test with OllamaProvider** - Verify behavior matches current implementation
6. **Implement additional providers** - OpenAI, Gemini, Claude, OpenRouter, Mock
7. **Add provider configuration** - Environment variables for provider selection
8. **Test provider switching** - Verify provider replacement works without code changes

### Configuration Migration

**Current (.env.example):**
```
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b
```

**Target (.env.example):**
```
INFERENCE_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-flash
CLAUDE_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-sonnet-20241022
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

---

## SUMMARY

### Interface Design

| Component | Purpose | Status |
|-----------|---------|--------|
| InferenceGateway | Abstract base class for all providers | DESIGN |
| InferenceRequest | Standardized request dataclass | DESIGN |
| InferenceResponse | Standardized response dataclass | DESIGN |
| EmbeddingRequest/Response | Embedding-specific types | DESIGN |
| SummarizationRequest/Response | Summarization-specific types | DESIGN |
| ClassificationRequest/Response | Classification-specific types | DESIGN |
| ExtractionRequest/Response | Extraction-specific types | DESIGN |
| RankingRequest/Response | Ranking-specific types | DESIGN |
| RecommendationRequest/Response | Recommendation-specific types | DESIGN |

### Provider Implementations

| Provider | Status | Required Config | Notes |
|----------|--------|-----------------|-------|
| OllamaProvider | DESIGN | base_url, default_model | Current provider |
| OpenAIProvider | DESIGN | api_key, base_url, default_model | Popular commercial provider |
| GeminiProvider | DESIGN | api_key, default_model | Google's provider |
| ClaudeProvider | DESIGN | api_key, base_url, default_model | Anthropic's provider |
| OpenRouterProvider | DESIGN | api_key, base_url, default_model | Multi-provider aggregator |
| MockProvider | DESIGN | latency_ms, error_rate, deterministic | For testing |

### Required Operations

| Operation | All Providers | Notes |
|-----------|---------------|-------|
| generate() | Yes | Text completion |
| embed() | Yes | Text embedding (Claude may need workaround) |
| summarize() | Yes | Text summarization |
| classify() | Yes | Text classification |
| extract() | Yes | Structured extraction |
| rank() | Yes | Item ranking |
| recommend() | Yes | Recommendation generation |
| health_check() | Yes | Provider health check |
| get_model_info() | Yes | Model information |

### Migration Benefits

1. **Provider flexibility** - Switch providers without code changes
2. **Testing support** - Mock provider for development/testing
3. **Cost optimization** - Switch to cheaper providers as needed
4. **Redundancy** - Fallback to alternative providers
5. **Feature parity** - All providers support same operations
6. **Type safety** - Standardized request/response types
