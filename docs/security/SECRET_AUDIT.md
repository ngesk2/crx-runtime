# Secret Audit Report

**Generated:** The current date is: Thu 06/25/2026 
Enter the new date: (mm-dd-yy)
**Total Findings:** 95

## Summary

- **CRITICAL:** 54
- **HIGH:** 41
- **MEDIUM:** 0
- **LOW:** 0

## CRITICAL Findings

| File | Line | Pattern | Description | Content |
|------|------|---------|-------------|---------|
| CLEANUP_COMMANDS.sh | 321 | `postgresql://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `- DATABASE_URL=postgresql://crx:crx@postgres:5432/...` |
| CLEANUP_COMMANDS.sh | 377 | `postgresql://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `COMMIT_DATABASE_URL=postgresql://crx:crx@localhost...` |
| CLEANUP_COMMANDS.sh | 400 | `postgresql://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `DATABASE_URL=postgresql://crx:crx@localhost:5432/c...` |
| OPERATOR_RUNBOOKS.md | 250 | `apikey\s*=\s*["\']([^"\']+)["\']` | Hardcoded API key | `$newApiKey = "your_new_api_key_here"...` |
| REBRAND_AUDIT_PROCESSED.txt | 251 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\CascadeProjects\infra\LOCAL_EX...` |
| REBRAND_AUDIT_PROCESSED.txt | 258 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\CascadeProjects\infra\LOCAL_EX...` |
| REBRAND_AUDIT_PROCESSED.txt | 353 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\CascadeProjects\infra\COGNITIO...` |
| REBRAND_AUDIT_PROCESSED.txt | 359 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\CascadeProjects\infra\COGNITIO...` |
| REBRAND_AUDIT_PROCESSED.txt | 366 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\CascadeProjects\infra\COGNITIO...` |
| REBRAND_AUDIT_PROCESSED.txt | 372 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\CascadeProjects\infra\COGNITIO...` |
| REBRAND_AUDIT_PROCESSED.txt | 377 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\CascadeProjects\infra\COGNITIO...` |
| REBRAND_AUDIT_PROCESSED.txt | 383 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\CascadeProjects\infra\COGNITIO...` |
| REBRAND_AUDIT_PROCESSED.txt | 389 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\CascadeProjects\infra\COGNITIO...` |
| REBRAND_AUDIT_PROCESSED.txt | 479 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\CascadeProjects\infra\GATEWAY_...` |
| REBRAND_AUDIT_PROCESSED.txt | 3279 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|unknown|...` |
| REBRAND_AUDIT_PROCESSED.txt | 3286 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|unknown|...` |
| REBRAND_AUDIT_PROCESSED.txt | 3381 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|unknown|...` |
| REBRAND_AUDIT_PROCESSED.txt | 3387 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|unknown|...` |
| REBRAND_AUDIT_PROCESSED.txt | 3394 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|unknown|...` |
| REBRAND_AUDIT_PROCESSED.txt | 3400 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|unknown|...` |
| REBRAND_AUDIT_PROCESSED.txt | 3405 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|unknown|...` |
| REBRAND_AUDIT_PROCESSED.txt | 3411 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|unknown|...` |
| REBRAND_AUDIT_PROCESSED.txt | 3417 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|unknown|...` |
| REBRAND_AUDIT_PROCESSED.txt | 3507 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|unknown|...` |
| REBRAND_AUDIT_PROCESSED.txt | 565 | `postgresql://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\CLEANUP_COMMANDS.sh|unknown|  ...` |
| REBRAND_AUDIT_PROCESSED.txt | 574 | `postgresql://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\CLEANUP_COMMANDS.sh|unknown|CO...` |
| REBRAND_AUDIT_PROCESSED.txt | 575 | `postgresql://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\CLEANUP_COMMANDS.sh|unknown|DA...` |
| REBRAND_AUDIT_PROCESSED.txt | 1220 | `postgresql://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\RUNTIME_HARDENING.md|documenta...` |
| REBRAND_AUDIT_PROCESSED.txt | 1221 | `postgresql://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\RUNTIME_HARDENING.md|documenta...` |
| REBRAND_AUDIT_PROCESSED.txt | 2815 | `postgresql://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\RECOMMENDED_STRUCTURE.md|docum...` |
| REBRAND_AUDIT_PROCESSED.txt | 2824 | `postgresql://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\RECOMMENDED_STRUCTURE.md|docum...` |
| REBRAND_AUDIT_PROCESSED.txt | 2825 | `postgresql://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\RECOMMENDED_STRUCTURE.md|docum...` |
| REBRAND_AUDIT_PROCESSED.txt | 3593 | `postgresql://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|unknown|...` |
| REBRAND_AUDIT_PROCESSED.txt | 3602 | `postgresql://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|unknown|...` |
| REBRAND_AUDIT_PROCESSED.txt | 3603 | `postgresql://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|unknown|...` |
| REBRAND_AUDIT_PROCESSED.txt | 4248 | `postgresql://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|unknown|...` |
| REBRAND_AUDIT_PROCESSED.txt | 4249 | `postgresql://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|unknown|...` |
| RECOMMENDED_STRUCTURE.md | 242 | `postgresql://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `- DATABASE_URL=postgresql://crx:crx@postgres:5432/...` |
| RECOMMENDED_STRUCTURE.md | 308 | `postgresql://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `DATABASE_URL=postgresql://crx:crx@localhost:5432/c...` |
| RECOMMENDED_STRUCTURE.md | 328 | `postgresql://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `COMMIT_DATABASE_URL=postgresql://crx:crx@localhost...` |
| RUNTIME_HARDENING.md | 158 | `postgresql://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `DATABASE_URL=postgresql://user:password@localhost:...` |
| RUNTIME_HARDENING.md | 201 | `postgresql://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `DATABASE_URL=postgresql://user:password@localhost:...` |
| brainos\orchestration\docs\architecture\SECRET_MANAGEMENT.md | 77 | `token\s*=\s*["\']([^"\']+)["\']` | Hardcoded token | `export VAULT_TOKEN='your-vault-token'...` |
| brainos\orchestration\docs\architecture\SECRET_MANAGEMENT.md | 84 | `token\s*=\s*["\']([^"\']+)["\']` | Hardcoded token | `client = hvac.Client(url='http://vault:8200', toke...` |
| CascadeProjects\infra\COGNITION_STACK_EXPANSION.md | 221 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `- POSTGRES_URL=postgres://crx:crx_dev_password@crx...` |
| CascadeProjects\infra\COGNITION_STACK_EXPANSION.md | 256 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `- POSTGRES_URL=postgres://crx:crx_dev_password@crx...` |
| CascadeProjects\infra\COGNITION_STACK_EXPANSION.md | 289 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `- POSTGRES_URL=postgres://crx:crx_dev_password@crx...` |
| CascadeProjects\infra\COGNITION_STACK_EXPANSION.md | 319 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `- POSTGRES_URL=postgres://crx:crx_dev_password@crx...` |
| CascadeProjects\infra\COGNITION_STACK_EXPANSION.md | 345 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `- POSTGRES_URL=postgres://crx:crx_dev_password@crx...` |
| CascadeProjects\infra\COGNITION_STACK_EXPANSION.md | 376 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `- POSTGRES_URL=postgres://crx:crx_dev_password@crx...` |
| CascadeProjects\infra\COGNITION_STACK_EXPANSION.md | 411 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `- DATABASE_URL=postgres://crx:crx_dev_password@crx...` |
| CascadeProjects\infra\GATEWAY_INSERTION_PLAN.md | 420 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `- POSTGRES_URL=postgres://crx:crx_dev_password@crx...` |
| CascadeProjects\infra\LOCAL_EXECUTION_SUBSTRATE_PROPOSAL.md | 239 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `- POSTGRES_URL=postgres://crx:crx_dev_password@crx...` |
| CascadeProjects\infra\LOCAL_EXECUTION_SUBSTRATE_PROPOSAL.md | 289 | `postgres://[^@]+:[^@]+@` | PostgreSQL connection string with credentials | `- DATABASE_URL=postgres://crx:crx_dev_password@crx...` |

