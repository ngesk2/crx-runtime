"""
Capabilities package - Execution infrastructure interfaces.

Capabilities define contracts for execution infrastructure.
Implementations satisfy these contracts (Rust, Python, etc.).

This separation ensures:
- Constitutional kernel is independent of implementation
- Multiple implementations can satisfy the same capability
- Implementations can be swapped without affecting constitutional rules
- Clear separation between "what to do" (authority) and "how to do it" (capabilities)
"""

from capabilities.filesystem import FilesystemCapability
from capabilities.storage import StorageCapability
from capabilities.network import NetworkCapability
from capabilities.search import SearchCapability
from capabilities.media import MediaCapability
from capabilities.connector import ConnectorCapability
from capabilities.agent import AgentCapability
from capabilities.tool import ToolCapability
from capabilities.workflow import WorkflowCapability

__all__ = [
    "FilesystemCapability",
    "StorageCapability",
    "NetworkCapability",
    "SearchCapability",
    "MediaCapability",
    "ConnectorCapability",
    "AgentCapability",
    "ToolCapability",
    "WorkflowCapability",
]
