"""
Constitutional Registry System

This module provides the central registry system for all constitutional objects:
- Capability Registry: System capabilities
- Object Registry: Constitutional objects
- Authority Registry: Constitutional authorities
"""

from .capability_registry import (
    Capability,
    CapabilityCategory,
    CapabilityMetadata,
    CapabilityRegistry,
    CapabilityState,
    get_registry,
    register_capability,
    execute_capability,
)

from .object_registry import (
    ObjectCategory,
    ObjectSchema,
    ObjectRegistry,
    get_object_registry,
    register_object_schema,
)

from .authority_registry import (
    Authority,
    AuthorityCategory,
    AuthorityMetadata,
    AuthorityRegistry,
    get_authority_registry,
    register_authority,
)

__all__ = [
    # Capability Registry
    "Capability",
    "CapabilityCategory",
    "CapabilityMetadata",
    "CapabilityRegistry",
    "CapabilityState",
    "get_registry",
    "register_capability",
    "execute_capability",
    # Object Registry
    "ObjectCategory",
    "ObjectSchema",
    "ObjectRegistry",
    "get_object_registry",
    "register_object_schema",
    # Authority Registry
    "Authority",
    "AuthorityCategory",
    "AuthorityMetadata",
    "AuthorityRegistry",
    "get_authority_registry",
    "register_authority",
]
