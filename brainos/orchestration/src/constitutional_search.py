"""
Constitutional Search
PING CONSTITUTIONAL STABILIZATION PHASE D
Date: 2026-06-22

This module provides semantic search via Qdrant with PostgreSQL verification.
Qdrant is never returned directly - PostgreSQL always verifies.
"""

import os
import logging
import psycopg2
from psycopg2 import sql
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from typing import List, Dict, Any, Optional
import requests

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

# Ollama configuration for embeddings
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


def generate_embedding(text: str) -> Optional[list]:
    """
    Generate embedding using inference authority.
    """
    try:
        import sys
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'runtime', 'adapters'))
        from inference_adapter import get_inference_adapter
        inference_adapter = get_inference_adapter()
        embedding = inference_adapter.embed(text)
        
        if embedding:
            if len(embedding) == 768:
                return embedding
            else:
                logger.error(f"Invalid embedding dimension: {len(embedding)}")
                return None
        else:
            logger.error("Failed to generate embedding")
            return None
    except Exception as e:
        logger.error(f"Failed to generate embedding: {e}")
        return None


def verify_event_from_postgres(event_id: str) -> Optional[Dict[str, Any]]:
    """
    Verify event exists in PostgreSQL and return full event data.
    PostgreSQL is the source of truth.
    """
    conn = get_postgres_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        query = sql.SQL("""
            SELECT id, stream, event_type, payload, created_at, projected_to_qdrant
            FROM events
            WHERE id = %s
        """)
        
        cursor.execute(query, (event_id,))
        row = cursor.fetchone()
        
        if row:
            event = {
                'id': row[0],
                'stream': row[1],
                'event_type': row[2],
                'payload': row[3],
                'created_at': row[4],
                'projected_to_qdrant': row[5]
            }
            conn.close()
            return event
        else:
            logger.warning(f"Event {event_id} not found in PostgreSQL")
            conn.close()
            return None
    except Exception as e:
        logger.error(f"Failed to verify event from PostgreSQL: {e}")
        if conn:
            conn.close()
        return None


def constitutional_search(query: str, limit: int = 10, stream_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Perform semantic search with PostgreSQL verification.
    
    Flow:
    1. Generate query embedding
    2. Search Qdrant for similar vectors
    3. Get event_ids from Qdrant results
    4. Verify each event in PostgreSQL
    5. Return only PostgreSQL-verified events
    
    Qdrant is never returned directly.
    PostgreSQL always verifies.
    """
    # Generate query embedding
    query_embedding = generate_embedding(query)
    if not query_embedding:
        logger.error("Failed to generate query embedding")
        return []
    
    # Get Qdrant client
    qdrant_client = get_qdrant_client()
    if not qdrant_client:
        logger.error("Failed to connect to Qdrant")
        return []
    
    try:
        # Build search filter if stream specified
        search_filter = None
        if stream_filter:
            search_filter = Filter(
                must=[
                    FieldCondition(
                        key="stream",
                        match=MatchValue(value=stream_filter)
                    )
                ]
            )
        
        # Search Qdrant
        search_results = qdrant_client.search(
            collection_name=QDRANT_COLLECTION,
            query_vector=query_embedding,
            limit=limit,
            query_filter=search_filter
        )
        
        # Extract event_ids from Qdrant results
        event_ids = [result.payload.get('event_id') for result in search_results]
        
        # Verify each event in PostgreSQL
        verified_events = []
        for event_id in event_ids:
            if not event_id:
                continue
            
            verified_event = verify_event_from_postgres(event_id)
            if verified_event:
                verified_events.append(verified_event)
            else:
                logger.warning(f"Event {event_id} from Qdrant not verified in PostgreSQL")
        
        logger.info(f"Search returned {len(verified_events)} verified events")
        return verified_events
        
    except Exception as e:
        logger.error(f"Failed to perform constitutional search: {e}")
        return []


def main():
    """
    Test constitutional search.
    """
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python constitutional_search.py <query> [stream_filter]")
        sys.exit(1)
    
    query = sys.argv[1]
    stream_filter = sys.argv[2] if len(sys.argv) > 2 else None
    
    results = constitutional_search(query, limit=5, stream_filter=stream_filter)
    
    print(f"\nSearch results for: {query}")
    print(f"Stream filter: {stream_filter or 'None'}")
    print(f"Found {len(results)} verified events\n")
    
    for event in results:
        print(f"Event ID: {event['id']}")
        print(f"Stream: {event['stream']}")
        print(f"Type: {event['event_type']}")
        print(f"Created: {event['created_at']}")
        print(f"Projected: {event['projected_to_qdrant']}")
        print(f"Payload: {str(event['payload'])[:200]}...")
        print("-" * 80)


if __name__ == "__main__":
    main()
