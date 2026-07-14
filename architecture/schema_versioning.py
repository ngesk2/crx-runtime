"""
Schema Versioning Framework.

Introduces explicit schema versions for all constitutional runtime schemas.

Examples:
- Mission v1, Mission v2
- PlanningIR v3
- CanonicalIR v1
- Artifact v5
- Evidence v2
- Capability v4
- Workflow v6

Never mutate schemas in-place. Introduce migrations. Support forward evolution.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Callable, TypeVar
from datetime import datetime, timezone
from enum import Enum
import json
import uuid
from pathlib import Path
import importlib


class SchemaType(Enum):
    """Types of schemas in the runtime."""
    MISSION = "mission"
    PLANNING_IR = "planning_ir"
    CANONICAL_IR = "canonical_ir"
    ARTIFACT = "artifact"
    EVIDENCE = "evidence"
    CAPABILITY = "capability"
    WORKFLOW = "workflow"
    STRATEGY = "strategy"
    OBJECTIVE = "objective"
    TASK = "task"


@dataclass
class SchemaVersion:
    """A version of a schema."""
    schema_type: SchemaType
    version: str
    schema_definition: Dict[str, Any]
    created_at: str
    created_by: str
    deprecated: bool
    deprecated_at: Optional[str]
    migration_path: Optional[str]  # Path to migration function
    metadata: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "schema_type": self.schema_type.value,
            "version": self.version,
            "schema_definition": self.schema_definition,
            "created_at": self.created_at,
            "created_by": self.created_by,
            "deprecated": self.deprecated,
            "deprecated_at": self.deprecated_at,
            "migration_path": self.migration_path,
            "metadata": self.metadata
        }


@dataclass
class SchemaMigration:
    """A migration between schema versions."""
    migration_id: str
    schema_type: SchemaType
    from_version: str
    to_version: str
    migration_function: str  # Function path (module.function)
    created_at: str
    created_by: str
    metadata: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "migration_id": self.migration_id,
            "schema_type": self.schema_type.value,
            "from_version": self.from_version,
            "to_version": self.to_version,
            "migration_function": self.migration_function,
            "created_at": self.created_at,
            "created_by": self.created_by,
            "metadata": self.metadata
        }


T = TypeVar('T')


class SchemaRegistry:
    """
    Registry for schema versions and migrations.
    
    Never mutate schemas in-place.
    Introduce migrations.
    Support forward evolution.
    """
    
    def __init__(self, storage_path: str = "architecture/schemas/registry.json"):
        self.storage_path = Path(storage_path)
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        self._schemas: Dict[str, SchemaVersion] = {}  # Key: "schema_type:version"
        self._migrations: List[SchemaMigration] = []
        self._load()
    
    def _load(self) -> None:
        """Load schemas from storage."""
        if not self.storage_path.exists():
            return
        
        with open(self.storage_path, 'r') as f:
            data = json.load(f)
            
            for schema_data in data.get("schemas", []):
                schema = SchemaVersion(
                    schema_type=SchemaType(schema_data["schema_type"]),
                    version=schema_data["version"],
                    schema_definition=schema_data["schema_definition"],
                    created_at=schema_data["created_at"],
                    created_by=schema_data["created_by"],
                    deprecated=schema_data["deprecated"],
                    deprecated_at=schema_data.get("deprecated_at"),
                    migration_path=schema_data.get("migration_path"),
                    metadata=schema_data.get("metadata", {})
                )
                key = f"{schema.schema_type.value}:{schema.version}"
                self._schemas[key] = schema
            
            for migration_data in data.get("migrations", []):
                migration = SchemaMigration(
                    migration_id=migration_data["migration_id"],
                    schema_type=SchemaType(migration_data["schema_type"]),
                    from_version=migration_data["from_version"],
                    to_version=migration_data["to_version"],
                    migration_function=migration_data["migration_function"],
                    created_at=migration_data["created_at"],
                    created_by=migration_data["created_by"],
                    metadata=migration_data.get("metadata", {})
                )
                self._migrations.append(migration)
    
    def _save(self) -> None:
        """Save schemas to storage."""
        data = {
            "schemas": [schema.to_dict() for schema in self._schemas.values()],
            "migrations": [migration.to_dict() for migration in self._migrations],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        with open(self.storage_path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def register_schema(
        self,
        schema_type: SchemaType,
        version: str,
        schema_definition: Dict[str, Any],
        created_by: str = "system",
        migration_path: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> SchemaVersion:
        """
        Register a new schema version.
        
        Args:
            schema_type: Type of schema
            version: Schema version
            schema_definition: Schema definition
            created_by: Creator
            migration_path: Path to migration function
            metadata: Additional metadata
        
        Returns:
            Registered schema version
        """
        key = f"{schema_type.value}:{version}"
        
        if key in self._schemas:
            raise ValueError(f"Schema {key} already exists")
        
        schema = SchemaVersion(
            schema_type=schema_type,
            version=version,
            schema_definition=schema_definition,
            created_at=datetime.now(timezone.utc).isoformat(),
            created_by=created_by,
            deprecated=False,
            deprecated_at=None,
            migration_path=migration_path,
            metadata=metadata or {}
        )
        
        self._schemas[key] = schema
        self._save()
        
        return schema
    
    def register_migration(
        self,
        schema_type: SchemaType,
        from_version: str,
        to_version: str,
        migration_function: str,
        created_by: str = "system",
        metadata: Optional[Dict[str, Any]] = None
    ) -> SchemaMigration:
        """
        Register a migration between schema versions.
        
        Args:
            schema_type: Type of schema
            from_version: Source version
            to_version: Target version
            migration_function: Function path (module.function)
            created_by: Creator
            metadata: Additional metadata
        
        Returns:
            Registered migration
        """
        migration = SchemaMigration(
            migration_id=str(uuid.uuid4()),
            schema_type=schema_type,
            from_version=from_version,
            to_version=to_version,
            migration_function=migration_function,
            created_at=datetime.now(timezone.utc).isoformat(),
            created_by=created_by,
            metadata=metadata or {}
        )
        
        self._migrations.append(migration)
        self._save()
        
        return migration
    
    def get_schema(self, schema_type: SchemaType, version: str) -> Optional[SchemaVersion]:
        """Get a schema version."""
        key = f"{schema_type.value}:{version}"
        return self._schemas.get(key)
    
    def get_latest_schema(self, schema_type: SchemaType) -> Optional[SchemaVersion]:
        """Get the latest version of a schema."""
        schemas = [
            schema for schema in self._schemas.values()
            if schema.schema_type == schema_type and not schema.deprecated
        ]
        
        if not schemas:
            return None
        
        # Sort by version (simplified - assumes semantic versioning)
        schemas.sort(key=lambda s: s.version, reverse=True)
        return schemas[0]
    
    def get_all_versions(self, schema_type: SchemaType) -> List[SchemaVersion]:
        """Get all versions of a schema."""
        return [
            schema for schema in self._schemas.values()
            if schema.schema_type == schema_type
        ]
    
    def deprecate_schema(self, schema_type: SchemaType, version: str) -> bool:
        """Deprecate a schema version."""
        key = f"{schema_type.value}:{version}"
        schema = self._schemas.get(key)
        
        if not schema:
            return False
        
        schema.deprecated = True
        schema.deprecated_at = datetime.now(timezone.utc).isoformat()
        self._save()
        
        return True
    
    def get_migration_path(self, schema_type: SchemaType, from_version: str, to_version: str) -> Optional[List[SchemaMigration]]:
        """
        Get migration path from one version to another.
        
        Args:
            schema_type: Type of schema
            from_version: Source version
            to_version: Target version
        
        Returns:
            List of migrations in order, or None if no path exists
        """
        # Build migration graph
        graph: Dict[str, List[str]] = {}
        migration_map: Dict[tuple[str, str], SchemaMigration] = {}
        
        for migration in self._migrations:
            if migration.schema_type != schema_type:
                continue
            
            key = (migration.from_version, migration.to_version)
            migration_map[key] = migration
            
            if migration.from_version not in graph:
                graph[migration.from_version] = []
            graph[migration.from_version].append(migration.to_version)
        
        # BFS to find path
        from collections import deque
        
        queue = deque([(from_version, [])])
        visited = set()
        
        while queue:
            current, path = queue.popleft()
            
            if current == to_version:
                return path
            
            if current in visited:
                continue
            visited.add(current)
            
            for next_version in graph.get(current, []):
                key = (current, next_version)
                migration = migration_map.get(key)
                if migration:
                    queue.append((next_version, path + [migration]))
        
        return None


class SchemaMigrator:
    """
    Executes schema migrations.
    
    Loads migration functions and executes them to transform data between schema versions.
    """
    
    def __init__(self, registry: SchemaRegistry):
        self.registry = registry
    
    def migrate(
        self,
        schema_type: SchemaType,
        data: Dict[str, Any],
        from_version: str,
        to_version: str
    ) -> tuple[bool, Optional[Dict[str, Any]], str]:
        """
        Migrate data from one schema version to another.
        
        Args:
            schema_type: Type of schema
            data: Data to migrate
            from_version: Source version
            to_version: Target version
        
        Returns:
            (success, migrated_data, message)
        """
        # Get migration path
        migration_path = self.registry.get_migration_path(schema_type, from_version, to_version)
        
        if not migration_path:
            return False, None, f"No migration path from {from_version} to {to_version}"
        
        # Execute migrations in order
        current_data = data
        current_version = from_version
        
        for migration in migration_path:
            try:
                current_data = self._execute_migration(migration, current_data)
                current_version = migration.to_version
            except Exception as e:
                return False, None, f"Migration failed: {str(e)}"
        
        return True, current_data, f"Migrated from {from_version} to {to_version}"
    
    def _execute_migration(self, migration: SchemaMigration, data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single migration."""
        # Parse migration function path
        module_path, function_name = migration.migration_function.rsplit('.', 1)
        
        # Import module
        module = importlib.import_module(module_path)
        
        # Get function
        migration_function = getattr(module, function_name)
        
        # Execute migration
        return migration_function(data)


