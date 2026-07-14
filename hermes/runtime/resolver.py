"""
Capability Resolver - Resolve capability from mission.

This service resolves capabilities from mission specifications.
No hardcoded capability names in runtime flow.
"""

from typing import Any, Optional
from constitution.registry import CapabilityRegistry, get_registry


class CapabilityResolver:
    """
    Resolve capability from mission specification.
    
    Mission contains capability="github.acquire_repository"
    Resolver returns executable capability instance.
    """
    
    def __init__(self, registry: Optional[CapabilityRegistry] = None):
        self.registry = registry or get_registry()
    
    def resolve(self, capability_name: str) -> Any:
        """
        Resolve capability by name.
        
        Args:
            capability_name: Capability identifier (e.g., "github.acquire_repository")
        
        Returns:
            Capability instance
        
        Raises:
            ValueError: If capability not found
        """
        capability = self.registry.get(capability_name)
        
        if capability is None:
            raise ValueError(f"Capability '{capability_name}' not found in registry")
        
        return capability
    
    def resolve_from_mission(self, mission: Any) -> Any:
        """
        Resolve capability from mission object.
        
        Args:
            mission: Mission object with capability field
        
        Returns:
            Capability instance
        """
        capability_name = getattr(mission, 'capability', None)
        
        if capability_name is None:
            raise ValueError("Mission does not have capability field")
        
        return self.resolve(capability_name)
    
    def verify_authority(self, capability: Any, authority: Any) -> bool:
        """
        Verify capability has authority to execute.
        
        Args:
            capability: Capability instance
            authority: Authority to verify
        
        Returns:
            True if authorized
        """
        # Placeholder for authority verification
        # Future: integrate with AuthorityRegistry
        return True
    
    def verify_policy(self, capability: Any, policy: Any) -> bool:
        """
        Verify capability satisfies execution policy.
        
        Args:
            capability: Capability instance
            policy: Policy to verify
        
        Returns:
            True if policy satisfied
        """
        # Placeholder for policy verification
        # Future: integrate with constitutional policies
        return True
    
    def get_executable(
        self,
        capability_name: str,
        authority: Optional[Any] = None,
        policy: Optional[Any] = None
    ) -> Any:
        """
        Get verified executable capability.
        
        Args:
            capability_name: Capability identifier
            authority: Optional authority to verify
            policy: Optional policy to verify
        
        Returns:
            Verified capability instance
        
        Raises:
            ValueError: If capability not found or verification fails
        """
        capability = self.resolve(capability_name)
        
        if authority and not self.verify_authority(capability, authority):
            raise ValueError(f"Capability '{capability_name}' not authorized")
        
        if policy and not self.verify_policy(capability, policy):
            raise ValueError(f"Capability '{capability_name}' does not satisfy policy")
        
        return capability
