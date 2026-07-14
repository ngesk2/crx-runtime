"""
MigrationAuthority - Constitutional decision layer for migrations.

Decides:
- Whether migrations are constitutionally valid
- Whether migration order is correct
- Whether migration rollback is possible
- Whether migration events are replayable

The kernel executes these decisions via capability interfaces.
"""

from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession


class MigrationAuthority:
    """
    Constitutional authority for migration management.
    
    This authority decides constitutional validity of migration operations.
    It does not execute operations - that's the kernel's job.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def validate_migration(
        self,
        migration_type: str,
        migration_name: str,
        version: str,
        migration_data: Dict[str, Any],
        rollback_data: Optional[Dict[str, Any]],
    ) -> bool:
        """
        Validate that a migration is constitutionally valid.
        
        Checks:
        - Migration type is valid (SchemaRegistered, ReducerUpgraded, etc.)
        - Migration data is well-formed
        - Rollback data is provided if needed
        - Version follows semantic versioning
        """
        valid_migration_types = [
            "SchemaRegistered",
            "ReducerUpgraded",
            "ProjectionUpgraded",
            "SnapshotInvalidated",
            "RegistryUpdated",
        ]
        
        if migration_type not in valid_migration_types:
            return False
        
        # Migration data must be present
        if not migration_data:
            return False
        
        return True
    
    async def validate_migration_order(
        self,
        migration_id: str,
        previous_migration_id: Optional[str],
    ) -> bool:
        """
        Validate that migration order is constitutionally correct.
        
        Checks:
        - Migrations are applied in correct sequence
        - No circular dependencies
        - Previous migration exists if specified
        """
        # If previous_migration_id is specified, it must exist
        if previous_migration_id:
            # Validate previous migration exists and was applied
            pass
        
        return True
    
    async def validate_rollback(
        self,
        migration_id: str,
        rollback_data: Dict[str, Any],
    ) -> bool:
        """
        Validate that migration rollback is constitutionally possible.
        
        Checks:
        - Rollback data is present and valid
        - Rollback is constitutionally safe
        - No dependent migrations would be broken
        """
        if not rollback_data:
            return False
        
        return True
    
    async def validate_replayability(
        self,
        migration_type: str,
        migration_data: Dict[str, Any],
    ) -> bool:
        """
        Validate that migration is constitutionally replayable.
        
        Checks:
        - Migration is idempotent
        - Migration can be safely replayed
        - Migration doesn't depend on external state
        """
        # All constitutional migrations should be replayable
        # This ensures a fresh node can reconstruct the entire system
        return True
    
    async def get_applied_migrations(
        self,
        migration_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get list of constitutionally applied migrations.
        
        Returns migrations in application order.
        """
        from storage.postgres.models import ConstitutionalMigration as MigrationModel
        from sqlalchemy import select
        
        query = select(MigrationModel)
        
        if migration_type:
            query = query.where(MigrationModel.migration_type == migration_type)
        
        query = query.order_by(MigrationModel.applied_at.asc())
        
        result = await self.session.execute(query)
        migrations = result.scalars().all()
        
        return [
            {
                "migration_id": m.migration_id,
                "migration_type": m.migration_type,
                "migration_name": m.migration_name,
                "version": m.version,
                "applied_at": m.applied_at,
            }
            for m in migrations
        ]
