import requests
import os

def search_constitution(query: str, limit: int = 5):
    """
    Search constitutional documents from PING's authoritative constitutional collection.
    
    Args:
        query: Search query (e.g., "Why is replay deterministic?")
        limit: Maximum number of results (default: 5)
    
    Returns:
        List of constitutional documents with relevance scores
    """
    MISSION_CONTROL_URL = os.getenv("MISSION_CONTROL_URL", "http://mission-control:8000")
    
    try:
        response = requests.get(
            f"{MISSION_CONTROL_URL}/constitution/search",
            params={"query": query, "limit": limit},
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"Search failed: {response.status_code}", "detail": response.text}
    except Exception as e:
        return {"error": f"Search failed: {str(e)}"}

def get_constitution_doc(doc_id: str):
    """
    Get a specific constitutional document by ID.
    
    Args:
        doc_id: Document ID
    
    Returns:
        Document metadata and content
    """
    MISSION_CONTROL_URL = os.getenv("MISSION_CONTROL_URL", "http://mission-control:8000")
    
    try:
        response = requests.get(
            f"{MISSION_CONTROL_URL}/constitution/doc/{doc_id}",
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"Document retrieval failed: {response.status_code}", "detail": response.text}
    except Exception as e:
        return {"error": f"Document retrieval failed: {str(e)}"}

def get_constitution_authority():
    """
    Get constitutional authority status.
    
    Returns:
        Authority status and collection information
    """
    MISSION_CONTROL_URL = os.getenv("MISSION_CONTROL_URL", "http://mission-control:8000")
    
    try:
        response = requests.get(
            f"{MISSION_CONTROL_URL}/constitution/authority",
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"Authority check failed: {response.status_code}", "detail": response.text}
    except Exception as e:
        return {"error": f"Authority check failed: {str(e)}"}

if __name__ == "__main__":
    # Test search
    result = search_constitution("Why is replay deterministic?", limit=3)
    print("Search Result:")
    print(result)
    
    # Test authority
    authority = get_constitution_authority()
    print("\nAuthority Status:")
    print(authority)
