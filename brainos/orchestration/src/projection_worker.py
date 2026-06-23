"""
Projection Worker
PING CONSTITUTIONAL STABILIZATION PHASE D
Date: 2026-06-22

This worker projects PostgreSQL events to Qdrant vector database.
Only projection_worker may write to Qdrant.
"""

import os
import sys
import json
import logging
import hashlib
import psycopg2
from psycopg2 import sql
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from typing import Dict, Any, Optional

# Add runtime adapters to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'runtime', 'adapters'))
from inference_adapter import get_inference_adapter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# PostgreSQL connection configuration
POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
POSTGRES_DB = os.getenv('POSTGRES_DB', 'crx_runtime')
POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', '')

# Qdrant configuration
QDRANT_URL = os.getenv('QDRANT_URL')
QDRANT_API_KEY = os.getenv('QDRANT_API_KEY')
QDRANT_COLLECTION = os.getenv('QDRANT_COLLECTION', 'constitutional_memory')

# Inference configuration
EMBED_MODEL = os.getenv('EMBED_MODEL', 'nomic-embed-text')


def get_postgres_connection():
    """Get PostgreSQL connection."""
    try:
        conn = psycopg2.connect(
            host=POSTGRES_HOST,
            port=POSTGRES_PORT,
            database=POSTGRES_DB,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD
        )
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to PostgreSQL: {e}")
        return None


def get_qdrant_client():
    """Get Qdrant client."""
    try:
        client = QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY
        )
        return client
    except Exception as e:
        logger.error(f"Failed to connect to Qdrant: {e}")
        return None


def canonical_json(obj: Any) -> str:
    """
    Generate canonical JSON representation.
    Sorts keys and uses stable encoding.
    """
    return json.dumps(obj, sort_keys=True, separators=(',', ':'))


def generate_payload_hash(payload: Dict[str, Any]) -> str:
    """
    Generate SHA-256 hash of canonical JSON payload.
    """
    canonical = canonical_json(payload)
    return hashlib.sha256(canonical.encode()).hexdigest()


def generate_embedding(text: str) -> Optional[list]:
    """
    Generate embedding using inference authority.
    """
    try:
        inference_adapter = get_inference_adapter()
        embedding = inference_adapter.embed(text)
        
        if embedding and len(embedding) == 768:
            return embedding
        else:
            logger.error(f"Invalid embedding dimension: {len(embedding) if embedding else 0}")
            return None
    except Exception as e:
        logger.error(f"Failed to generate embedding: {e}")
        return None


def ensure_qdrant_collection():
    """
    Ensure Qdrant collection exists with correct configuration.
    Collection: constitutional_memory
    Size: 768
    Distance: COSINE
    """
    client = get_qdrant_client()
    if not client:
        return False
    
    try:
        # Check if collection exists
        collections = client.get_collections().collections
        collection_names = [c.name for c in collections]
        
        if QDRANT_COLLECTION in collection_names:
            logger.info(f"Collection {QDRANT_COLLECTION} already exists")
            # Verify configuration
            collection_info = client.get_collection(QDRANT_COLLECTION)
            if collection_info.config.params.vectors.size != 768:
                logger.error(f"Collection has wrong vector size: {collection_info.config.params.vectors.size}")
                return False
            if collection_info.config.params.vectors.distance != Distance.COSINE:
                logger.error(f"Collection has wrong distance metric")
                return False
            return True
        
        # Create collection
        client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=VectorParams(
                size=768,
                distance=Distance.COSINE
            )
        )
        logger.info(f"Created collection {QDRANT_COLLECTION}")
        return True
    except Exception as e:
        logger.error(f"Failed to ensure Qdrant collection: {e}")
        return False


