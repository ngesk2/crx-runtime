#!/usr/bin/env python3
"""
Embedding worker stub — creates embeddings using local Ollama endpoint and stores embedding metadata as events.
"""
import os
import json
import requests
import psycopg2
from datetime import datetime

OLLAMA_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
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


def embed(text, model='nomic-embed-text:latest'):
    resp = requests.post(f"{OLLAMA_URL}/api/embeddings", json={'model': model, 'input': text}, timeout=30)
    if resp.status_code == 200:
        return resp.json().get('embedding')
    return None


if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--artifact_id', required=True)
    p.add_argument('--text', required=True)
    args = p.parse_args()

    emb = embed(args.text)
    payload = {'artifact_id': args.artifact_id, 'embedding_len': len(emb) if emb else 0}
    emit_event('digestion', 'DOCUMENT_EMBEDDED', payload)
    print('Emitted DOCUMENT_EMBEDDED')
