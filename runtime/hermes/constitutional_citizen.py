"""
Hermes as Constitutional Citizen - Ephemeral leases.

Hermes should not be "the AI."
Hermes should simply be another runtime participant.

Hermes owns:
- No permanent filesystem access
- No permanent network access
- No permanent execution rights
- No permanent policy authority
- No permanent memory mutation authority

For every mission it should receive an ephemeral lease that specifies exactly:
- what it can read
- what it can write
- what skills it may invoke
- what artifacts it may create
- when those permissions expire
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Set
from datetime import datetime, timezone, timedelta
from enum import Enum
import json
import uuid
from pathlib import Path

from runtime.security.semantic_capabilities import CapabilityPath, Operation, CapabilityPathBuilder
from runtime.security.capability_broker import CapabilityBroker, BrokerDecision


class LeaseStatus(Enum):
    """Status of a lease."""
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"
    SUSPENDED = "suspended"


@dataclass
class EphemeralLease:
    """
    Ephemeral lease for Hermes.
    
    Specifies exactly what Hermes can do for a mission.
    """
    lease_id: str
    mission_id: str
    hermes_id: str
    granted_at: str
    expires_at: str
    status: LeaseStatus
    
    # Capabilities granted
    read_capabilities: List[str]  # Paths Hermes can read
    write_capabilities: List[str]  # Paths Hermes can write
    execute_capabilities: List[str]  # Skills Hermes may invoke
    network_capabilities: List[str]  # Network endpoints Hermes may access
    
    # Artifact permissions
    artifacts_readable: List[str]
    artifacts_writable: List[str]
    artifacts_creatable: List[str]
    
    # Memory permissions
    memory_readable: List[str]
    memory_writable: List[str]
    
    # Constraints
    max_execution_time_seconds: int
    max_token_budget: int
    max_memory_mb: int
    
    # Metadata
    granted_by: str
    revocation_reason: Optional[str]
    metadata: Dict[str, Any]
    
    def is_valid(self) -> bool:
        """Check if lease is currently valid."""
        if self.status != LeaseStatus.ACTIVE:
            return False
        
        expires = datetime.fromisoformat(self.expires_at)
        if datetime.now(timezone.utc) > expires:
            return False
        
        return True
    
    def can_read(self, path: str) -> bool:
        """Check if lease allows reading a path."""
        if not self.is_valid():
            return False
        
        for cap in self.read_capabilities:
            if path.startswith(cap):
                return True
        
        return False
    
    def can_write(self, path: str) -> bool:
        """Check if lease allows writing to a path."""
        if not self.is_valid():
            return False
        
        for cap in self.write_capabilities:
            if path.startswith(cap):
                return True
        
        return False
    
    def can_execute_skill(self, skill_id: str) -> bool:
        """Check if lease allows executing a skill."""
        if not self.is_valid():
            return False
        
        return skill_id in self.execute_capabilities
    
    def can_access_network(self, endpoint: str) -> bool:
        """Check if lease allows network access."""
        if not self.is_valid():
            return False
        
        for cap in self.network_capabilities:
            if endpoint.startswith(cap):
                return True
        
        return False
    
    def time_remaining_seconds(self) -> int:
        """Get time remaining in seconds."""
        expires = datetime.fromisoformat(self.expires_at)
        remaining = expires - datetime.now(timezone.utc)
        return max(0, int(remaining.total_seconds()))
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "lease_id": self.lease_id,
            "mission_id": self.mission_id,
            "hermes_id": self.hermes_id,
            "granted_at": self.granted_at,
            "expires_at": self.expires_at,
            "status": self.status.value,
            "read_capabilities": self.read_capabilities,
            "write_capabilities": self.write_capabilities,
            "execute_capabilities": self.execute_capabilities,
            "network_capabilities": self.network_capabilities,
            "artifacts_readable": self.artifacts_readable,
            "artifacts_writable": self.artifacts_writable,
            "artifacts_creatable": self.artifacts_creatable,
            "memory_readable": self.memory_readable,
            "memory_writable": self.memory_writable,
            "max_execution_time_seconds": self.max_execution_time_seconds,
            "max_token_budget": self.max_token_budget,
            "max_memory_mb": self.max_memory_mb,
            "granted_by": self.granted_by,
            "revocation_reason": self.revocation_reason,
            "metadata": self.metadata
        }


class ConstitutionalCitizen:
    """
    Hermes as Constitutional Citizen.
    
    Hermes has no permanent permissions.
    Every mission requires an ephemeral lease.
    """
    
    def __init__(self, hermes_id: str = "hermes"):
        self.hermes_id = hermes_id
        self._active_lease: Optional[EphemeralLease] = None
        self._lease_history: List[EphemeralLease] = []
        self._capability_broker: Optional[CapabilityBroker] = None
    
    def set_capability_broker(self, broker: CapabilityBroker) -> None:
        """Set the capability broker for Hermes."""
        self._capability_broker = broker
    
    async def request_lease(
        self,
        mission_id: str,
        requested_capabilities: Dict[str, List[str]],
        duration_seconds: int = 3600,
        constraints: Optional[Dict[str, Any]] = None
    ) -> tuple[bool, Optional[EphemeralLease], str]:
        """
        Request an ephemeral lease for a mission.
        
        Args:
            mission_id: Mission ID
            requested_capabilities: Requested capabilities by type
            duration_seconds: Lease duration
            constraints: Additional constraints
        
        Returns:
            (granted, lease, reason)
        """
        if not self._capability_broker:
            return False, None, "No capability broker configured"
        
        # Request capabilities through broker
        all_approved = True
        approved_capabilities = {
            "read": [],
            "write": [],
            "execute": [],
            "network": []
        }
        
        for cap_type, capabilities in requested_capabilities.items():
            for cap in capabilities:
                response = await self._capability_broker.request_capability(
                    mission_id=mission_id,
                    requester=self.hermes_id,
                    capability_name=cap,
                    resource_path=None,
                    operation="use",
                    scope="minimal",
                    justification=f"Required for mission {mission_id}",
                    estimated_duration_seconds=duration_seconds,
                    risk_level="medium"
                )
                
                if response.decision == BrokerDecision.APPROVED:
                    approved_capabilities[cap_type].append(cap)
                else:
                    all_approved = False
        
        if not all_approved:
            return False, None, "Not all capabilities approved"
        
        # Create ephemeral lease
        lease = EphemeralLease(
            lease_id=str(uuid.uuid4()),
            mission_id=mission_id,
            hermes_id=self.hermes_id,
            granted_at=datetime.now(timezone.utc).isoformat(),
            expires_at=(datetime.now(timezone.utc) + timedelta(seconds=duration_seconds)).isoformat(),
            status=LeaseStatus.ACTIVE,
            read_capabilities=approved_capabilities.get("read", []),
            write_capabilities=approved_capabilities.get("write", []),
            execute_capabilities=approved_capabilities.get("execute", []),
            network_capabilities=approved_capabilities.get("network", []),
            artifacts_readable=[],
            artifacts_writable=[],
            artifacts_creatable=[],
            memory_readable=[],
            memory_writable=[],
            max_execution_time_seconds=duration_seconds,
            max_token_budget=constraints.get("max_tokens", 100000) if constraints else 100000,
            max_memory_mb=constraints.get("max_memory_mb", 512) if constraints else 512,
            granted_by="capability_broker",
            revocation_reason=None,
            metadata=constraints or {}
        )
        
        self._active_lease = lease
        self._lease_history.append(lease)
        
        return True, lease, "Lease granted"
    
    async def revoke_lease(self, reason: str) -> bool:
        """
        Revoke the active lease.
        
        Args:
            reason: Reason for revocation
        
        Returns:
            True if revoked
        """
        if not self._active_lease:
            return False
        
        self._active_lease.status = LeaseStatus.REVOKED
        self._active_lease.revocation_reason = reason
        
        # Revoke capabilities through broker
        if self._capability_broker:
            for cap in self._active_lease.read_capabilities:
                await self._capability_broker.revoke_lease(
                    lease_id=f"lease_{cap}",
                    reason=reason
                )
        
        self._active_lease = None
        return True
    
    def get_active_lease(self) -> Optional[EphemeralLease]:
        """Get the active lease."""
        return self._active_lease
    
    def get_lease_history(self) -> List[EphemeralLease]:
        """Get lease history."""
        return self._lease_history.copy()
    
    def check_permission(self, action: str, resource: str) -> bool:
        """
        Check if Hermes has permission for an action.
        
        Args:
            action: Action type (read, write, execute, network)
            resource: Resource identifier
        
        Returns:
            True if permitted
        """
        if not self._active_lease or not self._active_lease.is_valid():
            return False
        
        if action == "read":
            return self._active_lease.can_read(resource)
        elif action == "write":
            return self._active_lease.can_write(resource)
        elif action == "execute":
            return self._active_lease.can_execute_skill(resource)
        elif action == "network":
            return self._active_lease.can_access_network(resource)
        
        return False
    
    def get_permissions_summary(self) -> Dict[str, Any]:
        """Get summary of current permissions."""
        if not self._active_lease:
            return {
                "has_lease": False,
                "permissions": {}
            }
        
        return {
            "has_lease": True,
            "lease_id": self._active_lease.lease_id,
            "mission_id": self._active_lease.mission_id,
            "expires_at": self._active_lease.expires_at,
            "time_remaining_seconds": self._active_lease.time_remaining_seconds(),
            "permissions": {
                "read_paths": len(self._active_lease.read_capabilities),
                "write_paths": len(self._active_lease.write_capabilities),
                "executable_skills": len(self._active_lease.execute_capabilities),
                "network_endpoints": len(self._active_lease.network_capabilities),
                "readable_artifacts": len(self._active_lease.artifacts_readable),
                "writable_artifacts": len(self._active_lease.artifacts_writable),
                "creatable_artifacts": len(self._active_lease.artifacts_creatable)
            },
            "constraints": {
                "max_execution_time_seconds": self._active_lease.max_execution_time_seconds,
                "max_token_budget": self._active_lease.max_token_budget,
                "max_memory_mb": self._active_lease.max_memory_mb
            }
        }


class LeaseManager:
    """
    Manager for Hermes leases.
    
    Tracks all leases and enforces expiration.
    """
    
    def __init__(self):
        self._leases: Dict[str, EphemeralLease] = {}
        self._hermes_instances: Dict[str, ConstitutionalCitizen] = {}
    
    def register_hermes(self, hermes: ConstitutionalCitizen) -> None:
        """Register a Hermes instance."""
        self._hermes_instances[hermes.hermes_id] = hermes
    
    def register_lease(self, lease: EphemeralLease) -> None:
        """Register a lease."""
        self._leases[lease.lease_id] = lease
    
    def revoke_lease(self, lease_id: str, reason: str) -> bool:
        """Revoke a lease."""
        lease = self._leases.get(lease_id)
        if not lease:
            return False
        
        lease.status = LeaseStatus.REVOKED
        lease.revocation_reason = reason
        
        # Notify Hermes instance
        hermes = self._hermes_instances.get(lease.hermes_id)
        if hermes and hermes._active_lease and hermes._active_lease.lease_id == lease_id:
            hermes._active_lease = None
        
        return True
    
    def cleanup_expired_leases(self) -> int:
        """Clean up expired leases. Returns count cleaned up."""
        count = 0
        now = datetime.now(timezone.utc)
        
        for lease_id, lease in list(self._leases.items()):
            if lease.status == LeaseStatus.ACTIVE:
                expires = datetime.fromisoformat(lease.expires_at)
                if now > expires:
                    lease.status = LeaseStatus.EXPIRED
                    count += 1
                    
                    # Notify Hermes instance
                    hermes = self._hermes_instances.get(lease.hermes_id)
                    if hermes and hermes._active_lease and hermes._active_lease.lease_id == lease_id:
                        hermes._active_lease = None
        
        return count
    
    def get_active_leases(self) -> List[EphemeralLease]:
        """Get all active leases."""
        return [lease for lease in self._leases.values() if lease.status == LeaseStatus.ACTIVE]
    
    def get_leases_by_mission(self, mission_id: str) -> List[EphemeralLease]:
        """Get all leases for a mission."""
        return [lease for lease in self._leases.values() if lease.mission_id == mission_id]
    
    def get_leases_by_hermes(self, hermes_id: str) -> List[EphemeralLease]:
        """Get all leases for a Hermes instance."""
        return [lease for lease in self._leases.values() if lease.hermes_id == hermes_id]


# Singleton instances
_hermes_citizen = ConstitutionalCitizen()
_lease_manager = LeaseManager()
_lease_manager.register_hermes(_hermes_citizen)


def get_hermes_citizen() -> ConstitutionalCitizen:
    """Get the singleton Hermes citizen."""
    return _hermes_citizen


def get_lease_manager() -> LeaseManager:
    """Get the singleton lease manager."""
    return _lease_manager
