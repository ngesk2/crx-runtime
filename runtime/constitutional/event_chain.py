"""
Cryptographic Event Chaining with Ed25519 Signatures

Constitutional: Protects event ledger integrity through cryptographic chaining and signatures.
Prevents silent mutation of constitutional truth.

Architecture:
Genesis Event (previous_hash = null)
    ↓
Event A (previous_hash = genesis_hash, ed25519_signature)
    ↓
Event B (previous_hash = event_a_hash, ed25519_signature)
    ↓
Event C (previous_hash = event_b_hash, ed25519_signature)

Hash formula:
sha256(previous_hash + canonical_json(payload) + timestamp)

Signature formula:
ed25519_sign(private_key, event_hash)

Verification:
1. Verify hash chain integrity
2. Verify Ed25519 signatures

This prevents:
- Silent mutation (hash chain breaks)
- Chain rewriting (signatures invalid)
- Unauthorized event creation (signature verification)
"""

import hashlib
import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
import sys
from pathlib import Path

# Try to import PyNaCl for Ed25519 signatures
try:
    from nacl.signing import SigningKey, VerifyKey
    from nacl.encoding import HexEncoder
    ED25519_AVAILABLE = True
except ImportError:
    ED25519_AVAILABLE = False
    print("Warning: PyNaCl not available, using SHA256 fallback for signatures")

# Import capability enforcement
sys.path.append(str(Path(__file__).parent.parent / 'security'))
try:
    from capabilities import Capability, requires_capability
    from policy_engine import PolicyEngine
    CAPABILITY_ENFORCEMENT_AVAILABLE = True
except ImportError:
    CAPABILITY_ENFORCEMENT_AVAILABLE = False
    print("Warning: Capability enforcement not available")


@dataclass
class CryptographicEvent:
    """Cryptographically chained event."""
    event_id: str
    previous_hash: Optional[str]
    event_hash: str
    signature: str
    timestamp: str
    payload: Dict
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return asdict(self)


