"""
Constitutional Security + Memory Completion Audit (Simple Version)

Objective: Determine whether the constitutional runtime has achieved:
- authority centralization
- event sovereignty
- secret sovereignty
- inference sovereignty
- projection integrity
- memory readiness
"""

import subprocess
import json
from typing import Dict, List


def run_ripgrep(pattern: str, exclude: List[str] = None) -> List[str]:
    """Run ripgrep and return results."""
    if exclude is None:
        exclude = ['constitutional_completion_audit', 'CONSTITUTIONAL_COMPLETION_AUDIT']
    
    try:
        cmd = ['rg', '-n', pattern, '.']
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
        return []


def main():
    """Run simplified audit."""
    print("Constitutional Security + Memory Completion Audit (Simple)")
    print("=" * 80)
    
    results = {
        'phase1_event_store_sovereignty': {},
        'phase2_secret_authority': {},
        'phase3_capability_enforcement': {},
        'phase4_jwt_trust_boundary': {},
        'phase5_event_signature': {},
        'phase6_projection_integrity': {},
        'phase7_vault_operational': {},
        'phase8_memory_readiness': {},
        'phase9_mission_control_knowledge': {},
        'summary': {}
    }
    
    # Phase 1: Event Store Sovereignty
    print("\nPhase 1: Event Store Sovereignty")
    patterns = ["append_event", "create_event", "insert_event", "save_event", "write_event"]
    for pattern in patterns:
        matches = run_ripgrep(pattern)
        results['phase1_event_store_sovereignty'][pattern] = len(matches)
        print(f"  {pattern}: {len(matches)} matches")
    
    # Phase 2: Secret Authority
    print("\nPhase 2: Secret Authority")
    patterns = ["OPENAI_API_KEY", "QDRANT_API_KEY", "DB_PASSWORD", "JWT_SECRET", "SECRET_KEY"]
    for pattern in patterns:
        matches = run_ripgrep(pattern)
        authorized = [m for m in matches if any(auth in m for auth in [
            'secret_adapter', 'SecretAdapter', 'setup_vault', 'docker-compose', 'generate_secrets'
        ])]
        results['phase2_secret_authority'][pattern] = {
            'total': len(matches),
            'authorized': len(authorized),
            'unauthorized': len(matches) - len(authorized)
        }
        print(f"  {pattern}: {len(matches)} total, {len(authorized)} authorized")
    
    # Phase 3: Capability Enforcement
    print("\nPhase 3: Capability Enforcement")
    patterns = ["requires_capability", "Capability", "PolicyEngine"]
    for pattern in patterns:
        matches = run_ripgrep(pattern)
        results['phase3_capability_enforcement'][pattern] = len(matches)
        print(f"  {pattern}: {len(matches)} matches")
    
    # Phase 4: JWT Trust Boundary
    print("\nPhase 4: JWT Trust Boundary")
    patterns = ["jwt_auth", "JWTAuth", "verify_token", "extract_identity"]
    for pattern in patterns:
        matches = run_ripgrep(pattern)
        results['phase4_jwt_trust_boundary'][pattern] = len(matches)
        print(f"  {pattern}: {len(matches)} matches")
    
    # Phase 5: Event Signature
    print("\nPhase 5: Event Signature")
    patterns = ["Ed25519", "SigningKey", "VerifyKey", "verify_signature"]
    for pattern in patterns:
        matches = run_ripgrep(pattern)
        results['phase5_event_signature'][pattern] = len(matches)
        print(f"  {pattern}: {len(matches)} matches")
    
    # Phase 6: Projection Integrity
    print("\nPhase 6: Projection Integrity")
    patterns = ["ProjectionIntegrity", "verify_projection"]
    for pattern in patterns:
        matches = run_ripgrep(pattern)
        results['phase6_projection_integrity'][pattern] = len(matches)
        print(f"  {pattern}: {len(matches)} matches")
    
    # Phase 7: Vault Operational
    print("\nPhase 7: Vault Operational")
    config_files = run_ripgrep("production_config.hcl|rotate_approle.sh")
    results['phase7_vault_operational'] = {
        'config_files': len(config_files),
        'vault_running': 'TODO - requires manual check'
    }
    print(f"  Config files: {len(config_files)}")
    
    # Phase 8: Memory Readiness
    print("\nPhase 8: Memory Readiness")
    patterns = ["DocumentImported", "DocumentEmbedded", "ProjectionCreated", "Qdrant"]
    for pattern in patterns:
        matches = run_ripgrep(pattern)
        results['phase8_memory_readiness'][pattern] = len(matches)
        print(f"  {pattern}: {len(matches)} matches")
    
    # Phase 9: Mission Control Knowledge
    print("\nPhase 9: Mission Control Knowledge")
    patterns = ["/knowledge/search", "/knowledge/related", "/knowledge/lineage", 
                "/knowledge/research", "/knowledge/documents"]
    for pattern in patterns:
        matches = run_ripgrep(pattern)
        results['phase9_mission_control_knowledge'][pattern] = len(matches)
        print(f"  {pattern}: {len(matches)} matches")
    
    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    
    # Calculate scores
    secret_authorized = sum(v['authorized'] for v in results['phase2_secret_authority'].values())
    secret_total = sum(v['total'] for v in results['phase2_secret_authority'].values())
    secret_score = (secret_authorized / secret_total * 100) if secret_total > 0 else 0
    
    capability_matches = sum(results['phase3_capability_enforcement'].values())
    jwt_matches = sum(results['phase4_jwt_trust_boundary'].values())
    signature_matches = sum(results['phase5_event_signature'].values())
    projection_matches = sum(results['phase6_projection_integrity'].values())
    
    results['summary'] = {
        'secret_sovereignty_score': f"{secret_score:.1f}%",
        'capability_enforcement': capability_matches,
        'jwt_implementation': jwt_matches,
        'signature_implementation': signature_matches,
        'projection_integrity': projection_matches,
        'vault_config_files': results['phase7_vault_operational']['config_files']
    }
    
    print(f"Secret Sovereignty Score: {secret_score:.1f}%")
    print(f"Capability Enforcement Matches: {capability_matches}")
    print(f"JWT Implementation Matches: {jwt_matches}")
    print(f"Signature Implementation Matches: {signature_matches}")
    print(f"Projection Integrity Matches: {projection_matches}")
    print(f"Vault Config Files: {results['phase7_vault_operational']['config_files']}")
    
    # Save results
    with open('C:/Users/nolan/PING/vault/CONSTITUTIONAL_COMPLETION_AUDIT.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print("\nResults saved to: vault/CONSTITUTIONAL_COMPLETION_AUDIT.json")


if __name__ == '__main__':
    main()
