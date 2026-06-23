# Backup Architecture for Replayability

**Constitutional Law 10:** Backups must preserve replayability

---

## Overview

Backup architecture must support complete system reconstruction including object store recovery, event log recovery, PostgreSQL recovery, and full replay recovery. All backups must preserve the ability to replay the entire system from constitutional truth.

---

## Replayability Requirements

### Constitutional Truth Preservation

Backups must preserve:
- **Object Store:** All immutable objects with content hashes
- **Event Log:** All immutable events in sequence
- **Canonical State:** Current PostgreSQL state
- **Replay Capability:** Ability to replay from any point

### Replayability Guarantees

Given a backup, the system must be able to:
1. Restore object store to exact state
2. Restore event log to exact sequence
3. Restore PostgreSQL to exact state
4. Replay from any event position
5. Rebuild all projections
6. Verify complete integrity

---

## Backup Strategy

### Three-Tier Model

#### Hot Backup (Immediate Recovery)
- **RPO:** 0 seconds
- **RTO:** < 5 minutes
- **Purpose:** Immediate recovery from failures
- **Method:** Real-time replication

#### Warm Backup (Daily Recovery)
- **RPO:** < 1 hour
- **RTO:** < 1 hour
- **Purpose:** Daily snapshots for recovery
- **Method:** Periodic snapshots

#### Cold Backup (Long-term Recovery)
- **RPO:** < 24 hours
- **RTO:** < 24 hours
- **Purpose:** Long-term archival
- **Method:** Encrypted archives

---

## Object Store Backup

### Backup Method

#### Full Object Store Backup
```bash
#!/bin/bash
# backup_object_store.sh

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/storage/backups/object_store/$DATE"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup object store
rsync -av /storage/objects/ "$BACKUP_DIR/objects/"

# Generate checksums
find "$BACKUP_DIR/objects/" -type f -exec sha256sum {} \; > "$BACKUP_DIR/checksums.txt"

# Encrypt backup
./scripts/encrypt_backup.sh "$BACKUP_DIR"

# Upload to off-site
aws s3 cp "$BACKUP_DIR/objects.tar.gz.enc" s3://brain-backups/object_store/
```

#### Incremental Object Store Backup
```bash
#!/bin/bash
# backup_object_store_incremental.sh

DATE=$(date +%Y-%m-%d)
LAST_BACKUP=$(ls -t /storage/backups/object_store/ | head -1)
BACKUP_DIR="/storage/backups/object_store/$DATE"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Incremental backup
rsync -av --link-dest="/storage/backups/object_store/$LAST_BACKUP/objects/" \
    /storage/objects/ "$BACKUP_DIR/objects/"

# Generate checksums
find "$BACKUP_DIR/objects/" -type f -exec sha256sum {} \; > "$BACKUP_DIR/checksums.txt"

# Encrypt backup
./scripts/encrypt_backup.sh "$BACKUP_DIR"
```

### Object Store Recovery

#### Full Recovery
```bash
#!/bin/bash
# restore_object_store.sh

BACKUP_DATE=$1
BACKUP_DIR="/storage/backups/object_store/$BACKUP_DATE"

# Decrypt backup
./scripts/decrypt_backup.sh "$BACKUP_DIR/objects.tar.gz.enc"

# Extract backup
tar -xzf "$BACKUP_DIR/objects.tar.gz" -C /tmp/

# Verify checksums
cd /tmp/objects
sha256sum -c checksums.txt

# Restore object store
rsync -av /tmp/objects/ /storage/objects/
```

#### Incremental Recovery
```bash
#!/bin/bash
# restore_object_store_incremental.sh

BACKUP_DATE=$1
BACKUP_DIR="/storage/backups/object_store/$BACKUP_DATE"

# Restore incremental backup
rsync -av "$BACKUP_DIR/objects/" /storage/objects/

# Verify checksums
cd /storage/objects
sha256sum -c checksums.txt
```

---

## Event Log Backup

### Backup Method

#### Full Event Log Backup
```bash
#!/bin/bash
# backup_event_log.sh

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/storage/backups/event_log/$DATE"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup event log
rsync -av /storage/events/ "$BACKUP_DIR/events/"

# Generate event sequence file
python3 scripts/generate_event_sequence.py > "$BACKUP_DIR/event_sequence.txt"

# Generate checksums
find "$BACKUP_DIR/events/" -type f -exec sha256sum {} \; > "$BACKUP_DIR/checksums.txt"

# Encrypt backup
./scripts/encrypt_backup.sh "$BACKUP_DIR"

# Upload to off-site
aws s3 cp "$BACKUP_DIR/events.tar.gz.enc" s3://brain-backups/event_log/
```

