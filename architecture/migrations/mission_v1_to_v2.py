"""
Schema Migration: Mission v1 to v2

This migration updates Mission schema from v1 to v2.

Changes:
- Added strategy_id field
- Added constitutional_version field
- Deprecated legacy fields
- Updated metadata structure
"""

from typing import Dict, Any


def migrate_mission_v1_to_v2(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Migrate Mission data from v1 to v2.
    
    Args:
        data: Mission v1 data
    
    Returns:
        Mission v2 data
    """
    # Create new data structure
    migrated = data.copy()
    
    # Add new fields with defaults
    migrated["strategy_id"] = data.get("strategy_id", None)
    migrated["constitutional_version"] = "2.0"
    
    # Update metadata structure
    if "metadata" not in migrated:
        migrated["metadata"] = {}
    
    migrated["metadata"]["schema_version"] = "v2"
    migrated["metadata"]["migrated_from"] = "v1"
    migrated["metadata"]["migrated_at"] = "2026-07-13T00:00:00Z"
    
    # Handle deprecated fields
    if "legacy_field" in migrated:
        migrated["metadata"]["legacy_field"] = migrated.pop("legacy_field")
    
    return migrated


def migrate_mission_v2_to_v3(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Migrate Mission data from v2 to v3.
    
    Args:
        data: Mission v2 data
    
    Returns:
        Mission v3 data
    """
    migrated = data.copy()
    
    # Add new fields
    migrated["evidence_requirements"] = data.get("evidence_requirements", [])
    migrated["verification_plan"] = data.get("verification_plan", None)
    
    # Update metadata
    migrated["metadata"]["schema_version"] = "v3"
    migrated["metadata"]["migrated_from"] = "v2"
    
    return migrated
