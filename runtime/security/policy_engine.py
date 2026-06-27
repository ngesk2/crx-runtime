"""
Policy Engine

Constitutional: Central policy enforcement for all operations.
Evaluates identity capabilities against operation requirements.

Architecture:
Identity Context
        ↓
Policy Engine
        ↓
Capability Check
        ↓
Allow/Deny
"""

from typing import Optional, Set
from contextvars import ContextVar
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent))

from capabilities import Identity, Capability, CapabilityResolver


# Thread-local identity context
_identity_context: ContextVar[Optional[Identity]] = ContextVar('identity_context', default=None)


class PolicyEngine:
    """
    Policy engine for capability-based authorization.
    
    Constitutional: Single authority for policy decisions.
    """
    
    @staticmethod
    def set_identity(identity: Identity):
        """Set identity in context."""
        _identity_context.set(identity)
    
    @staticmethod
    def get_identity() -> Optional[Identity]:
        """Get identity from context."""
        return _identity_context.get()
    
    @staticmethod
    def clear_identity():
        """Clear identity from context."""
        _identity_context.set(None)
    
    @staticmethod
    def check_capability(capability: Capability) -> bool:
        """
        Check if current identity has capability.
        
        Args:
            capability: Required capability
        
        Returns:
            True if authorized, False otherwise
        """
        identity = PolicyEngine.get_identity()
        
        if identity is None:
            return False
        
        return identity.has_capability(capability)
    
    @staticmethod
    def check_capabilities(capabilities: Set[Capability], require_all: bool = True) -> bool:
        """
        Check if current identity has capabilities.
        
        Args:
            capabilities: Required capabilities
            require_all: If True, requires all capabilities. If False, requires any.
        
        Returns:
            True if authorized, False otherwise
        """
        identity = PolicyEngine.get_identity()
        
        if identity is None:
            return False
        
        if require_all:
            return identity.has_all_capabilities(capabilities)
        else:
            return identity.has_any_capability(capabilities)
    
    @staticmethod
    def require_capability(capability: Capability):
        """
        Require capability or raise exception.
        
        Args:
            capability: Required capability
        
        Raises:
            PermissionError: If not authorized
        """
        if not PolicyEngine.check_capability(capability):
            identity = PolicyEngine.get_identity()
            raise PermissionError(
                f"Required capability: {capability.value}. "
                f"Identity: {identity.subject if identity else 'None'}, "
                f"Capabilities: {[c.value for c in identity.capabilities] if identity else 'None'}"
            )
    
    @staticmethod
    def require_capabilities(capabilities: Set[Capability], require_all: bool = True):
        """
        Require capabilities or raise exception.
        
        Args:
            capabilities: Required capabilities
            require_all: If True, requires all capabilities. If False, requires any.
        
        Raises:
            PermissionError: If not authorized
        """
        if not PolicyEngine.check_capabilities(capabilities, require_all):
            identity = PolicyEngine.get_identity()
            required_type = "all" if require_all else "any"
            raise PermissionError(
                f"Required capabilities ({required_type}): {[c.value for c in capabilities]}. "
                f"Identity: {identity.subject if identity else 'None'}, "
                f"Capabilities: {[c.value for c in identity.capabilities] if identity else 'None'}"
            )


# Convenience functions for use in other modules
def set_current_identity(identity: Identity):
    """Set current identity in context."""
    PolicyEngine.set_identity(identity)


def get_current_identity() -> Optional[Identity]:
    """Get current identity from context."""
    return PolicyEngine.get_identity()


def clear_current_identity():
    """Clear current identity from context."""
    PolicyEngine.clear_identity()


def check_capability(capability: Capability) -> bool:
    """Check if current identity has capability."""
    return PolicyEngine.check_capability(capability)


def require_capability(capability: Capability):
    """Require capability or raise exception."""
    PolicyEngine.require_capability(capability)


class PolicyContext:
    """
    Context manager for policy enforcement.
    
    Usage:
        with PolicyContext(identity):
            # Operations requiring authorization
            create_event()
    """
    
    def __init__(self, identity: Identity):
        self.identity = identity
        self.previous_identity = None
    
    def __enter__(self):
        self.previous_identity = PolicyEngine.get_identity()
        PolicyEngine.set_identity(self.identity)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        PolicyEngine.set_identity(self.previous_identity)
        return False


def main():
    """Test policy engine."""
    from capabilities import Capability
    
    # Create identity
    identity = CapabilityResolver.create_identity(
        subject="agent_001",
        roles=["PROJECTION_WORKER", "EVENT_WRITER"]
    )
    
    print("Testing Policy Engine")
    print(f"Identity: {identity.subject}")
    print(f"Capabilities: {[c.value for c in identity.capabilities]}")
    
    # Test with context
    with PolicyContext(identity):
        print(f"\nHas EVENT_WRITE: {check_capability(Capability.EVENT_WRITE)}")
        print(f"Has CONSTITUTION_ADMIN: {check_capability(Capability.CONSTITUTION_ADMIN)}")
        
        # Test require_capability
        try:
            require_capability(Capability.EVENT_WRITE)
            print("EVENT_WRITE check passed")
        except PermissionError as e:
            print(f"EVENT_WRITE check failed: {e}")
        
        try:
            require_capability(Capability.CONSTITUTION_ADMIN)
            print("CONSTITUTION_ADMIN check passed")
        except PermissionError as e:
            print(f"CONSTITUTION_ADMIN check failed: {e}")
    
    # Test without context
    print(f"\nNo context - Has EVENT_WRITE: {check_capability(Capability.EVENT_WRITE)}")


if __name__ == '__main__':
    main()
