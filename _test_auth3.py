#!/usr/bin/env python3
"""Test authority_search main() with authority class resolution."""
import sys, os, json
os.environ['POSTGRES_HOST'] = 'postgres'
os.environ['POSTGRES_USER'] = 'postgres'
os.environ['POSTGRES_PASSWORD'] = 'postgres'
os.environ['POSTGRES_DB'] = 'crx_runtime'
os.environ['POSTGRES_PORT'] = '5432'

sys.path.insert(0, '/app/runtime')
from tools.authority_search import try_postgres_search, resolve_authority_class, main

# Test resolution directly
for cat in ['CONSTITUTIONAL_LAW', 'CANONICAL_SPEC', 'IMPORTED_DOCUMENT', 'TEMPORARY_OBSERVATION', 'qdrant_fallback']:
    cls = resolve_authority_class(cat)
    print(f"  resolve('{cat}') -> {cls}")

# Test PG search + resolution
cands, sup = try_postgres_search('constitution')
print(f"\n=== PG search: 'constitution' ===")
for c in cands[:5]:
    cls = resolve_authority_class(c.get('category', ''))
    print(f"  {c['title'][:30]:30s} category={c.get('category',''):25s} -> {cls}")
