"""
Skill Classification - Pure Transformations vs Effect Nodes.

Separate skills into:
- Pure Transformations: Input → Output, Deterministic, Composable, No side effects
- Effect Nodes: Filesystem, Network, Terminal, LLM, Artifacts, Human approval, Compilation, Execution

This separation mirrors functional programming principles.
Pure transforms may compose indefinitely.
Effect nodes require capability negotiation and runtime scheduling.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Callable
from datetime import datetime, timezone
from enum import Enum
import uuid

from runtime.skills.skill_registry import SkillDefinition, Determinism


class SkillCategory(Enum):
    """Categories of skills."""
    PURE_TRANSFORM = "pure_transform"
    EFFECT_NODE = "effect_node"


class EffectType(Enum):
    """Types of effect nodes."""
    FILESYSTEM_READ = "filesystem_read"
    FILESYSTEM_WRITE = "filesystem_write"
    NETWORK_REQUEST = "network_request"
    TERMINAL_EXECUTE = "terminal_execute"
    LLM_INFERENCE = "llm_inference"
    ARTIFACT_CREATE = "artifact_create"
    ARTIFACT_READ = "artifact_read"
    HUMAN_APPROVAL = "human_approval"
    COMPILATION = "compilation"
    EXECUTION = "execution"


class TransformType(Enum):
    """Types of pure transforms."""
    NORMALIZATION = "normalization"
    PLANNING_TRANSFORM = "planning_transform"
    SCHEMA_TRANSFORM = "schema_transform"
    IR_TRANSFORM = "ir_transform"
    GRAPH_TRANSFORM = "graph_transform"
    VALIDATION_TRANSFORM = "validation_transform"
    AGGREGATION = "aggregation"
    FILTER = "filter"
    MAP = "map"
    REDUCE = "reduce"


@dataclass
class PureTransform:
    """
    A pure transformation skill.
    
    Input → Output
    Deterministic
    Composable
    No side effects
    
    Examples:
    - Normalization
    - Planning transforms
    - Schema transforms
    - IR transforms
    - Graph transforms
    - Validation transforms
    """
    transform_id: str
    transform_name: str
    transform_type: TransformType
    description: str
    
    # I/O
    input_types: List[str]
    output_types: List[str]
    
    # Determinism
    determinism: Determinism
    
    # Cost
    estimated_cost_tokens: int
    estimated_time_seconds: int
    
    # Composition
    composable: bool
    pure: bool
    
    # Metadata
    metadata: Dict[str, Any]
    
    def is_deterministic(self) -> bool:
        """Check if transform is deterministic."""
        return self.determinism == Determinism.DETERMINISTIC
    
    def can_compose_with(self, other: 'PureTransform') -> bool:
        """Check if this transform can compose with another."""
        # Output types must match input types
        return bool(set(self.output_types) & set(other.input_types))
    
    def compose(self, other: 'PureTransform') -> 'PureTransform':
        """
        Compose this transform with another.
        
        Returns: f ∘ g (f after g)
        """
        return PureTransform(
            transform_id=f"composed_{self.transform_id}_{other.transform_id}",
            transform_name=f"{self.transform_name} → {other.transform_name}",
            transform_type=TransformType.IR_TRANSFORM,  # Composed transforms become IR transforms
            description=f"Composition of {self.transform_name} and {other.transform_name}",
            input_types=self.input_types,
            output_types=other.output_types,
            determinism=Determinism.DETERMINISTIC if (
                self.determinism == Determinism.DETERMINISTIC and 
                other.determinism == Determinism.DETERMINISTIC
            ) else Determinism.PROBABILISTIC,
            estimated_cost_tokens=self.estimated_cost_tokens + other.estimated_cost_tokens,
            estimated_time_seconds=self.estimated_time_seconds + other.estimated_time_seconds,
            composable=True,
            pure=True,
            metadata={
                "composed_from": [self.transform_id, other.transform_id],
                "composition_type": "sequential"
            }
        )


@dataclass
class EffectNode:
    """
    An effect node skill.
    
    Side effects:
    - Filesystem
    - Network
    - Terminal
    - LLM
    - Artifacts
    - Human approval
    - Compilation
    - Execution
    
    Requires capability negotiation and runtime scheduling.
    """
    effect_id: str
    effect_name: str
    effect_type: EffectType
    description: str
    
    # I/O
    input_types: List[str]
    output_types: List[str]
    
    # Capabilities required
    capabilities_required: List[str]
    
    # Determinism
    determinism: Determinism
    
    # Cost
    estimated_cost_tokens: int
    estimated_time_seconds: int
    timeout_seconds: int
    
    # Resource requirements
    produces: List[str]
    consumes: List[str]
    
    # Metadata
    metadata: Dict[str, Any]
    
    def requires_capability(self, capability: str) -> bool:
        """Check if effect requires a specific capability."""
        return capability in self.capabilities_required
    
    def has_side_effects(self) -> bool:
        """Check if effect has side effects (always true for effect nodes)."""
        return True
    
    def is_deterministic(self) -> bool:
        """Check if effect is deterministic."""
        return self.determinism == Determinism.DETERMINISTIC


class SkillClassifier:
    """
    Classifies skills into Pure Transformations or Effect Nodes.
    
    Separates concerns:
    - Pure transforms: No side effects, composable
    - Effect nodes: Side effects, require capability negotiation
    """
    
    def __init__(self):
        self._pure_transforms: Dict[str, PureTransform] = {}
        self._effect_nodes: Dict[str, EffectNode] = {}
    
    def classify_skill(self, skill: SkillDefinition) -> tuple[SkillCategory, Any]:
        """
        Classify a skill into pure transform or effect node.
        
        Args:
            skill: Skill definition to classify
        
        Returns:
            (category, classified_object)
        """
        # Check if skill has side effects
        has_side_effects = self._has_side_effects(skill)
        
        if has_side_effects:
            effect_node = self._skill_to_effect_node(skill)
            self._effect_nodes[effect_node.effect_id] = effect_node
            return SkillCategory.EFFECT_NODE, effect_node
        else:
            pure_transform = self._skill_to_pure_transform(skill)
            self._pure_transforms[pure_transform.transform_id] = pure_transform
            return SkillCategory.PURE_TRANSFORM, pure_transform
    
    def _has_side_effects(self, skill: SkillDefinition) -> bool:
        """Determine if skill has side effects."""
        # Check capabilities that indicate side effects
        side_effect_capabilities = {
            "filesystem.read", "filesystem.write",
            "network.request", "network.connect",
            "terminal.execute", "shell.execute",
            "llm.inference", "llm.generate",
            "artifact.create", "artifact.write",
            "human.approval", "human.input",
            "compilation.execute", "execution.execute"
        }
        
        for cap in skill.capabilities_required:
            if any(side_cap in cap.lower() for side_cap in side_effect_capabilities):
                return True
        
        # Check if skill produces artifacts (side effect)
        if skill.produces:
            return True
        
        # Check if skill consumes resources (side effect)
        if skill.consumes:
            return True
        
        # Check category
        if skill.category in ["filesystem", "network", "terminal", "llm", "execution"]:
            return True
        
        return False
    
    def _skill_to_pure_transform(self, skill: SkillDefinition) -> PureTransform:
        """Convert skill to pure transform."""
        # Determine transform type based on category
        transform_type_map = {
            "normalization": TransformType.NORMALIZATION,
            "planning": TransformType.PLANNING_TRANSFORM,
            "schema": TransformType.SCHEMA_TRANSFORM,
            "ir": TransformType.IR_TRANSFORM,
            "graph": TransformType.GRAPH_TRANSFORM,
            "validation": TransformType.VALIDATION_TRANSFORM,
            "aggregation": TransformType.AGGREGATION,
            "filter": TransformType.FILTER,
            "map": TransformType.MAP,
            "reduce": TransformType.REDUCE
        }
        
        transform_type = transform_type_map.get(skill.category, TransformType.IR_TRANSFORM)
        
        return PureTransform(
            transform_id=skill.skill_id,
            transform_name=skill.skill_name,
            transform_type=transform_type,
            description=skill.description,
            input_types=[inp.input_type for inp in skill.inputs],
            output_types=[out.output_type for out in skill.outputs],
            determinism=skill.determinism,
            estimated_cost_tokens=skill.estimated_cost_tokens,
            estimated_time_seconds=skill.estimated_time_seconds,
            composable=True,
            pure=True,
            metadata={
                "original_skill_id": skill.skill_id,
                "original_category": skill.category,
                "tags": skill.tags
            }
        )
    
    def _skill_to_effect_node(self, skill: SkillDefinition) -> EffectNode:
        """Convert skill to effect node."""
        # Determine effect type based on category
        effect_type_map = {
            "filesystem": EffectType.FILESYSTEM_WRITE,
            "network": EffectType.NETWORK_REQUEST,
            "terminal": EffectType.TERMINAL_EXECUTE,
            "llm": EffectType.LLM_INFERENCE,
            "artifact": EffectType.ARTIFACT_CREATE,
            "human": EffectType.HUMAN_APPROVAL,
            "compilation": EffectType.COMPILATION,
            "execution": EffectType.EXECUTION
        }
        
        effect_type = effect_type_map.get(skill.category, EffectType.EXECUTION)
        
        return EffectNode(
            effect_id=skill.skill_id,
            effect_name=skill.skill_name,
            effect_type=effect_type,
            description=skill.description,
            input_types=[inp.input_type for inp in skill.inputs],
            output_types=[out.output_type for out in skill.outputs],
            capabilities_required=skill.capabilities_required,
            determinism=skill.determinism,
            estimated_cost_tokens=skill.estimated_cost_tokens,
            estimated_time_seconds=skill.estimated_time_seconds,
            timeout_seconds=skill.timeout_seconds,
            produces=skill.produces,
            consumes=skill.consumes,
            metadata={
                "original_skill_id": skill.skill_id,
                "original_category": skill.category,
                "tags": skill.tags,
                "failure_modes": [
                    {
                        "failure_type": fm.failure_type,
                        "probability": fm.probability,
                        "detection_method": fm.detection_method,
                        "recovery_strategy": fm.recovery_strategy
                    }
                    for fm in skill.failure_modes
                ]
            }
        )
    
    def get_pure_transforms(self) -> List[PureTransform]:
        """Get all pure transforms."""
        return list(self._pure_transforms.values())
    
    def get_effect_nodes(self) -> List[EffectNode]:
        """Get all effect nodes."""
        return list(self._effect_nodes.values())
    
    def get_pure_transforms_by_type(self, transform_type: TransformType) -> List[PureTransform]:
        """Get pure transforms by type."""
        return [
            transform for transform in self._pure_transforms.values()
            if transform.transform_type == transform_type
        ]
    
    def get_effect_nodes_by_type(self, effect_type: EffectType) -> List[EffectNode]:
        """Get effect nodes by type."""
        return [
            effect for effect in self._effect_nodes.values()
            if effect.effect_type == effect_type
        ]
    
    def find_composable_chain(
        self,
        input_type: str,
        output_type: str
    ) -> List[PureTransform]:
        """
        Find a chain of pure transforms that transforms input_type to output_type.
        
        Args:
            input_type: Input type
            output_type: Output type
        
        Returns:
            List of pure transforms in order
        """
        # BFS to find shortest path
        from collections import deque
        
        queue = deque([(input_type, [])])
        visited = set()
        
        while queue:
            current_type, path = queue.popleft()
            
            if current_type == output_type:
                return path
            
            if current_type in visited:
                continue
            visited.add(current_type)
            
            # Find transforms that take current_type as input
            for transform in self._pure_transforms.values():
                if current_type in transform.input_types:
                    for out_type in transform.output_types:
                        queue.append((out_type, path + [transform]))
        
        return []
    
    def compose_transforms(self, transform_ids: List[str]) -> Optional[PureTransform]:
        """
        Compose multiple pure transforms into one.
        
        Args:
            transform_ids: List of transform IDs to compose
        
        Returns:
            Composed transform or None if composition fails
        """
        if not transform_ids:
            return None
        
        transforms = [self._pure_transforms.get(tid) for tid in transform_ids if tid in self._pure_transforms]
        
        if not transforms:
            return None
        
        # Compose sequentially
        composed = transforms[0]
        for transform in transforms[1:]:
            if not composed.can_compose_with(transform):
                return None
            composed = composed.compose(transform)
        
        return composed


class ClassifiedSkillRegistry:
    """
    Registry for classified skills (pure transforms and effect nodes).
    
    Provides separate access to pure transforms and effect nodes.
    """
    
    def __init__(self, classifier: SkillClassifier):
        self.classifier = classifier
    
    def register_skill(self, skill: SkillDefinition) -> tuple[SkillCategory, Any]:
        """
        Register and classify a skill.
        
        Args:
            skill: Skill to register
        
        Returns:
            (category, classified_object)
        """
        return self.classifier.classify_skill(skill)
    
    def get_pure_transforms(self) -> List[PureTransform]:
        """Get all pure transforms."""
        return self.classifier.get_pure_transforms()
    
    def get_effect_nodes(self) -> List[EffectNode]:
        """Get all effect nodes."""
        return self.classifier.get_effect_nodes()
    
    def get_transform_by_id(self, transform_id: str) -> Optional[PureTransform]:
        """Get pure transform by ID."""
        return self.classifier._pure_transforms.get(transform_id)
    
    def get_effect_by_id(self, effect_id: str) -> Optional[EffectNode]:
        """Get effect node by ID."""
        return self.classifier._effect_nodes.get(effect_id)
    
    def find_transforms_for_capability(self, capability: str) -> List[PureTransform]:
        """Find pure transforms that don't require the given capability."""
        return [
            transform for transform in self.classifier.get_pure_transforms()
            if not any(cap in transform.metadata.get("original_skill_id", "") for cap in [capability])
        ]
    
    def find_effects_requiring_capability(self, capability: str) -> List[EffectNode]:
        """Find effect nodes that require a specific capability."""
        return [
            effect for effect in self.classifier.get_effect_nodes()
            if effect.requires_capability(capability)
        ]


# Singleton instances
_skill_classifier = SkillClassifier()
_classified_skill_registry = ClassifiedSkillRegistry(_skill_classifier)


def get_skill_classifier() -> SkillClassifier:
    """Get the singleton skill classifier."""
    return _skill_classifier


def get_classified_skill_registry() -> ClassifiedSkillRegistry:
    """Get the singleton classified skill registry."""
    return _classified_skill_registry
