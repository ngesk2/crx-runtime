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
from runtime.authorities.authority_router import AuthorityRouter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))


def try_postgres_lineage(artifact_id):
    try:
        return AuthorityRouter.query("repository", "fetch_lineage_data", artifact_id=artifact_id)
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
