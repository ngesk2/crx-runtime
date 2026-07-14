"""
Kernel Capability Layer - Centralized dangerous operations.

This is the ONLY place where:
- subprocess is allowed
- requests is allowed
- socket is allowed
- shutil is allowed
- Path.unlink is allowed
- os.remove is allowed

All other code MUST use these capabilities.

Oracle should BLOCK any PR introducing these APIs outside this module.

This makes policy enforcement unavoidable.
"""

import subprocess
import shutil
import os
import socket
import requests
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timezone
from dataclasses import dataclass
import hashlib
import json


@dataclass
class CapabilityResult:
    """Result of a capability operation."""
    success: bool
    output: Any
    error: Optional[str]
    timestamp: str


class KernelCapabilities:
    """
    Centralized kernel capabilities for dangerous operations.
    
    This is the ONLY module allowed to perform:
    - Process execution
    - Filesystem operations
    - Network requests
    - Socket operations
    
    All other code must use these capabilities.
    """
    
    def __init__(self):
        self._audit_log: List[Dict[str, Any]] = []
    
    def _audit(self, operation: str, details: Dict[str, Any], result: CapabilityResult) -> None:
        """Audit capability usage."""
        self._audit_log.append({
            "operation": operation,
            "details": details,
            "result": {
                "success": result.success,
                "error": result.error,
                "timestamp": result.timestamp
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    
    def run_process(
        self,
        command: List[str],
        cwd: Optional[str] = None,
        env: Optional[Dict[str, str]] = None,
        timeout: int = 300,
        capture_output: bool = True
    ) -> CapabilityResult:
        """
        Execute a process (ONLY place subprocess.run is allowed).
        
        Args:
            command: Command and arguments as list
            cwd: Working directory
            env: Environment variables
            timeout: Timeout in seconds
            capture_output: Whether to capture stdout/stderr
        
        Returns:
            CapabilityResult with output or error
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        
        try:
            result = subprocess.run(
                command,
                cwd=cwd,
                env=env,
                timeout=timeout,
                capture_output=capture_output,
                text=True
            )
            
            output = {
                "returncode": result.returncode,
                "stdout": result.stdout if capture_output else None,
                "stderr": result.stderr if capture_output else None
            }
            
            capability_result = CapabilityResult(
                success=result.returncode == 0,
                output=output,
                error=None,
                timestamp=timestamp
            )
            
            self._audit("run_process", {"command": command, "cwd": cwd}, capability_result)
            return capability_result
            
        except subprocess.TimeoutExpired:
            capability_result = CapabilityResult(
                success=False,
                output=None,
                error="Process timed out",
                timestamp=timestamp
            )
            self._audit("run_process", {"command": command, "cwd": cwd}, capability_result)
            return capability_result
        except Exception as e:
            capability_result = CapabilityResult(
                success=False,
                output=None,
                error=str(e),
                timestamp=timestamp
            )
            self._audit("run_process", {"command": command, "cwd": cwd}, capability_result)
            return capability_result
    
    def write_file(self, path: str, content: str, mode: str = "w") -> CapabilityResult:
        """
        Write file (ONLY place file writing is allowed).
        
        Args:
            path: Path to write to
            content: Content to write
            mode: Write mode
        
        Returns:
            CapabilityResult
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        
        try:
            with open(path, mode) as f:
                f.write(content)
            
            capability_result = CapabilityResult(
                success=True,
                output={"bytes_written": len(content)},
                error=None,
                timestamp=timestamp
            )
            
            self._audit("write_file", {"path": path, "mode": mode}, capability_result)
            return capability_result
            
        except Exception as e:
            capability_result = CapabilityResult(
                success=False,
                output=None,
                error=str(e),
                timestamp=timestamp
            )
            self._audit("write_file", {"path": path, "mode": mode}, capability_result)
            return capability_result
    
    def delete_file(self, path: str) -> CapabilityResult:
        """
        Delete file (ONLY place file deletion is allowed).
        
        Args:
            path: Path to delete
        
        Returns:
            CapabilityResult
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        
        try:
            Path(path).unlink()
            
            capability_result = CapabilityResult(
                success=True,
                output={"deleted": path},
                error=None,
                timestamp=timestamp
            )
            
            self._audit("delete_file", {"path": path}, capability_result)
            return capability_result
            
        except Exception as e:
            capability_result = CapabilityResult(
                success=False,
                output=None,
                error=str(e),
                timestamp=timestamp
            )
            self._audit("delete_file", {"path": path}, capability_result)
            return capability_result
    
    def rename_file(self, from_path: str, to_path: str) -> CapabilityResult:
        """
        Rename file (ONLY place file renaming is allowed).
        
        Args:
            from_path: Source path
            to_path: Destination path
        
        Returns:
            CapabilityResult
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        
        try:
            Path(from_path).rename(to_path)
            
            capability_result = CapabilityResult(
                success=True,
                output={"renamed": f"{from_path} -> {to_path}"},
                error=None,
                timestamp=timestamp
            )
            
            self._audit("rename_file", {"from": from_path, "to": to_path}, capability_result)
            return capability_result
            
        except Exception as e:
            capability_result = CapabilityResult(
                success=False,
                output=None,
                error=str(e),
                timestamp=timestamp
            )
            self._audit("rename_file", {"from": from_path, "to": to_path}, capability_result)
            return capability_result
    
    def copy_file(self, from_path: str, to_path: str) -> CapabilityResult:
        """
        Copy file (ONLY place shutil.copy is allowed).
        
        Args:
            from_path: Source path
            to_path: Destination path
        
        Returns:
            CapabilityResult
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        
        try:
            shutil.copy(from_path, to_path)
            
            capability_result = CapabilityResult(
                success=True,
                output={"copied": f"{from_path} -> {to_path}"},
                error=None,
                timestamp=timestamp
            )
            
            self._audit("copy_file", {"from": from_path, "to": to_path}, capability_result)
            return capability_result
            
        except Exception as e:
            capability_result = CapabilityResult(
                success=False,
                output=None,
                error=str(e),
                timestamp=timestamp
            )
            self._audit("copy_file", {"from": from_path, "to": to_path}, capability_result)
            return capability_result
    
    def network_request(
        self,
        url: str,
        method: str = "GET",
        headers: Optional[Dict[str, str]] = None,
        data: Optional[Any] = None,
        timeout: int = 30
    ) -> CapabilityResult:
        """
        Make network request (ONLY place requests is allowed).
        
        Args:
            url: URL to request
            method: HTTP method
            headers: Request headers
            data: Request data
            timeout: Timeout in seconds
        
        Returns:
            CapabilityResult with response
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                json=data,
                timeout=timeout
            )
            
            output = {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "text": response.text,
                "json": None
            }
            
            try:
                output["json"] = response.json()
            except:
                pass
            
            capability_result = CapabilityResult(
                success=response.status_code < 400,
                output=output,
                error=None,
                timestamp=timestamp
            )
            
            self._audit("network_request", {"url": url, "method": method}, capability_result)
            return capability_result
            
        except Exception as e:
            capability_result = CapabilityResult(
                success=False,
                output=None,
                error=str(e),
                timestamp=timestamp
            )
            self._audit("network_request", {"url": url, "method": method}, capability_result)
            return capability_result
    
    def socket_connect(self, host: str, port: int, timeout: int = 10) -> CapabilityResult:
        """
        Connect via socket (ONLY place socket is allowed).
        
        Args:
            host: Host to connect to
            port: Port to connect to
            timeout: Timeout in seconds
        
        Returns:
            CapabilityResult
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            sock.connect((host, port))
            sock.close()
            
            capability_result = CapabilityResult(
                success=True,
                output={"connected": f"{host}:{port}"},
                error=None,
                timestamp=timestamp
            )
            
            self._audit("socket_connect", {"host": host, "port": port}, capability_result)
            return capability_result
            
        except Exception as e:
            capability_result = CapabilityResult(
                success=False,
                output=None,
                error=str(e),
                timestamp=timestamp
            )
            self._audit("socket_connect", {"host": host, "port": port}, capability_result)
            return capability_result
    
    def get_audit_log(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get audit log of capability usage.
        
        Args:
            limit: Maximum number of entries to return
        
        Returns:
            Audit log entries
        """
        if limit:
            return self._audit_log[-limit:]
        return self._audit_log.copy()
    
    def clear_audit_log(self) -> None:
        """Clear audit log."""
        self._audit_log.clear()


# Singleton instance
_kernel_capabilities = KernelCapabilities()


def get_kernel_capabilities() -> KernelCapabilities:
    """Get the singleton kernel capabilities instance."""
    return _kernel_capabilities
