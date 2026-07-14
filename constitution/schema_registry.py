from typing import Any, Literal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from storage.postgres.models import Schema as SchemaModel
from constitution.hashing import CanonicalHasher
import json
import jsonschema


class SchemaRegistry:
    """Schema registry with compatibility checking"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def register_schema(
        self,
        schema_name: str,
        schema_version: str,
        schema_definition: dict[str, Any],
        compatibility_type: Literal["backward", "forward", "breaking", "deprecated"],
    ) -> str:
        """Register a schema in the registry"""
        # Compute schema hash using CanonicalHasher
        schema_hash = CanonicalHasher.hash_dict(schema_definition)
        
        # Check if schema already exists
        existing = await self.session.execute(
            select(SchemaModel).where(
                SchemaModel.schema_name == schema_name,
                SchemaModel.schema_version == schema_version,
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError(f"Schema {schema_name} v{schema_version} already exists")
        
        # Validate compatibility if not first version
        if schema_version != "1.0.0":
            await self._validate_compatibility(schema_name, schema_version, compatibility_type)
        
        # Create schema record
        schema_record = SchemaModel(
            schema_name=schema_name,
            schema_version=schema_version,
            schema_definition=schema_definition,
            compatibility_type=compatibility_type,
            schema_hash=schema_hash,
        )
        
        self.session.add(schema_record)
        await self.session.commit()
        
        return schema_hash
    
    async def validate(
        self,
        schema_name: str,
        schema_version: str,
        data: dict[str, Any],
    ) -> bool:
        """Validate data against a schema using full JSON Schema validation"""
        schema = await self.session.execute(
            select(SchemaModel).where(
                SchemaModel.schema_name == schema_name,
                SchemaModel.schema_version == schema_version,
            )
        )
        schema = schema.scalar_one_or_none()
        
        if not schema:
            raise ValueError(f"Schema {schema_name} v{schema_version} not found")
        
        # Use full JSON Schema validation
        schema_def = schema.schema_definition
        
        try:
            jsonschema.validate(instance=data, schema=schema_def)
            return True
        except jsonschema.ValidationError as e:
            # Validation failed
            return False
    
    async def canonicalize(self, data: dict[str, Any]) -> dict[str, Any]:
        """Canonicalize data (sorted keys, normalized unicode, no insignificant whitespace)"""
        # Sort keys
        canonical = dict(sorted(data.items()))
        
        # Normalize unicode (NFC)
        import unicodedata
        canonical = {
            k: unicodedata.normalize('NFC', v) if isinstance(v, str) else v
            for k, v in canonical.items()
        }
        
        return canonical
    
    async def version(self, schema_name: str) -> str:
        """Get the latest version of a schema"""
        schema = await self.session.execute(
            select(SchemaModel)
            .where(SchemaModel.schema_name == schema_name)
            .order_by(SchemaModel.created_at.desc())
            .limit(1)
        )
        schema = schema.scalar_one_or_none()
        
        if not schema:
            raise ValueError(f"Schema {schema_name} not found")
        
        return schema.schema_version
    
    async def compatibility_check(
        self,
        schema_name: str,
        from_version: str,
        to_version: str,
    ) -> bool:
        """Check if two schema versions are compatible"""
        from_schema = await self.session.execute(
            select(SchemaModel).where(
                SchemaModel.schema_name == schema_name,
                SchemaModel.schema_version == from_version,
            )
        )
        from_schema = from_schema.scalar_one_or_none()
        
        to_schema = await self.session.execute(
            select(SchemaModel).where(
                SchemaModel.schema_name == schema_name,
                SchemaModel.schema_version == to_version,
            )
        )
        to_schema = to_schema.scalar_one_or_none()
        
        if not from_schema or not to_schema:
            return False
        
        # Check compatibility type
        if to_schema.compatibility_type == "breaking":
            return False
        
        # For backward compatibility: old consumers can read new schema
        # For forward compatibility: new consumers can read old schema
        # For deprecated: compatibility maintained
        if to_schema.compatibility_type in ["backward", "forward", "deprecated"]:
            return True
        
        return False
    
    async def _validate_compatibility(
        self,
        schema_name: str,
        schema_version: str,
        compatibility_type: Literal["backward", "forward", "breaking", "deprecated"],
    ) -> None:
        """Validate compatibility with previous version"""
        # Get previous version
        previous = await self.session.execute(
            select(SchemaModel)
            .where(SchemaModel.schema_name == schema_name)
            .order_by(SchemaModel.created_at.desc())
            .limit(1)
        )
        previous = previous.scalar_one_or_none()
        
        if not previous:
            return  # First version, no compatibility check needed
        
        # Check compatibility type matches declaration
        if compatibility_type == "breaking":
            # Breaking changes are allowed but must be explicitly declared
            pass
        elif compatibility_type == "backward":
            # Old consumers must be able to read new schema
            # TODO: Implement actual compatibility validation
            pass
        elif compatibility_type == "forward":
            # New consumers must be able to read old schema
            # TODO: Implement actual compatibility validation
            pass
        elif compatibility_type == "deprecated":
            # Deprecated schemas must maintain compatibility
            # TODO: Implement actual compatibility validation
            pass
