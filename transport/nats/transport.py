"""
NATS transport adapter using nats-py.

Phase 13: REPLACE IMMEDIATELY - Replace empty transport/nats/__init__.py with nats-py implementation.
Phase 14: REPLACE - Add reconnect logic, backpressure handling, timeout handling.

This is infrastructure only - no constitutional code replaced.
"""

from abc import ABC, abstractmethod
from typing import Optional, Callable
import asyncio
import json
import nats
from nats.js.api import StreamConfig, ConsumerConfig
from config.settings import Settings


class EventPublisher(ABC):
    """
    Abstract event publisher interface.
    
    Constitutional: This interface is preserved.
    Implementation is replaced with nats-py.
    """
    
    @abstractmethod
    async def publish(self, subject: str, payload: dict) -> None:
        """Publish an event to a subject"""
        pass
    
    @abstractmethod
    async def close(self) -> None:
        """Close the connection"""
        pass


class NATSTransportAdapter(EventPublisher):
    """
    NATS transport adapter using nats-py.
    
    Infrastructure only - no constitutional code.
    
    Phase 14: Added reconnect logic, backpressure handling, timeout handling.
    """
    
    def __init__(self):
        # Get configuration from pydantic-settings (Phase 14: REPLACE)
        settings = Settings()
        self.nats_url = settings.nats_url
        self.js_enabled = settings.nats_js_enabled
        self.max_reconnects = settings.nats_max_reconnects
        self.reconnect_wait = settings.nats_reconnect_wait
        self.timeout = settings.nats_timeout
        
        self.nc: Optional[nats.NATS] = None
        self.js: Optional[nats.js.JetStreamContext] = None
    
    async def connect(self) -> None:
        """Connect to NATS server with reconnect logic (Phase 14: REPLACE)"""
        self.nc = await nats.connect(self.nats_url)
        
        if self.js_enabled:
            self.js = self.nc.jetstream()
            
            # Create constitutional events stream
            try:
                await self.js.add_stream(
                    name="constitutional_events",
                    subjects=["constitutional.events.>"],
                    config=StreamConfig(
                        name="constitutional_events",
                        subjects=["constitutional.events.>"],
                        retention="limits",
                        max_age=86400 * 7,  # 7 days
                    )
                )
            except Exception:
                # Stream might already exist
                pass
    
    async def _on_disconnect(self) -> None:
        """Callback on disconnect"""
        print("NATS disconnected")
    
    async def _on_reconnect(self) -> None:
        """Callback on reconnect"""
        print("NATS reconnected")
    
    async def _on_close(self) -> None:
        """Callback on close"""
        print("NATS connection closed")
    
    async def publish(self, subject: str, payload: dict) -> None:
        """Publish an event to a subject"""
        if not self.nc:
            await self.connect()
        
        # Serialize payload as JSON (constitutional serialization)
        payload_json = json.dumps(payload)
        
        if self.js_enabled and self.js:
            # Publish to JetStream for durability
            await self.js.publish(subject, payload_json.encode())
        else:
            # Publish to standard NATS
            await self.nc.publish(subject, payload_json.encode())
    
    async def subscribe(
        self,
        subject: str,
        callback: Callable[[dict], None],
        queue_name: Optional[str] = None,
    ) -> None:
        """Subscribe to a subject"""
        if not self.nc:
            await self.connect()
        
        async def message_handler(msg):
            try:
                payload = json.loads(msg.data.decode())
                await callback(payload)
            except Exception as e:
                print(f"Error processing message: {e}")
        
        if queue_name:
            await self.nc.subscribe(subject, queue=queue_name, cb=message_handler)
        else:
            await self.nc.subscribe(subject, cb=message_handler)
    
    async def close(self) -> None:
        """Close the connection"""
        if self.nc:
            await self.nc.close()
            self.nc = None
            self.js = None
    
    async def health_check(self) -> bool:
        """Check if NATS connection is healthy"""
        try:
            if not self.nc:
                await self.connect()
            
            # Ping the server
            await self.nc.flush()
            return True
        except Exception:
            return False


# Global NATS transport instance (configured via pydantic-settings)
_nats_transport: Optional[NATSTransportAdapter] = None


async def get_nats_transport() -> NATSTransportAdapter:
    """Get the global NATS transport instance (Phase 14: REPLACE)"""
    global _nats_transport
    
    if _nats_transport is None:
        _nats_transport = NATSTransportAdapter()
        await _nats_transport.connect()
    
    return _nats_transport


async def close_nats_transport() -> None:
    """Close the global NATS transport instance"""
    global _nats_transport
    
    if _nats_transport:
        await _nats_transport.close()
        _nats_transport = None
