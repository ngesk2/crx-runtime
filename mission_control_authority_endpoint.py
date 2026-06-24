"""
Simple FastAPI endpoint for authority resolution (read-only, query-only).
This is a light-weight stub that demonstrates the expected API and response
format. It does not implement complex resolution logic — that's for Phase E.3.
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import psycopg2
from psycopg2 import sql
import json

app = FastAPI()

POSTGRES_DSN = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': int(os.getenv('POSTGRES_PORT', '5432')),
    'database': os.getenv('POSTGRES_DB', 'crx_runtime'),
    'user': os.getenv('POSTGRES_USER', 'postgres'),
    'password': os.getenv('POSTGRES_PASSWORD', '')
}

class ResolveRequest(BaseModel):
    artifact_id: str
    question: str

@app.get('/authority/resolve')
def health():
    return {'status': 'ok'}

@app.post('/authority/resolve')
def resolve(req: ResolveRequest):
    # minimal read-only behaviour: return authority_objects for artifact_id
    try:
        conn = psycopg2.connect(**POSTGRES_DSN)
        cur = conn.cursor()
        cur.execute(sql.SQL("SELECT authority_id, authority_type, authority_level, title, payload_hash, sha256, source_system, canonical_path, created_at, status FROM authority_objects WHERE artifact_id = %s ORDER BY authority_level DESC"), (req.artifact_id,))
        rows = cur.fetchall()
        authorities = []
        for r in rows:
            authorities.append({
                'authority_id': str(r[0]),
                'authority_type': r[1],
                'authority_level': r[2],
                'title': r[3],
                'payload_hash': r[4],
                'sha256': r[5],
                'source_system': r[6],
                'canonical_path': r[7],
                'created_at': str(r[8]),
                'status': r[9]
            })
        conn.close()

        response = {
            'highest_authority': authorities[0] if authorities else None,
            'authority_chain': authorities,
            'supersession_chain': [],
            'supporting_evidence': [],
            'contradictions': [],
            'confidence': 1.0 if authorities else 0.0
        }
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
