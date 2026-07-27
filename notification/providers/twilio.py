"""Twilio Provider

Twilio API adapter for SMS operations.
"""

from typing import Any

from notification.evidence import NotificationEvidence
from notification.providers.base import NotificationProvider
from notification.transport_authority import TransportAuthority
from runtime.execution_context import ExecutionContext
from runtime.event_emitter import emit_event


class TwilioProvider(NotificationProvider):
    """Twilio provider for SMS operations
    
    Now uses TransportAuthority for centralized HTTP transport.
    
    Owns:
    - Twilio API authentication (Account SID + Auth Token)
    - Webhook verification (X-Twilio-Signature)
    - Provider DTO conversion (Twilio JSON → NotificationEvidence)
    
    Transport (HTTP, retry, timeout, TLS) is handled by TransportAuthority.
    
    TODO: Replace with official Twilio SDK when available, wrapped by TransportAuthority.
    TODO: Implement proper webhook signature verification (currently placeholder).
    """
    
    def __init__(
        self,
        account_sid: str,
        auth_token: str,
        transport_authority: TransportAuthority,
        sdk_version: str = "1.0.0",
        base_url: str = "https://api.twilio.com/2010-04-01",
    ):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.transport_authority = transport_authority
        self.sdk_version = sdk_version
        self.base_url = base_url
    
    @property
    def name(self) -> str:
        return "twilio"
    
    @property
    def capabilities(self) -> list[str]:
        return ["sms", "mms", "voice"]
    
    async def send_notification(
        self,
        payload: dict[str, Any],
        execution_context: ExecutionContext,
    ) -> NotificationEvidence:
        """Send SMS via Twilio"""
        capability = payload.get("capability")
        
        if capability == "sms":
            return await self._send_sms(payload, execution_context)
        else:
            raise ValueError(f"Unknown capability: {capability}")
    
    async def _send_sms(
        self,
        payload: dict[str, Any],
        execution_context: ExecutionContext,
    ) -> NotificationEvidence:
        """Send SMS via Twilio"""
        url = f"{self.base_url}/Accounts/{self.account_sid}/Messages.json"
        
        response = await self.transport_authority.post(
            url,
            auth=(self.account_sid, self.auth_token),
            data={
                "From": payload["from_number"],
                "To": payload["to_number"],
                "Body": payload["body"],
            },
        )

        # Observation Layer (Step 1): emit canonical event (best-effort)
        await emit_event(
            "SmsSent",
            {
                "provider": "twilio",
                "capability": "sms",
                "from_number": payload["from_number"],
                "to_number": payload["to_number"],
                "request_id": response.json().get("sid"),
            },
            producer_id="twilio",
        )

        return NotificationEvidence.create(
            provider="twilio",
            provider_api_version="2010-04-01",
            provider_sdk_version=self.sdk_version,
            runtime_version=execution_context.runtime_version,
            provider_request_id=response.json().get("sid"),
            provider_response=response.json(),
            build_witness_root_hash=execution_context.get_build_witness_hash(),
            authority_version=execution_context.authority_version,
            schema_version=execution_context.schema_version,
            replay_version=execution_context.replay_version,
            timestamp=execution_context.get_timestamp(),
        )
    
    async def handle_webhook(
        self,
        webhook_data: dict[str, Any],
        execution_context: ExecutionContext,
    ) -> NotificationEvidence:
        """Handle Twilio webhook"""
        # Verify signature
        if not self._verify_signature(webhook_data):
            raise SecurityError("Invalid Twilio signature")
        
        return NotificationEvidence.create(
            provider="twilio",
            provider_api_version="2010-04-01",
            provider_sdk_version=self.sdk_version,
            runtime_version=execution_context.runtime_version,
            provider_request_id=webhook_data.get("MessageSid"),
            provider_response=webhook_data,
            build_witness_root_hash=execution_context.get_build_witness_hash(),
            authority_version=execution_context.authority_version,
            schema_version=execution_context.schema_version,
            replay_version=execution_context.replay_version,
            timestamp=execution_context.get_timestamp(),
        )
    
    def _verify_signature(self, webhook_data: dict[str, Any]) -> bool:
        """Verify Twilio webhook signature using Twilio SDK
        
        TODO: Implement proper signature verification using official Twilio SDK.
        This is a security-critical function and must be implemented before production use.
        """
        # Use Twilio SDK for signature verification
        # Implementation details depend on Twilio Python SDK
        # For now, return True as placeholder - MUST BE IMPLEMENTED
        raise NotImplementedError("Twilio webhook signature verification must be implemented")


class SecurityError(Exception):
    """Security error for webhook signature verification"""
    pass
