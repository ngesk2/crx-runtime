from __future__ import annotations

from typing import Any, Optional

from runtime.config.configuration_authority import ConfigurationAuthority


def get_inference_adapter():
    from runtime.adapters.inference_adapter import get_inference_adapter as _get_inference_adapter

    return _get_inference_adapter()


class EmbeddingAuthority:
    """Single authority for embedding model loading and Hugging Face auth."""

    def __init__(self, config: Optional[ConfigurationAuthority] = None):
        self._config = config or ConfigurationAuthority.current()

    def get_token(self) -> Optional[str]:
        token = self._config.get_secret("hf_token")
        if not token or token.startswith("hf_your_access_token_here"):
            return None
        return token

    def authenticate(self) -> Optional[str]:
        token = self.get_token()
        if not token:
            return None
        try:
            from huggingface_hub import login

            login(token=token)
        except Exception:
            pass
        return token

    def embed_text(self, text: str, **kwargs: Any) -> Optional[list[float]]:
        """Generate an embedding through the inference authority rather than direct provider access."""
        adapter = get_inference_adapter()
        return adapter.embed(text)

    def load_model(self, model_name: Optional[str] = None, **kwargs: Any):
        token = self.authenticate()
        model_name = model_name or self._config.get_inference_config().get("embedding_model", "nomic-embed-text")
        try:
            from sentence_transformers import SentenceTransformer
        except Exception as exc:  # pragma: no cover - runtime dependency guard
            raise RuntimeError("sentence-transformers is not available") from exc

        if token:
            kwargs.setdefault("token", token)
        return SentenceTransformer(model_name, **kwargs)
