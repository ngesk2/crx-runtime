"""
Secret Repository Audit

Scans codebase for secret leakage and unauthorized secret access.
"""
import subprocess
import json
from pathlib import Path
from typing import Dict, List

# Secret patterns to scan for
SECRET_PATTERNS = {
    'API_KEY': 'API key usage - should use SecretAdapter',
    'SECRET': 'Secret usage - should use SecretAdapter',
    'PASSWORD': 'Password usage - should use SecretAdapter',
    'TOKEN': 'Token usage - should use SecretAdapter',
    'Bearer': 'Bearer token usage - should use SecretAdapter',
}

# Authorized secret access patterns
AUTHORIZED_PATTERNS = {
    'secret_adapter': 'Authorized SecretAdapter usage',
    'SecretAdapter': 'Authorized SecretAdapter class',
    'get_secret': 'Authorized secret getter method',
    'get_openai_key': 'Authorized OpenAI key getter',
    'get_postgres_password': 'Authorized Postgres password getter',
    'get_jwt_signing_key': 'Authorized JWT signing key getter',
    'get_qdrant_key': 'Authorized Qdrant key getter',
    'get_google_drive_secret': 'Authorized Google Drive secret getter',
}

# Infrastructure patterns (allowed)
INFRASTRUCTURE_FILES = [
    'setup_vault.py',
    'secret_adapter.py',
    'constitutional_audit.py',
    'secret_audit.py',
    'vault_audit.py',
]

# Environment variable patterns (need migration)
ENV_PATTERNS = {
    'os.getenv': 'Direct environment variable access - should use SecretAdapter',
    'os.environ': 'Direct environment variable access - should use SecretAdapter',
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

def is_authorized_secret_access(file_path: str) -> bool:
    """Check if file is authorized secret access (SecretAdapter)."""
    authorized_files = [
        'secret_adapter.py',
        'setup_vault.py'
    ]
    return any(auth_file in file_path for auth_file in authorized_files)

def is_infrastructure_file(file_path: str) -> bool:
    """Check if file is infrastructure file."""
    return any(infra_file in file_path for infra_file in INFRASTRUCTURE_FILES)

def is_audit_script(file_path: str) -> bool:
    """Check if file is audit script itself."""
    return 'secret_audit.py' in file_path or 'constitutional_audit.py' in file_path

def main():
    """Run secret audit."""
    print("=" * 60)
    print("SECRET REPOSITORY AUDIT")
    print("=" * 60)
    
    results = {
        'secret_leaks': {},
        'env_access': {},
        'authorized': {},
        'summary': {}
    }
    
    # Scan for secret patterns
    print("\n[SECRET LEAKAGE SCAN]")
    for pattern, description in SECRET_PATTERNS.items():
        matches = run_ripgrep(pattern)
        # Filter out authorized files
        filtered_matches = [
            m for m in matches 
            if not is_authorized_secret_access(m)
            and not is_infrastructure_file(m)
            and not is_audit_script(m)
        ]
        
        if filtered_matches:
            results['secret_leaks'][pattern] = {
                'description': description,
                'matches': filtered_matches,
                'count': len(filtered_matches)
            }
            print(f"  [!] {pattern}: {len(filtered_matches)} matches")
            for match in filtered_matches[:3]:
                print(f"      {match}")
            if len(filtered_matches) > 3:
                print(f"      ... and {len(filtered_matches) - 3} more")
        else:
            print(f"  [OK] {pattern}: 0 matches")
    
    # Scan for environment variable access
    print("\n[ENVIRONMENT VARIABLE ACCESS SCAN]")
    for pattern, description in ENV_PATTERNS.items():
        matches = run_ripgrep(pattern)
        # Filter out authorized files
        filtered_matches = [
            m for m in matches 
            if not is_authorized_secret_access(m)
            and not is_infrastructure_file(m)
            and not is_audit_script(m)
        ]
        
        if filtered_matches:
            results['env_access'][pattern] = {
                'description': description,
                'matches': filtered_matches,
                'count': len(filtered_matches)
            }
            print(f"  [!] {pattern}: {len(filtered_matches)} matches")
            for match in filtered_matches[:3]:
                print(f"      {match}")
            if len(filtered_matches) > 3:
                print(f"      ... and {len(filtered_matches) - 3} more")
        else:
            print(f"  [OK] {pattern}: 0 matches")
    
    # Scan for authorized patterns
    print("\n[AUTHORIZED SECRET ACCESS]")
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
    total_secret_leaks = sum(len(v['matches']) for v in results['secret_leaks'].values())
    total_env_access = sum(len(v['matches']) for v in results['env_access'].values())
    total_authorized = sum(len(v['matches']) for v in results['authorized'].values())
    
    results['summary'] = {
        'total_secret_leaks': total_secret_leaks,
        'total_env_access': total_env_access,
        'total_authorized': total_authorized,
        'secret_leak_types': len(results['secret_leaks']),
        'env_access_types': len(results['env_access']),
        'authorized_types': len(results['authorized'])
    }
    
    print("\n" + "=" * 60)
    print("AUDIT SUMMARY")
    print("=" * 60)
    print(f"Total Secret Leaks: {total_secret_leaks}")
    print(f"Total Environment Variable Access: {total_env_access}")
    print(f"Total Authorized Secret Access: {total_authorized}")
    print(f"Secret Leak Types: {len(results['secret_leaks'])}")
    print(f"Env Access Types: {len(results['env_access'])}")
    print(f"Authorized Types: {len(results['authorized'])}")
    
    # Save results
    with open('C:/Users/nolan/PING/vault/SECRET_AUDIT_REPORT.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nReport saved to: vault/SECRET_AUDIT_REPORT.json")
    
    return results

if __name__ == '__main__':
    main()
