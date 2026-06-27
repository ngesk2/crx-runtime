#!/usr/bin/env python3
"""
contradiction_search tool
Input JSON on stdin: {"claim": "All inference must use InferenceAdapter"}
Output JSON on stdout: {"supporting": [...], "contradicting": [...], "confidence": 0.93}

Heuristic stance detection. Tries Postgres first, falls back to runtime/data/*.json
"""
import sys
import os
import json
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
POSTGRES_DSN = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': int(os.getenv('POSTGRES_PORT', '5432')),
    'database': os.getenv('POSTGRES_DB', 'crx_runtime'),
    'user': os.getenv('POSTGRES_USER', 'postgres'),
    'password': os.getenv('POSTGRES_PASSWORD', '')
}
NEGATIONS = re.compile(r"\b(no|not|never|none|cannot|can't|without|deny|contradict|refute)\b", re.I)


def stance_of_text(claim, text):
    # Returns 'support' or 'contradict' or 'neutral' using simple heuristics
    lc = text.lower()
    c = claim.lower()
    if c in lc:
        # check for negation near the phrase
        idx = lc.find(c)
        window = lc[max(0, idx-50): idx+len(c)+50]
        if NEGATIONS.search(window):
            return 'contradict'
        return 'support'
    # fuzzy contains keywords
    return 'neutral'


def try_postgres_search(claim):
    try:
        import psycopg2
        import psycopg2.extras
    except Exception:
        return None
    try:
        conn = psycopg2.connect(**POSTGRES_DSN)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        q = '%' + claim + '%'
        results = []
        try:
            cur.execute("SELECT id, stream, event_type, payload, created_at FROM events WHERE payload::text ILIKE %s LIMIT 200", (q,))
            for r in cur.fetchall():
                results.append({'source': 'event', 'id': r['id'], 'stream': r['stream'], 'event_type': r['event_type'], 'payload': r['payload'], 'created_at': str(r['created_at'])})
        except Exception:
            results = []
        try:
            cur.execute("SELECT id, payload, payload_hash, projection_hash, created_at FROM projections WHERE payload::text ILIKE %s LIMIT 200", (q,))
            for r in cur.fetchall():
                results.append({'source': 'projection', 'id': r['id'], 'payload': r['payload'], 'payload_hash': r['payload_hash'], 'projection_hash': r['projection_hash'], 'created_at': str(r['created_at'])})
        except Exception:
            pass
        cur.close(); conn.close()
        return results
    except Exception:
        return None


def load_local_search(claim):
    out = []
    p_ev = os.path.join(ROOT, 'runtime', 'data', 'events.json')
    p_proj = os.path.join(ROOT, 'runtime', 'data', 'projections.json')
    if os.path.exists(p_ev):
        try:
            for e in json.load(open(p_ev, 'r', encoding='utf-8')):
                out.append({'source': 'event', 'id': e.get('id'), 'payload': e.get('payload'), 'created_at': e.get('created_at')})
        except Exception:
            pass
    if os.path.exists(p_proj):
        try:
            for p in json.load(open(p_proj, 'r', encoding='utf-8')):
                out.append({'source': 'projection', 'id': p.get('id'), 'payload': p.get('payload'), 'created_at': p.get('created_at')})
        except Exception:
            pass
    # filter down to items containing any claim tokens
    filtered = []
    for it in out:
        try:
            if claim.lower() in json.dumps(it.get('payload', {})).lower():
                filtered.append(it)
        except Exception:
            pass
    return filtered


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        print(json.dumps({'error': 'invalid input'})); sys.exit(1)
    claim = data.get('claim')
    if not claim:
        print(json.dumps({'error': 'missing claim'})); sys.exit(1)

    results = try_postgres_search(claim)
    if results is None:
        results = load_local_search(claim)

    supporting = []
    contradicting = []
    for r in results:
        text = json.dumps(r.get('payload', {})) if isinstance(r.get('payload'), (dict, list)) else str(r.get('payload', ''))
        stance = stance_of_text(claim, text)
        entry = {'source': r.get('source'), 'id': r.get('id'), 'created_at': r.get('created_at'), 'payload_snippet': text[:500]}
        if stance == 'support':
            supporting.append(entry)
        elif stance == 'contradict':
            contradicting.append(entry)

    total = len(supporting) + len(contradicting)
    if total == 0:
        confidence = 0.5
    else:
        confidence = round(len(supporting) / total, 4)

    out = {'supporting': supporting, 'contradicting': contradicting, 'confidence': confidence}
    print(json.dumps(out, indent=2, default=str))


if __name__ == '__main__':
    main()
