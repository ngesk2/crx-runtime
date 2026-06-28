"""ExecutionAuthority — constitutional owner of execution requests.

All subprocess and child-process execution flows through this authority.
Temporal and other backends are adapters behind the same interface.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, List, Optional, Protocol


@dataclass
class ExecutionRequest:
    command: str
    args: List[str] = field(default_factory=list)
    cwd: Optional[str] = None
    env: Optional[dict] = None
    timeout: Optional[float] = None
    input_data: Optional[bytes] = None


class ExecutionAdapter(Protocol):
    def execute(self, request: ExecutionRequest) -> Any:
        ...


class SubprocessExecutionAdapter:
    """Default adapter that preserves current process behavior."""

    def execute(self, request: ExecutionRequest) -> Any:
        import subprocess

        proc = subprocess.run(
            [request.command, *request.args],
            cwd=request.cwd,
            env=request.env,
            input=request.input_data,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=request.timeout,
            text=False,
        )
        return type(
            "ExecutionResult",
            (),
            {
                "returncode": proc.returncode,
                "stdout": proc.stdout.decode("utf-8", errors="replace"),
                "stderr": proc.stderr.decode("utf-8", errors="replace"),
                "command": request.command,
            },
        )()


class ExecutionAuthority:
    """Single authority for all execution transport decisions."""

    def __init__(self, adapter: Optional[ExecutionAdapter] = None):
        self.adapter = adapter or SubprocessExecutionAdapter()

    def run(self, args: List[str], cwd: Optional[str] = None, timeout: Optional[float] = None, input_data: Optional[bytes] = None) -> Any:
        request = ExecutionRequest(command=args[0], args=args[1:], cwd=cwd, timeout=timeout, input_data=input_data)
        return self.adapter.execute(request)

    def run_command(self, command: str, args: Optional[List[str]] = None, cwd: Optional[str] = None, timeout: Optional[float] = None, input_data: Optional[bytes] = None) -> Any:
        request = ExecutionRequest(command=command, args=args or [], cwd=cwd, timeout=timeout, input_data=input_data)
        return self.adapter.execute(request)
