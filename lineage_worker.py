#!/usr/bin/env python3
"""
Lineage Worker
Processes WITNESS_CREATED events and stores lineage information.
Emits LINEAGE_CREATED events.
"""

import os
import psycopg2
import json
import uuid
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


class LineageWorker:
    """Lineage Worker"""
    
    def __init__(self, postgres_config: Dict[str, Any]):
        self.postgres_config = postgres_config
        
    def get_connection(self):
        """Get PostgreSQL connection"""
        return psycopg2.connect(**self.postgres_config)
    
    def build_lineage_chain(self, document_id: str) -> list:
        """Build lineage chain for document"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Fetch all events for this document in order
        cursor.execute("""
            SELECT event_id, event_type, timestamp
            FROM events
            WHERE aggregate_id = %s
            ORDER BY timestamp ASC
        """, (document_id,))
        
        lineage_chain = []
        for row in cursor.fetchall():
            lineage_chain.append({
                "event_id": row[0],
                "event_type": row[1],
                "timestamp": row[2]
            })
        
        cursor.close()
        conn.close()
        
        return lineage_chain
    
    def store_lineage(self, document_id: str, lineage_chain: list, witness_root: str):
        """Store lineage in lineage table"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Store lineage as JSON
        cursor.execute("""
            INSERT INTO lineage (id, parent_id, child_id, edge_type, created_at)
            VALUES (%s, %s, %s, %s, %s)
        """, (str(uuid.uuid4()), document_id, witness_root, "witness_link", datetime.utcnow()))
        
        conn.commit()
        cursor.close()
        conn.close()
    
    def emit_lineage_created_event(self, event_id: str, aggregate_id: str, document_id: str, lineage_chain: list):
        """Emit LINEAGE_CREATED event"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        new_event_id = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            new_event_id,
            "LINEAGE_CREATED",
            datetime.utcnow(),
            aggregate_id,
            "DOCUMENT",
            json.dumps({
                "document_id": document_id,
                "source_event_id": event_id,
                "lineage_chain": lineage_chain,
                "chain_length": len(lineage_chain)
            })
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return new_event_id
    
    def handle_witness_created(self, event: Dict[str, Any]):
        """Handle WITNESS_CREATED event"""
        event_id = event["event_id"]
        aggregate_id = event["aggregate_id"]
        event_data = event["event_data"]
        document_id = event_data.get("document_id")
        witness_root = event_data.get("witness_root")
        
        if not document_id or not witness_root:
            print("Missing document_id or witness_root in event data")
            return
        
        print(f"Building lineage for document: {document_id}")
        
        # Build lineage chain
        lineage_chain = self.build_lineage_chain(aggregate_id)
        
        # Store lineage
        self.store_lineage(document_id, lineage_chain, witness_root)
        
        # Emit LINEAGE_CREATED event
        self.emit_lineage_created_event(event_id, aggregate_id, document_id, lineage_chain)
        
        print(f"Lineage created for document {document_id} with {len(lineage_chain)} events")


def main():
    """Main execution"""
    postgres_config = get_postgres_config()
    
    worker = LineageWorker(postgres_config)
    
    # Test with a sample event
    sample_event = {
        "event_id": str(uuid.uuid4()),
        "event_type": "WITNESS_CREATED",
        "timestamp": datetime.utcnow().isoformat(),
        "aggregate_id": "test-doc-001",
        "aggregate_type": "DOCUMENT",
        "event_data": {
            "document_id": "test-doc-001",
            "source_event_id": str(uuid.uuid4()),
            "witness_root": "test-witness-root-123",
            "replay_fingerprint": "test-fingerprint-456"
        }
    }
    
    worker.handle_witness_created(sample_event)
    print("Lineage worker test complete")


if __name__ == "__main__":
    main()
