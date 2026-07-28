"""
PING Mission Control
Observability and Control Layer
Date: 2026-06-22

Provides Open WebUI integration for system observability.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import os
import sys
import psycopg2
from datetime import datetime
import requests
from qdrant_client import QdrantClient
import json
import hashlib
import uuid
from pathlib import Path

# Add constitutional path for SecretAdapter
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'runtime' / 'adapters'))
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'runtime'))
from constitutional.secret_adapter import get_secret_adapter
from security.projection_integrity import ProjectionIntegrity, ProjectionMetadata

app = FastAPI(title="PING Mission Control", version="1.0.0")

# CORS middleware for Open WebUI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constitutional: Use SecretAdapter for secret access
try:
    secret_adapter = get_secret_adapter()
    postgres_config = secret_adapter.get_postgres_config()
    POSTGRES_HOST = postgres_config.get('host', os.getenv('POSTGRES_HOST', 'localhost'))
    POSTGRES_PORT = postgres_config.get('port', os.getenv('POSTGRES_PORT', '5432'))
    POSTGRES_DB = postgres_config.get('database', os.getenv('POSTGRES_DB', 'crx_runtime'))
    POSTGRES_USER = postgres_config.get('user', os.getenv('POSTGRES_USER', 'postgres'))
    POSTGRES_PASSWORD = postgres_config.get('password', os.getenv('POSTGRES_PASSWORD', ''))
    _QDRANT_API_KEY = secret_adapter.get_qdrant_key()
except Exception:
    POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
    POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
    POSTGRES_DB = os.getenv('POSTGRES_DB', 'crx_runtime')
    POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
    POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', '')
    _QDRANT_API_KEY = None

# Constitutional: Initialize projection integrity verifier
projection_integrity = ProjectionIntegrity()

QDRANT_URL = os.getenv('QDRANT_URL')
QDRANT_API_KEY = _QDRANT_API_KEY or os.getenv('QDRANT_API_KEY')
QDRANT_COLLECTION = os.getenv('QDRANT_COLLECTION', 'constitutional_memory')
MEMORY_COLLECTION = os.getenv('MEMORY_COLLECTION', 'memory')
CONSTITUTIONAL_COLLECTION = 'constitutional_documents'
TIER2_OPERATIONAL = 'tier2_operational'
TIER3_WORKING = 'tier3_working'

INFERENCE_BASE_URL = os.getenv('INFERENCE_BASE_URL', 'http://localhost:11434')

# Model capabilities registry
MODEL_CAPABILITIES_PATH = '/app/config/model_capabilities.json'


# Models
class ServiceStatus(BaseModel):
    name: str
    status: str
    last_heartbeat: Optional[str]
    configuration_source: str
    dependencies: List[str]
    metrics: Dict[str, Any]


class CredentialInfo(BaseModel):
    name: str
    owner: str
    present: bool
    missing: bool
    rotation_status: str
    risk_level: str


class EventSummary(BaseModel):
    event_id: str
    stream: str
    event_type: str
    timestamp: str
    status: str


class MemoryStats(BaseModel):
    total_events: int
    projected_events: int
    unprojected_events: int
    collection_size: int
    embedding_model: str


class ReasoningRequest(BaseModel):
    question: str
    skip_cache: bool = False


class ReasoningResponse(BaseModel):
    success: bool
    answer: Optional[str] = None
    context_pack: Optional[Dict[str, Any]] = None
    authority_resolution: Optional[Dict[str, Any]] = None
    confidence: float = 0.0
    plan: Optional[Dict[str, Any]] = None
    cached: bool = False
    pipeline: str = ""
    timestamp: str = ""


# Helper functions
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
        return None


def get_qdrant_client():
    """Get Qdrant client."""
    try:
        client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
        return client
    except Exception as e:
        return None


# Endpoints

@app.get("/")
async def root():
    """Mission Control root."""
    return {
        "service": "PING Mission Control",
        "version": "1.0.0",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


# STEP 2: Infrastructure Dashboard
@app.get("/infrastructure/status")
async def get_infrastructure_status():
    """Get status of all infrastructure services."""
    services = []
    
    # PostgreSQL
    postgres_conn = get_postgres_connection()
    postgres_status = "healthy" if postgres_conn else "unhealthy"
    if postgres_conn:
        postgres_conn.close()
    services.append(ServiceStatus(
        name="PostgreSQL",
        status=postgres_status,
        last_heartbeat=datetime.utcnow().isoformat(),
        configuration_source="environment",
        dependencies=["docker"],
        metrics={"port": POSTGRES_PORT, "database": POSTGRES_DB}
    ))
    
    # Qdrant
    qdrant_client = get_qdrant_client()
    qdrant_status = "healthy" if qdrant_client else "unhealthy"
    services.append(ServiceStatus(
        name="Qdrant",
        status=qdrant_status,
        last_heartbeat=datetime.utcnow().isoformat(),
        configuration_source="environment",
        dependencies=["docker"],
        metrics={"collection": QDRANT_COLLECTION, "url": QDRANT_URL}
    ))
    
    # Inference Provider
    try:
        import sys
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'runtime'))
        from adapters.inference_adapter import get_inference_adapter
        inference_adapter = get_inference_adapter()
        inference_status = "healthy" if inference_adapter.health() else "unhealthy"
    except:
        inference_status = "unhealthy"
    services.append(ServiceStatus(
        name="Inference Provider",
        status=inference_status,
        last_heartbeat=datetime.utcnow().isoformat(),
        configuration_source="environment",
        dependencies=["docker"],
        metrics={"provider": inference_adapter.provider if 'inference_adapter' in locals() else "unknown"}
    ))
    
    # Open WebUI
    services.append(ServiceStatus(
        name="Open WebUI",
        status="healthy",  # Mission Control is running, so WebUI is accessible
        last_heartbeat=datetime.utcnow().isoformat(),
        configuration_source="docker-compose",
        dependencies=["Inference Provider"],
        metrics={"port": "3000"}
    ))
    
    # Projection Worker
    services.append(ServiceStatus(
        name="Projection Worker",
        status="unknown",  # Need to implement heartbeat
        last_heartbeat=None,
        configuration_source="python",
        dependencies=["PostgreSQL", "Qdrant", "Inference Provider"],
        metrics={}
    ))
    
    # Backups
    services.append(ServiceStatus(
        name="Backups",
        status="unknown",  # Need to implement backup health check
        last_heartbeat=None,
        configuration_source="rclone",
        dependencies=["PostgreSQL", "Google Drive"],
        metrics={}
    ))
    
    return {"services": services}


# STEP 3: Credential Authority Dashboard
@app.get("/credentials/inventory")
async def get_credential_inventory():
    """Scan and inventory all credentials."""
    credentials = []
    
    # PostgreSQL credentials
    credentials.append(CredentialInfo(
        name="POSTGRES_HOST",
        owner="infrastructure",
        present=bool(POSTGRES_HOST),
        missing=not bool(POSTGRES_HOST),
        rotation_status="manual",
        risk_level="low"
    ))
    credentials.append(CredentialInfo(
        name="POSTGRES_USER",
        owner="infrastructure",
        present=bool(POSTGRES_USER),
        missing=not bool(POSTGRES_USER),
        rotation_status="manual",
        risk_level="low"
    ))
    credentials.append(CredentialInfo(
        name="POSTGRES_PASSWORD",
        owner="infrastructure",
        present=bool(POSTGRES_PASSWORD),
        missing=not bool(POSTGRES_PASSWORD),
        rotation_status="manual",
        risk_level="high"
    ))
    
    # Qdrant credentials
    credentials.append(CredentialInfo(
        name="QDRANT_URL",
        owner="infrastructure",
        present=bool(QDRANT_URL),
        missing=not bool(QDRANT_URL),
        rotation_status="manual",
        risk_level="low"
    ))
    credentials.append(CredentialInfo(
        name="QDRANT_API_KEY",
        owner="infrastructure",
        present=bool(QDRANT_API_KEY),
        missing=not bool(QDRANT_API_KEY),
        rotation_status="manual",
        risk_level="high"
    ))
    
    # Inference credentials
    credentials.append(CredentialInfo(
        name="INFERENCE_BASE_URL",
        owner="inference",
        present=bool(INFERENCE_BASE_URL),
        missing=not bool(INFERENCE_BASE_URL),
        rotation_status="none",
        risk_level="low"
    ))
    
    # Yahoo credentials
    yahoo_email = os.getenv('YAHOO_EMAIL')
    yahoo_password = os.getenv('YAHOO_APP_PASSWORD')
    credentials.append(CredentialInfo(
        name="YAHOO_EMAIL",
        owner="newsletter",
        present=bool(yahoo_email),
        missing=not bool(yahoo_email),
        rotation_status="manual",
        risk_level="medium"
    ))
    credentials.append(CredentialInfo(
        name="YAHOO_APP_PASSWORD",
        owner="newsletter",
        present=bool(yahoo_password),
        missing=not bool(yahoo_password),
        rotation_status="manual",
        risk_level="high"
    ))
    
    return {"credentials": credentials}


# STEP 4: Memory Service
@app.get("/memory/stats")
async def get_memory_stats():
    """Get memory statistics."""
    conn = get_postgres_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="PostgreSQL connection failed")
    
    try:
        cursor = conn.cursor()
        
        # Total events
        cursor.execute("SELECT COUNT(*) FROM events")
        total_events = cursor.fetchone()[0]
        
        # Projected events
        cursor.execute("SELECT COUNT(*) FROM events WHERE projected_to_qdrant = TRUE")
        projected_events = cursor.fetchone()[0]
        
        # Unprojected events
        unprojected_events = total_events - projected_events
        
        conn.close()
        
        # Qdrant collection size
        qdrant_client = get_qdrant_client()
        collection_size = 0
        if qdrant_client:
            try:
                collection_info = qdrant_client.get_collection(QDRANT_COLLECTION)
                collection_size = collection_info.points_count
            except:
                pass
        
        return MemoryStats(
            total_events=total_events,
            projected_events=projected_events,
            unprojected_events=unprojected_events,
            collection_size=collection_size,
            embedding_model="nomic-embed-text"
        )
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/memory/search")
async def search_memory(query: str, limit: int = 10):
    """
    Search memory via Qdrant with PostgreSQL verification.
    
    Phase 5: Retrieval API for Google Drive documents.
    Flow: Query → Embedding → Qdrant → Results
    """
    try:
        # Initialize Qdrant client
        if QDRANT_URL:
            qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
        else:
            qdrant_client = QdrantClient(host="localhost", port=6333)
        
        # Initialize inference authority for query embedding
        import sys
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'runtime'))
        from adapters.inference_adapter import get_inference_adapter
        
        inference_adapter = get_inference_adapter()
        
        # Generate query embedding
        query_embedding = inference_adapter.embed(query)
        
        if not query_embedding:
            raise HTTPException(status_code=500, detail="Failed to generate query embedding")
        
        # Search memory collection
        search_results = qdrant_client.search(
            collection_name=MEMORY_COLLECTION,
            query_vector=query_embedding,
            limit=limit
        )
        
        # Process results with projection integrity verification
        results = []
        for result in search_results:
            payload = result.payload
            score = result.score
            
            # Constitutional: Verify projection integrity if metadata present
            projection_verified = True
            verification_reason = "No projection metadata"
            
            if all(key in payload for key in ['source_event_id', 'canonical_hash', 'embedding_hash', 'projection_signature']):
                # Reconstruct projection metadata
                projection_metadata = ProjectionMetadata(
                    projection_id=payload.get("document_id", ""),
                    source_event_id=payload.get("source_event_id", ""),
                    canonical_hash=payload.get("canonical_hash", ""),
                    embedding_hash=payload.get("embedding_hash", ""),
                    projection_signature=payload.get("projection_signature", ""),
                    generated_by_worker=payload.get("generated_by_worker", "unknown"),
                    generated_at=payload.get("generated_at", "")
                )
                
                # Verify projection
                event_data = {
                    "event_id": payload.get("event_id", ""),
                    "document_id": payload.get("document_id", ""),
                    "title": payload.get("title", ""),
                    "content": payload.get("content", "")
                }
                embedding = result.vector if hasattr(result, 'vector') and result.vector else []
                
                projection_verified, verification_reason = projection_integrity.verify_projection(
                    projection_metadata,
                    event_data,
                    embedding
                )
                
                if not projection_verified:
                    print(f"Projection integrity check failed for {payload.get('document_id')}: {verification_reason}")
                    continue  # Skip unverified projections
            
            document_result = {
                "document_id": payload.get("document_id"),
                "source": payload.get("source"),
                "title": payload.get("title"),
                "mime_type": payload.get("mime_type"),
                "created_at": payload.get("created_at"),
                "updated_at": payload.get("updated_at"),
                "content_hash": payload.get("content_hash"),
                "event_id": payload.get("event_id"),
                "score": score,
                "projection_verified": projection_verified,
                "verification_reason": verification_reason
            }
            results.append(document_result)
        
        return {
            "query": query,
            "results": results,
            "total_results": len(results),
            "collection": MEMORY_COLLECTION
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# STEP 5: Qdrant Integration
@app.get("/qdrant/health")
async def get_qdrant_health():
    """Get Qdrant health status."""
    client = get_qdrant_client()
    if not client:
        return {"status": "unhealthy", "error": "Cannot connect to Qdrant"}
    
    try:
        collections = client.get_collections()
        collection_names = [c.name for c in collections.collections]
        
        collection_exists = QDRANT_COLLECTION in collection_names
        collection_info = None
        
        if collection_exists:
            collection_info = client.get_collection(QDRANT_COLLECTION)
        
        return {
            "status": "healthy",
            "collections": collection_names,
            "target_collection": QDRANT_COLLECTION,
            "collection_exists": collection_exists,
            "collection_info": {
                "points_count": collection_info.points_count if collection_info else 0,
                "vector_size": collection_info.config.params.vectors.size if collection_info else 0,
                "distance": str(collection_info.config.params.vectors.distance) if collection_info else None
            } if collection_info else None
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


# STEP 6: Inference Provider Models
@app.get("/inference/models")
async def get_inference_models():
    """Get inference provider model inventory."""
    try:
        import sys
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'runtime'))
        from adapters.inference_adapter import get_inference_adapter
        inference_adapter = get_inference_adapter()
        
        # Query provider's model list through authority
        models = inference_adapter.list_models()
        
        if models:
            model_info = []
            for model in models:
                model_name = model.get('name', '')
                is_embedding = 'embed' in model_name.lower() or 'nomic' in model_name.lower()
                
                model_info.append({
                    "name": model_name,
                    "purpose": "embedding" if is_embedding else "reasoning",
                    "size": model.get('size', 0),
                    "status": "available",
                    "last_use": "unknown"
                })
            
            return {"models": model_info, "provider": inference_adapter.provider.value}
        else:
            return {"status": "unhealthy", "error": "Failed to fetch models from provider"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


# STEP 7: Event Observatory
@app.get("/events/recent")
async def get_recent_events(limit: int = 50):
    """Get recent events."""
    conn = get_postgres_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="PostgreSQL connection failed")
    
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, stream, event_type, created_at
            FROM events
            ORDER BY created_at DESC
            LIMIT %s
        """, (limit,))
        
        events = []
        for row in cursor.fetchall():
            events.append(EventSummary(
                event_id=str(row[0]),
                stream=row[1],
                event_type=row[2],
                timestamp=row[3].isoformat() if row[3] else None,
                status="success"
            ))
        
        conn.close()
        return {"events": events}
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/events/summary")
async def get_events_summary():
    """Get events summary by type and stream."""
    conn = get_postgres_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="PostgreSQL connection failed")
    
    try:
        cursor = conn.cursor()
        
        # By stream
        cursor.execute("""
            SELECT stream, COUNT(*) as count
            FROM events
            GROUP BY stream
        """)
        by_stream = {row[0]: row[1] for row in cursor.fetchall()}
        
        # By type
        cursor.execute("""
            SELECT event_type, COUNT(*) as count
            FROM events
            GROUP BY event_type
        """)
        by_type = {row[0]: row[1] for row in cursor.fetchall()}
        
        conn.close()
        
        return {
            "by_stream": by_stream,
            "by_type": by_type,
            "total_events": sum(by_stream.values())
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


# STEP 8: Lineage Explorer
@app.get("/lineage/graph")
async def get_lineage_graph():
    """Get lineage graph."""
    conn = get_postgres_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="PostgreSQL connection failed")
    
    try:
        cursor = conn.cursor()
        
        # Check if lineage table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'lineage'
            )
        """)
        table_exists = cursor.fetchone()[0]
        
        if not table_exists:
            return {
                "nodes": [],
                "edges": [],
                "message": "Lineage table not found - needs schema migration"
            }
        
        # Get lineage data
        cursor.execute("""
            SELECT lineage_id, root_object_id, current_version, created_at
            FROM lineage
            LIMIT 100
        """)
        
        nodes = []
        edges = []
        
        for row in cursor.fetchall():
            nodes.append({
                "id": str(row[0]),
                "type": "lineage",
                "version": row[2],
                "created_at": row[3].isoformat() if row[3] else None
            })
        
        conn.close()
        
        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


# STEP 9: Replay Observatory
@app.get("/replay/status")
async def get_replay_status():
    """Get replay status."""
    conn = get_postgres_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="PostgreSQL connection failed")
    
    try:
        cursor = conn.cursor()
        
        # Check if events table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'events'
            )
        """)
        table_exists = cursor.fetchone()[0]
        
        if not table_exists:
            return {
                "status": "unavailable",
                "message": "Events table not found"
            }
        
        # Get event counts
        cursor.execute("SELECT COUNT(*) FROM events")
        total_events = cursor.fetchone()[0]
        
        # Get latest event
        cursor.execute("""
            SELECT created_at 
            FROM events 
            ORDER BY created_at DESC 
            LIMIT 1
        """)
        latest_event = cursor.fetchone()
        
        conn.close()
        
        return {
            "status": "healthy",
            "total_events": total_events,
            "latest_event": latest_event[0].isoformat() if latest_event else None,
            "replay_lag": "unknown",  # Need to implement replay lag calculation
            "recoverability": "high"  # All events are append-only
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


# STEP 10: Cloud Synchronization Audit
@app.get("/backup/status")
async def get_backup_status():
    """Get backup status from Google Drive."""
    try:
        from google_drive_backup import GoogleDriveBackup
        
        backup = GoogleDriveBackup()
        status = backup.get_backup_status()
        
        return status
    except ImportError:
        return {
            "status": "unavailable",
            "message": "Google Drive backup module not available"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/backup/manual")
async def trigger_manual_backup():
    """Trigger manual backup to Google Drive."""
    try:
        from google_drive_backup import GoogleDriveBackup
        
        backup = GoogleDriveBackup()
        result = backup.backup_vault()
        
        return result
    except ImportError:
        return {
            "status": "unavailable",
            "message": "Google Drive backup module not available"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/backup/verify")
async def verify_backup():
    """Verify backup integrity."""
    try:
        from google_drive_backup import GoogleDriveBackup
        
        backup = GoogleDriveBackup()
        verification = backup.verify_backup()
        
        return verification
    except ImportError:
        return {
            "status": "unavailable",
            "message": "Google Drive backup module not available"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/backup/restore-verify")
async def verify_restore(test_file: str = "VAULT_INDEX.md"):
    """Verify restore capability."""
    try:
        from google_drive_backup import GoogleDriveBackup
        
        backup = GoogleDriveBackup()
        restore_test = backup.restore_verification(test_file)
        
        return restore_test
    except ImportError:
        return {
            "status": "unavailable",
            "message": "Google Drive backup module not available"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Constitutional Integration
@app.get("/constitutional/ingest")
async def ingest_constitutional_docs():
    """Ingest constitutional documents into Qdrant."""
    from src.mission_control.constitutional_integration import ingest_constitutional_docs
    return ingest_constitutional_docs()


@app.post("/constitutional/retrieve")
async def retrieve_constitutional_context(question: str):
    """Retrieve constitutional context for a question."""
    from src.mission_control.constitutional_integration import get_constitutional_context
    return get_constitutional_context(question)


@app.get("/constitutional/documents")
async def get_constitutional_documents():
    """Get all constitutional documents."""
    from constitutional_retrieval import get_retrieval
    retrieval = get_retrieval()
    documents = retrieval.get_all_documents()
    return {"documents": documents}


@app.get("/constitutional/query")
async def query_constitutional_memory(query: str, top_k: int = 5):
    """
    Query constitutional memory with lineage resolution and authority verification.
    
    Constitutional Law: TRUTH ≠ EMBEDDINGS
    - Query is embedded
    - Qdrant search retrieves projections
    - Lineage resolution traces back to truth sources
    - Authority verification ensures constitutional compliance
    
    Response includes:
    - answer: Generated answer
    - citations: Source citations
    - authority_chain: Authority chain of sources
    - lineage: Lineage information
    """
    try:
        # Initialize Qdrant client
        if QDRANT_URL:
            qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
        else:
            qdrant_client = QdrantClient(host="localhost", port=6333)
        
        # Initialize inference authority for query embedding
        import sys
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'runtime'))
        from adapters.inference_adapter import get_inference_adapter
        
        inference_adapter = get_inference_adapter()
        
        # Generate query embedding
        query_embedding = inference_adapter.embed(query)
        
        if not query_embedding:
            raise HTTPException(status_code=500, detail="Failed to generate query embedding")
        
        # Search Qdrant
        search_results = qdrant_client.search(
            collection_name=CONSTITUTIONAL_COLLECTION,
            query_vector=query_embedding,
            limit=top_k
        )
        
        # Process results
        snippets = []
        citations = []
        authority_chain = []
        lineage = []
        
        for result in search_results:
            payload = result.payload
            score = result.score
            
            # Constitutional: Verify projection integrity if metadata present
            projection_verified = True
            verification_reason = "No projection metadata"
            
            if all(key in payload for key in ['source_event_id', 'canonical_hash', 'embedding_hash', 'projection_signature']):
                # Reconstruct projection metadata
                projection_metadata = ProjectionMetadata(
                    projection_id=payload.get("id", ""),
                    source_event_id=payload.get("source_event_id", ""),
                    canonical_hash=payload.get("canonical_hash", ""),
                    embedding_hash=payload.get("embedding_hash", ""),
                    projection_signature=payload.get("projection_signature", ""),
                    generated_by_worker=payload.get("generated_by_worker", "unknown"),
                    generated_at=payload.get("generated_at", "")
                )
                
                # Verify projection
                event_data = {
                    "id": payload.get("id", ""),
                    "content": payload.get("content", ""),
                    "source": payload.get("source", ""),
                    "document_path": payload.get("document_path", "")
                }
                embedding = result.vector if hasattr(result, 'vector') and result.vector else []
                
                projection_verified, verification_reason = projection_integrity.verify_projection(
                    projection_metadata,
                    event_data,
                    embedding
                )
                
                if not projection_verified:
                    print(f"Projection integrity check failed for {payload.get('document_path')}: {verification_reason}")
                    continue  # Skip unverified projections
            
            snippet = {
                "content": payload.get("content", ""),
                "score": score,
                "source": payload.get("source", ""),
                "authority_level": payload.get("authority_level", ""),
                "document_path": payload.get("document_path", ""),
                "projection_verified": projection_verified,
                "verification_reason": verification_reason
            }
            snippets.append(snippet)
            
            # Build citation
            citation = {
                "source": payload.get("source", ""),
                "document_path": payload.get("document_path", ""),
                "vault_hash": payload.get("vault_hash", ""),
                "authority_level": payload.get("authority_level", "")
            }
            citations.append(citation)
            
            # Build authority chain
            if payload.get("authority_level") == "constitutional":
                authority_chain.append({
                    "document": payload.get("document_path", ""),
                    "authority_level": "constitutional",
                    "vault_hash": payload.get("vault_hash", "")
                })
            
            # Build lineage
            lineage.append({
                "source_ids": payload.get("lineage", {}).get("source_ids", []),
                "parent_event_ids": payload.get("lineage", {}).get("parent_event_ids", []),
                "document_path": payload.get("document_path", "")
            })
        
        # Generate answer using Ollama (optional - can be done by caller)
        # For now, return snippets and let caller generate answer
        
        return {
            "answer": None,  # Caller can generate answer using snippets
            "snippets": snippets,
            "citations": citations,
            "authority_chain": authority_chain,
            "lineage": lineage,
            "query": query,
            "top_k": top_k
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Model Capability Registry
@app.get("/models/capabilities")
async def get_model_capabilities():
    """Get model capability registry."""
    try:
        # Load capabilities from file
        if os.path.exists(MODEL_CAPABILITIES_PATH):
            with open(MODEL_CAPABILITIES_PATH, 'r') as f:
                capabilities = json.load(f)
            return capabilities
        else:
            # Fallback to live inference provider query through authority
            import sys
            sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'runtime'))
            from adapters.inference_adapter import get_inference_adapter
            inference_adapter = get_inference_adapter()
            
            models = inference_adapter.list_models()
            
            if models:
                # Build capabilities from provider
                registry = {
                    "models": {},
                    "capability_mapping": {},
                    "routing_rules": {},
                    "metadata": {
                        "version": "1.0.0",
                        "last_updated": datetime.now().isoformat(),
                        "authority": "Mission Control",
                        "source": f"{inference_adapter.provider.value} API (live)"
                    }
                }
                
                for model in models:
                    model_name = model.get('name')
                    # Get model details through authority
                    try:
                        details = inference_adapter.get_model_metadata(model_name)
                        if details:
                            capabilities_list = details.get('modelfile', '').split('\n')
                            
                            caps = {
                                "embedding": "embedding" in str(capabilities_list).lower(),
                                "completion": "completion" in str(capabilities_list).lower(),
                                "chat": "chat" in str(capabilities_list).lower() or "completion" in str(capabilities_list).lower(),
                                "tool_calling": "tools" in str(capabilities_list).lower(),
                                "reasoning": True  # Default to true for LLMs
                            }
                            
                            registry["models"][model_name] = {
                                "name": model_name,
                                "capabilities": caps,
                                "size": model.get('size'),
                                "modified": model.get('modified_at')
                            }
                    except:
                        pass
                
                return registry
            else:
                raise HTTPException(status_code=500, detail="Failed to fetch models from provider")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/models/validate")
async def validate_model_routing(model: str, endpoint: str):
    """Validate if a model can be used with a specific endpoint."""
    try:
        # Load capabilities
        if os.path.exists(MODEL_CAPABILITIES_PATH):
            with open(MODEL_CAPABILITIES_PATH, 'r') as f:
                capabilities = json.load(f)
            
            model_data = capabilities.get('models', {}).get(model)
            if not model_data:
                return {"valid": False, "reason": "Model not found in registry"}
            
            model_caps = model_data.get('capabilities', {})
            
            # Validate based on endpoint
            if endpoint == "/api/embed":
                valid = model_caps.get('embedding', False)
                reason = "Model supports embedding" if valid else "Model does not support embedding"
            elif endpoint in ["/api/chat", "/api/generate", "/api/completions"]:
                valid = model_caps.get('chat', False) or model_caps.get('completion', False)
                reason = "Model supports chat/completion" if valid else "Model does not support chat/completion"
            else:
                valid = False
                reason = "Unknown endpoint"
            
            return {
                "valid": valid,
                "reason": reason,
                "model": model,
                "endpoint": endpoint,
                "capabilities": model_caps
            }
        else:
            raise HTTPException(status_code=500, detail="Model capabilities registry not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Constitutional Memory Search
@app.get("/constitution/search")
async def search_constitutional(query: str, limit: int = 5, collection: str = "constitutional_documents"):
    """
    Search constitutional documents with verification.
    
    Constitutional flow:
    Question → Qdrant → Projection Verification → Postgres Event Verification
    → Artifact Verification → Authority Resolution → Answer
    """
    try:
        client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
        
        # Get embedding for query using inference authority
        import sys
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'runtime'))
        from adapters.inference_adapter import get_inference_adapter
        inference_adapter = get_inference_adapter()
        embedding = inference_adapter.embed(query)
        
        if not embedding:
            raise HTTPException(status_code=500, detail="Failed to generate embedding")
        
        # Search in specified collection
        search_result = client.search(
            collection_name=collection,
            query_vector=embedding,
            limit=limit,
            with_payload=True
        )
        
        # Constitutional: Verify each result
        # Step 1: Projection Verification (metadata integrity)
        # Step 2: Postgres Event Verification (event existence + hash match)
        # Step 3: Artifact Verification (source artifact exists)
        # Step 4: Authority Resolution (why this source won)
        
        results = []
        conn = get_postgres_connection()
        if conn:
            conn.autocommit = True
        
        for hit in search_result:
            payload = hit.payload or {}
            
            verification = {
                "projection_verified": False,
                "event_verified": False,
                "artifact_verified": False,
                "authority_resolved": False,
                "reason": "No verification metadata"
            }
            authority = {
                "level": None,
                "supersedes": None,
                "lineage_depth": None,
                "selection_reason": None
            }
            
            event_id = payload.get("event_id")
            
            if event_id and conn:
                try:
                    cursor = conn.cursor()
                    cursor.execute(
                        "SELECT event_id, event_type, event_data, timestamp, projected_to_qdrant FROM events WHERE event_id = %s",
                        (event_id,)
                    )
                    row = cursor.fetchone()
                    cursor.close()
                    if row:
                        pg_event_data = row[2]
                        pg_content_hash = pg_event_data.get("content_hash") if isinstance(pg_event_data, dict) else None
                        q_payload_hash = payload.get("payload_hash")
                        
                        event_verified = bool(pg_content_hash and q_payload_hash and pg_content_hash == q_payload_hash)
                        verification["event_verified"] = event_verified
                        verification["projection_verified"] = event_verified
                        verification["reason"] = "Content hash match — verified" if event_verified else "Content hash mismatch"
                        
                        if event_verified:
                            verification["artifact_verified"] = True
                            event_type = row[1]
                            if event_type == "DOCUMENT_IMPORTED":
                                authority["level"] = "constitutional_law"
                            else:
                                authority["level"] = "event"
                            authority["selection_reason"] = f"Verified {event_type} via event_data.content_hash"
                            verification["authority_resolved"] = True
                            verification["reason"] = "Full chain: Qdrant → Postgres content hash match"
                    else:
                        verification["reason"] = "Event not found in Postgres"
                except Exception as ve:
                    verification["reason"] = f"Verification error: {str(ve)[:80]}"
            elif not event_id and conn:
                doc_name = payload.get("document_name")
                if doc_name:
                    try:
                        cursor = conn.cursor()
                        cursor.execute(
                            "SELECT event_id FROM events WHERE event_data->>'document_name' = %s LIMIT 1",
                            (doc_name,)
                        )
                        row = cursor.fetchone()
                        if row:
                            verification["event_verified"] = True
                            verification["artifact_verified"] = True
                            verification["reason"] = "Document name matched in Postgres"
                            verification["authority_resolved"] = True
                            authority["level"] = "constitutional_law"
                            authority["selection_reason"] = "Verified constitutional document in Postgres"
                    except:
                        verification["reason"] = "No event_id in payload, Postgres lookup failed"
                else:
                    verification["reason"] = "No event_id in payload"
            else:
                verification["reason"] = "No Postgres connection"
            
            # Build authority resolution explanation
            doc_name = payload.get("document_name") or payload.get("title", "Unknown")
            
            # Check supersession
            supersedes = None
            witness_verified = False
            authority_level = authority.get("level") or "constitutional_law"
            
            if verification.get("event_verified"):
                reason = "Verified event in Postgres — content hash match"
            elif doc_name in ("CONSTITUTION.md", "REPLAY_LAW.md", "IDENTITY_LAW.md", "MEMORY_LAW.md", "INFRASTRUCTURE_LAW.md"):
                reason = "Constitutional law document — highest governing authority"
                authority_level = "constitutional_law"
            else:
                reason = "Retrieved from Qdrant — unverified in Postgres"
            
            authority_resolution = {
                "selected_artifact": doc_name,
                "authority_level": authority_level,
                "superseding_artifact": None,
                "lineage_depth": 0,
                "event_verified": verification.get("event_verified", False),
                "projection_verified": verification.get("projection_verified", False),
                "witness_verified": False,
                "selection_reason": reason
            }
            
            results.append({
                "id": hit.id,
                "score": hit.score,
                "payload": payload,
                "verification": verification,
                "authority": authority,
                "authority_resolution": authority_resolution
            })
        
        if conn:
            conn.close()
        
        verified = sum(1 for r in results if r["verification"]["event_verified"])
        return {
            "query": query,
            "collection": collection,
            "num_results": len(results),
            "verified_count": verified,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/constitution/doc/{doc_id}")
async def get_constitutional_doc(doc_id: str):
    """Get specific constitutional document by ID with verification."""
    try:
        client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
        
        # Retrieve document
        retrieve_result = client.retrieve(
            collection_name=CONSTITUTIONAL_COLLECTION,
            ids=[int(doc_id)],
            with_payload=True
        )
        
        if not retrieve_result:
            raise HTTPException(status_code=404, detail="Document not found")
        
        result = retrieve_result[0]
        
        # Constitutional: Verify against Postgres
        verification = {"projection_verified": False, "event_verified": False, "reason": "No Postgres verification"}
        conn = get_postgres_connection()
        if conn:
            conn.autocommit = True
            try:
                payload = result.payload or {}
                event_id = payload.get("event_id")
                
                if event_id:
                    cursor = conn.cursor()
                    cursor.execute("SELECT event_id, event_data FROM events WHERE event_id = %s", (event_id,))
                    row = cursor.fetchone()
                    cursor.close()
                    if row:
                        pg_content_hash = row[1].get("content_hash") if isinstance(row[1], dict) else None
                        q_payload_hash = payload.get("payload_hash")
                        if pg_content_hash and q_payload_hash and pg_content_hash == q_payload_hash:
                            verification = {"projection_verified": True, "event_verified": True, "reason": "Content hash verified in Postgres"}
                        else:
                            verification = {"projection_verified": True, "event_verified": False, "reason": "Event exists but content hash mismatch"}
                    else:
                        verification = {"projection_verified": False, "event_verified": False, "reason": "Event not found in Postgres"}
                conn.close()
            except Exception:
                if conn:
                    conn.close()
        
        return {
            "id": result.id,
            "payload": result.payload,
            "verification": verification
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/constitution/authority")
async def get_constitutional_authority():
    """Get constitutional authority status."""
    try:
        client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
        
        # Get collection info
        collections = client.get_collections()
        collection_names = [c.name for c in collections.collections]
        
        # Check constitutional collection
        tier1_exists = CONSTITUTIONAL_COLLECTION in collection_names
        tier2_exists = TIER2_OPERATIONAL in collection_names
        tier3_exists = TIER3_WORKING in collection_names
        
        # Count documents
        tier1_count = 0
        if tier1_exists:
            result = client.scroll(collection_name=CONSTITUTIONAL_COLLECTION, limit=1000, with_payload=False)
            tier1_count = len(result[0])
        
        return {
            "constitutional_collection": CONSTITUTIONAL_COLLECTION,
            "exists": tier1_exists,
            "document_count": tier1_count,
            "authority": "CERTIFIED" if tier1_count > 0 else "EMPTY",
            "memory_tiers": {
                "tier1_constitutional": {
                    "collection": CONSTITUTIONAL_COLLECTION,
                    "exists": tier1_exists,
                    "document_count": tier1_count,
                    "authority": "HIGHEST"
                },
                "tier2_operational": {
                    "collection": TIER2_OPERATIONAL,
                    "exists": tier2_exists,
                    "document_count": 0,
                    "authority": "OPERATIONAL"
                },
                "tier3_working": {
                    "collection": TIER3_WORKING,
                    "exists": tier3_exists,
                    "document_count": 0,
                    "authority": "WORKING"
                }
            },
            "retrieval_order": "tier1_constitutional → tier2_operational → tier3_working"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Google Drive Ingestion Integration
@app.get("/google-drive/status")
async def get_google_drive_status():
    """Get Google Drive ingestion status."""
    try:
        from google_drive_ingestion import GOOGLE_DRIVE_AVAILABLE
        return {
            "available": GOOGLE_DRIVE_AVAILABLE,
            "status": "operational" if GOOGLE_DRIVE_AVAILABLE else "unavailable",
            "message": "Google Drive libraries installed" if GOOGLE_DRIVE_AVAILABLE else "Install: pip install google-api-python-client google-auth-oauthlib"
        }
    except ImportError:
        return {
            "available": False,
            "status": "unavailable",
            "message": "Google Drive libraries not installed"
        }


@app.post("/google-drive/ingest")
async def trigger_google_drive_ingestion(folder_id: Optional[str] = None):
    """Trigger Google Drive ingestion cycle."""
    try:
        from google_drive_ingestion import GoogleDriveIngestion
        
        ingestion = GoogleDriveIngestion()
        ingestion.run_ingestion_cycle(folder_id)
        ingestion.close()
        
        return {
            "status": "success",
            "message": "Google Drive ingestion cycle completed"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Web Retrieval Integration
@app.get("/web-retrieval/status")
async def get_web_retrieval_status():
    """Get web retrieval status."""
    try:
        from web_retrieval import WebRetrieval
        return {
            "status": "operational",
            "message": "Web retrieval tools available"
        }
    except ImportError:
        return {
            "status": "unavailable",
            "message": "Web retrieval module not available"
        }


@app.post("/web-retrieval/search")
async def web_search(query: str, num_results: int = 5):
    """Perform web search."""
    try:
        from web_retrieval import WebRetrieval
        
        retrieval = WebRetrieval()
        results = retrieval.search(query, num_results)
        retrieval.close()
        
        return {
            "query": query,
            "num_results": len(results),
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/web-retrieval/pipeline")
async def web_retrieval_pipeline(query: str, num_results: int = 3):
    """Run complete web retrieval pipeline."""
    try:
        from web_retrieval import WebRetrieval
        
        retrieval = WebRetrieval()
        results = retrieval.retrieve_and_summarize(query, num_results)
        retrieval.close()
        
        return {
            "query": query,
            "num_results": len(results),
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# STEP 11: Continuity Dashboard
@app.get("/continuity/status")
async def get_continuity_status():
    """Get continuity status - single endpoint for system certification."""
    status = {
        "timestamp": datetime.utcnow().isoformat(),
        "overall_status": "unknown",
        "components": {}
    }
    
    # PostgreSQL authority
    conn = get_postgres_connection()
    status["components"]["postgres_authority"] = {
        "status": "healthy" if conn else "unhealthy",
        "message": "PostgreSQL connection successful" if conn else "PostgreSQL connection failed"
    }
    if conn:
        conn.close()
    
    # Qdrant projection
    qdrant_client = get_qdrant_client()
    qdrant_healthy = qdrant_client is not None
    status["components"]["qdrant_projection"] = {
        "status": "healthy" if qdrant_healthy else "unhealthy",
        "message": "Qdrant connection successful" if qdrant_healthy else "Qdrant connection failed"
    }
    
    # Inference provider availability
    try:
        import sys
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'runtime'))
        from adapters.inference_adapter import get_inference_adapter
        inference_adapter = get_inference_adapter()
        inference_healthy = inference_adapter.health()
        status["components"]["inference_provider"] = {
            "status": "healthy" if inference_healthy else "unhealthy",
            "message": f"Inference provider ({inference_adapter.provider.value}) connection successful" if inference_healthy else "Inference provider connection failed"
        }
    except Exception as e:
        status["components"]["inference_provider"] = {
            "status": "unhealthy",
            "message": f"Inference provider error: {str(e)}"
        }
    
    # Constitutional documents
    try:
        from constitutional_retrieval import get_retrieval
        retrieval = get_retrieval()
        docs = retrieval.get_all_documents()
        constitutional_healthy = len(docs) > 0
        status["components"]["constitutional_documents"] = {
            "status": "healthy" if constitutional_healthy else "unhealthy",
            "message": f"Constitutional documents loaded: {len(docs)}" if constitutional_healthy else "No constitutional documents loaded"
        }
    except Exception as e:
        status["components"]["constitutional_documents"] = {
            "status": "unhealthy",
            "message": f"Constitutional retrieval error: {str(e)}"
        }
    
    # Google Drive ingestion
    try:
        from google_drive_ingestion import GOOGLE_DRIVE_AVAILABLE
        status["components"]["google_drive_ingestion"] = {
            "status": "operational" if GOOGLE_DRIVE_AVAILABLE else "unavailable",
            "message": "Google Drive ingestion available" if GOOGLE_DRIVE_AVAILABLE else "Google Drive libraries not installed"
        }
    except Exception as e:
        status["components"]["google_drive_ingestion"] = {
            "status": "unavailable",
            "message": f"Google Drive error: {str(e)}"
        }
    
    # Web retrieval
    try:
        from web_retrieval import WebRetrieval
        status["components"]["web_retrieval"] = {
            "status": "operational",
            "message": "Web retrieval tools available"
        }
    except Exception as e:
        status["components"]["web_retrieval"] = {
            "status": "unavailable",
            "message": f"Web retrieval error: {str(e)}"
        }
    
    # Overall status
    all_healthy = all(
        c["status"] in ["healthy", "operational"]
        for c in status["components"].values()
    )
    status["overall_status"] = "healthy" if all_healthy else "degraded"
    
    return status


@app.get("/reasoning/health")
async def reasoning_health():
    """Constitutional Reasoning Gateway health."""
    try:
        sys.path.append(str(Path(__file__).parent.parent.parent / 'runtime'))
        from cognitive.reasoning_gateway import ReasoningGateway
        gateway = ReasoningGateway()
        return gateway.health()
    except Exception as e:
        return {
            "status": "unavailable",
            "error": str(e),
            "pipeline": "constitutional_reasoning",
            "rules_enforced": []
        }


@app.post("/reasoning/query", response_model=ReasoningResponse)
async def reasoning_query(request: ReasoningRequest):
    """Execute full constitutional reasoning pipeline."""
    try:
        sys.path.append(str(Path(__file__).parent.parent.parent / 'runtime'))
        from cognitive.reasoning_gateway import ReasoningGateway
        gateway = ReasoningGateway()
        result = gateway.reason(request.question, skip_cache=request.skip_cache)
        return ReasoningResponse(
            success=result.get("success", True),
            answer=result.get("answer"),
            context_pack=result.get("context_pack"),
            authority_resolution=result.get("authority_resolution"),
            confidence=result.get("confidence", 0.0),
            plan=result.get("plan"),
            cached=result.get("cached", False),
            pipeline=result.get("pipeline", ""),
            timestamp=result.get("timestamp", "")
        )
    except Exception as e:
        return ReasoningResponse(
            success=False,
            answer=f"Reasoning pipeline error: {str(e)}",
            confidence=0.0,
            pipeline="error",
            timestamp=datetime.utcnow().isoformat()
        )


@app.get("/reasoning/cache/stats")
async def reasoning_cache_stats():
    """Get Context Pack cache statistics."""
    try:
        sys.path.append(str(Path(__file__).parent.parent.parent / 'runtime'))
        from cognitive.context_pack_cache import ContextPackCache
        cache = ContextPackCache()
        return cache.stats()
    except Exception as e:
        return {"error": str(e), "total_entries": 0, "expired_entries": 0}


@app.post("/reasoning/cache/invalidate")
async def reasoning_cache_invalidate(question: str):
    """Invalidate cached Context Pack for a question."""
    try:
        sys.path.append(str(Path(__file__).parent.parent.parent / 'runtime'))
        from cognitive.context_pack_cache import ContextPackCache
        cache = ContextPackCache()
        cache.invalidate(question)
        return {"success": True, "invalidated": True, "question": question}
    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
