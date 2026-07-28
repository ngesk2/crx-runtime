# Backup Architecture

**Purpose:** Three-tier backup model for data protection and disaster recovery

---

## Overview

The backup architecture implements a three-tier model: hot, warm, and cold. All backups are encrypted, checksum verified, and restorable through documented procedures.

---

## Design Principles

### 1. Three-Tier Model
- **Hot:** Immediate recovery, real-time replication
- **Warm:** Daily snapshots, asynchronous replication
- **Cold:** Long-term encrypted archive, off-site storage

### 2. Encryption
- All backups encrypted at rest
- Per-backup encryption keys
- Master key encryption
- HSM compatibility

### 3. Verification
- Checksum verification
- Integrity checks
- Regular restore testing
- Automated validation

### 4. Reproducibility
- Documented procedures
- Automated scripts
- Version-controlled
- Tested regularly

---

## Hot Backup

### Purpose
Immediate recovery with zero data loss (RPO = 0).

### Implementation

#### Real-Time Replication
```yaml
# PostgreSQL streaming replication
services:
  postgres-primary:
    image: postgres:15-alpine
    environment:
      POSTGRES_REPLICATION_MODE: master
      POSTGRES_REPLICATION_USER: replicator
      POSTGRES_REPLICATION_PASSWORD: ${REPLICATION_PASSWORD}
  
  postgres-replica:
    image: postgres:15-alpine
    environment:
      POSTGRES_REPLICATION_MODE: slave
      POSTGRES_MASTER_HOST: postgres-primary
      POSTGRES_REPLICATION_USER: replicator
      POSTGRES_REPLICATION_PASSWORD: ${REPLICATION_PASSWORD}
```

#### Synchronous Writes
- Primary database
- Synchronous replication to replica
- Automatic failover
- Zero RPO

### Recovery Procedure

#### Step 1: Promote Replica
```bash
docker-compose exec postgres-replica pg_ctl promote -D /var/lib/postgresql/data
```

#### Step 2: Update Configuration
```bash
# Update connection strings to point to new primary
export POSTGRES_HOST=postgres-replica
```

#### Step 3: Verify
```bash
docker-compose exec postgres-replica psql -U brain_user -d brain_db -c "SELECT 1"
```

---

## Warm Backup

### Purpose
Daily snapshots with RPO < 1 hour.

### Implementation

#### Daily Snapshots
```bash
#!/bin/bash
# daily_snapshot.sh

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/storage/warm/snapshots/$DATE"

# Create snapshot directory
mkdir -p "$BACKUP_DIR"

# PostgreSQL snapshot
docker-compose exec postgres pg_dump -U brain_user brain_db | gzip > "$BACKUP_DIR/postgres.sql.gz"

# Object store snapshot
rsync -av /storage/objects/ "$BACKUP_DIR/objects/"

# Event log snapshot
rsync -av /storage/events/ "$BACKUP_DIR/events/"

# Generate checksums
find "$BACKUP_DIR" -type f -exec sha256sum {} \; > "$BACKUP_DIR/checksums.txt"

# Encrypt backup
./scripts/encrypt_backup.sh "$BACKUP_DIR"
```

#### Asynchronous Replication
```yaml
# MinIO for warm storage
services:
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    environment:
      MINIO_ROOT_USER: ${MINIO_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
```

### Recovery Procedure

#### Step 1: Decrypt Backup
```bash
./scripts/decrypt_backup.sh /storage/warm/snapshots/2026-06-14
```

#### Step 2: Verify Checksums
```bash
cd /storage/warm/snapshots/2026-06-14
sha256sum -c checksums.txt
```

#### Step 3: Restore PostgreSQL
```bash
gunzip -c postgres.sql.gz | docker-compose exec -T postgres psql -U brain_user brain_db
```

#### Step 4: Restore Object Store
```bash
rsync -av objects/ /storage/objects/
```

#### Step 5: Restore Event Log
```bash
rsync -av events/ /storage/events/
```

