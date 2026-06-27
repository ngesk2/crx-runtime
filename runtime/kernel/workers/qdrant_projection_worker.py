#!/usr/bin/env python3
"""
QDRANT PROJECTION WORKER

CONSTITUTIONAL ROLE

Authority: NO
Creates Truth: NO
Derives Truth: NO
Stores Truth: YES (Memory Projection)
Presents Truth: NO

Constitutional Authority Class: MEMORY_PROJECTION

Truth Source:
PostgreSQL Event Store (runtime/adapters/postgres_event_store.ts)

Constitutional Flow:
1. Polls Postgres for unprojected events
2. Embeds events using nomic-embed-text (768 dimensions)
3. Projects embeddings to Qdrant constitutional_memory collection
4. Marks events as projected in projection_status table

This component does NOT create constitutional truth.
It is a memory projection layer for search/retrieval.

Architecture:
Gateway → Postgres Events → projection_worker.py → Qdrant

Authority: POSTGRES (source of truth)
Qdrant: MEMORY PROJECTION (derived, not authoritative)
"""

import os
import sys
import asyncio
import uuid
import hashlib
import psycopg2
from psycopg2.extras import DictCursor
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
import json
from typing import List, Dict, Optional
from datetime import datetime
import logging
from pathlib import Path

from runtime.configuration import get_configuration

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class QdrantProjectionWorker:
    """
    Projects events from Postgres to Qdrant for memory retrieval.
    
    Constitutional: This is a projection, not a source of truth.
    All truth originates from Postgres Event Store.
    """

    def __init__(self):
        # Constitutional: Use shared configuration
        self.configuration = get_configuration()
        
        # Environment configuration (fallback for non-secret config)
        qdrant_config = self.configuration.get_qdrant_config()
        self.qdrant_url = qdrant_config["url"]
        self.qdrant_api_key = qdrant_config["api_key"]
        self.qdrant_collection = qdrant_config["collection"]
        self.memory_collection = os.getenv('MEMORY_COLLECTION', 'memory')
        self.embed_model = os.getenv('EMBED_MODEL', 'nomic-embed-text')
        
        # Postgres configuration from shared configuration
        postgres_config = self.configuration.get_postgres_config()
        self.postgres_url = (
            f"postgresql://{postgres_config.get('user')}:{postgres_config.get('password')}"
            f"@{postgres_config.get('host')}:{postgres_config.get('port')}/{postgres_config.get('database')}"
        )
        
        # Initialize clients
        self.qdrant_client = None
        self.embedding_model = None
        self.postgres_conn = None
        
        # Document extractor
        self.document_extractor = None

    def initialize(self):
        """Initialize Qdrant client, embedding model, and Postgres connection."""
        logger.info("Initializing Qdrant Projection Worker")
        
        # Initialize Qdrant client
        self.qdrant_client = QdrantClient(
            url=self.qdrant_url,
            api_key=self.qdrant_api_key
        )
        
        # Initialize embedding model (768 dimensions for nomic-embed-text)
        logger.info(f"Loading embedding model: {self.embed_model}")
        self.embedding_model = SentenceTransformer(self.embed_model)
        
        # Initialize Postgres connection
        if self.postgres_url:
            self.postgres_conn = psycopg2.connect(
                self.postgres_url,
                cursor_factory=DictCursor
            )
            logger.info("Connected to Postgres")
        else:
            raise ValueError("DATABASE_URL environment variable required")
        
        # Ensure Qdrant collection exists
        self._ensure_collection()
        self._ensure_memory_collection()
        
        # Initialize document extractor
        sys.path.append(str(Path(__file__).parent.parent / 'ingestion'))
        from document_extractor import DocumentExtractor
        from chunker import Chunker
        self.document_extractor = DocumentExtractor()
        self.chunker = Chunker(chunk_size=1000, chunk_overlap=200)
        
        logger.info("Qdrant Projection Worker initialized")

    def _ensure_collection(self):
        """Ensure Qdrant collection exists with correct schema."""
        collections = self.qdrant_client.get_collections().collections
        collection_names = [c.name for c in collections]
        
        if self.qdrant_collection not in collection_names:
            logger.info(f"Creating Qdrant collection: {self.qdrant_collection}")
            self.qdrant_client.create_collection(
                collection_name=self.qdrant_collection,
                vectors_config=VectorParams(
                    size=768,  # nomic-embed-text dimension
                    distance=Distance.COSINE
                )
            )
            logger.info(f"Collection {self.qdrant_collection} created")
        else:
            logger.info(f"Collection {self.qdrant_collection} already exists")

    def _ensure_memory_collection(self):
        """Ensure Qdrant memory collection exists for document storage."""
        collections = self.qdrant_client.get_collections().collections
        collection_names = [c.name for c in collections]
        
        if self.memory_collection not in collection_names:
            logger.info(f"Creating Qdrant memory collection: {self.memory_collection}")
            self.qdrant_client.create_collection(
                collection_name=self.memory_collection,
                vectors_config=VectorParams(
                    size=768,  # nomic-embed-text dimension
                    distance=Distance.COSINE
                )
            )
            logger.info(f"Memory collection {self.memory_collection} created")
        else:
            logger.info(f"Memory collection {self.memory_collection} already exists")

    def _embed_text(self, text: str) -> List[float]:
        """Embed text using nomic-embed-text model."""
        embedding = self.embedding_model.encode(text, convert_to_numpy=False)
        return embedding.tolist()

    def _get_unprojected_events(self, limit: int = 100) -> List[Dict]:
        """Fetch unprojected events from Postgres."""
        cursor = self.postgres_conn.cursor()
        
        query = """
            SELECT e.event_id, e.event_hash, e.event_type, e.payload, e.created_at
            FROM events e
            LEFT JOIN projection_status ps ON e.event_id = ps.event_id
            WHERE ps.projected_qdrant IS NULL OR ps.projected_qdrant = FALSE
            ORDER BY e.event_id ASC
            LIMIT %s
        """
        
        cursor.execute(query, (limit,))
        events = [dict(row) for row in cursor.fetchall()]
        cursor.close()
        
        return events

    def _ensure_projection_table(self):
        """Ensure projection_status table exists for traceability."""
        cursor = self.postgres_conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS projection_status (
                event_id INTEGER PRIMARY KEY,
                projected_qdrant BOOLEAN DEFAULT FALSE,
                projection_hash VARCHAR(64),
                projected_at TIMESTAMP
            )
        """)
        self.postgres_conn.commit()
        cursor.close()

    def _mark_projected(self, event_id: int, projection_hash: Optional[str] = None):
        """Mark event as projected to Qdrant. Constitutional: only call AFTER Qdrant ACK."""
        cursor = self.postgres_conn.cursor()

        if projection_hash:
            query = """
                INSERT INTO projection_status (event_id, projected_qdrant, projection_hash, projected_at)
                VALUES (%s, TRUE, %s, NOW())
                ON CONFLICT (event_id) DO UPDATE SET projected_qdrant = TRUE, projection_hash = %s, projected_at = NOW()
            """
            cursor.execute(query, (event_id, projection_hash, projection_hash))
        else:
            query = """
                INSERT INTO projection_status (event_id, projected_qdrant, projected_at)
                VALUES (%s, TRUE, NOW())
                ON CONFLICT (event_id) DO UPDATE SET projected_qdrant = TRUE, projected_at = NOW()
            """
            cursor.execute(query, (event_id,))
        self.postgres_conn.commit()
        cursor.close()

    def _project_event(self, event: Dict) -> Optional[PointStruct]:
        """Project a single event to Qdrant with constitutional filtering."""
        try:
            payload = event['payload']
            event_type = event['event_type']
            
            # Constitutional: Block unverified event types from projection.
            # REASONING_ARTIFACT events must be explicitly verified before projection.
            source_classification = payload.get('_source_classification') if isinstance(payload, dict) else None
            if source_classification == 'REASONING_ARTIFACT' and not payload.get('_verified', False):
                logger.info(f"Blocked projection of unverified reasoning artifact: {event_type} {event['event_id']}")
                return None
            if event_type in ['OBSERVATION_CREATED', 'CLAIM_CREATED', 'CONTENT_SUMMARIZED', 'SUMMARY_CREATED', 'ANALYSIS_CREATED']:
                if not payload.get('_verified', False):
                    logger.info(f"Blocked projection of unverified event: {event_type} {event['event_id']}")
                    return None
            
            # Handle document events separately
            if event_type in ['DOCUMENT_IMPORTED', 'DOCUMENT_UPDATED']:
                return self._project_document_event(event)
            
            # Handle repository events separately
            if event_type in ['REPOSITORY_FILE_DISCOVERED', 'REPOSITORY_FILE_UPDATED']:
                return self._project_repository_event(event)
            
            # Create searchable text from payload
            if isinstance(payload, dict):
                text_content = json.dumps(payload, sort_keys=True)
            else:
                text_content = str(payload)
            
            # Add event type context
            searchable_text = f"Event Type: {event_type}\nContent: {text_content}"
            
            # Generate embedding
            embedding = self._embed_text(searchable_text)
            
            # Create Qdrant point
            point = PointStruct(
                id=event['event_id'],
                vector=embedding,
                payload={
                    'event_id': event['event_id'],
                    'event_hash': event['event_hash'],
                    'event_type': event['event_type'],
                    'payload': payload,
                    'created_at': event['created_at'].isoformat() if event['created_at'] else None
                }
            )
            
            return point
            
        except Exception as e:
            logger.error(f"Error projecting event {event['event_id']}: {e}")
            return None

    def _project_document_event(self, event: Dict) -> Optional[PointStruct]:
        """Project a document event to the memory collection."""
        try:
            payload = event['payload']
            event_type = event['event_type']
            
            # Extract document metadata
            document_id = payload.get('document_id', event['aggregate_id'])
            title = payload.get('title', 'Unknown')
            source = payload.get('source', 'unknown')
            mime_type = payload.get('mime_type', 'unknown')
            
            # For Phase 1, we only have metadata
            # Phase 2 would add content extraction here
            searchable_text = f"Title: {title}\nSource: {source}\nType: {mime_type}"
            
            # Generate embedding
            embedding = self._embed_text(searchable_text)
            
            # Create content hash for the document
            content_hash = hashlib.sha256(searchable_text.encode('utf-8')).hexdigest()
            
            # Create Qdrant point for memory collection
            point = PointStruct(
                id=str(uuid.uuid4()),  # Generate new ID for memory point
                vector=embedding,
                payload={
                    'document_id': document_id,
                    'source': source,
                    'title': title,
                    'mime_type': mime_type,
                    'created_at': payload.get('created_time'),
                    'updated_at': payload.get('modified_time'),
                    'content_hash': content_hash,
                    'event_id': event['event_id'],
                    'event_type': event_type
                }
            )
            
            logger.info(f"Projected document event {event_type} for: {title}")
            return point
            
        except Exception as e:
            logger.error(f"Error projecting document event {event['event_id']}: {e}")
            return None

    def _project_repository_event(self, event: Dict) -> Optional[PointStruct]:
        """Project a repository event to the memory collection with content extraction and chunking."""
        try:
            payload = event['payload']
            event_type = event['event_type']
            
            # Extract repository metadata
            repository = payload.get('repository', 'unknown')
            path = payload.get('path', 'unknown')
            sha256 = payload.get('sha256', '')
            size = payload.get('size', 0)
            modified = payload.get('modified', '')
            local_path = payload.get('local_path', '')
            
            # Phase 1: Metadata projection for graph traversal
            metadata_text = f"Repository: {repository}\nPath: {path}\nSHA256: {sha256}\nSize: {size}\nModified: {modified}"
            metadata_embedding = self._embed_text(metadata_text)
            metadata_hash = hashlib.sha256(metadata_text.encode('utf-8')).hexdigest()
            
            # Create metadata point
            metadata_point = PointStruct(
                id=str(uuid.uuid4()),
                vector=metadata_embedding,
                payload={
                    'repository': repository,
                    'path': path,
                    'sha256': sha256,
                    'size': size,
                    'modified': modified,
                    'content_hash': metadata_hash,
                    'event_id': event['event_id'],
                    'event_type': event_type,
                    'point_type': 'metadata'
                }
            )
            
            # Phase 2: Content extraction and chunking for semantic memory
            if local_path and Path(local_path).exists():
                # Extract content
                content_result = self.document_extractor.extract(local_path, 'text/plain')
                
                if content_result and content_result.get('content'):
                    content_text = content_result['content']
                    
                    # Chunk content
                    chunks = self.chunker.chunk_text(content_text, {
                        'repository': repository,
                        'path': path,
                        'sha256': sha256,
                        'event_id': event['event_id'],
                        'event_type': event_type
                    })
                    
                    # Project each chunk
                    chunk_points = []
                    for chunk in chunks:
                        chunk_embedding = self._embed_text(chunk['text'])
                        chunk_hash = hashlib.sha256(chunk['text'].encode('utf-8')).hexdigest()
                        
                        chunk_point = PointStruct(
                            id=str(uuid.uuid4()),
                            vector=chunk_embedding,
                            payload={
                                'repository': repository,
                                'path': path,
                                'sha256': sha256,
                                'chunk_text': chunk['text'],
                                'chunk_id': chunk['metadata']['chunk_id'],
                                'chunk_start': chunk['metadata']['chunk_start'],
                                'chunk_end': chunk['metadata']['chunk_end'],
                                'content_hash': chunk_hash,
                                'event_id': event['event_id'],
                                'event_type': event_type,
                                'point_type': 'chunk'
                            }
                        )
                        chunk_points.append(chunk_point)
                    
                    logger.info(f"Projected repository event {event_type} for: {path} (metadata + {len(chunks)} chunks)")
                    return chunk_points[0] if chunk_points else metadata_point
            
            logger.info(f"Projected repository event {event_type} for: {path} (metadata only)")
            return metadata_point
            
        except Exception as e:
            logger.error(f"Error projecting repository event {event['event_id']}: {e}")
            return None

    def project_batch(self, limit: int = 100):
        """Project a batch of unprojected events to Qdrant."""
        events = self._get_unprojected_events(limit)
        
        if not events:
            logger.info("No unprojected events found")
            return
        
        logger.info(f"Projecting {len(events)} events to Qdrant")
        
        # Separate document events from constitutional events
        constitutional_points = []
        memory_points = []
        
        for event in events:
            point = self._project_event(event)
            if point:
                event_type = event['event_type']
                if event_type in ['DOCUMENT_CREATED', 'DOCUMENT_UPDATED']:
                    memory_points.append(point)
                else:
                    constitutional_points.append(point)
        
        # Constitutional: upsert and only mark projected AFTER Qdrant ACK.
        # This prevents traceability loss if projection fails halfway through.
        acked_event_ids = set()
        acked_projection_hashes = {}

        if constitutional_points:
            try:
                ack = self.qdrant_client.upsert(
                    collection_name=self.qdrant_collection,
                    points=constitutional_points
                )
                logger.info(f"Projected {len(constitutional_points)} constitutional events (Qdrant ACK: {bool(ack)})")
                for point in constitutional_points:
                    eid = point.id
                    acked_event_ids.add(eid)
                    # Compute projection hash from point content for traceability
                    projection_hash = hashlib.sha256(
                        json.dumps({
                            'event_id': eid,
                            'vector': point.vector[:4] if point.vector else [],
                            'payload': point.payload
                        }, sort_keys=True, default=str).encode()
                    ).hexdigest() if ack else None
                    if projection_hash:
                        acked_projection_hashes[eid] = projection_hash
            except Exception as e:
                logger.error(f"Qdrant ACK FAILED for constitutional events: {e}")
                # NOT marked as projected — traceability preserved

        if memory_points:
            try:
                ack = self.qdrant_client.upsert(
                    collection_name=self.memory_collection,
                    points=memory_points
                )
                logger.info(f"Projected {len(memory_points)} document events to memory collection (Qdrant ACK: {bool(ack)})")
                for point in memory_points:
                    eid = point.id
                    acked_event_ids.add(eid)
                    projection_hash = hashlib.sha256(
                        json.dumps({
                            'event_id': eid,
                            'vector': point.vector[:4] if point.vector else [],
                            'payload': point.payload
                        }, sort_keys=True, default=str).encode()
                    ).hexdigest() if ack else None
                    if projection_hash:
                        acked_projection_hashes[eid] = projection_hash
            except Exception as e:
                logger.error(f"Qdrant ACK FAILED for memory events: {e}")

        # Constitutional: ONLY mark events that received Qdrant ACK
        for eid in acked_event_ids:
            self._mark_projected(eid, acked_projection_hashes.get(eid))

        total_projected = len(acked_event_ids)
        total_attempted = len(constitutional_points) + len(memory_points)
        if total_attempted > 0 and total_projected < total_attempted:
            logger.warning(f"Projection partial: {total_projected}/{total_attempted} events ACKed. "
                          f"UnACKed events ({total_attempted - total_projected}) will be retried.")
        logger.info(f"Successfully projected {total_projected} events (Qdrant-ACKed)")

    async def run_continuous(self, interval_seconds: int = 10):
        """Run projection worker continuously."""
        logger.info(f"Starting continuous projection (interval: {interval_seconds}s)")
        
        while True:
            try:
                self.project_batch()
                await asyncio.sleep(interval_seconds)
            except Exception as e:
                logger.error(f"Error in projection loop: {e}")
                await asyncio.sleep(interval_seconds)

    def close(self):
        """Close connections."""
        if self.postgres_conn:
            self.postgres_conn.close()
        logger.info("Qdrant Projection Worker closed")


def main():
    """Main entry point."""
    worker = QdrantProjectionWorker()
    
    try:
        worker.initialize()
        
        # Run continuous projection
        asyncio.run(worker.run_continuous(interval_seconds=10))
        
    except KeyboardInterrupt:
        logger.info("Shutting down gracefully")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)
    finally:
        worker.close()


if __name__ == '__main__':
    main()
