"""
Business API Module

Handles business intelligence and CEO dashboard HTTP endpoints.
Delegates to BusinessApplicationService for business logic.
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from application.business_service import BusinessApplicationService
from api.dto import CEOHomepageResponseDTO, BusinessIntelligenceRequestDTO, BusinessIntelligenceResponseDTO

router = APIRouter(prefix="/business", tags=["business"])

# Application service (will be injected via DI)
_business_service: BusinessApplicationService = None


def set_business_service(service: BusinessApplicationService):
    """Set the business application service (DI)."""
    global _business_service
    _business_service = service


@router.get("/homepage", response_model=CEOHomepageResponseDTO)
async def ceo_homepage() -> CEOHomepageResponseDTO:
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
    return await _business_service.get_ceo_homepage()


@router.post("/intelligence", response_model=BusinessIntelligenceResponseDTO)
async def business_intelligence(request: BusinessIntelligenceRequestDTO) -> BusinessIntelligenceResponseDTO:
    """
    Business Intelligence endpoint - exposes business answers, not raw graph.
    
    Provides pre-built questions and templates across revenue, customer, operational,
    marketing, and project analysis. All answers are projected from constitutional events.
    """
    return await _business_service.answer_business_question(request)


@router.get("")
async def business() -> JSONResponse:
    """Business health models projected from canonical events (Operational Intelligence).

    Exposes DECISIONS (health status), not raw metric classes.
    """
    from storage.postgres.database import get_session
    from storage.postgres.models import Event as EventModel
    from sqlalchemy import select, func
    from analytics.business_projections import compute_business_facts, compute_business_signals, compute_health_models, prioritize_health
    
    events: list[dict] = []
    try:
        async with get_session() as session:
            result = await session.execute(select(EventModel).order_by(EventModel.global_sequence).limit(100))
            event_records = result.scalars().all()
            
            for event in event_records:
                events.append({
                    "event_id": event.event_id,
                    "event_type": event.event_type,
                    "event_category": event.event_category,
                    "payload": event.decoded_payload_cache,
                    "occurred_at": event.occurred_at.isoformat() if event.occurred_at else None,
                    "recorded_at": event.recorded_at.isoformat() if event.recorded_at else None,
                    "global_sequence": event.global_sequence,
                })
    except Exception:
        pass
    
    # Compute business facts from events
    facts = compute_business_facts(events)
    signals = compute_business_signals(events)
    health_models = compute_health_models(facts, signals)
    prioritized = prioritize_health(health_models)
    
    return JSONResponse(content={
        "status": "operational",
        "timestamp": events[0]["recorded_at"] if events else None,
        "event_count": len(events),
        "health_decisions": prioritized,
    })
