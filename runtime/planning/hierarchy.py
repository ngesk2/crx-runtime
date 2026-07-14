"""
Intent → Objective → Mission → Task Hierarchy.

Intent is stable.
Objective may evolve.
Tasks definitely evolve.

This hierarchy provides clear separation of concerns and enables proper versioning.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import json
import uuid
from pathlib import Path


class IntentStatus(Enum):
    """Status of an intent."""
    ACTIVE = "active"
    ARCHIVED = "archived"
    SUPERSEDED = "superseded"


class ObjectiveStatus(Enum):
    """Status of an objective."""
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    SUPERSEDED = "superseded"


class MissionStatus(Enum):
    """Status of a mission."""
    PLANNED = "planned"
    APPROVED = "approved"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskStatus(Enum):
    """Status of a task."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class Intent:
    """
    Intent - High-level, stable intent.
    
    Intents are long-term, stable goals that rarely change.
    They represent the "why" behind actions.
    """
    intent_id: str
    intent_name: str
    description: str
    status: IntentStatus
    created_at: str
    updated_at: str
    metadata: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "intent_id": self.intent_id,
            "intent_name": self.intent_name,
            "description": self.description,
            "status": self.status.value,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "metadata": self.metadata
        }


@dataclass
class ObjectiveRevision:
    """
    A revision of an objective.
    
    Objectives are versioned - each revision is immutable.
    """
    revision_id: str
    objective_id: str
    revision_number: int
    description: str
    success_criteria: List[str]
    constraints: Dict[str, Any]
    created_at: str
    created_by: str
    change_summary: str
    status: ObjectiveStatus
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "revision_id": self.revision_id,
            "objective_id": self.objective_id,
            "revision_number": self.revision_number,
            "description": self.description,
            "success_criteria": self.success_criteria,
            "constraints": self.constraints,
            "created_at": self.created_at,
            "created_by": self.created_by,
            "change_summary": self.change_summary,
            "status": self.status.value
        }


@dataclass
class Objective:
    """
    Objective - Versioned objective derived from intent.
    
    Objectives may evolve over time, but each revision is immutable.
    """
    objective_id: str
    intent_id: str
    objective_name: str
    current_revision: int
    revisions: List[ObjectiveRevision]
    created_at: str
    updated_at: str
    
    def get_current_revision(self) -> Optional[ObjectiveRevision]:
        """Get the current revision."""
        for rev in reversed(self.revisions):
            if rev.revision_number == self.current_revision:
                return rev
        return None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "objective_id": self.objective_id,
            "intent_id": self.intent_id,
            "objective_name": self.objective_name,
            "current_revision": self.current_revision,
            "revisions": [rev.to_dict() for rev in self.revisions],
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }


@dataclass
class Task:
    """
    Task - Atomic unit of work.
    
    Tasks are the most granular level and change frequently.
    """
    task_id: str
    mission_id: str
    task_name: str
    description: str
    skill_id: str
    inputs: Dict[str, Any]
    expected_outputs: Dict[str, Any]
    status: TaskStatus
    started_at: Optional[str]
    completed_at: Optional[str]
    error_message: Optional[str]
    retry_count: int
    metadata: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "task_id": self.task_id,
            "mission_id": self.mission_id,
            "task_name": self.task_name,
            "description": self.description,
            "skill_id": self.skill_id,
            "inputs": self.inputs,
            "expected_outputs": self.expected_outputs,
            "status": self.status.value,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "error_message": self.error_message,
            "retry_count": self.retry_count,
            "metadata": self.metadata
        }


@dataclass
class Mission:
    """
    Mission - Concrete execution plan derived from objective revision.
    
    Missions are instantiated from objective revisions and contain tasks.
    """
    mission_id: str
    objective_id: str
    objective_revision_id: str
    mission_name: str
    description: str
    status: MissionStatus
    tasks: List[Task]
    created_at: str
    updated_at: str
    started_at: Optional[str]
    completed_at: Optional[str]
    metadata: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "mission_id": self.mission_id,
            "objective_id": self.objective_id,
            "objective_revision_id": self.objective_revision_id,
            "mission_name": self.mission_name,
            "description": self.description,
            "status": self.status.value,
            "tasks": [task.to_dict() for task in self.tasks],
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "metadata": self.metadata
        }


