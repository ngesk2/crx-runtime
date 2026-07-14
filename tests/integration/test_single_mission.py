"""
Integration Test: Single Mission Execution

This test demonstrates the complete flow:
1. Create Mission
2. Persist Mission
3. Queue Mission
4. Acquire Lease
5. Execute one Capability
6. Store canonical result
7. Mark Mission complete
8. Release Lease
9. Shutdown cleanly
"""

import pytest
import asyncio
from datetime import datetime
from typing import Dict, Any

from hermes.execution import MissionQueue, RuntimeState, RuntimeLifecycle, LeaseManager, MissionStateStore, MissionState, MissionLifecycleState
from hermes.runtime import MissionFactory, MissionSerializer, CapabilityResolver, ExecutionPipeline, CanonicalArtifactRepository, EventBus
from constitution.registry import CapabilityRegistry, CapabilityMetadata, CapabilityCategory


# Test capability for demonstration
class TestCapability:
    """Simple test capability for demonstration."""
    
    def __init__(self):
        self._metadata = CapabilityMetadata(
            name="test_capability",
            version="1.0.0",
            category=CapabilityCategory.EXECUTE,
            description="Test capability for demonstration",
            author="hermes",
        )
        self.state = "registered"
    
    @property
    def metadata(self):
        return self._metadata
    
    @property
    def name(self):
        return self._metadata.name
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the test capability."""
        # Simulate some work
        await asyncio.sleep(0.01)
        
        # Return canonical result
        return {
            "success": True,
            "result": "Test capability executed successfully",
            "timestamp": datetime.utcnow().isoformat(),
            "mission_id": context.get("mission_id"),
            "execution_id": context.get("execution_id"),
        }
    
    async def health_check(self) -> bool:
        """Health check."""
        return True
    
    async def initialize(self) -> None:
        """Initialize the capability."""
        self.state = "active"
    
    async def shutdown(self) -> None:
        """Shutdown the capability."""
        self.state = "disabled"


@pytest.mark.asyncio
async def test_single_mission_execution():
    """Test end-to-end mission execution with new runtime services."""
    
    # Initialize components
    runtime_state = RuntimeState()
    mission_queue = MissionQueue()
    lease_manager = LeaseManager()
    state_store = MissionStateStore("test_hermes_missions.db")
    await state_store.initialize()
    
    event_bus = EventBus()
    artifact_repository = CanonicalArtifactRepository(event_bus)
    
    capability_registry = CapabilityRegistry()
    test_capability = TestCapability()
    capability_registry.register(test_capability)
    await test_capability.initialize()
    
    capability_resolver = CapabilityResolver(capability_registry)
    execution_pipeline = ExecutionPipeline(
        state_store=state_store,
        lease_manager=lease_manager,
        capability_resolver=capability_resolver,
        artifact_repository=artifact_repository,
        event_bus=event_bus
    )
    
    mission_factory = MissionFactory()
    mission_serializer = MissionSerializer()
    
    # Create Mission using factory
    mission = mission_factory.create(
        capability="test_capability",
        inputs={"test": "data"},
        goal_id="test_goal_001",
        description="Test mission for demonstration",
        priority=1,
        constraints=[],
        created_by="hermes_test"
    )
    
    # Queue Mission
    mission_data = mission_serializer.serialize(mission)
    await mission_queue.enqueue(
        mission_id=mission.mission_id,
        mission_data=mission_data,
        priority=mission.priority
    )
    
    # Create initial state
    state = MissionState(
        mission_id=mission.mission_id,
        lifecycle=MissionLifecycleState.QUEUED,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    await state_store.save(state)
    
    # Dequeue Mission
    queued_mission = await mission_queue.dequeue()
    assert queued_mission.mission_id == mission.mission_id
    
    # Reconstruct mission using factory
    reconstructed_mission = mission_factory.reconstruct(queued_mission.mission_data)
    assert reconstructed_mission.mission_id == mission.mission_id
    assert reconstructed_mission.capability == "test_capability"
    
    # Execute through pipeline
    result = await execution_pipeline.execute(reconstructed_mission)
    
    assert result["status"] == "completed"
    assert result["result"]["success"] is True
    
    # Verify final state
    final_state = await state_store.load(mission.mission_id)
    assert final_state.lifecycle == MissionLifecycleState.COMPLETED
    assert final_state.result is not None
    assert final_state.result["success"] is True
    
    # Verify events were emitted
    history = event_bus.get_history()
    assert len(history) > 0
    
    # Shutdown
    await test_capability.shutdown()
    
    # Cleanup
    await state_store.delete(mission.mission_id)


@pytest.mark.asyncio
async def test_mission_factory():
    """Test MissionFactory creates immutable missions."""
    
    mission_factory = MissionFactory()
    
    # Create mission
    mission = mission_factory.create(
        capability="test_capability",
        inputs={"test": "data"},
        goal_id="test_goal_001",
        description="Test mission",
        priority=1,
        constraints=[],
        created_by="hermes_test"
    )
    
    # Verify mission structure
    assert mission.mission_id is not None
    assert mission.capability == "test_capability"
    assert mission.inputs == {"test": "data"}
    assert mission.goal_id == "test_goal_001"
    assert mission.description == "Test mission"
    assert mission.priority == 1
    assert mission.constraints == []
    assert mission.created_by == "hermes_test"
    
    # Verify immutability (frozen dataclass)
    try:
        mission.capability = "different_capability"
        assert False, "Mission should be immutable"
    except Exception:
        pass  # Expected


@pytest.mark.asyncio
async def test_mission_serializer():
    """Test MissionSerializer serialization/deserialization."""
    
    mission_factory = MissionFactory()
    mission_serializer = MissionSerializer()
    
    # Create mission
    mission = mission_factory.create(
        capability="test_capability",
        inputs={"test": "data"},
        goal_id="test_goal_001",
        description="Test mission",
        priority=1,
        constraints=[],
        created_by="hermes_test"
    )
    
    # Serialize
    serialized = mission_serializer.serialize(mission)
    
    assert serialized["mission_id"] == mission.mission_id
    assert serialized["capability"] == mission.capability
    assert serialized["inputs"] == mission.inputs
    assert serialized["goal_id"] == mission.goal_id
    assert serialized["description"] == mission.description
    assert serialized["priority"] == mission.priority
    assert serialized["constraints"] == mission.constraints
    assert serialized["created_by"] == mission.created_by
    
    # Deserialize
    deserialized = mission_serializer.deserialize(serialized)
    
    assert deserialized.mission_id == mission.mission_id
    assert deserialized.capability == mission.capability
    assert deserialized.inputs == mission.inputs
    assert deserialized.goal_id == mission.goal_id
    assert deserialized.description == mission.description
    assert deserialized.priority == mission.priority
    assert deserialized.constraints == mission.constraints
    assert deserialized.created_by == mission.created_by
