"""Canonical Tree

Intermediate canonical representation before encoding.

Architecture:
Traversal
  ↓
Canonical Tree
  ↓
Encoding Authority
  ↓
Bytes

This separation allows:
- UTF-8
- CBOR
- MessagePack
- Binary canonical forms

without touching traversal.

Canonical primitive types instead of Python-native values.
"""

from dataclasses import dataclass
from typing import Any, List, Dict
from enum import Enum


class CanonicalNodeType(Enum):
    """Types of canonical tree nodes"""
    NULL = "null"
    BOOLEAN = "boolean"
    INTEGER = "integer"
    FLOAT = "float"
    STRING = "string"
    LIST = "list"
    DICT = "dict"


@dataclass(frozen=True)
class CanonicalNull:
    """Constitutional null value"""
    pass


@dataclass(frozen=True)
class CanonicalBoolean:
    """Constitutional boolean value"""
    value: bool


@dataclass(frozen=True)
class CanonicalInteger:
    """Constitutional integer value"""
    value: int


@dataclass(frozen=True)
class CanonicalFloat:
    """Constitutional float value"""
    value: float


@dataclass(frozen=True)
class CanonicalString:
    """Constitutional string value"""
    value: str


@dataclass(frozen=True)
class CanonicalList:
    """Constitutional list value"""
    value: List[Any]  # List of canonical values


@dataclass(frozen=True)
class CanonicalDict:
    """Constitutional dict value"""
    value: Dict[str, Any]  # Dict of string keys to canonical values


@dataclass(frozen=True)
class CanonicalNode:
    """
    Immutable node in canonical tree.
    
    Represents a single value in the canonical tree structure.
    Uses constitutional primitive types instead of Python-native values.
    """
    node_type: CanonicalNodeType
    value: Any  # One of CanonicalNull, CanonicalBoolean, CanonicalInteger, etc.
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary"""
        return {
            "node_type": self.node_type.value,
            "value": self._canonical_value_to_dict(self.value),
        }
    
    def _canonical_value_to_dict(self, value: Any) -> Any:
        """Convert canonical value to dictionary"""
        if isinstance(value, CanonicalNull):
            return None
        elif isinstance(value, CanonicalBoolean):
            return value.value
        elif isinstance(value, CanonicalInteger):
            return value.value
        elif isinstance(value, CanonicalFloat):
            return value.value
        elif isinstance(value, CanonicalString):
            return value.value
        elif isinstance(value, CanonicalList):
            return [self._canonical_value_to_dict(item) for item in value.value]
        elif isinstance(value, CanonicalDict):
            return {key: self._canonical_value_to_dict(val) for key, val in value.value.items()}
        else:
            return value


@dataclass(frozen=True)
class CanonicalTree:
    """
    Immutable canonical tree representation.
    
    Represents data as a tree of canonical nodes before encoding.
    This is the intermediate representation between traversal and encoding.
    
    Separation of concerns:
    - Traversal produces canonical tree
    - Encoding authority encodes tree to bytes
    
    Uses constitutional primitive types instead of Python-native values.
    """
    root: CanonicalNode
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary"""
        return self.root.to_dict()


class CanonicalTreeBuilder:
    """
    Builds canonical tree from traversed data.
    
    Traversal → CanonicalTreeBuilder → CanonicalTree
    """
    
    def build(self, data: Any) -> CanonicalTree:
        """
        Build canonical tree from data.
        
        Args:
            data: Traversed data
        
        Returns:
            Canonical tree representation
        """
        root = self._build_node(data)
        return CanonicalTree(root=root)
    
    def _build_node(self, data: Any) -> CanonicalNode:
        """Build canonical node from data"""
        if data is None:
            return CanonicalNode(
                node_type=CanonicalNodeType.NULL,
                value=CanonicalNull(),
            )
        elif isinstance(data, bool):
            return CanonicalNode(
                node_type=CanonicalNodeType.BOOLEAN,
                value=CanonicalBoolean(value=data),
            )
        elif isinstance(data, int):
            return CanonicalNode(
                node_type=CanonicalNodeType.INTEGER,
                value=CanonicalInteger(value=data),
            )
        elif isinstance(data, float):
            return CanonicalNode(
                node_type=CanonicalNodeType.FLOAT,
                value=CanonicalFloat(value=data),
            )
        elif isinstance(data, str):
            return CanonicalNode(
                node_type=CanonicalNodeType.STRING,
                value=CanonicalString(value=data),
            )
        elif isinstance(data, list):
            list_nodes = [self._build_node(item) for item in data]
            return CanonicalNode(
                node_type=CanonicalNodeType.LIST,
                value=CanonicalList(value=list_nodes),
            )
        elif isinstance(data, dict):
            dict_nodes = {key: self._build_node(value) for key, value in data.items()}
            return CanonicalNode(
                node_type=CanonicalNodeType.DICT,
                value=CanonicalDict(value=dict_nodes),
            )
        else:
            raise ValueError(f"Unsupported type for canonical tree: {type(data)}")
