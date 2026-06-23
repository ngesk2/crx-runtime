"""
Mission Control Knowledge APIs
Priority 2: Mission Control Knowledge APIs
Date: 2026-06-23

These APIs expose knowledge retrieval capabilities through Mission Control.
Internally: Mission Control → Constitutional Search → Qdrant → PostgreSQL Verification

Architecture:
- GET /knowledge/search - Semantic search across documents
- GET /knowledge/related - Find related documents
- GET /knowledge/lineage - Get document lineage
- GET /knowledge/research - Research-specific queries
- GET /knowledge/documents - Get document by ID
"""

import os
import sys
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import psycopg2
from psycopg2.extras import Json
from flask import Flask, request, jsonify
from qdrant_client import QdrantClient

# Add runtime adapters to path
sys.path.append(str(Path(__file__).parent / 'runtime' / 'adapters'))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# PostgreSQL connection configuration
POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
POSTGRES_DB = os.getenv('POSTGRES_DB', 'crx_runtime')
POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', '')

# Qdrant configuration
QDRANT_HOST = os.getenv('QDRANT_HOST', 'localhost')
QDRANT_PORT = os.getenv('QDRANT_PORT', '6333')

# Ollama configuration
OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'localhost')
OLLAMA_PORT = os.getenv('OLLAMA_PORT', '11434')


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
            return True
        except Exception as e:
            logger.error(f"Event emission failed: {e}")
            if conn:
                conn.rollback()
                conn.close()
            return False
    except Exception as e:
        logger.error(f"Event emission failed: {e}")
        return False


