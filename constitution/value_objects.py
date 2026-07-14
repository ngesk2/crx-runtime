"""
Constitutional Value Objects

Strong types for constitutional identities.
Strings should almost disappear from constitutional code.
"""

from dataclasses import dataclass
from typing import Any
from enum import Enum


class FailureCode(Enum):
    """Constitutional failure codes."""
    APPEND_ONLY_VIOLATION = "append_only_violation"
    ORDERING_VIOLATION = "ordering_violation"
    HASH_MISMATCH = "hash_mismatch"
    DUPLICATE_EVENT = "duplicate_event"
    MISSING_EVENT = "missing_event"
    LINEAGE_VIOLATION = "lineage_violation"
    AGGREGATE_VERSION_VIOLATION = "aggregate_version_violation"
    STATE_MUTATION_VIOLATION = "state_mutation_violation"
    PURITY_VIOLATION = "purity_violation"
    CANONICAL_SERIALIZATION_VIOLATION = "canonical_serialization_violation"
    WITNESS_VERIFICATION_FAILURE = "witness_verification_failure"
    REPLAY_VERIFICATION_FAILURE = "replay_verification_failure"
    TRANSITION_VIOLATION = "transition_violation"
    STORAGE_VIOLATION = "storage_violation"


@dataclass(frozen=True)
class EventId:
    """Constitutional event identifier."""
    value: str
    
    def __post_init__(self):
        if not self.value or len(self.value) != 64:
            raise ValueError(f"EventId must be 64-character hash: {self.value}")


@dataclass(frozen=True)
class AggregateId:
    """Constitutional aggregate identifier."""
    value: str
    
    def __post_init__(self):
        if not self.value:
            raise ValueError("AggregateId cannot be empty")


@dataclass(frozen=True)
class WitnessId:
    """Constitutional witness identifier."""
    value: str
    
    def __post_init__(self):
        if not self.value or len(self.value) != 64:
            raise ValueError(f"WitnessId must be 64-character hash: {self.value}")


@dataclass(frozen=True)
class ReplayId:
    """Constitutional replay identifier."""
    value: str
    
    def __post_init__(self):
        if not self.value:
            raise ValueError("ReplayId cannot be empty")


@dataclass(frozen=True)
class Hash:
    """Constitutional hash."""
    value: str
    
    def __post_init__(self):
        if not self.value or len(self.value) != 64:
            raise ValueError(f"Hash must be 64-character hash: {self.value}")


@dataclass(frozen=True)
class CanonicalBytes:
    """Constitutional canonical bytes."""
    value: bytes
    
    def __post_init__(self):
        if not self.value:
            raise ValueError("CanonicalBytes cannot be empty")


@dataclass(frozen=True)
class TranscriptHash:
    """Constitutional transcript hash."""
    value: str
    
    def __post_init__(self):
        if not self.value or len(self.value) != 64:
            raise ValueError(f"TranscriptHash must be 64-character hash: {self.value}")


@dataclass(frozen=True)
class SequenceNumber:
    """Constitutional sequence number."""
    value: int
    
    def __post_init__(self):
        if self.value < 0:
            raise ValueError("SequenceNumber must be non-negative")


@dataclass(frozen=True)
class AuthorityVersion:
    """Constitutional authority version."""
    value: str
    
    def __post_init__(self):
        if not self.value:
            raise ValueError("AuthorityVersion cannot be empty")
        
        # Validate semantic version format
        parts = self.value.split('.')
        if len(parts) != 3:
            raise ValueError(f"AuthorityVersion must be semantic version (major.minor.patch): {self.value}")
        
        try:
            int(parts[0])
            int(parts[1])
            int(parts[2])
        except ValueError:
            raise ValueError(f"AuthorityVersion must have numeric components: {self.value}")


