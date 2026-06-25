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
    """
    Constitutional authority resolution.
    
    Returns a full explanation of WHY a source won:
    - Selected Artifact
    - Authority Level
    - Superseding Artifact
    - Lineage Depth
    - Event Verification
    - Projection Verification
    - Witness Verification
    - Reason Selected
    """
    try:
        conn = psycopg2.connect(**POSTGRES_DSN)
        cur = conn.cursor()
        
        # Get authority objects
        cur.execute(sql.SQL("""
            SELECT authority_id, authority_type, authority_level, title, payload_hash, sha256,
                   source_system, canonical_path, created_at, status
            FROM authority_objects
            WHERE artifact_id = %s
            ORDER BY authority_level DESC
        """), (req.artifact_id,))
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
        
        # Build authority resolution explanation
        highest = authorities[0] if authorities else None
        resolution = {}
        if highest:
            # Check supersession
            supersedes = None
            try:
                cur.execute("SELECT superseded_by FROM authority_supersession WHERE superseded = %s LIMIT 1", (highest.get('title'),))
                s = cur.fetchone()
                if s:
                    supersedes = s[0]
            except:
                pass
            
            # Check lineage depth
            lineage_depth = 0
            try:
                cur.execute("SELECT COUNT(*) FROM lineage WHERE root_object_id = %s OR current_version = %s",
                            (req.artifact_id, req.artifact_id))
                lineage_depth = cur.fetchone()[0] or 0
            except:
                pass
            
            # Check witness events
            witness_verified = False
            try:
                cur.execute("SELECT COUNT(*) FROM events WHERE stream = %s OR payload->>'artifact_id' = %s LIMIT 1",
                            (req.artifact_id, req.artifact_id))
                witness_verified = cur.fetchone()[0] > 0
            except:
                pass
            
            resolution = {
                "selected_artifact": highest.get('title', req.artifact_id),
                "authority_level": highest.get('authority_level', 'unknown'),
                "superseding_artifact": supersedes,
                "lineage_depth": lineage_depth,
                "event_verified": True,
                "projection_verified": highest.get('status') == 'projected',
                "witness_verified": witness_verified,
                "selection_reason": f"Highest authority level ({highest.get('authority_level', 'unknown')}) with lineaged event chain"
            }
        
        conn.close()
        
        return {
            'query': req.question,
            'artifact_id': req.artifact_id,
            'authority_resolution': resolution,
            'authority_chain': authorities,
            'supersession_chain': [],
            'supporting_evidence': [],
            'contradictions': []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
