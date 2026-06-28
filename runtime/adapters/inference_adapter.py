"""
Inference Adapter - Single Constitutional Authority

Constitutional Law: Exactly one inference authority may exist.
Adapters are allowed. Competing authorities are forbidden.

This is the SINGLE inference authority for CRX.
All inference must flow through this adapter.
Provider adapters (Ollama, vLLM) are subordinate to this authority.

Architecture:
  Business Logic → Inference Adapter → Provider Adapter → Provider
  (Gateway, Newsletter, etc.) → (THIS FILE) → (Ollama/vLLM) → (Ollama/vLLM API)

Provider Adapters:
  - OllamaProviderAdapter (development-only)
  - OpenAIProviderAdapter (production vLLM)

Constitutional Constraints:
  - This is the ONLY inference authority
  - No business logic may call providers directly
  - Provider adapters are subordinate to this authority
  - Provider selection via environment variable
"""

import os
from typing import List, Dict, Any, Optional
from enum import Enum

from runtime.config.configuration_authority import ConfigurationAuthority

class ProviderType(Enum):
    OLLAMA = "ollama"
    OPENAI = "openai"

# Configuration - Single source via ConfigurationAuthority
_config = ConfigurationAuthority.current()
_inference_cfg = _config.get_inference_config()
INFERENCE_PROVIDER = _inference_cfg.get('provider', 'ollama')
INFERENCE_BASE_URL = _inference_cfg.get('base_url', 'http://localhost:11434')
DEFAULT_EMBEDDING_MODEL = _inference_cfg.get('embedding_model', 'nomic-embed-text')
DEFAULT_CHAT_MODEL = _inference_cfg.get('chat_model', 'llama3')

class InferenceAdapter:
    """Single constitutional inference authority."""
    
    def __init__(
        self,
        provider: ProviderType = ProviderType(INFERENCE_PROVIDER),
        base_url: str = INFERENCE_BASE_URL,
        embedding_model: str = DEFAULT_EMBEDDING_MODEL,
        chat_model: str = DEFAULT_CHAT_MODEL
    ):
        self.provider = provider
        self.base_url = base_url
        self.embedding_model = embedding_model
        self.chat_model = chat_model
        
        # Initialize provider adapter
        if self.provider == ProviderType.OLLAMA:
            from .ollama_provider_adapter import OllamaProviderAdapter
            self.provider_adapter = OllamaProviderAdapter(base_url, embedding_model, chat_model)
        elif self.provider == ProviderType.OPENAI:
            from .openai_provider_adapter import OpenAIProviderAdapter
            self.provider_adapter = OpenAIProviderAdapter(base_url, embedding_model, chat_model)
        else:
            raise ValueError(f"Unknown provider: {provider}")
    
    def embed(self, text: str) -> Optional[List[float]]:
        """
        Generate embedding for text.
        
        Constitutional Constraint: This is the ONLY authority for embedding generation.
        """
        return self.provider_adapter.embed(text)
    
    def chat(
        self,
        messages: List[Dict[str, str]],
        options: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Generate chat completion.
        
        Constitutional Constraint: This is the ONLY authority for chat completion.
        """
        return self.provider_adapter.chat(messages, options)
    
    def health(self) -> bool:
        """Check if provider is healthy."""
        return self.provider_adapter.health()
    
    def model_capability(self, model: str, capability: str) -> bool:
        """Check if model has specific capability."""
        return self.provider_adapter.model_capability(model, capability)
    
    def list_models(self) -> Optional[List[Dict[str, Any]]]:
        """List available models from provider."""
        return self.provider_adapter.list_models()
    
    def get_model_metadata(self, model: str) -> Optional[Dict[str, Any]]:
        """Get metadata for a specific model."""
        return self.provider_adapter.get_model_metadata(model)
    
    def pull_model(self, model: str) -> bool:
        """Pull a model from provider registry."""
        return self.provider_adapter.pull_model(model)

# Singleton instance
_inference_instance = None

def get_inference_adapter() -> InferenceAdapter:
    """Get singleton inference adapter instance."""
    global _inference_instance
    if _inference_instance is None:
        _inference_instance = InferenceAdapter()
    return _inference_instance

if __name__ == "__main__":
    # Test adapter
    adapter = get_inference_adapter()
    
    print("Testing Inference Adapter...")
    print(f"Provider: {adapter.provider.value}")
    print(f"Base URL: {adapter.base_url}")
    
    print("\n1. Health Check:")
    print(f"Healthy: {adapter.health()}")
    
    print("\n2. Embedding Test:")
    embedding = adapter.embed("test text")
    if embedding:
        print(f"Embedding dimension: {len(embedding)}")
    
    print("\n3. Chat Test:")
    response = adapter.chat([{"role": "user", "content": "Hello"}])
    if response:
        print(f"Response: {response.get('message', {}).get('content', 'No content')}")
