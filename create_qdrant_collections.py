"""
Create Qdrant collections for projection sovereignty audit
"""

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

client = QdrantClient(host="localhost", port=6333)

# Create constitutional_memory collection
try:
    client.create_collection(
        collection_name="constitutional_memory",
        vectors_config=VectorParams(size=768, distance=Distance.COSINE)
    )
    print("Created constitutional_memory collection")
except Exception as e:
    print(f"Error creating constitutional_memory: {e}")

# Create constitutional_documents collection
try:
    client.create_collection(
        collection_name="constitutional_documents",
        vectors_config=VectorParams(size=768, distance=Distance.COSINE)
    )
    print("Created constitutional_documents collection")
except Exception as e:
    print(f"Error creating constitutional_documents: {e}")

# Verify collections
collections = client.get_collections()
print(f"Total collections: {len(collections.collections)}")
for collection in collections.collections:
    print(f"  - {collection.name}")
