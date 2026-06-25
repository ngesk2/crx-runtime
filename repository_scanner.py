#!/usr/bin/env python3
"""
Repository Scanner

Walks repository mirrors, computes SHA256, detects changes, and emits repository events.

Events:
- REPOSITORY_FILE_DISCOVERED
- REPOSITORY_FILE_UPDATED
- REPOSITORY_FILE_DELETED

Repository state must be reconstructible from events alone.
"""

import os
import json
import hashlib
import uuid
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
import psycopg2
from psycopg2.extras import Json


class RepositoryScanner:
    """Scanner for repository mirrors"""
    
    def __init__(self, repository_root: str, postgres_config: Dict):
        self.repository_root = Path(repository_root)
        self.postgres_config = postgres_config
        self.index_file = self.repository_root / ".drive_index.json"
        
    def compute_sha256(self, file_path: Path) -> str:
        """Compute SHA256 hash of file"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def load_index(self) -> Dict:
        """Load drive index file"""
        if not self.index_file.exists():
            return {"files": [], "synced_at": None}
        
        with open(self.index_file, 'r') as f:
            return json.load(f)
    
    def walk_mirror(self) -> List[Dict]:
        """Walk mirror directory and compute file info"""
        files = []
        
        for file_path in self.repository_root.rglob('*'):
            # Skip index file and directories
            if file_path.name == ".drive_index.json" or file_path.is_dir():
                continue
            
            # Compute relative path
            relative_path = file_path.relative_to(self.repository_root)
            
            # Compute SHA256
            sha256 = self.compute_sha256(file_path)
            
            # Get file stats
            stats = file_path.stat()
            
            files.append({
                "path": str(relative_path),
                "local_path": str(file_path),
                "sha256": sha256,
                "size": stats.st_size,
                "modified": datetime.fromtimestamp(stats.st_mtime).isoformat()
            })
        
        return files
    
    def detect_changes(self, current_files: List[Dict], index_files: List[Dict]) -> Dict:
        """Detect new, modified, and deleted files"""
        # Create lookup by path
        current_by_path = {f["path"]: f for f in current_files}
        index_by_path = {f["local_path"]: f for f in index_files}
        
        # Detect new and modified files
        new_files = []
        modified_files = []
        
        for path, current_file in current_by_path.items():
            if path not in [Path(f["local_path"]).relative_to(self.repository_root).as_posix() for f in index_files]:
                new_files.append(current_file)
            else:
                # Find matching index file
                index_file = None
                for idx_f in index_files:
                    if Path(idx_f["local_path"]).relative_to(self.repository_root).as_posix() == path:
                        index_file = idx_f
                        break
                
                if index_file and current_file["sha256"] != index_file["sha256"]:
                    modified_files.append(current_file)
        
        # Detect deleted files
        deleted_files = []
        current_paths = set(current_by_path.keys())
        
        for index_file in index_files:
            index_path = Path(index_file["local_path"]).relative_to(self.repository_root).as_posix()
            if index_path not in current_paths:
                deleted_files.append(index_file)
        
        return {
            "new": new_files,
            "modified": modified_files,
            "deleted": deleted_files
        }
    
    def emit_event(self, event_type: str, repository: str, file_info: Dict) -> str:
        """Emit repository event to PostgreSQL"""
        event_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        event = {
            "event_id": event_id,
            "event_type": event_type,
            "timestamp": timestamp,
            "aggregate_id": file_info.get("id", str(uuid.uuid4())),
            "aggregate_type": "REPOSITORY_FILE",
            "event_data": {
                "repository": repository,
                "path": file_info.get("path", file_info.get("local_path", "")),
                "sha256": file_info.get("sha256", ""),
                "size": file_info.get("size", 0),
                "modified": file_info.get("modified", ""),
                "local_path": file_info.get("local_path", "")
            }
        }
        
        # Store in PostgreSQL
        conn = psycopg2.connect(**self.postgres_config)
        cursor = conn.cursor()
        
        cursor.execute(
            """
            INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                event["event_id"],
                event["event_type"],
                event["timestamp"],
                event["aggregate_id"],
                event["aggregate_type"],
                Json(event["event_data"])
            )
        )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"Emitted event: {event_type} - {file_info.get('path', 'unknown')}")
        return event_id
    
    def scan(self, repository: str = "drive"):
        """Scan repository and emit events"""
        print(f"Scanning repository: {repository}")
        print(f"Repository root: {self.repository_root}")
        
        # Load index
        index = self.load_index()
        index_files = index.get("files", [])
        print(f"Index files: {len(index_files)}")
        
        # Walk mirror
        current_files = self.walk_mirror()
        print(f"Current files: {len(current_files)}")
        
        # Detect changes
        changes = self.detect_changes(current_files, index_files)
        
        print(f"New files: {len(changes['new'])}")
        print(f"Modified files: {len(changes['modified'])}")
        print(f"Deleted files: {len(changes['deleted'])}")
        
        # Emit events
        for file_info in changes["new"]:
            self.emit_event("REPOSITORY_FILE_DISCOVERED", repository, file_info)
        
        for file_info in changes["modified"]:
            self.emit_event("REPOSITORY_FILE_UPDATED", repository, file_info)
        
        for file_info in changes["deleted"]:
            self.emit_event("REPOSITORY_FILE_DELETED", repository, file_info)
        
        print("Scan complete")
        
        return changes


def main():
    """Main execution"""
    # Configuration
    repository_root = os.getenv("REPOSITORY_ROOT", "C:\\PING\\repositories\\drive")
    
    postgres_config = {
        "host": os.getenv("POSTGRES_HOST", "localhost"),
        "port": int(os.getenv("POSTGRES_PORT", "5432")),
        "database": os.getenv("POSTGRES_DB", "crx_runtime"),
        "user": os.getenv("POSTGRES_USER", "postgres"),
        "password": os.getenv("POSTGRES_PASSWORD", "postgres")
    }
    
    # Create scanner
    scanner = RepositoryScanner(repository_root, postgres_config)
    
    # Scan repository
    changes = scanner.scan("drive")
    
    # Print summary
    print("\nSummary:")
    print(f"  New files: {len(changes['new'])}")
    print(f"  Modified files: {len(changes['modified'])}")
    print(f"  Deleted files: {len(changes['deleted'])}")


if __name__ == "__main__":
    main()
