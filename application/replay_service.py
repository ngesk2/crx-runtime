"""
Replay Application Service

Handles replay operations by delegating to ReplayKernel.
Owns the coordination of replay operations and DTO mapping.
"""

from fastapi.responses import JSONResponse
from runtime.replay.replay_kernel import ReplayKernel
from runtime.di_container import RuntimeContainer


class ReplayApplicationService:
    """Application service for replay operations."""
    
    def __init__(self, container: RuntimeContainer):
        self.container = container
        self.replay_kernel = ReplayKernel(container.canonical_authority)
    
    async def replay_events(self) -> JSONResponse:
        """
        Perform constitutional event replay.
        
        This method coordinates with ReplayKernel for the actual replay
        operation and returns the result as a JSONResponse.
        """
        result = await self.replay_kernel.replay_events()
        
        if result.status == "failed":
            return JSONResponse(
                content={"error": result.get("error", "Replay failed")},
                status_code=500,
            )
        
        return JSONResponse(content={
            "status": result.status,
            "events_replayed": result.events_replayed,
            "hash_mismatches": len(result.hash_mismatches),
            "mismatches": result.hash_mismatches,
            "events": result.events,
            "witness_hash": result.witness_hash,
            "fingerprint": result.fingerprint,
        })
