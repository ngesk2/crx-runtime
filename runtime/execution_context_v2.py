"""Execution Context V2

Constitutional execution context with BuildWitness, ReplayId, ClockAuthority, 
authority versions, and correlation IDs.

This eliminates parameter explosion and ensures constitutional consistency.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any
from types import MappingProxyType

from kernel.build_witness import BuildWitness


@dataclass(frozen=True)
class ClockAuthority:
    """Constitutional clock authority for deterministic time
    
    Eliminates datetime.utcnow() violations that break replay.
    """
    
    _fixed_timestamp: datetime | None = None
    
    def now(self) -> datetime:
        """Get current time (or fixed time for replay)"""
        if self._fixed_timestamp:
            return self._fixed_timestamp
        return datetime.utcnow()
    
    @classmethod
    def for_replay(cls, timestamp: datetime) -> "ClockAuthority":
        """Create clock authority for replay with fixed timestamp"""
        return cls(_fixed_timestamp=timestamp)


@dataclass(frozen=True)
class ExecutionContext:
    """Constitutional execution context
    
    Contains all constitutional metadata needed for execution.
    Eliminates parameter explosion by passing a single context instead of
    build_witness_hash, replay_hash, authority_hash, runtime_hash, etc.
    
    Args:
        build_witness: BuildWitness for constitutional root authority
        replay_id: Replay identifier for deterministic replay
        clock_authority: Clock authority for deterministic time
        authority_version: Authority version (discovered from build manifest)
        schema_version: Schema version (discovered from build manifest)
        replay_version: Replay version (discovered from build manifest)
        runtime_version: Runtime version (discovered from build manifest)
        correlation_id: Correlation ID for tracing
        causality_id: Causality ID for event chains
    """
    
    build_witness: BuildWitness
    replay_id: str | None = None
    clock_authority: ClockAuthority = ClockAuthority()
    authority_version: str = "1.0.0"
    schema_version: str = "1.0.0"
    replay_version: str = "1.0.0"
    runtime_version: str = "1.0.0"
    correlation_id: str | None = None
    causality_id: str | None = None
    
    def get_build_witness_hash(self) -> str:
        """Get BuildWitness root hash"""
        return self.build_witness.root_hash
    
    def get_timestamp(self) -> datetime:
        """Get current timestamp from clock authority"""
        return self.clock_authority.now()
    
    def is_replay_mode(self) -> bool:
        """Check if running in replay mode"""
        return self.replay_id is not None
    
    def to_immutable_dict(self) -> MappingProxyType:
        """Convert to immutable dict for constitutional storage"""
        return MappingProxyType({
            "build_witness_root_hash": self.build_witness.root_hash,
            "replay_id": self.replay_id,
            "authority_version": self.authority_version,
            "schema_version": self.schema_version,
            "replay_version": self.replay_version,
            "runtime_version": self.runtime_version,
            "correlation_id": self.correlation_id,
            "causality_id": self.causality_id,
        })
