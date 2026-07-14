"""
Authority package - Constitutional decision layer.

Authorities decide constitutional validity.
Kernel executes authority decisions.

This separation ensures:
- Constitutional logic is auditable and testable
- Execution infrastructure can be swapped without affecting constitutional rules
- Clear separation between "what to do" (authority) and "how to do it" (kernel/capabilities)
"""

from authority.aggregate_authority import AggregateAuthority
from authority.registry_authority import RegistryAuthority
from authority.projection_authority import ProjectionAuthority
from authority.snapshot_authority import SnapshotAuthority
from authority.migration_authority import MigrationAuthority

__all__ = [
    "AggregateAuthority",
    "RegistryAuthority",
    "ProjectionAuthority",
    "SnapshotAuthority",
    "MigrationAuthority",
]
