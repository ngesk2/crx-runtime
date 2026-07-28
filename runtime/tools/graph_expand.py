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
from runtime.authorities.authority_router import AuthorityRouter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))


def try_postgres_fetch(node):
    edges = []
    try:
        edges.extend(AuthorityRouter.query("repository", "fetch_relationships", node=node))
    except Exception:
        pass
    try:
        edges.extend(AuthorityRouter.query("repository", "fetch_authority_lineage", node=node))
    except Exception:
        pass
    return edges if edges else None


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
