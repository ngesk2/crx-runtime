import hashlib
import json
import os
from pathlib import Path
from datetime import datetime

vault_path = Path('C:/Users/nolan/PING/vault')
manifest = []

for root, dirs, files in os.walk(vault_path):
    for file in files:
        file_path = Path(root) / file
        stat = os.stat(file_path)
        with open(file_path, 'rb') as f:
            sha256 = hashlib.sha256(f.read()).hexdigest()
        manifest.append({
            'path': str(file_path.relative_to(vault_path)),
            'sha256': sha256,
            'size': stat.st_size,
            'mtime': stat.st_mtime,
            'ctime': stat.st_ctime
        })

with open(vault_path / 'VAULT_HASH_MANIFEST.json', 'w') as f:
    json.dump(manifest, f, indent=2)

print(f"Generated hash manifest with {len(manifest)} files")
