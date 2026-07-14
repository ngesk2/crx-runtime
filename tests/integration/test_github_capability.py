"""
Integration Test: Acquire GitHub Repository Capability

This test demonstrates the complete flow for GitHub repository acquisition:
1. Create Mission
2. Execute AcquireGitHubRepository capability
3. Verify CanonicalArtifact is produced
4. Verify provenance is correct
"""

import pytest
import asyncio
from datetime import datetime
from typing import Dict, Any
from dataclasses import dataclass

from capabilities.github.acquire_repository import AcquireGitHubRepository
from constitution.models.request import ConnectorRequest
from constitution.models.evidence import CanonicalArtifact


@pytest.mark.asyncio
@pytest.mark.skipif(
    not pytest.config.getoption("--run-github-tests", default=False),
    reason="GitHub tests require --run-github-tests flag and GitHub token"
)
async def test_acquire_github_repository():
    """Test GitHub repository acquisition."""
    
    # Initialize capability
    capability = AcquireGitHubRepository()
    await capability.initialize()
    
    # Create request
    request = ConnectorRequest.create(
        operation="acquire",
        connector_type="github",
        config={
            "owner": "octocat",
            "repo": "Hello-World",
            "branch": "master"
        }
    )
    
    # Acquire repository
    artifact = await capability.acquire(request, build_witness_hash="")
    
    # Verify artifact
    assert artifact is not None
    assert artifact.artifact_type == "github_repository"
    assert artifact.artifact_id is not None
    assert artifact.canonical_bytes is not None  # This is the commit hash
    
    # Verify metadata
    assert artifact.metadata["owner"] == "octocat"
    assert artifact.metadata["repo"] == "Hello-World"
    assert artifact.metadata["branch"] == "master"
    assert artifact.metadata["commit_hash"] is not None
    
    # Verify provenance
    assert artifact.provenance.capability == "github"
    assert artifact.provenance.acquisition.operation == "clone"
    assert artifact.provenance.endpoint == "github.com/octocat/Hello-World"
    
    # Shutdown
    await capability.shutdown()


@pytest.mark.asyncio
async def test_acquire_github_repository_execute():
    """Test GitHub repository acquisition via execute method."""
    
    # Initialize capability
    capability = AcquireGitHubRepository()
    await capability.initialize()
    
    # Execute with context
    result = await capability.execute({
        "owner": "octocat",
        "repo": "Hello-World",
        "branch": "master",
        "token": None
    })
    
    # Verify result
    assert result["success"] is True
    assert result["artifact_id"] is not None
    assert result["artifact_type"] == "github_repository"
    assert result["metadata"]["owner"] == "octocat"
    assert result["metadata"]["repo"] == "Hello-World"
    
    # Shutdown
    await capability.shutdown()


@pytest.mark.asyncio
async def test_acquire_github_repository_missing_params():
    """Test GitHub repository acquisition with missing parameters."""
    
    # Initialize capability
    capability = AcquireGitHubRepository()
    await capability.initialize()
    
    # Execute with missing owner
    with pytest.raises(ValueError, match="owner and repo are required"):
        await capability.execute({
            "repo": "Hello-World",
            "branch": "master"
        })
    
    # Execute with missing repo
    with pytest.raises(ValueError, match="owner and repo are required"):
        await capability.execute({
            "owner": "octocat",
            "branch": "master"
        })
    
    # Shutdown
    await capability.shutdown()


@pytest.mark.asyncio
async def test_acquire_github_repository_health_check():
    """Test GitHub repository capability health check."""
    
    # Initialize capability
    capability = AcquireGitHubRepository()
    await capability.initialize()
    
    # Health check
    is_healthy = await capability.health_check()
    assert is_healthy is True
    
    # Shutdown
    await capability.shutdown()
    
    # Health check after shutdown
    is_healthy = await capability.health_check()
    assert is_healthy is False
