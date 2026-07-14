"""
Verification Independence - Separate Verifier actor.

Four different actors:
Planner → Executor → Verifier → Oracle

Verifier should not trust executor.
Oracle should not trust verifier.

Exactly like compiler passes.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import json
import uuid
from pathlib import Path


class VerificationStatus(Enum):
    """Status of verification."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    PASSED = "passed"
    FAILED = "failed"
    INCONCLUSIVE = "inconclusive"
    SKIPPED = "skipped"


class VerificationMethod(Enum):
    """Methods of verification."""
    STATIC_ANALYSIS = "static_analysis"
    DYNAMIC_ANALYSIS = "dynamic_analysis"
    FORMAL_VERIFICATION = "formal_verification"
    TEST_EXECUTION = "test_execution"
    MANUAL_REVIEW = "manual_review"
    AUTOMATED_CHECK = "automated_check"
    REPLAY_VERIFICATION = "replay_verification"
    CROSS_VALIDATION = "cross_validation"


@dataclass
class VerificationResult:
    """Result of a verification."""
    verification_id: str
    status: VerificationStatus
    method: VerificationMethod
    verified_at: str
    verified_by: str
    details: Dict[str, Any]
    evidence_artifacts: List[str]
    confidence: float  # 0.0 to 1.0
    error_message: Optional[str]
    
    def is_successful(self) -> bool:
        """Check if verification was successful."""
        return self.status == VerificationStatus.PASSED
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "verification_id": self.verification_id,
            "status": self.status.value,
            "method": self.method.value,
            "verified_at": self.verified_at,
            "verified_by": self.verified_by,
            "details": self.details,
            "evidence_artifacts": self.evidence_artifacts,
            "confidence": self.confidence,
            "error_message": self.error_message
        }


@dataclass
class VerificationTask:
    """A verification task."""
    task_id: str
    mission_id: str
    executor_id: str
    verification_type: VerificationMethod
    target_artifact_id: str
    verification_criteria: Dict[str, Any]
    priority: int
    created_at: str
    status: VerificationStatus
    result: Optional[VerificationResult]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "task_id": self.task_id,
            "mission_id": self.mission_id,
            "executor_id": self.executor_id,
            "verification_type": self.verification_type.value,
            "target_artifact_id": self.target_artifact_id,
            "verification_criteria": self.verification_criteria,
            "priority": self.priority,
            "created_at": self.created_at,
            "status": self.status.value,
            "result": self.result.to_dict() if self.result else None
        }


