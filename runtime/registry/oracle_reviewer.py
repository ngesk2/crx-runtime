"""
Oracle Reviewer - Read-only architectural review.

Oracle should never produce code.
Oracle should produce:
- architecture_report.md
- risk_report.md
- duplication_report.md
- ownership_conflicts.md
- merge_recommendation.md

Oracle becomes:
- Architect
- Auditor
- Reviewer
- Governor

Not Builder.
"""

import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from dataclasses import dataclass
import subprocess


@dataclass
class ArchitectureReport:
    """Architecture review report."""
    timestamp: str
    components_reviewed: List[str]
    architectural_changes: List[str]
    compliance_score: float
    recommendations: List[str]
    violations: List[str]


@dataclass
class RiskReport:
    """Risk assessment report."""
    timestamp: str
    high_risks: List[str]
    medium_risks: List[str]
    low_risks: List[str]
    overall_risk_level: str
    mitigation_strategies: List[str]


@dataclass
class DuplicationReport:
    """Code duplication report."""
    timestamp: str
    duplicate_blocks: List[Dict[str, Any]]
    duplication_percentage: float
    files_affected: List[str]


@dataclass
class OwnershipConflictReport:
    """Ownership conflict report."""
    timestamp: str
    conflicts: List[Dict[str, Any]]
    resolution_required: bool


@dataclass
class MergeRecommendation:
    """Merge recommendation."""
    timestamp: str
    recommended: bool
    reasons: List[str]
    conditions: List[str]
    confidence: float
    decision: str  # BLOCK, PASS, PASS WITH WARNINGS


@dataclass
class DuplicateReport:
    """Duplicate detection report."""
    timestamp: str
    duplicate_classes: List[Dict[str, Any]]
    duplicate_filenames: List[str]
    duplicate_symbols: List[Dict[str, Any]]
    blocking_issues: List[str]


