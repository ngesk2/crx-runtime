"""
Create Constitutional Memory Collection in Qdrant

Constitutional Law: TRUTH ≠ EMBEDDINGS

This collection stores projections of constitutional knowledge.
Truth source: PostgreSQL events + Vault documents
Projection layer: Qdrant (rebuildable)

Dependency: pip install qdrant-client
"""

try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, VectorParams, PointStruct
    QDRANT_AVAILABLE = True
except ImportError:
    QDRANT_AVAILABLE = False
    print("qdrant-client not installed. Install with: pip install qdrant-client")

import os
import sys
from pathlib import Path

# Add constitutional directory to path for SecretAdapter
sys.path.append(str(Path(__file__).parent.parent / 'constitutional'))

try:
    from secret_adapter import get_secret_adapter
    SECRET_ADAPTER_AVAILABLE = True
except ImportError:
    SECRET_ADAPTER_AVAILABLE = False

# Configuration - Use SecretAdapter for secrets
if SECRET_ADAPTER_AVAILABLE:
    secret_adapter = get_secret_adapter()
    qdrant_config = secret_adapter.get_qdrant_config()
    QDRANT_HOST = qdrant_config.get('host', 'localhost')
    QDRANT_PORT = qdrant_config.get('port', 6333)
else:
    # Fallback to environment variables
    QDRANT_HOST = os.getenv('QDRANT_HOST', 'localhost')
    QDRANT_PORT = int(os.getenv('QDRANT_PORT', 6333))

COLLECTION_NAME = "constitutional_memory"

def create_constitutional_memory_collection():
    """Create constitutional_memory collection with constitutional payload structure."""
    
    if not QDRANT_AVAILABLE:
        print("Cannot create collection: qdrant-client not installed")
        print("Install with: pip install qdrant-client")
        return
    
    client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
    
    # Check if collection exists
    collections = client.get_collections().collections
    collection_names = [c.name for c in collections]
    
    if COLLECTION_NAME in collection_names:
        print(f"Collection {COLLECTION_NAME} already exists")
        return
    
    # Create collection
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(
            size=768,  # nomic-embed-text dimension
            distance=Distance.COSINE
        )
    )
    
    print(f"Created collection: {COLLECTION_NAME}")
    
    # Document payload structure
    payload_schema = {
        "id": "str - Unique identifier for the projection",
        "source": "str - Source of the content (vault, postgres, google_drive)",
        "source_type": "str - Type of source (document, event, research, creator_content)",
        "authority_level": "str - Authority level (constitutional, operational, working)",
        "timestamp": "str - ISO timestamp of projection",
        "lineage": "dict - Lineage information (parent_event_ids, source_ids)",
        "content": "str - Content snippet for display",
        "vault_hash": "str - Hash of source document for verification",
        "event_id": "str - Optional: PostgreSQL event ID if source is event",
        "document_path": "str - Optional: Vault document path if source is vault",
        "google_drive_id": "str - Optional: Google Drive file ID if source is Google Drive"
    }
    
    print("\nConstitutional Payload Structure:")
    for key, description in payload_schema.items():
        print(f"  {key}: {description}")
    
    print("\nConstitutional Law: TRUTH ≠ EMBEDDINGS")
    print("  - Truth source: PostgreSQL events + Vault documents")
    print("  - Projection layer: Qdrant (rebuildable)")
    print("  - Embeddings are disposable")
    print("  - Collection can be destroyed and rebuilt from truth")

if __name__ == "__main__":
    create_constitutional_memory_collection()