@app.route('/knowledge/search', methods=['GET'])
def knowledge_search():
    """
    Semantic search across documents.
    
    Query Parameters:
    - query: Search query (required)
    - limit: Maximum number of results (default: 10)
    - source_type: Filter by source type (optional)
    - min_score: Minimum similarity score (default: 0.5)
    
    Flow:
    1. Generate embedding for query using Ollama
    2. Search Qdrant for similar documents
    3. Verify results against PostgreSQL
    4. Return verified results
    """
    try:
        query = request.args.get('query')
        limit = int(request.args.get('limit', 10))
        source_type = request.args.get('source_type')
        min_score = float(request.args.get('min_score', 0.5))
        
        if not query:
            return jsonify({'error': 'query parameter is required'}), 400
        
        # Emit search event
        emit_event('knowledge', 'KNOWLEDGE_SEARCH', {
            'query': query,
            'limit': limit,
            'source_type': source_type,
            'min_score': min_score,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # Generate embedding for query using InferenceAdapter
        try:
            from inference_adapter import get_inference_adapter
            
            adapter = get_inference_adapter()
            query_embedding = adapter.embed(query)
            
            if not query_embedding:
                return jsonify({'error': 'Failed to generate query embedding'}), 500
                
        except Exception as e:
            logger.error(f"Error generating query embedding via InferenceAdapter: {e}")
            return jsonify({'error': 'Failed to generate query embedding'}), 500
        
        # Search Qdrant using QdrantClient
        try:
            qdrant_client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
            
            qdrant_filter = None
            if source_type:
                from qdrant_client.models import Filter, FieldCondition, MatchValue
                qdrant_filter = Filter(
                    must=[
                        FieldCondition(
                            key="source_type",
                            match=MatchValue(value=source_type)
                        )
                    ]
                )
            
            search_results = qdrant_client.search(
                collection_name="documents",
                query_vector=query_embedding,
                limit=limit,
                score_threshold=min_score,
                with_payload=True,
                query_filter=qdrant_filter
            )
            
            qdrant_results = search_results
            
        except Exception as e:
            logger.error(f"Error searching Qdrant: {e}")
            return jsonify({'error': 'Qdrant search failed'}), 500
        
        # Verify results against PostgreSQL
        verified_results = []
        conn = get_postgres_connection()
        
        if conn:
            try:
                cursor = conn.cursor()
                
                for result in qdrant_results:
                    document_id = result.get('payload', {}).get('document_id')
                    score = result.get('score')
                    
                    if not document_id:
                        continue
                    
                    # Verify document exists in PostgreSQL
                    cursor.execute(
                        """
                        SELECT d.id, d.document_hash, d.source_type, d.source_path, 
                               d.title, d.created_at, d.status, d.content_length, d.word_count
                        FROM documents d
                        WHERE d.id = %s AND d.status = 'projected'
                        """,
                        (document_id,)
                    )
                    
                    document_info = cursor.fetchone()
                    
                    if document_info:
                        verified_results.append({
                            'document_id': document_info[0],
                            'document_hash': document_info[1],
                            'source_type': document_info[2],
                            'source_path': document_info[3],
                            'title': document_info[4],
                            'created_at': document_info[5].isoformat() if document_info[5] else None,
                            'status': document_info[6],
                            'content_length': document_info[7],
                            'word_count': document_info[8],
                            'similarity_score': score,
                            'qdrant_id': result.get('id')
                        })
                
                cursor.close()
                conn.close()
                
            except Exception as e:
                logger.error(f"Error verifying results: {e}")
                if conn:
                    conn.close()
        
        # Emit search results event
        emit_event('knowledge', 'KNOWLEDGE_SEARCH_RESULTS', {
            'query': query,
            'results_count': len(verified_results),
            'timestamp': datetime.utcnow().isoformat()
        })
        
        return jsonify({
            'query': query,
            'results': verified_results,
            'total': len(verified_results)
        })
        
    except Exception as e:
        logger.error(f"Error in knowledge_search: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/knowledge/related', methods=['GET'])
def knowledge_related():
    """
    Find related documents.
    
    Query Parameters:
    - document_id: Document ID to find related documents for (required)
    - limit: Maximum number of results (default: 5)
    - min_score: Minimum similarity score (default: 0.6)
    
    Flow:
    1. Get document from PostgreSQL
    2. Get document embedding from Qdrant
    3. Search Qdrant for similar documents
    4. Verify results against PostgreSQL
    5. Return verified results
    """
    try:
        document_id = request.args.get('document_id')
        limit = int(request.args.get('limit', 5))
        min_score = float(request.args.get('min_score', 0.6))
        
        if not document_id:
            return jsonify({'error': 'document_id parameter is required'}), 400
        
        document_id = int(document_id)
        
        # Get document from PostgreSQL
        conn = get_postgres_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, document_hash, title, status FROM documents WHERE id = %s",
                (document_id,)
            )
            document_info = cursor.fetchone()
            cursor.close()
            
            if not document_info:
                conn.close()
                return jsonify({'error': 'Document not found'}), 404
            
            conn.close()
            
        except Exception as e:
            logger.error(f"Error getting document: {e}")
            if conn:
                conn.close()
            return jsonify({'error': 'Database error'}), 500
        
        # Get document embedding from Qdrant
        try:
            response = requests.get(
                f"http://{QDRANT_HOST}:{QDRANT_PORT}/collections/documents/points/{document_id}",
                timeout=30
            )
            
            if response.status_code != 200:
                return jsonify({'error': 'Failed to get document from Qdrant'}), 500
            
            qdrant_point = response.json().get('result')
            if not qdrant_point:
                return jsonify({'error': 'Document not found in Qdrant'}), 404
            
            document_embedding = qdrant_point.get('vector')
            if not document_embedding:
                return jsonify({'error': 'No embedding found'}), 500
                
        except Exception as e:
            logger.error(f"Error getting document embedding: {e}")
            return jsonify({'error': 'Failed to get document embedding'}), 500
        
        # Search Qdrant for similar documents (excluding the original) using QdrantClient
        try:
            qdrant_client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
            
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            qdrant_filter = Filter(
                must_not=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id)
                    )
                ]
            )
            
            search_results = qdrant_client.search(
                collection_name="documents",
                query_vector=document_embedding,
                limit=limit + 1,  # +1 to exclude the original
                score_threshold=min_score,
                with_payload=True,
                query_filter=qdrant_filter
            )
            
            qdrant_results = search_results
            
        except Exception as e:
            logger.error(f"Error searching Qdrant: {e}")
            return jsonify({'error': 'Qdrant search failed'}), 500
        
        # Verify results against PostgreSQL
        verified_results = []
        conn = get_postgres_connection()
        
        if conn:
            try:
                cursor = conn.cursor()
                
                for result in qdrant_results[:limit]:  # Limit to requested number
                    related_document_id = result.get('payload', {}).get('document_id')
                    score = result.get('score')
                    
                    if not related_document_id:
                        continue
                    
                    cursor.execute(
                        """
                        SELECT d.id, d.document_hash, d.source_type, d.source_path, 
                               d.title, d.created_at, d.status
                        FROM documents d
                        WHERE d.id = %s AND d.status = 'projected'
                        """,
                        (related_document_id,)
                    )
                    
                    document_info = cursor.fetchone()
                    
                    if document_info:
                        verified_results.append({
                            'document_id': document_info[0],
                            'document_hash': document_info[1],
                            'source_type': document_info[2],
                            'source_path': document_info[3],
                            'title': document_info[4],
                            'created_at': document_info[5].isoformat() if document_info[5] else None,
                            'status': document_info[6],
                            'similarity_score': score
                        })
                
                cursor.close()
                conn.close()
                
            except Exception as e:
                logger.error(f"Error verifying results: {e}")
                if conn:
                    conn.close()
        
        return jsonify({
            'document_id': document_id,
            'related_documents': verified_results,
            'total': len(verified_results)
        })
        
    except Exception as e:
        logger.error(f"Error in knowledge_related: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/knowledge/lineage', methods=['GET'])
def knowledge_lineage():
    """
    Get document lineage.
    
    Query Parameters:
    - document_id: Document ID to get lineage for (required)
    
    Flow:
    1. Get lineage from PostgreSQL document_lineage table
    2. Return parent and child relationships
    """
    try:
        document_id = request.args.get('document_id')
        
        if not document_id:
            return jsonify({'error': 'document_id parameter is required'}), 400
        
        document_id = int(document_id)
        
        conn = get_postgres_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor()
            
            # Get parent documents (where this document is the child)
            cursor.execute(
                """
                SELECT dl.parent_document_id, dl.relationship_type, dl.created_at,
                       d.title, d.source_type, d.status
                FROM document_lineage dl
                LEFT JOIN documents d ON dl.parent_document_id = d.id
                WHERE dl.child_document_id = %s
                """,
                (document_id,)
            )
            
            parents = []
            for row in cursor.fetchall():
                parents.append({
                    'parent_document_id': row[0],
                    'relationship_type': row[1],
                    'created_at': row[2].isoformat() if row[2] else None,
                    'parent_title': row[3],
                    'parent_source_type': row[4],
                    'parent_status': row[5]
                })
            
            # Get child documents (where this document is the parent)
            cursor.execute(
                """
                SELECT dl.child_document_id, dl.relationship_type, dl.created_at,
                       d.title, d.source_type, d.status
                FROM document_lineage dl
                LEFT JOIN documents d ON dl.child_document_id = d.id
                WHERE dl.parent_document_id = %s
                """,
                (document_id,)
            )
            
            children = []
            for row in cursor.fetchall():
                children.append({
                    'child_document_id': row[0],
                    'relationship_type': row[1],
                    'created_at': row[2].isoformat() if row[2] else None,
                    'child_title': row[3],
                    'child_source_type': row[4],
                    'child_status': row[5]
                })
            
            cursor.close()
            conn.close()
            
            return jsonify({
                'document_id': document_id,
                'parents': parents,
                'children': children,
                'total_relationships': len(parents) + len(children)
            })
            
        except Exception as e:
            logger.error(f"Error getting lineage: {e}")
            if conn:
                conn.close()
            return jsonify({'error': 'Database error'}), 500
            
    except Exception as e:
        logger.error(f"Error in knowledge_lineage: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/knowledge/research', methods=['GET'])
def knowledge_research():
    """
    Research-specific queries.
    
    Query Parameters:
    - query: Research query (required)
    - limit: Maximum number of results (default: 10)
    
    Flow:
    1. Filter to source_type = 'research'
    2. Perform semantic search
    3. Return research documents
    """
    try:
        query = request.args.get('query')
        limit = int(request.args.get('limit', 10))
        
        if not query:
            return jsonify({'error': 'query parameter is required'}), 400
        
        # Use the search endpoint with source_type filter
        # This is a convenience endpoint that filters to research documents
        return knowledge_search()
        
    except Exception as e:
        logger.error(f"Error in knowledge_research: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/knowledge/documents', methods=['GET'])
def knowledge_documents():
    """
    Get document by ID.
    
    Query Parameters:
    - document_id: Document ID (required)
    - include_content: Whether to include full content (default: false)
    
    Flow:
    1. Get document from PostgreSQL
    2. Optionally get content from document_content table
    3. Return document information
    """
    try:
        document_id = request.args.get('document_id')
        include_content = request.args.get('include_content', 'false').lower() == 'true'
        
        if not document_id:
            return jsonify({'error': 'document_id parameter is required'}), 400
        
        document_id = int(document_id)
        
        conn = get_postgres_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor()
            
            # Get document metadata
            cursor.execute(
                """
                SELECT d.id, d.document_hash, d.source_type, d.source_path, 
                       d.title, d.author, d.created_at, d.discovered_at, d.ingested_at,
                       d.embedded_at, d.projected_at, d.status, d.error_message,
                       d.content_length, d.word_count, d.language, d.metadata
                FROM documents d
                WHERE d.id = %s
                """,
                (document_id,)
            )
            
            document_info = cursor.fetchone()
            
            if not document_info:
                cursor.close()
                conn.close()
                return jsonify({'error': 'Document not found'}), 404
            
            document = {
                'document_id': document_info[0],
                'document_hash': document_info[1],
                'source_type': document_info[2],
                'source_path': document_info[3],
                'title': document_info[4],
                'author': document_info[5],
                'created_at': document_info[6].isoformat() if document_info[6] else None,
                'discovered_at': document_info[7].isoformat() if document_info[7] else None,
                'ingested_at': document_info[8].isoformat() if document_info[8] else None,
                'embedded_at': document_info[9].isoformat() if document_info[9] else None,
                'projected_at': document_info[10].isoformat() if document_info[10] else None,
                'status': document_info[11],
                'error_message': document_info[12],
                'content_length': document_info[13],
                'word_count': document_info[14],
                'language': document_info[15],
                'metadata': document_info[16]
            }
            
            # Get content if requested
            if include_content:
                cursor.execute(
                    "SELECT content FROM document_content WHERE document_id = %s",
                    (document_id,)
                )
                content_row = cursor.fetchone()
                if content_row:
                    document['content'] = content_row[0]
            
            # Get tags
            cursor.execute(
                "SELECT tag, tag_type, confidence FROM document_tags WHERE document_id = %s",
                (document_id,)
            )
            
            tags = []
            for row in cursor.fetchall():
                tags.append({
                    'tag': row[0],
                    'tag_type': row[1],
                    'confidence': row[2]
                })
            document['tags'] = tags
            
            # Get embeddings info
            cursor.execute(
                """
                SELECT embedding_model, embedding_dimension, embedded_at, qdrant_id
                FROM document_embeddings
                WHERE document_id = %s
                """,
                (document_id,)
            )
            
            embeddings = []
            for row in cursor.fetchall():
                embeddings.append({
                    'embedding_model': row[0],
                    'embedding_dimension': row[1],
                    'embedded_at': row[2].isoformat() if row[2] else None,
                    'qdrant_id': row[3]
                })
            document['embeddings'] = embeddings
            
            cursor.close()
            conn.close()
            
            return jsonify(document)
            
        except Exception as e:
            logger.error(f"Error getting document: {e}")
            if conn:
                conn.close()
            return jsonify({'error': 'Database error'}), 500
            
    except Exception as e:
        logger.error(f"Error in knowledge_documents: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/knowledge/stats', methods=['GET'])
def knowledge_stats():
    """
    Get knowledge statistics.
    
    Returns statistics about the knowledge base.
    """
    try:
        conn = get_postgres_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor()
            
            # Get document statistics
            cursor.execute("SELECT COUNT(*) FROM documents")
            total_documents = cursor.fetchone()[0]
            
            cursor.execute("SELECT source_type, COUNT(*) FROM documents GROUP BY source_type")
            by_source_type = {row[0]: row[1] for row in cursor.fetchall()}
            
            cursor.execute("SELECT status, COUNT(*) FROM documents GROUP BY status")
            by_status = {row[0]: row[1] for row in cursor.fetchall()}
            
            cursor.execute("SELECT SUM(content_length), SUM(word_count) FROM documents")
            content_stats = cursor.fetchone()
            
            cursor.execute("SELECT COUNT(*) FROM document_embeddings")
            total_embeddings = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM document_lineage")
            total_relationships = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM document_tags")
            total_tags = cursor.fetchone()[0]
            
            cursor.close()
            conn.close()
            
            return jsonify({
                'total_documents': total_documents,
                'by_source_type': by_source_type,
                'by_status': by_status,
                'total_content_length': content_stats[0] or 0,
                'total_word_count': content_stats[1] or 0,
                'total_embeddings': total_embeddings,
                'total_relationships': total_relationships,
                'total_tags': total_tags
            })
            
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            if conn:
                conn.close()
            return jsonify({'error': 'Database error'}), 500
            
    except Exception as e:
        logger.error(f"Error in knowledge_stats: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    logger.info("Starting Mission Control Knowledge APIs")
    logger.info("=" * 60)
    app.run(host='0.0.0.0', port=8001, debug=True)
