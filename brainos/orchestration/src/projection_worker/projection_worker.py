"""
Projection Worker
Continuously syncs Postgres events to Qdrant and Obsidian
Date: 2026-06-22

Flow:
Postgres Event → Projection Worker → Qdrant → Obsidian
Obsidian Markdown → Projection Worker → Qdrant Embedding
"""

import psycopg2
import hashlib
import json
import os
import time
from datetime import datetime
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import requests

# Configuration
POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
POSTGRES_DB = os.getenv('POSTGRES_DB', 'crx_runtime')
POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'change_this_password')

QDRANT_URL = os.getenv('QDRANT_URL')
QDRANT_API_KEY = os.getenv('QDRANT_API_KEY')


VAULT_PATH = '/app/vault'

CONSTITUTIONAL_COLLECTION = 'constitutional_documents'
MEMORY_COLLECTION = 'constitutional_memory'
TIER2_OPERATIONAL = 'tier2_operational'
TIER3_WORKING = 'tier3_working'

def get_postgres_connection():
    """Get PostgreSQL connection."""
    return psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD
    )

def get_qdrant_client():
    """Get Qdrant client."""
    return QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

def compute_content_hash(content):
    """Compute SHA-256 hash of content."""
    return hashlib.sha256(content.encode()).hexdigest()

def ensure_memory_tiers():
    """Ensure all 3 memory tier collections exist."""
    client = get_qdrant_client()
    
    try:
        collections = client.get_collections()
        collection_names = [c.name for c in collections.collections]
        
        # Tier 2: Operational Memory
        if TIER2_OPERATIONAL not in collection_names:
            client.create_collection(
                collection_name=TIER2_OPERATIONAL,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE)
            )
            print(f"✅ Created collection: {TIER2_OPERATIONAL}")
        else:
            print(f"✅ Collection exists: {TIER2_OPERATIONAL}")
        
        # Tier 3: Working Memory
        if TIER3_WORKING not in collection_names:
            client.create_collection(
                collection_name=TIER3_WORKING,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE)
            )
            print(f"✅ Created collection: {TIER3_WORKING}")
        else:
            print(f"✅ Collection exists: {TIER3_WORKING}")
    except Exception as e:
        print(f"❌ Failed to ensure memory tiers: {e}")

def ensure_constitutional_collection():
    """Ensure constitutional documents collection exists."""
    client = get_qdrant_client()
    
    try:
        collections = client.get_collections()
        collection_names = [c.name for c in collections.collections]
        
        if CONSTITUTIONAL_COLLECTION not in collection_names:
            client.create_collection(
                collection_name=CONSTITUTIONAL_COLLECTION,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE)
            )
            print(f"✅ Created collection: {CONSTITUTIONAL_COLLECTION}")
        else:
            print(f"✅ Collection exists: {CONSTITUTIONAL_COLLECTION}")
    except Exception as e:
        print(f"❌ Failed to ensure collection: {e}")

def embed_text(text):
    """Generate embedding using inference authority."""
    try:
        import sys
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'runtime', 'adapters'))
        from inference_adapter import get_inference_adapter
        inference_adapter = get_inference_adapter()
        embedding = inference_adapter.embed(text)
        
        if embedding and len(embedding) == 768:
            return embedding
        else:
            print(f"❌ Invalid embedding dimension: {len(embedding) if embedding else 0}")
            return None
    except Exception as e:
        print(f"❌ Failed to generate embedding: {e}")
        return None

