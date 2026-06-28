#!/usr/bin/env python3
"""
Projection Replay

Version 0: Read events → Rebuild Qdrant projections

This is a minimal replay engine that verifies the system can rebuild Qdrant from events.
No witness. No governance. No constitutional incidents.
No canonical state reconstruction (objects, lineage, entities, relationships, claims).
Just: Can system rebuild Qdrant from events?
"""

import json
import logging
from typing import Dict, List, Optional, Any
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

from runtime.authorities.embedding_authority import EmbeddingAuthority
from runtime.authorities.execution_authority import ExecutionAuthority
from runtime.config.configuration_authority import ConfigurationAuthority

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

CONFIGURATION = ConfigurationAuthority.current()
EMBEDDING_AUTHORITY = EmbeddingAuthority(CONFIGURATION)
EXECUTION_AUTHORITY = ExecutionAuthority()

POSTGRES_CONFIG = CONFIGURATION.get_postgres_config()
QDRANT_CONFIG = CONFIGURATION.get_qdrant_config()
INFERENCE_CONFIG = CONFIGURATION.get_inference_config()

POSTGRES_CONTAINER = POSTGRES_CONFIG.get('host', 'brain-postgres')
POSTGRES_DB = POSTGRES_CONFIG.get('database', 'crx_runtime')
POSTGRES_USER = POSTGRES_CONFIG.get('user', 'postgres')

QDRANT_URL = QDRANT_CONFIG.get('url', 'http://localhost:6333')
QDRANT_API_KEY = QDRANT_CONFIG.get('api_key', '')
QDRANT_COLLECTION = QDRANT_CONFIG.get('collection', 'constitutional_memory')

EMBED_MODEL = INFERENCE_CONFIG.get('embedding_model', 'nomic-embed-text')


