"""
Authority Interface - Contract for constitutional authorities.

This module defines the interface for all constitutional authorities.
Implementations must satisfy this contract.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class Authority(ABC):
    """
    Abstract base class for constitutional authorities.
    
    Authorities enforce constitutional policies and provide governance.
    All authority implementations must implement this interface.
    """
    
    @abstractmethod
    async def initialize(self) -> None:
        """Initialize the authority."""
        pass
    
    @abstractmethod
    async def shutdown(self) -> None:
        """Shutdown the authority."""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Health check."""
        pass
    
    @abstractmethod
    async def validate(self, data: Any, context: Optional[Dict[str, Any]] = None) -> bool:
        """
        Validate data against constitutional policies.
        
        Args:
            data: Data to validate
            context: Optional validation context
        
        Returns:
            True if valid
        """
        pass
    
    @abstractmethod
    async def authorize(self, operation: str, context: Dict[str, Any]) -> bool:
        """
        Authorize an operation.
        
        Args:
            operation: Operation to authorize
            context: Authorization context
        
        Returns:
            True if authorized
        """
        pass
    
    @abstractmethod
    def get_metadata(self) -> Dict[str, Any]:
        """
        Get authority metadata.
        
        Returns:
            Authority metadata
        """
        pass
