from datetime import datetime
from typing import Any, Callable, Awaitable
from sqlalchemy.ext.asyncio import AsyncSession
from constitution.models.command import Command
from kernel.aggregate import AggregateRepository, OptimisticConcurrencyError


class CommandResult:
    """Result of command execution"""
    
    def __init__(
        self,
        success: bool,
        events: list[Any] | None = None,
        error: str | None = None,
        aggregate_id: str | None = None,
        aggregate_version: int | None = None,
    ):
        self.success = success
        self.events = events or []
        self.error = error
        self.aggregate_id = aggregate_id
        self.aggregate_version = aggregate_version
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary"""
        return {
            "success": self.success,
            "events": self.events,
            "error": self.error,
            "aggregate_id": self.aggregate_id,
            "aggregate_version": self.aggregate_version,
        }


class CommandHandler:
    """
    Base class for command handlers.
    
    Command handlers validate commands, load aggregates, execute business logic,
    and emit events.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.aggregate_repository = AggregateRepository(session)
    
    async def handle(self, command: Command) -> CommandResult:
        """
        Handle a command.
        
        Override this method in subclasses to implement specific command handling.
        """
        raise NotImplementedError("Command handlers必须实现 handle 方法")
    
    async def validate_command(self, command: Command) -> bool:
        """
        Validate a command before handling.
        
        Override this method in subclasses to implement specific validation.
        """
        return True
    
    async def load_aggregate(self, aggregate_id: str, aggregate_type: str):
        """Load an aggregate by ID"""
        return await self.aggregate_repository.load(aggregate_id, aggregate_type)
    
    async def save_aggregate(self, aggregate) -> list[Any]:
        """Save an aggregate and return emitted events"""
        return await self.aggregate_repository.save(aggregate)


class CommandMiddleware:
    """
    Middleware for command processing.
    
    Middleware can be used to add cross-cutting concerns like logging,
    validation, authorization, etc.
    """
    
    async def before_handle(self, command: Command) -> Command:
        """
        Called before command handling.
        
        Can be used to modify the command or perform pre-processing.
        """
        return command
    
    async def after_handle(
        self,
        command: Command,
        result: CommandResult,
    ) -> CommandResult:
        """
        Called after command handling.
        
        Can be used to modify the result or perform post-processing.
        """
        return result
    
    async def on_error(
        self,
        command: Command,
        error: Exception,
    ) -> CommandResult:
        """
        Called when an error occurs during command handling.
        
        Can be used to handle errors or perform cleanup.
        """
        return CommandResult(
            success=False,
            error=str(error),
        )


class LoggingMiddleware(CommandMiddleware):
    """Middleware that logs command execution"""
    
    async def before_handle(self, command: Command) -> Command:
        print(f"[CommandBus] Handling command: {command.command_type} ({command.command_id})")
        return command
    
    async def after_handle(
        self,
        command: Command,
        result: CommandResult,
    ) -> CommandResult:
        if result.success:
            print(f"[CommandBus] Command succeeded: {command.command_type} ({command.command_id})")
        else:
            print(f"[CommandBus] Command failed: {command.command_type} ({command.command_id}) - {result.error}")
        return result


class ValidationMiddleware(CommandMiddleware):
    """Middleware that validates commands"""
    
    def __init__(self, validator: Callable[[Command], Awaitable[bool]]):
        self.validator = validator
    
    async def before_handle(self, command: Command) -> Command:
        if not await self.validator(command):
            raise ValueError(f"Command validation failed: {command.command_type}")
        return command


class CommandDispatcher:
    """
    Dispatches commands to appropriate handlers.
    
    Routes commands to handlers based on command type and applies middleware.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self._handlers: dict[str, CommandHandler] = {}
        self._middleware: list[CommandMiddleware] = []
    
    def register_handler(
        self,
        command_type: str,
        handler: CommandHandler,
    ) -> None:
        """Register a command handler for a command type"""
        self._handlers[command_type] = handler
    
    def add_middleware(self, middleware: CommandMiddleware) -> None:
        """Add middleware to the command processing pipeline"""
        self._middleware.append(middleware)
    
    async def dispatch(self, command: Command) -> CommandResult:
        """
        Dispatch a command to its handler.
        
        Applies middleware in order and routes to the appropriate handler.
        """
        # Apply before middleware
        for middleware in self._middleware:
            command = await middleware.before_handle(command)
        
        # Get handler
        handler = self._handlers.get(command.command_type)
        if not handler:
            return CommandResult(
                success=False,
                error=f"No handler registered for command type: {command.command_type}",
            )
        
        # Handle command
        try:
            result = await handler.handle(command)
        except Exception as e:
            # Apply error middleware
            result = await self._middleware[0].on_error(command, e) if self._middleware else CommandResult(
                success=False,
                error=str(e),
            )
        
        # Apply after middleware
        for middleware in reversed(self._middleware):
            result = await middleware.after_handle(command, result)
        
        return result
    
    async def dispatch_batch(self, commands: list[Command]) -> list[CommandResult]:
        """Dispatch multiple commands in batch"""
        results = []
        for command in commands:
            result = await self.dispatch(command)
            results.append(result)
        return results


class CommandBus:
    """
    Main command bus for the constitutional runtime.
    
    Coordinates command handling, validation, and routing.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.dispatcher = CommandDispatcher(session)
        
        # Add default middleware
        self.dispatcher.add_middleware(LoggingMiddleware())
    
    def register_handler(
        self,
        command_type: str,
        handler: CommandHandler,
    ) -> None:
        """Register a command handler"""
        self.dispatcher.register_handler(command_type, handler)
    
    def add_middleware(self, middleware: CommandMiddleware) -> None:
        """Add middleware to the command bus"""
        self.dispatcher.add_middleware(middleware)
    
    async def send(self, command: Command) -> CommandResult:
        """Send a command for processing"""
        return await self.dispatcher.dispatch(command)
    
    async def send_batch(self, commands: list[Command]) -> list[CommandResult]:
        """Send multiple commands for processing"""
        return await self.dispatcher.dispatch_batch(commands)
