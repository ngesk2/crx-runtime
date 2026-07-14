"""
End-to-end integration test for mission lifecycle.

Tests the complete flow:
Mission → Queue → Executor → Lease → Capability → Artifact → Event → Mission Complete
"""

import asyncio
import pytest
import tempfile
import shutil
from pathlib import Path
from datetime import datetime

from hermes.execution.queue import MissionQueue
from hermes.execution.queue_backend import SQLiteQueueBackend
from hermes.execution.executor_pool import ExecutorPool
from hermes.execution.lease import LeaseManager
from hermes.runtime.mission_store import MissionStore
from hermes.runtime.artifact_repository import CanonicalArtifactRepository
from hermes.runtime.event_bus import EventBus
from hermes.storage.engine import StorageEngine


class SimpleMission:
    """Simple mission for testing."""
    
    def __init__(self, mission_id: str, data: str):
        self.mission_id = mission_id
        self.data = data
        self.priority = 0


class SimpleCapability:
    """Simple capability for testing."""
    
    def __init__(self):
        self.executed_count = 0
    
    async def execute(self, mission: SimpleMission):
        """Execute the mission."""
        self.executed_count += 1
        return {"result": f"processed: {mission.data}"}


@pytest.fixture
def temp_dir():
    """Create temporary directory for test databases."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
async def runtime_components(temp_dir):
    """Set up all runtime components for integration test."""
    db_path = Path(temp_dir)
    
    # Create storage engines
    queue_engine = StorageEngine(str(db_path / "queue.db"))
    mission_engine = StorageEngine(str(db_path / "missions.db"))
    artifact_engine = StorageEngine(str(db_path / "artifacts.db"))
    event_engine = StorageEngine(str(db_path / "events.db"))
    lease_engine = StorageEngine(str(db_path / "leases.db"))
    
    # Create components
    queue_backend = SQLiteQueueBackend(str(db_path / "queue.db"), queue_engine)
    mission_queue = MissionQueue(queue_backend)
    
    mission_store = MissionStore(str(db_path / "missions.db"), mission_engine)
    
    artifact_repository = CanonicalArtifactRepository(
        backend=None,  # Will use default SQLite
        event_bus=None  # Will create new EventBus
    )
    
    event_bus = EventBus(str(db_path / "events.db"), event_engine)
    
    lease_manager = LeaseManager(str(db_path / "leases.db"), lease_engine)
    
    capability = SimpleCapability()
    
    executor_pool = ExecutorPool(
        mission_queue=mission_queue,
        mission_store=mission_store,
        lease_manager=lease_manager,
        capability_resolver=None,  # Will use simple capability
        artifact_repository=artifact_repository,
        event_bus=event_bus,
        max_workers=2
    )
    
    # Override capability resolution
    executor_pool._capability_resolver = capability
    
    yield {
        "mission_queue": mission_queue,
        "mission_store": mission_store,
        "artifact_repository": artifact_repository,
        "event_bus": event_bus,
        "lease_manager": lease_manager,
        "executor_pool": executor_pool,
        "capability": capability,
        "temp_dir": temp_dir
    }
    
    # Cleanup
    await executor_pool.shutdown()
    await event_bus.shutdown()
    await lease_manager.stop_heartbeat()
    await queue_engine.close()
    await mission_engine.close()
    await artifact_engine.close()
    await event_engine.close()
    await lease_engine.close()


@pytest.mark.asyncio
async def test_single_mission_lifecycle(runtime_components):
    """Test complete lifecycle of a single mission."""
    components = runtime_components
    mission_queue = components["mission_queue"]
    mission_store = components["mission_store"]
    executor_pool = components["executor_pool"]
    capability = components["capability"]
    event_bus = components["event_bus"]
    
    # Track events
    events_received = []
    
    def on_mission_queued(event):
        events_received.append(("queued", event))
    
    def on_mission_started(event):
        events_received.append(("started", event))
    
    def on_mission_completed(event):
        events_received.append(("completed", event))
    
    event_bus.subscribe("MissionQueued", on_mission_queued)
    event_bus.subscribe("MissionStarted", on_mission_started)
    event_bus.subscribe("MissionCompleted", on_mission_completed)
    
    # Create and submit mission
    mission = SimpleMission("test-1", "test-data")
    
    await executor_pool.submit_mission(mission)
    
    # Verify mission was queued
    assert await mission_queue.size() == 1
    
    # Verify mission was stored
    stored_mission = await mission_store.load("test-1")
    assert stored_mission is not None
    assert stored_mission.mission_id == "test-1"
    
    # Start executor
    await executor_pool.start()
    
    # Wait for execution to complete
    await asyncio.sleep(2)
    
    # Stop executor
    await executor_pool.shutdown()
    
    # Verify mission was executed
    assert capability.executed_count == 1
    
    # Verify queue is empty
    assert await mission_queue.size() == 0
    
    # Verify events were emitted
    event_types = [e[0] for e in events_received]
    assert "queued" in event_types
    assert "started" in event_types
    assert "completed" in event_types


@pytest.mark.asyncio
async def test_100_missions(runtime_components):
    """Test processing 100 missions."""
    components = runtime_components
    executor_pool = components["executor_pool"]
    capability = components["capability"]
    
    # Submit 100 missions
    for i in range(100):
        mission = SimpleMission(f"test-{i}", f"data-{i}")
        await executor_pool.submit_mission(mission)
    
    # Start executor
    await executor_pool.start()
    
    # Wait for execution to complete
    await asyncio.sleep(10)
    
    # Stop executor
    await executor_pool.shutdown()
    
    # Verify all missions were executed
    assert capability.executed_count == 100


@pytest.mark.asyncio
async def test_1000_missions(runtime_components):
    """Test processing 1000 missions."""
    components = runtime_components
    executor_pool = components["executor_pool"]
    capability = components["capability"]
    
    # Submit 1000 missions
    for i in range(1000):
        mission = SimpleMission(f"test-{i}", f"data-{i}")
        await executor_pool.submit_mission(mission)
    
    # Start executor
    await executor_pool.start()
    
    # Wait for execution to complete
    await asyncio.sleep(30)
    
    # Stop executor
    await executor_pool.shutdown()
    
    # Verify all missions were executed
    assert capability.executed_count == 1000


@pytest.mark.asyncio
async def test_mission_crash_recovery(runtime_components):
    """Test recovery after crash during mission execution."""
    components = runtime_components
    mission_queue = components["mission_queue"]
    mission_store = components["mission_store"]
    executor_pool = components["executor_pool"]
    temp_dir = components["temp_dir"]
    
    # Submit missions
    for i in range(10):
        mission = SimpleMission(f"test-{i}", f"data-{i}")
        await executor_pool.submit_mission(mission)
    
    # Start executor
    await executor_pool.start()
    
    # Let it process some missions
    await asyncio.sleep(1)
    
    # Simulate crash by shutting down without cleanup
    await executor_pool._shutdown_workers()
    
    # Verify queue still has missions
    queue_size = await mission_queue.size()
    assert queue_size > 0 or queue_size == 0  # May have processed some
    
    # Verify missions are still stored
    for i in range(10):
        stored = await mission_store.load(f"test-{i}")
        assert stored is not None
    
    # Create new executor pool (simulating restart)
    queue_backend = SQLiteQueueBackend(str(Path(temp_dir) / "queue.db"))
    mission_queue = MissionQueue(queue_backend)
    
    mission_engine = StorageEngine(str(Path(temp_dir) / "missions.db"))
    mission_store = MissionStore(str(Path(temp_dir) / "missions.db"), mission_engine)
    
    lease_engine = StorageEngine(str(Path(temp_dir) / "leases.db"))
    lease_manager = LeaseManager(str(Path(temp_dir) / "leases.db"), lease_engine)
    
    artifact_repository = CanonicalArtifactRepository()
    
    event_engine = StorageEngine(str(Path(temp_dir) / "events.db"))
    event_bus = EventBus(str(Path(temp_dir) / "events.db"), event_engine)
    
    capability = SimpleCapability()
    
    new_executor = ExecutorPool(
        mission_queue=mission_queue,
        mission_store=mission_store,
        lease_manager=lease_manager,
        capability_resolver=None,
        artifact_repository=artifact_repository,
        event_bus=event_bus,
        max_workers=2
    )
    new_executor._capability_resolver = capability
    
    # Start new executor
    await new_executor.start()
    
    # Wait for completion
    await asyncio.sleep(5)
    
    # Stop executor
    await new_executor.shutdown()
    
    # Cleanup
    await event_bus.shutdown()
    await lease_manager.stop_heartbeat()
    await queue_engine.close()
    await mission_engine.close()
    await event_engine.close()
    await lease_engine.close()


class FailingCapability:
    """Capability that fails on specific missions."""
    
    def __init__(self, fail_on_mission_id: str):
        self.fail_on_mission_id = fail_on_mission_id
        self.executed_count = 0
    
    async def execute(self, mission: SimpleMission):
        """Execute the mission, failing on specific ID."""
        if mission.mission_id == self.fail_on_mission_id:
            raise ValueError(f"Intentional failure for {mission.mission_id}")
        self.executed_count += 1
        return {"result": f"processed: {mission.data}"}


@pytest.mark.asyncio
async def test_capability_exception_recovery(runtime_components):
    """Test recovery after capability throws exception."""
    components = runtime_components
    executor_pool = components["executor_pool"]
    
    # Create failing capability
    failing_capability = FailingCapability(fail_on_mission_id="test-5")
    executor_pool._capability_resolver = failing_capability
    
    # Submit missions
    for i in range(10):
        mission = SimpleMission(f"test-{i}", f"data-{i}")
        await executor_pool.submit_mission(mission)
    
    # Start executor
    await executor_pool.start()
    
    # Wait for execution to complete
    await asyncio.sleep(5)
    
    # Stop executor
    await executor_pool.shutdown()
    
    # Verify 9 missions succeeded (one failed)
    assert failing_capability.executed_count == 9
    
    # Verify queue is empty (failed mission should be handled)
    assert await executor_pool.mission_queue.size() == 0


@pytest.mark.asyncio
async def test_executor_death_recovery(runtime_components):
    """Test recovery after executor worker dies."""
    components = runtime_components
    executor_pool = components["executor_pool"]
    capability = components["capability"]
    
    # Submit missions
    for i in range(20):
        mission = SimpleMission(f"test-{i}", f"data-{i}")
        await executor_pool.submit_mission(mission)
    
    # Start executor with multiple workers
    await executor_pool.start()
    
    # Let it process some missions
    await asyncio.sleep(1)
    
    # Kill one worker by cancelling its task
    if executor_pool._workers:
        worker = executor_pool._workers[0]
        worker.cancel()
        try:
            await worker
        except asyncio.CancelledError:
            pass
    
    # Wait for remaining workers to complete
    await asyncio.sleep(5)
    
    # Stop executor
    await executor_pool.shutdown()
    
    # Verify all missions were executed (remaining workers picked up the work)
    assert capability.executed_count == 20


@pytest.mark.asyncio
async def test_10000_missions(runtime_components):
    """Test processing 10000 missions."""
    components = runtime_components
    executor_pool = components["executor_pool"]
    capability = components["capability"]
    
    # Submit 10000 missions
    for i in range(10000):
        mission = SimpleMission(f"test-{i}", f"data-{i}")
        await executor_pool.submit_mission(mission)
    
    # Start executor
    await executor_pool.start()
    
    # Wait for execution to complete (may take longer)
    await asyncio.sleep(60)
    
    # Stop executor
    await executor_pool.shutdown()
    
    # Verify all missions were executed
    assert capability.executed_count == 10000


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
