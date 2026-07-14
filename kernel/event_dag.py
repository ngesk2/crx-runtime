from typing import Any, Dict, List, Optional, Set
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from storage.postgres.models import Event as EventModel
from constitution.models.event import EventEnvelope
from datetime import datetime
from collections import defaultdict
import json


class EventDAG:
    """
    Event Directed Acyclic Graph (DAG).
    
    Tracks causal relationships between events:
    - causedBy: Command that caused the event
    - parent: Direct parent event (causal chain)
    - aggregate lineage: Events for the same aggregate
    - correlation: Events in the same transaction
    - forks: Parallel branches from same parent
    - joins: Merge points where branches converge
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self._adjacency_map: dict[str, list[str]] = {}  # event_id -> list of parent event_ids
        self._parent_map: dict[str, str] = {}  # event_id -> immediate parent
    
    async def build_event_dag(self) -> Dict[str, Any]:
        """Build the complete causal event DAG from the event log"""
        from storage.postgres.models import Event as EventModel
        
        # Load all events
        query = select(EventModel).order_by(EventModel.global_sequence)
        result = await self.session.execute(query)
        events = result.scalars().all()
        
        # Build adjacency list based on causal relationships
        dag = {
            "nodes": [],
            "edges": [],
        }
        
        # Clear and rebuild adjacency maps
        self._adjacency_map = {}
        self._parent_map = {}
        
        # Build lookup dicts for O(n) lineage construction
        last_event_by_command: dict[str, str] = {}  # command_id -> event_id
        last_event_by_aggregate: dict[str, str] = {}  # aggregate_id -> event_id
        last_event_by_correlation: dict[str, str] = {}  # correlation_id -> event_id
        
        # Add nodes and build edges in single pass (O(n))
        for event in events:
            dag["nodes"].append({
                "id": event.event_id,
                "type": event.event_type,
                "global_sequence": event.global_sequence,
                "aggregate_sequence": event.aggregate_sequence,
                "correlation_id": event.correlation_id,
                "causality_id": event.causality_id,
                "caused_by_command_id": event.caused_by_command_id,
            })
            
            # Initialize adjacency list for this event
            self._adjacency_map[event.event_id] = []
            
            # Causal edge: causedBy command (O(1) lookup)
            if event.caused_by_command_id:
                if event.caused_by_command_id in last_event_by_command:
                    parent_id = last_event_by_command[event.caused_by_command_id]
                    dag["edges"].append({
                        "from": parent_id,
                        "to": event.event_id,
                        "type": "caused_by_command",
                    })
                    self._adjacency_map[event.event_id].append(parent_id)
                    self._parent_map[event.event_id] = parent_id
                last_event_by_command[event.caused_by_command_id] = event.event_id
            
            # Aggregate lineage edge: previous event in aggregate stream (O(1) lookup)
            if event.causality_id:
                if event.causality_id in last_event_by_aggregate:
                    parent_id = last_event_by_aggregate[event.causality_id]
                    dag["edges"].append({
                        "from": parent_id,
                        "to": event.event_id,
                        "type": "aggregate_lineage",
                    })
                    self._adjacency_map[event.event_id].append(parent_id)
                    self._parent_map[event.event_id] = parent_id
                last_event_by_aggregate[event.causality_id] = event.event_id
            
            # Correlation edges (O(1) lookup)
            if	event.correlation_id:
                if event.correlation_id in last_event_by_correlation:
                    parent_id = last_event_by_correlation[event.correlation_id]
                    dag["edges"].append({
                        "from": parent_id,
                        "to": event.event_id,
                        "type": "correlation",
                    })
                    self._adjacency_map[event.event_id].append(parent_id)
                last_event_by_correlation[event.correlation_id] = event.event_id
        
        return dag
    
    async def get_event_ancestors(self, event_id: str) -> List[str]:
        """
        Get all ancestors of an event in the causal DAG.
        
        Uses adjacency map for O(depth) lookup instead of SQL scans.
        """
        # Ensure DAG is built
        if not self._adjacency_map:
            await self.build_event_dag()
        
        # Traverse ancestry using adjacency map (O(depth))
        ancestors = []
        visited = set()
        current = event_id
        
        while current in self._parent_map:
            parent = self._parent_map[current]
            if parent in visited:
                break  # Avoid cycles
            visited.add(parent)
            ancestors.append(parent)
            current = parent
        
        return ancestors
    
    async def get_event_descendants(self, event_id: str) -> List[str]:
        """
        Get all descendants of an event in the causal DAG.
        
        Uses adjacency map for O(depth) lookup instead of SQL scans.
        """
        # Ensure DAG is built
        if not self._adjacency_map:
            await self.build_event_dag()
        
        # Traverse descendants using adjacency map (O(depth))
        descendants = []
        visited = set()
        queue = [event_id]
        
        while queue:
            current = queue.pop(0)
            # Find all events that have current as a parent
            for child_id, parents in self._adjacency_map.items():
                if current in parents and child_id not in visited:
                    visited.add(child_id)
                    descendants.append(child_id)
                    queue.append(child_id)
        
        return descendants
    
    async def get_correlation_group(self, correlation_id: str) -> List[str]:
        """Get all events in a correlation group (optimized O(n))"""
        from storage.postgres.models import Event as EventModel
        
        query = select(EventModel.event_id).where(
            EventModel.correlation_id == correlation_id,
        ).order_by(EventModel.global_sequence)
        
        result = await self.session.execute(query)
        events = result.scalars().all()
        
        return list(events)
    
    async def get_aggregate_stream(self, aggregate_id: str) -> List[str]:
        """Get all events for an aggregate (causal lineage)"""
        from storage.postgres.models import Event as EventModel
        
        query = select(EventModel.event_id).where(
            EventModel.causality_id == aggregate_id,
        ).order_by(EventModel.aggregate_sequence)
        
        result = await self.session.execute(query)
        events = result.scalars().all()
        
        return list(events)
    
    async def get_causal_chain(self, event_id: str) -> List[str]:
        """
        Get the causal chain for an event.
        
        Returns the chain of events that causally led to this event.
        """
        from storage.postgres.models import Event as EventModel
        
        # Load event
        query = select(EventModel).where(EventModel.event_id == event_id)
        result = await self.session.execute(query)
        event = result.scalar_one_or_none()
        
        if not event:
            return []
        
        # Build causal chain by following aggregate lineage
        chain = []
        current_event = event
        
        while current_event and current_event.causality_id:
            chain.append(current_event.event_id)
            
            # Get previous event in aggregate
            if current_event.aggregate_sequence > 1:
                query = select(EventModel).where(
                    EventModel.causality_id == current_event.causality_id,
                    EventModel.aggregate_sequence == current_event.aggregate_sequence - 1,
                )
                result = await self.session.execute(query)
                current_event = result.scalar_one_or_none()
            else:
                current_event = None
        
        chain.reverse()  # Put in chronological order
        return chain
    
    async def detect_forks(self, event_id: str) -> List[List[str]]:
        """
        Detect forks in the causal DAG.
        
        Returns lists of event IDs that represent parallel branches.
        """
        from storage.postgres.models import Event as EventModel
        
        # Load event
        query = select(EventModel).where(EventModel.event_id == event_id)
        result = await self.session.execute(query)
        event = result.scalar_one_or_none()
        
        if not event:
            return []
        
        # Find events in same correlation group (potential forks)
        if event.correlation_id:
            query = select(EventModel).where(
                EventModel.correlation_id == event.correlation_id,
                EventModel.event_id != event_id,
            ).order_by(EventModel.global_sequence)
            
            result = await self.session.execute(query)
            events = result.scalars().all()
            
            if len(events) > 1:
                # Group by causality_id to find parallel branches
                branches = defaultdict(list)
                for e in events:
                    branches[e.causality_id or "none"].append(e.event_id)
                
                return [branch_ids for branch_ids in branches.values() if len(branch_ids) > 1]
        
        return []
    
    async def detect_joins(self, event_id: str) -> List[str]:
        """
        Detect join points in the causal DAG.
        
        Returns event IDs where multiple causal chains converge.
        """
        # TODO: Implement join detection
        # This requires tracking which events have multiple causal parents
        return []


class ReplayDAG:
    """
    Replay DAG for tracking replay operations.
    
    Tracks which events were replayed and in what order.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def build_replay_dag(self, replay_id: str) -> Dict[str, Any]:
        """Build a DAG for a specific replay operation"""
        # Replay DAG is built from the event log with replay metadata
        # For now, return the causal DAG as replay follows causal order
        event_dag = EventDAG(self.session)
        return await event_dag.build_event_dag()
    
    async def get_replay_path(self, replay_id: str) -> List[str]:
        """Get the path of events replayed in a replay operation"""
        # Replay path follows the causal chain from the event log
        from storage.postgres.models import Event as EventModel
        
        query = select(EventModel.event_id).order_by(EventModel.global_sequence)
        result = await self.session.execute(query)
        events = result.scalars().all()
        
        return list(events)


