"""
Constitutional Security + Memory Completion Audit

Objective: Determine whether the constitutional runtime has achieved:
- authority centralization
- event sovereignty
- secret sovereignty
- inference sovereignty
- projection integrity
- memory readiness

No implementation claims accepted without verification evidence.
"""

import subprocess
import json
from pathlib import Path
from typing import Dict, List, Tuple


def run_ripgrep(pattern: str, path: str = ".", exclude: List[str] = None) -> List[str]:
    """Run ripgrep and return results."""
    if exclude is None:
        exclude = ['constitutional_completion_audit.py', 'CONSTITUTIONAL_COMPLETION_AUDIT.json']
    
    try:
        cmd = ['rg', '-n', pattern, path]
        for excl in exclude:
            cmd.extend(['--glob', '!' + excl])
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd='C:/Users/nolan/PING',
            encoding='utf-8',
            errors='ignore'
        )
        if result.stdout:
            return result.stdout.strip().split('\n')
        return []
    except Exception as e:
        print(f"Error running ripgrep for {pattern}: {e}")
        return []


def phase1_event_store_sovereignty_audit() -> Dict:
    """Phase 1: Event Store Sovereignty Audit"""
    print("=" * 80)
    print("PHASE 1 — Event Store Sovereignty Audit")
    print("=" * 80)
    
    patterns = ["append_event", "create_event", "insert_event", "save_event", "write_event"]
    results = {}
    
    for pattern in patterns:
        matches = run_ripgrep(pattern)
        results[pattern] = {
            'matches': matches,
            'count': len(matches),
            'verified': []
        }
        
        print(f"\nPattern: {pattern}")
        print(f"Matches: {len(matches)}")
        
        for match in matches[:10]:  # Limit to first 10
            try:
                print(f"  {match}")
            except UnicodeEncodeError:
                print(f"  [Unicode error in match]")
            # Verification would require manual inspection of each match
            results[pattern]['verified'].append({
                'file': match.split(':')[0] if ':' in match else match,
                'line': match.split(':')[1] if ':' in match and len(match.split(':')) > 1 else 'N/A',
                'capability_check': 'TODO',
                'signature': 'TODO',
                'chain': 'TODO',
                'persist': 'TODO'
            })
        if len(matches) > 10:
            print(f"  ... and {len(matches) - 10} more")
    
    return results


def phase2_secret_authority_audit() -> Dict:
    """Phase 2: Secret Authority Audit"""
    print("\n" + "=" * 80)
    print("PHASE 2 — Secret Authority Audit")
    print("=" * 80)
    
    patterns = ["OPENAI_API_KEY", "QDRANT_API_KEY", "DB_PASSWORD", "JWT_SECRET", "SECRET_KEY"]
    results = {}
    
    for pattern in patterns:
        matches = run_ripgrep(pattern)
        results[pattern] = {
            'matches': matches,
            'count': len(matches),
            'authorized': []
        }
        
        print(f"\nPattern: {pattern}")
        print(f"Matches: {len(matches)}")
        
        for match in matches[:10]:  # Limit to first 10
            try:
                print(f"  {match}")
            except UnicodeEncodeError:
                print(f"  [Unicode error in match]")
            # Check if authorized (SecretAdapter, Vault bootstrap, infra config)
            authorized = any(auth in match for auth in [
                'secret_adapter', 'SecretAdapter', 'setup_vault', 
                'docker-compose', 'generate_secrets'
            ])
            results[pattern]['authorized'].append({
                'file': match.split(':')[0] if ':' in match else match,
                'authorized': authorized
            })
        if len(matches) > 10:
            print(f"  ... and {len(matches) - 10} more")
    
    return results


def phase3_capability_enforcement_audit() -> Dict:
    """Phase 3: Capability Enforcement Audit"""
    print("\n" + "=" * 80)
    print("PHASE 3 — Capability Enforcement Audit")
    print("=" * 80)
    
    patterns = ["requires_capability", "Capability", "PolicyEngine"]
    results = {}
    
    for pattern in patterns:
        matches = run_ripgrep(pattern)
        results[pattern] = {
            'matches': matches,
            'count': len(matches)
        }
        
        print(f"\nPattern: {pattern}")
        print(f"Matches: {len(matches)}")
        
        for match in matches:
            print(f"  {match}")
    
    return results


