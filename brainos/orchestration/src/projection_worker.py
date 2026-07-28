"""
Projection Worker — Phase E.1 Bidirectional Memory
PING Constitutional Stabilization

This worker projects PostgreSQL events to Qdrant vector database.
Only projection_worker may write to Qdrant.
After projection, marks events as projected in Postgres (bidirectional).
"""

import os
import sys
import json
import logging
import hashlib
import requests
import psycopg2
from psycopg2 import sql
from datetime import datetime, timezone
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from typing import Dict, Any, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
POSTGRES_DB = os.getenv('POSTGRES_DB', 'crx_runtime')
POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', '')

QDRANT_URL = os.getenv('QDRANT_URL')
QDRANT_API_KEY = os.getenv('QDRANT_API_KEY')
QDRANT_COLLECTION = os.getenv('QDRANT_COLLECTION', 'constitutional_memory')
EMBED_MODEL = os.getenv('EMBED_MODEL', 'nomic-embed-text')
EMBED_URL = os.getenv('EMBED_URL') or os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')


def get_postgres_connection():
    try:
        return psycopg2.connect(
            host=POSTGRES_HOST, port=POSTGRES_PORT,
            database=POSTGRES_DB, user=POSTGRES_USER,
            password=POSTGRES_PASSWORD
        )
    except Exception as e:
        logger.error(f"Failed to connect to PostgreSQL: {e}")
        return None


def get_qdrant_client():
    try:
        kwargs = {"url": QDRANT_URL}
        if QDRANT_API_KEY:
            kwargs["api_key"] = QDRANT_API_KEY
        return QdrantClient(**kwargs)
    except Exception as e:
        logger.error(f"Failed to connect to Qdrant: {e}")
        return None


def canonical_json(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(',', ':'))


def generate_payload_hash(payload: Dict[str, Any]) -> str:
    return hashlib.sha256(canonical_json(payload).encode()).hexdigest()


def generate_embedding(text: str) -> Optional[list]:
    try:
        resp = requests.post(
            f"{EMBED_URL}/api/embeddings",
            json={"model": EMBED_MODEL, "prompt": text},
            timeout=60
        )
        if resp.status_code != 200:
            logger.error(f"Embedding API error {resp.status_code}: {resp.text[:200]}")
            return None
        data = resp.json()
        embedding = data.get("embedding")
        if embedding and len(embedding) == 768:
            return embedding
        else:
            logger.error(f"Invalid embedding dimension: {len(embedding) if embedding else 0}")
            return None
    except Exception as e:
        logger.error(f"Failed to generate embedding: {e}")
        return None


def ensure_qdrant_collection():
    client = get_qdrant_client()
    if not client:
        return False
    try:
        collections = client.get_collections().collections
        names = [c.name for c in collections]
        if QDRANT_COLLECTION in names:
            logger.info(f"Collection {QDRANT_COLLECTION} already exists")
            try:
                info = client.get_collection(QDRANT_COLLECTION)
                if info.config.params.vectors.size != 768:
                    logger.error(f"Wrong vector size: {info.config.params.vectors.size}")
                    return False
                if info.config.params.vectors.distance != Distance.COSINE:
                    logger.error(f"Wrong distance metric")
                    return False
            except Exception as parse_err:
                logger.warning(f"Could not parse collection config (old client?): {parse_err}")
            return True
        client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=VectorParams(size=768, distance=Distance.COSINE)
        )
        logger.info(f"Created collection {QDRANT_COLLECTION}")
        return True
    except Exception as e:
        logger.error(f"Failed to ensure Qdrant collection: {e}")
        return False


def get_unprojected_events(limit: int = 100) -> list:
    """Query actual events table columns."""
    conn = get_postgres_connection()
    if not conn:
        return []
    try:
        cursor = conn.cursor()
        cursor.execute(sql.SQL("""
            SELECT id, aggregate_type, event_type, event_data, timestamp
            FROM events
            WHERE projected_to_qdrant = FALSE
            ORDER BY timestamp ASC
            LIMIT %s
        """), (limit,))
        rows = cursor.fetchall()
        events = []
        for row in rows:
            events.append({
                'id': row[0],
                'aggregate_type': row[1],
                'event_type': row[2],
                'event_data': row[3],
                'timestamp': row[4],
            })
        conn.close()
        return events
    except Exception as e:
        logger.error(f"Failed to get unprojected events: {e}")
        if conn:
            conn.close()
        return []


def project_event_to_qdrant(event: Dict[str, Any]) -> bool:
    """Project a single event to Qdrant and mark projected in Postgres."""
    client = get_qdrant_client()
    if not client:
        return False

    event_data = event.get('event_data', {})
    payload_hash = generate_payload_hash(event_data)

    text_to_embed = f"{event['event_type']} {event['aggregate_type']} {json.dumps(event_data, sort_keys=True)}"
    embedding = generate_embedding(text_to_embed)
    if not embedding:
        logger.error(f"Failed to generate embedding for event {event['id']}")
        return False

    ts = event['timestamp']
    if hasattr(ts, 'isoformat'):
        ts_str = ts.isoformat()
    else:
        ts_str = str(ts)

    # Build payload (without projection_hash) and compute projection_hash over it
    payload_dict = {
        "event_id": str(event['id']),
        "aggregate_type": event['aggregate_type'],
        "event_type": event['event_type'],
        "timestamp": ts_str,
        "payload_hash": payload_hash,
        "source": "postgres",
    }

    # Compute projection_hash over the canonical JSON of the payload (excluding projection_hash)
    try:
        projection_hash = hashlib.sha256(canonical_json(payload_dict).encode()).hexdigest()
    except Exception:
        projection_hash = hashlib.sha256(json.dumps(payload_dict, sort_keys=True, separators=(',', ':')).encode()).hexdigest()

    # Add projection_hash to payload
    payload_dict["projection_hash"] = projection_hash

    point = PointStruct(
        id=str(event['id']),
        vector=embedding,
        payload=payload_dict
    )

    try:
        client.upsert(collection_name=QDRANT_COLLECTION, points=[point])

        conn = get_postgres_connection()
        if not conn:
            return False
        try:
            cursor = conn.cursor()
            cursor.execute(sql.SQL("""
                UPDATE events
                SET projected_to_qdrant = TRUE,
                    projected_at = %s
                WHERE id = %s
            """), (datetime.now(timezone.utc), event['id']))
            conn.commit()
            conn.close()
            logger.info(f"Projected event {event['id']} to Qdrant and marked projected_at")
            return True
        except Exception as e:
            logger.error(f"Failed to mark event as projected: {e}")
            if conn:
                conn.rollback()
                conn.close()
            return False
    except Exception as e:
        logger.error(f"Failed to project event {event['id']} to Qdrant: {e}")
        return False


def run_projection_cycle():
    logger.info("Starting projection cycle")
    if not ensure_qdrant_collection():
        logger.error("Failed to ensure Qdrant collection")
        return
    events = get_unprojected_events(limit=100)
    logger.info(f"Found {len(events)} unprojected events")
    success = 0
    for event in events:
        if project_event_to_qdrant(event):
            success += 1
    logger.info(f"Projected {success}/{len(events)} events")


def main():
    logger.info("Starting Projection Worker (Phase E.1 Bidirectional Memory)")
    if not QDRANT_URL:
        logger.error("QDRANT_URL environment variable not set")
        return
    run_projection_cycle()
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
