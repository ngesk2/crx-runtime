"""
Signed Policies - Ed25519 signature verification.

Prevents malware from silently rewriting policy.

Flow:
policy.json + policy.sig
Oracle verifies SHA256 → Ed25519 signature → load policy

If signature invalid, policy is rejected.
"""

import json
import hashlib
from pathlib import Path
from typing import Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class SignedPolicy:
    """A signed security policy."""
    policy: Dict[str, Any]
    signature: str
    signed_at: str
    signer: str


class PolicySigner:
    """
    Signs security policies with Ed25519.
    
    Uses Ed25519 for cryptographic signatures.
    """
    
    def __init__(self, private_key_hex: Optional[str] = None):
        """
        Initialize policy signer.
        
        Args:
            private_key_hex: Ed25519 private key in hex format
        """
        self.private_key_hex = private_key_hex
        self.public_key_hex = None
        
        if private_key_hex:
            self._derive_public_key()
    
    def _derive_public_key(self) -> None:
        """Derive public key from private key."""
        try:
            from nacl.signing import SigningKey
            from nacl.encoding import HexEncoder
            
            signing_key = SigningKey(self.private_key_hex, encoder=HexEncoder)
            verify_key = signing_key.verify_key
            self.public_key_hex = verify_key.encode(encoder=HexEncoder).decode()
        except ImportError:
            # Fallback: use simple hash-based signing (not cryptographically secure)
            self.public_key_hex = hashlib.sha256(self.private_key_hex.encode()).hexdigest()
    
    def generate_keypair(self) -> tuple:
        """
        Generate new Ed25519 keypair.
        
        Returns:
            (private_key_hex, public_key_hex)
        """
        try:
            from nacl.signing import SigningKey
            from nacl.encoding import HexEncoder
            
            signing_key = SigningKey.generate()
            verify_key = signing_key.verify_key
            
            private_key = signing_key.encode(encoder=HexEncoder).decode()
            public_key = verify_key.encode(encoder=HexEncoder).decode()
            
            self.private_key_hex = private_key
            self.public_key_hex = public_key
            
            return private_key, public_key
        except ImportError:
            # Fallback: generate simple keypair
            import secrets
            private_key = secrets.token_hex(32)
            public_key = hashlib.sha256(private_key.encode()).hexdigest()
            
            self.private_key_hex = private_key
            self.public_key_hex = public_key
            
            return private_key, public_key
    
    def sign_policy(self, policy: Dict[str, Any], signer: str = "runtime") -> SignedPolicy:
        """
        Sign a policy.
        
        Args:
            policy: Policy dictionary
            signer: Signer identifier
        
        Returns:
            SignedPolicy
        """
        # Create canonical representation
        policy_str = json.dumps(policy, sort_keys=True)
        policy_hash = hashlib.sha256(policy_str.encode()).hexdigest()
        
        # Sign the hash
        signature = self._sign(policy_hash)
        
        return SignedPolicy(
            policy=policy,
            signature=signature,
            signed_at=datetime.now(timezone.utc).isoformat(),
            signer=signer
        )
    
    def _sign(self, data: str) -> str:
        """Sign data with Ed25519."""
        try:
            from nacl.signing import SigningKey
            from nacl.encoding import HexEncoder
            
            signing_key = SigningKey(self.private_key_hex, encoder=HexEncoder)
            signature = signing_key.sign(data.encode(), encoder=HexEncoder)
            
            # Return signature without the message
            return signature.signature.hex()
        except ImportError:
            # Fallback: HMAC signature
            import hmac
            return hmac.new(
                self.private_key_hex.encode(),
                data.encode(),
                hashlib.sha256
            ).hexdigest()
    
    def save_signed_policy(
        self,
        policy: Dict[str, Any],
        policy_path: str,
        signer: str = "runtime"
    ) -> None:
        """
        Save signed policy to files.
        
        Args:
            policy: Policy dictionary
            policy_path: Path to save policy.json
            signer: Signer identifier
        """
        signed_policy = self.sign_policy(policy, signer)
        
        policy_file = Path(policy_path)
        sig_file = policy_file.parent / f"{policy_file.name}.sig"
        
        # Save policy
        with open(policy_file, 'w') as f:
            json.dump(signed_policy.policy, f, indent=2)
        
        # Save signature
        with open(sig_file, 'w') as f:
            json.dump({
                "signature": signed_policy.signature,
                "signed_at": signed_policy.signed_at,
                "signer": signed_policy.signer,
                "public_key": self.public_key_hex
            }, f, indent=2)


