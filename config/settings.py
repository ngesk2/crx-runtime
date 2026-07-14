"""
Configuration system using pydantic-settings.

Phase 14: REPLACE - Replace os.getenv() with pydantic-settings for type-safe, validated configuration.

This is infrastructure only - no constitutional code changes.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator
from typing import Optional


class Settings(BaseSettings):
    """
    Application settings with validation and type safety.
    
    Configuration is immutable after startup (frozen=True).
    
    Phase 15: Add configuration versioning and semantic validation.
    """
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        frozen=True,  # Immutable after startup
    )
    
    # Versioning (Phase 15 Item 9: Configuration Versioning)
    constitutional_version: str = Field(
        default="1.0.0",
        description="Constitutional runtime version"
    )
    config_version: str = Field(
        default="1.0.0",
        description="Configuration schema version"
    )
    build_version: str = Field(
        default="dev",
        description="Build version"
    )
    build_witness_hash: Optional[str] = Field(
        default=None,
        description="Build witness hash for replay verification"
    )
    
    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://constitutional:constitutional@localhost:5432/constitutional",
        description="PostgreSQL database URL"
    )
    database_pool_size: int = Field(
        default=10,
        ge=1,
        le=100,
        description="Database connection pool size"
    )
    database_max_overflow: int = Field(
        default=20,
        ge=0,
        le=100,
        description="Database connection pool max overflow"
    )
    database_pool_timeout: int = Field(
        default=30,
        ge=1,
        le=300,
        description="Database connection pool timeout in seconds"
    )
    database_pool_recycle: int = Field(
        default=3600,
        ge=0,
        description="Database connection pool recycle time in seconds"
    )
    
    # NATS
    nats_url: str = Field(
        default="nats://localhost:4222",
        description="NATS server URL"
    )
    nats_js_enabled: bool = Field(
        default=True,
        description="Enable JetStream for NATS"
    )
    nats_max_reconnects: int = Field(
        default=10,
        ge=0,
        description="Maximum NATS reconnection attempts"
    )
    nats_reconnect_wait: int = Field(
        default=2,
        ge=1,
        description="NATS reconnection wait time in seconds"
    )
    nats_timeout: int = Field(
        default=10,
        ge=1,
        description="NATS request timeout in seconds"
    )
    
    # API
    api_host: str = Field(
        default="0.0.0.0",
        description="API host"
    )
    api_port: int = Field(
        default=8000,
        ge=1,
        le=65535,
        description="API port"
    )
    api_workers: int = Field(
        default=1,
        ge=1,
        description="Number of API workers"
    )
    
    # Storage
    artifact_storage_path: str = Field(
        default="./artifacts",
        description="Local filesystem artifact storage path"
    )
    s3_bucket: Optional[str] = Field(
        default=None,
        description="S3 bucket for artifact storage"
    )
    s3_region: str = Field(
        default="us-east-1",
        description="S3 region"
    )
    s3_prefix: str = Field(
        default="",
        description="S3 key prefix"
    )
    
    # Logging
    log_level: str = Field(
        default="INFO",
        description="Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)"
    )
    log_format: str = Field(
        default="json",
        description="Log format (json, text)"
    )
    
    # Metrics
    metrics_enabled: bool = Field(
        default=True,
        description="Enable Prometheus metrics"
    )
    metrics_port: int = Field(
        default=9090,
        ge=1,
        le=65535,
        description="Prometheus metrics port"
    )
    
    @model_validator(mode="after")
    def validate_semantic_invariants(self) -> "Settings":
        """Validate semantic invariants (Phase 15 Item 11: Configuration Validation)"""
        # Validate pool_size > 0
        if self.database_pool_size <= 0:
            raise ValueError("database_pool_size must be > 0")
        
        # Validate max_overflow >= 0
        if self.database_max_overflow < 0:
            raise ValueError("database_max_overflow must be >= 0")
        
        # Validate timeout > reconnect_wait
        if self.nats_timeout <= self.nats_reconnect_wait:
            raise ValueError("nats_timeout must be > nats_reconnect_wait")
        
        # Validate metrics_port != api_port
        if self.metrics_port == self.api_port:
            raise ValueError("metrics_port must not equal api_port")
        
        return self


# Phase 15 Item 1: Remove Global Singletons
# Settings should be explicitly passed via dependency injection, not accessed via global singleton.
# Use: settings = Settings() or settings = Settings.load_from_env()

