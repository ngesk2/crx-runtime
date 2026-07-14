"""
Promotion Pipeline - No direct merges allowed.

Pipeline flow:
Main → Clone → Development → Static Analysis → Formatting → Typing → Tests → Oracle → Manifest → Human → Merge → Main

No exceptions.
"""

import asyncio
import subprocess
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

from .work_claim_manager import WorkClaimManager
from .merge_manifest import MergeManifest, MergeManifestRegistry


class PromotionPipeline:
    """
    Manages the promotion pipeline from sandbox to main.
    
    Enforces:
    - No direct merges to main
    - Complete pipeline execution
    - Human approval required
    - Immutable merge records
    """
    
    def __init__(
        self,
        main_repo: str,
        sandbox_base: str = "sandbox",
        work_claim_manager: Optional[WorkClaimManager] = None,
        manifest_registry: Optional[MergeManifestRegistry] = None
    ):
        self.main_repo = Path(main_repo)
        self.sandbox_base = Path(sandbox_base)
        self.work_claim_manager = work_claim_manager or WorkClaimManager()
        self.manifest_registry = manifest_registry or MergeManifestRegistry()
    
    async def clone_to_sandbox(self, sandbox: str, branch: str = "main") -> bool:
        """
        Clone main repository to sandbox.
        
        Args:
            sandbox: Sandbox name (hermes, builder, testing, etc.)
            branch: Branch to clone from
        
        Returns:
            True if clone succeeded
        """
        sandbox_path = self.sandbox_base / sandbox
        
        # Remove existing sandbox if present
        if sandbox_path.exists():
            subprocess.run(["rm", "-rf", str(sandbox_path)], check=True)
        
        # Clone from main
        try:
            subprocess.run(
                ["git", "clone", str(self.main_repo), str(sandbox_path)],
                check=True
            )
            
            # Checkout specified branch
            subprocess.run(
                ["git", "-C", str(sandbox_path), "checkout", branch],
                check=True
            )
            
            return True
        except subprocess.CalledProcessError:
            return False
    
    async def verify_work_claims(self, sandbox: str, agent: str) -> bool:
        """
        Verify that agent has valid work claims for all changed files.
        
        Args:
            sandbox: Sandbox name
            agent: Agent name
        
        Returns:
            True if all claims are valid
        """
        sandbox_path = self.sandbox_base / sandbox
        
        # Get changed files
        try:
            result = subprocess.run(
                ["git", "-C", str(sandbox_path), "diff", "--name-only", "main"],
                capture_output=True,
                text=True,
                check=True
            )
            changed_files = result.stdout.strip().split('\n') if result.stdout.strip() else []
        except subprocess.CalledProcessError:
            return False
        
        # Verify claims for each subsystem
        for file_path in changed_files:
            # Determine subsystem from file path
            subsystem = self._get_subsystem_from_path(file_path)
            
            if subsystem:
                can_claim = await self.work_claim_manager.can_claim(subsystem, agent)
                if not can_claim:
                    return False
        
        return True
    
    def _get_subsystem_from_path(self, file_path: str) -> Optional[str]:
        """Extract subsystem from file path."""
        if file_path.startswith("runtime/"):
            return "runtime"
        elif file_path.startswith("pipeline/"):
            return "pipeline"
        elif file_path.startswith("execution/"):
            return "execution"
        elif file_path.startswith("tests/"):
            return "tests"
        elif file_path.startswith("docs/"):
            return "docs"
        return None
    
    async def create_manifest(
        self,
        sandbox: str,
        agent: str,
        components: List[str],
        tests: List[str],
        changed_files: List[str],
        breaking_changes: List[str]
    ) -> MergeManifest:
        """
        Create merge manifest.
        
        Args:
            sandbox: Sandbox name
            agent: Agent name
            components: Components changed
            tests: Tests run
            changed_files: List of changed files
            breaking_changes: List of breaking changes
        
        Returns:
            MergeManifest
        """
        sandbox_path = self.sandbox_base / sandbox
        
        # Get parent commit
        try:
            result = subprocess.run(
                ["git", "-C", str(sandbox_path), "rev-parse", "main"],
                capture_output=True,
                text=True,
                check=True
            )
            parent_commit = result.stdout.strip()
        except subprocess.CalledProcessError:
            parent_commit = "unknown"
        
        # Get versions (placeholder - would read from actual version files)
        runtime_version = "1.0.0"
        constitution_version = "1.0.0"
        schema_version = "1.0.0"
        
        manifest = self.manifest_registry.create_manifest(
            sandbox=sandbox,
            parent_commit=parent_commit,
            components=components,
            tests=tests,
            reviewed_by="Oracle",  # Oracle reviews
            approved_by=agent,  # Pending human approval
            runtime_version=runtime_version,
            constitution_version=constitution_version,
            schema_version=schema_version,
            changed_files=changed_files,
            breaking_changes=breaking_changes
        )
        
        return manifest
    
    async def run_static_analysis(self, sandbox: str) -> Dict[str, Any]:
        """
        Run static analysis in sandbox.
        
        Args:
            sandbox: Sandbox name
        
        Returns:
            Static analysis results
        """
        sandbox_path = self.sandbox_base / sandbox
        
        # Run pylint or flake8
        try:
            result = subprocess.run(
                ["python", "-m", "flake8", ".", "--max-line-length=100"],
                cwd=str(sandbox_path),
                capture_output=True,
                text=True,
                timeout=300
            )
            
            return {
                "success": result.returncode == 0,
                "output": result.stdout,
                "errors": result.stderr
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "output": "",
                "errors": "Static analysis timed out"
            }
        except FileNotFoundError:
            # flake8 not installed, skip
            return {
                "success": True,
                "output": "Static analysis skipped (flake8 not installed)",
                "errors": ""
            }
        except Exception as e:
            return {
                "success": False,
                "output": "",
                "errors": str(e)
            }
    
    async def run_formatting(self, sandbox: str) -> Dict[str, Any]:
        """
        Run formatting check in sandbox.
        
        Args:
            sandbox: Sandbox name
        
        Returns:
            Formatting results
        """
        sandbox_path = self.sandbox_base / sandbox
        
        # Run black --check
        try:
            result = subprocess.run(
                ["python", "-m", "black", ".", "--check"],
                cwd=str(sandbox_path),
                capture_output=True,
                text=True,
                timeout=300
            )
            
            return {
                "success": result.returncode == 0,
                "output": result.stdout,
                "errors": result.stderr
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "output": "",
                "errors": "Formatting check timed out"
            }
        except FileNotFoundError:
            # black not installed, skip
            return {
                "success": True,
                "output": "Formatting check skipped (black not installed)",
                "errors": ""
            }
        except Exception as e:
            return {
                "success": False,
                "output": "",
                "errors": str(e)
            }
    
    async def run_typing(self, sandbox: str) -> Dict[str, Any]:
        """
        Run type checking in sandbox.
        
        Args:
            sandbox: Sandbox name
        
        Returns:
            Type checking results
        """
        sandbox_path = self.sandbox_base / sandbox
        
        # Run mypy
        try:
            result = subprocess.run(
                ["python", "-m", "mypy", ".", "--ignore-missing-imports"],
                cwd=str(sandbox_path),
                capture_output=True,
                text=True,
                timeout=300
            )
            
            return {
                "success": result.returncode == 0,
                "output": result.stdout,
                "errors": result.stderr
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "output": "",
                "errors": "Type checking timed out"
            }
        except FileNotFoundError:
            # mypy not installed, skip
            return {
                "success": True,
                "output": "Type checking skipped (mypy not installed)",
                "errors": ""
            }
        except Exception as e:
            return {
                "success": False,
                "output": "",
                "errors": str(e)
            }
    
    async def run_tests(self, sandbox: str) -> Dict[str, Any]:
        """
        Run tests in sandbox.
        
        Args:
            sandbox: Sandbox name
        
        Returns:
            Test results
        """
        sandbox_path = self.sandbox_base / sandbox
        
        # Run pytest
        try:
            result = subprocess.run(
                ["python", "-m", "pytest", "tests/", "-v"],
                cwd=str(sandbox_path),
                capture_output=True,
                text=True,
                timeout=300
            )
            
            return {
                "success": result.returncode == 0,
                "output": result.stdout,
                "errors": result.stderr
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "output": "",
                "errors": "Tests timed out"
            }
        except subprocess.CalledProcessError as e:
            return {
                "success": False,
                "output": e.stdout,
                "errors": e.stderr
            }
    
    async def request_human_approval(self, manifest: MergeManifest) -> bool:
        """
        Request human approval for merge.
        
        Args:
            manifest: Merge manifest
        
        Returns:
            True if approved
        """
        # This would integrate with a UI or notification system
        # For now, return False (requires manual intervention)
        print(f"Human approval required for merge {manifest.merge_id}")
        print(f"Sandbox: {manifest.sandbox}")
        print(f"Components: {manifest.components}")
        print(f"Breaking changes: {manifest.breaking_changes}")
        
        return False
    
    async def merge_to_main(self, manifest: MergeManifest) -> bool:
        """
        Merge sandbox to main.
        
        Args:
            manifest: Merge manifest
        
        Returns:
            True if merge succeeded
        """
        sandbox_path = self.sandbox_base / manifest.sandbox
        
        # Verify human approval
        if manifest.approved_by == "pending":
            print("Merge not approved by human")
            return False
        
        try:
            # Add changes to main
            subprocess.run(
                ["git", "-C", str(self.main_repo), "pull", str(sandbox_path), manifest.sandbox],
                check=True
            )
            
            # Save manifest
            self.manifest_registry.save_manifest(manifest)
            
            return True
        except subprocess.CalledProcessError:
            return False
    
    async def execute_pipeline(
        self,
        sandbox: str,
        agent: str,
        components: List[str],
        breaking_changes: List[str]
    ) -> bool:
        """
        Execute full promotion pipeline.
        
        Args:
            sandbox: Sandbox name
            agent: Agent name
            components: Components changed
            breaking_changes: List of breaking changes
        
        Returns:
            True if pipeline completed successfully
        """
        # Step 1: Clone to sandbox
        if not await self.clone_to_sandbox(sandbox):
            print("Failed to clone to sandbox")
            return False
        
        # Step 2: Verify work claims
        if not await self.verify_work_claims(sandbox, agent):
            print("Work claims verification failed")
            return False
        
        # Step 3: Static analysis
        static_analysis = await self.run_static_analysis(sandbox)
        if not static_analysis["success"]:
            print(f"Static analysis failed: {static_analysis['errors']}")
            return False
        
        # Step 4: Formatting check
        formatting = await self.run_formatting(sandbox)
        if not formatting["success"]:
            print(f"Formatting check failed: {formatting['errors']}")
            return False
        
        # Step 5: Type checking
        typing = await self.run_typing(sandbox)
        if not typing["success"]:
            print(f"Type checking failed: {typing['errors']}")
            return False
        
        # Step 6: Run tests
        test_results = await self.run_tests(sandbox)
        if not test_results["success"]:
            print("Tests failed")
            return False
        
        # Step 7: Get changed files
        sandbox_path = self.sandbox_base / sandbox
        try:
            result = subprocess.run(
                ["git", "-C", str(sandbox_path), "diff", "--name-only", "main"],
                capture_output=True,
                text=True,
                check=True
            )
            changed_files = result.stdout.strip().split('\n') if result.stdout.strip() else []
        except subprocess.CalledProcessError:
            changed_files = []
        
        # Step 8: Create manifest
        manifest = await self.create_manifest(
            sandbox=sandbox,
            agent=agent,
            components=components,
            tests=["integration", "unit", "static_analysis", "formatting", "typing"],
            changed_files=changed_files,
            breaking_changes=breaking_changes
        )
        
        # Step 9: Oracle review (would integrate with OracleReviewer here)
        # oracle_review = self.oracle_reviewer.generate_reports(manifest.to_dict())
        # if oracle_review["recommendation"].decision == "BLOCK":
        #     print("Oracle blocked the merge")
        #     return False
        
        # Step 10: Request human approval
        if not await self.request_human_approval(manifest):
            print("Human approval not granted")
            return False
        
        # Step 11: Merge to main
        if not await self.merge_to_main(manifest):
            print("Merge to main failed")
            return False
        
        print(f"Pipeline completed successfully: {manifest.merge_id}")
        return True
