"""
Execution Policy Layer - Mediates all destructive operations.

Hermes never directly touches:
- subprocess
- os
- shutil
- Path.unlink
- Path.rename
- requests
- socket
- cron
- schtasks

Everything routes through policy.

This is a critical security layer preventing unauthorized operations.
"""

import os
import subprocess
import shutil
from pathlib import Path
from typing import Optional, List, Dict, Any, Callable
from datetime import datetime, timezone
from dataclasses import dataclass
from enum import Enum


class Permission(Enum):
    """Permission levels."""
    DENY = "deny"
    ALLOW = "allow"
    REQUIRE_APPROVAL = "require_approval"


@dataclass
class PolicyDecision:
    """Decision from execution policy."""
    allowed: bool
    permission: Permission
    reason: str
    requires_approval: bool
    approved_by: Optional[str] = None


class ExecutionPolicy:
    """
    Mediates all destructive operations.
    
    Policy checks:
    - Filesystem operations (write, delete, rename)
    - Shell execution
    - Network access
    - Scheduling operations
    - Process execution
    
    All operations must be explicitly allowed.
    """
    
    def __init__(self, policy_file: str = "runtime/security/policy.json"):
        self.policy_file = Path(policy_file)
        self._policies: Dict[str, Any] = {}
        self._load_policy()
    
    def _load_policy(self) -> None:
        """Load policy from file."""
        if self.policy_file.exists():
            import json
            with open(self.policy_file, 'r') as f:
                self._policies = json.load(f)
        else:
            # Default restrictive policy
            self._policies = {
                "filesystem": {
                    "write": {"default": Permission.REQUIRE_APPROVAL.value},
                    "delete": {"default": Permission.DENY.value},
                    "rename": {"default": Permission.REQUIRE_APPROVAL.value},
                    "allowed_paths": [],
                    "protected_paths": ["main", "runtime/kernel", "constitution"]
                },
                "shell": {
                    "execute": {"default": Permission.DENY.value},
                    "allowed_commands": []
                },
                "network": {
                    "connect": {"default": Permission.DENY.value},
                    "allowed_hosts": []
                },
                "schedule": {
                    "create": {"default": Permission.DENY.value},
                    "delete": {"default": Permission.DENY.value}
                },
                "process": {
                    "execute": {"default": Permission.REQUIRE_APPROVAL.value},
                    "allowed_executables": []
                }
            }
    
    def _save_policy(self) -> None:
        """Save policy to file."""
        self.policy_file.parent.mkdir(parents=True, exist_ok=True)
        import json
        with open(self.policy_file, 'w') as f:
            json.dump(self._policies, f, indent=2)
    
    def _check_path_policy(self, operation: str, path: str) -> PolicyDecision:
        """Check if path operation is allowed."""
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
                reason=f"Filesystem {operation} denied by default policy",
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
            reason=f"Filesystem {operation} allowed",
            requires_approval=False
        )
    
    def can_write(self, path: str) -> PolicyDecision:
        """
        Check if write operation is allowed.
        
        Args:
            path: Path to write to
        
        Returns:
            PolicyDecision
        """
        return self._check_path_policy("write", path)
    
    def can_delete(self, path: str) -> PolicyDecision:
        """
        Check if delete operation is allowed.
        
        Args:
            path: Path to delete
        
        Returns:
            PolicyDecision
        """
        return self._check_path_policy("delete", path)
    
    def can_rename(self, from_path: str, to_path: str) -> PolicyDecision:
        """
        Check if rename operation is allowed.
        
        Args:
            from_path: Source path
            to_path: Destination path
        
        Returns:
            PolicyDecision
        """
        decision_from = self._check_path_policy("rename", from_path)
        decision_to = self._check_path_policy("write", to_path)
        
        if not decision_from.allowed:
            return decision_from
        if not decision_to.allowed:
            return decision_to
        
        return PolicyDecision(
            allowed=True,
            permission=Permission.ALLOW,
            reason=f"Rename from {from_path} to {to_path} allowed",
            requires_approval=False
        )
    
    def can_execute(self, command: str) -> PolicyDecision:
        """
        Check if shell command execution is allowed.
        
        Args:
            command: Command to execute
        
        Returns:
            PolicyDecision
        """
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
                reason=f"Shell execution denied by default policy",
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
            reason=f"Shell execution allowed",
            requires_approval=False
        )
    
    def can_network(self, host: str, port: int) -> PolicyDecision:
        """
        Check if network connection is allowed.
        
        Args:
            host: Host to connect to
            port: Port to connect to
        
        Returns:
            PolicyDecision
        """
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
                reason=f"Network connection denied by default policy",
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
            reason=f"Network connection allowed",
            requires_approval=False
        )
    
    def can_schedule(self, job_name: str) -> PolicyDecision:
        """
        Check if scheduling operation is allowed.
        
        Args:
            job_name: Name of scheduled job
        
        Returns:
            PolicyDecision
        """
        # Check default permission
        default = self._policies.get("schedule", {}).get("create", {}).get("default", Permission.DENY.value)
        permission = Permission(default)
        
        if permission == Permission.DENY:
            return PolicyDecision(
                allowed=False,
                permission=permission,
                reason=f"Scheduling denied by default policy",
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
            reason=f"Scheduling allowed",
            requires_approval=False
        )
    
    def can_shell(self, shell_command: str) -> PolicyDecision:
        """
        Check if shell command execution is allowed (alias for can_execute).
        
        Args:
            shell_command: Shell command to execute
        
        Returns:
            PolicyDecision
        """
        return self.can_execute(shell_command)
    
    def approve(self, operation: str, approver: str) -> None:
        """
        Approve an operation.
        
        Args:
            operation: Operation to approve
            approver: Approver name
        """
        # This would integrate with an approval system
        # For now, just log
        pass
    
    def add_allowed_path(self, path: str) -> None:
        """Add path to allowed paths."""
        if "filesystem" not in self._policies:
            self._policies["filesystem"] = {}
        if "allowed_paths" not in self._policies["filesystem"]:
            self._policies["filesystem"]["allowed_paths"] = []
        
        if path not in self._policies["filesystem"]["allowed_paths"]:
            self._policies["filesystem"]["allowed_paths"].append(path)
            self._save_policy()
    
    def add_allowed_command(self, command: str) -> None:
        """Add command to allowed commands."""
        if "shell" not in self._policies:
            self._policies["shell"] = {}
        if "allowed_commands" not in self._policies["shell"]:
            self._policies["shell"]["allowed_commands"] = []
        
        if command not in self._policies["shell"]["allowed_commands"]:
            self._policies["shell"]["allowed_commands"].append(command)
            self._save_policy()
    
    def add_allowed_host(self, host: str) -> None:
        """Add host to allowed hosts."""
        if "network" not in self._policies:
            self._policies["network"] = {}
        if "allowed_hosts" not in self._policies["network"]:
            self._policies["network"]["allowed_hosts"] = []
        
        if host not in self._policies["network"]["allowed_hosts"]:
            self._policies["network"]["allowed_hosts"].append(host)
            self._save_policy()


