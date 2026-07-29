"""
Execution Context

Constitutional execution context split into immutable components.

Architecture:
ExecutionEnvelope (immutable envelope)
  ↓
  ExecutionIdentity (identity information)
  ↓
  ExecutionWitness (constitutional witness)
  ↓
  ExecutionContext (runtime context)

Separation of concerns:
- ExecutionEnvelope: immutable envelope containing all execution data
- ExecutionIdentity: execution_id, correlation_id, causality_id
- ExecutionWitness: build_witness, policies, constitutional versioning
- ExecutionContext: clock authority, runtime state
"""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from types import MappingProxyType
from typing import Any

from kernel.build_witness import BuildWitness


class ReplayMode(Enum):
    """Replay execution mode."""
    LIVE = "live"
    REPLAY = "replay"
    VERIFICATION = "verification"


class DeterminismMode(Enum):
    """Determinism enforcement mode."""
    STRICT = "strict"
    LENIENT = "lenient"


class FailurePolicy(Enum):
    """Failure handling policy."""
    FAIL_FAST = "fail_fast"
    CONTINUE = "continue"
    LOG_ONLY = "log_only"


class ClockPolicy(Enum):
    """Clock policy for time operations."""
    SYSTEM = "system"
    FIXED = "fixed"
    SIMULATED = "simulated"


class HashPolicy(Enum):
    """Hash policy for cryptographic operations."""
    SHA256 = "sha256"
    SHA512 = "sha512"


class EncodingPolicy(Enum):
    """Encoding policy for serialization."""
    UTF8 = "utf8"
    ASCII = "ascii"


@dataclass(frozen=True)
class TemporalAuthority:
    """
    Constitutional temporal authority for deterministic time operations.
    
    Eventually the authority may encompass:
    - wall clock
    - replay clock
    - monotonic clock
    - Lamport clock
    - vector clock
    
    "TemporalAuthority" better reflects that broader responsibility.
    
    Eliminates datetime.utcnow() violations that break replay.
    """
    
    _fixed_timestamp: datetime | None = None
    
    def now(self) -> datetime:
        """Get current time (or fixed time for replay)"""
        if self._fixed_timestamp:
            return self._fixed_timestamp
        return datetime.utcnow()
    
    @classmethod
    def for_replay(cls, timestamp: datetime) -> "TemporalAuthority":
        """Create temporal authority for replay with fixed timestamp"""
        return cls(_fixed_timestamp=timestamp)


@dataclass(frozen=True)
class ExecutionIdentity:
    """
    Immutable execution identity.
    
    Contains identity information:
    - execution_id (unique execution identifier)
    - correlation_id (correlation tracking)
    - causality_id (causal tracking)
    """
    execution_id: str = "default"
    correlation_id: str | None = None
    causality_id: str | None = None
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary"""
        return {
            "execution_id": self.execution_id,
            "correlation_id": self.correlation_id,
            "causality_id": self.causality_id,
        }


@dataclass(frozen=True)
class ExecutionWitness:
    """
    Immutable execution witness.
    
    Contains constitutional witness information:
    - build_witness (constitutional build witness)
    - replay_id (replay identifier)
    - replay_epoch (replay epoch)
    - constitutional policies (replay_mode, determinism_mode, failure_policy)
    - versioning (authority_version, kernel_version, witness_version, schema_version, runtime_version)
    """
    build_witness: BuildWitness | None = None
    replay_id: str | None = None
    replay_epoch: int = 0
    replay_mode: ReplayMode = ReplayMode.LIVE
    determinism_mode: DeterminismMode = DeterminismMode.STRICT
    failure_policy: FailurePolicy = FailurePolicy.FAIL_FAST
    authority_version: str = "1.0.0"
    kernel_version: str = "1.0.0"
    witness_version: str = "1.0.0"
    schema_version: str = "1.0.0"
    runtime_version: str = "1.0.0"
    
    def get_build_witness_hash(self) -> str:
        """Get BuildWitness root hash"""
        if not self.build_witness:
            raise ValueError("BuildWitness not set in ExecutionWitness")
        return self.build_witness.root_hash
    
    def is_replay_mode(self) -> bool:
        """Check if running in replay mode"""
        return self.replay_mode == ReplayMode.REPLAY or self.replay_id is not None
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary"""
        return {
            "build_witness_root_hash": self.build_witness.root_hash if self.build_witness else None,
            "replay_id": self.replay_id,
            "replay_epoch": self.replay_epoch,
            "replay_mode": self.replay_mode.value,
            "determinism_mode": self.determinism_mode.value,
            "failure_policy": self.failure_policy.value,
            "authority_version": self.authority_version,
            "kernel_version": self.kernel_version,
            "witness_version": self.witness_version,
            "schema_version": self.schema_version,
            "runtime_version": self.runtime_version,
        }


