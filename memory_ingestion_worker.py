"""
Constitutional Memory Ingestion Worker
Priority 1: Constitutional Memory Ingestion
Date: 2026-06-23

This worker discovers, ingests, embeds, and projects documents from various sources:
- Vault (PING/vault)
- Drive (Google Drive)
- Research (CascadeProjects/research-pipeline)
- Scripts (various script directories)
- Transcripts (transcript repositories)
- Notes (note repositories)

Event Flow:
Document → DocumentDiscovered → DocumentIngested → DocumentEmbedded → ProjectedToQdrant
"""

import os
import sys
import hashlib
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import psycopg2
from psycopg2.extras import Json

# Add runtime adapters to path
sys.path.append(str(Path(__file__).parent / 'runtime' / 'adapters'))
sys.path.append(str(Path(__file__).parent / 'runtime' / 'constitutional'))

# Constitutional: Use SecretAdapter for secret access
from secret_adapter import get_secret_adapter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constitutional: Use SecretAdapter for secret access
secret_adapter = get_secret_adapter()

# PostgreSQL connection configuration from SecretAdapter
postgres_config = secret_adapter.get_postgres_config()
POSTGRES_HOST = postgres_config.get('host', os.getenv('POSTGRES_HOST', 'localhost'))
POSTGRES_PORT = postgres_config.get('port', os.getenv('POSTGRES_PORT', '5432'))
POSTGRES_DB = postgres_config.get('database', os.getenv('POSTGRES_DB', 'crx_runtime'))
POSTGRES_USER = postgres_config.get('user', os.getenv('POSTGRES_USER', 'postgres'))
POSTGRES_PASSWORD = postgres_config.get('password', os.getenv('POSTGRES_PASSWORD', ''))

# Qdrant configuration
QDRANT_HOST = os.getenv('QDRANT_HOST', 'localhost')
QDRANT_PORT = os.getenv('QDRANT_PORT', '6333')

# Ollama configuration
OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'localhost')
OLLAMA_PORT = os.getenv('OLLAMA_PORT', '11434')
EMBEDDING_MODEL = os.getenv('EMBEDDING_MODEL', 'qwen2.5-coder:7b')


def get_postgres_connection():
    """Get a PostgreSQL connection."""
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


def emit_event(stream: str, event_type: str, payload: Dict[str, Any]) -> bool:
    """Emit an event to the constitutional event log."""
    try:
        conn = get_postgres_connection()
        if not conn:
            logger.error(f"Event emission failed: could not connect to PostgreSQL")
            return False
        
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO events (stream, event_type, payload, created_at) VALUES (%s, %s, %s, %s)",
                (stream, event_type, Json(payload), datetime.utcnow())
            )
            conn.commit()
            cursor.close()
            conn.close()
            
            logger.info(f"Event emitted: stream={stream}, event_type={event_type}")
            return True
            
        except Exception as e:
            logger.error(f"Event emission failed (database error): {e}")
            if conn:
                conn.rollback()
                conn.close()
            return False
            
    except Exception as e:
        logger.error(f"Event emission failed (unexpected error): {e}")
        return False


def calculate_content_hash(content: str) -> str:
    """Calculate SHA-256 hash of content."""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


def calculate_document_hash(source_type: str, source_path: str, content_hash: Optional[str] = None) -> str:
    """Calculate document hash for unique identification."""
    data = f"{source_type}{source_path}{content_hash or ''}"
    return hashlib.sha256(data.encode('utf-8')).hexdigest()


