"""
Logger Interface - Contract for logging implementations.

This module defines the interface for all logging implementations.
EventBus and other services can inject a logger instead of using print().
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from datetime import datetime
from enum import Enum


class LogLevel(Enum):
    """Log levels."""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class Logger(ABC):
    """
    Abstract base class for logger implementations.
    
    All logger implementations must implement this interface.
    """
    
    @abstractmethod
    def debug(self, message: str, context: Optional[Dict[str, Any]] = None) -> None:
        """Log debug message."""
        pass
    
    @abstractmethod
    def info(self, message: str, context: Optional[Dict[str, Any]] = None) -> None:
        """Log info message."""
        pass
    
    @abstractmethod
    def warning(self, message: str, context: Optional[Dict[str, Any]] = None) -> None:
        """Log warning message."""
        pass
    
    @abstractmethod
    def error(self, message: str, context: Optional[Dict[str, Any]] = None) -> None:
        """Log error message."""
        pass
    
    @abstractmethod
    def critical(self, message: str, context: Optional[Dict[str, Any]] = None) -> None:
        """Log critical message."""
        pass


class ConsoleLogger(Logger):
    """
    Simple console logger implementation.
    
    Logs to stdout with timestamps and levels.
    """
    
    def __init__(self, level: LogLevel = LogLevel.INFO):
        self.level = level
    
    def _should_log(self, level: LogLevel) -> bool:
        """Check if message should be logged based on level."""
        level_order = {
            LogLevel.DEBUG: 0,
            LogLevel.INFO: 1,
            LogLevel.WARNING: 2,
            LogLevel.ERROR: 3,
            LogLevel.CRITICAL: 4
        }
        return level_order[level] >= level_order[self.level]
    
    def _format_message(self, level: LogLevel, message: str, context: Optional[Dict[str, Any]]) -> str:
        """Format log message."""
        timestamp = datetime.utcnow().isoformat()
        formatted = f"[{timestamp}] [{level.value.upper()}] {message}"
        if context:
            formatted += f" | Context: {context}"
        return formatted
    
    def debug(self, message: str, context: Optional[Dict[str, Any]] = None) -> None:
        """Log debug message."""
        if self._should_log(LogLevel.DEBUG):
            print(self._format_message(LogLevel.DEBUG, message, context))
    
    def info(self, message: str, context: Optional[Dict[str, Any]] = None) -> None:
        """Log info message."""
        if self._should_log(LogLevel.INFO):
            print(self._format_message(LogLevel.INFO, message, context))
    
    def warning(self, message: str, context: Optional[Dict[str, Any]] = None) -> None:
        """Log warning message."""
        if self._should_log(LogLevel.WARNING):
            print(self._format_message(LogLevel.WARNING, message, context))
    
    def error(self, message: str, context: Optional[Dict[str, Any]] = None) -> None:
        """Log error message."""
        if self._should_log(LogLevel.ERROR):
            print(self._format_message(LogLevel.ERROR, message, context))
    
    def critical(self, message: str, context: Optional[Dict[str, Any]] = None) -> None:
        """Log critical message."""
        if self._should_log(LogLevel.CRITICAL):
            print(self._format_message(LogLevel.CRITICAL, message, context))


class NullLogger(Logger):
    """
    Null logger that discards all messages.
    
    Useful for testing or when logging is disabled.
    """
    
    def debug(self, message: str, context: Optional[Dict[str, Any]] = None) -> None:
        """Discard debug message."""
        pass
    
    def info(self, message: str, context: Optional[Dict[str, Any]] = None) -> None:
        """Discard info message."""
        pass
    
    def warning(self, message: str, context: Optional[Dict[str, Any]] = None) -> None:
        """Discard warning message."""
        pass
    
    def error(self, message: str, context: Optional[Dict[str, Any]] = None) -> None:
        """Discard error message."""
        pass
    
    def critical(self, message: str, context: Optional[Dict[str, Any]] = None) -> None:
        """Discard critical message."""
        pass
