"""
Execution Context

Constitutional execution context containing constitutional policies.
Separate from infrastructure concerns.
"""

from dataclasses import dataclass
from enum import Enum


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
class ExecutionContext:
    """
    Constitutional execution context.
    
    Contains only constitutional policies and configuration.
    Separate from infrastructure concerns (clock, logger, metrics, etc.).
    """
    replay_mode: ReplayMode = ReplayMode.LIVE
    execution_id: str = "default"
    determinism_mode: DeterminismMode = DeterminismMode.STRICT
    replay_epoch: int = 0
    authority_version: str = "1.0.0"
    kernel_version: str = "1.0.0"
    witness_version: str = "1.0.0"
    failure_policy: FailurePolicy = FailurePolicy.FAIL_FAST
    clock_policy: ClockPolicy = ClockPolicy.SYSTEM
    hash_policy: HashPolicy = HashPolicy.SHA256
    encoding_policy: EncodingPolicy = EncodingPolicy.UTF8
