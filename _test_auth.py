#!/usr/bin/env python3
"""Quick test of authority_search postgres and qdrant fallback."""
import sys, json
sys.path.insert(0, '/app/runtime')
from tools import authority_search

# Test 1: Postgres search with "test" (matches "Test Document X" titles)
res = authority_search.try_postgres_search('test')
if res:
    pg_cands, pg_sup = res
    print(f"PG: {len(pg_cands)} candidates, {len(pg_sup)} superseded")
    for c in pg_cands[:3]:
        print(f"  - {c.get('title','')[:60]} (level={c.get('authority_level')})")
else:
    print("PG: None (connection or query error)")

# Test 2: Qdrant fallback with "constitution"
qres = authority_search.try_qdrant_fallback('constitution')
if qres:
    q_cands, q_sup = qres
    print(f"Qdrant: {len(q_cands)} candidates")
    for c in q_cands[:3]:
        print(f"  - {c.get('title','')[:60]} (source={c.get('_source')})")
else:
    print("Qdrant: None (connection or query error)")