---

## Cold Backup

### Purpose
Long-term encrypted archive with RPO < 24 hours.

### Implementation

#### Weekly Archives
```bash
#!/bin/bash
# weekly_archive.sh

DATE=$(date +%Y-%m-%d)
ARCHIVE_DIR="/storage/cold/archives/$DATE"

# Create archive directory
mkdir -p "$ARCHIVE_DIR"

# Create archive from warm snapshots
LATEST_SNAPSHOT=$(ls -t /storage/warm/snapshots/ | head -1)
tar -czf "$ARCHIVE_DIR/archive.tar.gz" "/storage/warm/snapshots/$LATEST_SNAPSHOT"

# Generate checksums
sha256sum "$ARCHIVE_DIR/archive.tar.gz" > "$ARCHIVE_DIR/checksums.txt"

# Encrypt archive
./scripts/encrypt_archive.sh "$ARCHIVE_DIR"

# Upload to off-site storage
aws s3 cp "$ARCHIVE_DIR/archive.tar.gz.enc" s3://brain-backups/
```

#### Off-Site Storage
- AWS S3 Glacier
- Azure Blob Storage
- Google Cloud Storage
- Backblaze B2

### Recovery Procedure

#### Step 1: Download Archive
```bash
aws s3 cp s3://brain-backups/archive.tar.gz.enc /tmp/
```

#### Step 2: Decrypt Archive
```bash
./scripts/decrypt_archive.sh /tmp/archive.tar.gz.enc
```

#### Step 3: Extract Archive
```bash
tar -xzf /tmp/archive.tar.gz -C /storage/warm/snapshots/
```

#### Step 4: Restore from Warm Backup
```bash
# Follow warm backup recovery procedure
```

---

## Encryption

### Encryption Method
- AES-256-GCM
- Per-backup keys
- Key derivation from master key
- Authentication tags

### Encryption Script
```python
#!/usr/bin/env python3
# encrypt_backup.sh

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os
import hashlib

def encrypt_backup(backup_path: str, master_key: bytes):
    """Encrypt backup with master key."""
    # Generate per-backup key
    backup_key = os.urandom(32)
    
    # Encrypt data with backup key
    aesgcm = AESGCM(backup_key)
    nonce = os.urandom(12)
    
    with open(backup_path, 'rb') as f:
        data = f.read()
    
    encrypted_data = aesgcm.encrypt(nonce, data, None)
    
    # Encrypt backup key with master key
    key_aesgcm = AESGCM(master_key)
    key_nonce = os.urandom(12)
    encrypted_key = key_aesgcm.encrypt(key_nonce, backup_key, None)
    
    # Write encrypted backup
    encrypted_path = backup_path + '.enc'
    with open(encrypted_path, 'wb') as f:
        f.write(nonce + encrypted_key + key_nonce + encrypted_data)
    
    # Write key separately
    key_path = backup_path + '.key'
    with open(key_path, 'wb') as f:
        f.write(key_nonce + encrypted_key)
    
    print(f"Encrypted backup: {encrypted_path}")
    print(f"Encryption key: {key_path}")
```

### Decryption Script
```python
#!/usr/bin/env python3
# decrypt_backup.sh

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def decrypt_backup(encrypted_path: str, master_key: bytes):
    """Decrypt backup with master key."""
    # Read encrypted backup
    with open(encrypted_path, 'rb') as f:
        data = f.read()
    
    # Extract components
    data_nonce = data[:12]
    encrypted_key = data[12:44]
    key_nonce = data[44:56]
    encrypted_backup = data[56:]
    
    # Decrypt backup key with master key
    key_aesgcm = AESGCM(master_key)
    backup_key = key_aesgcm.decrypt(key_nonce, encrypted_key, None)
    
    # Decrypt data with backup key
    data_aesgcm = AESGCM(backup_key)
    decrypted_data = data_aesgcm.decrypt(data_nonce, encrypted_backup, None)
    
    # Write decrypted backup
    decrypted_path = encrypted_path.replace('.enc', '')
    with open(decrypted_path, 'wb') as f:
        f.write(decrypted_data)
    
    print(f"Decrypted backup: {decrypted_path}")
```

