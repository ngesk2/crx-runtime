"""Scheduler

Mission scheduler for Hermes.

Architecture:
Pending
  ↓
Capability Match
  ↓
Lease
  ↓
Execution
  ↓
Heartbeat
  ↓
Evidence
  ↓
Reducer
  ↓
Done

Every mission is leased.
Every lease expires.
Everything is replayable.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from enum import Enum
from uuid import UUID

from missions.mission import Mission, MissionId, MissionState, MissionPriority, MissionCapability


class LeaseState(Enum):
    """States of a lease"""
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"
    COMPLETED = "completed"


@dataclass(frozen=True)
class Lease:
    """
    Lease for a mission.
    
    Every mission is leased. Every lease expires.
    
    Contains:
    - lease_id (unique identifier)
    - mission_id (mission being leased)
    - worker_id (worker holding the lease)
    - state (lease state)
    - expires_at (lease expiration time)
    - heartbeat_at (last heartbeat time)
    - created_at (lease creation time)
    """
    lease_id: UUID
    mission_id: MissionId
    worker_id: str
    state: LeaseState
    expires_at: datetime
    heartbeat_at: datetime
    created_at: datetime
    
    def is_expired(self) -> bool:
        """Check if lease is expired"""
        return datetime.utcnow() > self.expires_at
    
    def is_active(self) -> bool:
        """Check if lease is active"""
        return self.state == LeaseState.ACTIVE and not self.is_expired()
    
    def with_heartbeat(self) -> "Lease":
        """Update lease with new heartbeat"""
        return Lease(
            lease_id=self.lease_id,
            mission_id=self.mission_id,
            worker_id=self.worker_id,
            state=self.state,
            expires_at=self.expires_at,
            heartbeat_at=datetime.utcnow(),
            created_at=self.created_at,
        )
    
    def with_state(self, new_state: LeaseState) -> "Lease":
        """Update lease state"""
        return Lease(
            lease_id=self.lease_id,
            mission_id=self.mission_id,
            worker_id=self.worker_id,
            state=new_state,
            expires_at=self.expires_at,
            heartbeat_at=self.heartbeat_at,
            created_at=self.created_at,
        )


class Scheduler:
    """
    Mission scheduler for Hermes.
    
    Responsibilities:
    - Pending missions
    - Capability matching
    - Lease management
    - Execution tracking
    - Heartbeat monitoring
    - Evidence collection
    - Reduction
    - Completion
    
    Every mission is leased. Every lease expires. Everything is replayable.
    """
    
    def __init__(
        self,
        lease_duration: timedelta = timedelta(minutes=30),
        heartbeat_interval: timedelta = timedelta(minutes=5),
    ):
        self.lease_duration = lease_duration
        self.heartbeat_interval = heartbeat_interval
        
        self._missions: Dict[MissionId, Mission] = {}
        self._leases: Dict[UUID, Lease] = {}
        self._worker_capabilities: Dict[str, List[MissionCapability]] = {}
        
        self._mission_queue: List[MissionId] = []
    
    def register_worker(self, worker_id: str, capabilities: List[MissionCapability]) -> None:
        """
        Register a worker with capabilities.
        
        Args:
            worker_id: Worker identifier
            capabilities: List of capabilities the worker provides
        """
        self._worker_capabilities[worker_id] = capabilities
    
    def submit_mission(self, mission: Mission) -> None:
        """
        Submit a mission to the scheduler.
        
        Args:
            mission: Mission to submit
        """
        self._missions[mission.mission_id] = mission
        self._mission_queue.append(mission.mission_id)
    
    def claim_mission(self, worker_id: str) -> Optional[Mission]:
        """
        Claim a mission for execution.
        
        Args:
            worker_id: Worker claiming the mission
        
        Returns:
            Mission if available, None otherwise
        """
        # Get worker capabilities
        worker_caps = self._worker_capabilities.get(worker_id, [])
        if not worker_caps:
            return None
        
        # Find pending mission with matching capability
        for mission_id in self._mission_queue:
            mission = self._missions.get(mission_id)
            if not mission:
                continue
            
            if mission.state != MissionState.PENDING:
                continue
            
            if mission.capability not in worker_caps:
                continue
            
            if mission.is_expired():
                continue
            
            # Create lease
            lease = self._create_lease(mission.mission_id, worker_id)
            self._leases[lease.lease_id] = lease
            
            # Update mission state
            updated_mission = mission.with_state(MissionState.LEASED)
            self._missions[mission.mission_id] = updated_mission
            
            return updated_mission
        
        return None
    
    def _create_lease(self, mission_id: MissionId, worker_id: str) -> Lease:
        """Create a lease for a mission"""
        import uuid
        
        now = datetime.utcnow()
        return Lease(
            lease_id=uuid.uuid4(),
            mission_id=mission_id,
            worker_id=worker_id,
            state=LeaseState.ACTIVE,
            expires_at=now + self.lease_duration,
            heartbeat_at=now,
            created_at=now,
        )
    
    def heartbeat(self, lease_id: UUID) -> bool:
        """
        Send heartbeat for a lease.
        
        Args:
            lease_id: Lease identifier
        
        Returns:
            True if heartbeat accepted, False otherwise
        """
        lease = self._leases.get(lease_id)
        if not lease:
            return False
        
        if not lease.is_active():
            return False
        
        # Update heartbeat
        updated_lease = lease.with_heartbeat()
        self._leases[lease_id] = updated_lease
        
        # Update mission state to heartbeating
        mission = self._missions.get(lease.mission_id)
        if mission:
            updated_mission = mission.with_state(MissionState.HEARTBEATING)
            self._missions[lease.mission_id] = updated_mission
        
        return True
    
    def complete_mission(self, lease_id: UUID, outputs: Dict[str, Any]) -> bool:
        """
        Complete a mission.
        
        Args:
            lease_id: Lease identifier
            outputs: Mission outputs
        
        Returns:
            True if completion accepted, False otherwise
        """
        lease = self._leases.get(lease_id)
        if not lease:
            return False
        
        if not lease.is_active():
            return False
        
        # Update lease state
        updated_lease = lease.with_state(LeaseState.COMPLETED)
        self._leases[lease_id] = updated_lease
        
        # Update mission state
        from missions.mission import MissionOutputs
        
        mission = self._missions.get(lease.mission_id)
        if mission:
            updated_mission = mission.with_outputs(
                MissionOutputs(data=outputs)
            ).with_state(MissionState.DONE)
            self._missions[lease.mission_id] = updated_mission
        
        return True
    
    def fail_mission(self, lease_id: UUID, reason: str) -> bool:
        """
        Fail a mission.
        
        Args:
            lease_id: Lease identifier
            reason: Failure reason
        
        Returns:
            True if failure accepted, False otherwise
        """
        lease = self._leases.get(lease_id)
        if not lease:
            return False
        
        # Update lease state
        updated_lease = lease.with_state(LeaseState.REVOKED)
        self._leases[lease_id] = updated_lease
        
        # Update mission state
        mission = self._missions.get(lease.mission_id)
        if mission:
            updated_mission = mission.with_state(MissionState.FAILED)
            self._missions[lease.mission_id] = updated_mission
        
        return True
    
    def expire_leases(self) -> int:
        """
        Expire overdue leases.
        
        Returns:
            Number of leases expired
        """
        expired_count = 0
        
        for lease_id, lease in list(self._leases.items()):
            if lease.is_expired() and lease.state == LeaseState.ACTIVE:
                # Update lease state
                updated_lease = lease.with_state(LeaseState.EXPIRED)
                self._leases[lease_id] = updated_lease
                
                # Update mission state
                mission = self._missions.get(lease.mission_id)
                if mission:
                    updated_mission = mission.with_state(MissionState.EXPIRED)
                    self._missions[lease.mission_id] = updated_mission
                
                expired_count += 1
        
        return expired_count
    
    def get_mission(self, mission_id: MissionId) -> Optional[Mission]:
        """Get mission by ID"""
        return self._missions.get(mission_id)
    
    def get_lease(self, lease_id: UUID) -> Optional[Lease]:
        """Get lease by ID"""
        return self._leases.get(lease_id)
    
    def get_pending_missions(self) -> List[Mission]:
        """Get all pending missions"""
        return [
            mission
            for mission in self._missions.values()
            if mission.state == MissionState.PENDING
        ]
    
    def get_active_leases(self) -> List[Lease]:
        """Get all active leases"""
        return [
            lease
            for lease in self._leases.values()
            if lease.is_active()
        ]