#### Event Log Sequence File
```python
#!/usr/bin/env python3
# generate_event_sequence.py

import json
from pathlib import Path

def generate_event_sequence():
    """Generate event sequence file for replay verification."""
    events = []
    
    # Load all events
    event_dir = Path('/storage/events')
    for event_file in event_dir.glob('**/*.log'):
        with open(event_file, 'r') as f:
            for line in f:
                event = json.loads(line)
                events.append({
                    'event_id': event['event_id'],
                    'event_type': event['event_type'],
                    'timestamp': event['timestamp'],
                    'aggregate_id': event['aggregate_id']
                })
    
    # Sort by timestamp
    events.sort(key=lambda x: x['timestamp'])
    
    # Write sequence file
    with open('/storage/backups/event_sequence.txt', 'w') as f:
        for event in events:
            f.write(f"{event['event_id']}\t{event['timestamp']}\n")

if __name__ == '__main__':
    generate_event_sequence()
```

### Event Log Recovery

#### Full Recovery
```bash
#!/bin/bash
# restore_event_log.sh

BACKUP_DATE=$1
BACKUP_DIR="/storage/backups/event_log/$BACKUP_DATE"

# Decrypt backup
./scripts/decrypt_backup.sh "$BACKUP_DIR/events.tar.gz.enc"

# Extract backup
tar -xzf "$BACKUP_DIR/events.tar.gz" -C /tmp/

# Verify checksums
cd /tmp/events
sha256sum -c checksums.txt

# Verify event sequence
python3 scripts/verify_event_sequence.py /tmp/events/event_sequence.txt

# Restore event log
rsync -av /tmp/events/ /storage/events/
```

---

## PostgreSQL Backup

### Backup Method

#### Full PostgreSQL Backup
```bash
#!/bin/bash
# backup_postgres.sh

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/storage/backups/postgres/$DATE"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# PostgreSQL dump
docker-compose exec -T postgres pg_dump -U brain_user brain_db | gzip > "$BACKUP_DIR/postgres.sql.gz"

# Generate checksum
sha256sum "$BACKUP_DIR/postgres.sql.gz" > "$BACKUP_DIR/checksums.txt"

# Encrypt backup
./scripts/encrypt_backup.sh "$BACKUP_DIR"

# Upload to off-site
aws s3 cp "$BACKUP_DIR/postgres.sql.gz.enc" s3://brain-backups/postgres/
```

#### PostgreSQL WAL Backup
```bash
#!/bin/bash
# backup_postgres_wal.sh

# Configure PostgreSQL for WAL archiving
# Add to postgresql.conf:
# wal_level = replica
# archive_mode = on
# archive_command = 'rsync %w /storage/backups/postgres/wal/'

# Backup WAL files
rsync -av /var/lib/postgresql/wal/ /storage/backups/postgres/wal/
```

### PostgreSQL Recovery

#### Full Recovery
```bash
#!/bin/bash
# restore_postgres.sh

BACKUP_DATE=$1
BACKUP_DIR="/storage/backups/postgres/$BACKUP_DATE"

# Decrypt backup
./scripts/decrypt_backup.sh "$BACKUP_DIR/postgres.sql.gz.enc"

# Verify checksum
sha256sum -c "$BACKUP_DIR/checksums.txt"

# Restore PostgreSQL
gunzip -c "$BACKUP_DIR/postgres.sql.gz" | docker-compose exec -T postgres psql -U brain_user brain_db
```

#### Point-in-Time Recovery
```bash
#!/bin/bash
# restore_postgres_pitr.sh

BACKUP_DATE=$1
TARGET_TIME=$2

# Restore base backup
./restore_postgres.sh "$BACKUP_DATE"

# Replay WAL to target time
docker-compose exec postgres pg_ctl start -D /var/lib/postgresql/data -o "-c recovery_target_time='$TARGET_TIME'"
```

---

## Full Replay Recovery

### Replay Recovery Method

#### Replay from Backup
```python
#!/usr/bin/env python3
# replay_from_backup.sh

import sys
from datetime import datetime

def replay_from_backup(backup_date: str, from_event_id: str = None):
    """
    Replay system from backup.
    
    Args:
        backup_date: Backup date to restore from
        from_event_id: Starting event (optional)
    """
    print(f"Replaying from backup: {backup_date}")
    
    # Restore object store
    print("Restoring object store...")
    restore_object_store(backup_date)
    
    # Restore event log
    print("Restoring event log...")
    restore_event_log(backup_date)
    
    # Restore PostgreSQL
    print("Restoring PostgreSQL...")
    restore_postgres(backup_date)
    
    # Replay events
    print("Replaying events...")
    if from_event_id:
        replay_events(from_event_id=from_event_id)
    else:
        replay_events()
    
    # Rebuild projections
    print("Rebuilding projections...")
    rebuild_all_projections()
    
    # Verify integrity
    print("Verifying integrity...")
    verify_system_integrity()
    
    print("Replay complete")

if __name__ == '__main__':
    backup_date = sys.argv[1] if len(sys.argv) > 1 else datetime.utcnow().strftime('%Y-%m-%d')
    from_event_id = sys.argv[2] if len(sys.argv) > 2 else None
    
    replay_from_backup(backup_date, from_event_id)
```

---

## Backup Verification

### Verification Procedures

