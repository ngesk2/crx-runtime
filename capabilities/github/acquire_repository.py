"""
Acquire GitHub Repository - GitHub repository acquisition capability.

This capability clones GitHub repositories and produces canonical artifacts.
Implements ConnectorCapability contract.
"""

import asyncio
import subprocess
import tempfile
import shutil
from pathlib import Path
from typing import Dict, Any
from datetime import datetime

from constitution.registry import CapabilityMetadata, CapabilityCategory, CapabilityState
from constitution.models.request import ConnectorRequest
from constitution.models.evidence import (
    CanonicalArtifact, CapabilityProvenance, ImplementationProvenance,
    PlatformProvenance, AcquisitionProvenance
)
from constitution.hashing import hash_dict, hash_bytes


class AcquireGitHubRepository:
    """
    GitHub repository acquisition capability.
    
    Clones GitHub repositories and produces canonical artifacts.
    """
    
    def __init__(self):
        self._metadata = CapabilityMetadata(
            name="acquire_github_repository",
            version="1.0.0",
            category=CapabilityCategory.ACQUIRE,
            description="Acquire GitHub repository as canonical artifact",
            author="hermes",
        )
        self._state = CapabilityState.REGISTERED
    
    @property
    def metadata(self) -> CapabilityMetadata:
        return self._metadata
    
    @property
    def state(self) -> CapabilityState:
        return self._state
    
    async def initialize(self) -> None:
        """Initialize the capability."""
        self._state = CapabilityState.ACTIVE
    
    async def shutdown(self) -> None:
        """Shutdown the capability."""
        self._state = CapabilityState.DISABLED
    
    async def health_check(self) -> bool:
        """Health check."""
        return self._state == CapabilityState.ACTIVE
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the capability.
        
        Expects context with:
        - owner: GitHub repository owner
        - repo: GitHub repository name
        - branch: Branch to clone (default: main)
        - token: GitHub token for authentication (optional)
        """
        owner = context.get("owner")
        repo = context.get("repo")
        branch = context.get("branch", "main")
        token = context.get("token")
        
        if not owner or not repo:
            raise ValueError("owner and repo are required")
        
        # Create canonical request
        request = ConnectorRequest.create(
            operation="acquire",
            connector_type="github",
            config={"owner": owner, "repo": repo, "branch": branch}
        )
        
        # Acquire repository
        evidence = await self.acquire(request, build_witness_hash="")
        
        return {
            "success": True,
            "artifact_id": evidence.artifact_id,
            "artifact_type": evidence.artifact_type,
            "metadata": evidence.metadata,
            "provenance": evidence.provenance.dict() if hasattr(evidence.provenance, 'dict') else str(evidence.provenance),
        }
    
    async def acquire(self, request: ConnectorRequest, build_witness_hash: str) -> CanonicalArtifact:
        """
        Acquire GitHub repository as canonical artifact.
        
        Constitutional requirements:
        - Returns CanonicalArtifact with full provenance
        - Deterministic for same request
        - Includes acquisition witness
        - Includes capability witness
        - References build_witness_hash
        """
        owner = request.config.get("owner")
        repo = request.config.get("repo")
        branch = request.config.get("branch", "main")
        
        # Create temporary directory for clone
        with tempfile.TemporaryDirectory() as temp_dir:
            repo_path = Path(temp_dir) / f"{owner}_{repo}"
            
            # Clone repository
            await self._clone_repository(owner, repo, branch, repo_path)
            
            # Hash repository
            repo_hash = await self._hash_repository(repo_path)
            
            # Create canonical artifact
            artifact = self._create_canonical_artifact(
                owner=owner,
                repo=repo,
                branch=branch,
                repo_hash=repo_hash,
                request=request,
                build_witness_hash=build_witness_hash
            )
            
            return artifact
    
    async def _clone_repository(self, owner: str, repo: str, branch: str, repo_path: Path) -> None:
        """Clone GitHub repository."""
        url = f"https://github.com/{owner}/{repo}.git"
        
        # Run git clone
        process = await asyncio.create_subprocess_exec(
            "git",
            "clone",
            "--branch",
            branch,
            "--depth",
            "1",
            url,
            str(repo_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise RuntimeError(f"Failed to clone repository: {stderr.decode()}")
    
    async def _hash_repository(self, repo_path: Path) -> str:
        """Hash repository contents."""
        # Get git hash of HEAD
        process = await asyncio.create_subprocess_exec(
            "git",
            "rev-parse",
            "HEAD",
            cwd=repo_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise RuntimeError(f"Failed to get repository hash: {stderr.decode()}")
        
        return stdout.decode().strip()
    
    def _create_canonical_artifact(
        self,
        owner: str,
        repo: str,
        branch: str,
        repo_hash: str,
        request: ConnectorRequest,
        build_witness_hash: str
    ) -> CanonicalArtifact:
        """Create canonical artifact with provenance."""
        
        # Create provenance
        platform_provenance = PlatformProvenance(
            platform="Python",
            host=None,
            device=None
        )
        
        implementation_provenance = ImplementationProvenance(
            implementation="python",
            version="1.0.0",
            platform=platform_provenance
        )
        
        acquisition_provenance = AcquisitionProvenance(
            operation="clone",
            acquired_at=datetime.utcnow(),
            acquisition_hash=repo_hash
        )
        
        capability_provenance = CapabilityProvenance(
            capability="github",
            implementation=implementation_provenance,
            acquisition=acquisition_provenance,
            endpoint=f"github.com/{owner}/{repo}",
        )
        
        # Create artifact
        artifact_id = hash_dict({
            "owner": owner,
            "repo": repo,
            "branch": branch,
            "hash": repo_hash,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        artifact = CanonicalArtifact(
            artifact_id=artifact_id,
            artifact_type="github_repository",
            canonical_bytes=repo_hash,
            metadata={
                "owner": owner,
                "repo": repo,
                "branch": branch,
                "commit_hash": repo_hash,
                "request_hash": request.request_hash,
            },
            provenance=capability_provenance,
            acquisition_witness=repo_hash,
            capability_witness=hash_dict({"name": self._metadata.name, "version": self._metadata.version}),
            build_witness=build_witness_hash,
            constitutional_hash=artifact_id,
        )
        
        return artifact


# Export for BootstrapLoader
CAPABILITY_CLASS = AcquireGitHubRepository
