"""
Replay Transcript

Constitutional transcript object.
Replay executes over ReplayTranscript, not merely list<EventEnvelope>.
The transcript is the source of truth; events are decoded views.
"""

from dataclasses import dataclass
from typing import Any, Iterator
from constitution.models.event import EventEnvelope
from constitution.value_objects import ReplayId, TranscriptHash, SequenceNumber, AuthorityVersion
from constitution.authority import CanonicalAuthority


@dataclass(frozen=True)
class ReplayTranscript:
    """
    Constitutional replay transcript.
    
    Replay executes over ReplayTranscript, not merely list<EventEnvelope>.
    The transcript is the source of truth; events are decoded views.
    """
    replay_id: ReplayId
    transcript_hash: TranscriptHash
    authority_version: AuthorityVersion
    encoded_events: bytes  # Encoded transcript data
    event_count: SequenceNumber
    from_sequence: SequenceNumber
    to_sequence: SequenceNumber
    aggregate_ids: list[str]
    event_types: list[str]
    metadata: dict[str, Any]
    
    def __post_init__(self):
        # Verify event count matches
        if self.event_count.value <= 0:
            raise ValueError(f"Event count must be positive: {self.event_count.value}")
    
    def decode(self) -> Iterator[EventEnvelope]:
        """
        Decode events from transcript.
        
        Events are decoded views; the transcript is the source of truth.
        """
        authority = CanonicalAuthority()
        event_dicts = authority.decode(self.encoded_events)
        
        # Verify events are in sequence order
        sequences = [event_dict['global_sequence'] for event_dict in event_dicts]
        if sequences != sorted(sequences):
            raise ValueError("Events not in global sequence order")
        
        for event_dict in event_dicts:
            yield EventEnvelope(**event_dict)
    
    @classmethod
    def create(
        cls,
        events: list[EventEnvelope],
        authority_version: str = "1.0.0",
        from_sequence: int = 0,
        to_sequence: int | None = None,
        metadata: dict[str, Any] = None,
    ) -> "ReplayTranscript":
        """Create replay transcript from events."""
        authority = CanonicalAuthority()
        
        # Encode events as transcript data
        event_dicts = [event.model_dump(mode='json') for event in events]
        encoded_events = authority.encode(event_dicts).value
        
        # Generate replay ID
        replay_id = ReplayId(value=authority.hash_dict({
            'event_count': len(events),
            'from_sequence': from_sequence,
            'to_sequence': to_sequence,
        }))
        
        # Compute transcript hash
        transcript_data = {
            'event_ids': [event.event_id for event in events],
            'event_count': len(events),
            'from_sequence': from_sequence,
            'to_sequence': to_sequence,
        }
        transcript_hash = TranscriptHash(value=authority.hash_dict(transcript_data))
        
        # Extract aggregate IDs
        aggregate_ids = list(set(
            event.causality_id for event in events if event.causality_id
        ))
        
        # Extract event types
        event_types = list(set(event.event_type for event in events))
        
        # Determine to_sequence
        if to_sequence is None and events:
            to_sequence = events[-1].global_sequence
        elif to_sequence is None:
            to_sequence = from_sequence
        
        return cls(
            replay_id=replay_id,
            transcript_hash=transcript_hash,
            authority_version=AuthorityVersion(value=authority_version),
            encoded_events=encoded_events,
            event_count=SequenceNumber(value=len(events)),
            from_sequence=SequenceNumber(value=from_sequence),
            to_sequence=SequenceNumber(value=to_sequence),
            aggregate_ids=aggregate_ids,
            event_types=event_types,
            metadata=metadata or {},
        )