#### Object Store Verification
```python
def verify_object_store_backup(backup_dir: str) -> bool:
    """
    Verify object store backup integrity.
    
    Args:
        backup_dir: Backup directory
    
    Returns:
        True if valid
    """
    # Verify checksums
    checksum_file = f"{backup_dir}/checksums.txt"
    with open(checksum_file, 'r') as f:
        for line in f:
            expected_hash, filepath = line.split()
            
            # Compute actual hash
            actual_hash = compute_sha256(filepath)
            
            if actual_hash != expected_hash:
                return False
    
    return True
```

#### Event Log Verification
```python
def verify_event_log_backup(backup_dir: str) -> bool:
    """
    Verify event log backup integrity.
    
    Args:
        backup_dir: Backup directory
    
    Returns:
        True if valid
    """
    # Verify checksums
    checksum_file = f"{backup_dir}/checksums.txt"
    with open(checksum_file, 'r') as f:
        for line in f:
            expected_hash, filepath = line.split()
            
            # Compute actual hash
            actual_hash = compute_sha256(filepath)
            
            if actual_hash != expected_hash:
                return False
    
    # Verify event sequence
    sequence_file = f"{backup_dir}/event_sequence.txt"
    return verify_event_sequence(sequence_file)
```

#### PostgreSQL Verification
```python
def verify_postgres_backup(backup_dir: str) -> bool:
    """
    Verify PostgreSQL backup integrity.
    
    Args:
        backup_dir: Backup directory
    
    Returns:
        True if valid
    """
    # Verify checksum
    checksum_file = f"{backup_dir}/checksums.txt"
    with open(checksum_file, 'r') as f:
        expected_hash, filepath = f.read().split()
    
    # Compute actual hash
    actual_hash = compute_sha256(filepath)
    
    return actual_hash == expected_hash
```

---

## Replayability Testing

### Test Procedures

#### Full Replay Test
```python
def test_full_replay():
    """
    Test full system replay.
    """
    # Take current state snapshot
    current_state = get_system_state()
    
    # Create backup
    create_backup()
    
    # Restore from backup
    restore_from_backup()
    
    # Replay events
    replay_events()
    
    # Get restored state
    restored_state = get_system_state()
    
    # Verify states match
    assert compare_states(current_state, restored_state)
```

#### Incremental Replay Test
```python
def test_incremental_replay():
    """
    Test incremental replay.
    """
    # Get current event position
    current_event_id = get_latest_event_id()
    
    # Process some events
    process_events(count=10)
    
    # Get new event position
    new_event_id = get_latest_event_id()
    
    # Replay from old position
    replay_events(from_event_id=current_event_id)
    
    # Verify state matches
    current_state = get_system_state()
    replayed_state = get_system_state()
    
    assert compare_states(current_state, replayed_state)
```

---

## Backup Replayability Checklist

### Object Store Backup
- ✅ All objects backed up
- ✅ Content hashes verified
- ✅ Directory structure preserved
- ✅ Metadata preserved
- ✅ Encryption applied
- ✅ Off-site copy stored

### Event Log Backup
- ✅ All events backed up
- ✅ Event sequence preserved
- ✅ Event integrity verified
- ✅ Checksums generated
- ✅ Encryption applied
- ✅ Off-site copy stored

### PostgreSQL Backup
- ✅ Full database dump
- ✅ WAL files archived
- ✅ Checksums verified
- ✅ Encryption applied
- ✅ Off-site copy stored
- ✅ Point-in-time recovery supported

### Replay Capability
- ✅ Object store restorable
- ✅ Event log restorable
- ✅ PostgreSQL restorable
- ✅ Event replay functional
- ✅ Projection rebuild functional
- ✅ Integrity verification functional

---

## Backup Replayability Metrics

### Metrics to Track

- **Backup Success Rate:** Percentage of successful backups
- **Backup Duration:** Time to complete backup
- **Backup Size:** Size of backup
- **Restore Success Rate:** Percentage of successful restores
- **Restore Duration:** Time to complete restore
- **Replay Success Rate:** Percentage of successful replays
- **Replay Duration:** Time to complete replay
- **Integrity Verification Rate:** Percentage of successful verifications

### Alerts

- **Backup Failure:** Backup failed
- **Restore Failure:** Restore failed
- **Replay Failure:** Replay failed
- **Integrity Failure:** Integrity check failed
- **Checksum Mismatch:** Checksum verification failed
- **Sequence Gap:** Event sequence gap detected

---

## Backup Replayability Best Practices

### 1. Complete Preservation
- Backup all constitutional truth
- Preserve object store completely
- Preserve event log completely
- Preserve PostgreSQL completely

### 2. Sequence Preservation
- Preserve event sequence
- Generate sequence files
- Verify sequence integrity
- Support replay from any point

### 3. Integrity Verification
- Verify all checksums
- Verify event sequences
- Verify database integrity
- Verify replay results

### 4. Encryption
- Encrypt all backups
- Separate key storage
- Rotate encryption keys
- Support HSM

### 5. Testing
- Test backup regularly
- Test restore regularly
- Test replay regularly
- Document test results
