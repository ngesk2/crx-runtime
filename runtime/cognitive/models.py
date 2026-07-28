"""
Constitutional Cognitive Runtime — Data Models
Defines all structured types for the constitutional reasoning pipeline.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum
import json
import hashlib
from datetime import datetime


class ConstitutionalViolation(Exception):
    """Base exception for constitutional enforcement failures."""
    pass


class AuthorityResolutionFailure(ConstitutionalViolation):
    """Raised when no governing authority can be resolved for a question."""
    def __init__(self, question: str, reason: str = "No governing authority found"):
        self.question = question
        self.reason = reason
        super().__init__(f"AuthorityResolutionFailure: {reason} for question: {question[:80]}")


class ContextPackViolation(ConstitutionalViolation):
    """Raised when a Context Pack fails validation."""
    def __init__(self, violations: list):
        self.violations = violations
        super().__init__(f"ContextPackViolation: {'; '.join(violations)}")


class ProjectionSovereigntyViolation(ConstitutionalViolation):
    """Raised when a projection is used without verification."""
    def __init__(self, projection_id: str, reason: str = "Unverified projection"):
        self.projection_id = projection_id
        self.reason = reason
        super().__init__(f"ProjectionSovereigntyViolation: {reason} for projection: {projection_id}")


class AuthorityClass(str, Enum):
    CONSTITUTIONAL_LAW = "CONSTITUTIONAL_LAW"
    CANONICAL_SPEC = "CANONICAL_SPEC"
    CREATOR_RESEARCH = "CREATOR_RESEARCH"
    CREATOR_NOTES = "CREATOR_NOTES"
    IMPORTED_DOCUMENT = "IMPORTED_DOCUMENT"
    REPOSITORY_DOCUMENTATION = "REPOSITORY_DOCUMENTATION"
    SCRIPT = "SCRIPT"
    SUMMARY = "SUMMARY"
    AI_GENERATED_ANALYSIS = "AI_GENERATED_ANALYSIS"
    TEMPORARY_OBSERVATION = "TEMPORARY_OBSERVATION"


AUTHORITY_HIERARCHY = {cls: idx for idx, cls in enumerate(AuthorityClass)}


class WorkerRole(str, Enum):
    SEARCH = "search_worker"
    CONTRADICTION = "contradiction_worker"
    ARCHITECTURE = "architecture_worker"
    MEMORY = "memory_worker"
    SUPERVISOR = "supervisor"


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class AuthorityResolution:
    highest_authority: Dict[str, Any] = field(default_factory=dict)
    authority_class: Optional[str] = None
    authority_chain: List[Dict[str, Any]] = field(default_factory=list)
    supersession_chain: List[str] = field(default_factory=list)
    verification: Dict[str, bool] = field(default_factory=lambda: {
        "artifact_hash_verified": False,
        "event_hash_verified": False,
        "lineage_intact": False,
        "witness_present": False,
        "projection_valid": False,
        "overall": False
    })

    def to_dict(self) -> Dict[str, Any]:
        return {
            "highest_authority": self.highest_authority,
            "authority_class": self.authority_class,
            "authority_chain": self.authority_chain,
            "supersession_chain": self.supersession_chain,
            "verification": self.verification
        }


@dataclass
class ContextPack:
    question: str = ""
    highest_authority: Dict[str, Any] = field(default_factory=dict)
    authority_chain: List[Dict[str, Any]] = field(default_factory=list)
    authority_resolution: Optional[AuthorityResolution] = None
    lineage: List[Dict[str, Any]] = field(default_factory=list)
    supporting_documents: List[Dict[str, Any]] = field(default_factory=list)
    supporting_claims: List[Dict[str, Any]] = field(default_factory=list)
    contradictions: List[Dict[str, Any]] = field(default_factory=list)
    citations: List[Dict[str, Any]] = field(default_factory=list)
    witness_roots: List[str] = field(default_factory=list)
    confidence: float = 0.0
    graph_expansion: Dict[str, Any] = field(default_factory=dict)
    repository_symbols: List[Dict[str, Any]] = field(default_factory=list)
    repository_relationships: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        d = {
            "question": self.question,
            "highest_authority": self.highest_authority,
            "authority_chain": self.authority_chain,
            "lineage": self.lineage,
            "supporting_documents": self.supporting_documents,
            "supporting_claims": self.supporting_claims,
            "contradictions": self.contradictions,
            "citations": self.citations,
            "witness_roots": self.witness_roots,
            "confidence": self.confidence,
            "graph_expansion": self.graph_expansion,
            "repository_symbols": self.repository_symbols,
            "repository_relationships": self.repository_relationships
        }
        if self.authority_resolution:
            d["authority_resolution"] = {
                "highest_authority": self.authority_resolution.highest_authority,
                "authority_class": self.authority_resolution.authority_class,
                "authority_chain": self.authority_resolution.authority_chain,
                "supersession_chain": self.authority_resolution.supersession_chain,
                "verification": self.authority_resolution.verification
            }
        return d

    def query_hash(self) -> str:
        return hashlib.sha256(self.question.encode('utf-8')).hexdigest()[:16]


@dataclass
class WorkerTask:
    task_id: str
    worker: str
    objective: str
    constraints: Dict[str, Any] = field(default_factory=dict)
    context: Dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "worker": self.worker,
            "objective": self.objective,
            "constraints": self.constraints,
            "context": self.context,
            "created_at": self.created_at
        }


@dataclass
class WorkerResponse:
    task_id: str
    worker: str
    findings: List[Dict[str, Any]]
    confidence: float = 0.0
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "worker": self.worker,
            "findings": self.findings,
            "confidence": self.confidence,
            "error": self.error,
            "metadata": self.metadata
        }


@dataclass
class ReasoningPlan:
    plan_id: str
    question: str
    steps: List[Dict[str, Any]]
    worker_assignments: List[WorkerTask]
    status: TaskStatus = TaskStatus.PENDING
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "plan_id": self.plan_id,
            "question": self.question,
            "steps": self.steps,
            "worker_assignments": [t.to_dict() for t in self.worker_assignments],
            "status": self.status.value,
            "created_at": self.created_at
        }
