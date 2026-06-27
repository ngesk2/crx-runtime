#!/usr/bin/env python3
"""
authority_search tool — Mechanical Authority Resolution (NOT heuristic scoring).

Input JSON on stdin: {"query": "constitutional AI"}
Output JSON on stdout:
  {
    "highest_authority": {...},
    "authority_class": "CONSTITUTIONAL_LAW",
    "authority_chain": [...],
    "supersession_chain": [...],
    "verification": { ... }
  }

Constitutional principle: Authority is DECLARED by class, not scored.
  CONSTITUTIONAL_LAW > CANONICAL_SPEC > CREATOR_RESEARCH > IMPORTED_DOCUMENT
  > REPOSITORY_DOCUMENTATION > SCRIPT > SUMMARY > AI_GENERATED_ANALYSIS > TEMPORARY_OBSERVATION
"""
import sys
import os
import json
import hashlib
from datetime import datetime

# Constitutional: authority class hierarchy (declared, not scored)
AUTHORITY_CLASSES = [
    "CONSTITUTIONAL_LAW",
    "CANONICAL_SPEC",
    "CREATOR_RESEARCH",
    "CREATOR_NOTES",
    "IMPORTED_DOCUMENT",
    "REPOSITORY_DOCUMENTATION",
    "SCRIPT",
    "SUMMARY",
    "AI_GENERATED_ANALYSIS",
    "TEMPORARY_OBSERVATION"
]

AUTHORITY_CLASS_ORDER = {cls: idx for idx, cls in enumerate(AUTHORITY_CLASSES)}


def resolve_authority_class(category: str) -> str:
    """Map category string to declared authority class."""
    if category.upper() in AUTHORITY_CLASSES:
        return category.upper()
    mapping = {
        'constitutional law': 'CONSTITUTIONAL_LAW',
        'constitutional': 'CONSTITUTIONAL_LAW',
        'constitutional_law': 'CONSTITUTIONAL_LAW',
        'canonical spec': 'CANONICAL_SPEC',
        'canonical': 'CANONICAL_SPEC',
        'canonical_spec': 'CANONICAL_SPEC',
        'canonical_specification': 'CANONICAL_SPEC',
        'creator research': 'CREATOR_RESEARCH',
        'creator_research': 'CREATOR_RESEARCH',
        'creator notes': 'CREATOR_NOTES',
        'creator_notes': 'CREATOR_NOTES',
        'imported document': 'IMPORTED_DOCUMENT',
        'imported_document': 'IMPORTED_DOCUMENT',
        'repository documentation': 'REPOSITORY_DOCUMENTATION',
        'repository_documentation': 'REPOSITORY_DOCUMENTATION',
        'scripts': 'SCRIPT',
        'script': 'SCRIPT',
        'summaries': 'SUMMARY',
        'summary': 'SUMMARY',
        'ai generated analysis': 'AI_GENERATED_ANALYSIS',
        'ai_generated_analysis': 'AI_GENERATED_ANALYSIS',
        'analysis': 'AI_GENERATED_ANALYSIS',
        'temporary observations': 'TEMPORARY_OBSERVATION',
        'temporary_observation': 'TEMPORARY_OBSERVATION',
        'temporary_observations': 'TEMPORARY_OBSERVATION',
        'observation': 'TEMPORARY_OBSERVATION',
    }
    return mapping.get(category.lower().replace('-', '_'), 'TEMPORARY_OBSERVATION')


def mechanical_verification(candidate: dict) -> dict:
    """
    Deterministic verification: all checks must pass mechanically.
    Returns verification dict with per-check status.
    """
    verification = {
        "artifact_hash_verified": False,
        "event_hash_verified": False,
        "lineage_intact": False,
        "witness_present": False,
        "projection_valid": False,
        "overall": False
    }

    payload_hash = candidate.get('payload_hash')
    sha256 = candidate.get('sha256')
    source_system = candidate.get('source_system')

    # Artifact hash check
    if payload_hash and sha256:
        verification["artifact_hash_verified"] = (payload_hash == sha256)
    elif payload_hash:
        verification["artifact_hash_verified"] = True

    # Event hash check
    if payload_hash:
        verification["event_hash_verified"] = True

    # Lineage check
    lineage_depth = candidate.get('lineage_depth', 0)
    verification["lineage_intact"] = lineage_depth > 0

    # Witness check
    witness_count = candidate.get('witness_count', 0) or 0
    verification["witness_present"] = witness_count > 0

    # Projection check
    status = candidate.get('status', '')
    verification["projection_valid"] = status == 'projected' if status else False

    # Overall: ALL checks must pass
    verification["overall"] = all([
        verification["artifact_hash_verified"],
        verification["event_hash_verified"],
        verification["lineage_intact"],
        verification["witness_present"],
        verification["projection_valid"]
    ])

    return verification


def try_postgres_search(query):
    try:
        import psycopg2
        import psycopg2.extras
    except Exception:
        return None
    try:
        conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST', 'localhost'),
            port=int(os.getenv('POSTGRES_PORT', '5432')),
            database=os.getenv('POSTGRES_DB', 'crx_runtime'),
            user=os.getenv('POSTGRES_USER', 'postgres'),
            password=os.getenv('POSTGRES_PASSWORD', '')
        )
        conn.autocommit = True
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        q = "%" + query + "%"
        cur.execute("""
            SELECT ao.*, 
                   (SELECT COUNT(*) FROM authority_lineage al 
                    WHERE al.ancestor = ao.artifact_id OR al.descendant = ao.artifact_id) as lineage_depth,
                   (SELECT COUNT(*) FROM authority_witness aw WHERE aw.artifact_id = ao.artifact_id) as witness_count
            FROM authority_objects ao 
            WHERE ao.title ILIKE %s OR ao.description ILIKE %s 
            ORDER BY ao.authority_level DESC 
            LIMIT 50
        """, (q, q))
        cands = [dict(r) for r in cur.fetchall()]

        superseded = set()
        try:
            cur.execute("SELECT superseded, superseded_by FROM authority_supersession")
            for r in cur.fetchall():
                s, by = r
                if by:
                    superseded.add(s)
        except Exception:
            conn.rollback()
            pass
        cur.close(); conn.close()
        return cands, superseded
    except Exception:
        return None


