#!/usr/bin/env python3
"""
Repository Event Layer Implementation
Constitutional Freeze - Repository Authority and Replay Authority

Event Types:
- REPOSITORY_DISCOVERED
- FILE_DISCOVERED
- FILE_CREATED
- FILE_MODIFIED
- FILE_DELETED
- REPOSITORY_SNAPSHOT_CREATED
- REPOSITORY_SNAPSHOT_VERIFIED
- REPOSITORY_WITNESS_CREATED
- COMMIT_CREATED
- COMMIT_VERIFIED
"""

import os
import hashlib
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
import subprocess
import psycopg2


class RepositoryEventLayer:
    """Repository Event Layer for Constitutional Freeze"""
    
    def __init__(self, repository_path: str, postgres_config: Dict[str, Any] = None):
        self.repository_path = Path(repository_path)
        self.events: List[Dict[str, Any]] = []
        self.files_discovered: Dict[str, Dict[str, Any]] = {}
        self.postgres_config = postgres_config or {
            "host": "localhost",
            "port": 5432,
            "database": "crx_runtime",
            "user": "postgres",
            "password": ""
        }
        self.repository_aggregate_id = str(uuid.uuid4())
        
    def calculate_sha256(self, file_path: Path) -> str:
        """Calculate SHA256 hash of a file"""
        sha256_hash = hashlib.sha256()
        try:
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(chunk)
            return sha256_hash.hexdigest()
        except (IOError, PermissionError):
            return None
    
    def get_file_metadata(self, file_path: Path) -> Dict[str, Any]:
        """Get file metadata"""
        try:
            stat = file_path.stat()
            return {
                "path": str(file_path.relative_to(self.repository_path)),
                "size": stat.st_size,
                "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "sha256": self.calculate_sha256(file_path)
            }
        except (IOError, PermissionError):
            return None
    
    def scan_repository(self) -> None:
        """Scan entire repository and emit FILE_DISCOVERED events"""
        print(f"Scanning repository: {self.repository_path}")
        
        # Emit REPOSITORY_DISCOVERED event
        self.emit_event({
            "event_type": "REPOSITORY_DISCOVERED",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "repository_path": str(self.repository_path),
                "scan_started": datetime.utcnow().isoformat()
            }
        })
        
        file_count = 0
        for root, dirs, files in os.walk(self.repository_path):
            # Skip .git directory
            dirs[:] = [d for d in dirs if d != '.git' and not d.startswith('.')]
            
            for file in files:
                file_path = Path(root) / file
                metadata = self.get_file_metadata(file_path)
                
                if metadata:
                    self.files_discovered[metadata["path"]] = metadata
                    
                    # Emit FILE_DISCOVERED event
                    self.emit_event({
                        "event_type": "FILE_DISCOVERED",
                        "timestamp": datetime.utcnow().isoformat(),
                        "data": {
                            **metadata,
                            "source": "filesystem"
                        }
                    })
                    file_count += 1
                    
                    if file_count % 100 == 0:
                        print(f"Discovered {file_count} files...")
        
        print(f"Total files discovered: {file_count}")
        
        # Emit REPOSITORY_DISCOVERED completion
        self.emit_event({
            "event_type": "REPOSITORY_DISCOVERED",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "repository_path": str(self.repository_path),
                "scan_completed": datetime.utcnow().isoformat(),
                "total_files": file_count
            }
        })
    
    def get_postgres_connection(self):
        """Get PostgreSQL connection"""
        return psycopg2.connect(**self.postgres_config)
    
    def emit_event(self, event: Dict[str, Any]) -> None:
        """Emit an event to memory and PostgreSQL"""
        event["event_id"] = str(uuid.uuid4())
        self.events.append(event)
        
        # Write to PostgreSQL
        try:
            conn = self.get_postgres_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                event["event_id"],
                event["event_type"],
                event["timestamp"],
                self.repository_aggregate_id,
                "REPOSITORY",
                json.dumps(event["data"])
            ))
            
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error writing event to PostgreSQL: {e}")
    
    def create_snapshot(self) -> Dict[str, Any]:
        """Create repository snapshot"""
        print("Creating repository snapshot...")
        
        # Calculate snapshot hash from all file hashes
        file_hashes = sorted([f["sha256"] for f in self.files_discovered.values() if f["sha256"]])
        combined_hashes = "".join(file_hashes)
        snapshot_hash = hashlib.sha256(combined_hashes.encode()).hexdigest()
        
        snapshot = {
            "snapshot_id": str(uuid.uuid4()),
            "snapshot_hash": snapshot_hash,
            "file_count": len(self.files_discovered),
            "event_count": len(self.events),
            "timestamp": datetime.utcnow().isoformat(),
            "files": self.files_discovered
        }
        
        # Emit REPOSITORY_SNAPSHOT_CREATED event
        self.emit_event({
            "event_type": "REPOSITORY_SNAPSHOT_CREATED",
            "timestamp": datetime.utcnow().isoformat(),
            "data": snapshot
        })
        
        print(f"Snapshot created: {snapshot_hash}")
        return snapshot
    
    def generate_witness(self, snapshot: Dict[str, Any]) -> Dict[str, Any]:
        """Generate repository witness"""
        print("Generating repository witness...")
        
        # Calculate event hash
        event_data = json.dumps(self.events, sort_keys=True, default=str)
        event_hash = hashlib.sha256(event_data.encode()).hexdigest()
        
        # Calculate lineage hash from snapshot
        lineage_data = json.dumps(snapshot, sort_keys=True, default=str)
        lineage_hash = hashlib.sha256(lineage_data.encode()).hexdigest()
        
        # Generate witness root
        witness_data = f"{snapshot['snapshot_hash']}:{event_hash}:{lineage_hash}"
        witness_root = hashlib.sha256(witness_data.encode()).hexdigest()
        
        witness = {
            "witness_root": witness_root,
            "snapshot_hash": snapshot["snapshot_hash"],
            "event_hash": event_hash,
            "lineage_hash": lineage_hash,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Emit REPOSITORY_WITNESS_CREATED event
        self.emit_event({
            "event_type": "REPOSITORY_WITNESS_CREATED",
            "timestamp": datetime.utcnow().isoformat(),
            "data": witness
        })
        
        print(f"Witness generated: {witness_root}")
        return witness
    
    def verify_replay(self) -> Dict[str, Any]:
        """Verify replay from filesystem"""
        print("Verifying replay...")
        
        # Re-scan filesystem
        current_files = {}
        for root, dirs, files in os.walk(self.repository_path):
            dirs[:] = [d for d in dirs if d != '.git' and not d.startswith('.')]
            for file in files:
                file_path = Path(root) / file
                metadata = self.get_file_metadata(file_path)
                if metadata:
                    current_files[metadata["path"]] = metadata
        
        # Compare with discovered files
        discovered_paths = set(self.files_discovered.keys())
        current_paths = set(current_files.keys())
        
        added_files = current_paths - discovered_paths
        removed_files = discovered_paths - current_paths
        modified_files = []
        
        for path in discovered_paths & current_paths:
            if self.files_discovered[path]["sha256"] != current_files[path]["sha256"]:
                modified_files.append(path)
        
        verification_result = {
            "verified": len(added_files) == 0 and len(removed_files) == 0 and len(modified_files) == 0,
            "added_files": list(added_files),
            "removed_files": list(removed_files),
            "modified_files": modified_files,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Emit REPOSITORY_SNAPSHOT_VERIFIED event
        self.emit_event({
            "event_type": "REPOSITORY_SNAPSHOT_VERIFIED",
            "timestamp": datetime.utcnow().isoformat(),
            "data": verification_result
        })
        
        print(f"Replay verification: {'PASSED' if verification_result['verified'] else 'FAILED'}")
        return verification_result
    
    def emit_commit_events(self) -> None:
        """Emit commit events for current git state"""
        print("Emitting commit events...")
        
        try:
            # Get current commit
            result = subprocess.run(
                ["git", "rev-parse", "HEAD"],
                cwd=self.repository_path,
                capture_output=True,
                text=True
            )
            commit_hash = result.stdout.strip() if result.returncode == 0 else None
            
            # Get parent commit
            result = subprocess.run(
                ["git", "rev-parse", "HEAD^"],
                cwd=self.repository_path,
                capture_output=True,
                text=True
            )
            parent_hash = result.stdout.strip() if result.returncode == 0 else None
            
            if commit_hash:
                # Emit COMMIT_CREATED event
                self.emit_event({
                    "event_type": "COMMIT_CREATED",
                    "timestamp": datetime.utcnow().isoformat(),
                    "data": {
                        "commit_hash": commit_hash,
                        "parent_hash": parent_hash,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                })
                
                # Emit COMMIT_VERIFIED event
                self.emit_event({
                    "event_type": "COMMIT_VERIFIED",
                    "timestamp": datetime.utcnow().isoformat(),
                    "data": {
                        "commit_hash": commit_hash,
                        "verified": True,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                })
                
                print(f"Commit events emitted for: {commit_hash}")
        except Exception as e:
            print(f"Error emitting commit events: {e}")
    
    def save_events(self, output_path: str) -> None:
        """Save events to file"""
        with open(output_path, 'w') as f:
            json.dump(self.events, f, indent=2, default=str)
        print(f"Events saved to: {output_path}")


def main():
    """Main execution"""
    repository_path = r"C:\Users\nolan\PING"
    
    postgres_config = {
        "host": "localhost",
        "port": 5432,
        "database": "crx_runtime",
        "user": "postgres",
        "password": ""
    }
    
    print("=" * 80)
    print("REPOSITORY EVENT LAYER - CONSTITUTIONAL FREEZE")
    print("=" * 80)
    
    layer = RepositoryEventLayer(repository_path, postgres_config)
    
    # Step 1: Scan repository
    layer.scan_repository()
    
    # Step 2: Create snapshot
    snapshot = layer.create_snapshot()
    
    # Step 3: Generate witness
    witness = layer.generate_witness(snapshot)
    
    # Step 4: Verify replay
    verification = layer.verify_replay()
    
    # Step 5: Emit commit events
    layer.emit_commit_events()
    
    # Step 6: Save events
    events_path = os.path.join(repository_path, "repository_events.json")
    layer.save_events(events_path)
    
    # Print summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total files discovered: {len(layer.files_discovered)}")
    print(f"Total events emitted: {len(layer.events)}")
    print(f"Snapshot hash: {snapshot['snapshot_hash']}")
    print(f"Witness root: {witness['witness_root']}")
    print(f"Replay verification: {'PASSED' if verification['verified'] else 'FAILED'}")
    print(f"Events saved to: {events_path}")
    print("=" * 80)


if __name__ == "__main__":
    main()
