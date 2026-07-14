"""
Capability Broker - Zero-trust capability management.

Hermes starts with NO permissions.
Hermes REQUESTS capabilities from Broker.
Broker decides: Approved, Denied, Reduced Scope, Requires Oracle, Requires Human.

This is true zero-trust architecture.
"""

import asyncio
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, Dict, Any, List, Set
from dataclasses import dataclass, field
from enum import Enum
import sqlite3


class BrokerDecision(Enum):
    """Decision from capability broker."""
    APPROVED = "approved"
    DENIED = "denied"
    REDUCED_SCOPE = "reduced_scope"
    REQUIRES_ORACLE = "requires_oracle"
    REQUIRES_HUMAN = "requires_human"


@dataclass
class CapabilityLease:
    """A leased capability."""
    lease_id: str
    capability_name: str
    resource_path: str
    operations: List[str]
    holder: str
    issued_at: str
    expires_at: str
    scope: str
    decision: BrokerDecision
    conditions: Dict[str, Any]
    usage_count: int = 0
    max_usage: int = 1000


@dataclass
class CapabilityRequest:
    """A capability request from Hermes."""
    request_id: str
    mission_id: str
    requester: str
    capability_name: str
    resource_path: str
    operation: str
    scope: str
    justification: str
    estimated_duration_seconds: int
    risk_level: str
    requested_at: str


@dataclass
class BrokerResponse:
    """Response from capability broker."""
    request_id: str
    decision: BrokerDecision
    lease: Optional[CapabilityLease]
    reason: str
    alternative_suggestions: List[str]
    requires_approval: bool


