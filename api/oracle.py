"""
Oracle API Module

Handles Oracle-related HTTP endpoints.
Delegates to OracleApplicationService for business logic.
"""

from fastapi import APIRouter
from application.oracle_service import OracleApplicationService
from api.dto import OracleReviewRequestDTO, OracleReviewResponseDTO

router = APIRouter(prefix="/oracle", tags=["oracle"])

# Application service (will be injected via DI)
_oracle_service: OracleApplicationService = None


def set_oracle_service(service: OracleApplicationService):
    """Set the oracle application service (DI)."""
    global _oracle_service
    _oracle_service = service


@router.post("/review", response_model=OracleReviewResponseDTO)
async def oracle_review(request: OracleReviewRequestDTO) -> OracleReviewResponseDTO:
    """
    Oracle code review endpoint.
    
    This endpoint wires the Oracle into the product surface.
    Oracle reviews candidate code and provides approval/rejection decisions.
    
    Oracle never executes candidate code (Constitutional Law 6).
    Oracle never plans execution (Constitutional Law 0).
    Oracle is purely a verification subsystem.
    """
    return await _oracle_service.review_code(request)