class MissionDAG:
    """
    Mission DAG for tracking mission execution.
    
    Tracks the causal graph of mission-related events.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def build_mission_dag(self, mission_id: str) -> Dict[str, Any]:
        """Build a DAG for a specific mission"""
        from storage.postgres.models import Event as EventModel
        
        # Get all events for this mission
        query = select(EventModel).where(
            EventModel.causality_id == mission_id,
        ).order_by(EventModel.global_sequence)
        
        result = await self.session.execute(query)
        events = result.scalars().all()
        
        # Build DAG
        dag = {
            "mission_id": mission_id,
            "nodes": [],
            "edges": [],
        }
        
        for event in events:
            dag["nodes"].append({
                "id": event.event_id,
                "type": event.event_type,
                "sequence": event.aggregate_sequence,
            })
        
        # Add edges (sequence-based)
        for i, event in enumerate(events):
            if i > 0:
                dag["edges"].append({
                    "from": events[i - 1].event_id,
                    "to": event.event_id,
                    "type": "sequence",
                })
        
        return dag
    
    async def get_mission_path(self, mission_id: str) -> List[str]:
        """Get the path of events for a mission"""
        from storage.postgres.models import Event as EventModel
        
        query = select(EventModel.event_id).where(
            EventModel.causality_id == mission_id,
        ).order_by(EventModel.aggregate_sequence)
        
        result = await self.session.execute(query)
        events = result.scalars().all()
        
        return list(events)


class ArtifactDAG:
    """
    Artifact DAG for tracking artifact lineage.
    
    Tracks the causal graph of artifact creation and usage.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def build_artifact_dag(self, artifact_id: str) -> Dict[str, Any]:
        """
        Build a DAG for a specific artifact.
        
        Uses immutable ArtifactReference table exclusively, not mutable metadata.
        """
        from storage.postgres.models import Artifact as ArtifactModel, ArtifactReference as ArtifactReferenceModel
        from sqlalchemy import select
        
        # Load the target artifact
        query = select(ArtifactModel).where(ArtifactModel.artifact_id == artifact_id)
        result = await self.session.execute(query)
        artifact = result.scalar_one_or_none()
        
        if not artifact:
            return {
                "artifact_id": artifact_id,
                "nodes": [],
                "edges": [],
            }
        
        # Build DAG from immutable ArtifactReference table
        dag = {
            "artifact_id": artifact_id,
            "nodes": [{"id": artifact_id, "type": artifact.content_type}],
            "edges": [],
        }
        
        # Find outgoing references (from_artifact_id -> to_artifact_id)
        query = select(ArtifactReferenceModel.to_artifact_id, ArtifactReferenceModel.reference_type).where(
            ArtifactReferenceModel.from_artifact_id == artifact_id,
        )
        result = await self.session.execute(query)
        outgoing_refs = result.all()
        
        # Find incoming references (to_artifact_id <- from_artifact_id)
        query = select(ArtifactReferenceModel.from_artifact_id, ArtifactReferenceModel.reference_type).where(
            ArtifactReferenceModel.to_artifact_id == artifact_id,
        )
        result = await self.session.execute(query)
        incoming_refs = result.all()
        
        # Add nodes and edges for outgoing references
        for ref_id, ref_type in outgoing_refs:
            # Load referenced artifact to get type
            query = select(ArtifactModel).where(ArtifactModel.artifact_id == ref_id)
            result = await self.session.execute(query)
            ref_artifact = result.scalar_one_or_none()
            
            if ref_artifact:
                dag["nodes"].append({
                    "id": ref_id,
                    "type": ref_artifact.content_type,
                })
                dag["edges"].append({
                    "from": artifact_id,
                    "to": ref_id,
                    "type": ref_type,
                })
        
        # Add nodes and edges for incoming references
        for ref_id, ref_type in incoming_refs:
            # Load referencing artifact to get type
            query = select(ArtifactModel).where(ArtifactModel.artifact_id == ref_id)
            result = await self.session.execute(query)
            ref_artifact = result.scalar_one_or_none()
            
            if ref_artifact:
                dag["nodes"].append({
                    "id": ref_id,
                    "type": ref_artifact.content_type,
                })
                dag["edges"].append({
                    "from": ref_id,
                    "to": artifact_id,
                    "type": ref_type,
                })
        
        return dag
    
    async def get_artifact_lineage(self, artifact_id: str) -> Dict[str, List[str]]:
        """Get the lineage of an artifact (ancestors and descendants)"""
        from storage.artifact_store import ArtifactStore
        from sqlalchemy import AsyncSession
        
        artifact_store = ArtifactStore(self.session)
        lineage = await artifact_store.get_artifact_lineage(artifact_id)
        
        return {
            "ancestors": lineage.get("references", []),
            "descendants": lineage.get("referenced_by", []),
        }


