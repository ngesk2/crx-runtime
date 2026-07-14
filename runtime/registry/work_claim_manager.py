"""
Work Claim Manager - Prevents duplicate work across agents.

Before work begins:
    Can I claim?
    YES → Lock → Work → Release

If claimed:
    STOP - No editing, no duplicate work.

Now uses heartbeat-based leases for:
- Crash recovery
- Stale detection
- Distributed execution support
"""

import json
import asyncio
import socket
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, Dict, List
from dataclasses import dataclass
import uuid


@dataclass
class WorkClaim:
    """A work claim on a subsystem with heartbeat support."""
    claim_id: str
    subsystem: str
    owner: str
    hostname: str
    pid: int
    started_at: datetime
    heartbeat: datetime
    expires: datetime
    priority: int
    status: str  # ACTIVE, RELEASED, EXPIRED, STALE
    agent_version: str
    runtime_version: str
    constitution_version: str
    sandbox_id: str


class WorkClaimManager:
    """
    Manages work claims to prevent duplicate work across agents.
    
    Enforces:
    - Single owner per subsystem
    - Heartbeat-based liveness detection
    - Crash recovery via stale detection
    - Claim verification before work
    - Priority-based claiming
    """
    
    def __init__(self, claims_file: str = "runtime/registry/work_claims.json"):
        self.claims_file = Path(claims_file)
        self._lock = asyncio.Lock()
        self._claims: Dict[str, WorkClaim] = {}
        self._hostname = socket.gethostname()
        self._pid = os.getpid()
        self._agent_version = "1.0.0"
        self._runtime_version = "1.0.0"
        self._constitution_version = "1.0.0"
        self._sandbox_id = os.environ.get("SANDBOX_ID", "default")
    
    async def load_claims(self) -> None:
        """Load claims from file."""
        async with self._lock:
            if not self.claims_file.exists():
                self._claims = {}
                return
            
            with open(self.claims_file, 'r') as f:
                data = json.load(f)
            
            self._claims = {}
            for subsystem, claim_data in data.items():
                self._claims[subsystem] = WorkClaim(
                    claim_id=claim_data["claim_id"],
                    subsystem=subsystem,
                    owner=claim_data["owner"],
                    hostname=claim_data["hostname"],
                    pid=claim_data["pid"],
                    started_at=datetime.fromisoformat(claim_data["started_at"]),
                    heartbeat=datetime.fromisoformat(claim_data["heartbeat"]),
                    expires=datetime.fromisoformat(claim_data["expires"]),
                    priority=claim_data["priority"],
                    status=claim_data["status"],
                    agent_version=claim_data.get("agent_version", "1.0.0"),
                    runtime_version=claim_data.get("runtime_version", "1.0.0"),
                    constitution_version=claim_data.get("constitution_version", "1.0.0"),
                    sandbox_id=claim_data.get("sandbox_id", "default")
                )
    
    async def save_claims(self) -> None:
        """Save claims to file."""
        async with self._lock:
            data = {}
            for subsystem, claim in self._claims.items():
                data[subsystem] = {
                    "claim_id": claim.claim_id,
                    "owner": claim.owner,
                    "hostname": claim.hostname,
                    "pid": claim.pid,
                    "started_at": claim.started_at.isoformat(),
                    "heartbeat": claim.heartbeat.isoformat(),
                    "expires": claim.expires.isoformat(),
                    "priority": claim.priority,
                    "status": claim.status,
                    "agent_version": claim.agent_version,
                    "runtime_version": claim.runtime_version,
                    "constitution_version": claim.constitution_version,
                    "sandbox_id": claim.sandbox_id
                }
            
            self.claims_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.claims_file, 'w') as f:
                json.dump(data, f, indent=2)
    
    async def _is_claim_alive(self, claim: WorkClaim) -> bool:
        """Check if a claim is alive based on heartbeat."""
        now = datetime.now(timezone.utc)
        
        # Check expiration
        if claim.expires < now:
            return False
        
        # Check heartbeat (stale if no heartbeat for 2x TTL)
        heartbeat_age = (now - claim.heartbeat).total_seconds()
        ttl = (claim.expires - claim.started_at).total_seconds()
        
        if heartbeat_age > ttl * 2:
            return False
        
        return True
    
    async def can_claim(self, subsystem: str, agent: str) -> bool:
        """
        Check if agent can claim a subsystem.
        
        Returns True if:
        - Subsystem is unclaimed, OR
        - Subsystem is claimed by same agent, OR
        - Existing claim has expired, OR
        - Existing claim is stale (no heartbeat)
        """
        await self.load_claims()
        
        async with self._lock:
            claim = self._claims.get(subsystem)
            
            # Unclaimed
            if claim is None:
                return True
            
            # Check if claim is alive
            if not await self._is_claim_alive(claim):
                return True
            
            # Owned by same agent
            if claim.owner == agent:
                return True
            
            # Owned by different agent and alive
            return False
    
    async def claim(self, subsystem: str, agent: str, ttl_minutes: int = 60, priority: int = 0) -> bool:
        """
        Claim a subsystem for an agent.
        
        Args:
            subsystem: Subsystem to claim
            agent: Agent name
            ttl_minutes: Time to live in minutes
            priority: Claim priority (higher = more important)
        
        Returns:
            True if claim succeeded, False if already claimed
        """
        await self.load_claims()
        
        async with self._lock:
            claim = self._claims.get(subsystem)
            
            # Check if can claim
            if claim is not None:
                # Check if alive
                if await self._is_claim_alive(claim):
                    # Owned by same agent - renew
                    if claim.owner == agent:
                        claim.heartbeat = datetime.now(timezone.utc)
                        claim.expires = datetime.now(timezone.utc) + timedelta(minutes=ttl_minutes)
                        await self.save_claims()
                        return True
                    # Owned by different agent - check priority
                    elif priority > claim.priority:
                        # Preempt with higher priority
                        pass
                    else:
                        # Cannot claim
                        return False
            
            # Create new claim
            now = datetime.now(timezone.utc)
            self._claims[subsystem] = WorkClaim(
                claim_id=str(uuid.uuid4()),
                subsystem=subsystem,
                owner=agent,
                hostname=self._hostname,
                pid=self._pid,
                started_at=now,
                heartbeat=now,
                expires=now + timedelta(minutes=ttl_minutes),
                priority=priority,
                status="ACTIVE",
                agent_version=self._agent_version,
                runtime_version=self._runtime_version,
                constitution_version=self._constitution_version,
                sandbox_id=self._sandbox_id
            )
            
            await self.save_claims()
            return True
    
    async def heartbeat(self, subsystem: str, agent: str) -> bool:
        """
        Send heartbeat for a claim.
        
        Returns True if heartbeat succeeded, False if claim not owned by agent.
        """
        await self.load_claims()
        
        async with self._lock:
            claim = self._claims.get(subsystem)
            
            if claim is None:
                return False
            
            if claim.owner != agent:
                return False
            
            claim.heartbeat = datetime.now(timezone.utc)
            await self.save_claims()
            return True
    
    async def release(self, subsystem: str, agent: str) -> bool:
        """
        Release a claim.
        
        Returns True if release succeeded, False if not owned by agent.
        """
        await self.load_claims()
        
        async with self._lock:
            claim = self._claims.get(subsystem)
            
            if claim is None:
                return False
            
            if claim.owner != agent:
                return False
            
            claim.status = "RELEASED"
            del self._claims[subsystem]
            await self.save_claims()
            return True
    
    async def get_owner(self, subsystem: str) -> Optional[str]:
        """Get current owner of a subsystem."""
        await self.load_claims()
        
        async with self._lock:
            claim = self._claims.get(subsystem)
            
            if claim is None:
                return None
            
            if not await self._is_claim_alive(claim):
                return None
            
            return claim.owner
    
    async def list_claims(self, agent: Optional[str] = None) -> List[WorkClaim]:
        """List all claims, optionally filtered by agent."""
        await self.load_claims()
        
        async with self._lock:
            claims = []
            
            for claim in self._claims.values():
                if not await self._is_claim_alive(claim):
                    continue  # Skip dead claims
                
                if agent is None or claim.owner == agent:
                    claims.append(claim)
            
            return claims
    
    async def cleanup_expired(self) -> int:
        """Remove expired and stale claims. Returns count removed."""
        await self.load_claims()
        
        async with self._lock:
            dead = []
            
            for subsystem, claim in self._claims.items():
                if not await self._is_claim_alive(claim):
                    dead.append(subsystem)
            
            for subsystem in dead:
                del self._claims[subsystem]
            
            if dead:
                await self.save_claims()
            
            return len(dead)


from datetime import timedelta
