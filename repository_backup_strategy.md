# SWEEP24 REPOSITORY BACKUP STRATEGY

**Date**: 2026-06-22
**Branch**: authority-forensics
**Mode**: READ-ONLY FORENSIC INVESTIGATION

---

## EXECUTIVE SUMMARY

**Purpose**: Create comprehensive backup strategy to prevent loss of constitutional authorities.

**Requirements**:
1. Full repository zip
2. Timestamped archive
3. Constitutional snapshot
4. Recovery instructions
5. Restore verification

**Critical Assets to Protect**:
- runtime/replay/ (constitutional authorities)
- runtime/kernel/commit-service/ (active runtime)
- Constitutional forensics reports (Phases 0-7)
- Git history

**Backup Frequency**: Before any destructive operations (deletions, refactoring)

---

## BACKUP REQUIREMENTS

### 1. Full Repository Zip

**Purpose**: Complete repository snapshot

**Command**:
```bash
# Windows PowerShell
Compress-Archive -Path C:\Users\nolan\PING -DestinationPath C:\Users\nolan\PING_backups\PING_full_$(Get-Date -Format 'yyyyMMdd_HHmmss').zip -Force
```

**Contents**:
- All source code
- All configuration files
- All documentation
- All audit reports
- Git repository (.git directory)
- Node modules (optional - can be regenerated)

**Retention**: 30 daily, 12 monthly

---

### 2. Timestamped Archive

**Purpose**: Timestamped backup for recovery point identification

**Format**: PING_backup_YYYYMMDD_HHMMSS.zip

**Location**: C:\Users\nolan\PING_backups\

**Command**:
```bash
# Create backup directory if it doesn't exist
New-Item -ItemType Directory -Force -Path C:\Users\nolan\PING_backups

# Create timestamped archive
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
Compress-Archive -Path C:\Users\nolan\PING -DestinationPath "C:\Users\nolan\PING_backups\PING_backup_$timestamp.zip" -Force
```

**Retention**: 30 daily, 12 monthly

---

### 3. Constitutional Snapshot

**Purpose**: Snapshot of constitutional authorities for quick recovery

**Command**:
```bash
# Create constitutional snapshot
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$constitutional_dir = "C:\Users\nolan\PING_backups\constitutional_snapshot_$timestamp"
New-Item -ItemType Directory -Force -Path $constitutional_dir

# Copy constitutional authorities
Copy-Item -Path "C:\Users\nolan\PING\runtime\replay" -Destination "$constitutional_dir\runtime_replay" -Recurse -Force
Copy-Item -Path "C:\Users\nolan\PING\runtime\kernel\commit-service" -Destination "$constitutional_dir\runtime_kernel_commit-service" -Recurse -Force

# Copy forensic reports
Copy-Item -Path "C:\Users\nolan\PING\constitutional_forensics_report.md" -Destination "$constitutional_dir\" -Force
Copy-Item -Path "C:\Users\nolan\PING\backup_delta_report.md" -Destination "$constitutional_dir\" -Force
Copy-Item -Path "C:\Users\nolan\PING\presentation_evidence_matrix.md" -Destination "$constitutional_dir\" -Force
Copy-Item -Path "C:\Users\nolan\PING\repository_hygiene_matrix.md" -Destination "$constitutional_dir\" -Force
Copy-Item -Path "C:\Users\nolan\PING\memory_foundation_readiness.md" -Destination "$constitutional_dir\" -Force
Copy-Item -Path "C:\Users\nolan\PING\ollama_integration_surface.md" -Destination "$constitutional_dir\" -Force
Copy-Item -Path "C:\Users\nolan\PING\vllm_readiness_matrix.md" -Destination "$constitutional_dir\" -Force
Copy-Item -Path "C:\Users\nolan\PING\repository_backup_strategy.md" -Destination "$constitutional_dir\" -Force

# Create archive
Compress-Archive -Path $constitutional_dir -Destination "C:\Users\nolan\PING_backups\constitutional_snapshot_$timestamp.zip" -Force
```

**Contents**:
- runtime/replay/ (constitutional authorities)
- runtime/kernel/commit-service/ (active runtime)
- All Phase 0-7 forensic reports

**Retention**: 30 daily, 12 monthly

---

### 4. Recovery Instructions

**Purpose**: Step-by-step recovery instructions

