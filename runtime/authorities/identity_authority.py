"""IdentityAuthority — single authority for identity generation.

Every UUID/identity in the system originates from this class.
No worker or tool calls uuid.uuid4() directly.
"""

import uuid
from typing import Optional


class IdentityAuthority:
    """Single authority for generating identities."""

    @staticmethod
    def generate_id() -> str:
        """Generate a unique identity string."""
        return str(uuid.uuid4())

    @staticmethod
    def generate_deterministic_id(namespace: str, name: str) -> str:
        """Generate a deterministic UUID v5 from namespace and name."""
        ns_uuid = uuid.NAMESPACE_DNS if namespace == 'dns' else uuid.NAMESPACE_URL
        return str(uuid.uuid5(ns_uuid, name))

    @staticmethod
    def generate_short_id() -> str:
        """Generate a short (8 char) hex identifier for internal use."""
        return uuid.uuid4().hex[:8]
