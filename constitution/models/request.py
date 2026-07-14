"""
Canonical Request IR - Immutable request models for constitutional runtime.

Every capability receives canonical, immutable, hashable, replayable requests.
Request → Canonical Hash → Capability → Evidence → Event

Replay becomes:
Request Hash → Evidence Hash → Reducer → State Hash

Everything becomes constitutional.
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from constitution.hashing import CanonicalHasher


class CanonicalRequest(BaseModel):
    """
    Base class for all canonical requests.
    
    All requests are:
    - Canonical: deterministic serialization
    - Immutable: frozen dataclass
    - Hashable: request_hash for replay verification
    - Replayable: same request always produces same Evidence
    """
    
    request_id: str = Field(..., description="Unique request identifier")
    request_hash: str = Field(..., description="Canonical hash of request for replay verification")
    
    class Config:
        frozen = True
    
    def compute_request_hash(self) -> str:
        """Compute canonical hash of request"""
        request_dict = self.dict()
        request_dict.pop("request_id", None)
        request_dict.pop("request_hash", None)
        return CanonicalHasher.hash_dict(request_dict)


class FilesystemRequest(CanonicalRequest):
    """Canonical request for filesystem operations"""
    
    operation: str = Field(..., description="Operation: read, write, delete, list, exists, mkdir, rmdir")
    path: str = Field(..., description="Filesystem path")
    data: Optional[bytes] = Field(None, description="Data for write operations")
    recursive: Optional[bool] = Field(False, description="Recursive flag for delete/list operations")
    
    @classmethod
    def create(
        cls,
        operation: str,
        path: str,
        data: Optional[bytes] = None,
        recursive: bool = False,
    ) -> "FilesystemRequest":
        """Factory method to create FilesystemRequest with computed hash"""
        request_dict = {
            "operation": operation,
            "path": path,
            "data": data.hex() if data else None,
            "recursive": recursive,
        }
        request_hash = CanonicalHasher.hash_dict(request_dict)
        request_id = CanonicalHasher.hash_dict({"request_hash": request_hash})
        
        return cls(
            request_id=request_id,
            request_hash=request_hash,
            operation=operation,
            path=path,
            data=data,
            recursive=recursive,
        )


class NetworkRequest(CanonicalRequest):
    """Canonical request for network operations"""
    
    operation: str = Field(..., description="Operation: http_get, http_post, websocket_connect")
    url: str = Field(..., description="Target URL")
    method: Optional[str] = Field("GET", description="HTTP method")
    headers: Optional[Dict[str, str]] = Field(None, description="HTTP headers")
    data: Optional[bytes] = Field(None, description="Request body data")
    timeout: Optional[int] = Field(30, description="Timeout in seconds")
    
    @classmethod
    def create(
        cls,
        operation: str,
        url: str,
        method: str = "GET",
        headers: Optional[Dict[str, str]] = None,
        data: Optional[bytes] = None,
        timeout: int = 30,
    ) -> "NetworkRequest":
        """Factory method to create NetworkRequest with computed hash"""
        request_dict = {
            "operation": operation,
            "url": url,
            "method": method,
            "headers": headers,
            "data": data.hex() if data else None,
            "timeout": timeout,
        }
        request_hash = CanonicalHasher.hash_dict(request_dict)
        request_id = CanonicalHasher.hash_dict({"request_hash": request_hash})
        
        return cls(
            request_id=request_id,
            request_hash=request_hash,
            operation=operation,
            url=url,
            method=method,
            headers=headers,
            data=data,
            timeout=timeout,
        )


class StorageRequest(CanonicalRequest):
    """Canonical request for storage operations"""
    
    operation: str = Field(..., description="Operation: get, set, delete, exists, get_many, set_many")
    key: Optional[str] = Field(None, description="Storage key")
    value: Optional[bytes] = Field(None, description="Value for set operations")
    keys: Optional[List[str]] = Field(None, description="Keys for batch operations")
    items: Optional[Dict[str, bytes]] = Field(None, description="Key-value pairs for batch set")
    
    @classmethod
    def create(
        cls,
        operation: str,
        key: Optional[str] = None,
        value: Optional[bytes] = None,
        keys: Optional[List[str]] = None,
        items: Optional[Dict[str, bytes]] = None,
    ) -> "StorageRequest":
        """Factory method to create StorageRequest with computed hash"""
        request_dict = {
            "operation": operation,
            "key": key,
            "value": value.hex() if value else None,
            "keys": sorted(keys) if keys else None,
            "items": {k: v.hex() for k, v in items.items()} if items else None,
        }
        request_hash = CanonicalHasher.hash_dict(request_dict)
        request_id = CanonicalHasher.hash_dict({"request_hash": request_hash})
        
        return cls(
            request_id=request_id,
            request_hash=request_hash,
            operation=operation,
            key=key,
            value=value,
            keys=keys,
            items=items,
        )


class SearchRequest(CanonicalRequest):
    """Canonical request for search operations"""
    
    operation: str = Field(..., description="Operation: index, search, delete, get, vector_search")
    document_id: Optional[str] = Field(None, description="Document ID")
    content: Optional[str] = Field(None, description="Document content for indexing")
    query: Optional[str] = Field(None, description="Search query")
    limit: Optional[int] = Field(10, description="Result limit")
    vector: Optional[List[float]] = Field(None, description="Vector for similarity search")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Document metadata")
    
    @classmethod
    def create(
        cls,
        operation: str,
        document_id: Optional[str] = None,
        content: Optional[str] = None,
        query: Optional[str] = None,
        limit: int = 10,
        vector: Optional[List[float]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> "SearchRequest":
        """Factory method to create SearchRequest with computed hash"""
        request_dict = {
            "operation": operation,
            "document_id": document_id,
            "content": content,
            "query": query,
            "limit": limit,
            "vector": vector,
            "metadata": metadata,
        }
        request_hash = CanonicalHasher.hash_dict(request_dict)
        request_id = CanonicalHasher.hash_dict({"request_hash": request_hash})
        
        return cls(
            request_id=request_id,
            request_hash=request_hash,
            operation=operation,
            document_id=document_id,
            content=content,
            query=query,
            limit=limit,
            vector=vector,
            metadata=metadata,
        )


class ConnectorRequest(CanonicalRequest):
    """Canonical request for connector operations"""
    
    operation: str = Field(..., description="Operation: connect, disconnect, execute_query, get_schema, sync_data")
    connector_type: str = Field(..., description="Connector type (postgres, mysql, redis, etc.)")
    config: Optional[Dict[str, Any]] = Field(None, description="Connector configuration")
    connection_handle: Optional[str] = Field(None, description="Connection handle for operations")
    query: Optional[str] = Field(None, description="Query to execute")
    params: Optional[Dict[str, Any]] = Field(None, description="Query parameters")
    source_config: Optional[Dict[str, Any]] = Field(None, description="Source configuration for sync")
    
    @classmethod
    def create(
        cls,
        operation: str,
        connector_type: str,
        config: Optional[Dict[str, Any]] = None,
        connection_handle: Optional[str] = None,
        query: Optional[str] = None,
        params: Optional[Dict[str, Any]] = None,
        source_config: Optional[Dict[str, Any]] = None,
    ) -> "ConnectorRequest":
        """Factory method to create ConnectorRequest with computed hash"""
        request_dict = {
            "operation": operation,
            "connector_type": connector_type,
            "config": config,
            "connection_handle": connection_handle,
            "query": query,
            "params": params,
            "source_config": source_config,
        }
        request_hash = CanonicalHasher.hash_dict(request_dict)
        request_id = CanonicalHasher.hash_dict({"request_hash": request_hash})
        
        return cls(
            request_id=request_id,
            request_hash=request_hash,
            operation=operation,
            connector_type=connector_type,
            config=config,
            connection_handle=connection_handle,
            query=query,
            params=params,
            source_config=source_config,
        )


class MediaRequest(CanonicalRequest):
    """Canonical request for media operations"""
    
    operation: str = Field(..., description="Operation: resize_image, compress_image, extract_audio, transcode_video, get_metadata, generate_thumbnail")
    image_data: Optional[bytes] = Field(None, description="Image data")
    video_data: Optional[bytes] = Field(None, description="Video data")
    width: Optional[int] = Field(None, description="Target width")
    height: Optional[int] = Field(None, description="Target height")
    quality: Optional[int] = Field(None, description="Compression quality")
    format: Optional[str] = Field(None, description="Target format")
    timestamp: Optional[float] = Field(None, description="Timestamp for thumbnail")
    
    @classmethod
    def create(
        cls,
        operation: str,
        image_data: Optional[bytes] = None,
        video_data: Optional[bytes] = None,
        width: Optional[int] = None,
        height: Optional[int] = None,
        quality: Optional[int] = None,
        format: Optional[str] = None,
        timestamp: Optional[float] = None,
    ) -> "MediaRequest":
        """Factory method to create MediaRequest with computed hash"""
        request_dict = {
            "operation": operation,
            "image_data": image_data.hex() if image_data else None,
            "video_data": video_data.hex() if video_data else None,
            "width": width,
            "height": height,
            "quality": quality,
            "format": format,
            "timestamp": timestamp,
        }
        request_hash = CanonicalHasher.hash_dict(request_dict)
        request_id = CanonicalHasher.hash_dict({"request_hash": request_hash})
        
        return cls(
            request_id=request_id,
            request_hash=request_hash,
            operation=operation,
            image_data=image_data,
            video_data=video_data,
            width=width,
            height=height,
            quality=quality,
            format=format,
            timestamp=timestamp,
        )


class AgentRequest(CanonicalRequest):
    """Canonical request for agent operations"""
    
    operation: str = Field(..., description="Operation: execute, get_definition, list, validate_config")
    agent_id: Optional[str] = Field(None, description="Agent ID")
    agent_type: Optional[str] = Field(None, description="Agent type filter")
    input_data: Optional[Dict[str, Any]] = Field(None, description="Input data for execution")
    agent_config: Optional[Dict[str, Any]] = Field(None, description="Agent configuration")
    
    @classmethod
    def create(
        cls,
        operation: str,
        agent_id: Optional[str] = None,
        agent_type: Optional[str] = None,
        input_data: Optional[Dict[str, Any]] = None,
        agent_config: Optional[Dict[str, Any]] = None,
    ) -> "AgentRequest":
        """Factory method to create AgentRequest with computed hash"""
        request_dict = {
            "operation": operation,
            "agent_id": agent_id,
            "agent_type": agent_type,
            "input_data": input_data,
            "agent_config": agent_config,
        }
        request_hash = CanonicalHasher.hash_dict(request_dict)
        request_id = CanonicalHasher.hash_dict({"request_hash": request_hash})
        
        return cls(
            request_id=request_id,
            request_hash=request_hash,
            operation=operation,
            agent_id=agent_id,
            agent_type=agent_type,
            input_data=input_data,
            agent_config=agent_config,
        )


class ToolRequest(CanonicalRequest):
    """Canonical request for tool operations"""
    
    operation: str = Field(..., description="Operation: execute, get_definition, list, validate_parameters, get_schema")
    tool_id: Optional[str] = Field(None, description="Tool ID")
    tool_type: Optional[str] = Field(None, description="Tool type filter")
    parameters: Optional[Dict[str, Any]] = Field(None, description="Tool parameters")
    
    @classmethod
    def create(
        cls,
        operation: str,
        tool_id: Optional[str] = None,
        tool_type: Optional[str] = None,
        parameters: Optional[Dict[str, Any]] = None,
    ) -> "ToolRequest":
        """Factory method to create ToolRequest with computed hash"""
        request_dict = {
            "operation": operation,
            "tool_id": tool_id,
            "tool_type": tool_type,
            "parameters": parameters,
        }
        request_hash = CanonicalHasher.hash_dict(request_dict)
        request_id = CanonicalHasher.hash_dict({"request_hash": request_hash})
        
        return cls(
            request_id=request_id,
            request_hash=request_hash,
            operation=operation,
            tool_id=tool_id,
            tool_type=tool_type,
            parameters=parameters,
        )


class WorkflowRequest(CanonicalRequest):
    """Canonical request for workflow operations"""
    
    operation: str = Field(..., description="Operation: execute, get_definition, list, validate_config, get_execution_state")
    workflow_id: Optional[str] = Field(None, description="Workflow ID")
    workflow_type: Optional[str] = Field(None, description="Workflow type filter")
    input_data: Optional[Dict[str, Any]] = Field(None, description="Input data for execution")
    workflow_config: Optional[Dict[str, Any]] = Field(None, description="Workflow configuration")
    execution_id: Optional[str] = Field(None, description="Execution ID for state retrieval")
    
    @classmethod
    def create(
        cls,
        operation: str,
        workflow_id: Optional[str] = None,
        workflow_type: Optional[str] = None,
        input_data: Optional[Dict[str, Any]] = None,
        workflow_config: Optional[Dict[str, Any]] = None,
        execution_id: Optional[str] = None,
    ) -> "WorkflowRequest":
        """Factory method to create WorkflowRequest with computed hash"""
        request_dict = {
            "operation": operation,
            "workflow_id": workflow_id,
            "workflow_type": workflow_type,
            "input_data": input_data,
            "workflow_config": workflow_config,
            "execution_id": execution_id,
        }
        request_hash = CanonicalHasher.hash_dict(request_dict)
        request_id = CanonicalHasher.hash_dict({"request_hash": request_hash})
        
        return cls(
            request_id=request_id,
            request_hash=request_hash,
            operation=operation,
            workflow_id=workflow_id,
            workflow_type=workflow_type,
            input_data=input_data,
            workflow_config=workflow_config,
            execution_id=execution_id,
        )
