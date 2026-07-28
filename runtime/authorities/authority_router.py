"""AuthorityRouter — single routing interface for all workers and tools.

Workers import only the router and never know about specific authorities.
Tools route through the router instead of executing raw SQL or calling APIs directly.

Usage:
    from runtime.authorities.authority_router import AuthorityRouter

    # Query repository authority
    result = AuthorityRouter.query("repository", "search_authorities", query="constitutional")

    # Generate an identity
    id = AuthorityRouter.query("identity", "generate_id")

    # Compute a hash
    digest = AuthorityRouter.query("hash", "sha256", data="hello")

    # Search vector projection
    results = AuthorityRouter.query("projection", "search_collection", query="test", limit=5)

    # Get configuration
    cfg = AuthorityRouter.query("configuration", "get_postgres_config")
"""

from typing import Any, Dict, Optional
from runtime.authorities.repository_authority import RepositoryAuthority
from runtime.authorities.projection_authority import ProjectionAuthority
from runtime.authorities.identity_authority import IdentityAuthority
from runtime.authorities.canonical_hash_authority import CanonicalHashAuthority
from runtime.config.configuration_authority import ConfigurationAuthority


class AuthorityRouter:
    """Single routing layer. Workers import only this class."""

    _authorities = {
        'repository': RepositoryAuthority,
        'projection': ProjectionAuthority,
        'identity': IdentityAuthority,
        'hash': CanonicalHashAuthority,
        'canonical_hash': CanonicalHashAuthority,
        'configuration': ConfigurationAuthority.current(),
    }

    @classmethod
    def query(cls, authority: str, method: str, **params) -> Any:
        """Route to the appropriate authority and execute method with params."""
        if authority == 'configuration':
            cfg = ConfigurationAuthority.current()
            return getattr(cfg, method)(**params) if hasattr(cfg, method) else cfg.get(method)

        auth_cls = cls._authorities.get(authority)
        if not auth_cls:
            raise ValueError(f"Unknown authority: {authority}. Available: {list(cls._authorities.keys())}")

        method_fn = getattr(auth_cls, method, None)
        if not method_fn:
            raise ValueError(f"Unknown method '{method}' on authority '{authority}'")

        return method_fn(**params)
