"""
Bootstrap Loader - YAML manifest loading.

This service loads capabilities, authorities, and connectors from YAML manifest.
Startup becomes: Manifest → Loader → Registry
No manual imports.
"""

from typing import Any, Dict, List
import yaml
import importlib
from pathlib import Path


class BootstrapLoader:
    """
    Load bootstrap configuration from YAML manifest.
    
    Manifest structure:
    capabilities:
      - github.acquire_repository
      - filesystem.read
      - filesystem.write
    authorities:
      - aggregate
      - projection
    connectors:
      - github
      - postgres
      - oracle
    """
    
    def __init__(self, manifest_path: str = "bootstrap/manifest.yaml"):
        self.manifest_path = Path(manifest_path)
    
    def load_manifest(self) -> Dict[str, List[str]]:
        """
        Load manifest from YAML file.
        
        Returns:
            Dictionary with capabilities, authorities, connectors lists
        """
        if not self.manifest_path.exists():
            return self._default_manifest()
        
        with open(self.manifest_path, 'r') as f:
            manifest = yaml.safe_load(f)
        
        return manifest
    
    def _default_manifest(self) -> Dict[str, List[str]]:
        """Return default manifest if file doesn't exist."""
        return {
            "capabilities": [
                "github.acquire_repository",
            ],
            "authorities": [
                "aggregate",
                "projection",
            ],
            "connectors": [
                "github",
            ],
        }
    
    async def load_capabilities(self) -> List[Any]:
        """
        Load capabilities from manifest.
        
        Returns:
            List of capability instances
        """
        manifest = self.load_manifest()
        capability_names = manifest.get("capabilities", [])
        
        capabilities = []
        for name in capability_names:
            capability = self._load_capability(name)
            if capability:
                capabilities.append(capability)
        
        return capabilities
    
    def _load_capability(self, capability_name: str) -> Any:
        """
        Load capability by name.
        
        Args:
            capability_name: Capability identifier (e.g., "github.acquire_repository")
        
        Returns:
            Capability instance or None
        """
        # Parse capability name
        parts = capability_name.split(".")
        
        if len(parts) < 2:
            print(f"Invalid capability name: {capability_name}")
            return None
        
        # Import capability using importlib
        try:
            module_path = f"capabilities.{parts[0]}.{parts[1]}"
            module = importlib.import_module(module_path)
            
            # Try to get CAPABILITY_CLASS first
            if hasattr(module, 'CAPABILITY_CLASS'):
                capability_class = getattr(module, 'CAPABILITY_CLASS')
                return capability_class()
            
            # Try to call create_capability() function
            if hasattr(module, 'create_capability'):
                create_func = getattr(module, 'create_capability')
                return create_func()
            
            # Fallback to class name reconstruction (deprecated)
            class_name = parts[1].replace("_", " ").title().replace(" ", "")
            if hasattr(module, class_name):
                capability_class = getattr(module, class_name)
                return capability_class()
            
            print(f"Capability module {module_path} does not export CAPABILITY_CLASS, create_capability(), or {class_name}")
            return None
            
        except (ImportError, AttributeError) as e:
            print(f"Failed to load capability {capability_name}: {e}")
            return None
    
    async def load_authorities(self) -> List[Any]:
        """
        Load authorities from manifest.
        
        Returns:
            List of authority instances
        """
        manifest = self.load_manifest()
        authority_names = manifest.get("authorities", [])
        
        authorities = []
        for name in authority_names:
            authority = self._load_authority(name)
            if authority:
                authorities.append(authority)
        
        return authorities
    
    def _load_authority(self, authority_name: str) -> Any:
        """
        Load authority by name.
        
        Args:
            authority_name: Authority identifier
        
        Returns:
            Authority instance or None
        """
        # Placeholder for authority loading
        # Future: implement authority loading logic
        return None
    
    async def load_connectors(self) -> List[Any]:
        """
        Load connectors from manifest.
        
        Returns:
            List of connector instances
        """
        manifest = self.load_manifest()
        connector_names = manifest.get("connectors", [])
        
        connectors = []
        for name in connector_names:
            connector = self._load_connector(name)
            if connector:
                connectors.append(connector)
        
        return connectors
    
    def _load_connector(self, connector_name: str) -> Any:
        """
        Load connector by name.
        
        Args:
            connector_name: Connector identifier
        
        Returns:
            Connector instance or None
        """
        # Placeholder for connector loading
        # Future: implement connector loading logic
        return None
    
    async def register_all(self) -> None:
        """
        Load and register all components from manifest.
        
        This is the main entry point for bootstrap loading.
        """
        from constitution.registry import CapabilityRegistry, get_registry
        
        registry = get_registry()
        
        # Load and register capabilities
        capabilities = await self.load_capabilities()
        for capability in capabilities:
            registry.register(capability)
            await capability.initialize()
        
        # Load and register authorities
        authorities = await self.load_authorities()
        # Future: register with AuthorityRegistry
        
        # Load and register connectors
        connectors = await self.load_connectors()
        # Future: register with ConnectorRegistry
