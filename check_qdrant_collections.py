"""
Check Qdrant collections using Python client
"""

from qdrant_client import QdrantClient

try:
    # Try without API key
    client = QdrantClient(host="localhost", port=6333)
    collections = client.get_collections()
    print("Collections:", collections.collections)
except Exception as e:
    print(f"Error without API key: {e}")
    
    # Try with empty API key
    try:
        client = QdrantClient(host="localhost", port=6333, api_key="")
        collections = client.get_collections()
        print("Collections with empty API key:", collections.collections)
    except Exception as e2:
        print(f"Error with empty API key: {e2}")
