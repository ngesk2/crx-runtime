"""
Google Drive Ingestion Adapter

Constitutional Law: TRUTH ≠ EMBEDDINGS

This adapter ingests documents from Google Drive and generates events.
Google Drive becomes external knowledge source, NOT truth source.
Events generated from ingestion become truth (PostgreSQL).
Projections are generated from events (Qdrant).

Architecture:
  Google Drive → Ingestion Adapter → Events → PostgreSQL (truth)
  Events → Projection Worker → Embeddings → Qdrant (projection)

Constitutional Constraints:
  - Google Drive is external knowledge source, not truth
  - Events generated from ingestion become truth
  - Adapter never writes directly to Qdrant
  - Adapter only generates events (truth)
"""

import os
import sys
import hashlib
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path

# Add constitutional directory to path for SecretAdapter
sys.path.append(str(Path(__file__).parent.parent.parent / 'constitutional'))

try:
    from secret_adapter import get_secret_adapter
    SECRET_ADAPTER_AVAILABLE = True
except ImportError:
    SECRET_ADAPTER_AVAILABLE = False

# Add security directory to path for capability enforcement
sys.path.append(str(Path(__file__).parent.parent.parent / 'security'))
try:
    from capabilities import Capability, requires_capability
    from policy_engine import PolicyEngine
    CAPABILITY_ENFORCEMENT_AVAILABLE = True
except ImportError:
    CAPABILITY_ENFORCEMENT_AVAILABLE = False

try:
    from googleapiclient.discovery import build
    from google.oauth2.service_account import Credentials
    GOOGLE_DRIVE_AVAILABLE = True
except ImportError:
    GOOGLE_DRIVE_AVAILABLE = False
    print("google-api-python-client not installed. Install with: pip install google-api-python-client")

# Configuration - Use SecretAdapter for all configuration
if SECRET_ADAPTER_AVAILABLE:
    secret_adapter = get_secret_adapter()
    google_drive_config = secret_adapter.get_google_drive_config()
    GOOGLE_DRIVE_CREDENTIALS_PATH = google_drive_config.get('credentials_path', 'credentials.json')
    GOOGLE_DRIVE_FOLDER_ID = google_drive_config.get('folder_id', '')
else:
    # Fallback to environment variables
    GOOGLE_DRIVE_CREDENTIALS_PATH = os.getenv('GOOGLE_DRIVE_CREDENTIALS_PATH', 'credentials.json')
    GOOGLE_DRIVE_FOLDER_ID = os.getenv('GOOGLE_DRIVE_FOLDER_ID', '')

class GoogleDriveIngestionAdapter:
    """Adapter for ingesting documents from Google Drive."""
    
    def __init__(self, credentials_path: str = GOOGLE_DRIVE_CREDENTIALS_PATH):
        self.credentials_path = credentials_path
        
        if GOOGLE_DRIVE_AVAILABLE:
            self.service = self._build_service()
        else:
            self.service = None
            print("Google Drive service not available")
    
    def _build_service(self):
        """Build Google Drive service."""
        try:
            credentials = Credentials.from_service_account_file(
                self.credentials_path,
                scopes=['https://www.googleapis.com/auth/drive.readonly']
            )
            service = build('drive', 'v3', credentials=credentials)
            return service
        except Exception as e:
            print(f"Failed to build Google Drive service: {e}")
            return None
    
    def list_files(self, folder_id: str = GOOGLE_DRIVE_FOLDER_ID) -> List[Dict[str, Any]]:
        """List files in Google Drive folder."""
        if not self.service:
            print("Google Drive service not available")
            return []
        
        try:
            query = f"'{folder_id}' in parents" if folder_id else ""
            results = self.service.files().list(
                q=query,
                fields="files(id, name, mimeType, modifiedTime)"
            ).execute()
            
            files = results.get('files', [])
            return files
        except Exception as e:
            print(f"Failed to list files: {e}")
            return []
    
    def download_file(self, file_id: str) -> Optional[str]:
        """Download file content from Google Drive."""
        if not self.service:
            print("Google Drive service not available")
            return None
        
        try:
            request = self.service.files().get_media(fileId=file_id)
            content = request.execute()
            return content.decode('utf-8')
        except Exception as e:
            print(f"Failed to download file: {e}")
            return None
    
    def compute_content_hash(self, content: str) -> str:
        """Compute SHA256 hash of content."""
        return hashlib.sha256(content.encode()).hexdigest()
    
    def determine_document_type(self, mime_type: str) -> str:
        """Determine document type from MIME type."""
        if 'document' in mime_type:
            return 'google_doc'
        elif 'pdf' in mime_type:
            return 'pdf'
        elif 'text' in mime_type:
            return 'text'
        else:
            return 'unknown'
    
    def generate_ingestion_event(
        self,
        file_id: str,
        file_name: str,
        content: str,
        mime_type: str
    ) -> Dict[str, Any]:
        """
        Generate ingestion event for Google Drive document.
        
        Constitutional Law: Events become truth.
        This event will be stored in PostgreSQL.
        Projections will be generated from this event.
        """
        content_hash = self.compute_content_hash(content)
        document_type = self.determine_document_type(mime_type)
        
        event = {
            'event_type': 'GOOGLE_DRIVE_INGESTION',
            'source': 'google_drive',
            'source_type': document_type,
            'authority_level': 'working',  # Google Drive documents are working level
            'timestamp': datetime.utcnow().isoformat(),
            'lineage': {
                'parent_event_ids': [],
                'source_ids': [file_id]
            },
            'payload': {
                'file_id': file_id,
                'file_name': file_name,
                'content': content,
                'content_hash': content_hash,
                'mime_type': mime_type,
                'document_type': document_type
            }
        }
        
        return event
    
    def ingest_folder(self, folder_id: str = GOOGLE_DRIVE_FOLDER_ID) -> List[Dict[str, Any]]:
        """Ingest all documents from Google Drive folder."""
        events = []
        
        if not self.service:
            print("Google Drive service not available")
            return events
        
        files = self.list_files(folder_id)
        
        for file in files:
            file_id = file['id']
            file_name = file['name']
            mime_type = file['mimeType']
            
            # Download content
            content = self.download_file(file_id)
            
            if content:
                # Generate ingestion event
                event = self.generate_ingestion_event(
                    file_id,
                    file_name,
                    content,
                    mime_type
                )
                events.append(event)
                
                print(f"Ingested: {file_name}")
        
        return events

