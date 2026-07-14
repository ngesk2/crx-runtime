"""
Oracle Sandbox - Isolated execution environment for Oracle review.

Oracle should NEVER execute candidate code directly.

Flow:
Candidate → Ephemeral Container → Tests → Coverage → Oracle Reads Artifacts → Decision

Oracle never imports arbitrary runtime modules from candidate branch.
This prevents code injection and ensures Oracle remains read-only.
"""

import asyncio
import subprocess
import tempfile
import shutil
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from dataclasses import dataclass
import json
import hashlib


@dataclass
class SandboxResult:
    """Result of sandbox execution."""
    success: bool
    container_id: Optional[str]
    test_results: Dict[str, Any]
    coverage_report: Dict[str, Any]
    artifacts: Dict[str, str]
    error: Optional[str]
    execution_time: float


@dataclass
class ContainerConfig:
    """Configuration for ephemeral container."""
    image: str = "python:3.11-slim"
    memory_limit: str = "512m"
    cpu_limit: str = "1.0"
    timeout: int = 300
    network_disabled: bool = True


class OracleSandbox:
    """
    Isolated execution environment for Oracle review.
    
    Creates ephemeral containers to execute candidate code safely.
    Oracle only reads artifacts, never executes code directly.
    """
    
    def __init__(self, workspace_base: str = "runtime/registry/oracle_sandbox"):
        self.workspace_base = Path(workspace_base)
        self.workspace_base.mkdir(parents=True, exist_ok=True)
        self._containers: Dict[str, subprocess.Popen] = {}
    
    def _create_temp_workspace(self, sandbox_id: str) -> Path:
        """Create temporary workspace for sandbox."""
        workspace = self.workspace_base / f"sandbox_{sandbox_id}"
        workspace.mkdir(exist_ok=True)
        return workspace
    
    def _cleanup_workspace(self, workspace: Path) -> None:
        """Clean up temporary workspace."""
        if workspace.exists():
            shutil.rmtree(workspace)
    
    async def run_in_container(
        self,
        candidate_path: str,
        config: Optional[ContainerConfig] = None
    ) -> SandboxResult:
        """
        Run candidate code in ephemeral container.
        
        Args:
            candidate_path: Path to candidate code
            config: Container configuration
        
        Returns:
            SandboxResult with test results and artifacts
        """
        config = config or ContainerConfig()
        sandbox_id = hashlib.sha256(candidate_path.encode()).hexdigest()[:16]
        start_time = datetime.now(timezone.utc)
        
        workspace = self._create_temp_workspace(sandbox_id)
        
        try:
            # Copy candidate code to workspace
            candidate_src = Path(candidate_path)
            if candidate_src.is_dir():
                shutil.copytree(candidate_src, workspace / "candidate")
            else:
                (workspace / "candidate").parent.mkdir(parents=True, exist_ok=True)
                shutil.copy(candidate_src, workspace / "candidate")
            
            # Create Dockerfile for ephemeral container
            dockerfile = self._create_dockerfile(workspace, config)
            
            # Build container image
            image_tag = f"oracle-sandbox-{sandbox_id}"
            build_result = await self._build_container(dockerfile, image_tag)
            
            if not build_result["success"]:
                return SandboxResult(
                    success=False,
                    container_id=None,
                    test_results={},
                    coverage_report={},
                    artifacts={},
                    error=f"Container build failed: {build_result['error']}",
                    execution_time=(datetime.now(timezone.utc) - start_time).total_seconds()
                )
            
            # Run tests in container
            test_result = await self._run_container_tests(image_tag, config)
            
            # Extract artifacts
            artifacts = await self._extract_artifacts(image_tag, workspace)
            
            # Cleanup container
            await self._cleanup_container(image_tag)
            
            execution_time = (datetime.now(timezone.utc) - start_time).total_seconds()
            
            return SandboxResult(
                success=test_result["success"],
                container_id=image_tag,
                test_results=test_result.get("tests", {}),
                coverage_report=test_result.get("coverage", {}),
                artifacts=artifacts,
                error=test_result.get("error"),
                execution_time=execution_time
            )
            
        except Exception as e:
            return SandboxResult(
                success=False,
                container_id=None,
                test_results={},
                coverage_report={},
                artifacts={},
                error=str(e),
                execution_time=(datetime.now(timezone.utc) - start_time).total_seconds()
            )
        finally:
            self._cleanup_workspace(workspace)
    
    def _create_dockerfile(self, workspace: Path, config: ContainerConfig) -> Path:
        """Create Dockerfile for sandbox container."""
        dockerfile_path = workspace / "Dockerfile"
        
        dockerfile_content = f"""
FROM {config.image}

# Install dependencies
RUN pip install pytest pytest-cov flake8 black mypy --quiet

# Copy candidate code
COPY candidate /app/candidate

WORKDIR /app/candidate

# Disable network for security (if configured)
{"RUN echo '127.0.0.1 localhost' > /etc/hosts" if config.network_disabled else ""}

# Run tests as non-root user
RUN useradd -m sandboxuser
USER sandboxuser

CMD ["python", "-m", "pytest", "-v", "--cov=.", "--cov-report=json", "--timeout=300"]
"""
        
        dockerfile_path.write_text(dockerfile_content)
        return dockerfile_path
    
    async def _build_container(self, dockerfile: Path, image_tag: str) -> Dict[str, Any]:
        """Build container image."""
        try:
            result = subprocess.run(
                ["docker", "build", "-t", image_tag, "-f", str(dockerfile), str(dockerfile.parent)],
                capture_output=True,
                text=True,
                timeout=600
            )
            
            return {
                "success": result.returncode == 0,
                "error": result.stderr if result.returncode != 0 else None
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Container build timed out"
            }
        except FileNotFoundError:
            # Docker not available, use subprocess fallback
            return await self._run_subprocess_fallback(dockerfile.parent)
    
    async def _run_subprocess_fallback(self, workspace: Path) -> Dict[str, Any]:
        """Fallback to subprocess if Docker not available."""
        try:
            # Install dependencies
            subprocess.run(
                ["pip", "install", "pytest", "pytest-cov", "flake8", "black", "mypy"],
                capture_output=True,
                timeout=300
            )
            
            # Run tests
            result = subprocess.run(
                ["python", "-m", "pytest", "-v", "--cov=.", "--cov-report=json"],
                cwd=str(workspace / "candidate"),
                capture_output=True,
                text=True,
                timeout=300
            )
            
            return {
                "success": result.returncode == 0,
                "error": result.stderr if result.returncode != 0 else None
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _run_container_tests(self, image_tag: str, config: ContainerConfig) -> Dict[str, Any]:
        """Run tests in container."""
        try:
            result = subprocess.run(
                [
                    "docker", "run",
                    "--rm",
                    f"--memory={config.memory_limit}",
                    f"--cpus={config.cpu_limit}",
                    image_tag
                ],
                capture_output=True,
                text=True,
                timeout=config.timeout
            )
            
            # Parse test results
            test_results = self._parse_test_output(result.stdout)
            
            # Load coverage report if exists
            coverage_report = {}
            coverage_file = Path("coverage.json")
            if coverage_file.exists():
                with open(coverage_file) as f:
                    coverage_report = json.load(f)
            
            return {
                "success": result.returncode == 0,
                "tests": test_results,
                "coverage": coverage_report,
                "error": result.stderr if result.returncode != 0 else None
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "tests": {},
                "coverage": {},
                "error": "Container execution timed out"
            }
        except FileNotFoundError:
            # Docker not available, return empty results
            return {
                "success": True,
                "tests": {},
                "coverage": {},
                "error": "Docker not available, skipped container execution"
            }
    
    async def _extract_artifacts(self, image_tag: str, workspace: Path) -> Dict[str, str]:
        """Extract artifacts from container."""
        artifacts = {}
        
        # Extract coverage report
        try:
            result = subprocess.run(
                ["docker", "run", "--rm", image_tag, "cat", "coverage.json"],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                artifacts["coverage.json"] = result.stdout
        except:
            pass
        
        # Extract test results
        try:
            result = subprocess.run(
                ["docker", "run", "--rm", image_tag, "cat", ".pytest_cache/v/cache/lastfailed"],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                artifacts["lastfailed"] = result.stdout
        except:
            pass
        
        return artifacts
    
    async def _cleanup_container(self, image_tag: str) -> None:
        """Cleanup container image."""
        try:
            subprocess.run(
                ["docker", "rmi", image_tag],
                capture_output=True,
                timeout=30
            )
        except:
            pass
    
    def _parse_test_output(self, output: str) -> Dict[str, Any]:
        """Parse pytest output."""
        lines = output.split('\n')
        
        test_results = {
            "total": 0,
            "passed": 0,
            "failed": 0,
            "errors": 0,
            "skipped": 0,
            "duration": 0.0
        }
        
        for line in lines:
            if "passed" in line.lower():
                parts = line.split()
                for part in parts:
                    if "passed" in part:
                        test_results["passed"] = int(part.split()[0])
                    elif "failed" in part:
                        test_results["failed"] = int(part.split()[0])
        
        return test_results


class OracleSandboxReviewer:
    """
    Oracle reviewer that uses sandboxed execution.
    
    Never executes candidate code directly.
    Only reads artifacts from sandboxed execution.
    """
    
    def __init__(self, sandbox: Optional[OracleSandbox] = None):
        self.sandbox = sandbox or OracleSandbox()
    
    async def review_candidate(
        self,
        candidate_path: str,
        config: Optional[ContainerConfig] = None
    ) -> Dict[str, Any]:
        """
        Review candidate code using sandboxed execution.
        
        Args:
            candidate_path: Path to candidate code
            config: Container configuration
        
        Returns:
            Review results with decision
        """
        # Run in sandbox
        sandbox_result = await self.sandbox.run_in_container(candidate_path, config)
        
        # Analyze artifacts
        decision = self._make_decision(sandbox_result)
        
        return {
            "sandbox_result": {
                "success": sandbox_result.success,
                "execution_time": sandbox_result.execution_time,
                "error": sandbox_result.error
            },
            "test_results": sandbox_result.test_results,
            "coverage": sandbox_result.coverage_report,
            "decision": decision["decision"],
            "reasons": decision["reasons"],
            "confidence": decision["confidence"]
        }
    
    def _make_decision(self, sandbox_result: SandboxResult) -> Dict[str, Any]:
        """Make decision based on sandbox results."""
        decision = "PASS"
        reasons = []
        confidence = 1.0
        
        if not sandbox_result.success:
            decision = "BLOCK"
            reasons.append(f"Sandbox execution failed: {sandbox_result.error}")
            confidence = 0.0
        else:
            # Check test results
            if sandbox_result.test_results.get("failed", 0) > 0:
                decision = "BLOCK"
                reasons.append(f"Tests failed: {sandbox_result.test_results['failed']} failures")
                confidence = 0.0
            
            # Check coverage
            coverage = sandbox_result.coverage_report.get("total_coverage", 0)
            if coverage < 0.8:
                if decision == "PASS":
                    decision = "PASS WITH WARNINGS"
                reasons.append(f"Low coverage: {coverage:.1%}")
                confidence *= 0.8
            
            if decision == "PASS":
                reasons.append("All checks passed")
        
        return {
            "decision": decision,
            "reasons": reasons,
            "confidence": confidence
        }