---

## Checksum Verification

### Checksum Generation
```bash
#!/bin/bash
# generate_checksums.sh

BACKUP_DIR=$1

find "$BACKUP_DIR" -type f -exec sha256sum {} \; > "$BACKUP_DIR/checksums.txt"
```

### Checksum Verification
```bash
#!/bin/bash
# verify_checksums.sh

BACKUP_DIR=$1

cd "$BACKUP_DIR"
sha256sum -c checksums.txt

if [ $? -eq 0 ]; then
    echo "Checksum verification passed"
    exit 0
else
    echo "Checksum verification failed"
    exit 1
fi
```

---

## Backup Testing

### Automated Testing
```bash
#!/bin/bash
# test_backup.sh

# Create test backup
./scripts/daily_snapshot.sh

# Verify checksums
./scripts/verify_checksums.sh /storage/warm/snapshots/$(date +%Y-%m-%d)

# Test restore
./scripts/test_restore.sh /storage/warm/snapshots/$(date +%Y-%m-%d)

# Report results
if [ $? -eq 0 ]; then
    echo "Backup test passed"
else
    echo "Backup test failed"
    exit 1
fi
```

### Restore Testing
```bash
#!/bin/bash
# test_restore.sh

BACKUP_DIR=$1

# Create test database
docker-compose exec postgres psql -U brain_user -c "CREATE DATABASE test_restore"

# Restore backup
gunzip -c "$BACKUP_DIR/postgres.sql.gz" | docker-compose exec -T postgres psql -U brain_user test_restore

# Verify restore
docker-compose exec postgres psql -U brain_user test_restore -c "SELECT COUNT(*) FROM objects"

# Cleanup
docker-compose exec postgres psql -U brain_user -c "DROP DATABASE test_restore"
```

---

## Backup Retention

### Retention Policy
- **Hot:** 7 days
- **Warm:** 90 days
- **Cold:** 7 years
- **Archive:** Permanent

### Automated Cleanup
```bash
#!/bin/bash
# cleanup_old_backups.sh

# Clean up hot backups older than 7 days
find /storage/hot/ -type d -mtime +7 -exec rm -rf {} \;

# Clean up warm backups older than 90 days
find /storage/warm/snapshots/ -type d -mtime +90 -exec rm -rf {} \;

# Clean up cold archives older than 7 years
find /storage/cold/archives/ -type d -mtime +2555 -exec rm -rf {} \;
```

---

## Monitoring

### Metrics
- Backup success rate
- Backup duration
- Backup size
- Restore success rate
- Restore duration

### Alerts
- Backup failures
- Restore failures
- Checksum mismatches
- Storage capacity

---

## Disaster Recovery

### Disaster Scenarios

#### Scenario 1: Primary Database Failure
1. Promote replica to primary
2. Update connection strings
3. Verify data integrity
4. Decommission failed primary

#### Scenario 2: Complete Site Failure
1. Restore from cold backup
2. Deploy to new infrastructure
3. Verify data integrity
4. Update DNS

#### Scenario 3: Ransomware Attack
1. Identify attack scope
2. Restore from immutable backups
3. Scan for malware
4. Update security measures

---

## Best Practices

### 1. 3-2-1 Rule
- 3 copies of data
- 2 different storage types
- 1 off-site copy

### 2. Immutable Backups
- Write once, read many
- Cannot be modified
- Cannot be deleted
- Protected from ransomware

### 3. Regular Testing
- Test backups weekly
- Test restores monthly
- Document test results
- Improve procedures

### 4. Encryption
- Encrypt all backups
- Separate key storage
- Rotate encryption keys
- Use HSM for production

### 5. Documentation
- Document all procedures
- Keep procedures up to date
- Train staff on procedures
- Test procedures regularly
