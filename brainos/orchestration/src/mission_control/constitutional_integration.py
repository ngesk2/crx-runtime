"""
Constitutional Integration for Mission Control
PING Constitutional Stabilization Phase E
Date: 2026-06-22

Integrates mandatory constitutional retrieval into Mission Control API.
"""

from fastapi import HTTPException
from typing import List, Dict
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from constitutional_retrieval import get_retrieval


def get_constitutional_context(question: str) -> Dict:
    """
    Get constitutional context for a question.
    MANDATORY for constitutional questions.
    """
    retrieval = get_retrieval()
    
    # Check if question is constitutional
    is_constitutional = retrieval.is_constitutional_question(question)
    
    if is_constitutional:
        # Retrieve relevant documents
        documents = retrieval.retrieve_for_question(question)
        
        return {
            "is_constitutional": True,
            "documents": documents,
            "context": "\n\n".join([f"{doc['document_name']}\n{doc['content']}" for doc in documents])
        }
    else:
        return {
            "is_constitutional": False,
            "documents": [],
            "context": None
        }


def ingest_constitutional_docs() -> Dict:
    """Ingest constitutional documents into Qdrant."""
    retrieval = get_retrieval()
    
    # Define constitutional documents
    docs = [
        {
            "name": "CONSTITUTION.md",
            "type": "law",
            "content": """
            PING CONSTITUTION
            
            Rule 1: PostgreSQL is the sole canonical authority.
            Rule 2: All memory must be reconstructible from events.
            Rule 3: Events are append-only and immutable.
            Rule 4: Qdrant is projection-only, not authoritative.
            Rule 5: Replay is the constitutional authority for memory.
            Rule 6: All external dependencies must be non-authoritative.
            Rule 7: Infrastructure must be minimal and verifiable.
            """
        },
        {
            "name": "REPLAY_LAW.md",
            "type": "law",
            "content": """
            REPLAY LAW
            
            Replay is the constitutional authority for memory reconstruction.
            All memory must be reconstructible from events.
            Events are append-only and immutable.
            Replay determinism is guaranteed by event ordering.
            Replay integrity is guaranteed by payload hashing.
            """
        },
        {
            "name": "IDENTITY_LAW.md",
            "type": "law",
            "content": """
            IDENTITY LAW
            
            Identity is determined by event lineage.
            Objects have immutable identity from creation.
            Lineage chains are immutable and append-only.
            Identity reconstruction is guaranteed by replay.
            """
        },
        {
            "name": "MEMORY_LAW.md",
            "type": "law",
            "content": """
            MEMORY LAW
            
            Memory authority = Replay.
            Memory is not stored in Qdrant.
            Memory is not stored in Ollama.
            Memory is not stored in Open WebUI.
            Memory is reconstructed from PostgreSQL events.
            """
        },
        {
            "name": "INFRASTRUCTURE_LAW.md",
            "type": "law",
            "content": """
            INFRASTRUCTURE LAW
            
            All external dependencies must be non-authoritative.
            All credentials must be identified and managed.
            All services must be recoverable.
            All services must be replaceable.
            Infrastructure must be minimal and verifiable.
            """
        }
    ]
    
    results = []
    for doc in docs:
        success = retrieval.ingest_document(doc["name"], doc["content"], doc["type"])
        results.append({
            "document": doc["name"],
            "success": success
        })
    
    return {
        "ingested": len([r for r in results if r["success"]]),
        "total": len(results),
        "results": results
    }