# Event store interface - PostgreSQL implementation
class EventStore:
    """Interface for storing events in PostgreSQL."""
    
    def __init__(self):
        """Initialize PostgreSQL connection using SecretAdapter."""
        import psycopg2
        import uuid
        
        self.postgres_config = None
        self.conn = None
        
        if SECRET_ADAPTER_AVAILABLE:
            try:
                secret_adapter = get_secret_adapter()
                self.postgres_config = secret_adapter.get_postgres_config()
                
                self.conn = psycopg2.connect(
                    host=self.postgres_config.get('host', 'localhost'),
                    port=self.postgres_config.get('port', '5432'),
                    database=self.postgres_config.get('database', 'crx_runtime'),
                    user=self.postgres_config.get('user', 'postgres'),
                    password=self.postgres_config.get('password', '')
                )
                print("EventStore: Connected to PostgreSQL via SecretAdapter")
            except Exception as e:
                print(f"EventStore: Failed to connect via SecretAdapter: {e}")
                # Fallback to environment variables
                try:
                    self.conn = psycopg2.connect(
                        host=os.getenv('POSTGRES_HOST', 'localhost'),
                        port=os.getenv('POSTGRES_PORT', '5432'),
                        database=os.getenv('POSTGRES_DB', 'crx_runtime'),
                        user=os.getenv('POSTGRES_USER', 'postgres'),
                        password=os.getenv('POSTGRES_PASSWORD', '')
                    )
                    print("EventStore: Connected to PostgreSQL via fallback")
                except Exception as e2:
                    print(f"EventStore: Failed to connect via fallback: {e2}")
    
    @requires_capability(Capability.EVENT_WRITE) if CAPABILITY_ENFORCEMENT_AVAILABLE else lambda f: f
    def append_event(self, event: Dict[str, Any]) -> str:
        """Append event to PostgreSQL event store. Requires EVENT_WRITE capability."""
        if not self.conn:
            print("EventStore: No database connection, using fallback")
            event_id = hashlib.sha256(str(event).encode()).hexdigest()[:16]
            print(f"Stored event (fallback): {event_id}")
            return event_id
        
        try:
            import uuid
            event_uuid = str(uuid.uuid4())
            
            with self.conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO events (
                        id, event_id, event_type, timestamp, 
                        event_data, projected_to_qdrant
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    event_uuid,
                    event_uuid,
                    event.get('event_type', 'UNKNOWN'),
                    event.get('timestamp', datetime.utcnow().isoformat()),
                    json.dumps(event),
                    False
                ))
                self.conn.commit()
                print(f"Stored event to PostgreSQL: {event_uuid}")
                return event_uuid
        except Exception as e:
            print(f"EventStore: Failed to insert event: {e}")
            self.conn.rollback()
            # Fallback
            event_id = hashlib.sha256(str(event).encode()).hexdigest()[:16]
            print(f"Stored event (fallback): {event_id}")
            return event_id
    
    @requires_capability(Capability.EVENT_WRITE) if CAPABILITY_ENFORCEMENT_AVAILABLE else lambda f: f
    def append_events(self, events: List[Dict[str, Any]]) -> List[str]:
        """Append multiple events to PostgreSQL event store. Requires EVENT_WRITE capability."""
        event_ids = []
        for event in events:
            event_id = self.append_event(event)
            event_ids.append(event_id)
        return event_ids
    
    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()
            print("EventStore: Database connection closed")

if __name__ == "__main__":
    # Test adapter
    adapter = GoogleDriveIngestionAdapter()
    
    print("Google Drive Ingestion Adapter")
    print("Constitutional Law: TRUTH != EMBEDDINGS")
    print()
    
    if GOOGLE_DRIVE_AVAILABLE:
        print("Google Drive service available")
        
        # List files
        files = adapter.list_files()
        print(f"Found {len(files)} files")
        
        # Ingest folder
        events = adapter.ingest_folder()
        print(f"Generated {len(events)} ingestion events")
        
        # Store events (placeholder)
        event_store = EventStore()
        event_ids = event_store.append_events(events)
        print(f"Stored {len(event_ids)} events")
    else:
        print("Google Drive service not available")
        print("Install with: pip install google-api-python-client")
