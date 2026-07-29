"""
Event API Module

Handles event-related HTTP endpoints.
Delegates to EventApplicationService for business logic.
"""

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from application.event_service import EventApplicationService
from api.dto import EventRequestDTO, EventResponseDTO, EventListResponseDTO

router = APIRouter(prefix="/events", tags=["events"])

# Application service (will be injected via DI)
_event_service: EventApplicationService = None


def set_event_service(service: EventApplicationService):
    """Set the event application service (DI)."""
    global _event_service
    _event_service = service


@router.post("", status_code=status.HTTP_201_CREATED, response_model=EventResponseDTO)
async def create_event(request: EventRequestDTO) -> EventResponseDTO:
    """Create an event with constitutional hashing and persistence."""
    return await _event_service.create_event(request)


@router.get("", response_model=EventListResponseDTO)
async def list_events(limit: int = 100, offset: int = 0) -> EventListResponseDTO:
    """List events from the event store."""
    from storage.postgres.database import get_session
    from storage.postgres.models import Event as EventModel
    from sqlalchemy import select
    
    events: list[dict] = []
    try:
        async with get_session() as session:
            result = await session.execute(
                select(EventModel).order_by(EventModel.global_sequence).limit(limit).offset(offset)
            )
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
    
    return EventListResponseDTO(events=events, count=len(events))