**Location**: Included in each backup archive as RECOVERY_INSTRUCTIONS.txt

**Template**:
```
PING REPOSITORY RECOVERY INSTRUCTIONS
=====================================

Backup Date: [TIMESTAMP]
Backup Type: [FULL/CONSTITUTIONAL]

RECOVERY STEPS:
==============

1. Extract backup archive to temporary location:
   Expand-Archive -Path [BACKUP_FILE] -DestinationPath C:\Users\nolan\PING_temp

2. Verify backup integrity:
   - Check runtime/replay/ exists
   - Check runtime/kernel/commit-service/ exists
   - Check forensic reports exist

3. Stop any running services:
   docker-compose down

4. Backup current repository (if exists):
   Rename-Item C:\Users\nolan\PING C:\Users\nolan\PING_old

5. Restore from backup:
   Move-Item C:\Users\nolan\PING_temp C:\Users\nolan\PING

6. Verify git status:
   cd C:\Users\nolan\PING
   git status

7. Verify constitutional authorities:
   - runtime/replay/canonical_json.ts exists
   - runtime/replay/certificate_authority.ts exists
   - runtime/replay/witness_authority.ts exists
   - runtime/replay/deterministic_replay_engine.ts exists

8. Restart services:
   docker-compose up -d

9. Verify system health:
   - Check services are running
   - Check constitutional authorities are functional
   - Run replay verification

CONSTITUTIONAL VERIFICATION:
=============================

Before proceeding with any operations, verify:
- runtime/replay/canonical_json.ts exists and is unchanged
- runtime/replay/certificate_authority.ts exists and is unchanged
- runtime/replay/witness_authority.ts exists and is unchanged
- runtime/replay/deterministic_replay_engine.ts exists and is unchanged

If any constitutional authority is missing or modified:
- STOP RECOVERY
- INVESTIGATE CAUSE
- CONTACT CONSTITUTIONAL AUTHORITY

EMERGENCY CONTACT:
=================
[CONTACT INFORMATION]

RECOVERY VERIFICATION:
======================
After recovery, verify:
1. Git history is intact
2. Constitutional authorities are intact
3. Services are functional
4. Replay verification passes

If verification fails:
- STOP OPERATIONS
- INVESTIGATE CAUSE
- RESTORE FROM EARLIER BACKUP
```

---

### 5. Restore Verification

**Purpose**: Verify backup integrity and restore success

**Verification Steps**:

#### Pre-Restore Verification

```bash
# Verify backup file exists
Test-Path C:\Users\nolan\PING_backups\PING_backup_YYYYMMDD_HHMMSS.zip

# Verify backup file size (should be > 100MB)
(Get-Item C:\Users\nolan\PING_backups\PING_backup_YYYYMMDD_HHMMSS.zip).Length

# Verify backup file integrity
# Extract to temporary location
Expand-Archive -Path C:\Users\nolan\PING_backups\PING_backup_YYYYMMDD_HHMMSS.zip -DestinationPath C:\Users\nolan\PING_temp_verify

# Verify critical directories exist
Test-Path C:\Users\nolan\PING_temp_verify\runtime\replay
Test-Path C:\Users\nolan\PING_temp_verify\runtime\kernel\commit-service

# Verify critical files exist
Test-Path C:\Users\nolan\PING_temp_verify\runtime\replay\canonical_json.ts
Test-Path C:\Users\nolan\PING_temp_verify\runtime\replay\certificate_authority.ts
Test-Path C:\Users\nolan\PING_temp_verify\runtime\replay\witness_authority.ts
Test-Path C:\Users\nolan\PING_temp_verify\runtime\replay\deterministic_replay_engine.ts

# Clean up temporary verification
Remove-Item -Recurse -Force C:\Users\nolan\PING_temp_verify
```

#### Post-Restore Verification

```bash
# Verify git status
cd C:\Users\nolan\PING
git status

# Verify git history
git log --oneline -10

# Verify constitutional authorities
Test-Path runtime\replay\canonical_json.ts
Test-Path runtime\replay\certificate_authority.ts
Test-Path runtime\replay\witness_authority.ts
Test-Path runtime\replay\deterministic_replay_engine.ts

# Verify git diff (should be clean or show expected changes)
git diff --stat

# Run replay verification (if available)
# npm test replay-verification
```

---

## BACKUP AUTOMATION SCRIPT

### PowerShell Script

