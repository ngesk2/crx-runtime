"""
Generate HASH_MANIFEST.json for PING vault
"""

import os
import hashlib
import json
from datetime import datetime
from pathlib import Path

VAULT_PATH = r"C:\Users\nolan\PING\vault"

def compute_file_hash(file_path):
    """Compute SHA256 hash of file."""
    sha256_hash = hashlib.sha256()
    with open(file_path, 'rb') as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def generate_manifest():
    """Generate hash manifest for vault."""
    manifest = {
        "generated_at": datetime.utcnow().isoformat(),
        "vault_path": VAULT_PATH,
        "files": {}
    }
    
    vault_path = Path(VAULT_PATH)
    
    # Find all markdown files
    md_files = list(vault_path.rglob("*.md"))
    
    for file_path in md_files:
        try:
            rel_path = os.path.relpath(file_path, VAULT_PATH)
            file_hash = compute_file_hash(file_path)
            file_size = os.path.getsize(file_path)
            modified = datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat()
            
            manifest["files"][rel_path] = {
                "hash": file_hash,
                "size": file_size,
                "modified": modified
            }
        except Exception as e:
            print(f"Failed to hash {file_path}: {e}")
    
    # Save manifest
    manifest_path = os.path.join(VAULT_PATH, "HASH_MANIFEST.json")
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"Generated manifest with {len(manifest['files'])} files")
    print(f"Saved to: {manifest_path}")
    
    return manifest

if __name__ == "__main__":
    generate_manifest()
