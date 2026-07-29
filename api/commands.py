"""
Command API Module

Handles command-related HTTP endpoints.
Delegates to CommandApplicationService for business logic.
"""

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from application.command_service import CommandApplicationService
from api.dto import CommandRequestDTO, CommandResponseDTO

router = APIRouter(prefix="/commands", tags=["commands"])

# Application service (will be injected via DI)
_command_service: CommandApplicationService = None


def set_command_service(service: CommandApplicationService):
    """Set the command application service (DI)."""
    global _command_service
    _command_service = service


@router.post("", status_code=status.HTTP_201_CREATED, response_model=CommandResponseDTO)
async def create_command(request: CommandRequestDTO) -> CommandResponseDTO:
    """Create a command with constitutional hashing and persistence."""
    return await _command_service.create_command(request)