def phase4_jwt_trust_boundary_audit() -> Dict:
    """Phase 4: JWT Trust Boundary Audit"""
    print("\n" + "=" * 80)
    print("PHASE 4 — JWT Trust Boundary Audit")
    print("=" * 80)
    
    patterns = ["jwt_auth", "JWTAuth", "verify_token", "extract_identity"]
    results = {}
    
    for pattern in patterns:
        matches = run_ripgrep(pattern)
        results[pattern] = {
            'matches': matches,
            'count': len(matches)
        }
        
        print(f"\nPattern: {pattern}")
        print(f"Matches: {len(matches)}")
        
        for match in matches:
            print(f"  {match}")
    
    return results


def phase5_event_signature_audit() -> Dict:
    """Phase 5: Event Signature Audit"""
    print("\n" + "=" * 80)
    print("PHASE 5 — Event Signature Audit")
    print("=" * 80)
    
    patterns = ["Ed25519", "SigningKey", "VerifyKey", "verify_signature"]
    results = {}
    
    for pattern in patterns:
        matches = run_ripgrep(pattern)
        results[pattern] = {
            'matches': matches,
            'count': len(matches)
        }
        
        print(f"\nPattern: {pattern}")
        print(f"Matches: {len(matches)}")
        
        for match in matches:
            print(f"  {match}")
    
    return results


def phase6_projection_integrity_audit() -> Dict:
    """Phase 6: Projection Integrity Audit"""
    print("\n" + "=" * 80)
    print("PHASE 6 — Projection Integrity Audit")
    print("=" * 80)
    
    patterns = ["ProjectionIntegrity", "verify_projection"]
    results = {}
    
    for pattern in patterns:
        matches = run_ripgrep(pattern)
        results[pattern] = {
            'matches': matches,
            'count': len(matches)
        }
        
        print(f"\nPattern: {pattern}")
        print(f"Matches: {len(matches)}")
        
        for match in matches:
            print(f"  {match}")
    
    return results


def phase7_vault_operational_audit() -> Dict:
    """Phase 7: Vault Operational Audit"""
    print("\n" + "=" * 80)
    print("PHASE 7 — Vault Operational Audit")
    print("=" * 80)
    
    print("\nNote: This phase requires running Vault commands.")
    print("Required commands:")
    print("  vault status")
    print("  vault audit list")
    print("  vault auth list")
    print("  vault read auth/approle/role/ping-app")
    print("\nSkipping automated check - requires Vault to be running.")
    
    # Check for configuration files
    config_files = run_ripgrep("production_config.hcl|rotate_approle.sh")
    
    results = {
        'config_files': config_files,
        'config_count': len(config_files),
        'vault_running': False,
        'tls_enabled': 'TODO',
        'audit_enabled': 'TODO',
        'approle_active': 'TODO',
        'root_token_revoked': 'TODO',
        'auto_unseal_configured': 'TODO'
    }
    
    print(f"\nConfiguration files found: {len(config_files)}")
    for file in config_files:
        print(f"  {file}")
    
    return results


def phase8_constitutional_memory_readiness_audit() -> Dict:
    """Phase 8: Constitutional Memory Readiness Audit"""
    print("\n" + "=" * 80)
    print("PHASE 8 — Constitutional Memory Readiness Audit")
    print("=" * 80)
    
    patterns = ["DocumentImported", "DocumentEmbedded", "ProjectionCreated", "Qdrant"]
    results = {}
    
    for pattern in patterns:
        matches = run_ripgrep(pattern)
        results[pattern] = {
            'matches': matches,
            'count': len(matches)
        }
        
        print(f"\nPattern: {pattern}")
        print(f"Matches: {len(matches)}")
        
        for match in matches[:5]:  # Show first 5
            print(f"  {match}")
        if len(matches) > 5:
            print(f"  ... and {len(matches) - 5} more")
    
    return results


