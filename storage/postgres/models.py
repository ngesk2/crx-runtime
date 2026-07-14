from datetime import datetime
from sqlalchemy import JSON, Column, DateTime, Integer, String, Text, Index, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(64), unique=True, nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    event_category = Column(String(50), nullable=False)  # DomainEvent or InfrastructureEvent
    payload = Column(JSON, nullable=False)
    
    # Envelope fields
    occurred_at = Column(DateTime(timezone=True), nullable=False)
    recorded_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    correlation_id = Column(String(64), nullable=True, index=True)
    causality_id = Column(String(64), nullable=True, index=True)
    producer_id = Column(String(64), nullable=True)
    caused_by_command_id = Column(String(64), nullable=True, index=True)
    schema_version = Column(String(20), nullable=False)
    # Blocking Defect 2: Database-generated global sequence
    # Use PostgreSQL sequence for ordering authority
    global_sequence = Column(Integer, nullable=False, unique=True, server_default="SELECT nextval('events_global_sequence_seq')")
    aggregate_sequence = Column(Integer, nullable=True)
    
    # Hash
    event_hash = Column(String(64), nullable=False, unique=True, index=True)  # UNIQUE constraint added
    build_witness_hash = Column(String(64), nullable=False, index=True)  # BuildWitness used when event was created
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    
    __table_args__ = (
        Index('ix_events_global_sequence', 'global_sequence'),
        Index('ix_events_correlation_causality', 'correlation_id', 'causality_id'),
        Index('ix_events_event_type_category', 'event_type', 'event_category'),
        # Constitutional constraint: unique aggregate sequence per aggregate
        Index('ix_events_aggregate_sequence_unique', 'causality_id', 'aggregate_sequence', unique=True),
    )


class Snapshot(Base):
    __tablename__ = "snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    snapshot_id = Column(String(64), unique=True, nullable=False, index=True)
    projection_name = Column(String(100), nullable=False, index=True)
    projection_version = Column(Integer, nullable=False)
    state = Column(JSON, nullable=False)
    last_event_id = Column(String(64), nullable=False)
    last_global_sequence = Column(Integer, nullable=False)
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    
    __table_args__ = (
        Index('ix_snapshots_projection_version', 'projection_name', 'projection_version'),
    )


class ProjectionVersion(Base):
    __tablename__ = "projection_versions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    projection_name = Column(String(100), unique=True, nullable=False)
    current_version = Column(Integer, nullable=False, default=1)
    schema_hash = Column(String(64), nullable=False)  # Hash of projection implementation
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())


class ProjectionCheckpoint(Base):
    __tablename__ = "projection_checkpoints"

    id = Column(Integer, primary_key=True, autoincrement=True)
    projection_name = Column(String(100), nullable=False, index=True)
    state_hash = Column(String(64), nullable=False, index=True)  # Hash of projection state
    witness_hash = Column(String(64), nullable=False, index=True)  # Hash of full replay witness
    projection_input_hash = Column(String(64), nullable=False, index=True)  # Hash of ordered_event_ids
    build_witness_hash = Column(String(64), nullable=False, index=True)  # BuildWitness used when projection was built
    last_global_sequence = Column(Integer, nullable=False)
    last_event_id = Column(String(64), nullable=False)
    projection_version = Column(Integer, nullable=False)
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    
    __table_args__ = (
        Index('ix_projection_checkpoints_name_sequence', 'projection_name', 'last_global_sequence'),
    )


class Schema(Base):
    __tablename__ = "schemas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    schema_name = Column(String(100), unique=True, nullable=False)
    schema_version = Column(String(20), nullable=False)
    schema_definition = Column(JSON, nullable=False)
    compatibility_type = Column(String(50), nullable=False)  # backward, forward, breaking, deprecated
    schema_hash = Column(String(64), unique=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    
    __table_args__ = (
        Index('ix_schemas_name_version', 'schema_name', 'schema_version'),
    )


class Aggregate(Base):
    __tablename__ = "aggregates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    aggregate_id = Column(String(64), unique=True, nullable=False, index=True)
    aggregate_type = Column(String(100), nullable=False, index=True)
    aggregate_version = Column(Integer, nullable=False, default=1)
    state_hash = Column(String(64), nullable=False, index=True)  # Hash of aggregate state
    state = Column(JSON, nullable=False)  # Aggregate state snapshot (mutable JSON for compatibility)
    canonical_state_bytes = Column(Text, nullable=False)  # Canonical bytes of state (constitutional storage)
    # Constitutional versioning for snapshot validation
    domain_schema_version = Column(String(20), nullable=False, default="1.0.0")
    reducer_version = Column(String(20), nullable=False, default="1.0.0")
    replay_protocol_version = Column(String(20), nullable=False, default="1.0.0")
    serialization_version = Column(String(20), nullable=False, default="1.0.0")
    # Canonical snapshot witness
    snapshot_hash = Column(String(64), nullable=False, index=True)  # Hash of full snapshot envelope
    last_event_hash = Column(String(64), nullable=False)  # Hash of last event in snapshot
    aggregate_identity_hash = Column(String(64), nullable=False, index=True)  # Historical identity
    build_witness_hash = Column(String(64), nullable=False, index=True)  # BuildWitness used when snapshot was created
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        Index('ix_aggregates_type_version', 'aggregate_type', 'aggregate_version'),
        Index('ix_aggregates_identity', 'aggregate_identity_hash'),
    )


