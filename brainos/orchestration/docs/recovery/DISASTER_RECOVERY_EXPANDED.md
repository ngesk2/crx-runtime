# Disaster Recovery Architecture (Expanded)

**Purpose:** Comprehensive disaster recovery procedures for all failure scenarios

---

## Overview

Expanded disaster recovery architecture provides comprehensive procedures for recovering from all failure scenarios including hardware failure, data corruption, ransomware attacks, and complete site loss.

---

## Disaster Scenarios

### Scenario 1: Object Store Failure

#### Severity: HIGH
#### RPO: < 1 hour
#### RTO: < 4 hours

#### Detection
```bash
# Check object store health
ls -la /storage/objects/
find /storage/objects/ -type f | wc -l

# Verify integrity
find /storage/objects/ -type f -exec sha256sum {} \; > /tmp/checksums.txt
sha256sum -c /tmp/checksums.txt
```

#### Recovery Procedure

##### Step 1: Identify Failure Scope
```bash
# Check which objects are affected
find /storage/objects/ -type f -exec sha256sum {} \; > /tmp/current_checksums.txt
diff /tmp/current_checksums.txt /storage/objects/checksums.txt

# Identify corrupted objects
grep -v "OK$" /tmp/current_checksums.txt
```

##### Step 2: Restore from Backup
```bash
# Get latest backup
LATEST_BACKUP=$(ls -t /storage/backups/object_store/ | head -1)

# Restore object store
./scripts/restore_object_store.sh $LATEST_BACKUP
```

##### Step 3: Verify Recovery
```bash
# Verify object count
find /storage/objects/ -type f | wc -l

# Verify checksums
find /storage/objects/ -type f -exec sha256sum {} \; > /tmp/verify_checksums.txt
sha256sum -c /tmp/verify_checksums.txt
```

##### Step 4: Rebuild Projections
```bash
# Rebuild all projections
./scripts/rebuild_all_projections.sh
```

---

### Scenario 2: Event Log Failure

#### Severity: HIGH
#### RPO: < 1 hour
#### RTO: < 4 hours

#### Detection
```bash
# Check event log health
ls -la /storage/events/
find /storage/events/ -type f | wc -l

# Verify sequence
python3 scripts/verify_event_sequence.py
```

#### Recovery Procedure

##### Step 1: Identify Failure Scope
```bash
# Check for sequence gaps
python3 scripts/detect_event_gaps.py

# Identify corrupted events
python3 scripts/detect_corrupted_events.py
```

##### Step 2: Restore from Backup
```bash
# Get latest backup
LATEST_BACKUP=$(ls -t /storage/backups/event_log/ | head -1)

# Restore event log
./scripts/restore_event_log.sh $LATEST_BACKUP
```

##### Step 3: Verify Recovery
```bash
# Verify event sequence
python3 scripts/verify_event_sequence.py

# Verify event count
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM events"
```

##### Step 4: Replay Events
```bash
# Replay from last good event
LAST_GOOD_EVENT=$(python3 scripts/get_last_good_event.py)
python3 scripts/replay_events.py --from-event $LAST_GOOD_EVENT
```

---

### Scenario 3: PostgreSQL Failure

#### Severity: HIGH
#### RPO: < 1 hour
#### RTO: < 2 hours

#### Detection
```bash
# Check PostgreSQL health
docker-compose exec postgres pg_isready -U brain_user

# Check database integrity
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM objects"
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM events"
```

#### Recovery Procedure

##### Step 1: Identify Failure Type
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres | tail -50
```

##### Step 2: Attempt Restart
```bash
# Restart PostgreSQL
docker-compose restart postgres

# Wait for recovery
docker-compose exec postgres pg_isready -U brain_user
```

##### Step 3: Restore from Backup if Restart Fails
```bash
# Get latest backup
LATEST_BACKUP=$(ls -t /storage/backups/postgres/ | head -1)

