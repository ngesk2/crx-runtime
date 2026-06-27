"""
Constitutional Projection Worker

Constitutional Law: TRUTH ≠ EMBEDDINGS

This worker projects constitutional knowledge from truth sources to Qdrant.
Truth sources: Vault documents, PostgreSQL events
Projection layer: Qdrant (rebuildable)

Responsibilities:
- Read vault documents
- Read canonical events
- Chunk content
- Generate embeddings through Ollama
- Store projections in Qdrant

Requirements:
- Idempotent
- Re-runnable
- Rebuild entire collection from scratch
"""

import os
import sys
import hashlib
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'adapters'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'constitutional'))

from inference_adapter import get_inference_adapter

try:
    from secret_adapter import get_secret_adapter
    SECRET_ADAPTER_AVAILABLE = True
except ImportError:
    SECRET_ADAPTER_AVAILABLE = False

try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, VectorParams, PointStruct
    QDRANT_AVAILABLE = True
except ImportError:
    QDRANT_AVAILABLE = False

# Configuration - Use SecretAdapter for secrets
VAULT_PATH = os.getenv('VAULT_PATH', r'C:\Users\nolan\PING\vault')

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
EMBEDDING_MODEL = os.getenv('EMBEDDING_MODEL', 'nomic-embed-text')
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

class ConstitutionalProjectionWorker:
    """Worker for projecting constitutional knowledge to Qdrant."""
    
    def __init__(self):
        self.inference_adapter = get_inference_adapter()
        self.embedding_dimension = 768  # Default for nomic-embed-text
        
        if QDRANT_AVAILABLE:
            self.qdrant_client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
        else:
            self.qdrant_client = None
            print("Qdrant client not available. Install with: pip install qdrant-client")
    
    def compute_content_hash(self, content: str) -> str:
        """Compute SHA256 hash of content."""
        return hashlib.sha256(content.encode()).hexdigest()
    
    def chunk_content(self, content: str) -> List[str]:
        """Chunk content into smaller pieces for embedding."""
        chunks = []
        words = content.split()
        
        for i in range(0, len(words), CHUNK_SIZE):
            chunk = ' '.join(words[i:i + CHUNK_SIZE])
            chunks.append(chunk)
        
        return chunks
    
    def determine_authority_level(self, file_path: str) -> str:
        """Determine authority level based on file path."""
        if 'constitutional/immutable' in file_path:
            return 'constitutional'
        elif 'laws' in file_path:
            return 'constitutional'
        elif 'constitution' in file_path:
            return 'constitutional'
        elif 'audits' in file_path:
            return 'operational'
        elif 'capabilities' in file_path:
            return 'operational'
        elif 'runbooks' in file_path:
            return 'operational'
        else:
            return 'working'
    
    def determine_source_type(self, file_path: str) -> str:
        """Determine source type based on file path."""
        if 'constitutional' in file_path or 'laws' in file_path:
            return 'document'
        elif 'research' in file_path:
            return 'research'
        elif 'creator' in file_path:
            return 'creator_content'
        else:
            return 'document'
    
    def index_vault_document(self, file_path: str) -> List[Dict[str, Any]]:
        """Index a single vault document."""
        projections = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Compute hash
            content_hash = self.compute_content_hash(content)
            
            # Determine metadata
            authority_level = self.determine_authority_level(file_path)
            source_type = self.determine_source_type(file_path)
            
            # Extract title (first line)
            lines = content.split('\n')
            title = lines[0].replace('#', '').strip() if lines else file_path
            
            # Chunk content
            chunks = self.chunk_content(content)
            
            # Generate embeddings for each chunk
            for i, chunk in enumerate(chunks):
                embedding = self.inference_adapter.embed(chunk)
                
                if embedding:
                    projection_id = f"{file_path}_{i}"
                    
                    projection = {
                        'id': projection_id,
                        'source': 'vault',
                        'source_type': source_type,
                        'authority_level': authority_level,
                        'timestamp': datetime.utcnow().isoformat(),
                        'lineage': {
                            'parent_event_ids': [],
                            'source_ids': [file_path]
                        },
                        'content': chunk,
                        'vault_hash': content_hash,
                        'document_path': file_path,
                        'chunk_index': i,
                        'total_chunks': len(chunks),
                        'title': title
                    }
                    
                    projections.append({
                        'projection': projection,
                        'embedding': embedding
                    })
            
            print(f"Indexed: {file_path} ({len(chunks)} chunks)")
            
        except Exception as e:
            print(f"Failed to index {file_path}: {e}")
        
        return projections
    
    def index_vault(self) -> List[Dict[str, Any]]:
        """Index all vault documents."""
        projections = []
        vault_path = Path(VAULT_PATH)
        
        print(f"Indexing vault: {VAULT_PATH}")
        
        for root, dirs, files in os.walk(VAULT_PATH):
            for file in files:
                if file.endswith('.md'):
                    file_path = os.path.join(root, file)
                    document_projections = self.index_vault_document(file_path)
                    projections.extend(document_projections)
        
        return projections
    
    def store_projections(self, projections: List[Dict[str, Any]]):
        """Store projections in Qdrant."""
        if not self.qdrant_client:
            print("Cannot store projections: Qdrant client not available")
            return
        
        print(f"Storing {len(projections)} projections in Qdrant...")
        
        points = []
        for item in projections:
            projection = item['projection']
            embedding = item['embedding']
            
            # Generate point ID from projection ID
            point_id = int(hashlib.sha256(projection['id'].encode()).hexdigest()[:16], 16)
            
            point = PointStruct(
                id=point_id,
                vector=embedding,
                payload=projection
            )
            points.append(point)
        
        # Batch upsert
        batch_size = 100
        for i in range(0, len(points), batch_size):
            batch = points[i:i + batch_size]
            self.qdrant_client.upsert(
                collection_name=COLLECTION_NAME,
                points=batch
            )
            print(f"Upserted batch {i//batch_size + 1}/{(len(points) + batch_size - 1)//batch_size}")
        
        print(f"Stored {len(points)} projections")
    
    def run(self):
        """Run the projection worker."""
        print("Constitutional Projection Worker")
        print("Constitutional Law: TRUTH ≠ EMBEDDINGS")
        print()
        
        # Check Qdrant availability
        if not QDRANT_AVAILABLE:
            print("Qdrant client not available. Install with: pip install qdrant-client")
            return
        
        # Check inference health
        if not self.inference_adapter.health():
            print("Inference provider not healthy. Check inference service.")
            return
        
        # Index vault
        projections = self.index_vault()
        
        # Store projections
        self.store_projections(projections)
        
        print()
        print(f"Projection complete: {len(projections)} projections stored")

if __name__ == "__main__":
    worker = ConstitutionalProjectionWorker()
    worker.run()