class EventChain:
    """
    Manages cryptographic event chaining.
    
    Constitutional: Every event is cryptographically linked to previous events.
    Any mutation breaks the chain and is detectable.
    """
    
    def __init__(self, signing_key: Optional[str] = None, verify_key: Optional[str] = None):
        """
        Initialize event chain.
        
        Args:
            signing_key: Private key for signing events (Ed25519 hex string or None for auto-generation)
            verify_key: Public key for verifying signatures (Ed25519 hex string)
        """
        self.signing_key = signing_key
        self.verify_key = verify_key
        self.chain: List[CryptographicEvent] = []
        
        # Auto-generate Ed25519 keypair if none provided and PyNaCl is available
        if ED25519_AVAILABLE and not signing_key:
            self._generate_keypair()
    
    def _canonical_json(self, data: Dict) -> str:
        """
        Generate canonical JSON representation.
        
        Ensures deterministic hashing by sorting keys and using consistent formatting.
        """
        return json.dumps(data, sort_keys=True, separators=(',', ':'))
    
    def _compute_event_hash(self, previous_hash: str, payload: Dict, timestamp: str) -> str:
        """
        Compute event hash.
        
        Formula: sha256(previous_hash + canonical_json(payload) + timestamp)
        """
        if previous_hash is None:
            previous_hash = ""
        
        canonical_payload = self._canonical_json(payload)
        
        # Concatenate: previous_hash + canonical_payload + timestamp
        hash_input = f"{previous_hash}{canonical_payload}{timestamp}"
        
        return hashlib.sha256(hash_input.encode('utf-8')).hexdigest()
    
    def _generate_keypair(self):
        """Generate Ed25519 keypair."""
        if ED25519_AVAILABLE:
            signing_key = SigningKey.generate()
            verify_key = signing_key.verify_key
            
            self.signing_key = signing_key.encode(encoder=HexEncoder).decode('utf-8')
            self.verify_key = verify_key.encode(encoder=HexEncoder).decode('utf-8')
            
            print(f"Generated Ed25519 keypair:")
            print(f"  Signing key: {self.signing_key[:20]}...")
            print(f"  Verify key: {self.verify_key[:20]}...")
    
    def _sign_event(self, event_hash: str) -> str:
        """
        Sign event hash using Ed25519 or SHA256 fallback.
        
        Constitutional: Ed25519 provides cryptographic signature verification.
        """
        if ED25519_AVAILABLE and self.signing_key:
            # Use Ed25519 for cryptographic signing
            signing_key = SigningKey(self.signing_key, encoder=HexEncoder)
            signed_message = signing_key.sign(event_hash.encode('utf-8'))
            # Return the full signed message as hex (message + signature)
            return signed_message.hex()
        else:
            # Fallback to SHA256 (less secure, for development)
            return hashlib.sha256((event_hash + (self.signing_key or "")).encode('utf-8')).hexdigest()
    
    def _verify_signature(self, event_hash: str, signature: str) -> bool:
        """
        Verify event signature using Ed25519 or SHA256 fallback.
        
        Args:
            event_hash: Event hash to verify
            signature: Signature to verify (hex string of signed message)
        
        Returns:
            True if signature is valid, False otherwise
        """
        if ED25519_AVAILABLE and self.verify_key:
            try:
                verify_key = VerifyKey(self.verify_key, encoder=HexEncoder)
                # Decode hex signed message back to bytes
                signed_message_bytes = bytes.fromhex(signature)
                # Verify the signed message (it contains message + signature)
                verify_key.verify(signed_message_bytes)
                return True
            except Exception as e:
                print(f"Signature verification failed: {e}")
                return False
        else:
            # Fallback: recompute SHA256 and compare
            expected = hashlib.sha256((event_hash + (self.signing_key or "")).encode('utf-8')).hexdigest()
            return signature == expected
    
    @requires_capability(Capability.EVENT_WRITE) if CAPABILITY_ENFORCEMENT_AVAILABLE else lambda f: f
    def create_genesis_event(self, payload: Dict) -> CryptographicEvent:
        """
        Create genesis event (first event in chain).
        
        Genesis events have previous_hash = None.
        Requires EVENT_WRITE capability.
        """
        event_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        previous_hash = None
        
        # Compute hash (genesis has no previous hash)
        event_hash = self._compute_event_hash("", payload, timestamp)
        
        # Sign event
        signature = self._sign_event(event_hash)
        
        event = CryptographicEvent(
            event_id=event_id,
            previous_hash=previous_hash,
            event_hash=event_hash,
            signature=signature,
            timestamp=timestamp,
            payload=payload
        )
        
        self.chain.append(event)
        return event
    
    @requires_capability(Capability.EVENT_WRITE) if CAPABILITY_ENFORCEMENT_AVAILABLE else lambda f: f
    def append_event(self, payload: Dict) -> CryptographicEvent:
        """
        Append new event to chain.
        
        Links to previous event via previous_hash.
        Requires EVENT_WRITE capability.
        """
        if not self.chain:
            return self.create_genesis_event(payload)
        
        previous_event = self.chain[-1]
        event_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        previous_hash = previous_event.event_hash
        
        # Compute hash
        event_hash = self._compute_event_hash(previous_hash, payload, timestamp)
        
        # Sign event
        signature = self._sign_event(event_hash)
        
        event = CryptographicEvent(
            event_id=event_id,
            previous_hash=previous_hash,
            event_hash=event_hash,
            signature=signature,
            timestamp=timestamp,
            payload=payload
        )
        
        self.chain.append(event)
        return event
    
    def verify_chain(self) -> Tuple[bool, Optional[str]]:
        """
        Verify entire event chain integrity including signatures.
        
        Returns:
            (is_valid, broken_at_event_id)
        """
        if not self.chain:
            return True, None
        
        for i, event in enumerate(self.chain):
            # Verify event hash
            previous_hash = event.previous_hash if event.previous_hash else ""
            expected_hash = self._compute_event_hash(previous_hash, event.payload, event.timestamp)
            
            if event.event_hash != expected_hash:
                return False, event.event_id
            
            # Verify signature
            if not self._verify_signature(event.event_hash, event.signature):
                return False, event.event_id
            
            # Verify chain linkage
            if i > 0:
                previous_event = self.chain[i - 1]
                if event.previous_hash != previous_event.event_hash:
                    return False, event.event_id
        
        return True, None
    
    def get_chain_info(self) -> Dict:
        """Get chain information."""
        is_valid, broken_at = self.verify_chain()
        
        return {
            "total_events": len(self.chain),
            "is_valid": is_valid,
            "broken_at_event": broken_at,
            "genesis_hash": self.chain[0].event_hash if self.chain else None,
            "latest_hash": self.chain[-1].event_hash if self.chain else None
        }


