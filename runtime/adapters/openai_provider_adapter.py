"""
OpenAI Provider Adapter - Subordinate to Inference Authority

Constitutional Law: This is a PROVIDER ADAPTER, not an authority.
It is subordinate to InferenceAdapter.

This adapter provides OpenAI-compatible implementation (vLLM).
Only InferenceAdapter may call this adapter.
No business logic may call this adapter directly.
"""

import requests
from typing import List, Dict, Any, Optional

class OpenAIProviderAdapter:
    """OpenAI-compatible provider adapter (subordinate to InferenceAdapter)."""
    
    def __init__(
        self,
        base_url: str,
        embedding_model: str,
        chat_model: str
    ):
        self.base_url = base_url
        self.embedding_model = embedding_model
        self.chat_model = chat_model
    
    def embed(self, text: str) -> Optional[List[float]]:
        """Generate embedding via OpenAI-compatible endpoint."""
        try:
            response = requests.post(
                f"{self.base_url}/v1/embeddings",
                json={
                    "model": self.embedding_model,
                    "input": text
                },
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                embeddings = data.get('data', [])
                if embeddings and len(embeddings) > 0:
                    return embeddings[0].get('embedding')
                else:
                    print("No embedding in response")
                    return None
            else:
                print(f"Embedding failed: {response.status_code}")
                return None
        except Exception as e:
            print(f"Embedding error: {e}")
            return None
    
    def chat(
        self,
        messages: List[Dict[str, str]],
        options: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Generate chat completion via OpenAI-compatible endpoint."""
        try:
            payload = {
                "model": self.chat_model,
                "messages": messages
            }
            
            if options:
                payload.update(options)
            
            response = requests.post(
                f"{self.base_url}/v1/chat/completions",
                json=payload,
                timeout=120
            )
            
            if response.status_code == 200:
                data = response.json()
                # Convert OpenAI format to Ollama format for compatibility
                return {
                    "message": {
                        "role": "assistant",
                        "content": data['choices'][0]['message']['content']
                    },
                    "model": data['model'],
                    "done": True
                }
            else:
                print(f"Chat failed: {response.status_code}")
                return None
        except Exception as e:
            print(f"Chat error: {e}")
            return None
    
    def health(self) -> bool:
        """Check if provider is healthy."""
        try:
            response = requests.get(f"{self.base_url}/v1/models", timeout=10)
            return response.status_code == 200
        except Exception as e:
            print(f"Health check failed: {e}")
            return False
    
    def model_capability(self, model: str, capability: str) -> bool:
        """Check if model has specific capability."""
        try:
            response = requests.get(f"{self.base_url}/v1/models", timeout=10)
            if response.status_code == 200:
                models = response.json().get('data', [])
                for m in models:
                    if m['id'] == model:
                        return True
                return False
            return False
        except Exception as e:
            print(f"Capability check failed: {e}")
            return False
    
    def list_models(self) -> Optional[List[Dict[str, Any]]]:
        """List available models."""
        try:
            response = requests.get(f"{self.base_url}/v1/models")
            if response.status_code == 200:
                data = response.json()
                return data.get('data', [])
            return None
        except Exception as e:
            print(f"List models failed: {e}")
            return None
    
    def get_model_metadata(self, model: str) -> Optional[Dict[str, Any]]:
        """Get metadata for a specific model."""
        try:
            # OpenAI-compatible APIs don't have a standard /show endpoint
            # Return basic model info from list
            models = self.list_models()
            if models:
                for m in models:
                    if m.get('id') == model:
                        return m
            return None
        except Exception as e:
            print(f"Get model metadata failed: {e}")
            return None
    
    def pull_model(self, model: str) -> bool:
        """Pull model - not supported for OpenAI-compatible providers."""
        raise NotImplementedError("Model pulling not supported for OpenAI-compatible providers")
