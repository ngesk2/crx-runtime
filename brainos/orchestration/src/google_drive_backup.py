"""
Google Drive Backup Worker
PING Survivability Layer
Date: 2026-06-22

Purpose: Nightly sync of vault/constitutional files to Google Drive for survivability
"""

import os
import logging
import hashlib
import json
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path

# Google Drive API imports
try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload
    import io
    GOOGLE_DRIVE_AVAILABLE = True
except ImportError:
    GOOGLE_DRIVE_AVAILABLE = False
    logging.warning("Google Drive libraries not installed. Install: pip install google-api-python-client google-auth-oauthlib")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
VAULT_PATH = os.getenv('VAULT_PATH', '/app/vault')
GOOGLE_DRIVE_CREDENTIALS_PATH = os.getenv('GOOGLE_DRIVE_CREDENTIALS_PATH', 'credentials.json')
GOOGLE_DRIVE_TOKEN_PATH = os.getenv('GOOGLE_DRIVE_TOKEN_PATH', 'token.json')
GOOGLE_DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive']
BACKUP_FOLDER_NAME = 'PING_BACKUPS'


class GoogleDriveBackup:
    """Google Drive backup worker for vault survivability."""
    
    def __init__(self):
        self.drive_service = None
        self.backup_folder_id = None
        
        if GOOGLE_DRIVE_AVAILABLE:
            self._init_drive_service()
    
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
            
            # Find or create backup folder
            self._ensure_backup_folder()
            
        except Exception as e:
            logger.error(f"Failed to initialize Google Drive service: {e}")
    
    def _ensure_backup_folder(self):
        """Ensure backup folder exists in Google Drive."""
        try:
            # Search for existing folder
            results = self.drive_service.files().list(
                q=f"name='{BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder'",
                fields="files(id, name)"
            ).execute()
            
            folders = results.get('files', [])
            
            if folders:
                self.backup_folder_id = folders[0]['id']
                logger.info(f"Found existing backup folder: {self.backup_folder_id}")
            else:
                # Create new folder
                folder_metadata = {
                    'name': BACKUP_FOLDER_NAME,
                    'mimeType': 'application/vnd.google-apps.folder'
                }
                folder = self.drive_service.files().create(
                    body=folder_metadata,
                    fields='id'
                ).execute()
                self.backup_folder_id = folder.get('id')
                logger.info(f"Created backup folder: {self.backup_folder_id}")
                
        except Exception as e:
            logger.error(f"Failed to ensure backup folder: {e}")
    
    def _compute_file_hash(self, file_path: str) -> str:
        """Compute SHA256 hash of file."""
        sha256_hash = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def _generate_hash_manifest(self, files: List[str]) -> Dict:
        """Generate hash manifest for files."""
        manifest = {
            "generated_at": datetime.utcnow().isoformat(),
            "files": {}
        }
        
        for file_path in files:
            try:
                rel_path = os.path.relpath(file_path, VAULT_PATH)
                file_hash = self._compute_file_hash(file_path)
                manifest["files"][rel_path] = {
                    "hash": file_hash,
                    "size": os.path.getsize(file_path),
                    "modified": datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat()
                }
            except Exception as e:
                logger.error(f"Failed to hash {file_path}: {e}")
        
        return manifest
    
    def backup_vault(self) -> Dict:
        """Backup vault to Google Drive."""
        if not self.drive_service or not self.backup_folder_id:
            return {
                "status": "failed",
                "message": "Google Drive service not initialized"
            }
        
        try:
            # Files to backup
            backup_patterns = [
                "VAULT_INDEX.md",
                "AUTHORITY_MAP.md",
                "HASH_MANIFEST.json",
                "constitution/**/*.md",
                "laws/**/*.md",
                "audits/**/*.md",
                "runbooks/**/*.md"
            ]
            
            # Find matching files
            vault_path = Path(VAULT_PATH)
            files_to_backup = []
            
            for pattern in backup_patterns:
                files_to_backup.extend(vault_path.glob(pattern))
            
            files_to_backup = [str(f) for f in files_to_backup if f.is_file()]
            
            logger.info(f"Found {len(files_to_backup)} files to backup")
            
            # Generate hash manifest
            manifest = self._generate_hash_manifest(files_to_backup)
            
            # Upload files
            uploaded_count = 0
            for file_path in files_to_backup:
                try:
                    rel_path = os.path.relpath(file_path, VAULT_PATH)
                    drive_filename = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{rel_path.replace('/', '_')}"
                    
                    # Upload file
                    file_metadata = {
                        'name': drive_filename,
                        'parents': [self.backup_folder_id]
                    }
                    
                    media = MediaFileUpload(file_path, resumable=True)
                    self.drive_service.files().create(
                        body=file_metadata,
                        media_body=media,
                        fields='id'
                    ).execute()
                    
                    uploaded_count += 1
                    logger.info(f"Uploaded: {rel_path}")
                    
                except Exception as e:
                    logger.error(f"Failed to upload {file_path}: {e}")
            
            # Upload manifest
            manifest_filename = f"MANIFEST_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
            manifest_path = os.path.join(VAULT_PATH, manifest_filename)
            
            with open(manifest_path, 'w') as f:
                json.dump(manifest, f, indent=2)
            
            file_metadata = {
                'name': manifest_filename,
                'parents': [self.backup_folder_id]
            }
            
            media = MediaFileUpload(manifest_path, resumable=True)
            self.drive_service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id'
            ).execute()
            
            # Clean up local manifest
            os.remove(manifest_path)
            
            return {
                "status": "success",
                "uploaded_count": uploaded_count,
                "total_files": len(files_to_backup),
                "backup_folder_id": self.backup_folder_id,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Backup failed: {e}")
            return {
                "status": "failed",
                "message": str(e)
            }
    
    def verify_backup(self) -> Dict:
        """Verify backup integrity."""
        if not self.drive_service or not self.backup_folder_id:
            return {
                "status": "failed",
                "message": "Google Drive service not initialized"
            }
        
        try:
            # List files in backup folder
            results = self.drive_service.files().list(
                q=f"'{self.backup_folder_id}' in parents",
                fields="files(id, name, size, modifiedTime)"
            ).execute()
            
            files = results.get('files', [])
            
            # Find latest manifest
            manifests = [f for f in files if f['name'].startswith('MANIFEST_')]
            
            if not manifests:
                return {
                    "status": "failed",
                    "message": "No backup manifest found"
                }
            
            latest_manifest = sorted(manifests, key=lambda x: x['modifiedTime'], reverse=True)[0]
            
            # Download and parse manifest
            request = self.drive_service.files().get_media(fileId=latest_manifest['id'])
            fh = io.BytesIO()
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while done is False:
                status, done = downloader.next_chunk()
            
            manifest = json.loads(fh.getvalue().decode('utf-8'))
            
            return {
                "status": "success",
                "total_files": len(files),
                "manifest_files": len(manifest.get('files', {})),
                "manifest_timestamp": latest_manifest['modifiedTime'],
                "backup_folder_id": self.backup_folder_id
            }
            
        except Exception as e:
            logger.error(f"Verification failed: {e}")
            return {
                "status": "failed",
                "message": str(e)
            }
    
    def restore_verification(self, test_file: str = "VAULT_INDEX.md") -> Dict:
        """Verify restore capability by downloading a test file."""
        if not self.drive_service or not self.backup_folder_id:
            return {
                "status": "failed",
                "message": "Google Drive service not initialized"
            }
        
        try:
            # Find latest version of test file
            results = self.drive_service.files().list(
                q=f"'{self.backup_folder_id}' in parents and name contains '{test_file}'",
                fields="files(id, name, size, modifiedTime)"
            ).execute()
            
            files = results.get('files', [])
            
            if not files:
                return {
                    "status": "failed",
                    "message": f"No backup found for {test_file}"
                }
            
            latest_file = sorted(files, key=lambda x: x['modifiedTime'], reverse=True)[0]
            
            # Download file
            request = self.drive_service.files().get_media(fileId=latest_file['id'])
            fh = io.BytesIO()
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while done is False:
                status, done = downloader.next_chunk()
            
            content = fh.getvalue().decode('utf-8')
            
            return {
                "status": "success",
                "file_name": latest_file['name'],
                "file_size": latest_file['size'],
                "modified_time": latest_file['modifiedTime'],
                "content_preview": content[:200] if len(content) > 200 else content
            }
            
        except Exception as e:
            logger.error(f"Restore verification failed: {e}")
            return {
                "status": "failed",
                "message": str(e)
            }
    
    def get_backup_status(self) -> Dict:
        """Get current backup status."""
        if not self.drive_service or not self.backup_folder_id:
            return {
                "status": "unavailable",
                "message": "Google Drive service not initialized"
            }
        
        try:
            # List files in backup folder
            results = self.drive_service.files().list(
                q=f"'{self.backup_folder_id}' in parents",
                fields="files(id, name, size, modifiedTime)"
            ).execute()
            
            files = results.get('files', [])
            
            # Count manifests
            manifests = [f for f in files if f['name'].startswith('MANIFEST_')]
            
            # Find latest backup
            if files:
                latest_backup = sorted(files, key=lambda x: x['modifiedTime'], reverse=True)[0]
                last_backup_time = latest_backup['modifiedTime']
            else:
                last_backup_time = None
            
            return {
                "status": "operational",
                "backup_folder_id": self.backup_folder_id,
                "total_backed_up_files": len(files),
                "backup_manifests": len(manifests),
                "last_backup_time": last_backup_time,
                "backup_path": f"gdrive:{BACKUP_FOLDER_NAME}",
                "schedule": "manual (nightly automation pending)",
                "retention_policy": "indefinite"
            }
            
        except Exception as e:
            logger.error(f"Failed to get backup status: {e}")
            return {
                "status": "error",
                "message": str(e)
            }


if __name__ == "__main__":
    import time
    
    backup = GoogleDriveBackup()
    
    try:
        # Run backup
        result = backup.backup_vault()
        print(f"Backup result: {result}")
        
        # Verify backup
        verification = backup.verify_backup()
        print(f"Verification result: {verification}")
        
        # Restore verification
        restore_test = backup.restore_verification()
        print(f"Restore verification result: {restore_test}")
        
        # Get status
        status = backup.get_backup_status()
        print(f"Backup status: {status}")
        
    except Exception as e:
        logger.error(f"Backup cycle failed: {e}")