**File**: C:\Users\nolan\PING\scripts\backup_repository.ps1

```powershell
#!/usr/bin/env pwsh
# PING Repository Backup Script
# Creates full repository backup with constitutional snapshot

$ErrorActionPreference = "Stop"

# Configuration
$PING_DIR = "C:\Users\nolan\PING"
$BACKUP_DIR = "C:\Users\nolan\PING_backups"
$TIMESTAMP = Get-Date -Format 'yyyyMMdd_HHmmss'

# Create backup directory if it doesn't exist
New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null

Write-Host "Starting PING repository backup..." -ForegroundColor Green
Write-Host "Timestamp: $TIMESTAMP" -ForegroundColor Cyan

# 1. Full Repository Backup
Write-Host "Creating full repository backup..." -ForegroundColor Yellow
$full_backup = "$BACKUP_DIR\PING_full_$TIMESTAMP.zip"
Compress-Archive -Path $PING_DIR -DestinationPath $full_backup -Force
Write-Host "Full backup created: $full_backup" -ForegroundColor Green

# 2. Constitutional Snapshot
Write-Host "Creating constitutional snapshot..." -ForegroundColor Yellow
$constitutional_dir = "$BACKUP_DIR\constitutional_snapshot_$TIMESTAMP"
New-Item -ItemType Directory -Force -Path $constitutional_dir | Out-Null

# Copy constitutional authorities
Copy-Item -Path "$PING_DIR\runtime\replay" -Destination "$constitutional_dir\runtime_replay" -Recurse -Force
Copy-Item -Path "$PING_DIR\runtime\kernel\commit-service" -Destination "$constitutional_dir\runtime_kernel_commit-service" -Recurse -Force

# Copy forensic reports
$forensic_reports = @(
    "constitutional_forensics_report.md",
    "backup_delta_report.md",
    "presentation_evidence_matrix.md",
    "repository_hygiene_matrix.md",
    "memory_foundation_readiness.md",
    "ollama_integration_surface.md",
    "vllm_readiness_matrix.md",
    "repository_backup_strategy.md"
)

foreach ($report in $forensic_reports) {
    $source = "$PING_DIR\$report"
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination "$constitutional_dir\" -Force
        Write-Host "Copied: $report" -ForegroundColor Cyan
    }
}

# Create constitutional snapshot archive
$constitutional_backup = "$BACKUP_DIR\constitutional_snapshot_$TIMESTAMP.zip"
Compress-Archive -Path $constitutional_dir -DestinationPath $constitutional_backup -Force
Write-Host "Constitutional snapshot created: $constitutional_backup" -ForegroundColor Green

# 3. Create Recovery Instructions
$recovery_instructions = @"
PING REPOSITORY RECOVERY INSTRUCTIONS
=====================================

Backup Date: $TIMESTAMP
Backup Type: FULL + CONSTITUTIONAL SNAPSHOT

RECOVERY STEPS:
==============

1. Extract backup archive to temporary location:
   Expand-Archive -Path $full_backup -DestinationPath C:\Users\nolan\PING_temp

2. Verify backup integrity:
   - Check runtime/replay/ exists
   - Check runtime/kernel/commit-service/ exists
   - Check forensic reports exist

3. Stop any running services:
   docker-compose down

4. Backup current repository (if exists):
   Rename-Item C:\Users\nolan\PING C:\Users\nolan\PING_old

5. Restore from backup:
   Move-Item C:\Users\nolan\PING_temp C:\Users\nolan\PING

6. Verify git status:
   cd C:\Users\nolan\PING
   git status

7. Verify constitutional authorities:
   - runtime/replay/canonical_json.ts exists
   - runtime/replay/certificate_authority.ts exists
   - runtime/replay/witness_authority.ts exists
   - runtime/replay/deterministic_replay_engine.ts exists

8. Restart services:
   docker-compose up -d

9. Verify system health:
   - Check services are running
   - Check constitutional authorities are functional
   - Run replay verification

CONSTITUTIONAL VERIFICATION:
=============================

Before proceeding with any operations, verify:
- runtime/replay/canonical_json.ts exists and is unchanged
- runtime/replay/certificate_authority.ts exists and is unchanged
- runtime/replay/witness_authority.ts exists and is unchanged
- runtime/replay/deterministic_replay_engine.ts exists and is unchanged

If any constitutional authority is missing or modified:
- STOP RECOVERY
- INVESTIGATE CAUSE
- CONTACT CONSTITUTIONAL AUTHORITY

EMERGENCY CONTACT:
=================
[CONTACT INFORMATION]

RECOVERY VERIFICATION:
======================
After recovery, verify:
1. Git history is intact
2. Constitutional authorities are intact
3. Services are functional
4. Replay verification passes

If verification fails:
- STOP OPERATIONS
- INVESTIGATE CAUSE
- RESTORE FROM EARLIER BACKUP
"@

$recovery_instructions | Out-File -FilePath "$constitutional_dir\RECOVERY_INSTRUCTIONS.txt" -Encoding utf8
Write-Host "Recovery instructions created" -ForegroundColor Green

# 4. Cleanup temporary directory
Remove-Item -Recurse -Force $constitutional_dir

# 5. Backup Summary
Write-Host "`nBackup Summary:" -ForegroundColor Green
Write-Host "Full Backup: $full_backup" -ForegroundColor Cyan
Write-Host "Constitutional Snapshot: $constitutional_backup" -ForegroundColor Cyan
Write-Host "Timestamp: $TIMESTAMP" -ForegroundColor Cyan

