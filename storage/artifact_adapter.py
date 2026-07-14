from abc import ABC, abstractmethod
from typing import Optional
import aiofiles
import os
import boto3
from botocore.exceptions import ClientError


class StorageAdapter(ABC):
    """
    Abstract storage adapter for artifact storage.
    
    Storage backends (filesystem, S3, GCS, etc.) implement this interface.
    This keeps infrastructure details out of constitutional state.
    """
    
    @abstractmethod
    async def store(self, artifact_id: str, content: bytes) -> None:
        """Store artifact content"""
        pass
    
    @abstractmethod
    async def retrieve(self, artifact_id: str) -> Optional[bytes]:
        """Retrieve artifact content"""
        pass
    
    @abstractmethod
    async def delete(self, artifact_id: str) -> bool:
        """Delete artifact content"""
        pass
    
    @abstractmethod
    async def exists(self, artifact_id: str) -> bool:
        """Check if artifact exists"""
        pass


class FilesystemAdapter(StorageAdapter):
    """
    Filesystem storage adapter using aiofiles for async operations.
    
    Stores artifacts on the local filesystem.
    """
    
    def __init__(self, base_path: str):
        self.base_path = base_path
        os.makedirs(base_path, exist_ok=True)
    
    def _get_path(self, artifact_id: str) -> str:
        """Get filesystem path for artifact (adapter-specific)"""
        # Use first 2 characters as directory prefix to avoid too many files in one directory
        prefix = artifact_id[:2]
        return os.path.join(self.base_path, prefix, artifact_id)
    
    async def store(self, artifact_id: str, content: bytes) -> None:
        """Store artifact content on filesystem using aiofiles"""
        path = self._get_path(artifact_id)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        async with aiofiles.open(path, 'wb') as f:
            await f.write(content)
    
    async def retrieve(self, artifact_id: str) -> Optional[bytes]:
        """Retrieve artifact content from filesystem using aiofiles"""
        path = self._get_path(artifact_id)
        if not os.path.exists(path):
            return None
        async with aiofiles.open(path, 'rb') as f:
            return await f.read()
    
    async def delete(self, artifact_id: str) -> bool:
        """Delete artifact content from filesystem"""
        path = self._get_path(artifact_id)
        if not os.path.exists(path):
            return False
        os.remove(path)
        return True
    
    async def exists(self, artifact_id: str) -> bool:
        """Check if artifact exists on filesystem"""
        path = self._get_path(artifact_id)
        return os.path.exists(path)


class S3Adapter(StorageAdapter):
    """
    S3 storage adapter using boto3.
    
    Stores artifacts in Amazon S3.
    """
    
    def __init__(self, bucket: str, prefix: str = "", region_name: str = "us-east-1"):
        self.bucket = bucket
        self.prefix = prefix
        self.s3_client = boto3.client('s3', region_name=region_name)
    
    def _get_key(self, artifact_id: str) -> str:
        """Get S3 key for artifact (adapter-specific)"""
        if self.prefix:
            return f"{self.prefix}/{artifact_id}"
        return artifact_id
    
    async def store(self, artifact_id: str, content: bytes) -> None:
        """Store artifact content in S3 using boto3"""
        key = self._get_key(artifact_id)
        self.s3_client.put_object(Bucket=self.bucket, Key=key, Body=content)
    
    async def retrieve(self, artifact_id: str) -> Optional[bytes]:
        """Retrieve artifact content from S3 using boto3"""
        key = self._get_key(artifact_id)
        try:
            response = self.s3_client.get_object(Bucket=self.bucket, Key=key)
            return response['Body'].read()
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                return None
            raise
    
    async def delete(self, artifact_id: str) -> bool:
        """Delete artifact content from S3 using boto3"""
        key = self._get_key(artifact_id)
        try:
            self.s3_client.delete_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                return False
            raise
    
    async def exists(self, artifact_id: str) -> bool:
        """Check if artifact exists in S3 using boto3"""
        key = self._get_key(artifact_id)
        try:
            self.s3_client.head_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            raise


class MemoryAdapter(StorageAdapter):
    """
    In-memory storage adapter for testing.
    
    Stores artifacts in memory only.
    """
    
    def __init__(self):
        self._storage: dict[str, bytes] = {}
    
    async def store(self, artifact_id: str, content: bytes) -> None:
        """Store artifact content in memory"""
        self._storage[artifact_id] = content
    
    async def retrieve(self, artifact_id: str) -> Optional[bytes]:
        """Retrieve artifact content from memory"""
        return self._storage.get(artifact_id)
    
    async def delete(self, artifact_id: str) -> bool:
        """Delete artifact content from memory"""
        if artifact_id in self._storage:
            del self._storage[artifact_id]
            return True
        return False
    
    async def exists(self, artifact_id: str) -> bool:
        """Check if artifact exists in memory"""
        return artifact_id in self._storage
