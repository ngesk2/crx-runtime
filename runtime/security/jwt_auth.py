"""
JWT Identity Layer

Constitutional: JWT-based identity authentication and authorization.
Provides identity tokens with embedded capabilities.

Architecture:
Client
    ↓
JWT Validation
    ↓
Identity Extraction
    ↓
Capability Resolution
    ↓
Policy Engine

JWT Payload:
{
  "sub": "agent_001",
  "roles": ["projection_worker"],
  "capabilities": ["EVENT_WRITE", "SEARCH_AGENT"],
  "exp": 9999999999
}
"""

import jwt
import datetime
from typing import Dict, List, Optional, Set
from dataclasses import dataclass
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent))
sys.path.append(str(Path(__file__).parent.parent / 'constitutional'))

from capabilities import Capability, CapabilityResolver, Identity

# Optional secret_adapter import (for production)
try:
    from secret_adapter import get_secret_adapter
    SECRET_ADAPTER_AVAILABLE = True
except ImportError:
    SECRET_ADAPTER_AVAILABLE = False
    print("Warning: secret_adapter not available, using fallback")


@dataclass
class JWTConfig:
    """JWT configuration."""
    algorithm: str = "HS256"
    token_ttl_hours: int = 24
    issuer: str = "PING"


class JWTAuth:
    """
    JWT authentication and authorization.
    
    Constitutional: Single authority for JWT operations.
    """
    
    def __init__(self, config: Optional[JWTConfig] = None):
        """
        Initialize JWT auth.
        
        Args:
            config: JWT configuration
        """
        self.config = config or JWTConfig()
        if SECRET_ADAPTER_AVAILABLE:
            self.secret_adapter = get_secret_adapter()
        else:
            self.secret_adapter = None
    
    def _get_signing_key(self) -> str:
        """Get JWT signing key from Vault or fallback."""
        if self.secret_adapter:
            key = self.secret_adapter.get_jwt_signing_key()
            if not key:
                raise ValueError("JWT signing key not found in Vault")
            return key
        else:
            # Fallback for development/testing
            from runtime.config.configuration_authority import ConfigurationAuthority
            return ConfigurationAuthority.current().get_secret('jwt_secret') or 'dev-signing-key-change-in-production'
    
    def create_token(
        self,
        subject: str,
        roles: List[str],
        ttl_hours: Optional[int] = None
    ) -> str:
        """
        Create JWT token.
        
        Args:
            subject: Subject identifier (e.g., "agent_001")
            roles: List of role names
            ttl_hours: Time to live in hours (overrides config)
        
        Returns:
            JWT token string
        """
        # Resolve capabilities from roles
        capabilities_set = CapabilityResolver.resolve_capabilities(set(roles))
        capabilities = [c.value for c in capabilities_set]
        
        # Calculate expiration
        ttl = ttl_hours or self.config.token_ttl_hours
        exp = datetime.datetime.utcnow() + datetime.timedelta(hours=ttl)
        
        # Create payload
        payload = {
            "sub": subject,
            "roles": roles,
            "capabilities": capabilities,
            "exp": exp,
            "iat": datetime.datetime.utcnow(),
            "iss": self.config.issuer
        }
        
        # Sign token
        signing_key = self._get_signing_key()
        token = jwt.encode(payload, signing_key, algorithm=self.config.algorithm)
        
        return token
    
    def verify_token(self, token: str) -> Dict:
        """
        Verify JWT token.
        
        Args:
            token: JWT token string
        
        Returns:
            Decoded payload
        
        Raises:
            jwt.InvalidTokenError: If token is invalid
        """
        signing_key = self._get_signing_key()
        
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=[self.config.algorithm],
            issuer=self.config.issuer
        )
        
        return payload
    
    def extract_identity(self, token: str) -> Identity:
        """
        Extract identity from JWT token.
        
        Args:
            token: JWT token string
        
        Returns:
            Identity object
        """
        payload = self.verify_token(token)
        
        subject = payload.get("sub")
        roles = payload.get("roles", [])
        
        identity = CapabilityResolver.create_identity(subject, roles)
        
        return identity
    
    def refresh_token(self, token: str, ttl_hours: Optional[int] = None) -> str:
        """
        Refresh JWT token.
        
        Args:
            token: Current JWT token
            ttl_hours: New time to live in hours
        
        Returns:
            New JWT token
        """
        payload = self.verify_token(token)
        
        subject = payload.get("sub")
        roles = payload.get("roles", [])
        
        return self.create_token(subject, roles, ttl_hours)


def create_jwt_for_identity(identity: Identity, ttl_hours: Optional[int] = None) -> str:
    """
    Convenience function to create JWT from identity.
    
    Args:
        identity: Identity object
        ttl_hours: Time to live in hours
    
    Returns:
        JWT token string
    """
    auth = JWTAuth()
    return auth.create_token(identity.subject, list(identity.roles), ttl_hours)


def verify_jwt_and_extract_identity(token: str) -> Identity:
    """
    Convenience function to verify JWT and extract identity.
    
    Args:
        token: JWT token string
    
    Returns:
        Identity object
    """
    auth = JWTAuth()
    return auth.extract_identity(token)


def main():
    """Test JWT auth."""
    print("Testing JWT Authentication")
    
    # Create JWT auth
    auth = JWTAuth()
    
    # Create token
    token = auth.create_token(
        subject="agent_001",
        roles=["PROJECTION_WORKER", "EVENT_WRITER"],
        ttl_hours=1
    )
    
    print(f"\nCreated token: {token[:50]}...")
    
    # Verify token
    payload = auth.verify_token(token)
    print(f"\nVerified payload:")
    print(f"  Subject: {payload['sub']}")
    print(f"  Roles: {payload['roles']}")
    print(f"  Capabilities: {payload['capabilities']}")
    print(f"  Expires: {payload['exp']}")
    
    # Extract identity
    identity = auth.extract_identity(token)
    print(f"\nExtracted identity:")
    print(f"  Subject: {identity.subject}")
    print(f"  Roles: {identity.roles}")
    print(f"  Capabilities: {[c.value for c in identity.capabilities]}")
    
    # Test refresh
    new_token = auth.refresh_token(token, ttl_hours=2)
    print(f"\nRefreshed token: {new_token[:50]}...")


if __name__ == '__main__':
    main()
