"""Execution Interfaces

Narrow interfaces around ExecutionEnvelope.

Prevents ExecutionEnvelope from becoming a "god object" where APIs
accept the whole envelope when they only need specific parts.

Architecture:
ExecutionEnvelope
  ↓
  ExecutionIdentityInterface
  ↓
  ExecutionWitnessInterface
  ↓
  ExecutionClockInterface

APIs should accept only the interfaces they need, not the whole envelope.
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any

from runtime.execution_context import ExecutionEnvelope
from kernel.build_witness import BuildWitness


class ExecutionIdentityInterface(ABC):
    """
    Interface for execution identity information.
    
    Exposes only identity-related information:
    - execution_id
    - correlation_id
    - causality_id
    """
    
    @abstractmethod
    def get_execution_id(self) -> str:
        """Get execution ID"""
        pass
    
    @abstractmethod
    def get_correlation_id(self) -> str | None:
        """Get correlation ID"""
        pass
    
    @abstractmethod
    def get_causality_id(self) -> str | None:
        """Get causality ID"""
        pass


class ExecutionWitnessInterface(ABC):
    """
    Interface for execution witness information.
    
    Exposes only witness-related information:
    - build_witness
    - replay_id
    - constitutional policies
    """
    
    @abstractmethod
    def get_build_witness(self) -> BuildWitness | None:
        """Get build witness"""
        pass
    
    @abstractmethod
    def get_build_witness_hash(self) -> str:
        """Get build witness root hash"""
        pass
    
    @abstractmethod
    def get_replay_id(self) -> str | None:
        """Get replay ID"""
        pass
    
    @abstractmethod
    def is_replay_mode(self) -> bool:
        """Check if running in replay mode"""
        pass


class ExecutionClockInterface(ABC):
    """
    Interface for execution clock information.
    
    Exposes only clock-related information:
    - clock authority
    - timestamp
    """
    
    @abstractmethod
    def get_timestamp(self) -> datetime:
        """Get current timestamp"""
        pass


class ExecutionEnvelopeIdentityAdapter(ExecutionIdentityInterface):
    """
    Adapter for ExecutionEnvelope to ExecutionIdentityInterface.
    
    Exposes only identity-related information from the envelope.
    """
    
    def __init__(self, envelope: ExecutionEnvelope):
        self._envelope = envelope
    
    def get_execution_id(self) -> str:
        """Get execution ID"""
        return self._envelope.execution_id
    
    def get_correlation_id(self) -> str | None:
        """Get correlation ID"""
        return self._envelope.correlation_id
    
    def get_causality_id(self) -> str | None:
        """Get causality ID"""
        return self._envelope.causality_id


class ExecutionEnvelopeWitnessAdapter(ExecutionWitnessInterface):
    """
    Adapter for ExecutionEnvelope to ExecutionWitnessInterface.
    
    Exposes only witness-related information from the envelope.
    """
    
    def __init__(self, envelope: ExecutionEnvelope):
        self._envelope = envelope
    
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


class ExecutionEnvelopeClockAdapter(ExecutionClockInterface):
    """
    Adapter for ExecutionEnvelope to ExecutionClockInterface.
    
    Exposes only clock-related information from the envelope.
    """
    
    def __init__(self, envelope: ExecutionEnvelope):
        self._envelope = envelope
    
    def get_timestamp(self) -> datetime:
        """Get current timestamp"""
        return self._envelope.get_timestamp()


class ExecutionInterfaceFactory:
    """
    Factory for creating narrow interfaces from ExecutionEnvelope.
    
    Provides convenience methods for creating specific interfaces.
    """
    
    @staticmethod
    def create_identity_interface(envelope: ExecutionEnvelope) -> ExecutionIdentityInterface:
        """Create identity interface from envelope"""
        return ExecutionEnvelopeIdentityAdapter(envelope)
    
    @staticmethod
    def create_witness_interface(envelope: ExecutionEnvelope) -> ExecutionWitnessInterface:
        """Create witness interface from envelope"""
        return ExecutionEnvelopeWitnessAdapter(envelope)
    
    @staticmethod
    def create_clock_interface(envelope: ExecutionEnvelope) -> ExecutionClockInterface:
        """Create clock interface from envelope"""
        return ExecutionEnvelopeClockAdapter(envelope)
