#!/usr/bin/env python3
"""
Compute projection sovereignty metrics by comparing Qdrant point payload_hash
against Postgres canonical payload hash.

Requires:
  pip install qdrant-client psycopg2-binary

Usage:
  export QDRANT_URL=... QDRANT_API_KEY=... QDRANT_COLLECTION=constitutional_memory
  export POSTGRES_HOST=... POSTGRES_DB=... POSTGRES_USER=... POSTGRES_PASSWORD=...
  python tools/projection_sovereignty_audit.py
"""
import os
import json
import hashlib
import subprocess
from qdrant_client import QdrantClient

QDRANT_URL = os.getenv('QDRANT_URL', 'http://localhost:6333')
QDRANT_API_KEY = os.getenv('QDRANT_API_KEY')
QDRANT_COLLECTION = os.getenv('QDRANT_COLLECTION', 'constitutional_memory')

POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
POSTGRES_PORT = int(os.getenv('POSTGRES_PORT', '5432'))
POSTGRES_DB = os.getenv('POSTGRES_DB', 'crx_runtime')
POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', '')

BATCH = 200


def canonical_json(obj):
    return json.dumps(obj, sort_keys=True, separators=(',', ':'))


def get_postgres_event_payload_hash(event_id):
    """Get event payload hash from PostgreSQL using docker exec."""
    try:
        cmd = 'docker exec brain-postgres psql -U postgres -d crx_runtime -c "SELECT event_data FROM events WHERE event_id = \'{}\';"'.format(event_id)
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            return None
        
        # Parse psql output
        lines = result.stdout.strip().split('\n')
        for line in lines:
            if line and not line.startswith(' event_data') and not line.startswith('---') and not line.startswith('('):
                try:
                    payload = json.loads(line.strip())
                    h = hashlib.sha256(canonical_json(payload).encode()).hexdigest()
                    return h
                except Exception:
                    return hashlib.sha256(line.strip().encode()).hexdigest()
        return None
    except Exception as e:
        print('Postgres lookup error', e)
        return None


def main():
    # Use host/port for local connection
    if QDRANT_URL and QDRANT_URL.startswith('http'):
        client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    else:
        client = QdrantClient(host="localhost", port=6333, api_key=QDRANT_API_KEY)

    projection_count = 0
    verified_count = 0
    mismatch_count = 0
    orphan_count = 0

    # open CSV for per-projection details
    import csv
    csv_path = os.path.join('projection_verification.csv')
    csv_file = open(csv_path, 'w', newline='', encoding='utf-8')
    csv_writer = csv.writer(csv_file)
    csv_writer.writerow(['point_id', 'event_id', 'q_payload_hash', 'pg_payload_hash', 'status'])

    # Try scroll with proper Qdrant client API
    try:
        records, offset = client.scroll(
            collection_name=QDRANT_COLLECTION,
            limit=BATCH,
            with_payload=True,
            with_vectors=False
        )
        
        while records:
            for p in records:
                projection_count += 1
                payload = p.payload
                if not payload:
                    continue
                event_id = payload.get('event_id')
                q_payload_hash = payload.get('canonical_hash')  # Use canonical_hash instead of payload_hash
                if not event_id:
                    orphan_count += 1
                    continue
                pg_hash = get_postgres_event_payload_hash(event_id)
                if not pg_hash:
                    orphan_count += 1
                    continue
                if q_payload_hash == pg_hash:
                    verified_count += 1
                    csv_writer.writerow([p.id, event_id, q_payload_hash, pg_hash, 'VERIFIED'])
                else:
                    mismatch_count += 1
                    csv_writer.writerow([p.id, event_id, q_payload_hash, pg_hash, 'MISMATCH'])
            
            # Get next batch
            records, offset = client.scroll(
                collection_name=QDRANT_COLLECTION,
                limit=BATCH,
                offset=offset,
                with_payload=True,
                with_vectors=False
            )
    except Exception as e:
        print('Qdrant scroll error', e)
        import traceback
        traceback.print_exc()

    print('projection_count', projection_count)
    print('verified_count', verified_count)
    print('mismatch_count', mismatch_count)
    print('orphan_count', orphan_count)
    csv_file.close()
    print(f'Wrote per-projection details to {csv_path}')


if __name__ == '__main__':
    main()
