"""
Transient Objectives - Planning Constructs.

Objectives should become planner-generated planning artifacts rather than permanent architectural entities.

If Objectives remain, they should compile into Mission IR and not exist beyond planning unless explicitly persisted.

This module provides transient objective constructs that are generated during planning and optionally persisted.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


class ObjectiveLifecycle(Enum):
    """Lifecycle of a transient objective."""
    TRANSIENT = "transient"  # Exists only during planning
    PERSISTED = "persisted"  # Explicitly persisted for audit/history
    ARCHIVED = "archived"  # No longer active but preserved


@dataclass
class TransientObjective:
    """
    A transient objective generated during planning.
    
    Objectives are planning constructs that compile into Mission IR.
    They are not permanent architectural entities unless explicitly persisted.
    """
    objective_id: str
    strategy_id: Optional[str]  # Associated strategy
    description: str
    success_criteria: List[str]
    constraints: Dict[str, Any]
    priority: int
    estimated_duration_seconds: int
    estimated_cost_tokens: int
    lifecycle: ObjectiveLifecycle
    generated_at: str
    generated_by: str
    metadata: Dict[str, Any]
    
    # Optional persistence
    persisted_at: Optional[str] = None
    persisted_by: Optional[str] = None
    
    def to_mission_ir(self) -> Dict[str, Any]:
        """
        Compile objective into Mission IR.
        
        This is the primary purpose of transient objectives - to be compiled into Mission IR.
        """
        return {
            "objective_id": self.objective_id,
            "strategy_id": self.strategy_id,
            "description": self.description,
            "success_criteria": self.success_criteria,
            "constraints": self.constraints,
            "priority": self.priority,
            "estimated_duration_seconds": self.estimated_duration_seconds,
            "estimated_cost_tokens": self.estimated_cost_tokens,
            "compiled_at": datetime.now(timezone.utc).isoformat()
        }
    
    def persist(self, persisted_by: str) -> None:
        """Persist the objective for audit/history."""
        self.lifecycle = ObjectiveLifecycle.PERSISTED
        self.persisted_at = datetime.now(timezone.utc).isoformat()
        self.persisted_by = persisted_by
    
    def archive(self) -> None:
        """Archive the objective."""
        self.lifecycle = ObjectiveLifecycle.ARCHIVED
    
    def is_transient(self) -> bool:
        """Check if objective is transient."""
        return self.lifecycle == ObjectiveLifecycle.TRANSIENT
    
    def is_persisted(self) -> bool:
        """Check if objective is persisted."""
        return self.lifecycle == ObjectiveLifecycle.PERSISTED


class ObjectiveCompiler:
    """
    Compiles transient objectives into Mission IR.
    
    Objectives are planning constructs that compile into Mission IR.
    This compiler handles the transformation.
    """
    
    def compile_objective(self, objective: TransientObjective) -> Dict[str, Any]:
        """
        Compile a transient objective into Mission IR.
        
        Args:
            objective: Transient objective
        
        Returns:
            Mission IR
        """
        mission_ir = objective.to_mission_ir()
        
        # Add compilation metadata
        mission_ir["compilation_metadata"] = {
            "objective_id": objective.objective_id,
            "compiled_at": datetime.now(timezone.utc).isoformat(),
            "compiler_version": "v1"
        }
        
        return mission_ir
    
    def compile_objectives(
        self,
        objectives: List[TransientObjective]
    ) -> List[Dict[str, Any]]:
        """
        Compile multiple objectives into Mission IR.
        
        Args:
            objectives: List of transient objectives
        
        Returns:
            List of Mission IR
        """
        return [self.compile_objective(obj) for obj in objectives]


class ObjectiveGenerator:
    """
    Generates transient objectives from strategies.
    
    Planner generates objectives as transient planning constructs.
    """
    
    def generate_from_strategy(
        self,
        strategy_id: str,
        strategy_description: str,
        context: Dict[str, Any]
    ) -> TransientObjective:
        """
        Generate a transient objective from a strategy.
        
        Args:
            strategy_id: Strategy ID
            strategy_description: Strategy description
            context: Planning context
        
        Returns:
            Transient objective
        """
        return TransientObjective(
            objective_id=str(uuid.uuid4()),
            strategy_id=strategy_id,
            description=f"Objective derived from: {strategy_description}",
            success_criteria=context.get("success_criteria", []),
            constraints=context.get("constraints", {}),
            priority=context.get("priority", 0),
            estimated_duration_seconds=context.get("estimated_duration_seconds", 0),
            estimated_cost_tokens=context.get("estimated_cost_tokens", 0),
            lifecycle=ObjectiveLifecycle.TRANSIENT,
            generated_at=datetime.now(timezone.utc).isoformat(),
            generated_by="planner",
            metadata=context.get("metadata", {})
        )
    
    def generate_from_intent(
        self,
        intent_description: str,
        strategies: List[str],
        context: Dict[str, Any]
    ) -> List[TransientObjective]:
        """
        Generate transient objectives from an intent.
        
        Args:
            intent_description: Intent description
            strategies: List of strategy IDs
            context: Planning context
        
        Returns:
            List of transient objectives
        """
        objectives = []
        
        for strategy_id in strategies:
            objective = self.generate_from_strategy(
                strategy_id=strategy_id,
                strategy_description=f"Strategy for intent: {intent_description}",
                context=context
            )
            objectives.append(objective)
        
        return objectives


class ObjectivePersistenceAdapter:
    """
    Adapter for persisting objectives when needed.
    
    Provides backwards compatibility with the old Objective persistence model
    while treating objectives as transient by default.
    """
    
    def __init__(self):
        self._persisted_objectives: Dict[str, TransientObjective] = {}
    
    def persist_objective(self, objective: TransientObjective, persisted_by: str) -> None:
        """
        Persist an objective.
        
        Args:
            objective: Objective to persist
            persisted_by: Who is persisting
        """
        objective.persist(persisted_by)
        self._persisted_objectives[objective.objective_id] = objective
    
    def get_persisted_objective(self, objective_id: str) -> Optional[TransientObjective]:
        """Get a persisted objective."""
        return self._persisted_objectives.get(objective_id)
    
    def get_all_persisted_objectives(self) -> List[TransientObjective]:
        """Get all persisted objectives."""
        return list(self._persisted_objectives.values())
    
    def archive_objective(self, objective_id: str) -> bool:
        """Archive an objective."""
        objective = self._persisted_objectives.get(objective_id)
        if objective:
            objective.archive()
            return True
        return False


# Backwards compatibility adapter for existing hierarchy.py
class ObjectiveAdapter:
    """
    Adapter to provide backwards compatibility with existing Objective implementation.
    
    Allows existing code to work with the new transient objective model.
    """
    
    @staticmethod
    def from_legacy_objective(legacy_objective) -> TransientObjective:
        """
        Convert legacy Objective to TransientObjective.
        
        Args:
            legacy_objective: Legacy Objective from hierarchy.py
        
        Returns:
            TransientObjective
        """
        current_revision = legacy_objective.get_current_revision()
        
        return TransientObjective(
            objective_id=legacy_objective.objective_id,
            strategy_id=legacy_objective.intent_id,  # Map intent_id to strategy_id for now
            description=current_revision.description if current_revision else legacy_objective.objective_name,
            success_criteria=current_revision.success_criteria if current_revision else [],
            constraints=current_revision.constraints if current_revision else {},
            priority=0,
            estimated_duration_seconds=0,
            estimated_cost_tokens=0,
            lifecycle=ObjectiveLifecycle.PERSISTED,  # Legacy objectives are persisted
            generated_at=legacy_objective.created_at,
            generated_by="legacy_adapter",
            metadata={"legacy": True, "objective_name": legacy_objective.objective_name},
            persisted_at=legacy_objective.created_at,
            persisted_by="legacy_system"
        )
    
    @staticmethod
    def to_legacy_objective(transient_objective: TransientObjective):
        """
        Convert TransientObjective to legacy Objective.
        
        Args:
            transient_objective: TransientObjective
        
        Returns:
            Legacy Objective-compatible structure
        """
        from runtime.planning.hierarchy import Objective, ObjectiveRevision, ObjectiveStatus
        
        revision = ObjectiveRevision(
            revision_id=str(uuid.uuid4()),
            objective_id=transient_objective.objective_id,
            revision_number=1,
            description=transient_objective.description,
            success_criteria=transient_objective.success_criteria,
            constraints=transient_objective.constraints,
            created_at=transient_objective.generated_at,
            created_by=transient_objective.generated_by,
            change_summary="Generated from transient objective",
            status=ObjectiveStatus.ACTIVE
        )
        
        objective = Objective(
            objective_id=transient_objective.objective_id,
            intent_id=transient_objective.strategy_id or "",
            objective_name=transient_objective.description,
            current_revision=1,
            revisions=[revision],
            created_at=transient_objective.generated_at,
            updated_at=transient_objective.generated_at
        )
        
        return objective


# Singleton instances
_objective_compiler = ObjectiveCompiler()
_objective_generator = ObjectiveGenerator()
_objective_persistence_adapter = ObjectivePersistenceAdapter()
_objective_adapter = ObjectiveAdapter()


def get_objective_compiler() -> ObjectiveCompiler:
    """Get the singleton objective compiler."""
    return _objective_compiler


def get_objective_generator() -> ObjectiveGenerator:
    """Get the singleton objective generator."""
    return _objective_generator


def get_objective_persistence_adapter() -> ObjectivePersistenceAdapter:
    """Get the singleton objective persistence adapter."""
    return _objective_persistence_adapter


def get_objective_adapter() -> ObjectiveAdapter:
    """Get the singleton objective adapter."""
    return _objective_adapter
