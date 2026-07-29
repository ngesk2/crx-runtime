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
from runtime.di_container import RuntimeContainer

# Import modular API routers
from api.events import router as events_router, set_event_service
from api.commands import router as commands_router, set_command_service
from api.oracle import router as oracle_router, set_oracle_service
from api.business import router as business_router, set_business_service
from api.product import router as product_router, set_product_service
from api.health import router as health_router, set_health_service
from api.replay import router as replay_router, set_replay_service

# Import application services
from application.event_service import EventApplicationService
from application.command_service import CommandApplicationService
from application.oracle_service import OracleApplicationService
from application.business_service import BusinessApplicationService
from application.product_service import ProductApplicationService
from application.health_service import HealthApplicationService
from application.replay_service import ReplayApplicationService

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

        # Initialize DI container (composition root)
        container = await RuntimeContainer.create()
        app.state.container = container

        # Inject application services into routers
        event_service = EventApplicationService(container)
        command_service = CommandApplicationService(container)
        oracle_service = OracleApplicationService(container)
        business_service = BusinessApplicationService(container)
        product_service = ProductApplicationService(container)
        health_service = HealthApplicationService(container)
        replay_service = ReplayApplicationService(container)

        set_event_service(event_service)
        set_command_service(command_service)
        set_oracle_service(oracle_service)
        set_business_service(business_service)
        set_product_service(product_service)
        set_health_service(health_service)
        set_replay_service(replay_service)

        # Bootstrap runtime dependencies (legacy - will be replaced by DI container)
        from runtime.bootstrap import bootstrap_runtime
        dependencies = await bootstrap_runtime()
        app.state.dependencies = dependencies

        app.state.logger.info(f"Runtime bootstrapped with {len(dependencies.capability_registry.list())} capabilities")

        yield

        # Shutdown
        app.state.logger.info("Shutting down Constitutional Runtime API")

        # Shutdown DI container
        await container.shutdown()

        # Shutdown runtime (legacy)
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
    app.include_router(replay_router)
    
    # Thin adapter endpoints for frontend consumption (remain in main.py for now)
    @app.get("/api/connectors")
    async def get_connectors() -> JSONResponse:
        """Thin adapter for connector registry - returns registered capabilities."""
        registry = container.capability_registry
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
        compiler = container.evidence_compiler
        return JSONResponse(content={
            "compiler_id": compiler.compiler_id,
            "status": "available",
            "description": "Evidence compiler available for mission-based evidence plan generation"
        })

    @app.get("/api/recommendations")
    async def get_recommendations() -> JSONResponse:
        """Thin adapter for recommendations - frontend-only capability."""
        return JSONResponse(content={
            "status": "available",
            "description": "Recommendations engine available for frontend consumption"
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
