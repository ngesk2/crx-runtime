"""
Health API Module

Handles health and readiness HTTP endpoints.
Delegates to HealthApplicationService for business logic.
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from datetime import datetime
from application.health_service import HealthApplicationService
from api.dto import HealthResponseDTO, ReadyResponseDTO

router = APIRouter(tags=["health"])

# Application service (will be injected via DI)
_health_service: HealthApplicationService = None


def set_health_service(service: HealthApplicationService):
    """Set the health application service (DI)."""
    global _health_service
    _health_service = service


@router.get("/health", response_model=HealthResponseDTO)
async def health() -> HealthResponseDTO:
    """Health check - verifies system dependencies are reachable."""
    deps = await _health_service.check_all_dependencies()
    
    status = "healthy" if all(deps.get(k) for k in deps if deps[k] is not None) else "unhealthy"
    
    return HealthResponseDTO(
        status=status,
        timestamp=datetime.utcnow(),
        dependencies=deps,
    )


@router.get("/ready", response_model=ReadyResponseDTO)
async def ready() -> ReadyResponseDTO:
    """Readiness check - verifies system is ready to accept traffic."""
    deps = await _health_service.check_all_dependencies()
    
    status = "ready" if all(deps.get(k) for k in deps if deps[k] is not None) else "not_ready"
    
    return ReadyResponseDTO(
        status=status,
        timestamp=datetime.utcnow(),
        dependencies=deps,
    )


@router.get("/ops")
async def ops() -> JSONResponse:
    """Live operational state - exposes existing runtime telemetry (no new architecture)."""
    deps = await _health_service.check_all_dependencies()
    
    from storage.postgres.database import get_session
    from storage.postgres.models import Event as EventModel
    from sqlalchemy import select, func
    
    event_count = 0
    last_seq = 0
    try:
        async with get_session() as session:
            result = await session.execute(select(func.count()).select_from(EventModel))
            event_count = result.scalar() or 0
            result2 = await session.execute(select(func.max(EventModel.global_sequence)))
            last_seq = result2.scalar() or 0
    except Exception:
        event_count = 0
        last_seq = 0
    
    from runtime.observability import Observability
    observability = Observability()
    metrics = observability.get_metrics()
    
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


@router.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    from fastapi.responses import Response
    from runtime.observability import Observability
    
    observability = Observability()
    metrics_data = observability.get_metrics()
    return Response(content=metrics_data, media_type="text/plain")