# Restore PostgreSQL
./scripts/restore_postgres.sh $LATEST_BACKUP
```

##### Step 4: Verify Recovery
```bash
# Verify database
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM objects"
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM events"
```

##### Step 5: Replay Events if Needed
```bash
# Replay from last good event
python3 scripts/replay_events.py
```

---

### Scenario 4: Complete Data Loss

#### Severity: CRITICAL
#### RPO: < 24 hours
#### RTO: < 24 hours

#### Detection
```bash
# Check all data locations
ls -la /storage/objects/
ls -la /storage/events/
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM objects"
```

#### Recovery Procedure

##### Step 1: Declare Disaster
```bash
# Notify stakeholders
# Activate disaster recovery team
# Initiate disaster recovery plan
```

##### Step 2: Download Latest Backup
```bash
# List available backups
aws s3 ls s3://brain-backups/

# Download latest backup
aws s3 cp s3://brain-backups/latest.tar.gz.enc /tmp/
```

##### Step 3: Decrypt Backup
```bash
# Decrypt using master key
python3 scripts/decrypt_backup.py /tmp/latest.tar.gz.enc
```

##### Step 4: Extract Backup
```bash
# Extract to temporary location
tar -xzf /tmp/latest.tar.gz -C /tmp/restore/
```

##### Step 5: Restore Object Store
```bash
# Restore object store
rsync -av /tmp/restore/objects/ /storage/objects/

# Verify checksums
find /storage/objects/ -type f -exec sha256sum {} \; > /tmp/verify_checksums.txt
sha256sum -c /tmp/verify_checksums.txt
```

##### Step 6: Restore Event Log
```bash
# Restore event log
rsync -av /tmp/restore/events/ /storage/events/

# Verify sequence
python3 scripts/verify_event_sequence.py
```

##### Step 7: Restore PostgreSQL
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Wait for database to be ready
docker-compose exec postgres pg_isready -U brain_user

# Restore database
gunzip -c /tmp/restore/postgres.sql.gz | docker-compose exec -T postgres psql -U brain_user brain_db
```

##### Step 8: Verify Recovery
```bash
# Verify object store
find /storage/objects/ -type f | wc -l

# Verify event log
find /storage/events/ -type f | wc -l

# Verify database
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM objects"
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM events"
```

##### Step 9: Rebuild Projections
```bash
# Rebuild all projections
./scripts/rebuild_all_projections.sh
```

##### Step 10: Start All Services
```bash
# Start all services
docker-compose up -d
```

---

### Scenario 5: Ransomware Attack

#### Severity: CRITICAL
#### RPO: Depends on last clean backup
#### RTO: < 48 hours

#### Detection
```bash
# Check for encrypted files
find /storage/ -name "*.encrypted"

# Check for ransom notes
find /storage/ -name "*ransom*"
find /storage/ -name "*README*"
```

#### Recovery Procedure

##### Step 1: Isolate Systems
```bash
# Stop all services immediately
docker-compose down

# Disconnect from network
# (Physical isolation recommended)
```

##### Step 2: Assess Damage
```bash
# Check which systems are affected
find /storage/ -name "*.encrypted"
find /storage/ -name "*.locked"

# Check for ransom notes
find /storage/ -type f -name "*ransom*" -o -name "*README*"
```

##### Step 3: Identify Last Clean Backup
```bash
# Check backup integrity
./scripts/verify_backup.sh /storage/warm/snapshots/2026-06-13

# If corrupted, check previous backup
./scripts/verify_backup.sh /storage/warm/snapshots/2026-06-12
```

##### Step 4: Wipe Compromised Systems
```bash
# Format affected storage
# (Consult security team before proceeding)

# Rebuild from scratch
docker-compose down -v
docker-compose up -d
```

##### Step 5: Restore from Clean Backup
```bash
# Follow complete data loss recovery procedure
# Using last clean backup identified in Step 3
```

##### Step 6: Scan for Malware
```bash
# Scan restored data
clamscan -r /storage/

# Scan for persistence mechanisms
# (Consult security team)
```

