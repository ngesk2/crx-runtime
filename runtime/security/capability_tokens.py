"""
Capability Tokens - Object-capability security.

Instead of Policy.can_write(...), subsystems receive capability tokens.

Example:
artifact_repo → receives WriteCapability
WriteCapability expires in 30 seconds
Write only inside /artifacts

Every subsystem gets only the capabilities it actually needs.
This dramatically limits the blast radius of compromised components.
"""

import json
import time
import hashlib
import hmac
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List, Set
from dataclasses import dataclass, asdict
from pathlib import Path
from enum import Enum


class Permission(Enum):
    """Permission types."""
    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    EXECUTE = "execute"
    NETWORK = "network"
    SCHEDULE = "schedule"


@dataclass
class CapabilityToken:
    """A capability token granting specific permissions."""
    token_id: str
    issuer: str
    holder: str
    permissions: List[str]
    resource_path: str
    expires_at: str
    issued_at: str
    constraints: Dict[str, Any]
    signature: Optional[str] = None
    
    def is_valid(self) -> bool:
        """Check if token is still valid."""
        expires = datetime.fromisoformat(self.expires_at)
        return datetime.now(timezone.utc) < expires
    
    def has_permission(self, permission: str) -> bool:
        """Check if token has specific permission."""
        return permission in self.permissions
    
    def can_access(self, path: str) -> bool:
        """Check if token can access specific path."""
        # Path must be within resource_path
        return path.startswith(self.resource_path)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert token to dictionary."""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'CapabilityToken':
        """Create token from dictionary."""
        return cls(**data)


class CapabilityIssuer:
    """
    Issues capability tokens.
    
    Tokens are signed and time-limited.
    """
    
    def __init__(self, secret_key: str, issuer_id: str = "runtime"):
        self.secret_key = secret_key
        self.issuer_id = issuer_id
    
    def issue_token(
        self,
        holder: str,
        permissions: List[str],
        resource_path: str,
        ttl_seconds: int = 300,
        constraints: Optional[Dict[str, Any]] = None
    ) -> CapabilityToken:
        """
        Issue a capability token.
        
        Args:
            holder: Token holder (subsystem/agent)
            permissions: List of permissions
            resource_path: Path this token can access
            ttl_seconds: Time to live in seconds
            constraints: Additional constraints
        
        Returns:
            CapabilityToken
        """
        import uuid
        
        now = datetime.now(timezone.utc)
        expires = now + timedelta(seconds=ttl_seconds)
        
        token = CapabilityToken(
            token_id=str(uuid.uuid4()),
            issuer=self.issuer_id,
            holder=holder,
            permissions=permissions,
            resource_path=resource_path,
            expires_at=expires.isoformat(),
            issued_at=now.isoformat(),
            constraints=constraints or {},
            signature=None
        )
        
        # Sign the token
        token.signature = self._sign_token(token)
        
        return token
    
    def _sign_token(self, token: CapabilityToken) -> str:
        """Sign token with HMAC."""
        # Create canonical representation
        data = f"{token.token_id}:{token.issuer}:{token.holder}:{','.join(token.permissions)}:{token.resource_path}:{token.expires_at}:{token.issued_at}"
        
        signature = hmac.new(
            self.secret_key.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return signature
    
    def verify_token(self, token: CapabilityToken) -> bool:
        """
        Verify token signature and validity.
        
        Args:
            token: Token to verify
        
        Returns:
            True if token is valid
        """
        # Check expiration
        if not token.is_valid():
            return False
        
        # Verify signature
        expected_signature = self._sign_token(token)
        return hmac.compare_digest(token.signature or "", expected_signature)
    
    def revoke_token(self, token_id: str) -> None:
        """Revoke a token (would use a revocation list in production)."""
        # In production, this would add to a revocation list
        pass


class CapabilityRegistry:
    """
    Registry for capability tokens.
    
    Tracks issued tokens and provides lookup.
    """
    
    def __init__(self, db_path: str = "runtime/security/capabilities.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize_db()
    
    def _initialize_db(self) -> None:
        """Initialize database schema."""
        import sqlite3
        
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS capability_tokens (
                token_id TEXT PRIMARY KEY,
                holder TEXT NOT NULL,
                permissions TEXT NOT NULL,
                resource_path TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                issued_at TEXT NOT NULL,
                constraints TEXT,
                signature TEXT NOT NULL,
                revoked BOOLEAN DEFAULT FALSE
            )
        """)
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_cap_holder ON capability_tokens(holder)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_cap_expires ON capability_tokens(expires_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_cap_revoked ON capability_tokens(revoked)")
        
        conn.commit()
        conn.close()
    
    def store_token(self, token: CapabilityToken) -> None:
        """Store token in registry."""
        import sqlite3
        
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO capability_tokens
            (token_id, holder, permissions, resource_path, expires_at, issued_at, constraints, signature)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            token.token_id,
            token.holder,
            json.dumps(token.permissions),
            token.resource_path,
            token.expires_at,
            token.issued_at,
            json.dumps(token.constraints),
            token.signature
        ))
        
        conn.commit()
        conn.close()
    
    def get_token(self, token_id: str) -> Optional[CapabilityToken]:
        """Get token by ID."""
        import sqlite3
        
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT token_id, holder, permissions, resource_path, expires_at, issued_at, constraints, signature
            FROM capability_tokens
            WHERE token_id = ? AND revoked = FALSE
        """, (token_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return CapabilityToken(
                token_id=row[0],
                issuer="runtime",
                holder=row[1],
                permissions=json.loads(row[2]),
                resource_path=row[3],
                expires_at=row[4],
                issued_at=row[5],
                constraints=json.loads(row[6]),
                signature=row[7]
            )
        return None
    
    def revoke_token(self, token_id: str) -> None:
        """Revoke token."""
        import sqlite3
        
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE capability_tokens
            SET revoked = TRUE
            WHERE token_id = ?
        """, (token_id,))
        
        conn.commit()
        conn.close()
    
    def cleanup_expired(self) -> int:
        """Remove expired tokens. Returns count removed."""
        import sqlite3
        
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            DELETE FROM capability_tokens
            WHERE expires_at < datetime('now')
        """)
        
        count = cursor.rowcount
        conn.commit()
        conn.close()
        
        return count
    
    def get_holder_tokens(self, holder: str) -> List[CapabilityToken]:
        """Get all tokens for a holder."""
        import sqlite3
        
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT token_id, holder, permissions, resource_path, expires_at, issued_at, constraints, signature
            FROM capability_tokens
            WHERE holder = ? AND revoked = FALSE AND expires_at > datetime('now')
        """, (holder,))
        
        tokens = []
        for row in cursor.fetchall():
            tokens.append(CapabilityToken(
                token_id=row[0],
                issuer="runtime",
                holder=row[1],
                permissions=json.loads(row[2]),
                resource_path=row[3],
                expires_at=row[4],
                issued_at=row[5],
                constraints=json.loads(row[6]),
                signature=row[7]
            ))
        
        conn.close()
        return tokens