def phase9_mission_control_knowledge_audit() -> Dict:
    """Phase 9: Mission Control Knowledge Audit"""
    print("\n" + "=" * 80)
    print("PHASE 9 — Mission Control Knowledge Audit")
    print("=" * 80)
    
    patterns = ["/knowledge/search", "/knowledge/related", "/knowledge/lineage", 
                "/knowledge/research", "/knowledge/documents"]
    results = {}
    
    for pattern in patterns:
        matches = run_ripgrep(pattern)
        results[pattern] = {
            'matches': matches,
            'count': len(matches)
        }
        
        print(f"\nPattern: {pattern}")
        print(f"Matches: {len(matches)}")
        
        for match in matches:
            print(f"  {match}")
    
    return results


def phase10_constitutional_completion_score() -> Dict:
    """Phase 10: Constitutional Completion Score"""
    print("\n" + "=" * 80)
    print("PHASE 10 — Constitutional Completion Score")
    print("=" * 80)
    
    scores = {
        'security': {
            'event_sovereignty': 0,
            'secret_sovereignty': 0,
            'capability_sovereignty': 0,
            'jwt_sovereignty': 0,
            'signature_verification': 0
        },
        'memory': {
            'ingestion': 0,
            'projection': 0,
            'retrieval': 0,
            'verification': 0
        },
        'authority': {
            'centralized': 0,
            'fragmented': 0
        }
    }
    
    # Calculate scores based on previous phases
    # This is a placeholder - actual scoring would require manual verification
    
    print("\n### Security")
    for key, value in scores['security'].items():
        print(f"{key}: {value}/100")
    
    print("\n### Memory")
    for key, value in scores['memory'].items():
        print(f"{key}: {value}/100")
    
    print("\n### Authority")
    for key, value in scores['authority'].items():
        print(f"{key}: {value}/100")
    
    total_score = sum(scores['security'].values()) + sum(scores['memory'].values()) + sum(scores['authority'].values())
    max_score = 9 * 100  # 9 categories
    completion_percentage = (total_score / max_score) * 100 if max_score > 0 else 0
    
    print(f"\n### Final Result")
    print(f"Constitutional Security Score: {sum(scores['security'].values()) / 5:.1f}/100")
    print(f"Constitutional Memory Score: {sum(scores['memory'].values()) / 4:.1f}/100")
    print(f"Constitutional Authority Score: {sum(scores['authority'].values()) / 2:.1f}/100")
    print(f"Constitutional Completion: {completion_percentage:.1f}%")
    
    return scores


def main():
    """Run complete constitutional audit."""
    print("Constitutional Security + Memory Completion Audit")
    print("=" * 80)
    print("Objective: Verify constitutional runtime without implementation claims")
    print("=" * 80)
    
    audit_results = {
        'phase1_event_store_sovereignty': phase1_event_store_sovereignty_audit(),
        'phase2_secret_authority': phase2_secret_authority_audit(),
        'phase3_capability_enforcement': phase3_capability_enforcement_audit(),
        'phase4_jwt_trust_boundary': phase4_jwt_trust_boundary_audit(),
        'phase5_event_signature': phase5_event_signature_audit(),
        'phase6_projection_integrity': phase6_projection_integrity_audit(),
        'phase7_vault_operational': phase7_vault_operational_audit(),
        'phase8_memory_readiness': phase8_constitutional_memory_readiness_audit(),
        'phase9_mission_control_knowledge': phase9_mission_control_knowledge_audit(),
        'phase10_completion_score': phase10_constitutional_completion_score()
    }
    
    # Save results
    with open('C:/Users/nolan/PING/vault/CONSTITUTIONAL_COMPLETION_AUDIT.json', 'w') as f:
        json.dump(audit_results, f, indent=2)
    
    print("\n" + "=" * 80)
    print("Audit complete. Results saved to: vault/CONSTITUTIONAL_COMPLETION_AUDIT.json")
    print("=" * 80)


if __name__ == '__main__':
    main()
