#!/usr/bin/env python3
"""
Vault Sovereignty Consolidation Scanner
Scans all PING locations for constitutional artifacts
"""

import os
import hashlib
import json
from pathlib import Path
from datetime import datetime
from collections import defaultdict

# Target directories to scan
SCAN_DIRECTORIES = [
    "C:\\Users\\nolan\\Downloads",
    "C:\\Users\\nolan\\Documents",
    "C:\\Users\\nolan\\CascadeProjects",
    "C:\\Users\\nolan\\PING",
]

# File patterns to include
CONSTITUTIONAL_PATTERNS = [
    "*constitutional*",
    "*LAW*",
    "*IDENTITY*",
    "*REPLAY*",
    "*kernel*",
    "*audit*",
    "*runbook*",
    "*capability*",
    "*creator*",
    "*content*",
    "*diagram*",
    "*present*",
    "*operator*",
    "*CONSTITUTION*",
    "*ARCHITECTURE*",
    "*AUTHORITY*",
    "*SOVEREIGNTY*",
    "*MISSION*",
    "*BRAINOS*",
]

# Classification mapping
CLASSIFICATION_MAP = {
    "laws": ["LAW", "CONSTITUTION"],
    "kernel": ["kernel", "KERNEL"],
    "audits": ["audit", "AUDIT"],
    "runbooks": ["runbook", "RUNBOOK", "operator"],
    "capabilities": ["capability", "CAPABILITY"],
    "creator": ["creator", "CREATOR"],
    "content": ["content", "CONTENT"],
    "diagrams": ["diagram", "DIAGRAM", ".d2", ".mmd"],
    "presentations": ["present", "PRESENT", ".pptx"],
    "constitutional": ["constitutional", "CONSTITUTIONAL"],
    "identity": ["IDENTITY"],
    "replay": ["REPLAY"],
    "mission": ["mission", "MISSION"],
    "brainos": ["BRAINOS"],
    "architecture": ["ARCHITECTURE"],
    "authority": ["AUTHORITY"],
    "sovereignty": ["SOVEREIGNTY"],
}

def compute_file_hash(filepath):
    """Compute SHA256 hash of file content."""
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256_hash.update(chunk)
    return sha256_hash.hexdigest()

def classify_file(filepath, filename):
    """Classify file based on patterns."""
    for category, patterns in CLASSIFICATION_MAP.items():
        for pattern in patterns:
            if pattern in filename.upper():
                return category
    return "other"

def scan_directory(directory):
    """Scan directory for constitutional artifacts."""
    artifacts = []
    if not os.path.exists(directory):
        print(f"Directory does not exist: {directory}")
        return artifacts
    
    for root, dirs, files in os.walk(directory):
        for filename in files:
            filepath = os.path.join(root, filename)
            
            # Check if file matches any pattern
            matches = False
            for pattern in CONSTITUTIONAL_PATTERNS:
                if pattern.replace("*", "") in filename.upper():
                    matches = True
                    break
            
            # Also check .md files
            if filename.endswith(".md"):
                matches = True
            
            if matches:
                try:
                    file_hash = compute_file_hash(filepath)
                    file_size = os.path.getsize(filepath)
                    file_mtime = datetime.fromtimestamp(os.path.getmtime(filepath))
                    classification = classify_file(filepath, filename)
                    
                    artifacts.append({
                        "path": filepath,
                        "filename": filename,
                        "hash": file_hash,
                        "size": file_size,
                        "modified": file_mtime.isoformat(),
                        "classification": classification,
                    })
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")
    
    return artifacts

def identify_duplicates(artifacts):
    """Identify duplicate files by hash."""
    hash_map = defaultdict(list)
    for artifact in artifacts:
        hash_map[artifact["hash"]].append(artifact)
    
    duplicates = {h: artifacts for h, artifacts in hash_map.items() if len(artifacts) > 1}
    return duplicates

def find_newest_authority(artifacts):
    """Find newest authority copy for each unique base filename."""
    base_map = defaultdict(list)
    
    for artifact in artifacts:
        # Extract base filename (without path)
        base_name = artifact["filename"]
        base_map[base_name].append(artifact)
    
    authority_map = {}
    for base_name, file_list in base_map.items():
        # Sort by modification time, newest first
        file_list.sort(key=lambda x: x["modified"], reverse=True)
        authority_map[base_name] = file_list[0]
    
    return authority_map