class CapabilityGuard:
    """
    Guards operations using capability tokens.
    
    Subsystems must present valid tokens to perform operations.
    """
    
    def __init__(self, issuer: CapabilityIssuer, registry: CapabilityRegistry):
        self.issuer = issuer
        self.registry = registry
    
    def check_permission(
        self,
        token: CapabilityToken,
        permission: str,
        path: Optional[str] = None
    ) -> bool:
        """
        Check if token grants permission.
        
        Args:
            token: Capability token
            permission: Permission to check
            path: Path to check (optional)
        
        Returns:
            True if permission granted
        """
        # Verify token
        if not self.issuer.verify_token(token):
            return False
        
        # Check if revoked
        stored_token = self.registry.get_token(token.token_id)
        if stored_token is None:
            return False
        
        # Check permission
        if not token.has_permission(permission):
            return False
        
        # Check path if provided
        if path and not token.can_access(path):
            return False
        
        return True
    
    def require_permission(
        self,
        token: CapabilityToken,
        permission: str,
        path: Optional[str] = None
    ) -> None:
        """
        Require permission, raise exception if not granted.
        
        Args:
            token: Capability token
            permission: Permission to check
            path: Path to check (optional)
        
        Raises:
            PermissionError if permission not granted
        """
        if not self.check_permission(token, permission, path):
            raise PermissionError(
                f"Token {token.token_id} does not grant permission '{permission}'"
                f"{f' for path {path}' if path else ''}"
            )


