# PHASE1A_INFERENCE_GATEWAY_INTERFACE.md

**Design Type:** INFERENCE GATEWAY INTERFACE DEFINITION  
**Design Date:** 2025-01-18  
**Evidence Base:** PHASE1_INFERENCE_GATEWAY_AUDIT.md  
**Status:** IMPLEMENTATION-READY ARTIFACTS  

---

## EXECUTIVE SUMMARY

**Purpose:** Define implementation-ready Python interfaces for Inference Gateway that removes direct provider coupling from Brain.

**Evidence from Phase 1 Audit:**
- Direct Ollama coupling in `summarizer.py` line 1 (`import ollama`)
- Direct Ollama coupling in `summarizer.py` line 17 (`ollama.Client(host=...)`)
- Direct Ollama coupling in `summarizer.py` line 42 (`client.chat(model=...)`)
- Provider-specific response parsing in `summarizer.py` line 49 (`response['message']['content']`)
- 2 call sites: `worker.py` and `process_newsletters.py`

**Interface Goals:**
- Provider-agnostic abstraction
- Support for 6 providers (Ollama, OpenAI, Gemini, Claude, OpenRouter, Mock)
- No application code changes required for provider switching
- Clear error handling and timeout semantics
- Streaming support for future use
- Retry behavior configuration

---

## INTERFACE BOUNDARIES

### Boundary Definition

**Inference Gateway owns:**
- Provider abstraction layer
- Request/response normalization
- Error handling and retry logic
- Timeout management
- Capability detection
- Provider selection

**Inference Gateway does NOT own:**
- Provider SDKs (Ollama, OpenAI, etc.)
- Provider API endpoints
- Provider-specific logic (encapsulated in providers)
- Application business logic

### Dependency Direction

```
Application Code (worker.py, process_newsletters.py)
  ↓
Inference Gateway (interface)
  ↓
Provider Implementations (OllamaProvider, OpenAIProvider, etc.)
  ↓
Provider SDKs (ollama, openai, etc.)
  ↓
Provider APIs
```

---

## CORE INTERFACES

### InferenceGateway Interface

