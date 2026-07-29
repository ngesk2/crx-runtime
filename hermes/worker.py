"""Hermes Worker

Hermes worker for autonomous mission execution.

Architecture:
while True:
    claim mission
    build context
    search knowledge graph
    produce artifacts
    emit evidence
    complete lease
    sleep

Hermes shouldn't run because someone asked.
It should wake up. Forever.
"""

import time
import random
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import UUID

from missions.mission import Mission, MissionId, MissionState, MissionOutputs, MissionCapability
from runtime.scheduler.scheduler import Scheduler, Lease
from artifacts.artifact import Artifact, ArtifactId, ArtifactType, ArtifactState
from artifacts.artifact_graph import ArtifactGraph


@dataclass(frozen=True)
class WorkerContext:
    """
    Context for worker execution.
    
    Contains:
    - mission (mission being executed)
    - knowledge_graph (knowledge graph for context)
    - artifact_graph (artifact graph for context)
    - execution_data (execution-specific data)
    """
    mission: Mission
    knowledge_graph: Any  # KnowledgeGraph (to be implemented)
    artifact_graph: ArtifactGraph
    execution_data: Dict[str, Any]
    
    def get_input(self, key: str, default: Any = None) -> Any:
        """Get mission input"""
        return self.mission.inputs.get(key, default)
    
    def get_execution_data(self, key: str, default: Any = None) -> Any:
        """Get execution data"""
        return self.execution_data.get(key, default)
    
    def set_execution_data(self, key: str, value: Any) -> "WorkerContext":
        """Set execution data"""
        updated_data = self.execution_data.copy()
        updated_data[key] = value
        return WorkerContext(
            mission=self.mission,
            knowledge_graph=self.knowledge_graph,
            artifact_graph=self.artifact_graph,
            execution_data=updated_data,
        )


@dataclass(frozen=True)
class Evidence:
    """
    Evidence from mission execution.
    
    Contains:
    - mission_id (mission that produced evidence)
    - evidence_type (type of evidence)
    - data (evidence data)
    - timestamp (evidence timestamp)
    """
    mission_id: MissionId
    evidence_type: str
    data: Dict[str, Any]
    timestamp: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "mission_id": str(self.mission_id),
            "evidence_type": self.evidence_type,
            "data": self.data,
            "timestamp": self.timestamp.isoformat(),
        }


