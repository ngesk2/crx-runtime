import asyncio
import json
from typing import Any, Callable
import nats
from nats.js.api import StreamConfig, ConsumerConfig
import os


class NATSClient:
    """NATS JetStream client for constitutional runtime"""
    
    def __init__(self):
        self.nc = None
        self.js = None
        self.url = os.getenv("NATS_URL", "nats://localhost:4222")
        self.user = os.getenv("NATS_USER", "constitutional")
        self.password = os.getenv("NATS_PASSWORD", "constitutional")
    
    async def connect(self) -> None:
        """Connect to NATS server"""
        self.nc = await nats.connect(
            self.url,
            user=self.user,
            password=self.password,
        )
        self.js = self.nc.jetstream()
        
        # Create streams
        await self._create_streams()
    
    async def _create_streams(self) -> None:
        """Create JetStream streams"""
        streams = [
            StreamConfig(
                name="constitutional.events",
                subjects=["constitutional.events.>"],
                retention="limits",
                max_age=86400 * 7,  # 7 days
            ),
            StreamConfig(
                name="constitutional.commands",
                subjects=["constitutional.commands.>"],
                retention="limits",
                max_age=86400 * 7,  # 7 days
            ),
            StreamConfig(
                name="constitutional.projections",
                subjects=["constitutional.projections.>"],
                retention="limits",
                max_age=86400 * 7,  # 7 days
            ),
            StreamConfig(
                name="constitutional.metrics",
                subjects=["constitutional.metrics.>"],
                retention="limits",
                max_age=3600,  # 1 hour
            ),
        ]
        
        for stream in streams:
            try:
                await self.js.add_stream(stream)
            except Exception as e:
                # Stream might already exist
                if "stream name already in use" not in str(e):
                    raise
    
    async def publish_event(self, event: dict[str, Any]) -> str:
        """Publish an event to the events stream"""
        subject = f"constitutional.events.{event['event_type']}"
        ack = await self.js.publish(subject, json.dumps(event).encode())
        return ack.seq
    
    async def publish_command(self, command: dict[str, Any]) -> str:
        """Publish a command to the commands stream"""
        subject = f"constitutional.commands.{command['command_type']}"
        ack = await self.js.publish(subject, json.dumps(command).encode())
        return ack.seq
    
    async def publish_projection_update(self, projection: dict[str, Any]) -> str:
        """Publish a projection update to the projections stream"""
        subject = f"constitutional.projections.{projection['projection_name']}"
        ack = await self.js.publish(subject, json.dumps(projection).encode())
        return ack.seq
    
    async def publish_metric(self, metric: dict[str, Any]) -> str:
        """Publish a metric to the metrics stream"""
        subject = f"constitutional.metrics.{metric['metric_name']}"
        ack = await self.js.publish(subject, json.dumps(metric).encode())
        return ack.seq
    
    async def subscribe_events(
        self,
        event_type: str | None = None,
        callback: Callable[[dict[str, Any]], None] | None = None,
    ) -> None:
        """Subscribe to events"""
        subject = "constitutional.events.>" if event_type is None else f"constitutional.events.{event_type}"
        
        async def message_handler(msg):
            data = json.loads(msg.data.decode())
            if callback:
                await callback(data)
        
        await self.js.subscribe(subject, cb=message_handler)
    
    async def subscribe_commands(
        self,
        command_type: str | None = None,
        callback: Callable[[dict[str, Any]], None] | None = None,
    ) -> None:
        """Subscribe to commands"""
        subject = "constitutional.commands.>" if command_type is None else f"constitutional.commands.{command_type}"
        
        async def message_handler(msg):
            data = json.loads(msg.data.decode())
            if callback:
                await callback(data)
        
        await self.js.subscribe(subject, cb=message_handler)
    
    async def close(self) -> None:
        """Close NATS connection"""
        if self.nc:
            await self.nc.close()


# Global NATS client instance
_nats_client: NATSClient | None = None


async def get_nats_client() -> NATSClient:
    """Get or create global NATS client"""
    global _nats_client
    if _nats_client is None:
        _nats_client = NATSClient()
        await _nats_client.connect()
    return _nats_client
