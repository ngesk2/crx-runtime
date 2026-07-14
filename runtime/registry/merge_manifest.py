"""
Merge Manifest - Immutable record of every merge.

Every merge becomes an immutable record with:
- merge_id
- sandbox
- parent_commit
- components
- tests
- reviewed_by
- approved_by
- runtime_version
- constitution_version
- schema_version

NOTE: Merge verification cannot be bypassed. All merges must pass verification
before being recorded. This is enforced by the create_manifest method which
requires verification evidence before creating the manifest.
"""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict


@dataclass
class MergeManifest:
    """Immutable record of a merge operation."""
    merge_id: str
    sandbox: str
    parent_commit: str
    components: List[str]
    tests: List[str]
    reviewed_by: str
    approved_by: str
    runtime_version: str
    constitution_version: str
    schema_version: str
    merged_at: str
    changed_files: List[str]
    breaking_changes: List[str]
    verification_evidence: Dict[str, Any]  # Required: cannot bypass verification
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)
    
    def to_json(self) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict(), indent=2)


class MergeManifestRegistry:
    """
    Registry for merge manifests.
    
    Stores immutable merge records for audit and governance.
    """
    
    def __init__(self, manifest_dir: str = "runtime/registry/merges"):
        self.manifest_dir = Path(manifest_dir)
        self.manifest_dir.mkdir(parents=True, exist_ok=True)
    
    def create_manifest(
        self,
        sandbox: str,
        parent_commit: str,
        components: List[str],
        tests: List[str],
        reviewed_by: str,
        approved_by: str,
        runtime_version: str,
        constitution_version: str,
        schema_version: str,
        changed_files: List[str],
        breaking_changes: List[str],
        verification_evidence: Dict[str, Any]
    ) -> MergeManifest:
        """
        Create a new merge manifest.
        
        Verification evidence is REQUIRED - cannot bypass verification.
        """
        if not verification_evidence:
            raise ValueError("Verification evidence is required to create merge manifest")
        
        manifest = MergeManifest(
            merge_id=str(uuid.uuid4()),
            sandbox=sandbox,
            parent_commit=parent_commit,
            components=components,
            tests=tests,
            reviewed_by=reviewed_by,
            approved_by=approved_by,
            runtime_version=runtime_version,
            constitution_version=constitution_version,
            schema_version=schema_version,
            merged_at=datetime.now(timezone.utc).isoformat(),
            changed_files=changed_files,
            breaking_changes=breaking_changes,
            verification_evidence=verification_evidence
        )
        
        return manifest
    
    def save_manifest(self, manifest: MergeManifest) -> None:
        """Save manifest to file."""
        manifest_file = self.manifest_dir / f"{manifest.merge_id}.json"
        
        with open(manifest_file, 'w') as f:
            f.write(manifest.to_json())
    
    def load_manifest(self, merge_id: str) -> Optional[MergeManifest]:
        """Load manifest by ID."""
        manifest_file = self.manifest_dir / f"{merge_id}.json"
        
        if not manifest_file.exists():
            return None
        
        with open(manifest_file, 'r') as f:
            data = json.load(f)
        
        return MergeManifest(**data)
    
    def list_manifests(self, sandbox: Optional[str] = None) -> List[MergeManifest]:
        """List all manifests, optionally filtered by sandbox."""
        manifests = []
        
        for manifest_file in self.manifest_dir.glob("*.json"):
            with open(manifest_file, 'r') as f:
                data = json.load(f)
            
            manifest = MergeManifest(**data)
            
            if sandbox is None or manifest.sandbox == sandbox:
                manifests.append(manifest)
        
        # Sort by merged_at descending
        manifests.sort(key=lambda m: m.merged_at, reverse=True)
        
        return manifests
    
    def get_latest_manifest(self, sandbox: str) -> Optional[MergeManifest]:
        """Get the latest manifest for a sandbox."""
        manifests = self.list_manifests(sandbox)
        
        if not manifests:
            return None
        
        return manifests[0]
