"""
Projection Integrity Verification

Constitutional: Verifies that projections (Qdrant embeddings) match source events.
Prevents projection workers from lying or corrupting memory.

Problem:
Truth is correct → Projection worker lies → Search returns wrong answer

Solution:
{
  projection_id: "...",
  source_event_id: "...",
  canonical_hash: "...",
  embedding_hash: "...",
  projection_signature: "...",
  generated_by_worker: "worker_001"
}

Verification:
Projection
      ↓
Verify source event
      ↓
Verify source hash
      ↓
Verify projection signature
      ↓
Accept retrieval
"""

import hashlib
import json
from typing import Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime

# Try to import PyNaCl for Ed25519 signatures
try:
    from nacl.signing import SigningKey, VerifyKey
    from nacl.encoding import HexEncoder
    ED25519_AVAILABLE = True
except ImportError:
    ED25519_AVAILABLE = False
    print("Warning: PyNaCl not available, using SHA256 fallback for signatures")


@dataclass
class ProjectionMetadata:
    """Projection metadata for integrity verification."""
    projection_id: str
    source_event_id: str
    canonical_hash: str
    embedding_hash: str
    projection_signature: str
    generated_by_worker: str
    generated_at: str
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            'projection_id': self.projection_id,
            'source_event_id': self.source_event_id,
            'canonical_hash': self.canonical_hash,
            'embedding_hash': self.embedding_hash,
            'projection_signature': self.projection_signature,
            'generated_by_worker': self.generated_by_worker,
            'generated_at': self.generated_at
        }


class ProjectionIntegrity:
    """
    Projection integrity verification.
    
    Constitutional: Ensures projections match source events.
    """
    
    def __init__(self, worker_signing_key: Optional[str] = None, worker_verify_key: Optional[str] = None):
        """
        Initialize projection integrity verifier.
        
        Args:
            worker_signing_key: Worker's private key for signing projections
            worker_verify_key: Worker's public key for verifying projections
        """
        self.worker_signing_key = worker_signing_key
        self.worker_verify_key = worker_verify_key
        
        # Auto-generate keypair if none provided
        if ED25519_AVAILABLE and not worker_signing_key:
            self._generate_worker_keypair()
    
    def _generate_worker_keypair(self):
        """Generate Ed25519 keypair for worker."""
        if ED25519_AVAILABLE:
            signing_key = SigningKey.generate()
            verify_key = signing_key.verify_key
            
            self.worker_signing_key = signing_key.encode(encoder=HexEncoder).decode('utf-8')
            self.worker_verify_key = verify_key.encode(encoder=HexEncoder).decode('utf-8')
            
            print(f"Generated worker Ed25519 keypair:")
            print(f"  Signing key: {self.worker_signing_key[:20]}...")
            print(f"  Verify key: {self.worker_verify_key[:20]}...")
    
    def _canonical_json(self, data: Dict) -> str:
        """Generate canonical JSON representation."""
        return json.dumps(data, sort_keys=True, separators=(',', ':'))
    
    def _compute_canonical_hash(self, event_data: Dict) -> str:
        """
        Compute canonical hash of event data.
        
        Args:
            event_data: Event data from source
        
        Returns:
            SHA256 hash
        """
        canonical = self._canonical_json(event_data)
        return hashlib.sha256(canonical.encode('utf-8')).hexdigest()
    
    def _compute_embedding_hash(self, embedding: list) -> str:
        """
        Compute hash of embedding vector.
        
        Args:
            embedding: Embedding vector
        
        Returns:
            SHA256 hash
        """
        # Convert embedding to canonical string
        embedding_str = json.dumps(embedding, separators=(',', ':'))
        return hashlib.sha256(embedding_str.encode('utf-8')).hexdigest()
    
    def _sign_projection(self, canonical_hash: str, embedding_hash: str) -> str:
        """
        Sign projection metadata.
        
        Args:
            canonical_hash: Hash of source event
            embedding_hash: Hash of embedding
        
        Returns:
            Signature (hex string)
        """
        if ED25519_AVAILABLE and self.worker_signing_key:
            signing_key = SigningKey(self.worker_signing_key, encoder=HexEncoder)
            # Sign concatenated hashes
            hash_input = f"{canonical_hash}{embedding_hash}"
            signed_message = signing_key.sign(hash_input.encode('utf-8'))
            return signed_message.hex()
        else:
            # Fallback to SHA256
            hash_input = f"{canonical_hash}{embedding_hash}{self.worker_signing_key or ''}"
            return hashlib.sha256(hash_input.encode('utf-8')).hexdigest()
    
    def _verify_projection_signature(self, canonical_hash: str, embedding_hash: str, signature: str) -> bool:
        """
        Verify projection signature.
        
        Args:
            canonical_hash: Hash of source event
            embedding_hash: Hash of embedding
            signature: Signature to verify
        
        Returns:
            True if valid, False otherwise
        """
        if ED25519_AVAILABLE and self.worker_verify_key:
            try:
                verify_key = VerifyKey(self.worker_verify_key, encoder=HexEncoder)
                hash_input = f"{canonical_hash}{embedding_hash}"
                signed_message_bytes = bytes.fromhex(signature)
                verify_key.verify(signed_message_bytes)
                return True
            except Exception as e:
                print(f"Projection signature verification failed: {e}")
                return False
        else:
            # Fallback to SHA256
            hash_input = f"{canonical_hash}{embedding_hash}{self.worker_signing_key or ''}"
            expected = hashlib.sha256(hash_input.encode('utf-8')).hexdigest()
            return signature == expected
    
    def create_projection_metadata(
        self,
        projection_id: str,
        source_event_id: str,
        event_data: Dict,
        embedding: list,
        worker_id: str
    ) -> ProjectionMetadata:
        """
        Create projection metadata with integrity verification.
        
        Args:
            projection_id: Projection identifier
            source_event_id: Source event identifier
            event_data: Event data from source
            embedding: Embedding vector
            worker_id: Worker identifier
        
        Returns:
            ProjectionMetadata object
        """
        # Compute hashes
        canonical_hash = self._compute_canonical_hash(event_data)
        embedding_hash = self._compute_embedding_hash(embedding)
        
        # Sign projection
        projection_signature = self._sign_projection(canonical_hash, embedding_hash)
        
        metadata = ProjectionMetadata(
            projection_id=projection_id,
            source_event_id=source_event_id,
            canonical_hash=canonical_hash,
            embedding_hash=embedding_hash,
            projection_signature=projection_signature,
            generated_by_worker=worker_id,
            generated_at=datetime.utcnow().isoformat()
        )
        
        return metadata
    
    def verify_projection(
        self,
        projection_metadata: ProjectionMetadata,
        event_data: Dict,
        embedding: list
    ) -> Tuple[bool, str]:
        """
        Verify projection integrity.
        
        Args:
            projection_metadata: Projection metadata
            event_data: Event data from source
            embedding: Embedding vector
        
        Returns:
            (is_valid, reason)
        """
        # Verify canonical hash
        expected_canonical_hash = self._compute_canonical_hash(event_data)
        if projection_metadata.canonical_hash != expected_canonical_hash:
            return False, f"Canonical hash mismatch: expected {expected_canonical_hash}, got {projection_metadata.canonical_hash}"
        
        # Verify embedding hash
        expected_embedding_hash = self._compute_embedding_hash(embedding)
        if projection_metadata.embedding_hash != expected_embedding_hash:
            return False, f"Embedding hash mismatch: expected {expected_embedding_hash}, got {projection_metadata.embedding_hash}"
        
        # Verify signature
        if not self._verify_projection_signature(
            projection_metadata.canonical_hash,
            projection_metadata.embedding_hash,
            projection_metadata.projection_signature
        ):
            return False, "Projection signature verification failed"
        
        return True, "Projection verified successfully"


