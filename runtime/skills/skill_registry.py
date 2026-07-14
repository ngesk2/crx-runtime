"""
Declarative Skill Registry.

Skills become declarative:
- Inputs
- Outputs
- Capabilities Required
- Failure Modes
- Determinism
- Estimated Cost
- Produces
- Consumes

Now planner can reason about skills compositionally.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Set
from datetime import datetime, timezone
from enum import Enum
import json
from pathlib import Path


class Determinism(Enum):
    """Determinism level for skills."""
    DETERMINISTIC = "deterministic"
    PROBABILISTIC = "probabilistic"
    NON_DETERMINISTIC = "non_deterministic"


@dataclass
class SkillInput:
    """Input specification for a skill."""
    input_id: str
    input_type: str  # file, string, number, object, list
    description: str
    required: bool
    default_value: Optional[Any]
    validation: Optional[str]


@dataclass
class SkillOutput:
    """Output specification for a skill."""
    output_id: str
    output_type: str
    description: str
    optional: bool


@dataclass
class FailureMode:
    """Failure mode for a skill."""
    failure_type: str
    probability: str  # low, medium, high
    detection_method: str
    recovery_strategy: str
    manual_intervention_required: bool


@dataclass
class SkillDefinition:
    """
    Declarative skill definition.
    
    Skills are composable building blocks that the planner can reason about.
    """
    
    skill_id: str
    skill_name: str
    skill_version: str
    description: str
    
    # I/O
    inputs: List[SkillInput]
    outputs: List[SkillOutput]
    
    # Capabilities
    capabilities_required: List[str]
    
    # Execution characteristics
    determinism: Determinism
    estimated_cost_tokens: int
    estimated_time_seconds: int
    timeout_seconds: int
    
    # Failure handling
    failure_modes: List[FailureMode]
    retry_policy: Dict[str, Any]
    
    # Resource usage
    produces: List[str]  # Artifacts produced
    consumes: List[str]  # Resources consumed
    
    # Metadata
    category: str
    tags: List[str]
    author: str
    created_at: str
    updated_at: str
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert skill to dictionary."""
        return {
            "skill_id": self.skill_id,
            "skill_name": self.skill_name,
            "skill_version": self.skill_version,
            "description": self.description,
            "inputs": [
                {
                    "input_id": inp.input_id,
                    "input_type": inp.input_type,
                    "description": inp.description,
                    "required": inp.required,
                    "default_value": inp.default_value,
                    "validation": inp.validation
                }
                for inp in self.inputs
            ],
            "outputs": [
                {
                    "output_id": out.output_id,
                    "output_type": out.output_type,
                    "description": out.description,
                    "optional": out.optional
                }
                for out in self.outputs
            ],
            "capabilities_required": self.capabilities_required,
            "determinism": self.determinism.value,
            "estimated_cost_tokens": self.estimated_cost_tokens,
            "estimated_time_seconds": self.estimated_time_seconds,
            "timeout_seconds": self.timeout_seconds,
            "failure_modes": [
                {
                    "failure_type": fm.failure_type,
                    "probability": fm.probability,
                    "detection_method": fm.detection_method,
                    "recovery_strategy": fm.recovery_strategy,
                    "manual_intervention_required": fm.manual_intervention_required
                }
                for fm in self.failure_modes
            ],
            "retry_policy": self.retry_policy,
            "produces": self.produces,
            "consumes": self.consumes,
            "category": self.category,
            "tags": self.tags,
            "author": self.author,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SkillDefinition':
        """Create skill from dictionary."""
        return cls(
            skill_id=data["skill_id"],
            skill_name=data["skill_name"],
            skill_version=data["skill_version"],
            description=data["description"],
            inputs=[
                SkillInput(
                    input_id=inp["input_id"],
                    input_type=inp["input_type"],
                    description=inp["description"],
                    required=inp["required"],
                    default_value=inp.get("default_value"),
                    validation=inp.get("validation")
                )
                for inp in data["inputs"]
            ],
            outputs=[
                SkillOutput(
                    output_id=out["output_id"],
                    output_type=out["output_type"],
                    description=out["description"],
                    optional=out["optional"]
                )
                for out in data["outputs"]
            ],
            capabilities_required=data["capabilities_required"],
            determinism=Determinism(data["determinism"]),
            estimated_cost_tokens=data["estimated_cost_tokens"],
            estimated_time_seconds=data["estimated_time_seconds"],
            timeout_seconds=data["timeout_seconds"],
            failure_modes=[
                FailureMode(
                    failure_type=fm["failure_type"],
                    probability=fm["probability"],
                    detection_method=fm["detection_method"],
                    recovery_strategy=fm["recovery_strategy"],
                    manual_intervention_required=fm["manual_intervention_required"]
                )
                for fm in data["failure_modes"]
            ],
            retry_policy=data["retry_policy"],
            produces=data["produces"],
            consumes=data["consumes"],
            category=data["category"],
            tags=data["tags"],
            author=data["author"],
            created_at=data["created_at"],
            updated_at=data["updated_at"]
        )


class SkillRegistry:
    """
    Registry for declarative skill definitions.
    
    Provides lookup and composition capabilities for the planner.
    """
    
    def __init__(self, registry_path: str = "runtime/skills/registry.json"):
        self.registry_path = Path(registry_path)
        self.registry_path.parent.mkdir(parents=True, exist_ok=True)
        self._skills: Dict[str, SkillDefinition] = {}
        self._load_registry()
    
    def _load_registry(self) -> None:
        """Load skills from registry file."""
        if self.registry_path.exists():
            with open(self.registry_path, 'r') as f:
                data = json.load(f)
                for skill_data in data.get("skills", []):
                    skill = SkillDefinition.from_dict(skill_data)
                    self._skills[skill.skill_id] = skill
    
    def _save_registry(self) -> None:
        """Save skills to registry file."""
        data = {
            "skills": [skill.to_dict() for skill in self._skills.values()],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        with open(self.registry_path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def register(self, skill: SkillDefinition) -> None:
        """Register a skill."""
        self._skills[skill.skill_id] = skill
        self._save_registry()
    
    def get(self, skill_id: str) -> Optional[SkillDefinition]:
        """Get skill by ID."""
        return self._skills.get(skill_id)
    
    def list_by_category(self, category: str) -> List[SkillDefinition]:
        """List skills by category."""
        return [skill for skill in self._skills.values() if skill.category == category]
    
    def list_by_capability(self, capability: str) -> List[SkillDefinition]:
        """List skills that require a specific capability."""
        return [
            skill for skill in self._skills.values()
            if capability in skill.capabilities_required
        ]
    
    def find_compatible_skills(
        self,
        inputs: List[str],
        outputs: List[str],
        capabilities_available: Set[str]
    ) -> List[SkillDefinition]:
        """
        Find skills compatible with given constraints.
        
        Args:
            inputs: Required input types
            outputs: Required output types
            capabilities_available: Available capabilities
        
        Returns:
            List of compatible skills
        """
        compatible = []
        
        for skill in self._skills.values():
            # Check if skill outputs match required outputs
            skill_output_types = {out.output_type for out in skill.outputs}
            if not skill_output_types.issuperset(set(outputs)):
                continue
            
            # Check if skill inputs can be satisfied
            skill_input_types = {inp.input_type for inp in skill.inputs}
            if not set(inputs).issuperset(skill_input_types):
                continue
            
            # Check if capabilities are available
            if not set(skill.capabilities_required).issubset(capabilities_available):
                continue
            
            compatible.append(skill)
        
        return compatible
    
    def compose_skills(self, skill_ids: List[str]) -> Dict[str, Any]:
        """
        Compose multiple skills into a workflow.
        
        Args:
            skill_ids: List of skill IDs to compose
        
        Returns:
            Composition metadata
        """
        skills = [self.get(sid) for sid in skill_ids if self.get(sid)]
        
        if not skills:
            return {"error": "No valid skills to compose"}
        
        # Calculate combined capabilities
        combined_capabilities = set()
        for skill in skills:
            combined_capabilities.update(skill.capabilities_required)
        
        # Calculate combined cost
        total_cost = sum(skill.estimated_cost_tokens for skill in skills)
        total_time = sum(skill.estimated_time_seconds for skill in skills)
        
        # Check for conflicts
        conflicts = self._detect_conflicts(skills)
        
        return {
            "skills": [skill.skill_id for skill in skills],
            "combined_capabilities": list(combined_capabilities),
            "total_cost_tokens": total_cost,
            "total_time_seconds": total_time,
            "conflicts": conflicts,
            "determinism": self._compose_determinism(skills)
        }
    
    def _detect_conflicts(self, skills: List[SkillDefinition]) -> List[str]:
        """Detect conflicts between skills."""
        conflicts = []
        
        # Check for resource conflicts
        all_consumes = []
        for skill in skills:
            all_consumes.extend(skill.consumes)
        
        # Duplicate consumption
        from collections import Counter
        for resource, count in Counter(all_consumes).items():
            if count > 1:
                conflicts.append(f"Resource conflict: {resource} consumed by multiple skills")
        
        return conflicts
    
    def _compose_determinism(self, skills: List[SkillDefinition]) -> str:
        """Calculate composed determinism."""
        if any(skill.determinism == Determinism.NON_DETERMINISTIC for skill in skills):
            return Determinism.NON_DETERMINISTIC.value
        elif any(skill.determinism == Determinism.PROBABILISTIC for skill in skills):
            return Determinism.PROBABILISTIC.value
        else:
            return Determinism.DETERMINISTIC.value


class SkillBuilder:
    """
    Builder for creating skill definitions.
    """
    
    def __init__(self):
        self._skill_id = None
        self._skill_name = ""
        self._skill_version = "1.0"
        self._description = ""
        self._inputs: List[SkillInput] = []
        self._outputs: List[SkillOutput] = []
        self._capabilities_required: List[str] = []
        self._determinism = Determinism.DETERMINISTIC
        self._estimated_cost_tokens = 0
        self._estimated_time_seconds = 0
        self._timeout_seconds = 300
        self._failure_modes: List[FailureMode] = []
        self._retry_policy = {"max_retries": 3, "backoff": "exponential"}
        self._produces: List[str] = []
        self._consumes: List[str] = []
        self._category = "generic"
        self._tags: List[str] = []
        self._author = "system"
    
    def with_id(self, skill_id: str) -> 'SkillBuilder':
        """Set skill ID."""
        self._skill_id = skill_id
        return self
    
    def with_name(self, name: str) -> 'SkillBuilder':
        """Set skill name."""
        self._skill_name = name
        return self
    
    def with_description(self, description: str) -> 'SkillBuilder':
        """Set description."""
        self._description = description
        return self
    
    def with_input(
        self,
        input_id: str,
        input_type: str,
        description: str,
        required: bool = True,
        default_value: Optional[Any] = None,
        validation: Optional[str] = None
    ) -> 'SkillBuilder':
        """Add input."""
        self._inputs.append(SkillInput(
            input_id=input_id,
            input_type=input_type,
            description=description,
            required=required,
            default_value=default_value,
            validation=validation
        ))
        return self
    
    def with_output(
        self,
        output_id: str,
        output_type: str,
        description: str,
        optional: bool = False
    ) -> 'SkillBuilder':
        """Add output."""
        self._outputs.append(SkillOutput(
            output_id=output_id,
            output_type=output_type,
            description=description,
            optional=optional
        ))
        return self
    
    def with_capability(self, capability: str) -> 'SkillBuilder':
        """Add required capability."""
        self._capabilities_required.append(capability)
        return self
    
    def with_determinism(self, determinism: Determinism) -> 'SkillBuilder':
        """Set determinism level."""
        self._determinism = determinism
        return self
    
    def with_cost(self, tokens: int, time_seconds: int) -> 'SkillBuilder':
        """Set cost estimates."""
        self._estimated_cost_tokens = tokens
        self._estimated_time_seconds = time_seconds
        return self
    
    def with_timeout(self, timeout_seconds: int) -> 'SkillBuilder':
        """Set timeout."""
        self._timeout_seconds = timeout_seconds
        return self
    
    def with_failure_mode(
        self,
        failure_type: str,
        probability: str,
        detection_method: str,
        recovery_strategy: str,
        manual_intervention_required: bool = False
    ) -> 'SkillBuilder':
        """Add failure mode."""
        self._failure_modes.append(FailureMode(
            failure_type=failure_type,
            probability=probability,
            detection_method=detection_method,
            recovery_strategy=recovery_strategy,
            manual_intervention_required=manual_intervention_required
        ))
        return self
    
    def with_produces(self, artifact: str) -> 'SkillBuilder':
        """Add produced artifact."""
        self._produces.append(artifact)
        return self
    
    def with_consumes(self, resource: str) -> 'SkillBuilder':
        """Add consumed resource."""
        self._consumes.append(resource)
        return self
    
    def with_category(self, category: str) -> 'SkillBuilder':
        """Set category."""
        self._category = category
        return self
    
    def with_tag(self, tag: str) -> 'SkillBuilder':
        """Add tag."""
        self._tags.append(tag)
        return self
    
    def build(self) -> SkillDefinition:
        """Build the skill definition."""
        import uuid
        
        if not self._skill_id:
            self._skill_id = f"skill_{uuid.uuid4()}"
        
        now = datetime.now(timezone.utc).isoformat()
        
        return SkillDefinition(
            skill_id=self._skill_id,
            skill_name=self._skill_name,
            skill_version=self._skill_version,
            description=self._description,
            inputs=self._inputs,
            outputs=self._outputs,
            capabilities_required=self._capabilities_required,
            determinism=self._determinism,
            estimated_cost_tokens=self._estimated_cost_tokens,
            estimated_time_seconds=self._estimated_time_seconds,
            timeout_seconds=self._timeout_seconds,
            failure_modes=self._failure_modes,
            retry_policy=self._retry_policy,
            produces=self._produces,
            consumes=self._consumes,
            category=self._category,
            tags=self._tags,
            author=self._author,
            created_at=now,
            updated_at=now
        )


# Singleton instance
_skill_registry = SkillRegistry()


def get_skill_registry() -> SkillRegistry:
    """Get the singleton skill registry."""
    return _skill_registry