def main():
    """Main scanning function."""
    print("Starting Vault Sovereignty Consolidation Scan...")
    print(f"Scan date: {datetime.now().isoformat()}")
    print()
    
    all_artifacts = []
    
    # Scan all directories
    for directory in SCAN_DIRECTORIES:
        print(f"Scanning: {directory}")
        artifacts = scan_directory(directory)
        print(f"  Found {len(artifacts)} artifacts")
        all_artifacts.extend(artifacts)
    
    print()
    print(f"Total artifacts found: {len(all_artifacts)}")
    
    # Identify duplicates
    duplicates = identify_duplicates(all_artifacts)
    print(f"Duplicate groups found: {len(duplicates)}")
    
    # Find newest authority copies
    authority_map = find_newest_authority(all_artifacts)
    print(f"Unique files (by name): {len(authority_map)}")
    
    # Generate reports
    report = {
        "scan_date": datetime.now().isoformat(),
        "total_artifacts": len(all_artifacts),
        "duplicate_groups": len(duplicates),
        "unique_files": len(authority_map),
        "artifacts": all_artifacts,
        "duplicates": {h: [a["path"] for a in artifacts] for h, artifacts in duplicates.items()},
        "authority_copies": authority_map,
    }
    
    # Save JSON report
    with open("C:\\Users\\nolan\\PING\\RECONSTRUCTION_HASH_MANIFEST.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print()
    print("Report saved to: C:\\Users\\nolan\\PING\\RECONSTRUCTION_HASH_MANIFEST.json")
    
    # Generate markdown report
    generate_markdown_report(report)
    
    print("Markdown report saved to: C:\\Users\\nolan\\PING\\VAULT_RECONSTRUCTION_REPORT.md")
    
    # Generate proposed vault tree
    generate_vault_tree(report)
    
    print("Proposed vault tree saved to: C:\\Users\\nolan\\PING\\PROPOSED_VAULT_TREE.md")

def generate_markdown_report(report):
    """Generate markdown reconstruction report."""
    lines = [
        "# VAULT RECONSTRUCTION REPORT",
        "",
        f"**Scan Date:** {report['scan_date']}",
        f"**Total Artifacts:** {report['total_artifacts']}",
        f"**Duplicate Groups:** {report['duplicate_groups']}",
        f"**Unique Files:** {report['unique_files']}",
        "",
        "---",
        "",
        "## ARTIFACT INVENTORY",
        "",
    ]
    
    # Group by classification
    classification_map = defaultdict(list)
    for artifact in report["artifacts"]:
        classification_map[artifact["classification"]].append(artifact)
    
    for classification, artifacts in sorted(classification_map.items()):
        lines.append(f"### {classification.upper()}")
        lines.append(f"**Count:** {len(artifacts)}")
        lines.append("")
        lines.append("| Path | Hash | Modified | Size |")
        lines.append("|------|------|---------|------|")
        for artifact in artifacts:
            lines.append(f"| {artifact['path']} | {artifact['hash'][:16]}... | {artifact['modified']} | {artifact['size']} |")
        lines.append("")
    
    # Duplicates section
    lines.append("---")
    lines.append("")
    lines.append("## DUPLICATE ANALYSIS")
    lines.append("")
    for hash_value, paths in report["duplicates"].items():
        lines.append(f"### Hash: {hash_value[:16]}...")
        lines.append("")
        for path in paths:
            lines.append(f"- {path}")
        lines.append("")
    
    # Authority copies section
    lines.append("---")
    lines.append("")
    lines.append("## NEWEST AUTHORITY COPIES")
    lines.append("")
    lines.append("| Filename | Authority Path | Hash | Modified |")
    lines.append("|----------|----------------|------|---------|")
    for base_name, artifact in report["authority_copies"].items():
        lines.append(f"| {base_name} | {artifact['path']} | {artifact['hash'][:16]}... | {artifact['modified']} |")
    
    with open("C:\\Users\\nolan\\PING\\VAULT_RECONSTRUCTION_REPORT.md", "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

def generate_vault_tree(report):
    """Generate proposed vault tree structure."""
    lines = [
        "# PROPOSED VAULT TREE",
        "",
        "``",
        "C:\\PING\\vault\\",
        "├── laws\\",
        "├── kernel\\",
        "├── audits\\",
        "├── runbooks\\",
        "├── capabilities\\",
        "├── creator\\",
        "├── content\\",
        "├── diagrams\\",
        "├── presentations\\",
        "├── constitutional\\",
        "├── identity\\",
        "├── replay\\",
        "├── mission\\",
        "├── brainos\\",
        "├── architecture\\",
        "├── authority\\",
        "├── sovereignty\\",
        "└── other\\",
        "",
        "---",
        "",
        "## PROPOSED FILE MAPPINGS",
        "",
    ]
    
    # Group authority copies by classification
    classification_map = defaultdict(list)
    for base_name, artifact in report["authority_copies"].items():
        classification_map[artifact["classification"]].append((base_name, artifact))
    
    for classification, files in sorted(classification_map.items()):
        lines.append(f"### {classification.upper()}")
        lines.append("")
        lines.append("```")
        for base_name, artifact in files:
            dest = f"C:\\PING\\vault\\{classification}\\{base_name}"
            lines.append(f"{artifact['path']} -> {dest}")
        lines.append("```")
        lines.append("")
    
    with open("C:\\Users\\nolan\\PING\\PROPOSED_VAULT_TREE.md", "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

if __name__ == "__main__":
    main()
