"""
Connector Interface - Contract for external system connectors.

This module defines the interface for all connector implementations.
All connectors must implement this contract for consistency.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from constitution.models.request import ConnectorRequest
from constitution.models.evidence import ConnectorEvidence


class Connector(ABC):
    """
    Abstract base class for external system connectors.
    
    All connector implementations must implement this contract.
    Connectors provide uniform access to external systems.
    """
    
    @abstractmethod
    async def initialize(self) -> None:
        """Initialize the connector."""
        pass
    
    @abstractmethod
    async def shutdown(self) -> None:
        """Shutdown the connector."""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Health check."""
        pass
    
    @abstractmethod
    async def acquire(self, request: ConnectorRequest, build_witness_hash: str) -> ConnectorEvidence:
        """
        Acquire connector evidence.
        
        Args:
            request: Canonical connector request
            build_witness_hash: Build witness hash
        
        Returns:
            ConnectorEvidence
        """
        pass
    
    @abstractmethod
    async def connect(self, config: Dict[str, Any], build_witness_hash: str) -> ConnectorEvidence:
        """
        Establish connection to external system.
        
        Args:
            config: Connection configuration
            build_witness_hash: Build witness hash
        
        Returns:
            ConnectorEvidence with connection handle
        """
        pass
    
    @abstractmethod
    async def disconnect(self, connection_handle: str, build_witness_hash: str) -> ConnectorEvidence:
        """
        Close connection to external system.
        
        Args:
            connection_handle: Connection handle
            build_witness_hash: Build witness hash
        
        Returns:
            ConnectorEvidence
        """
        pass
    
    @abstractmethod
    async def execute_query(
        self,
        connection_handle: str,
        query: str,
        params: Optional[Dict[str, Any]],
        build_witness_hash: str
    ) -> ConnectorEvidence:
        """
        Execute query on external system.
        
        Args:
            connection_handle: Connection handle
            query: Query to execute
            params: Query parameters
            build_witness_hash: Build witness hash
        
        Returns:
            ConnectorEvidence with results
        """
        pass
    
    @abstractmethod
    async def get_schema(self, connection_handle: str, build_witness_hash: str) -> ConnectorEvidence:
        """
        Get schema information from external system.
        
        Args:
            connection_handle: Connection handle
            build_witness_hash: Build witness hash
        
        Returns:
            ConnectorEvidence with schema
        """
        pass
    
    @abstractmethod
    async def sync_data(
        self,
        connection_handle: str,
        source_config: Dict[str, Any],
        build_witness_hash: str
    ) -> ConnectorEvidence:
        """
        Sync data from external system.
        
        Args:
            connection_handle: Connection handle
            source_config: Source configuration
            build_witness_hash: Build witness hash
        
        Returns:
            ConnectorEvidence with sync ID
        """
        pass
    
    @abstractmethod
    def get_metadata(self) -> Dict[str, Any]:
        """
        Get connector metadata.
        
        Returns:
            Connector metadata
        """
        pass
