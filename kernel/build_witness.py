"""
BuildWitness - Constitutional root authority.

All constitutional versions derive from one immutable BuildWitness.
This ensures replay sovereignty by proving the runtime constitution
used during event processing.

BuildWitness is now a Merkle root instead of a bag of hashes.
Everything verifies upward to a single immutable constitutional root.
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from storage.postgres.models import BuildWitness as BuildWitnessModel
from datetime import datetime
from constitution.hashing.merkle import compute_build_witness_root


class BuildWitness:
    """
    Constitutional root authority for runtime identity.
    
    Owns all constitutional version hashes that determine
    whether replay is constitutionally valid.
    
    BuildWitness is a Merkle root computed from:
    - Tool Registry
    - Workflow Registry
    - Prompt Registry
    - Agent Registry
    - Type Registry
    - Reducer Registry
    - Serializer Registry
    - Capability Registry
    - Kernel Constitution
    
    Everything verifies upward to a single immutable constitutional root.
    """
    
    def __init__(
        self,
        build_id: str,
        git_commit: str,
        tool_registry_hash: str,
        workflow_registry_hash: str,
        prompt_registry_hash: str,
        agent_registry_hash: str,
        type_registry_hash: str,
        serializer_hash: str,
        reducer_hash: str,
        capability_registry_hash: str,
        kernel_constitution_hash: str,
        configuration_witness_hash: str,
        constitutional_version: str,
        build_timestamp: datetime,
    ):
        # Private implementation detail - leaves of Merkle tree
        self._build_id = build_id
        self._git_commit = git_commit
        self._tool_registry_hash = tool_registry_hash
        self._workflow_registry_hash = workflow_registry_hash
        self._prompt_registry_hash = prompt_registry_hash
        self._agent_registry_hash = agent_registry_hash
        self._type_registry_hash = type_registry_hash
        self._serializer_hash = serializer_hash
        self._reducer_hash = reducer_hash
        self._capability_registry_hash = capability_registry_hash
        self._kernel_constitution_hash = kernel_constitution_hash
        self._configuration_witness_hash = configuration_witness_hash
        self._constitutional_version = constitutional_version
        self._build_timestamp = build_timestamp
        
        # Public constitutional identity - only the Merkle root
        self.root_hash = compute_build_witness_root(
            tool_registry_hash=tool_registry_hash,
            workflow_registry_hash=workflow_registry_hash,
            prompt_registry_hash=prompt_registry_hash,
            agent_registry_hash=agent_registry_hash,
            type_registry_hash=type_registry_hash,
            reducer_hash=reducer_hash,
            serializer_hash=serializer_hash,
            capability_registry_hash=capability_registry_hash,
            kernel_constitution_hash=kernel_constitution_hash,
            configuration_witness_hash=configuration_witness_hash,
        )
    
    @property
    def build_id(self) -> str:
        """Build ID (for database lookup)"""
        return self._build_id
    
    @property
    def build_timestamp(self) -> datetime:
        """Build timestamp (for database ordering)"""
        return self._build_timestamp
    
    @classmethod
    async def load_current(cls, session: AsyncSession) -> Optional["BuildWitness"]:
        """
        Load the current (latest) BuildWitness from the database.
        
        Returns None if no BuildWitness exists (should only happen
        during initial bootstrap).
        """
        query = select(BuildWitnessModel).order_by(
            BuildWitnessModel.build_timestamp.desc()
        ).limit(1)
        
        result = await session.execute(query)
        witness_model = result.scalar_one_or_none()
        
        if not witness_model:
            return None
        
        return cls(
            build_id=witness_model.build_id,
            git_commit=witness_model.git_commit,
            tool_registry_hash=witness_model.tool_registry_hash,
            workflow_registry_hash=witness_model.workflow_registry_hash,
            prompt_registry_hash=witness_model.prompt_registry_hash,
            agent_registry_hash=witness_model.agent_registry_hash,
            type_registry_hash=witness_model.type_registry_hash,
            serializer_hash=witness_model.serializer_hash,
            reducer_hash=witness_model.reducer_hash,
            capability_registry_hash=witness_model.capability_registry_hash,
            kernel_constitution_hash=witness_model.kernel_constitution_hash,
            configuration_witness_hash=witness_model.configuration_witness_hash,
            constitutional_version=witness_model.constitutional_version,
            build_timestamp=witness_model.build_timestamp,
        )
    
    @classmethod
    async def create(
        cls,
        session: AsyncSession,
        git_commit: str,
        tool_registry_hash: str,
        workflow_registry_hash: str,
        prompt_registry_hash: str,
        agent_registry_hash: str,
        type_registry_hash: str,
        serializer_hash: str,
        reducer_hash: str,
        capability_registry_hash: str,
        kernel_constitution_hash: str,
        configuration_witness_hash: str,
        constitutional_version: str = "1.0.0",
    ) -> "BuildWitness":
        """
        Create and persist a new BuildWitness.
        
        This should be called during runtime initialization or
        when the constitutional configuration changes.
        
        Now includes configuration_witness_hash to ensure same build + different env = different replay.
        """
        from constitution.authority import CanonicalAuthority
        import uuid
        
        authority = CanonicalAuthority()
        
        build_id = authority.hash_dict({
            "git_commit": git_commit,
            "tool_registry_hash": tool_registry_hash,
            "workflow_registry_hash": workflow_registry_hash,
            "prompt_registry_hash": prompt_registry_hash,
            "agent_registry_hash": agent_registry_hash,
            "type_registry_hash": type_registry_hash,
            "serializer_hash": serializer_hash,
            "reducer_hash": reducer_hash,
            "capability_registry_hash": capability_registry_hash,
            "kernel_constitution_hash": kernel_constitution_hash,
            "configuration_witness_hash": configuration_witness_hash,
            "constitutional_version": constitutional_version,
        })
        
        witness_model = BuildWitnessModel(
            build_id=build_id,
            git_commit=git_commit,
            tool_registry_hash=tool_registry_hash,
            workflow_registry_hash=workflow_registry_hash,
            prompt_registry_hash=prompt_registry_hash,
            agent_registry_hash=agent_registry_hash,
            type_registry_hash=type_registry_hash,
            serializer_hash=serializer_hash,
            reducer_hash=reducer_hash,
            capability_registry_hash=capability_registry_hash,
            kernel_constitution_hash=kernel_constitution_hash,
            configuration_witness_hash=configuration_witness_hash,
            constitutional_version=constitutional_version,
            build_timestamp=datetime.utcnow(),
        )
        
        session.add(witness_model)
        await session.commit()
        
        return cls(
            build_id=build_id,
            git_commit=git_commit,
            tool_registry_hash=tool_registry_hash,
            workflow_registry_hash=workflow_registry_hash,
            prompt_registry_hash=prompt_registry_hash,
            agent_registry_hash=agent_registry_hash,
            type_registry_hash=type_registry_hash,
            serializer_hash=serializer_hash,
            reducer_hash=reducer_hash,
            capability_registry_hash=capability_registry_hash,
            kernel_constitution_hash=kernel_constitution_hash,
            configuration_witness_hash=configuration_witness_hash,
            constitutional_version=constitutional_version,
            build_timestamp=witness_model.build_timestamp,
        )
    
    def get_domain_schema_version(self) -> str:
        """Get domain schema version (derived from constitutional version)"""
        return self.constitutional_version
    
    def get_reducer_version(self) -> str:
        """Get reducer version (derived from reducer hash)"""
        return self.reducer_hash
    
    def get_replay_protocol_version(self) -> str:
        """Get replay protocol version (derived from constitutional version)"""
        return self.constitutional_version
    
    def get_serialization_version(self) -> str:
        """Get serialization version (derived from serializer hash)"""
        return self.serializer_hash
    
    def matches_snapshot(self, snapshot_domain_schema_version: str, snapshot_reducer_version: str) -> bool:
        """
        Check if snapshot constitutional versions match current BuildWitness.
        
        Returns True if versions match, False if snapshot should be discarded
        and replay should start from genesis.
        """
        return (
            snapshot_domain_schema_version == self.get_domain_schema_version()
            and snapshot_reducer_version == self.get_reducer_version()
        )
