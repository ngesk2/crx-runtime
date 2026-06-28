"""CanonicalHashAuthority — single authority for all hashing.

Every SHA256 hash in the system originates from this class.
No worker or tool calls hashlib.sha256() directly.
"""

import hashlib
from typing import Union, Optional


class CanonicalHashAuthority:
    """Single authority for computing cryptographic hashes."""

    @staticmethod
    def sha256(data: Union[str, bytes]) -> str:
        """Compute SHA256 hex digest of input data."""
        if isinstance(data, str):
            data = data.encode('utf-8')
        return hashlib.sha256(data).hexdigest()

    @staticmethod
    def hash_json(obj) -> str:
        """Compute SHA256 of canonical JSON representation."""
        import json
        canonical = json.dumps(obj, sort_keys=True, ensure_ascii=True, default=str)
        return CanonicalHashAuthority.sha256(canonical)

    @staticmethod
    def hash_dict(d: dict) -> str:
        """Shortcut for hashing a dict by its sorted key-value pairs."""
        return CanonicalHashAuthority.hash_json(d)
