#!/usr/bin/env python3
"""
Replay Worker
Processes CLAIM_GENERATED events and executes replay verification.
Emits REPLAY_EXECUTED events.
"""

import os
import sys
import psycopg2
import json
import uuid
from datetime import datetime
from typing import Dict, Any
from pathlib import Path

from runtime.configuration import get_postgres_config
from constitution.authority import CanonicalAuthority


class ReplayWorker:
    """Replay Worker"""
    
    def __init__(self, postgres_config: Dict[str, Any]):
        self.postgres_config = postgres_config
        
    def get_connection(self):
        """Get PostgreSQL connection"""
        return psycopg2.connect(**self.postgres_config)
    
    def execute_replay(self, aggregate_id: str) -> Dict[str, Any]:
        """Execute replay verification for aggregate"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Fetch all events for this aggregate
        cursor.execute("""
            SELECT event_id, event_type, timestamp, event_data
            FROM events
            WHERE aggregate_id = %s
            ORDER BY timestamp ASC
        """, (aggregate_id,))
        
        events = []
        for row in cursor.fetchall():
            events.append({
                "event_id": row[0],
                "event_type": row[1],
                "timestamp": row[2],
                "event_data": row[3]
            })
        
        cursor.close()
        conn.close()

        # Compute replay fingerprint using constitutional hashing
        authority = CanonicalAuthority()
        event_data = json.dumps(events, sort_keys=True, default=str)
        canonical_bytes = authority.serialize_to_canonical_bytes({"events": events})
        replay_fingerprint = authority.hash_canonical_bytes(canonical_bytes)
        
        # Simple replay verification: check event sequence integrity
        verified = True
        expected_sequence = ["DOCUMENT_IMPORTED", "OBSERVATION_CREATED", "CLAIM_GENERATED"]
        actual_sequence = [e["event_type"] for e in events]
        
        for expected, actual in zip(expected_sequence, actual_sequence):
            if expected != actual:
                verified = False
                break
        
        return {
            "verified": verified,
            "replay_fingerprint": replay_fingerprint,
            "event_count": len(events),
            "aggregate_id": aggregate_id
        }
    
    def emit_replay_executed_event(self, event_id: str, aggregate_id: str, document_id: str, replay_result: Dict[str, Any]):
        """Emit REPLAY_EXECUTED event"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        new_event_id = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            new_event_id,
            "REPLAY_EXECUTED",
            datetime.utcnow(),
            aggregate_id,
            "DOCUMENT",
            json.dumps({
                "document_id": document_id,
                "source_event_id": event_id,
                "verified": replay_result["verified"],
                "replay_fingerprint": replay_result["replay_fingerprint"],
                "event_count": replay_result["event_count"]
            })
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return new_event_id
    
    def handle_claim_generated(self, event: Dict[str, Any]):
        """Handle CLAIM_GENERATED event"""
        event_id = event["event_id"]
        aggregate_id = event["aggregate_id"]
        event_data = event["event_data"]
        document_id = event_data.get("document_id")
        
        if not aggregate_id:
            print("No aggregate_id in event")
            return
        
        print(f"Executing replay for aggregate: {aggregate_id} (document_id: {document_id})")
        
        # Execute replay
        replay_result = self.execute_replay(aggregate_id)
        
        # Emit REPLAY_EXECUTED event
        self.emit_replay_executed_event(event_id, aggregate_id, aggregate_id, replay_result)
        
        print(f"Replay executed for aggregate {aggregate_id}: {replay_result['verified']}")


def main():
    """Main execution"""
    postgres_config = get_postgres_config()
    
    worker = ReplayWorker(postgres_config)
    
    # Test with a sample event
    sample_event = {
        "event_id": str(uuid.uuid4()),
        "event_type": "CLAIM_GENERATED",
        "timestamp": datetime.utcnow().isoformat(),
        "aggregate_id": "test-doc-001",
        "aggregate_type": "DOCUMENT",
        "event_data": {
            "document_id": "test-doc-001",
            "source_event_id": str(uuid.uuid4()),
            "claim_count": 5
        }
    }
    
    worker.handle_claim_generated(sample_event)
    print("Replay worker test complete")


if __name__ == "__main__":
    main()
