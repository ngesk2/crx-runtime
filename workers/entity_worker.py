#!/usr/bin/env python3
"""
Entity extraction worker stub — extracts simple named entities and emits events.
"""
import os
import json
import psycopg2
from datetime import datetime

POSTGRES_DSN = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': int(os.getenv('POSTGRES_PORT', '5432')),
    'database': os.getenv('POSTGRES_DB', 'crx_runtime'),
    'user': os.getenv('POSTGRES_USER', 'postgres'),
    'password': os.getenv('POSTGRES_PASSWORD', '')
}


def emit_event(stream, event_type, payload):
    conn = psycopg2.connect(**POSTGRES_DSN)
    cur = conn.cursor()
    cur.execute("INSERT INTO events (stream, event_type, payload, created_at, payload_hash, projected_to_qdrant) VALUES (%s,%s,%s,%s,%s,%s)", (stream, event_type, json.dumps(payload), datetime.utcnow(), None, False))
    conn.commit()
    conn.close()


def extract_entities(text):
    # naive entity extraction: capitalized words
    ents = [w.strip() for w in text.split() if w.istitle()]
    return list(set(ents))


if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--artifact_id', required=True)
    p.add_argument('--text', required=True)
    args = p.parse_args()

    entities = extract_entities(args.text)
    payload = {'artifact_id': args.artifact_id, 'entities': entities}
    emit_event('digestion', 'ENTITIES_EXTRACTED', payload)
    print('Emitted ENTITIES_EXTRACTED')
