"""Outbox Processor

Transactional outbox processor for routing notification events to providers.
"""

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from storage.postgres.models import OutboxMessage as OutboxMessageModel
from notification.authority import NotificationAuthority
from notification.evidence import NotificationEvidence
from runtime.execution_context import ExecutionContext


class OutboxProcessor:
    """Transactional outbox processor for notification events
    
    Reads from outbox table, routes to NotificationAuthority, marks as processed.
    
    TODO: Add leasing, visibility timeout, worker ownership, heartbeat, retries,
    exponential scheduling, and poison queue for multi-worker safety.
    """
    
    def __init__(
        self,
        session: AsyncSession,
        notification_authority: NotificationAuthority,
        execution_context: ExecutionContext,
    ):
        self.session = session
        self.notification_authority = notification_authority
        self.execution_context = execution_context
    
    async def process_outbox_messages(self, batch_size: int = 100) -> list[NotificationEvidence]:
        """
        Process pending outbox messages.
        
        Args:
            batch_size: Number of messages to process in one batch
        
        Returns:
            List of NotificationEvidence from processed messages
        """
        # Fetch pending outbox messages
        query = (
            select(OutboxMessageModel)
            .where(OutboxMessageModel.processed_at.is_(None))
            .order_by(OutboxMessageModel.created_at)
            .limit(batch_size)
        )
        
        result = await self.session.execute(query)
        messages = list(result.scalars().all())
        
        if not messages:
            return []
        
        evidence_list = []
        
        for message in messages:
            try:
                # Process the message
                evidence = await self._process_message(message)
                evidence_list.append(evidence)
                
                # Mark as processed
                await self._mark_processed(message)
                
            except Exception as e:
                # Mark as failed
                await self._mark_failed(message, str(e))
                raise
        
        await self.session.commit()
        
        return evidence_list
    
    async def _process_message(self, message: OutboxMessageModel) -> NotificationEvidence:
        """Process a single outbox message"""
        payload = message.payload
        
        # Determine if this is a notification event
        topic = message.topic
        
        if topic.startswith("constitutional.events.notification"):
            # Extract capability from payload
            capability = payload.get("capability")
            
            # Route to NotificationAuthority
            evidence = await self.notification_authority.route_notification(
                capability=capability,
                payload=payload,
            )
            
            return evidence
        
        elif topic.startswith("constitutional.events.sms"):
            # SMS event
            capability = "sms"
            
            evidence = await self.notification_authority.route_notification(
                capability=capability,
                payload=payload,
            )
            
            return evidence
        
        else:
            # Not a notification event, skip
            raise ValueError(f"Unsupported topic: {topic}")
    
    async def _mark_processed(self, message: OutboxMessageModel) -> None:
        """Mark outbox message as processed"""
        await self.session.execute(
            update(OutboxMessageModel)
            .where(OutboxMessageModel.id == message.id)
            .values(
                processed_at=self.execution_context.get_timestamp(),
                processing_status="processed",
            )
        )
    
    async def _mark_failed(self, message: OutboxMessageModel, error_message: str) -> None:
        """Mark outbox message as failed"""
        await self.session.execute(
            update(OutboxMessageModel)
            .where(OutboxMessageModel.id == message.id)
            .values(
                processed_at=self.execution_context.get_timestamp(),
                processing_status="failed",
                error_message=error_message,
            )
        )