class ProjectionReplay:
    """Minimal Qdrant projection replay engine."""

    def __init__(self):
        self.qdrant_client = None
        self.embedding_model = None

    def initialize(self):
        """Initialize connections."""
        logger.info("Initializing Projection Replay")

        # Qdrant
        try:
            self.qdrant_client = QdrantClient(
                url=QDRANT_URL,
                api_key=QDRANT_API_KEY if QDRANT_API_KEY else None
            )
            logger.info("Connected to Qdrant")
        except Exception as e:
            logger.error(f"Failed to connect to Qdrant: {e}")
            return False

        # Embedding model
        try:
            logger.info(f"Loading embedding model: {EMBED_MODEL}")
            self.embedding_model = EMBEDDING_AUTHORITY.load_model(EMBED_MODEL)
            logger.info("Embedding model loaded")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            return False

        return True

    def run_psql_query(self, query):
        """Run psql query through the execution authority."""
        try:
            cmd = ['docker', 'exec', POSTGRES_CONTAINER, 'psql', '-U', POSTGRES_USER, '-d', POSTGRES_DB, '-t', '-c', query]
            result = EXECUTION_AUTHORITY.run_command('docker', ['exec', POSTGRES_CONTAINER, 'psql', '-U', POSTGRES_USER, '-d', POSTGRES_DB, '-t', '-c', query])
            if result.returncode != 0:
                logger.error(f"Query failed: {result.stderr}")
                return None
            return result.stdout.strip()
        except Exception as e:
            logger.error(f"Error running query: {e}")
            return None

    def read_events(self, limit: Optional[int] = None) -> List[Dict]:
        """Read events from PostgreSQL via docker exec."""
        logger.info("Reading events from PostgreSQL")

        if limit:
            query = f"SELECT event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data FROM events ORDER BY timestamp ASC LIMIT {limit}"
        else:
            query = "SELECT event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data FROM events ORDER BY timestamp ASC"

        output = self.run_psql_query(query)
        if not output:
            logger.error("Failed to read events")
            return []

        events = []
        for line in output.split('\n'):
            line = line.strip()
            if line and '|' in line:
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 6 and parts[0] != 'event_id':
                    try:
                        event_data = json.loads(parts[5]) if parts[5] else {}
                        events.append({
                            'event_id': parts[0],
                            'event_type': parts[1],
                            'timestamp': parts[2],
                            'aggregate_id': parts[3],
                            'aggregate_type': parts[4],
                            'event_data': event_data
                        })
                    except json.JSONDecodeError:
                        logger.warning(f"Failed to parse event_data for event {parts[0]}")

        logger.info(f"Read {len(events)} events")
        return events

    def rebuild_projections(self, events: List[Dict]) -> List[Dict]:
        """Rebuild projections from events."""
        logger.info("Rebuilding projections from events")

        projections = []

        for event in events:
            event_type = event['event_type']
            event_data = event['event_data']

            # Extract content for embedding from any event
            content = ""
            title = ""
            source = ""

            # Try to extract content from various event types
            if 'content' in event_data:
                content = str(event_data['content'])
            if 'title' in event_data:
                title = event_data['title']
            if 'source' in event_data:
                source = event_data['source']
            if 'text' in event_data:
                content = str(event_data['text'])

            # If no content, use event_data as string
            if not content:
                content = json.dumps(event_data, default=str)

            projection = {
                'event_id': event['event_id'],
                'event_type': event_type,
                'timestamp': event['timestamp'],
                'aggregate_id': event['aggregate_id'],
                'aggregate_type': event['aggregate_type'],
                'title': title,
                'source': source,
                'content': content[:2000]  # Truncate for embedding
            }
            projections.append(projection)

        logger.info(f"Rebuilt {len(projections)} projections")
        return projections

    def rebuild_qdrant(self, projections: List[Dict]) -> bool:
        """Rebuild Qdrant from projections."""
        logger.info("Rebuilding Qdrant from projections")

        # Ensure collection exists
        try:
            collections = self.qdrant_client.get_collections().collections
            collection_names = [c.name for c in collections]

            if QDRANT_COLLECTION not in collection_names:
                logger.info(f"Creating Qdrant collection: {QDRANT_COLLECTION}")
                self.qdrant_client.create_collection(
                    collection_name=QDRANT_COLLECTION,
                    vectors_config=VectorParams(
                        size=768,  # nomic-embed-text dimension
                        distance=Distance.COSINE
                    )
                )
            else:
                logger.info(f"Collection {QDRANT_COLLECTION} already exists")
        except Exception as e:
            logger.error(f"Failed to ensure Qdrant collection: {e}")
            return False

        # Clear existing points (for clean replay)
        try:
            logger.info(f"Clearing existing points from {QDRANT_COLLECTION}")
            self.qdrant_client.delete_collection(QDRANT_COLLECTION)
            self.qdrant_client.create_collection(
                collection_name=QDRANT_COLLECTION,
                vectors_config=VectorParams(
                    size=768,
                    distance=Distance.COSINE
                )
            )
        except Exception as e:
            logger.error(f"Failed to clear Qdrant collection: {e}")
            return False

        # Embed and upsert projections
        points = []
        for projection in projections:
            content = projection.get('content', '')
            if not content:
                continue

            # Generate embedding
            embedding = self.embedding_model.encode(content, convert_to_numpy=False)

            # Create point
            point = PointStruct(
                id=projection['event_id'],
                vector=embedding,
                payload=projection
            )
            points.append(point)

        # Batch upsert
        if points:
            try:
                logger.info(f"Upserting {len(points)} points to Qdrant")
                self.qdrant_client.upsert(
                    collection_name=QDRANT_COLLECTION,
                    points=points
                )
                logger.info("Qdrant rebuild successful")
                return True
            except Exception as e:
                logger.error(f"Failed to upsert to Qdrant: {e}")
                return False
        else:
            logger.warning("No points to upsert")
            return True

    def run_replay(self, limit: Optional[int] = None):
        """Run full replay pipeline."""
        logger.info("=" * 60)
        logger.info("Starting Projection Replay")
        logger.info("=" * 60)

        # Step 1: Read events
        events = self.read_events(limit)
        if not events:
            logger.warning("No events to replay")
            return False

        # Step 2: Rebuild projections
        projections = self.rebuild_projections(events)
        if not projections:
            logger.warning("No projections rebuilt")
            return False

        # Step 3: Rebuild Qdrant
        success = self.rebuild_qdrant(projections)
        if not success:
            logger.error("Qdrant rebuild failed")
            return False

        logger.info("=" * 60)
        logger.info("Projection Replay Complete")
        logger.info(f"Events: {len(events)}")
        logger.info(f"Projections: {len(projections)}")
        logger.info(f"Collection: {QDRANT_COLLECTION}")
        logger.info("=" * 60)

        return True


def main():
    """Main entry point."""
    replay = ProjectionReplay()

    try:
        if not replay.initialize():
            logger.error("Initialization failed")
            sys.exit(1)

        # Run replay with limit for testing
        # Remove limit for full replay
        success = replay.run_replay(limit=100)

        if success:
            logger.info("Replay successful")
            sys.exit(0)
        else:
            logger.error("Replay failed")
            sys.exit(1)

    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
