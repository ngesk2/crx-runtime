"""Persistent Runtime

Persistent runtime for Hermes.

Architecture:
Oracle VM
  ↓
Scheduler
  ↓
Mission Queue
  ↓
Hermes
  ↓
Artifact Graph
  ↓
Knowledge Graph
  ↓
CRM
  ↓
Website
  ↓
Morning Report

No human interaction required.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from enum import Enum

from missions.mission import Mission, MissionId, MissionState, MissionPriority, MissionCapability
from runtime.scheduler.scheduler import Scheduler
from artifacts.artifact import Artifact, ArtifactId, ArtifactType
from artifacts.artifact_graph import ArtifactGraph
from knowledge.graph import KnowledgeGraph, NodeType, RelationshipType
from hermes.worker import HermesWorker


class RuntimeState(Enum):
    """States of the persistent runtime"""
    INITIALIZING = "initializing"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPING = "stopping"
    STOPPED = "stopped"


@dataclass(frozen=True)
class MorningReport:
    """
    Morning report from the persistent runtime.
    
    Contains:
    - artifacts_created (number of artifacts created)
    - new_leads (number of new leads)
    - landing_improvements (number of landing page improvements)
    - newsletter_ready (whether newsletter is ready)
    - architecture_review_ready (whether architecture review is ready)
    - open_research_tasks (number of open research tasks)
    - critical_runtime_issues (number of critical runtime issues)
    - timestamp (report timestamp)
    """
    artifacts_created: int
    new_leads: int
    landing_improvements: int
    newsletter_ready: bool
    architecture_review_ready: bool
    open_research_tasks: int
    critical_runtime_issues: int
    timestamp: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "artifacts_created": self.artifacts_created,
            "new_leads": self.new_leads,
            "landing_improvements": self.landing_improvements,
            "newsletter_ready": self.newsletter_ready,
            "architecture_review_ready": self.architecture_review_ready,
            "open_research_tasks": self.open_research_tasks,
            "critical_runtime_issues": self.critical_runtime_issues,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass(frozen=True)
class CRMLead:
    """
    CRM lead from the persistent runtime.
    
    Contains:
    - lead_id (unique identifier)
    - name (lead name)
    - email (lead email)
    - source (lead source)
    - score (lead score)
    - created_at (creation timestamp)
    """
    lead_id: str
    name: str
    email: str
    source: str
    score: float
    created_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "lead_id": self.lead_id,
            "name": self.name,
            "email": self.email,
            "source": self.source,
            "score": self.score,
            "created_at": self.created_at.isoformat(),
        }


class PersistentRuntime:
    """
    Persistent runtime for Hermes.
    
    Orchestrates:
    - Scheduler
    - Mission Queue
    - Hermes Workers
    - Artifact Graph
    - Knowledge Graph
    - CRM
    - Website
    - Morning Report
    
    No human interaction required.
    """
    
    def __init__(
        self,
        worker_count: int = 3,
        lease_duration: timedelta = timedelta(minutes=30),
        heartbeat_interval: timedelta = timedelta(minutes=5),
    ):
        self.worker_count = worker_count
        self.lease_duration = lease_duration
        self.heartbeat_interval = heartbeat_interval
        
        # Core components
        self.scheduler = Scheduler(
            lease_duration=lease_duration,
            heartbeat_interval=heartbeat_interval,
        )
        self.artifact_graph = ArtifactGraph()
        self.knowledge_graph = KnowledgeGraph()
        
        # Workers
        self.workers: List[HermesWorker] = []
        
        # CRM
        self.crm_leads: List[CRMLead] = []
        
        # State
        self.state = RuntimeState.INITIALIZING
        self.start_time: Optional[datetime] = None
        self.stop_time: Optional[datetime] = None
        
        # Statistics
        self._missions_completed = 0
        self._missions_failed = 0
        self._artifacts_created = 0
    
    def initialize(self) -> None:
        """Initialize the persistent runtime"""
        print("Initializing persistent runtime...")
        
        # Create workers
        all_capabilities = list(MissionCapability)
        capabilities_per_worker = all_capabilities[:self.worker_count]
        
        for i in range(self.worker_count):
            worker_id = f"hermes-worker-{i}"
            capabilities = [capabilities_per_worker[i % len(capabilities_per_worker)]]
            
            worker = HermesWorker(
                worker_id=worker_id,
                scheduler=self.scheduler,
                artifact_graph=self.artifact_graph,
                capabilities=capabilities,
                sleep_interval=5.0,
            )
            self.workers.append(worker)
        
        # Initialize knowledge graph with basic entities
        self._initialize_knowledge_graph()
        
        self.state = RuntimeState.RUNNING
        self.start_time = datetime.utcnow()
        
        print("Persistent runtime initialized.")
    
    def _initialize_knowledge_graph(self) -> None:
        """Initialize knowledge graph with basic entities"""
        # Add organization
        org_id = self.knowledge_graph.add_organization(
            name="Hermes",
            website="https://hermes.ai",
        )
        
        # Add repository
        repo_id = self.knowledge_graph.add_repository(
            name="constitutional-runtime",
            url="https://github.com/hermes/constitutional-runtime",
            owner="Hermes",
        )
        
        # Link repository to organization
        self.knowledge_graph.add_edge(
            source_id=repo_id,
            target_id=org_id,
            relationship_type=RelationshipType.PART_OF,
        )
    
    def start(self) -> None:
        """Start the persistent runtime"""
        if self.state != RuntimeState.INITIALIZING:
            print("Runtime already initialized or running.")
            return
        
        self.initialize()
        
        print("Starting persistent runtime...")
        
        # Start workers in background
        import threading
        
        for worker in self.workers:
            thread = threading.Thread(target=worker.run, daemon=True)
            thread.start()
        
        print("Persistent runtime started.")
    
    def submit_mission(self, mission: Mission) -> None:
        """
        Submit a mission to the runtime.
        
        Args:
            mission: Mission to submit
        """
        self.scheduler.submit_mission(mission)
        
        # Add mission to knowledge graph
        mission_id = self.knowledge_graph.add_node(
            node_type=NodeType.MISSION,
            data={
                "mission_id": str(mission.mission_id),
                "mission_type": mission.mission_type.value,
                "capability": mission.capability.value,
                "priority": mission.priority.value,
                "state": mission.state.value,
            },
        )
    
    def generate_morning_report(self) -> MorningReport:
        """
        Generate a morning report.
        
        Returns:
            Morning report
        """
        # Count artifacts created
        artifacts_created = self.artifact_graph.get_artifact_count()
        
        # Count new leads
        new_leads = len(self.crm_leads)
        
        # Count landing page improvements
        landing_improvements = len(
            self.artifact_graph.get_artifacts_by_type("landing_page")
        )
        
        # Check if newsletter is ready
        newsletter_artifacts = self.artifact_graph.get_artifacts_by_type("newsletter")
        newsletter_ready = len(newsletter_artifacts) > 0
        
        # Check if architecture review is ready
        architecture_artifacts = self.artifact_graph.get_artifacts_by_type("architecture_report")
        architecture_review_ready = len(architecture_artifacts) > 0
        
        # Count open research tasks (pending research missions)
        pending_missions = self.scheduler.get_pending_missions()
        open_research_tasks = len([
            m for m in pending_missions
            if m.mission_type.value == "research"
        ])
        
        # Count critical runtime issues (failed missions)
        critical_runtime_issues = self._missions_failed
        
        return MorningReport(
            artifacts_created=artifacts_created,
            new_leads=new_leads,
            landing_improvements=landing_improvements,
            newsletter_ready=newsletter_ready,
            architecture_review_ready=architecture_review_ready,
            open_research_tasks=open_research_tasks,
            critical_runtime_issues=critical_runtime_issues,
            timestamp=datetime.utcnow(),
        )
    
    def add_crm_lead(self, lead: CRMLead) -> None:
        """
        Add a CRM lead.
        
        Args:
            lead: Lead to add
        """
        self.crm_leads.append(lead)
        
        # Add to knowledge graph
        person_id = self.knowledge_graph.add_person(
            name=lead.name,
            email=lead.email,
        )
        
        # Add lead as evidence
        evidence_id = self.knowledge_graph.add_node(
            node_type=NodeType.EVIDENCE,
            data={
                "type": "crm_lead",
                "lead_id": lead.lead_id,
                "score": lead.score,
                "source": lead.source,
            },
        )
        
        # Link person to evidence
        self.knowledge_graph.add_edge(
            source_id=person_id,
            target_id=evidence_id,
            relationship_type=RelationshipType.CONTAINS,
        )
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get runtime statistics.
        
        Returns:
            Runtime statistics
        """
        return {
            "state": self.state.value,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "stop_time": self.stop_time.isoformat() if self.stop_time else None,
            "worker_count": self.worker_count,
            "missions_completed": self._missions_completed,
            "missions_failed": self._missions_failed,
            "artifacts_created": self._artifacts_created,
            "pending_missions": len(self.scheduler.get_pending_missions()),
            "active_leases": len(self.scheduler.get_active_leases()),
            "knowledge_graph_stats": self.knowledge_graph.get_statistics(),
            "artifact_graph_stats": {
                "artifact_count": self.artifact_graph.get_artifact_count(),
                "relationship_count": self.artifact_graph.get_relationship_count(),
            },
            "crm_leads": len(self.crm_leads),
        }
    
    def stop(self) -> None:
        """Stop the persistent runtime"""
        print("Stopping persistent runtime...")
        
        self.state = RuntimeState.STOPPING
        self.stop_time = datetime.utcnow()
        
        # Workers are daemon threads, they will stop when main thread exits
        
        self.state = RuntimeState.STOPPED
        print("Persistent runtime stopped.")
    
    def run_overnight(self) -> MorningReport:
        """
        Run the persistent runtime overnight.
        
        Executes missions throughout the night and generates a morning report.
        
        Returns:
            Morning report
        """
        print("Starting overnight run...")
        
        # Submit overnight missions
        self._submit_overnight_missions()
        
        # Start runtime
        self.start()
        
        # Run for 8 hours (overnight)
        import time
        time.sleep(8 * 60 * 60)  # 8 hours
        
        # Generate morning report
        report = self.generate_morning_report()
        
        print("Overnight run complete.")
        print(f"Morning Report: {report.to_dict()}")
        
        return report
    
    def _submit_overnight_missions(self) -> None:
        """Submit overnight missions"""
        from missions.mission import MissionBuilder, MissionType
        
        # Website Audit mission
        website_audit_mission = (
            MissionBuilder()
            .with_type(MissionType.AUDIT)
            .with_capability(MissionCapability.LANDING_PAGE_ANALYSIS)
            .with_priority(MissionPriority.HIGH)
            .with_input("url", "https://hermes.ai")
            .with_input("focus", "cta")
            .build()
        )
        self.submit_mission(website_audit_mission)
        
        # SEO mission
        seo_mission = (
            MissionBuilder()
            .with_type(MissionType.AUDIT)
            .with_capability(MissionCapability.SEO_AUDIT)
            .with_priority(MissionPriority.HIGH)
            .with_input("domain", "hermes.ai")
            .build()
        )
        self.submit_mission(seo_mission)
        
        # Repository Diff mission
        repo_diff_mission = (
            MissionBuilder()
            .with_type(MissionType.ANALYSIS)
            .with_capability(MissionCapability.CODE_ANALYSIS)
            .with_priority(MissionPriority.MEDIUM)
            .with_input("repository", "hermes/constitutional-runtime")
            .with_input("output_type", "blog_draft")
            .build()
        )
        self.submit_mission(repo_diff_mission)
        
        # Marketing mission
        marketing_mission = (
            MissionBuilder()
            .with_type(MissionType.GENERATION)
            .with_capability(MissionCapability.CONTENT_GENERATION)
            .with_priority(MissionPriority.HIGH)
            .with_input("content_type", "newsletter")
            .build()
        )
        self.submit_mission(marketing_mission)
        
        # GitHub monitoring mission
        github_mission = (
            MissionBuilder()
            .with_type(MissionType.MONITOR)
            .with_capability(MissionCapability.GITHUB_MONITORING)
            .with_priority(MissionPriority.MEDIUM)
            .with_input("repository", "hermes/constitutional-runtime")
            .build()
        )
        self.submit_mission(github_mission)
        
        # Discord monitoring mission
        discord_mission = (
            MissionBuilder()
            .with_type(MissionType.MONITOR)
            .with_capability(MissionCapability.DISCORD_MONITORING)
            .with_priority(MissionPriority.LOW)
            .with_input("channel", "hermes")
            .build()
        )
        self.submit_mission(discord_mission)
        
        # CRM sync mission
        crm_mission = (
            MissionBuilder()
            .with_type(MissionType.SYNC)
            .with_capability(MissionCapability.CRM_SYNC)
            .with_priority(MissionPriority.MEDIUM)
            .build()
        )
        self.submit_mission(crm_mission)
