#!/bin/bash
# PostgreSQL Backup Script
# PING Constitutional Stabilization Phase D
# Date: 2026-06-22
# Purpose: Automated PostgreSQL backups with rclone sync to Google Drive

set -e

# Configuration
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-crx_runtime}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
BACKUP_DIR="${BACKUP_DIR:-/tmp/postgres_backups}"
RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive:PING_BACKUPS}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/postgres_backup_${TIMESTAMP}.sql.gz"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Log function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Emit constitutional event for backup start
emit_backup_event() {
    python3 -c "
import sys
sys.path.append('/Users/nolan/CascadeProjects/brain')
from src.constitutional import emit_event
emit_event('backup', 'BACKUP_STARTED', {
    'timestamp': '$(date -u +%Y-%m-%dT%H:%M:%SZ)',
    'target': 'postgres',
    'backup_file': '${BACKUP_FILE}'
})
" || echo "Failed to emit backup event"
}

# Backup PostgreSQL
backup_postgres() {
    log "Starting PostgreSQL backup"
    
    PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --no-owner \
        --no-acl \
        --format=plain \
        | gzip > "${BACKUP_FILE}"
    
    if [ $? -eq 0 ]; then
        log "PostgreSQL backup completed successfully: ${BACKUP_FILE}"
        return 0
    else
        log "PostgreSQL backup failed"
        return 1
    fi
}

# Sync to Google Drive via rclone
sync_to_drive() {
    log "Syncing backup to Google Drive"
    
    rclone copy "${BACKUP_FILE}" "${RCLONE_REMOTE}/postgres/" \
        --progress \
        --log-file="${BACKUP_DIR}/rclone_${TIMESTAMP}.log"
    
    if [ $? -eq 0 ]; then
        log "Sync to Google Drive completed successfully"
        return 0
    else
        log "Sync to Google Drive failed"
        return 1
    fi
}

# Clean old backups (keep last 7 daily, 4 weekly, 12 monthly)
cleanup_old_backups() {
    log "Cleaning old backups"
    
    # Keep last 7 daily backups
    find "${BACKUP_DIR}" -name "postgres_backup_*.sql.gz" -mtime +7 -delete
    
    # Clean old rclone backups (keep last 30 days)
    rclone delete "${RCLONE_REMOTE}/postgres/" --min-age 30d --log-file="${BACKUP_DIR}/rclone_cleanup_${TIMESTAMP}.log"
    
    log "Cleanup completed"
}

# Main execution
main() {
    log "=== PostgreSQL Backup Script Started ==="
    
    # Emit backup event
    emit_backup_event
    
    # Backup PostgreSQL
    if backup_postgres; then
        # Sync to Google Drive
        if sync_to_drive; then
            # Cleanup old backups
            cleanup_old_backups
            
            log "=== Backup completed successfully ==="
            exit 0
        else
            log "=== Backup failed at sync stage ==="
            exit 1
        fi
    else
        log "=== Backup failed at PostgreSQL dump stage ==="
        exit 1
    fi
}

# Run main
main
