#!/usr/bin/env python3
"""
Observation Worker
Processes DOCUMENT_IMPORTED events and extracts observations.
Emits OBSERVATION_CREATED events.
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


class ObservationWorker:
    """Observation Worker"""
    
    def __init__(self, postgres_config: Dict[str, Any]):
        self.postgres_config = postgres_config
        
    def get_connection(self):
        """Get PostgreSQL connection"""
        return psycopg2.connect(**self.postgres_config)
    
    def extract_observations(self, document_data: Dict[str, Any]) -> list:
        """Extract observations from document"""
        observations = []
        
        # Extract basic document observations
        if "title" in document_data:
            observations.append({
                "observation_type": "title",
                "observation_data": {"title": document_data["title"]}
            })
        
        if "content" in document_data:
            content = document_data["content"]
            observations.append({
                "observation_type": "content_length",
                "observation_data": {"length": len(content)}
            })
            
            # Extract paragraphs as observations
            paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
            for i, paragraph in enumerate(paragraphs):
                observations.append({
                    "observation_type": "paragraph",
                    "observation_data": {"index": i, "text": paragraph}
                })
        
        if "source" in document_data:
            observations.append({
                "observation_type": "source",
                "observation_data": {"source": document_data["source"]}
            })
        
        return observations
    
    def create_observations(self, event_id: str, aggregate_id: str, document_data: Dict[str, Any]):
        """Create observations from document"""
        observations = self.extract_observations(document_data)
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        for obs in observations:
            observation_id = str(uuid.uuid4())
            
            cursor.execute("""
                INSERT INTO observations (observation_id, event_id, document_id, observation_type, observation_data)
                VALUES (%s, %s, %s, %s, %s)
            """, (observation_id, event_id, aggregate_id, obs["observation_type"], json.dumps(obs["observation_data"])))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return observations
    
    def emit_observation_created_event(self, event_id: str, aggregate_id: str, document_id: str, observation_count: int):
        """Emit OBSERVATION_CREATED event"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        new_event_id = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            new_event_id,
            "OBSERVATION_CREATED",
            datetime.utcnow(),
            aggregate_id,
            "DOCUMENT",
            json.dumps({
                "document_id": document_id,
                "source_event_id": event_id,
                "observation_count": observation_count
            })
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return new_event_id
    
    def handle_document_imported(self, event: Dict[str, Any]):
        """Handle DOCUMENT_IMPORTED event"""
        event_id = event["event_id"]
        aggregate_id = event["aggregate_id"]
        event_data = event["event_data"]
        document_id = event_data.get("document_id")
        
        if not aggregate_id:
            print("No aggregate_id in event")
            return
        
        print(f"Processing aggregate: {aggregate_id} (document_id: {document_id})")
        
        # Create observations
        observations = self.create_observations(event_id, aggregate_id, event_data)
        
        # Emit OBSERVATION_CREATED event
        self.emit_observation_created_event(event_id, aggregate_id, aggregate_id, len(observations))
        
        print(f"Created {len(observations)} observations for aggregate {aggregate_id}")


def main():
    """Main execution"""
    postgres_config = get_postgres_config()
    
    worker = ObservationWorker(postgres_config)
    
    # Test with a sample event
    sample_event = {
        "event_id": str(uuid.uuid4()),
        "event_type": "DOCUMENT_IMPORTED",
        "timestamp": datetime.utcnow().isoformat(),
        "aggregate_id": "test-doc-001",
        "aggregate_type": "DOCUMENT",
        "event_data": {
            "title": "Test Document",
            "content": "This is a test document.\n\nIt has multiple paragraphs.\n\nThis is the third paragraph.",
            "source": "test",
            "document_id": "test-doc-001"
        }
    }
    
    worker.handle_document_imported(sample_event)
    print("Observation worker test complete")


if __name__ == "__main__":
    main()
