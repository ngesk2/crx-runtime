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
from qdrant_client import QdrantClient
import psycopg2
from psycopg2 import sql

QDRANT_URL = os.getenv('QDRANT_URL')
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


def get_postgres_event_payload_hash(conn, event_id):
    try:
        cur = conn.cursor()
        cur.execute(sql.SQL("SELECT payload FROM events WHERE id = %s"), (event_id,))
        row = cur.fetchone()
        if not row:
            return None
        payload = row[0]
        try:
            h = hashlib.sha256(canonical_json(payload).encode()).hexdigest()
            return h
        except Exception:
            return hashlib.sha256(str(payload).encode()).hexdigest()
    except Exception as e:
        print('Postgres lookup error', e)
        return None


def main():
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

    try:
        pg_conn = psycopg2.connect(host=POSTGRES_HOST, port=POSTGRES_PORT, database=POSTGRES_DB, user=POSTGRES_USER, password=POSTGRES_PASSWORD)
    except Exception as e:
        print('Failed to connect to Postgres:', e)
        return

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

    offset = None
    while True:
        try:
            resp = client.scroll(collection_name=QDRANT_COLLECTION, limit=BATCH, offset=offset, with_payload=True)
        except Exception as e:
            print('Qdrant scroll error', e)
            break

        points = resp.get('points') if isinstance(resp, dict) else getattr(resp, 'points', None)
        if not points:
            break

        for p in points:
            projection_count += 1
            payload = p.get('payload') if isinstance(p, dict) else p.payload
            if not payload:
                continue
            event_id = payload.get('event_id')
            q_payload_hash = payload.get('payload_hash')
            if not event_id:
                orphan_count += 1
                continue
            pg_hash = get_postgres_event_payload_hash(pg_conn, event_id)
            if not pg_hash:
                orphan_count += 1
                continue
            if q_payload_hash == pg_hash:
                verified_count += 1
                csv_writer.writerow([p.get('id') if isinstance(p, dict) else p.id, event_id, q_payload_hash, pg_hash, 'VERIFIED'])
            else:
                mismatch_count += 1
                csv_writer.writerow([p.get('id') if isinstance(p, dict) else p.id, event_id, q_payload_hash, pg_hash, 'MISMATCH'])

        # advance offset if supported
        if isinstance(resp, dict):
            # Qdrant REST response format
            if not resp.get('points'):
                break
            offset = (offset or 0) + BATCH
        else:
            # client object may return limited interface
            break

    print('projection_count', projection_count)
    print('verified_count', verified_count)
    print('mismatch_count', mismatch_count)
    print('orphan_count', orphan_count)
    csv_file.close()
    print(f'Wrote per-projection details to {csv_path}')


if __name__ == '__main__':
    main()
