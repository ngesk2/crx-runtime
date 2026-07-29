"""Command Schema

Typed command schemas instead of generic parameter bags.

Architecture:
CommandSchema
  ↓
  Typed Commands
  ↓
  CanonicalCommand

Replaces generic dict[str, Any] parameters with typed command schemas.
"""

from dataclasses import dataclass
from typing import Any, Type
from enum import Enum


class ParameterType(Enum):
    """Types of command parameters"""
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    LIST = "list"
    DICT = "dict"


@dataclass(frozen=True)
class ParameterSchema:
    """
    Schema for a command parameter.
    
    Contains:
    - name (parameter name)
    - type (parameter type)
    - required (whether parameter is required)
    - default (default value if not required)
    """
    name: str
    type: ParameterType
    required: bool = True
    default: Any = None
    
    def validate(self, value: Any) -> bool:
        """Validate a value against this schema"""
        if value is None:
            return not self.required
        
        if self.type == ParameterType.STRING:
            return isinstance(value, str)
        elif self.type == ParameterType.INTEGER:
            return isinstance(value, int)
        elif self.type == ParameterType.FLOAT:
            return isinstance(value, (int, float))
        elif self.type == ParameterType.BOOLEAN:
            return isinstance(value, bool)
        elif self.type == ParameterType.LIST:
            return isinstance(value, list)
        elif self.type == ParameterType.DICT:
            return isinstance(value, dict)
        else:
            return False


@dataclass(frozen=True)
class CommandSchema:
    """
    Schema for a command type.
    
    Contains:
    - command_type (command type)
    - parameters (list of parameter schemas)
    - version (schema version)
    """
    command_type: str
    parameters: list[ParameterSchema]
    version: str = "1.0.0"
    
    def validate(self, parameters: dict[str, Any]) -> bool:
        """
        Validate parameters against this schema.
        
        Args:
            parameters: Parameters to validate
        
        Returns:
            True if parameters are valid
        """
        # Check required parameters
        for param in self.parameters:
            if param.required and param.name not in parameters:
                return False
            
            if param.name in parameters:
                if not param.validate(parameters[param.name]):
                    return False
        
        return True
    
    def get_parameter_schema(self, name: str) -> ParameterSchema | None:
        """Get parameter schema by name"""
        for param in self.parameters:
            if param.name == name:
                return param
        return None


class CommandSchemaRegistry:
    """
    Registry for command schemas.
    
    Provides typed command schemas instead of generic parameter bags.
    """
    
    def __init__(self):
        self._schemas: dict[str, CommandSchema] = {}
    
    def register_schema(self, schema: CommandSchema) -> None:
        """Register a command schema"""
        self._schemas[schema.command_type] = schema
    
    def get_schema(self, command_type: str) -> CommandSchema | None:
        """Get command schema by type"""
        return self._schemas.get(command_type)
    
    def validate_command(self, command_type: str, parameters: dict[str, Any]) -> bool:
        """
        Validate command parameters against schema.
        
        Args:
            command_type: Command type
            parameters: Parameters to validate
        
        Returns:
            True if parameters are valid
        """
        schema = self.get_schema(command_type)
        if not schema:
            return False
        return schema.validate(parameters)
