#!/usr/bin/env python3
"""
Summary worker stub — generates a short summary and emits OBSERVATION_CREATED event.
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


def summarize(text):
    # naive summary: return first 3 sentences
    sentences = text.split('.')
    return '.'.join(sentences[:3]).strip()


if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--artifact_id', required=True)
    p.add_argument('--text', required=True)
    args = p.parse_args()

    summary = summarize(args.text)
    payload = {'artifact_id': args.artifact_id, 'summary': summary}
    emit_event('digestion', 'OBSERVATION_CREATED', payload)
    print('Emitted OBSERVATION_CREATED')