class HierarchyStore:
    """
    Storage for Intent → Objective → Mission → Task hierarchy.
    
    Provides persistence and querying capabilities.
    """
    
    def __init__(self, storage_path: str = "runtime/planning/hierarchy.db"):
        self.storage_path = Path(storage_path)
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        self._intents: Dict[str, Intent] = {}
        self._objectives: Dict[str, Objective] = {}
        self._missions: Dict[str, Mission] = {}
        self._load()
    
    def _load(self) -> None:
        """Load hierarchy from storage."""
        if not self.storage_path.exists():
            return
        
        with open(self.storage_path, 'r') as f:
            data = json.load(f)
            
            for intent_data in data.get("intents", []):
                intent = Intent(
                    intent_id=intent_data["intent_id"],
                    intent_name=intent_data["intent_name"],
                    description=intent_data["description"],
                    status=IntentStatus(intent_data["status"]),
                    created_at=intent_data["created_at"],
                    updated_at=intent_data["updated_at"],
                    metadata=intent_data.get("metadata", {})
                )
                self._intents[intent.intent_id] = intent
            
            for obj_data in data.get("objectives", []):
                revisions = [
                    ObjectiveRevision(
                        revision_id=rev["revision_id"],
                        objective_id=rev["objective_id"],
                        revision_number=rev["revision_number"],
                        description=rev["description"],
                        success_criteria=rev["success_criteria"],
                        constraints=rev["constraints"],
                        created_at=rev["created_at"],
                        created_by=rev["created_by"],
                        change_summary=rev["change_summary"],
                        status=ObjectiveStatus(rev["status"])
                    )
                    for rev in obj_data["revisions"]
                ]
                
                objective = Objective(
                    objective_id=obj_data["objective_id"],
                    intent_id=obj_data["intent_id"],
                    objective_name=obj_data["objective_name"],
                    current_revision=obj_data["current_revision"],
                    revisions=revisions,
                    created_at=obj_data["created_at"],
                    updated_at=obj_data["updated_at"]
                )
                self._objectives[objective.objective_id] = objective
            
            for mission_data in data.get("missions", []):
                tasks = [
                    Task(
                        task_id=task["task_id"],
                        mission_id=task["mission_id"],
                        task_name=task["task_name"],
                        description=task["description"],
                        skill_id=task["skill_id"],
                        inputs=task["inputs"],
                        expected_outputs=task["expected_outputs"],
                        status=TaskStatus(task["status"]),
                        started_at=task.get("started_at"),
                        completed_at=task.get("completed_at"),
                        error_message=task.get("error_message"),
                        retry_count=task.get("retry_count", 0),
                        metadata=task.get("metadata", {})
                    )
                    for task in mission_data["tasks"]
                ]
                
                mission = Mission(
                    mission_id=mission_data["mission_id"],
                    objective_id=mission_data["objective_id"],
                    objective_revision_id=mission_data["objective_revision_id"],
                    mission_name=mission_data["mission_name"],
                    description=mission_data["description"],
                    status=MissionStatus(mission_data["status"]),
                    tasks=tasks,
                    created_at=mission_data["created_at"],
                    updated_at=mission_data["updated_at"],
                    started_at=mission_data.get("started_at"),
                    completed_at=mission_data.get("completed_at"),
                    metadata=mission_data.get("metadata", {})
                )
                self._missions[mission.mission_id] = mission
    
    def _save(self) -> None:
        """Save hierarchy to storage."""
        data = {
            "intents": [intent.to_dict() for intent in self._intents.values()],
            "objectives": [obj.to_dict() for obj in self._objectives.values()],
            "missions": [mission.to_dict() for mission in self._missions.values()],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        with open(self.storage_path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def create_intent(
        self,
        intent_name: str,
        description: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Intent:
        """Create a new intent."""
        intent = Intent(
            intent_id=str(uuid.uuid4()),
            intent_name=intent_name,
            description=description,
            status=IntentStatus.ACTIVE,
            created_at=datetime.now(timezone.utc).isoformat(),
            updated_at=datetime.now(timezone.utc).isoformat(),
            metadata=metadata or {}
        )
        
        self._intents[intent.intent_id] = intent
        self._save()
        return intent
    
    def create_objective(
        self,
        intent_id: str,
        objective_name: str,
        description: str,
        success_criteria: List[str],
        constraints: Optional[Dict[str, Any]] = None,
        created_by: str = "system"
    ) -> Objective:
        """Create a new objective with initial revision."""
        objective_id = str(uuid.uuid4())
        
        revision = ObjectiveRevision(
            revision_id=str(uuid.uuid4()),
            objective_id=objective_id,
            revision_number=1,
            description=description,
            success_criteria=success_criteria,
            constraints=constraints or {},
            created_at=datetime.now(timezone.utc).isoformat(),
            created_by=created_by,
            change_summary="Initial revision",
            status=ObjectiveStatus.ACTIVE
        )
        
        objective = Objective(
            objective_id=objective_id,
            intent_id=intent_id,
            objective_name=objective_name,
            current_revision=1,
            revisions=[revision],
            created_at=datetime.now(timezone.utc).isoformat(),
            updated_at=datetime.now(timezone.utc).isoformat()
        )
        
        self._objectives[objective.objective_id] = objective
        self._save()
        return objective
    
    def create_objective_revision(
        self,
        objective_id: str,
        description: str,
        success_criteria: List[str],
        constraints: Optional[Dict[str, Any]] = None,
        created_by: str = "system",
        change_summary: str = ""
    ) -> ObjectiveRevision:
        """Create a new revision of an objective."""
        objective = self._objectives.get(objective_id)
        if not objective:
            raise ValueError(f"Objective {objective_id} not found")
        
        new_revision_number = objective.current_revision + 1
        
        revision = ObjectiveRevision(
            revision_id=str(uuid.uuid4()),
            objective_id=objective_id,
            revision_number=new_revision_number,
            description=description,
            success_criteria=success_criteria,
            constraints=constraints or {},
            created_at=datetime.now(timezone.utc).isoformat(),
            created_by=created_by,
            change_summary=change_summary,
            status=ObjectiveStatus.ACTIVE
        )
        
        # Mark previous revision as superseded
        for rev in objective.revisions:
            if rev.revision_number == objective.current_revision:
                rev.status = ObjectiveStatus.SUPERSEDED
        
        objective.revisions.append(revision)
        objective.current_revision = new_revision_number
        objective.updated_at = datetime.now(timezone.utc).isoformat()
        
        self._save()
        return revision
    
    def create_mission(
        self,
        objective_id: str,
        mission_name: str,
        description: str,
        tasks: Optional[List[Task]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Mission:
        """Create a new mission from objective."""
        objective = self._objectives.get(objective_id)
        if not objective:
            raise ValueError(f"Objective {objective_id} not found")
        
        current_revision = objective.get_current_revision()
        if not current_revision:
            raise ValueError(f"Objective {objective_id} has no current revision")
        
        mission = Mission(
            mission_id=str(uuid.uuid4()),
            objective_id=objective_id,
            objective_revision_id=current_revision.revision_id,
            mission_name=mission_name,
            description=description,
            status=MissionStatus.PLANNED,
            tasks=tasks or [],
            created_at=datetime.now(timezone.utc).isoformat(),
            updated_at=datetime.now(timezone.utc).isoformat(),
            started_at=None,
            completed_at=None,
            metadata=metadata or {}
        )
        
        self._missions[mission.mission_id] = mission
        self._save()
        return mission
    
    def add_task(self, mission_id: str, task: Task) -> None:
        """Add a task to a mission."""
        mission = self._missions.get(mission_id)
        if not mission:
            raise ValueError(f"Mission {mission_id} not found")
        
        mission.tasks.append(task)
        mission.updated_at = datetime.now(timezone.utc).isoformat()
        self._save()
    
    def update_task_status(
        self,
        task_id: str,
        status: TaskStatus,
        error_message: Optional[str] = None
    ) -> None:
        """Update task status."""
        for mission in self._missions.values():
            for task in mission.tasks:
                if task.task_id == task_id:
                    task.status = status
                    if status == TaskStatus.RUNNING and not task.started_at:
                        task.started_at = datetime.now(timezone.utc).isoformat()
                    if status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.SKIPPED]:
                        task.completed_at = datetime.now(timezone.utc).isoformat()
                    if error_message:
                        task.error_message = error_message
                    mission.updated_at = datetime.now(timezone.utc).isoformat()
                    self._save()
                    return
    
    def get_intent(self, intent_id: str) -> Optional[Intent]:
        """Get intent by ID."""
        return self._intents.get(intent_id)
    
    def get_objective(self, objective_id: str) -> Optional[Objective]:
        """Get objective by ID."""
        return self._objectives.get(objective_id)
    
    def get_mission(self, mission_id: str) -> Optional[Mission]:
        """Get mission by ID."""
        return self._missions.get(mission_id)
    
    def get_objectives_for_intent(self, intent_id: str) -> List[Objective]:
        """Get all objectives for an intent."""
        return [obj for obj in self._objectives.values() if obj.intent_id == intent_id]
    
    def get_missions_for_objective(self, objective_id: str) -> List[Mission]:
        """Get all missions for an objective."""
        return [mission for mission in self._missions.values() if mission.objective_id == objective_id]
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """Get task by ID."""
        for mission in self._missions.values():
            for task in mission.tasks:
                if task.task_id == task_id:
                    return task
        return None


# Singleton instance
_hierarchy_store = HierarchyStore()


def get_hierarchy_store() -> HierarchyStore:
    """Get the singleton hierarchy store."""
    return _hierarchy_store