class OracleReviewer:
    """
    Read-only architectural reviewer.
    
    Analyzes code without modifying it.
    Produces reports for human decision-making.
    """
    
    def __init__(self, repo_path: str, output_dir: str = "runtime/registry/oracle_reports"):
        self.repo_path = Path(repo_path)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def analyze_architecture(self, manifest: Dict[str, Any]) -> ArchitectureReport:
        """
        Analyze architectural changes.
        
        Args:
            manifest: Merge manifest
        
        Returns:
            ArchitectureReport
        """
        components = manifest.get("components", [])
        
        # Analyze each component for architectural compliance
        architectural_changes = []
        violations = []
        recommendations = []
        
        for component in components:
            component_path = self.repo_path / component
            
            if not component_path.exists():
                violations.append(f"Component {component} does not exist")
                continue
            
            # Check for architectural patterns
            if component.startswith("runtime/"):
                # Runtime components should follow specific patterns
                if not (component_path / "__init__.py").exists():
                    violations.append(f"Runtime component {component} missing __init__.py")
                
                recommendations.append(f"Review {component} for kernel compliance")
        
        # Calculate compliance score
        total_checks = len(components) * 2  # 2 checks per component
        passed_checks = total_checks - len(violations)
        compliance_score = passed_checks / total_checks if total_checks > 0 else 0.0
        
        return ArchitectureReport(
            timestamp=datetime.now(timezone.utc).isoformat(),
            components_reviewed=components,
            architectural_changes=architectural_changes,
            compliance_score=compliance_score,
            recommendations=recommendations,
            violations=violations
        )
    
    def assess_risks(self, manifest: Dict[str, Any]) -> RiskReport:
        """
        Assess risks of the merge.
        
        Args:
            manifest: Merge manifest
        
        Returns:
            RiskReport
        """
        breaking_changes = manifest.get("breaking_changes", [])
        components = manifest.get("components", [])
        
        high_risks = []
        medium_risks = []
        low_risks = []
        mitigation_strategies = []
        
        # Assess breaking changes
        for change in breaking_changes:
            high_risks.append(f"Breaking change: {change}")
            mitigation_strategies.append(f"Create migration plan for: {change}")
        
        # Assess component risks
        for component in components:
            if component.startswith("runtime/"):
                medium_risks.append(f"Runtime component change: {component}")
                mitigation_strategies.append(f"Run integration tests for {component}")
            elif component.startswith("kernel/"):
                high_risks.append(f"Kernel component change: {component}")
                mitigation_strategies.append(f"Require architectural review for {component}")
        
        # Determine overall risk level
        if high_risks:
            overall_risk_level = "HIGH"
        elif medium_risks:
            overall_risk_level = "MEDIUM"
        else:
            overall_risk_level = "LOW"
        
        return RiskReport(
            timestamp=datetime.now(timezone.utc).isoformat(),
            high_risks=high_risks,
            medium_risks=medium_risks,
            low_risks=low_risks,
            overall_risk_level=overall_risk_level,
            mitigation_strategies=mitigation_strategies
        )
    
    def detect_duplicates(self, manifest: Dict[str, Any]) -> DuplicateReport:
        """
        Detect duplicates in the codebase.
        
        Args:
            manifest: Merge manifest
        
        Returns:
            DuplicateReport
        """
        duplicate_classes = []
        duplicate_filenames = []
        duplicate_symbols = []
        blocking_issues = []
        
        # Scan all Python files
        python_files = list(self.repo_path.rglob("*.py"))
        
        # Track class definitions
        class_definitions = {}
        for py_file in python_files:
            try:
                with open(py_file, 'r') as f:
                    content = f.read()
                
                # Find class definitions
                import re
                for match in re.finditer(r'^class\s+(\w+)', content, re.MULTILINE):
                    class_name = match.group(1)
                    if class_name not in class_definitions:
                        class_definitions[class_name] = []
                    class_definitions[class_name].append(str(py_file))
            except Exception:
                pass
        
        # Find duplicate classes
        for class_name, files in class_definitions.items():
            if len(files) > 1:
                duplicate_classes.append({
                    "class": class_name,
                    "files": files
                })
                blocking_issues.append(f"Duplicate class definition: {class_name} in {len(files)} files")
        
        # Track filenames
        filename_counts = {}
        for py_file in python_files:
            filename = py_file.name
            if filename not in filename_counts:
                filename_counts[filename] = []
            filename_counts[filename].append(str(py_file.parent))
        
        # Find duplicate filenames
        for filename, paths in filename_counts.items():
            if len(paths) > 1:
                duplicate_filenames.append(filename)
                blocking_issues.append(f"Duplicate filename: {filename} in {len(paths)} directories")
        
        # Track exported symbols (simplified)
        symbol_definitions = {}
        for py_file in python_files:
            try:
                with open(py_file, 'r') as f:
                    content = f.read()
                
                # Find function definitions
                import re
                for match in re.finditer(r'^def\s+(\w+)', content, re.MULTILINE):
                    func_name = match.group(1)
                    if not func_name.startswith('_'):  # Only public symbols
                        if func_name not in symbol_definitions:
                            symbol_definitions[func_name] = []
                        symbol_definitions[func_name].append(str(py_file))
            except Exception:
                pass
        
        # Find duplicate symbols
        for symbol_name, files in symbol_definitions.items():
            if len(files) > 1:
                duplicate_symbols.append({
                    "symbol": symbol_name,
                    "files": files
                })
        
        return DuplicateReport(
            timestamp=datetime.now(timezone.utc).isoformat(),
            duplicate_classes=duplicate_classes,
            duplicate_filenames=duplicate_filenames,
            duplicate_symbols=duplicate_symbols,
            blocking_issues=blocking_issues
        )
    
    def detect_duplication(self, manifest: Dict[str, Any]) -> DuplicationReport:
        """
        Detect code duplication (deprecated - use detect_duplicates).
        
        Args:
            manifest: Merge manifest
        
        Returns:
            DuplicationReport
        """
        changed_files = manifest.get("changed_files", [])
        
        duplicate_blocks = []
        files_affected = []
        
        # Simple duplication detection (would use more sophisticated tools in production)
        for file_path in changed_files:
            full_path = self.repo_path / file_path
            if not full_path.exists() or not full_path.is_file():
                continue
            
            try:
                with open(full_path, 'r') as f:
                    content = f.read()
                
                # Check for obvious patterns (this is simplified)
                if content.count("def ") > 20:
                    duplicate_blocks.append({
                        "file": file_path,
                        "type": "many_functions",
                        "count": content.count("def ")
                    })
                    files_affected.append(file_path)
            except Exception:
                pass
        
        # Calculate duplication percentage (simplified)
        duplication_percentage = len(duplicate_blocks) / len(changed_files) if changed_files else 0.0
        
        return DuplicationReport(
            timestamp=datetime.now(timezone.utc).isoformat(),
            duplicate_blocks=duplicate_blocks,
            duplication_percentage=duplication_percentage,
            files_affected=files_affected
        )
    
    def check_ownership_conflicts(self, manifest: Dict[str, Any], agents_registry: Dict[str, Any]) -> OwnershipConflictReport:
        """
        Check for ownership conflicts.
        
        Args:
            manifest: Merge manifest
            agents_registry: Agent ownership registry
        
        Returns:
            OwnershipConflictReport
        """
        sandbox = manifest.get("sandbox", "")
        components = manifest.get("components", [])
        
        conflicts = []
        
        # Check if sandbox agent owns the components
        for component in components:
            # Determine which agent should own this component
            for agent, agent_data in agents_registry.items():
                owns = agent_data.get("owns", [])
                
                for owned_component in owns:
                    if component.startswith(owned_component):
                        if agent.lower() != sandbox.lower():
                            conflicts.append({
                                "component": component,
                                "expected_owner": agent,
                                "actual_sandbox": sandbox
                            })
        
        resolution_required = len(conflicts) > 0
        
        return OwnershipConflictReport(
            timestamp=datetime.now(timezone.utc).isoformat(),
            conflicts=conflicts,
            resolution_required=resolution_required
        )
    
    def recommend_merge(
        self,
        architecture_report: ArchitectureReport,
        risk_report: RiskReport,
        duplication_report: DuplicationReport,
        ownership_report: OwnershipConflictReport,
        duplicate_report: DuplicateReport
    ) -> MergeRecommendation:
        """
        Recommend whether to merge.
        
        Args:
            architecture_report: Architecture analysis
            risk_report: Risk assessment
            duplication_report: Duplication analysis
            ownership_report: Ownership conflict check
            duplicate_report: Duplicate detection report
        
        Returns:
            MergeRecommendation
        """
        recommended = True
        reasons = []
        conditions = []
        decision = "PASS"
        
        # Check for blocking duplicates first
        if duplicate_report.blocking_issues:
            recommended = False
            decision = "BLOCK"
            reasons.append(f"Blocking duplicates: {len(duplicate_report.blocking_issues)}")
            for issue in duplicate_report.blocking_issues:
                reasons.append(f"  - {issue}")
        
        # Check architecture compliance
        if architecture_report.compliance_score < 0.8:
            recommended = False
            if decision != "BLOCK":
                decision = "BLOCK"
            reasons.append(f"Low compliance score: {architecture_report.compliance_score:.2f}")
        
        if architecture_report.violations:
            recommended = False
            if decision != "BLOCK":
                decision = "BLOCK"
            reasons.append(f"Architecture violations: {len(architecture_report.violations)}")
        
        # Check risk level
        if risk_report.overall_risk_level == "HIGH":
            recommended = False
            if decision != "BLOCK":
                decision = "BLOCK"
            reasons.append("High risk level")
            conditions.append("Mitigate all high risks before merge")
        elif risk_report.overall_risk_level == "MEDIUM":
            if decision == "PASS":
                decision = "PASS WITH WARNINGS"
            conditions.append("Review medium risks")
        
        # Check ownership conflicts
        if ownership_report.resolution_required:
            recommended = False
            if decision != "BLOCK":
                decision = "BLOCK"
            reasons.append("Ownership conflicts detected")
            conditions.append("Resolve ownership conflicts before merge")
        
        # Check duplication
        if duplication_report.duplication_percentage > 0.3:
            if decision == "PASS":
                decision = "PASS WITH WARNINGS"
            conditions.append("Review and reduce code duplication")
        
        # Calculate confidence
        confidence = architecture_report.compliance_score
        
        if risk_report.overall_risk_level == "HIGH":
            confidence *= 0.5
        elif risk_report.overall_risk_level == "MEDIUM":
            confidence *= 0.8
        
        if ownership_report.resolution_required:
            confidence *= 0.5
        
        if duplicate_report.blocking_issues:
            confidence *= 0.0
        
        if recommended and decision == "PASS":
            reasons.append("All checks passed")
        
        return MergeRecommendation(
            timestamp=datetime.now(timezone.utc).isoformat(),
            recommended=recommended,
            reasons=reasons,
            conditions=conditions,
            confidence=confidence,
            decision=decision
        )
    
    def generate_reports(self, manifest: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate all Oracle reports.
        
        Args:
            manifest: Merge manifest
        
        Returns:
            Dictionary of all reports
        """
        # Load agents registry
        agents_registry_path = self.repo_path / "runtime/registry/agents.json"
        agents_registry = {}
        if agents_registry_path.exists():
            with open(agents_registry_path, 'r') as f:
                agents_registry = json.load(f)
        
        # Generate reports
        architecture_report = self.analyze_architecture(manifest)
        risk_report = self.assess_risks(manifest)
        duplicate_report = self.detect_duplicates(manifest)  # New duplicate detection
        duplication_report = self.detect_duplication(manifest)  # Legacy
        ownership_report = self.check_ownership_conflicts(manifest, agents_registry)
        merge_recommendation = self.recommend_merge(
            architecture_report,
            risk_report,
            duplication_report,
            ownership_report,
            duplicate_report
        )
        
        # Save reports
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        
        reports = {
            "architecture": architecture_report,
            "risk": risk_report,
            "duplicates": duplicate_report,  # New
            "duplication": duplication_report,  # Legacy
            "ownership": ownership_report,
            "recommendation": merge_recommendation
        }
        
        for report_name, report in reports.items():
            report_file = self.output_dir / f"{report_name}_{timestamp}.md"
            self._save_report_as_markdown(report, report_file)
        
        return reports
    
    def _save_report_as_markdown(self, report: Any, output_path: Path) -> None:
        """Save report as markdown."""
        with open(output_path, 'w') as f:
            f.write(f"# {report.__class__.__name__}\n\n")
            f.write(f"Generated: {report.timestamp}\n\n")
            
            for field, value in report.__dict__.items():
                if field == "timestamp":
                    continue
                
                f.write(f"## {field.replace('_', ' ').title()}\n\n")
                
                if isinstance(value, list):
                    for item in value:
                        if isinstance(item, dict):
                            f.write(f"- {item}\n")
                        else:
                            f.write(f"- {item}\n")
                elif isinstance(value, float):
                    f.write(f"{value:.2f}\n\n")
                else:
                    f.write(f"{value}\n\n")