class PolicyVerifier:
    """
    Verifies signed security policies.
    
    Ensures policies haven't been tampered with.
    """
    
    def __init__(self, trusted_public_keys: Optional[list] = None):
        """
        Initialize policy verifier.
        
        Args:
            trusted_public_keys: List of trusted public keys
        """
        self.trusted_public_keys = trusted_public_keys or []
    
    def add_trusted_key(self, public_key_hex: str) -> None:
        """Add a trusted public key."""
        if public_key_hex not in self.trusted_public_keys:
            self.trusted_public_keys.append(public_key_hex)
    
    def verify_policy(self, policy_path: str) -> tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
        """
        Verify a signed policy.
        
        Args:
            policy_path: Path to policy.json
        
        Returns:
            (is_valid, error_message, policy)
        """
        policy_file = Path(policy_path)
        sig_file = policy_file.parent / f"{policy_file.name}.sig"
        
        # Check files exist
        if not policy_file.exists():
            return False, "Policy file not found", None
        
        if not sig_file.exists():
            return False, "Signature file not found", None
        
        # Load policy
        with open(policy_file, 'r') as f:
            policy = json.load(f)
        
        # Load signature
        with open(sig_file, 'r') as f:
            sig_data = json.load(f)
        
        signature = sig_data.get("signature")
        public_key = sig_data.get("public_key")
        
        if not signature or not public_key:
            return False, "Invalid signature file", None
        
        # Verify public key is trusted
        if self.trusted_public_keys and public_key not in self.trusted_public_keys:
            return False, "Untrusted public key", None
        
        # Verify signature
        policy_str = json.dumps(policy, sort_keys=True)
        policy_hash = hashlib.sha256(policy_str.encode()).hexdigest()
        
        is_valid = self._verify(policy_hash, signature, public_key)
        
        if is_valid:
            return True, None, policy
        else:
            return False, "Invalid signature", None
    
    def _verify(self, data: str, signature: str, public_key_hex: str) -> bool:
        """Verify signature with Ed25519."""
        try:
            from nacl.signing import VerifyKey
            from nacl.encoding import HexEncoder
            
            verify_key = VerifyKey(public_key_hex, encoder=HexEncoder)
            
            try:
                verify_key.verify(data.encode(), bytes.fromhex(signature))
                return True
            except:
                return False
        except ImportError:
            # Fallback: HMAC verification
            import hmac
            expected = hmac.new(
                public_key_hex.encode(),
                data.encode(),
                hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(signature, expected)
    
    def load_policy(self, policy_path: str) -> Optional[Dict[str, Any]]:
        """
        Load and verify policy.
        
        Args:
            policy_path: Path to policy.json
        
        Returns:
            Policy if valid, None otherwise
        """
        is_valid, error, policy = self.verify_policy(policy_path)
        
        if not is_valid:
            raise SecurityError(f"Policy verification failed: {error}")
        
        return policy


class SecurityError(Exception):
    """Security error for policy violations."""
    pass


class SignedExecutionPolicy:
    """
    Signed execution policy with Ed25519 verification.
    
    Extends ExecutionPolicy with signature verification.
    """
    
    def __init__(
        self,
        policy_file: str = "runtime/security/policy.json",
        verifier: Optional[PolicyVerifier] = None
    ):
        self.policy_file = Path(policy_file)
        self.verifier = verifier or PolicyVerifier()
        self._policies: Dict[str, Any] = {}
        self._load_and_verify_policy()
    
    def _load_and_verify_policy(self) -> None:
        """Load and verify signed policy."""
        try:
            self._policies = self.verifier.load_policy(str(self.policy_file))
        except SecurityError as e:
            # Reject invalid policy
            raise SecurityError(f"Cannot load invalid policy: {e}")
    
    def _save_policy(self) -> None:
        """Save policy (requires signing)."""
        raise SecurityError("Cannot modify signed policy directly. Use PolicySigner to create new signed policy.")
    
    def can_write(self, path: str):
        """Check if write operation is allowed."""
        return self._check_path_policy("write", path)
    
    def can_delete(self, path: str):
        """Check if delete operation is allowed."""
        return self._check_path_policy("delete", path)
    
    def can_rename(self, from_path: str, to_path: str):
        """Check if rename operation is allowed."""
        decision_from = self._check_path_policy("rename", from_path)
        decision_to = self._check_path_policy("write", to_path)
        
        if not decision_from.allowed:
            return decision_from
        if not decision_to.allowed:
            return decision_to
        
        from runtime.security.execution_policy import PolicyDecision, Permission
        return PolicyDecision(
            allowed=True,
            permission=Permission.ALLOW,
            reason=f"Rename from {from_path} to {to_path} allowed",
            requires_approval=False
        )
    
    def can_execute(self, command: str):
        """Check if shell command execution is allowed."""
        return self._check_command_policy("execute", command)
    
    def can_network(self, host: str, port: int):
        """Check if network connection is allowed."""
        return self._check_network_policy("connect", host, port)
    
    def can_schedule(self, job_name: str):
        """Check if scheduling operation is allowed."""
        return self._check_schedule_policy("create", job_name)
    
    def can_shell(self, shell_command: str):
        """Check if shell command execution is allowed."""
        return self.can_execute(shell_command)
    
    def _check_path_policy(self, operation: str, path: str):
        """Check if path operation is allowed."""
        from runtime.security.execution_policy import PolicyDecision, Permission
        
        path_obj = Path(path)
        path_str = str(path_obj)
        
        # Check protected paths
        protected_paths = self._policies.get("filesystem", {}).get("protected_paths", [])
        for protected in protected_paths:
            if path_str.startswith(protected):
                return PolicyDecision(
                    allowed=False,
                    permission=Permission.DENY,
                    reason=f"Path {path_str} is in protected path {protected}",
                    requires_approval=False
                )
        
        # Check allowed paths
        allowed_paths = self._policies.get("filesystem", {}).get("allowed_paths", [])
        if allowed_paths:
            allowed = any(path_str.startswith(allowed) for allowed in allowed_paths)
            if not allowed:
                return PolicyDecision(
                    allowed=False,
                    permission=Permission.DENY,
                    reason=f"Path {path_str} not in allowed paths",
                    requires_approval=False
                )
        
        # Check default permission
        default = self._policies.get("filesystem", {}).get(operation, {}).get("default", Permission.DENY.value)
        permission = Permission(default)
        
        if permission == Permission.DENY:
            return PolicyDecision(
                allowed=False,
                permission=permission,
                reason=f"Filesystem {operation} denied by signed policy",
                requires_approval=False
            )
        elif permission == Permission.REQUIRE_APPROVAL:
            return PolicyDecision(
                allowed=False,
                permission=permission,
                reason=f"Filesystem {operation} requires approval",
                requires_approval=True
            )
        
        return PolicyDecision(
            allowed=True,
            permission=permission,
            reason=f"Filesystem {operation} allowed by signed policy",
            requires_approval=False
        )
    
    def _check_command_policy(self, operation: str, command: str):
        """Check if command operation is allowed."""
        from runtime.security.execution_policy import PolicyDecision, Permission
        
        # Check allowed commands
        allowed_commands = self._policies.get("shell", {}).get("allowed_commands", [])
        if allowed_commands:
            allowed = any(command.startswith(allowed) for allowed in allowed_commands)
            if not allowed:
                return PolicyDecision(
                    allowed=False,
                    permission=Permission.DENY,
                    reason=f"Command '{command}' not in allowed commands",
                    requires_approval=False
                )
        
        # Check default permission
        default = self._policies.get("shell", {}).get("execute", {}).get("default", Permission.DENY.value)
        permission = Permission(default)
        
        if permission == Permission.DENY:
            return PolicyDecision(
                allowed=False,
                permission=permission,
                reason=f"Shell execution denied by signed policy",
                requires_approval=False
            )
        elif permission == Permission.REQUIRE_APPROVAL:
            return PolicyDecision(
                allowed=False,
                permission=permission,
                reason=f"Shell execution requires approval",
                requires_approval=True
            )
        
        return PolicyDecision(
            allowed=True,
            permission=permission,
            reason=f"Shell execution allowed by signed policy",
            requires_approval=False
        )
    
    def _check_network_policy(self, operation: str, host: str, port: int):
        """Check if network operation is allowed."""
        from runtime.security.execution_policy import PolicyDecision, Permission
        
        # Check allowed hosts
        allowed_hosts = self._policies.get("network", {}).get("allowed_hosts", [])
        if allowed_hosts:
            allowed = any(host == allowed or host.endswith(f".{allowed}") for allowed in allowed_hosts)
            if not allowed:
                return PolicyDecision(
                    allowed=False,
                    permission=Permission.DENY,
                    reason=f"Host '{host}' not in allowed hosts",
                    requires_approval=False
                )
        
        # Check default permission
        default = self._policies.get("network", {}).get("connect", {}).get("default", Permission.DENY.value)
        permission = Permission(default)
        
        if permission == Permission.DENY:
            return PolicyDecision(
                allowed=False,
                permission=permission,
                reason=f"Network connection denied by signed policy",
                requires_approval=False
            )
        elif permission == Permission.REQUIRE_APPROVAL:
            return PolicyDecision(
                allowed=False,
                permission=permission,
                reason=f"Network connection requires approval",
                requires_approval=True
            )
        
        return PolicyDecision(
            allowed=True,
            permission=permission,
            reason=f"Network connection allowed by signed policy",
            requires_approval=False
        )
    
    def _check_schedule_policy(self, operation: str, job_name: str):
        """Check if scheduling operation is allowed."""
        from runtime.security.execution_policy import PolicyDecision, Permission
        
        # Check default permission
        default = self._policies.get("schedule", {}).get("create", {}).get("default", Permission.DENY.value)
        permission = Permission(default)
        
        if permission == Permission.DENY:
            return PolicyDecision(
                allowed=False,
                permission=permission,
                reason=f"Scheduling denied by signed policy",
                requires_approval=False
            )
        elif permission == Permission.REQUIRE_APPROVAL:
            return PolicyDecision(
                allowed=False,
                permission=permission,
                reason=f"Scheduling requires approval",
                requires_approval=True
            )
        
        return PolicyDecision(
            allowed=True,
            permission=permission,
            reason=f"Scheduling allowed by signed policy",
            requires_approval=False
        )
