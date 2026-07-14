"""
Intent → Strategy → Objective hierarchy.

Intent is stable.
Strategy survives objective revisions.
Objectives don't.

Example:
Intent: "I want constitutional runtime."
Strategy: "Zero trust."
Strategy: "Offline first."
Strategy: "Local models."

Strategies survive objective revisions.
Objectives don't.
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


class StrategyStatus(Enum):
    """Status of a strategy."""
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    SUPERSEDED = "superseded"


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
class Strategy:
    """
    Strategy - Approach to achieving an intent.
    
    Strategies survive objective revisions.
    They represent the "how" at a high level.
    """
    strategy_id: str
    intent_id: str
    strategy_name: str
    description: str
    status: StrategyStatus
    created_at: str
    updated_at: str
    metadata: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "strategy_id": self.strategy_id,
            "intent_id": self.intent_id,
            "strategy_name": self.strategy_name,
            "description": self.description,
            "status": self.status.value,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "metadata": self.metadata
        }


class StrategyHierarchy:
    """
    Hierarchy: Intent → Strategy → Objective → Mission → Workflow → Task
    
    Intent is stable.
    Strategy survives objective revisions.
    Objectives may evolve.
    Missions are concrete executions.
    """
    
    def __init__(self, storage_path: str = "runtime/planning/strategy_hierarchy.json"):
        self.storage_path = Path(storage_path)
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        self._intents: Dict[str, Intent] = {}
        self._strategies: Dict[str, Strategy] = {}
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
            
            for strategy_data in data.get("strategies", []):
                strategy = Strategy(
                    strategy_id=strategy_data["strategy_id"],
                    intent_id=strategy_data["intent_id"],
                    strategy_name=strategy_data["strategy_name"],
                    description=strategy_data["description"],
                    status=StrategyStatus(strategy_data["status"]),
                    created_at=strategy_data["created_at"],
                    updated_at=strategy_data["updated_at"],
                    metadata=strategy_data.get("metadata", {})
                )
                self._strategies[strategy.strategy_id] = strategy
    
    def _save(self) -> None:
        """Save hierarchy to storage."""
        data = {
            "intents": [intent.to_dict() for intent in self._intents.values()],
            "strategies": [strategy.to_dict() for strategy in self._strategies.values()],
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
    
    def create_strategy(
        self,
        intent_id: str,
        strategy_name: str,
        description: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Strategy:
        """Create a new strategy for an intent."""
        if intent_id not in self._intents:
            raise ValueError(f" intents {intent_id} not found")
        
        strategy = Strategy(
            strategy_id=str(uuid.uuid4()),
            intent_id=intent_id,
            strategy_name=strategy_name,
            description=description,
            status=StrategyStatus.ACTIVE,
            created_at=datetime.now(timezone.utc).isoformat(),
            updated_at=datetime.now(timezone.utc).isoformat(),
            metadata=metadata or {}
        )
        
        self._strategies[strategy.strategy_id] = strategy
        self._save()
        return strategy
    
    def get_intent(self, intent_id: str) -> Optional[Intent]:
        """Get intent by ID."""
        return self._intents.get(intent_id)
    
    def get_strategy(self, strategy_id: str) -> Optional[Strategy]:
        """Get strategy by ID."""
        return self._strategies.get(strategy_id)
    
    def get_strategies_for_intent(self, intent_id: str) -> List[Strategy]:
        """Get all strategies for an intent."""
        return [
            strategy for strategy in self._strategies.values()
            if strategy.intent_id == intent_id
        ]
    
    def update_strategy_status(self, strategy_id: str, status: StrategyStatus) -> None:
        """Update strategy status."""
        strategy = self._strategies.get(strategy_id)
        if strategy:
            strategy.status = status
            strategy.updated_at = datetime.now(timezone.utc).isoformat()
            self._save()
    
    def archive_intent(self, intent_id: str) -> None:
        """Archive an intent."""
        intent = self._intents.get(intent_id)
        if intent:
            intent.status = IntentStatus.ARCHIVED
            intent.updated_at = datetime.now(timezone.utc).isoformat()
            self._save()
    
    def get_active_intents(self) -> List[Intent]:
        """Get all active intents."""
        return [
            intent for intent in self._intents.values()
            if intent.status == IntentStatus.ACTIVE
        ]
    
    def get_active_strategies(self) -> List[Strategy]:
        """Get all active strategies."""
        return [
            strategy for strategy in self._strategies.values()
            if strategy.status == StrategyStatus.ACTIVE
        ]


class StrategyBuilder:
    """
    Builder for creating intent-strategy hierarchies.
    """
    
    def __init__(self, hierarchy: StrategyHierarchy):
        self.hierarchy = hierarchy
    
    def create_constitutional_runtime_intent(self) -> Intent:
        """Create the constitutional runtime intent."""
        return self.hierarchy.create_intent(
            intent_name="Constitutional Runtime",
            description="Build a constitutional runtime with zero-trust governance, planning-driven execution, and immutable artifacts.",
            metadata={
                "domain": "software_architecture",
                "priority": "high",
                "long_term": True
            }
        )
    
    def create_zero_trust_strategy(self, intent_id: str) -> Strategy:
        """Create zero-trust strategy."""
        return self.hierarchy.create_strategy(
            intent_id=intent_id,
            strategy_name="Zero Trust",
            description="All subsystems start with no permissions and must request capabilities through a broker.",
            metadata={
                "principle": "never_trust_always_verify",
                "capability_broker": True
            }
        )
    
    def create_offline_first_strategy(self, intent_id: str) -> Strategy:
        """Create offline-first strategy."""
        return self.hierarchy.create_strategy(
            intent_id=intent_id,
            strategy_name="Offline First",
            description="Runtime should function without external dependencies. Network access is a capability, not a default.",
            metadata={
                "principle": "local_first",
                "network_capability": False
            }
        )
    
    def create_local_models_strategy(self, intent_id: str) -> Strategy:
        """Create local models strategy."""
        return self.hierarchy.create_strategy(
            intent_id=intent_id,
            strategy_name="Local Models",
            description="Use local AI models instead of external APIs. Model selection is a capability.",
            metadata={
                "principle": "local_inference",
                "external_apis": False
            }
        )
    
    def create_planning_driven_strategy(self, intent_id: str) -> Strategy:
        """Create planning-driven strategy."""
        return self.hierarchy.create_strategy(
            intent_id=intent_id,
            strategy_name="Planning Driven",
            description="Planning never executes. Planning produces plans. Execution belongs elsewhere.",
            metadata={
                "principle": "separation_of_concerns",
                "planning_ir": True
            }
        )


# Singleton instance
_strategy_hierarchy = StrategyHierarchy()
_strategy_builder = StrategyBuilder(_strategy_hierarchy)


def get_strategy_hierarchy() -> StrategyHierarchy:
    """Get the singleton strategy hierarchy."""
    return _strategy_hierarchy


def get_strategy_builder() -> StrategyBuilder:
    """Get the singleton strategy builder."""
    return _strategy_builder
