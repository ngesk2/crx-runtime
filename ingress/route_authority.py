"""Route Authority

Central authority for HTTP routing to commands.

Architecture:
RouteAuthority
  ↓
  RouteDescriptor (pure routing)
  ↓
  DeserializerAuthority (pure deserialization)
  ↓
  CanonicalCommand (immutable value object)

RouteAuthority is pure routing - no business interpretation.
DeserializerAuthority is pure deserialization - no routing logic.
"""

from dataclasses import dataclass
from typing import Any
from enum import Enum


class CanonicalCommandType(Enum):
    """Constitutional command types"""
    SUBSCRIBE = "subscribe"
    UNSUBSCRIBE = "unsubscribe"
    SEND_SMS = "send_sms"
    SEND_BROADCAST = "send_broadcast"
    ADD_TAG = "add_tag"
    ENROLL_SEQUENCE = "enroll_sequence"
    TRIGGER_AUTOMATION = "trigger_automation"


@dataclass(frozen=True)
class CanonicalCommand:
    """
    Immutable canonical command value object.
    
    Replaces dict returns from routing with a strongly-typed immutable object.
    Reducers shouldn't parse dictionaries - they should work with value objects.
    
    Contains:
    - command_type (CanonicalCommandType)
    - parameters (command parameters)
    - metadata (non-constitutional metadata)
    """
    command_type: CanonicalCommandType
    parameters: dict[str, Any]
    metadata: dict[str, Any] | None = None
    
    def get_parameter(self, key: str, default: Any = None) -> Any:
        """Get a parameter value"""
        return self.parameters.get(key, default)
    
    def has_parameter(self, key: str) -> bool:
        """Check if parameter exists"""
        return key in self.parameters
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary (for backward compatibility)"""
        return {
            "command_type": self.command_type.value,
            "parameters": self.parameters,
            "metadata": self.metadata,
        }


@dataclass(frozen=True)
class RouteDescriptor:
    """
    Pure routing descriptor.
    
    Contains only routing information:
    - command_type (CanonicalCommandType)
    - route_pattern (HTTP route pattern)
    - http_method (GET, POST, etc.)
    - parameter_schema (expected parameters)
    
    No factory - deserialization is handled by DeserializerAuthority.
    """
    command_type: CanonicalCommandType
    route_pattern: str
    http_method: str
    parameter_schema: dict[str, Any] | None = None
    
    def matches(self, route: str, method: str) -> bool:
        """Check if route and method match this descriptor"""
        return route == self.route_pattern and method == self.http_method


class DeserializerAuthority:
    """
    Authority for deserializing requests into canonical commands.
    
    Pure deserialization - no routing logic.
    RouteAuthority handles routing, DeserializerAuthority handles deserialization.
    
    Returns CanonicalCommand value objects, not dicts.
    """
    
    def __init__(self):
        self._deserializers: dict[CanonicalCommandType, callable] = {}
    
    def register_deserializer(
        self,
        command_type: CanonicalCommandType,
        deserializer: callable,
    ) -> None:
        """Register a deserializer for a command type"""
        self._deserializers[command_type] = deserializer
    
    def deserialize(
        self,
        command_type: CanonicalCommandType,
        request_data: dict[str, Any],
    ) -> CanonicalCommand:
        """
        Deserialize request data into canonical command.
        
        RequestData → DeserializerAuthority → CanonicalCommand
        
        Returns CanonicalCommand value object, not dict.
        """
        deserializer = self._deserializers.get(command_type)
        
        if deserializer:
            # Use registered deserializer (should return CanonicalCommand)
            result = deserializer(request_data)
            # If deserializer returns dict, convert to CanonicalCommand
            if isinstance(result, dict):
                return CanonicalCommand(
                    command_type=command_type,
                    parameters=result,
                )
            # If deserializer already returns CanonicalCommand, use it
            return result
        else:
            # Default deserializer: pass through with command_type
            return CanonicalCommand(
                command_type=command_type,
                parameters=request_data,
            )


class RouteRegistry:
    """
    Registry for command routing.
    
    Pure routing - no business interpretation.
    """
    
    def __init__(self):
        self._routes: dict[str, RouteDescriptor] = {}
    
    def register_route(self, descriptor: RouteDescriptor) -> None:
        """Register a route descriptor"""
        key = f"{descriptor.http_method}:{descriptor.route_pattern}"
        self._routes[key] = descriptor
    
    def resolve(self, route: str, method: str) -> RouteDescriptor:
        """Resolve route to route descriptor"""
        key = f"{method}:{route}"
        descriptor = self._routes.get(key)
        if not descriptor:
            raise ValueError(f"No route registered for: {method} {route}")
        return descriptor
    
    def list_routes(self) -> list[RouteDescriptor]:
        """List all registered routes"""
        return list(self._routes.values())


class RouteAuthority:
    """
    Authority for HTTP routing to commands.
    
    Architecture:
    RouteAuthority
      ↓
      RouteRegistry (pure routing)
      ↓
      DeserializerAuthority (pure deserialization)
      ↓
      CanonicalCommand
    
    Separation of concerns:
    - RouteRegistry handles routing
    - DeserializerAuthority handles deserialization
    - No business interpretation in routing
    - No routing logic in deserialization
    """
    
    def __init__(self):
        self.registry = RouteRegistry()
        self.deserializer = DeserializerAuthority()
    
    def register_route(self, descriptor: RouteDescriptor) -> None:
        """Register a route"""
        self.registry.register_route(descriptor)
    
    def register_deserializer(
        self,
        command_type: CanonicalCommandType,
        deserializer: callable,
    ) -> None:
        """Register a deserializer"""
        self.deserializer.register_deserializer(command_type, deserializer)
    
    def resolve_command(
        self,
        route: str,
        method: str,
        request_data: dict[str, Any],
    ) -> CanonicalCommand:
        """
        Resolve HTTP request to canonical command.
        
        HTTP adapter becomes:
        Request → RouteAuthority.resolve_command() → CanonicalCommand → kernel
        
        Flow:
        1. RouteRegistry resolves route to RouteDescriptor
        2. DeserializerAuthority deserializes request to CanonicalCommand
        
        Returns CanonicalCommand value object, not dict.
        """
        # Resolve route to descriptor
        descriptor = self.registry.resolve(route, method)
        
        # Deserialize request to canonical command
        command = self.deserializer.deserialize(
            descriptor.command_type,
            request_data,
        )
        
        return command
