"""Artifact Graph

Artifact graph for Hermes.

Architecture:
Git Commit
  ↓
Artifact
Newsletter
  ↓
Artifact
Landing Page
  ↓
Artifact
Conversation
  ↓
Artifact
Architecture Report
  ↓
Artifact
Marketing Report
  ↓
Artifact
Morning Report
  ↓
Artifact

Everything becomes an Artifact.
The graph tracks relationships between artifacts.
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Set, Optional
from collections import defaultdict

from artifacts.artifact import Artifact, ArtifactId, ArtifactRelationship


@dataclass(frozen=True)
class ArtifactNode:
    """
    Node in the artifact graph.
    
    Contains:
    - artifact (the artifact)
    - incoming_edges (incoming relationships)
    - outgoing_edges (outgoing relationships)
    """
    artifact: Artifact
    incoming_edges: List[ArtifactRelationship]
    outgoing_edges: List[ArtifactRelationship]
    
    def get_related_artifacts(self) -> List[ArtifactId]:
        """Get IDs of related artifacts"""
        related = []
        for edge in self.outgoing_edges:
            related.append(edge.target_artifact_id)
        for edge in self.incoming_edges:
            related.append(edge.source_artifact_id)
        return related


class ArtifactGraph:
    """
    Graph of artifacts and their relationships.
    
    Tracks relationships between artifacts:
    - Git commits → artifacts
    - Newsletters → artifacts
    - Landing pages → artifacts
    - Conversations → artifacts
    - Reports → artifacts
    
    Everything Hermes manipulates becomes an artifact in the graph.
    """
    
    def __init__(self):
        self._nodes: Dict[ArtifactId, ArtifactNode] = {}
        self._edges_by_type: Dict[str, List[ArtifactRelationship]] = defaultdict(list)
    
    def add_artifact(self, artifact: Artifact) -> None:
        """
        Add an artifact to the graph.
        
        Args:
            artifact: Artifact to add
        """
        node = ArtifactNode(
            artifact=artifact,
            incoming_edges=[],
            outgoing_edges=[],
        )
        self._nodes[artifact.artifact_id] = node
    
    def add_relationship(self, relationship: ArtifactRelationship) -> None:
        """
        Add a relationship between artifacts.
        
        Args:
            relationship: Relationship to add
        """
        # Update source node
        source_node = self._nodes.get(relationship.source_artifact_id)
        if source_node:
            updated_node = ArtifactNode(
                artifact=source_node.artifact,
                incoming_edges=source_node.incoming_edges,
                outgoing_edges=source_node.outgoing_edges + [relationship],
            )
            self._nodes[relationship.source_artifact_id] = updated_node
        
        # Update target node
        target_node = self._nodes.get(relationship.target_artifact_id)
        if target_node:
            updated_node = ArtifactNode(
                artifact=target_node.artifact,
                incoming_edges=target_node.incoming_edges + [relationship],
                outgoing_edges=target_node.outgoing_edges,
            )
            self._nodes[relationship.target_artifact_id] = updated_node
        
        # Track by relationship type
        self._edges_by_type[relationship.relationship_type].append(relationship)
    
    def get_artifact(self, artifact_id: ArtifactId) -> Optional[Artifact]:
        """Get artifact by ID"""
        node = self._nodes.get(artifact_id)
        return node.artifact if node else None
    
    def get_node(self, artifact_id: ArtifactId) -> Optional[ArtifactNode]:
        """Get node by ID"""
        return self._nodes.get(artifact_id)
    
    def get_related_artifacts(
        self,
        artifact_id: ArtifactId,
        relationship_type: str | None = None,
    ) -> List[Artifact]:
        """
        Get artifacts related to a given artifact.
        
        Args:
            artifact_id: Artifact ID
            relationship_type: Filter by relationship type (optional)
        
        Returns:
            List of related artifacts
        """
        node = self._nodes.get(artifact_id)
        if not node:
            return []
        
        related_ids = node.get_related_artifacts()
        related_artifacts = []
        
        for related_id in related_ids:
            related_node = self._nodes.get(related_id)
            if related_node:
                # Filter by relationship type if specified
                if relationship_type:
                    has_relationship = False
                    for edge in node.outgoing_edges:
                        if edge.target_artifact_id == related_id and edge.relationship_type == relationship_type:
                            has_relationship = True
                            break
                    for edge in node.incoming_edges:
                        if edge.source_artifact_id == related_id and edge.relationship_type == relationship_type:
                            has_relationship = True
                            break
                    if not has_relationship:
                        continue
                
                related_artifacts.append(related_node.artifact)
        
        return related_artifacts
    
    def get_artifacts_by_type(self, artifact_type: str) -> List[Artifact]:
        """
        Get artifacts by type.
        
        Args:
            artifact_type: Artifact type
        
        Returns:
            List of artifacts of the given type
        """
        return [
            node.artifact
            for node in self._nodes.values()
            if node.artifact.artifact_type.value == artifact_type
        ]
    
    def get_artifacts_by_mission(self, mission_id: str) -> List[Artifact]:
        """
        Get artifacts by mission ID.
        
        Args:
            mission_id: Mission ID
        
        Returns:
            List of artifacts produced by the mission
        """
        return [
            node.artifact
            for node in self._nodes.values()
            if node.artifact.mission_id == mission_id
        ]
    
    def get_artifacts_by_tag(self, tag: str) -> List[Artifact]:
        """
        Get artifacts by tag.
        
        Args:
            tag: Tag to search for
        
        Returns:
            List of artifacts with the given tag
        """
        return [
            node.artifact
            for node in self._nodes.values()
            if tag in node.artifact.metadata.tags
        ]
    
    def get_relationships_by_type(self, relationship_type: str) -> List[ArtifactRelationship]:
        """
        Get relationships by type.
        
        Args:
            relationship_type: Relationship type
        
        Returns:
            List of relationships of the given type
        """
        return self._edges_by_type.get(relationship_type, [])
    
    def find_path(
        self,
        source_id: ArtifactId,
        target_id: ArtifactId,
        relationship_type: str | None = None,
    ) -> List[ArtifactId]:
        """
        Find a path between two artifacts.
        
        Args:
            source_id: Source artifact ID
            target_id: Target artifact ID
            relationship_type: Filter by relationship type (optional)
        
        Returns:
            List of artifact IDs representing the path
        """
        from collections import deque
        
        if source_id not in self._nodes or target_id not in self._nodes:
            return []
        
        # BFS to find path
        queue = deque([(source_id, [source_id])])
        visited = {source_id}
        
        while queue:
            current_id, path = queue.popleft()
            
            if current_id == target_id:
                return path
            
            node = self._nodes.get(current_id)
            if not node:
                continue
            
            # Get neighbors
            for edge in node.outgoing_edges:
                if relationship_type and edge.relationship_type != relationship_type:
                    continue
                if edge.target_artifact_id not in visited:
                    visited.add(edge.target_artifact_id)
                    queue.append((edge.target_artifact_id, path + [edge.target_artifact_id]))
            
            for edge in node.incoming_edges:
                if relationship_type and edge.relationship_type != relationship_type:
                    continue
                if edge.source_artifact_id not in visited:
                    visited.add(edge.source_artifact_id)
                    queue.append((edge.source_artifact_id, path + [edge.source_artifact_id]))
        
        return []
    
    def get_artifact_count(self) -> int:
        """Get total number of artifacts"""
        return len(self._nodes)
    
    def get_relationship_count(self) -> int:
        """Get total number of relationships"""
        return sum(len(node.outgoing_edges) for node in self._nodes.values())
    
    def get_all_artifacts(self) -> List[Artifact]:
        """Get all artifacts"""
        return [node.artifact for node in self._nodes.values()]