class CapabilityFactory:
    """
    Factory for creating capability tokens for different subsystems.
    
    Defines what capabilities each subsystem needs.
    """
    
    def __init__(self, issuer: CapabilityIssuer, registry: CapabilityRegistry):
        self.issuer = issuer
        self.registry = registry
    
    def create_artifact_repo_token(self, holder: str = "artifact_repo") -> CapabilityToken:
        """Create token for artifact repository."""
        token = self.issuer.issue_token(
            holder=holder,
            permissions=["read", "write"],
            resource_path="/artifacts",
            ttl_seconds=3600,
            constraints={"max_size_mb": 100}
        )
        self.registry.store_token(token)
        return token
    
    def create_mission_store_token(self, holder: str = "mission_store") -> CapabilityToken:
        """Create token for mission store."""
        token = self.issuer.issue_token(
            holder=holder,
            permissions=["read", "write"],
            resource_path="/missions",
            ttl_seconds=3600,
            constraints={"max_missions": 10000}
        )
        self.registry.store_token(token)
        return token
    
    def create_event_bus_token(self, holder: str = "event_bus") -> CapabilityToken:
        """Create token for event bus."""
        token = self.issuer.issue_token(
            holder=holder,
            permissions=["read", "write"],
            resource_path="/events",
            ttl_seconds=3600,
            constraints={"max_events_per_minute": 1000}
        )
        self.registry.store_token(token)
        return token
    
    def create_lease_manager_token(self, holder: str = "lease_manager") -> CapabilityToken:
        """Create token for lease manager."""
        token = self.issuer.issue_token(
            holder=holder,
            permissions=["read", "write", "delete"],
            resource_path="/leases",
            ttl_seconds=3600,
            constraints={"max_leases": 1000}
        )
        self.registry.store_token(token)
        return token
    
    def create_oracle_token(self, holder: str = "oracle") -> CapabilityToken:
        """Create token for Oracle (read-only)."""
        token = self.issuer.issue_token(
            holder=holder,
            permissions=["read"],
            resource_path="/",
            ttl_seconds=1800,
            constraints={"read_only": True}
        )
        self.registry.store_token(token)
        return token
    
    def create_hermes_token(self, holder: str = "hermes") -> CapabilityToken:
        """Create token for Hermes agent."""
        token = self.issuer.issue_token(
            holder=holder,
            permissions=["read", "write", "execute"],
            resource_path="/sandbox/hermes",
            ttl_seconds=7200,
            constraints={"sandbox_isolated": True}
        )
        self.registry.store_token(token)
        return token


# Singleton instances
_secret_key = hashlib.sha256(b"constitutional-runtime-secret-key").hexdigest()
_issuer = CapabilityIssuer(secret_key=_secret_key)
_registry = CapabilityRegistry()
_guard = CapabilityGuard(_issuer, _registry)
_factory = CapabilityFactory(_issuer, _registry)


def get_capability_issuer() -> CapabilityIssuer:
    """Get the singleton capability issuer."""
    return _issuer


def get_capability_registry() -> CapabilityRegistry:
    """Get the singleton capability registry."""
    return _registry


def get_capability_guard() -> CapabilityGuard:
    """Get the singleton capability guard."""
    return _guard


def get_capability_factory() -> CapabilityFactory:
    """Get the singleton capability factory."""
    return _factory