class Command(Base):
    __tablename__ = "commands"

    id = Column(Integer, primary_key=True, autoincrement=True)
    command_id = Column(String(64), unique=True, nullable=False, index=True)
    command_type = Column(String(100), nullable=False)
    parameters = Column(JSON, nullable=False)
    aggregate_id = Column(String(64), nullable=True, index=True)
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    executed_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), nullable=False, default="created")  # created, executed, failed
    
    __table_args__ = (
        Index('ix_commands_aggregate', 'aggregate_id'),
    )


class OutboxMessage(Base):
    __tablename__ = "outbox_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    topic = Column(String(255), nullable=False, index=True)
    payload = Column(JSON, nullable=False)
    correlation_id = Column(String(64), nullable=True, index=True)
    processed = Column(Boolean, nullable=False, default=False)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    
    __table_args__ = (
        Index('ix_outbox_processed', 'processed', 'created_at'),
    )


class TypeRegistry(Base):
    __tablename__ = "type_registry"

    id = Column(Integer, primary_key=True, autoincrement=True)
    type_name = Column(String(100), unique=True, nullable=False, index=True)
    type_version = Column(String(20), nullable=False)
    type_definition = Column(JSON, nullable=False)
    compatibility_type = Column(String(50), nullable=False)
    type_hash = Column(String(64), unique=True, nullable=False)
    # Constitutional lineage fields
    canonical_bytes = Column(Text, nullable=False)  # Canonical serialization of definition
    canonical_hash = Column(String(64), unique=True, nullable=False, index=True)  # Hash of canonical_bytes
    parent_hash = Column(String(64), nullable=True, index=True)  # Hash of previous version
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        Index('ix_type_registry_name_version', 'type_name', 'type_version'),
        Index('ix_type_registry_parent', 'parent_hash'),
    )


class CapabilityRegistry(Base):
    __tablename__ = "capability_registry"

    id = Column(Integer, primary_key=True, autoincrement=True)
    capability_name = Column(String(100), unique=True, nullable=False, index=True)
    capability_version = Column(String(20), nullable=False)
    capability_definition = Column(JSON, nullable=False)  # Interface definition
    compatibility_type = Column(String(50), nullable=False)
    capability_hash = Column(String(64), unique=True, nullable=False)
    # Constitutional lineage fields
    canonical_bytes = Column(Text, nullable=False)  # Canonical serialization of definition
    canonical_hash = Column(String(64), unique=True, nullable=False, index=True)  # Hash of canonical_bytes
    parent_hash = Column(String(64), nullable=True, index=True)  # Hash of previous version
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        Index('ix_capability_registry_name_version', 'capability_name', 'capability_version'),
        Index('ix_capability_registry_parent', 'parent_hash'),
    )


class WorkflowRegistry(Base):
    __tablename__ = "workflow_registry"

    id = Column(Integer, primary_key=True, autoincrement=True)
    workflow_name = Column(String(100), unique=True, nullable=False, index=True)
    workflow_version = Column(String(20), nullable=False)
    workflow_definition = Column(JSON, nullable=False)
    compatibility_type = Column(String(50), nullable=False)
    workflow_hash = Column(String(64), unique=True, nullable=False)
    # Constitutional lineage fields
    canonical_bytes = Column(Text, nullable=False)
    canonical_hash = Column(String(64), unique=True, nullable=False, index=True)
    parent_hash = Column(String(64), nullable=True, index=True)
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        Index('ix_workflow_registry_name_version', 'workflow_name', 'workflow_version'),
        Index('ix_workflow_registry_parent', 'parent_hash'),
    )


class PromptRegistry(Base):
    __tablename__ = "prompt_registry"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prompt_name = Column(String(100), unique=True, nullable=False, index=True)
    prompt_version = Column(String(20), nullable=False)
    prompt_definition = Column(JSON, nullable=False)
    compatibility_type = Column(String(50), nullable=False)
    prompt_hash = Column(String(64), unique=True, nullable=False)
    # Constitutional lineage fields
    canonical_bytes = Column(Text, nullable=False)
    canonical_hash = Column(String(64), unique=True, nullable=False, index=True)
    parent_hash = Column(String(64), nullable=True, index=True)
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        Index('ix_prompt_registry_name_version', 'prompt_name', 'prompt_version'),
        Index('ix_prompt_registry_parent', 'parent_hash'),
    )


