"""Transport Authority

Central authority for HTTP/SDK transport operations.

Architecture:
TransportAuthority → Connection → Provider SDK

Instead of every adapter doing:
- httpx
- retry
- timeout
- TLS
- headers
- compression

Everything becomes centralized through TransportAuthority.

This makes provider adapters very small - they only wrap the official SDK.
"""

import httpx
from dataclasses import dataclass
from typing import Any, AsyncContextManager


@dataclass(frozen=True)
class TransportConfig:
    """Configuration for transport connections"""
    timeout: float = 30.0
    max_retries: int = 3
    retry_backoff: float = 1.0
    verify_ssl: bool = True
    max_connections: int = 100
    max_keepalive_connections: int = 20


class TransportAuthority:
    """
    Central authority for HTTP/SDK transport operations.
    
    Owns:
    - HTTP connection pooling
    - Retry logic
    - Timeout handling
    - TLS configuration
    - Default headers
    - Compression
    
    Provider adapters become very small - they only wrap official SDKs.
    """
    
    def __init__(self, config: TransportConfig | None = None):
        self.config = config or TransportConfig()
        self._client: httpx.AsyncClient | None = None
    
    @property
    def client(self) -> httpx.AsyncClient:
        """Get or create shared HTTP client"""
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=self.config.timeout,
                verify=self.config.verify_ssl,
                limits=httpx.Limits(
                    max_connections=self.config.max_connections,
                    max_keepalive_connections=self.config.max_keepalive_connections,
                ),
            )
        return self._client
    
    async def request(
        self,
        method: str,
        url: str,
        headers: dict[str, str] | None = None,
        json: dict[str, Any] | None = None,
        data: Any = None,
        params: dict[str, Any] | None = None,
        auth: tuple[str, str] | None = None,
    ) -> httpx.Response:
        """
        Make HTTP request with retry logic.
        
        Args:
            method: HTTP method
            url: Request URL
            headers: Request headers
            json: JSON payload
            data: Form data
            params: Query parameters
            auth: Basic auth tuple
        
        Returns:
            HTTP response
        """
        last_exception = None
        
        for attempt in range(self.config.max_retries):
            try:
                response = await self.client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=json,
                    data=data,
                    params=params,
                    auth=auth,
                )
                response.raise_for_status()
                return response
            except (httpx.HTTPError, httpx.HTTPStatusError) as e:
                last_exception = e
                if attempt < self.config.max_retries - 1:
                    import asyncio
                    backoff = self.config.retry_backoff * (2 ** attempt)
                    await asyncio.sleep(backoff)
                else:
                    raise
        
        raise last_exception if last_exception else RuntimeError("Transport request failed")
    
    async def get(self, url: str, **kwargs: Any) -> httpx.Response:
        """GET request"""
        return await self.request("GET", url, **kwargs)
    
    async def post(self, url: str, **kwargs: Any) -> httpx.Response:
        """POST request"""
        return await self.request("POST", url, **kwargs)
    
    async def put(self, url: str, **kwargs: Any) -> httpx.Response:
        """PUT request"""
        return await self.request("PUT", url, **kwargs)
    
    async def delete(self, url: str, **kwargs: Any) -> httpx.Response:
        """DELETE request"""
        return await self.request("DELETE", url, **kwargs)
    
    async def close(self) -> None:
        """Close HTTP client"""
        if self._client:
            await self._client.aclose()
            self._client = None
    
    async def __aenter__(self) -> "TransportAuthority":
        """Async context manager entry"""
        return self
    
    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Async context manager exit"""
        await self.close()
