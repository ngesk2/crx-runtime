#!/usr/bin/env python3
"""Test authority_search directly."""
import sys, json
sys.path.insert(0, '/app/runtime')
from tools.authority_search import try_postgres_search, try_qdrant_fallback, main

# Test 1: Postgres search — "constitution"
print("=== PG search: 'constitution' ===")
res = try_postgres_search('constitution')
if res and res[0]:
    for c in res[0][:3]:
        print(f"  {c.get('title','?'):30s} level={c.get('authority_level')} artifact={str(c.get('artifact_id',''))[:8]}")
    print(f"  superseded: {len(res[1])}")
else:
    print("  No results or connection error")

# Test 2: Qdrant fallback
print("\n=== Qdrant fallback: 'constitution' ===")
qres = try_qdrant_fallback('constitution')
if qres and qres[0]:
    for c in qres[0][:3]:
        print(f"  {c.get('title','?'):30s} source={c.get('_source')}")
else:
    print("  No results or error")

# Test 3: Postgres search — "memory"
print("\n=== PG search: 'memory' ===")
res2 = try_postgres_search('memory')
if res2 and res2[0]:
    for c in res2[0][:3]:
        print(f"  {c.get('title','?'):30s} level={c.get('authority_level')}")
else:
    print("  No results or connection error")
