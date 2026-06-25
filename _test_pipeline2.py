#!/usr/bin/env python3
"""Test pipeline components up to context_pack (no Ollama dependency)."""
import sys, os, json, subprocess
os.environ['POSTGRES_HOST'] = 'postgres'
os.environ['POSTGRES_USER'] = 'postgres'
os.environ['POSTGRES_PASSWORD'] = 'postgres'
os.environ['POSTGRES_DB'] = 'crx_runtime'
os.environ['POSTGRES_PORT'] = '5432'

sys.path.insert(0, '/app/runtime')
from tools.authority_search import try_postgres_search, resolve_authority_class
from cognitive.models import ContextPack, AuthorityResolution

# Step 1: Authority search
print("=== STEP 1: Authority Search ===")
cands, sup = try_postgres_search('replay law')
print(f"Found: {len(cands)} candidates")
for c in cands[:3]:
    cls = resolve_authority_class(c.get('category', ''))
    print(f"  {c['title'][:30]:30s} level={c['authority_level']} class={cls}")

# Step 2: Build context pack
print("\n=== STEP 2: Context Pack ===")
# Simulate what context_pack does with real data
authority_chain = []
for c in cands[:5]:
    cls = resolve_authority_class(c.get('category', ''))
    authority_chain.append({
        'artifact_id': str(c.get('artifact_id', '')),
        'title': c.get('title', ''),
        'description': c.get('description', ''),
        'authority_level': c.get('authority_level', 0),
        'authority_class': cls,
    })

pack = ContextPack(
    question="What is replay law?",
    authority_chain=authority_chain,
    authority_resolution=AuthorityResolution(
        highest_authority=authority_chain[0] if authority_chain else {},
        authority_class=authority_chain[0].get('authority_class') if authority_chain else None,
        authority_chain=authority_chain,
        supersession_chain=[],
        verification={'overall': False}
    )
)

d = pack.to_dict()
print(f"Question: {d['question']}")
print(f"Highest authority: {d.get('authority_resolution', {}).get('highest_authority', {}).get('title', 'N/A')}")
print(f"Authority class: {d.get('authority_resolution', {}).get('authority_class', 'N/A')}")
print(f"Authority chain length: {len(d.get('authority_resolution', {}).get('authority_chain', []))}")
print(f"Evidence count: {len(d.get('evidence', []))}")

# Print each authority in chain
for i, a in enumerate(d.get('authority_resolution', {}).get('authority_chain', [])):
    print(f"  [{i}] {a.get('title','N/A'):30s} level={a.get('authority_level')} class={a.get('authority_class','N/A')}")

print("\n=== PIPELINE STATUS ===")
print(f"authority_search: {'OK' if len(cands) > 0 else 'FAIL'}")
print(f"context_pack: {'OK' if len(authority_chain) > 0 else 'FAIL'}")
print(f"authority_chain non-empty: {len(authority_chain) > 0}")
print(f"REPLAY LAW in chain: {any('REPLAY LAW' in str(a) for a in authority_chain)}")
