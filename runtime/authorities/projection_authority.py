"""ProjectionAuthority — single authority for all Qdrant/vector operations.

Every vector search or projection operation routes through this class.
No worker or tool creates QdrantClient directly.
"""

from typing import Optional, List, Dict, Any
from runtime.config.configuration_authority import ConfigurationAuthority


class ProjectionAuthority:
    """Typed projection authority. All methods are static."""

    @staticmethod
    def get_client():
        """Lazy QdrantClient creation with config from ConfigurationAuthority."""
        from qdrant_client import QdrantClient
        _qcfg = ConfigurationAuthority.current().get_qdrant_config()
        return QdrantClient(
            url=_qcfg.get('url', 'http://localhost:6333'),
            api_key=_qcfg.get('api_key', '')
        )

    @staticmethod
    def get_collections() -> List[str]:
        """List available Qdrant collection names."""
        try:
            client = ProjectionAuthority.get_client()
            return [c.name for c in client.get_collections().collections]
        except Exception:
            return []

    @staticmethod
    def search_collection(query: str, collection: Optional[str] = None, limit: int = 10) -> Optional[List[Dict[str, Any]]]:
        """Search a Qdrant collection by generating an embedding and searching vectors.
        Returns list of results or None if unavailable.
        """
        try:
            client = ProjectionAuthority.get_client()
            collections = ProjectionAuthority.get_collections()
            target = collection if (collection and collection in collections) else (
                'constitutional_documents' if 'constitutional_documents' in collections else (
                    'constitutional_memory' if 'constitutional_memory' in collections else None
                )
            )
            if not target:
                return None
        except Exception:
            return None

        # Generate embedding
        embedding = None
        try:
            import requests
            _ocfg = ConfigurationAuthority.current().get_ollama_config()
            ollama_base = _ocfg.get('base_url', 'http://localhost:11434')
            embed_model = _ocfg.get('embed_model', 'nomic-embed-text')
            resp = requests.post(
                f'{ollama_base}/api/embeddings',
                json={'model': embed_model, 'prompt': query},
                timeout=30
            )
            if resp.status_code == 200:
                embedding = resp.json().get('embedding')
        except Exception:
            pass

        if not embedding:
            return None

        try:
            results = client.search(
                collection_name=target,
                query_vector=embedding,
                limit=limit
            )
            return results
        except Exception:
            return None