# 6. Verify backup sizes
$full_size = (Get-Item $full_backup).Length / 1MB
$constitutional_size = (Get-Item $constitutional_backup).Length / 1MB
Write-Host "Full Backup Size: $([math]::Round($full_size, 2)) MB" -ForegroundColor Cyan
Write-Host "Constitutional Snapshot Size: $([math]::Round($constitutional_size, 2)) MB" -ForegroundColor Cyan

Write-Host "`nBackup completed successfully!" -ForegroundColor Green
```

---

## BACKUP RETENTION POLICY

### Daily Backups

**Retention**: 30 days

**Cleanup Command**:
```bash
# Keep last 30 daily backups
$backups = Get-ChildItem C:\Users\nolan\PING_backups\PING_full_*.zip | Sort-Object LastWriteTime -Descending
if ($backups.Count -gt 30) {
    $backups[30..($backups.Count - 1)] | Remove-Item -Force
}
```

### Monthly Backups

**Retention**: 12 months

**Selection**: First backup of each month

**Cleanup Command**:
```bash
# Keep first backup of each month for last 12 months
$backups = Get-ChildItem C:\Users\nolan\PING_backups\PING_full_*.zip | Sort-Object LastWriteTime -Descending
$monthly_backups = @{}
foreach ($backup in $backups) {
    $month = $backup.LastWriteTime.ToString("yyyyMM")
    if (-not $monthly_backups.ContainsKey($month)) {
        $monthly_backups[$month] = $backup
    }
}

# Keep only monthly backups (last 12 months)
$monthly_backups.Values | Select-Object -First 12 | ForEach-Object {
    # Keep these
}

# Delete others
$backups | Where-Object { $_ -notin $monthly_backups.Values } | Remove-Item -Force
```

### Constitutional Snapshots

**Retention**: 30 daily, 12 monthly

**Same policy as daily/monthly backups**

---

## BACKUP VERIFICATION SCHEDULE

### Weekly Verification

**Frequency**: Every Sunday

**Verification Steps**:
1. Extract most recent backup to temporary location
2. Verify critical directories exist
3. Verify critical files exist
4. Verify file sizes are reasonable
5. Clean up temporary location

**Command**:
```bash
# Extract most recent backup
$latest_backup = Get-ChildItem C:\Users\nolan\PING_backups\PING_full_*.zip | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Expand-Archive -Path $latest_backup.FullName -DestinationPath C:\Users\nolan\PING_temp_verify

# Verify critical directories
$critical_dirs = @(
    "runtime\replay",
    "runtime\kernel\commit-service"
)

foreach ($dir in $critical_dirs) {
    if (-not (Test-Path "C:\Users\nolan\PING_temp_verify\$dir")) {
        Write-Host "CRITICAL: Missing directory: $dir" -ForegroundColor Red
    }
}

# Verify critical files
$critical_files = @(
    "runtime\replay\canonical_json.ts",
    "runtime\replay\certificate_authority.ts",
    "runtime\replay\witness_authority.ts",
    "runtime\replay\deterministic_replay_engine.ts"
)

