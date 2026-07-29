"""Provider ID

Constitutional provider identifier.

Architecture:
CapabilityId
  ↓
ProviderId
  ↓
ProviderDescriptor

Strings shouldn't become constitutional identities.
ProviderId is a frozen value object for provider identification.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class ProviderId:
    """
    Constitutional provider identifier.
    
    Replaces string-based provider names with constitutional objects.
    
    Strings shouldn't become constitutional identities.
    ProviderId is a frozen value object for provider identification.
    """
    value: str
    
    def __str__(self) -> str:
        return self.value
    
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, ProviderId):
            return False
        return self.value == other.value
    
    def __hash__(self) -> int:
        return hash(self.value)