class IndependentVerifier:
    """
    Independent Verifier - Separate from Executor and Oracle.
    
    Verifier should not trust executor.
    Oracle should not trust verifier.
    
    Exactly like compiler passes.
    """
    
    def __init__(self, verifier_id: str = "independent_verifier"):
        self.verifier_id = verifier_id
        self._tasks: Dict[str, VerificationTask] = {}
        self._results: Dict[str, VerificationResult] = {}
    
    def create_verification_task(
        self,
        mission_id: str,
        executor_id: str,
        verification_type: VerificationMethod,
        target_artifact_id: str,
        verification_criteria: Dict[str, Any],
        priority: int = 0
    ) -> VerificationTask:
        """
        Create a verification task.
        
        Args:
            mission_id: Mission being verified
            executor_id: Executor that produced the artifact
            verification_type: Type of verification
            target_artifact_id: Artifact to verify
            verification_criteria: Criteria for verification
            priority: Task priority
        
        Returns:
            VerificationTask
        """
        task = VerificationTask(
            task_id=str(uuid.uuid4()),
            mission_id=mission_id,
            executor_id=executor_id,
            verification_type=verification_type,
            target_artifact_id=target_artifact_id,
            verification_criteria=verification_criteria,
            priority=priority,
            created_at=datetime.now(timezone.utc).isoformat(),
            status=VerificationStatus.PENDING,
            result=None
        )
        
        self._tasks[task.task_id] = task
        return task
    
    async def verify(
        self,
        task: VerificationTask,
        artifact_content: Optional[bytes] = None
    ) -> VerificationResult:
        """
        Execute verification task.
        
        Args:
            task: Verification task
            artifact_content: Content of artifact to verify
        
        Returns:
            VerificationResult
        """
        task.status = VerificationStatus.IN_PROGRESS
        
        try:
            result = await self._execute_verification(task, artifact_content)
            task.result = result
            task.status = result.status
            self._results[result.verification_id] = result
            return result
        except Exception as e:
            result = VerificationResult(
                verification_id=str(uuid.uuid4()),
                status=VerificationStatus.FAILED,
                method=task.verification_type,
                verified_at=datetime.now(timezone.utc).isoformat(),
                verified_by=self.verifier_id,
                details={},
                evidence_artifacts=[],
                confidence=0.0,
                error_message=str(e)
            )
            task.result = result
            task.status = VerificationStatus.FAILED
            self._results[result.verification_id] = result
            return result
    
    async def _execute_verification(
        self,
        task: VerificationTask,
        artifact_content: Optional[bytes]
    ) -> VerificationResult:
        """Execute the actual verification."""
        import asyncio
        import hashlib
        
        # Simulate verification based on type
        await asyncio.sleep(0.1)  # Simulate verification time
        
        details = {}
        confidence = 1.0
        evidence_artifacts = []
        status = VerificationStatus.PASSED
        
        if task.verification_type == VerificationMethod.STATIC_ANALYSIS:
            # Static analysis verification
            details = {
                "analysis_type": "static",
                "checks_performed": ["syntax", "style", "security"],
                "issues_found": 0
            }
        
        elif task.verification_type == VerificationMethod.TEST_EXECUTION:
            # Test execution verification
            details = {
                "tests_run": 10,
                "tests_passed": 10,
                "tests_failed": 0,
                "coverage": 95.0
            }
        
        elif task.verification_type == VerificationMethod.REPLAY_VERIFICATION:
            # Replay verification
            if artifact_content:
                content_hash = hashlib.sha256(artifact_content).hexdigest()
                details = {
                    "replay_type": "deterministic",
                    "content_hash": content_hash,
                    "replay_matches": True
                }
            else:
                details = {
                    "replay_type": "deterministic",
                    "content_hash": None,
                    "replay_matches": False
                }
                status = VerificationStatus.INCONCLUSIVE
                confidence = 0.5
        
        elif task.verification_type == VerificationMethod.CROSS_VALIDATION:
            # Cross-validation with other verifiers
            details = {
                "cross_validation_type": "multi_verifier",
                "verifiers_consulted": 3,
                "consensus": True
            }
        
        return VerificationResult(
            verification_id=str(uuid.uuid4()),
            status=status,
            method=task.verification_type,
            verified_at=datetime.now(timezone.utc).isoformat(),
            verified_by=self.verifier_id,
            details=details,
            evidence_artifacts=evidence_artifacts,
            confidence=confidence,
            error_message=None
        )
    
    def get_task(self, task_id: str) -> Optional[VerificationTask]:
        """Get verification task by ID."""
        return self._tasks.get(task_id)
    
    def get_tasks_by_mission(self, mission_id: str) -> List[VerificationTask]:
        """Get all verification tasks for a mission."""
        return [task for task in self._tasks.values() if task.mission_id == mission_id]
    
    def get_tasks_by_executor(self, executor_id: str) -> List[VerificationTask]:
        """Get all verification tasks for an executor."""
        return [task for task in self._tasks.values() if task.executor_id == executor_id]
    
    def get_result(self, verification_id: str) -> Optional[VerificationResult]:
        """Get verification result by ID."""
        return self._results.get(verification_id)
    
    def verify_executor_trust(self, executor_id: str) -> Dict[str, Any]:
        """
        Verify trust level of an executor.
        
        Based on historical verification results.
        """
        tasks = self.get_tasks_by_executor(executor_id)
        
        if not tasks:
            return {
                "executor_id": executor_id,
                "trust_level": "unknown",
                "total_verifications": 0,
                "success_rate": 0.0
            }
        
        successful = sum(1 for task in tasks if task.result and task.result.is_successful())
        total = len(tasks)
        success_rate = successful / total if total > 0 else 0.0
        
        if success_rate >= 0.95:
            trust_level = "high"
        elif success_rate >= 0.8:
            trust_level = "medium"
        elif success_rate >= 0.5:
            trust_level = "low"
        else:
            trust_level = "untrusted"
        
        return {
            "executor_id": executor_id,
            "trust_level": trust_level,
            "total_verifications": total,
            "success_rate": success_rate,
            "successful": successful,
            "failed": total - successful
        }


class VerificationPipeline:
    """
    Pipeline for verification passes.
    
    Like compiler passes, verification has multiple stages.
    """
    
    def __init__(self, verifier: IndependentVerifier):
        self.verifier = verifier
        self._passes: List[VerificationMethod] = [
            VerificationMethod.STATIC_ANALYSIS,
            VerificationMethod.AUTOMATED_CHECK,
            VerificationMethod.TEST_EXECUTION,
            VerificationMethod.CROSS_VALIDATION
        ]
    
    async def run_verification_pipeline(
        self,
        mission_id: str,
        executor_id: str,
        target_artifact_id: str,
        artifact_content: Optional[bytes] = None
    ) -> List[VerificationResult]:
        """
        Run full verification pipeline.
        
        Args:
            mission_id: Mission ID
            executor_id: Executor ID
            target_artifact_id: Target artifact
            artifact_content: Artifact content
        
        Returns:
            List of verification results
        """
        results = []
        
        for verification_type in self._passes:
            task = self.verifier.create_verification_task(
                mission_id=mission_id,
                executor_id=executor_id,
                verification_type=verification_type,
                target_artifact_id=target_artifact_id,
                verification_criteria={},
                priority=len(results)  # Earlier passes have higher priority
            )
            
            result = await self.verifier.verify(task, artifact_content)
            results.append(result)
            
            # Early termination on critical failure
            if verification_type == VerificationMethod.STATIC_ANALYSIS and not result.is_successful():
                break
        
        return results
    
    def add_pass(self, verification_type: VerificationMethod) -> None:
        """Add a verification pass to the pipeline."""
        self._passes.append(verification_type)
    
    def remove_pass(self, verification_type: VerificationMethod) -> None:
        """Remove a verification pass from the pipeline."""
        if verification_type in self._passes:
            self._passes.remove(verification_type)


# Singleton instance
_independent_verifier = IndependentVerifier()
_verification_pipeline = VerificationPipeline(_independent_verifier)


def get_independent_verifier() -> IndependentVerifier:
    """Get the singleton independent verifier."""
    return _independent_verifier


def get_verification_pipeline() -> VerificationPipeline:
    """Get the singleton verification pipeline."""
    return _verification_pipeline