```python
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, field
from enum import Enum
import asyncio
from datetime import datetime

class ProviderType(Enum):
    """Supported provider types."""
    OLLAMA = "ollama"
    OPENAI = "openai"
    GEMINI = "gemini"
    CLAUDE = "claude"
    OPENROUTER = "openrouter"
    MOCK = "mock"

class InferenceError(Exception):
    """Base exception for inference errors."""
    def __init__(self, message: str, provider: str, error_code: str, details: Optional[Dict] = None):
        self.message = message
        self.provider = provider
        self.error_code = error_code
        self.details = details or {}
        super().__init__(f"[{provider}] {message}: {error_code}")

class TimeoutError(InferenceError):
    """Timeout during inference."""
    pass

class ProviderUnavailableError(InferenceError):
    """Provider is unavailable."""
    pass

class RateLimitError(InferenceError):
    """Provider rate limit exceeded."""
    pass

class CapabilityNotSupportedError(InferenceError):
    """Requested capability not supported by provider."""
    pass

@dataclass
class InferenceRequest:
    """Standardized inference request."""
    prompt: str
    model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    system_prompt: Optional[str] = None
    timeout_ms: Optional[int] = 30000  # 30 second default
    metadata: Optional[Dict[str, Any]] = field(default_factory=dict)

@dataclass
class InferenceResponse:
    """Standardized inference response."""
    content: str
    model: str
    provider: str
    tokens_used: Optional[int] = None
    finish_reason: Optional[str] = None
    latency_ms: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = field(default_factory=dict)

@dataclass
class EmbeddingRequest:
    """Standardized embedding request."""
    text: str
    model: Optional[str] = None
    timeout_ms: Optional[int] = 30000
    metadata: Optional[Dict[str, Any]] = field(default_factory=dict)

@dataclass
class EmbeddingResponse:
    """Standardized embedding response."""
    embedding: List[float]
    model: str
    provider: str
    dimensions: int
    tokens_used: Optional[int] = None
    latency_ms: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = field(default_factory=dict)

@dataclass
class SummarizationRequest:
    """Standardized summarization request."""
    content: str
    max_length: Optional[int] = None
    style: Optional[str] = None  # concise, detailed, bullet_points
    timeout_ms: Optional[int] = 30000
    metadata: Optional[Dict[str, Any]] = field(default_factory=dict)

@dataclass
class SummarizationResponse:
    """Standardized summarization response."""
    summary: str
    original_length: int
    summary_length: int
    compression_ratio: float
    model: str
    provider: str
    latency_ms: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = field(default_factory=dict)

@dataclass
class ClassificationRequest:
    """Standardized classification request."""
    content: str
    categories: List[str]
    multi_label: bool = False
    timeout_ms: Optional[int] = 30000
    metadata: Optional[Dict[str, Any]] = field(default_factory=dict)

@dataclass
class ClassificationResponse:
    """Standardized classification response."""
    categories: Dict[str, float]  # category -> confidence
    primary_category: str
    confidence: float
    model: str
    provider: str
    latency_ms: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = field(default_factory=dict)

@dataclass
class ExtractionRequest:
    """Standardized extraction request."""
    content: str
    schema: Dict[str, Any]  # JSON schema for extraction
    timeout_ms: Optional[int] = 30000
    metadata: Optional[Dict[str, Any]] = field(default_factory=dict)

@dataclass
class ExtractionResponse:
    """Standardized extraction response."""
    extracted: Dict[str, Any]
    model: str
    provider: str
    confidence: Optional[float] = None
    latency_ms: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = field(default_factory=dict)

@dataclass
class GenerateRequest:
    """Standardized generate request (current operation from audit)."""
    prompt: str
    model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    system_prompt: Optional[str] = None
    timeout_ms: Optional[int] = 30000
    metadata: Optional[Dict[str, Any]] = field(default_factory=dict)

@dataclass
class GenerateResponse:
    """Standardized generate response (current operation from audit)."""
    content: str
    model: str
    provider: str
    tokens_used: Optional[int] = None
    finish_reason: Optional[str] = None
    latency_ms: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = field(default_factory=dict)

class InferenceGateway(ABC):
    """Abstract base class for inference providers."""
    
    @abstractmethod
    def generate(self, request: GenerateRequest) -> GenerateResponse:
        """
        Generate text completion.
        
        This is the primary operation used by current applications.
        Evidence: summarizer.py line 42 calls ollama.Client.chat()
        
        Args:
            request: GenerateRequest with prompt, model, temperature, max_tokens, system_prompt, timeout_ms
        
        Returns:
            GenerateResponse with content, model, provider, tokens_used, finish_reason, latency_ms
        
        Raises:
            TimeoutError: If request exceeds timeout_ms
            ProviderUnavailableError: If provider is unavailable
            RateLimitError: If provider rate limit is exceeded
            InferenceError: For other inference errors
        """
        pass
    
    @abstractmethod
    def summarize(self, request: SummarizationRequest) -> SummarizationResponse:
        """
        Generate text summary.
        
        Args:
            request: SummarizationRequest with content, max_length, style, timeout_ms
        
        Returns:
            SummarizationResponse with summary, compression_ratio, model, provider, latency_ms
        
        Raises:
            TimeoutError: If request exceeds timeout_ms
            ProviderUnavailableError: If provider is unavailable
            RateLimitError: If provider rate limit is exceeded
            InferenceError: For other inference errors
        """
        pass
    
    @abstractmethod
    def classify(self, request: ClassificationRequest) -> ClassificationResponse:
        """
        Classify text into categories.
        
        Args:
            request: ClassificationRequest with content, categories, multi_label, timeout_ms
        
        Returns:
            ClassificationResponse with categories (dict), primary_category, confidence, model, provider, latency_ms
        
        Raises:
            TimeoutError: If request exceeds timeout_ms
            ProviderUnavailableError: If provider is unavailable
            RateLimitError: If provider rate limit is exceeded
            InferenceError: For other inference errors
        """
        pass
    
    @abstractmethod
    def extract(self, request: ExtractionRequest) -> ExtractionResponse:
        """
        Extract structured data from text.
        
        Args:
            request: ExtractionRequest with content, schema, timeout_ms
        
        Returns:
            ExtractionResponse with extracted data, model, provider, confidence, latency_ms
        
        Raises:
            TimeoutError: If request exceeds timeout_ms
            ProviderUnavailableError: If provider is unavailable
            RateLimitError: If provider rate limit is exceeded
            InferenceError: For other inference errors
        """
        pass
    
    @abstractmethod
    def embed(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """
        Generate text embedding.
        
        Future operation - not currently used by applications.
        
        Args:
            request: EmbeddingRequest with text, model, timeout_ms
        
        Returns:
            EmbeddingResponse with embedding, model, provider, dimensions, tokens_used, latency_ms
        
        Raises:
            TimeoutError: If request exceeds timeout_ms
            ProviderUnavailableError: If provider is unavailable
            RateLimitError: If provider rate limit is exceeded
            CapabilityNotSupportedError: If provider does not support embeddings
            InferenceError: For other inference errors
        """
        pass
    
    @abstractmethod
    def health_check(self) -> bool:
        """
        Check if provider is healthy and accessible.
        
        Returns:
            bool: True if provider is healthy, False otherwise
        """
        pass
    
    @abstractmethod
    def get_provider_info(self) -> Dict[str, Any]:
        """
        Get provider information.
        
        Returns:
            Dict with provider_type, capabilities, default_model, etc.
        """
        pass
    
    @abstractmethod
    def get_model_info(self, model: str) -> Dict[str, Any]:
        """
        Get information about a specific model.
        
        Args:
            model: Model identifier
        
        Returns:
            Dict with model info (context_length, pricing, etc.)
        """
        pass
    
    @abstractmethod
    def supports_capability(self, capability: str) -> bool:
        """
        Check if provider supports a specific capability.
        
        Args:
            capability: Capability name (generate, summarize, classify, extract, embed)
        
        Returns:
            bool: True if capability is supported, False otherwise
        """
        pass
```