## HIGH Findings

| File | Line | Pattern | Description | Content |
|------|------|---------|-------------|---------|
| OLLAMA_CONNECTIVITY_AUDIT.md | 70 | `localhost:[^:]+:[^@]+` | Localhost credentials | `curl -sS -X POST http://localhost:11434/api/embedd...` |
| OLLAMA_CONNECTIVITY_AUDIT.md | 91 | `localhost:[^:]+:[^@]+` | Localhost credentials | `- If `localhost:11434` fails from host but contain...` |
| REBRAND_AUDIT_PROCESSED.txt | 6424 | `localhost:[^:]+:[^@]+` | Localhost credentials | `C:\Users\nolan\PING\brainos\newsletter\MASTER_PING...` |
| REBRAND_AUDIT_PROCESSED.txt | 6775 | `localhost:[^:]+:[^@]+` | Localhost credentials | `C:\Users\nolan\PING\brainos\newsletter\interface_a...` |
| SWEEP21_FINAL_ANSWER.md | 149 | `password\s*=\s*["\']([^"\']+)["\']` | Hardcoded password | `password='capture_password'...` |
| SWEEP21_FINAL_ANSWER.md | 241 | `localhost:[^:]+:[^@]+` | Localhost credentials | `Open WebUI (localhost:3001 / Tailscale: 100.79.154...` |
| SWEEP21_FINAL_ANSWER.md | 243 | `localhost:[^:]+:[^@]+` | Localhost credentials | `├─ Local Ollama (localhost:11434) - qwen2.5-coder:...` |
| _test_lineage2.py | 14 | `password\s*=\s*["\']([^"\']+)["\']` | Hardcoded password | `conn = psycopg2.connect(host='postgres', port=5432...` |
| _test_lineage3.py | 10 | `password\s*=\s*["\']([^"\']+)["\']` | Hardcoded password | `conn = psycopg2.connect(host='postgres', port=5432...` |
| _test_lineage3.py | 23 | `password\s*=\s*["\']([^"\']+)["\']` | Hardcoded password | `conn2 = psycopg2.connect(host='postgres', port=543...` |
| brainos\newsletter\container_runtime_inventory.md | 38 | `localhost:[^:]+:[^@]+` | Localhost credentials | `**Health Checks:** curl --silent --fail http://loc...` |
| brainos\newsletter\container_runtime_inventory.md | 74 | `localhost:[^:]+:[^@]+` | Localhost credentials | `**Health Checks:** curl -f http://localhost:3000/a...` |
| brainos\newsletter\container_runtime_inventory.md | 168 | `localhost:[^:]+:[^@]+` | Localhost credentials | `**Health Checks:** curl -f http://localhost:6333/h...` |
| brainos\newsletter\container_runtime_inventory.md | 186 | `localhost:[^:]+:[^@]+` | Localhost credentials | `**Health Checks:** curl -f http://localhost:7474 (...` |
| brainos\newsletter\container_runtime_inventory.md | 222 | `localhost:[^:]+:[^@]+` | Localhost credentials | `**Health Checks:** kafka-broker-api-versions --boo...` |
| brainos\newsletter\container_runtime_inventory.md | 276 | `localhost:[^:]+:[^@]+` | Localhost credentials | `**Health Checks:** curl -f http://localhost:9200/_...` |
| brainos\newsletter\container_runtime_inventory.md | 294 | `localhost:[^:]+:[^@]+` | Localhost credentials | `**Health Checks:** curl -f http://localhost:9998 (...` |
| brainos\newsletter\container_runtime_inventory.md | 312 | `localhost:[^:]+:[^@]+` | Localhost credentials | `**Health Checks:** curl -f http://localhost:11434/...` |
| brainos\newsletter\container_runtime_inventory.md | 330 | `localhost:[^:]+:[^@]+` | Localhost credentials | `**Health Checks:** curl -f http://localhost:8080 (...` |
| brainos\newsletter\interface_audit.md | 18 | `localhost:[^:]+:[^@]+` | Localhost credentials | `**Health Check:** curl -f http://localhost:3000/ap...` |
| brainos\newsletter\interface_audit.md | 53 | `localhost:[^:]+:[^@]+` | Localhost credentials | `Next.js UI frontend for CRX system. Same as localh...` |
| brainos\newsletter\interface_audit.md | 82 | `localhost:[^:]+:[^@]+` | Localhost credentials | `**Health Check:** curl --silent --fail http://loca...` |
| brainos\newsletter\interface_audit.md | 114 | `localhost:[^:]+:[^@]+` | Localhost credentials | `**Health Check:** curl -f http://localhost:8080 (i...` |
| brainos\newsletter\MASTER_PING_FIRST_CONSTITUTIONAL_INVENTORY.md | 342 | `localhost:[^:]+:[^@]+` | Localhost credentials | `**crx-ui-next (localhost:3000):**...` |
| brainos\orchestration\infrastructure\docker\scripts\generate_keys.py | 36 | `\.pem` | PEM file reference | `private_key_path = keys_dir / f'{name}_private.pem...` |
| brainos\orchestration\infrastructure\docker\scripts\generate_keys.py | 39 | `\.pem` | PEM file reference | `encoding=serialization.Encoding.PEM,...` |
| brainos\orchestration\infrastructure\docker\scripts\generate_keys.py | 45 | `\.pem` | PEM file reference | `public_key_path = keys_dir / f'{name}_public.pem'...` |
| brainos\orchestration\infrastructure\docker\scripts\generate_keys.py | 48 | `\.pem` | PEM file reference | `encoding=serialization.Encoding.PEM,...` |
| brainos\orchestration\scripts\backup_postgres.sh | 14 | `password\s*=\s*["\']([^"\']+)["\']` | Hardcoded password | `POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"...` |
| brainos\orchestration\scripts\backup_postgres.sh | 46 | `password\s*=\s*["\']([^"\']+)["\']` | Hardcoded password | `PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \...` |
| docs\architecture\REPOSITORY_RUNTIME_SPEC.md | 521 | `\.pem` | PEM file reference | `**Private Key Location:** `C:\PING\secrets\github\...` |
| docs\security\SECRET_MANAGEMENT.md | 20 | `\.pem` | PEM file reference | `│   └── github_app_private_key.pem...` |
| docs\security\SECRET_MANAGEMENT.md | 34 | `\.pem` | PEM file reference | `| GitHub App Private Key | `secrets/github/github_...` |
| docs\security\SECRET_MANAGEMENT.md | 74 | `\.pem` | PEM file reference | `GITHUB_APP_PRIVATE_KEY_PATH=secrets/github/github_...` |
| docs\security\SECRET_MANAGEMENT.md | 124 | `\.pem` | PEM file reference | `with open("C:\\Users\\nolan\\Downloads\\key.pem", ...` |
| docs\security\SECRET_MANAGEMENT.md | 150 | `\.pem` | PEM file reference | `icacls "C:\PING\secrets\github\github_app_private_...` |
| docs\security\SECRET_MANAGEMENT.md | 151 | `\.pem` | PEM file reference | `icacls "C:\PING\secrets\github\github_app_private_...` |
| docs\security\SECRET_MANAGEMENT.md | 160 | `\.pem` | PEM file reference | `chmod 400 secrets/github/github_app_private_key.pe...` |
| docs\security\SECRET_MANAGEMENT.md | 287 | `\.pem` | PEM file reference | `**Location:** `C:\PING\secrets\github\github_app_p...` |
| docs\security\SECRET_MANAGEMENT.md | 310 | `\.pem` | PEM file reference | `GITHUB_APP_PRIVATE_KEY_PATH=C:\PING\secrets\github...` |
| docs\security\SECRET_MANAGEMENT.md | 84 | `password\s*=\s*["\']([^"\']+)["\']` | Hardcoded password | `postgres_password = "mysecretpassword"...` |

## Recommendations

### For CRITICAL Findings
- Remove hardcoded secrets immediately
- Replace with environment variable references
- Rotate any exposed secrets
- Update documentation

### For HIGH Findings
- Review and replace with environment variables
- Ensure no credentials in version control
- Update secret management documentation

### For MEDIUM/LOW Findings
- Review for false positives
- Update if actual secrets found
- Add to exclusion list if benign

