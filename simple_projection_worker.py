"""
Simple Projection Worker
Creates projections from PostgreSQL events to Qdrant without requiring sentence_transformers
Uses random embeddings for testing purposes
Uses docker exec to connect to PostgreSQL
"""

import sys
import os
import uuid
import json
import random
import hashlib
import subprocess
from datetime import datetime
from pathlib import Path

# Add runtime path
sys.path.insert(0, str(Path(__file__).parent / 'runtime'))

from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct


def canonical_json(obj):
    """Canonical JSON serialization for consistent hashing."""
    return json.dumps(obj, sort_keys=True, separators=(',', ':'))

# Connect to Qdrant
try:
    client = QdrantClient(host="localhost", port=6333)
    print("Connected to Qdrant")
except Exception as e:
    print(f"ERROR: Failed to connect to Qdrant: {e}")
    sys.exit(1)

# Fetch unprojected events using docker exec
cmd = 'docker exec brain-postgres psql -U postgres -d crx_runtime -c "SELECT id, event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data FROM events WHERE projected_to_qdrant = false;"'
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

if result.returncode != 0:
    print(f"ERROR: Failed to fetch events: {result.stderr}")
    sys.exit(1)

# Parse events from psql output
lines = result.stdout.strip().split('\n')
events = []
for line in lines:
    if line and not line.startswith(' id') and not line.startswith('---') and not line.startswith('('):
        # Parse event data (simplified parsing)
        try:
            parts = line.split('|')
            if len(parts) >= 7:
                event_id = parts[1].strip()
                event_data_json = parts[6].strip()
                event_data = json.loads(event_data_json)
                events.append({
                    'event_id': event_id,
                    'event_data': event_data
                })
        except Exception as e:
            continue

print(f"Found {len(events)} unprojected events")

# Create projections
for event in events:
    event_id = event['event_id']
    event_data = event['event_data']
    
    # Generate random embedding (768 dimensions for nomic-embed-text)
    embedding = [random.random() for _ in range(768)]
    
    # Compute canonical hash (SHA256 of event data using canonical JSON)
    canonical_hash = hashlib.sha256(canonical_json(event_data).encode()).hexdigest()
    
    # Compute embedding hash (SHA256 of embedding)
    embedding_hash = hashlib.sha256(str(embedding).encode()).hexdigest()
    
    # Generate projection signature (placeholder - would use Ed25519 in production)
    projection_signature = hashlib.sha256((canonical_hash + embedding_hash).encode()).hexdigest()
    
    # Create point for Qdrant
    point = PointStruct(
        id=event_id,
        vector=embedding,
        payload={
            "document_id": event_data.get('document_id', event_id),
            "source": event_data.get('source', 'test'),
            "title": event_data.get('title', ''),
            "content": event_data.get('content', ''),
            "event_id": event_id,
            "source_event_id": event_id,
            "canonical_hash": canonical_hash,
            "embedding_hash": embedding_hash,
            "projection_signature": projection_signature,
            "generated_by_worker": "simple_projection_worker",
            "generated_at": datetime.utcnow().isoformat()
        }
    )
    
    # Insert into Qdrant
    try:
        client.upsert(
            collection_name="constitutional_memory",
            points=[point]
        )
        print(f"Projected event {event_id} to Qdrant")
    except Exception as e:
        print(f"ERROR: Failed to project event {event_id}: {e}")
        continue
    
    # Mark event as projected using docker exec
    timestamp = datetime.utcnow().isoformat()
    update_cmd = 'docker exec brain-postgres psql -U postgres -d crx_runtime -c "UPDATE events SET projected_to_qdrant = true, projected_at = \'{}\' WHERE event_id = \'{}\';"'.format(timestamp, event_id)
    result = subprocess.run(update_cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"ERROR: Failed to mark event {event_id} as projected: {result.stderr}")

print("Projection worker complete")
