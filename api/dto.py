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


class OracleReviewRequestDTO(BaseModel):
    """Oracle review request DTO"""
    candidate_code: str
    context: Optional[dict[str, Any]] = None


class OracleReviewResponseDTO(BaseModel):
    """Oracle review response DTO"""
    review_id: str
    candidate_code_id: str
    decision: str
    reviewed_at: str
    reviewed_by: str
    reasoning: str
    security_findings: list[str]
    compliance_findings: list[str]
    metadata: dict[str, Any]


class CEOHomepageResponseDTO(BaseModel):
    """CEO Homepage response DTO"""
    revenue: dict[str, Any]
    customers: dict[str, Any]
    operations: dict[str, Any]
    marketing: dict[str, Any]
    ai_summary: str
    timestamp: datetime


class UnifiedCommandRequestDTO(BaseModel):
    """Unified Command request DTO"""
    command: str
    context: Optional[dict[str, Any]] = None


class UnifiedCommandResponseDTO(BaseModel):
    """Unified Command response DTO"""
    command_id: str
    intent: str
    execution_plan: dict[str, Any]
    result: dict[str, Any]
    status: str
    timestamp: datetime


class MarketingOSRequestDTO(BaseModel):
    """Marketing OS request DTO"""
    action: str
    campaign_id: Optional[str] = None
    parameters: Optional[dict[str, Any]] = None


class MarketingOSResponseDTO(BaseModel):
    """Marketing OS response DTO"""
    action: str
    campaign_id: Optional[str]
    result: dict[str, Any]
    status: str
    timestamp: datetime


class AIWorkspaceRequestDTO(BaseModel):
    """AI Workspace request DTO"""
    action: str
    workspace_id: Optional[str] = None
    parameters: Optional[dict[str, Any]] = None


class AIWorkspaceResponseDTO(BaseModel):
    """AI Workspace response DTO"""
    action: str
    workspace_id: Optional[str]
    result: dict[str, Any]
    status: str
    timestamp: datetime


class AutomationMarketplaceRequestDTO(BaseModel):
    """Automation Marketplace request DTO"""
    action: str
    automation_id: Optional[str] = None
    parameters: Optional[dict[str, Any]] = None


class AutomationMarketplaceResponseDTO(BaseModel):
    """Automation Marketplace response DTO"""
    action: str
    automation_id: Optional[str]
    result: dict[str, Any]
    status: str
    timestamp: datetime


class IndustryPacksRequestDTO(BaseModel):
    """Industry Packs request DTO"""
    action: str
    industry: Optional[str] = None
    parameters: Optional[dict[str, Any]] = None


class IndustryPacksResponseDTO(BaseModel):
    """Industry Packs response DTO"""
    action: str
    industry: Optional[str]
    result: dict[str, Any]
    status: str
    timestamp: datetime


class VisualOrchestrationRequestDTO(BaseModel):
    """Visual Orchestration request DTO"""
    action: str
    mission_id: Optional[str] = None
    parameters: Optional[dict[str, Any]] = None


class VisualOrchestrationResponseDTO(BaseModel):
    """Visual Orchestration response DTO"""
    action: str
    mission_id: Optional[str]
    result: dict[str, Any]
    status: str
    timestamp: datetime


class BusinessIntelligenceRequestDTO(BaseModel):
    """Business Intelligence request DTO"""
    question: str
    parameters: Optional[dict[str, Any]] = None


class BusinessIntelligenceResponseDTO(BaseModel):
    """Business Intelligence response DTO"""
    question: str
    answer: str
    data_sources: list[str]
    confidence: float
    timestamp: datetime


class CompetitiveHarvestingRequestDTO(BaseModel):
    """Competitive Harvesting request DTO"""
    action: str
    product: Optional[str] = None
    parameters: Optional[dict[str, Any]] = None


class CompetitiveHarvestingResponseDTO(BaseModel):
    """Competitive Harvesting response DTO"""
    action: str
    product: Optional[str]
    result: dict[str, Any]
    status: str
    timestamp: datetime