def discover_vault_documents(vault_path: str) -> List[Dict[str, Any]]:
    """Discover documents from vault directory."""
    documents = []
    vault_dir = Path(vault_path)
    
    if not vault_dir.exists():
        logger.warning(f"Vault directory not found: {vault_path}")
        return documents
    
    for file_path in vault_dir.rglob('*.md'):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            content_hash = calculate_content_hash(content)
            document_hash = calculate_document_hash('vault', str(file_path), content_hash)
            
            documents.append({
                'document_hash': document_hash,
                'source_type': 'vault',
                'source_path': str(file_path),
                'title': file_path.stem,
                'content': content,
                'content_hash': content_hash,
                'content_length': len(content),
                'word_count': len(content.split()),
                'language': 'en',
                'metadata': {
                    'file_extension': file_path.suffix,
                    'file_size': file_path.stat().st_size
                }
            })
        except Exception as e:
            logger.error(f"Error reading vault file {file_path}: {e}")
    
    logger.info(f"Discovered {len(documents)} documents from vault")
    return documents


def discover_drive_documents() -> List[Dict[str, Any]]:
    """Discover documents from Google Drive (placeholder)."""
    # TODO: Implement Google Drive API integration
    logger.info("Google Drive discovery not yet implemented")
    return []


def discover_research_documents(research_path: str) -> List[Dict[str, Any]]:
    """Discover documents from research directory."""
    documents = []
    research_dir = Path(research_path)
    
    if not research_dir.exists():
        logger.warning(f"Research directory not found: {research_path}")
        return documents
    
    for file_path in research_dir.rglob('*.md'):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            content_hash = calculate_content_hash(content)
            document_hash = calculate_document_hash('research', str(file_path), content_hash)
            
            documents.append({
                'document_hash': document_hash,
                'source_type': 'research',
                'source_path': str(file_path),
                'title': file_path.stem,
                'content': content,
                'content_hash': content_hash,
                'content_length': len(content),
                'word_count': len(content.split()),
                'language': 'en',
                'metadata': {
                    'file_extension': file_path.suffix,
                    'file_size': file_path.stat().st_size
                }
            })
        except Exception as e:
            logger.error(f"Error reading research file {file_path}: {e}")
    
    logger.info(f"Discovered {len(documents)} documents from research")
    return documents


