#!/usr/bin/env python3
"""
Retrieval Service

Performs semantic search, metadata lookup, authority filtering, context packing, and citation generation.

Retriever owns all Qdrant access. No other runtime queries Qdrant directly.
"""

import os
import sys
import logging
from typing import List, Dict, Optional
from pathlib import Path
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from sentence_transformers import SentenceTransformer

from runtime.constitutional.secret_adapter import get_secret_adapter

logger = logging.getLogger(__name__)


class RetrievalService:
    """Retrieval service for semantic search and context packing."""
    
    def __init__(self):
        # Constitutional: Use shared configuration
        from runtime.configuration import get_configuration
        self.configuration = get_configuration()
        
        # Initialize Qdrant client
        qdrant_config = self.configuration.get_qdrant_config()
        self.qdrant_url = qdrant_config["url"]
        self.qdrant_api_key = qdrant_config["api_key"]
        self.qdrant_collection = qdrant_config["collection"]
        
        self.qdrant_client = QdrantClient(
            url=self.qdrant_url,
            api_key=self.qdrant_api_key
        )
        
        # Initialize embedding model
        self.embed_model = os.getenv("EMBED_MODEL", "nomic-embed-text")
        logger.info(f"Loading embedding model: {self.embed_model}")
        self.embedding_model = SentenceTransformer(self.embed_model)
        
        logger.info("Retrieval Service initialized")
    
    def embed_query(self, query: str) -> List[float]:
        """Embed query text."""
        return self.embedding_model.encode(query).tolist()
    
    def semantic_search(self, query: str, limit: int = 10, point_type: str = "chunk") -> List[Dict]:
        """
        Perform semantic search on Qdrant.
        
        Args:
            query: Search query
            limit: Number of results to return
            point_type: Filter by point type ('chunk' or 'metadata')
        
        Returns:
            List of search results with scores and payloads
        """
        # Embed query
        query_embedding = self.embed_query(query)
        
        # Build filter
        search_filter = Filter(
            must=[
                FieldCondition(
                    key="point_type",
                    match=MatchValue(value=point_type)
                )
            ]
        )
        
        # Search Qdrant
        results = self.qdrant_client.search(
            collection_name=self.qdrant_collection,
            query_vector=query_embedding,
            query_filter=search_filter,
            limit=limit,
            with_payload=True,
            with_score=True
        )
        
        # Format results
        formatted_results = []
        for result in results:
            formatted_results.append({
                'id': result.id,
                'score': result.score,
                'payload': result.payload
            })
        
        logger.info(f"Semantic search returned {len(formatted_results)} results")
        return formatted_results
    
    def metadata_lookup(self, repository: str, path: str) -> Optional[Dict]:
        """
        Lookup metadata for a specific repository file.
        
        Args:
            repository: Repository name
            path: File path
        
        Returns:
            Metadata payload or None
        """
        # Build filter
        search_filter = Filter(
            must=[
                FieldCondition(key="repository", match=MatchValue(value=repository)),
                FieldCondition(key="path", match=MatchValue(value=path)),
                FieldCondition(key="point_type", match=MatchValue(value="metadata"))
            ]
        )
        
        # Search Qdrant
        results = self.qdrant_client.search(
            collection_name=self.qdrant_collection,
            query_vector=[0.0] * 768,  # Dummy vector for filter-only search
            query_filter=search_filter,
            limit=1,
            with_payload=True
        )
        
        if results:
            return results[0].payload
        
        return None
    
    def authority_filter(self, results: List[Dict], verified_only: bool = True) -> List[Dict]:
        """
        Filter results by authority/verification status.
        
        Args:
            results: Search results
            verified_only: Only return verified results
        
        Returns:
            Filtered results
        """
        if not verified_only:
            return results
        
        filtered = []
        for result in results:
            payload = result.get('payload', {})
            if payload.get('_verified', False):
                filtered.append(result)
        
        logger.info(f"Authority filter: {len(filtered)}/{len(results)} results passed")
        return filtered
    
    def pack_context(self, results: List[Dict], max_tokens: int = 4000) -> str:
        """
        Pack search results into context for LLM.
        
        Args:
            results: Search results
            max_tokens: Maximum tokens in context
        
        Returns:
            Packed context string
        """
        context_parts = []
        current_tokens = 0
        
        for result in results:
            payload = result.get('payload', {})
            
            # Extract chunk text or metadata
            if payload.get('point_type') == 'chunk':
                text = payload.get('chunk_text', '')
                source = f"{payload.get('repository', 'unknown')}/{payload.get('path', 'unknown')}"
                chunk_id = payload.get('chunk_id', 0)
                
                context_part = f"[Source: {source} | Chunk: {chunk_id}]\n{text}\n"
            else:
                source = f"{payload.get('repository', 'unknown')}/{payload.get('path', 'unknown')}"
                context_part = f"[Source: {source}]\nMetadata: {payload}\n"
            
            # Estimate tokens (rough approximation: 4 chars per token)
            estimated_tokens = len(context_part) / 4
            
            if current_tokens + estimated_tokens > max_tokens:
                break
            
            context_parts.append(context_part)
            current_tokens += estimated_tokens
        
        context = "\n".join(context_parts)
        logger.info(f"Packed context: {len(context_parts)} results, ~{int(current_tokens)} tokens")
        return context
    
    def generate_citations(self, results: List[Dict]) -> List[Dict]:
        """
        Generate citations from search results.
        
        Args:
            results: Search results
        
        Returns:
            List of citation dictionaries
        """
        citations = []
        
        for result in results:
            payload = result.get('payload', {})
            citation = {
                'repository': payload.get('repository', 'unknown'),
                'path': payload.get('path', 'unknown'),
                'sha256': payload.get('sha256', ''),
                'score': result.get('score', 0.0),
                'event_id': payload.get('event_id', '')
            }
            
            if payload.get('point_type') == 'chunk':
                citation['chunk_id'] = payload.get('chunk_id', 0)
                citation['chunk_start'] = payload.get('chunk_start', 0)
                citation['chunk_end'] = payload.get('chunk_end', 0)
            
            citations.append(citation)
        
        return citations
    
    def retrieve(self, query: str, limit: int = 10, verified_only: bool = True, max_tokens: int = 4000) -> Dict:
        """
        Complete retrieval pipeline: search, filter, pack context, generate citations.
        
        Args:
            query: User question
            limit: Number of results to retrieve
            verified_only: Only return verified results
            max_tokens: Maximum tokens in context
        
        Returns:
            Dictionary with context, citations, and metadata
        """
        # Semantic search
        results = self.semantic_search(query, limit=limit, point_type='chunk')
        
        # Authority filter
        if verified_only:
            results = self.authority_filter(results, verified_only=True)
        
        # Pack context
        context = self.pack_context(results, max_tokens=max_tokens)
        
        # Generate citations
        citations = self.generate_citations(results)
        
        return {
            'query': query,
            'context': context,
            'citations': citations,
            'result_count': len(results),
            'context_tokens': int(len(context) / 4)
        }


def main():
    """Main execution for testing"""
    logging.basicConfig(level=logging.INFO)
    
    # Initialize retrieval service
    retriever = RetrievalService()
    
    # Test retrieval
    query = "What is the constitutional identity law?"
    result = retriever.retrieve(query, limit=5)
    
    print(f"Query: {result['query']}")
    print(f"Results: {result['result_count']}")
    print(f"Context tokens: {result['context_tokens']}")
    print(f"\nContext:\n{result['context']}")
    print(f"\nCitations:")
    for citation in result['citations']:
        print(f"  - {citation['repository']}/{citation['path']} (score: {citation['score']:.3f})")


if __name__ == "__main__":
    main()
