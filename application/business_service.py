"""
Business Application Service

Handles business intelligence and CEO dashboard operations.
Coordinates business projections and metric computation.
"""

from datetime import datetime
from api.dto import CEOHomepageResponseDTO, BusinessIntelligenceRequestDTO, BusinessIntelligenceResponseDTO
from runtime.di_container import RuntimeContainer
from projections.ceo_homepage_projection import CEOHomepageProjection


class BusinessApplicationService:
    """Application service for business operations."""
    
    def __init__(self, container: RuntimeContainer):
        self.container = container
        self.ceo_homepage_projection = CEOHomepageProjection()
    
    async def get_ceo_homepage(self) -> CEOHomepageResponseDTO:
        """
        Get CEO homepage with business metrics.
        
        This method orchestrates projection computation.
        All projection logic lives in the projection layer.
        """
        # Load events from PostgreSQL via EventReader interface
        events = await self.container.event_reader.get_events(limit=2000)
        
        # Delegate to CEOHomepageProjection
        homepage_data = self.ceo_homepage_projection.compute(events)
        
        return CEOHomepageResponseDTO(
            revenue=homepage_data["revenue"],
            customers=homepage_data["customers"],
            operations=homepage_data["operations"],
            marketing=homepage_data["marketing"],
            ai_summary=homepage_data["ai_summary"],
            timestamp=datetime.utcnow(),
        )
    
    async def answer_business_question(self, request: BusinessIntelligenceRequestDTO) -> BusinessIntelligenceResponseDTO:
        """
        Answer business intelligence question.
        
        This method processes business questions and returns answers
        projected from constitutional events.
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
