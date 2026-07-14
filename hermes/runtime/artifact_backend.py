"""
Artifact Backend - Interface for artifact storage implementations.

This module defines the interface for artifact storage backends:
- SQLite
- Filesystem
- S3
- Postgres
- Git

Each backend implements the same interface for artifact storage.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from datetime import datetime
from pathlib import Path

from hermes.storage.engine import StorageEngine


class ArtifactBackend(ABC):
    """
    Abstract base class for artifact storage backends.
    
    All artifact storage implementations must implement this interface.
    Backend only handles raw bytes - Repository owns serialization.
    """
    
    @abstractmethod
    async def store_blob(self, artifact_id: str, content: bytes) -> None:
        """
        Store artifact content as raw bytes.
        
        Args:
            artifact_id: Unique artifact identifier
            content: Artifact content bytes
        """
        pass
    
    @abstractmethod
    async def load_blob(self, artifact_id: str) -> Optional[bytes]:
        """
        Load artifact content as raw bytes.
        
        Args:
            artifact_id: Unique artifact identifier
        
        Returns:
            Artifact content bytes or None if not found
        """
        pass
    
    @abstractmethod
    async def exists(self, artifact_id: str) -> bool:
        """
        Check if artifact exists.
        
        Args:
            artifact_id: Unique artifact identifier
        
        Returns:
            True if artifact exists
        """
        pass
    
    @abstractmethod
    async def delete(self, artifact_id: str) -> bool:
        """
        Delete artifact.
        
        Args:
            artifact_id: Unique artifact identifier
        
        Returns:
            True if deleted
        """
        pass
    
    @abstractmethod
    async def list_by_mission(self, mission_id: str) -> list[str]:
        """
        List artifact IDs for a mission.
        
        Args:
            mission_id: Mission identifier
        
        Returns:
            List of artifact IDs
        """
        pass


class SQLiteArtifactBackend(ArtifactBackend):
    """
    SQLite artifact storage backend.
    
    Stores artifacts in SQLite database with content as BLOB.
    Uses StorageEngine for connection pooling and WAL mode.
    """
    
    def __init__(self, db_path: str = "artifacts.db", storage_engine: Optional[StorageEngine] = None):
        self.storage_engine = storage_engine or StorageEngine(db_path)
        self._initialized = False
    
    async def _initialize(self) -> None:
        """Initialize database schema."""
        if self._initialized:
            return
        
        schema = """
            CREATE TABLE IF NOT EXISTS artifacts (
                artifact_id TEXT PRIMARY KEY,
                content BLOB,
                mission_id TEXT,
                created_at TEXT
            );
            
            CREATE INDEX IF NOT EXISTS idx_mission_id 
            ON artifacts(mission_id);
            
            CREATE INDEX IF NOT EXISTS idx_created_at 
            ON artifacts(created_at);
        """
        
        await self.storage_engine.execute_script(schema)
        self._initialized = True
    
    async def store_blob(self, artifact_id: str, content: bytes) -> None:
        """Store artifact blob in SQLite."""
        await self._initialize()
        
        await self.storage_engine.execute(
            """
            INSERT OR REPLACE INTO artifacts
            (artifact_id, content, created_at)
            VALUES (?, ?, ?)
            """,
            (
                artifact_id,
                content,
                datetime.utcnow().isoformat()
            ),
            fetch='none'
        )
    
    async def load_blob(self, artifact_id: str) -> Optional[bytes]:
        """Load artifact blob from SQLite."""
        await self._initialize()
        
        row = await self.storage_engine.execute(
            """
            SELECT content FROM artifacts WHERE artifact_id = ?
            """,
            (artifact_id,),
            fetch='one'
        )
        
        return row[0] if row else None
    
    async def exists(self, artifact_id: str) -> bool:
        """Check if artifact exists in SQLite."""
        await self._initialize()
        
        row = await self.storage_engine.execute(
            """
            SELECT 1 FROM artifacts WHERE artifact_id = ?
            """,
            (artifact_id,),
            fetch='one'
        )
        
        return row is not None
    
    async def delete(self, artifact_id: str) -> bool:
        """Delete artifact from SQLite."""
        await self._initialize()
        
        await self.storage_engine.execute(
            """
            DELETE FROM artifacts WHERE artifact_id = ?
            """,
            (artifact_id,),
            fetch='none'
        )
        return True
    
    async def list_by_mission(self, mission_id: str) -> list[str]:
        """List artifact IDs for a mission from SQLite."""
        await self._initialize()
        
        rows = await self.storage_engine.execute(
            """
            SELECT artifact_id FROM artifacts WHERE mission_id = ?
            """,
            (mission_id,),
            fetch='all'
        )
        
        return [row[0] for row in rows]


class FilesystemArtifactBackend(ArtifactBackend):
    """
    Filesystem artifact storage backend.
    
    Stores artifacts as files in a directory structure.
    """
    
    def __init__(self, base_path: str = "artifacts"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
    
    def _get_artifact_path(self, artifact_id: str) -> Path:
        """Get filesystem path for artifact."""
        # Use first 2 characters as subdirectory for sharding
        subdir = artifact_id[:2]
        artifact_dir = self.base_path / subdir
        artifact_dir.mkdir(parents=True, exist_ok=True)
        return artifact_dir / artifact_id
    
    async def store_blob(self, artifact_id: str, content: bytes) -> None:
        """Store artifact blob on filesystem."""
        artifact_path = self._get_artifact_path(artifact_id)
        artifact_path.write_bytes(content)
    
    async def load_blob(self, artifact_id: str) -> Optional[bytes]:
        """Load artifact blob from filesystem."""
        artifact_path = self._get_artifact_path(artifact_id)
        
        if not artifact_path.exists():
            return None
        
        return artifact_path.read_bytes()
    
    async def exists(self, artifact_id: str) -> bool:
        """Check if artifact exists on filesystem."""
        artifact_path = self._get_artifact_path(artifact_id)
        return artifact_path.exists()
    
    async def delete(self, artifact_id: str) -> bool:
        """Delete artifact from filesystem."""
        artifact_path = self._get_artifact_path(artifact_id)
        
        if not artifact_path.exists():
            return False
        
        artifact_path.unlink()
        return True
    
    async def list_by_mission(self, mission_id: str) -> list[str]:
        """List artifact IDs for a mission from filesystem."""
        # Filesystem backend doesn't track mission_id without metadata
        # This would require a separate index
        return []


class S3ArtifactBackend(ArtifactBackend):
    """
    S3 artifact storage backend.
    
    Stores artifacts in AWS S3.
    """
    
    def __init__(self, bucket: str, prefix: str = "artifacts"):
        self.bucket = bucket
        self.prefix = prefix
        self._client = None
    
    def _get_client(self):
        """Get S3 client."""
        if self._client is None:
            import boto3
            self._client = boto3.client('s3')
        return self._client
    
    def _get_key(self, artifact_id: str) -> str:
        """Get S3 key for artifact."""
        return f"{self.prefix}/{artifact_id[:2]}/{artifact_id}"
    
    async def store_blob(self, artifact_id: str, content: bytes) -> None:
        """Store artifact blob in S3."""
        client = self._get_client()
        
        client.put_object(
            Bucket=self.bucket,
            Key=self._get_key(artifact_id),
            Body=content
        )
    
    async def load_blob(self, artifact_id: str) -> Optional[bytes]:
        """Load artifact blob from S3."""
        client = self._get_client()
        
        try:
            response = client.get_object(
                Bucket=self.bucket,
                Key=self._get_key(artifact_id)
            )
            return response['Body'].read()
        except client.exceptions.NoSuchKey:
            return None
    
    async def exists(self, artifact_id: str) -> bool:
        """Check if artifact exists in S3."""
        client = self._get_client()
        
        try:
            client.head_object(
                Bucket=self.bucket,
                Key=self._get_key(artifact_id)
            )
            return True
        except client.exceptions.NoSuchKey:
            return False
    
    async def delete(self, artifact_id: str) -> bool:
        """Delete artifact from S3."""
        client = self._get_client()
        
        try:
            client.delete_object(
                Bucket=self.bucket,
                Key=self._get_key(artifact_id)
            )
            return True
        except client.exceptions.NoSuchKey:
            return False
    
    async def list_by_mission(self, mission_id: str) -> list[str]:
        """List artifact IDs for a mission from S3."""
        # S3 backend doesn't track mission_id without metadata
        # This would require a separate index
        return []

