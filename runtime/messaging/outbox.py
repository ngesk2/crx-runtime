"""
Outbox Pattern - Reliable external side effects.

Problem:
Store artifact → commit DB → call webhook → webhook fails
Database says success, external world says failure.

Solution:
transaction → write event into outbox → commit
background dispatcher → retry until success

Never perform network IO inside the transaction.
"""

import asyncio
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, Dict, Any, List, Callable
from dataclasses import dataclass, asdict
import sqlite3
import hashlib


@dataclass
class OutboxMessage:
    """Message in outbox for external delivery."""
    message_id: str
    message_type: str
    payload: Dict[str, Any]
    target_url: Optional[str]
    target_method: str
    headers: Dict[str, str]
    status: str  # PENDING, SENT, FAILED, DEAD_LETTER
    attempts: int
    max_attempts: int
    created_at: str
    sent_at: Optional[str]
    error: Optional[str]
    idempotency_key: Optional[str]


class Outbox:
    """
    Outbox pattern implementation for reliable external side effects.
    
    All external operations (webhooks, API calls, etc.) go through the outbox.
    Messages are written within the transaction, then dispatched by background process.
    """
    
    def __init__(self, db_path: str = "runtime/messaging/outbox.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize_db()
    
    def _initialize_db(self) -> None:
        """Initialize database schema."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS outbox_messages (
                message_id TEXT PRIMARY KEY,
                message_type TEXT NOT NULL,
                payload TEXT NOT NULL,
                target_url TEXT,
                target_method TEXT DEFAULT 'POST',
                headers TEXT DEFAULT '{}',
                status TEXT DEFAULT 'PENDING',
                attempts INTEGER DEFAULT 0,
                max_attempts INTEGER DEFAULT 5,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                sent_at TEXT,
                error TEXT,
                idempotency_key TEXT UNIQUE
            )
        """)
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox_messages(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_outbox_created_at ON outbox_messages(created_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_outbox_idempotency ON outbox_messages(idempotency_key)")
        
        conn.commit()
        conn.close()
    
    def write_message(
        self,
        message_type: str,
        payload: Dict[str, Any],
        target_url: Optional[str] = None,
        target_method: str = "POST",
        headers: Optional[Dict[str, str]] = None,
        idempotency_key: Optional[str] = None,
        max_attempts: int = 5
    ) -> str:
        """
        Write message to outbox (called within transaction).
        
        Args:
            message_type: Type of message
            payload: Message payload
            target_url: Target URL for delivery
            target_method: HTTP method
            headers: HTTP headers
            idempotency_key: Idempotency key for deduplication
            max_attempts: Maximum delivery attempts
        
        Returns:
            Message ID
        """
        import uuid
        
        message_id = str(uuid.uuid4())
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO outbox_messages
                (message_id, message_type, payload, target_url, target_method, headers, idempotency_key, max_attempts)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                message_id,
                message_type,
                json.dumps(payload),
                target_url,
                target_method,
                json.dumps(headers or {}),
                idempotency_key,
                max_attempts
            ))
            
            conn.commit()
            return message_id
        except sqlite3.IntegrityError:
            # Idempotency key conflict, return existing message
            cursor.execute(
                "SELECT message_id FROM outbox_messages WHERE idempotency_key = ?",
                (idempotency_key,)
            )
            row = cursor.fetchone()
            conn.close()
            return row[0] if row else message_id
        finally:
            conn.close()
    
    def get_pending_messages(self, limit: int = 100) -> List[OutboxMessage]:
        """Get pending messages for dispatch."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT message_id, message_type, payload, target_url, target_method, headers,
                   status, attempts, max_attempts, created_at, sent_at, error, idempotency_key
            FROM outbox_messages
            WHERE status = 'PENDING'
            AND attempts < max_attempts
            ORDER BY created_at ASC
            LIMIT ?
        """, (limit,))
        
        messages = []
        for row in cursor.fetchall():
            messages.append(OutboxMessage(
                message_id=row[0],
                message_type=row[1],
                payload=json.loads(row[2]),
                target_url=row[3],
                target_method=row[4],
                headers=json.loads(row[5]),
                status=row[6],
                attempts=row[7],
                max_attempts=row[8],
                created_at=row[9],
                sent_at=row[10],
                error=row[11],
                idempotency_key=row[12]
            ))
        
        conn.close()
        return messages
    
    def mark_message_sent(self, message_id: str) -> None:
        """Mark message as successfully sent."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE outbox_messages
            SET status = 'SENT',
                sent_at = ?,
                attempts = attempts + 1
            WHERE message_id = ?
        """, (datetime.now(timezone.utc).isoformat(), message_id))
        
        conn.commit()
        conn.close()
    
    def mark_message_failed(self, message_id: str, error: str) -> None:
        """Mark message delivery attempt as failed."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE outbox_messages
            SET status = 'PENDING',
                error = ?,
                attempts = attempts + 1
            WHERE message_id = ?
        """, (error, message_id))
        
        conn.commit()
        conn.close()
    
    def mark_message_dead_letter(self, message_id: str, error: str) -> None:
        """Mark message as dead letter (max attempts exceeded)."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE outbox_messages
            SET status = 'DEAD_LETTER',
                error = ?,
                attempts = attempts + 1
            WHERE message_id = ?
        """, (error, message_id))
        
        conn.commit()
        conn.close()
    
    def get_dead_letter_messages(self, limit: int = 100) -> List[OutboxMessage]:
        """Get dead letter messages for inspection."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT message_id, message_type, payload, target_url, target_method, headers,
                   status, attempts, max_attempts, created_at, sent_at, error, idempotency_key
            FROM outbox_messages
            WHERE status = 'DEAD_LETTER'
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,))
        
        messages = []
        for row in cursor.fetchall():
            messages.append(OutboxMessage(
                message_id=row[0],
                message_type=row[1],
                payload=json.loads(row[2]),
                target_url=row[3],
                target_method=row[4],
                headers=json.loads(row[5]),
                status=row[6],
                attempts=row[7],
                max_attempts=row[8],
                created_at=row[9],
                sent_at=row[10],
                error=row[11],
                idempotency_key=row[12]
            ))
        
        conn.close()
        return messages
    
    def retry_dead_letter(self, message_id: str) -> bool:
        """Retry a dead letter message."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE outbox_messages
            SET status = 'PENDING',
                attempts = 0,
                error = NULL
            WHERE message_id = ?
        """, (message_id,))
        
        conn.commit()
        conn.close()
        return True


class OutboxDispatcher:
    """
    Background dispatcher for outbox messages.
    
    Reads pending messages and delivers them to external targets.
    Retries on failure with exponential backoff.
    """
    
    def __init__(self, outbox: Outbox):
        self.outbox = outbox
        self._running = False
        self._http_client = None
    
    async def start(self, interval_seconds: int = 5) -> None:
        """Start dispatcher loop."""
        self._running = True
        
        if self._http_client is None:
            import aiohttp
            self._http_client = aiohttp.ClientSession()
        
        while self._running:
            await self.dispatch_batch()
            await asyncio.sleep(interval_seconds)
    
    def stop(self) -> None:
        """Stop dispatcher loop."""
        self._running = False
    
    async def dispatch_batch(self, batch_size: int = 10) -> None:
        """Dispatch a batch of pending messages."""
        messages = self.outbox.get_pending_messages(limit=batch_size)
        
        for message in messages:
            await self.dispatch_message(message)
    
    async def dispatch_message(self, message: OutboxMessage) -> None:
        """Dispatch a single message."""
        try:
            if message.target_url:
                await self._send_http(message)
            else:
                # Internal message, mark as sent
                self.outbox.mark_message_sent(message.message_id)
        except Exception as e:
            if message.attempts >= message.max_attempts - 1:
                self.outbox.mark_message_dead_letter(message.message_id, str(e))
            else:
                self.outbox.mark_message_failed(message.message_id, str(e))
    
    async def _send_http(self, message: OutboxMessage) -> None:
        """Send message via HTTP."""
        if not self._http_client:
            import aiohttp
            self._http_client = aiohttp.ClientSession()
        
        # Exponential backoff
        backoff_seconds = min(2 ** message.attempts, 60)
        await asyncio.sleep(backoff_seconds)
        
        async with self._http_client.request(
            method=message.target_method,
            url=message.target_url,
            json=message.payload,
            headers=message.headers,
            timeout=aiohttp.ClientTimeout(total=30)
        ) as response:
            if response.status < 400:
                self.outbox.mark_message_sent(message.message_id)
            else:
                error = f"HTTP {response.status}: {await response.text()}"
                raise Exception(error)
    
    async def shutdown(self) -> None:
        """Shutdown dispatcher."""
        self._running = False
        if self._http_client:
            await self._http_client.close()
            self._http_client = None


class OutboxIntegration:
    """
    Integration helper for using outbox within UnitOfWork.
    
    Example:
        async with unit_of_work as uow:
            uow.save_mission(mission)
            outbox_integration.write_webhook(uow, "https://api.example.com/webhook", payload)
            # Transaction commits, webhook dispatched in background
    """
    
    def __init__(self, outbox: Outbox):
        self.outbox = outbox
    
    def write_webhook(
        self,
        url: str,
        payload: Dict[str, Any],
        method: str = "POST",
        headers: Optional[Dict[str, str]] = None,
        idempotency_key: Optional[str] = None
    ) -> str:
        """Write webhook message to outbox."""
        return self.outbox.write_message(
            message_type="WEBHOOK",
            payload=payload,
            target_url=url,
            target_method=method,
            headers=headers,
            idempotency_key=idempotency_key
        )
    
    def write_event_notification(
        self,
        event_type: str,
        payload: Dict[str, Any],
        idempotency_key: Optional[str] = None
    ) -> str:
        """Write event notification to outbox."""
        return self.outbox.write_message(
            message_type="EVENT_NOTIFICATION",
            payload={"event_type": event_type, **payload},
            idempotency_key=idempotency_key
        )
    
    def write_artifact_notification(
        self,
        artifact_id: str,
        mission_id: str,
        idempotency_key: Optional[str] = None
    ) -> str:
        """Write artifact notification to outbox."""
        return self.outbox.write_message(
            message_type="ARTIFACT_STORED",
            payload={"artifact_id": artifact_id, "mission_id": mission_id},
            idempotency_key=idempotency_key
        )
