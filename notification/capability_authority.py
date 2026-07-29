"""Capability Authority

Constitutional capability authority replacing string capabilities with CapabilityHash.

Architecture:
CapabilityDescriptor
  ↓
  CapabilityId
  ↓
  CapabilityHash

No strings. Only constitutional IDs.

Exactly like EventType.
"""

from dataclasses import dataclass
from typing import Any
from enum import Enum

from constitution.authority.canonical_serializer import CanonicalSerializer, CanonicalHash


class CapabilityCategory(Enum):
    """Categories of capabilities"""
    NOTIFICATION = "notification"
    MESSAGING = "messaging"
    STORAGE = "storage"
    COMPUTE = "compute"
    AUTH = "auth"
    MONITORING = "monitoring"


@dataclass(frozen=True)
class CapabilityDescriptor:
    """
    Immutable descriptor for capabilities.
    
    Contains:
    - capability_id (canonical identifier)
    - capability_hash (SHA256 hash of descriptor)
    - category (capability category)
    - name (human-readable name)
    - description (capability description)
    - parameters_schema (expected parameters)
    - version (capability version)
    """
    capability_id: str
    capability_hash: str
    category: CapabilityCategory
    name: str
    description: str
    parameters_schema: dict[str, Any] | None = None
    version: str = "1.0.0"
    metadata: dict[str, Any] | None = None
    
    @classmethod
    def create(
        cls,
        capability_id: str,
        category: CapabilityCategory,
        name: str,
        description: str,
        parameters_schema: dict[str, Any] | None = None,
        version: str = "1.0.0",
        metadata: dict[str, Any] | None = None,
        serializer: CanonicalSerializer | None = None,
    ) -> "CapabilityDescriptor":
        """
        Create capability descriptor with canonical hash.
        
        CapabilityDescriptor → CanonicalSerializer → CapabilityHash
        """
        serializer = serializer or CanonicalSerializer()
        
        # Serialize descriptor data to canonical bytes
        descriptor_data = {
            "capability_id": capability_id,
            "category": category.value,
            "name": name,
            "description": description,
            "parameters_schema": parameters_schema,
            "version": version,
            "metadata": metadata,
        }
        
        # Hash descriptor data
        capability_hash = serializer.hash(descriptor_data).value
        
        return cls(
            capability_id=capability_id,
            capability_hash=capability_hash,
            category=category,
            name=name,
            description=description,
            parameters_schema=parameters_schema,
            version=version,
            metadata=metadata,
        )


class CapabilityAuthority:
    """
    Authority for managing constitutional capabilities.
    
    Replaces string capabilities ("sms", "subscriber", "broadcast")
    with constitutional CapabilityDescriptor objects.
    """
    
    def __init__(self):
        self._descriptors: dict[str, CapabilityDescriptor] = {}  # capability_id -> descriptor
        self._hash_to_id: dict[str, str] = {}  # capability_hash -> capability_id
    
    def register_capability(self, descriptor: CapabilityDescriptor) -> None:
        """Register a capability descriptor"""
        self._descriptors[descriptor.capability_id] = descriptor
        self._hash_to_id[descriptor.capability_hash] = descriptor.capability_id
    
    def get_by_id(self, capability_id: str) -> CapabilityDescriptor:
        """Get capability descriptor by ID"""
        descriptor = self._descriptors.get(capability_id)
        if not descriptor:
            raise ValueError(f"Capability not found: {capability_id}")
        return descriptor
    
    def get_by_hash(self, capability_hash: str) -> CapabilityDescriptor:
        """Get capability descriptor by hash"""
        capability_id = self._hash_to_id.get(capability_hash)
        if not capability_id:
            raise ValueError(f"Capability hash not found: {capability_hash}")
        return self.get_by_id(capability_id)
    
    def list_capabilities(self) -> list[CapabilityDescriptor]:
        """List all registered capabilities"""
        return list(self._descriptors.values())
    
    def list_by_category(self, category: CapabilityCategory) -> list[CapabilityDescriptor]:
        """List capabilities by category"""
        return [
            descriptor for descriptor in self._descriptors.values()
            if descriptor.category == category
        ]
    
    def create_notification_capability(
        self,
        capability_id: str,
        name: str,
        description: str,
        parameters_schema: dict[str, Any] | None = None,
    ) -> CapabilityDescriptor:
        """Create and register a notification capability"""
        descriptor = CapabilityDescriptor.create(
            capability_id=capability_id,
            category=CapabilityCategory.NOTIFICATION,
            name=name,
            description=description,
            parameters_schema=parameters_schema,
        )
        self.register_capability(descriptor)
        return descriptor
    
    def create_messaging_capability(
        self,
        capability_id: str,
        name: str,
        description: str,
        parameters_schema: dict[str, Any] | None = None,
    ) -> CapabilityDescriptor:
        """Create and register a messaging capability"""
        descriptor = CapabilityDescriptor.create(
            capability_id=capability_id,
            category=CapabilityCategory.MESSAGING,
            name=name,
            description=description,
            parameters_schema=parameters_schema,
        )
        self.register_capability(descriptor)
        return descriptor


# Predefined constitutional capabilities (replacing strings)
class ConstitutionalCapabilities:
    """Predefined constitutional capability IDs"""
    
    # Notification capabilities
    CREATE_SUBSCRIBER = "capability.notification.create_subscriber"
    SEND_BROADCAST = "capability.notification.send_broadcast"
    ADD_TAG = "capability.notification.add_tag"
    ENROLL_SEQUENCE = "capability.notification.enroll_sequence"
    TRIGGER_AUTOMATION = "capability.notification.trigger_automation"
    
    # Messaging capabilities
    SEND_SMS = "capability.messaging.send_sms"
    SEND_MMS = "capability.messaging.send_mms"
    SEND_VOICE = "capability.messaging.send_voice"