def ingest_document(document: Dict[str, Any]) -> Optional[int]:
    """Ingest document to PostgreSQL."""
    conn = get_postgres_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        
        # Check if document already exists
        cursor.execute(
            "SELECT id FROM documents WHERE document_hash = %s",
            (document['document_hash'],)
        )
        existing = cursor.fetchone()
        
        if existing:
            logger.info(f"Document already exists: {document['document_hash']}")
            cursor.close()
            conn.close()
            return existing[0]
        
        # Insert document
        cursor.execute(
            """
            INSERT INTO documents (
                document_hash, source_type, source_path, title, content_hash,
                created_at, discovered_at, status, metadata,
                content_length, word_count, language
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                document['document_hash'],
                document['source_type'],
                document['source_path'],
                document['title'],
                document['content_hash'],
                datetime.utcnow(),
                datetime.utcnow(),
                'discovered',
                Json(document.get('metadata', {})),
                document['content_length'],
                document['word_count'],
                document['language']
            )
        )
        document_id = cursor.fetchone()[0]
        
        # Insert content
        cursor.execute(
            """
            INSERT INTO document_content (document_id, content, content_hash)
            VALUES (%s, %s, %s)
            """,
            (document_id, document['content'], document['content_hash'])
        )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"Ingested document: {document_id} - {document['title']}")
        return document_id
        
    except Exception as e:
        logger.error(f"Error ingesting document: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return None


def generate_embedding(content: str) -> Optional[List[float]]:
    """
    Generate embedding using InferenceAdapter.
    
    Constitutional: Business logic must use InferenceAdapter, not direct API calls.
    """
    try:
        from inference_adapter import get_inference_adapter
        
        adapter = get_inference_adapter()
        embedding = adapter.embed(content)
        
        if embedding:
            return embedding
        else:
            logger.error("InferenceAdapter embedding failed")
            return None
            
    except Exception as e:
        logger.error(f"Error generating embedding via InferenceAdapter: {e}")
        return None


def embed_document(document_id: int, document_hash: str, content: str) -> bool:
    """Generate and store embedding for document."""
    embedding = generate_embedding(content)
    if not embedding:
        logger.error(f"Failed to generate embedding for document {document_id}")
        return False
    
    embedding_hash = calculate_content_hash(json.dumps(embedding))
    embedding_dimension = len(embedding)
    
    conn = get_postgres_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Insert embedding record
        cursor.execute(
            """
            INSERT INTO document_embeddings (
                document_id, embedding_model, embedding_dimension,
                embedded_at, embedding_hash
            ) VALUES (%s, %s, %s, %s, %s)
            RETURNING id
            """,
            (document_id, EMBEDDING_MODEL, embedding_dimension, datetime.utcnow(), embedding_hash)
        )
        embedding_id = cursor.fetchone()[0]
        
        # Update document status
        cursor.execute(
            "UPDATE documents SET embedded_at = %s, status = 'embedded' WHERE id = %s",
            (datetime.utcnow(), document_id)
        )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"Embedded document: {document_id} (dimension: {embedding_dimension})")
        return True
        
    except Exception as e:
        logger.error(f"Error embedding document: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return False


def project_to_qdrant(document_id: int, document_hash: str, content: str, metadata: Dict[str, Any]) -> bool:
    """Project document to Qdrant."""
    embedding = generate_embedding(content)
    if not embedding:
        logger.error(f"Failed to generate embedding for projection")
        return False
    
    # Get document info from PostgreSQL
    conn = get_postgres_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT d.*, dc.content
            FROM documents d
            JOIN document_content dc ON d.id = dc.document_id
            WHERE d.id = %s
            """,
            (document_id,)
        )
        document_info = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not document_info:
            logger.error(f"Document not found: {document_id}")
            return False
        
        # Prepare Qdrant payload
        payload = {
            'document_id': document_id,
            'document_hash': document_hash,
            'source_type': document_info[2],
            'source_path': document_info[3],
            'title': document_info[4],
            'created_at': document_info[6].isoformat() if document_info[6] else None,
            'discovered_at': document_info[7].isoformat() if document_info[7] else None,
            'ingested_at': document_info[8].isoformat() if document_info[8] else None,
            'embedded_at': document_info[9].isoformat() if document_info[9] else None,
            'content_length': document_info[12],
            'word_count': document_info[13],
            'language': document_info[14],
            'embedding_model': EMBEDDING_MODEL,
            'embedding_dimension': len(embedding),
            'content_hash': document_info[5],
            'metadata': document_info[15],
            'status': 'projected'
        }
        
        # Insert into Qdrant
        try:
            response = requests.put(
                f"http://{QDRANT_HOST}:{QDRANT_PORT}/collections/documents/points",
                json={
                    "points": [
                        {
                            "id": document_id,
                            "vector": embedding,
                            "payload": payload
                        }
                    ]
                },
                timeout=30
            )
            
            if response.status_code == 200:
                # Update document status
                conn = get_postgres_connection()
                cursor = conn.cursor()
                cursor.execute(
                    "UPDATE documents SET projected_at = %s, status = 'projected' WHERE id = %s",
                    (datetime.utcnow(), document_id)
                )
                
                # Update embedding record with Qdrant ID
                cursor.execute(
                    "UPDATE document_embeddings SET qdrant_id = %s WHERE document_id = %s",
                    (document_id, document_id)
                )
                
                conn.commit()
                cursor.close()
                conn.close()
                
                logger.info(f"Projected document to Qdrant: {document_id}")
                return True
            else:
                logger.error(f"Qdrant projection failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error projecting to Qdrant: {e}")
            return False
            
    except Exception as e:
        logger.error(f"Error getting document info: {e}")
        if conn:
            conn.close()
        return False


