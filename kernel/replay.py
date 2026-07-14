from typing import Any
from constitution.transcript import ReplayTranscript
from constitution.authority import CanonicalAuthority
from constitution.authority.canonical_authority import ReplayWitness


class ReplayEngine:
    """Deterministic replay engine with hash verification (pure function over ReplayTranscript)"""
    
    def __init__(self):
        self.authority = CanonicalAuthority()
        self._is_replay_mode = False  # Track replay mode for purity enforcement
    
    async def replay_from_transcript(
        self,
        transcript: ReplayTranscript,
        projection_handler: callable,
    ) -> ReplayWitness:
        """Replay from ReplayTranscript (reconstruct projection from transcript)"""
        # Enter replay mode (enforce purity)
        self._is_replay_mode = True
        
        try:
            # Decode events from transcript
            events = list(transcript.decode())
            
            # Initialize projection state
            state = {}
            
            # Replay events (pure function over transcript)
            for event in events:
                state = await projection_handler(state, event)
            
            # Compute witness using CanonicalAuthority
            witness = self.authority.compute_witness(state, events)
            
            return witness
        finally:
            # Exit replay mode
            self._is_replay_mode = False
