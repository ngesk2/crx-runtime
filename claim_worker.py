#!/usr/bin/env python3
"""
Claim Worker
Processes OBSERVATION_CREATED events and extracts claims.
Emits CLAIM_GENERATED events.
"""

import os
import sys
import psycopg2
import json
import uuid
from datetime import datetime
from typing import Dict, Any
from pathlib import Path

# Add constitutional path for SecretAdapter
sys.path.append(str(Path(__file__).parent / 'runtime' / 'constitutional'))
from secret_adapter import get_secret_adapter

def get_postgres_config() -> Dict[str, Any]:
    """Get PostgreSQL configuration from SecretAdapter and environment variables"""
    secret_adapter = get_secret_adapter()
    return {
        "host": os.getenv("POSTGRES_HOST", "localhost"),
        "port": int(os.getenv("POSTGRES_PORT", "5432")),
        "database": os.getenv("POSTGRES_DB", "crx_runtime"),
        "user": os.getenv("POSTGRES_USER", "postgres"),
        "password": secret_adapter.get_postgres_password() or os.getenv("POSTGRES_PASSWORD", "postgres")
    }


class ClaimWorker:
    """Claim Worker"""
    
    def __init__(self, postgres_config: Dict[str, Any]):
        self.postgres_config = postgres_config
        
    def get_connection(self):
        """Get PostgreSQL connection"""
        return psycopg2.connect(**self.postgres_config)
    
    def extract_claims_from_observations(self, event_id: str) -> list:
        """Extract claims from observations for a given event"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT observation_id, observation_type, observation_data
            FROM observations
            WHERE event_id = %s
        """, (event_id,))
        
        claims = []
        
        for row in cursor.fetchall():
            observation_id = row[0]
            observation_type = row[1]
            observation_data = row[2]
            
            # Simple claim extraction based on observation type
            if observation_type == "title":
                claims.append({
                    "claim_text": f"Document title is {observation_data.get('title', 'unknown')}",
                    "confidence": 1.0,
                    "source_observation_id": observation_id
                })
            elif observation_type == "content_length":
                claims.append({
                    "claim_text": f"Document has {observation_data.get('length', 0)} characters",
                    "confidence": 1.0,
                    "source_observation_id": observation_id
                })
            elif observation_type == "paragraph":
                claims.append({
                    "claim_text": f"Document contains paragraph: {observation_data.get('text', '')[:50]}...",
                    "confidence": 0.9,
                    "source_observation_id": observation_id
                })
            elif observation_type == "source":
                claims.append({
                    "claim_text": f"Document source is {observation_data.get('source', 'unknown')}",
                    "confidence": 1.0,
                    "source_observation_id": observation_id
                })
        
        cursor.close()
        conn.close()
        
        return claims
    
    def create_claims(self, event_id: str, claims: list):
        """Create claims in database"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        for claim in claims:
            cursor.execute("""
                INSERT INTO claims (id, claim_text, confidence, created_at)
                VALUES (%s, %s, %s, %s)
            """, (str(uuid.uuid4()), claim["claim_text"], claim["confidence"], datetime.utcnow()))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return claims
    
    def emit_claim_generated_event(self, event_id: str, aggregate_id: str, document_id: str, claim_count: int):
        """Emit CLAIM_GENERATED event"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        new_event_id = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            new_event_id,
            "CLAIM_GENERATED",
            datetime.utcnow(),
            aggregate_id,
            "DOCUMENT",
            json.dumps({
                "document_id": document_id,
                "source_event_id": event_id,
                "claim_count": claim_count
            })
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return new_event_id
    
    def handle_observation_created(self, event: Dict[str, Any]):
        """Handle OBSERVATION_CREATED event"""
        event_id = event["event_id"]
        aggregate_id = event["aggregate_id"]
        event_data = event["event_data"]
        document_id = event_data.get("document_id")
        
        if not aggregate_id:
            print("No aggregate_id in event")
            return
        
        print(f"Processing observations for aggregate: {aggregate_id} (document_id: {document_id})")
        
        # Extract claims from observations
        claims = self.extract_claims_from_observations(event_id)
        
        # Create claims in database
        self.create_claims(event_id, claims)
        
        # Emit CLAIM_GENERATED event
        self.emit_claim_generated_event(event_id, aggregate_id, aggregate_id, len(claims))
        
        print(f"Created {len(claims)} claims for aggregate {aggregate_id}")


def main():
    """Main execution"""
    postgres_config = get_postgres_config()
    
    worker = ClaimWorker(postgres_config)
    
    # Test with a sample event
    sample_event = {
        "event_id": str(uuid.uuid4()),
        "event_type": "OBSERVATION_CREATED",
        "timestamp": datetime.utcnow().isoformat(),
        "aggregate_id": "test-doc-001",
        "aggregate_type": "DOCUMENT",
        "event_data": {
            "document_id": "test-doc-001",
            "source_event_id": str(uuid.uuid4()),
            "observation_count": 3
        }
    }
    
    worker.handle_observation_created(sample_event)
    print("Claim worker test complete")


if __name__ == "__main__":
    main()