class HermesWorker:
    """
    Hermes worker for autonomous mission execution.
    
    Responsibilities:
    - Claim missions from scheduler
    - Build execution context
    - Search knowledge graph
    - Produce artifacts
    - Emit evidence
    - Complete leases
    - Sleep
    
    Runs forever in a loop.
    """
    
    def __init__(
        self,
        worker_id: str,
        scheduler: Scheduler,
        artifact_graph: ArtifactGraph,
        capabilities: List[MissionCapability],
        sleep_interval: float = 5.0,
    ):
        self.worker_id = worker_id
        self.scheduler = scheduler
        self.artifact_graph = artifact_graph
        self.capabilities = capabilities
        self.sleep_interval = sleep_interval
        
        self._current_lease: Optional[Lease] = None
        self._current_mission: Optional[Mission] = None
        self._evidence_log: List[Evidence] = []
        
        # Register worker with scheduler
        self.scheduler.register_worker(self.worker_id, self.capabilities)
    
    def run(self) -> None:
        """
        Run the worker forever.
        
        Loop:
        1. Claim mission
        2. Build context
        3. Search knowledge graph
        4. Produce artifacts
        5. Emit evidence
        6. Complete lease
        7. Sleep
        """
        while True:
            try:
                # Step 1: Claim mission
                mission = self.scheduler.claim_mission(self.worker_id)
                
                if mission:
                    print(f"[{self.worker_id}] Claimed mission: {mission.mission_id}")
                    
                    # Step 2: Build context
                    context = self._build_context(mission)
                    
                    # Step 3: Search knowledge graph
                    context = self._search_knowledge_graph(context)
                    
                    # Step 4: Produce artifacts
                    artifacts = self._produce_artifacts(context)
                    
                    # Step 5: Emit evidence
                    self._emit_evidence(context, artifacts)
                    
                    # Step 6: Complete lease
                    self._complete_lease(context, artifacts)
                    
                    print(f"[{self.worker_id}] Completed mission: {mission.mission_id}")
                else:
                    print(f"[{self.worker_id}] No missions available, sleeping...")
                
                # Step 7: Sleep
                time.sleep(self.sleep_interval)
                
            except Exception as e:
                print(f"[{self.worker_id}] Error: {e}")
                time.sleep(self.sleep_interval)
    
    def _build_context(self, mission: Mission) -> WorkerContext:
        """
        Build execution context for mission.
        
        Args:
            mission: Mission to build context for
        
        Returns:
            Worker context
        """
        # Placeholder knowledge graph (to be implemented in Phase 5)
        knowledge_graph = None
        
        return WorkerContext(
            mission=mission,
            knowledge_graph=knowledge_graph,
            artifact_graph=self.artifact_graph,
            execution_data={
                "worker_id": self.worker_id,
                "started_at": datetime.utcnow(),
            },
        )
    
    def _search_knowledge_graph(self, context: WorkerContext) -> WorkerContext:
        """
        Search knowledge graph for relevant context.
        
        Args:
            context: Worker context
        
        Returns:
            Updated worker context
        """
        # Placeholder: search knowledge graph
        # This will be implemented in Phase 5
        
        print(f"[{self.worker_id}] Searching knowledge graph for mission: {context.mission.mission_id}")
        
        # Simulate knowledge graph search
        context = context.set_execution_data(
            "knowledge_graph_searched",
            True,
        )
        
        return context
    
    def _produce_artifacts(self, context: WorkerContext) -> List[Artifact]:
        """
        Produce artifacts for mission.
        
        Args:
            context: Worker context
        
        Returns:
            List of produced artifacts
        """
        print(f"[{self.worker_id}] Producing artifacts for mission: {context.mission.mission_id}")
        
        artifacts = []
        
        # Determine artifact type based on mission capability
        artifact_type = self._map_capability_to_artifact_type(context.mission.capability)
        
        # Create artifact
        from artifacts.artifact import ArtifactBuilder, ArtifactContent, ArtifactMetadata
        
        artifact = (
            ArtifactBuilder()
            .with_type(artifact_type)
            .with_state(ArtifactState.DRAFT)
            .with_content({
                "mission_id": str(context.mission.mission_id),
                "capability": context.mission.capability.value,
                "inputs": context.mission.inputs.data,
                "produced_at": datetime.utcnow().isoformat(),
            })
            .with_title(f"Artifact for {context.mission.mission_id}")
            .with_author(self.worker_id)
            .with_tags([context.mission.capability.value])
            .with_mission_id(str(context.mission.mission_id))
            .build()
        )
        
        # Add to artifact graph
        self.artifact_graph.add_artifact(artifact)
        
        artifacts.append(artifact)
        
        return artifacts
    
    def _map_capability_to_artifact_type(self, capability: MissionCapability) -> ArtifactType:
        """Map mission capability to artifact type"""
        mapping = {
            MissionCapability.WEB_RESEARCH: ArtifactType.ARCHITECTURE_REPORT,
            MissionCapability.CODE_ANALYSIS: ArtifactType.CODE_REVIEW,
            MissionCapability.CONTENT_GENERATION: ArtifactType.BLOG_POST,
            MissionCapability.SEO_AUDIT: ArtifactType.SEO_AUDIT,
            MissionCapability.CRM_SYNC: ArtifactType.CRM_LEAD,
            MissionCapability.GITHUB_MONITORING: ArtifactType.GITHUB_ISSUE,
            MissionCapability.DISCORD_MONITORING: ArtifactType.DISCORD_MESSAGE,
            MissionCapability.EMAIL_GENERATION: ArtifactType.EMAIL_DRAFT,
            MissionCapability.LANDING_PAGE_ANALYSIS: ArtifactType.LANDING_PAGE,
            MissionCapability.DOCUMENTATION_REVIEW: ArtifactType.DOCUMENTATION,
        }
        return mapping.get(capability, ArtifactType.ARCHITECTURE_REPORT)
    
    def _emit_evidence(self, context: WorkerContext, artifacts: List[Artifact]) -> None:
        """
        Emit evidence from mission execution.
        
        Args:
            context: Worker context
            artifacts: Produced artifacts
        """
        print(f"[{self.worker_id}] Emitting evidence for mission: {context.mission.mission_id}")
        
        evidence = Evidence(
            mission_id=context.mission.mission_id,
            evidence_type="artifacts_produced",
            data={
                "artifact_count": len(artifactifacts),
                "artifact_ids": [str(a.artifact_id) for a in artifacts],
                "worker_id": self.worker_id,
            },
            timestamp=datetime.utcnow(),
        )
        
        self._evidence_log.append(evidence)
    
    def _complete_lease(self, context: WorkerContext, artifacts: List[Artifact]) -> None:
        """
        Complete lease for mission.
        
        Args:
            context: Worker context
            artifacts: Produced artifacts
        """
        if not self._current_lease:
            return
        
        # Prepare outputs
        outputs = {
            "artifact_ids": [str(a.artifact_id) for a in artifacts],
            "artifact_count": len(artifacts),
            "completed_at": datetime.utcnow().isoformat(),
        }
        
        # Complete mission
        success = self.scheduler.complete_mission(self._current_lease.lease_id, outputs)
        
        if success:
            print(f"[{self.worker_id}] Lease completed: {self._current_lease.lease_id}")
        else:
            print(f"[{self.worker_id}] Failed to complete lease: {self._current_lease.lease_id}")
        
        # Clear current lease
        self._current_lease = None
        self._current_mission = None
    
    def get_evidence_log(self) -> List[Evidence]:
        """Get evidence log"""
        return self._evidence_log.copy()
