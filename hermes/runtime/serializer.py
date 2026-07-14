"""
Mission Serializer - Mission serialization.

This service handles mission serialization and deserialization.
"""

from typing import Any, Dict
from datetime import datetime
from hermes.runtime.mission_factory import Mission, MissionFactory


class MissionSerializer:
    """
    Serializer for mission objects.
    
    Handles conversion between Mission objects and serialized formats.
    """
    
    def serialize(self, mission: Mission) -> Dict[str, Any]:
        """
        Serialize mission to dictionary.
        
        Args:
            mission: Mission instance
        
        Returns:
            Serialized mission data
        """
        return {
            "mission_id": mission.mission_id,
            "mission_hash": mission.mission_hash,
            "capability": mission.capability,
            "inputs": mission.inputs,
            "goal_id": mission.goal_id,
            "description": mission.description,
            "priority": mission.priority,
            "constraints": mission.constraints,
            "created_at": mission.created_at.isoformat() if mission.created_at else None,
            "created_by": mission.created_by,
        }
    
    def deserialize(self, data: Dict[str, Any]) -> Mission:
        """
        Deserialize dictionary to mission.
        
        Args:
            data: Serialized mission data
        
        Returns:
            Mission instance
        """
        factory = MissionFactory()
        return factory.reconstruct(data)
    
    def serialize_batch(self, missions: list[Mission]) -> list[Dict[str, Any]]:
        """
        Serialize multiple missions.
        
        Args:
            missions: List of Mission instances
        
        Returns:
            List of serialized mission data
        """
        return [self.serialize(mission) for mission in missions]
    
    def deserialize_batch(self, data_list: list[Dict[str, Any]]) -> list[Mission]:
        """
        Deserialize multiple missions.
        
        Args:
            data_list: List of serialized mission data
        
        Returns:
            List of Mission instances
        """
        return [self.deserialize(data) for data in data_list]
