#!/usr/bin/env python3
"""
Claim worker stub — extracts claims/sentences that look like assertions and emits CLAIM_CREATED events.
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


def extract_claims(text):
    # naive claim extraction: sentences containing 'should'|'must'|'is'
    claims = [s.strip() for s in text.split('.') if any(k in s for k in [' should ', ' must ', ' is '])]
    return claims


if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--artifact_id', required=True)
    p.add_argument('--text', required=True)
    args = p.parse_args()

    claims = extract_claims(args.text)
    payload = {'artifact_id': args.artifact_id, 'claims': claims}
    emit_event('digestion', 'CLAIM_CREATED', payload)
    print('Emitted CLAIM_CREATED')
