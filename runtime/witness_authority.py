"""Witness Authority

Constitutional witness authority for witness generation.

Architecture:
WitnessAuthority
  ↓
  Witness Generation
  ↓
  Constitutional Witness

Separates witness generation from configuration authority.
"""

from dataclasses import dataclass
from typing import Any

from constitution.authority.canonical_serializer import CanonicalSerializer
from constitution.authority.hash_authority import HashAuthority


@dataclass(frozen=True)
class WitnessIdentity:
    """
    Constitutional identity for a witness.
    
    Contains:
    - witness_hash (hash of witness data)
    - witness_type (type of witness: configuration, build, execution)
    - witness_name (name of witness)
    - authority_version (authority version)
    """
    witness_hash: str
    witness_type: str
    witness_name: str
    authority_version: str = "1.0.0"
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary"""
        return {
            "witness_hash": self.witness_hash,
            "witness_type": self.witness_type,
            "witness_name": self.witness_name,
            "authority_version": self.authority_version,
        }


class WitnessAuthority:
    """
    Authority for constitutional witness generation.
    
    Separated from ConfigurationAuthority to focus on witness generation.
    
    Responsibilities:
    - Generate constitutional witnesses
    - Hash witness data
    - Provide witness identities
    """
    
    def __init__(
        self,
        serializer: CanonicalSerializer,
        hash_authority: HashAuthority,
        authority_version: str = "1.0.0",
    ):
        self.serializer = serializer
        self.hash_authority = hash_authority
        self.authority_version = authority_version
    
    def generate_witness(
        self,
        witness_data: dict[str, Any],
        witness_type: str,
        witness_name: str,
    ) -> WitnessIdentity:
        """
        Generate a constitutional witness.
        
        Args:
            witness_data: Data to witness
            witness_type: Type of witness
            witness_name: Name of witness
        
        Returns:
            Witness identity
        """
        # Serialize witness data
        witness_bytes = self.serializer.serialize(witness_data)
        
        # Hash witness bytes
        witness_hash = self.hash_authority.hash_bytes(witness_bytes.value).value
        
        return WitnessIdentity(
            witness_hash=witness_hash,
            witness_type=witness_type,
            witness_name=witness_name,
            authority_version=self.authority_version,
        )
    
    def verify_witness(
        self,
        witness_data: dict[str, Any],
        witness_hash: str,
    ) -> bool:
        """
        Verify a witness hash.
        
        Args:
            witness_data: Data to verify
            witness_hash: Expected hash
        
        Returns:
            True if hash matches
        """
        # Serialize witness data
        witness_bytes = self.serializer.serialize(witness_data)
        
        # Verify hash
        return self.hash_authority.verify_hash(witness_bytes.value, witness_hash)
