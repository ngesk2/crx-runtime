#!/usr/bin/env python3
r"""
Hardcoded Path Audit Script

Scans the repository for hardcoded machine-specific paths including:
- C:\Users\nolan
- Downloads
- Desktop
- Documents
- Any machine-specific filesystem paths
"""

import os
import re
from pathlib import Path
from typing import List, Dict

# Hardcoded path patterns to search for
HARDCODED_PATH_PATTERNS = [
    (r'C:\\Users\\nolan', 'CRITICAL', 'User-specific path'),
    (r'C:\\Users\\[^\\]+', 'HIGH', 'User-specific path'),
    (r'/home/[^/]+', 'HIGH', 'User-specific path'),
    (r'/Users/[^/]+', 'HIGH', 'User-specific path'),
    (r'Downloads', 'MEDIUM', 'Downloads directory'),
    (r'Desktop', 'MEDIUM', 'Desktop directory'),
    (r'Documents', 'MEDIUM', 'Documents directory'),
    (r'C:\\Windows', 'LOW', 'Windows system path'),
    (r'/tmp', 'LOW', 'Temporary directory'),
    (r'C:\\Temp', 'LOW', 'Temporary directory'),
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
    """Audit a single file for hardcoded paths"""
    findings = []
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            lines = content.split('\n')
        
        for pattern, severity, description in HARDCODED_PATH_PATTERNS:
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
        f.write('# Hardcoded Path Audit Report\n\n')
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
        f.write('- Replace user-specific paths with environment variables\n')
        f.write('- Use repository-relative paths where possible\n')
        f.write('- Update documentation to use portable paths\n\n')
        
        f.write('### For HIGH Findings\n')
        f.write('- Review for actual user-specific paths\n')
        f.write('- Replace with environment variables or relative paths\n')
        f.write('- Ensure cross-platform compatibility\n\n')
        
        f.write('### For MEDIUM/LOW Findings\n')
        f.write('- Review for false positives\n')
        f.write('- Update if actual hardcoded paths found\n')
        f.write('- Add to exclusion list if benign\n\n')
        
        f.write('## Portable Path Patterns\n\n')
        f.write('### Environment Variables\n')
        f.write('```python\n')
        f.write('# Instead of:\n')
        f.write('path = "C:\\\\Users\\\\nolan\\\\PING"\n\n')
        f.write('# Use:\n')
        f.write('import os\n')
        f.write('path = os.getenv("PING_ROOT", os.path.expanduser("~/PING"))\n')
        f.write('```\n\n')
        
        f.write('### Repository-Relative Paths\n')
        f.write('```python\n')
        f.write('# Instead of:\n')
        f.write('path = "C:\\\\Users\\\\nolan\\\\PING\\\\data"\n\n')
        f.write('# Use:\n')
        f.write('from pathlib import Path\n')
        f.write('path = Path(__file__).parent.parent / "data"\n')
        f.write('```\n\n')
        
        f.write('### Cross-Platform Paths\n')
        f.write('```python\n')
        f.write('# Instead of:\n')
        f.write('path = "C:\\\\Temp"\n\n')
        f.write('# Use:\n')
        f.write('import tempfile\n')
        f.write('path = tempfile.gettempdir()\n')
        f.write('```\n\n')
    
    print(f"Audit report generated: {output_path}")


def main():
    """Main execution"""
    # Get root directory
    global root_dir
    root_dir = Path(__file__).parent.parent
    print(f"Auditing directory: {root_dir}")
    
    # Find files to audit
    print("Finding files to audit...")
    files = find_files(root_dir)
    print(f"Found {len(files)} files to audit")
    
    # Audit files
    print("Auditing files for hardcoded paths...")
    all_findings = []
    for file_path in files:
        findings = audit_file(file_path, root_dir)
        all_findings.extend(findings)
    
    print(f"Found {len(all_findings)} hardcoded path references")
    
    # Generate report
    output_path = root_dir / 'docs' / 'security' / 'HARDCODED_PATH_AUDIT.md'
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