---

## STREAMING INTERFACE

### Streaming Support

```python
from typing import AsyncIterator, Iterator
from dataclasses import dataclass

@dataclass
class StreamChunk:
    """Single chunk from streaming response."""
    content: str
    is_final: bool = False
    metadata: Optional[Dict[str, Any]] = None

class StreamingInferenceGateway(InferenceGateway):
    """Extension of InferenceGateway with streaming support."""
    
    @abstractmethod
    async def generate_stream(self, request: GenerateRequest) -> AsyncIterator[StreamChunk]:
        """
        Generate text completion with streaming.
        
        Future operation - not currently used by applications.
        
        Args:
            request: GenerateRequest
        
        Yields:
            StreamChunk with content chunks
        
        Raises:
            TimeoutError: If request exceeds timeout_ms
            ProviderUnavailableError: If provider is unavailable
            RateLimitError: If provider rate limit is exceeded
            InferenceError: For other inference errors
        """
        pass
    
    @abstractmethod
    def generate_stream_sync(self, request: GenerateRequest) -> Iterator[StreamChunk]:
        """
        Generate text completion with streaming (synchronous).
        
        Future operation - not currently used by applications.
        
        Args:
            request: GenerateRequest
        
        Yields:
            StreamChunk with content chunks
        
        Raises:
            TimeoutError: If request exceeds timeout_ms
            ProviderUnavailableError: If provider is unavailable
            RateLimitError: If provider rate limit is exceeded
            InferenceError: For other inference errors
        """
        pass
```

