"""
Command Application Service

Handles command creation, persistence, and orchestration.
Owns canonical serialization and hashing for command parameters.
"""

from typing import Optional
from datetime import datetime
from uuid import UUID, uuid4

from constitution.models.command import Command
from storage.postgres.database import get_session
from storage.postgres.models import Command as CommandModel
from api.dto import CommandRequestDTO, CommandResponseDTO
from runtime.di_container import RuntimeContainer


class CommandApplicationService:
    """Application service for command operations."""
    
    def __init__(self, container: RuntimeContainer):
        self.container = container
        self.authority = container.canonical_authority
    
    async def create_command(self, request: CommandRequestDTO) -> CommandResponseDTO:
        """
        Create a command with constitutional hashing and persistence.
        
        This method owns:
        - Canonical serialization of parameters
        - Canonical hashing of parameters
        - Persistence coordination
        """
        # Create command
        command = Command.create(
            command_type=request.command_type,
            parameters=request.parameters,
            created_at=datetime.utcnow(),
            aggregate_id=request.aggregate_id,
            aggregate_version=request.aggregate_version,
        )
        
        # Persist to PostgreSQL with constitutional hashing
        async with get_session() as session:
            # Compute canonical parameters hash
            canonical_parameters_bytes = self.authority.serialize_to_canonical_bytes(command.parameters)
            canonical_parameters_hash = self.authority.hash_canonical_bytes(canonical_parameters_bytes)
            
            # Create command record with constitutional hashing
            command_record = CommandModel(
                command_id=command.command_id,
                command_type=command.command_type,
                decoded_parameters_cache=command.parameters,
                canonical_parameters_bytes=canonical_parameters_bytes,
                canonical_parameters_hash=canonical_parameters_hash,
                aggregate_id=command.aggregate_id,
                created_at=command.created_at,
                status="created",
            )
            
            session.add(command_record)
            await session.commit()
            await session.refresh(command_record)
        
        return CommandResponseDTO(
            command_id=command.command_id,
            status="created",
        )
