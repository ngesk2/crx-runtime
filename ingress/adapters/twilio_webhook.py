"""Twilio Webhook Adapter

Adapter for Twilio webhook events.
"""

from typing import Any

from constitution.authority.canonical_authority import CanonicalAuthority
from ingress.adapters.base import CanonicalCommand, IngressAdapter
from runtime.execution_context import ExecutionContext


class TwilioWebhookAdapter(IngressAdapter):
    """Twilio webhook adapter for canonicalizing Twilio webhook events"""
    
    def __init__(self, canonical_authority: CanonicalAuthority):
        self.canonical_authority = canonical_authority
    
    @property
    def source(self) -> str:
        return "webhook.twilio"
    
    async def canonicalize(
        self,
        raw_data: dict[str, Any],
        metadata: dict[str, Any] | None = None,
        execution_context: ExecutionContext | None = None,
    ) -> CanonicalCommand:
        """
        Canonicalize Twilio webhook into CanonicalCommand.
        
        Args:
            raw_data: Twilio webhook data (form-encoded or query params)
            metadata: Additional metadata
            execution_context: Constitutional execution context
        
        Returns:
            CanonicalCommand ready for CommandBus
        """
        # Use execution context or create default
        ctx = execution_context or ExecutionContext()
        
        # Determine event type based on presence of certain fields
        message_sid = raw_data.get("MessageSid")
        
        if message_sid:
            # This is a message-related webhook
            command_type = self._derive_message_command_type(raw_data)
        else:
            # Other Twilio webhook types (voice, etc.)
            command_type = "twilio.webhook.received"
        
        # Build canonical payload
        payload = {
            "message_sid": raw_data.get("MessageSid"),
            "account_sid": raw_data.get("AccountSid"),
            "from_number": raw_data.get("From"),
            "to_number": raw_data.get("To"),
            "body": raw_data.get("Body"),
            "status": raw_data.get("MessageStatus") or raw_data.get("SmsStatus"),
            "num_media": raw_data.get("NumMedia"),
            "media_urls": self._extract_media_urls(raw_data),
            "direction": self._determine_direction(raw_data),
        }
        
        # Generate canonical data
        canonical_data = {
            "command_type": command_type,
            "ingress_source": "webhook.twilio",
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
    
    def _derive_message_command_type(self, raw_data: dict[str, Any]) -> str:
        """Derive command type from message webhook data"""
        status = raw_data.get("MessageStatus") or raw_data.get("SmsStatus")
        
        # If we have a status, it's likely a status callback
        if status:
            if status == "delivered":
                return "twilio.message.delivered"
            elif status == "failed":
                return "twilio.message.failed"
            elif status == "undelivered":
                return "twilio.message.undelivered"
            elif status == "sent":
                return "twilio.message.sent"
            elif status == "queued":
                return "twilio.message.queued"
        
        # If we have a body and no status, it's likely an incoming message
        if raw_data.get("Body"):
            return "twilio.message.received"
        
        return "twilio.message.unknown"
    
    def _extract_media_urls(self, raw_data: dict[str, Any]) -> list[str]:
        """Extract media URLs from webhook data"""
        media_urls = []
        num_media = int(raw_data.get("NumMedia", 0))
        
        for i in range(num_media):
            media_url_key = f"MediaUrl{i}"
            if media_url_key in raw_data:
                media_urls.append(raw_data[media_url_key])
        
        return media_urls
    
    def _determine_direction(self, raw_data: dict[str, Any]) -> str:
        """Determine message direction (inbound or outbound)"""
        # If we have a status, it's likely outbound
        if raw_data.get("MessageStatus") or raw_data.get("SmsStatus"):
            return "outbound"
        
        # If we have a body without status, it's likely inbound
        if raw_data.get("Body"):
            return "inbound"
        
        return "unknown"

