"""Execution Capabilities

Capability-based execution instead of central execution object.

Architecture:
ExecutionContext
  ↓
  Capabilities
  ↓
  Individual authorities

Moves toward capability-based execution where individual authorities
are accessed through capabilities rather than a single envelope.
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any

from runtime.execution_context import ExecutionEnvelope
from kernel.build_witness import BuildWitness


class ExecutionCapability(ABC):
    """
    Base class for execution capabilities.
    
    Capabilities provide access to specific constitutional authorities
    without requiring the entire execution envelope.
    """
    
    @abstractmethod
    def get_authority(self) -> Any:
        """Get the underlying authority"""
        pass


class IdentityCapability(ExecutionCapability):
    """
    Capability for execution identity information.
    
    Provides access to execution_id, correlation_id, causality_id.
    """
    
    def __init__(self, envelope: ExecutionEnvelope):
        self._envelope = envelope
    
    def get_authority(self) -> Any:
        """Get identity information"""
        return {
            "execution_id": self._envelope.execution_id,
            "correlation_id": self._envelope.correlation_id,
            "causality_id": self._envelope.causality_id,
        }
    
    def get_execution_id(self) -> str:
        """Get execution ID"""
        return self._envelope.execution_id
    
    def get_correlation_id(self) -> str | None:
        """Get correlation ID"""
        return self._envelope.correlation_id
    
    def get_causality_id(self) -> str | None:
        """Get causality ID"""
        return self._envelope.causality_id


class WitnessCapability(ExecutionCapability):
    """
    Capability for execution witness information.
    
    Provides access to build_witness, replay_id, constitutional policies.
    """
    
    def __init__(self, envelope: ExecutionEnvelope):
        self._envelope = envelope
    
    def get_authority(self) -> Any:
        """Get witness information"""
        return {
            "build_witness": self._envelope.build_witness,
            "replay_id": self._envelope.replay_id,
            "is_replay_mode": self._envelope.is_replay_mode(),
        }
    
    def get_build_witness(self) -> BuildWitness | None:
        """Get build witness"""
        return self._envelope.build_witness
    
    def get_build_witness_hash(self) -> str:
        """Get build witness root hash"""
        return self._envelope.get_build_witness_hash()
    
    def get_replay_id(self) -> str | None:
        """Get replay ID"""
        return self._envelope.replay_id
    
    def is_replay_mode(self) -> bool:
        """Check if running in replay mode"""
        return self._envelope.is_replay_mode()


class TemporalCapability(ExecutionCapability):
    """
    Capability for temporal information.
    
    Provides access to temporal authority and timestamp.
    """
    
    def __init__(self, envelope: ExecutionEnvelope):
        self._envelope = envelope
    
    def get_authority(self) -> Any:
        """Get temporal authority"""
        return self._envelope.temporal_authority
    
    def get_timestamp(self) -> datetime:
        """Get current timestamp"""
        return self._envelope.get_timestamp()


class CapabilityProvider:
    """
    Provider for execution capabilities.
    
    Provides capability-based access to execution context
    instead of requiring the entire execution envelope.
    """
    
    def __init__(self, envelope: ExecutionEnvelope):
        self._envelope = envelope
        self._identity_capability = IdentityCapability(envelope)
        self._witness_capability = WitnessCapability(envelope)
        self._temporal_capability = TemporalCapability(envelope)
    
    def get_identity_capability(self) -> IdentityCapability:
        """Get identity capability"""
        return self._identity_capability
    
    def get_witness_capability(self) -> WitnessCapability:
        """Get witness capability"""
        return self._witness_capability
    
    def get_temporal_capability(self) -> TemporalCapability:
        """Get temporal capability"""
        return self._temporal_capability
    
    def get_capability(self, capability_type: type) -> ExecutionCapability:
        """
        Get capability by type.
        
        Args:
            capability_type: Type of capability to get
        
        Returns:
            Capability instance
        """
        if capability_type == IdentityCapability:
            return self._identity_capability
        elif capability_type == WitnessCapability:
            return self._witness_capability
        elif capability_type == TemporalCapability:
            return self._temporal_capability
        else:
            raise ValueError(f"Unknown capability type: {capability_type}")
