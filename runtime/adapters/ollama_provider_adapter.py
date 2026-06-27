"""
Ollama Provider Adapter - Subordinate to Inference Authority

Constitutional Law: This is a PROVIDER ADAPTER, not an authority.
It is subordinate to InferenceAdapter.

This adapter provides Ollama-specific implementation.
Only InferenceAdapter may call this adapter.
No business logic may call this adapter directly.
"""

import requests
from typing import List, Dict, Any, Optional

class OllamaProviderAdapter:
    """Ollama provider adapter (subordinate to InferenceAdapter)."""
    
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
        """Generate embedding via Ollama."""
        try:
            response = requests.post(
                f"{self.base_url}/api/embeddings",
                json={
                    "model": self.embedding_model,
                    "prompt": text
                },
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                embedding = data.get('embedding')
                if embedding:
                    return embedding
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
        """Generate chat completion via Ollama."""
        try:
            model = self.chat_model
            clean_options = None
            if options:
                clean_options = {k: v for k, v in options.items() if k != 'model'}
                if 'model' in options:
                    model = options['model']
            payload = {
                "model": model,
                "messages": messages,
                "stream": False
            }
            
            if clean_options:
                payload["options"] = clean_options
            
            response = requests.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=120
            )
            
            if response.status_code == 200:
                try:
                    return response.json()
                except Exception:
                    text = response.text
                    lines = text.strip().split('\n')
                    combined = {}
                    for line in lines:
                        if line.strip():
                            try:
                                import json as _json
                                obj = _json.loads(line)
                                if 'message' in obj:
                                    combined = obj
                                elif 'done' in obj and obj.get('done'):
                                    combined = obj
                                elif 'response' in obj:
                                    combined.setdefault('message', {})['content'] = obj.get('response', '')
                            except Exception:
                                pass
                    if combined:
                        return combined
                    return {'message': {'content': text[:1000]}}
            else:
                print(f"Chat failed: {response.status_code}")
                return None
        except Exception as e:
            print(f"Chat error: {e}")
            return None
    
    def health(self) -> bool:
        """Check if Ollama is healthy."""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=10)
            return response.status_code == 200
        except Exception as e:
            print(f"Health check failed: {e}")
            return False
    
    def model_capability(self, model: str, capability: str) -> bool:
        """Check if model has specific capability."""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=10)
            if response.status_code == 200:
                models = response.json().get('models', [])
                for m in models:
                    if m['name'] == model:
                        return True
                return False
            return False
        except Exception as e:
            print(f"Capability check failed: {e}")
            return False
    
    def list_models(self) -> Optional[List[Dict[str, Any]]]:
        """List available models."""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data.get('models', [])
            return None
        except Exception as e:
            print(f"List models failed: {e}")
            return None
    
    def get_model_metadata(self, model: str) -> Optional[Dict[str, Any]]:
        """Get metadata for a specific model."""
        try:
            response = requests.post(f"{self.base_url}/api/show", json={"name": model}, timeout=10)
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            print(f"Get model metadata failed: {e}")
            return None
    
    def pull_model(self, model: str) -> bool:
        """Pull a model from Ollama registry."""
        try:
            response = requests.post(f"{self.base_url}/api/pull", json={"name": model}, timeout=600)
            return response.status_code == 200
        except Exception as e:
            print(f"Pull model failed: {e}")
            return False
