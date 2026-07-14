"""
Oracle - Code review and approval subsystem.

Oracle reviews candidate code and approves/rejects it.
Oracle never executes candidate code.
Oracle never plans execution.
Oracle is purely a verification subsystem.

Constitutional Law 6: Oracle never executes candidate code
Constitutional Law 0: Planning never executes (Oracle does not plan)
Constitutional Law 1: Execution never replans (Oracle does not execute)
"""

from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime, timezone


class OracleDecision(Enum):
    """Decision from Oracle."""
    APPROVED = "approved"
    REJECTED = "rejected"
    REQUIRES_REVIEW = "requires_review"


@dataclass
class OracleReview:
    """Result of Oracle review."""
    review_id: str
    candidate_code_id: str
    decision: OracleDecision
    reviewed_at: str
    reviewed_by: str
    reasoning: str
    security_findings: List[str]
    compliance_findings: List[str]
    metadata: Dict[str, Any]


class Oracle:
    """
    Oracle - Code review and approval subsystem.
    
    Responsibilities:
    - Review candidate code
    - Approve or reject code
    - Identify security issues
    - Identify compliance issues
    
    Oracle NEVER:
    - Executes candidate code (Law 6)
    - Plans execution (Law 0)
    - Makes execution decisions (Law 1)
    
    Oracle is purely a verification subsystem.
    """
    
    def __init__(self):
        self._oracle_id = "oracle_v1"
    
    def review(
        self,
        candidate_code: str,
        context: Optional[Dict[str, Any]] = None
    ) -> OracleReview:
        """
        Review candidate code.
        
        Args:
            candidate_code: Code to review
            context: Additional context (mission_id, capabilities, etc.)
        
        Returns:
            OracleReview with decision
        """
        import uuid
        
        # Perform static analysis (no execution)
        security_findings = self._analyze_security(candidate_code)
        compliance_findings = self._analyze_compliance(candidate_code, context)
        
        # Make decision based on findings
        if security_findings or compliance_findings:
            decision = OracleDecision.REQUIRES_REVIEW
            reasoning = "Security or compliance issues found"
        else:
            decision = OracleDecision.APPROVED
            reasoning = "No issues found"
        
        return OracleReview(
            review_id=str(uuid.uuid4()),
            candidate_code_id=str(uuid.uuid4()),  # Would be hash of code in production
            decision=decision,
            reviewed_at=datetime.now(timezone.utc).isoformat(),
            reviewed_by=self._oracle_id,
            reasoning=reasoning,
            security_findings=security_findings,
            compliance_findings=compliance_findings,
            metadata=context or {}
        )
    
    def _analyze_security(self, code: str) -> List[str]:
        """
        Analyze code for security issues.
        
        This is static analysis only - NO execution.
        """
        findings = []
        
        # Simple pattern matching (no execution)
        dangerous_patterns = [
            "eval(",
            "exec(",
            "subprocess.call(",
            "os.system(",
            "__import__"
        ]
        
        for pattern in dangerous_patterns:
            if pattern in code:
                findings.append(f"Potentially dangerous pattern: {pattern}")
        
        return findings
    
    def _analyze_compliance(self, code: str, context: Optional[Dict[str, Any]]) -> List[str]:
        """
        Analyze code for compliance issues.
        
        This is static analysis only - NO execution.
        """
        findings = []
        
        # Check for compliance with constitutional laws
        # This is a simplified check - in production would be more comprehensive
        
        if context and "capabilities_required" in context:
            # Verify that capabilities are requested
            if not context["capabilities_required"]:
                findings.append("No capabilities requested for code that may need them")
        
        return findings


# Singleton instance
_oracle = Oracle()


def get_oracle() -> Oracle:
    """Get the singleton Oracle."""
    return _oracle
