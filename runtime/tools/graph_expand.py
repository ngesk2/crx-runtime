#!/usr/bin/env python3
"""
graph_expand tool
Input JSON on stdin: {"node": "artifact_123", "depth": 2}
Output JSON on stdout: {"nodes": [...], "edges": [...]} 

Behavior:
- Attempts to connect to Postgres using POSTGRES_* env vars and read `object_relationships` and `authority_lineage` tables.
- If DB unavailable, attempts to load runtime/data/object_relationships.json and runtime/data/authority_lineage.json
- Performs BFS expansion up to `depth` and returns discovered nodes and edges.
"""
import sys
import os
import json
from collections import deque

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

POSTGRES_DSN = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': int(os.getenv('POSTGRES_PORT', '5432')),
    'database': os.getenv('POSTGRES_DB', 'crx_runtime'),
    'user': os.getenv('POSTGRES_USER', 'postgres'),
    'password': os.getenv('POSTGRES_PASSWORD', '')
}


def try_postgres_fetch(node):
    try:
        import psycopg2
    except Exception:
        return None
    try:
        conn = psycopg2.connect(**POSTGRES_DSN)
        cur = conn.cursor()
        # Try to fetch relationships where node appears in source or target
        q = "SELECT source, target, relation_type, metadata FROM object_relationships WHERE source=%s OR target=%s"
        cur.execute(q, (node, node))
        rows = cur.fetchall()
        edges = []
        for r in rows:
            source, target, reltype, meta = r
            edges.append({'source': source, 'target': target, 'type': reltype if reltype else 'related', 'meta': meta})
        # authority_lineage edges
        q2 = "SELECT ancestor, descendant, relation, metadata FROM authority_lineage WHERE ancestor=%s OR descendant=%s"
        try:
            cur.execute(q2, (node, node))
            rows2 = cur.fetchall()
            for r in rows2:
                anc, desc, rel, meta = r
                edges.append({'source': anc, 'target': desc, 'type': rel if rel else 'authority_lineage', 'meta': meta})
        except Exception:
            pass
        cur.close()
        conn.close()
        return edges
    except Exception:
        return None


def load_local_data():
    edges = []
    p1 = os.path.join(ROOT, 'runtime', 'data', 'object_relationships.json')
    p2 = os.path.join(ROOT, 'runtime', 'data', 'authority_lineage.json')
    if os.path.exists(p1):
        try:
            with open(p1, 'r', encoding='utf-8') as f:
                edges.extend(json.load(f))
        except Exception:
            pass
    if os.path.exists(p2):
        try:
            with open(p2, 'r', encoding='utf-8') as f:
                edges.extend(json.load(f))
        except Exception:
            pass
    return edges


def expand(node, depth, seed_edges):
    nodes = set()
    edges_out = []
    # index seed edges by node for quick neighbor lookup
    adj = {}
    for e in seed_edges:
        s = e.get('source')
        t = e.get('target')
        adj.setdefault(s, []).append(e)
        adj.setdefault(t, []).append(e)
    q = deque()
    q.append((node, 0))
    nodes.add(node)
    visited = set([node])
    while q:
        cur_node, d = q.popleft()
        if d >= depth:
            continue
        for e in adj.get(cur_node, []):
            s = e.get('source')
            t = e.get('target')
            edges_out.append(e)
            for n in (s, t):
                if n not in visited:
                    visited.add(n)
                    nodes.add(n)
                    q.append((n, d + 1))
    return list(nodes), edges_out


def main():
    try:
        inp = json.load(sys.stdin)
    except Exception:
        print(json.dumps({'error': 'invalid input'}))
        sys.exit(1)
    node = inp.get('node')
    depth = int(inp.get('depth', 2))
    if not node:
        print(json.dumps({'error': 'missing node'}))
        sys.exit(1)

    seed = try_postgres_fetch(node)
    if seed is None:
        seed = load_local_data()

    nodes, edges = expand(node, depth, seed)
    out = {'nodes': nodes, 'edges': edges}
    print(json.dumps(out, indent=2, default=str))


if __name__ == '__main__':
    main()
