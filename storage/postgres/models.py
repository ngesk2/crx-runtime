from datetime import datetime
from sqlalchemy import JSON, Column, DateTime, Integer, BigInteger, String, Text, Index, Boolean, LargeBinary, Sequence
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

# Database sequence for global_sequence (append-only ordering)
global_sequence_seq = Sequence('global_sequence_seq', start=1, increment=1, metadata=Base.metadata)


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(64), unique=True, nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    event_category = Column(String(50), nullable=False)  # DomainEvent or InfrastructureEvent
    decoded_payload_cache = Column(JSON, nullable=True)  # Optional decoded cache (not constitutional authority)

    # Constitutional storage (canonical bytes + hash)
    canonical_payload_bytes = Column(LargeBinary, nullable=False)  # Canonical bytes of payload
    canonical_payload_hash = Column(String(64), nullable=False, index=True)  # Hash of canonical bytes

    # Envelope fields
    occurred_at = Column(DateTime(timezone=True), nullable=False)
    recorded_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    correlation_id = Column(String(64), nullable=True, index=True)
    causality_id = Column(String(64), nullable=True, index=True)  # Causal ordering (constitutional)
    producer_id = Column(String(64), nullable=True)
    caused_by_command_id = Column(String(64), nullable=True, index=True)
    schema_version = Column(String(20), nullable=False)

    # Append-only ordering via database sequence
    # global_sequence is assigned by the database sequence for replay safety
    global_sequence = Column(BigInteger, server_default=global_sequence_seq.next_value(), nullable=False, unique=True, index=True)
    aggregate_sequence = Column(Integer, nullable=True)  # Non-constitutional aggregate order

    # Optimistic concurrency control
    aggregate_version = Column(Integer, nullable=False, default=1)  # Version for optimistic concurrency
    stream_version = Column(Integer, nullable=False, default=1)  # Stream version for ordering
    
    # Hash
    event_hash = Column(String(64), nullable=False, unique=True, index=True)  # Deterministic tie-breaking
    build_witness_hash = Column(String(64), nullable=True, index=True)  # BuildWitness used when event was created (MVP: nullable)
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    
    __table_args__ = (
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
    # Canonical bytes stored as binary (not TEXT) - constitutional storage
    canonical_state_bytes = Column(LargeBinary, nullable=False)  # Canonical bytes of state (binary storage)
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
    decoded_parameters_cache = Column(JSON, nullable=True)  # Optional decoded cache (not constitutional authority)
    
    # Constitutional storage (canonical bytes + hash)
    canonical_parameters_bytes = Column(LargeBinary, nullable=False)  # Canonical bytes of parameters
    canonical_parameters_hash = Column(String(64), nullable=False, index=True)  # Hash of canonical bytes
    
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
    decoded_payload_cache = Column(JSON, nullable=True)  # Optional decoded cache (not constitutional authority)
    
    # Constitutional storage (canonical bytes + hash)
    canonical_payload_bytes = Column(LargeBinary, nullable=False)  # Canonical bytes of payload
    canonical_payload_hash = Column(String(64), nullable=False, index=True)  # Hash of canonical bytes
    
    correlation_id = Column(String(64), nullable=True, index=True)
    processed = Column(Boolean, nullable=False, default=False)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Production-safe leasing (like Temporal, Kafka, SQS visibility timeout)
    leased_until = Column(DateTime(timezone=True), nullable=True, index=True)
    worker_id = Column(String(64), nullable=True, index=True)
    heartbeat = Column(DateTime(timezone=True), nullable=True)
    attempt_count = Column(Integer, nullable=False, default=0)
    next_attempt_at = Column(DateTime(timezone=True), nullable=True, index=True)
    dead_letter_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    
    __table_args__ = (
        Index('ix_outbox_processed', 'processed', 'created_at'),
        Index('ix_outbox_leased', 'leased_until', 'next_attempt_at'),
    )


class InboxMessage(Base):
    """
    Inbox pattern for webhook deduplication and idempotency.
    
    Every webhook provider eventually redelivers. This table ensures:
    - Idempotency via UNIQUE constraint on provider_request_id
    - Webhook deduplication across provider redeliveries
    - Processing status tracking
    - Constitutional evidence of webhook receipt
    """
    __tablename__ = "inbox_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    provider_name = Column(String(50), nullable=False, index=True)  # "kit", "twilio", etc.
    provider_request_id = Column(String(255), nullable=False, index=True)  # Provider's request ID (UNIQUE for idempotency)
    webhook_type = Column(String(100), nullable=False, index=True)  # "subscriber.activated", "message.delivered", etc.
    payload = Column(JSON, nullable=False)  # Original webhook payload
    processed = Column(Boolean, nullable=False, default=False, index=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    processing_status = Column(String(50), nullable=True)  # "pending", "processed", "failed"
    error_message = Column(Text, nullable=True)
    
    # Constitutional tracking
    correlation_id = Column(String(64), nullable=True, index=True)
    causality_id = Column(String(64), nullable=True, index=True)
    build_witness_hash = Column(String(64), nullable=False, index=True)
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    
    __table_args__ = (
        # UNIQUE constraint for idempotency - prevents duplicate webhook processing
        Index('ix_inbox_provider_request_id', 'provider_name', 'provider_request_id', unique=True),
        Index('ix_inbox_processed', 'processed', 'created_at'),
        Index('ix_inbox_webhook_type', 'webhook_type'),
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
    """
    Immutable artifact for constitutional storage.
    
    Lineage is derived from immutable ArtifactReference events,
    not from mutable metadata.
    """
    __tablename__ = "artifacts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    artifact_id = Column(String(64), unique=True, nullable=False, index=True)
    content_type = Column(String(100), nullable=False)
    
    # Constitutional storage (canonical bytes + hash)
    canonical_content_bytes = Column(LargeBinary, nullable=False)  # Canonical bytes of content
    canonical_content_hash = Column(String(64), nullable=False, index=True)  # Hash of canonical bytes
    
    size = Column(Integer, nullable=False)
    artifact_metadata = Column(JSON, nullable=True)  # Non-constitutional metadata (optional cache)
    # storage_location removed - handled by adapter only
    
    # Constitutional tracking
    created_by_event_id = Column(String(64), nullable=True, index=True)  # Event that created this artifact
    build_witness_hash = Column(String(64), nullable=False, index=True)  # BuildWitness when artifact was created
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    
    __table_args__ = (
        Index('ix_artifacts_content_hash', 'canonical_content_hash'),
        Index('ix_artifacts_created_by', 'created_by_event_id'),
    )


class ArtifactReference(Base):
    """
    Immutable artifact reference for constitutional lineage DAG.
    
    Derives lineage from immutable events rather than mutable metadata.
    
    Every artifact reference is an immutable constitutional fact recorded by an event.
    Lineage is reconstructed by walking the DAG of these immutable references.
    """
    __tablename__ = "artifact_references"

    id = Column(Integer, primary_key=True, autoincrement=True)
    reference_id = Column(String(64), unique=True, nullable=False, index=True)  # Canonical reference ID
    from_artifact_id = Column(String(64), nullable=False, index=True)  # Source artifact
    to_artifact_id = Column(String(64), nullable=False, index=True)  # Target artifact
    reference_type = Column(String(50), nullable=False)  # "created_by", "references", "derived_from"
    
    # Constitutional tracking
    event_id = Column(String(64), nullable=False, index=True)  # Event that created this reference
    reference_hash = Column(String(64), nullable=False, unique=True, index=True)  # Canonical hash of reference
    build_witness_hash = Column(String(64), nullable=False, index=True)  # BuildWitness when reference was created
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    
    __table_args__ = (
        Index('ix_artifact_references_from', 'from_artifact_id'),
        Index('ix_artifact_references_to', 'to_artifact_id'),
        Index('ix_artifact_references_event', 'event_id'),
        Index('ix_artifact_references_type', 'reference_type'),
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
    configuration_witness_hash = Column(String(64), nullable=False, index=True)  # Configuration witness hash
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
