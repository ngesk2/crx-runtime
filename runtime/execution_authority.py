"""Execution Authority

Central authority for all execution models.

Instead of scattered execution across:
- HTTP
- Queue
- Cron
- Webhook
- CLI
- Replay

Everything becomes:
ExecutionRequest
  ↓
  ExecutionAuthority
  ↓
  ExecutionContext
  ↓
  Kernel

One execution model.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Callable
from enum import Enum

from runtime.execution_context import ExecutionContext


class ExecutionSource(Enum):
    """Sources of execution requests"""
    HTTP = "http"
    QUEUE = "queue"
    CRON = "cron"
    WEBHOOK = "webhook"
    CLI = "cli"
    REPLAY = "replay"


class ExecutionStatus(Enum):
    """Execution status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass(frozen=True)
class ExecutionRequest:
    """
    Immutable execution request.
    
    Contains:
    - execution_id (unique identifier)
    - source (execution source)
    - command_data (command to execute)
    - metadata (execution metadata)
    - created_at (request creation time)
    """
    execution_id: str
    source: ExecutionSource
    command_data: dict[str, Any]
    metadata: dict[str, Any] | None = None
    created_at: datetime | None = None
    
    @classmethod
    def create(
        cls,
        source: ExecutionSource,
        command_data: dict[str, Any],
        metadata: dict[str, Any] | None = None,
        execution_id: str | None = None,
    ) -> "ExecutionRequest":
        """Create execution request"""
        import uuid
        return cls(
            execution_id=execution_id or str(uuid.uuid4()),
            source=source,
            command_data=command_data,
            metadata=metadata,
            created_at=datetime.utcnow(),
        )


@dataclass
class ExecutionResult:
    """
    Execution result.
    
    Contains:
    - execution_id (matching request)
    - status (execution status)
    - result_data (result or error data)
    - started_at (execution start time)
    - completed_at (execution completion time)
    - error (error if failed)
    """
    execution_id: str
    status: ExecutionStatus
    result_data: dict[str, Any] | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error: str | None = None
    
    @classmethod
    def create_success(
        cls,
        execution_id: str,
        result_data: dict[str, Any],
        started_at: datetime,
    ) -> "ExecutionResult":
        """Create successful execution result"""
        return cls(
            execution_id=execution_id,
            status=ExecutionStatus.COMPLETED,
            result_data=result_data,
            started_at=started_at,
            completed_at=datetime.utcnow(),
        )
    
    @classmethod
    def create_failure(
        cls,
        execution_id: str,
        error: str,
        started_at: datetime,
    ) -> "ExecutionResult":
        """Create failed execution result"""
        return cls(
            execution_id=execution_id,
            status=ExecutionStatus.FAILED,
            error=error,
            started_at=started_at,
            completed_at=datetime.utcnow(),
        )


class ExecutionAuthority:
    """
    Authority for managing execution across all sources.
    
    Centralizes execution logic:
    - HTTP → ExecutionRequest → ExecutionContext → Kernel
    - Queue → ExecutionRequest → ExecutionContext → Kernel
    - Cron → ExecutionRequest → ExecutionContext → Kernel
    - Webhook → ExecutionRequest → ExecutionContext → Kernel
    - CLI → ExecutionRequest → ExecutionContext → Kernel
    - Replay → ExecutionRequest → ExecutionContext → Kernel
    
    One execution model.
    """
    
    def __init__(
        self,
        execution_context: ExecutionContext,
        kernel_handler: Callable[[dict[str, Any], ExecutionContext], dict[str, Any]],
    ):
        self.execution_context = execution_context
        self.kernel_handler = kernel_handler
        self._active_executions: dict[str, ExecutionRequest] = {}
    
    async def execute(
        self,
        request: ExecutionRequest,
    ) -> ExecutionResult:
        """
        Execute request through kernel.
        
        ExecutionRequest → ExecutionAuthority → ExecutionContext → Kernel
        """
        # Track active execution
        self._active_executions[request.execution_id] = request
        
        started_at = datetime.utcnow()
        
        try:
            # Execute through kernel with execution context
            result_data = await self.kernel_handler(request.command_data, self.execution_context)
            
            # Create success result
            result = ExecutionResult.create_success(
                execution_id=request.execution_id,
                result_data=result_data,
                started_at=started_at,
            )
        except Exception as e:
            # Create failure result
            result = ExecutionResult.create_failure(
                execution_id=request.execution_id,
                error=str(e),
                started_at=started_at,
            )
        finally:
            # Remove from active executions
            self._active_executions.pop(request.execution_id, None)
        
        return result
    
    def create_http_request(
        self,
        command_data: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ) -> ExecutionRequest:
        """Create HTTP execution request"""
        return ExecutionRequest.create(
            source=ExecutionSource.HTTP,
            command_data=command_data,
            metadata=metadata,
        )
    
    def create_queue_request(
        self,
        command_data: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ) -> ExecutionRequest:
        """Create queue execution request"""
        return ExecutionRequest.create(
            source=ExecutionSource.QUEUE,
            command_data=command_data,
            metadata=metadata,
        )
    
    def create_cron_request(
        self,
        command_data: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ) -> ExecutionRequest:
        """Create cron execution request"""
        return ExecutionRequest.create(
            source=ExecutionSource.CRON,
            command_data=command_data,
            metadata=metadata,
        )
    
    def create_webhook_request(
        self,
        command_data: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ) -> ExecutionRequest:
        """Create webhook execution request"""
        return ExecutionRequest.create(
            source=ExecutionSource.WEBHOOK,
            command_data=command_data,
            metadata=metadata,
        )
    
    def create_cli_request(
        self,
        command_data: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ) -> ExecutionRequest:
        """Create CLI execution request"""
        return ExecutionRequest.create(
            source=ExecutionSource.CLI,
            command_data=command_data,
            metadata=metadata,
        )
    
    def create_replay_request(
        self,
        command_data: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ) -> ExecutionRequest:
        """Create replay execution request"""
        return ExecutionRequest.create(
            source=ExecutionSource.REPLAY,
            command_data=command_data,
            metadata=metadata,
        )
    
    def get_active_executions(self) -> list[str]:
        """Get list of active execution IDs"""
        return list(self._active_executions.keys())
    
    def is_execution_active(self, execution_id: str) -> bool:
        """Check if execution is currently active"""
        return execution_id in self._active_executions
