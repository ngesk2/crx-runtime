#!/usr/bin/env python3
"""
context_pack_builder.py

Given a question and optional artifact_id, build a context pack by querying
authority_objects, projection verification, and replay artifacts.

This is a read-only builder that assembles JSON useful for authority-aware
reasoning. It does NOT call Ollama itself.
"""
import os
import json
import subprocess
from typing import Any, Dict

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ''))
TOOLS_DIR = os.path.join(ROOT_DIR, 'runtime', 'tools')


def run_tool(tool_name: str, args: Dict[str, Any], timeout: int = 10):
    script = os.path.join(os.path.dirname(__file__), 'runtime', 'tools', f"{tool_name}.py")
    if not os.path.exists(script):
        return {'error': f'tool not found: {tool_name}'}
    try:
        proc = subprocess.run(['python', script], input=json.dumps(args).encode('utf-8'), stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
        if proc.returncode != 0:
            return {'error': proc.stderr.decode('utf-8')}
        return json.loads(proc.stdout.decode('utf-8'))
    except Exception as e:
        return {'error': str(e)}


def build_context_pack(question: str, artifact_id: str = None):
    # Orchestrate the small toolchain to produce Context Pack v2
    pack = {
        'question': question,
        'highest_authority': {},
        'authority_chain': [],
        'supersession_chain': [],
        'lineage': [],
        'graph_expansion': [],
        'supporting_documents': [],
        'contradictions': [],
        'citations': [],
        'witness_roots': [],
        'repository_symbols': [],
        'repository_relationships': [],
        'retrieval_context': []
    }

    # 1) Authority search
    a_args = {'query': question}
    if artifact_id:
        a_args['artifact_id'] = artifact_id
    a_res = run_tool('authority_search', a_args)
    if not a_res.get('error'):
        pack['highest_authority'] = a_res.get('highest_authority', {})
        pack['authority_chain'] = a_res.get('authority_chain', [])
        pack['supersession_chain'] = a_res.get('supersession_chain', [])

    # 2) Contradiction search
    c_res = run_tool('contradiction_search', {'claim': question})
    if not c_res.get('error'):
        pack['contradictions'] = {'supporting': c_res.get('supporting', []), 'contradicting': c_res.get('contradicting', []), 'confidence': c_res.get('confidence', 0)}

    # 3) Graph expand (seed artifact if provided, else skip)
    if artifact_id:
        g_res = run_tool('graph_expand', {'node': artifact_id, 'depth': 2})
        if not g_res.get('error'):
            pack['graph_expansion'] = g_res

    # 4) Lineage search for artifact
    if artifact_id:
        l_res = run_tool('lineage_search', {'artifact_id': artifact_id})
        if not l_res.get('error'):
            pack['lineage'] = l_res.get('lineage', [])
            # append artifact and events/projections to supporting docs
            if l_res.get('artifact'):
                pack['supporting_documents'].append(l_res.get('artifact'))
            pack['supporting_documents'].extend(l_res.get('events', []) or [])
            pack['supporting_documents'].extend(l_res.get('projections', []) or [])
            pack['witness_roots'].extend(l_res.get('witness_roots', []) or [])

    # 5) Repository intelligence tools
    rs = run_tool('repository_symbols', {'symbol': question.split()[0]})
    if not rs.get('error'):
        pack['repository_symbols'] = rs.get('definitions', [])
    rr = run_tool('repository_relationships', {'symbol': question.split()[0]})
    if not rr.get('error'):
        pack['repository_relationships'] = {'imports': rr.get('imports', []), 'calls': rr.get('calls', []), 'writes': rr.get('writes', [])}

    # citations: collect top few from authority_chain and supporting_documents
    try:
        pack['citations'] = [ {'id': a.get('artifact_id') or a.get('id'), 'title': a.get('title') } for a in pack.get('authority_chain', []) if a.get('id') or a.get('artifact_id') ]
    except Exception:
        pack['citations'] = []

    return pack


if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--question', required=True)
    p.add_argument('--artifact_id')
    args = p.parse_args()
    pack = build_context_pack(args.question, args.artifact_id)
    print(json.dumps(pack, indent=2))