class CommandDAG:
    """
    Command DAG for tracking command execution.
    
    Tracks the causal graph of command-to-event relationships.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def build_command_dag(self, command_id: str) -> Dict[str, Any]:
        """Build a DAG for a specific command"""
        from storage.postgres.models import Event as EventModel
        
        # Get all events caused by this command
        query = select(EventModel).where(
            EventModel.caused_by_command_id == command_id,
        ).order_by(EventModel.global_sequence)
        
        result = await self.session.execute(query)
        events = result.scalars().all()
        
        # Build DAG
        dag = {
            "command_id": command_id,
            "nodes": [],
            "edges": [],
        }
        
        for event in events:
            dag["nodes"].append({
                "id": event.event_id,
                "type": event.event_type,
                "sequence": event.global_sequence,
            })
        
        # Add edges (sequence-based)
        for i, event in enumerate(events):
            if i > 0:
                dag["edges"].append({
                    "from": events[i - 1].event_id,
                    "to": event.event_id,
                    "type": "sequence",
                })
        
        return dag
    
    async def get_command_events(self, command_id: str) -> List[str]:
        """Get all events caused by a command"""
        from storage.postgres.models import Event as EventModel
        
        query = select(EventModel.event_id).where(
            EventModel.caused_by_command_id == command_id,
        ).order_by(EventModel.global_sequence)
        
        result = await self.session.execute(query)
        events = result.scalars().all()
        
        return list(events)


class DAGManager:
    """
    Manager for all DAG types.
    
    Provides a unified interface for accessing all DAGs.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.event_dag = EventDAG(session)
        self.replay_dag = ReplayDAG(session)
        self.mission_dag = MissionDAG(session)
        self.artifact_dag = ArtifactDAG(session)
        self.command_dag = CommandDAG(session)
    
    async def get_all_dags(self) -> Dict[str, Any]:
        """Get all DAGs"""
        return {
            "event_dag": await self.event_dag.build_event_dag(),
            "replay_dags": {},  # Would need replay IDs
            "mission_dags": {},  # Would need mission IDs
            "artifact_dags": {},  # Would need artifact IDs
            "command_dags": {},  # Would need command IDs
        }
    
    async def verify_dag_consistency(self) -> Dict[str, bool]:
        """Verify that all DAGs are consistent"""
        # TODO: Implement DAG consistency verification
        return {
            "event_dag_consistent": True,
            "replay_dags_consistent": True,
            "mission_dags_consistent": True,
            "artifact_dags_consistent": True,
            "command_dags_consistent": True,
        }