class SchemaValidator:
    """
    Validates data against schema definitions.
    """
    
    def __init__(self, registry: SchemaRegistry):
        self.registry = registry
    
    def validate(
        self,
        schema_type: SchemaType,
        version: str,
        data: Dict[str, Any]
    ) -> tuple[bool, List[str]]:
        """
        Validate data against a schema.
        
        Args:
            schema_type: Type of schema
            version: Schema version
            data: Data to validate
        
        Returns:
            (is_valid, errors)
        """
        schema = self.registry.get_schema(schema_type, version)
        
        if not schema:
            return False, [f"Schema {schema_type.value}:{version} not found"]
        
        errors = []
        schema_def = schema.schema_definition
        
        # Validate required fields
        required_fields = schema_def.get("required_fields", [])
        for field in required_fields:
            if field not in data:
                errors.append(f"Missing required field: {field}")
        
        # Validate field types
        field_types = schema_def.get("field_types", {})
        for field, expected_type in field_types.items():
            if field in data:
                if not self._check_type(data[field], expected_type):
                    errors.append(f"Field {field} has wrong type: expected {expected_type}")
        
        # Validate field constraints
        field_constraints = schema_def.get("field_constraints", {})
        for field, constraints in field_constraints.items():
            if field in data:
                if not self._check_constraints(data[field], constraints):
                    errors.append(f"Field {field} violates constraints: {constraints}")
        
        return len(errors) == 0, errors
    
    def _check_type(self, value: Any, expected_type: str) -> bool:
        """Check if value matches expected type."""
        type_map = {
            "string": str,
            "integer": int,
            "float": float,
            "boolean": bool,
            "list": list,
            "dict": dict
        }
        
        expected_python_type = type_map.get(expected_type)
        if expected_python_type:
            return isinstance(value, expected_python_type)
        
        return True
    
    def _check_constraints(self, value: Any, constraints: Dict[str, Any]) -> bool:
        """Check if value satisfies constraints."""
        if "min" in constraints and value < constraints["min"]:
            return False
        if "max" in constraints and value > constraints["max"]:
            return False
        if "min_length" in constraints and len(value) < constraints["min_length"]:
            return False
        if "max_length" in constraints and len(value) > constraints["max_length"]:
            return False
        if "pattern" in constraints:
            import re
            if not re.match(constraints["pattern"], str(value)):
                return False
        
        return True


# Initialize with base schemas
_schema_registry = SchemaRegistry()
_schema_migrator = SchemaMigrator(_schema_registry)
_schema_validator = SchemaValidator(_schema_registry)


def get_schema_registry() -> SchemaRegistry:
    """Get the singleton schema registry."""
    return _schema_registry


def get_schema_migrator() -> SchemaMigrator:
    """Get the singleton schema migrator."""
    return _schema_migrator


def get_schema_validator() -> SchemaValidator:
    """Get the singleton schema validator."""
    return _schema_validator