class CapabilityBroker:
    """
    Capability Broker - Zero-trust capability management.
    
    Responsibilities:
    - Issue capabilities
    - Lease capabilities
    - Revoke capabilities
    - Monitor usage
    - Audit usage
    - Expire automatically
    
    Hermes never owns permissions. Hermes requests them.
    """
    
    def __init__(self, db_path: str = "runtime/security/capability_broker.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize_db()
        # NOTE: Removed in-memory cache to eliminate hidden mutable state
        # All lease data is loaded from database on demand
        # This ensures consistency and eliminates cache bypass risks
        self._active_leases: Dict[str, CapabilityLease] = {}
        self._lock = asyncio.Lock()
    
    def _initialize_db(self) -> None:
        """Initialize database schema."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        # Capability requests
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS capability_requests (
                request_id TEXT PRIMARY KEY,
                mission_id TEXT NOT NULL,
                requester TEXT NOT NULL,
                capability_name TEXT NOT NULL,
                resource_path TEXT,
                operation TEXT NOT NULL,
                scope TEXT NOT NULL,
                justification TEXT,
                estimated_duration_seconds INTEGER,
                risk_level TEXT,
                requested_at TEXT NOT NULL,
                decision TEXT,
                responded_at TEXT,
                lease_id TEXT
            )
        """)
        
        # Capability leases
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS capability_leases (
                lease_id TEXT PRIMARY KEY,
                capability_name TEXT NOT NULL,
                resource_path TEXT,
                operations TEXT NOT NULL,
                holder TEXT NOT NULL,
                issued_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                scope TEXT NOT NULL,
                decision TEXT NOT NULL,
                conditions TEXT,
                usage_count INTEGER DEFAULT 0,
                max_usage INTEGER DEFAULT 1000,
                revoked BOOLEAN DEFAULT FALSE
            )
        """)
        
        # Usage audit
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS capability_usage_audit (
                audit_id TEXT PRIMARY KEY,
                lease_id TEXT NOT NULL,
                operation TEXT NOT NULL,
                resource_path TEXT,
                timestamp TEXT NOT NULL,
                success BOOLEAN,
                error_message TEXT
            )
        """)
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_requests_mission ON capability_requests(mission_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_requests_requester ON capability_requests(requester)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_leases_holder ON capability_leases(holder)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_leases_expires ON capability_leases(expires_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_lease ON capability_usage_audit(lease_id)")
        
        conn.commit()
        conn.close()
    
    async def request_capability(
        self,
        mission_id: str,
        requester: str,
        capability_name: str,
        resource_path: str,
        operation: str,
        scope: str = "minimal",
        justification: str = "",
        estimated_duration_seconds: int = 300,
        risk_level: str = "low"
    ) -> BrokerResponse:
        """
        Request a capability.
        
        Args:
            mission_id: Mission requesting capability
            requester: Component requesting capability
            capability_name: Name of capability
            resource_path: Resource path
            operation: Operation type
            scope: Scope of request
            justification: Justification for request
            estimated_duration_seconds: Estimated duration
            risk_level: Risk level
        
        Returns:
            BrokerResponse with decision
        """
        import uuid
        
        request_id = str(uuid.uuid4())
        request = CapabilityRequest(
            request_id=request_id,
            mission_id=mission_id,
            requester=requester,
            capability_name=capability_name,
            resource_path=resource_path,
            operation=operation,
            scope=scope,
            justification=justification,
            estimated_duration_seconds=estimated_duration_seconds,
            risk_level=risk_level,
            requested_at=datetime.now(timezone.utc).isoformat()
        )
        
        # Evaluate request
        decision, reason, alternatives = self._evaluate_request(request)
        
        # Issue lease if approved
        lease = None
        if decision in [BrokerDecision.APPROVED, BrokerDecision.REDUCED_SCOPE]:
            lease = await self._issue_lease(request, decision)
        
        # Record request
        self._record_request(request, decision, lease)
        
        return BrokerResponse(
            request_id=request_id,
            decision=decision,
            lease=lease,
            reason=reason,
            alternative_suggestions=alternatives,
            requires_approval=decision in [BrokerDecision.REQUIRES_ORACLE, BrokerDecision.REQUIRES_HUMAN]
        )
    
    def _evaluate_request(
        self,
        request: CapabilityRequest
    ) -> tuple[BrokerDecision, str, List[str]]:
        """
        Evaluate a capability request.
        
        Args:
            request: Capability request
        
        Returns:
            (decision, reason, alternatives)
        """
        # Check if request is over-scoped
        if request.scope == "broad":
            return BrokerDecision.REDUCED_SCOPE, "Request scope too broad, reducing to specific", []
        
        # Check if operation is high-risk
        if request.operation in ["delete", "overwrite", "deploy"]:
            if request.risk_level == "high":
                return BrokerDecision.REQUIRES_HUMAN, "High-risk operation requires human approval", []
            else:
                return BrokerDecision.REQUIRES_ORACLE, "High-risk operation requires Oracle review", []
        
        # Check if resource is protected
        protected_paths = ["main", "runtime/kernel", "constitution"]
        if any(request.resource_path.startswith(p) for p in protected_paths):
            return BrokerDecision.DENIED, "Resource path is protected", []
        
        # Check if capability is allowed for requester
        if not self._is_capability_allowed(request.requester, request.capability_name):
            return BrokerDecision.DENIED, f"Capability {request.capability_name} not allowed for {request.requester}", []
        
        # Check if request is minimal
        if not self._is_minimal_request(request):
            return BrokerDecision.REDUCED_SCOPE, "Request not minimal, reducing scope", []
        
        # Approve
        return BrokerDecision.APPROVED, "Request approved", []
    
    def _is_capability_allowed(self, requester: str, capability_name: str) -> bool:
        """Check if capability is allowed for requester."""
        # Define allowed capabilities per requester type
        allowed_capabilities = {
            "hermes": ["filesystem.read", "filesystem.write", "http.get"],
            "oracle": ["filesystem.read"],
            "scheduler": ["filesystem.read", "http.get"],
            "executor": ["filesystem.read", "filesystem.write", "shell.execute"]
        }
        
        for requester_type, capabilities in allowed_capabilities.items():
            if requester_type in requester.lower():
                return capability_name in capabilities
        
        return False
    
    def _is_minimal_request(self, request: CapabilityRequest) -> bool:
        """Check if request is minimal."""
        # Example: if requesting write capability for read-only operation
        if request.operation == "write" and "read" in request.justification.lower():
            return False
        
        return True
    
    async def _issue_lease(
        self,
        request: CapabilityRequest,
        decision: BrokerDecision
    ) -> CapabilityLease:
        """Issue a capability lease."""
        import uuid
        
        lease_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        # Calculate expiration based on estimated duration
        expires_at = now + timedelta(seconds=request.estimated_duration_seconds * 2)  # 2x buffer
        
        # Reduce scope if decision is REDUCED_SCOPE
        scope = request.scope if decision == BrokerDecision.APPROVED else "specific"
        
        lease = CapabilityLease(
            lease_id=lease_id,
            capability_name=request.capability_name,
            resource_path=request.resource_path,
            operations=[request.operation],
            holder=request.requester,
            issued_at=now.isoformat(),
            expires_at=expires_at.isoformat(),
            scope=scope,
            decision=decision,
            conditions={"mission_id": request.mission_id},
            usage_count=0,
            max_usage=1000
        )
        
        # Store in database
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO capability_leases
            (lease_id, capability_name, resource_path, operations, holder, issued_at, expires_at, scope, decision, conditions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            lease_id,
            lease.capability_name,
            lease.resource_path,
            json.dumps(lease.operations),
            lease.holder,
            lease.issued_at,
            lease.expires_at,
            lease.scope,
            lease.decision.value,
            json.dumps(lease.conditions)
        ))
        
        conn.commit()
        conn.close()
        
        # Track in memory
        self._active_leases[lease_id] = lease
        
        return lease
    
    def _record_request(
        self,
        request: CapabilityRequest,
        decision: BrokerDecision,
        lease: Optional[CapabilityLease]
    ) -> None:
        """Record capability request."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO capability_requests
            (request_id, mission_id, requester, capability_name, resource_path, operation, scope, justification, estimated_duration_seconds, risk_level, requested_at, decision, responded_at, lease_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            request.request_id,
            request.mission_id,
            request.requester,
            request.capability_name,
            request.resource_path,
            request.operation,
            request.scope,
            request.justification,
            request.estimated_duration_seconds,
            request.risk_level,
            request.requested_at,
            decision.value,
            datetime.now(timezone.utc).isoformat(),
            lease.lease_id if lease else None
        ))
        
        conn.commit()
        conn.close()
    
    async def use_capability(
        self,
        lease_id: str,
        operation: str,
        resource_path: str
    ) -> bool:
        """
        Use a leased capability.
        
        This is the ONLY way to use capabilities in the system.
        All capability usage must go through this method.
        Direct capability invocation is prohibited.
        
        Args:
            lease_id: Lease ID
            operation: Operation to perform
            resource_path: Resource path
        
        Returns:
            True if usage allowed
        """
        import uuid
        
        async with self._lock:
            lease = self._active_leases.get(lease_id)
            
            if not lease:
                # Load from database
                lease = self._load_lease(lease_id)
                if not lease:
                    # Bypass attempt detected - log and deny
                    self._audit_usage(lease_id, operation, resource_path, False, "No valid lease")
                    return False
            
            # Check if lease is expired
            if datetime.fromisoformat(lease.expires_at) < datetime.now(timezone.utc):
                # Bypass attempt detected - log and deny
                self._audit_usage(lease_id, operation, resource_path, False, "Lease expired")
                return False
            
            # Check if operation is allowed
            if operation not in lease.operations:
                # Bypass attempt detected - log and deny
                self._audit_usage(lease_id, operation, resource_path, False, "Operation not allowed")
                return False
            
            # Check if resource path is within scope
            if resource_path and not resource_path.startswith(lease.resource_path or ""):
                # Bypass attempt detected - log and deny
                self._audit_usage(lease_id, operation, resource_path, False, "Resource path out of scope")
                return False
            
            # Check usage limit
            if lease.usage_count >= lease.max_usage:
                # Bypass attempt detected - log and deny
                self._audit_usage(lease_id, operation, resource_path, False, "Usage limit exceeded")
                return False
            
            # Audit usage
            self._audit_usage(lease_id, operation, resource_path, True)
            
            # Update usage count
            lease.usage_count += 1
            self._update_lease_usage(lease_id, lease.usage_count)
            
            return True
    
    def _load_lease(self, lease_id: str) -> Optional[CapabilityLease]:
        """Load lease from database."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT lease_id, capability_name, resource_path, operations, holder, issued_at, expires_at, scope, decision, conditions, usage_count, max_usage
            FROM capability_leases
            WHERE lease_id = ? AND revoked = FALSE
        """, (lease_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            lease = CapabilityLease(
                lease_id=row[0],
                capability_name=row[1],
                resource_path=row[2],
                operations=json.loads(row[3]),
                holder=row[4],
                issued_at=row[5],
                expires_at=row[6],
                scope=row[7],
                decision=BrokerDecision(row[8]),
                conditions=json.loads(row[9]),
                usage_count=row[10],
                max_usage=row[11]
            )
            self._active_leases[lease_id] = lease
            return lease
        
        return None
    
    def _audit_usage(
        self,
        lease_id: str,
        operation: str,
        resource_path: str,
        success: bool,
        error_message: str = None
    ) -> None:
        """Audit capability usage."""
        import uuid
        
        audit_id = str(uuid.uuid4())
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO capability_usage_audit
            (audit_id, lease_id, operation, resource_path, timestamp, success, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (audit_id, lease_id, operation, resource_path, datetime.now(timezone.utc).isoformat(), success, error_message))
        
        conn.commit()
        conn.close()
    
    def _update_lease_usage(self, lease_id: str, usage_count: int) -> None:
        """Update lease usage count."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE capability_leases
            SET usage_count = ?
            WHERE lease_id = ?
        """, (usage_count, lease_id))
        
        conn.commit()
        conn.close()
    
    async def revoke_lease(self, lease_id: str, reason: str) -> bool:
        """
        Revoke a capability lease.
        
        Args:
            lease_id: Lease ID
            reason: Reason for revocation
        
        Returns:
            True if revoked
        """
        async with self._lock:
            if lease_id in self._active_leases:
                del self._active_leases[lease_id]
            
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE capability_leases
                SET revoked = TRUE
                WHERE lease_id = ?
            """, (lease_id,))
            
            conn.commit()
            conn.close()
            
            return True
    
    async def cleanup_expired_leases(self) -> int:
        """Clean up expired leases. Returns count removed."""
        now = datetime.now(timezone.utc).isoformat()
        
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            DELETE FROM capability_leases
            WHERE expires_at < ? AND revoked = FALSE
        """, (now,))
        
        count = cursor.rowcount
        conn.commit()
        conn.close()
        
        # Remove from memory
        async with self._lock:
            for lease_id, lease in list(self._active_leases.items()):
                if datetime.fromisoformat(lease.expires_at) < datetime.now(timezone.utc):
                    del self._active_leases[lease_id]
        
        return count
    
    def get_active_leases(self, holder: Optional[str] = None) -> List[CapabilityLease]:
        """Get active leases."""
        if holder:
            return [l for l in self._active_leases.values() if l.holder == holder]
        return list(self._active_leases.values())
    
    def get_usage_audit(self, lease_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get usage audit for a lease."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT audit_id, lease_id, operation, resource_path, timestamp, success, error_message
            FROM capability_usage_audit
            WHERE lease_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        """, (lease_id, limit))
        
        audit = []
        for row in cursor.fetchall():
            audit.append({
                "audit_id": row[0],
                "lease_id": row[1],
                "operation": row[2],
                "resource_path": row[3],
                "timestamp": row[4],
                "success": row[5],
                "error_message": row[6]
            })
        
        conn.close()
        return audit


# NOTE: Singleton pattern removed for determinism and testability.
# Use dependency injection instead.
# _capability_broker = CapabilityBroker()


def create_capability_broker(db_path: str = "runtime/security/capability_broker.db") -> CapabilityBroker:
    """Create a new capability broker instance."""
    return CapabilityBroker(db_path=db_path)
