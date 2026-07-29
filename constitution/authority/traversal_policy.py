"""Traversal Policy

Constitutional traversal policies separated from execution engine.

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

Policies should be loaded from constitutional configuration,
not hardcoded v1() constructors.
"""

from dataclasses import dataclass
from typing import Any
from enum import Enum


class UnicodeNormalizationRule(Enum):
    """Constitutional unicode normalization rules"""
    NFC = "nfc"  # Canonical composition
    NFD = "nfd"  # Canonical decomposition
    NFKC = "nfkc"  # Compatibility composition
    NFKD = "nfkd"  # Compatibility decomposition


class FloatEncodingRule(Enum):
    """Constitutional float encoding rules"""
    REJECT_NAN = "reject_nan"
    NORMALIZE_PRECISION = "normalize_precision"
    REJECT_INFINITY = "reject_infinity"


class IntegerNormalizationRule(Enum):
    """Constitutional integer normalization rules"""
    REJECT_FLOATS = "reject_floats"
    NORMALIZE_INTEGERS = "normalize_integers"


@dataclass(frozen=True)
class UnicodePolicy:
    """
    Unicode normalization policy.
    
    Defines how strings should be normalized for canonical representation.
    """
    normalization_rule: UnicodeNormalizationRule = UnicodeNormalizationRule.NFC
    
    @classmethod
    def from_config(cls, config: dict[str, Any]) -> "UnicodePolicy":
        """Create policy from configuration"""
        rule_str = config.get("normalization_rule", "nfc")
        rule = UnicodeNormalizationRule(rule_str)
        return cls(normalization_rule=rule)
    
    @classmethod
    def v1(cls) -> "UnicodePolicy":
        """Unicode policy v1 (NFC normalization) - backward compatibility"""
        return cls()
    
    def to_config(self) -> dict[str, Any]:
        """Convert to configuration"""
        return {
            "normalization_rule": self.normalization_rule.value,
        }


@dataclass(frozen=True)
class NumericPolicy:
    """
    Numeric encoding policy.
    
    Defines how numbers should be normalized for canonical representation.
    """
    float_encoding: FloatEncodingRule = FloatEncodingRule.REJECT_NAN
    integer_normalization: IntegerNormalizationRule = IntegerNormalizationRule.REJECT_FLOATS
    
    @classmethod
    def from_config(cls, config: dict[str, Any]) -> "NumericPolicy":
        """Create policy from configuration"""
        float_str = config.get("float_encoding", "reject_nan")
        int_str = config.get("integer_normalization", "reject_floats")
        float_rule = FloatEncodingRule(float_str)
        int_rule = IntegerNormalizationRule(int_str)
        return cls(
            float_encoding=float_rule,
            integer_normalization=int_rule,
        )
    
    @classmethod
    def v1(cls) -> "NumericPolicy":
        """Numeric policy v1 (reject NaN, reject integer floats) - backward compatibility"""
        return cls()
    
    def to_config(self) -> dict[str, Any]:
        """Convert to configuration"""
        return {
            "float_encoding": self.float_encoding.value,
            "integer_normalization": self.integer_normalization.value,
        }


@dataclass(frozen=True)
class OrderingPolicy:
    """
    Ordering policy for deterministic traversal.
    
    Defines how collections should be ordered for canonical representation.
    """
    key_ordering: bool = True  # Alphabetical, deterministic
    set_ordering: bool = True  # Sorted, deterministic
    
    @classmethod
    def from_config(cls, config: dict[str, Any]) -> "OrderingPolicy":
        """Create policy from configuration"""
        key_ordering = config.get("key_ordering", True)
        set_ordering = config.get("set_ordering", True)
        return cls(
            key_ordering=key_ordering,
            set_ordering=set_ordering,
        )
    
    @classmethod
    def v1(cls) -> "OrderingPolicy":
        """Ordering policy v1 (alphabetical keys, sorted sets) - backward compatibility"""
        return cls()
    
    def to_config(self) -> dict[str, Any]:
        """Convert to configuration"""
        return {
            "key_ordering": self.key_ordering,
            "set_ordering": self.set_ordering,
        }


@dataclass(frozen=True)
class TraversalPolicy:
    """
    Complete traversal policy.
    
    Combines all traversal policies into a single policy object.
    """
    unicode: UnicodePolicy
    numeric: NumericPolicy
    ordering: OrderingPolicy
    
    @classmethod
    def from_config(cls, config: dict[str, Any]) -> "TraversalPolicy":
        """Create policy from configuration"""
        unicode_policy = UnicodePolicy.from_config(config.get("unicode", {}))
        numeric_policy = NumericPolicy.from_config(config.get("numeric", {}))
        ordering_policy = OrderingPolicy.from_config(config.get("ordering", {}))
        return cls(
            unicode=unicode_policy,
            numeric=numeric_policy,
            ordering=ordering_policy,
        )
    
    @classmethod
    def v1(cls) -> "TraversalPolicy":
        """Traversal policy v1 - backward compatibility"""
        return cls(
            unicode=UnicodePolicy.v1(),
            numeric=NumericPolicy.v1(),
            ordering=OrderingPolicy.v1(),
        )
    
    def to_config(self) -> dict[str, Any]:
        """Convert to configuration"""
        return {
            "unicode": self.unicode.to_config(),
            "numeric": self.numeric.to_config(),
            "ordering": self.ordering.to_config(),
        }