##### Step 7: Update Security Measures
```bash
# Rotate all credentials
./scripts/generate_secrets.py

# Rotate all encryption keys
./scripts/generate_keys.py

# Update firewall rules
# (Consult security team)
```

##### Step 8: Monitor for Recurrence
```bash
# Monitor for suspicious activity
tail -f /logs/security/audit.log

# Monitor for new encrypted files
find /storage/ -name "*.encrypted"
```

---

### Scenario 6: Complete Site Loss

#### Severity: CRITICAL
#### RPO: < 24 hours
#### RTO: < 24 hours

#### Detection
```bash
# Site unreachable
ping brain.example.com

# All services down
docker-compose ps
```

#### Recovery Procedure

##### Step 1: Declare Disaster
```bash
# Notify stakeholders
# Activate disaster recovery team
# Initiate disaster recovery plan
```

##### Step 2: Provision New Infrastructure
```bash
# Deploy to new location
# (Could be cloud provider, DR site, etc.)
```

##### Step 3: Restore from Cold Backup
```bash
# Download latest cold backup
aws s3 cp s3://brain-backups/latest.tar.gz.enc /tmp/

# Decrypt and extract
python3 scripts/decrypt_backup.py /tmp/latest.tar.gz.enc
tar -xzf /tmp/latest.tar.gz -C /tmp/restore/
```

##### Step 4: Deploy Services
```bash
# Deploy to new infrastructure
docker-compose up -d
```

##### Step 5: Restore Data
```bash
# Follow complete data loss recovery procedure
```

##### Step 6: Update DNS
```bash
# Update DNS to point to new location
# (Consult network team)
```

##### Step 7: Verify
```bash
# Verify all services are running
docker-compose ps

# Verify data integrity
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM objects"
```

##### Step 8: Notify Users
```bash
# Notify users of recovery
# Provide estimated time of full recovery
# Communicate any data loss
```

---

## Post-Recovery Verification

### Database Verification
```bash
# Verify object count
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM objects"

# Verify event count
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM events"

# Verify data integrity
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM objects WHERE content_hash IS NULL"
```

### Object Store Verification
```bash
# Verify object count
find /storage/objects/ -type f | wc -l

# Verify checksums
find /storage/objects/ -type f -exec sha256sum {} \; > /tmp/current_checksums.txt
diff /tmp/current_checksums.txt /storage/objects/checksums.txt
```

### Event Log Verification
```bash
# Verify event sequence
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT event_id, timestamp FROM events ORDER BY timestamp LIMIT 10"

# Verify no gaps
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM events"
```

### Service Verification
```bash
# Verify all services are running
docker-compose ps

# Verify service health
docker-compose exec postgres pg_isready -U brain_user
docker-compose exec qdrant curl -f http://localhost:6333/health
docker-compose exec neo4j curl -f http://localhost:7474
```

---

## Recovery Testing

### Monthly Testing
```bash
# Schedule monthly recovery test
# Test restore from latest backup
# Document test results
# Update procedures if needed
```

### Quarterly Testing
```bash
# Schedule quarterly full disaster recovery test
# Test complete site recovery
# Document test results
# Update procedures if needed
```

### Annual Testing
```bash
# Schedule annual full disaster recovery drill
# Test all recovery procedures
# Document test results
# Update procedures if needed
```

---

## Communication Plan

### Internal Communication
- Notify stakeholders immediately
- Provide regular updates
- Communicate estimated recovery time
- Document lessons learned

### External Communication
- Notify users if service is affected
- Provide estimated recovery time
- Communicate any data loss
- Provide post-incident report

---

## Post-Incident Review

### Review Items
- Root cause analysis
- Timeline of events
- Effectiveness of response
- Areas for improvement
- Updated procedures

### Documentation Updates
- Update recovery procedures
- Update contact information
- Update infrastructure diagrams
- Update runbooks
