"""Authority Hash

Constitutional authority hash value object.

Constitutional primitives should almost never be raw strings.
AuthorityHash is a frozen value object for authority identification.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class AuthorityHash:
    """
    Constitutional authority hash.
    
    Replaces string-based authority hashes with constitutional objects.
    
    Constitutional primitives should almost never be raw strings.
    AuthorityHash is a frozen value object for authority identification.
    """
    value: str
    
    def __str__(self) -> str:
        return self.value
    
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, AuthorityHash):
            return False
        return self.value == other.value
    
    def __hash__(self) -> int:
        return hash(self.value)
