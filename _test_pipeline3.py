#!/usr/bin/env python3
"""Test multiple queries."""
import sys, os
os.environ['POSTGRES_HOST'] = 'postgres'
os.environ['POSTGRES_USER'] = 'postgres'
os.environ['POSTGRES_PASSWORD'] = 'postgres'
os.environ['POSTGRES_DB'] = 'crx_runtime'
os.environ['POSTGRES_PORT'] = '5432'
sys.path.insert(0, '/app/runtime')
from tools.authority_search import try_postgres_search, resolve_authority_class

for query in ['constitution', 'memory', 'identity', 'infrastructure', 'replay']:
    cands, sup = try_postgres_search(query)
    if cands:
        top = cands[0]
        cls = resolve_authority_class(top.get('category', ''))
        print(f"'{query}' -> {top['title'][:30]:30s} level={top['authority_level']} class={cls}")
    else:
        print(f"'{query}' -> NO RESULTS")
