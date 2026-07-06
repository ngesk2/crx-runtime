"""
Google Drive Ingestion Worker

Polls Google Drive for changes and emits document events.
Phase 1: Metadata-only ingestion (no content extraction yet)
"""

import os
import sys
import json
import time
import logging
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent / 'adapters'))
sys.path.append(str(Path(__file__).parent.parent / 'constitutional'))

import psycopg2
from psycopg2.extras import Json
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
CREDENTIALS_PATH = Path('./credentials/client_secret.json')
TOKEN_PATH = Path('./credentials/drive_token.json')

# Constitutional: Use SecretAdapter for secret access
from secret_adapter import get_secret_adapter


class DriveIngestor:
    """Google Drive ingestion worker."""
    
    def __init__(self):
        self.service = None
        self.conn = None
        self.cursor = None
        self.last_sync_time = None
        self.seen_files = set()
        
        # Constitutional: Use SecretAdapter for secret access
        self.secret_adapter = get_secret_adapter()
        
        # Get PostgreSQL config from SecretAdapter
        postgres_config = self.secret_adapter.get_postgres_config()
        self.postgres_host = postgres_config.get('host', 'localhost')
        self.postgres_port = postgres_config.get('port', '5432')
        self.postgres_db = postgres_config.get('database', 'crx_runtime')
        self.postgres_user = postgres_config.get('user', 'postgres')
        self.postgres_password = postgres_config.get('password', '')
        self.file_metadata = {}  # Track file metadata for modification detection
        
    def authenticate(self) -> bool:
        """Authenticate with Google Drive API."""
        try:
            creds = None
            
            # Load existing token if available
            if TOKEN_PATH.exists():
                creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
            
            # If no valid credentials, get new ones
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                else:
                    if not CREDENTIALS_PATH.exists():
                        logger.error(f"Credentials file not found: {CREDENTIALS_PATH}")
                        return False
                    
                    flow = InstalledAppFlow.from_client_secrets_file(
                        str(CREDENTIALS_PATH), SCOPES
                    )
                    creds = flow.run_local_server(port=0)
                
                # Save credentials for next run
                with open(TOKEN_PATH, 'w') as token:
                    token.write(creds.to_json())
            
            # Build Drive service
            self.service = build('drive', 'v3', credentials=creds)
            logger.info("Successfully authenticated with Google Drive")
            return True
            
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            return False
    
    def connect_postgres(self) -> bool:
        """Connect to PostgreSQL using RepositoryAdapter pool."""
        try:
            from runtime.adapters.repository_adapter import get_repository_connection
            self.conn = get_repository_connection()
            self.cursor = self.conn.cursor()
            logger.info("Successfully connected to PostgreSQL")
            return True
        except Exception as e:
            logger.error(f"PostgreSQL connection failed: {e}")
            return False
    
    def get_drive_files(self) -> List[Dict]:
        """List all files from Google Drive."""
        try:
            results = self.service.files().list(
                pageSize=1000,
                fields="nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, size, parents)"
            ).execute()
            
            files = results.get('files', [])
            logger.info(f"Found {len(files)} files in Google Drive")
            return files
            
        except HttpError as e:
            logger.error(f"Google Drive API error: {e}")
            return []
    
    def emit_document_event(self, event_type: str, file_data: Dict) -> bool:
        """
        Emit a document event to the event log.
        
        Constitutional Note: Google Drive is NOT authoritative truth.
        External sources emit IMPORTED events, not CREATED events.
        Truth classification: CLAIMED (untrusted input requiring validation)
        """
        try:
            event_id = str(uuid.uuid4())
            timestamp = datetime.utcnow().isoformat()
            
            event = {
                'event_id': event_id,
                'event_type': event_type,
                'timestamp': timestamp,
                'aggregate_id': file_data['id'],
                'aggregate_type': 'document',
                'event_data': {
                    'source': 'google_drive',
                    'document_id': file_data['id'],
                    'title': file_data['name'],
                    'mime_type': file_data['mimeType'],
                    'created_time': file_data.get('createdTime'),
                    'modified_time': file_data.get('modifiedTime'),
                    'size': file_data.get('size'),
                    'parents': file_data.get('parents', []),
                    'truth_classification': 'CLAIMED'  # External source, not authoritative
                }
            }
            
            # Insert into events table
            query = """
                INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            
            self.cursor.execute(query, (
                event_id,
                event_type,
                timestamp,
                file_data['id'],
                'document',
                Json(event['event_data'])
            ))
            
            self.conn.commit()
            logger.info(f"Emitted {event_type} for document: {file_data['name']}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to emit event: {e}")
            self.conn.rollback()
            return False
    
    def sync_drive(self):
        """Sync Google Drive with event log."""
        logger.info("Starting Google Drive sync...")
        
        # Get current files from Drive
        drive_files = self.get_drive_files()
        drive_file_ids = {f['id'] for f in drive_files}
        
        # Detect new files and modifications
        for file_data in drive_files:
            file_id = file_data['id']
            current_modified_time = file_data.get('modifiedTime')
            
            if file_id not in self.seen_files:
                # New file - emit IMPORTED event (not CREATED, Drive is not authoritative truth)
                self.emit_document_event('DOCUMENT_IMPORTED', file_data)
                self.seen_files.add(file_id)
                self.file_metadata[file_id] = current_modified_time
            elif file_id in self.file_metadata:
                # Check for modification
                if self.file_metadata[file_id] != current_modified_time:
                    self.emit_document_event('DOCUMENT_UPDATED', file_data)
                    self.file_metadata[file_id] = current_modified_time
            else:
                # File seen but no metadata tracked (migration case)
                self.file_metadata[file_id] = current_modified_time
        
        # Detect deleted files
        deleted_files = self.seen_files - drive_file_ids
        for file_id in deleted_files:
            # We don't have full file data for deleted files, emit with minimal info
            self.emit_document_event('DOCUMENT_DELETED', {
                'id': file_id,
                'name': 'DELETED',
                'mimeType': 'unknown'
            })
            self.seen_files.remove(file_id)
            if file_id in self.file_metadata:
                del self.file_metadata[file_id]
        
        logger.info(f"Sync complete. New files: {len(drive_file_ids - self.seen_files)}, Deleted files: {len(deleted_files)}")
    
    def run_once(self):
        """Run a single sync iteration."""
        if not self.authenticate():
            logger.error("Authentication failed, aborting")
            return
        
        if not self.connect_postgres():
            logger.error("PostgreSQL connection failed, aborting")
            return
        
        try:
            self.sync_drive()
        finally:
            if hasattr(self, '_conn_ctx') and self._conn_ctx:
                self._conn_ctx.__exit__(None, None, None)
                self._conn_ctx = None
    
    def run_continuous(self, interval_seconds: int = 300):
        """Run continuous polling."""
        logger.info(f"Starting continuous polling (interval: {interval_seconds}s)")
        
        while True:
            try:
                self.run_once()
                time.sleep(interval_seconds)
            except KeyboardInterrupt:
                logger.info("Stopping continuous polling")
                break
            except Exception as e:
                logger.error(f"Error in polling loop: {e}")
                time.sleep(interval_seconds)


def main():
    """Main entry point."""
    ingestor = DriveIngestor()
    
    # For initial testing, run once
    ingestor.run_once()
    
    # For production, use continuous polling:
    # ingestor.run_continuous(interval_seconds=300)


if __name__ == '__main__':
    import uuid
    main()
