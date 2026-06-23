"""
Generate projection_manifest.json for Qdrant projection verification
"""

import os
import hashlib
import json
from datetime import datetime
from pathlib import Path

VAULT_PATH = r"C:\Users\nolan\PING\vault"
HASH_MANIFEST_PATH = r"C:\Users\nolan\PING\vault\HASH_MANIFEST.json"

def compute_vault_hash():
    """Compute vault hash from HASH_MANIFEST.json"""
    try:
        with open(HASH_MANIFEST_PATH, 'r') as f:
            manifest = json.load(f)
        
        # Compute hash of all file hashes combined
        file_hashes = []
        for file_path, file_data in manifest['files'].items():
            file_hashes.append(file_data['hash'])
        
        # Sort hashes for determinism
        file_hashes.sort()
        
        # Compute combined hash
        combined_hashes = ''.join(file_hashes)
        vault_hash = hashlib.sha256(combined_hashes.encode()).hexdigest()
        
        return vault_hash
    except Exception as e:
        print(f"Failed to compute vault hash: {e}")
        return None

def compute_qdrant_hash():
    """Compute Qdrant collection hash (placeholder - would need Qdrant API)"""
    # For now, use the document count and known hash from retrieval test
    # In production, this would query Qdrant for collection info
    # and compute hash of all point payloads
    
    # Placeholder: Use known hash from REPLAY_LAW.md retrieval
    # This is a simplified version - real implementation would:
    # 1. Query Qdrant for all points in constitutional_documents
    # 2. Compute hash of all point payloads
    # 3. Return combined hash
    
    # For now, return a placeholder that indicates this needs Qdrant API
    return "QDRANT_HASH_PLACEHOLDER_REQUIRES_API"

def generate_projection_manifest():
    """Generate projection manifest"""
    vault_hash = compute_vault_hash()
    qdrant_hash = compute_qdrant_hash()
    
    manifest = {
        "generated_at": datetime.utcnow().isoformat(),
        "documents": 16,
        "vault_path": VAULT_PATH,
        "vault_hash": vault_hash,
        "qdrant_collection": "constitutional_documents",
        "qdrant_hash": qdrant_hash,
        "projection_worker": "brainos/orchestration/src/projection_worker/projection_worker.py",
        "embedding_model": "nomic-embed-text",
        "certification": "PENDING_REBUILD_VERIFICATION"
    }
    
    # Save manifest
    manifest_path = os.path.join(VAULT_PATH, "projection_manifest.json")
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"Generated projection manifest: {manifest_path}")
    print(f"Vault hash: {vault_hash}")
    print(f"Qdrant hash: {qdrant_hash}")
    
    return manifest

if __name__ == "__main__":
    generate_projection_manifest()