def process_document(document: Dict[str, Any]) -> bool:
    """Process a single document through the full pipeline."""
    start_time = datetime.utcnow()
    
    # Emit DOCUMENT_DISCOVERED event
    emit_event('documents', 'DOCUMENT_DISCOVERED', {
        'document_hash': document['document_hash'],
        'source_type': document['source_type'],
        'source_path': document['source_path'],
        'title': document['title'],
        'content_hash': document['content_hash'],
        'content_length': document['content_length'],
        'word_count': document['word_count'],
        'language': document['language'],
        'discovered_at': datetime.utcnow().isoformat(),
        'metadata': document.get('metadata', {})
    })
    
    # Ingest document
    document_id = ingest_document(document)
    if not document_id:
        emit_event('documents', 'DOCUMENT_FAILED', {
            'document_hash': document['document_hash'],
            'source_type': document['source_type'],
            'source_path': document['source_path'],
            'failed_at': datetime.utcnow().isoformat(),
            'failure_stage': 'ingestion',
            'error_message': 'Failed to ingest document'
        })
        return False
    
    ingestion_duration = (datetime.utcnow() - start_time).total_seconds() * 1000
    
    # Emit DOCUMENT_INGESTED event
    emit_event('documents', 'DOCUMENT_INGESTED', {
        'document_id': document_id,
        'document_hash': document['document_hash'],
        'ingested_at': datetime.utcnow().isoformat(),
        'content_stored': True,
        'content_hash': document['content_hash'],
        'ingestion_duration_ms': ingestion_duration
    })
    
    # Embed document
    if not embed_document(document_id, document['document_hash'], document['content']):
        emit_event('documents', 'DOCUMENT_FAILED', {
            'document_id': document_id,
            'document_hash': document['document_hash'],
            'failed_at': datetime.utcnow().isoformat(),
            'failure_stage': 'embedding',
            'error_message': 'Failed to generate embedding'
        })
        return False
    
    # Project to Qdrant
    if not project_to_qdrant(document_id, document['document_hash'], document['content'], document['metadata']):
        emit_event('documents', 'DOCUMENT_FAILED', {
            'document_id': document_id,
            'document_hash': document['document_hash'],
            'failed_at': datetime.utcnow().isoformat(),
            'failure_stage': 'projection',
            'error_message': 'Failed to project to Qdrant'
        })
        return False
    
    # Emit DOCUMENT_PROJECTED event
    emit_event('documents', 'DOCUMENT_PROJECTED', {
        'document_id': document_id,
        'document_hash': document['document_hash'],
        'qdrant_collection': 'documents',
        'qdrant_id': document_id,
        'projected_at': datetime.utcnow().isoformat()
    })
    
    total_duration = (datetime.utcnow() - start_time).total_seconds() * 1000
    logger.info(f"Document processed successfully: {document_id} ({total_duration:.0f}ms)")
    return True


def main():
    """Main ingestion pipeline."""
    logger.info("Starting Constitutional Memory Ingestion Worker")
    logger.info("=" * 60)
    
    # Configuration
    vault_path = os.getenv('VAULT_PATH', 'C:/Users/nolan/PING/vault')
    research_path = os.getenv('RESEARCH_PATH', 'C:/Users/nolan/CascadeProjects/research-pipeline')
    
    # Discover documents from all sources
    all_documents = []
    
    # Vault
    vault_documents = discover_vault_documents(vault_path)
    all_documents.extend(vault_documents)
    
    # Research
    research_documents = discover_research_documents(research_path)
    all_documents.extend(research_documents)
    
    # Drive (placeholder)
    drive_documents = discover_drive_documents()
    all_documents.extend(drive_documents)
    
    logger.info(f"Total documents discovered: {len(all_documents)}")
    
    # Process documents
    success_count = 0
    failure_count = 0
    
    for document in all_documents:
        if process_document(document):
            success_count += 1
        else:
            failure_count += 1
    
    logger.info("=" * 60)
    logger.info(f"Processing complete: {success_count} succeeded, {failure_count} failed")


if __name__ == "__main__":
    main()