foreach ($file in $critical_files) {
    if (-not (Test-Path "C:\Users\nolan\PING_temp_verify\$file")) {
        Write-Host "CRITICAL: Missing file: $file" -ForegroundColor Red
    }
}

# Clean up
Remove-Item -Recurse -Force C:\Users\nolan\PING_temp_verify
```

### Monthly Full Verification

**Frequency**: First Sunday of each month

**Verification Steps**:
1. Extract most recent backup
2. Verify all critical directories
3. Verify all critical files
4. Verify git history
5. Test replay verification (if available)
6. Document verification results

---

## BACKUP BEFORE DESTRUCTIVE OPERATIONS

### Required Operations Requiring Backup

Before performing any of the following operations, a backup MUST be created:

1. **File Deletions**
   - Deleting audit reports
   - Deleting experimental artifacts
   - Deleting dead directories

2. **Repository Refactoring**
   - Moving directories
   - Renaming files
   - Restructuring code

3. **Constitutional Authority Modifications**
   - Modifying runtime/replay/ files
   - Modifying runtime/kernel/commit-service/ files

4. **Dependency Updates**
   - Updating package.json
   - Updating pnpm-lock.yaml
   - Updating node_modules

5. **Git Operations**
   - Force push
   - Branch deletion
   - History rewriting

### Backup Trigger Script

**File**: C:\Users\nolan\PING\scripts\backup_before_operation.ps1

```powershell
#!/usr/bin/env pwsh
# Backup before destructive operation

$ErrorActionPreference = "Stop"

$PING_DIR = "C:\Users\nolan\PING"
$BACKUP_DIR = "C:\Users\nolan\PING_backups"
$TIMESTAMP = Get-Date -Format 'yyyyMMdd_HHmmss'
$OPERATION = $args[0]

if (-not $OPERATION) {
    Write-Host "Usage: backup_before_operation.ps1 <operation_description>" -ForegroundColor Red
    exit 1
}

Write-Host "Creating backup before operation: $OPERATION" -ForegroundColor Yellow

# Create backup
$backup_file = "$BACKUP_DIR\PING_pre_operation_${TIMESTAMP}_$($OPERATION -replace ' ', '_').zip"
Compress-Archive -Path $PING_DIR -DestinationPath $backup_file -Force

Write-Host "Backup created: $backup_file" -ForegroundColor Green
Write-Host "Proceed with operation: $OPERATION" -ForegroundColor Green
```

---

## OFFSITE BACKUP STRATEGY

### Cloud Storage

**Recommended**: AWS S3, Azure Blob Storage, or Google Cloud Storage

**Upload Command**:
```bash
# AWS S3
aws s3 sync C:\Users\nolan\PING_backups s3://ping-backups/

# Azure Blob Storage
az storage blob upload-batch --source C:\Users\nolan\PING_backups --destination ping-backups

# Google Cloud Storage
gsutil -m rsync -r C:\Users\nolan\PING_backups gs://ping-backups/
```

### Geographic Redundancy

**Recommended**: Multiple regions

**Strategy**:
- Primary: Local backup (C:\Users\nolan\PING_backups)
- Secondary: Cloud storage (US East)
- Tertiary: Cloud storage (US West)

---

## RECOVERY TESTING

### Quarterly Recovery Test

**Frequency**: Every quarter

**Test Procedure**:
1. Select random backup from 3 months ago
2. Restore to test environment
3. Verify constitutional authorities
4. Verify git history
5. Run replay verification
6. Document results

**Success Criteria**:
- All constitutional authorities intact
- Git history intact
- Replay verification passes
- Services functional

---

## CONCLUSION

### Backup Strategy Summary

1. **Full Repository Backup**: Daily, 30-day retention
2. **Constitutional Snapshot**: Daily, 30-day retention
3. **Monthly Backups**: 12-month retention
4. **Weekly Verification**: Automated verification
5. **Monthly Full Verification**: Comprehensive test
6. **Pre-Operation Backup**: Required before destructive operations
7. **Offsite Backup**: Cloud storage with geographic redundancy
8. **Recovery Testing**: Quarterly

### Constitutional Protection

**NEVER LOSE CONSTITUTIONAL AUTHORITIES**

The backup strategy ensures:
- Constitutional authorities are always backed up
- Multiple recovery points available
- Verification before and after backup
- Recovery testing ensures backups work
- Offsite backup protects against local disasters

---

**END OF STRATEGY**
