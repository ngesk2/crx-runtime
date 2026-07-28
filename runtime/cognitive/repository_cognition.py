"""
Repository Cognition — Rule 9

Repository becomes first-class memory.
Supervisor must query repository symbols, relationships, artifact registry,
object relationships, authority objects, and authority lineage before
semantic search.
"""
import os
import json
import sys
from typing import Dict, Any, Optional, List
from .worker_protocol import WorkerProtocol


class RepositoryCognition:
    """
    Provides structured access to repository knowledge.
    Repository symbols, relationships, and authority objects are
    first-class memory that must be queried before vector search.
    """

    def __init__(self):
        self.protocol = WorkerProtocol()

    def query_symbols(self, symbol: str) -> List[Dict[str, Any]]:
        result = self.protocol.call_tool('repository_symbols', {'symbol': symbol})
        if result and 'error' not in result:
            data = result.get('data') if isinstance(result, dict) and 'data' in result else result
            if isinstance(data, dict):
                return data.get('definitions', [data])
            return data if isinstance(data, list) else [data]
        return []

    def query_relationships(self, symbol: str) -> Dict[str, Any]:
        result = self.protocol.call_tool('repository_relationships', {'symbol': symbol})
        if result and 'error' not in result:
            data = result.get('data') if isinstance(result, dict) and 'data' in result else result
            return data if isinstance(data, dict) else {'raw': data}
        return {}

    def query_authority(self, query: str) -> Dict[str, Any]:
        result = self.protocol.call_tool('authority_search', {'query': query})
        if result and 'error' not in result:
            data = result.get('data') if isinstance(result, dict) and 'data' in result else result
            return data if isinstance(data, dict) else {'raw': data}
        return {}

    def query_lineage(self, artifact_id: str) -> Dict[str, Any]:
        result = self.protocol.call_tool('lineage_search', {'artifact_id': artifact_id})
        if result and 'error' not in result:
            data = result.get('data') if isinstance(result, dict) and 'data' in result else result
            return data if isinstance(data, dict) else {'raw': data}
        return {}

    def full_knowledge_context(self, question: str) -> Dict[str, Any]:
        symbols = self.query_symbols(question.split()[0] if question else "")
        relationships = self.query_relationships(question.split()[0] if question else "")
        authority = self.query_authority(question)
        return {
            "repository_symbols": symbols,
            "repository_relationships": relationships,
            "authority_context": authority,
            "queried_at": __import__('datetime').datetime.utcnow().isoformat()
        }
