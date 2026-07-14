"""
Runtime Router - Route mission to capability.

This service provides the single routing point Hermes uses forever.
Hermes never imports capabilities directly.
It asks route(mission).
"""

from typing import Any
from hermes.runtime.resolver import CapabilityResolver
from hermes.runtime.pipeline import ExecutionPipeline


class RuntimeRouter:
    """
    Runtime router for mission routing.
    
    Mission → RuntimeRouter → CapabilityResolver → ExecutionPipeline
    Hermes never branches on connector type.
    """
    
    def __init__(
        self,
        capability_resolver: CapabilityResolver,
        execution_pipeline: ExecutionPipeline
    ):
        self.capability_resolver = capability_resolver
        self.execution_pipeline = execution_pipeline
    
    async def route(self, mission: Any) -> Dict[str, Any]:
        """
        Route mission to appropriate capability and execute.
        
        Args:
            mission: Mission object
        
        Returns:
            Execution result
        """
        # Resolve capability from mission
        capability = self.capability_resolver.resolve_from_mission(mission)
        
        # Execute through pipeline
        result = await self.execution_pipeline.execute(mission)
        
        return result
    
    async def route_capability(self, capability_name: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Direct capability execution by name.
        
        Args:
            capability_name: Capability identifier
            inputs: Capability inputs
        
        Returns:
            Execution result
        """
        capability = self.capability_resolver.resolve(capability_name)
        result = await capability.execute(inputs)
        return result
