import hashlib
import json
import os
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple

vault_path = Path('C:/Users/nolan/PING/vault')

# Constitutional language patterns
constitutional_patterns = {
    'must': r'\bmust\b',
    'shall': r'\bshall\b',
    'required': r'\brequired\b',
    'authoritative': r'\bauthoritative\b',
    'canonical': r'\bcanonical\b',
    'source of truth': r'\bsource of truth\b',
    'constitutional': r'\bconstitutional\b',
    'governing': r'\bgoverning\b',
    'binding': r'\bbinding\b',
    'immutable': r'\bimmutable\b',
    'prohibited': r'\bprohibited\b',
    'guarantee': r'\bguarantee\b',
    'invariant': r'\binvariant\b'
}

# Authority claim patterns
authority_patterns = {
    'source_of_truth': r'(source of truth|single source of truth|canonical source)',
    'governing': r'(governing|governed by|governance)',
    'authoritative': r'(authoritative|authority|authorities)',
    'constitutional': r'(constitutional|constitution)',
    'immutable': r'(immutable|never modified|never deleted)',
    'required': r'(required|must|shall)',
    'prohibited': r'(prohibited|forbidden|never)',
    'guarantee': r'(guarantee|ensures|certified)'
}

def read_file_content(file_path: Path) -> str:
    """Read file content."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return ""

def extract_authority_claims(content: str, file_path: str) -> List[Dict]:
    """Extract authority claims with evidence."""
    claims = []
    lines = content.split('\n')
    
    for pattern_name, pattern in authority_patterns.items():
        matches = list(re.finditer(pattern, content, re.IGNORECASE))
        for match in matches:
            # Get context around the match
            start = max(0, match.start() - 50)
            end = min(len(content), match.end() + 50)
            context = content[start:end]
            
            # Find line number
            line_num = content[:match.start()].count('\n') + 1
            
            claims.append({
                'type': pattern_name,
                'confidence': 0.8,
                'evidence': context.strip(),
                'line': line_num
            })
    
    return claims

def score_constitutional_language(content: str) -> float:
    """Score document for constitutional language."""
    total_matches = 0
    total_patterns = len(constitutional_patterns)
    
    for pattern_name, pattern in constitutional_patterns.items():
        matches = len(re.findall(pattern, content, re.IGNORECASE))
        total_matches += matches
    
    # Normalize by document length and pattern count
    if len(content) == 0:
        return 0.0
    
    # Score based on match density
    density = total_matches / (len(content) / 1000)  # matches per 1000 chars
    score = min(1.0, density * 0.5)  # Scale to 0-1
    
    return round(score, 2)

def analyze_document(file_path: Path) -> Dict:
    """Analyze a single document."""
    content = read_file_content(file_path)
    relative_path = str(file_path.relative_to(vault_path))
    
    authority_claims = extract_authority_claims(content, relative_path)
    constitutional_score = score_constitutional_language(content)
    
    return {
        'path': relative_path,
        'size': file_path.stat().st_size,
        'constitutional_score': constitutional_score,
        'authority_claims': authority_claims,
        'claim_count': len(authority_claims)
    }

def detect_duplicates(documents: List[Dict]) -> List[Dict]:
    """Detect duplicate documents by content hash."""
    content_hashes = {}
    duplicates = []
    
    for doc in documents:
        file_path = vault_path / doc['path']
        content = read_file_content(file_path)
        content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
        
        if content_hash in content_hashes:
            duplicates.append({
                'original': content_hashes[content_hash],
                'duplicate': doc['path'],
                'hash': content_hash
            })
        else:
            content_hashes[content_hash] = doc['path']
    
    return duplicates

def main():
    """Main analysis function."""
    # Find all markdown files
    md_files = list(vault_path.rglob('*.md'))
    
    # Analyze all documents
    documents = []
    for file_path in md_files:
        doc = analyze_document(file_path)
        documents.append(doc)
    
    # Detect duplicates
    duplicates = detect_duplicates(documents)
    
    # Generate reports
    results = {
        'analysis_date': datetime.now().isoformat(),
        'total_documents': len(documents),
        'documents': documents,
        'duplicates': duplicates,
        'constitutional_documents': [d for d in documents if d['constitutional_score'] > 0.3],
        'authority_documents': [d for d in documents if d['claim_count'] > 0]
    }
    
    # Save results
    with open(vault_path / 'VAULT_ANALYSIS_RESULTS.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"Analyzed {len(documents)} documents")
    print(f"Found {len(duplicates)} duplicate pairs")
    print(f"Constitutional documents: {len(results['constitutional_documents'])}")
    print(f"Authority documents: {len(results['authority_documents'])}")
    
    return results

if __name__ == '__main__':
    main()
