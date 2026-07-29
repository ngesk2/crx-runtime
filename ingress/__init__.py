"""Ingress Package

RuntimeInputBoundary with IngressRegistry for handling all ingress sources.
"""

from ingress.boundary import RuntimeInputBoundary
from ingress.registry import IngressRegistry
from ingress.adapters.base import IngressAdapter

__all__ = [
    "RuntimeInputBoundary",
    "IngressRegistry",
    "IngressAdapter",
]
