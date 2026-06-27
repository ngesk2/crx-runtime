#!/usr/bin/env python3
"""
lineage_search tool
Input JSON on stdin: {"artifact_id":"..."}
Output JSON on stdout: {"artifact":{}, "events":[], "projections":[], "authorities":[], "witness_roots":[]}

Behavior:
- Attempts to connect to Postgres and query `artifact_registry`, `events`, and `authority_lineage` tables.
- Falls back to runtime/data/*.json if DB not available.
"""
import sys
import os
import json

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

POSTGRES_DSN = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': int(os.getenv('POSTGRES_PORT', '5432')),
    'database': os.getenv('POSTGRES_DB', 'crx_runtime'),
    'user': os.getenv('POSTGRES_USER', 'postgres'),
    'password': os.getenv('POSTGRES_PASSWORD', '')
}


def try_postgres_lineage(artifact_id):
    try:
        import psycopg2
        import psycopg2.extras
    except Exception:
        return None
    try:
        conn = psycopg2.connect(**POSTGRES_DSN)
        conn.autocommit = True
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        artifact = None
        try:
            cur.execute("SELECT * FROM artifact_registry WHERE artifact_id=%s", (artifact_id,))
            r = cur.fetchone()
            if r:
                artifact = dict(r)
        except Exception:
            conn.rollback()
            artifact = None
        events = []
        try:
            cur.execute("SELECT event_id AS id, aggregate_type AS stream, event_type, event_data AS payload, timestamp AS created_at FROM events WHERE event_data::text ILIKE %s ORDER BY timestamp", (f'%{artifact_id}%',))
            for r in cur.fetchall():
                events.append({'id': r['id'], 'stream': r['stream'], 'event_type': r['event_type'], 'payload': r['payload'], 'created_at': str(r['created_at'])})
        except Exception:
            conn.rollback()
            events = []
        projections = []
        try:
            cur.execute("SELECT id, projection_data, created_at FROM projections WHERE projection_data::text ILIKE %s ORDER BY created_at", (f'%{artifact_id}%',))
            for r in cur.fetchall():
                projections.append({'id': r['id'], 'payload': r['projection_data'], 'created_at': str(r['created_at'])})
        except Exception:
            conn.rollback()
            projections = []
        authorities = []
        try:
            cur.execute("SELECT * FROM authority_lineage WHERE ancestor=%s OR descendant=%s", (artifact_id, artifact_id))
            for r in cur.fetchall():
                authorities.append(dict(r))
        except Exception:
            conn.rollback()
            authorities = []
        cur.close()
        conn.close()
        return {'artifact': artifact, 'events': events, 'projections': projections, 'authorities': authorities, 'witness_roots': []}
    except Exception:
        return None


def load_local(artifact_id):
    out = {'artifact': None, 'events': [], 'projections': [], 'authorities': [], 'witness_roots': []}
    p_art = os.path.join(ROOT, 'runtime', 'data', 'artifact_registry.json')
    p_ev = os.path.join(ROOT, 'runtime', 'data', 'events.json')
    p_proj = os.path.join(ROOT, 'runtime', 'data', 'projections.json')
    p_auth = os.path.join(ROOT, 'runtime', 'data', 'authority_lineage.json')
    if os.path.exists(p_art):
        try:
            arts = json.load(open(p_art, 'r', encoding='utf-8'))
            for a in arts:
                if a.get('artifact_id') == artifact_id:
                    out['artifact'] = a
                    break
        except Exception:
            pass
    if os.path.exists(p_ev):
        try:
            evs = json.load(open(p_ev, 'r', encoding='utf-8'))
            for e in evs:
                if artifact_id in json.dumps(e.get('payload', {})):
                    out['events'].append(e)
        except Exception:
            pass
    if os.path.exists(p_proj):
        try:
            projs = json.load(open(p_proj, 'r', encoding='utf-8'))
            for p in projs:
                if artifact_id in json.dumps(p.get('payload', {})):
                    out['projections'].append(p)
        except Exception:
            pass
    if os.path.exists(p_auth):
        try:
            auths = json.load(open(p_auth, 'r', encoding='utf-8'))
            for a in auths:
                if a.get('ancestor') == artifact_id or a.get('descendant') == artifact_id:
                    out['authorities'].append(a)
        except Exception:
            pass
    return out


def main():
    try:
        inp = json.load(sys.stdin)
    except Exception:
        print(json.dumps({'error': 'invalid input'}))
        sys.exit(1)
    artifact_id = inp.get('artifact_id')
    if not artifact_id:
        print(json.dumps({'error': 'missing artifact_id'}))
        sys.exit(1)
    res = try_postgres_lineage(artifact_id)
    if res is None:
        res = load_local(artifact_id)
    print(json.dumps(res, indent=2, default=str))


if __name__ == '__main__':
    main()
