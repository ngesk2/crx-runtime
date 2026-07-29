"""
Oracle Application Service

Handles Oracle code review and approval operations.
Coordinates with the Oracle subsystem for verification.
"""

from api.dto import OracleReviewRequestDTO, OracleReviewResponseDTO
from runtime.di_container import RuntimeContainer


class OracleApplicationService:
    """Application service for Oracle operations."""
    
    def __init__(self, container: RuntimeContainer):
        self.container = container
        self.oracle = container.oracle
    
    async def review_code(self, request: OracleReviewRequestDTO) -> OracleReviewResponseDTO:
        """
        Review candidate code using the Oracle.
        
        This method coordinates with the Oracle subsystem for
        static analysis and approval decisions.
        """
        review = self.oracle.review(
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
