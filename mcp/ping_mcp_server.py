"""
PING MCP Server
Thin proxy to Mission Control - NO business logic, NO duplicate authority
All tools call existing Mission Control endpoints
"""

import requests
from typing import Optional, List, Dict, Any
import json

# Mission Control base URL
MISSION_CONTROL_URL = "http://mission-control:8000"


def search_constitution(query: str, limit: int = 5) -> Dict[str, Any]:
    """Search constitutional documents from PING's authoritative constitutional collection."""
    try:
        response = requests.get(
            f"{MISSION_CONTROL_URL}/constitution/search",
            params={"query": query, "limit": limit},
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"Search failed: {str(e)}"}


def get_constitution_doc(doc_id: str) -> Dict[str, Any]:
    """Get a specific constitutional document by ID."""
    try:
        response = requests.get(
            f"{MISSION_CONTROL_URL}/constitution/doc/{doc_id}",
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"Document retrieval failed: {str(e)}"}


def search_constitutional_memory(query: str, top_k: int = 5) -> Dict[str, Any]:
    """
    Search constitutional memory with lineage resolution and authority verification.
    
    Constitutional Law: TRUTH ≠ EMBEDDINGS
    - Query is embedded
    - Qdrant search retrieves projections
    - Lineage resolution traces back to truth sources
    - Authority verification ensures constitutional compliance
    
    Returns:
    - snippets: Content snippets with scores
    - citations: Source citations
    - authority_chain: Authority chain of sources
    - lineage: Lineage information
    """
    try:
        response = requests.get(
            f"{MISSION_CONTROL_URL}/constitutional/query",
            params={"query": query, "top_k": top_k},
            timeout=30
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"Constitutional memory search failed: {str(e)}"}


def search_memory(query: str, limit: int = 5) -> Dict[str, Any]:
    """Search memory collections."""
    try:
        response = requests.get(
            f"{MISSION_CONTROL_URL}/memory/search",
            params={"query": query, "limit": limit},
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"Memory search failed: {str(e)}"}


def memory_stats() -> Dict[str, Any]:
    """Get memory statistics."""
    try:
        response = requests.get(
            f"{MISSION_CONTROL_URL}/memory/stats",
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"Memory stats failed: {str(e)}"}


def recent_events(limit: int = 10) -> Dict[str, Any]:
    """Get recent events."""
    try:
        response = requests.get(
            f"{MISSION_CONTROL_URL}/events/recent",
            params={"limit": limit},
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"Recent events failed: {str(e)}"}


def event_summary(event_type: Optional[str] = None, stream: Optional[str] = None) -> Dict[str, Any]:
    """Get event summary by type/stream."""
    try:
        params = {}
        if event_type:
            params["event_type"] = event_type
        if stream:
            params["stream"] = stream
        
        response = requests.get(
            f"{MISSION_CONTROL_URL}/events/summary",
            params=params,
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"Event summary failed: {str(e)}"}


def lineage_lookup(entity_id: str) -> Dict[str, Any]:
    """Lookup lineage graph for entity."""
    try:
        response = requests.get(
            f"{MISSION_CONTROL_URL}/lineage/graph",
            params={"entity_id": entity_id},
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"Lineage lookup failed: {str(e)}"}


def continuity_status() -> Dict[str, Any]:
    """Get continuity status."""
    try:
        response = requests.get(
            f"{MISSION_CONTROL_URL}/continuity/status",
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"Continuity status failed: {str(e)}"}


def replay_status() -> Dict[str, Any]:
    """Get replay status."""
    try:
        response = requests.get(
            f"{MISSION_CONTROL_URL}/replay/status",
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"Replay status failed: {str(e)}"}


def credential_inventory() -> Dict[str, Any]:
    """Get credential inventory."""
    try:
        response = requests.get(
            f"{MISSION_CONTROL_URL}/credentials/inventory",
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"Credential inventory failed: {str(e)}"}


def infrastructure_status() -> Dict[str, Any]:
    """Get infrastructure status."""
    try:
        response = requests.get(
            f"{MISSION_CONTROL_URL}/infrastructure/status",
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"Infrastructure status failed: {str(e)}"}


if __name__ == "__main__":
    # Test all tools
    print("Testing MCP tools...")
    
    print("\n1. Infrastructure Status:")
    print(infrastructure_status())
    
    print("\n2. Constitutional Authority:")
    print(search_constitution("test", limit=1))
    
    print("\n3. Constitutional Memory Search:")
    print(search_constitutional_memory("replay law", top_k=3))
    
    print("\n4. Memory Stats:")
    print(memory_stats())
    
    print("\n5. Recent Events:")
    print(recent_events(limit=1))
