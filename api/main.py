from datetime import datetime
from typing import Any
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager

from constitution.models.event import EventEnvelope, DomainEvent, InfrastructureEvent
from constitution.models.command import Command
from storage.postgres.database import get_session
from storage.postgres.models import Event as EventModel
from storage.repositories import PostgresEventRepository
from transport.nats.transport import get_nats_transport, close_nats_transport
from config.settings import Settings
from config.logging import configure_logging, get_logger
from runtime.observability import Observability
from api.dto import (
    HealthResponseDTO,
    ReadyResponseDTO,
    EventRequestDTO,
    EventResponseDTO,
    CommandRequestDTO,
    CommandResponseDTO,
    EventListResponseDTO,
)

# Phase 15 Item 1: Remove Global Singletons
# Create explicit app factory instead of global app
def create_app(settings: Settings) -> FastAPI:
    """Create FastAPI app with explicit dependency injection (Phase 15 Item 1)"""
    
    # Configure logging
    configure_logging()
    logger = get_logger(__name__)
    
    # Create observability instance
    observability = Observability()
    
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        """Lifespan handler for startup/shutdown (Phase 14: REPLACE)"""
        # Startup
        logger.info("Starting Constitutional Runtime API", version="0.1.0")
        
        # Initialize NATS transport
        await get_nats_transport()
        logger.info("NATS transport initialized")
        
        yield
        
        # Shutdown
        logger.info("Shutting down Constitutional Runtime API")
        await close_nats_transport()
        logger.info("NATS transport closed")
    
    # Initialize FastAPI with lifespan handler
    app = FastAPI(
        title="Constitutional Runtime API",
        description="Event-sourced deterministic kernel API",
        version="0.1.0",
        lifespan=lifespan,
    )
    
    # Store settings and observability in app state for dependency injection
    app.state.settings = settings
    app.state.observability = observability
    app.state.logger = logger
    
    return app


# Create app with default settings (for backward compatibility)
# Phase 15: This should be replaced with explicit settings in production
default_settings = Settings()
app = create_app(default_settings)


# Phase 15 Item 3: Separate API DTOs from Constitutional Models
# Request/Response Models moved to api/dto.py
# Constitutional models are isolated from API serialization


# Blocking Defect 2: Delete _global_sequence
# Global sequence must always come from the database.
# Never maintain replay-visible ordering in memory.
# Ordering authority is only INSERT ... RETURNING global_sequence or database sequence.


# Endpoints
@app.get("/health", response_model=HealthResponseDTO)
async def health(request) -> HealthResponseDTO:
    """Live health check - delegates to runtime dependency state (not static)."""
    deps: dict[str, bool] = {}
    try:
        async with get_session() as session:
            await session.execute("SELECT 1")
        deps["postgres"] = True
    except Exception:
        deps["postgres"] = False
    try:
        nats_transport = await get_nats_transport()
        deps["nats"] = await nats_transport.health_check()
    except Exception:
        deps["nats"] = False
    status = "healthy" if all(deps.values()) else "degraded"
    return HealthResponseDTO(
        status=status,
        timestamp=datetime.utcnow(),
        dependencies=deps,
    )


@app.get("/ready", response_model=ReadyResponseDTO)
async def ready(request) -> ReadyResponseDTO:
    """Readiness check endpoint"""
    # Check PostgreSQL connection
    postgres_ready = False
    try:
        async with get_session() as session:
            await session.execute("SELECT 1")
            postgres_ready = True
    except Exception:
        postgres_ready = False
    
    # Check NATS connection
    nats_ready = False
    try:
        nats_transport = await get_nats_transport()
        nats_ready = await nats_transport.health_check()
    except Exception:
        nats_ready = False
    
    dependencies = {
        "postgres": postgres_ready,
        "nats": nats_ready,
    }
    
    all_ready = all(dependencies.values())
    
    return ReadyResponseDTO(
        status="ready" if all_ready else "not_ready",
        timestamp=datetime.utcnow(),
        dependencies=dependencies,
    )


