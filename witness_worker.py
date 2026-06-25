#!/usr/bin/env python3
"""
Witness Worker
Processes REPLAY_EXECUTED events and generates witness roots.
Emits WITNESS_CREATED events.
"""

import os
import psycopg2
import json
import uuid
import hashlib
from datetime import datetime
from typing import Dict, Any

def get_postgres_config() -> Dict[str, Any]:
    """Get PostgreSQL configuration from environment variables"""
    return {
        "host": os.getenv("POSTGRES_HOST", "localhost"),
        "port": int(os.getenv("POSTGRES_PORT", "5432")),
        "database": os.getenv("POSTGRES_DB", "crx_runtime"),
        "user": os.getenv("POSTGRES_USER", "postgres"),
        "password": os.getenv("POSTGRES_PASSWORD", "postgres")
    }


class WitnessWorker:
    """Witness Worker"""
    
    def __init__(self, postgres_config: Dict[str, Any]):
        self.postgres_config = postgres_config
        
    def get_connection(self):
        """Get PostgreSQL connection"""
        return psycopg2.connect(**self.postgres_config)
    
    def generate_witness_root(self, aggregate_id: str, replay_fingerprint: str) -> Dict[str, Any]:
        """Generate witness root from replay fingerprint (deterministic)"""
        # Deterministic witness generation: hash of aggregate_id and replay fingerprint only
        # No timestamp - witnesses must be deterministic for constitutional verification
        witness_data = f"{aggregate_id}:{replay_fingerprint}"
        witness_root = hashlib.sha256(witness_data.encode()).hexdigest()
        
        return {
            "witness_root": witness_root,
            "replay_fingerprint": replay_fingerprint,
            "aggregate_id": aggregate_id
        }
    
    def store_witness(self, witness_data: Dict[str, Any]):
        """Store witness in authority_witness table"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO authority_witness (id, witness_root, created_at)
            VALUES (%s, %s, %s)
        """, (str(uuid.uuid4()), witness_data["witness_root"], datetime.utcnow()))
        
        conn.commit()
        cursor.close()
        conn.close()
    
    def emit_witness_created_event(self, event_id: str, aggregate_id: str, document_id: str, witness_data: Dict[str, Any]):
        """Emit WITNESS_CREATED event"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        new_event_id = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            new_event_id,
            "WITNESS_CREATED",
            datetime.utcnow(),
            aggregate_id,
            "DOCUMENT",
            json.dumps({
                "document_id": document_id,
                "source_event_id": event_id,
                "witness_root": witness_data["witness_root"],
                "replay_fingerprint": witness_data["replay_fingerprint"]
            })
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return new_event_id
    
    def handle_replay_executed(self, event: Dict[str, Any]):
        """Handle REPLAY_EXECUTED event"""
        event_id = event["event_id"]
        aggregate_id = event["aggregate_id"]
        event_data = event["event_data"]
        document_id = event_data.get("document_id")
        replay_fingerprint = event_data.get("replay_fingerprint")
        
        if not aggregate_id or not replay_fingerprint:
            print("Missing aggregate_id or replay_fingerprint in event data")
            return
        
        print(f"Generating witness for aggregate: {aggregate_id} (document_id: {document_id})")
        
        # Generate witness root
        witness_data = self.generate_witness_root(aggregate_id, replay_fingerprint)
        
        # Store witness in database
        self.store_witness(witness_data)
        
        # Emit WITNESS_CREATED event
        self.emit_witness_created_event(event_id, aggregate_id, aggregate_id, witness_data)
        
        print(f"Witness created for aggregate {aggregate_id}: {witness_data['witness_root']}")


def main():
    """Main execution"""
    postgres_config = get_postgres_config()
    
    worker = WitnessWorker(postgres_config)
    
    # Test with a sample event
    sample_event = {
        "event_id": str(uuid.uuid4()),
        "event_type": "REPLAY_EXECUTED",
        "timestamp": datetime.utcnow().isoformat(),
        "aggregate_id": "test-doc-001",
        "aggregate_type": "DOCUMENT",
        "event_data": {
            "document_id": "test-doc-001",
            "source_event_id": str(uuid.uuid4()),
            "verified": True,
            "replay_fingerprint": hashlib.sha256(b"test").hexdigest(),
            "event_count": 3
        }
    }
    
    worker.handle_replay_executed(sample_event)
    print("Witness worker test complete")


if __name__ == "__main__":
    main()