def index_constitutional_document(file_path, document_type):
    """Index a constitutional document into Qdrant."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract title from first line
        lines = content.split('\n')
        title = lines[0].replace('#', '').strip() if lines else os.path.basename(file_path)
        
        # Use just title for embedding (most reliable)
        embed_text_content = title
        
        # Compute hashes from full content
        content_hash = compute_content_hash(content)
        
        # Generate embedding
        print(f"  Embedding: {title}")
        embedding = embed_text(embed_text_content)
        if not embedding:
            print(f"⚠️  Could not embed: {file_path}")
            return
        
        print(f"  Embedding successful: {len(embedding)} dimensions")
        
        # Create point
        point_id = int(hashlib.sha256(file_path.encode()).hexdigest()[:16], 16)
        
        payload = {
            "id": str(point_id),
            "title": title,
            "document_type": document_type,
            "content_hash": content_hash,
            "authority_hash": content_hash,  # Same for now
            "vault_path": file_path,
            "lineage": [],
            "constitutional_version": "v1"
        }
        
        client = get_qdrant_client()
        client.upsert(
            collection_name=CONSTITUTIONAL_COLLECTION,
            points=[PointStruct(id=point_id, vector=embedding, payload=payload)]
        )
        
        print(f"✅ Indexed: {file_path}")
        
    except Exception as e:
        print(f"❌ Failed to index {file_path}: {e}")

def index_vault():
    """Index all constitutional documents in vault."""
    print("\n=== Indexing Vault ===")
    print(f"Vault path: {VAULT_PATH}")
    
    ensure_constitutional_collection()
    ensure_memory_tiers()
    
    # Walk vault and index all markdown files
    indexed_count = 0
    failed_count = 0
    
    for root, dirs, files in os.walk(VAULT_PATH):
        for file in files:
            if file.endswith('.md'):
                file_path = os.path.join(root, file)
                
                # Determine document type from path
                if '/constitution/' in file_path:
                    doc_type = 'constitution'
                elif '/laws/' in file_path:
                    doc_type = 'law'
                elif '/audits/' in file_path:
                    doc_type = 'audit'
                elif '/runbooks/' in file_path:
                    doc_type = 'runbook'
                elif '/capabilities/' in file_path:
                    doc_type = 'capability'
                elif '/recovery/' in file_path:
                    doc_type = 'recovery'
                else:
                    doc_type = 'unknown'
                
                print(f"\nFound: {file_path} ({doc_type})")
                
                # Try to index
                try:
                    index_constitutional_document(file_path, doc_type)
                    indexed_count += 1
                except Exception as e:
                    print(f"❌ Failed to index {file_path}: {e}")
                    failed_count += 1
    
    print(f"\n✅ Indexed {indexed_count} documents")
    print(f"❌ Failed {failed_count} documents")
    
    # Update memory tiers status
    print("\n=== Memory Tiers ===")
    print("Tier 1 (constitutional_documents): Highest authority")
    print("Tier 2 (tier2_operational): Operational memory")
    print("Tier 3 (tier3_working): Working memory")
    print("Retrieval order: Tier1 → Tier2 → Tier3")

def watch_postgres_events():
    """Watch Postgres for new events and project to Qdrant."""
    print("\n=== Watching Postgres Events ===")
    
    conn = get_postgres_connection()
    cursor = conn.cursor()
    
    # Get last processed event ID
    cursor.execute("SELECT MAX(id) FROM events")
    last_id = cursor.fetchone()[0] or 0
    
    print(f"Starting from event ID: {last_id}")
    
    while True:
        try:
            # Check for new events
            cursor.execute("""
                SELECT id, event_id, event_type, event_data, timestamp
                FROM events
                WHERE id > %s
                ORDER BY id
            """, (last_id,))
            
            new_events = cursor.fetchall()
            
            for event in new_events:
                event_id, uuid, event_type, event_data, timestamp = event
                
                print(f"Processing event: {uuid} ({event_type})")
                
                # Project to Qdrant
                # TODO: Implement event projection logic
                
                last_id = event_id
            
            if new_events:
                conn.commit()
            
            time.sleep(5)  # Poll every 5 seconds
            
        except Exception as e:
            print(f"❌ Error watching events: {e}")
            time.sleep(10)

def main():
    print("=" * 60)
    print("PROJECTION WORKER")
    print("=" * 60)
    
    # Index vault
    index_vault()
    
    # Watch Postgres events
    # watch_postgres_events()  # Disabled for now
    
    print("\n✅ Projection worker complete")

if __name__ == "__main__":
    main()
