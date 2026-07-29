"""
Canonical Authority

Central authority for all constitutional operations.
Kernel should never directly invoke hashing or canonical encoding.
Always go through this authority layer.

Single sovereign authority - no sub-authorities.
All operations are owned and implemented internally via separate modules.

Now uses CanonicalSerializer as the root serialization authority.
"""

from typing import Any, TYPE_CHECKING
from dataclasses import dataclass
from constitution.value_objects import CanonicalBytes, Hash
from .canonical_serializer import CanonicalSerializer
from .hash_authority import HashAuthority

if TYPE_CHECKING:
    from constitution.models.event import EventEnvelope

# Internal implementation modules
from .internal.unicode import normalize_string, UnicodeNormalizationError
from .internal.canonical_hash import hash_dict, hash_string, hash_bytes
from .internal.canonical_encoder import normalize, normalize_dict, normalize_list, CanonicalEncodingError, encode, decode
from .internal.merkle import compute_merkle_root
from .internal.lineage import compute_lineage_proof, compute_aggregate_roots
from .internal.witness_builder import build_witness


class CanonicalSerializationError(Exception):
    """Canonical serialization error."""
    pass


class CanonicalEncodingError(Exception):
    """Canonical encoding error."""
    pass


class UnicodeNormalizationError(Exception):
    """Unicode normalization error."""
    pass


@dataclass(frozen=True)
class ReplayWitness:
    """
    Full cryptographic replay proof.
    
    Constitutional witness for replay verification.
    """
    canonical_version: str
    encoding_version: str
    authority_version: str
    ordered_event_ids: list[str]
    ordered_reducer_hashes: list[Hash]
    state_hash: Hash
    transcript_hash: Hash
    root_hash: Hash
    lineage_proof: dict[str, Any]
    failure_proof: dict[str, Any]
    event_count: int
    aggregate_roots: list[str]
    verification_stamp: str


class CanonicalAuthority:
    """
    Central authority for all constitutional operations.
    
    Kernel should never directly invoke hashing or canonical encoding.
    Always go through this authority layer.
    
    Single sovereign authority - no sub-authorities.
    All operations are owned and implemented internally via separate modules.
    
    Now uses CanonicalSerializer as the root serialization authority.
    """
    
    def __init__(self, canonical_version: str = "1.0.0", encoding_version: str = "1.0.0", authority_version: str = "1.0.0"):
        self.canonical_version = canonical_version
        self.encoding_version = encoding_version
        self.authority_version = authority_version
        self.serializer = CanonicalSerializer(version=canonical_version)
        from constitution.authority.hash_authority import HashAlgorithm
        self.hash_authority = HashAuthority(algorithm=HashAlgorithm.SHA256_V1)
    
    def canonicalize(self, data: dict[str, Any]) -> CanonicalBytes:
        """
        Canonicalize data.
        
        Delegates to internal canonical_encoder module.
        """
        return encode(data)
    
    def encode(self, data: dict[str, Any]) -> CanonicalBytes:
        """
        Encode data canonically.
        
        Delegates to internal canonical_encoder module.
        """
        return encode(data)
    
    def decode(self, data: bytes | CanonicalBytes) -> dict[str, Any]:
        """
        Decode data from canonical encoding.
        
        Delegates to internal canonical_encoder module.
        """
        return decode(data)
    
    def compute_event_id(self, event) -> str:
        """
        Compute event ID.
        
        Delegates to internal canonical_hash module.
        """
        data = self._extract_constitutional_data(event)
        return hash_dict(data)
    
    def compute_witness(self, state: dict[str, Any], events: list) -> ReplayWitness:
        """
        Compute witness from state and events.
        
        Delegates to internal witness_builder module.
        """
        witness_data = build_witness(
            state=state,
            events=events,
            canonical_version=self.canonical_version,
            encoding_version=self.encoding_version,
            authority_version=self.authority_version,
        )
        
        return ReplayWitness(**witness_data)
    
    def serialize(self, data: dict[str, Any]) -> CanonicalBytes:
        """
        Serialize data canonically.
        
        Delegates to canonicalize().
        """
        return self.canonicalize(data)
    
    def normalize(self, data: dict[str, Any]) -> dict[str, Any]:
        """
        Normalize data.
        
        Delegates to internal canonical_encoder module.
        """
        return normalize(data)
    
    def compare(self, data1: dict[str, Any], data2: dict[str, Any]) -> bool:
        """
        Compare two data structures canonically.
        
        Delegates to internal canonical_hash module.
        """
        hash1 = hash_dict(data1)
        hash2 = hash_dict(data2)
        return hash1 == hash2
    
    def hash_dict(self, data: dict[str, Any]) -> str:
        """
        Hash a dictionary using canonical hashing.
        
        CanonicalSerializer → HashAuthority → CanonicalHash
        """
        canonical_bytes = self.serializer.serialize(data)
        return self.hash_authority.hash_bytes(canonical_bytes.value).value
    
    def hash_string(self, data: str) -> str:
        """
        Hash a string using SHA256.
        
        HashAuthority → CanonicalHash
        """
        return self.hash_authority.hash_string(data).value
    
    def hash_bytes(self, data: bytes) -> str:
        """
        Hash bytes using SHA256.
        
        HashAuthority → CanonicalHash
        """
        return self.hash_authority.hash_bytes(data).value
    
    # Internal helper for event data extraction
    def _extract_constitutional_data(self, event) -> dict[str, Any]:
        """Extract constitutional data from event."""
        return {
            'event_type': event.event_type,
            'event_category': event.event_category,
            'occurred_at': event.occurred_at.isoformat(),
            'correlation_id': event.correlation_id,
            'causality_id': event.causality_id,
            'producer_id': event.producer_id,
            'caused_by_command_id': event.caused_by_command_id,
            'schema_version': event.schema_version,
            'global_sequence': event.global_sequence,
            'aggregate_sequence': event.aggregate_sequence,
            'payload': event.payload,
        }
