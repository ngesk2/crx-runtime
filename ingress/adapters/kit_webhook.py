"""Kit Webhook Adapter

Adapter for Kit webhook events.
"""

from typing import Any

from constitution.authority.canonical_authority import CanonicalAuthority
from ingress.adapters.base import CanonicalCommand, IngressAdapter
from runtime.execution_context import ExecutionContext


class KitWebhookAdapter(IngressAdapter):
    """Kit webhook adapter for canonicalizing Kit webhook events"""
    
    def __init__(self, canonical_authority: CanonicalAuthority):
        self.canonical_authority = canonical_authority
    
    @property
    def source(self) -> str:
        return "webhook.kit"
    
    async def canonicalize(
        self,
        raw_data: dict[str, Any],
        metadata: dict[str, Any] | None = None,
        execution_context: ExecutionContext | None = None,
    ) -> CanonicalCommand:
        """
        Canonicalize Kit webhook into CanonicalCommand.
        
        Args:
            raw_data: Kit webhook data
            metadata: Additional metadata
            execution_context: Constitutional execution context
        
        Returns:
            CanonicalCommand ready for CommandBus
        """
        # Use execution context or create default
        ctx = execution_context or ExecutionContext()
        
        # Extract event type from Kit webhook
        event = raw_data.get("event", {})
        event_name = event.get("name", "unknown")
        
        # Map Kit event names to constitutional event names
        command_type = self._map_kit_event(event_name)
        
        # Extract subscriber data
        subscriber_data = raw_data.get("subscriber", {})
        
        # Build canonical payload
        payload = {
            "kit_subscriber_id": subscriber_data.get("id"),
            "email_address": subscriber_data.get("email_address"),
            "state": subscriber_data.get("state"),
            "first_name": subscriber_data.get("first_name"),
            "fields": subscriber_data.get("fields", {}),
            "event_name": event_name,
            "event_data": event,
        }
        
        # Generate canonical data
        canonical_data = {
            "command_type": command_type,
            "ingress_source": "webhook.kit",
            "ingress_timestamp": ctx.get_timestamp(),
            "payload": payload,
            "metadata": metadata or {},
            "correlation_id": None,
            "schema_version": ctx.schema_version,
        }
        
        # Compute command_id using CanonicalAuthority (single source of truth)
        command_id = self.canonical_authority.hash_dict(canonical_data)
        
        return CanonicalCommand(
            command_id=command_id,
            **canonical_data,
        )
    
    def _map_kit_event(self, event_name: str) -> str:
        """Map Kit event names to constitutional event names"""
        event_mapping = {
            "subscriber.subscriber_activate": "kit.subscriber.activated",
            "subscriber.subscriber_unsubscribe": "kit.subscriber.unsubscribed",
            "subscriber.subscriber_bounce": "kit.subscriber.bounced",
            "subscriber.subscriber_complain": "kit.subscriber.complained",
            "subscriber.form_subscribe": "kit.subscriber.form_subscribed",
            "subscriber.course_subscribe": "kit.subscriber.sequence_enrolled",
            "subscriber.course_complete": "kit.subscriber.sequence_completed",
            "subscriber.link_click": "kit.subscriber.link_clicked",
            "subscriber.product_purchase": "kit.purchase.created",
            "subscriber.tag_add": "kit.subscriber.tag_added",
            "subscriber.tag_remove": "kit.subscriber.tag_removed",
            "purchase.purchase_create": "kit.purchase.created",
        }
        
        return event_mapping.get(event_name, f"kit.{event_name.replace('.', '_')}")

