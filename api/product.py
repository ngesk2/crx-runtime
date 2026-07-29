"""
Product API Module

Handles product layer HTTP endpoints.
Delegates to ProductApplicationService for business logic.
"""

from fastapi import APIRouter
from application.product_service import ProductApplicationService
from api.dto import (
    UnifiedCommandRequestDTO,
    UnifiedCommandResponseDTO,
    MarketingOSRequestDTO,
    MarketingOSResponseDTO,
    AIWorkspaceRequestDTO,
    AIWorkspaceResponseDTO,
    AutomationMarketplaceRequestDTO,
    AutomationMarketplaceResponseDTO,
    IndustryPacksRequestDTO,
    IndustryPacksResponseDTO,
    VisualOrchestrationRequestDTO,
    VisualOrchestrationResponseDTO,
    CompetitiveHarvestingRequestDTO,
    CompetitiveHarvestingResponseDTO,
)

router = APIRouter(tags=["product"])

# Application service (will be injected via DI)
_product_service: ProductApplicationService = None


def set_product_service(service: ProductApplicationService):
    """Set the product application service (DI)."""
    global _product_service
    _product_service = service


@router.post("/unified/command", response_model=UnifiedCommandResponseDTO)
async def unified_command(request: UnifiedCommandRequestDTO) -> UnifiedCommandResponseDTO:
    """
    Unified Command endpoint - command-first interface.
    
    Processes natural language commands and executes them via the constitutional runtime.
    Uses intent classification to route commands to appropriate subsystems.
    """
    return await _product_service.unified_command(request)


@router.post("/marketing/os", response_model=MarketingOSResponseDTO)
async def marketing_os(request: MarketingOSRequestDTO) -> MarketingOSResponseDTO:
    """
    Marketing Operating System endpoint.
    
    Provides campaign management, content engine, and marketing mission orchestration.
    All marketing operations are constitutional events projected to business metrics.
    """
    return await _product_service.marketing_os(request)


@router.post("/ai/workspace", response_model=AIWorkspaceResponseDTO)
async def ai_workspace(request: AIWorkspaceRequestDTO) -> AIWorkspaceResponseDTO:
    """
    AI Workspace endpoint - Buzz-style interaction model.
    
    Provides chat, canvas, tasks, evidence, timeline, knowledge, and automation components.
    All AI interactions are constitutional events for reproducibility and audit.
    """
    return await _product_service.ai_workspace(request)


@router.post("/automation/marketplace", response_model=AutomationMarketplaceResponseDTO)
async def automation_marketplace(request: AutomationMarketplaceRequestDTO) -> AutomationMarketplaceResponseDTO:
    """
    Automation Marketplace endpoint.
    
    Provides automation templates, mission steps, and event definitions.
    All automations are constitutional missions with event sourcing.
    """
    return await _product_service.automation_marketplace(request)


@router.post("/industry/packs", response_model=IndustryPacksResponseDTO)
async def industry_packs(request: IndustryPacksRequestDTO) -> IndustryPacksResponseDTO:
    """
    Industry Packs endpoint - vertical-specific operating systems.
    
    Provides industry-specific workflows, KPIs, dashboards, and automations.
    Industries: Roofing, HVAC, Plumbing, Landscaping, Cleaning, Electrical.
    """
    return await _product_service.industry_packs(request)


@router.post("/visual/orchestration", response_model=VisualOrchestrationResponseDTO)
async def visual_orchestration(request: VisualOrchestrationRequestDTO) -> VisualOrchestrationResponseDTO:
    """
    Visual Orchestration endpoint - mission orchestration interface.
    
    Provides mission visualization, mission inspector, mission builder, and debug mode.
    Inspired by Orca and Omniroute for visual mission orchestration.
    """
    return await _product_service.visual_orchestration(request)


@router.post("/competitive/harvesting", response_model=CompetitiveHarvestingResponseDTO)
async def competitive_harvesting(request: CompetitiveHarvestingRequestDTO) -> CompetitiveHarvestingResponseDTO:
    """
    Competitive Harvesting endpoint - monthly product review and harvesting framework.
    
    Provides product analysis templates for Buzz, Linear, Notion, Slack, Monday,
    HubSpot, ServiceTitan, Omniroute, Orca. Maintains backlog structure and priority scoring.
    """
    return await _product_service.competitive_harvesting(request)


@router.get("/ceo/homepage")
async def ceo_homepage():
    """
    CEO Homepage endpoint - business metrics dashboard.
    
    Provides executive-level view of business performance across:
    - Revenue metrics
    - Customer metrics
    - Operations metrics
    - Marketing metrics
    - AI-generated summary
    
    All metrics are projected from constitutional events.
    """
    from application.business_service import BusinessApplicationService
    return await _business_service.get_ceo_homepage()