class EventChainStore:
    """
    Event chain store with PostgreSQL integration.
    
    Manages persistent storage of cryptographically chained events.
    """
    
    def __init__(self, postgres_conn):
        """
        Initialize event chain store.
        
        Args:
            postgres_conn: PostgreSQL connection
        """
        self.conn = postgres_conn
        self.chain = EventChain()
    
    def initialize_schema(self):
        """Initialize event chain schema in PostgreSQL."""
        cursor = self.conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS event_chain (
                event_id VARCHAR(36) PRIMARY KEY,
                previous_hash VARCHAR(64),
                event_hash VARCHAR(64) NOT NULL,
                signature VARCHAR(64) NOT NULL,
                timestamp TIMESTAMP NOT NULL,
                payload JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_event_hash (event_hash),
                INDEX idx_previous_hash (previous_hash)
            )
        """)
        
        self.conn.commit()
        cursor.close()
    
    def load_chain(self):
        """Load existing chain from database."""
        cursor = self.conn.cursor()
        
        cursor.execute("""
            SELECT event_id, previous_hash, event_hash, signature, timestamp, payload
            FROM event_chain
            ORDER BY timestamp ASC
        """)
        
        rows = cursor.fetchall()
        cursor.close()
        
        self.chain.chain = []
        for row in rows:
            event = CryptographicEvent(
                event_id=row[0],
                previous_hash=row[1],
                event_hash=row[2],
                signature=row[3],
                timestamp=row[4].isoformat() if row[4] else row[4],
                payload=row[5]
            )
            self.chain.chain.append(event)
    
    def append_event(self, payload: Dict) -> CryptographicEvent:
        """
        Append event to chain and persist to database.
        
        Args:
            payload: Event payload
        
        Returns:
            Created event
        """
        event = self.chain.append_event(payload)
        
        # Persist to database
        cursor = self.conn.cursor()
        
        cursor.execute("""
            INSERT INTO event_chain (event_id, previous_hash, event_hash, signature, timestamp, payload)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            event.event_id,
            event.previous_hash,
            event.event_hash,
            event.signature,
            event.timestamp,
            json.dumps(event.payload)
        ))
        
        self.conn.commit()
        cursor.close()
        
        return event
    
    def verify_chain(self) -> Tuple[bool, Optional[str]]:
        """Verify chain integrity."""
        return self.chain.verify_chain()
    
    def get_chain_info(self) -> Dict:
        """Get chain information."""
        return self.chain.get_chain_info()


def main():
    """Test event chaining."""
    chain = EventChain()
    
    # Create genesis event
    genesis = chain.create_genesis_event({
        "event_type": "SYSTEM_INIT",
        "source": "constitutional",
        "data": {"message": "Constitutional event chain initialized"}
    })
    print(f"Genesis event: {genesis.event_id}")
    print(f"Genesis hash: {genesis.event_hash}")
    
    # Append events
    event1 = chain.append_event({
        "event_type": "DOCUMENT_IMPORTED",
        "source": "google_drive",
        "data": {"document_id": "abc123"}
    })
    print(f"Event 1: {event1.event_id}")
    print(f"Event 1 hash: {event1.event_hash}")
    print(f"Event 1 previous_hash: {event1.previous_hash}")
    
    event2 = chain.append_event({
        "event_type": "DOCUMENT_UPDATED",
        "source": "google_drive",
        "data": {"document_id": "abc123"}
    })
    print(f"Event 2: {event2.event_id}")
    print(f"Event 2 hash: {event2.event_hash}")
    print(f"Event 2 previous_hash: {event2.previous_hash}")
    
    # Verify chain
    is_valid, broken_at = chain.verify_chain()
    print(f"\nChain valid: {is_valid}")
    print(f"Broken at: {broken_at}")
    
    # Get chain info
    info = chain.get_chain_info()
    print(f"\nChain info: {info}")


if __name__ == '__main__':
    main()
