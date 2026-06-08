#!/usr/bin/env python3
"""
CRX Workspace Indexer

Scans all files in the repository and generates:
1. File inventory with type classification
2. Dependency graph
3. Workspace graph
4. Authority classification
"""

import os
import json
import re
from pathlib import Path
from typing import Dict, List, Set, Tuple
from collections import defaultdict
from datetime import datetime


class CRXWorkspaceIndexer:
    def __init__(self, root_path: str):
        self.root_path = Path(root_path)
        self.files = []
        self.file_types = {
            'Runtime': ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.py', '.go', '.rs', '.java'],
            'Library': ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs'],
            'Interface': ['.json', '.yaml', '.yml', '.proto', '.graphql', '.xsd'],
            'Infrastructure': ['.dockerfile', 'Dockerfile', '.sh', '.bash', '.ps1', 'Makefile', 'docker-compose.yml', 'docker-compose.yaml'],
            'Documentation': ['.md', '.txt', '.rst', '.adoc'],
            'Governance': ['.md'],  # Will be refined by content analysis
            'Schema': ['.json', '.yaml', '.yml']
        }
        self.dependency_graph = defaultdict(set)
        self.workspace_graph = {
            'nodes': [],
            'edges': []
        }
        self.authority_map = {}
        
    def scan_files(self):
        """Scan all files in the repository"""
        for root, dirs, files in os.walk(self.root_path):
            # Skip hidden directories and common exclusions
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', '__pycache__', 'venv', '.git']]
            
            for file in files:
                if not file.startswith('.'):
                    file_path = Path(root) / file
                    relative_path = file_path.relative_to(self.root_path)
                    self.files.append({
                        'path': str(relative_path),
                        'absolute_path': str(file_path),
                        'size': file_path.stat().st_size,
                        'extension': file_path.suffix.lower(),
                        'modified': datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
                    })
    
    def classify_file_type(self, file_info: Dict) -> str:
        """Classify file by type"""
        ext = file_info['extension']
        path = file_info['path'].lower()
        
        # Infrastructure files
        if ext in ['.sh', '.bash', '.ps1'] or file_info['path'] in ['Makefile', 'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml']:
            return 'Infrastructure'
        
        # Schema files
        if 'schema' in path or ext in ['.json', '.yaml', '.yml']:
            if 'schema' in path:
                return 'Schema'
            return 'Interface'
        
        # Runtime files
        if ext in ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.py', '.go', '.rs', '.java']:
            # Check if it's a library vs runtime
            if 'lib' in path or 'utils' in path or 'helper' in path or 'common' in path:
                return 'Library'
            return 'Runtime'
        
        # Documentation vs Governance
        if ext in ['.md', '.txt', '.rst', '.adoc']:
            governance_keywords = [
                'constitution', 'governance', 'audit', 'authority', 'policy',
                'compliance', 'security', 'threat', 'verdict', 'reconstruction',
                'primitive', 'mutation', 'lifecycle', 'protocol', 'decision'
            ]
            if any(keyword in path for keyword in governance_keywords):
                return 'Governance'
            return 'Documentation'
        
        return 'Unknown'
    
    def classify_authority(self, file_info: Dict, file_type: str) -> str:
        """Classify file by authority level"""
        path = file_info['path'].lower()
        
        # Experimental files
        if 'experimental' in path or 'sandbox' in path or 'test' in path or 'draft' in path:
            return 'Experimental'
        
        # Derived files
        if file_type in ['Documentation', 'Governance'] and 'audit' in path:
            return 'Derived'
        
        if file_type == 'Governance':
            return 'Authoritative'
        
        # Schema files are authoritative
        if file_type == 'Schema':
            return 'Authoritative'
        
        # Default to derived for now
        return 'Derived'
    
    def detect_dead_files(self) -> List[str]:
        """Detect potentially dead/unreferenced files"""
        # This is a simplified version - a full implementation would:
        # 1. Parse all imports/references
        # 2. Build reference graph
        # 3. Identify unreferenced files
        return []
    
    def extract_dependencies(self, file_info: Dict) -> List[str]:
        """Extract dependencies from a file"""
        dependencies = []
        path = file_info['path']
        ext = file_info['extension']
        
        # For markdown files, extract [[wiki links]] or [markdown links]
        if ext == '.md':
            try:
                with open(file_info['absolute_path'], 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Extract markdown links
                    links = re.findall(r'\[([^\]]+)\]\(([^)]+)\)', content)
                    for _, link in links:
                        if not link.startswith('http'):
                            dependencies.append(link)
                    # Extract wiki-style links
                    wiki_links = re.findall(r'\[\[([^\]]+)\]\]', content)
                    dependencies.extend(wiki_links)
            except Exception as e:
                pass
        
        # For code files, extract imports
        elif ext in ['.ts', '.tsx', '.js', '.jsx', '.mjs']:
            try:
                with open(file_info['absolute_path'], 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Extract import statements
                    imports = re.findall(r'import.*from\s+[\'"]([^\'"]+)[\'"]', content)
                    dependencies.extend(imports)
                    # Extract require statements
                    requires = re.findall(r'require\([\'"]([^\'"]+)[\'"]\)', content)
                    dependencies.extend(requires)
            except Exception as e:
                pass
        
        # For Python files
        elif ext == '.py':
            try:
                with open(file_info['absolute_path'], 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Extract import statements
                    imports = re.findall(r'^import\s+(\S+)', content, re.MULTILINE)
                    dependencies.extend(imports)
                    from_imports = re.findall(r'^from\s+(\S+)\s+import', content, re.MULTILINE)
                    dependencies.extend(from_imports)
            except Exception as e:
                pass
        
        return dependencies
    
    def build_dependency_graph(self):
        """Build dependency graph from all files"""
        for file_info in self.files:
            dependencies = self.extract_dependencies(file_info)
            for dep in dependencies:
                self.dependency_graph[file_info['path']].add(dep)
    
    def build_workspace_graph(self):
        """Build workspace graph with nodes and edges"""
        # Add file nodes
        for file_info in self.files:
            self.workspace_graph['nodes'].append({
                'id': file_info['path'],
                'type': 'file',
                'file_type': file_info.get('classified_type', 'Unknown'),
                'authority': file_info.get('authority', 'Derived'),
                'size': file_info['size']
            })
        
        # Add folder nodes
        folders = set()
        for file_info in self.files:
            folder_path = str(Path(file_info['path']).parent)
            if folder_path != '.':
                folders.add(folder_path)
        
        for folder in folders:
            self.workspace_graph['nodes'].append({
                'id': folder,
                'type': 'folder'
            })
        
        # Add dependency edges
        for source, targets in self.dependency_graph.items():
            for target in targets:
                self.workspace_graph['edges'].append({
                    'source': source,
                    'target': target,
                    'type': 'imports'
                })
    
    def generate_inventory(self) -> Dict:
        """Generate complete inventory"""
        inventory = {
            'metadata': {
                'generated_at': datetime.now().isoformat(),
                'root_path': str(self.root_path),
                'total_files': len(self.files)
            },
            'files': [],
            'summary': {
                'by_type': defaultdict(int),
                'by_authority': defaultdict(int),
                'by_extension': defaultdict(int)
            },
            'dependency_graph': dict(self.dependency_graph),
            'workspace_graph': self.workspace_graph,
            'dead_files': self.detect_dead_files(),
            'entry_points': []
        }
        
        for file_info in self.files:
            file_type = self.classify_file_type(file_info)
            authority = self.classify_authority(file_info, file_type)
            
            file_info['classified_type'] = file_type
            file_info['authority'] = authority
            file_info['dependencies'] = list(self.dependency_graph.get(file_info['path'], []))
            
            inventory['files'].append(file_info)
            inventory['summary']['by_type'][file_type] += 1
            inventory['summary']['by_authority'][authority] += 1
            inventory['summary']['by_extension'][file_info['extension']] += 1
        
        # Convert defaultdicts to regular dicts
        inventory['summary']['by_type'] = dict(inventory['summary']['by_type'])
        inventory['summary']['by_authority'] = dict(inventory['summary']['by_authority'])
        inventory['summary']['by_extension'] = dict(inventory['summary']['by_extension'])
        
        return inventory
    
    def run(self) -> Dict:
        """Run the complete indexing process"""
        print(f"Scanning files in {self.root_path}...")
        self.scan_files()
        print(f"Found {len(self.files)} files")
        
        print("Building dependency graph...")
        self.build_dependency_graph()
        
        print("Building workspace graph...")
        self.build_workspace_graph()
        
        print("Generating inventory...")
        inventory = self.generate_inventory()
        
        return inventory


def main():
    # Get the directory where this script is located
    script_dir = Path(__file__).parent
    indexer = CRXWorkspaceIndexer(str(script_dir))
    
    inventory = indexer.run()
    
    # Write inventory.json
    output_path = script_dir / 'inventory.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(inventory, f, indent=2, default=str)
    
    print(f"\n✓ Inventory written to {output_path}")
    print(f"\nSummary:")
    print(f"  Total files: {inventory['metadata']['total_files']}")
    print(f"  By type: {json.dumps(inventory['summary']['by_type'], indent=4)}")
    print(f"  By authority: {json.dumps(inventory['summary']['by_authority'], indent=4)}")
    print(f"  By extension: {json.dumps(inventory['summary']['by_extension'], indent=4)}")


if __name__ == '__main__':
    main()
