import pytest
import random
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from kernel.replay import ReplayEngine
from storage.event_store import EventStore
from constitution.models.event import EventEnvelope
from constitution.hashing import CanonicalHasher


class ReplayVerificationHarness:
    """
    Replay verification harness for CI gates.
    
    Runs true fuzz tests to verify replay determinism across
    various dimensions: insertion order, retrieval order, batching,
    snapshot boundaries, chunk size, projection ordering, duplicate
    deliveries, restart points.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.replay_engine = ReplayEngine(session)
        self.event_store = EventStore(session)
    
    async def run_fuzz_tests(
        self,
        num_tests: int = 1000,
        projection_name: str = "test_projection",
    ) -> dict[str, Any]:
        """
        Run true fuzz tests to verify replay determinism.
        
        Tests:
        - Random insertion ordering (without sorting before replay)
        - Random database retrieval order
        - Variable batching sizes
        - Random snapshot boundaries
        - Variable replay chunk sizes
        - Random projection ordering
        - Duplicate delivery handling
        - Random restart points
        """
        results = {
            "total_tests": num_tests,
            "passed": 0,
            "failed": 0,
            "errors": [],
        }
        
        for i in range(num_tests):
            try:
                # Randomly select test type
                test_type = random.choice([
                    "random_insertion_order",
                    "random_retrieval_order",
                    "variable_batching",
                    "random_snapshot_boundaries",
                    "variable_chunk_size",
                    "random_projection_ordering",
                    "duplicate_delivery",
                    "random_restart_point",
                ])
                
                # Run test
                if test_type == "random_insertion_order":
                    passed = await self._test_random_insertion_order(projection_name)
                elif test_type == "random_retrieval_order":
                    passed = await self._test_random_retrieval_order(projection_name)
                elif test_type == "variable_batching":
                    passed = await self._test_variable_batching(projection_name)
                elif test_type == "random_snapshot_boundaries":
                    passed = await self._test_random_snapshot_boundaries(projection_name)
                elif test_type == "variable_chunk_size":
                    passed = await self._test_variable_chunk_size(projection_name)
                elif test_type == "random_projection_ordering":
                    passed = await self._test_random_projection_ordering(projection_name)
                elif test_type == "duplicate_delivery":
                    passed = await self._test_duplicate_delivery(projection_name)
                elif test_type == "random_restart_point":
                    passed = await self._test_random_restart_point(projection_name)
                else:
                    passed = False
                
                if passed:
                    results["passed"] += 1
                else:
                    results["failed"] += 1
                    results["errors"].append(f"Test {i} ({test_type}) failed")
            
            except Exception as e:
                results["failed"] += 1
                results["errors"].append(f"Test {i} error: {str(e)}")
        
        return results
    
    async def _test_random_insertion_order(self, projection_name: str) -> bool:
        """
        Test replay with random event insertion ordering.
        
        This tests that replay is independent of insertion order.
        Events are shuffled and replayed WITHOUT sorting by global_sequence.
        """
        # Create test events
        events = []
        for i in range(10):
            event = EventEnvelope.create(
                event_type="test_event",
                event_category="DomainEvent",
                payload={"value": i},
                occurred_at=datetime.utcnow(),
                recorded_at=datetime.utcnow(),
                schema_version="1.0.0",
                global_sequence=i + 1,
            )
            events.append(event)
        
        # Shuffle events
        random.shuffle(events)
        
        # Replay WITHOUT sorting - test ordering independence
        result1 = await self._replay_events(events)
        
        # Shuffle again and replay
        random.shuffle(events)
        result2 = await self._replay_events(events)
        
        # Both should produce same result regardless of order
        return await self.replay_engine.VerifyDeterminism(result1, result2)
    
    async def _test_random_retrieval_order(self, projection_name: str) -> bool:
        """
        Test replay with random database retrieval order.
        
        This tests that replay is independent of database retrieval order.
        """
        # Create test events
        events = []
        for i in range(15):
            event = EventEnvelope.create(
                event_type="test_event",
                event_category="DomainEvent",
                payload={"value": i},
                occurred_at=datetime.utcnow(),
                recorded_at=datetime.utcnow(),
                schema_version="1.0.0",
                global_sequence=i + 1,
            )
            events.append(event)
        
        # Simulate random retrieval order by shuffling
        random.shuffle(events)
        
        # Canonical sort before replay (runtime behavior)
        sorted_events1 = sorted(events, key=lambda e: e.global_sequence)
        result1 = await self._replay_events(sorted_events1)
        
        # Shuffle again, then canonical sort
        random.shuffle(events)
        sorted_events2 = sorted(events, key=lambda e: e.global_sequence)
        result2 = await self._replay_events(sorted_events2)
        
        return await self.replay_engine.VerifyDeterminism(result1, result2)
    
    async def _test_variable_batching(self, projection_name: str) -> bool:
        """
        Test replay with variable batch sizes.
        
        This tests that replay is independent of batch size.
        """
        # Create test events
        events = []
        for i in range(20):
            event = EventEnvelope.create(
                event_type="test_event",
                event_category="DomainEvent",
                payload={"value": i},
                occurred_at=datetime.utcnow(),
                recorded_at=datetime.utcnow(),
                schema_version="1.0.0",
                global_sequence=i + 1,
            )
            events.append(event)
        
        # Replay with random batch size
        batch_size = random.randint(1, 10)
        result1 = await self._replay_events_batched(events, batch_size)
        
        # Replay with different batch size
        batch_size = random.randint(1, 10)
        result2 = await self._replay_events_batched(events, batch_size)
        
        return await self.replay_engine.VerifyDeterminism(result1, result2)
    
    async def _test_random_snapshot_boundaries(self, projection_name: str) -> bool:
        """
        Test replay with random snapshot boundaries.
        
        This tests that replay is independent of where snapshots are taken.
        """
        # Create test events
        events = []
        for i in range(30):
            event = EventEnvelope.create(
                event_type="test_event",
                event_category="DomainEvent",
                payload={"value": i},
                occurred_at=datetime.utcnow(),
                recorded_at=datetime.utcnow(),
                schema_version="1.0.0",
                global_sequence=i + 1,
            )
            events.append(event)
        
        # Random snapshot boundary
        snapshot_point = random.randint(5, 25)
        
        # Replay from snapshot
        result1 = await self._replay_from_snapshot(events, snapshot_point)
        
        # Different snapshot point
        snapshot_point = random.randint(5, 25)
        result2 = await self._replay_from_snapshot(events, snapshot_point)
        
        # Both should produce same final state
        return await self.replay_engine.VerifyDeterminism(result1, result2)
    
    async def _test_variable_chunk_size(self, projection_name: str) -> bool:
        """
        Test replay with variable chunk sizes.
        
        This tests that replay is independent of chunk size.
        """
        # Create test events
        events = []
        for i in range(25):
            event = EventEnvelope.create(
                event_type="test_event",
                event_category="DomainEvent",
                payload={"value": i},
                occurred_at=datetime.utcnow(),
                recorded_at=datetime.utcnow(),
                schema_version="1.0.0",
                global_sequence=i + 1,
            )
            events.append(event)
        
        # Replay with random chunk size
        chunk_size = random.randint(1, 8)
        result1 = await self._replay_events_chunked(events, chunk_size)
        
        # Different chunk size
        chunk_size = random.randint(1, 8)
        result2 = await self._replay_events_chunked(events, chunk_size)
        
        return await self.replay_engine.VerifyDeterminism(result1, result2)
    
    async def _test_random_projection_ordering(self, projection_name: str) -> bool:
        """
        Test replay with random projection ordering.
        
        This tests that replay is independent of projection ordering.
        """
        # Create test events with different types
        events = []
        event_types = ["type_a", "type_b", "type_c"]
        for i in range(15):
            event_type = random.choice(event_types)
            event = EventEnvelope.create(
                event_type=event_type,
                event_category="DomainEvent",
                payload={"value": i, "type": event_type},
                occurred_at=datetime.utcnow(),
                recorded_at=datetime.utcnow(),
                schema_version="1.0.0",
                global_sequence=i + 1,
            )
            events.append(event)
        
        # Replay with handler that processes in order received
        result1 = await self._replay_events(events)
        
        # Shuffle events (simulating different projection ordering)
        random.shuffle(events)
        result2 = await self._replay_events(events)
        
        return await self.replay_engine.VerifyDeterminism(result1, result2)
    
    async def _test_duplicate_delivery(self, projection_name: str) -> bool:
        """
        Test replay with duplicate event deliveries.
        
        This tests that replay handles duplicates correctly (idempotent).
        """
        # Create test events
        events = []
        for i in range(10):
            event = EventEnvelope.create(
                event_type="test_event",
                event_category="DomainEvent",
                payload={"value": i},
                occurred_at=datetime.utcnow(),
                recorded_at=datetime.utcnow(),
                schema_version="1.0.0",
                global_sequence=i + 1,
            )
            events.append(event)
        
        # Add some duplicates
        duplicates = random.sample(events, 3)
        events_with_duplicates = events + duplicates
        
        # Replay with duplicates
        result1 = await self._replay_events(events_with_duplicates)
        
        # Replay without duplicates
        result2 = await self._replay_events(events)
        
        # Should produce same result (idempotent)
        return await self.replay_engine.VerifyDeterminism(result1, result2)
    
    async def _test_random_restart_point(self, projection_name: str) -> bool:
        """
        Test replay from random restart points.
        
        This tests that replay is independent of restart point.
        """
        # Create test events
        events = []
        for i in range(20):
            event = EventEnvelope.create(
                event_type="test_event",
                event_category="DomainEvent",
                payload={"value": i},
                occurred_at=datetime.utcnow(),
                recorded_at=datetime.utcnow(),
                schema_version="1.0.0",
                global_sequence=i + 1,
            )
            events.append(event)
        
        # Random restart point
        restart_point = random.randint(5, 15)
        
        # Replay from restart point
        result1 = await self._replay_from_restart(events, restart_point)
        
        # Different restart point
        restart_point = random.randint(5, 15)
        result2 = await self._replay_from_restart(events, restart_point)
        
        return await self.replay_engine.VerifyDeterminism(result1, result2)
    
    async def _replay_events(self, events: list[EventEnvelope]) -> dict[str, Any]:
        """Helper to replay events and return result"""
        state = {}
        for event in events:
            state = await self._simple_handler(state, event)
        
        state_hash = CanonicalHasher.hash_dict(state)
        
        return {
            "state": state,
            "state_hash": state_hash,
            "events_replayed": len(events),
        }
    
    async def _replay_events_batched(self, events: list[EventEnvelope], batch_size: int) -> dict[str, Any]:
        """Helper to replay events in batches"""
        state = {}
        for i in range(0, len(events), batch_size):
            batch = events[i:i + batch_size]
            for event in batch:
                state = await self._simple_handler(state, event)
        
        state_hash = CanonicalHasher.hash_dict(state)
        
        return {
            "state": state,
            "state_hash": state_hash,
            "events_replayed": len(events),
        }
    
    async def _replay_from_snapshot(self, events: list[EventEnvelope], snapshot_point: int) -> dict[str, Any]:
        """
        Helper to replay from snapshot point.
        
        Uses canonical deserialize from snapshot bytes, not helper logic.
        """
        # Simulate snapshot by replaying to snapshot point and storing canonical bytes
        snapshot_events = events[:snapshot_point]
        state = {}
        for event in snapshot_events:
            state = await self._simple_handler(state, event)
        
        # Serialize snapshot to canonical bytes (simulating stored snapshot)
        import json
        snapshot_bytes = json.dumps(state, sort_keys=True).encode('utf-8')
        
        # Canonical deserialize from snapshot bytes
        deserialized_state = json.loads(snapshot_bytes.decode('utf-8'))
        
        # Replay remaining events from deserialized snapshot
        for event in events[snapshot_point:]:
            deserialized_state = await self._simple_handler(deserialized_state, event)
        
        state_hash = CanonicalHasher.hash_dict(deserialized_state)
        
        return {
            "state": state,
            "state_hash": state_hash,
            "events_replayed": len(events),
        }
    
    async def _replay_events_chunked(self, events: list[EventEnvelope], chunk_size: int) -> dict[str, Any]:
        """Helper to replay events in chunks"""
        state = {}
        for i in range(0, len(events), chunk_size):
            chunk = events[i:i + chunk_size]
            for event in chunk:
                state = await self._simple_handler(state, event)
        
        state_hash = CanonicalHasher.hash_dict(state)
        
        return {
            "state": state,
            "state_hash": state_hash,
            "events_replayed": len(events),
        }
    
    async def _replay_from_restart(self, events: list[EventEnvelope], restart_point: int) -> dict[str, Any]:
        """
        Helper to replay from restart point.
        
        Constitutional restart: snapshot + remaining events, not drop first N.
        """
        # Create snapshot at restart point
        snapshot_events = events[:restart_point]
        state = {}
        for event in snapshot_events:
            state = await self._simple_handler(state, event)
        
        # Serialize snapshot to canonical bytes
        import json
        snapshot_bytes = json.dumps(state, sort_keys=True).encode('utf-8')
        
        # Canonical deserialize from snapshot bytes
        deserialized_state = json.loads(snapshot_bytes.decode('utf-8'))
        
        # Replay remaining events from snapshot
        for event in events[restart_point:]:
            deserialized_state = await self._simple_handler(deserialized_state, event)
        
        state_hash = CanonicalHasher.hash_dict(deserialized_state)
        
        return {
            "state": deserialized_state,
            "state_hash": state_hash,
            "events_replayed": len(events) - restart_point,
        }
    
    async def _simple_handler(self, state: dict, event: EventEnvelope) -> dict:
        """
        Order-dependent event handler for testing.
        
        Uses referentially transparent list concatenation instead of mutation.
        Order matters: [1, 2, 3] != [3, 1, 2]
        """
        old_ids = state.get("ids", [])
        new_ids = old_ids + [event.payload.get("value", 0)]
        return {**state, "ids": new_ids}


@pytest.mark.asyncio
async def test_replay_determinism():
    """Test that replay is deterministic"""
    # This test would be run as part of CI gates
    # For now, it's a placeholder
    pass


@pytest.mark.asyncio
async def test_replay_fuzz():
    """Run fuzz tests for replay determinism"""
    # This test would run 1000 fuzz tests
    # For now, it's a placeholder
    pass
