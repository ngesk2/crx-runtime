"""
Constitutional Retrieval Service
PING Constitutional Stabilization Phase E
Date: 2026-06-22

Mandatory constitutional document retrieval before answering questions.
Constitutional docs are Tier 1 memory.
"""

import os
import json
import logging
import hashlib
import psycopg2
from typing import List, Dict, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

QDRANT_URL = os.getenv('QDRANT_URL')
QDRANT_API_KEY = os.getenv('QDRANT_API_KEY')
QDRANT_COLLECTION = 'constitutional_documents'



class ConstitutionalRetrieval:
    """Mandatory constitutional document retrieval."""
    
    def __init__(self):
        self.qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
        self._ensure_collection()
    
    def _ensure_collection(self):
        """Ensure constitutional_documents collection exists."""
        try:
            collections = self.qdrant_client.get_collections().collections
            collection_names = [c.name for c in collections]
            
            if QDRANT_COLLECTION in collection_names:
                logger.info(f"Collection {QDRANT_COLLECTION} exists")
                return
            
            logger.info(f"Creating collection {QDRANT_COLLECTION}")
            self.qdrant_client.create_collection(
                collection_name=QDRANT_COLLECTION,
                vectors_config=VectorParams(
                    size=768,
                    distance=Distance.COSINE
                )
            )
            logger.info(f"Created collection {QDRANT_COLLECTION}")
        except Exception as e:
            logger.error(f"Failed to ensure collection: {e}")
    
    def _generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding using inference authority."""
        try:
            import sys
            sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'runtime', 'adapters'))
            from adapters.inference_adapter import get_inference_adapter
            inference_adapter = get_inference_adapter()
            embedding = inference_adapter.embed(text)
            
            if embedding and len(embedding) == 768:
                return embedding
            else:
                logger.error(f"Invalid embedding dimension")
                return None
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            return None
    
    def ingest_document(self, doc_name: str, content: str, doc_type: str = "law"):
        """
        Ingest a constitutional document through the constitutional pipeline.
        Constitutional flow: Artifact → DOCUMENT_IMPORTED → Postgres → Projection → Qdrant
        """
        import uuid
        content_hash = hashlib.sha256(content.encode()).hexdigest()
        doc_id = str(uuid.UUID(hex=content_hash[:32]))
        
        # Step 1: Record in Postgres as DOCUMENT_IMPORTED event (CQRS schema)
        import uuid as _uuid
        event_id = str(_uuid.uuid5(_uuid.NAMESPACE_DNS, doc_name + content))
        try:
            conn = psycopg2.connect(
                host=os.getenv('POSTGRES_HOST', 'localhost'),
                port=os.getenv('POSTGRES_PORT', '5432'),
                database=os.getenv('POSTGRES_DB', 'crx_runtime'),
                user=os.getenv('POSTGRES_USER', 'postgres'),
                password=os.getenv('POSTGRES_PASSWORD', '')
            )
            cur = conn.cursor()
            event_data = json.dumps({
                'document_name': doc_name,
                'document_type': doc_type,
                'content': content,
                'content_hash': content_hash,
                '_source_classification': 'SOURCE_ARTIFACT',
                '_generated_by': 'constitutional_retrieval.ingest',
                '_verified': True
            })
            cur.execute(
                "INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data, projected_to_qdrant) "
                "VALUES (%s, %s, NOW(), %s, %s, %s::jsonb, FALSE) "
                "ON CONFLICT (event_id) DO NOTHING",
                (event_id, 'DOCUMENT_IMPORTED', event_id, 'constitutional_document', event_data)
            )
            conn.commit()
            cur.close()
            conn.close()
            logger.info(f"Recorded Postgres event for: {doc_name} (event_id={event_id})")
        except Exception as e:
            logger.warning(f"Postgres event recording failed (non-fatal): {e}")
        
        # Step 2: Generate embedding
        embedding = self._generate_embedding(content)
        if not embedding:
            logger.error(f"Failed to generate embedding for {doc_name}")
            return False
        
        # Step 3: Project to Qdrant with event_id matching Postgres
        point = PointStruct(
            id=doc_id,
            vector=embedding,
            payload={
                "document_name": doc_name,
                "document_type": doc_type,
                "content": content,
                "content_hash": content_hash,
                "event_id": event_id,
                "payload_hash": content_hash,
                "tier": 1
            }
        )
        
        try:
            self.qdrant_client.upsert(
                collection_name=QDRANT_COLLECTION,
                points=[point]
            )
            logger.info(f"Projected to Qdrant: {doc_name}")
            return True
        except Exception as e:
            logger.error(f"Qdrant projection failed: {e}")
            return False
    
    def retrieve_for_question(self, question: str, limit: int = 3) -> List[Dict]:
        """
        Retrieve relevant constitutional documents for a question.
        MANDATORY before answering constitutional questions.
        """
        # Generate question embedding
        question_embedding = self._generate_embedding(question)
        if not question_embedding:
            logger.error("Failed to generate question embedding")
            return []
        
        try:
            # Search constitutional_documents collection
            results = self.qdrant_client.search(
                collection_name=QDRANT_COLLECTION,
                query_vector=question_embedding,
                limit=limit
            )
            
            documents = []
            for result in results:
                payload = result.payload
                documents.append({
                    "document_name": payload.get("document_name"),
                    "document_type": payload.get("document_type"),
                    "content": payload.get("content"),
                    "score": result.score
                })
            
            logger.info(f"Retrieved {len(documents)} documents for question")
            return documents
            
        except Exception as e:
            logger.error(f"Failed to retrieve documents: {e}")
            return []
    
    def is_constitutional_question(self, question: str) -> bool:
        """Determine if a question requires constitutional retrieval."""
        constitutional_keywords = [
            'constitution', 'law', 'replay', 'identity', 'memory',
            'authority', 'sovereignty', 'canonical', 'event', 'projection',
            'qdrant', 'postgres', 'rule', 'principle', ' mandate'
        ]
        
        question_lower = question.lower()
        return any(keyword in question_lower for keyword in constitutional_keywords)
    
    def get_all_documents(self) -> List[Dict]:
        """Get all constitutional documents."""
        try:
            results = self.qdrant_client.scroll(
                collection_name=QDRANT_COLLECTION,
                limit=1000
            )
            
            documents = []
            for point in results[0]:
                payload = point.payload
                documents.append({
                    "document_name": payload.get("document_name"),
                    "document_type": payload.get("document_type"),
                    "content": payload.get("content"),
                    "content_hash": payload.get("content_hash")
                })
            
            return documents
        except Exception as e:
            logger.error(f"Failed to get all documents: {e}")
            return []


# Singleton instance
_retrieval_instance = None

def get_retrieval() -> ConstitutionalRetrieval:
    """Get singleton retrieval instance."""
    global _retrieval_instance
    if _retrieval_instance is None:
        _retrieval_instance = ConstitutionalRetrieval()
    return _retrieval_instance


if __name__ == "__main__":
    # Test retrieval
    retrieval = get_retrieval()
    
    print("=== Constitutional Retrieval Test ===")
    
    # Test ingestion
    test_doc = """
    REPLAY LAW
    
    Replay is the constitutional authority for memory reconstruction.
    All memory must be reconstructible from events.
    Events are append-only and immutable.
    """
    
    retrieval.ingest_document("REPLAY_LAW.md", test_doc, "law")
    
    # Test retrieval
    question = "What is replay?"
    docs = retrieval.retrieve_for_question(question)
    
    print(f"\nQuestion: {question}")
    print(f"Retrieved {len(docs)} documents:")
    for doc in docs:
        print(f"  - {doc['document_name']} (score: {doc['score']:.3f})")
        print(f"    {doc['content'][:100]}...")
    
    # Test constitutional question detection
    print(f"\nIs constitutional question: {retrieval.is_constitutional_question(question)}")
    print(f"Is constitutional question: {retrieval.is_constitutional_question('What is the weather?')}")
