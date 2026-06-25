"""
Google Drive Ingestion Worker
PING Constitutional Stabilization Phase E
Date: 2026-06-22

Flow: Drive → Observation Event → Postgres → Projection Worker → Qdrant → Open WebUI
"""

import os
import logging
import psycopg2
from psycopg2 import sql
from datetime import datetime
from typing import Dict, List, Optional
import hashlib
import json
import uuid

# Google Drive API imports
try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseDownload
    GOOGLE_DRIVE_AVAILABLE = True
except ImportError:
    GOOGLE_DRIVE_AVAILABLE = False
    logging.warning("Google Drive libraries not installed. Install: pip install google-api-python-client google-auth-oauthlib")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# PostgreSQL configuration
POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
POSTGRES_DB = os.getenv('POSTGRES_DB', 'crx_runtime')
POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', '')

# Google Drive configuration
GOOGLE_DRIVE_CREDENTIALS_PATH = os.getenv('GOOGLE_DRIVE_CREDENTIALS_PATH', 'credentials.json')
GOOGLE_DRIVE_TOKEN_PATH = os.getenv('GOOGLE_DRIVE_TOKEN_PATH', 'token.json')
GOOGLE_DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.readonly']


class GoogleDriveIngestion:
    """Google Drive ingestion worker."""
    
    def __init__(self):
        self.postgres_conn = self._get_postgres_connection()
        self.drive_service = None
        
        if GOOGLE_DRIVE_AVAILABLE:
            self._init_drive_service()
    
    def _get_postgres_connection(self):
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
    
    def _init_drive_service(self):
        """Initialize Google Drive service."""
        try:
            creds = None
            
            # Load existing token
            if os.path.exists(GOOGLE_DRIVE_TOKEN_PATH):
                creds = Credentials.from_authorized_user_file(GOOGLE_DRIVE_TOKEN_PATH, GOOGLE_DRIVE_SCOPES)
            
            # If no valid credentials, get new ones
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                else:
                    if not os.path.exists(GOOGLE_DRIVE_CREDENTIALS_PATH):
                        logger.error(f"Google Drive credentials file not found: {GOOGLE_DRIVE_CREDENTIALS_PATH}")
                        return
                    
                    flow = InstalledAppFlow.from_client_secrets_file(
                        GOOGLE_DRIVE_CREDENTIALS_PATH, GOOGLE_DRIVE_SCOPES
                    )
                    creds = flow.run_local_server(port=0)
                
                # Save credentials
                with open(GOOGLE_DRIVE_TOKEN_PATH, 'w') as token:
                    token.write(creds.to_json())
            
            self.drive_service = build('drive', 'v3', credentials=creds)
            logger.info("Google Drive service initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize Google Drive service: {e}")
    
    def _emit_observation_event(self, event_type: str, payload: Dict):
        """Emit observation event to PostgreSQL."""
        if not self.postgres_conn:
            logger.error("PostgreSQL connection not available")
            return False
        
        try:
            cursor = self.postgres_conn.cursor()
            
            # Generate payload hash
            payload_json = json.dumps(payload, sort_keys=True)
            payload_hash = hashlib.sha256(payload_json.encode()).hexdigest()
            
            # Insert event
            stream = 'google_drive'
            insert_query = sql.SQL("""
                INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data, payload_hash, projected_to_qdrant)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """)
            
            cursor.execute(insert_query, (
                uuid.uuid4(),
                event_type,
                datetime.utcnow(),
                uuid.uuid5(uuid.NAMESPACE_DNS, f"stream.{stream}"),
                stream,
                json.dumps(payload),
                payload_hash,
                False
            ))
            
            self.postgres_conn.commit()
            logger.info(f"Emitted observation event: {event_type}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to emit observation event: {e}")
            if self.postgres_conn:
                self.postgres_conn.rollback()
            return False
    
    def _ensure_observation_table(self):
        """Ensure observation table exists."""
        if not self.postgres_conn:
            return False
        
        try:
            cursor = self.postgres_conn.cursor()
            
            create_table = sql.SQL("""
                CREATE TABLE IF NOT EXISTS google_drive_observations (
                    id SERIAL PRIMARY KEY,
                    drive_id TEXT UNIQUE NOT NULL,
                    file_name TEXT NOT NULL,
                    file_type TEXT NOT NULL,
                    content TEXT,
                    observed_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    event_id UUID,
                    CONSTRAINT fk_event FOREIGN KEY (event_id) REFERENCES events(id)
                )
            """)
            
            cursor.execute(create_table)
            self.postgres_conn.commit()
            logger.info("Observation table ensured")
            return True
            
        except Exception as e:
            logger.error(f"Failed to ensure observation table: {e}")
            if self.postgres_conn:
                self.postgres_conn.rollback()
            return False
    
    def list_documents(self, folder_id: Optional[str] = None) -> List[Dict]:
        """List documents from Google Drive."""
        if not self.drive_service:
            logger.error("Google Drive service not available")
            return []
        
        try:
            query = f"'{folder_id}' in parents" if folder_id else ""
            
            results = self.drive_service.files().list(
                q=query,
                pageSize=100,
                fields="nextPageToken, files(id, name, mimeType, modifiedTime)"
            ).execute()
            
            files = results.get('files', [])
            
            # Filter for supported types
            supported_types = [
                'application/vnd.google-apps.document',  # Google Docs
                'application/pdf',  # PDF
                'text/markdown',  # Markdown
                'text/plain'  # Plain text
            ]
            
            documents = [f for f in files if f['mimeType'] in supported_types]
            logger.info(f"Found {len(documents)} supported documents")
            
            return documents
            
        except Exception as e:
            logger.error(f"Failed to list documents: {e}")
            return []
    
    def ingest_document(self, drive_id: str, file_name: str, file_type: str) -> bool:
        """Ingest a single document from Google Drive."""
        if not self.drive_service:
            logger.error("Google Drive service not available")
            return False
        
        try:
            # Download document content
            if file_type == 'application/vnd.google-apps.document':
                # Export Google Docs as text
                request = self.drive_service.files().export_media(
                    fileId=drive_id,
                    mimeType='text/plain'
                )
            else:
                # Download other file types
                request = self.drive_service.files().get_media(fileId=drive_id)
            
            import io
            fh = io.BytesIO()
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while done is False:
                status, done = downloader.next_chunk()
            
            content = fh.getvalue().decode('utf-8')
            
            # Emit observation event
            payload = {
                'drive_id': drive_id,
                'file_name': file_name,
                'file_type': file_type,
                'content': content,
                'observed_at': datetime.utcnow().isoformat()
            }
            
            success = self._emit_observation_event('DOCUMENT_OBSERVED', payload)
            
            if success:
                # Store in observation table
                self._ensure_observation_table()
                cursor = self.postgres_conn.cursor()
                
                insert_obs = sql.SQL("""
                    INSERT INTO google_drive_observations (drive_id, file_name, file_type, content, observed_at)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (drive_id) DO UPDATE SET
                        file_name = EXCLUDED.file_name,
                        file_type = EXCLUDED.file_type,
                        content = EXCLUDED.content,
                        observed_at = EXCLUDED.observed_at
                """)
                
                cursor.execute(insert_obs, (
                    drive_id,
                    file_name,
                    file_type,
                    content,
                    datetime.utcnow()
                ))
                
                self.postgres_conn.commit()
                logger.info(f"Ingested document: {file_name}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to ingest document: {e}")
            return False
    
    def run_ingestion_cycle(self, folder_id: Optional[str] = None):
        """Run一个 ingestion cycle."""
        logger.info("Starting Google Drive ingestion cycle")
        
        if not GOOGLE_DRIVE_AVAILABLE:
            logger.error("Google Drive libraries not available")
            return
        
        if not self.drive_service:
            logger.error("Google Drive service not initialized")
            return
        
        # List documents
        documents = self.list_documents(folder_id)
        
        # Ingest each document
        success_count = 0
        for doc in documents:
            success = self.ingest_document(
                doc['id'],
                doc['name'],
                doc['mimeType']
            )
            if success:
                success_count += 1
        
        logger.info(f"Ingestion cycle complete: {success_count}/{len(documents)} documents")
    
    def close(self):
        """Close connections."""
        if self.postgres_conn:
            self.postgres_conn.close()


if __name__ == "__main__":
    import time
    
    ingestion = GoogleDriveIngestion()
    
    try:
        # Run initial ingestion
        ingestion.run_ingestion_cycle()
        
        # Perpetual loop
        while True:
            logger.info("Sleeping for 300 seconds (5 minutes)...")
            time.sleep(300)
            ingestion.run_ingestion_cycle()
            
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    finally:
        ingestion.close()
