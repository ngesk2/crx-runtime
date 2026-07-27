"""Kit Provider

Kit API adapter for email marketing operations.
"""

from typing import Any

from notification.evidence import NotificationEvidence
from notification.providers.base import NotificationProvider
from notification.transport_authority import TransportAuthority
from runtime.execution_context import ExecutionContext
from runtime.event_emitter import emit_event


class KitProvider(NotificationProvider):
    """Kit provider for email marketing operations
    
    Now uses TransportAuthority for centralized HTTP transport.
    
    Owns:
    - Kit API authentication (X-Kit-Api-Key)
    - Provider DTO conversion (Kit JSON → NotificationEvidence)
    
    Transport (HTTP, retry, timeout, TLS) is handled by TransportAuthority.
    
    TODO: Replace with official Kit SDK when available, wrapped by TransportAuthority.
    """
    
    def __init__(
        self,
        api_key: str,
        transport_authority: TransportAuthority,
        sdk_version: str = "1.0.0",
        base_url: str = "https://api.kit.com/v4",
    ):
        self.api_key = api_key
        self.transport_authority = transport_authority
        self.sdk_version = sdk_version
        self.base_url = base_url
    
    @property
    def name(self) -> str:
        return "kit"
    
    @property
    def capabilities(self) -> list[str]:
        return ["subscriber", "broadcast", "tag", "sequence", "automation"]
    
    async def send_notification(
        self,
        payload: dict[str, Any],
        execution_context: ExecutionContext,
    ) -> NotificationEvidence:
        """Send notification via Kit"""
        capability = payload.get("capability")
        
        if capability == "subscriber":
            return await self._create_subscriber(payload, execution_context)
        elif capability == "tag":
            return await self._add_tag(payload, execution_context)
        elif capability == "sequence":
            return await self._enroll_sequence(payload, execution_context)
        elif capability == "broadcast":
            return await self._trigger_broadcast(payload, execution_context)
        else:
            raise ValueError(f"Unknown capability: {capability}")
    
    async def _create_subscriber(
        self,
        payload: dict[str, Any],
        execution_context: ExecutionContext,
    ) -> NotificationEvidence:
        """Create subscriber in Kit"""
        url = f"{self.base_url}/subscribers"
        headers = {"X-Kit-Api-Key": self.api_key}
        
        response = await self.transport_authority.post(
            url,
            headers=headers,
            json={
                "first_name": payload.get("first_name"),
                "email_address": payload.get("email_address"),
                "fields": payload.get("fields", {}),
            },
        )
        
        return NotificationEvidence.create(
            provider="kit",
            provider_api_version="v4",
            provider_sdk_version=self.sdk_version,
            runtime_version=execution_context.runtime_version,
            provider_request_id=str(response.json().get("id")),
            provider_response=response.json(),
            build_witness_root_hash=execution_context.get_build_witness_hash(),
            authority_version=execution_context.authority_version,
            schema_version=execution_context.schema_version,
            replay_version=execution_context.replay_version,
            timestamp=execution_context.get_timestamp(),
        )
    
    async def _add_tag(
        self,
        payload: dict[str, Any],
        execution_context: ExecutionContext,
    ) -> NotificationEvidence:
        """Add tag to subscriber in Kit"""
        tag_id = payload["tag_id"]
        subscriber_id = payload["subscriber_id"]
        
        url = f"{self.base_url}/tags/{tag_id}/subscribers/{subscriber_id}"
        headers = {"X-Kit-Api-Key": self.api_key}
        
        response = await self.transport_authority.post(url, headers=headers, json={})
        
        return NotificationEvidence.create(
            provider="kit",
            provider_api_version="v4",
            provider_sdk_version=self.sdk_version,
            runtime_version=execution_context.runtime_version,
            provider_request_id=str(response.json().get("id")),
            provider_response=response.json(),
            build_witness_root_hash=execution_context.get_build_witness_hash(),
            authority_version=execution_context.authority_version,
            schema_version=execution_context.schema_version,
            replay_version=execution_context.replay_version,
            timestamp=execution_context.get_timestamp(),
        )
    
    async def _enroll_sequence(
        self,
        payload: dict[str, Any],
        execution_context: ExecutionContext,
    ) -> NotificationEvidence:
        """Enroll subscriber in sequence"""
        sequence_id = payload["sequence_id"]
        subscriber_id = payload["subscriber_id"]
        
        url = f"{self.base_url}/sequences/{sequence_id}/subscribers/{subscriber_id}"
        headers = {"X-Kit-Api-Key": self.api_key}
        
        response = await self.transport_authority.post(url, headers=headers, json={})
        
        return NotificationEvidence.create(
            provider="kit",
            provider_api_version="v4",
            provider_sdk_version=self.sdk_version,
            runtime_version=execution_context.runtime_version,
            provider_request_id=str(response.json().get("id")),
            provider_response=response.json(),
            build_witness_root_hash=execution_context.get_build_witness_hash(),
            authority_version=execution_context.authority_version,
            schema_version=execution_context.schema_version,
            replay_version=execution_context.replay_version,
            timestamp=execution_context.get_timestamp(),
        )
    
    async def _trigger_broadcast(
        self,
        payload: dict[str, Any],
        execution_context: ExecutionContext,
    ) -> NotificationEvidence:
        """Trigger broadcast"""
        url = f"{self.base_url}/broadcasts"
        headers = {"X-Kit-Api-Key": self.api_key}
        
        response = await self.transport_authority.post(
            url,
            headers=headers,
            json={
                "subject": payload.get("subject"),
                "content": payload.get("content"),
                "segment_id": payload.get("segment_id"),
            },
        )

        # Observation Layer (Step 1): emit canonical event (best-effort)
        await emit_event(
            "EmailSent",
            {
                "provider": "kit",
                "capability": "broadcast",
                "subject": payload.get("subject"),
                "segment_id": payload.get("segment_id"),
                "request_id": str(response.json().get("id")),
            },
            producer_id="kit",
        )

        return NotificationEvidence.create(
            provider="kit",
            provider_api_version="v4",
            provider_sdk_version=self.sdk_version,
            runtime_version=execution_context.runtime_version,
            provider_request_id=str(response.json().get("id")),
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
        """Handle Kit webhook"""
        return NotificationEvidence.create(
            provider="kit",
            provider_api_version="v4",
            provider_sdk_version=self.sdk_version,
            runtime_version=execution_context.runtime_version,
            provider_request_id=str(webhook_data.get("subscriber", {}).get("id")),
            provider_response=webhook_data,
            build_witness_root_hash=execution_context.get_build_witness_hash(),
            authority_version=execution_context.authority_version,
            schema_version=execution_context.schema_version,
            replay_version=execution_context.replay_version,
            timestamp=execution_context.get_timestamp(),
        )

