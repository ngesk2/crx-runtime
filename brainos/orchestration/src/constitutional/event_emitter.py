"""
Event Emitter
PING CONSTITUTIONAL STABILIZATION PHASE C
Date: 2026-06-14

This module provides a single function emit_event() for recording mutations
to the constitutional event log without modifying runtime behavior.
"""

import os
import json
import uuid
import logging
from datetime import datetime
from typing import Dict, Any, Optional
import psycopg2
from psycopg2 import sql
from psycopg2.extras import Json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# PostgreSQL connection configuration
POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
POSTGRES_DB = os.getenv('POSTGRES_DB', 'crx_runtime')
POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', '')


def get_postgres_connection():
    """
    Get a PostgreSQL connection.
    
    Returns:
        psycopg2.connection or None if connection fails
    """
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


def emit_event(stream: str, event_type: str, payload: Dict[str, Any], causation_id: Optional[str] = None, correlation_id: Optional[str] = None) -> bool:
    """
    Emit an event to the constitutional event log (CQRS schema).
    
    This function:
    - Inserts into PostgreSQL using CQRS columns
    - Never modifies runtime behavior
    - Never throws fatal exceptions
    - Fails safely
    - Logs failures
    
    Args:
        stream: The event stream (mapped to aggregate_type)
        event_type: The type of event
        payload: The event payload as a dictionary (stored as event_data)
        causation_id: Optional UUID of the event that caused this one
        correlation_id: Optional UUID for correlating related events
    
    Returns:
        bool: True if event was emitted successfully, False otherwise
    """
    try:
        # Validate inputs
        if not stream:
            logger.error("Event emission failed: stream is empty")
            return False
        
        if not event_type:
            logger.error("Event emission failed: event_type is empty")
            return False
        
        if not payload:
            logger.error("Event emission failed: payload is empty")
            return False
        
        # Add timestamp to payload if not present
        if 'timestamp' not in payload:
            payload['timestamp'] = datetime.utcnow().isoformat()
        
        # Get PostgreSQL connection
        conn = get_postgres_connection()
        if not conn:
            logger.error(f"Event emission failed: could not connect to PostgreSQL")
            return False
        
        try:
            # Generate deterministic aggregate_id from stream name
            aggregate_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"stream.{stream}")
            event_id = uuid.uuid4()
            now = datetime.utcnow()
            
            cursor = conn.cursor()
            query = sql.SQL("""
                INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data, causation_id, correlation_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """)
            
            cursor.execute(query, (
                event_id,
                event_type,
                now,
                aggregate_id,
                stream,
                Json(payload),
                causation_id,
                correlation_id
            ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            logger.info(f"Event emitted: event_id={event_id}, stream={stream}, event_type={event_type}")
            return True
            
        except Exception as e:
            logger.error(f"Event emission failed (database error): {e}")
            if conn:
                conn.rollback()
                conn.close()
            return False
            
    except Exception as e:
        # This catch-all ensures we never throw fatal exceptions
        logger.error(f"Event emission failed (unexpected error): {e}")
        return False


def emit_event_sync(stream: str, event_type: str, payload: Dict[str, Any], causation_id: Optional[str] = None, correlation_id: Optional[str] = None) -> bool:
    """
    Synchronous wrapper for emit_event.
    
    This is provided for convenience in synchronous contexts.
    
    Args:
        stream: The event stream
        event_type: The type of event
        payload: The event payload
        causation_id: Optional UUID of the event that caused this one
        correlation_id: Optional UUID for correlating related events
    
    Returns:
        bool: True if event was emitted successfully, False otherwise
    """
    return emit_event(stream, event_type, payload, causation_id, correlation_id)


# Supported streams
SUPPORTED_STREAMS = [
    'rss',
    'yahoo',
    'ollama',
    'gateway',
    'replay',
    'storage'
]


def validate_stream(stream: str) -> bool:
    """
    Validate that a stream is supported.
    
    Args:
        stream: The stream to validate
    
    Returns:
        bool: True if stream is supported, False otherwise
    """
    return stream in SUPPORTED_STREAMS


# Event type constants for common events
ARTICLE_CREATED = 'ARTICLE_CREATED'
ARTICLE_UPDATED = 'ARTICLE_UPDATED'
MARKDOWN_WRITTEN = 'MARKDOWN_WRITTEN'
NEWSLETTER_CREATED = 'NEWSLETTER_CREATED'
DIGEST_GENERATED = 'DIGEST_GENERATED'
ARCHIVE_WRITTEN = 'ARCHIVE_WRITTEN'
INFERENCE_REQUEST = 'INFERENCE_REQUEST'
INFERENCE_RESPONSE = 'INFERENCE_RESPONSE'


# Helper functions for common events
def emit_article_created(article: Dict[str, Any]) -> bool:
    """
    Emit an ARTICLE_CREATED event.
    
    Args:
        article: The article dictionary
    
    Returns:
        bool: True if event was emitted successfully, False otherwise
    """
    return emit_event('rss', ARTICLE_CREATED, article)


def emit_article_updated(article: Dict[str, Any]) -> bool:
    """
    Emit an ARTICLE_UPDATED event.
    
    Args:
        article: The article dictionary
    
    Returns:
        bool: True if event was emitted successfully, False otherwise
    """
    return emit_event('rss', ARTICLE_UPDATED, article)


def emit_markdown_written(markdown_path: str, content: str) -> bool:
    """
    Emit a MARKDOWN_WRITTEN event.
    
    Args:
        markdown_path: The path to the markdown file
        content: The content of the markdown file
    
    Returns:
        bool: True if event was emitted successfully, False otherwise
    """
    return emit_event('rss', MARKDOWN_WRITTEN, {
        'path': markdown_path,
        'content_length': len(content),
        'timestamp': datetime.utcnow().isoformat()
    })


def emit_newsletter_created(newsletter: Dict[str, Any]) -> bool:
    """
    Emit a NEWSLETTER_CREATED event.
    
    Args:
        newsletter: The newsletter dictionary
    
    Returns:
        bool: True if event was emitted successfully, False otherwise
    """
    return emit_event('yahoo', NEWSLETTER_CREATED, newsletter)


def emit_digest_generated(digest: Dict[str, Any]) -> bool:
    """
    Emit a DIGEST_GENERATED event.
    
    Args:
        digest: The digest dictionary
    
    Returns:
        bool: True if event was emitted successfully, False otherwise
    """
    return emit_event('yahoo', DIGEST_GENERATED, digest)


def emit_archive_written(archive_path: str, content: str) -> bool:
    """
    Emit an ARCHIVE_WRITTEN event.
    
    Args:
        archive_path: The path to the archive file
        content: The content of the archive file
    
    Returns:
        bool: True if event was emitted successfully, False otherwise
    """
    return emit_event('yahoo', ARCHIVE_WRITTEN, {
        'path': archive_path,
        'content_length': len(content),
        'timestamp': datetime.utcnow().isoformat()
    })


def emit_inference_request(model: str, messages: list, request_hash: str) -> bool:
    """
    Emit an INFERENCE_REQUEST event.
    
    Args:
        model: The model name
        messages: The messages sent to the model
        request_hash: The hash of the request
    
    Returns:
        bool: True if event was emitted successfully, False otherwise
    """
    return emit_event('gateway', INFERENCE_REQUEST, {
        'model': model,
        'message_count': len(messages),
        'request_hash': request_hash,
        'timestamp': datetime.utcnow().isoformat()
    })


def emit_inference_response(model: str, response: str, response_hash: str, duration_ms: int) -> bool:
    """
    Emit an INFERENCE_RESPONSE event.
    
    Args:
        model: The model name
        response: The response from the model
        response_hash: The hash of the response
        duration_ms: The duration of the inference in milliseconds
    
    Returns:
        bool: True if event was emitted successfully, False otherwise
    """
    return emit_event('gateway', INFERENCE_RESPONSE, {
        'model': model,
        'response_length': len(response),
        'response_hash': response_hash,
        'duration_ms': duration_ms,
        'timestamp': datetime.utcnow().isoformat()
    })


def emit_raw_rss_payload(source_url: str, payload: str) -> bool:
    """
    Emit a RAW_RSS_PAYLOAD event for raw input preservation.
    
    Args:
        source_url: The RSS feed URL
        payload: The raw RSS payload
    
    Returns:
        bool: True if event was emitted successfully, False otherwise
    """
    return emit_event('rss', 'RAW_RSS_PAYLOAD', {
        'source_url': source_url,
        'payload_length': len(payload),
        'payload': payload[:10000],  # Truncate to 10k chars for storage
        'timestamp': datetime.utcnow().isoformat()
    })


def emit_raw_yahoo_payload(message_id: str, payload: str) -> bool:
    """
    Emit a RAW_YAHOO_PAYLOAD event for raw input preservation.
    
    Args:
        message_id: The Yahoo message ID
        payload: The raw Yahoo payload
    
    Returns:
        bool: True if event was emitted successfully, False otherwise
    """
    return emit_event('yahoo', 'RAW_YAHOO_PAYLOAD', {
        'message_id': message_id,
        'payload_length': len(payload),
        'payload': payload[:10000],  # Truncate to 10k chars for storage
        'timestamp': datetime.utcnow().isoformat()
    })


def emit_article_processing_failed(url: str, error: str, source: str) -> bool:
    """
    Emit an ARTICLE_PROCESSING_FAILED event.
    
    Args:
        url: The article URL
        error: The error message
        source: The source of the error
    
    Returns:
        bool: True if event was emitted successfully, False otherwise
    """
    return emit_event('rss', 'ARTICLE_PROCESSING_FAILED', {
        'url': url,
        'error': error,
        'source': source,
        'timestamp': datetime.utcnow().isoformat()
    })


def emit_newsletter_processing_failed(message_id: str, error: str, source: str) -> bool:
    """
    Emit a NEWSLETTER_PROCESSING_FAILED event.
    
    Args:
        message_id: The newsletter message ID
        error: The error message
        source: The source of the error
    
    Returns:
        bool: True if event was emitted successfully, False otherwise
    """
    return emit_event('yahoo', 'NEWSLETTER_PROCESSING_FAILED', {
        'message_id': message_id,
        'error': error,
        'source': source,
        'timestamp': datetime.utcnow().isoformat()
    })


def emit_inference_failed(model: str, error: str, source: str) -> bool:
    """
    Emit an INFERENCE_FAILED event.
    
    Args:
        model: The model name
        error: The error message
        source: The source of the error
    
    Returns:
        bool: True if event was emitted successfully, False otherwise
    """
    return emit_event('gateway', 'INFERENCE_FAILED', {
        'model': model,
        'error': error,
        'source': source,
        'timestamp': datetime.utcnow().isoformat()
    })


def emit_archive_write_failed(path: str, error: str, source: str) -> bool:
    """
    Emit an ARCHIVE_WRITE_FAILED event.
    
    Args:
        path: The archive path
        error: The error message
        source: The source of the error
    
    Returns:
        bool: True if event was emitted successfully, False otherwise
    """
    return emit_event('storage', 'ARCHIVE_WRITE_FAILED', {
        'path': path,
        'error': error,
        'source': source,
        'timestamp': datetime.utcnow().isoformat()
    })


def emit_database_write_failed(table: str, error: str, source: str) -> bool:
    """
    Emit a DATABASE_WRITE_FAILED event.
    
    Args:
        table: The database table
        error: The error message
        source: The source of the error
    
    Returns:
        bool: True if event was emitted successfully, False otherwise
    """
    return emit_event('storage', 'DATABASE_WRITE_FAILED', {
        'table': table,
        'error': error,
        'source': source,
        'timestamp': datetime.utcnow().isoformat()
    })
