"""
Replay API Module

Handles replay HTTP endpoints.
Delegates to ReplayApplicationService for business logic.
"""

from fastapi import APIRouter
from application.replay_service import ReplayApplicationService

router = APIRouter(tags=["replay"])

# Application service (will be injected via DI)
_replay_service: ReplayApplicationService = None


def set_replay_service(service: ReplayApplicationService):
    """Set the replay application service (DI)."""
    global _replay_service
    _replay_service = service


@router.post("/replay")
async def replay_events():
    """
    Replay events with constitutional hash verification.
    
    This endpoint delegates to ReplayApplicationService which coordinates
    with ReplayKernel for the actual constitutional replay operation.
    
    The router does not know what a canonical hash is - that concern
    belongs entirely to the ReplayKernel.
    """
    return await _replay_service.replay_events()