---

## TIMEOUT HANDLING

### Timeout Configuration

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class TimeoutConfig:
    """Timeout configuration for inference operations."""
    default_timeout_ms: int = 30000  # 30 seconds
    generate_timeout_ms: Optional[int] = None
    summarize_timeout_ms: Optional[int] = None
    classify_timeout_ms: Optional[int] = None
    extract_timeout_ms: Optional[int] = None
    embed_timeout_ms: Optional[int] = None
    
    def get_timeout(self, operation: str) -> int:
        """Get timeout for specific operation."""
        timeout_map = {
            'generate': self.generate_timeout_ms,
            'summarize': self.summarize_timeout_ms,
            'classify': self.classify_timeout_ms,
            'extract': self.extract_timeout_ms,
            'embed': self.embed_timeout_ms
        }
        return timeout_map.get(operation, self.default_timeout_ms) or self.default_timeout_ms

class TimeoutMixin:
    """Mixin for timeout handling."""
    
    def __init__(self, timeout_config: Optional[TimeoutConfig] = None):
        self.timeout_config = timeout_config or TimeoutConfig()
    
    def _execute_with_timeout(self, func, operation: str, timeout_ms: Optional[int] = None):
        """
        Execute function with timeout.
        
        Args:
            func: Function to execute
            operation: Operation name for timeout lookup
            timeout_ms: Override timeout (optional)
        
        Returns:
            Function result
        
        Raises:
            TimeoutError: If execution exceeds timeout
        """
        import signal
        from functools import wraps
        
        timeout = timeout_ms or self.timeout_config.get_timeout(operation)
        
        def timeout_handler(signum, frame):
            raise TimeoutError(
                f"Operation '{operation}' exceeded timeout of {timeout}ms",
                provider=self.__class__.__name__,
                error_code="TIMEOUT"
            )
        
        # Set signal handler
        signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(timeout // 1000)  # Convert to seconds
        
        try:
            result = func()
            signal.alarm(0)  # Cancel alarm
            return result
        except TimeoutError:
            signal.alarm(0)  # Cancel alarm
            raise
```

---

## ERROR SCHEMA

### Error Hierarchy

```python
class InferenceError(Exception):
    """Base exception for inference errors."""
    def __init__(self, message: str, provider: str, error_code: str, details: Optional[Dict] = None):
        self.message = message
        self.provider = provider
        self.error_code = error_code
        self.details = details or {}
        self.timestamp = datetime.utcnow().isoformat()
        super().__init__(f"[{provider}] {message}: {error_code}")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary for logging/serialization."""
        return {
            'error_type': self.__class__.__name__,
            'message': self.message,
            'provider': self.provider,
            'error_code': self.error_code,
            'details': self.details,
            'timestamp': self.timestamp
        }

class TimeoutError(InferenceError):
    """Timeout during inference."""
    pass

class ProviderUnavailableError(InferenceError):
    """Provider is unavailable."""
    pass

class RateLimitError(InferenceError):
    """Provider rate limit exceeded."""
    def __init__(self, message: str, provider: str, retry_after_ms: Optional[int] = None, details: Optional[Dict] = None):
        super().__init__(message, provider, "RATE_LIMIT", details)
        self.retry_after_ms = retry_after_ms

class AuthenticationError(InferenceError):
    """Authentication failed."""
    pass

class InvalidRequestError(InferenceError):
    """Invalid request to provider."""
    pass

class ModelNotFoundError(InferenceError):
    """Requested model not found."""
    pass

class ContextLengthExceededError(InferenceError):
    """Request exceeds model context length."""
    def __init__(self, message: str, provider: str, context_length: int, requested_length: int, details: Optional[Dict] = None):
        super().__init__(message, provider, "CONTEXT_LENGTH_EXCEEDED", details)
        self.context_length = context_length
        self.requested_length = requested_length

class CapabilityNotSupportedError(InferenceError):
    """Requested capability not supported by provider."""
    pass
```

### Error Handling Strategy

```python
class ErrorHandler:
    """Centralized error handling for inference operations."""
    
    @staticmethod
    def handle_provider_error(error: Exception, provider: str) -> InferenceError:
        """
        Convert provider-specific errors to InferenceError.
        
        Args:
            error: Provider-specific exception
            provider: Provider name
        
        Returns:
            InferenceError or subclass
        """
        error_str = str(error).lower()
        
        if 'timeout' in error_str or 'timed out' in error_str:
            return TimeoutError(str(error), provider, "TIMEOUT")
        elif 'rate limit' in error_str or '429' in error_str:
            return RateLimitError(str(error), provider)
        elif 'unauthorized' in error_str or '401' in error_str or 'authentication' in error_str:
            return AuthenticationError(str(error), provider, "AUTHENTICATION_FAILED")
        elif 'not found' in error_str or '404' in error_str:
            if 'model' in error_str:
                return ModelNotFoundError(str(error), provider, "MODEL_NOT_FOUND")
            return ProviderUnavailableError(str(error), provider, "NOT_FOUND")
        elif 'context' in error_str and 'length' in error_str:
            return ContextLengthExceededError(str(error), provider, 0, 0)
        else:
            return InferenceError(str(error), provider, "UNKNOWN_ERROR")
```

---

## RETRY BEHAVIOR

### Retry Configuration

```python
from dataclasses import dataclass
from typing import Optional, List
from enum import Enum

class RetryStrategy(Enum):
    """Retry strategy."""
    NONE = "none"
    FIXED = "fixed"
    EXPONENTIAL_BACKOFF = "exponential_backoff"
    LINEAR_BACKOFF = "linear_backoff"

@dataclass
class RetryConfig:
    """Retry configuration."""
    max_retries: int = 3
    strategy: RetryStrategy = RetryStrategy.EXPONENTIAL_BACKOFF
    initial_delay_ms: int = 1000
    max_delay_ms: int = 30000
    backoff_multiplier: float = 2.0
    retryable_errors: List[str] = None
    
    def __post_init__(self):
        if self.retryable_errors is None:
            # Default retryable errors
            self.retryable_errors = [
                "TIMEOUT",
                "RATE_LIMIT",
                "PROVIDER_UNAVAILABLE",
                "CONNECTION_ERROR"
            ]

class RetryMixin:
    """Mixin for retry logic."""
    
    def __init__(self, retry_config: Optional[RetryConfig] = None):
        self.retry_config = retry_config or RetryConfig()
    
    def _should_retry(self, error: InferenceError) -> bool:
        """
        Determine if error is retryable.
        
        Args:
            error: InferenceError
        
        Returns:
            bool: True if error is retryable
        """
        return error.error_code in self.retry_config.retryable_errors
    
    def _calculate_delay(self, attempt: int) -> int:
        """
        Calculate delay for retry attempt.
        
        Args:
            attempt: Retry attempt number (0-indexed)
        
        Returns:
            int: Delay in milliseconds
        """
        if self.retry_config.strategy == RetryStrategy.FIXED:
            return self.retry_config.initial_delay_ms
        elif self.retry_config.strategy == RetryStrategy.EXPONENTIAL_BACKOFF:
            delay = self.retry_config.initial_delay_ms * (self.retry_config.backoff_multiplier ** attempt)
            return min(delay, self.retry_config.max_delay_ms)
        elif self.retry_config.strategy == RetryStrategy.LINEAR_BACKOFF:
            delay = self.retry_config.initial_delay_ms + (attempt * 1000)
            return min(delay, self.retry_config.max_delay_ms)
        else:
            return 0
    
    async def _execute_with_retry(self, func, operation: str):
        """
        Execute function with retry logic.
        
        Args:
            func: Async function to execute
            operation: Operation name for logging
        
        Returns:
            Function result
        
        Raises:
            InferenceError: If all retries exhausted
        """
        import asyncio
        
        last_error = None
        
        for attempt in range(self.retry_config.max_retries + 1):
            try:
                return await func()
            except InferenceError as e:
                last_error = e
                
                if not self._should_retry(e):
                    raise
                
                if attempt < self.retry_config.max_retries:
                    delay_ms = self._calculate_delay(attempt)
                    await asyncio.sleep(delay_ms / 1000)
        
        raise last_error
```

---

## PROVIDER CAPABILITY DETECTION

### Capability Interface

```python
from dataclasses import dataclass
from typing import Dict, List, Set

@dataclass
class ProviderCapabilities:
    """Provider capability information."""
    provider_type: ProviderType
    supported_operations: Set[str]
    default_model: str
    available_models: List[str]
    max_context_length: int
    supports_streaming: bool
    supports_function_calling: bool
    supports_json_mode: bool
    supports_embeddings: bool
    embedding_dimensions: Optional[int] = None

class CapabilityDetectionMixin:
    """Mixin for capability detection."""
    
    @abstractmethod
    def get_capabilities(self) -> ProviderCapabilities:
        """
        Get provider capabilities.
        
        Returns:
            ProviderCapabilities with provider capability information
        """
        pass
    
    def supports_capability(self, capability: str) -> bool:
        """
        Check if provider supports a specific capability.
        
        Args:
            capability: Capability name (generate, summarize, classify, extract, embed)
        
        Returns:
            bool: True if capability is supported
        """
        capabilities = self.get_capabilities()
        return capability in capabilities.supported_operations
    
    def requires_fallback(self, operation: str) -> bool:
        """
        Check if operation requires fallback to another provider.
        
        Args:
            operation: Operation name
        
        Returns:
            bool: True if operation is not supported
        """
        return not self.supports_capability(operation)
```

---

## COMPLETE INTERFACE EXAMPLE

### Example Usage

```python
# Example: Current summarizer.py migration
# Evidence: PHASE1_INFERENCE_GATEWAY_AUDIT.md lines 11-79

# Current code (summarizer.py):
# import ollama
# client = ollama.Client(host=OLLAMA_BASE_URL)
# response = client.chat(model=OLLAMA_MODEL, messages=[...])
# result_text = response['message']['content']

# Migrated code:
from inference_gateway import (
    InferenceGateway, 
    GenerateRequest, 
    GenerateResponse,
    InferenceGatewayFactory
)

def analyze_newsletter(subject: str, body: str, sender: str) -> Dict:
    """
    Analyze a newsletter using Inference Gateway.
    
    Evidence: Migrated from summarizer.py line 11
    """
    try:
        # Create gateway instance (injected or from factory)
        gateway = InferenceGatewayFactory.create_from_config()
        
        # Truncate body if too long (keep existing logic)
        body_truncated = body[:8000] if len(body) > 8000 else body
        
        # Construct prompt (keep existing prompt)
        prompt = f"""You are a newsletter analysis assistant. Please analyze the following newsletter and provide:

1. A concise summary (3-5 sentences)
2. Relevant topics (list of 3-5 main themes like: AI, Energy, Markets, Defense, Politics, Macro, Software, Startups)
3. Key ideas (bullet points, 3-5 main points)
4. Actionable insights (bullet points, 2-4 specific actions)

Newsletter Subject: {subject}
Newsletter From: {sender}
Newsletter Content: {body_truncated}

Please respond in the following JSON format:
{{
  "summary": "your summary here",
  "topics": ["topic1", "topic2", "topic3"],
  "key_ideas": ["idea 1", "idea 2", "idea 3"],
  "actionable_insights": ["insight 1", "insight 2"]
}}
"""
        
        # Create request
        request = GenerateRequest(
            prompt=prompt,
            timeout_ms=30000  # 30 second timeout
        )
        
        # Call gateway (instead of ollama.Client.chat())
        response = gateway.generate(request)
        
        # Parse response (same as existing)
        result_text = response.content
        
        # Try to parse as JSON (keep existing logic)
        try:
            import json
            result = json.loads(result_text)
            
            return {
                'summary': result.get('summary', 'Summary not available'),
                'topics': result.get('topics', []),
                'key_ideas': result.get('key_ideas', []),
                'actionable_insights': result.get('actionable_insights', [])
            }
        except json.JSONDecodeError:
            # Fallback to text parsing if JSON fails (keep existing logic)
            print("JSON parsing failed, using fallback")
            return {
                'summary': result_text[:500],
                'topics': ['general'],
                'key_ideas': ['Analysis parsing failed'],
                'actionable_insights': ['Analysis parsing failed']
            }
        
    except TimeoutError as e:
        print(f"Timeout analyzing newsletter: {e}")
        return {
            'summary': "Analysis timed out",
            'topics': ['error'],
            'key_ideas': ['Analysis timed out'],
            'actionable_insights': ['Analysis timed out']
        }
    except ProviderUnavailableError as e:
        print(f"Provider unavailable: {e}")
        return {
            'summary': "Provider unavailable",
            'topics': ['error'],
            'key_ideas': ['Provider unavailable'],
            'actionable_insights': ['Provider unavailable']
        }
    except InferenceError as e:
        print(f"Error analyzing newsletter: {e}")
        return {
            'summary': "Analysis failed",
            'topics': ['error'],
            'key_ideas': ['Analysis failed'],
            'actionable_insights': ['Analysis failed']
        }
```

---

## SUMMARY

### Interface Components

| Component | Purpose | Status |
|-----------|---------|--------|
| InferenceGateway | Abstract base class for all providers | DEFINED |
| Request/Response Dataclasses | Standardized data structures | DEFINED |
| Error Hierarchy | Provider-agnostic error handling | DEFINED |
| TimeoutMixin | Timeout handling logic | DEFINED |
| RetryMixin | Retry logic with strategies | DEFINED |
| CapabilityDetectionMixin | Capability detection interface | DEFINED |
| StreamingInferenceGateway | Streaming support (future) | DEFINED |

### Method Signatures

| Method | Input | Output | Evidence |
|--------|-------|--------|----------|
| `generate()` | GenerateRequest | GenerateResponse | summarizer.py line 42 |
| `summarize()` | SummarizationRequest | SummarizationResponse | Future operation |
| `classify()` | ClassificationRequest | ClassificationResponse | Future operation |
| `extract()` | ExtractionRequest | ExtractionResponse | Future operation |
| `embed()` | EmbeddingRequest | EmbeddingResponse | Future operation |
| `health_check()` | None | bool | Health check |
| `get_provider_info()` | None | Dict[str, Any] | Provider info |
| `get_model_info()` | str | Dict[str, Any] | Model info |
| `supports_capability()` | str | bool | Capability check |

### Error Handling

| Error Type | Trigger | Recovery |
|------------|---------|-----------|
| TimeoutError | Request exceeds timeout_ms | Retry if configured |
| ProviderUnavailableError | Provider down | Retry if configured |
| RateLimitError | Rate limit exceeded | Retry with backoff |
| AuthenticationError | Auth failed | No retry (fix config) |
| InvalidRequestError | Invalid request | No retry (fix request) |
| ModelNotFoundError | Model not found | No retry (fix model) |
| ContextLengthExceededError | Context too long | No retry (truncate) |
| CapabilityNotSupportedError | Operation not supported | Fallback to other provider |

### Configuration

| Config | Type | Default | Purpose |
|--------|------|---------|---------|
| TimeoutConfig | dataclass | 30s default | Timeout per operation |
| RetryConfig | dataclass | 3 retries, exponential backoff | Retry behavior |
| ProviderCapabilities | dataclass | Per provider | Capability detection |
