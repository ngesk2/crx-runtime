from qdrant_client import QdrantClient
import os
client = QdrantClient(url=os.getenv('QDRANT_URL'), api_key=os.getenv('QDRANT_API_KEY'))
result = client.scroll(collection_name='constitutional_documents', limit=10, with_payload=True)
print(f'Points found: {len(result[0])}')
for point in result[0]:
    print(f'ID: {point.id}, Title: {point.payload.get("title", "N/A")}')