def get_unprojected_events(limit: int = 100) -> list:
    """
    Get events that haven't been projected to Qdrant.
    """
    conn = get_postgres_connection()
    if not conn:
        return []
    
    try:
        cursor = conn.cursor()
        query = sql.SQL("""
            SELECT id, stream, event_type, payload, created_at
            FROM events
            WHERE projected_to_qdrant = FALSE
            ORDER BY created_at ASC
            LIMIT %s
        """)
        
        cursor.execute(query, (limit,))
        rows = cursor.fetchall()
        
        events = []
        for row in rows:
            events.append({
                'id': row[0],
                'stream': row[1],
                'event_type': row[2],
                'payload': row[3],
                'created_at': row[4]
            })
        
        conn.close()
        return events
    except Exception as e:
        logger.error(f"Failed to get unprojected events: {e}")
        if conn:
            conn.close()
        return []


def project_event_to_qdrant(event: Dict[str, Any]) -> bool:
    """
    Project a single event to Qdrant.
    """
    client = get_qdrant_client()
    if not client:
        return False
    
    # Generate payload hash
    payload_hash = generate_payload_hash(event['payload'])
    
    # Generate text for embedding
    text_to_embed = f"{event['event_type']} {event['stream']} {json.dumps(event['payload'], sort_keys=True)}"
    
    # Generate embedding
    embedding = generate_embedding(text_to_embed)
    if not embedding:
        logger.error(f"Failed to generate embedding for event {event['id']}")
        return False
    
    # Create point
    point = PointStruct(
        id=str(event['id']),
        vector=embedding,
        payload={
            "event_id": str(event['id']),
            "stream": event['stream'],
            "event_type": event['event_type'],
            "timestamp": event['created_at'].isoformat() if hasattr(event['created_at'], 'isoformat') else str(event['created_at']),
            "payload_hash": payload_hash,
            "source": "postgres"
        }
    )
    
    try:
        # Upsert to Qdrant
        client.upsert(
            collection_name=QDRANT_COLLECTION,
            points=[point]
        )
        
        # Mark as projected in PostgreSQL
        conn = get_postgres_connection()
        if conn:
            try:
                cursor = conn.cursor()
                update_query = sql.SQL("""
                    UPDATE events
                    SET projected_to_qdrant = TRUE
                    WHERE id = %s
                """)
                cursor.execute(update_query, (event['id'],))
                conn.commit()
                conn.close()
                logger.info(f"Projected event {event['id']} to Qdrant")
                return True
            except Exception as e:
                logger.error(f"Failed to mark event as projected: {e}")
                if conn:
                    conn.close()
                return False
        
        return False
    except Exception as e:
        logger.error(f"Failed to project event to Qdrant: {e}")
        return False


def run_projection_cycle():
    """
    Run a single projection cycle.
    """
    logger.info("Starting projection cycle")
    
    # Ensure Qdrant collection exists
    if not ensure_qdrant_collection():
        logger.error("Failed to ensure Qdrant collection")
        return
    
    # Get unprojected events
    events = get_unprojected_events(limit=100)
    logger.info(f"Found {len(events)} unprojected events")
    
    # Project each event
    success_count = 0
    for event in events:
        if project_event_to_qdrant(event):
            success_count += 1
    
    logger.info(f"Projected {success_count}/{len(events)} events")


def main():
    """
    Main projection worker loop.
    """
    logger.info("Starting Projection Worker")
    
    # Verify environment
    if not QDRANT_URL:
        logger.error("QDRANT_URL environment variable not set")
        return
    
    if not QDRANT_API_KEY:
        logger.error("QDRANT_API_KEY environment variable not set")
        return
    
    # Run initial cycle
    run_projection_cycle()
    
    # Perpetual loop
    import time
    while True:
        try:
            logger.info("Sleeping for 60 seconds...")
            time.sleep(60)
            run_projection_cycle()
        except KeyboardInterrupt:
            logger.info("Shutting down...")
            break
        except Exception as e:
            logger.error(f"Error in main loop: {e}")
            time.sleep(60)


if __name__ == "__main__":
    main()