@dataclass(frozen=True)
class ExecutionContext:
    """
    Immutable execution context.
    
    Contains runtime context:
    - temporal_authority (time operations)
    - hash_policy (cryptographic operations)
    - encoding_policy (serialization)
    
    Separated from identity and witness for clear separation of concerns.
    """
    temporal_authority: TemporalAuthority = TemporalAuthority()
    hash_policy: HashPolicy = HashPolicy.SHA256
    encoding_policy: EncodingPolicy = EncodingPolicy.UTF8
    
    def get_timestamp(self) -> datetime:
        """Get current timestamp from temporal authority"""
        return self.temporal_authority.now()
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary"""
        return {
            "temporal_policy": self.temporal_authority._fixed_timestamp.isoformat() if self.temporal_authority._fixed_timestamp else "system",
            "hash_policy": self.hash_policy.value,
            "encoding_policy": self.encoding_policy.value,
        }


@dataclass(frozen=True)
class ExecutionEnvelope:
    """
    Immutable execution envelope.
    
    Combines all execution components into a single envelope:
    - identity (ExecutionIdentity)
    - witness (ExecutionWitness)
    - context (ExecutionContext)
    
    This is the single object passed throughout the system,
    eliminating parameter explosion.
    """
    identity: ExecutionIdentity
    witness: ExecutionWitness
    context: ExecutionContext
    
    @property
    def execution_id(self) -> str:
        """Get execution ID"""
        return self.identity.execution_id
    
    @property
    def correlation_id(self) -> str | None:
        """Get correlation ID"""
        return self.identity.correlation_id
    
    @property
    def causality_id(self) -> str | None:
        """Get causality ID"""
        return self.identity.causality_id
    
    @property
    def build_witness(self) -> BuildWitness | None:
        """Get build witness"""
        return self.witness.build_witness
    
    @property
    def replay_id(self) -> str | None:
        """Get replay ID"""
        return self.witness.replay_id
    
    @property
    def temporal_authority(self) -> TemporalAuthority:
        """Get temporal authority"""
        return self.context.temporal_authority
    
    def get_build_witness_hash(self) -> str:
        """Get BuildWitness root hash"""
        return self.witness.get_build_witness_hash()
    
    def get_timestamp(self) -> datetime:
        """Get current timestamp"""
        return self.context.get_timestamp()
    
    def is_replay_mode(self) -> bool:
        """Check if running in replay mode"""
        return self.witness.is_replay_mode()
    
    def to_immutable_dict(self) -> MappingProxyType:
        """Convert to immutable dict for constitutional storage"""
        return MappingProxyType({
            **self.identity.to_dict(),
            **self.witness.to_dict(),
            **self.context.to_dict(),
        })
    
    @classmethod
    def create(
        cls,
        execution_id: str = "default",
        correlation_id: str | None = None,
        causality_id: str | None = None,
        build_witness: BuildWitness | None = None,
        replay_id: str | None = None,
        replay_epoch: int = 0,
        replay_mode: ReplayMode = ReplayMode.LIVE,
        determinism_mode: DeterminismMode = DeterminismMode.STRICT,
        failure_policy: FailurePolicy = FailurePolicy.FAIL_FAST,
        authority_version: str = "1.0.0",
        kernel_version: str = "1.0.0",
        witness_version: str = "1.0.0",
        schema_version: str = "1.0.0",
        runtime_version: str = "1.0.0",
        temporal_authority: TemporalAuthority = TemporalAuthority(),
        hash_policy: HashPolicy = HashPolicy.SHA256,
        encoding_policy: EncodingPolicy = EncodingPolicy.UTF8,
    ) -> "ExecutionEnvelope":
        """
        Factory method to create ExecutionEnvelope.
        
        Combines identity, witness, and context into a single envelope.
        """
        identity = ExecutionIdentity(
            execution_id=execution_id,
            correlation_id=correlation_id,
            causality_id=causality_id,
        )
        
        witness = ExecutionWitness(
            build_witness=build_witness,
            replay_id=replay_id,
            replay_epoch=replay_epoch,
            replay_mode=replay_mode,
            determinism_mode=determinism_mode,
            failure_policy=failure_policy,
            authority_version=authority_version,
            kernel_version=kernel_version,
            witness_version=witness_version,
            schema_version=schema_version,
            runtime_version=runtime_version,
        )
        
        context = ExecutionContext(
            temporal_authority=temporal_authority,
            hash_policy=hash_policy,
            encoding_policy=encoding_policy,
        )
        
        return cls(
            identity=identity,
            witness=witness,
            context=context,
        )
