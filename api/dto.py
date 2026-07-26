"""
API Data Transfer Objects (DTOs).

Phase 15 Item 3: Separate API DTOs from Constitutional Models - introduce mapper layer.

This is infrastructure only - no constitutional code changes.
API DTOs are isolated from constitutional models.
"""

from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Any


class HealthResponseDTO(BaseModel):
    """Health check response DTO"""
    status: str
    timestamp: datetime
    dependencies: Optional[dict[str, bool]] = None


class ReadyResponseDTO(BaseModel):
    """Readiness check response DTO"""
    status: str
    timestamp: datetime
    dependencies: dict[str, bool]


class EventRequestDTO(BaseModel):
    """Event creation request DTO"""
    event_type: str
    event_category: str
    payload: dict[str, Any]
    occurred_at: datetime
    correlation_id: Optional[str] = None
    causality_id: Optional[str] = None
    producer_id: Optional[str] = None
    caused_by_command_id: Optional[str] = None
    aggregate_sequence: Optional[int] = None


class EventResponseDTO(BaseModel):
    """Event response DTO"""
    event_id: str
    event_type: str
    event_category: str
    payload: dict[str, Any]
    occurred_at: datetime
    recorded_at: datetime
    global_sequence: int


class CommandRequestDTO(BaseModel):
    """Command creation request DTO"""
    command_type: str
    parameters: dict[str, Any]
    aggregate_id: Optional[str] = None
    aggregate_version: Optional[int] = None


class CommandResponseDTO(BaseModel):
    """Command response DTO"""
    command_id: str
    status: str


class EventListResponseDTO(BaseModel):
    """Event list response DTO"""
    events: list[dict[str, Any]]
    count: int


class MetricsResponseDTO(BaseModel):
    """Metrics response DTO"""
    metrics: str  # Prometheus metrics as text
