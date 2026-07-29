"""Canonical Traversal Authority

Single implementation of object traversal for canonical operations.

Eliminates every duplicate object walk across the system.

Architecture:
TraversalPolicy
  ├── UnicodePolicy
  ├── NumericPolicy
  └── OrderingPolicy
  ↓
TraversalEngine
  ↓
CanonicalTraversalAuthority

The engine shouldn't know why NFC exists.
It should simply execute policy.

This separation becomes valuable once constitutional versions begin changing.
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Set, Tuple
import unicodedata

from .traversal_policy import (
    TraversalPolicy,
    UnicodePolicy,
    NumericPolicy,
    OrderingPolicy,
    UnicodeNormalizationRule,
    FloatEncodingRule,
    IntegerNormalizationRule,
)


class TraversalError(Exception):
    """Constitutional traversal error"""
    pass


class TraversalEngine:
    """
    Traversal engine that executes traversal policy.
    
    The engine doesn't know why policies exist.
    It simply executes the policy.
    
    Separation of concerns:
    - TraversalPolicy defines constitutional rules
    - TraversalEngine executes those rules
    """
    
    def __init__(self, policy: TraversalPolicy):
        self.policy = policy
    
    def traverse(self, data: Any) -> Any:
        """
        Traverse and normalize data according to policy.
        
        This is the single entry point for all canonical traversal.
        
        Data → TraversalPolicy → TraversalEngine → Normalized Data
        """
        return self._traverse(data)
    
    def _traverse(self, data: Any) -> Any:
        """Internal traversal with policy execution"""
        if data is None:
            return None
        
        if isinstance(data, str):
            return self._normalize_string(data)
        
        if isinstance(data, bool):
            return data
        
        if isinstance(data, (int, float)):
            return self._normalize_number(data)
        
        if isinstance(data, dict):
            return self._traverse_dict(data)
        
        if isinstance(data, (list, tuple)):
            return self._traverse_sequence(data)
        
        if isinstance(data, set):
            return self._traverse_set(data)
        
        # Unknown type - reject for constitutional safety
        raise TraversalError(f"Unsupported type for canonical traversal: {type(data)}")
    
    def _normalize_string(self, data: str) -> str:
        """Normalize string according to unicode policy"""
        rule = self.policy.unicode.normalization_rule
        
        if rule == UnicodeNormalizationRule.NFC:
            return unicodedata.normalize('NFC', data)
        elif rule == UnicodeNormalizationRule.NFD:
            return unicodedata.normalize('NFD', data)
        elif rule == UnicodeNormalizationRule.NFKC:
            return unicodedata.normalize('NFKC', data)
        elif rule == UnicodeNormalizationRule.NFKD:
            return unicodedata.normalize('NFKD', data)
        else:
            return data
    
    def _normalize_number(self, data: Any) -> Any:
        """Normalize number according to numeric policy"""
        if isinstance(data, int):
            return data
        
        if isinstance(data, float):
            # Check for NaN
            if self.policy.numeric.float_encoding == FloatEncodingRule.REJECT_NAN:
                if data != data:  # NaN check
                    raise TraversalError("NaN values are constitutionally rejected")
            
            # Check for infinity
            if self.policy.numeric.float_encoding == FloatEncodingRule.REJECT_INFINITY:
                if data == float('inf') or data == float('-inf'):
                    raise TraversalError("Infinity values are constitutionally rejected")
            
            # Check if float is actually an integer
            if self.policy.numeric.integer_normalization == IntegerNormalizationRule.REJECT_FLOATS:
                if data.is_integer():
                    return int(data)
            
            return data
        
        raise TraversalError(f"Unsupported number type: {type(data)}")
    
    def _traverse_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Traverse dictionary with key ordering policy"""
        result = {}
        
        # Get keys in deterministic order
        keys = list(data.keys())
        if self.policy.ordering.key_ordering:
            keys = sorted(keys)
        
        for key in keys:
            # Normalize key
            normalized_key = self._normalize_string(key)
            # Traverse value
            normalized_value = self._traverse(data[key])
            result[normalized_key] = normalized_value
        
        return result
    
    def _traverse_sequence(self, data: Any) -> List[Any]:
        """Traverse sequence (list/tuple)"""
        result = []
        for item in data:
            result.append(self._traverse(item))
        
        # Preserve tuple type
        if isinstance(data, tuple):
            return tuple(result)
        
        return result
    
    def _traverse_set(self, data: Set[Any]) -> List[Any]:
        """Traverse set with ordering policy"""
        result = []
        for item in data:
            result.append(self._traverse(item))
        
        # Sort for deterministic ordering
        if self.policy.ordering.set_ordering:
            # Sort by string representation for determinism
            result.sort(key=lambda x: str(x))
        
        return result


class CanonicalTraversalAuthority:
    """
    Single implementation of object traversal for canonical operations.
    
    Owns:
    - TraversalPolicy (constitutional rules)
    - TraversalEngine (policy execution)
    
    Every canonical operation should use this single traversal authority.
    """
    
    def __init__(self, policy: TraversalPolicy = TraversalPolicy.v1()):
        self.policy = policy
        self.engine = TraversalEngine(policy)
    
    def traverse(self, data: Any) -> Any:
        """
        Traverse and normalize data according to constitutional policy.
        
        This is the single entry point for all canonical traversal.
        
        Data → TraversalPolicy → TraversalEngine → Normalized Data
        """
        return self.engine.traverse(data)
    
    def get_policy(self) -> TraversalPolicy:
        """Get traversal policy"""
        return self.policy