class ToolRegistry(Base):
    __tablename__ = "tool_registry"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tool_name = Column(String(100), unique=True, nullable=False, index=True)
    tool_version = Column(String(20), nullable=False)
    tool_definition = Column(JSON, nullable=False)
    compatibility_type = Column(String(50), nullable=False)
    tool_hash = Column(String(64), unique=True, nullable=False)
    # Constitutional lineage fields
    canonical_bytes = Column(Text, nullable=False)
    canonical_hash = Column(String(64), unique=True, nullable=False, index=True)
    parent_hash = Column(String(64), nullable=True, index=True)
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        Index('ix_tool_registry_name_version', 'tool_name', 'tool_version'),
        Index('ix_tool_registry_parent', 'parent_hash'),
    )


class AgentRegistry(Base):
    __tablename__ = "agent_registry"

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_name = Column(String(100), unique=True, nullable=False, index=True)
    agent_version = Column(String(20), nullable=False)
    agent_definition = Column(JSON, nullable=False)
    compatibility_type = Column(String(50), nullable=False)
    agent_hash = Column(String(64), unique=True, nullable=False)
    # Constitutional lineage fields
    canonical_bytes = Column(Text, nullable=False)
    canonical_hash = Column(String(64), unique=True, nullable=False, index=True)
    parent_hash = Column(String(64), nullable=True, index=True)
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        Index('ix_agent_registry_name_version', 'agent_name', 'agent_version'),
        Index('ix_agent_registry_parent', 'parent_hash'),
    )


class Artifact(Base):
    __tablename__ = "artifacts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    artifact_id = Column(String(64), unique=True, nullable=False, index=True)
    content_type = Column(String(100), nullable=False)
    content_hash = Column(String(64), nullable=False, index=True)
    size = Column(Integer, nullable=False)
    metadata = Column(JSON, nullable=False)
    # storage_location removed - handled by adapter only
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    
    __table_args__ = (
        Index('ix_artifacts_content_hash', 'content_hash'),
    )


class ArtifactReference(Base):
    """
    Immutable artifact reference table for constitutional lineage.
    
    Derives lineage from immutable events rather than mutable metadata.
    """
    __tablename__ = "artifact_references"

    id = Column(Integer, primary_key=True, autoincrement=True)
    from_artifact_id = Column(String(64), nullable=False, index=True)
    to_artifact_id = Column(String(64), nullable=False, index=True)
    reference_type = Column(String(50), nullable=False)  # "created_by", "references", "derived_from"
    event_id = Column(String(64), nullable=False, index=True)  # Event that created this reference
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    
    __table_args__ = (
        Index('ix_artifact_references_from', 'from_artifact_id'),
        Index('ix_artifact_references_to', 'to_artifact_id'),
        Index('ix_artifact_references_event', 'event_id'),
    )


class BuildWitness(Base):
    """
    Canonical build identity for constitutional replay verification.
    
    Stores the build witness containing git commit, registry hashes,
    and constitutional version to prove replay uses the same runtime constitution.
    """
    __tablename__ = "build_witnesses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    build_id = Column(String(64), unique=True, nullable=False, index=True)
    git_commit = Column(String(64), nullable=False)  # Git commit hash
    tool_registry_hash = Column(String(64), nullable=False)
    workflow_registry_hash = Column(String(64), nullable=False)
    prompt_registry_hash = Column(String(64), nullable=False)
    agent_registry_hash = Column(String(64), nullable=False)
    type_registry_hash = Column(String(64), nullable=False)
    serializer_hash = Column(String(64), nullable=False)
    reducer_hash = Column(String(64), nullable=False)
    capability_registry_hash = Column(String(64), nullable=False)  # Capability registry hash
    kernel_constitution_hash = Column(String(64), nullable=False)  # Kernel constitution hash
    constitutional_version = Column(String(20), nullable=False, default="1.0.0")
    build_timestamp = Column(DateTime(timezone=True), nullable=False)
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    
    __table_args__ = (
        Index('ix_build_witnesses_commit', 'git_commit'),
    )


class ConstitutionalMigration(Base):
    """
    Constitutional migration events for replayable system upgrades.
    
    Stores migration events as replayable events so a fresh node can
    reconstruct the entire system constitution by replaying migration events,
    just as it reconstructs domain state by replaying domain events.
    """
    __tablename__ = "constitutional_migrations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    migration_id = Column(String(64), unique=True, nullable=False, index=True)
    migration_type = Column(String(50), nullable=False)  # SchemaRegistered, ReducerUpgraded, ProjectionUpgraded, SnapshotInvalidated
    migration_name = Column(String(100), nullable=False)
    version = Column(String(20), nullable=False)
    description = Column(Text, nullable=True)
    migration_data = Column(JSON, nullable=False)  # Migration-specific data
    applied_at = Column(DateTime(timezone=True), nullable=False)
    rollback_data = Column(JSON, nullable=True)  # Data needed for rollback
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    
    __table_args__ = (
        Index('ix_constitutional_migrations_type', 'migration_type'),
        Index('ix_constitutional_migrations_name_version', 'migration_name', 'version'),
    )
