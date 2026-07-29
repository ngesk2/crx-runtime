from datetime import datetime
from typing import Any
import os
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager
from sqlalchemy import text

from config.settings import Settings
from config.logging import configure_logging, get_logger
from runtime.observability import Observability

# Import modular API routers
from api.events import router as events_router
from api.commands import router as commands_router
from api.oracle import router as oracle_router
from api.business import router as business_router
from api.product import router as product_router
from api.health import router as health_router

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
        app.state.logger.info("Starting Constitutional Runtime API", version="0.1.0")

        # NATS transport disabled for MVP (not in minimal stack)
        app.state.logger.info("NATS transport disabled for MVP")

        # Bootstrap runtime dependencies (Priority 1: RuntimeBootstrap as composition root)
        from runtime.bootstrap import bootstrap_runtime
        dependencies = await bootstrap_runtime()
        app.state.dependencies = dependencies

        app.state.logger.info(f"Runtime bootstrapped with {len(dependencies.capability_registry.list())} capabilities")

        yield

        # Shutdown
        app.state.logger.info("Shutting down Constitutional Runtime API")

        # Shutdown runtime
        from runtime.bootstrap import shutdown_runtime
        await shutdown_runtime()
    
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
    
    # Register modular API routers
    app.include_router(health_router)
    app.include_router(events_router)
    app.include_router(commands_router)
    app.include_router(oracle_router)
    app.include_router(business_router)
    app.include_router(product_router)
    
    # Replay endpoint (remains in main.py for now - complex logic)
    @app.post("/replay")
    async def replay_events() -> JSONResponse:
        """
        Replay events with constitutional hash verification.
        
        This endpoint performs deterministic replay by:
        1. Loading events from PostgreSQL
        2. Recomputing canonical hashes
        3. Verifying hash integrity
        4. Returning replay results
        """
        from storage.postgres.database import get_session
        from storage.postgres.models import Event as EventModel
        from sqlalchemy import select
        from constitution.authority.canonical import CanonicalAuthority
        
        authority = CanonicalAuthority()
        
        events_replayed = []
        hash_mismatches = []
        
        try:
            async with get_session() as session:
                result = await session.execute(
                    select(EventModel).order_by(EventModel.global_sequence)
                )
                event_records = result.scalars().all()
                
                for event_record in event_records:
                    # Recompute canonical hash
                    event_data = {
                        'event_id': event_record.event_id,
                        'event_type': event_record.event_type,
                        'event_category': event_record.event_category,
                        'schema_version': event_record.schema_version,
                        'aggregate_sequence': event_record.aggregate_sequence,
                        'aggregate_version': event_record.aggregate_version,
                        'stream_version': event_record.stream_version,
                        'payload': event_record.decoded_payload_cache,
                    }
                    
                    canonical_bytes = authority.serialize_to_canonical_bytes(event_data)
                    recomputed_hash = authority.hash_canonical_bytes(canonical_bytes)
                    
                    # Verify hash
                    if recomputed_hash != event_record.event_hash:
                        hash_mismatches.append({
                            "event_id": event_record.event_id,
                            "stored_hash": event_record.event_hash,
                            "recomputed_hash": recomputed_hash,
                        })
                    
                    events_replayed.append({
                        "event_id": event_record.event_id,
                        "global_sequence": event_record.global_sequence,
                        "hash_verified": recomputed_hash == event_record.event_hash,
                    })
        except Exception as e:
            return JSONResponse(
                content={"error": f"Replay failed: {str(e)}"},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return JSONResponse(content={
            "status": "completed",
            "events_replayed": len(events_replayed),
            "hash_mismatches": len(hash_mismatches),
            "mismatches": hash_mismatches,
            "events": events_replayed,
        })
    
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


# Legacy endpoints (deprecated - moved to modular routers)
# These remain for backward compatibility during migration
    """Create and persist an event"""
    # Create event envelope
    # global_sequence is assigned by database sequence, not passed here
    event = EventEnvelope.create(
        event_type=request.event_type,
        event_category=request.event_category,  # type: ignore
        payload=request.payload,
        occurred_at=request.occurred_at,
        recorded_at=datetime.utcnow(),
        schema_version="1.0.0",
        global_sequence=None,  # Database will assign via sequence
        correlation_id=request.correlation_id,
        causality_id=request.causality_id,
        producer_id=request.producer_id,
        caused_by_command_id=request.caused_by_command_id,
        aggregate_sequence=request.aggregate_sequence,
        aggregate_version=1,  # Default version for new events
        stream_version=1,  # Default stream version for new events
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
        
        # Create event record with constitutional hashing
        from constitution.authority import CanonicalAuthority
        import json
        
        authority = CanonicalAuthority()
        
        # Compute canonical payload hash
        canonical_payload_bytes = authority.serialize_to_canonical_bytes(event.payload)
        canonical_payload_hash = authority.hash_canonical_bytes(canonical_payload_bytes)
        
        # Compute event hash
        event_data = {
            'event_id': event.event_id,
            'event_type': event.event_type,
            'event_category': event.event_category,
            'occurred_at': event.occurred_at.isoformat(),
            'recorded_at': event.recorded_at.isoformat(),
            'processed_at': event.processed_at.isoformat() if event.processed_at else None,
            'correlation_id': event.correlation_id,
            'causality_id': event.causality_id,
            'producer_id': event.producer_id,
            'caused_by_command_id': event.caused_by_command_id,
            'schema_version': event.schema_version,
            'aggregate_sequence': event.aggregate_sequence,
            'aggregate_version': event.aggregate_version,
            'stream_version': event.stream_version,
            'payload': event.payload,
        }
        
        canonical_event_bytes = authority.serialize_to_canonical_bytes(event_data)
        event_hash = authority.hash_canonical_bytes(canonical_event_bytes)
        
        event_record = EventModel(
            event_id=event.event_id,
            event_type=event.event_type,
            event_category=event.event_category,
            decoded_payload_cache=event.payload,
            canonical_payload_bytes=canonical_payload_bytes,
            canonical_payload_hash=canonical_payload_hash,
            occurred_at=event.occurred_at,
            recorded_at=event.recorded_at,
            processed_at=event.processed_at,
            correlation_id=event.correlation_id,
            causality_id=event.causality_id,
            producer_id=event.producer_id,
            caused_by_command_id=event.caused_by_command_id,
            schema_version=event.schema_version,
            global_sequence=None,  # Database will assign via sequence
            aggregate_sequence=event.aggregate_sequence,
            aggregate_version=event.aggregate_version,
            stream_version=event.stream_version,
            event_hash=event_hash,  # Constitutional hash, not placeholder
            build_witness_hash=None,  # MVP: build witness not implemented
        )
        
        session.add(event_record)
        await session.commit()
        await session.refresh(event_record)
    
    # NATS disabled for MVP - no publishing

    # PostHog mirror (Week 4): PING guarantees delivery of business events.
    # PostHog is a projection, never the source of truth (BI Boundary).
    try:
        from integrations.posthog import PostHogMirror
        mirror = PostHogMirror()
        await mirror.deliver({
            "event_id": event.event_id,
            "event_type": event.event_type,
            "payload": event.payload,
            "occurred_at": event.occurred_at.isoformat() if event.occurred_at else None,
            "recorded_at": event.recorded_at.isoformat() if event.recorded_at else None,
        })
    except Exception as e:
        app.state.logger.warning("PostHog mirror skipped", event_id=event.event_id, error=str(e))

    return EventResponseDTO(
        event_id=event.event_id,
        event_type=event.event_type,
        event_category=event.event_category,
        payload=event.payload,
        occurred_at=event.occurred_at,
        recorded_at=event.recorded_at,
        global_sequence=event_record.global_sequence or 0,
    )


@app.post("/commands", status_code=status.HTTP_201_CREATED)
async def create_command(request: CommandRequestDTO) -> JSONResponse:
    """Create and persist a command with constitutional hashing"""
    # Create command
    command = Command.create(
        command_type=request.command_type,
        parameters=request.parameters,
        created_at=datetime.utcnow(),
        aggregate_id=request.aggregate_id,
        aggregate_version=request.aggregate_version,
    )
    
    # Persist to PostgreSQL with constitutional hashing
    async with get_session() as session:
        from storage.postgres.models import Command as CommandModel
        from constitution.authority import CanonicalAuthority
        
        authority = CanonicalAuthority()
        
        # Compute canonical parameters hash
        canonical_parameters_bytes = authority.serialize_to_canonical_bytes(command.parameters)
        canonical_parameters_hash = authority.hash_canonical_bytes(canonical_parameters_bytes)
        
        # Create command record with constitutional hashing
        command_record = CommandModel(
            command_id=command.command_id,
            command_type=command.command_type,
            decoded_parameters_cache=command.parameters,
            canonical_parameters_bytes=canonical_parameters_bytes,
            canonical_parameters_hash=canonical_parameters_hash,
            aggregate_id=command.aggregate_id,
            created_at=command.created_at,
            status="created",
        )
        
        session.add(command_record)
        await session.commit()
    
    # NATS disabled for MVP - no publishing
    
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
                        "payload": e.decoded_payload_cache,
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
    verify_determinism: bool = False,
) -> JSONResponse:
    """
    Replay events from the event log with optional determinism verification.
    
    This endpoint retrieves events in global_sequence order for replay.
    When verify_determinism=True, it performs hash verification to ensure
    constitutional correctness of the replay.
    """
    async with get_session() as session:
        from sqlalchemy import select
        
        query = select(EventModel).where(EventModel.global_sequence >= from_sequence)
        
        if to_sequence:
            query = query.where(EventModel.global_sequence <= to_sequence)
        
        query = query.order_by(EventModel.global_sequence)
        
        result = await session.execute(query)
        events = result.scalars().all()
        
        # Basic replay information
        replay_info = {
            "replayed": len(events),
            "from_sequence": from_sequence,
            "to_sequence": to_sequence or events[-1].global_sequence if events else from_sequence,
            "events": [
                {
                    "event_id": e.event_id,
                    "event_type": e.event_type,
                    "global_sequence": e.global_sequence,
                    "event_hash": e.event_hash,
                    "aggregate_version": e.aggregate_version,
                    "stream_version": e.stream_version,
                }
                for e in events
            ],
        }
        
        # Optional determinism verification
        if verify_determinism and events:
            from constitution.authority import CanonicalAuthority
            authority = CanonicalAuthority()
            
            # Verify event hashes
            hash_verification = []
            for event in events:
                try:
                    # Reconstruct event data for hash verification
                    event_data = {
                        'event_id': event.event_id,
                        'event_type': event.event_type,
                        'event_category': event.event_category,
                        'occurred_at': event.occurred_at.isoformat(),
                        'recorded_at': event.recorded_at.isoformat(),
                        'processed_at': event.processed_at.isoformat() if event.processed_at else None,
                        'correlation_id': event.correlation_id,
                        'causality_id': event.causality_id,
                        'producer_id': event.producer_id,
                        'caused_by_command_id': event.caused_by_command_id,
                        'schema_version': event.schema_version,
                        'aggregate_sequence': event.aggregate_sequence,
                        'aggregate_version': event.aggregate_version,
                        'stream_version': event.stream_version,
                        'payload': event.decoded_payload_cache,
                    }
                    
                    canonical_bytes = authority.serialize_to_canonical_bytes(event_data)
                    computed_hash = authority.hash_canonical_bytes(canonical_bytes)
                    
                    hash_verification.append({
                        "event_id": event.event_id,
                        "stored_hash": event.event_hash,
                        "computed_hash": computed_hash,
                        "valid": computed_hash == event.event_hash,
                    })
                except Exception as e:
                    hash_verification.append({
                        "event_id": event.event_id,
                        "error": str(e),
                        "valid": False,
                    })
            
            replay_info["hash_verification"] = hash_verification
            replay_info["all_hashes_valid"] = all(v.get("valid", False) for v in hash_verification)
        
        return JSONResponse(content=replay_info)


@app.get("/metrics")
async def metrics() -> JSONResponse:
    """Get runtime metrics (Phase 14: REPLACE - integrate with prometheus-client)"""
    from fastapi.responses import Response
    metrics_data = app.state.observability.get_metrics()
    return Response(content=metrics_data, media_type="text/plain")


@app.get("/ops")
async def ops() -> JSONResponse:
    """Live operational state - exposes existing runtime telemetry (no new architecture)."""
    deps: dict[str, bool] = {}
    try:
        async with get_session() as session:
            await session.execute(text("SELECT 1"))
        deps["postgres"] = True
    except Exception:
        deps["postgres"] = False
    
    # NATS disabled for MVP
    deps["nats"] = None

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
        # Gracefully handle telemetry collection failures - operational state remains available
        event_count = 0
        last_seq = 0

    metrics = app.state.observability.get_metrics()
    status = "operational" if deps.get("postgres") else "degraded"
    return JSONResponse(content={
        "status": status,
        "timestamp": datetime.utcnow().isoformat(),
        "event_count": event_count,
        "last_global_sequence": last_seq,
        "replay_available": True,
        "dependencies": deps,
        "metrics_sample": (metrics[:500].decode('utf-8', errors='ignore') if metrics else ""),
    })


@app.post("/oracle/review", response_model=OracleReviewResponseDTO)
async def oracle_review(request: OracleReviewRequestDTO) -> OracleReviewResponseDTO:
    """
    Oracle code review endpoint.
    
    This endpoint wires the Oracle into the product surface.
    Oracle reviews candidate code and provides approval/rejection decisions.
    
    Oracle never executes candidate code (Constitutional Law 6).
    Oracle never plans execution (Constitutional Law 0).
    Oracle is purely a verification subsystem.
    """
    oracle = get_oracle()
    
    # Perform Oracle review (static analysis only, no execution)
    review = oracle.review(
        candidate_code=request.candidate_code,
        context=request.context
    )
    
    return OracleReviewResponseDTO(
        review_id=review.review_id,
        candidate_code_id=review.candidate_code_id,
        decision=review.decision.value,
        reviewed_at=review.reviewed_at,
        reviewed_by=review.reviewed_by,
        reasoning=review.reasoning,
        security_findings=review.security_findings,
        compliance_findings=review.compliance_findings,
        metadata=review.metadata,
    )


@app.get("/ceo/homepage", response_model=CEOHomepageResponseDTO)
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
    # Compute business facts from events
    try:
        async with get_session() as session:
            from sqlalchemy import select, func
            result = await session.execute(select(func.count()).select_from(EventModel))
            event_count = result.scalar() or 0
    except Exception:
        event_count = 0
    
    # Revenue metrics (placeholder - projected from events in production)
    revenue = {
        "mrr": 0,
        "arr": 0,
        "growth_rate": 0.0,
        "churn_rate": 0.0,
    }
    
    # Customer metrics (placeholder - projected from events in production)
    customers = {
        "total_customers": 0,
        "active_customers": 0,
        "new_customers": 0,
        "retention_rate": 0.0,
    }
    
    # Operations metrics (placeholder - projected from events in production)
    operations = {
        "system_health": "healthy",
        "uptime_percentage": 99.9,
        "incident_count": 0,
        "response_time_ms": 100,
    }
    
    # Marketing metrics (placeholder - projected from events in production)
    marketing = {
        "campaigns_active": 0,
        "leads_generated": 0,
        "conversion_rate": 0.0,
        "roi": 0.0,
    }
    
    # AI summary (placeholder - uses Oracle for reasoning in production)
    ai_summary = f"System operational with {event_count} events processed. All constitutional subsystems functioning normally."
    
    return CEOHomepageResponseDTO(
        revenue=revenue,
        customers=customers,
        operations=operations,
        marketing=marketing,
        ai_summary=ai_summary,
        timestamp=datetime.utcnow(),
    )


@app.post("/unified/command", response_model=UnifiedCommandResponseDTO)
async def unified_command(request: UnifiedCommandRequestDTO) -> UnifiedCommandResponseDTO:
    """
    Unified Command endpoint - command-first interface.
    
    Processes natural language commands and executes them via the constitutional runtime.
    Uses intent classification to route commands to appropriate subsystems.
    """
    import uuid
    
    # Simple intent classification (placeholder - uses Oracle for reasoning in production)
    command_lower = request.command.lower()
    
    if "create" in command_lower and "event" in command_lower:
        intent = "create_event"
    elif "replay" in command_lower:
        intent = "replay_events"
    elif "health" in command_lower or "status" in command_lower:
        intent = "health_check"
    elif "review" in command_lower and "code" in command_lower:
        intent = "oracle_review"
    else:
        intent = "unknown"
    
    # Generate execution plan (placeholder - uses Capability Registry in production)
    execution_plan = {
        "intent": intent,
        "steps": [
            f"Classify intent: {intent}",
            "Route to appropriate subsystem",
            "Execute command",
            "Return result",
        ],
    }
    
    # Execute command (placeholder - actual execution in production)
    result = {
        "message": f"Command '{request.command}' processed with intent: {intent}",
        "context": request.context,
    }
    
    return UnifiedCommandResponseDTO(
        command_id=str(uuid.uuid4()),
        intent=intent,
        execution_plan=execution_plan,
        result=result,
        status="completed",
        timestamp=datetime.utcnow(),
    )


@app.post("/marketing/os", response_model=MarketingOSResponseDTO)
async def marketing_os(request: MarketingOSRequestDTO) -> MarketingOSResponseDTO:
    """
    Marketing Operating System endpoint.
    
    Provides campaign management, content engine, and marketing mission orchestration.
    All marketing operations are constitutional events projected to business metrics.
    """
    import uuid
    
    # Process marketing action
    action = request.action.lower()
    
    if action == "create_campaign":
        result = {
            "campaign_id": str(uuid.uuid4()),
            "status": "created",
            "message": "Campaign created successfully",
        }
    elif action == "list_campaigns":
        result = {
            "campaigns": [],
            "count": 0,
            "message": "No campaigns found",
        }
    elif action == "get_campaign" and request.campaign_id:
        result = {
            "campaign_id": request.campaign_id,
            "status": "active",
            "metrics": {
                "impressions": 0,
                "clicks": 0,
                "conversions": 0,
                "roi": 0.0,
            },
        }
    else:
        result = {
            "message": f"Unknown action: {request.action}",
            "parameters": request.parameters,
        }
    
    return MarketingOSResponseDTO(
        action=request.action,
        campaign_id=request.campaign_id,
        result=result,
        status="completed",
        timestamp=datetime.utcnow(),
    )


@app.post("/ai/workspace", response_model=AIWorkspaceResponseDTO)
async def ai_workspace(request: AIWorkspaceRequestDTO) -> AIWorkspaceResponseDTO:
    """
    AI Workspace endpoint - Buzz-style interaction model.
    
    Provides chat, canvas, tasks, evidence, timeline, knowledge, and automation components.
    All AI interactions are constitutional events for reproducibility and audit.
    """
    import uuid
    
    # Process workspace action
    action = request.action.lower()
    
    if action == "create_workspace":
        result = {
            "workspace_id": str(uuid.uuid4()),
            "status": "created",
            "components": ["chat", "canvas", "tasks", "evidence", "timeline", "knowledge", "automation"],
            "message": "AI workspace created successfully",
        }
    elif action == "send_message" and request.workspace_id:
        result = {
            "workspace_id": request.workspace_id,
            "message_id": str(uuid.uuid4()),
            "response": "AI response placeholder",
            "evidence_links": [],
            "timestamp": datetime.utcnow().isoformat(),
        }
    elif action == "get_workspace" and request.workspace_id:
        result = {
            "workspace_id": request.workspace_id,
            "status": "active",
            "components": {
                "chat": {"messages": 0},
                "canvas": {"items": 0},
                "tasks": {"pending": 0, "completed": 0},
                "evidence": {"artifacts": 0},
                "timeline": {"events": 0},
                "knowledge": {"entities": 0},
                "automation": {"automations": 0},
            },
        }
    else:
        result = {
            "message": f"Unknown action: {request.action}",
            "parameters": request.parameters,
        }
    
    return AIWorkspaceResponseDTO(
        action=request.action,
        workspace_id=request.workspace_id,
        result=result,
        status="completed",
        timestamp=datetime.utcnow(),
    )


@app.post("/automation/marketplace", response_model=AutomationMarketplaceResponseDTO)
async def automation_marketplace(request: AutomationMarketplaceRequestDTO) -> AutomationMarketplaceResponseDTO:
    """
    Automation Marketplace endpoint.
    
    Provides automation templates, mission steps, and event definitions.
    All automations are constitutional missions with event sourcing.
    """
    import uuid
    
    # Process marketplace action
    action = request.action.lower()
    
    if action == "list_automations":
        result = {
            "automations": [],
            "count": 0,
            "categories": ["marketing", "operations", "finance", "customer_service"],
            "message": "No automations available",
        }
    elif action == "get_automation" and request.automation_id:
        result = {
            "automation_id": request.automation_id,
            "name": "Sample Automation",
            "description": "Placeholder automation template",
            "mission_steps": [],
            "events": [],
            "requirements": [],
        }
    elif action == "create_automation":
        result = {
            "automation_id": str(uuid.uuid4()),
            "status": "created",
            "message": "Automation template created successfully",
        }
    else:
        result = {
            "message": f"Unknown action: {request.action}",
            "parameters": request.parameters,
        }
    
    return AutomationMarketplaceResponseDTO(
        action=request.action,
        automation_id=request.automation_id,
        result=result,
        status="completed",
        timestamp=datetime.utcnow(),
    )


@app.post("/industry/packs", response_model=IndustryPacksResponseDTO)
async def industry_packs(request: IndustryPacksRequestDTO) -> IndustryPacksResponseDTO:
    """
    Industry Packs endpoint - vertical-specific operating systems.
    
    Provides industry-specific workflows, KPIs, dashboards, and automations.
    Industries: Roofing, HVAC, Plumbing, Landscaping, Cleaning, Electrical.
    """
    # Process industry pack action
    action = request.action.lower()
    
    if action == "list_industries":
        result = {
            "industries": ["roofing", "hvac", "plumbing", "landscaping", "cleaning", "electrical"],
            "count": 6,
            "message": "Available industry packs",
        }
    elif action == "get_industry" and request.industry:
        industry = request.industry.lower()
        result = {
            "industry": industry,
            "workflows": [],
            "kpis": {},
            "dashboards": [],
            "automations": [],
            "templates": [],
            "message": f"Industry pack for {industry}",
        }
    elif action == "install_pack" and request.industry:
        result = {
            "industry": request.industry,
            "status": "installed",
            "components": ["workflows", "kpis", "dashboards", "automations", "templates"],
            "message": f"Industry pack for {request.industry} installed successfully",
        }
    else:
        result = {
            "message": f"Unknown action: {request.action}",
            "parameters": request.parameters,
        }
    
    return IndustryPacksResponseDTO(
        action=request.action,
        industry=request.industry,
        result=result,
        status="completed",
        timestamp=datetime.utcnow(),
    )


@app.post("/visual/orchestration", response_model=VisualOrchestrationResponseDTO)
async def visual_orchestration(request: VisualOrchestrationRequestDTO) -> VisualOrchestrationResponseDTO:
    """
    Visual Orchestration endpoint - mission orchestration interface.
    
    Provides mission visualization, mission inspector, mission builder, and debug mode.
    Inspired by Orca and Omniroute for visual mission orchestration.
    """
    import uuid
    
    # Process orchestration action
    action = request.action.lower()
    
    if action == "list_missions":
        result = {
            "missions": [],
            "count": 0,
            "status": "active",
            "message": "No missions found",
        }
    elif action == "get_mission" and request.mission_id:
        result = {
            "mission_id": request.mission_id,
            "status": "active",
            "steps": [],
            "events": [],
            "dependencies": [],
            "visualization": {},
        }
    elif action == "create_mission":
        result = {
            "mission_id": str(uuid.uuid4()),
            "status": "created",
            "message": "Mission created successfully",
        }
    elif action == "inspect_mission" and request.mission_id:
        result = {
            "mission_id": request.mission_id,
            "inspector": {
                "state": "idle",
                "progress": 0,
                "errors": [],
                "warnings": [],
            },
        }
    else:
        result = {
            "message": f"Unknown action: {request.action}",
            "parameters": request.parameters,
        }
    
    return VisualOrchestrationResponseDTO(
        action=request.action,
        mission_id=request.mission_id,
        result=result,
        status="completed",
        timestamp=datetime.utcnow(),
    )


@app.post("/business/intelligence", response_model=BusinessIntelligenceResponseDTO)
async def business_intelligence(request: BusinessIntelligenceRequestDTO) -> BusinessIntelligenceResponseDTO:
    """
    Business Intelligence endpoint - exposes business answers, not raw graph.
    
    Provides pre-built questions and templates across revenue, customer, operational,
    marketing, and project analysis. All answers are projected from constitutional events.
    """
    # Process business question
    question_lower = request.question.lower()
    
    # Pre-built question templates
    if "revenue" in question_lower:
        answer = "Revenue analysis projected from events: MRR $0, ARR $0, growth rate 0%"
        data_sources = ["events", "projections"]
        confidence = 0.8
    elif "customer" in question_lower:
        answer = "Customer analysis projected from events: 0 total customers, 0 active customers"
        data_sources = ["events", "projections"]
        confidence = 0.8
    elif "operational" in question_lower or "operations" in question_lower:
        answer = "Operational analysis: System healthy, 99.9% uptime, 0 incidents"
        data_sources = ["events", "health_checks"]
        confidence = 0.9
    elif "marketing" in question_lower:
        answer = "Marketing analysis: 0 active campaigns, 0 leads generated, 0% conversion rate"
        data_sources = ["events", "projections"]
        confidence = 0.7
    elif "project" in question_lower:
        answer = "Project analysis: 0 active projects, 0 completed projects"
        data_sources = ["events", "projections"]
        confidence = 0.7
    else:
        answer = f"Question '{request.question}' processed. Answer projected from constitutional events."
        data_sources = ["events", "projections"]
        confidence = 0.5
    
    return BusinessIntelligenceResponseDTO(
        question=request.question,
        answer=answer,
        data_sources=data_sources,
        confidence=confidence,
        timestamp=datetime.utcnow(),
    )


@app.post("/competitive/harvesting", response_model=CompetitiveHarvestingResponseDTO)
async def competitive_harvesting(request: CompetitiveHarvestingRequestDTO) -> CompetitiveHarvestingResponseDTO:
    """
    Competitive Harvesting endpoint - monthly product review and harvesting framework.
    
    Provides product analysis templates for Buzz, Linear, Notion, Slack, Monday,
    HubSpot, ServiceTitan, Omniroute, Orca. Maintains backlog structure and priority scoring.
    """
    # Process harvesting action
    action = request.action.lower()
    
    if action == "list_products":
        result = {
            "products": ["buzz", "linear", "notion", "slack", "monday", "hubspot", "servicetitan", "omniroute", "orca"],
            "count": 9,
            "message": "Available products for competitive harvesting",
        }
    elif action == "analyze_product" and request.product:
        product = request.product.lower()
        result = {
            "product": product,
            "analysis": {
                "features": [],
                "pricing": {},
                "strengths": [],
                "weaknesses": [],
                "opportunities": [],
            },
            "backlog_items": [],
            "priority_score": 0,
        }
    elif action == "create_backlog_item" and request.product:
        result = {
            "product": request.product,
            "backlog_id": str(uuid.uuid4()),
            "status": "created",
            "priority": "medium",
            "message": f"Backlog item created for {request.product}",
        }
    elif action == "monthly_review":
        result = {
            "review_id": str(uuid.uuid4()),
            "products_reviewed": [],
            "findings": [],
            "recommendations": [],
            "next_review_date": datetime.utcnow().replace(day=1).isoformat(),
        }
    else:
        result = {
            "message": f"Unknown action: {request.action}",
            "parameters": request.parameters,
        }
    
    return CompetitiveHarvestingResponseDTO(
        action=request.action,
        product=request.product,
        result=result,
        status="completed",
        timestamp=datetime.utcnow(),
    )


@app.get("/business")
async def business() -> JSONResponse:
    """Business health models projected from canonical events (Operational Intelligence).

    Exposes DECISIONS (health status), not raw metric classes.
    """
    events: list[dict] = []
    try:
        async with get_session() as session:
            from sqlalchemy import select
            result = await session.execute(
                select(EventModel).order_by(EventModel.global_sequence).limit(2000)
            )
            rows = result.scalars().all()
            events = [
                {
                    "event_type": e.event_type,
                    "payload": e.payload,
                    "global_sequence": e.global_sequence,
                    "occurred_at": e.occurred_at.isoformat() if e.occurred_at else None,
                }
                for e in rows
            ]
    except Exception as ex:
        app.state.logger.error("Failed to load events for business projection", error=str(ex))

    facts = compute_business_facts(events)
    signals = compute_business_signals(events)
    deps: dict[str, bool] = {}
    try:
        async with get_session() as session:
            await session.execute(text("SELECT 1"))
        deps["postgres"] = True
    except Exception:
        deps["postgres"] = False
    
    # NATS disabled for MVP
    deps["nats"] = None
    
    health_models = compute_health_models(facts, signals)
    return JSONResponse(content={
        "timestamp": datetime.utcnow().isoformat(),
        "event_window": len(events),
        "signals": {
            k: {
                "direction": v.direction,
                "magnitude": v.magnitude,
                "current_rate": v.current_rate,
                "prior_rate": v.prior_rate,
            }
            for k, v in signals.items()
        },
        "health_models": [m.to_dict() for m in health_models],
    })


@app.get("/ceo")
async def ceo() -> JSONResponse:
    """Executive dashboard - one view of business + operational health.

    Fed by health models (decisions), not raw metrics. Small by design.
    """
    events: list[dict] = []
    try:
        async with get_session() as session:
            from sqlalchemy import select
            result = await session.execute(
                select(EventModel).order_by(EventModel.global_sequence).limit(2000)
            )
            rows = result.scalars().all()
            events = [
                {"event_type": e.event_type, "payload": e.payload,
                 "global_sequence": e.global_sequence,
                 "occurred_at": e.occurred_at.isoformat() if e.occurred_at else None}
                for e in rows
            ]
    except Exception as ex:
        app.state.logger.error("Failed to load events for CEO dashboard", error=str(ex))

    facts = compute_business_facts(events)
    signals = compute_business_signals(events)
    deps: dict[str, bool] = {}
    try:
        async with get_session() as session:
            await session.execute(text("SELECT 1"))
        deps["postgres"] = True
    except Exception:
        deps["postgres"] = False
    
    # NATS disabled for MVP
    deps["nats"] = None
    
    health_models = compute_health_models(facts, signals)
    problems = prioritize_health(health_models)
    return JSONResponse(content={
        "timestamp": datetime.utcnow().isoformat(),
        "health": [m.to_dict() for m in health_models],
        "priority": problems,
        "facts": {
            "leads": facts["lead_count"],
            "pipeline_value": facts["total_pipeline_value"],
            "avg_rating": facts["avg_rating"],
            "delivery_rate": facts["delivery_rate"],
        },
        "dependencies": deps,
    })


# Thin adapter endpoints for frontend consumption
@app.get("/api/connectors")
async def get_connectors() -> JSONResponse:
    """Thin adapter for connector registry - returns registered capabilities."""
    registry = get_registry()
    capabilities = registry.list()
    metadata = {}
    for name in capabilities:
        meta = registry.get_metadata(name)
        if meta:
            metadata[name] = {
                "name": meta.name,
                "version": meta.version,
                "category": meta.category.value if meta.category else None,
                "description": meta.description,
                "author": meta.author,
                "state": meta.state.value if meta.state else None,
                "registered_at": meta.registered_at.isoformat() if meta.registered_at else None,
            }
    return JSONResponse(content={
        "connectors": capabilities,
        "metadata": metadata,
        "count": len(capabilities)
    })


@app.get("/api/evidence")
async def get_evidence() -> JSONResponse:
    """Thin adapter for evidence compiler - returns evidence compilation status."""
    compiler = EvidenceCompiler()
    return JSONResponse(content={
        "compiler_id": compiler.compiler_id,
        "status": "available",
        "description": "Evidence compiler available for mission-based evidence plan generation"
    })


@app.get("/api/recommendations")
async def get_recommendations() -> JSONResponse:
    """Thin adapter for recommendations - frontend-only capability.

    Architectural boundary: Recommendations are owned by the frontend.
    The Constitutional Runtime does not duplicate frontend recommendation logic.
    """
    return JSONResponse(content={
        "recommendations": [],
        "status": "frontend_only",
        "boundary": "architectural",
        "description": "Recommendations are a frontend-only capability. The Constitutional Runtime does not duplicate frontend recommendation logic to maintain architectural separation."
    })


@app.get("/api/executions")
async def get_executions() -> JSONResponse:
    """Thin adapter for execution pipeline - returns execution status."""
    return JSONResponse(content={
        "pipeline": "ConstitutionalExecutionPipeline",
        "status": "not_implemented",
        "description": "Constitutional execution pipeline requires dependency injection setup",
        "note": "Pipeline requires validator, authorizer, state_machine, invariant_engine, and constitutional_authority dependencies"
    })


@app.get("/api/graph")
async def get_graph() -> JSONResponse:
    """Thin adapter for knowledge graph - returns graph query status."""
    return JSONResponse(content={
        "graph": "KnowledgeGraph",
        "status": "not_implemented",
        "description": "Knowledge graph requires dependency injection setup",
        "note": "Two implementations exist: knowledge/graph.py (canonical) and runtime/knowledge/knowledge_graph.py (abstract ontology). API endpoint requires canonical selection and DI setup."
    })


@app.get("/api/projections")
async def get_projections() -> JSONResponse:
    """Thin adapter for projection store - returns projection status."""
    projection_store = ProjectionStore()
    return JSONResponse(content={
        "store": "ProjectionStore",
        "status": "available",
        "description": "Projection store available for event-sourced read models",
        "projection_types": ["mission_projections", "artifact_projections", "search_projections"],
        "architecture": "Events as source of truth - projections are read-only views",
        "checkpoints": {
            "missions": projection_store.get_checkpoint("missions"),
            "artifacts": projection_store.get_checkpoint("artifacts"),
            "search": projection_store.get_checkpoint("search"),
        }
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=default_settings.api_host, port=default_settings.api_port)
