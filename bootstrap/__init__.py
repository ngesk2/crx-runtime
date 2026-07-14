"""
Bootstrap - Automatic registration of constitutional components.

This module provides bootstrap loading from YAML manifest:
- BootstrapLoader: Load capabilities, authorities, connectors from manifest
"""

from .bootstrap_loader import BootstrapLoader

__all__ = [
    "BootstrapLoader",
]
