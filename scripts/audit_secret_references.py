#!/usr/bin/env python3
"""
Secret Reference Audit Script

Scans the repository for potential secret references including:
- private-key.pem
- .pem files
- token references
- apikey references
- secret references
- password references
- postgres:// connections
- postgresql:// connections
- localhost credentials
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Tuple
import json

# Secret patterns to search for
SECRET_PATTERNS = [
    (r'private-key\.pem', 'CRITICAL', 'Private key file reference'),
    (r'\.pem', 'HIGH', 'PEM file reference'),
    (r'token\s*=\s*["\']([^"\']+)["\']', 'CRITICAL', 'Hardcoded token'),
    (r'apikey\s*=\s*["\']([^"\']+)["\']', 'CRITICAL', 'Hardcoded API key'),
    (r'api_key\s*=\s*["\']([^"\']+)["\']', 'CRITICAL', 'Hardcoded API key'),
    (r'secret\s*=\s*["\']([^"\']+)["\']', 'CRITICAL', 'Hardcoded secret'),
    (r'password\s*=\s*["\']([^"\']+)["\']', 'HIGH', 'Hardcoded password'),
    (r'passwd\s*=\s*["\']([^"\']+)["\']', 'HIGH', 'Hardcoded password'),
    (r'postgres://[^@]+:[^@]+@', 'CRITICAL', 'PostgreSQL connection string with credentials'),
    (r'postgresql://[^@]+:[^@]+@', 'CRITICAL', 'PostgreSQL connection string with credentials'),
    (r'localhost:[^:]+:[^@]+', 'HIGH', 'Localhost credentials'),
]

# Files to exclude from audit
EXCLUDE_DIRS = [
    '.git',
    '__pycache__',
    'node_modules',
    '.venv',
    'venv',
    'env',
    'secrets',
    '.pytest_cache',
    '.mypy_cache',
    'dist',
    'build',
]

# File extensions to include
INCLUDE_EXTENSIONS = [
    '.py',
    '.js',
    '.ts',
    '.json',
    '.yaml',
    '.yml',
    '.env',
    '.md',
    '.txt',
    '.sh',
    '.bat',
    '.ps1',
]


def find_files(root_dir: Path) -> List[Path]:
    """Find all files to audit"""
    files = []
    try:
        for file_path in root_dir.rglob('*'):
            # Skip excluded directories
            if any(exclude_dir in file_path.parts for exclude_dir in EXCLUDE_DIRS):
                continue
            
            # Skip if not a file
            if not file_path.is_file():
                continue
            
            # Skip if extension not included
            if file_path.suffix not in INCLUDE_EXTENSIONS:
                continue
            
            files.append(file_path)
    except (FileNotFoundError, PermissionError) as e:
        print(f"Warning: Could not access some directories: {e}")
    
    return files


def audit_file(file_path: Path, root_dir: Path) -> List[Dict]:
    """Audit a single file for secret references"""
    findings = []
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            lines = content.split('\n')
        
        for pattern, severity, description in SECRET_PATTERNS:
            for line_num, line in enumerate(lines, 1):
                if re.search(pattern, line, re.IGNORECASE):
                    findings.append({
                        'file': str(file_path.relative_to(root_dir)),
                        'line': line_num,
                        'pattern': pattern,
                        'severity': severity,
                        'description': description,
                        'content': line.strip()
                    })
    
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
    
    return findings


def generate_report(findings: List[Dict], output_path: Path):
    """Generate audit report"""
    # Group by severity
    by_severity = {}
    for finding in findings:
        severity = finding['severity']
        if severity not in by_severity:
            by_severity[severity] = []
        by_severity[severity].append(finding)
    
    # Generate markdown report
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('# Secret Audit Report\n\n')
        f.write(f'**Generated:** {os.popen("date").read().strip()}\n')
        f.write(f'**Total Findings:** {len(findings)}\n\n')
        
        # Summary
        f.write('## Summary\n\n')
        for severity in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']:
            count = len(by_severity.get(severity, []))
            f.write(f'- **{severity}:** {count}\n')
        f.write('\n')
        
        # Findings by severity
        for severity in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']:
            if severity not in by_severity:
                continue
            
            f.write(f'## {severity} Findings\n\n')
            f.write('| File | Line | Pattern | Description | Content |\n')
            f.write('|------|------|---------|-------------|---------|\n')
            
            for finding in by_severity[severity]:
                f.write(f"| {finding['file']} | {finding['line']} | `{finding['pattern']}` | {finding['description']} | `{finding['content'][:50]}...` |\n")
            
            f.write('\n')
        
        # Recommendations
        f.write('## Recommendations\n\n')
        f.write('### For CRITICAL Findings\n')
        f.write('- Remove hardcoded secrets immediately\n')
        f.write('- Replace with environment variable references\n')
        f.write('- Rotate any exposed secrets\n')
        f.write('- Update documentation\n\n')
        
        f.write('### For HIGH Findings\n')
        f.write('- Review and replace with environment variables\n')
        f.write('- Ensure no credentials in version control\n')
        f.write('- Update secret management documentation\n\n')
        
        f.write('### For MEDIUM/LOW Findings\n')
        f.write('- Review for false positives\n')
        f.write('- Update if actual secrets found\n')
        f.write('- Add to exclusion list if benign\n\n')
    
    print(f"Audit report generated: {output_path}")


def main():
    """Main execution"""
    # Get root directory
    root_dir = Path(__file__).parent.parent
    print(f"Auditing directory: {root_dir}")
    
    # Find files to audit
    print("Finding files to audit...")
    files = find_files(root_dir)
    print(f"Found {len(files)} files to audit")
    
    # Audit files
    print("Auditing files for secret references...")
    all_findings = []
    for file_path in files:
        findings = audit_file(file_path, root_dir)
        all_findings.extend(findings)
    
    print(f"Found {len(all_findings)} secret references")
    
    # Generate report
    output_path = root_dir / 'docs' / 'security' / 'SECRET_AUDIT.md'
    output_path.parent.mkdir(parents=True, exist_ok=True)
    generate_report(all_findings, output_path)
    
    # Print summary
    print("\nSummary:")
    by_severity = {}
    for finding in all_findings:
        severity = finding['severity']
        if severity not in by_severity:
            by_severity[severity] = []
        by_severity[severity].append(finding)
    
    for severity in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']:
        count = len(by_severity.get(severity, []))
        print(f"  {severity}: {count}")


if __name__ == '__main__':
    main()
