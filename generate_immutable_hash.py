"""
Generate hash manifest for vault/constitutional/immutable/
"""

import os
import hashlib
import json
from datetime import datetime
from pathlib import Path

IMMUTABLE_PATH = r"C:\Users\nolan\PING\vault\constitutional\immutable"

def compute_file_hash(file_path):
    """Compute SHA256 hash of file."""
    sha256_hash = hashlib.sha256()
    with open(file_path, 'rb') as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def generate_immutable_manifest():
    """Generate hash manifest for immutable constitutional docs."""
    manifest = {
        "generated_at": datetime.utcnow().isoformat(),
        "immutable_path": IMMUTABLE_PATH,
        "documents": {},
        "combined_hash": None
    }
    
    immutable_path = Path(IMMUTABLE_PATH)
    
    # Find all markdown files
    md_files = list(immutable_path.glob("*.md"))
    
    file_hashes = []
    
    for file_path in md_files:
        try:
            rel_path = os.path.relpath(file_path, IMMUTABLE_PATH)
            file_hash = compute_file_hash(file_path)
            file_size = os.path.getsize(file_path)
            modified = datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat()
            
            manifest["documents"][rel_path] = {
                "hash": file_hash,
                "size": file_size,
                "modified": modified
            }
            
            file_hashes.append(file_hash)
        except Exception as e:
            print(f"Failed to hash {file_path}: {e}")
    
    # Compute combined hash
    file_hashes.sort()
    combined_hashes = ''.join(file_hashes)
    combined_hash = hashlib.sha256(combined_hashes.encode()).hexdigest()
    manifest["combined_hash"] = combined_hash
    
    # Save manifest
    manifest_path = os.path.join(IMMUTABLE_PATH, "IMMUTABLE_HASH_MANIFEST.json")
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"Generated immutable manifest: {manifest_path}")
    print(f"Documents: {len(manifest['documents'])}")
    print(f"Combined hash: {combined_hash}")
    
    return manifest

if __name__ == "__main__":
    generate_immutable_manifest()