def main():
    """Test projection integrity."""
    print("Testing Projection Integrity Verification")
    
    integrity = ProjectionIntegrity()
    
    # Create test projection
    projection_id = "proj_001"
    source_event_id = "event_001"
    event_data = {
        "event_type": "DOCUMENT_IMPORTED",
        "source": "google_drive",
        "title": "Test Document"
    }
    embedding = [0.1, 0.2, 0.3, 0.4, 0.5]
    worker_id = "worker_001"
    
    metadata = integrity.create_projection_metadata(
        projection_id,
        source_event_id,
        event_data,
        embedding,
        worker_id
    )
    
    print(f"\nCreated projection metadata:")
    print(f"  Projection ID: {metadata.projection_id}")
    print(f"  Source Event ID: {metadata.source_event_id}")
    print(f"  Canonical Hash: {metadata.canonical_hash}")
    print(f"  Embedding Hash: {metadata.embedding_hash}")
    print(f"  Signature: {metadata.projection_signature[:50]}...")
    print(f"  Worker: {metadata.generated_by_worker}")
    
    # Verify projection
    is_valid, reason = integrity.verify_projection(metadata, event_data, embedding)
    print(f"\nVerification result: {is_valid}")
    print(f"Reason: {reason}")
    
    # Test tampering
    tampered_embedding = [0.9, 0.8, 0.7, 0.6, 0.5]
    is_valid, reason = integrity.verify_projection(metadata, event_data, tampered_embedding)
    print(f"\nTampered embedding verification: {is_valid}")
    print(f"Reason: {reason}")


if __name__ == '__main__':
    main()