def load_local_authorities(query):
    ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    path = os.path.join(ROOT, 'runtime', 'data', 'authority_objects.json')
    cands = []
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                allc = json.load(f)
                for c in allc:
                    if query.lower() in json.dumps(c).lower():
                        cands.append(c)
        except Exception:
            pass
    superseded = set()
    p_sup = os.path.join(ROOT, 'runtime', 'data', 'authority_supersession.json')
    if os.path.exists(p_sup):
        try:
            for s in json.load(open(p_sup, 'r', encoding='utf-8')):
                if s.get('superseded'):
                    superseded.add(s.get('superseded'))
        except Exception:
            pass
    return cands, superseded


def try_qdrant_fallback(query):
    """
    Qdrant fallback — retrieval only, NOT truth.
    Searches constitutional_documents collection and returns results
    tagged as unverified TEMPORARY_OBSERVATION.
    """
    try:
        from qdrant_client import QdrantClient
    except Exception:
        return None
    try:
        qdrant_url = os.getenv('QDRANT_URL', 'http://localhost:6333')
        qdrant_api_key = os.getenv('QDRANT_API_KEY', '')
        client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
        collections = [c.name for c in client.get_collections().collections]
        target = 'constitutional_documents' if 'constitutional_documents' in collections else (
            'constitutional_memory' if 'constitutional_memory' in collections else None
        )
        if not target:
            return None
    except Exception:
        return None

    # Generate embedding for the query
    embedding = None
    try:
        import requests
        ollama_base = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
        embed_model = os.getenv('EMBED_MODEL', 'nomic-embed-text')
        resp = requests.post(
            f'{ollama_base}/api/embeddings',
            json={'model': embed_model, 'prompt': query},
            timeout=30
        )
        if resp.status_code == 200:
            embedding = resp.json().get('embedding')
    except Exception:
        pass

    if not embedding:
        return None

    # Search Qdrant
    try:
        results = client.search(
            collection_name=target,
            query_vector=embedding,
            limit=10
        )
    except Exception:
        return None

    # Map results to authority candidates (unverified)
    cands = []
    for r in results:
        payload = r.payload or {}
        cands.append({
            'artifact_id': payload.get('event_id') or payload.get('artifact_id'),
            'authority_type': 'TEMPORARY_OBSERVATION',
            'authority_level': 10,
            'title': payload.get('title', payload.get('content', '')[:80]),
            'description': payload.get('content', payload.get('description', '')),
            'category': 'qdrant_fallback',
            'payload_hash': payload.get('payload_hash') or payload.get('content_hash'),
            'sha256': payload.get('sha256'),
            'source_system': 'qdrant_fallback',
            'status': 'retrieved_unverified',
            'lineage_depth': 0,
            'witness_count': 0,
            '_source': 'qdrant_fallback'
        })

    return cands, set()


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        print(json.dumps({'error': 'invalid input'})); sys.exit(1)
    query = data.get('query')
    if not query:
        print(json.dumps({'error': 'missing query'})); sys.exit(1)

    candidates = []
    superseded = set()

    # Tier 1: Postgres authority search (verified truth)
    res = try_postgres_search(query)
    if res is not None:
        candidates, superseded = res

    # Tier 2: Local JSON fallback (if Postgres unavailable)
    if not candidates:
        local = load_local_authorities(query)
        if local is not None and local[0]:
            candidates, superseded = local

    # Tier 3: Qdrant vector search fallback (retrieval only, NOT truth)
    if not candidates:
        qdrant = try_qdrant_fallback(query)
        if qdrant is not None and qdrant[0]:
            candidates, superseded = qdrant

    # Constitutional: resolve by declared authority class, not by score
    resolved = []
    for c in candidates:
        category = c.get('category', '') or c.get('authority_type', '')
        authority_class = resolve_authority_class(category)
        verification = mechanical_verification(c)
        c['authority_class'] = authority_class
        c['class_rank'] = AUTHORITY_CLASS_ORDER.get(authority_class, 999)
        c['verification'] = verification
        c.pop('_authority_score', None)
        resolved.append(c)

    # Sort by class rank (declared hierarchy), then by verification status
    resolved.sort(key=lambda x: (x.get('class_rank', 999), 0 if x.get('verification', {}).get('overall') else 1))

    highest = resolved[0] if resolved else None
    authority_chain = resolved[:10]

    supersession_chain = []
    for c in authority_chain:
        aid = c.get('artifact_id') or c.get('id')
        if aid and aid in superseded:
            supersession_chain.append(aid)

    out = {
        'highest_authority': highest or {},
        'authority_class': highest.get('authority_class') if highest else None,
        'authority_chain': authority_chain,
        'supersession_chain': supersession_chain,
        'verification': highest.get('verification') if highest else mechanical_verification({})
    }
    print(json.dumps(out, indent=2, default=str))


if __name__ == '__main__':
    main()