@dataclass(frozen=True)
class CanonicalVersion:
    """Constitutional canonical version."""
    value: str
    
    def __post_init__(self):
        if not self.value:
            raise ValueError("CanonicalVersion cannot be empty")
        
        parts = self.value.split('.')
        if len(parts) != 3:
            raise ValueError(f"CanonicalVersion must be semantic version (major.minor.patch): {self.value}")
        
        try:
            int(parts[0])
            int(parts[1])
            int(parts[2])
        except ValueError:
            raise ValueError(f"CanonicalVersion must have numeric components: {self.value}")


@dataclass(frozen=True)
class EncodingVersion:
    """Constitutional encoding version."""
    value: str
    
    def __post_init__(self):
        if not self.value:
            raise ValueError("EncodingVersion cannot be empty")
        
        parts = self.value.split('.')
        if len(parts) != 3:
            raise ValueError(f"EncodingVersion must be semantic version (major.minor.patch): {self.value}")
        
        try:
            int(parts[0])
            int(parts[1])
            int(parts[2])
        except ValueError:
            raise ValueError(f"EncodingVersion must have numeric components: {self.value}")


@dataclass(frozen=True)
class WitnessVersion:
    """Constitutional witness version."""
    value: str
    
    def __post_init__(self):
        if not self.value:
            raise ValueError("WitnessVersion cannot be empty")
        
        parts = self.value.split('.')
        if len(parts) != 3:
            raise ValueError(f"WitnessVersion must be semantic version (major.minor.patch): {self.value}")
        
        try:
            int(parts[0])
            int(parts[1])
            int(parts[2])
        except ValueError:
            raise ValueError(f"WitnessVersion must have numeric components: {self.value}")


@dataclass(frozen=True)
class KernelVersion:
    """Constitutional kernel version."""
    value: str
    
    def __post_init__(self):
        if not self.value:
            raise ValueError("KernelVersion cannot be empty")
        
        parts = self.value.split('.')
        if len(parts) != 3:
            raise ValueError(f"KernelVersion must be semantic version (major.minor.patch): {self.value}")
        
        try:
            int(parts[0])
            int(parts[1])
            int(parts[2])
        except ValueError:
            raise ValueError(f"KernelVersion must have numeric components: {self.value}")


@dataclass(frozen=True)
class TranscriptVersion:
    """Constitutional transcript version."""
    value: str
    
    def __post_init__(self):
        if not self.value:
            raise ValueError("TranscriptVersion cannot be empty")
        
        parts = self.value.split('.')
        if len(parts) != 3:
            raise ValueError(f"TranscriptVersion must be semantic version (major.minor.patch): {self.value}")
        
        try:
            int(parts[0])
            int(parts[1])
            int(parts[2])
        except ValueError:
            raise ValueError(f"TranscriptVersion must have numeric components: {self.value}")


@dataclass(frozen=True)
class Proof:
    """Constitutional proof."""
    statement: str
    evidence: dict[str, Any]
    verified: bool
    verification_method: str


@dataclass(frozen=True)
class Violation:
    """Constitutional violation."""
    code: FailureCode
    statement: str
    evidence: dict[str, Any]
    location: str


@dataclass(frozen=True)
class Evidence:
    """Constitutional evidence."""
    fact: str
    data: dict[str, Any]
    derivation: str


@dataclass(frozen=True)
class ConstitutionalFailure:
    """Constitutional failure."""
    code: FailureCode
    message: str
    violations: list[Violation]
    evidence: list[Evidence]
    location: str


@dataclass(frozen=True)
class ReplayFailure:
    """Replay failure."""
    code: FailureCode
    message: str
    replay_id: ReplayId
    evidence: list[Evidence]


@dataclass(frozen=True)
class TransitionFailure:
    """Transition failure."""
    code: FailureCode
    message: str
    aggregate_id: AggregateId
    evidence: list[Evidence]


@dataclass(frozen=True)
class StorageFailure:
    """Storage failure."""
    code: FailureCode
    message: str
    evidence: list[Evidence]


@dataclass(frozen=True)
class VerificationFailure:
    """Verification failure."""
    code: FailureCode
    message: str
    expected: Any
    actual: Any
    evidence: list[Evidence]
