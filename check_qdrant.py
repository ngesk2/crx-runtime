from qdrant_client import QdrantClient
import os
import sys
from pathlib import Path

# Add constitutional directory to path for SecretAdapter
sys.path.append(str(Path(__file__).parent / 'runtime' / 'constitutional'))

try:
    from secret_adapter import get_secret_adapter
    SECRET_ADAPTER_AVAILABLE = True
except ImportError:
    SECRET_ADAPTER_AVAILABLE = False

# Use SecretAdapter for Qdrant configuration
if SECRET_ADAPTER_AVAILABLE:
    secret_adapter = get_secret_adapter()
    qdrant_config = secret_adapter.get_qdrant_config()
    QDRANT_URL = qdrant_config.get('url')
    QDRANT_API_KEY = qdrant_config.get('api_key')
else:
    # Fallback to environment variables
    QDRANT_URL = os.getenv('QDRANT_URL')
    QDRANT_API_KEY = os.getenv('QDRANT_API_KEY')

client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
result = client.scroll(collection_name='constitutional_documents', limit=10, with_payload=True)
print(f'Points found: {len(result[0])}')
for point in result[0]:
    print(f'ID: {point.id}, Title: {point.payload.get("title", "N/A")}')
