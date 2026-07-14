"""
Object Registry - Central registry for constitutional objects.

This registry defines all constitutional objects that can be created,
manipulated, and authorized within the system.
"""

from typing import Any, Dict, List, Optional, Type
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import json


class ObjectCategory(Enum):
    """Categories of constitutional objects."""
    EVIDENCE = "evidence"           # Evidence from external systems
    EVENT = "event"                 # Events in event store
    MISSION = "mission"             # Missions and tasks
    AUTHORITY = "authority"         # Constitutional authorities
    CAPABILITY = "capability"       # System capabilities
    WORKFLOW = "workflow"           # Workflows and pipelines
    CONNECTOR = "connector"         # External system connectors
    PROMPT = "prompt"              # Prompts and templates
    TOOL = "tool"                  # Tools and utilities
    RESOURCE = "resource"           # System resources


@dataclass
class ObjectSchema:
    """Schema definition for a constitutional object."""
    name: str
    version: str
    category: ObjectCategory
    description: str
    properties: Dict[str, Any] = field(default_factory=dict)
    required_fields: List[str] = field(default_factory=list)
    indexes: List[str] = field(default_factory=list)
    constraints: Dict[str, Any] = field(default_factory=dict)
    examples: List[Dict[str, Any]] = field(default_factory=list)
    
    def validate(self, obj: Dict[str, Any]) -> bool:
        """Validate an object against this schema."""
        # Check required fields
        for field in self.required_fields:
            if field not in obj:
                return False
        
        # Check constraints
        for field, constraint in self.constraints.items():
            if field in obj:
                if not self._check_constraint(obj[field], constraint):
                    return False
        
        return True
    
    def _check_constraint(self, value: Any, constraint: Dict[str, Any]) -> bool:
        """Check a single constraint."""
        constraint_type = constraint.get("type")
        
        if constraint_type == "min":
            return value >= constraint["value"]
        elif constraint_type == "max":
            return value <= constraint["value"]
        elif constraint_type == "pattern":
            import re
            return bool(re.match(constraint["value"], str(value)))
        elif constraint_type == "enum":
            return value in constraint["values"]
        
        return True


class ObjectRegistry:
    """
    Central registry for constitutional objects.
    
    This registry provides:
    - Object schema discovery
    - Object validation
    - Object serialization/deserialization
    - Object relationships
    """
    
    def __init__(self):
        self._schemas: Dict[str, ObjectSchema] = {}
        self._categories: Dict[ObjectCategory, List[str]] = {
            category: [] for category in ObjectCategory
        }
        self._relationships: Dict[str, List[str]] = {}
    
    def register_schema(self, schema: ObjectSchema) -> None:
        """Register an object schema."""
        name = schema.name
        
        if name in self._schemas:
            raise ValueError(f"Schema {name} already registered")
        
        self._schemas[name] = schema
        self._categories[schema.category].append(name)
        
        print(f"Registered object schema: {name} ({schema.category.value})")
    
    def get_schema(self, name: str) -> Optional[ObjectSchema]:
        """Get an object schema by name."""
        return self._schemas.get(name)
    
    def list_schemas(self, category: Optional[ObjectCategory] = None) -> List[str]:
        """List schema names, optionally filtered by category."""
        if category is None:
            return list(self._schemas.keys())
        return self._categories[category].copy()
    
    def validate_object(self, schema_name: str, obj: Dict[str, Any]) -> bool:
        """Validate an object against a schema."""
        schema = self.get_schema(schema_name)
        if schema is None:
            raise ValueError(f"Schema {schema_name} not found")
        
        return schema.validate(obj)
    
    def serialize_object(self, schema_name: str, obj: Dict[str, Any]) -> str:
        """Serialize an object to JSON."""
        if not self.validate_object(schema_name, obj):
            raise ValueError(f"Object does not conform to schema {schema_name}")
        
        return json.dumps(obj, indent=2, default=str)
    
    def deserialize_object(self, schema_name: str, json_str: str) -> Dict[str, Any]:
        """Deserialize an object from JSON."""
        obj = json.loads(json_str)
        
        if not self.validate_object(schema_name, obj):
            raise ValueError(f"Object does not conform to schema {schema_name}")
        
        return obj
    
    def add_relationship(self, from_schema: str, to_schema: str) -> None:
        """Add a relationship between schemas."""
        if from_schema not in self._relationships:
            self._relationships[from_schema] = []
        
        if to_schema not in self._relationships[from_schema]:
            self._relationships[from_schema].append(to_schema)
    
    def get_relationships(self, schema_name: str) -> List[str]:
        """Get relationships for a schema."""
        return self._relationships.get(schema_name, [])


# Global registry instance
_global_registry: Optional[ObjectRegistry] = None


def get_object_registry() -> ObjectRegistry:
    """Get the global object registry."""
    global _global_registry
    if _global_registry is None:
        _global_registry = ObjectRegistry()
    return _global_registry


def register_object_schema(schema: ObjectSchema) -> None:
    """Register an object schema with the global registry."""
    registry = get_object_registry()
    registry.register_schema(schema)
