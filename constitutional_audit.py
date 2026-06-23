"""
Constitutional Repository Audit

Scans codebase for architectural violations per security assessment.
"""
import subprocess
import json
from pathlib import Path
from typing import Dict, List

# Patterns to scan for
VIOLATION_PATTERNS = {
    'ollama.Client': 'Direct Ollama client usage - should use ProviderAdapter',
    '/api/embeddings': 'Direct inference API endpoint - should use ProviderAdapter',
    '/api/pull': 'Direct inference API endpoint - should use ProviderAdapter',
    '/api/show': 'Direct inference API endpoint - should use ProviderAdapter',
    '/api/tags': 'Direct inference API endpoint - should use ProviderAdapter',
    '/v1/chat/completions': 'Direct OpenAI API - should use ProviderAdapter',
    '/v1/embeddings': 'Direct OpenAI API - should use ProviderAdapter',
    'fetch(': 'Direct fetch - should use adapter',
    'eval(': 'Direct eval - security risk',
    'exec(': 'Direct exec - security risk',
    'pickle': 'Pickle usage - security risk',
    'yaml.load': 'Unsafe YAML load - security risk'
}

# Allowed infrastructure patterns
INFRASTRUCTURE_PATTERNS = {
    'subprocess': 'Subprocess for infrastructure commands (allowed in certification scripts)'
}

# Service-to-service communication patterns (allowed)
SERVICE_PATTERNS = {
    'mission-control': 'Mission Control API calls (allowed)',
    'constitution/search': 'Constitutional search endpoint (allowed)',
    'constitution/doc': 'Constitutional document endpoint (allowed)',
    'constitution/authority': 'Constitutional authority endpoint (allowed)',
    '/knowledge/': 'Knowledge API endpoints (allowed)',
    '/memory/': 'Memory API endpoints (allowed)'
}

AUTHORIZED_PATTERNS = {
    'inference_adapter': 'Authorized adapter implementation',
    'provider_adapter': 'Authorized adapter implementation',
    'ollama_provider_adapter': 'Authorized provider implementation',
    'openai_provider_adapter': 'Authorized provider implementation'
}

def run_ripgrep(pattern: str, file_type: str = 'py') -> List[str]:
    """Run ripgrep and return results."""
    try:
        result = subprocess.run(
            ['rg', '-n', pattern, '--type', file_type],
            capture_output=True,
            text=True,
            cwd='C:/Users/nolan/PING'
        )
        return result.stdout.strip().split('\n') if result.stdout.strip() else []
    except Exception as e:
        print(f"Error running ripgrep for {pattern}: {e}")
        return []

def is_authorized_provider(file_path: str) -> bool:
    """Check if file is an authorized provider adapter."""
    authorized_files = [
        'ollama_provider_adapter.py',
        'openai_provider_adapter.py',
        'anthropic_provider_adapter.py',
        'inference_adapter.py'
    ]
    return any(auth_file in file_path for auth_file in authorized_files)

def is_audit_script(file_path: str) -> bool:
    """Check if file is the audit script itself (false positive filter)."""
    return 'constitutional_audit.py' in file_path

def is_service_communication(match: str) -> bool:
    """Check if match is allowed service-to-service communication."""
    for pattern in SERVICE_PATTERNS.keys():
        if pattern in match:
            return True
    return False

def is_infrastructure_script(file_path: str) -> bool:
    """Check if file is an infrastructure/certification script."""
    infrastructure_files = [
        'destructive_recovery_certification.py',
        'recovery_certification.py',
        'infrastructure_test.py'
    ]
    return any(infra_file in file_path for infra_file in infrastructure_files)

def main():
    """Run constitutional audit."""
    print("=" * 60)
    print("CONSTITUTIONAL REPOSITORY AUDIT")
    print("=" * 60)
    
    results = {
        'violations': {},
        'authorized': {},
        'summary': {}
    }
    
    # Scan for violations
    print("\n[VIOLATION SCAN]")
    for pattern, description in VIOLATION_PATTERNS.items():
        matches = run_ripgrep(pattern)
        # Filter out authorized provider implementations, audit script, service communication, and infrastructure scripts
        filtered_matches = [
            m for m in matches 
            if not is_authorized_provider(m) 
            and not is_audit_script(m)
            and not is_service_communication(m)
            and not is_infrastructure_script(m)
        ]
        
        if filtered_matches:
            results['violations'][pattern] = {
                'description': description,
                'matches': filtered_matches,
                'count': len(filtered_matches)
            }
            print(f"  [!] {pattern}: {len(filtered_matches)} matches")
            for match in filtered_matches[:3]:  # Show first 3
                print(f"      {match}")
            if len(filtered_matches) > 3:
                print(f"      ... and {len(filtered_matches) - 3} more")
        else:
            print(f"  [OK] {pattern}: 0 matches")
    
    # Scan for authorized implementations
    print("\n[AUTHORIZED IMPLEMENTATIONS]")
    for pattern, description in AUTHORIZED_PATTERNS.items():
        matches = run_ripgrep(pattern)
        if matches:
            results['authorized'][pattern] = {
                'description': description,
                'matches': matches,
                'count': len(matches)
            }
            print(f"  [OK] {pattern}: {len(matches)} matches")
        else:
            print(f"  [?] {pattern}: 0 matches")
    
    # Summary
    total_violations = sum(len(v['matches']) for v in results['violations'].values())
    total_authorized = sum(len(v['matches']) for v in results['authorized'].values())
    
    results['summary'] = {
        'total_violations': total_violations,
        'total_authorized': total_authorized,
        'violation_types': len(results['violations']),
        'authorized_types': len(results['authorized'])
    }
    
    print("\n" + "=" * 60)
    print("AUDIT SUMMARY")
    print("=" * 60)
    print(f"Total Violations: {total_violations}")
    print(f"Total Authorized: {total_authorized}")
    print(f"Violation Types: {len(results['violations'])}")
    print(f"Authorized Types: {len(results['authorized'])}")
    
    # Save results
    with open('C:/Users/nolan/PING/vault/CONSTITUTIONAL_AUDIT_REPORT.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nReport saved to: vault/CONSTITUTIONAL_AUDIT_REPORT.json")
    
    return results

if __name__ == '__main__':
    main()
