# PostgreSQL Backup Script (PowerShell)
# PING Constitutional Stabilization Phase D
# Date: 2026-06-22
# Purpose: Automated PostgreSQL backups with rclone sync to Google Drive

$ErrorActionPreference = "Stop"

# Configuration
$POSTGRES_HOST = if ($env:POSTGRES_HOST) { $env:POSTGRES_HOST } else { "localhost" }
$POSTGRES_PORT = if ($env:POSTGRES_PORT) { $env:POSTGRES_PORT } else { "5432" }
$POSTGRES_DB = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "crx_runtime" }
$POSTGRES_USER = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "postgres" }
$POSTGRES_PASSWORD = $env:POSTGRES_PASSWORD
$BACKUP_DIR = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { "C:\temp\postgres_backups" }
$RCLONE_REMOTE = if ($env:RCLONE_REMOTE) { $env:RCLONE_REMOTE } else { "gdrive:PING_BACKUPS" }
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = Join-Path $BACKUP_DIR "postgres_backup_${TIMESTAMP}.sql.gz"

# Create backup directory
New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null

# Log function
function Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
}

# Backup PostgreSQL
function Backup-Postgres {
    Log "Starting PostgreSQL backup"
    
    $env:PGPASSWORD = $POSTGRES_PASSWORD
    
    $dumpCommand = "pg_dump -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB --no-owner --no-acl --format=plain"
    
    try {
        Invoke-Expression $dumpCommand | gzip > $BACKUP_FILE
        
        if ($LASTEXITCODE -eq 0) {
            Log "PostgreSQL backup completed successfully: $BACKUP_FILE"
            return $true
        } else {
            Log "PostgreSQL backup failed with exit code: $LASTEXITCODE"
            return $false
        }
    } catch {
        Log "PostgreSQL backup failed: $_"
        return $false
    }
}

# Sync to Google Drive via rclone
function Sync-ToDrive {
    Log "Syncing backup to Google Drive"
    
    try {
        rclone copy $BACKUP_FILE "$RCLONE_REMOTE/postgres/" --progress --log-file="$BACKUP_DIR\rclone_${TIMESTAMP}.log"
        
        if ($LASTEXITCODE -eq 0) {
            Log "Sync to Google Drive completed successfully"
            return $true
        } else {
            Log "Sync to Google Drive failed with exit code: $LASTEXITCODE"
            return $false
        }
    } catch {
        Log "Sync to Google Drive failed: $_"
        return $false
    }
}

# Remove old backups
function Remove-OldBackups {
    Log "Removing old backups"
    
    # Keep last 7 daily backups
    Get-ChildItem $BACKUP_DIR -Filter "postgres_backup_*.sql.gz" | 
        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | 
        Remove-Item -Force
    
    # Clean old rclone backups (keep last 30 days)
    rclone delete "$RCLONE_REMOTE/postgres/" --min-age 30d --log-file="$BACKUP_DIR\rclone_cleanup_${TIMESTAMP}.log"
    
    Log "Cleanup completed"
}

# Main execution
function Main {
    Log "=== PostgreSQL Backup Script Started ==="
    
    # Backup PostgreSQL
    if (Backup-Postgres) {
        # Sync to Google Drive
        if (Sync-ToDrive) {
            # Remove old backups
            Remove-OldBackups
            
            Log "=== Backup completed successfully ==="
            exit 0
        } else {
            Log "=== Backup failed at sync stage ==="
            exit 1
        }
    } else {
        Log "=== Backup failed at PostgreSQL dump stage ==="
        exit 1
    }
}

# Run main
Main