@app.post("/events", response_model=EventResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_event(request: EventRequestDTO) -> EventResponseDTO:
    """Create and persist an event"""
    # Blocking Defect 2: Database-generated global sequence
    # Global sequence must come from database INSERT ... RETURNING global_sequence
    # For now, pass None and let database assign it (temporary, will be fixed with proper INSERT ... RETURNING)
    
    # Create event envelope (global_sequence will be assigned by database)
    event = EventEnvelope.create(
        event_type=request.event_type,
        event_category=request.event_category,  # type: ignore
        payload=request.payload,
        occurred_at=request.occurred_at,
        recorded_at=datetime.utcnow(),
        schema_version="1.0.0",
        global_sequence=0,  # Database will assign actual sequence via INSERT ... RETURNING
        correlation_id=request.correlation_id,
        causality_id=request.causality_id,
        producer_id=request.producer_id,
        caused_by_command_id=request.caused_by_command_id,
        aggregate_sequence=request.aggregate_sequence,
    )
    
    # Persist to PostgreSQL
    async with get_session() as session:
        from sqlalchemy import select
        
        # Check if event already exists
        existing = await session.execute(
            select(EventModel).where(EventModel.event_id == event.event_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Event {event.event_id} already exists"
            )
        
        # Create event record
        event_record = EventModel(
            event_id=event.event_id,
            event_type=event.event_type,
            event_category=event.event_category,
            payload=event.payload,
            occurred_at=event.occurred_at,
            recorded_at=event.recorded_at,
            processed_at=event.processed_at,
            correlation_id=event.correlation_id,
            causality_id=event.causality_id,
            producer_id=event.producer_id,
            caused_by_command_id=event.caused_by_command_id,
            schema_version=event.schema_version,
            global_sequence=event.global_sequence,
            aggregate_sequence=event.aggregate_sequence,
            event_hash=event.event_id,  # For now, same as event_id
        )
        
        session.add(event_record)
        await session.commit()
    
    # Publish to NATS (Phase 13: REPLACE IMMEDIATELY)
    try:
        nats_transport = await get_nats_transport()
        await nats_transport.publish(
            f"constitutional.events.{event.event_type}",
            event.model_dump(mode='json'),
        )
    except Exception as e:
        # Log error but don't fail the request (event is already persisted)
        logger.error("Failed to publish event to NATS", event_id=event.event_id, error=str(e))
    
    return EventResponseDTO(
        event_id=event.event_id,
        event_type=event.event_type,
        event_category=event.event_category,
        payload=event.payload,
        occurred_at=event.occurred_at,
        recorded_at=event.recorded_at,
        global_sequence=event.global_sequence,
    )


@app.post("/commands", status_code=status.HTTP_201_CREATED)
async def create_command(request: CommandRequestDTO) -> JSONResponse:
    """Create and persist a command"""
    # Create command
    command = Command.create(
        command_type=request.command_type,
        parameters=request.parameters,
        created_at=datetime.utcnow(),
        aggregate_id=request.aggregate_id,
        aggregate_version=request.aggregate_version,
    )
    
    # Persist to PostgreSQL
    async with get_session() as session:
        from storage.postgres.models import Command as CommandModel
        
        # Create command record
        command_record = CommandModel(
            command_id=command.command_id,
            command_type=command.command_type,
            parameters=command.parameters,
            aggregate_id=command.aggregate_id,
            created_at=command.created_at,
            status="created",
        )
        
        session.add(command_record)
        await session.commit()
    
    # Publish to NATS (Phase 13: REPLACE IMMEDIATELY)
    try:
        nats_transport = await get_nats_transport()
        await nats_transport.publish(
            "constitutional.commands",
            command.model_dump(mode='json'),
        )
    except Exception as e:
        # Log error but don't fail the request (command is already persisted)
        logger.error("Failed to publish command to NATS", command_id=command.command_id, error=str(e))
    
    return JSONResponse(
        content={"command_id": command.command_id, "status": "created"},
        status_code=status.HTTP_201_CREATED,
    )


@app.get("/events")
async def get_events(
    limit: int = 100,
    offset: int = 0,
    event_type: str | None = None,
) -> JSONResponse:
    """Get events from the event log"""
    async with get_session() as session:
        from sqlalchemy import select
        
        query = select(EventModel)
        
        if event_type:
            query = query.where(EventModel.event_type == event_type)
        
        query = query.order_by(EventModel.global_sequence).limit(limit).offset(offset)
        
        result = await session.execute(query)
        events = result.scalars().all()
        
        return JSONResponse(
            content={
                "events": [
                    {
                        "event_id": e.event_id,
                        "event_type": e.event_type,
                        "event_category": e.event_category,
                        "payload": e.payload,
                        "occurred_at": e.occurred_at.isoformat(),
                        "recorded_at": e.recorded_at.isoformat(),
                        "global_sequence": e.global_sequence,
                    }
                    for e in events
                ],
                "count": len(events),
            }
        )


@app.get("/replay")
async def replay(
    from_sequence: int = 0,
    to_sequence: int | None = None,
) -> JSONResponse:
    """Replay events from the event log"""
    async with get_session() as session:
        from sqlalchemy import select
        
        query = select(EventModel).where(EventModel.global_sequence >= from_sequence)
        
        if to_sequence:
            query = query.where(EventModel.global_sequence <= to_sequence)
        
        query = query.order_by(EventModel.global_sequence)
        
        result = await session.execute(query)
        events = result.scalars().all()
        
        # TODO: Implement actual replay logic with projection updates
        
        return JSONResponse(
            content={
                "replayed": len(events),
                "from_sequence": from_sequence,
                "to_sequence": to_sequence or events[-1].global_sequence if events else from_sequence,
                "events": [
                    {
                        "event_id": e.event_id,
                        "event_type": e.event_type,
                        "global_sequence": e.global_sequence,
                    }
                    for e in events
                ],
            }
        )


@app.get("/metrics")
async def metrics(request) -> JSONResponse:
    """Get runtime metrics (Phase 14: REPLACE - integrate with prometheus-client)"""
    from fastapi.responses import Response
    observability = request.app.state.observability
    metrics_data = observability.get_metrics()
    return Response(content=metrics_data, media_type="text/plain")


@app.get("/ops")
async def ops(request) -> JSONResponse:
    """Live operational state - exposes existing runtime telemetry (no new architecture)."""
    deps: dict[str, bool] = {}
    try:
        async with get_session() as session:
            await session.execute("SELECT 1")
        deps["postgres"] = True
    except Exception:
        deps["postgres"] = False
    try:
        nats_transport = await get_nats_transport()
        deps["nats"] = await nats_transport.health_check()
    except Exception:
        deps["nats"] = False

    event_count = 0
    last_seq = 0
    try:
        async with get_session() as session:
            from sqlalchemy import select, func
            result = await session.execute(select(func.count()).select_from(EventModel))
            event_count = result.scalar() or 0
            result2 = await session.execute(select(func.max(EventModel.global_sequence)))
            last_seq = result2.scalar() or 0
    except Exception:
        pass

    observability = request.app.state.observability
    metrics = observability.get_metrics()
    status = "operational" if all(deps.values()) else "degraded"
    return JSONResponse(content={
        "status": status,
        "timestamp": datetime.utcnow().isoformat(),
        "event_count": event_count,
        "last_global_sequence": last_seq,
        "replay_available": True,
        "dependencies": deps,
        "metrics_sample": (metrics[:500] if metrics else ""),
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.api_host, port=settings.api_port)
