"""
GitHub Capabilities - GitHub repository acquisition and processing.

This module provides capabilities for interacting with GitHub:
- AcquireGitHubRepository: Clone and canonicalize GitHub repositories
"""

from .acquire_repository import AcquireGitHubRepository

__all__ = [
    "AcquireGitHubRepository",
]