class PolicyMediator:
    """
    Mediates operations through execution policy.
    
    Wraps all dangerous operations with policy checks.
    """
    
    def __init__(self, policy: Optional[ExecutionPolicy] = None):
        self.policy = policy or ExecutionPolicy()
    
    async def write_file(self, path: str, content: str) -> bool:
        """
        Write file with policy check.
        
        Args:
            path: Path to write to
            content: Content to write
        
        Returns:
            True if write succeeded
        """
        decision = self.policy.can_write(path)
        
        if not decision.allowed:
            if decision.requires_approval:
                raise PermissionError(f"Write requires approval: {decision.reason}")
            raise PermissionError(f"Write denied: {decision.reason}")
        
        try:
            with open(path, 'w') as f:
                f.write(content)
            return True
        except Exception as e:
            raise RuntimeError(f"Write failed: {e}")
    
    async def delete_file(self, path: str) -> bool:
        """
        Delete file with policy check.
        
        Args:
            path: Path to delete
        
        Returns:
            True if delete succeeded
        """
        decision = self.policy.can_delete(path)
        
        if not decision.allowed:
            if decision.requires_approval:
                raise PermissionError(f"Delete requires approval: {decision.reason}")
            raise PermissionError(f"Delete denied: {decision.reason}")
        
        try:
            Path(path).unlink()
            return True
        except Exception as e:
            raise RuntimeError(f"Delete failed: {e}")
    
    async def rename_file(self, from_path: str, to_path: str) -> bool:
        """
        Rename file with policy check.
        
        Args:
            from_path: Source path
            to_path: Destination path
        
        Returns:
            True if rename succeeded
        """
        decision = self.policy.can_rename(from_path, to_path)
        
        if not decision.allowed:
            if decision.requires_approval:
                raise PermissionError(f"Rename requires approval: {decision.reason}")
            raise PermissionError(f"Rename denied: {decision.reason}")
        
        try:
            Path(from_path).rename(to_path)
            return True
        except Exception as e:
            raise RuntimeError(f"Rename failed: {e}")
    
    async def execute_command(self, command: str, cwd: Optional[str] = None) -> Dict[str, Any]:
        """
        Execute command with policy check.
        
        Args:
            command: Command to execute
            cwd: Working directory
        
        Returns:
            Command result
        """
        decision = self.policy.can_execute(command)
        
        if not decision.allowed:
            if decision.requires_approval:
                raise PermissionError(f"Execute requires approval: {decision.reason}")
            raise PermissionError(f"Execute denied: {decision.reason}")
        
        try:
            result = subprocess.run(
                command,
                shell=True,
                cwd=cwd,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode
            }
        except subprocess.TimeoutExpired:
            raise RuntimeError("Command timed out")
        except Exception as e:
            raise RuntimeError(f"Execute failed: {e}")
    
    async def network_request(self, url: str) -> Optional[str]:
        """
        Make network request with policy check.
        
        Args:
            url: URL to request
        
        Returns:
            Response content
        """
        from urllib.parse import urlparse
        
        parsed = urlparse(url)
        host = parsed.netloc.split(':')[0]
        port = 443 if parsed.scheme == 'https' else 80
        
        decision = self.policy.can_network(host, port)
        
        if not decision.allowed:
            if decision.requires_approval:
                raise PermissionError(f"Network request requires approval: {decision.reason}")
            raise PermissionError(f"Network request denied: {decision.reason}")
        
        try:
            import requests
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            return response.text
        except Exception as e:
            raise RuntimeError(f"Network request failed: {e}")
